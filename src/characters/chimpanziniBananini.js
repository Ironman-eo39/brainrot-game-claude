// Chimpanzini Bananini: chimp head and arms emerging from a half-peeled banana body.
import * as THREE from 'three';
import { mat, mesh, sphere, cyl, box, limb, eye, animate, bellyColors } from '../core/util.js';

export function createChimpanziniBananini({ height = 1.7 } = {}) {
  const g = new THREE.Group(); g.name = 'ChimpanziniBananini';
  const root = new THREE.Group(); root.scale.setScalar(height / 1.7); g.add(root);
  const fur = mat(0x4b3a2a, { roughness: 0.95 }), face = mat(0xc9a07c, { roughness: 0.6 });
  const yellow = mat(0xf2d23a, { roughness: 0.55 }), peelIn = mat(0xfff1b8, { roughness: 0.7 }), brown = mat(0x6b4a1a, { roughness: 0.9 });
  const moss = mat(0x6e8b2f, { roughness: 0.9 });

  // banana body: curved tapered tube (peeled upper part opens into 3 flaps)
  const curve = new THREE.CatmullRomCurve3([[0, 0.05, 0], [0, 0.4, 0.05], [0, 0.8, 0.0], [0, 1.1, -0.08]].map(p => new THREE.Vector3(...p)));
  const bodyGeo = new THREE.TubeGeometry(curve, 24, 0.3, 24, false);
  const pos = bodyGeo.attributes.position, v = new THREE.Vector3();
  const body = mesh(bodyGeo, yellow, { name: 'banana' });
  root.add(body);
  root.add(sphere(0.3, brown, { pos: [0, 0.05, 0], scale: [0.8, 0.5, 0.8] }));                // dark bottom tip
  root.add(mesh(new THREE.CircleGeometry(0.3, 24), peelIn, { pos: [0, 1.1, -0.08], rot: [-Math.PI / 2, 0, 0] }));
  // peel flaps hanging down around the shoulders
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const flap = mesh(new THREE.CapsuleGeometry(0.1, 0.5, 6, 12), yellow, { scale: [1, 1, 0.28] });
    const piv = new THREE.Group(); piv.position.set(Math.sin(a) * 0.28, 1.08, -0.08 + Math.cos(a) * 0.28);
    piv.rotation.set(Math.cos(a) * 0.95, 0, -Math.sin(a) * 0.95); flap.position.y = -0.28; piv.add(flap); root.add(piv);
  }
  // brown spots + stem scars
  for (const [x, y, z] of [[0.28, 0.5, 0.1], [-0.27, 0.7, 0.05], [0.1, 0.3, 0.29]]) root.add(sphere(0.045, brown, { pos: [x, y, z], scale: [1, 1.4, 0.4] }));

  // chimp head
  const head = new THREE.Group(); head.position.set(0, 1.38, -0.05); root.add(head);
  head.add(sphere(0.27, fur, { scale: [1, 0.95, 0.95] }));
  head.add(sphere(0.2, face, { pos: [0, -0.03, 0.14], scale: [1, 0.95, 0.85] }));              // face mask
  head.add(sphere(0.12, face, { pos: [0, -0.1, 0.27], scale: [1.2, 0.8, 0.7] }));               // muzzle
  for (const s of [-1, 1]) {
    head.add(sphere(0.07, face, { pos: [s * 0.29, 0, -0.02], scale: [0.5, 1, 1] }));             // ears
    const e = eye(0.055, { pupil: 0.6, irisColor: 0x2a1a0a, look: [0, 0] }); e.position.set(s * 0.085, 0.045, 0.285); head.add(e);
    head.add(box(0.14, 0.035, 0.04, fur, { pos: [s * 0.09, 0.12, 0.3], rot: [0, 0, s * -0.15] })); // heavy brow
    head.add(sphere(0.012, brown, { pos: [s * 0.03, -0.07, 0.385] }));
  }
  head.add(mesh(new THREE.TorusGeometry(0.075, 0.01, 6, 16, Math.PI), mat(0x2a1210), { pos: [0, -0.14, 0.355], rot: [0, 0, Math.PI] }));
  head.add(box(0.1, 0.025, 0.02, mat(0xf5f0e0), { pos: [0, -0.158, 0.35] })); // teeth
  // arms emerging from the peel
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.3, 1.1, -0.04); root.add(sh);
    sh.add(limb([0, 0, 0], [s * 0.22, -0.15, 0.12], 0.06, fur));
    sh.add(limb([s * 0.22, -0.15, 0.12], [s * 0.18, -0.4, 0.28], 0.055, fur));
    sh.add(sphere(0.07, face, { pos: [s * 0.18, -0.42, 0.3] }));
    arms.push(sh);
  }
  // jungle moss at the base
  root.add(mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 24), moss, { pos: [0, 0.06, 0], rot: [Math.PI / 2, 0, 0] }));
  animate(g, t => { head.rotation.z = Math.sin(t * 2.4) * 0.1; head.rotation.y = Math.sin(t * 1.1) * 0.25; root.rotation.z = Math.sin(t * 1.6) * 0.04; arms.forEach((a, i) => a.rotation.x = Math.sin(t * 3 + i * 2) * 0.25); });
  return g;
}
