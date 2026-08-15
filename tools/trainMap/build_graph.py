"""
lineShape.json から路線グラフを構築する。

処理の流れ:
 1. 各路線を xy 平面に投影し、頂点間の累積距離から総延長を求める。
 2. 各路線を一定間隔(RESAMPLE_STEP_M)で再サンプリングし、(x,y,ratio,angle) の点列を作る。
 3. 路線ペアごとに、
    - 端点が途切れている場合: その端点からENDPOINT_GAP_THRESHOLD_M(既定30m)以内にある
      他路線"すべて"に接続する(最も近い1本だけに限定しない。角度は問わない)。
    - 連続して近接している区間(長さ>=MIN_OVERLAP_RUN_M、既定100m)があり、かつ区間中間点で
      2路線がほぼ平行(角度差<=ANGLE_THRESHOLD_DEG) -> 並走区間の開始/終了点を分岐/合流点とする。
      (単発の交差点はrunの長さが短いため、または直交していれば除外される -> 転線不可の交差)
 4. 検出した接続点を近接クラスタリングしてノード化する。
 5. 各路線を「カット点(ノード + 駅位置 + 端点)」で分割し、隣接カット点間を辺とするグラフを作る。
"""
import math
from collections import defaultdict
import numpy as np
from scipy.spatial import cKDTree

from geo import Projector, dist, point_segment_projection, angle_of, acute_angle_diff

# ---- 調整可能パラメータ ----
OVERLAP_PROXIMITY_M = 20.0   # 並走判定で「近接している」とみなす距離(この距離以内が連続していれば並走区間候補)
MIN_OVERLAP_RUN_M = 100.0    # 並走区間とみなす最小の連続近接距離(これ未満は単発交差とみなし無視)
ANGLE_THRESHOLD_DEG = 30.0   # 並走区間候補が本当に並走(ほぼ平行)かを判定する角度差の上限
ENDPOINT_GAP_THRESHOLD_M = 30.0  # 線が途切れている場合、端点から他路線への接続とみなす最大距離
                                  # (複数候補がある場合は最短のものに接続する。角度は問わない)
RESAMPLE_STEP_M = 2.0        # 路線再サンプリング間隔(m)
NODE_CLUSTER_EPS_M = 30.0    # 検出した接続点候補を同一ノードにまとめる距離(ENDPOINT_GAP_THRESHOLD_Mと同程度にして、
                              # 端点が複数路線に多重接続する場合でも同じ結節点として確実にまとまるようにする)
LOOP_CLOSURE_EPS_M = 20.0    # 路線の始点と終点がこの距離以内なら「環状線」とみなす(graph.pyと同じ基準)
# -----------------------------


