"""Flora0world: HUB — pixel-art cinematic teaser (90 s).

Native canvas 320x180, nearest-neighbour upscaled x4 -> 1280x720 @ 24 fps.
Usage:
    python video.py still <seconds> <out.png>     # render one frame (x4)
    python video.py render <out.mp4>              # video only (no sound)
"""
import math
import os
import random
import subprocess
import sys
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DUR, SCALE = 320, 180, 24, 70, 4

# ----------------------------------------------------------------- timeline
S1, S2, S3A, S3B, S4, S5, S7 = 0, 9, 19, 25, 31, 43, 57
ITEM_TIMES = [S4 + 0.9 + i * 1.05 for i in range(8)]
PIN_TIMES = [S5 + 2.4 + i * 1.85 for i in range(5)]
LOGO_HIT = S7 + 4.4                  # 77.4 s


# ------------------------------------------------------------------ helpers
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def lerp(a, b, t):
    return a + (b - a) * t


def sstep(a, b, x):
    t = clamp((x - a) / (b - a))
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_back(t):
    t = clamp(t)
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2


BAYER = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) + 0.5) / 16.0
BAY = np.tile(BAYER, (H // 4 + 1, W // 4 + 1))[:H, :W].astype(np.float32)
YY, XX = np.mgrid[0:H, 0:W]

FD = "/usr/share/fonts/truetype/dejavu/"
FACES = {"b": "DejaVuSans-Bold.ttf", "r": "DejaVuSans.ttf", "m": "DejaVuSansMono.ttf",
         "mb": "DejaVuSansMono-Bold.ttf", "i": "DejaVuSans-Oblique.ttf"}


@lru_cache(None)
def font(face, size):
    path = FD + FACES[face]
    if not os.path.exists(path):
        path = FD + "DejaVuSans.ttf"
    return ImageFont.truetype(path, size)


@lru_cache(None)
def text_mask(s, face, size):
    """Render at 4x with AA, box-downsample and threshold -> crisp pixel glyphs."""
    f = font(face, size * 4)
    l, t, r, b = f.getbbox(s, anchor="ls")
    py = int(math.ceil(-t / 4)) + 2
    cw = int(math.ceil((8 + r + 8) / 4)) * 4
    ch = int(math.ceil((4 * py + b + 8) / 4)) * 4
    big = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(big).text((8, 4 * py), s, font=f, fill=255, anchor="ls")
    small = big.resize((cw // 4, ch // 4), Image.BOX).point(lambda v: 255 if v > 64 else 0)
    return small, py


def txt(d, x, y, s, fill=(255, 255, 255), size=8, face="b", anchor="la", shadow=None, outline=None):
    if not s:
        return
    m, py = text_mask(s, face, size)
    w = tw(s, size, face)
    asc = font(face, size).getmetrics()[0]
    cap = size * 0.73
    if anchor == "mm":
        px, base = x - w / 2, y + cap / 2
    elif anchor == "ma":
        px, base = x - w / 2, y + asc
    else:
        px, base = x, y + asc
    ox, oy = int(round(px)) - 2, int(round(base)) - py
    img = d._image
    if outline:
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            img.paste(outline, (ox + dx, oy + dy), m)
    if shadow:
        img.paste(shadow, (ox + 1, oy + 1), m)
    img.paste(fill, (ox, oy), m)


def tw(s, size, face="b"):
    return font(face, size * 4).getlength(s) / 4


def tf(pts, cx, cy, s=1.0, ang=0.0, flipx=False):
    ca, sa = math.cos(ang), math.sin(ang)
    out = []
    for x, y in pts:
        if flipx:
            x = -x
        x *= s
        y *= s
        out.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return out


def ell(cx, cy, rx, ry, n=20):
    return [(cx + rx * math.cos(2 * math.pi * i / n), cy + ry * math.sin(2 * math.pi * i / n)) for i in range(n)]


def poly(d, pts, fill, outline=None):
    d.polygon(pts, fill=fill, outline=outline)


def shade(c, k):
    return tuple(int(clamp(v * k, 0, 255)) for v in c)


def mix(a, b, t):
    return tuple(int(lerp(a[i], b[i], t)) for i in range(3))


@lru_cache(None)
def vgrad(top, bot, levels=14):
    y = np.linspace(0, 1, H)[:, None, None]
    c = np.array(top, np.float32) * (1 - y) + np.array(bot, np.float32) * y
    c = np.broadcast_to(c, (H, W, 3))
    q = np.floor(c / 255 * levels + BAY[:, :, None]) / levels * 255
    return Image.fromarray(np.clip(q, 0, 255).astype(np.uint8))


class Ctx:
    def __init__(self, bg=None):
        self.img = bg.copy() if bg is not None else Image.new("RGB", (W, H))
        self.d = ImageDraw.Draw(self.img)
        self.glows = []

    def glow(self, x, y, r, col, k=1.0):
        self.glows.append((x, y, r, col, k))

    def flush(self):
        if not self.glows:
            return
        arr = np.asarray(self.img).astype(np.float32)
        for x, y, r, col, k in self.glows:
            x0, x1 = max(0, int(x - r)), min(W, int(x + r) + 1)
            y0, y1 = max(0, int(y - r)), min(H, int(y + r) + 1)
            if x0 >= x1 or y0 >= y1:
                continue
            dd = np.sqrt((XX[y0:y1, x0:x1] - x) ** 2 + (YY[y0:y1, x0:x1] - y) ** 2) / r
            v = np.clip(1 - dd, 0, 1) ** 2 * k
            v = np.clip(np.floor(v * 6 + BAY[y0:y1, x0:x1]) / 6, 0, 1)
            arr[y0:y1, x0:x1] += v[..., None] * np.array(col, np.float32)
        self.img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        self.d = ImageDraw.Draw(self.img)
        self.glows = []


def fog(ctx, y0, y1, col, peak, drift=0.0):
    prof = np.zeros(H, np.float32)
    ys = np.arange(y0, y1)
    prof[y0:y1] = peak * np.sin(math.pi * (ys - y0) / max(1, (y1 - y0)))
    bay = np.roll(BAY, int(drift), axis=1)
    mask = (bay < prof[:, None])
    ctx.img.paste(col, mask=Image.fromarray((mask * 255).astype(np.uint8)))


# ------------------------------------------------------------------ insects
def stag_beetle(d, cx, cy, s, phase, ang=0.0, body=(104, 52, 22)):
    T = lambda pts, flip=False: tf(pts, cx, cy, s, ang)
    legc, legh = (30, 16, 8), (84, 46, 20)
    attach = [(24, 15), (4, 18), (-16, 17)]
    for side in (1, -1):
        for i, (ax, ay) in enumerate(attach):
            ph = phase + (math.pi if (i % 2) == (0 if side == 1 else 1) else 0)
            sw = math.sin(ph) * 7
            lift = max(0.0, math.cos(ph)) * 3
            knee = (ax + (i - 1) * 6 + sw * 0.4, side * (ay + 12 + lift))
            foot = (ax + (i - 1) * 13 + sw, side * (ay + 27))
            tip = (foot[0] + 3, foot[1] + side * 3)
            pts = tf([(ax, side * ay), knee, foot, tip], cx, cy, s, ang)
            d.line(pts[:3], fill=legc, width=max(2, int(2.2 * s)))
            d.line(pts[:2], fill=legh, width=1)
            d.line(pts[2:], fill=legc, width=1)
            # tibial spines
            kx, ky = pts[1]
            d.point((kx, ky), fill=(190, 120, 50))
    # elytra
    poly(d, T(ell(-12, 0, 31, 19, 26)), body, (36, 18, 8))
    poly(d, T(ell(-14, -6, 21, 9, 18)), shade(body, 1.45))
    poly(d, T(ell(-18, -8, 11, 3.5, 12)), shade(body, 1.9))
    for k in (-1, 1):
        for j in range(3):
            pts = [(-38 + j * 2, k * (4 + j * 4)), (-22, k * (7 + j * 4.5)), (0, k * (8 + j * 3.8)), (12 - j * 3, k * (6 + j * 3))]
            d.line(tf(pts, cx, cy, s, ang), fill=shade(body, 0.62), width=1)
    d.line(tf([(-42, 0), (-14, 0), (14, 0)], cx, cy, s, ang), fill=shade(body, 0.5), width=1)
    # pronotum
    poly(d, T(ell(24, 0, 13, 16, 18)), (66, 32, 16), (32, 15, 7))
    poly(d, T(ell(22, -5, 8, 5, 12)), (118, 64, 30))
    # head
    poly(d, T(ell(41, 0, 8, 10, 14)), (50, 25, 12), (28, 12, 6))
    for k in (-1, 1):
        d.point(tf([(44, k * 8)], cx, cy, s, ang)[0], fill=(224, 190, 100))
    # mandibles (open/close)
    o = 2.5 + 2.2 * math.sin(phase * 0.5)
    for k in (-1, 1):
        m = [(46, -2), (53, -4 - o * 0.5), (62, -8 - o), (72, -9 - o * 1.2), (77, -5 - o * 0.8),
             (70, -5.5 - o * 0.6), (64, -4), (56, -1.5)]
        m = [(x * 1.0 + (x - 44) * 0.25 if x > 44 else x, y * k * 1.35) for x, y in m]
        poly(d, tf(m, cx, cy, s, ang), (138, 70, 30), (52, 24, 8))
        d.line(tf([(62, -6 * k - 0.8 * o * k), (65, -1.5 * k)], cx, cy, s, ang), fill=(52, 24, 8))
        # antennae
        an = [(46, 6 * k), (53, 13 * k), (59, 17 * k)]
        d.line(tf(an, cx, cy, s, ang), fill=(40, 20, 10), width=1)
        for q in range(3):
            d.point(tf([(60 + q, 17 * k + q * k)], cx, cy, s, ang)[0], fill=(190, 130, 60))


MORPH_FW = [(2, -3), (12, -26), (34, -46), (56, -44), (60, -30), (48, -14), (30, -5), (10, -1)]
MORPH_HW = [(2, 1), (30, -3), (46, 8), (44, 28), (30, 38), (14, 34), (4, 20)]


def shrink(pts, root, k):
    return [(root[0] + (x - root[0]) * k, root[1] + (y - root[1]) * k) for x, y in pts]


def morpho(d, cx, cy, s, flap, ang=0.0, palette=None):
    pal = palette or ((22, 62, 196), (58, 138, 246), (160, 220, 255), (8, 10, 38))
    base, mid, hi, rim = pal
    f = 0.14 + 0.86 * abs(math.cos(flap))
    for wing in (MORPH_HW, MORPH_FW):
        for side in (1, -1):
            pts = [(x * f * side, y) for x, y in wing]
            poly(d, tf(pts, cx, cy, s, ang), base, rim)
            p2 = shrink(pts, (0, -2), 0.78)
            poly(d, tf(p2, cx, cy, s, ang), mid)
            if f > 0.3:
                p3 = shrink(pts, (0, -2), 0.52)
                poly(d, tf(p3, cx, cy, s, ang), hi)
                for (x, y) in pts[2:-1]:
                    d.line(tf([(0, -2), (x * 0.9, y * 0.9)], cx, cy, s, ang), fill=shade(base, 0.7), width=1)
            for (x, y), (x2, y2) in zip(pts[1:-1], pts[2:]):
                qx, qy = lerp(x, x2, 0.5) * 0.9, lerp(y, y2, 0.5) * 0.9 - 0.5
                d.point(tf([(qx, qy)], cx, cy, s, ang)[0], fill=(245, 245, 255))
    poly(d, tf(ell(0, -11, 3.2, 6.5), cx, cy, s, ang), (34, 22, 20))
    poly(d, tf(ell(0, 7, 2.6, 15), cx, cy, s, ang), (46, 30, 26), (20, 12, 10))
    poly(d, tf(ell(0, -20, 3, 3), cx, cy, s, ang), (28, 18, 16))
    for k in (-1, 1):
        d.line(tf([(k, -22), (k * 6, -34), (k * 9, -39)], cx, cy, s, ang), fill=(30, 20, 18))
        d.point(tf([(k * 9, -40)], cx, cy, s, ang)[0], fill=(200, 160, 90))


MOTH_FW = [(1, -4), (10, -12), (26, -14), (33, -6), (29, 4), (14, 8), (2, 4)]
MOTH_HW = [(1, 3), (14, 8), (24, 14), (21, 23), (9, 19), (1, 11)]
MOTH_PAL = [
    ((200, 166, 112), (232, 208, 160), (92, 64, 38), (150, 120, 90)),   # tan
    ((228, 224, 210), (250, 248, 236), (120, 112, 100), (200, 196, 180)),  # pale
    ((126, 112, 100), (170, 150, 130), (50, 40, 34), (236, 124, 138)),  # hawkmoth (hindwing pink)
    ((206, 120, 60), (240, 170, 90), (110, 50, 24), (240, 210, 120)),   # tiger-ish orange
]


def moth(d, cx, cy, s, flap, ang=0.0, kind=0):
    fw, fw2, mark, hwcol = MOTH_PAL[kind % len(MOTH_PAL)]
    f = 0.2 + 0.8 * abs(math.cos(flap))
    for wing, col, inner in ((MOTH_HW, hwcol, hwcol), (MOTH_FW, fw, fw2)):
        for side in (1, -1):
            pts = [(x * f * side, y) for x, y in wing]
            poly(d, tf(pts, cx, cy, s, ang), col, shade(mark, 0.8))
            if wing is MOTH_FW:
                poly(d, tf(shrink(pts, (0, 0), 0.62), cx, cy, s, ang), inner)
                d.line(tf([(pts[2][0] * 0.9, pts[2][1] * 0.9), (pts[4][0] * 0.9, pts[4][1] * 0.9)], cx, cy, s, ang), fill=mark)
                d.line(tf([(pts[1][0] * 0.8, pts[1][1] * 0.8), (pts[5][0] * 0.8, pts[5][1] * 0.8)], cx, cy, s, ang), fill=mark)
                d.point(tf([(pts[3][0] * 0.6, pts[3][1] * 0.6)], cx, cy, s, ang)[0], fill=mark)
    poly(d, tf(ell(0, 4, 3.2, 11, 14), cx, cy, s, ang), shade(mark, 1.5), shade(mark, 0.7))
    poly(d, tf(ell(0, -8, 2.2, 2.2, 10), cx, cy, s, ang), shade(mark, 1.1))
    for k in (-1, 1):
        d.line(tf([(k, -9), (k * 4, -16), (k * 7, -18)], cx, cy, s, ang), fill=shade(mark, 0.8))
        d.line(tf([(k * 4, -16), (k * 6, -14)], cx, cy, s, ang), fill=shade(mark, 0.8))


def mini_beetle(d, x, y, col=(30, 20, 14), s=1.0):
    d.ellipse([x - 3 * s, y - 2 * s, x + 3 * s, y + 3 * s], fill=col)
    d.point((x, y - 3 * s), fill=col)


def mantis(d, cx, cy, s, sway=0.0, col=(96, 170, 56)):
    """side-view praying mantis sitting on a twig, facing right."""
    sw = math.sin(sway) * 1.2
    dark = shade(col, 0.55)
    # abdomen (angled back)
    poly(d, tf([(-14, 4), (-6, -2), (4, 0), (6, 6), (-8, 10), (-18, 12)], cx, cy, s), col, dark)
    # thorax (long)
    poly(d, tf([(4, 0), (18, -12 + sw), (22, -10 + sw), (8, 6)], cx, cy, s), col, dark)
    # head + eyes
    poly(d, tf(ell(24, -13 + sw, 4, 3.4, 10), cx, cy, s), shade(col, 1.15), dark)
    d.point(tf([(26, -14 + sw)], cx, cy, s)[0], fill=(20, 20, 10))
    d.line(tf([(25, -16 + sw), (30, -22), (33, -26)], cx, cy, s), fill=dark)
    # raptorial forelegs folded
    d.line(tf([(19, -10 + sw), (26, -4), (22, 1), (28, -2)], cx, cy, s), fill=shade(col, 0.8), width=2)
    # walking legs
    for dx in (4, -2):
        d.line(tf([(dx, 4), (dx + 4, 12), (dx + 2, 20)], cx, cy, s), fill=dark, width=1)
    d.line(tf([(-6, 6), (-12, 14), (-16, 22)], cx, cy, s), fill=dark, width=1)
    # wing line
    d.line(tf([(-16, 2), (0, -2), (8, 0)], cx, cy, s), fill=shade(col, 1.3))


# ================================================================= SCENE 1
R1 = random.Random(11)
STARS = [(R1.randrange(W), R1.randrange(0, 96), R1.uniform(0.5, 2.2), R1.random()) for _ in range(90)]
FAR_PINES = [(i * 26 + R1.randrange(-6, 6), R1.randrange(34, 58), R1.randrange(9, 14)) for i in range(15)]
MID_TREES = [(i * 64 + R1.randrange(-10, 10), R1.randrange(40, 62), R1.randrange(20, 30), R1.randrange(5, 8)) for i in range(7)]
GRASS = [(R1.randrange(0, 2 * W), R1.randrange(6, 20), R1.uniform(0, 6.28), R1.choice([0, 0, 1])) for _ in range(150)]
FIREFLIES = [(R1.uniform(0, W), R1.uniform(70, 150), R1.uniform(6, 22), R1.uniform(0.3, 1.1), R1.uniform(0, 6.28), R1.uniform(0.6, 1.8)) for _ in range(34)]
SHROOMS = [(R1.randrange(10, W - 10), R1.randrange(150, 172), R1.uniform(0.7, 1.4)) for _ in range(6)]


def pine(d, x, base, h, w, col):
    for k in range(5):
        yy = base - h + k * h / 5.2
        ww = w * (0.35 + k * 0.22)
        d.polygon([(x, yy - h / 5), (x - ww, yy + h / 4.4), (x + ww, yy + h / 4.4)], fill=col)
    d.rectangle([x - 1, base - 5, x + 1, base], fill=col)


def broadleaf(d, x, base, h, w, col, hi):
    d.polygon([(x - w * 0.35, base), (x - w * 0.18, base - h * 0.55), (x + w * 0.18, base - h * 0.55), (x + w * 0.35, base)], fill=col)
    r = random.Random(int(x) % 97 + 3)
    for _ in range(11):
        ox, oy = r.uniform(-w, w), r.uniform(-h * 0.45, 0)
        rr = r.uniform(w * 0.5, w * 0.95)
        d.ellipse([x + ox - rr, base - h * 0.62 + oy - rr * 0.8, x + ox + rr, base - h * 0.62 + oy + rr * 0.8], fill=col)
    for _ in range(5):
        ox, oy = r.uniform(0, w), r.uniform(-h * 0.5, -h * 0.1)
        d.ellipse([x + ox - 4, base - h * 0.62 + oy - 3, x + ox + 4, base - h * 0.62 + oy + 3], fill=hi)


def fern(d, x, y, length, sway, col, hi, side=1):
    pts = []
    for i in range(10):
        t = i / 9
        pts.append((x + side * (t * length + math.sin(sway) * t * 4), y - math.sin(t * 1.5) * length * 0.7 + t * t * length * 0.5))
    d.line(pts, fill=col, width=2)
    for i in range(1, 10):
        px, py = pts[i]
        L = (1 - i / 10) * 13 + 3
        for k in (-1, 1):
            d.line([(px, py), (px + side * 3 * 0.5, py + k * L * 0.75 + L * 0.2)], fill=col if i % 2 else hi, width=1)


def forest_bg(ctx, t, cam, mist=0.3):
    d = ctx.d
    ctx.img.paste(vgrad((6, 8, 28), (22, 50, 62)))
    for x, y, sp, b in STARS:
        v = 0.45 + 0.55 * math.sin(t * sp + b * 9) ** 2
        c = int(110 + 130 * v * b)
        d.point((x, y), fill=(c, c, min(255, c + 30)))
    mx, my = 248, 40
    ctx.glow(mx, my, 70, (60, 72, 110), 0.9)
    ctx.flush()
    d = ctx.d
    d.ellipse([mx - 15, my - 15, mx + 15, my + 15], fill=(236, 232, 200), outline=(190, 192, 168))
    d.arc([mx - 13, my - 13, mx + 13, my + 13], 20, 120, fill=(250, 248, 226), width=2)
    for cxx, cyy, rr in ((-5, -4, 3), (4, 3, 4), (-3, 7, 2), (6, -6, 2), (-8, 3, 1.5)):
        d.ellipse([mx + cxx - rr, my + cyy - rr, mx + cxx + rr, my + cyy + rr], fill=(196, 194, 160))
        d.arc([mx + cxx - rr, my + cyy - rr, mx + cxx + rr, my + cyy + rr], 200, 340, fill=(170, 168, 140))
    for i in range(3):  # drifting cloud strips
        cx = (i * 140 + t * (2 + i)) % (W + 120) - 60
        d.rectangle([cx, 30 + i * 22, cx + 70, 32 + i * 22], fill=(26, 44, 66))
        d.rectangle([cx + 12, 28 + i * 22, cx + 50, 29 + i * 22], fill=(30, 50, 72))
    hills = [(0, H)] + [(x, 104 + 9 * math.sin((x + cam * 0.1) * 0.03) + 5 * math.sin((x + cam * 0.1) * 0.09)) for x in range(0, W + 8, 8)] + [(W, H)]
    d.polygon(hills, fill=(14, 30, 42))
    for bx, h, w in FAR_PINES:
        x = (bx - cam * 0.25) % (15 * 26) - 20
        pine(d, x, 126, h, w, (11, 26, 38))
    fog(ctx, 100, 140, (40, 70, 84), mist * 0.8, drift=t * 3)
    for bx, h, w, _ in MID_TREES:
        x = (bx - cam * 0.55) % (7 * 64) - 40
        broadleaf(d, x, 144, h, w, (7, 17, 26), (14, 34, 44))
    fog(ctx, 126, 158, (26, 56, 62), mist * 0.6, drift=-t * 4)
    d.rectangle([0, 142, W, H], fill=(5, 12, 16))
    for i in range(110):
        x = (i * 37 - cam * 1.0) % W
        y = 143 + (i * 53) % 36
        d.point((x, y), fill=(14, 36, 30) if i % 3 else (22, 56, 40))


def forest_fg(ctx, t, cam):
    d = ctx.d
    for bx, h, ph, light in GRASS:
        x = (bx - cam * 1.4) % (2 * W) - 20
        sw = math.sin(t * 1.4 + ph) * 3
        col = (16, 52, 34) if light else (8, 30, 22)
        d.line([(x, H - 6), (x + sw * 0.5, H - 6 - h * 0.6), (x + sw, H - 6 - h)], fill=col, width=1)
    for (x0, side, sc) in ((14, 1, 1.0), (300, -1, 1.1)):
        x = (x0 - cam * 1.8) % (W + 80) - 40 if False else x0
        fern(d, x, H - 4, 54 * sc, t * 1.2 + x, (10, 38, 28), (22, 70, 44), side)
        fern(d, x, H - 4, 42 * sc, t * 1.1 + x + 1, (8, 30, 22), (18, 58, 38), -side)
    for sx, sy, sc in SHROOMS:
        x = (sx - cam * 1.2) % W
        cap = (60, 210, 200)
        d.rectangle([x - 1, sy, x + 1, sy + 7 * sc], fill=(170, 220, 210))
        d.ellipse([x - 5 * sc, sy - 3 * sc, x + 5 * sc, sy + 2 * sc], fill=cap, outline=(30, 120, 130))
        d.point((x - 2, sy - 1), fill=(220, 255, 250))
        ctx.glow(x, sy, 14 * sc, (30, 150, 140), 0.8 + 0.2 * math.sin(t * 2 + sx))


def fireflies(ctx, t, cam=0, boost=1.0):
    d = ctx.d
    for bx, by, amp, sp, ph, bl in FIREFLIES:
        x = (bx - cam * 0.8 + math.sin(t * sp + ph) * amp) % W
        y = by + math.cos(t * sp * 0.8 + ph) * amp * 0.5
        b = max(0.0, math.sin(t * bl * 2.2 + ph * 3)) ** 3
        if b > 0.12:
            c = (int(220 * b + 30), int(255 * b), int(90 * b))
            d.point((x, y), fill=c)
            if b > 0.55:
                d.point((x + 1, y), fill=c)
            ctx.glow(x, y, 9 * boost, (150, 220, 60), 0.9 * b)


def caption(ctx, lt, t0, t1, text, y=151, size=8, col=(228, 236, 200), face="b"):
    """typewriter-in / fade-out caption centred at y."""
    if lt < t0 or lt > t1:
        return
    n = int(clamp((lt - t0) / 0.045) if False else min(len(text), (lt - t0) / 0.06))
    a = clamp((t1 - lt) / 0.5)
    c = shade(col, a)
    s = text[:n]
    w = tw(text, size, face)
    txt(ctx.d, W / 2 - w / 2, y, s, c, size, face, shadow=shade((10, 20, 24), a))
    if n < len(text) or int(lt * 3) % 2:
        d = ctx.d
        d.rectangle([W / 2 - w / 2 + tw(s, size, face) + 1, y + 1, W / 2 - w / 2 + tw(s, size, face) + 3, y + size], fill=c)


def scene1(ctx, lt):
    cam = lt * 6
    forest_bg(ctx, lt, cam)
    # a moth drifting toward the moon
    mx = lerp(-20, 250, sstep(2.0, 9.5, lt))
    my = 90 - 40 * sstep(2.0, 9.5, lt) + math.sin(lt * 3) * 6
    ctx.glow(mx, my, 12, (200, 200, 150), 0.25)
    moth(ctx.d, mx, my, 0.7, lt * 18, ang=1.25, kind=1)
    fireflies(ctx, lt, cam)
    forest_fg(ctx, lt, cam)
    ctx.flush()
    caption(ctx, lt, 1.6, 4.6, "Когда гаснет день…")
    caption(ctx, lt, 5.0, 8.8, "…просыпается другой мир.")


# ================================================================= SCENE 2
R2 = random.Random(22)
LANDED = []
for i in range(11):
    while True:
        lx, ly = R2.uniform(112, 208), R2.uniform(58, 122)
        if not (abs(lx - 156) < 34 and abs(ly - 98) < 28):
            break
    LANDED.append(dict(x=lx, y=ly, ang=R2.uniform(-0.5, 0.5) + (math.pi if R2.random() < 0.3 else 0),
                       kind=R2.choice([0, 1, 3, 1, 0]), s=R2.uniform(0.36, 0.52), land=R2.uniform(1.0, 8.0), ph=R2.uniform(0, 6.28),
                       rx=R2.uniform(14, 48), ry=R2.uniform(10, 36), w=R2.uniform(1.8, 3.6)))
FLYERS = [dict(kind=R2.choice([0, 1, 3]), s=R2.uniform(0.34, 0.5), ph=R2.uniform(0, 6.28), rx=R2.uniform(22, 74), ry=R2.uniform(14, 40),
               w=R2.uniform(1.4, 3.0) * R2.choice([-1, 1])) for _ in range(9)]
LAMP = (160, 36)


def orbit(p, t):
    a = p["w"] * t + p["ph"]
    return LAMP[0] + math.cos(a) * p["rx"] + math.sin(t * 7 + p["ph"]) * 2, LAMP[1] + 12 + math.sin(a * 1.3) * p["ry"], a


def field_net(d, x, y, glow_col=(150, 100, 50)):
    """butterfly net leaning against the table: pole, hoop, mesh bag."""
    pole_top = (x + 14, y - 6)
    d.line([(x - 12, y + 70), pole_top], fill=(70, 46, 24), width=3)
    d.line([(x - 11, y + 70), (x + 15, y - 6)], fill=(128, 92, 50), width=1)
    d.rectangle([x - 8, y + 44, x - 5, y + 62], fill=(40, 40, 46))          # grip
    hx, hy = x + 14, y - 14
    bag = [(hx, hy - 12), (hx + 16, hy - 12), (hx + 34, hy - 4), (hx + 40, hy + 8), (hx + 30, hy + 14), (hx + 14, hy + 12), (hx, hy + 12)]
    d.polygon(bag, fill=(78, 98, 112), outline=(150, 170, 182))
    for k in range(1, 6):                                               # mesh
        d.line([(hx + k * 6, hy - 12 + abs(k - 3)), (hx + k * 6 + 3, hy + 13 - abs(k - 3))], fill=(120, 140, 154))
    for k in range(-1, 2):
        d.line([(hx + 2, hy + k * 8), (hx + 36 - abs(k) * 6, hy + k * 8 + 3)], fill=(120, 140, 154))
    d.ellipse([hx - 7, hy - 13, hx + 7, hy + 13], outline=(200, 208, 216), width=2)   # hoop
    d.arc([hx - 7, hy - 13, hx + 7, hy + 13], 270, 90, fill=(244, 248, 250), width=1)
    d.point((hx + 38, hy + 8), fill=glow_col)


def scene2(ctx, lt):
    d = ctx.d
    ctx.img.paste(vgrad((4, 6, 20), (12, 26, 38)))
    for x, y, sp, b in STARS[:40]:
        c = int(90 + 100 * b)
        d.point((x, y), fill=(c, c, c + 20))
    for i in range(12):
        pine(d, i * 30 - 4, 122, 36 + (i * 7) % 20, 10, (8, 18, 28))
    fog(ctx, 96, 140, (50, 80, 100), 0.35, drift=lt * 3)
    d.rectangle([0, 128, W, H], fill=(6, 14, 16))
    # posts + rope
    for px in (92, 228):
        d.rectangle([px - 2, 26, px + 2, 140], fill=(70, 44, 24))
        d.line([(px - 2, 26), (px - 2, 140)], fill=(104, 70, 38))
    d.line([(90, 28), (230, 28)], fill=(150, 120, 80), width=1)
    # the sheet (gently billowing)
    left = [(100 + math.sin(lt * 0.9 + y * 0.06) * 1.6, y) for y in range(30, 134, 4)]
    right = [(220 + math.sin(lt * 0.9 + y * 0.06 + 1.5) * 1.6, y) for y in range(30, 134, 4)]
    d.polygon(left + right[::-1], fill=(168, 176, 188), outline=(120, 128, 142))
    for y in range(36, 130, 9):  # cloth folds
        d.line([(102, y), (218, y + 1)], fill=(150, 158, 170))
    ctx.glow(LAMP[0], LAMP[1] + 30, 90, (70, 50, 130), 0.8)
    ctx.glow(LAMP[0], LAMP[1] + 20, 46, (80, 70, 120), 0.7)
    # UV lamp
    d.rectangle([LAMP[0] - 8, 30, LAMP[0] + 8, 33], fill=(60, 60, 70))
    d.rectangle([LAMP[0] - 6, 33, LAMP[0] + 6, 38], fill=(190, 150, 255), outline=(110, 70, 190))
    ctx.glow(LAMP[0], 36, 22, (150, 100, 240), 0.9)
    # tent far left, table + lantern, net
    d.polygon([(8, 128), (34, 96), (60, 128)], fill=(10, 20, 22), outline=(22, 40, 40))
    d.polygon([(34, 96), (28, 128), (40, 128)], fill=(4, 8, 10))
    d.rectangle([66, 124, 100, 128], fill=(52, 32, 18))
    d.rectangle([68, 128, 70, 146], fill=(40, 24, 14))
    d.rectangle([96, 128, 98, 146], fill=(40, 24, 14))
    d.rectangle([76, 114, 84, 124], fill=(170, 110, 40), outline=(90, 56, 20))
    d.rectangle([77, 116, 83, 122], fill=(255, 220, 130))
    ctx.glow(80, 119, 34, (255, 170, 70), 0.85 + 0.1 * math.sin(lt * 9))
    d.rectangle([88, 120, 94, 124], fill=(150, 100, 60))   # notebook
    field_net(d, 44, 66)
    # naturalist silhouette (right), headlamp
    pc, rim = (10, 12, 20), (60, 44, 100)
    d.polygon([(258, 112), (272, 112), (276, 136), (254, 136)], fill=pc, outline=rim)
    d.ellipse([254, 98, 264, 108], fill=pc, outline=rim)
    d.polygon([(252, 98), (266, 98), (264, 94), (254, 94)], fill=pc)
    d.line([(254, 138), (244, 138), (244, 152)], fill=pc, width=4)
    d.line([(266, 138), (262, 152)], fill=pc, width=4)
    d.rectangle([242, 122, 252, 130], fill=(220, 210, 180), outline=(100, 80, 50))   # notebook in hands
    d.rectangle([250, 136, 278, 139], fill=(40, 24, 14))
    ctx.glow(255, 102, 14, (255, 230, 150), 0.9)
    ctx.glow(236, 106, 24, (255, 220, 140), 0.35)
    ctx.glow(212, 108, 22, (255, 220, 140), 0.22)
    # moths: landed + flying
    for p in LANDED:
        ox, oy, a = orbit(p, min(lt, p["land"]))
        k = ease_out((lt - p["land"]) / 1.2)
        x, y = lerp(ox, p["x"], k), lerp(oy, p["y"], k)
        flap = lt * (26 * (1 - k) + (0.6 if int(lt * 0.5 + p["ph"]) % 4 == 0 else 0.0)) + p["ph"]
        ang = lerp(a + math.pi / 2 * (1 if p["w"] > 0 else -1), p["ang"], k)
        moth(d, x, y, p["s"], flap if k < 1 else (math.pi * 0.0 + (lt * 5 if int(lt * 0.5 + p["ph"]) % 5 == 0 else 0)), ang, p["kind"])
    for p in FLYERS:
        x, y, a = orbit(p, lt)
        moth(d, x, y, p["s"], lt * 27 + p["ph"], a + math.pi / 2 * (1 if p["w"] > 0 else -1), p["kind"])
    # hawkmoth arrives and lands
    k = sstep(3.2, 5.6, lt)
    if lt > 3.2:
        hx = lerp(330, 156, ease_out(k)) + math.sin(lt * 4) * (1 - k) * 8
        hy = lerp(30, 98, k) + math.sin(lt * 6) * (1 - k) * 6
        ang = lerp(-1.9, 0.0, k)
        moth(d, hx, hy, 0.95, (lt * 24 if k < 0.95 else lt * 1.8), ang, 2)
        ctx.glow(hx, hy, 24, (150, 120, 220), 0.35)
    fireflies(ctx, lt * 0.8, 0, 0.7)
    for i in range(40):
        x = (i * 41 + lt * 6 * (1 + i % 3)) % W
        d.point((x, H - 10 - (i * 17) % 40 * 0.15), fill=(10, 36, 24))
    for bx, h, ph, light in GRASS[:90]:
        x = bx % W
        sw = math.sin(lt * 1.4 + ph) * 3
        d.line([(x, H - 6), (x + sw, H - 6 - h)], fill=(14, 46, 30) if light else (6, 26, 20), width=1)
    ctx.flush()
    caption(ctx, lt, 0.8, 4.2, "Свет. Тишина. Терпение.")
    if lt > 6.2:
        a = sstep(6.2, 6.8, lt) * clamp((9.8 - lt) / 0.5)
        if a > 0:
            bx, by = 186, 128
            d.line([(166, 104), (176, 118), (bx, by)], fill=shade((230, 220, 150), a))
            d.rectangle([bx, by, bx + 100, by + 20], fill=shade((26, 20, 40), a), outline=shade((230, 210, 140), a))
            txt(d, bx + 4, by + 2, "Sphinx ligustri", shade((255, 240, 180), a), 8, "i")
            txt(d, bx + 4, by + 11, "бражник · ночной гость", shade((190, 180, 220), a), 7, "r")


# ================================================================= SCENE 3A
def oak_leaf(r, L):
    pts_l, pts_r = [], []
    n = 9
    for i in range(n):
        t = i / (n - 1)
        wv = L * 0.28 * math.sin(math.pi * t) ** 0.8 * (0.7 + 0.3 * (i % 2)) * (1 + r.uniform(-0.1, 0.1))
        pts_l.append((-wv, -L / 2 + L * t))
        pts_r.append((wv, -L / 2 + L * t))
    return pts_l + pts_r[::-1]


@lru_cache(None)
def ground_tex():
    GW = 1100
    r = random.Random(33)
    np_r = np.random.RandomState(33)
    pal = np.array([(40, 36, 22), (52, 46, 26), (64, 56, 30), (38, 50, 26), (30, 40, 22), (72, 62, 34)], np.uint8)
    base = np_r.rand(H // 3 + 1, GW // 3 + 1)
    base = np.asarray(Image.fromarray((base * 255).astype(np.uint8)).resize((GW, H), Image.BICUBIC)).astype(np.float32) / 255
    fine = np_r.rand(H, GW)
    idx = np.clip((base * 0.7 + fine * 0.5) * len(pal), 0, len(pal) - 1).astype(int)
    img = Image.fromarray(pal[idx])
    d = ImageDraw.Draw(img)
    for _ in range(60):  # moss patches
        x, y, rr = r.randrange(GW), r.randrange(H), r.randrange(8, 22)
        for _ in range(rr * 4):
            px, py = x + r.gauss(0, rr * 0.5), y + r.gauss(0, rr * 0.4)
            d.point((px, py), fill=r.choice([(58, 96, 40), (74, 118, 46), (48, 80, 36), (92, 140, 56)]))
    for _ in range(46):  # leaves
        x, y = r.randrange(GW), r.randrange(H)
        L = r.uniform(26, 50)
        ang = r.uniform(0, 6.28)
        col = r.choice([(102, 72, 28), (126, 86, 30), (82, 64, 26), (66, 86, 34), (140, 100, 36)])
        pts = tf(oak_leaf(r, L), x, y, 1, ang)
        d.polygon(pts, fill=col, outline=shade(col, 0.6))
        d.line(tf([(0, -L / 2), (0, L / 2)], x, y, 1, ang), fill=shade(col, 0.7))
        for k in range(1, 4):
            for sgn in (-1, 1):
                d.line(tf([(0, -L / 2 + L * k / 4), (sgn * L * 0.16, -L / 2 + L * k / 4 + 4)], x, y, 1, ang), fill=shade(col, 0.75))
    for _ in range(18):  # twigs
        x, y = r.randrange(GW), r.randrange(H)
        L, ang = r.uniform(24, 60), r.uniform(0, 3.14)
        pts = tf([(0, 0), (L * 0.5, r.uniform(-3, 3)), (L, r.uniform(-2, 2))], x, y, 1, ang)
        d.line(pts, fill=(52, 34, 18), width=2)
        d.line(pts, fill=(88, 60, 30), width=1)
    for _ in range(26):  # acorns / pebbles
        x, y = r.randrange(GW), r.randrange(H)
        if r.random() < 0.5:
            d.ellipse([x - 3, y - 4, x + 3, y + 4], fill=(150, 104, 44), outline=(70, 44, 16))
            d.ellipse([x - 4, y - 5, x + 4, y - 1], fill=(92, 66, 30), outline=(48, 30, 12))
        else:
            d.ellipse([x - 3, y - 2, x + 3, y + 2], fill=(110, 110, 104), outline=(60, 60, 58))
    for _ in range(9):  # mushrooms from above
        x, y = r.randrange(GW), r.randrange(H)
        rr = r.uniform(5, 9)
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(176, 56, 44), outline=(86, 22, 20))
        for _ in range(5):
            d.point((x + r.uniform(-rr * 0.6, rr * 0.6), y + r.uniform(-rr * 0.6, rr * 0.6)), fill=(250, 240, 230))
    for _ in range(80):  # dew
        x, y = r.randrange(GW), r.randrange(H)
        d.point((x, y), fill=(190, 230, 240))
        d.point((x + 1, y + 1), fill=(60, 100, 110))
    return img


def scene3a(ctx, lt):
    tex = ground_tex()
    # beetle walks in, then camera follows
    bx_screen = lerp(-70, 150, ease_out(lt / 3.0))
    scroll = max(0.0, lt - 1.2) * 22 + 40
    off = int(scroll) % (1100 - W)
    ctx.img.paste(tex.crop((off, 0, off + W, H)))
    d = ctx.d
    by = 92 + math.sin(lt * 2.0) * 1.5
    phase = lt * 11
    # shadow
    d.ellipse([bx_screen - 40, by + 22, bx_screen + 56, by + 40], fill=(30, 28, 18))
    stag_beetle(d, bx_screen, by, 1.0, phase, ang=math.sin(lt * 1.4) * 0.05)
    # drifting pollen / dust motes
    for i in range(26):
        x = (i * 53 + lt * (8 + i % 5) * 3) % W
        y = (i * 31 - lt * (6 + i % 3) * 2) % H
        d.point((x, y), fill=(250, 240, 180))
        if i % 4 == 0:
            ctx.glow(x, y, 6, (230, 210, 120), 0.4)
    ctx.glow(260, 20, 140, (120, 100, 40), 0.6)   # sun-dapple
    ctx.flush()
    # vignette (dither) to focus macro look
    arr = np.asarray(ctx.img).astype(np.float32)
    vg = np.clip(1 - (((XX - W / 2) / (W * 0.75)) ** 2 + ((YY - H / 2) / (H * 0.9)) ** 2), 0.25, 1)
    ctx.img = Image.fromarray(np.clip(np.floor(arr * vg[..., None] + BAY[..., None]), 0, 255).astype(np.uint8))
    ctx.d = ImageDraw.Draw(ctx.img)
    name_plate(ctx, lt, 1.4, 5.6, "Lucanus cervus", "жук-олень · Lucanidae", (176, 100, 40))


def name_plate(ctx, lt, t0, t1, latin, ru, accent, x=14, y=132):
    if lt < t0 or lt > t1:
        return
    k = ease_out((lt - t0) / 0.5) * clamp((t1 - lt) / 0.4)
    if k <= 0:
        return
    d = ctx.d
    w = 128
    xo = x - (1 - k) * 150
    d.rectangle([xo, y, xo + w, y + 26], fill=(14, 18, 14), outline=accent)
    d.rectangle([xo, y, xo + 4, y + 26], fill=accent)
    txt(d, xo + 9, y + 3, latin, (250, 240, 200), 9, "i")
    txt(d, xo + 9, y + 15, ru, (180, 200, 170), 7, "r")


# ================================================================= SCENE 3B
R3 = random.Random(44)
BIGLEAVES = [(R3.randrange(-20, W), R3.randrange(-20, H), R3.uniform(60, 120), R3.uniform(0, 6.28), R3.choice([(20, 70, 36), (28, 92, 44), (14, 54, 32), (40, 110, 52)])) for _ in range(13)]


def big_leaf(d, x, y, L, ang, col, sway):
    ang += sway
    pts = []
    n = 12
    for side in (1, -1):
        for i in range(n):
            t = i / (n - 1)
            if side == -1:
                t = 1 - t
            w = L * 0.3 * math.sin(math.pi * t ** 0.85)
            pts.append((side * w, -L / 2 + L * t))
    d.polygon(tf(pts, x, y, 1, ang), fill=col, outline=shade(col, 0.6))
    d.line(tf([(0, -L / 2), (0, L / 2)], x, y, 1, ang), fill=shade(col, 1.5), width=1)
    for k in range(1, 6):
        for sgn in (-1, 1):
            d.line(tf([(0, -L / 2 + L * k / 6), (sgn * L * 0.22, -L / 2 + L * k / 6 + L * 0.1)], x, y, 1, ang), fill=shade(col, 1.25))


def scene3b(ctx, lt):
    d = ctx.d
    ctx.img.paste(vgrad((18, 60, 40), (8, 36, 26)))
    for i, (x, y, L, a, col) in enumerate(BIGLEAVES):
        big_leaf(d, x, y, L, a, col, math.sin(lt * 0.8 + i) * 0.05)
    cx, cy = 168, 104
    sway = math.sin(lt * 1.1) * 1.5
    d.line([(cx, cy), (cx - 20, H + 10)], fill=(30, 90, 40), width=4)
    petals = 14
    for ring, (rr, col, ol) in enumerate(((46, (236, 190, 210), (170, 100, 130)), (36, (250, 226, 236), (200, 140, 160)))):
        for i in range(petals):
            a = i / petals * 6.28 + ring * 0.22 + math.sin(lt * 0.7) * 0.02
            pts = tf(ell(0, -rr * 0.62, rr * 0.2, rr * 0.5, 12), cx + sway, cy, 1, a)
            poly(d, pts, col, ol)
            d.line(tf([(0, -rr * 0.2), (0, -rr * 0.95)], cx + sway, cy, 1, a), fill=shade(col, 0.82))
    d.ellipse([cx + sway - 15, cy - 15, cx + sway + 15, cy + 15], fill=(238, 184, 44), outline=(150, 100, 20))
    r = random.Random(5)
    for _ in range(40):
        a, rd = r.uniform(0, 6.28), r.uniform(0, 13)
        d.point((cx + sway + math.cos(a) * rd, cy + math.sin(a) * rd), fill=r.choice([(255, 230, 120), (190, 130, 20), (140, 90, 10)]))
    ctx.glow(cx, cy, 70, (200, 160, 60), 0.35)
    # butterfly: swoops in, lands on flower
    k = sstep(0.6, 3.0, lt)
    if lt > 0.2:
        bx = lerp(-30, cx + sway - 1, ease_out(k)) + math.sin(lt * 3) * (1 - k) * 18
        by = lerp(10, cy - 6, k) + math.cos(lt * 4) * (1 - k) * 10
        rate = lerp(14, 2.2, k)
        ang = lerp(0.9, 0.0, k) + math.sin(lt * 3) * 0.1 * (1 - k)
        s = lerp(0.65, 0.95, k)
        ctx.glow(bx, by, 36 * s, (90, 160, 255), 0.35)
        phase = lt * rate * 1.5
        morpho(d, bx, by, s, phase, ang)
    # pollen / sparkles
    for i in range(30):
        x = (i * 47 + math.sin(lt + i) * 8) % W
        y = (H - (lt * (7 + i % 4) * 2 + i * 29) % H)
        d.point((x, y), fill=(255, 240, 160))
        if i % 3 == 0:
            ctx.glow(x, y, 6, (255, 230, 120), 0.5)
    ctx.flush()
    arr = np.asarray(ctx.img).astype(np.float32)
    vg = np.clip(1 - (((XX - W / 2) / (W * 0.75)) ** 2 + ((YY - H / 2) / (H * 0.9)) ** 2), 0.3, 1)
    ctx.img = Image.fromarray(np.clip(np.floor(arr * vg[..., None] + BAY[..., None]), 0, 255).astype(np.uint8))
    ctx.d = ImageDraw.Draw(ctx.img)
    name_plate(ctx, lt, 1.6, 5.7, "Morpho menelaus", "голубой морфо · Nymphalidae", (60, 140, 240))


# ================================================================== SCENE 4
EQUIP = ["САЧОК", "ЭКСГАУСТЕР", "ЛУПА", "ДНЕВНИК", "НАЛОБНИК", "УФ-ЛАМПА", "РАСПРАВИЛКА", "ТЕРРАРИУМ"]


@lru_cache(None)
def wood_bg():
    r = np.random.RandomState(8)
    cols = np.array([(46, 28, 18), (54, 34, 20), (62, 40, 24), (40, 24, 16)], np.uint8)
    stripe = r.randint(0, 4, (1, W // 3 + 1))
    base = np.repeat(stripe, 3, axis=1)[:, :W]
    noise = (r.rand(H, W) * 0.9).astype(np.float32)
    idx = np.clip((base + noise).astype(int), 0, 3)
    img = Image.fromarray(cols[idx])
    d = ImageDraw.Draw(img)
    for x in range(0, W, 24):
        d.line([(x, 0), (x, H)], fill=(24, 14, 8))
    rr = random.Random(9)
    for _ in range(90):
        x, y = rr.randrange(W), rr.randrange(H)
        d.line([(x, y), (x + rr.randrange(-1, 2), y + rr.randrange(6, 20))], fill=(34, 20, 12))
    return img


def draw_item(d, i, t, W_=72, H_=46):
    """draw item i into a 72x46 area (local origin top-left)."""
    if i == 0:   # net
        d.line([(10, 44), (44, 14)], fill=(150, 100, 52), width=3)
        d.line([(10, 44), (44, 14)], fill=(196, 146, 82), width=1)
        bag = [(34, 12), (30, 30), (50, 42), (60, 30), (56, 12)]
        d.polygon(bag, fill=(150, 176, 160), outline=(210, 220, 200))
        for k in range(4):
            d.line([(34 + k * 6, 12), (32 + k * 6 + (k - 1.5) * 2, 36)], fill=(110, 140, 124))
        for yy in (18, 24, 30):
            d.line([(32, yy), (58, yy)], fill=(110, 140, 124))
        d.ellipse([30, 6, 60, 18], outline=(220, 224, 230), width=2)
        d.point((36, 8), fill=(255, 255, 255))
    elif i == 1:   # aspirator jar
        d.rectangle([24, 14, 50, 40], fill=(120, 184, 200), outline=(210, 240, 250))
        d.rectangle([26, 18, 32, 38], fill=(180, 228, 238))
        d.rectangle([22, 8, 52, 14], fill=(150, 98, 52), outline=(82, 50, 22))
        d.line([(30, 8), (30, 2), (14, 2), (10, 12)], fill=(60, 60, 70), width=2)
        d.line([(44, 8), (44, 0), (62, 4), (66, 18)], fill=(60, 60, 70), width=2)
        mini_beetle(d, 38, 34, (40, 24, 14), 1.3)
        d.ellipse([34, 24, 40, 28], fill=(60, 130, 60))
        d.line([(44, 30), (47, 27)], fill=(30, 40, 20))
        d.point((46, 20), fill=(255, 255, 255))
    elif i == 2:   # magnifier
        d.line([(16, 44), (34, 28)], fill=(120, 76, 36), width=4)
        d.line([(16, 44), (34, 28)], fill=(176, 120, 60), width=1)
        d.ellipse([28, 2, 62, 36], fill=(150, 200, 190), outline=(210, 180, 70), width=3)
        stag_beetle(d, 47, 20, 0.2, t * 6, 0.3)
        d.arc([33, 6, 57, 30], 200, 260, fill=(255, 255, 255), width=2)
        gl = int(sstep(0, 1, (t * 0.7) % 1) * 20)
        d.point((32 + gl, 8 + gl // 2), fill=(255, 255, 255))
    elif i == 3:   # field notebook
        d.rectangle([14, 6, 58, 42], fill=(112, 64, 30), outline=(52, 28, 12))
        d.rectangle([18, 8, 22, 40], fill=(86, 46, 20))
        d.rectangle([24, 10, 54, 38], fill=(224, 208, 164), outline=(160, 140, 96))
        for yy in range(14, 36, 4):
            d.line([(27, yy), (50 - (yy % 3) * 4, yy)], fill=(120, 100, 70))
        d.ellipse([42, 24, 50, 34], fill=(70, 130, 60))
        d.line([(46, 24), (46, 36)], fill=(40, 80, 30))
        d.rectangle([56, 18, 60, 30], fill=(190, 50, 40))
        d.line([(10, 40), (40, 10)], fill=(240, 200, 60), width=2)
        d.point((40, 10), fill=(60, 60, 60))
    elif i == 4:   # headlamp
        d.arc([8, 4, 52, 44], 190, 350, fill=(60, 60, 70), width=3)
        d.rectangle([22, 14, 40, 26], fill=(70, 74, 86), outline=(150, 156, 170))
        d.ellipse([27, 16, 36, 25], fill=(255, 244, 190), outline=(200, 180, 80))
        d.polygon([(38, 20), (70, 8), (70, 34)], fill=(70, 62, 30))
        d.polygon([(38, 20), (62, 12), (62, 30)], fill=(120, 108, 50))
        d.rectangle([24, 28, 38, 32], fill=(50, 54, 64))
    elif i == 5:   # UV lamp
        pulse = 0.6 + 0.4 * math.sin(t * 6)
        d.rectangle([24, 38, 48, 44], fill=(50, 50, 60), outline=(100, 100, 120))
        d.rectangle([34, 12, 38, 38], fill=(60, 60, 70))
        d.rectangle([28, 4, 44, 14], fill=(int(150 + 90 * pulse), int(100 + 60 * pulse), 255), outline=(110, 70, 200))
        for k in range(4):
            a = k * 0.8 + t * 1.5
            moth(d, 36 + math.cos(a) * 24, 10 + math.sin(a) * 8, 0.28, t * 20 + k, a + 1.57, k % 2)
    elif i == 6:   # spreading board with butterfly
        d.polygon([(4, 30), (68, 30), (62, 44), (10, 44)], fill=(170, 124, 70), outline=(90, 58, 26))
        d.rectangle([32, 24, 40, 34], fill=(70, 44, 22))
        for dx in (-1, 1):
            d.rectangle([36 + dx * 6 - (6 if dx < 0 else -1) , 26, 36 + dx * 6 + (0 if dx < 0 else 7), 29], fill=(246, 244, 236))
        morpho(d, 36, 22, 0.42, 0.0, 0.0)
        d.point((36, 6), fill=(230, 230, 230))
        for px, py in ((24, 20), (48, 20), (36, 30)):
            d.ellipse([px - 1, py - 1, px + 1, py + 1], fill=(220, 220, 220))
        d.rectangle([14, 36, 22, 40], fill=(246, 244, 236))
        d.text((14, 33), "", fill=(0, 0, 0))
    elif i == 7:   # terrarium with a mantis
        d.rectangle([8, 4, 64, 42], fill=(36, 66, 70), outline=(180, 220, 230), width=1)
        d.rectangle([9, 32, 63, 41], fill=(86, 58, 32))
        for x in range(10, 62, 4):
            d.point((x, 34 + (x % 3)), fill=(120, 84, 48))
        d.line([(14, 40), (30, 22), (52, 16)], fill=(102, 66, 34), width=3)
        for (x, y) in ((16, 30), (22, 36), (58, 34), (54, 28)):
            d.polygon([(x, y), (x + 4, y - 8), (x + 8, y)], fill=(54, 140, 60), outline=(30, 90, 40))
        mantis(d, 38, 20, 0.5, t * 1.5)
        d.rectangle([10, 5, 62, 7], fill=(255, 230, 150))
        d.line([(12, 8), (14, 38)], fill=(210, 240, 250))


def slot_surface(i, t, k):
    sw, sh = 72, 62
    surf = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    d = ImageDraw.Draw(surf)
    d.rectangle([0, 0, sw - 1, sh - 1], fill=(26, 52, 40, 255), outline=(206, 164, 76, 255))
    d.rectangle([2, 2, sw - 3, sh - 3], outline=(110, 84, 34, 255))
    for cx, cy in ((3, 3), (sw - 4, 3), (3, sh - 4), (sw - 4, sh - 4)):
        d.point((cx, cy), fill=(255, 224, 120, 255))
    inner = Image.new("RGBA", (72, 46), (0, 0, 0, 0))
    draw_item(ImageDraw.Draw(inner), i, t)
    surf.alpha_composite(inner, (0, 3))
    d.rectangle([4, sh - 15, sw - 5, sh - 4], fill=(222, 198, 146, 255), outline=(110, 80, 40, 255))
    txt(d, sw / 2, sh - 9, EQUIP[i], (60, 36, 18, 255), 7, "b", anchor="mm")
    return surf


def scene4(ctx, lt):
    ctx.img.paste(wood_bg())
    d = ctx.d
    # brass header
    d.rectangle([0, 11, W, 25], fill=(30, 18, 10))
    d.line([(0, 25), (W, 25)], fill=(206, 164, 76))
    txt(d, W / 2, 18, "ПОЛЕВОЙ НАБОР НАТУРАЛИСТА", (236, 200, 110), 8, "b", anchor="mm", shadow=(20, 10, 4))
    for i in range(8):
        t0 = ITEM_TIMES[i] - S4
        if lt < t0:
            continue
        k = ease_back((lt - t0) / 0.55)
        surf = slot_surface(i, lt, k)
        col, row = i % 4, i // 4
        cx = 10 + col * 76 + 36
        cy = 29 + row * 69 + 31
        sc = max(0.05, k)
        sz = (max(1, int(72 * sc)), max(1, int(62 * sc)))
        s2 = surf.resize(sz, Image.NEAREST)
        ctx.img.paste(s2, (int(cx - sz[0] / 2), int(cy - sz[1] / 2)), s2)
        if 0 < lt - t0 < 0.5:    # little pop sparks
            r = random.Random(i)
            for _ in range(8):
                a = r.uniform(0, 6.28)
                rd = (lt - t0) * 90 * r.uniform(0.4, 1)
                d.point((cx + math.cos(a) * rd, cy + math.sin(a) * rd), fill=(255, 230, 140))
    # sweeping glint across all slots at the end
    if lt > 9.4:
        gx = (lt - 9.4) / 2.4 * (W + 80) - 40
        for x in range(int(gx) - 6, int(gx) + 6):
            if 0 <= x < W:
                for y in range(28, 160):
                    if (x + y) % 2 == 0 and abs((x - gx)) < 5:
                        p = ctx.img.getpixel((x, y))
                        ctx.img.putpixel((x, y), tuple(min(255, c + 60) for c in p))
    ctx.flush()
    arr = np.asarray(ctx.img).astype(np.float32)
    vg = np.clip(1 - (((XX - W / 2) / (W * 0.8)) ** 2 + ((YY - H / 2) / (H * 1.0)) ** 2) * 0.8, 0.35, 1)
    ctx.img = Image.fromarray(np.clip(np.floor(arr * vg[..., None] + BAY[..., None]), 0, 255).astype(np.uint8))
    ctx.d = ImageDraw.Draw(ctx.img)


# ================================================================== SCENE 5
@lru_cache(None)
def height_map():
    r = np.random.RandomState(21)
    h = np.zeros((H, W), np.float32)
    for gw, gh, wgt in ((4, 3, 1.0), (8, 5, 0.6), (16, 10, 0.35), (32, 20, 0.2), (64, 40, 0.1)):
        g = (r.rand(gh, gw) * 255).astype(np.uint8)
        h += np.asarray(Image.fromarray(g).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255 * wgt
    h /= (1.0 + 0.6 + 0.35 + 0.2 + 0.1)
    d = np.sqrt(((XX - W / 2) / (W * 0.55)) ** 2 + ((YY - H / 2) / (H * 0.55)) ** 2)
    h = h * 1.0 - d * 0.55 + 0.30
    return h


SEA_LEVEL = 0.22


@lru_cache(None)
def map_base():
    h = height_map()
    land = h > SEA_LEVEL
    img = np.zeros((H, W, 3), np.float32)
    # sea
    sea = np.array([112, 150, 150], np.float32) * (0.9 + 0.2 * np.clip(h + 0.4, 0, 1))[..., None]
    img[:] = sea
    wave = ((XX + YY * 2) % 7 == 0) & (np.sin(XX * 0.2 + YY * 0.13) > 0.4)
    img[wave & ~land] += 22
    # coastal shelf lines
    pil_land = Image.fromarray((land * 255).astype(np.uint8))
    for k, (sz, a) in enumerate(((7, 26), (13, 14))):
        dil = np.asarray(pil_land.filter(ImageFilter.MaxFilter(sz))) > 0
        img[dil & ~land] += a * 0.5
    # land by elevation
    lowc, midc, highc = np.array([222, 204, 150], np.float32), np.array([196, 174, 112], np.float32), np.array([164, 140, 92], np.float32)
    t = np.clip((h - SEA_LEVEL) / 0.45, 0, 1)[..., None]
    col = np.where(t < 0.5, lowc + (midc - lowc) * (t / 0.5), midc + (highc - midc) * ((t - 0.5) / 0.5))
    q = np.floor(col / 255 * 9 + BAY[..., None]) / 9 * 255
    img[land] = q[land]
    # coast outline
    edge = land & ~(np.asarray(pil_land.filter(ImageFilter.MinFilter(3))) > 0)
    img[edge] = (74, 52, 30)
    base = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(base)
    r = random.Random(7)
    # forests, mountains
    for _ in range(900):
        x, y = r.randrange(6, W - 6), r.randrange(14, H - 14)
        if not land[y, x]:
            continue
        hv = h[y, x]
        if hv > 0.56 and r.random() < 0.5:
            d.polygon([(x - 4, y + 3), (x, y - 5), (x + 4, y + 3)], fill=(150, 124, 86), outline=(74, 52, 30))
            d.polygon([(x, y - 5), (x + 4, y + 3), (x + 1, y + 3)], fill=(110, 88, 58))
            d.point((x, y - 4), fill=(250, 246, 236))
        elif 0.3 < hv < 0.56 and r.random() < 0.55:
            c = r.choice([(70, 112, 56), (54, 96, 48), (88, 124, 60)])
            d.polygon([(x - 2, y + 2), (x, y - 4), (x + 2, y + 2)], fill=c, outline=(36, 62, 30))
            d.point((x, y + 3), fill=(70, 46, 24))
    # rivers
    hh = h
    for sx, sy in ((150, 70), (210, 100), (110, 110), (190, 60)):
        x, y = sx, sy
        pts = []
        for _ in range(120):
            pts.append((x, y))
            best, bx_, by_ = hh[y, x], x, y
            for dx in (-2, -1, 0, 1, 2):
                for dy in (-2, -1, 0, 1, 2):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < W and 0 <= ny < H and hh[ny, nx] < best:
                        best, bx_, by_ = hh[ny, nx], nx, ny
            if (bx_, by_) == (x, y) or hh[y, x] < SEA_LEVEL:
                break
            x, y = bx_, by_
            if r.random() < 0.3:
                x += r.choice([-1, 1])
                x = max(1, min(W - 2, x))
        if len(pts) > 2:
            d.line(pts, fill=(70, 120, 150), width=1)
    # lat/long grid
    for gx in range(20, W, 40):
        for y in range(0, H, 4):
            d.point((gx, y), fill=(92, 66, 40))
    for gy in range(20, H, 40):
        for x in range(0, W, 4):
            d.point((x, gy), fill=(92, 66, 40))
    # parchment margin & frame
    d.rectangle([0, 0, W - 1, 9], fill=(214, 190, 138))
    d.rectangle([0, H - 10, W - 1, H - 1], fill=(214, 190, 138))
    d.rectangle([0, 0, 5, H - 1], fill=(214, 190, 138))
    d.rectangle([W - 6, 0, W - 1, H - 1], fill=(214, 190, 138))
    d.rectangle([6, 10, W - 7, H - 11], outline=(60, 40, 24))
    d.rectangle([8, 12, W - 9, H - 13], outline=(120, 86, 48))
    for cx, cy in ((6, 10), (W - 7, 10), (6, H - 11), (W - 7, H - 11)):
        d.rectangle([cx - 2, cy - 2, cx + 2, cy + 2], fill=(190, 120, 40), outline=(60, 40, 24))
    # parchment stains
    rs = np.random.RandomState(4)
    a = np.asarray(base).astype(np.float32)
    stain = np.asarray(Image.fromarray((rs.rand(12, 16) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
    a *= (0.88 + 0.16 * stain)[..., None]
    return Image.fromarray(np.clip(np.floor(a + BAY[..., None]), 0, 255).astype(np.uint8))


@lru_cache(None)
def pin_spots():
    h = height_map()
    r = random.Random(3)
    targets = [(70, 66), (98, 128), (214, 54), (252, 108), (158, 92)]
    out = []
    for tx, ty in targets:
        best = None
        for _ in range(500):
            x, y = int(tx + r.gauss(0, 14)), int(ty + r.gauss(0, 12))
            if 30 < x < W - 30 and 30 < y < H - 30 and h[y, x] > SEA_LEVEL + 0.07:
                best = (x, y)
                break
        out.append(best or (tx, ty))
    return out


PINS = [("Lucanus cervus", "Подмосковье · 12.07", (200, 50, 40)),
        ("Papilio machaon", "Крым · 03.06", (50, 110, 220)),
        ("Sphinx ligustri", "Алтай · 21.07", (130, 70, 200)),
        ("Mantis religiosa", "Кубань · 15.08", (56, 150, 56)),
        ("Parnassius apollo", "Карпаты · 28.06", (236, 150, 30))]


def draw_pin(d, x, y, col, s=1.0):
    d.polygon([(x - 4 * s, y - 9 * s), (x + 4 * s, y - 9 * s), (x, y)], fill=col, outline=(30, 16, 8))
    d.ellipse([x - 5 * s, y - 15 * s, x + 5 * s, y - 5 * s], fill=col, outline=(30, 16, 8))
    d.ellipse([x - 2 * s, y - 12 * s, x + 2 * s * 0.4, y - 8 * s], fill=shade(col, 1.6))
    d.point((x - 2 * s, y - 12 * s), fill=(255, 255, 255))


def scene5(ctx, lt):
    cam_s = 1.0 + 0.03 * math.sin(lt * 0.3)
    ctx.img.paste(map_base())
    d = ctx.d
    spots = pin_spots()
    # route (grows)
    nshown = sum(1 for tt in PIN_TIMES if lt >= tt - S5)
    for i in range(1, nshown):
        x0, y0 = spots[i - 1]
        x1, y1 = spots[i]
        prog = clamp((lt - (PIN_TIMES[i] - S5) + 0.2) / 0.9)
        n = 40
        for k in range(int(n * prog)):
            if k % 3:
                continue
            tt = k / n
            x = lerp(x0, x1, tt)
            y = lerp(y0, y1, tt) - math.sin(tt * math.pi) * 8
            d.rectangle([x, y, x + 1, y + 1], fill=(120, 30, 20))
    # pins
    for i, (x, y) in enumerate(spots):
        t0 = PIN_TIMES[i] - S5
        if lt < t0:
            continue
        e = lt - t0
        drop = max(0.0, 1 - e / 0.5)
        yo = -drop ** 2 * 60 - abs(math.sin(e * 9)) * 5 * max(0.0, 1 - e / 0.8) * (1 if e > 0.5 else 0)
        # ripple
        if e < 1.2:
            rr = e * 28
            for a in range(0, 360, 12):
                px, py = x + math.cos(math.radians(a)) * rr, y + math.sin(math.radians(a)) * rr * 0.55
                d.point((px, py), fill=PINS[i][2])
        d.ellipse([x - 4, y - 1, x + 4, y + 2], fill=(90, 70, 50))
        draw_pin(d, x, y + yo, PINS[i][2])
    # callout labels (only the freshest stay open)
    for i, (x, y) in enumerate(spots):
        t0 = PIN_TIMES[i] - S5 + 0.5
        e = lt - t0
        if e < 0:
            continue
        last = (i == len(spots) - 1) or lt < PIN_TIMES[i + 1] - S5 + 0.5
        k = ease_out(e / 0.4)
        if not last:
            k *= clamp(1 - (lt - (PIN_TIMES[i + 1] - S5 + 0.5)) / 0.3)
        if k <= 0.02:
            continue
        latin, place, col = PINS[i]
        w, hgt = 92, 22
        right = x < W / 2
        bx = x + 9 if right else x - 9 - w
        by = max(16, min(H - 40, y - 32))
        ww = int(w * k)
        if not right:
            bx = x - 9 - ww
        d.rectangle([bx + 1, by + 1, bx + ww + 1, by + hgt + 1], fill=(70, 50, 30))
        d.rectangle([bx, by, bx + ww, by + hgt], fill=(244, 228, 186), outline=(60, 40, 24))
        d.rectangle([bx, by, bx + 3, by + hgt], fill=col)
        if k > 0.9:
            txt(d, bx + 7, by + 2, latin, (50, 28, 14), 8, "i")
            txt(d, bx + 7, by + 12, place, (110, 70, 40), 7, "r")
    # title plate
    d.rectangle([14, 15, 100, 30], fill=(60, 40, 24), outline=(206, 164, 76))
    txt(d, 57, 23, "КАРТА НАХОДОК", (244, 220, 150), 8, "b", anchor="mm")
    # legend
    d.rectangle([14, 130, 74, 158], fill=(238, 220, 172), outline=(60, 40, 24))
    for j, (nm, c) in enumerate((("жуки", (200, 50, 40)), ("бабочки", (50, 110, 220)), ("прочие", (56, 150, 56)))):
        draw_pin(d, 22 + 0, 147 + (j - 1) * 0, c, 0.5) if False else None
    for j, (nm, c) in enumerate((("жуки", (200, 50, 40)), ("бабочки", (50, 110, 220)), ("прочие", (56, 150, 56)))):
        d.ellipse([19, 135 + j * 8, 24, 140 + j * 8], fill=c, outline=(30, 16, 8))
        txt(d, 29, 133 + j * 8, nm, (60, 36, 18), 7, "b")
    # compass rose spins in
    ang = (1 - ease_out(lt / 2.0)) * 3.14
    ccx, ccy = 282, 144
    if lt > 0:
        for a0, L, col in ((0, 18, (150, 30, 24)), (math.pi / 2, 18, (60, 40, 24)), (math.pi, 18, (60, 40, 24)), (-math.pi / 2, 18, (60, 40, 24)),
                           (math.pi / 4, 10, (150, 110, 60)), (3 * math.pi / 4, 10, (150, 110, 60)), (-math.pi / 4, 10, (150, 110, 60)), (-3 * math.pi / 4, 10, (150, 110, 60))):
            a = a0 + ang - math.pi / 2
            tip = (ccx + math.cos(a) * L, ccy + math.sin(a) * L)
            l = (ccx + math.cos(a + 1.57) * 3.4, ccy + math.sin(a + 1.57) * 3.4)
            rgt = (ccx + math.cos(a - 1.57) * 3.4, ccy + math.sin(a - 1.57) * 3.4)
            d.polygon([tip, l, rgt], fill=col, outline=(40, 24, 12))
        d.ellipse([ccx - 21, ccy - 21, ccx + 21, ccy + 21], outline=(60, 40, 24))
        txt(d, ccx, ccy - 28 + 0, "N", (60, 36, 18), 8, "b", anchor="mm")
    # scale bar
    d.line([(236, 158), (264, 158)], fill=(60, 40, 24), width=2)
    for x in (236, 250, 264):
        d.line([(x, 155), (x, 160)], fill=(60, 40, 24))
    ctx.flush()
    arr = np.asarray(ctx.img).astype(np.float32)
    vg = np.clip(1 - (((XX - W / 2) / (W * 0.85)) ** 2 + ((YY - H / 2) / (H * 1.1)) ** 2) * 0.7, 0.4, 1)
    ctx.img = Image.fromarray(np.clip(np.floor(arr * vg[..., None] + BAY[..., None]), 0, 255).astype(np.uint8))
    ctx.d = ImageDraw.Draw(ctx.img)


# ---------------------------------------------------------------- icons
UI_BG = (22, 30, 38)
UI_PANEL = (30, 42, 52)
UI_LINE = (68, 96, 108)
UI_GREEN = (120, 220, 130)
UI_GOLD = (240, 200, 90)
UI_TEXT = (214, 228, 214)
UI_DIM = (130, 156, 150)


def icon_beetle(d, x, y, c=(214, 228, 214)):
    d.ellipse([x + 1, y + 2, x + 6, y + 7], fill=c)
    d.rectangle([x + 2, y, x + 5, y + 2], fill=c)
    for dy in (2, 4, 6):
        d.point((x, y + dy), fill=c)
        d.point((x + 7, y + dy), fill=c)


def icon_butterfly(d, x, y, c=(214, 228, 214)):
    d.polygon([(x + 4, y + 3), (x, y), (x, y + 4), (x + 3, y + 5)], fill=c)
    d.polygon([(x + 4, y + 3), (x + 8, y), (x + 8, y + 4), (x + 5, y + 5)], fill=c)
    d.polygon([(x + 3, y + 5), (x + 1, y + 8), (x + 4, y + 7)], fill=c)
    d.polygon([(x + 5, y + 5), (x + 7, y + 8), (x + 4, y + 7)], fill=c)


def icon_mantis(d, x, y, c=(214, 228, 214)):
    d.line([(x + 1, y + 7), (x + 3, y + 3), (x + 6, y + 1)], fill=c, width=1)
    d.line([(x + 6, y + 1), (x + 7, y + 4), (x + 5, y + 5)], fill=c)
    d.point((x + 7, y), fill=c)


def icon_spider(d, x, y, c=(214, 228, 214)):
    d.ellipse([x + 2, y + 2, x + 5, y + 5], fill=c)
    for dy in (1, 3, 5, 7):
        d.line([(x + 3, y + 3), (x, y + dy - 1)], fill=c)
        d.line([(x + 4, y + 3), (x + 7, y + dy - 1)], fill=c)


def icon_pin(d, x, y, c=(214, 228, 214)):
    d.ellipse([x + 1, y, x + 6, y + 5], fill=c)
    d.polygon([(x + 1, y + 4), (x + 6, y + 4), (x + 3.5, y + 8)], fill=c)
    d.point((x + 3, y + 2), fill=UI_BG)


def icon_flask(d, x, y, c=(214, 228, 214)):
    d.rectangle([x + 3, y, x + 4, y + 3], fill=c)
    d.polygon([(x + 3, y + 3), (x + 4, y + 3), (x + 7, y + 8), (x, y + 8)], fill=c)


def icon_eye(d, x, y, c=(214, 228, 214)):
    d.ellipse([x, y + 1, x + 7, y + 6], outline=c)
    d.rectangle([x + 3, y + 3, x + 4, y + 4], fill=c)


def icon_heart(d, x, y, c=(236, 80, 96), s=1.0):
    d.ellipse([x, y, x + 3 * s, y + 3 * s], fill=c)
    d.ellipse([x + 3 * s, y, x + 6 * s, y + 3 * s], fill=c)
    d.polygon([(x, y + 2 * s), (x + 6 * s, y + 2 * s), (x + 3 * s, y + 6 * s)], fill=c)


def icon_bubble(d, x, y, c=UI_DIM):
    d.rectangle([x, y, x + 8, y + 5], outline=c)
    d.polygon([(x + 2, y + 5), (x + 2, y + 8), (x + 5, y + 5)], fill=c)


def icon_cam(d, x, y, c=UI_DIM):
    d.rectangle([x, y + 2, x + 8, y + 7], outline=c)
    d.rectangle([x + 2, y, x + 5, y + 2], fill=c)
    d.ellipse([x + 2, y + 3, x + 6, y + 6], outline=c)


# ================================================================== SCENE 7
@lru_cache(None)
def logo_assets():
    f = font("b", 19)
    tmp = Image.new("L", (160, 34), 0)
    d = ImageDraw.Draw(tmp)
    d.fontmode = "1"
    d.text((0, 0), "Flora0world", font=f, fill=255)
    bb = tmp.getbbox()
    tmp = tmp.crop(bb).resize(((bb[2] - bb[0]) * 2, (bb[3] - bb[1]) * 2), Image.NEAREST)
    w, h = tmp.size
    big = Image.new("L", (W, H), 0)
    ox, oy = (W - w) // 2, 40
    big.paste(tmp, (ox, oy))
    mask = np.asarray(big) > 0
    outline = np.asarray(big.filter(ImageFilter.MaxFilter(5))) > 0
    return mask, outline, (ox, oy, w, h)


@lru_cache(None)
def logo_targets():
    mask, _, _ = logo_assets()
    ys, xs = np.nonzero(mask)
    r = np.random.RandomState(12)
    idx = r.choice(len(xs), 700, replace=False)
    return [(int(xs[i]), int(ys[i])) for i in idx]


def scene7(ctx, lt):
    cam = lt * 3
    forest_bg(ctx, lt, cam, mist=0.3)
    d = ctx.d
    mask, outline, (ox, oy, lw, lh) = logo_assets()
    settle = sstep(1.0, 4.8, lt)           # particles converge 74..77.8
    solid = sstep(4.3, 5.2, lt)
    hit = lt - (LOGO_HIT - S7)
    fireflies(ctx, lt, cam, 1.0)
    # particles
    r = random.Random(50)
    tg = logo_targets()
    for i, (tx, ty) in enumerate(tg):
        sx, sy = r.uniform(0, W), r.uniform(H * 0.5, H + 20)
        dl = r.uniform(0, 0.4)
        k = ease_out(clamp((settle - dl) / (1 - dl)))
        wob = (1 - k) * 12
        x = lerp(sx, tx, k) + math.sin(lt * 2 + i) * wob
        y = lerp(sy, ty, k) + math.cos(lt * 2.3 + i * 1.3) * wob
        if solid < 1:
            c = (int(220 * (0.5 + 0.5 * math.sin(lt * 5 + i))), 255, 120)
            d.point((x, y), fill=c)
            if i % 18 == 0:
                ctx.glow(x, y, 8, (150, 230, 90), 0.8)
    # logo body
    if solid > 0:
        ctx.flush()
        arr = np.asarray(ctx.img).astype(np.float32)
        arrf = arr.copy()
        ol = outline & ~mask
        sh = np.roll(np.roll(mask, 2, 0), 2, 1) & ~mask & ~ol
        yy = (YY - oy) / max(1, lh)
        top, bot = np.array([200, 255, 150], np.float32), np.array([40, 160, 90], np.float32)
        fillc = top[None, None] * (1 - yy[..., None]) + bot[None, None] * yy[..., None]
        sweep = (hit * 160 - 80)
        band = np.abs((XX + YY * 0.6) - sweep) < 7
        fillc = np.where(band[..., None], np.minimum(255, fillc + 70), fillc)
        scan = (YY - oy) % 4 == 0
        fillc = np.where(scan[..., None], fillc * 0.88, fillc)
        k = solid
        arrf[ol] = arr[ol] * (1 - k) + np.array([14, 40, 30]) * k
        arrf[sh] = arr[sh] * (1 - k) + np.array([4, 12, 10]) * k
        arrf[mask] = arr[mask] * (1 - k) + fillc[mask] * k
        ctx.img = Image.fromarray(np.clip(arrf, 0, 255).astype(np.uint8))
        ctx.d = ImageDraw.Draw(ctx.img)
        d = ctx.d
        ctx.glow(W / 2, oy + lh / 2, 120, (60, 200, 110), 0.5 * solid)
    # flash on hit
    if 0 <= hit < 0.5:
        ctx.glow(W / 2, oy + lh / 2, 170, (230, 255, 220), 1.0 - hit * 2)
    # butterfly crosses after reveal
    if lt > 5.0:
        k = (lt - 5.0) / 5.0
        bx = lerp(-30, W + 30, k)
        by = 24 + math.sin(k * 7) * 14
        ctx.glow(bx, by, 40, (80, 150, 255), 0.4)
        for j in range(10):
            tt = max(0.0, k - j * 0.012)
            tx = lerp(-30, W + 30, tt)
            ty = 24 + math.sin(tt * 7) * 14
            d.point((tx - 10 + j * 0.5, ty + 4 + j * 0.4), fill=(120, 190, 255) if j % 2 else (220, 240, 255))
        morpho(d, bx, by, 0.5, lt * 14, math.pi / 2 - 0.3 * math.cos(k * 7))
    # HUB badge + tagline
    if lt > 5.5:
        e = ease_back((lt - 5.5) / 0.5)
        bw, bh = 56 * e, 20 * e
        bcx, bcy = W / 2, oy + lh + 16
        d.rectangle([bcx - bw / 2 + 2, bcy - bh / 2 + 2, bcx + bw / 2 + 2, bcy + bh / 2 + 2], fill=(4, 10, 8))
        d.rectangle([bcx - bw / 2, bcy - bh / 2, bcx + bw / 2, bcy + bh / 2], fill=(236, 190, 70), outline=(110, 70, 20))
        if e > 0.95:
            txt(d, bcx, bcy, "HUB", (50, 28, 8), 14, "b", anchor="mm")
            icon_beetle(d, bcx - 56, bcy - 4, (236, 190, 70))
            icon_butterfly(d, bcx + 48, bcy - 4, (236, 190, 70))
    ctx.flush()
    d = ctx.d
    if lt > 7.0:
        a = sstep(7.0, 7.6, lt)
        txt(d, W / 2, 127, "СООБЩЕСТВО ЭНТОМОЛОГОВ · НАТУРАЛИСТОВ · КИПЕРОВ", shade((220, 236, 200), a), 8, "b", anchor="mm", shadow=shade((6, 14, 12), a))
    chips = [("МЕСТА ЛОВЛИ", icon_pin), ("ДАТЫ ПОИМКИ", icon_flask), ("НАБЛЮДЕНИЯ", icon_eye)]
    for i, (nm, ic) in enumerate(chips):
        t0 = 8.3 + i * 0.45
        if lt < t0:
            continue
        a = sstep(t0, t0 + 0.4, lt)
        cx = 56 + i * 104
        wch = 90
        d.rectangle([cx - wch / 2, 138, cx + wch / 2, 150], fill=shade((18, 40, 34), a), outline=shade((120, 220, 130), a))
        ic(d, cx - wch / 2 + 5, 141, shade((120, 220, 130), a))
        txt(d, cx + 6, 144, nm, shade((220, 240, 220), a), 7, "b", anchor="mm")


# ================================================================ PIPELINE
SCENES = [(S1, S2, scene1), (S2, S3A, scene2), (S3A, S3B, scene3a), (S3B, S4, scene3b),
          (S4, S5, scene4), (S5, S7, scene5), (S7, DUR, scene7)]
TRANS = {S2: ("dissolve", 0.9), S3A: ("dissolve", 0.8), S3B: ("iris", 1.0), S4: ("wipey", 0.9),
         S5: ("wipex", 0.9), S7: ("dissolve", 1.2)}


def render_scene(t):
    for a, b, fn in SCENES:
        if a <= t < b or (b == DUR and t >= a):
            ctx = Ctx()
            fn(ctx, t - a)
            ctx.flush()
            return np.asarray(ctx.img).astype(np.float32)
    raise ValueError


def scene_at(t, idx):
    a, b, fn = SCENES[idx]
    ctx = Ctx()
    fn(ctx, t - a)
    ctx.flush()
    return np.asarray(ctx.img).astype(np.float32)


def render(t):
    idx = max(i for i, (a, b, fn) in enumerate(SCENES) if t >= a) if t >= 0 else 0
    arr = None
    for i in range(1, len(SCENES)):
        bt = SCENES[i][0]
        if bt in TRANS:
            kind, dur = TRANS[bt]
            if bt - dur / 2 <= t < bt + dur / 2:
                p = (t - (bt - dur / 2)) / dur
                A, B = scene_at(t, i - 1), scene_at(t, i)
                if kind == "dissolve":
                    m = BAY < p
                elif kind == "wipey":
                    m = (YY / H * 0.8 + BAY * 0.2) < p
                elif kind == "wipex":
                    m = (XX / W * 0.8 + BAY * 0.2) < p
                else:  # iris
                    rr = p * 190
                    m = np.sqrt((XX - W / 2) ** 2 + (YY - H / 2) ** 2) < rr
                arr = np.where(m[..., None], B, A)
                break
    if arr is None:
        arr = render_scene(t)
    # global letterbox + fades
    f = clamp(t / 1.0) * clamp((DUR - t) / 1.6)
    if f < 1:
        arr = np.floor(arr * f + BAY[..., None] * (f > 0))
    arr = np.clip(arr, 0, 255)
    # film grain
    g = np.random.RandomState(int(t * FPS) % 997).randint(-3, 4, (H, W, 1))
    arr = np.clip(arr + g, 0, 255)
    arr[:10] = 0
    arr[H - 10:] = 0
    return arr.astype(np.uint8)


def _work(i):
    return render(i / FPS).tobytes()


def render_video(out):
    from multiprocessing import Pool
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-vf", f"scale={W * SCALE}:{H * SCALE}:flags=neighbor", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = DUR * FPS
    with Pool(os.cpu_count() or 2) as pool:
        for k, buf in enumerate(pool.imap(_work, range(n), chunksize=4)):
            p.stdin.write(buf)
            if k % 120 == 0:
                print(f"frame {k}/{n}", flush=True)
    p.stdin.close()
    p.wait()


if __name__ == "__main__":
    if sys.argv[1] == "still":
        t = float(sys.argv[2])
        im = Image.fromarray(render(t)).resize((W * SCALE, H * SCALE), Image.NEAREST)
        im.save(sys.argv[3])
    elif sys.argv[1] == "render":
        render_video(sys.argv[2])
