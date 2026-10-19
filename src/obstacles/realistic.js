// Realistic-proportion gauntlet props: evil steam loco, tractor, pig cart, sculpted giant head with jaws, zombie with fireball.
import * as THREE from 'three';
import { rbox, cyl, sph, plane, paint, dark, chrome, steel, glass, lamp, wheel, rust } from '../core/build.js';
import { surface } from '../core/textures.js';
import { eye } from '../core/util.js';
import { animate } from '../core/util.js';
import { attachMotion } from '../core/motion.js';
import { createZombieBody } from '../characters/humanReal.js';

const TAU = Math.PI * 2;

/* ---------- evil steam locomotive (front = +X) ---------- */
function faceTex() {
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
  x.fillStyle = '#6e0b0b'; x.fillRect(0, 0, s, s);
  x.fillStyle = '#1a0606'; for (const ex of [0.32, 0.68]) { x.beginPath(); x.ellipse(s * ex, s * 0.36, s * 0.14, s * 0.06, ex < 0.5 ? -0.3 : 0.3, 0, TAU); x.fill(); }
  for (const ex of [0.32, 0.68]) {
    const g = x.createRadialGradient(s * ex, s * 0.43, 4, s * ex, s * 0.43, s * 0.1); g.addColorStop(0, '#fff6a0'); g.addColorStop(0.5, '#ffb000'); g.addColorStop(1, '#a01000');
    x.fillStyle = g; x.beginPath(); x.ellipse(s * ex, s * 0.43, s * 0.095, s * 0.075, 0, 0, TAU); x.fill();
    x.fillStyle = '#000'; x.beginPath(); x.ellipse(s * ex, s * 0.43, s * 0.02, s * 0.06, 0, 0, TAU); x.fill();
  }
  x.fillStyle = '#120202'; x.beginPath(); x.moveTo(s * 0.2, s * 0.66); x.quadraticCurveTo(s * 0.5, s * 0.92, s * 0.8, s * 0.66); x.quadraticCurveTo(s * 0.5, s * 0.72, s * 0.2, s * 0.66); x.fill();
  x.fillStyle = '#f2ecd8'; for (let i = 0; i < 9; i++) x.fillRect(s * 0.24 + i * s * 0.063, s * 0.67, s * 0.035, s * 0.06);
  for (let i = 0; i < 80; i++) { x.fillStyle = `rgba(60,25,8,${Math.random() * 0.3})`; x.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 3, 20 + Math.random() * 70); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createEvilTrain() {
  const g = new THREE.Group(); g.name = 'EvilTrain';
  const T = new THREE.Group(); g.add(T);
  const bR = 1.15, bLen = 5.4, bY = 1.95;
  const red = paint(0x9c1414, { clear: 0.7 }), black = paint(0x141416, { clear: 0.5 }), brass = chrome({ color: 0xc7a24a });
  const iron = steel(0x2e3034), rivet = surface('rivets', { color: 0x9c1414, clear: 0.6 });
  const prof = [[0.001, 0], [bR * 0.92, 0.18], [bR, 0.5], [bR, bLen - 0.25], [bR * 0.97, bLen - 0.05], [bR * 0.9, bLen]].map(([r, y]) => new THREE.Vector2(r, y));
  const boiler = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), rivet); boiler.rotation.z = -Math.PI / 2; boiler.position.set(-bLen / 2, bY, 0); boiler.castShadow = boiler.receiveShadow = true; T.add(boiler);
  T.add(cyl(bR * 1.02, bR * 1.02, 0.9, black, { pos: [bLen / 2 + 0.45, bY, 0], rot: [0, 0, Math.PI / 2] }, 40));
  const ft = faceTex(), faceM = new THREE.MeshStandardMaterial({ map: ft, emissiveMap: ft, emissive: 0xff4a00, emissiveIntensity: 0.35, roughness: 0.55 });
  const face = new THREE.Mesh(new THREE.CircleGeometry(bR * 0.98, 48), faceM); face.position.set(bLen / 2 + 0.91, bY, 0); face.rotation.y = Math.PI / 2; T.add(face);
  const chimProf = [[0.28, 0], [0.34, 0.35], [0.46, 0.8], [0.62, 1.05], [0.56, 1.2], [0.44, 1.32]].map(([r, y]) => new THREE.Vector2(r, y));
  const chim = new THREE.Mesh(new THREE.LatheGeometry(chimProf, 32), black); chim.position.set(bLen / 2 + 0.3, bY + 0.95, 0); chim.castShadow = true; T.add(chim);
  T.add(sph(0.55, brass, { pos: [0.5, bY + 1.05, 0], scale: [1, 0.6, 1] }, 24));
  T.add(sph(0.42, lamp(0xffe9a0, 0xffd060, 1.4), { pos: [bLen / 2 + 0.95, bY + 0.95, 0] }, 16));
  const cab = rbox(2.4, 2.4, 2.6, 0.12, black, { pos: [-bLen / 2 - 1.25, bY + 0.55, 0] }); T.add(cab);
  for (const s of [-1, 1]) T.add(plane(1.2, 0.9, glass(), { pos: [-bLen / 2 - 1.25, bY + 0.85, s * 1.31], rot: [0, s > 0 ? 0 : Math.PI, 0] }));
  T.add(rbox(2.7, 0.18, 2.9, 0.05, black, { pos: [-bLen / 2 - 1.25, bY + 1.85, 0] }));
  T.add(rbox(2.5, 0.12, 2.7, 0.04, red, { pos: [-bLen / 2 - 1.25, bY + 1.62, 0] }));
  T.add(rbox(bLen + 3.2, 0.42, 2.2, 0.08, iron, { pos: [-0.2, 0.9, 0] }));
  T.add(rbox(0.5, 0.9, 2.5, 0.1, black, { pos: [bLen / 2 + 1.2, 0.8, 0] }));
  for (let i = 0; i < 7; i++) T.add(cyl(0.035, 0.035, 1.1, iron, { pos: [bLen / 2 + 1.5, 0.55, -0.9 + i * 0.3], rot: [0, 0, Math.PI / 2 - 0.5] }, 8));
  for (const x of [-2.1, -0.5, 1.1]) for (const s of [-1, 1]) { const w = wheel(0.9, 0.28, { rim: 0x2a2c30, spokes: 8, spin: -2.5 }); w.position.set(x, 0.9, s * 1.12); T.add(w); }
  for (const s of [-1, 1]) { const w = wheel(0.55, 0.22, { rim: 0x2a2c30, spokes: 6, spin: -3 }); w.position.set(2.9, 0.55, s * 1.12); T.add(w); }
  const puffs = [];
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshStandardMaterial({ color: 0xdedede, transparent: true, opacity: 0, roughness: 1, depthWrite: false })); T.add(p); puffs.push(p); }
  const chx = bLen / 2 + 0.3, chy = bY + 0.95 + 1.32;
  animate(g, t => puffs.forEach((p, i) => { const ph = (t * 0.5 + i / 6) % 1; p.position.set(chx + ph * 1.4, chy + ph * 4.2, ph * 0.3 * Math.sin(i)); p.scale.setScalar(0.6 + ph * 2.2); p.material.opacity = 0.42 * (1 - ph); }));
  return g;
}

