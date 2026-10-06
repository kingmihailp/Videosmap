# Draws the pixel-art game icon (32x32, scaled with nearest neighbour) -> desktop/build/icon.png + icon.ico
from PIL import Image
import os
P = {'.': None, 'k': '#1a1226', 'o': '#f08a24', 'y': '#ffd23c', 'b': '#2a8ae0', 'w': '#fff4d8', 'n': '#14100c', 's': '#101a3a', 'c': '#1c2c5a'}
left = [
"................",
"................",
"...kkk..........",
"..kooyk.........",
".kooyoook.......",
".koyyoooook.....",
".kooyoooooook...",
"..kooooooyyook..",
"..kkoooooyyoook.",
"...kkbbooooook..",
"....kbbbkooook..",
"....kbbbbkkkk...",
".....kbbbbk.....",
".....kkbbk......",
"......kkk.......",
"................",
]
body = ["nn", "nn", "nn", "nn", "nn", "nn", "nn", "nn", "nn", "nn", "nn", "nn", "nn", "nn", "nn", "nn"]
S = 32
img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
px = img.load()
def col(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4)) + (255,)
for y in range(S):                                   # night-sky tile with a few stars
    for x in range(S):
        t = y / S; px[x, y] = (int(16 + 20 * t), int(20 + 30 * t), int(58 + 30 * t), 255)
for (x, y) in [(3, 3), (27, 5), (6, 26), (28, 25), (15, 2), (22, 29), (2, 14)]: px[x, y] = col('#fff4d8')
for y in range(16):
    for x in range(16):
        c = P[left[y][x]]
        if c: px[x + 0, y + 8] = col(c); px[S - 1 - x, y + 8] = col(c)
for y in range(7, 24):                               # body and antennae
    px[15, y] = px[16, y] = col('#14100c')
for (x, y) in [(14, 6), (13, 5), (17, 6), (18, 5)]: px[x, y] = col('#14100c')
os.makedirs('build', exist_ok=True)
big = img.resize((256, 256), Image.NEAREST)
big.save('build/icon.png')
big.save('build/icon.ico', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
