// Realistic-proportion road vehicles built from rounded panels, textured paint, glass and tread wheels. Faces +Z, wheels on y=0.
import * as THREE from 'three';
import { rbox, cyl, sph, plane, paint, dark, chrome, steel, glass, lamp, wheel, labelMat } from '../core/build.js';
import { surface } from '../core/textures.js';
import { createRealCar } from './realCar.js';

export function createJeep({ color = 0xf5c400 } = {}) {
  const g = new THREE.Group(); g.name = 'Jeep';
  const P = paint(color), G = glass(), D = dark(0x161616);
  g.add(rbox(1.8, 0.62, 3.5, 0.16, P, { pos: [0, 0.82, 0] }));
  g.add(rbox(1.66, 0.72, 1.85, 0.14, P, { pos: [0, 1.46, -0.25] }));
  g.add(rbox(1.7, 0.05, 1.9, 0.02, D, { pos: [0, 1.87, -0.25] }));
  g.add(plane(1.5, 0.62, G, { pos: [0, 1.5, 0.7], rot: [-0.22, 0, 0] }));
  for (const s of [-1, 1]) g.add(plane(1.6, 0.5, G, { pos: [s * 0.84, 1.5, -0.25], rot: [0, s * Math.PI / 2, 0] }));
  g.add(plane(1.5, 0.5, G, { pos: [0, 1.5, -1.2], rot: [0, Math.PI, 0] }));
  g.add(rbox(1.2, 0.34, 0.1, 0.03, surface('grille', { color: 0x1d1d1d }), { pos: [0, 0.9, 1.78] }));
  for (const s of [-1, 1]) g.add(cyl(0.12, 0.12, 0.08, lamp(), { pos: [s * 0.62, 0.98, 1.78], rot: [Math.PI / 2, 0, 0] }, 20));
  g.add(rbox(1.84, 0.22, 0.22, 0.07, D, { pos: [0, 0.5, 1.85] }));
  g.add(rbox(1.84, 0.22, 0.22, 0.07, D, { pos: [0, 0.5, -1.85] }));
  g.add(cyl(0.36, 0.36, 0.28, surface('tread', { color: 0x202020, rough: 0.9 }), { pos: [0, 1.15, -1.95], rot: [Math.PI / 2, 0, 0] }, 36));
  for (const s of [-1, 1]) for (const z of [1.05, -1.05]) {
    const w = wheel(0.43, 0.34, { rim: 0xaeb4ba }); w.position.set(s * 0.92, 0.43, z); g.add(w);
    g.add(rbox(0.2, 0.12, 0.9, 0.05, P, { pos: [s * 0.97, 0.98, z] }));
  }
  for (const s of [-1, 1]) g.add(cyl(0.03, 0.03, 1.8, steel(), { pos: [s * 0.7, 1.97, -0.25], rot: [Math.PI / 2, 0, 0] }, 10));
  return g;
}

export function createSchoolBus() {
  const g = new THREE.Group(); g.name = 'SchoolBus';
  const Y = paint(0xf2b400), D = dark(0x151515), G = glass();
  g.add(rbox(2.5, 2.55, 7.4, 0.18, Y, { pos: [0, 1.8, 0] }));
  g.add(rbox(2.3, 1.1, 1.5, 0.2, Y, { pos: [0, 0.95, 4.45] }));
  g.add(rbox(2.2, 0.5, 0.25, 0.1, D, { pos: [0, 0.6, 5.3] }));
  g.add(rbox(2.5, 0.12, 6.9, 0.04, D, { pos: [0, 3.1, 0] }));
  g.add(plane(2.0, 0.95, G, { pos: [0, 2.4, 3.76] }));
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) g.add(plane(0.85, 0.85, G, { pos: [s * 1.27, 2.4, -2.9 + i * 1.0], rot: [0, s * Math.PI / 2, 0] }));
  for (const s of [-1, 1]) {
    g.add(rbox(0.05, 0.14, 7.2, 0.02, D, { pos: [s * 1.27, 1.2, 0] }));
    const lab = plane(3.2, 0.42, labelMat('SCHOOL BUS'), { pos: [s * 1.262, 1.72, 0], rot: [0, s * Math.PI / 2, 0] }); g.add(lab);
    g.add(rbox(0.1, 0.5, 0.06, 0.02, D, { pos: [s * 1.62, 2.7, 3.2] }));
    g.add(cyl(0.12, 0.12, 0.06, lamp(), { pos: [s * 0.85, 1.45, 5.32], rot: [Math.PI / 2, 0, 0] }, 20));
    g.add(sph(0.12, lamp(0xff3a2a, 0xff2a10, 1.2), { pos: [s * 0.8, 3.2, 3.5] }, 12));
  }
  g.add(rbox(2.4, 0.4, 0.25, 0.08, D, { pos: [0, 0.55, -3.8] }));
  for (const [x, z, w] of [[-1.05, 2.6, 0.34], [1.05, 2.6, 0.34], [-1.0, -2.4, 0.26], [1.0, -2.4, 0.26], [-1.3, -2.4, 0.26], [1.3, -2.4, 0.26]]) {
    const wh = wheel(0.52, w, { rim: 0x9aa0a6, spokes: 6 }); wh.position.set(x, 0.52, z); g.add(wh);
  }
  return g;
}

/** Cars for the scenes/games that want a supercar: real Ferrari glTF, recoloured. */
export function createSupercar(o = {}) { return createRealCar({ length: 4.6, color: 0xff5a14, ...o }); }
