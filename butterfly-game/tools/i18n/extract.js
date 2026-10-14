// collects every Cyrillic string (literals + template pieces) of the game sources -> tools/i18n/keys.json,
// and the ready-made pairs (objects with both `ru` and `en`, e.g. species names) -> tools/i18n/auto.json
const acorn = require('/opt/node-tools/node_modules/acorn'), walk = require('/opt/node-tools/node_modules/acorn-walk'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'); const files = fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js') && f !== 'lang_en.js').map(f => path.join(ROOT, 'src', f)).concat([path.join(ROOT, 'server', 'server.js')]);
const CY = /[А-Яа-яЁё]/, keys = new Map(), auto = {};
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8'); let ast; try { ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true }); } catch (e) { console.error('parse fail', f, e.message); process.exit(1); }
  const add = (s, where) => { if (!CY.test(s)) return; const k = keys.get(s) || { n: 0, f: path.basename(f) }; k.n++; keys.set(s, k); };
  walk.full(ast, n => {
    if (n.type === 'Literal' && typeof n.value === 'string') add(n.value);
    else if (n.type === 'TemplateElement') add(n.value.cooked);
    else if (n.type === 'ObjectExpression') {
      const g = k => { const p = n.properties.find(p => p.type === 'Property' && !p.computed && ((p.key.name || p.key.value) === k)); return p && p.value.type === 'Literal' && typeof p.value.value === 'string' ? p.value.value : null; };
      const ru = g('ru'), en = g('en'); if (ru && en && CY.test(ru) && !CY.test(en)) auto[ru] = en;
    }
  });
}
const out = [...keys.keys()].filter(k => !(k in auto));
fs.writeFileSync(path.join(__dirname, 'keys.json'), JSON.stringify(out, null, 0)); fs.writeFileSync(path.join(__dirname, 'keys_files.json'), JSON.stringify(out.map(k => keys.get(k).f))); fs.writeFileSync(path.join(__dirname, 'auto.json'), JSON.stringify(auto, null, 0));
console.log('keys', out.length, 'chars', out.reduce((a, k) => a + k.length, 0), 'auto', Object.keys(auto).length);
