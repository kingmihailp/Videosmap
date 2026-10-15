# Moth species data (night fauna of a location) — specification for the data files

Each location gets exactly **31 species of NOCTURNAL moths (Heterocera)**, real, biologically accurate, living in that location's region.
Output file: `tools/moths/data/<biome id>.json` = a JSON array of 31 objects (valid JSON, UTF-8, Cyrillic as is).

## Rules
* Species must really occur in the location's region and really be active at night (nocturnal / crepuscular; attracted to light is a plus). No day-flying moths (no burnets/Zygaena, no hummingbird hawk-moth Macroglossum stellatarum, no Urania ripheus by day, etc.) and no butterflies.
* **Variety of forms is required**: use at least 10 different `shape` values among the 31 species (see the list), real families (hawk-moths, giant silk moths, owlets/noctuids, geometers, tiger moths, prominents, eggars, tussock moths, hooktips, swallowtail moths, plume moths, ghost/swift moths, pyralids, clearwing-free etc.), from tiny (wingspan ~15 mm) to giant (up to ~250 mm where such species live there). Mix common and rare ones.
* All species names (Latin binomial) must be unique across the WHOLE game: the other 11 locations get their own lists. To avoid clashes prefer species whose range is centred in YOUR location's region; do NOT use pan-tropical / cosmopolitan migrants (Agrius convolvuli, Acherontia atropos, Hyles lineata, Autographa gamma, Noctua pronuba, Spodoptera spp., Ascalapha odorata, Manduca sexta, Hyles euphorbiae, Deilephila elpenor, Eumorpha spp. outside the Americas...) unless they are really typical for your region AND you are the only one who can claim them: when in doubt choose another species.
* Rarity `rar`: 1 = common (about 14 species), 2 = uncommon (about 11), 3 = rare / local / spectacular (about 6).
* Wingspan `lo`/`hi` in millimetres (real range of the species, hi > lo, integers).
* Russian text: natural, literate; if there is no established Russian name, give a descriptive or transliterated name (e.g. «Совка …», «Пяденица …»). English: the established common name (or a faithful descriptive one). Only ASCII letters, digits and these symbols in English texts: — · … × ° ’ – no accented letters.
* Keep `hab`, `range`, `host`, `fact` short (the game draws them in small panels): hab <= 70 chars, range <= 70, host <= 60, fact <= 140 chars (one or two short sentences, a real interesting fact). Give both Russian and English.

