// pictures of the Chihuahuan Desert: node chi_view.js '<[["name", x, z, yaw, pitch, "js to run first"],...]>' [seed]   (x/z may be "pit" for the first pit's rim)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate(([seed]) => { Save.data.maps = { chihuahua: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('chihuahua', seed); }, [process.argv[3] || 'CH1']);
  for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; });
  const views = JSON.parse(process.argv[2] || '[["spawn",0,0,0,-0.1]]');
  for (const [name, x, z, yaw, pitch, js] of views) {
    await pg.evaluate(([x, z, yaw, pitch, js]) => { const p = F0W.play, P = p.player, w = p.world; if (js) eval(js); let X = x, Z = z; if (x === 'pit') { const q = w.quickPits[0]; X = q.x + q.r * 1.6; Z = q.z; yaw = Math.PI / 2; } if (x === 'pit-in') { const q = w.quickPits[0]; X = q.x; Z = q.z; }
      P.pos.set(X, w.heightAt(X, Z) + 1.65, Z); P.y = P.pos.y; P.yaw = yaw; P.pitch = pitch; P.vel.set(0, 0); p.toasts = []; }, [x, z, yaw, pitch, js]);
    await pg.waitForTimeout(1500); await pg.screenshot({ path: '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/chi_' + name + '.png' });
  }
  console.log('errors', JSON.stringify(errs.slice(0, 6))); await br.close();
})();
