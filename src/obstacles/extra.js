// Gauntlet-specific obstacles + props: piston gate, jaw trap, evil train, stomp foot, zombie, tractor, pig cart, double-decker, board/scooter riders.
import * as THREE from 'three';
import { mat, mesh, sphere, cyl, box, limb, eye, animate, rng } from '../core/util.js';
import { attachMotion } from '../core/motion.js';

const conc = () => new THREE.MeshStandardMaterial({ color: 0xb9b7ad, roughness: 0.95 });
const steel = () => new THREE.MeshPhysicalMaterial({ color: 0xa3abb3, metalness: 1, roughness: 0.3 });
const paint = c => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.5, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });

/** Two plates close from the sides across the lane (reciprocating pistons). hitPhase 0.25 (closed), passPhase 0.75 (retracted). */
export function createPistonGate({ width = 7, height = 2.4, depth = 1.8, motion = {} } = {}) {
  const g = new THREE.Group(); g.name = 'PistonGate';
  for (const s of [-1, 1]) {
    g.add(box(2.4, height + 1.2, depth + 1.2, conc(), { pos: [s * (width / 2 + 1.9), (height + 1.2) / 2, 0] }));
    for (const dy of [0.5, height - 0.5]) g.add(box(2.45, 0.12, depth + 1.25, mat(0xc08a3e), { pos: [s * (width / 2 + 1.9), dy + 0.3, 0] }));
    const plate = new THREE.Group(); plate.position.set(s * (width / 2 + 0.3), height / 2 + 0.2, 0); g.add(plate);
    plate.add(box(0.6, height, depth, steel(), { pos: [0, 0, 0] }));
    plate.add(cyl(0.3, 0.3, 4, steel(), { pos: [s * 2.2, 0, 0], rot: [0, 0, Math.PI / 2] }));
    for (let i = -1; i <= 1; i += 2) plate.add(box(0.1, height * 0.8, 0.12, mat(0xf2c200), { pos: [-s * 0.31, 0, i * depth * 0.3] }));
    attachMotion(g, plate, { type: 'bob', axis: 'x', amplitude: width / 2 + 0.2, direction: -s, speed: 0.4 }, motion);
  }
  g.userData.hitPhase = 0.25; g.userData.passPhase = 0.75;
  return g;
}



/** Giant wooden leg + foot that stomps down (matches the Tung head obstacle). */
export function createStompFoot({ scale = 1, motion = {} } = {}) {
  const g = new THREE.Group(); g.name = 'StompFoot'; g.scale.setScalar(scale);
  const w = new THREE.MeshStandardMaterial({ color: 0xc98a3c, roughness: 0.4 }), mover = new THREE.Group(); mover.position.y = 7; g.add(mover);
  mover.add(mesh(new THREE.CapsuleGeometry(0.9, 8, 8, 20), w, { pos: [0, 5, 0] }));
  mover.add(box(2.4, 0.9, 3.6, w, { pos: [0, 0.2, 0.7] })); for (let i = 0; i < 5; i++) mover.add(sphere(0.34, w, { pos: [-0.95 + i * 0.48, 0.2, 2.5], scale: [1, 0.8, 1.2] }));
  attachMotion(g, mover, { type: 'slam', axis: 'y', amplitude: 6.4, direction: -1, speed: 0.4, windup: 0.5, hit: 0.07, hold: 0.14 }, motion);
  return g;
}


export function createDoubleDecker({ lower = 0xffffff, upper = 0x2a62c8 } = {}) {
  const g = new THREE.Group(); g.name = 'DoubleDecker'; const glass = mat(0x9fd6ef, { roughness: 0.05, transparent: true, opacity: 0.85 });
  g.add(box(2.4, 1.6, 7.6, paint(lower), { pos: [0, 1.2, 0] })); g.add(box(2.4, 1.5, 7.2, paint(upper), { pos: [0, 2.75, -0.2] }));
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) { g.add(box(0.05, 0.6, 0.8, glass, { pos: [s * 1.21, 2.9, -3.2 + i * 1.0] })); if (i > 0) g.add(box(0.05, 0.5, 0.8, glass, { pos: [s * 1.21, 1.45, -3.2 + i * 1.0] })); }
  g.add(box(2.1, 0.9, 0.05, glass, { pos: [0, 2.9, 3.4] })); g.add(box(2.1, 0.8, 0.05, glass, { pos: [0, 1.4, 3.82] }));
  for (const z of [2.3, -2.3]) for (const s of [-1, 1]) g.add(cyl(0.5, 0.5, 0.35, mat(0x161616), { pos: [s * 1.0, 0.5, z], rot: [0, 0, Math.PI / 2] }));
  return g;
}
/** Puts any object on a skateboard (or scooter) so it rides along. */
export function onBoard(obj, { kind = 'board', lift = 0.34 } = {}) {
  const g = new THREE.Group(); g.name = kind;
  if (kind === 'board') {
    g.add(box(0.7, 0.07, 2.0, mat(0x2a2a2e), { pos: [0, 0.28, 0] }));
    for (const [x, z] of [[-0.3, 0.7], [0.3, 0.7], [-0.3, -0.7], [0.3, -0.7]]) g.add(cyl(0.16, 0.16, 0.14, mat(0x151515), { pos: [x, 0.16, z], rot: [0, 0, Math.PI / 2] }));
    g.add(box(0.5, 0.12, 0.6, mat(0xd02a2a), { pos: [0, 0.2, 0.7] }), box(0.5, 0.12, 0.6, mat(0xd02a2a), { pos: [0, 0.2, -0.7] }));
  } else {
    const pink = paint(0xff69b4); g.add(box(0.5, 0.12, 1.6, pink, { pos: [0, 0.28, 0] })); g.add(cyl(0.04, 0.04, 1.3, steel(), { pos: [0, 0.95, 0.75] })); g.add(box(0.7, 0.05, 0.06, steel(), { pos: [0, 1.6, 0.75] }));
    for (const z of [0.75, -0.65]) g.add(cyl(0.25, 0.25, 0.1, mat(0x181818), { pos: [0, 0.25, z], rot: [0, 0, Math.PI / 2] }));
  }
  obj.position.y += lift; g.add(obj); return g;
}

export { createEvilTrain, createTractor, createPigCart, createJawTrap, createZombie } from './realistic.js';
