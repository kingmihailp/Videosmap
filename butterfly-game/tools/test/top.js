// aerial view of the generated map (grass/flowers hidden) to inspect water, banks, trees
(() => new Promise(r => setTimeout(() => {
  F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0;
  setTimeout(() => {
    const p = F0W.play; p.hintT = 0; p.toasts = []; p.draw = () => {};
    p.scene.traverse(o => { if (o.isInstancedMesh && o.material.isShaderMaterial) o.visible = false; });
    p.flies.forEach(f => { f.mesh.visible = false; f.shadow.visible = false; });
    p.netGroup.visible = false;
    p.update = function (dt) { this.world.update(dt, this.t, new THREE.Vector3(0, 0, 0)); };
    const cam = p.camera; cam.fov = 58; cam.updateProjectionMatrix(); cam.position.set(0, 128, 1); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
    p.camera.rotation.order = 'XYZ'; p.scene.fog.density = 0.0004;
    setTimeout(() => r({ kinds: p.world.waters.map(w => w.kind), lm: p.world.landmarks }), 300);
  }, 500);
}, 1500)))()