/* ---------- tractor ---------- */
export function createTractor() {
  const g = new THREE.Group(); g.name = 'Tractor';
  const red = paint(0xc41e1e, { clear: 0.8 }), D = dark(0x161616), G = glass(), grille = surface('grille', { color: 0x1d1d1d });
  g.add(rbox(1.3, 0.95, 2.0, 0.12, red, { pos: [0, 0.98, 1.35] }));
  g.add(rbox(1.0, 0.55, 1.0, 0.08, D, { pos: [0, 0.65, 0.3] }));
  g.add(rbox(1.25, 0.55, 0.12, 0.04, grille, { pos: [0, 0.95, 2.36] }));
  for (const s of [-1, 1]) g.add(cyl(0.12, 0.12, 0.1, lamp(), { pos: [s * 0.45, 1.1, 2.4], rot: [Math.PI / 2, 0, 0] }, 20));
  g.add(rbox(1.5, 0.95, 1.1, 0.14, red, { pos: [0, 1.42, -0.55] }));
  g.add(rbox(1.6, 1.25, 1.5, 0.15, red, { pos: [0, 2.05, -0.55] }));
  g.add(rbox(1.7, 0.08, 1.7, 0.02, red, { pos: [0, 2.7, -0.55] }));
  g.add(plane(1.25, 0.9, G, { pos: [0, 2.15, 0.21] }));
  for (const s of [-1, 1]) g.add(plane(1.2, 0.8, G, { pos: [s * 0.81, 2.15, -0.55], rot: [0, s * Math.PI / 2, 0] }));
  for (const [x, z] of [[-0.7, 0.15], [0.7, 0.15], [-0.7, -1.25], [0.7, -1.25]]) g.add(cyl(0.04, 0.04, 1.6, steel(0xbfc4c8), { pos: [x, 2.1, z] }, 12));
  g.add(rbox(0.5, 0.25, 0.5, 0.08, D, { pos: [0, 1.6, -0.95] }));
  g.add(rbox(0.5, 0.6, 0.12, 0.05, D, { pos: [0, 1.95, -1.2] }));
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.022, 8, 28), D); sw.position.set(0, 1.9, 0); sw.rotation.x = -0.9; g.add(sw);
  g.add(cyl(0.07, 0.07, 1.25, rust(), { pos: [0.5, 2.0, 0.85] }, 16));
  for (const s of [-1, 1]) g.add(rbox(0.3, 0.1, 1.5, 0.04, red, { pos: [s * 0.92, 1.6, -0.8] }));
  g.add(rbox(0.22, 0.2, 1.3, 0.05, D, { pos: [0, 0.55, -2.4] }));
  for (const s of [-1, 1]) {
    const rw = wheel(0.95, 0.55, { rim: 0xe0b020, spokes: 6, spin: 2 }); rw.position.set(s * 0.95, 0.95, -0.9); g.add(rw);
    const fw = wheel(0.5, 0.32, { rim: 0x3c4046, spokes: 5, spin: 3 }); fw.position.set(s * 0.8, 0.5, 1.5); g.add(fw);
  }
  return g;
}

