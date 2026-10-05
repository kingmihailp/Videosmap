const path = require('path'); const { spawn } = require('child_process'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const srv = spawn('node', ['server.js', '3101'], { cwd: path.resolve(__dirname, '../../server'), stdio: 'pipe' }); srv.stdout.on('data', d => process.stdout.write('[srv] ' + d)); await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await browser.newPage(); pg.on('pageerror', e => console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(0, 3).join('|'))); pg.on('console', m => console.log('[console]', m.text()));
  await pg.goto('http://localhost:3101/#debug&nolock&mp=Alice&biome=russia'); await pg.waitForTimeout(6000);
  console.log(await pg.evaluate(() => JSON.stringify({ screen: F0W.screen, on: Net.on, st: Net.status, ready: F0W.ready, play: !!F0W.play, loadText: F0W.loadText })));
  await browser.close(); srv.kill(); process.exit(0);
})();
