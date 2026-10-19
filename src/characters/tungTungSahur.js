// Tung Tung Tung Sahur: wooden log body, big googly eyes, wide grin, stick limbs, baseball bat.
import * as THREE from 'three';
import { mat, mesh, sphere, cyl, capsule, limb, canvasTex, rng, animate, eye, box } from '../core/util.js';

function woodTexture(seed = 5) {
  const r = rng(seed);
  return canvasTex(512, (c, s) => {
    c.fillStyle = '#b8742f'; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {            // vertical grain streaks
      c.strokeStyle = `rgba(${90 + r() * 40},${45 + r() * 25},15,${0.10 + r() * 0.22})`;
      c.lineWidth = 1 + r() * 4;
      const x = r() * s; c.beginPath(); c.moveTo(x, 0);
      for (let y = 0; y <= s; y += 32) c.lineTo(x + Math.sin(y * 0.02 + i) * 6, y);
      c.stroke();
    }
    for (let i = 0; i < 6; i++) {             // knots
      const x = r() * s, y = r() * s;
      for (let k = 4; k > 0; k--) { c.strokeStyle = `rgba(70,35,10,${0.5 / k})`; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, 6 * k, 12 * k, 0, 0, 7); c.stroke(); }
    }
  }, { repeat: [1, 1] });
}

export function createTungTungSahur({ height = 1.8, withBat = true } = {}) {
  const g = new THREE.Group(); g.name = 'TungTungSahur';
  const wood = mat(0xffffff, { map: woodTexture(), roughness: 0.45 });
  const dark = mat(0x3a1c08, { roughness: 0.8 });
  const sk = height / 1.8;

  const torso = new THREE.Group(); torso.scale.setScalar(sk); g.add(torso);

  // log body: straight cylinder w/ rounded top + flat bottom
  const body = mesh(new THREE.CapsuleGeometry(0.30, 0.95, 12, 28), wood, { pos: [0, 0.95, 0], name: 'log' });
  body.scale.set(1, 1, 0.9);
  torso.add(body);
  // cut ring at the bottom (end grain)
  torso.add(cyl(0.285, 0.285, 0.02, mat(0xd9a05a), { pos: [0, 0.46, 0] }));

  // face
  const face = new THREE.Group(); face.position.set(0, 1.35, 0.255); torso.add(face);
  for (const s of [-1, 1]) {
    const e = eye(0.115, { pupil: 0.5, look: [-s * 0.15, -0.05] });
    e.position.set(s * 0.14, 0.12, 0.03); face.add(e);
    face.add(box(0.2, 0.035, 0.03, dark, { pos: [s * 0.14, 0.27, 0.04], rot: [0, 0, s * -0.12] })); // brow
  }
  face.add(sphere(0.07, wood, { pos: [0, 0.0, 0.05], scale: [0.9, 1.3, 1] }));            // nose
  const mouth = mesh(new THREE.TorusGeometry(0.15, 0.022, 8, 24, Math.PI), dark, { pos: [0, -0.14, 0.015], rot: [0, 0, Math.PI] });
  mouth.scale.set(1, 0.7, 1); face.add(mouth);
  face.add(box(0.2, 0.035, 0.02, mat(0xf4f0e0), { pos: [0, -0.165, 0.02] })); // teeth strip

  // limbs
  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(s * 0.31, 1.12, 0); torso.add(shoulder);
    shoulder.add(limb([0, 0, 0], [s * 0.18, -0.30, 0.12], 0.04, wood));
    shoulder.add(limb([s * 0.18, -0.30, 0.12], [s * 0.1, -0.52, 0.34], 0.035, wood));
    shoulder.add(sphere(0.06, wood, { pos: [s * 0.1, -0.52, 0.34] }));
    arms.push(shoulder);
    const hip = new THREE.Group(); hip.position.set(s * 0.13, 0.5, 0); torso.add(hip);
    hip.add(limb([0, 0, 0], [0, -0.26, 0.02], 0.045, wood));
    hip.add(limb([0, -0.26, 0.02], [0, -0.5, 0], 0.04, wood));
    hip.add(mesh(new THREE.CapsuleGeometry(0.055, 0.12, 4, 8), wood, { pos: [0, -0.52, 0.07], rot: [Math.PI / 2, 0, 0] })); // foot
    hip.userData.side = s; torso.userData['leg' + s] = hip;
  }
  // bat in right hand (viewer's left, -x? keep +x = character's left)
  if (withBat) {
    const bat = new THREE.Group();
    const profile = [[0.0, 0], [0.022, 0.02], [0.02, 0.35], [0.05, 0.75], [0.062, 1.0], [0.0, 1.02]].map(([r, y]) => new THREE.Vector2(r, y));
    bat.add(mesh(new THREE.LatheGeometry(profile, 24), mat(0xc58a46, { roughness: 0.5 })));
    bat.position.set(-0.31 - 0.1, 1.12 - 0.52, 0.34);
    bat.rotation.set(0.15, 0, 0.1);
    torso.add(bat); g.userData.bat = bat;
  }
  // idle: sway + bat tap
  animate(g, t => {
    torso.rotation.z = Math.sin(t * 2) * 0.03;
    torso.position.y = Math.abs(Math.sin(t * 2)) * 0.02;
    if (g.userData.bat) g.userData.bat.rotation.x = 0.15 + Math.sin(t * 4) * 0.12;
  });
  return g;
}
