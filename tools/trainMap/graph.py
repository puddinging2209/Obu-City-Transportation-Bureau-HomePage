"""
路線データ + 分岐/合流ノード + 駅スナップから、経路探索用のグラフを構築する。

ノードの種類:
 - "J{i}"          : 分岐/合流ノード(複数路線が接続する地点)
 - "ST_{sid}@{ln}" : 駅sidが路線lnの上でスナップされた地点(路線ごとに別ノード)
 - "END_{ln}_{0|1}": 他路線と接続しない、路線lnの端点(行き止まり)

エッジ: 同一路線上で隣接する2つのカット点の間。line名・区間比率(from_ratio,to_ratio)・
物理距離(重み)を持つ。両方向に通行可能(逆走可)。
"""
from collections import defaultdict

from geo import dist

STATION_PARALLEL_EXCLUDE_M = 300.0  # 投影点が路線の内側(沿線/並行)の場合の除外距離しきい値
STATION_EDGE_EXCLUDE_M = 100.0       # 投影点が路線の本当の始端/終端の場合の除外距離しきい値
LOOP_CLOSURE_EPS_M = 20.0           # 路線の始点と終点がこの距離以内なら「環状線」とみなす


class Graph:
    def __init__(self):
        # adjacency: node_id -> list of edge dicts
        # edge dict: {to, line, from_ratio, to_ratio, weight}
        # from_ratio/to_ratio は「この辺をこの向きに進むときの」路線上のratio(進行方向にfrom->to)
        self.adj = defaultdict(list)
        self.node_xy = {}

    def add_edge(self, u, v, line, ru, rv, weight, xy_u=None, xy_v=None):
        self.adj[u].append({"to": v, "line": line, "from_ratio": ru, "to_ratio": rv, "weight": weight})
        self.adj[v].append({"to": u, "line": line, "from_ratio": rv, "to_ratio": ru, "weight": weight})
        if xy_u is not None:
            self.node_xy[u] = xy_u
        if xy_v is not None:
            self.node_xy[v] = xy_v


def is_loop_line(line):
    """
    路線の始点と終点が(ほぼ)同じ地点にあるか=環状線かどうかを判定する。
    """
    return dist(line.xy[0], line.xy[-1]) <= LOOP_CLOSURE_EPS_M


