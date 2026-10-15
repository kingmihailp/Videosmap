"""python3 tools/moths/dups.py <biome>: lists species (Latin) and Russian names of data/<biome>.json that are already used by another location's file"""
import json, glob, os, sys
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data'); me = sys.argv[1]
la = {}; ru = {}
for f in glob.glob(os.path.join(D, '*.json')):
    b = os.path.basename(f)[:-5]
    if b == me: continue
    for r in json.load(open(f, encoding='utf-8')): la[r['la']] = b; ru[r['ru']] = b
bad = 0
for r in json.load(open(os.path.join(D, me + '.json'), encoding='utf-8')):
    if r['la'] in la: print('Latin name already used in', la[r['la']] + ':', r['la']); bad += 1
    if r['ru'] in ru: print('Russian name already used in', ru[r['ru']] + ':', r['ru'], '(', r['la'], ')'); bad += 1
print('CLEAN' if not bad else 'CLASHES')
