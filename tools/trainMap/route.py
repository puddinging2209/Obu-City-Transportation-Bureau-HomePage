"""
駅間の最短経路探索(使用路線数の上限つき)と、列車ごとの経路の結合・重複排除を行う。
"""
import heapq
import json

# 路線を切り替えるたびに加える「乗り移りペナルティ」(m相当)。
# 並走区間などで、ごくわずかな距離短縮のためだけに別路線へ一瞬乗り移ってすぐ戻る、
# といった不自然な挙動を抑制するために導入している。切り替えても十分な距離短縮が
# 見込める場合(このペナルティを上回る短縮がある場合)は、これまで通り切り替える。
LINE_SWITCH_PENALTY_M = 100.0


class RouteNotFound(Exception):
    pass


def shortest_path_between(graph, sources, targets, max_lines=4, switch_penalty=LINE_SWITCH_PENALTY_M):
    """
    sources: [node_id, ...]  (出発候補ノード。複数路線に属す駅ならその全ノード)
    targets: [node_id, ...]  (到着候補ノード)
    max_lines: この区間で許容する使用路線数の上限
    switch_penalty: 路線を切り替えるたびに加算する仮想距離(m)。0にすると純粋な最短距離になる。

    状態 = (node, current_line, distinct_line_count)
    ※ 「一度離れた路線には戻らない」という前提の簡略化(distinct_line_countは通過路線の"切替回数+1"として扱う)

    戻り値: (total_distance, edge_list, end_node)
      edge_list: [{"line":..., "from_ratio":..., "to_ratio":..., "weight":...}, ...] 実際に通った向きで格納
      total_distanceにはswitch_penaltyが加算されている場合があるため、実際の物理距離は
      edge_list内の"weight"の合計を使うこと。
    """
    # dist[(node,line,count)] = 最短コスト(switch_penalty込み)
    dist_map = {}
    # prev[(node,line,count)] = (prev_state, edge_used) or None
    prev = {}
    heap = []

    for s in sources:
        if s not in graph.adj and s not in graph.node_xy:
            continue
        state = (s, None, 0)
        dist_map[state] = 0.0
        prev[state] = None
        heapq.heappush(heap, (0.0, state))

    target_set = set(targets)
    best_end_state = None
    best_end_dist = float("inf")

    visited = set()
    while heap:
        d, state = heapq.heappop(heap)
        if state in visited:
            continue
        visited.add(state)
        node, cur_line, count = state

        if node in target_set and d < best_end_dist:
            best_end_dist = d
            best_end_state = state
            # 最初に到達した最短のものを採用(targetに着いたら以後その状態は展開不要)
            break

        if d > dist_map.get(state, float("inf")):
            continue

        for edge in graph.adj.get(node, []):
            nxt_node = edge["to"]
            line = edge["line"]
            if cur_line is None:
                new_count = 1
                penalty = 0.0
            elif line == cur_line:
                new_count = count
                penalty = 0.0
            else:
                new_count = count + 1
                penalty = switch_penalty
            if new_count > max_lines:
                continue
            nd = d + edge["weight"] + penalty
            nstate = (nxt_node, line, new_count)
            if nd < dist_map.get(nstate, float("inf")):
                dist_map[nstate] = nd
                prev[nstate] = (state, edge)
                heapq.heappush(heap, (nd, nstate))

    if best_end_state is None:
        raise RouteNotFound()

    # 経路復元
    edges = []
    s = best_end_state
    while prev[s] is not None:
        pstate, edge = prev[s]
        edges.append(edge)
        s = pstate
    edges.reverse()
    return best_end_dist, edges, best_end_state[0]


def merge_edges_to_route(edges):
    """
    連続する同一路線・同一方向のエッジを1つのroute segmentにまとめる。
    戻り値: [{"line":..., "from":.., "to":.., "length":..}, ...]
    """
    segments = []
    for edge in edges:
        line = edge["line"]
        fr = edge["from_ratio"]
        to = edge["to_ratio"]
        length = edge["weight"]
        if segments and segments[-1]["line"] == line:
            last = segments[-1]
            # 連続しているか(直前のtoと今回のfromが一致)かつ同方向か
            same_direction = (last["to"] - last["from"]) * (to - fr) >= 0 if (to != fr) else True
            if abs(last["to"] - fr) < 1e-9 and same_direction:
                last["to"] = to
                last["length"] += length
                continue
        segments.append({"line": line, "from": fr, "to": to, "length": length})
    return segments


def _candidates_for_stop(station_node_map, stop):
    """
    駅の候補ノードを決める。
    stopの"lineName"は元のダイヤファイルの路線名であり、直通運転などメインでない
    路線が反映されていないなど、あまり信頼できないため、経路探索の候補を絞り込む
    のには使わない。駅が属す全路線のノードを候補として、常に全パターンをDPで評価する。
    """
    sid = stop["id"]
    candidates_by_line = station_node_map.get(sid, {})
    return list(candidates_by_line.values())


