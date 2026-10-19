// Road obstacles. Every moving one takes `motion` (see core/motion.js): { type, speed, amplitude, axis, direction, phase, delay, windup, hit, hold } or false.
// Change live: obstacle.userData.setMotion({ type: 'pendulum', speed: 1 }).
import * as THREE from 'three';
import { mat, mesh, sphere, cyl, box, canvasTex, rng, animate, limb, lathe, eye } from '../core/util.js';
import { attachMotion } from '../core/motion.js';
import { createHand } from './hand.js';

const wood = () => new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.7 });
const steel = () => new THREE.MeshPhysicalMaterial({ color: 0x9aa2aa, metalness: 1, roughness: 0.28, clearcoat: 0.2 });
const hazard = () => canvasTex(128, (c, s) => { c.fillStyle = '#f2c200'; c.fillRect(0, 0, s, s); c.fillStyle = '#151515'; for (let i = -2; i < 6; i++) { c.beginPath(); c.moveTo(i * 32, s); c.lineTo(i * 32 + 16, s); c.lineTo(i * 32 + 16 + s, 0); c.lineTo(i * 32 + s, 0); c.fill(); } }, { repeat: [3, 1] });

/** Giant hammer (pivot at handle end). Default motion: overhead chop. */
export function createGiantHammer({ length = 9, motion = {}, swing } = {}) {
  const g = new THREE.Group(); g.name = 'GiantHammer';
  const arm = new THREE.Group(); g.add(arm);
  arm.add(cyl(0.22, 0.28, length, wood(), { pos: [0, length / 2, 0] }));
  arm.add(box(1.8, 1.3, 1.3, steel(), { pos: [0, length, 0] }));
  for (const s of [-1, 1]) arm.add(box(0.15, 1.35, 1.35, new THREE.MeshPhysicalMaterial({ color: 0x5b6168, metalness: 0.9, roughness: 0.4 }), { pos: [s * 0.9, length, 0] }));
  arm.add(cyl(0.3, 0.3, 0.5, mat(0x2d2d2d), { pos: [0, 0.2, 0] }));
  arm.rotation.x = -0.15; g.userData.arm = arm;
  attachMotion(g, arm, { type: 'swing', axis: 'x', amplitude: 1.1, direction: -1, speed: 0.5 }, swing === false ? false : motion);
  return g;
}

/** Giant axe. */
export function createGiantAxe({ length = 9, motion = {} } = {}) {
  const g = new THREE.Group(); g.name = 'GiantAxe';
  const arm = new THREE.Group(); g.add(arm);
  arm.add(cyl(0.2, 0.26, length, wood(), { pos: [0, length / 2, 0] }));
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(1.6, -0.2, 2.2, -1.5); s.lineTo(2.2, 1.5); s.quadraticCurveTo(1.6, 0.4, 0, 0.55); s.lineTo(0, 0);
  arm.add(mesh(new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 }), steel(), { pos: [0.2, length - 0.4, -0.1] }));
  arm.add(box(0.5, 1.1, 0.5, steel(), { pos: [0, length - 0.4, 0] }));
  arm.rotation.x = -0.1; g.userData.arm = arm;
  attachMotion(g, arm, { type: 'swing', axis: 'x', amplitude: 0.85, direction: -1, speed: 0.55 }, motion);
  return g;
}

/** Punch-ready fist: knuckles face +Z, forearm trails behind. Default: pull back, thrust forward, retract. */
export function createPunchFist({ scale = 1, forearm = 5, motion = {}, skin } = {}) {
  const g = new THREE.Group(); g.name = 'PunchFist';
  const mover = new THREE.Group(); g.add(mover);
  const hand = createHand({ pose: 'fist', scale, forearm, skin }); hand.rotation.x = Math.PI / 2; hand.position.y = 1.4 * scale; mover.add(hand);
  g.userData.hand = hand;
  attachMotion(g, mover, { type: 'punch', axis: 'z', amplitude: 9 * scale, direction: 1, speed: 0.5, windup: 0.45 }, motion);
  return g;
}

/** Slap hand: flat open hand, palm down, fingers point +X; sweeps sideways. */
export function createSlapHand({ scale = 1, forearm = 5, motion = {}, skin } = {}) {
  const g = new THREE.Group(); g.name = 'SlapHand';
  const mover = new THREE.Group(); g.add(mover);
  const outer = new THREE.Group(); outer.rotation.y = Math.PI / 2; outer.position.y = 1.0 * scale; mover.add(outer);
  const hand = createHand({ pose: 'slap', scale, forearm, skin }); hand.rotation.x = Math.PI / 2; outer.add(hand);
  g.userData.hand = hand;
  attachMotion(g, mover, { type: 'slap', axis: 'x', amplitude: 10 * scale, direction: 1, speed: 0.5, windup: 0.4, hit: 0.07, hold: 0.1 }, motion);
  return g;
}