class LineShapeData:
    def __init__(self, name, vertices_latlng, projector):
        self.name = name
        self.projector = projector
        self.raw = vertices_latlng  # [(lat,lng,ratio), ...] as given
        self.xy = [projector.to_xy(v[0], v[1]) for v in vertices_latlng]
        self.ratios = [v[2] for v in vertices_latlng]
        # 累積距離(xy平面上)から総延長を算出
        cum = [0.0]
        for i in range(1, len(self.xy)):
            cum.append(cum[-1] + dist(self.xy[i - 1], self.xy[i]))
        self.cum_dist = cum
        self.total_length = cum[-1] if cum[-1] > 0 else 1e-9

    def ratio_to_xy(self, ratio):
        """ratio(0-1)からxy座標を線形補間して求める(頂点のratioに基づく)"""
        r = max(0.0, min(1.0, ratio))
        rs = self.ratios
        if r <= rs[0]:
            return self.xy[0]
        if r >= rs[-1]:
            return self.xy[-1]
        # 二分探索でも良いが頂点数は多くない前提で線形探索
        for i in range(1, len(rs)):
            if rs[i] >= r:
                r0, r1 = rs[i - 1], rs[i]
                if r1 == r0:
                    return self.xy[i]
                t = (r - r0) / (r1 - r0)
                x0, y0 = self.xy[i - 1]
                x1, y1 = self.xy[i]
                return (x0 + t * (x1 - x0), y0 + t * (y1 - y0))
        return self.xy[-1]

    def ratio_to_dist(self, ratio):
        return ratio * self.total_length

    def ratio_range_distance(self, r_a, r_b):
        """
        同じ路線上の2つのratio位置(ファイルのratio基準)の間の実際の物理距離(m)を、
        頂点間の直線距離の積み上げ(cum_dist)から正確に計算する。
        (単純に |r_b - r_a| * total_length で近似すると、カーブが多く頂点間隔が
        粗い区間では実際の距離と大きくズレることがあるため、頂点ごとの実距離を
        積み上げて正確に計算する)
        """
        ra = max(0.0, min(1.0, r_a))
        rb = max(0.0, min(1.0, r_b))
        if ra > rb:
            ra, rb = rb, ra

        def dist_at_ratio(r):
            rs = self.ratios
            if r <= rs[0]:
                return self.cum_dist[0]
            if r >= rs[-1]:
                return self.cum_dist[-1]
            for i in range(1, len(rs)):
                if rs[i] >= r:
                    r0, r1 = rs[i - 1], rs[i]
                    if r1 == r0:
                        return self.cum_dist[i]
                    t = (r - r0) / (r1 - r0)
                    return self.cum_dist[i - 1] + t * (self.cum_dist[i] - self.cum_dist[i - 1])
            return self.cum_dist[-1]

        return dist_at_ratio(rb) - dist_at_ratio(ra)

    def project_point(self, xy_point):
        """
        任意の点からこの路線への最短距離・最近ratioを求める(駅スナップ用)。
        戻り値: (distance, ratio, xy, is_edge)
          is_edge: 最近点が路線の"本当の"始端(ratio=0)または終端(ratio=1)である場合True。
                   (途中の頂点で経路的にたまたまクランプされただけの場合はFalse=「沿線」扱い)

        注意: ratioは必ずファイルの頂点ratio(self.ratios)を用いて線形補間する。
        (cum_dist<直線距離の積み上げ>から独自にratioを算出すると、ratio_to_xy等が
        前提とするファイルのratio基準とスケールがずれてしまい、駅の位置と
        算出されたratioが指す実際の座標が食い違うという重大な不整合を起こすため)
        """
        best = None
        n_seg = len(self.xy) - 1
        for i in range(1, len(self.xy)):
            t, proj, d = point_segment_projection(xy_point, self.xy[i - 1], self.xy[i])
            r0, r1 = self.ratios[i - 1], self.ratios[i]
            ratio = r0 + t * (r1 - r0)
            is_edge = (i == 1 and t <= 0.0) or (i == n_seg and t >= 1.0)
            if best is None or d < best[0]:
                best = (d, ratio, proj, is_edge)
        return best  # (distance, ratio, xy, is_edge)

    def resample(self, step=RESAMPLE_STEP_M):
        """一定間隔で再サンプリングし、(x,y,ratio,angle) のリストを返す"""
        n = max(2, int(self.total_length / step) + 1)
        samples = []
        for i in range(n):
            ratio = i / (n - 1)
            xy = self.ratio_to_xy(ratio)
            samples.append({"ratio": ratio, "xy": xy})
        # 接線角度(前後の点から推定)
        for i in range(len(samples)):
            if i == 0:
                a, b = samples[0]["xy"], samples[1]["xy"]
            elif i == len(samples) - 1:
                a, b = samples[-2]["xy"], samples[-1]["xy"]
            else:
                a, b = samples[i - 1]["xy"], samples[i + 1]["xy"]
            samples[i]["angle"] = angle_of(a, b)
        return samples


def load_lines(line_shape_json):
    all_latlng = []
    for name, verts in line_shape_json.items():
        for v in verts:
            all_latlng.append((v[0], v[1]))
    projector = Projector(
        sum(p[0] for p in all_latlng) / len(all_latlng),
        sum(p[1] for p in all_latlng) / len(all_latlng),
    )
    lines = {}
    for name, verts in line_shape_json.items():
        lines[name] = LineShapeData(name, verts, projector)
    return lines, projector


