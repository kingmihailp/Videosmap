"""Validates tools/moths/data/<biome>.json files: python3 tools/moths/check.py [biome ...]  (all files when none given)"""
import json, os, re, sys, glob
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
SHAPES = set('hawk hawkb saturn atlas falcate luna comet noctuid underwing geometer tiger eggar prominent urania plume ghost delta silk burnet'.split())
BEH = {'moth', 'hawkm', 'giant', 'rester'}
ALLOWED = set(chr(c) for c in range(32, 127)) | set('—·…×°’–')
CY = re.compile('[А-Яа-яЁё]'); HEX = re.compile(r'^#[0-9a-fA-F]{6}$')
OPT_KEYS = {'edge', 'dots', 'veins', 'band', 'tip', 'sp', 'eye', 'patch', 'sheen', 'rays', 'arc', 'bars', 'wedges', 'checker', 'zz', 'noise'}
TXT = ['hab', 'range', 'host', 'fact']; LIM = {'hab': 70, 'range': 70, 'host': 60, 'fact': 140}
def check(path):
    bad = []; rows = json.load(open(path, encoding='utf-8'))
    if len(rows) != 31: bad.append(f'{len(rows)} rows, need 31')
    las = set()
    for i, r in enumerate(rows):
        w = f'[{i}] {r.get("la")}'
        for k in ['la', 'ru', 'en', 'fam', 'lo', 'hi', 'rar', 'beh', 'shape', 'tail', 'f', 'h', 'opts'] + TXT + [t + '_en' for t in TXT]:
            if k not in r: bad.append(f'{w}: missing {k}')
        if bad and bad[-1].startswith(w): continue
        if r['la'] in las: bad.append(f'{w}: duplicate inside the file')
        las.add(r['la'])
        if not re.match(r'^[A-Z][a-z]+ [a-z\-]+( [a-z\-]+)?$', r['la']): bad.append(f'{w}: bad Latin name')
        if r['shape'] not in SHAPES: bad.append(f'{w}: shape {r["shape"]}')
        if r['beh'] not in BEH: bad.append(f'{w}: beh {r["beh"]}')
        if r['tail'] not in ('none', 'short', 'long', 'two'): bad.append(f'{w}: tail')
        if r['tail'] != 'none' and r['shape'] not in ('luna', 'comet', 'urania'): bad.append(f'{w}: tail on a shape without tails')
        if not (isinstance(r['lo'], int) and isinstance(r['hi'], int) and 8 <= r['lo'] < r['hi'] <= 300): bad.append(f'{w}: lo/hi')
        if r['rar'] not in (1, 2, 3): bad.append(f'{w}: rar')
        for k in ('f', 'h'):
            if not (isinstance(r[k], list) and len(r[k]) == 2 and all(HEX.match(c) for c in r[k])): bad.append(f'{w}: colours {k}')
        if not set(r['opts']) <= OPT_KEYS: bad.append(f'{w}: unknown opts {set(r["opts"]) - OPT_KEYS}')
        for k in ('ru', 'fam') + tuple(TXT):
            if not CY.search(r[k]): bad.append(f'{w}: {k} must be Russian')
        for k in ['en'] + [t + '_en' for t in TXT]:
            if CY.search(r[k]) or set(r[k]) - ALLOWED: bad.append(f'{w}: {k} has non-allowed chars {set(r[k]) - ALLOWED}')
        for k in TXT:
            if len(r[k]) > LIM[k] or len(r[k + '_en']) > LIM[k] + 25: bad.append(f'{w}: {k} too long ({len(r[k])}/{len(r[k + "_en"])})')
    if len({r['shape'] for r in rows if 'shape' in r}) < 10: bad.append('fewer than 10 different shapes')
    rar = [r['rar'] for r in rows if 'rar' in r]
    if rar.count(3) < 4 or rar.count(1) < 10: bad.append(f'rarity mix {rar.count(1)}/{rar.count(2)}/{rar.count(3)}')
    return bad
if __name__ == '__main__':
    files = [os.path.join(D, b + '.json') for b in sys.argv[1:]] or sorted(glob.glob(os.path.join(D, '*.json')))
    ok = True
    for f in files:
        b = check(f); print(os.path.basename(f), 'OK' if not b else 'PROBLEMS'); [print('  ', x) for x in b[:40]]; ok &= not b
    sys.exit(0 if ok else 1)
