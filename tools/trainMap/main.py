import json
import sys
import time
from collections import defaultdict

from build_graph import load_lines, build_junction_nodes
from graph import build_full_graph
from route import compute_train_route, dedup_routes, RouteNotFound

MAX_LINES_PER_LEG = 4  # 隣接駅間で経由する路線数の上限(調整可能)


def collect_extra_station_routes(trains, stations):
    """
    trains.jsonの各stopが持つ"lineName"のうち、stations.jsonのroutesに
    記載されていない(station,line)組み合わせを集める。
    (急行線と各停線が同じ駅を通るのに、駅側のroutesには一部しか
    書かれていない、といった実データのメタデータ抜け漏れに対応するため)
    """
    extra = defaultdict(set)
    for train in trains:
        for stop in train["stops"]:
            sid = stop.get("id")
            line_name = stop.get("lineName")
            if sid is None or line_name is None:
                continue
            official = stations.get(sid, {}).get("routes", [])
            if line_name not in official:
                extra[sid].add(line_name)
    return extra


def main(data_dir="test_data", out_path="output/routes.json", verbose=True):
    t_start = time.time()
    with open(f"{data_dir}/lineShape.json", encoding="utf-8") as f:
        line_shape_json = json.load(f)
    with open(f"{data_dir}/stations.json", encoding="utf-8") as f:
        stations = json.load(f)
    with open(f"{data_dir}/trains.json", encoding="utf-8") as f:
        trains = json.load(f)

    lines, projector = load_lines(line_shape_json)

    if verbose:
        print(f"[入力] 路線数={len(lines)}, 駅数={len(stations)}, 列車数={len(trains)}")

    junction_nodes = build_junction_nodes(lines)
    if verbose:
        print(f"検出された分岐/合流ノード: {len(junction_nodes)}件 ({time.time()-t_start:.1f}s経過)")
        for i, jn in enumerate(junction_nodes):
            lat, lng = projector.to_latlng(*jn["xy"])
            lines_str = ", ".join(f"{ln}@{r:.4f}" for ln, r in jn["lines"].items())
            print(f"  J{i}: ({lat:.5f},{lng:.5f})  {lines_str}")

    extra_station_routes = collect_extra_station_routes(trains, stations)
    graph, station_node_map, junction_ids, excluded = build_full_graph(
        lines, junction_nodes, stations, extra_station_routes=extra_station_routes
    )

    if verbose:
        print(f"\nグラフノード数: {len(graph.node_xy)}, 駅ノード: {sum(len(v) for v in station_node_map.values())}")
        if extra_station_routes:
            n_pairs = sum(len(v) for v in extra_station_routes.values())
            print(f"trains.jsonのlineNameから補完した(駅,路線)組み合わせ: {n_pairs}件"
                  f"(stations.jsonのroutesに無かったもの)")
        if excluded:
            print(f"\n除外された駅所属路線: {len(excluded)}件(距離基準を超えたためそのroutesを無視)")
            for sid, line_name, d, is_edge in excluded:
                kind = "端(始端/終端)" if is_edge else "沿線(並行)"
                print(f"  station={sid} route={line_name} distance={d:.1f}m 種別={kind}")

    train_routes = {}
    errors = {}
    n = len(trains)
    for i, train in enumerate(trains):
        number = train["number"]
        stops = train["stops"]
        try:
            route = compute_train_route(graph, station_node_map, stops, max_lines=MAX_LINES_PER_LEG)
            train_routes[number] = route
        except RouteNotFound as e:
            errors[number] = str(e) or "経路が見つかりません(路線数上限を超えている可能性があります)"
        if verbose and n > 200 and (i + 1) % 1000 == 0:
            print(f"  ...経路計算 {i + 1}/{n} 件処理済み ({time.time()-t_start:.1f}s経過)")

    routes_out, trains_out = dedup_routes(train_routes)

    output = {"routes": routes_out, "trains": trains_out}
    if errors:
        output["errors"] = errors

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    if verbose:
        print(f"\n=== 結果概要 ({time.time()-t_start:.1f}s経過) ===")
        print(f"経路計算に成功した列車数: {len(train_routes)}/{len(trains)}")
        print(f"重複排除後のユニーク経路数: {len(routes_out)}")
        if errors:
            print(f"エラーとなった列車数: {len(errors)}")
            for num, msg in list(errors.items())[:10]:
                print(f"  train={num}: {msg}")
            if len(errors) > 10:
                print(f"  ...ほか{len(errors) - 10}件")
        if n <= 200:
            print(f"\n=== 出力 ({out_path}) ===")
            print(json.dumps(output, ensure_ascii=False, indent=2))
        else:
            print(f"\n出力先: {out_path} (件数が多いため全文表示は省略)")

    return output


if __name__ == "__main__":
    data_dir = sys.argv[1] if len(sys.argv) > 1 else "test_data"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "output/routes.json"
    main(data_dir, out_path)