def detect_connections(lines):
    """
    路線間の分岐/合流点候補を検出する。
    戻り値: [{"touches": [(line_name, ratio), ...], "xy": (x,y)}, ...]
    (この時点ではノード化<クラスタリング>前の生の候補点)
    """
    names = list(lines.keys())
    resampled = {name: lines[name].resample() for name in names}
    trees = {}
    for name in names:
        pts = np.array([s["xy"] for s in resampled[name]])
        trees[name] = (cKDTree(pts), pts)

    raw_touches = []  # list of dicts

    # --- (a) 並走区間(overlap run)の検出 ---
    # 同じ路線ペアを両方向から重複計算すると、サンプリング誤差でわずかにずれた
    # ほぼ同一の接続点が2つ検出されクラスタリングで統合できないことがあるため、
    # 順不同ペア(i<j)につき1方向のみ計算する。
    for i, a_name in enumerate(names):
        for b_name in names[i + 1:]:
            a_samples = resampled[a_name]
            b_tree, b_pts = trees[b_name]
            a_pts = np.array([s["xy"] for s in a_samples])
            d, idx = b_tree.query(a_pts)
            close = d <= OVERLAP_PROXIMITY_M

            # 連続run抽出
            run_start = None
            for k in range(len(close)):
                if close[k] and run_start is None:
                    run_start = k
                if (not close[k] or k == len(close) - 1) and run_start is not None:
                    run_end = k if not close[k] else k
                    # runの物理長
                    run_len_m = (a_samples[run_end]["ratio"] - a_samples[run_start]["ratio"]) * lines[a_name].total_length
                    if run_len_m >= MIN_OVERLAP_RUN_M:
                        # 直交する交差(distanceが短区間だけ閾値内に入るケース)を除外するため、
                        # run中間点で2路線の接線がほぼ平行(角度差<=閾値)かどうかを確認する。
                        # (runの境界そのものでは分岐/合流角がついている場合があるため境界では判定しない)
                        mid = (run_start + run_end) // 2
                        b_idx_mid = idx[mid]
                        ang_a_mid = a_samples[mid]["angle"]
                        ang_b_mid = resampled[b_name][b_idx_mid]["angle"]
                        if acute_angle_diff(ang_a_mid, ang_b_mid) <= ANGLE_THRESHOLD_DEG:
                            for k2 in (run_start, run_end):
                                b_idx = idx[k2]
                                xy = a_samples[k2]["xy"]
                                raw_touches.append({
                                    "touches": [(a_name, a_samples[k2]["ratio"]),
                                                (b_name, resampled[b_name][b_idx]["ratio"])],
                                    "xy": xy,
                                })
                    run_start = None

    # --- (b) 端点が途切れているケース(分岐の始発/終端) ---
    # 途切れている側の端点から、ENDPOINT_GAP_THRESHOLD_M以内にある他路線"すべて"に接続する
    # (最も近い1本だけに限定しない。角度は問わない)。
    # これにより、「Aの端点がほぼそのままBに繋がっており、かつ同じ地点で別の路線Cも
    # 分岐/合流している」といった複合的な結節点でも、A-B・A-C(・B-C)の接続が
    # すべて検出され、クラスタリングで1つのノードにまとまる。
    for a_name in names:
        a_line = lines[a_name]
        for end_ratio in (0.0, 1.0):
            end_xy = a_line.ratio_to_xy(end_ratio)
            for b_name in names:
                if b_name == a_name:
                    continue
                b_tree, b_pts = trees[b_name]
                d, idx = b_tree.query(np.array([end_xy]))
                d0, idx0 = d[0], idx[0]
                if d0 <= ENDPOINT_GAP_THRESHOLD_M:
                    raw_touches.append({
                        "touches": [(a_name, end_ratio),
                                    (b_name, resampled[b_name][idx0]["ratio"])],
                        "xy": end_xy,
                    })

    return raw_touches


def _circular_mean_ratio(ratios):
    """
    ratio(0-1)を円環上の角度とみなした平均を求める。
    環状線の継ぎ目(ratio≈0とratio≈1)をまたぐ値の集合を正しく平均するために使う。
    """
    x = sum(math.cos(r * 2 * math.pi) for r in ratios)
    y = sum(math.sin(r * 2 * math.pi) for r in ratios)
    angle = math.atan2(y, x)
    if angle < 0:
        angle += 2 * math.pi
    return angle / (2 * math.pi)


def is_loop_line(line):
    """路線の始点と終点が(ほぼ)同じ地点にあるか=環状線かどうかを判定する。"""
    return dist(line.xy[0], line.xy[-1]) <= LOOP_CLOSURE_EPS_M


def cluster_touches(raw_touches, lines, eps=NODE_CLUSTER_EPS_M):
    """近接する接続点候補を同一ノードにまとめる(Union-Find)"""
    n = len(raw_touches)
    if n == 0:
        return []
    pts = np.array([t["xy"] for t in raw_touches])
    tree = cKDTree(pts)
    pairs = tree.query_pairs(r=eps)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for a, b in pairs:
        union(a, b)

    groups = defaultdict(list)
    for i in range(n):
        groups[find(i)].append(i)

    nodes = []
    for group_idxs in groups.values():
        touches = {}  # line_name -> list of ratios
        xys = []
        for gi in group_idxs:
            for (lname, ratio) in raw_touches[gi]["touches"]:
                touches.setdefault(lname, []).append(ratio)
            xys.append(raw_touches[gi]["xy"])
        # 各路線につき平均ratioを採用。
        # ただし環状線で、始点付近(ratio≈0)と終点付近(ratio≈1)の両方の値が
        # 混ざっている場合、単純平均すると継ぎ目の反対側(ratio≈0.5)という
        # 全く誤った位置になってしまうため、円環としての平均(circular mean)を使う。
        avg_touches = {}
        for lname, rs in touches.items():
            line = lines.get(lname)
            if line is not None and is_loop_line(line) and len(rs) > 1 and (max(rs) - min(rs) > 0.5):
                avg_touches[lname] = _circular_mean_ratio(rs)
            else:
                avg_touches[lname] = sum(rs) / len(rs)
        avg_xy = (sum(p[0] for p in xys) / len(xys), sum(p[1] for p in xys) / len(xys))
        nodes.append({"lines": avg_touches, "xy": avg_xy})
    return nodes


def build_junction_nodes(lines):
    raw = detect_connections(lines)
    nodes = cluster_touches(raw, lines)
    return nodes