/* ---------- pig cart (wooden cart, pig head sticking out of the front) ---------- */
export function createPigCart() {
  const g = new THREE.Group(); g.name = 'PigCart';
  const wood = surface('planks', { color: 0xffffff, rough: 0.8 }), iron = steel(0x3a3c40), pink = surface('pinkskin', { color: 0xf4a6bd, sheen: 0.4 });
  g.add(rbox(1.6, 0.14, 2.6, 0.02, wood, { pos: [0, 0.55, 0] }));
  for (const s of [-1, 1]) g.add(rbox(0.14, 0.6, 2.7, 0.03, wood, { pos: [s * 0.78, 0.9, 0] }));
  g.add(rbox(1.6, 0.6, 0.14, 0.03, wood, { pos: [0, 0.9, -1.3] }));
  for (const y of [0.6, 1.2]) for (const s of [-1, 1]) g.add(rbox(0.16, 0.06, 2.75, 0.02, iron, { pos: [s * 0.8, y, 0] }));
  const head = new THREE.Group(); head.position.set(0, 1.55, 1.25); g.add(head);
  head.add(sph(0.72, pink, { scale: [1.1, 0.95, 1] }, 32));
  head.add(cyl(0.34, 0.36, 0.5, pink, { pos: [0, -0.05, 0.9], rot: [Math.PI / 2, 0, 0] }, 32));
  head.add(cyl(0.36, 0.36, 0.06, surface('skin', { color: 0xe98aa2 }), { pos: [0, -0.05, 1.16], rot: [Math.PI / 2, 0, 0] }, 32));
  for (const s of [-1, 1]) {
    head.add(sph(0.07, dark(0x2a1418), { pos: [s * 0.12, -0.05, 1.19], scale: [1, 1.4, 0.5] }, 12));
    const e = eye(0.09, { pupil: 0.55, irisColor: 0x1c1410 }); e.position.set(s * 0.3, 0.2, 0.6); e.rotation.y = s * 0.4; head.add(e);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 14), pink); ear.position.set(s * 0.5, 0.62, 0.2); ear.rotation.set(0.3, 0, s * -0.9); ear.scale.set(1, 1, 0.4); ear.castShadow = true; head.add(ear);
  }
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3(Math.cos(t * Math.PI * 4) * 0.12, 0.7 + t * 0.12, -1.35 - t * 0.25 - 0.1 * Math.sin(t * Math.PI * 4))); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.03, 8), pink));
  for (const s of [-1, 1]) { const w = wheel(0.42, 0.14, { tire: false, rim: 0x6b4a2a, spokes: 6, spin: 2, rimMat: wood }); w.position.set(s * 0.95, 0.42, s * 0 + 0.85 * (s > 0 ? 1 : -1) * 0.0 + 0.85); g.add(w); }
  for (const s of [-1, 1]) { const w = wheel(0.42, 0.14, { tire: false, rim: 0x6b4a2a, spokes: 6, spin: 2, rimMat: wood }); w.position.set(s * 0.95, 0.42, -0.85); g.add(w); }
  return g;
}

