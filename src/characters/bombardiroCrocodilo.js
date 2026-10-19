// Bombardiro Crocodilo: WW2 bomber airframe with a crocodile head for a nose, spinning props, bombs.
import * as THREE from 'three';
import { mat, mesh, sphere, cyl, box, limb, eye, lathe, animate, rng } from '../core/util.js';

function propeller(R = 0.55, blades = 3) {
  const g = new THREE.Group(), m = mat(0x1a1a1a, { roughness: 0.5 });
  for (let i = 0; i < blades; i++) {
    const b = box(0.07, R, 0.015, m, { pos: [0, R / 2, 0], rot: [0.35, 0, 0] });
    const pivot = new THREE.Group(); pivot.rotation.z = (i / blades) * Math.PI * 2; pivot.add(b); g.add(pivot);
  }
  g.add(sphere(0.07, mat(0xb0b0b0, { metalness: 0.7, roughness: 0.3 })));
  g.userData.spin = true;
  return g;
}

function scaleBumps(geo, seed = 2, amp = 0.015) {            // crocodile osteoderm bumps on a lathe/sphere
  const r = rng(seed), p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const k = amp * (0.6 + 0.4 * Math.sin(p.getX(i) * 55) * Math.sin(p.getY(i) * 55 + p.getZ(i) * 40)) * (0.8 + r() * 0.2);
    p.setXYZ(i, p.getX(i) + n.getX(i) * k, p.getY(i) + n.getY(i) * k, p.getZ(i) + n.getZ(i) * k);
  }
  geo.computeVertexNormals(); return geo;
}

export function createBombardiroCrocodilo({ span = 4.0 } = {}) {
  const g = new THREE.Group(); g.name = 'BombardiroCrocodilo';
  const gray = mat(0x5f666b, { metalness: 0.45, roughness: 0.45 });
  const croc = mat(0x4a5d3a, { roughness: 0.7 });
  const crocBelly = mat(0xb9b087, { roughness: 0.7 });
  const dark = mat(0x16181a, { roughness: 0.6 });
  const root = new THREE.Group(); root.position.y = 1.0; root.scale.setScalar(span / 4.0); g.add(root);

  // fuselage: lathe along Y, rotated to Z. profile (radius,y): tail -> nose
  const prof = [[0.0, -1.9], [0.06, -1.85], [0.14, -1.3], [0.28, -0.4], [0.40, 0.4], [0.38, 0.9], [0.30, 1.2]];
  const fus = lathe(prof, gray, { rot: [Math.PI / 2, 0, 0] }); fus.rotation.x = Math.PI / 2;   // +Y -> +Z
  root.add(fus);
  // wings (swept tapered slab)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.5); wingShape.lineTo(2.0, 0.3); wingShape.lineTo(2.0, -0.2); wingShape.lineTo(0, -0.55); wingShape.lineTo(0, 0.5);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 2 });
  for (const s of [-1, 1]) {
    const w = mesh(wingGeo, gray, { rot: [Math.PI / 2, 0, 0] });
    w.scale.x = s; w.position.set(0, -0.05, 0.15);
    root.add(w);
    // star-less roundel: generic red/white target
    const r = cyl(0.17, 0.17, 0.005, mat(0xc0282d), { pos: [s * 1.3, 0.035, 0.05] }); root.add(r);
    root.add(cyl(0.08, 0.08, 0.008, mat(0xf4f4f4), { pos: [s * 1.3, 0.037, 0.05] }));
    // engine nacelle + prop
    const nac = lathe([[0, -0.4], [0.12, -0.35], [0.15, 0.05], [0.14, 0.45], [0.09, 0.55], [0.0, 0.58]], gray, { rot: [Math.PI / 2, 0, 0] });
    nac.position.set(s * 0.95, -0.08, 0.3); root.add(nac);
    const p = propeller(0.62); p.position.set(s * 0.95, -0.08, 1.0); p.rotation.x = 0; root.add(p);
    // bomb under wing
    const bomb = lathe([[0, -0.2], [0.05, -0.16], [0.07, 0.0], [0.06, 0.16], [0.0, 0.22]], dark, { rot: [Math.PI / 2, 0, 0] });
    bomb.position.set(s * 0.55, -0.25, 0.2); root.add(bomb);
  }
  // tail
  const tailV = new THREE.Shape(); tailV.moveTo(0, 0); tailV.lineTo(0.6, 0); tailV.lineTo(0.15, 0.7); tailV.lineTo(0.0, 0.7); tailV.lineTo(0, 0);
  root.add(mesh(new THREE.ExtrudeGeometry(tailV, { depth: 0.05, bevelEnabled: false }), gray, { pos: [-0.025, 0.1, -1.9], rot: [0, -Math.PI / 2, 0] }));
  for (const s of [-1, 1]) root.add(box(0.7, 0.04, 0.35, gray, { pos: [s * 0.45, 0.05, -1.7] }));

  // crocodile head nose
  const head = new THREE.Group(); head.position.set(0, 0.02, 1.15); root.add(head);
  const upGeo = scaleBumps(new THREE.SphereGeometry(0.34, 48, 32), 4, 0.018);
  head.add(mesh(upGeo, croc, { scale: [1.0, 0.7, 1.9], pos: [0, 0.07, 0.35] }));       // upper snout
  head.add(mesh(new THREE.SphereGeometry(0.3, 40, 28), crocBelly, { scale: [0.92, 0.45, 1.8], pos: [0, -0.18, 0.28], rot: [0.12, 0, 0] })); // lower jaw
  head.add(sphere(0.045, dark, { pos: [0.1, 0.1, 1.0] })); head.add(sphere(0.045, dark, { pos: [-0.1, 0.1, 1.0] })); // nostrils
  const tooth = mat(0xf3efe0, { roughness: 0.3 });
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) {
    head.add(mesh(new THREE.ConeGeometry(0.022, 0.09, 6), tooth, { pos: [s * 0.2, -0.05, 0.1 + i * 0.09], rot: [Math.PI, 0, 0] }));
    head.add(mesh(new THREE.ConeGeometry(0.02, 0.07, 6), tooth, { pos: [s * 0.19, -0.1, 0.14 + i * 0.09] }));
  }
  for (const s of [-1, 1]) {                                               // raised croc eyes
    head.add(sphere(0.11, croc, { pos: [s * 0.2, 0.28, 0.0], scale: [1, 1, 1.2] }));
    const e = eye(0.075, { pupil: 0.5, irisColor: 0xd8a600, white: 0xe9d23a }); e.position.set(s * 0.22, 0.33, 0.04);
    e.lookAt(e.position.clone().add(new THREE.Vector3(s, 0.3, 0.6))); head.add(e);
  }
  // cockpit bump
  root.add(sphere(0.2, mat(0x7fb7d6, { roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 }), { pos: [0, 0.36, 0.35], scale: [1, 0.7, 1.7] }));

  animate(g, (t, dt) => {
    root.traverse(o => { if (o.userData.spin) o.rotation.z += dt * 40; });
    root.rotation.z = Math.sin(t * 1.2) * 0.08;
    root.position.y = 1.0 + Math.sin(t * 1.7) * 0.06;
  });
  return g;
}
