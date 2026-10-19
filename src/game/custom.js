// Custom game styles: 05 fist showcase (focus each character, then one big punch) and 09 player-bridge challenge (5 different fates).
import * as THREE from 'three';
import { mat, box, cyl, sphere, mesh, canvasTex } from '../core/util.js';
import { terrain, makeRoad, scatter, smooth } from '../scenes/common.js';
import { createTree } from '../scenes/roadScene.js';
import { place } from '../scenes/scenes.js';
import { createCharacter } from '../characters/photo.js';
import { createPunchFist } from '../obstacles/obstacles.js';
import { createHand } from '../obstacles/hand.js';
import { createRealCar } from '../vehicles/realCar.js';
import { createFootballer } from '../characters/extras.js';
import { punchCurve } from '../core/motion.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t, ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const mix = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
function keyCam(keys, t) { let i = 0; while (i < keys.length - 2 && t > keys[i + 1].t) i++; const a = keys[i], b = keys[i + 1], k = ss((t - a.t) / (b.t - a.t)); return { pos: mix(a.pos, b.pos, k), target: mix(a.target, b.target, k), fov: lerp(a.fov ?? 50, b.fov ?? 50, k) }; }
function debrisSet(colors, seed = 3) {
  const g = new THREE.Group(), pcs = []; let s = seed; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let j = 0; j < 18; j++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12 + r() * 0.3, 0.1 + r() * 0.25, 0.1 + r() * 0.3), new THREE.MeshStandardMaterial({ color: colors[j % colors.length], roughness: 0.6 })); m.castShadow = true; g.add(m); pcs.push({ m, v: [(r() - 0.5) * 9, 3 + r() * 7, (r() - 0.5) * 9], w: [r() * 9, r() * 9] }); }
  g.visible = false;
  return { group: g, update(tau, p) { g.visible = tau >= 0 && tau < 1.5; if (!g.visible) return; pcs.forEach(q => { q.m.position.set(p.x + q.v[0] * tau, Math.max(0.06, p.y + 0.5 + q.v[1] * tau - 4.9 * tau * tau), p.z + q.v[2] * tau); q.m.rotation.set(q.w[0] * tau, q.w[1] * tau, 0); q.m.scale.setScalar(clamp(1.5 - tau)); }); } };
}

