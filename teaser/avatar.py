"""Flora0world: HUB community avatar — pixel art, 128x128 native, exported 512x512 (x4) and 1024x1024.

Usage: python avatar.py [out_dir]
Telegram crops avatars to a circle, so everything important sits inside the brass ring.
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import video as V

S = 128
BAY = np.tile(V.BAYER, (S // 4 + 1, S // 4 + 1))[:S, :S].astype(np.float32)
YY, XX = np.mgrid[0:S, 0:S]

F_GLYPH = ["#########",
           "###......",
           "###......",
           "###......",
           "#######..",
           "#######..",
           "###......",
           "###......",
           "###......",
           "###......"]
W_GLYPH = ["###.......###",
           "###.......###",
           "###...#...###",
           "###..###..###",
           "###..###..###",
           "###.#####.###",
           ".###.###.###.",
           ".####...####.",
           "..###...###..",
           "..##.....##.."]
CELL = 4


def glyph_mask(rows):
    m = Image.new("L", (len(rows[0]) * CELL, len(rows) * CELL), 0)
    d = ImageDraw.Draw(m)
    for y, row in enumerate(rows):
        for x, c in enumerate(row):
            if c == "#":
                d.rectangle([x * CELL, y * CELL, x * CELL + CELL - 1, y * CELL + CELL - 1], fill=255)
    return m


def glow(arr, x, y, r, col, k=1.0):
    x0, x1, y0, y1 = max(0, int(x - r)), min(S, int(x + r) + 1), max(0, int(y - r)), min(S, int(y + r) + 1)
    dd = np.sqrt((XX[y0:y1, x0:x1] - x) ** 2 + (YY[y0:y1, x0:x1] - y) ** 2) / r
    v = np.clip(1 - dd, 0, 1) ** 2 * k
    v = np.clip(np.floor(v * 6 + BAY[y0:y1, x0:x1]) / 6, 0, 1)
    arr[y0:y1, x0:x1] += v[..., None] * np.array(col, np.float32)


def build():
    # ---- 1. entomologist's map as the backdrop (same map as in the teaser)
    base = V.map_base().crop((104, 34, 104 + S, 34 + S)).copy()
    arr = np.asarray(base).astype(np.float32)
    # warm, slightly darkened parchment so the letters pop
    arr *= np.array([0.86, 0.80, 0.70], np.float32)
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)

    # ---- 2. route, pins, compass, specimens (all inside the circle)
    pins = [(30, 40, (200, 50, 40)), (100, 34, (50, 110, 220)), (106, 100, (236, 150, 30)), (22, 100, (56, 150, 56))]
    route = [(30, 40), (62, 22), (100, 34), (111, 66), (106, 100), (84, 112), (50, 108), (22, 100), (16, 66), (30, 40)]
    for (x0, y0), (x1, y1) in zip(route, route[1:]):
        n = 18
        for k in range(n):
            if k % 2:
                continue
            t = k / n
            d.rectangle([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, x0 + (x1 - x0) * t + 1, y0 + (y1 - y0) * t + 1], fill=(120, 30, 20))
    for x, y, c in pins:
        d.ellipse([x - 4, y - 1, x + 4, y + 2], fill=(70, 50, 30))
        V.draw_pin(d, x, y, c, 0.9)
    # compass rose (bottom centre)
    ccx, ccy = 50, 107
    d.ellipse([ccx - 11, ccy - 11, ccx + 11, ccy + 11], outline=(60, 40, 24))
    for a0, L, col in ((0, 10, (150, 30, 24)), (math.pi / 2, 10, (60, 40, 24)), (math.pi, 10, (60, 40, 24)), (-math.pi / 2, 10, (60, 40, 24)),
                       (math.pi / 4, 6, (150, 110, 60)), (3 * math.pi / 4, 6, (150, 110, 60)), (-math.pi / 4, 6, (150, 110, 60)), (-3 * math.pi / 4, 6, (150, 110, 60))):
        a = a0 - math.pi / 2
        tip = (ccx + math.cos(a) * L, ccy + math.sin(a) * L)
        l = (ccx + math.cos(a + 1.57) * 2.2, ccy + math.sin(a + 1.57) * 2.2)
        r = (ccx + math.cos(a - 1.57) * 2.2, ccy + math.sin(a - 1.57) * 2.2)
        d.polygon([tip, l, r], fill=col, outline=(40, 24, 12))

    # ---- 3. dark dithered band behind the letters for contrast
    band = np.zeros((S, S), np.float32)
    band[40:92] = np.clip(1 - np.abs(np.arange(40, 92) - 66)[:, None] / 28, 0, 1) * 0.85
    band_mask = Image.fromarray(((BAY < band) * 255).astype(np.uint8))
    img.paste((10, 22, 18), mask=band_mask)

    # ---- 4. the letters F and W (pixel glyphs, logo palette)
    fm, wm = glyph_mask(F_GLYPH), glyph_mask(W_GLYPH)
    gap = 5
    tw_ = fm.width + gap + wm.width
    ox, oy = (S - tw_) // 2, 46
    big = Image.new("L", (S, S), 0)
    big.paste(fm, (ox, oy))
    big.paste(wm, (ox + fm.width + gap, oy))
    mask = np.asarray(big) > 0
    outline = np.asarray(big.filter(ImageFilter.MaxFilter(5))) > 0
    shadow = np.roll(np.roll(mask, 3, 0), 3, 1) & ~mask
    a = np.asarray(img).astype(np.float32)
    yy = np.clip((YY - oy) / (len(F_GLYPH) * CELL), 0, 1)[..., None]
    top, bot = np.array([205, 255, 150], np.float32), np.array([40, 160, 90], np.float32)
    fill = top * (1 - yy) + bot * yy
    up = np.roll(np.roll(mask, 1, 0), 1, 1)
    dn = np.roll(np.roll(mask, -1, 0), -1, 1)
    fill = np.where((mask & ~up)[..., None], np.minimum(255, fill + 55), fill)   # bevel light (top/left)
    fill = np.where((mask & ~dn)[..., None], fill * 0.62, fill)                  # bevel dark (bottom/right)
    fill = np.where((((YY - oy) % CELL) == 0)[..., None] & mask[..., None], fill * 0.9, fill)
    a[shadow & ~outline] = a[shadow & ~outline] * 0.35
    a[outline & ~mask] = (14, 40, 30)
    a[mask] = fill[mask]
    glow(a, S / 2, oy + 20, 56, (40, 150, 90), 0.35)
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)

    # ---- 5. specimens: morpho above, stag beetle bottom right, fireflies
    V.morpho(d, 64, 25, 0.42, 0.25, 0.0)
    V.stag_beetle(d, 82, 106, 0.24, 0.9, ang=-0.25)
    a = np.asarray(img).astype(np.float32)
    glow(a, 64, 25, 26, (80, 150, 255), 0.3)
    rr = np.random.RandomState(5)
    for _ in range(9):
        x, y = rr.randint(14, 114), rr.randint(14, 114)
        if (x - 64) ** 2 + (y - 64) ** 2 < 54 ** 2 and not (40 < y < 92 and 18 < x < 110):
            glow(a, x, y, 6, (150, 220, 60), 0.9)
            a[y, x] = (240, 255, 150)
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)

    # ---- 6. brass ring + night vignette outside (circle-crop friendly)
    cx = cy = S / 2 - 0.5
    dist = np.sqrt((XX - cx) ** 2 + (YY - cy) ** 2)
    a = np.asarray(img).astype(np.float32)
    inner = np.clip(1 - np.clip((dist - 40) / 24, 0, 1) ** 2 * 0.45, 0, 1)    # soft vignette inside
    a *= inner[..., None]
    outside = dist > 61
    a[outside] = a[outside] * 0.28 * (0.6 + 0.4 * BAY[outside][:, None])
    ring_o = (dist > 59.5) & (dist <= 62.2)
    ring_i = (dist > 57.2) & (dist <= 59.5)
    a[ring_o] = (206, 164, 76)
    a[ring_o & (YY < cy - 20) & (XX < cx)] = (255, 226, 130)
    a[ring_o & (YY > cy + 20) & (XX > cx)] = (120, 84, 30)
    a[ring_i] = (40, 26, 12)
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    # brass studs on the ring, in the four diagonals
    for ang in (45, 135, 225, 315):
        px, py = cx + math.cos(math.radians(ang)) * 60.5, cy + math.sin(math.radians(ang)) * 60.5
        d.rectangle([px - 2, py - 2, px + 2, py + 2], fill=(255, 226, 130), outline=(90, 60, 20))
    return img


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    im = build()
    im.save(os.path.join(out, "avatar_native_128.png"))
    im.resize((512, 512), Image.NEAREST).save(os.path.join(out, "avatar_Flora0world_HUB_512.png"))
    im.resize((1024, 1024), Image.NEAREST).save(os.path.join(out, "avatar_Flora0world_HUB_1024.png"))
    print("saved")
