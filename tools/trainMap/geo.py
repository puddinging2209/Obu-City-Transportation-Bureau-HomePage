"""
緯度経度 <-> ローカル平面座標(メートル)変換ユーティリティ。
都市スケールの距離計算であれば等距円筒図法(equirectangular)で十分な精度。
"""
import math

EARTH_R = 6371000.0  # meters


class Projector:
    def __init__(self, lat0, lng0):
        self.lat0 = lat0
        self.lng0 = lng0
        self.cos_lat0 = math.cos(math.radians(lat0))

    def to_xy(self, lat, lng):
        x = math.radians(lng - self.lng0) * self.cos_lat0 * EARTH_R
        y = math.radians(lat - self.lat0) * EARTH_R
        return (x, y)

    def to_latlng(self, x, y):
        lat = self.lat0 + math.degrees(y / EARTH_R)
        lng = self.lng0 + math.degrees(x / (EARTH_R * self.cos_lat0))
        return (lat, lng)


def make_projector(all_latlngs):
    lats = [p[0] for p in all_latlngs]
    lngs = [p[1] for p in all_latlngs]
    return Projector(sum(lats) / len(lats), sum(lngs) / len(lngs))


def dist(p1, p2):
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])


def point_segment_projection(p, a, b):
    """
    点pから線分abへの垂線距離と、線分上の射影点、射影パラメータt(0-1、範囲外はクランプ)を返す。
    戻り値: (t, proj_point, distance)
    """
    ax, ay = a
    bx, by = b
    px, py = p
    abx, aby = bx - ax, by - ay
    ab_len2 = abx * abx + aby * aby
    if ab_len2 == 0:
        return 0.0, a, dist(p, a)
    t = ((px - ax) * abx + (py - ay) * aby) / ab_len2
    t_clamped = max(0.0, min(1.0, t))
    proj = (ax + t_clamped * abx, ay + t_clamped * aby)
    return t_clamped, proj, dist(p, proj)


def angle_of(a, b):
    """線分a->bの方向角(度, 0-360)"""
    return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


def acute_angle_diff(ang1, ang2):
    """2つの方向角の間の鋭角差(0-90度)。線には向きの区別がないため。"""
    d = abs(ang1 - ang2) % 180.0
    if d > 90.0:
        d = 180.0 - d
    return d