/** Pendulum over the road. head: 'hammer' | 'axe' | 'ball' | 'blade'. Swings across the road (axis z) by default. */
export function createPendulum({ armLength = 7, head = 'ball', span = 8, height = null, motion = {} } = {}) {
  const g = new THREE.Group(); g.name = 'Pendulum';
  const H = height ?? armLength + 2.2, st = steel(), dark = mat(0x2c2f33, { metalness: 0.6, roughness: 0.5 });
  for (const s of [-1, 1]) g.add(box(0.5, H + 0.6, 0.5, dark, { pos: [s * span / 2, (H + 0.6) / 2, 0] }));
  g.add(box(span + 0.9, 0.5, 0.6, dark, { pos: [0, H + 0.35, 0] }));
  const pivot = new THREE.Group(); pivot.position.y = H; g.add(pivot);
  pivot.add(cyl(0.18, 0.18, 0.9, st, { rot: [Math.PI / 2, 0, 0] }));
  pivot.add(cyl(0.1, 0.1, armLength, st, { pos: [0, -armLength / 2, 0] }));
  const h = new THREE.Group(); h.position.y = -armLength; pivot.add(h);
  if (head === 'ball') {
    h.add(sphere(1.0, st, { pos: [0, -0.8, 0] }));
    for (let i = 0; i < 24; i++) {
      const v = new THREE.Vector3().setFromSphericalCoords(1, Math.acos(1 - 2 * (i + 0.5) / 24), i * 2.4);
      const sp = mesh(new THREE.ConeGeometry(0.16, 0.5, 8), st, { pos: [v.x * 1.15, -0.8 + v.y * 1.15, v.z * 1.15] });
      sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v); h.add(sp);
    }
  }
  else if (head === 'hammer') { h.add(box(2.2, 1.4, 1.4, st, { pos: [0, -0.7, 0] })); }
  else if (head === 'axe') { const sh = new THREE.Shape(); sh.moveTo(0, 0.8); sh.quadraticCurveTo(1.6, 0.9, 1.9, -0.9); sh.lineTo(-1.9, -0.9); sh.quadraticCurveTo(-1.6, 0.9, 0, 0.8); h.add(mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05 }), st, { pos: [0, -1.6, -0.09], rot: [0, 0, 0] })); }
  else { const bl = new THREE.Shape(); bl.moveTo(-1.6, 0); bl.lineTo(1.6, 0); bl.lineTo(0, -1.6); bl.lineTo(-1.6, 0); h.add(mesh(new THREE.ExtrudeGeometry(bl, { depth: 0.12, bevelEnabled: false }), st, { pos: [0, 0, -0.06] })); }
  pivot.rotation.z = 0.0; g.userData.pivot = pivot;
  attachMotion(g, pivot, { type: 'pendulum', axis: 'z', amplitude: 0.95, direction: 1, speed: 0.35 }, motion);
  return g;
}

/** Crusher. kind: 'press' (hydraulic press slams down) | 'pincer' (two walls close from the sides). */
export function createCrusher({ kind = 'press', width = 7, height = 5, depth = 6, motion = {} } = {}) {
  const g = new THREE.Group(); g.name = 'Crusher_' + kind;
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a3f45, metalness: 0.7, roughness: 0.45 }), hz = new THREE.MeshStandardMaterial({ map: hazard(), roughness: 0.6 });
  if (kind === 'press') {
    for (const s of [-1, 1]) { g.add(box(0.7, height + 1.2, depth + 0.6, dark, { pos: [s * (width / 2 + 0.6), (height + 1.2) / 2, 0] })); g.add(box(0.9, 0.5, depth + 1.0, hz, { pos: [s * (width / 2 + 0.6), 0.25, 0] })); }
    g.add(box(width + 2.2, 1.0, depth + 0.6, dark, { pos: [0, height + 1.2, 0] }));
    const plate = new THREE.Group(); plate.position.y = height - 0.2; g.add(plate);
    plate.add(cyl(0.35, 0.35, height * 0.5, mat(0xc8ccd0, { metalness: 1, roughness: 0.2 }), { pos: [0, height * 0.25 + 0.4, 0] }));
    plate.add(box(width, 0.9, depth, hz, { pos: [0, 0, 0] }));
    plate.add(box(width + 0.1, 0.3, depth + 0.1, dark, { pos: [0, 0.6, 0] }));
    g.userData.mover = plate;
    attachMotion(g, plate, { type: 'slam', axis: 'y', amplitude: height - 0.5, direction: -1, speed: 0.4, windup: 0.5, hit: 0.07, hold: 0.12 }, motion);
  } else {
    g.add(box(width + 4.4, 0.6, depth + 1, dark, { pos: [0, height + 0.3, 0] }));
    for (const s of [-1, 1]) {
      const wall = new THREE.Group(); wall.position.x = s * (width / 2 + 1.7); g.add(wall);
      wall.add(box(1.4, height, depth, hz, { pos: [0, height / 2, 0] }));
      for (let i = 0; i < 5; i++) wall.add(mesh(new THREE.ConeGeometry(0.28, 0.7, 8), mat(0xaab0b6, { metalness: 1, roughness: 0.3 }), { pos: [-s * 0.95, 0.7 + i * (height - 1.2) / 4, 0], rot: [0, 0, s * Math.PI / 2] }));
      attachMotion(g, wall, { type: 'slam', axis: 'x', amplitude: width / 2 + 0.7, direction: -s, speed: 0.4, windup: 0.5, hit: 0.07, hold: 0.12 }, motion);
    }
    g.add(box(width + 4.4, 0.25, depth, mat(0x2a2a2e), { pos: [0, 0.05, 0] }));
  }
  return g;
}