## Fields of one object
```
{ "la": "Deilephila elpenor",            // Latin binomial (unique, correct spelling)
  "ru": "Винная бражница", "en": "Elephant hawk-moth",
  "fam": "Бражники",                      // Russian family name (Бражники, Павлиноглазки, Совки, Пяденицы, Медведицы, Хохлатки, Коконопряды, Волнянки, Серпокрылки, Урании, Пальцекрылки, Тонкопряды, Древоточцы, Огнёвки, Шелкопряды, Листовёртки, Рогохвосты...)
  "lo": 55, "hi": 70, "rar": 1,
  "beh": "moth",                          // flight style: "moth" (fast, erratic), "hawkm" (very fast hovering hawk-moths), "giant" (large slow-flapping silk moths), "rester" (geometers/prominents: fast but rests often on bark/leaves)
  "shape": "hawk",                        // one of the forms below
  "tail": "none",                         // "none" | "short" | "long" | "two"  (only shapes luna, comet, urania can have tails)
  "f": ["#8a9a4a", "#c8587a"],            // forewing colours: [near the body, towards the tip]  (hex)
  "h": ["#c85a7a", "#e8a0b0"],            // hindwing colours: [near the body, towards the edge]
  "opts": { ... },                        // pattern, see below (only the options that this species really needs)
  "hab": "...", "hab_en": "...", "range": "...", "range_en": "...", "host": "...", "host_en": "...", "fact": "...", "fact_en": "..." }
```
## Shapes (art form of the wings)
hawk (narrow pointed forewing, tiny hindwing: Sphingidae), hawkb (broad-winged hawk-moths: Smerinthus, Laothoe), saturn (big round wings with eyespots: Saturniidae, Automeris, Saturnia), atlas (huge, forewing tips hooked: Attacus, Coscinocera), falcate (hook-tip moths Drepanidae, Thyatiridae-like sickle wings), luna (Actias: swallow-tail hindwings; use tail "long"), comet (Argema/Copiopteryx: extremely long tails; tail "long"), noctuid (typical owlets: Noctuidae), underwing (owlets with a big bright hindwing: Catocala, Ophiusa, Eudocima, Erebidae), geometer (broad thin wings, scalloped margin: Geometridae), tiger (rounded wings, bright: Erebidae-Arctiinae), eggar (stout broad: Lasiocampidae, Lymantriidae tussock moths), prominent (slim: Notodontidae), urania (slim forewing, tailed hindwing: Uraniidae, Sematuridae; tail "short"/"long"/"two"), plume (wings split into feathers: Pterophoridae), ghost (long narrow equal wings: Hepialidae, Cossidae), delta (small triangular: Pyralidae, Crambidae, Erebidae-Herminiinae), silk (stubby, falcate fore: Bombycidae, Eupterotidae, Endromidae), burnet (narrow oval: only for slim forms like Zygaenidae-like Syntomidae, Ctenuchinae, Sesiidae-like — nocturnal ones only).
## Colours and patterns (`opts`) — every key optional; colours hex "#rrggbb"
Wing coordinates: u = along the wing from the body (0) to the tip/edge (1); v = from the front edge (0, top) to the rear edge (1) inside the wing box. `wings` is "f" (fore), "h" (hind) or "fh".
* `edge: ["#hex", w]` margin line colour and width in pixels (1-3). `dots: "#hex"` pale dots along the margin (fringe). `veins: "#hex"` veins.
* `band: ["fh", u0, u1, "#hex"]` a cross band (u0..u1). `tip: ["#hex", u0]` darkened/coloured forewing apex beyond u0 (0.7-0.9).
* `sp: [["f", u, v, r, "#hex"], ...]` round spots (r radius in px, 1-3), `eye: [["h", u, v, r, "#ring", "#centre"], ...]` eyespots (r 3-7), `patch: ["f", u, v, r, "#hex"]` one big patch.
* `zz: ["#hex", n, "fh"]` n wavy cross lines (typical for owlets and geometers), `noise: ["#hex", d]` cryptic speckles with density d 0.05-0.25 (bark-like moths), `bars: ["#hex", n]` oblique forewing stripes, `wedges: ["#hex", n]` dark forewing wedge marks, `sheen: ["#hex", k]` shiny glow (0-1), `arc: ["h", "#hex"]` one curved line, `rays: ["f", "#hex"]`, `checker: ["#hex1","#hex2"]` (rarely).
Choose colours after the real species (cryptic greys/browns with zig-zag lines for owlets; green for emeralds; pink and olive for the elephant hawk-moth; red hindwings with black bands for red underwings, etc.). Stay faithful to real appearance as far as the options allow.

## Example (two rows of the Russian meadow)
```
{"la":"Deilephila elpenor","ru":"Винная бражница","en":"Elephant hawk-moth","fam":"Бражники","lo":50,"hi":65,"rar":1,"beh":"hawkm","shape":"hawk","tail":"none","f":["#a8a848","#d8607a"],"h":["#c84a6a","#e890a8"],"opts":{"edge":["#7a3a48",1],"bars":["#e8d8b0",2],"dots":"#f0e8d0"},
 "hab":"Луга, опушки, сады, берега рек","hab_en":"Meadows, forest edges, gardens, river banks","range":"Вся Евразия до Японии","range_en":"All Eurasia to Japan","host":"иван-чай, подмаренник, виноград","host_en":"rosebay willowherb, bedstraw, grape","fact":"Гусеница похожа на маленький хобот слона, а ночью бабочка зависает у цветков, как колибри.","fact_en":"The caterpillar looks like a small elephant's trunk; at night the moth hovers at flowers like a hummingbird."},
{"la":"Catocala nupta","ru":"Орденская лента красная","en":"Red underwing","fam":"Эребиды","lo":70,"hi":80,"rar":2,"beh":"rester","shape":"underwing","tail":"none","f":["#7a7a78","#58585a"],"h":["#d8301c","#b01c14"],"opts":{"edge":["#2a2a2c",1],"zz":["#2a2a2c",3,"f"],"noise":["#3a3a3c",0.12],"band":["h",0.45,0.62,"#1a1214"],"dots":"#d8d0c0"},
 "hab":"Ивняки, опушки и парки у воды","hab_en":"Willow thickets, edges and parks near water","range":"Европа, Западная Азия","range_en":"Europe, Western Asia","host":"ивы, тополя","host_en":"willows, poplars","fact":"Днём сливается с корой, а при испуге вспыхивает красными задними крыльями.","fact_en":"By day it blends into bark and when startled flashes its red hindwings."}
```
