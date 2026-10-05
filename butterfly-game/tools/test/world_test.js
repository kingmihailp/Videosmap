(() => {
  const id = (location.hash || '#russia').slice(1);
  const st = document.getElementById('stage'); st.style.width = '1440px'; st.style.height = '810px';
  const gl = document.getElementById('gl'); gl.width = 480; gl.height = 270;
  const R = new THREE.WebGLRenderer({ canvas: gl, antialias: false, preserveDrawingBuffer: true }); R.setSize(480, 270, false);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
  const t0 = performance.now();
  const w = World.build(BIOME_BY_ID[id]);
  const cam = new THREE.PerspectiveCamera(72, 480 / 270, 0.1, 700);
  cam.position.set(0, w.heightAt(0, 0) + 1.6, 0); cam.lookAt(10, w.heightAt(10, 4) + 1.4, 4);
  w.update(0.016, 1.0, cam.position); R.render(w.scene, cam);
  window.__info = { build: Math.round(performance.now() - t0), flowers: w.flowers.length, colliders: w.colliders.length, calls: R.info.render.calls, tris: R.info.render.triangles };
  return window.__info;
})()