/* ---------- 05 fist showcase (11s): focus each character in turn, then the green fist punches through them ---------- */
export function createShowcaseGame() {
  const root = new THREE.Group(), duration = 12;
  const T = terrain({ height: (x, z) => 2 + 2.5 * Math.sin(x * 0.08) * Math.cos(z * 0.06) + smooth(40, 120, Math.abs(x)) * 14 - smooth(0, 40, -z) * 1.5 });
  root.add(T); const hAt = T.userData.heightAt;
  const hill = mesh(new THREE.SphereGeometry(1, 32, 16), mat(0x1f5d2a, { roughness: 1 }), { scale: [18, 9, 12], pos: [-14, hAt(-14, -40) - 2, -44] }); hill.castShadow = false; root.add(hill);
  scatter(root, (i, r) => createTree(i + 2, 5 + r() * 3), { n: 30, x: [16, 60], z: [6, -90], seed: 4, heightAt: hAt });
  const cast = [
    { key: 'muscle-man', size: 6.2, x: 2.5, z: -9, name: 'MUSCLE MAN', t: 0.2 }, { key: 'ballerina-cappuccina', size: 2.6, x: -3.2, z: -13, name: 'BALLERINA CAPPUCCINA', t: 3 },
    { key: 'cappuccino-assassino', size: 2.3, x: -6.5, z: -17, name: 'CAPPUCCINO ASSASSINO', t: 5.6 }, { key: 'chimpanzini', size: 2.6, x: 5.5, z: -20, name: 'CHIMPANZINI BANANINI', t: 8 },
  ].map(c => { const o = createCharacter(c.key, { size: c.size }); const w = new THREE.Group(); w.add(o); root.add(w); return { ...c, w, y: hAt(c.x, c.z) }; });
  const D = 0.76, H = 0.05, amp = 26, fx = 15;
  const fist = createPunchFist({ scale: 3.2, forearm: 6, skin: 0x2e8b3a, motion: { speed: 1 / duration, phase: 0, windup: D, hit: H, hold: 0.1, amplitude: amp, direction: 1 } });
  fist.position.set(fx, 3.4, -10); fist.rotation.y = -Math.PI / 2; root.add(fist);
  const hitT = c => { const v = (fx - c.x) / amp; let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (punchCurve(D + H * mid, { windup: D, hit: H, hold: 0.1 }) < v) lo = mid; else hi = mid; } return (D + H * lo) * duration; };
  cast.forEach(c => { c.th = hitT(c) + 0.02; });
  const keys = [
    { t: 0, pos: [6.5, 3.2, 1], target: [2.5, 3.6, -9], fov: 55 }, { t: 2.7, pos: [5, 3.2, 1], target: [2, 3.8, -9], fov: 55 }, { t: 3.4, pos: [-1, 2.2, -5], target: [-3.2, 2.0, -13], fov: 42 },
    { t: 5.2, pos: [-1.5, 2.2, -5], target: [-3.4, 2.0, -13], fov: 42 }, { t: 5.9, pos: [-4, 2.2, -9], target: [-6.5, 2.0, -17], fov: 40 }, { t: 7.6, pos: [-4, 2.2, -9], target: [-6.6, 2.0, -17], fov: 40 },
    { t: 8.2, pos: [9, 4.2, 6], target: [0, 3, -13], fov: 56 }, { t: 10.5, pos: [-3, 4, 4], target: [-6, 3, -14], fov: 56 }, { t: 12, pos: [-3, 4, 4], target: [-6, 3, -14], fov: 56 },
  ];
  function update(t) {
    cast.forEach(c => {
      const tau = t - c.th; let px = c.x, pz = c.z;
      if (c.key === 'chimpanzini') { const k = clamp((t - 7.6) / 1.2); pz = lerp(c.z, -11, ss(k)); }
      c.w.position.set(px, c.y, pz); c.w.rotation.set(0, 0, 0);
      if (tau > 0) { const v = [-14 - (c.x * 0.3), 9, -3 + c.x * 0.2]; c.w.position.set(px + v[0] * tau, c.y + 0.6 + v[1] * tau - 4.9 * tau * tau, pz + v[2] * tau); c.w.rotation.set(tau * 3, 0, tau * 9); c.w.visible = tau < 2.6; } else c.w.visible = true;
    });
    const cur = cast.filter(c => t >= c.t && t < c.t + 2.6 && t < 8.6)[0];
    const cam = keyCam(keys, t); const hitsNear = cast.some(c => t - c.th > 0 && t - c.th < 0.6);
    if (hitsNear) { const a = Math.max(...cast.map(c => (t - c.th > 0 ? Math.exp(-(t - c.th) * 8) : 0))); cam.pos[1] += a * 0.4 * Math.sin(t * 70); }
    update.caption = cur && t < 8.4 ? cur.name : '';
    return cam;
  }
  const out = { root, duration, update, env: { sky: ['#32b8e0', '#8fe0f0', '#e0f8f4'] }, hud: { items: [], state: () => [] }, showHud: false, title: 'Fist showcase' };
  out.hud.caption = () => update.caption || '';
  return out;
}

