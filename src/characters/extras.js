// Scene extras: muscular wooden man, runner (green tracksuit), generic footballer, knight, giant Tung head, cup-ninja skateboarder.
import * as THREE from 'three';
import { mat, mesh, sphere, cyl, box, limb, eye, animate, canvasTex, rng } from '../core/util.js';

const woodMat = (c = 0xc98a3c) => mat(c, { roughness: 0.35, metalness: 0.05 });

export function createMuscleMan({ height = 4 } = {}) {
  const g = new THREE.Group(); g.name = 'MuscleMan';
  const root = new THREE.Group(); root.scale.setScalar(height / 3.0); g.add(root);
  const w = woodMat(), shorts = mat(0x3a3a40, { roughness: 0.8 });
  root.add(sphere(0.55, w, { pos: [0, 2.05, 0], scale: [1.15, 0.95, 0.7] }));                    // chest block
  for (const s of [-1, 1]) root.add(sphere(0.3, w, { pos: [s * 0.3, 2.2, 0.28], scale: [1, 0.8, 0.6] })); // pecs
  root.add(mesh(new THREE.CylinderGeometry(0.45, 0.3, 0.9, 20), w, { pos: [0, 1.35, 0], scale: [1.1, 1, 0.65] }));  // torso taper
  for (let r = 0; r < 3; r++) for (const s of [-1, 1]) root.add(sphere(0.1, w, { pos: [s * 0.12, 1.55 - r * 0.22, 0.27], scale: [1, 0.8, 0.5] })); // abs
  root.add(mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.35, 20), shorts, { pos: [0, 0.82, 0], scale: [1.05, 1, 0.7] }));
  const head = new THREE.Group(); head.position.set(0, 2.78, 0.02); root.add(head);
  head.add(mesh(new THREE.BoxGeometry(0.46, 0.55, 0.42, 3, 3, 3), w, { name: 'head' }));
  head.children[0].geometry.attributes.position.array.forEach((v, i, a) => { }); // keep box; bevel look via sphere overlay
  head.add(sphere(0.3, w, { scale: [0.85, 1, 0.8] }));
  for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.07, 16, 12), mat(0xfff6c0, { emissive: 0xffe680, emissiveIntensity: 1.2 }), { pos: [s * 0.12, 0.08, 0.2], scale: [1.3, 0.8, 0.5] }); head.add(e); head.add(box(0.18, 0.03, 0.04, mat(0x6b3f12), { pos: [s * 0.12, 0.17, 0.21], rot: [0, 0, s * -0.2] })); }
  head.add(box(0.2, 0.03, 0.03, mat(0x6b3f12), { pos: [0, -0.13, 0.21] }));
  root.add(cyl(0.16, 0.2, 0.2, w, { pos: [0, 2.5, 0] }));
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.72, 2.2, 0); root.add(sh);
    sh.add(sphere(0.3, w));                                                                    // delt
    sh.add(limb([0, 0, 0], [s * 0.3, -0.5, 0.1], 0.24, w)); sh.add(limb([s * 0.3, -0.5, 0.1], [s * 0.28, -0.95, 0.3], 0.2, w));
    sh.add(sphere(0.2, w, { pos: [s * 0.28, -1.05, 0.32] })); arms.push(sh);
    root.add(limb([s * 0.22, 0.75, 0], [s * 0.26, 0.05, 0.02], 0.2, w)); root.add(box(0.3, 0.12, 0.5, w, { pos: [s * 0.26, 0.06, 0.1] }));
  }
  animate(g, t => { root.position.y = Math.sin(t * 2) * 0.03; arms.forEach((a, i) => a.rotation.x = Math.sin(t * 2 + i) * 0.1); });
  return g;
}

function person({ skin = 0xe8b48a, shirt, pants, hair = 0x222222, bald = false, scale = 1, arms = 'swing' }) {
  const g = new THREE.Group(), root = new THREE.Group(); root.scale.setScalar(scale); g.add(root);
  const sk = mat(skin, { roughness: 0.55 }), sh = mat(shirt, { roughness: 0.7 }), pn = mat(pants, { roughness: 0.7 });
  root.add(mesh(new THREE.CapsuleGeometry(0.2, 0.45, 6, 12), sh, { pos: [0, 1.15, 0], scale: [1, 1, 0.65] }));
  const head = sphere(0.19, sk, { pos: [0, 1.7, 0] }); root.add(head);
  if (!bald) root.add(sphere(0.2, mat(hair), { pos: [0, 1.74, -0.02], scale: [1, 0.8, 1] }));
  for (const s of [-1, 1]) { const e = eye(0.035, { pupil: 0.6 }); e.position.set(s * 0.07, 1.72, 0.17); root.add(e); }
  const limbsA = [], limbsL = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.25, 1.4, 0); root.add(a);
    if (arms === 'forward') { a.add(limb([0, 0, 0], [s * 0.1, 0, 0.6], 0.06, sh)); a.add(sphere(0.06, sk, { pos: [s * 0.1, 0, 0.62] })); }
    else { a.add(limb([0, 0, 0], [0, -0.5, 0], 0.06, sh)); a.add(sphere(0.06, sk, { pos: [0, -0.52, 0] })); }
    limbsA.push(a);
    const l = new THREE.Group(); l.position.set(s * 0.1, 0.8, 0); root.add(l);
    l.add(limb([0, 0, 0], [0, -0.8, 0], 0.09, pn)); l.add(box(0.14, 0.08, 0.26, mat(0xeeeeee), { pos: [0, -0.8, 0.06] })); limbsL.push(l);
  }
  g.userData = { head, root, limbsA, limbsL };
  return g;
}



