const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3950 + Math.floor(Math.random() * 40), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const open = async name => { const pg = await browser.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message)); await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${name}&biome=russia`); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(400); } await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; }); return pg; };
  const A = await open('Alice'), B = await open('Bob'); await A.waitForTimeout(1000);
  await A.keyboard.press('KeyT'); await A.waitForTimeout(200); ok(await A.evaluate(() => Chat.open), 'T opens the chat line');
  const pos0 = await A.evaluate(() => F0W.play.player.pos.x); await A.keyboard.down('KeyW'); await A.waitForTimeout(300); await A.keyboard.up('KeyW');
  await A.keyboard.type('Hello Bob, privet!'); await A.waitForTimeout(200); await A.screenshot({ path: '/tmp/chat_typing.png' });
  console.log('typed WASD moved?', await A.evaluate(() => [...F0W.inp.keys]));
  await A.keyboard.press('Enter'); await A.waitForTimeout(800); ok(!(await A.evaluate(() => Chat.open)), 'Enter closes the line');
  const got = await B.evaluate(() => Net.chat.map(m => m.name + ': ' + m.text)); ok(got.length === 1 && got[0] === 'Alice: wHello Bob, privet!', 'Bob received ' + JSON.stringify(got)); await B.screenshot({ path: '/tmp/chat_bob.png' });
  await B.keyboard.press('KeyT'); await B.keyboard.type('abc'); await B.keyboard.press('Escape'); await B.waitForTimeout(200); ok(!(await B.evaluate(() => Chat.open)) && (await B.evaluate(() => Net.chat.length)) === 1, 'Esc cancels without sending');
  await browser.close(); srv.kill();
  // offline: T only shows a hint
  const b2 = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] }); const pg = await b2.newPage({ viewport: { width: 960, height: 540 } });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia'); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play))) break; await pg.waitForTimeout(300); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; }); await pg.keyboard.press('KeyT'); await pg.waitForTimeout(300); console.log('offline:', await pg.evaluate(() => ({ open: Chat.open, toast: F0W.play.toasts.map(t => t.text) })));
  await b2.close();
})();
