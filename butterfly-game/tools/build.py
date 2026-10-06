"""Builds the single-file game: Flora0world_Butterflies.html (three.js + all sources inlined)."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
ORDER = ["assets_gen.js", "data.js", "species_more.js", "species_ocean.js", "util.js", "batch.js", "font.js", "keys.js", "art.js", "aberr.js", "econ.js", "nets.js", "audio.js", "chalet.js", "world.js", "ocean.js", "net.js", "remotes.js", "play.js", "screens.js", "chat.js", "spread.js", "boxes.js", "cabinet.js", "market.js", "room.js", "main.js", "touch.js"]
src = os.path.join(ROOT, "src")
parts = []
for name in ORDER:
    p = os.path.join(src, name)
    if os.path.exists(p):
        parts.append(f"// ===== {name} =====\n" + open(p, encoding="utf-8").read())
game = "\n".join(parts)
three = open(os.path.join(ROOT, "vendor", "three.min.js"), encoding="utf-8").read()
tpl = open(os.path.join(src, "index.template.html"), encoding="utf-8").read()
out = tpl.replace("/*__THREE__*/", three.replace("</script", "<\\/script")).replace("/*__GAME__*/", game.replace("</script", "<\\/script"))
dst = os.path.join(ROOT, "Flora0world_Butterflies.html")
open(dst, "w", encoding="utf-8").write(out)
print("built", dst, len(out) // 1024, "KB")