export function createKnight({ scale = 1 } = {}) {
  const g = person({ shirt: 0x8d949c, pants: 0x6b7178, scale }); g.name = 'Knight';
  const steel = mat(0xa8b0b8, { metalness: 0.85, roughness: 0.3 }), { root, limbsA } = g.userData;
  root.add(sphere(0.23, steel, { pos: [0, 1.74, 0], scale: [1, 1.05, 1] }));
  root.add(box(0.3, 0.05, 0.05, mat(0x111111), { pos: [0, 1.74, 0.2] }));
  const sword = new THREE.Group(); sword.add(box(0.07, 1.6, 0.02, steel, { pos: [0, 0.8, 0] }), box(0.3, 0.06, 0.06, mat(0x5a3a1a), { pos: [0, 0.02, 0] }));
  sword.position.set(0, -0.5, 0.05); limbsA[1].add(sword); limbsA[1].rotation.z = 0;
  animate(g, t => { limbsA[1].rotation.x = -2.4 + Math.sin(t * 3) * 0.5; });
  return g;
}

/** Giant Tung head half-buried in the road with log body lying beside it, mouth open. */
export function createGiantTungHead({ size = 6 } = {}) {
  const g = new THREE.Group(); g.name = 'GiantTungHead';
  const w = woodMat(0xc98a3c), dark = mat(0x2a0e0a, { roughness: 0.9 }), tooth = mat(0xf4efe0, { roughness: 0.3 });
  const k = size / 6; const root = new THREE.Group(); root.scale.setScalar(k); g.add(root);
  root.add(mesh(new THREE.CapsuleGeometry(1.9, 6, 12, 28), w, { pos: [4.6, 1.9, -1.5], rot: [0, 0.3, Math.PI / 2] }));          // log body
  root.add(mesh(new THREE.CapsuleGeometry(2.6, 2.2, 12, 28), w, { pos: [0, 2.8, 0], scale: [1, 1, 0.95] }));                   // head
  for (const s of [-1, 1]) { const e = eye(0.78, { pupil: 0.45, look: [0, 0.05] }); e.position.set(s * 1.1, 4.3, 2.3); root.add(e); }
  root.add(sphere(0.5, w, { pos: [0, 3.5, 2.7], scale: [1, 1.4, 1] }));
  root.add(sphere(1.45, dark, { pos: [0, 1.4, 2.0], scale: [1.25, 0.8, 0.55] }));                                               // open mouth
  for (let i = -3; i <= 3; i++) { root.add(box(0.36, 0.5, 0.2, tooth, { pos: [i * 0.42, 2.0, 2.45] })); root.add(box(0.36, 0.45, 0.2, tooth, { pos: [i * 0.42 + 0.2, 0.8, 2.45] })); }
  root.add(sphere(0.7, mat(0xc8445a, { roughness: 0.6 }), { pos: [0, 1.0, 2.3], scale: [1.4, 0.4, 0.8] }));                       // tongue
  animate(g, t => { root.rotation.z = Math.sin(t * 1.4) * 0.02; });
  return g;
}

export function createCupNinja({ scale = 1 } = {}) {      // coffee-cup ninja on a skateboard (ref: cup rider near giant head)
  const g = new THREE.Group(); g.name = 'CupNinja'; g.scale.setScalar(scale);
  g.add(box(0.5, 0.05, 1.5, mat(0x111111), { pos: [0, 0.22, 0] }));
  for (const [x, z] of [[-0.2, 0.5], [0.2, 0.5], [-0.2, -0.5], [0.2, -0.5]]) g.add(cyl(0.1, 0.1, 0.08, mat(0xdd2222), { pos: [x, 0.1, z], rot: [0, 0, Math.PI / 2] }));
  g.add(mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.95, 24), mat(0xf4f4f4, { roughness: 0.3 }), { pos: [0, 0.8, 0] }));
  g.add(mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.18, 24), mat(0x1a1a1a), { pos: [0, 1.0, 0] }));                           // black band
  g.add(box(0.3, 0.1, 0.04, mat(0xf6f6f6), { pos: [0, 1.0, 0.42] }));
  for (const s of [-1, 1]) { const e = eye(0.06); e.position.set(s * 0.14, 1.0, 0.4); g.add(e); }
  g.add(mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 24), mat(0x2a2a2a), { pos: [0, 1.3, 0] }));                           // lid
  return g;
}

export { createRunner, createFootballer } from './humanReal.js';
