"""Draws the pixel-art game icon on a 64x64 grid (butterfly over a moonlit night garden) -> desktop/build/icon.png (256), icon_512.png, icon.ico.
Run from the repo root or from anywhere: python3 tools/make_icon.py"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import math, os, random
S = 64
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'desktop', 'build'); os.makedirs(OUT, exist_ok=True)
def C(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
random.seed(7)
img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); px = img.load()
# ---------------------------------------------------------------- night sky tile
top, mid, low = C('#0c1030'), C('#1d2a66'), C('#3a4a8a')
for y in range(S):
    t = y / (S - 1); c = mix(top, mid, t / 0.6) if t < 0.6 else mix(mid, low, (t - 0.6) / 0.4)
    for x in range(S):
        d = ((x + y) % 2) * 3 if 0.25 < t < 0.9 else 0            # ordered dither gives the sky its pixel texture
        px[x, y] = (c[0] + d, c[1] + d, c[2] + d * 2, 255)
# moon with glow rings and craters (top right)
mx, my, mr = 32, 9, 6
for y in range(S):
    for x in range(S):
        d = math.hypot(x - mx, y - my)
        if d <= mr: px[x, y] = C('#fff6d8') + (255,)
        elif d <= mr + 3 and (x + y) % 2 == 0: px[x, y] = C('#5a6aa8') + (255,)
        elif d <= mr + 6 and (x + y) % 3 == 0: px[x, y] = C('#3c4c8c') + (255,)
for (x, y) in [(30, 8), (34, 12), (33, 6), (29, 11)]: px[x, y] = C('#e2d6a8') + (255,)
# stars, a few as little crosses
for (x, y) in [(5, 5), (14, 3), (24, 8), (38, 4), (6, 20), (59, 28), (3, 33), (60, 44), (20, 2), (44, 5)]: px[x, y] = C('#fff4d8') + (255,)
for (x, y) in [(9, 11), (57, 36), (33, 6)]:
    for dx, dy in [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]: px[x + dx, y + dy] = C('#fff4d8' if (dx, dy) == (0, 0) else '#9aa6d8') + (255,)
# ---------------------------------------------------------------- garden at the bottom: grass blades and two flowers
g1, g2, g3 = C('#12301f'), C('#1e5a34'), C('#3a8a4a')
for x in range(S):
    h = 4 + int(2 * math.sin(x * 0.5) + 2 * math.sin(x * 0.23 + 1)); h = max(2, h)
    for k in range(h):
        y = S - 1 - k; px[x, y] = (g3 if k == h - 1 else g2 if k > h // 2 else g1) + (255,)
for (fx, base, col, ctr) in [(9, 50, '#ff6a8a', '#ffd23c'), (56, 53, '#ffb04a', '#fff4d8')]:
    for y in range(base, S - 3): px[fx, y] = g2 + (255,)
    for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0), (-1, -1), (1, -1), (-1, 1), (1, 1)]: px[fx + dx, base + dy] = C(col) + (255,)
    px[fx, base] = C(ctr) + (255,)
    px[fx - 1, base + 5] = px[fx + 1, base + 7] = g3 + (255,)
# ---------------------------------------------------------------- the butterfly (left half drawn, then mirrored); axis between x=31 and x=32
def poly_mask(pts):
    m = Image.new('L', (S, S), 0); ImageDraw.Draw(m).polygon(pts, fill=255); return m
fore = [(30, 27), (27, 19), (22, 12), (15, 7), (8, 6), (3, 8), (2, 13), (4, 20), (10, 27), (18, 31), (27, 32)]
hind = [(30, 33), (22, 34), (14, 38), (9, 44), (9, 51), (13, 55), (11, 60), (18, 57), (24, 52), (28, 45), (30, 40)]
O1, O2, O3 = C('#ffd84a'), C('#f59a22'), C('#d4601a')
K, BR = C('#1a1226'), C('#5a2a10')
def erode(m, n):
    for _ in range(n): m = m.filter(ImageFilter.MinFilter(3))
    return m
wing = Image.new('RGBA', (S, S), (0, 0, 0, 0)); wp = wing.load()
for name, pts, base in (('fore', fore, (30, 30)), ('hind', hind, (30, 35))):
    m = poly_mask(pts); inner = erode(m, 3); core = erode(m, 1); mp, ip, cp = m.load(), inner.load(), core.load()
    far = max(math.hypot(x - base[0], y - base[1]) for x, y in pts)
    for y in range(S):
        for x in range(S):
            if not mp[x, y]: continue
            if not cp[x, y]: wp[x, y] = K + (255,); continue                       # 1px outline
            if not ip[x, y]:                                                        # dark margin band with a row of pale spots
                wp[x, y] = (C('#fff4d8') if (x + y) % 4 == 0 else K) + (255,); continue
            t = min(1, math.hypot(x - base[0], y - base[1]) / far); c = mix(O1, O2, t / 0.55) if t < 0.55 else mix(O2, O3, (t - 0.55) / 0.45)
            if (x + y) % 2 and 0.3 < t < 0.8: c = mix(c, O1, 0.18)                  # dither between the shades
            wp[x, y] = c + (255,)
d = ImageDraw.Draw(wing)
for (x0, y0, x1, y1) in [(30, 30, 6, 10), (30, 30, 3, 16), (30, 30, 6, 24), (30, 30, 16, 30), (30, 30, 24, 14),          # forewing veins
                         (30, 35, 11, 44), (30, 36, 12, 52), (30, 37, 20, 55), (30, 36, 20, 38)]:                         # hindwing veins
    n = max(abs(x1 - x0), abs(y1 - y0))
    for i in range(n + 1):
        x = round(x0 + (x1 - x0) * i / n); y = round(y0 + (y1 - y0) * i / n)
        if 0 <= x < S and 0 <= y < S and wp[x, y][3] and wp[x, y][:3] not in (K, C('#fff4d8')) and i > 2: wp[x, y] = mix(wp[x, y][:3], BR, 0.7) + (255,)
# blue lunules and an eyespot on the hindwing, a pale cell spot on the forewing
for (cx, cy, rx, ry) in [(13, 47, 2, 3), (16, 52, 2, 2), (11, 41, 2, 2)]:
    for y in range(cy - ry, cy + ry + 1):
        for x in range(cx - rx, cx + rx + 1):
            if ((x - cx) / (rx + .5)) ** 2 + ((y - cy) / (ry + .5)) ** 2 <= 1: wp[x, y] = C('#2a8ae0' if (x + y) % 3 else '#6ad0ff') + (255,)
for (x, y) in [(20, 20), (21, 20), (20, 21), (21, 21)]: wp[x, y] = C('#fff4d8') + (255,)
for (x, y) in [(10, 14), (11, 14), (10, 15), (11, 15)]: wp[x, y] = C('#fff0a0') + (255,)
for y in range(S):                                                                   # soft light on the upper edge of the wings
    for x in range(S):
        if wp[x, y][3] and wp[x, y][:3] not in (K, C('#fff4d8')) and y > 0 and not wp[x, y - 1][3]: pass
mirror = wing.transpose(Image.FLIP_LEFT_RIGHT)
img.alpha_composite(wing); img.alpha_composite(mirror)
# body: head, thorax, striped abdomen, antennae with clubs
P = img.load()
def dot(x, y, c): P[x, y] = C(c) + (255,)
for y in range(24, 30):                                                              # thorax (2 px wide, slightly fuzzy)
    for x in (30, 31, 32, 33): dot(x, y, '#2a1d38' if x in (31, 32) else '#14100c')
for y in range(30, 47):                                                              # abdomen
    w = 2 if y < 40 else 1
    for x in range(32 - w - 0, 32 + w - 0 + (0)): pass
    for x in (31, 32): dot(x, y, '#2a1d38' if (y % 3) else '#9a7a50')
    if y < 41: dot(30, y, '#14100c'); dot(33, y, '#14100c')
for (x, y) in [(31, 47), (32, 47)]: dot(x, y, '#14100c')
for x, y in [(30, 22), (31, 22), (32, 22), (33, 22), (30, 21), (33, 21), (31, 23), (32, 23)]: dot(x, y, '#14100c')      # head
dot(30, 22, '#fff4d8'); dot(33, 22, '#fff4d8')                                      # eyes
for (x, y) in [(31, 24), (32, 24)]: dot(x, y, '#5a4a6a')                            # shoulder highlight
for (pts, club) in [([(30, 21), (29, 19), (28, 17), (27, 15), (26, 14)], (25, 13)), ([(33, 21), (34, 19), (35, 17), (36, 15), (37, 14)], (38, 13))]:
    for (x, y) in pts: dot(x, y, '#14100c')
    dot(club[0], club[1], '#14100c'); dot(club[0], club[1] + 1, '#14100c'); dot(club[0] + (1 if club[0] < 32 else -1), club[1], '#14100c')
# sparkle trail: little glints around the wings
for (x, y) in [(2, 24), (60, 26), (6, 58), (58, 59)]:
    for dx, dy, c in [(0, 0, '#fff4d8'), (1, 0, '#c8d4ff'), (-1, 0, '#c8d4ff'), (0, 1, '#c8d4ff'), (0, -1, '#c8d4ff')]: dot(x + dx, y + dy, c)
# ---------------------------------------------------------------- rounded tile with a double frame
mask = Image.new('L', (S, S), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=9, fill=255)
fr = Image.new('RGBA', (S, S), (0, 0, 0, 0)); fd = ImageDraw.Draw(fr)
fd.rounded_rectangle([0, 0, S - 1, S - 1], radius=9, outline=C('#0a0618') + (255,), width=1)
fd.rounded_rectangle([1, 1, S - 2, S - 2], radius=8, outline=C('#e8b84a') + (255,), width=1)
fd.rounded_rectangle([2, 2, S - 3, S - 3], radius=7, outline=C('#7a5a28') + (255,), width=1)
img.alpha_composite(fr); img.putalpha(ImageChops.multiply(img.getchannel('A'), mask))
img.save(os.path.join(OUT, 'icon_64.png'))
big = img.resize((256, 256), Image.NEAREST); big.save(os.path.join(OUT, 'icon.png'))
img.resize((512, 512), Image.NEAREST).save(os.path.join(OUT, 'icon_512.png'))
smalls = {s: (img.resize((s, s), Image.NEAREST) if s % 64 == 0 or s >= 128 else img.resize((s, s), Image.LANCZOS)) for s in (16, 24, 32, 48, 64, 128, 256)}
smalls[256].save(os.path.join(OUT, 'icon.ico'), sizes=[(s, s) for s in smalls], append_images=[smalls[s] for s in smalls if s != 256])
print('icons written to', os.path.abspath(OUT))