/* ---------- 09 player-bridge challenge (34s): five cars, five different fates over a bridge of players ---------- */
export function createBridgeGame() {
  const root = new THREE.Group(), SEG = 6.8, duration = SEG * 5, ZE = -26, Y0 = 2.55;
  const sea = mesh(new THREE.PlaneGeometry(600, 600), mat(0x2a8ed0, { roughness: 0.25, metalness: 0.1 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, -1.2, -120] }); sea.castShadow = false; root.add(sea);
  root.add(terrain({ w: 80, d: 280, cz: -90, seg: 60, height: (x, z) => -0.08 - smooth(18, 34, Math.abs(x)) * 5 }));
  root.add(makeRoad({ x: () => 0, y: () => 0, half: 7, blend: 5 }, { z0: 25, z1: -150, width: 14, lines: 'dash-white', edge: true }));
  const tower = new THREE.Group(); tower.add(box(3, 5, 3, mat(0xddd8cc), { pos: [0, 2.5, 0] }), box(4, 1.6, 4, mat(0x9fd6ef, { transparent: true, opacity: 0.8 }), { pos: [0, 5.8, 0] })); root.add(place(tower, 16, 0, -60));
  const players = []; for (let i = 0; i < 14; i++) { const p = createFootballer({ scale: 1.5 }); place(p, 0, 0, 3 - i * 1.8, 0); root.add(p); players.push(p); }
  const cols = [0x2fd626, 0xe8c820, 0x18b4e6, 0xff7a10, 0xff69b4];
  const cars = cols.map((c, i) => { const o = createRealCar({ color: c, length: i === 4 ? 4.4 : 4.2 }), w = new THREE.Group(); w.add(o); w.visible = false; root.add(w); return { w, o }; });
  const hand = createHand({ pose: 'fist', scale: 2.4, forearm: 7 }); const hw = new THREE.Group(); hw.add(hand); hand.rotation.z = Math.PI / 2; hand.rotation.y = 0; hw.visible = false; root.add(hw);
  const deb = debrisSet([0xff7a10, 0x222222, 0xffffff], 9), deb2 = debrisSet([0xff69b4, 0x222222, 0xffffff], 4); root.add(deb.group, deb2.group);
  const drive = u => lerp(5, ZE, clamp(u));            // z along the bridge, u 0..1 over 4.6s
  function carPose(i, tau) {                            // returns {x,y,z,rx,ry,rz,sx,sy,sz,visible}
    const P = { x: 0, y: Y0, z: drive(tau / 4.6), rx: 0, ry: Math.PI, rz: 0, sx: 1, sy: 1, sz: 1, v: true };
    if (i === 0 && tau > 4.6) { const s = tau - 4.6; P.z = ZE - 8 * s; P.y = Math.max(0, Y0 + 5.2 * s - 4.9 * s * s); P.rx = -Math.min(1, s / 1.55) * Math.PI * 2; if (P.y <= 0 && s > 1.5) { P.z = ZE - 8 * 1.55 - 5 * (s - 1.55) * Math.exp(-(s - 1.55)); P.rx = 0; } }
    if (i === 1) { if (tau > 2.4) { P.z = drive(2.4 / 4.6); const k = clamp((tau - 2.7) / 0.25); P.sy = 1 - 0.85 * k; P.sx = 1 + 0.25 * k; P.sz = P.sx; } if (tau > 3.3) { const s = tau - 3.3; P.x = -14 * s; P.y = Y0 + 7 * s - 4.9 * s * s; P.rz = s * 7; P.v = s < 1.9; } }
    if (i === 2 && tau > 4.6) { const s = tau - 4.6; P.z = ZE - 7 * s; P.y = Math.max(0, Y0 - 3 * s - 0 + (s < 0.5 ? 1.8 * s : 0)); P.y = Math.max(0, Y0 - 9 * s * s + 0.8 * Math.sin(Math.min(s, 1) * Math.PI) * 0.0); if (P.y <= 0) { P.y = 0.12 * Math.abs(Math.sin((s - 0.55) * 7)) * Math.exp(-(s - 0.55) * 2); P.z = ZE - 3.9 - 7 * (s - 0.55) * Math.exp(-(s - 0.55) * 0.8); } }
    if (i === 3 && tau > 4.6) { const s = tau - 4.6; P.z = ZE - 6 * s; P.y = Math.max(0, Y0 + 2.4 * s - 4.9 * s * s); P.ry = Math.PI + s * 9 * Math.exp(-s * 0.5); P.rz = Math.min(Math.PI, s * 2.4); if (P.y <= 0) { P.x = Math.min(4.5, (s - 0.5) * 6) ; P.y = 0.2; P.ry = Math.PI + 6; } }
    if (i === 4) { const stopZ = -17.8; if (drive(tau / 4.6) < stopZ || tau > 3.2) { P.z = lerp(5, stopZ, clamp(3.2 / 4.6)); const k = eo((tau - 3.2) / 0.1); if (tau > 3.2) { P.sx = 1 + 0.25 * k; P.sy = 1 - 0.7 * k; P.sz = 1 - 0.55 * k; } if (tau > 5.6) P.v = false; } }
    return P;
  }
  function update(t) {
    const seg = Math.min(4, Math.floor(t / SEG)), tauS = t - seg * SEG;
    cars.forEach((c, i) => { if (i !== seg) { c.w.visible = false; return; } const P = carPose(i, tauS); c.w.visible = P.v; c.w.position.set(P.x, P.y, P.z); c.w.rotation.set(P.rx, P.ry, P.rz); c.w.scale.set(P.sx, P.sy, P.sz); });
    // giant hand (seg 1)
    if (seg === 1 && tauS > 2.1 && tauS < 5.4) { hw.visible = true; const zc = drive(2.4 / 4.6); let hx = tauS < 2.5 ? lerp(18, 1.6, eo((tauS - 2.1) / 0.4)) : (tauS < 3.3 ? 1.6 : 1.6 - 15 * (tauS - 3.3)); hw.position.set(hx, Y0 + 1.2 + (tauS > 3.3 ? 3 * (tauS - 3.3) : 0), zc); } else hw.visible = false;
    // players: last blocker turns (seg 4)
    players.forEach((p, i) => { p.rotation.y = (i === 9 && seg === 4 && tauS > 1.6) ? lerp(0, Math.PI / 2, ss((tauS - 1.6) / 0.35)) : (i === 9 && seg < 4 ? 0 : (i === 9 ? 0 : 0)); });
    const dbp = new THREE.Vector3(0, Y0, drive(2.4 / 4.6)); deb.update(seg === 1 ? tauS - 2.7 : -1, dbp); deb2.update(seg === 4 ? tauS - 3.2 : -1, new THREE.Vector3(0, Y0, -17.8));
    // camera follows the current car
    const P = carPose(seg, tauS), cz = Math.min(5, Math.max(-24, P.z)), sh = seg === 1 && tauS > 2.7 && tauS < 3.3 ? 0.4 * Math.exp(-(tauS - 2.7) * 8) * Math.sin(t * 70) : seg === 4 && tauS > 3.2 && tauS < 3.9 ? 0.5 * Math.exp(-(tauS - 3.2) * 8) * Math.sin(t * 70) : 0;
    return { pos: [0, 5.8 + sh, cz + 9.5], target: [0, 2.2, cz - 9], fov: 56 };
  }
  const states = ['ok', 'dead', 'ok', 'dead', 'dead'], ends = [5.2, 3.2, 5.2, 5.6, 3.6];
  const hud = { items: cols.map(c => ({ make: () => createRealCar({ color: c, length: 4.2 }), label: '' })), state: t => cols.map((c, i) => (t < i * SEG ? 'pending' : t < i * SEG + ends[i] ? 'active' : states[i])), caption: () => '' };
  return { root, duration, update, hud, showHud: true, env: { sky: ['#4a98e8', '#9ed0f4', '#e4f3fb'], fog: [0xcfe8f6, 100, 300], hemi: [0xcfe6ff, 0x4a7a9a, 0.95] }, title: 'Player bridge' };
}
