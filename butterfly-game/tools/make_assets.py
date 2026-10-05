"""Generates src/assets_gen.js: pixel font atlas (Latin + Cyrillic) and a pixel world-map land mask.

Land polygons: Natural Earth 110m (public domain). Font: DejaVu Sans Bold, rasterised at 4x and
box-downsampled + thresholded so every glyph is crisp pixel art.
Usage: python tools/make_assets.py
"""
import base64, io, json, math, os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "src", "assets_gen.js")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SIZES = [8, 10, 14, 22]
CHARS = [chr(c) for c in range(32, 127)] + [chr(c) for c in range(0x410, 0x450)] + ["Ё", "ё"] + list("—–·…×→←↑↓♥✓•°«»№’“”±≈½©★▪✕›")

# ---- font: Tiny5 (real pixel font, native 8px grid) rendered 1-bit, enlarged by whole numbers; extra symbols are hand-made bitmaps
F_CYR = os.path.join(HERE, "data", "fonts", "Tiny5-cyrillic.ttf")
F_LAT = os.path.join(HERE, "data", "fonts", "Tiny5-latin.ttf")
BASE = 8
SCALE = {8: 1, 10: 1, 14: 2, 22: 3}      # game text size -> pixel scale; size 10 uses the same grid as 8
ASC = {8: 7, 10: 8, 14: 14, 22: 21}
LH = {8: 11, 10: 14, 14: 19, 22: 30}
HAND = {   # char: (rows, y offset from baseline, advance)
    "→": (["..#..", "...#.", "#####", "...#.", "..#.."], -6, 7), "←": (["..#..", ".#...", "#####", ".#...", "..#.."], -6, 7),
    "♥": ([".#.#.", "#####", "#####", ".###.", "..#.."], -6, 7), "✓": (["....#", "...#.", "#.#..", ".#..."], -5, 7),
"★": (["..#..", "#####", ".###.", ".#.#.", "#...#"], -6, 7),
    "▪": (["###", "###", "###"], -4, 5), "✕": (["#...#", ".#.#.", "..#..", ".#.#.", "#...#"], -6, 7),
}

from fontTools.ttLib import TTFont
FONTS = [ImageFont.truetype(F_LAT, BASE), ImageFont.truetype(F_CYR, BASE)]
CMAPS = [TTFont(F_LAT).getBestCmap(), TTFont(F_CYR).getBestCmap()]

def base_glyph(ch):
    """1-bit bitmap of one glyph at the native grid: (PIL 'L' image or None, advance, xoff, yoff)."""
    if ch == "≈":
        return base_glyph("~")
    if ch in ("й", "Й"):   # the font draws this letter with both a breve and two dots: rebuild it as и/И + a one-row breve
        im, adv, xo, yo = base_glyph("и" if ch == "й" else "И"); out = Image.new("L", (im.width, im.height + 2), 0)
        out.paste(im, (0, 2)); out.putpixel((1, 0), 255); out.putpixel((2, 0), 255)
        return out, adv, xo, yo - 2
    if ch in HAND:
        rows, yo, adv = HAND[ch]; w = max(len(r) for r in rows); im = Image.new("L", (w, len(rows)), 0)
        for y, r in enumerate(rows):
            for x, c in enumerate(r):
                if c == "#": im.putpixel((x, y), 255)
        return im, adv, 0, yo
    font = FONTS[1] if ord(ch) in CMAPS[1] and ord(ch) not in CMAPS[0] else FONTS[0]
    adv = max(1, int(round(font.getlength(ch))))
    if ch == " ":
        return None, 3, 0, 0
    l, t, r, b = font.getbbox(ch, anchor="ls")
    pad = 4; w, h = int(r - l) + pad * 2 + 2, int(b - t) + pad * 2 + 2
    im = Image.new("L", (w, h), 0); d = ImageDraw.Draw(im); d.fontmode = "1"
    ox, oy = pad - int(l), pad - int(t)
    d.text((ox, oy), ch, font=font, fill=255, anchor="ls")
    bb = im.getbbox()
    if not bb:
        return None, adv, 0, 0
    return im.crop(bb), adv, bb[0] - ox, bb[1] - oy

def build_font():
    atlas = Image.new("RGBA", (1024, 256), (0, 0, 0, 0))
    meta = {}
    cx = cy = rowh = 0
    for size in SIZES:
        sc = SCALE[size]
        meta[size] = {"asc": ASC[size], "lh": LH[size], "g": {}}
        for ch in CHARS:
            img, adv, xo, yo = base_glyph(ch)
            if img is None:
                meta[size]["g"][ch] = [0, 0, 0, 0, adv * sc, 0, 0]
                continue
            if sc > 1:
                img = img.resize((img.width * sc, img.height * sc), Image.NEAREST)
            w, h = img.size
            if cx + w + 1 > 1024:
                cx, cy, rowh = 0, cy + rowh + 1, 0
            rgba = Image.new("RGBA", (w, h), (255, 255, 255, 0))
            rgba.putalpha(img.point(lambda v: 255 if v > 100 else 0))
            rgba.paste((255, 255, 255, 255), mask=rgba.split()[3])
            atlas.paste(rgba, (cx, cy))
            meta[size]["g"][ch] = [cx, cy, w, h, adv * sc, xo * sc, yo * sc]
            cx += w + 1
            rowh = max(rowh, h)
        cx, cy, rowh = 0, cy + rowh + 1, 0
    atlas = atlas.crop((0, 0, 1024, cy + 1))
    buf = io.BytesIO()
    atlas.save(buf, "PNG", optimize=True)
    return meta, "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

# ---- world map -------------------------------------------------------------
MAP_W, MAP_H = 200, 77
LAT_TOP, LAT_BOT = 80.0, -58.0
SS = 8

def build_map():
    gj = json.load(open(os.path.join(HERE, "data", "ne_110m_land.geojson")))
    big = Image.new("L", (MAP_W * SS, MAP_H * SS), 0)
    d = ImageDraw.Draw(big)
    def proj(lon, lat):
        return ((lon + 180) / 360 * MAP_W * SS, (LAT_TOP - lat) / (LAT_TOP - LAT_BOT) * MAP_H * SS)
    for feat in gj["features"]:
        g = feat["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            for i, ring in enumerate(poly):
                d.polygon([proj(x, y) for x, y in ring], fill=255 if i == 0 else 0)
    small = big.resize((MAP_W, MAP_H), Image.BOX).point(lambda v: 1 if v > 110 else 0)
    px = small.load()
    rows = []
    for y in range(MAP_H):
        bits = "".join(str(px[x, y]) for x in range(MAP_W))
        rows.append(bits)
    return rows

if __name__ == "__main__":
    meta, png = build_font()
    rows = build_map()
    with open(OUT, "w") as f:
        f.write("// GENERATED by tools/make_assets.py — do not edit\n")
        f.write("const FONT_META = " + json.dumps(meta, ensure_ascii=False) + ";\n")
        f.write("const FONT_PNG = " + json.dumps(png) + ";\n")
        f.write(f"const MAP_W = {MAP_W}, MAP_H = {MAP_H}, MAP_LAT_TOP = {LAT_TOP}, MAP_LAT_BOT = {LAT_BOT};\n")
        f.write("const MAP_ROWS = " + json.dumps(rows) + ";\n")
    print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB")