def compute_train_route(graph, station_node_map, stops, max_lines=4):
    """
    stops: [{"id": station_id, "stopType": "stop"|"pass", ...}, ...]

    駅が複数路線に属している場合、その駅でどの路線のノードを使うかによって
    前後の駅との繋がりやすさ(距離)が変わりうる。そのため、各駅のノード候補
    (所属路線ごとのノードインスタンス)の組み合わせを全パターン考慮し、
    始発から終着までの総コスト(距離+路線切り替えペナルティ)が最小になる
    組み合わせを動的計画法(DP)で求める。
    (区間ごとの制約 max_lines は各レグ<隣接する駅ペア>ごとに個別に適用される)

    戻り値: 停車駅(stopType=="stop")ごとに分割されたroute segmentのリストのリスト。
      [[{"line","from","to","length"}, ...], [{...}, ...], ...]
      1つ目の配列が「始発→最初の停車駅」、2つ目が「最初の停車駅→次の停車駅」、
      ...、最後が「最後から2番目の停車駅→終点」に対応する。
      (通過駅<stopType=="pass">は区切りには使われず、直前の区間に含まれる)
    """
    if len(stops) < 2:
        return []

    for s in stops:
        if s["id"] not in station_node_map or not station_node_map[s["id"]]:
            raise RouteNotFound(f"駅ノードが見つかりません: {s['id']}")

    # dp_stages[i] : {node_id: {"dist": 総コスト, "prev": 前段のnode_id, "edges": このレグで使ったedge列}}
    first_candidates = _candidates_for_stop(station_node_map, stops[0])
    dp_stages = [{node: {"dist": 0.0, "prev": None, "edges": []} for node in first_candidates}]

    for i in range(1, len(stops)):
        prev_candidates = dp_stages[-1]
        next_candidates = _candidates_for_stop(station_node_map, stops[i])
        new_stage = {}
        for c_next in next_candidates:
            best_dist = float("inf")
            best_prev = None
            best_edges = None
            for c_prev, info in prev_candidates.items():
                try:
                    leg_dist, leg_edges, end_node = shortest_path_between(
                        graph, [c_prev], [c_next], max_lines=max_lines
                    )
                except RouteNotFound:
                    continue
                total = info["dist"] + leg_dist
                if total < best_dist:
                    best_dist = total
                    best_prev = c_prev
                    best_edges = leg_edges
            if best_prev is not None:
                new_stage[c_next] = {"dist": best_dist, "prev": best_prev, "edges": best_edges}
        if not new_stage:
            raise RouteNotFound(
                f"駅 {stops[i - 1]['id']} -> {stops[i]['id']} の間で、"
                f"所属路線のどの組み合わせでも経路が見つかりません(max_lines={max_lines}を確認してください)"
            )
        dp_stages.append(new_stage)

    # 最終段で最小コストのノードを選び、逆順にたどって「レグごと」のedge列を復元する
    final_stage = dp_stages[-1]
    best_final_node = min(final_stage.items(), key=lambda kv: kv[1]["dist"])[0]

    # leg_edges_list[j] = stops[j] -> stops[j+1] のレグで使ったedge列
    leg_edges_list = [None] * (len(stops) - 1)
    stage_idx = len(dp_stages) - 1
    cur_node = best_final_node
    while stage_idx > 0:
        info = dp_stages[stage_idx][cur_node]
        leg_edges_list[stage_idx - 1] = info["edges"]
        cur_node = info["prev"]
        stage_idx -= 1

    # 停車駅(stopType=="stop")ごとに分割する。始発と終点は常に区切りとする。
    boundaries = {0, len(stops) - 1}
    for i in range(1, len(stops) - 1):
        if stops[i].get("stopType") == "stop":
            boundaries.add(i)
    boundaries = sorted(boundaries)

    result = []
    for bi in range(len(boundaries) - 1):
        start_idx = boundaries[bi]
        end_idx = boundaries[bi + 1]
        edges_concat = []
        for leg_i in range(start_idx, end_idx):
            edges_concat.extend(leg_edges_list[leg_i])
        result.append(merge_edges_to_route(edges_concat))

    return result


def dedup_routes(train_routes):
    """
    train_routes: {train_number: [[{"line","from","to","length"}, ...], [...], ...]}
      (停車駅ごとに分割されたセグメント列のリスト)
    戻り値: (routes_dict, trains_dict)  仕様の出力フォーマットに合わせたuniqueId連番付き
      routes_dict: {"id": [[{...}, ...], [{...}, ...], ...]}
    """
    def canonical_key(route):
        return json.dumps(route, sort_keys=True)

    key_to_id = {}
    routes_out = {}
    trains_out = {}
    next_id = 1

    for train_number, route in train_routes.items():
        key = canonical_key(route)
        if key not in key_to_id:
            uid = str(next_id)
            next_id += 1
            key_to_id[key] = uid
            routes_out[uid] = route
        trains_out[train_number] = key_to_id[key]

    return routes_out, trains_out
