// Tralalero Tralala: upright shark in big blue sneakers. Original sneaker design (no brand marks).
import * as THREE from 'three';
import { mat, mesh, sphere, cyl, box, limb, eye, animate, bellyColors } from '../core/util.js';

function fin(w, h, th, material, o = {}) {           // flat swept fin (tapered, bent back)
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(w * 0.1, h * 0.7, w * 0.0, h); s.quadraticCurveTo(w * 0.9, h * 0.35, w, 0); s.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelThickness: th * 0.4, bevelSize: th * 0.4, bevelSegments: 2 });
  geo.translate(-w / 2, 0, -th / 2);
  return mesh(geo, material, o);
}

export function sneaker(color = 0x1f6bff) {
  const g = new THREE.Group(); g.name = 'sneaker';
  const upper = mat(color, { roughness: 0.4 }), white = mat(0xffffff, { roughness: 0.5 }), dark = mat(0x0b2c7a);
  g.add(mesh(new THREE.CapsuleGeometry(0.13, 0.26, 8, 16), upper, { pos: [0, 0.13, 0.12], rot: [Math.PI / 2, 0, 0], scale: [1, 1, 0.8] })); // toe box + body
  g.add(sphere(0.12, upper, { pos: [0, 0.2, -0.08], scale: [1, 1.15, 1.1] }));                  // heel/ankle
  g.add(mesh(new THREE.CapsuleGeometry(0.15, 0.4, 6, 16), white, { pos: [0, 0.03, 0.1], rot: [Math.PI / 2, 0, 0], scale: [1, 1, 0.42] })); // sole
  g.add(box(0.26, 0.015, 0.2, white, { pos: [0, 0.27, 0.12], rot: [-0.25, 0, 0] }));             // lace panel
  for (let i = 0; i < 4; i++) g.add(box(0.2, 0.012, 0.018, dark, { pos: [0, 0.285 - i * 0.003, 0.05 + i * 0.045], rot: [-0.25, 0, 0] })); // laces
  for (const s of [-1, 1]) g.add(box(0.012, 0.07, 0.2, white, { pos: [s * 0.13, 0.12, 0.08], rot: [0, 0, 0] })); // side stripe
  return g;
}

export function createTralaleroTralala({ height = 2.0 } = {}) {
  const g = new THREE.Group(); g.name = 'TralaleroTralala';
  const blue = 0x3b5878, belly = 0xe9edf2;
  const skin = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.05 });
  const finMat = mat(0x2d4560, { roughness: 0.45 });
  const root = new THREE.Group(); root.scale.setScalar(height / 2.0); g.add(root);

  // torso (tilted forward slightly), head
  const torsoGeo = bellyColors(new THREE.CapsuleGeometry(0.34, 0.5, 12, 28), blue, belly, { zk: 1.6, yk: 0.9, edge: 0.12 });
  const torso = mesh(torsoGeo, skin, { pos: [0, 0.95, 0], scale: [1, 1, 0.85], name: 'torso' });
  root.add(torso);
  const headGeo = bellyColors(new THREE.SphereGeometry(0.42, 48, 32), blue, belly, { zk: 0.3, yk: 1.6, edge: 0.25 });
  const head = new THREE.Group(); head.position.set(0, 1.58, 0.06); root.add(head);
  head.add(mesh(headGeo, skin, { scale: [0.92, 0.82, 1.1] }));
  const snout = mesh(bellyColors(new THREE.SphereGeometry(0.3, 40, 28), blue, belly, { zk: 0.2, yk: 1.8, edge: 0.25 }), skin, { pos: [0, -0.06, 0.34], scale: [0.78, 0.6, 1.25] });
  head.add(snout);
  // mouth slit + teeth
  const dark = mat(0x1a0d12, { roughness: 0.8 }), tooth = mat(0xffffff, { roughness: 0.3 });
  head.add(mesh(new THREE.TorusGeometry(0.26, 0.012, 6, 24, Math.PI * 0.9), dark, { pos: [0, -0.15, 0.40], rot: [-0.25, 0, Math.PI * 1.05], scale: [1, 1.0, 1.2] }));
  for (let i = -4; i <= 4; i++) head.add(mesh(new THREE.ConeGeometry(0.014, 0.04, 6), tooth, { pos: [i * 0.045, -0.165 + Math.abs(i) * 0.004, 0.50 - Math.abs(i) * 0.02], rot: [Math.PI, 0, 0] }));
  // eyes: side/front, expressive
  for (const s of [-1, 1]) {
    const e = eye(0.105, { pupil: 0.5, look: [-s * 0.25, 0] });
    e.position.set(s * 0.25, 0.09, 0.28); e.lookAt(e.position.clone().add(new THREE.Vector3(s * 0.6, 0, 1)));
    head.add(e);
    head.add(mesh(new THREE.BoxGeometry(0.22, 0.03, 0.04), finMat, { pos: [s * 0.25, 0.22, 0.33], rot: [0, s * -0.4, s * 0.3] })); // brow
    head.add(sphere(0.012, dark, { pos: [s * 0.05, 0.0, 0.67] })); // nostril
  }
  // fins
  root.add(fin(0.5, 0.75, 0.06, finMat, { pos: [0, 1.15, -0.22], rot: [-0.45, 0, 0], name: 'dorsal' }));
  head.add(fin(0.4, 0.5, 0.05, finMat, { pos: [0, 0.3, -0.2], rot: [-0.9, 0, 0] }));
  root.add(fin(0.5, 0.7, 0.07, finMat, { pos: [0, 0.55, -0.3], rot: [-2.0, 0, 0], name: 'tail' }));
  const arms = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.33, 1.15, 0.0); root.add(a);
    a.add(limb([0, 0, 0], [s * 0.12, -0.3, 0.12], 0.075, mat(blue)));
    const flipper = fin(0.26, 0.36, 0.045, finMat, { pos: [s * 0.14, -0.36, 0.14], rot: [0.3, 0, s * 0.6] }); a.add(flipper);
    arms.push(a);
    // legs + sneakers
    const l = new THREE.Group(); l.position.set(s * 0.17, 0.62, 0.02); root.add(l);
    l.add(limb([0, 0, 0], [0, -0.28, 0.02], 0.1, mat(blue)));
    const sn = sneaker(); sn.position.set(0, -0.32, 0.02); sn.scale.setScalar(1.15); l.add(sn);
    l.position.y = 0.62; root.userData['leg' + s] = l;
  }
  // lift whole rig so sneaker soles touch y=0
  root.position.y = 0.32 * (height / 2.0);
  animate(g, t => {
    head.rotation.z = Math.sin(t * 2.2) * 0.06;
    root.rotation.z = Math.sin(t * 2.2) * 0.025;
    arms.forEach((a, i) => a.rotation.z = Math.sin(t * 2.2 + i * Math.PI) * 0.12);
  });
  return g;
}