def build_full_graph(lines, junction_nodes, stations, extra_station_routes=None):
    """
    lines: {name: LineShapeData}
    junction_nodes: [{"lines": {line_name: ratio, ...}, "xy": (x,y)}, ...]  (build_graph.build_junction_nodesの出力)
    stations: {station_id: {"lat":..,"lng":..,"routes":[line_name,...], ...}}
    extra_station_routes: {station_id: {line_name, ...}}  省略可。
        stations.jsonのroutesには記載されていないが、trains.jsonのlineNameとして
        実際に使われている(路線,駅)組み合わせを追加でスナップ対象にするための補完情報。
        (例: 急行線と各停線が同じ駅を通るのに、駅側のroutesには急行線側しか
        書かれていない、といったメタデータの抜け漏れに対応するため)

    戻り値: (Graph, station_node_map, junction_node_ids, excluded)
      station_node_map: {station_id: {line_name: node_id}}  駅がスナップされた各路線上のノードid
      excluded: [(station_id, line_name, distance, is_edge), ...] 除外基準により無視されたroutes記載
    """
    extra_station_routes = extra_station_routes or {}
    g = Graph()

    # --- ノードID割当: 分岐/合流ノード ---
    junction_ids = []
    line_cutpoints = defaultdict(dict)  # line_name -> {ratio: node_id}  (ratioは丸めて重複排除)

    def add_cutpoint(line_name, ratio, node_id):
        """
        カット点を登録する。既に(ほぼ)同じratioのカット点が存在する場合は、
        新規ノードを追加せず既存のノードidを返す(重複ノードがグラフの辺に
        繋がらない孤立ノードになってしまうのを防ぐため)。
        環状線の場合、ratio=1.0はratio=0.0と物理的に同じ地点なので、0.0に正規化する
        (そうしないと継ぎ目に2つの別ノードができてしまい、環状線を一周する経路が
        正しく繋がらない)。
        戻り値: 実際にこのratio位置で使われるノードid(新規 or 既存)
        """
        if is_loop_line(lines[line_name]) and abs(ratio - 1.0) < 1e-6:
            ratio = 0.0
        cps = line_cutpoints[line_name]
        for r0, nid in cps.items():
            if abs(r0 - ratio) < 1e-6:
                return nid
        cps[ratio] = node_id
        return node_id

    for i, jn in enumerate(junction_nodes):
        node_id = f"J{i}"
        junction_ids.append(node_id)
        g.node_xy[node_id] = jn["xy"]
        for line_name, ratio in jn["lines"].items():
            add_cutpoint(line_name, ratio, node_id)

    # --- ノードID割当: 駅スナップ ---
    # 駅のroutesに記載された各路線について、実際にその路線の近くにあるかを確認する。
    # 除外基準: 路線沿い(並行、投影点が路線の内側)の場合は300m以上離れていたら除外、
    #          端(投影点が路線の本当の始端/終端)の場合は30m以上離れていたら除外。
    station_node_map = defaultdict(dict)
    excluded = []  # デバッグ表示用: (station_id, line_name, distance, is_edge)
    for sid, sdata in stations.items():
        lat, lng = sdata["lat"], sdata["lng"]
        route_names = list(dict.fromkeys(
            list(sdata.get("routes", [])) + list(extra_station_routes.get(sid, []))
        ))
        for line_name in route_names:
            if line_name not in lines:
                continue
            line = lines[line_name]
            projector = line.projector
            xy_point = projector.to_xy(lat, lng)
            d, ratio, proj_xy, is_edge = line.project_point(xy_point)
            threshold = STATION_EDGE_EXCLUDE_M if is_edge else STATION_PARALLEL_EXCLUDE_M
            if d > threshold:
                excluded.append((sid, line_name, d, is_edge))
                continue
            node_id = f"ST_{sid}@{line_name}"
            g.node_xy[node_id] = proj_xy
            actual_node_id = add_cutpoint(line_name, ratio, node_id)
            # add_cutpointが既存ノード(分岐/合流ノード等)を返した場合はそちらを使う。
            # そうしないと、駅のスナップ位置が既存カット点とちょうど一致した際に、
            # 新規ノードがどの辺にも繋がらない孤立ノードになってしまう。
            station_node_map[sid][line_name] = actual_node_id

    # --- 各路線の端点(行き止まり)もカット点として登録 ---
    # ただし環状線(始点と終点が同じ地点)は「行き止まり」ではないので登録しない。
    # 環状線の継ぎ目は後段でwrap-aroundエッジとして繋ぐ。
    for line_name, line in lines.items():
        if is_loop_line(line):
            continue
        cps = line_cutpoints[line_name]
        if not any(abs(r - 0.0) < 1e-6 for r in cps):
            nid = f"END_{line_name}_0"
            g.node_xy[nid] = line.xy[0]
            cps[0.0] = nid
        if not any(abs(r - 1.0) < 1e-6 for r in cps):
            nid = f"END_{line_name}_1"
            g.node_xy[nid] = line.xy[-1]
            cps[1.0] = nid

    # --- 各路線内でカット点をratio順に並べ、隣接ペアをエッジ化 ---
    for line_name, cps in line_cutpoints.items():
        line = lines[line_name]
        ordered = sorted(cps.items(), key=lambda kv: kv[0])
        for i in range(len(ordered) - 1):
            r_a, node_a = ordered[i]
            r_b, node_b = ordered[i + 1]
            if r_b - r_a < 1e-9:
                continue
            weight = line.ratio_range_distance(r_a, r_b)
            g.add_edge(node_a, node_b, line_name, r_a, r_b, weight)

        # 環状線は始点(ratio=0)と終点(ratio=1)が同じ地点なので、
        # ソート済みリストの最後のカット点から最初のカット点へ、継ぎ目を跨ぐ
        # wrap-aroundの経路を追加する。これが無いと「短い側から回る」経路が
        # 一切選べず、常に一周近くの遠回りになってしまう(または経路によっては
        # 見つからなくなる)。
        # (add_cutpointでratio=1.0は既に0.0に正規化されているので、
        #  ordered[0]のratioが0.0に近ければ、そのノード自体が継ぎ目そのもの)
        if is_loop_line(line) and len(ordered) >= 2:
            r_last, node_last = ordered[-1]
            r_first, node_first = ordered[0]
            if r_first < 1e-9:
                # 継ぎ目にちょうどノードがある(駅や分岐点)ので、それに直接繋ぐ。
                # to_ratio=1.0はnode_firstの実際の位置(ratio 0.0=1.0)を表す。
                wrap_weight = line.ratio_range_distance(r_last, 1.0)
                if wrap_weight > 1e-9:
                    g.add_edge(node_last, node_first, line_name, r_last, 1.0, wrap_weight)
            else:
                # 継ぎ目に何もないので、仮想の継ぎ目ノードを1つ挟んで両側を繋ぐ。
                # 出力される各セグメントのratioが常に[0,1]に収まるようにするため
                # (1つのエッジでratio>1.0を扱うと出力フォーマットの前提を壊すため)。
                seam_node = f"LOOPSEAM_{line_name}"
                g.node_xy[seam_node] = line.xy[0]
                dist_to_seam = line.ratio_range_distance(r_last, 1.0)
                dist_from_seam = line.ratio_range_distance(0.0, r_first)
                g.add_edge(node_last, seam_node, line_name, r_last, 1.0, dist_to_seam)
                g.add_edge(seam_node, node_first, line_name, 0.0, r_first, dist_from_seam)

    return g, station_node_map, junction_ids, excluded