/** Squid-Game-style giant doll face lying in a lava pit, mouth open. size via w/d; face scales with w. */
export function createDollFace({ k = 1, lift = 0 } = {}) {
  const g0 = new THREE.Group(); g0.name = 'DollFace'; g0.scale.setScalar(k);
  const body = g0; let g = new THREE.Group(); g.position.y = lift; body.add(g);
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xf2d2bd, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color(0xffc0a8) });
  const hairM = new THREE.MeshPhysicalMaterial({ color: 0x0b0a0c, roughness: 0.32, clearcoat: 0.5, side: THREE.DoubleSide });
  const dark = mat(0x1d0a10, { roughness: 0.9 }), lip = new THREE.MeshPhysicalMaterial({ color: 0xc9142b, roughness: 0.25, clearcoat: 0.8 }), tooth = mat(0xf7f3ea, { roughness: 0.25 });
  g.add(sphere(1, skin, { scale: [0.94, 1.1, 0.9] }));
  g.add(mesh(new THREE.SphereGeometry(1.07, 56, 32, 0, Math.PI * 2, 0, 1.12), hairM, { scale: [0.99, 1.12, 0.96], pos: [0, 0.02, -0.04] }));                    // hair cap + bangs
  g.add(mesh(new THREE.SphereGeometry(1.075, 40, 24, -0.25, 0.9, 1.0, 1.2), hairM, { scale: [0.99, 1.1, 0.96], pos: [0, 0.0, -0.04] }));                           // left curtain
  g.add(mesh(new THREE.SphereGeometry(1.075, 40, 24, Math.PI - 0.65, 0.9, 1.0, 1.2), hairM, { scale: [0.99, 1.1, 0.96], pos: [0, 0.0, -0.04] }));                 // right curtain
  g.add(mesh(new THREE.SphereGeometry(1.075, 40, 24, Math.PI, Math.PI, 1.0, 1.25), hairM, { scale: [0.99, 1.1, 0.96], pos: [0, 0.0, -0.04] }));                   // back
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * 0.37, 0.1, 0.78); e.rotation.y = s * 0.38; g.add(e);
    e.add(sphere(0.225, mat(0xffffff, { roughness: 0.2 }), { scale: [1.05, 1.12, 0.5] }));
    e.add(sphere(0.14, mat(0x3a2216, { roughness: 0.2 }), { pos: [0, -0.005, 0.05], scale: [1, 1, 0.5] }));
    e.add(sphere(0.07, mat(0x000000), { pos: [0, -0.005, 0.085], scale: [1, 1, 0.5] }));
    e.add(sphere(0.032, mat(0xffffff), { pos: [0.06, 0.06, 0.1], scale: [1, 1, 0.5] }));
    e.add(mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 20, Math.PI), dark, { pos: [0, 0.015, 0.03], scale: [1, 0.85, 1] }));                              // upper lid line
    for (let i = 0; i < 4; i++) e.add(mesh(new THREE.BoxGeometry(0.012, 0.1, 0.012), dark, { pos: [s * (0.1 + i * 0.045) * -1 + s * 0.0, 0.2 - i * 0.02, 0.03], rot: [0, 0, s * (0.5 + i * 0.25)] })); // lashes
    g.add(mesh(new THREE.TorusGeometry(0.26, 0.017, 6, 20, Math.PI * 0.62), dark, { pos: [s * 0.37, 0.43, 0.8], rot: [0, s * 0.35, Math.PI * 0.19 + (s > 0 ? 0 : Math.PI * 0.2)] })); // brow
    g.add(sphere(0.17, mat(0xff8aa0, { transparent: true, opacity: 0.55 }), { pos: [s * 0.56, -0.2, 0.7], scale: [1.2, 0.8, 0.25], rot: [0, s * 0.7, 0] }));
  }
  g.add(sphere(0.07, skin, { pos: [0, -0.06, 0.9], scale: [0.85, 1.2, 0.8] }));
  g.add(sphere(0.27, dark, { pos: [0, -0.5, 0.8], scale: [1.1, 0.95, 0.3] }));                                          // mouth cavity
  g.add(mesh(new THREE.TorusGeometry(0.29, 0.042, 12, 30, Math.PI), lip, { pos: [0, -0.47, 0.84], scale: [1.12, 0.7, 0.8] }));                    // upper lip
  g.add(mesh(new THREE.TorusGeometry(0.29, 0.05, 12, 30, Math.PI), lip, { pos: [0, -0.53, 0.84], rot: [0, 0, Math.PI], scale: [1.1, 0.9, 0.8] })); // lower lip
  for (let i = -3; i <= 3; i++) { g.add(box(0.075, 0.075, 0.04, tooth, { pos: [i * 0.08, -0.465, 0.855] })); if (Math.abs(i) < 3) g.add(box(0.075, 0.06, 0.04, tooth, { pos: [i * 0.08, -0.555, 0.855] })); }
  g.add(sphere(0.2, mat(0xe8707e, { roughness: 0.5 }), { pos: [0, -0.6, 0.78], scale: [1.0, 0.45, 0.5] }));
  return body;
}