/* ---------- giant sculpted head with hinged jaws (mouth opens toward +Z) ---------- */
const TM = Math.acos(-0.25);
const dispAt = (x, y, z) => {
  const G = (cx, cy, cz, w) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) / (2 * w * w));
  return 0.30 * G(0, -0.12, 0.96, 0.2) + 0.10 * G(-0.36, 0.30, 0.88, 0.16) + 0.10 * G(0.36, 0.30, 0.88, 0.16)
    - 0.07 * G(-0.36, 0.10, 0.9, 0.12) - 0.07 * G(0.36, 0.10, 0.9, 0.12)
    + 0.09 * G(-0.62, -0.02, 0.72, 0.2) + 0.09 * G(0.62, -0.02, 0.72, 0.2)
    + 0.10 * G(0, -0.58, 0.85, 0.16) + 0.09 * G(0, -0.92, 0.5, 0.22) + 0.05 * G(0, 0.85, 0.2, 0.4);
};
function skull(thetaStart, thetaLen, material) {
  const geo = new THREE.SphereGeometry(1, 96, 64, 0, TAU, thetaStart, thetaLen);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const r = 1 + dispAt(v.x, v.y, v.z); p.setXYZ(i, v.x * r, v.y * r, v.z * r); }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}
export function createJawTrap({ size = 14, motion = {} } = {}) {
  const g = new THREE.Group(); g.name = 'JawTrap';
  const R = size / 2, head = new THREE.Group(); head.scale.setScalar(R); head.position.y = R + 0.05; g.add(head);   // chin on the road, mouth at ~0.75R
  const skin = surface('skin', { color: 0xf1cfb4, rough: 0.5, sheen: 0.35, side: THREE.DoubleSide }), hairM = surface('hair', { color: 0xffffff, rough: 0.5, side: THREE.DoubleSide });
  const tooth = new THREE.MeshPhysicalMaterial({ color: 0xf2eee2, roughness: 0.25, clearcoat: 0.4 });
  const inside = new THREE.MeshStandardMaterial({ color: 0x3a0708, roughness: 0.9, side: THREE.BackSide });
  const mouthM = surface('mouth', { color: 0xffffff });
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.86, 40, 28), inside));
  head.add(skull(0, TM, skin));
  head.add(new THREE.Mesh(new THREE.SphereGeometry(1.075, 64, 40, 0, TAU, 0, 0.95), hairM));
  const jaw = new THREE.Group(); jaw.position.set(0, -0.25, -0.4); jaw.rotation.x = 0.5; head.add(jaw); g.userData.jaw = jaw;
  const lower = skull(TM, Math.PI - TM, skin); lower.position.set(0, 0.25, 0.4); jaw.add(lower);
  for (const s of [-1, 1]) {
    const d = new THREE.Vector3(s * 0.33, 0.12, 0.92).normalize(), r = 1 + dispAt(d.x, d.y, d.z);
    const e = eye(0.13, { pupil: 0.5, irisColor: 0x3d3024 }); e.position.copy(d.clone().multiplyScalar(r - 0.03)); e.lookAt(d.clone().multiplyScalar(3)); head.add(e);
  }
  const tg = new THREE.BoxGeometry(0.11, 0.13, 0.07);
  for (let i = -6; i <= 6; i++) {
    const a = (i / 6) * 0.85, x = Math.sin(a) * 0.74, z = Math.cos(a) * 0.74;
    const up = new THREE.Mesh(tg, tooth); up.position.set(x, -0.3, z); up.rotation.y = a; head.add(up);
    const lo = new THREE.Mesh(tg, tooth); lo.position.set(x, 0.05, z + 0.4); lo.rotation.y = a; jaw.add(lo);
  }
  const tongue = sph(0.28, mouthM, { pos: [0, -0.05, 0.9], scale: [1, 0.3, 1.5] }, 20); jaw.add(tongue);
  attachMotion(g, jaw, { type: 'swing', axis: 'x', amplitude: 0.5, direction: -1, speed: 0.3, windup: 0.5, hit: 0.06, hold: 0.14 }, motion);
  return g;
}

/* ---------- zombie: real rigged body + flaming skull orb it throws ---------- */
export function createZombie({ scale = 1 } = {}) {
  const root = createZombieBody({ scale }); root.name = 'Zombie';
  const fb = new THREE.Group(); root.add(fb);
  fb.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0xffa040, emissive: 0xff5a00, emissiveIntensity: 2.2, roughness: 0.4 })));
  fb.add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff8a20, emissive: 0xff6a00, emissiveIntensity: 1.2, transparent: true, opacity: 0.35, depthWrite: false })));
  animate(root, t => { const ph = (t * 0.8) % 1; fb.position.set(0.42, 1.25 + Math.sin(ph * Math.PI) * 0.5, 0.4 + ph * 6); fb.visible = ph < 0.95; });
  return root;
}
