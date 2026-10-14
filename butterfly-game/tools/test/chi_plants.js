// close-ups of every desert plant type: node chi_plants.js [seed]
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate(([seed]) => { Save.data.maps = { chihuahua: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('chihuahua', seed); }, [process.argv[2] || 'CH1']);
  for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; F0W.play.flies.forEach(f => { f.mesh.visible = false; }); F0W.play.world.stormForce = null; });
  const types = (process.argv[3] || 'creosote,ocotillo,agave,lechuguilla,sotol,yucca,nopal,cholla,barrel,mesquite,tumbleweed,gypsum').split(',');
  for (const t of types) {
    const n = await pg.evaluate(([t]) => { const p = F0W.play, w = p.world, L = (w.plants || {})[t] || []; const q = L.filter(a => Math.hypot(a[0], a[1]) < 120)[2] || L[0]; if (!q) return 0; const P = p.player, D0 = { mesquite: 7, yucca: 5, ocotillo: 6, nopal: 2.6, creosote: 3.4, barrel: 2.2, cholla: 2.8, agave: 3.2 }, d = D0[t] || 3.6; const a = 0.7; const X = q[0] + Math.sin(a) * d, Z = q[1] + Math.cos(a) * d;
      P.pos.set(X, w.heightAt(X, Z) + 1.65, Z); P.y = P.pos.y; P.yaw = a + Math.PI * 0; P.pitch = ({ mesquite: 0.05, ocotillo: 0.05, yucca: 0.12, nopal: -0.12, creosote: -0.05, barrel: -0.3, cholla: -0.12 })[t] ?? -0.3; P.vel.set(0, 0); p.toasts = []; p.hintT = 0; return L.length; }, [t]);
    await pg.waitForTimeout(1200); await pg.screenshot({ path: '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/pl_' + t + '.png' }); console.log(t, n);
  }
  console.log('errors', JSON.stringify(errs)); await br.close();
})();