export function createLavaPit({ w = 8, d = 12, tilt = -1.2, motion = {} } = {}) {
  const g = new THREE.Group(); g.name = 'LavaPit';
  const r = rng(9);
  const tex = canvasTex(512, (c, s) => {
    c.fillStyle = '#c4200b'; c.fillRect(0, 0, s, s);
    c.strokeStyle = '#ffd21a'; c.lineWidth = 7; c.lineCap = 'round';
    for (let i = 0; i < 26; i++) { c.beginPath(); let x = r() * s, y = r() * s; c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 120; c.lineTo(x, y); } c.stroke(); }
    c.strokeStyle = '#ff7a0e'; c.lineWidth = 14; c.globalAlpha = 0.35; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(r() * s, r() * s, 30 + r() * 60, 0, 7); c.stroke(); }
  });
  g.add(mesh(new THREE.BoxGeometry(w, 0.15, d), mat(0xffffff, { map: tex, emissive: 0xff4a00, emissiveMap: tex, emissiveIntensity: 0.6 }), { pos: [0, 0.075, 0] }));
  const doll = createDollFace({ k: w * 0.32 }); doll.rotation.x = tilt; doll.position.set(0, w * 0.24, 0); g.add(doll);
  attachMotion(g, doll, { type: 'bob', axis: 'y', amplitude: 0.1, speed: 0.4 }, motion);
  return g;
}

/** Concrete/stone pillar with wood bands (road gate posts). */
export function createStonePillar() {
  const g = new THREE.Group(); g.name = 'StonePillar';
  const stone = mat(0xa7a7a2, { roughness: 0.95 }), band = mat(0xc08a3e, { roughness: 0.6 });
  const r = rng(4);
  for (let i = 0; i < 4; i++) g.add(box(1.3 + r() * 0.1, 0.62, 1.3 + r() * 0.1, stone, { pos: [0, 0.31 + i * 0.64, 0], rot: [0, r() * 0.15, 0] }));
  g.add(box(1.38, 0.18, 1.38, band, { pos: [0, 1.28, 0] }), box(1.38, 0.18, 1.38, band, { pos: [0, 0.64, 0] }));
  return g;
}

/** Concrete pipe tunnel with a barred gate (ref: cage tunnel under the road). */
export function createPipeGate({ r = 3.2, len = 4 } = {}) {
  const g = new THREE.Group(); g.name = 'PipeGate';
  const con = mat(0xd9d4c4, { roughness: 0.9, side: THREE.DoubleSide });
  g.add(mesh(new THREE.CylinderGeometry(r, r, len, 40, 1, true), con, { rot: [Math.PI / 2, 0, 0], pos: [0, r, 0] }));
  g.add(mesh(new THREE.TorusGeometry(r + 0.12, 0.28, 12, 40), con, { pos: [0, r, len / 2] }));
  const bar = mat(0x4a4a46, { metalness: 0.6, roughness: 0.5 });
  for (let i = -5; i <= 5; i++) { const x = i * r * 0.17, h = Math.sqrt(Math.max(r * r - x * x, 0)) * 2; { const b = cyl(0.05, 0.05, h, bar, { pos: [x, r, len / 2 - 0.1] }); b.userData.bar = true; g.add(b); } }
  g.add(mesh(new THREE.TorusGeometry(r * 0.99, 0.06, 8, 40), bar, { pos: [0, r, len / 2 - 0.1] }));
  return g;
}
