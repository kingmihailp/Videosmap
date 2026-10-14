"""Steam store graphics from steam/_src (made by tools/test/steam_art_src.js) and steam/screenshots -> steam/capsules"""
import os, math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'steam'); SRC = os.path.join(ROOT, '_src'); OUT = os.path.join(ROOT, 'capsules')
os.makedirs(OUT, exist_ok=True)
ld = lambda n: Image.open(os.path.join(SRC, n)).convert('RGBA')
def pano(n, scale):  # nearest-neighbour upscale keeps the pixels crisp
    im = ld('pano_' + n + '.png'); return im.resize((im.width * scale, im.height * scale), Image.NEAREST)
def trim(im):
    return im.crop(im.getbbox())
LOGO = trim(ld('logo.png'))
BF = {n[3:-4]: ld(n) for n in os.listdir(SRC) if n.startswith('bf_')}
def cover(im, w, h, fx=0.5, fy=0.5):
    s = max(w / im.width, h / im.height); im = im.resize((math.ceil(im.width * s), math.ceil(im.height * s)), Image.NEAREST)
    x = int((im.width - w) * fx); y = int((im.height - h) * fy); return im.crop((x, y, x + w, y + h))
def logo_on(img, width, cx, cy):
    s = max(1, round(width / LOGO.width)); lg = LOGO.resize((LOGO.width * s, LOGO.height * s), Image.NEAREST)
    # soft dark glow so the logo reads on any background
    a = lg.split()[3].filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(5)); glow = Image.new('RGBA', lg.size, (0, 0, 0, 0)); glow.putalpha(a.point(lambda v: int(v * 0.6)))
    img.alpha_composite(glow, (int(cx - lg.width / 2), int(cy - lg.height / 2))); img.alpha_composite(lg, (int(cx - lg.width / 2), int(cy - lg.height / 2))); return img
def butterflies(img, items, size):  # items: (name, x, y, angle, scale)
    for n, x, y, ang, k in items:
        if n not in BF: continue
        b = BF[n].resize((int(80 * k * size), int(40 * k * size)), Image.NEAREST).rotate(ang + 90, expand=True, resample=Image.NEAREST)
        img.alpha_composite(b, (int(x - b.width / 2), int(y - b.height / 2)))
    return img
def save(img, name, jpg=False):
    img = img.convert('RGB'); p = os.path.join(OUT, name); img.save(p, quality=95) if jpg else img.save(p); print(name, img.size)

# header capsule 460x215, small 231x87, main 616x353, vertical 374x448 (store); 600x900 capsule, 3840x1240 hero, 1438x810 background (library / page)
def capsule(w, h, scene, logo_w, ly, bfs=(), size=None):
    sc = size or max(1, w // 460); img = cover(pano(scene, 8 if w > 700 else 4), w, h, 0.5, 0.78).convert('RGBA')
    g = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
    for y in range(h): d.line([(0, y), (w, y)], fill=(0, 12, 24, int(150 * (y / h) ** 2)))
    img.alpha_composite(g); butterflies(img, [(n, x * w, y * h, a, k) for n, x, y, a, k in bfs], max(1, w / 460)); return logo_on(img, logo_w, w / 2, ly * h)
B1 = [('papilio_machaon', 0.12, 0.30, -30, 0.6), ('ornithoptera_alexandrae', 0.86, 0.62, 25, 0.9), ('aglais_io', 0.72, 0.18, 10, 0.5)]
save(capsule(460, 215, 'alps', 360, 0.42, B1), 'header_460x215.png')
save(capsule(231, 87, 'alps', 190, 0.5, [('ornithoptera_alexandrae', 0.88, 0.65, 25, 0.45)]), 'small_231x87.png')
save(capsule(616, 353, 'japan', 480, 0.40, B1), 'main_616x353.png')
save(capsule(374, 448, 'alps', 330, 0.30, [('papilio_machaon', 0.2, 0.62, -20, 0.8), ('ornithoptera_alexandrae', 0.78, 0.78, 30, 1.0), ('aglais_io', 0.7, 0.52, 10, 0.5)]), 'vertical_374x448.png')
save(capsule(600, 900, 'japan', 520, 0.30, [('papilio_machaon', 0.2, 0.55, -20, 1.3), ('ornithoptera_alexandrae', 0.75, 0.72, 30, 1.6), ('aglais_io', 0.7, 0.45, 10, 0.9), ('gonepteryx_rhamni', 0.3, 0.82, 40, 0.9)]), 'library_capsule_600x900.png')
# hero: panorama only (the logo is a separate file)
hero = cover(pano('amazon', 8), 3840, 1240, 0.5, 0.55).convert('RGBA'); save(hero, 'library_hero_3840x1240.png')
lg = logo_on(Image.new('RGBA', (1280, 720), (0, 0, 0, 0)), 1200, 640, 360); lg = lg.crop(lg.getbbox()); lg.save(os.path.join(OUT, 'library_logo_transparent.png')); print('library_logo_transparent.png', lg.size)
save(cover(pano('chihuahua', 6), 1438, 810, 0.5, 0.6), 'page_background_1438x810.png')
# community / client icon 184x184 (jpg) from the app icon
ic = Image.open(os.path.join(ROOT, '..', 'desktop', 'build', 'icon.png')).convert('RGBA'); ic = ic.resize((184, 184), Image.NEAREST); save(ic, 'icon_184x184.jpg', jpg=True)
