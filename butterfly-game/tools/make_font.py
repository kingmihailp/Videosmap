# subset DejaVu Sans Bold (Latin + Cyrillic + the symbols the game uses) -> src/font_ttf.js (base64 woff)
import base64, io, os
from fontTools import subset
from fontTools.ttLib import TTFont
SRC = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chars = [chr(c) for c in range(0x20, 0x7f)] + [chr(c) for c in range(0x400, 0x460)] + list("—–·…×→←↑↓♥✓•°«»№’“”±≈½©★▪✕›‹▲▼")
opts = subset.Options(); opts.flavor = "woff"; opts.layout_features = ["kern"]; opts.hinting = False; opts.notdef_outline = True
font = TTFont(SRC); ss = subset.Subsetter(opts); ss.populate(text="".join(chars)); ss.subset(font)
buf = io.BytesIO(); opts.flavor = "woff"; font.flavor = "woff"; font.save(buf)
b64 = base64.b64encode(buf.getvalue()).decode()
open(os.path.join(ROOT, "src", "font_ttf.js"), "w").write('const FONT_TTF = "data:font/woff;base64,' + b64 + '";\n')
print("font bytes", len(buf.getvalue()))
