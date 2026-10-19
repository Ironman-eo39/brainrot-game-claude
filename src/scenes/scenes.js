// All reference scenes. Each make({scene, renderer}) -> { root, cam:{pos,target,fov}, bg? }. Portrait camera (9:16) like the refs.
import * as THREE from 'three';
import { mat, mesh, sphere, cyl, box, canvasTex, rng } from '../core/util.js';
import { terrain, makeRoad, applyEnv, scatter, smooth, hillMesh, createPalm, createCandyTree, createFencePole, createArrow } from './common.js';
import { createTree, createPylon } from './roadScene.js';
import { createMoonCar } from '../vehicles/moonCar.js';
import { createJeep, createSchoolBus, createSupercar } from '../vehicles/cars.js';
import { createGiantHammer, createGiantAxe, createPunchFist, createSlapHand, createPendulum, createCrusher, createLavaPit, createStonePillar, createPipeGate } from '../obstacles/obstacles.js';
import { createCharacter } from '../characters/photo.js';
import { createRealCar } from '../vehicles/realCar.js';
import { createRunner, createFootballer } from '../characters/extras.js';

export const place = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };
export const road0 = (o = {}) => ({ x: () => 0, y: () => 0, half: 4.5, blend: 6, ...o });
const roll = (amp = 4, f = 0.05) => (x, z) => amp * (1 + Math.sin(x * f + 1) * Math.cos(z * f * 0.8)) * 0.5 + 1.2 * Math.sin(z * 0.11 + x * 0.07);
export const hillsAway = (road, amp = 4) => (x, z) => smooth(6, 45, Math.abs(x - road.x(z))) * (Math.max(0, roll(amp * 2.5)(x, z)) + 2) + smooth(70, 140, Math.abs(x)) * 22;
const lineOf = (root, n, mk, z0, dz, x = () => 0, road) => { for (let i = 0; i < n; i++) { const o = mk(i); place(o, (road ? road.x(z0 - i * dz) : 0) + x(i), road ? road.y(z0 - i * dz) : 0, z0 - i * dz); root.add(o); } };
export const trees = (root, T, road, n = 60, seed = 3) => scatter(root, (i, r) => createTree(i + seed, 4 + r() * 4), { n, x: [9, 40], z: [14, -150], seed, road, clear: 8, heightAt: T.userData.heightAt });

/** 1. Cars vs giant hammer / knight / slap hand: curved hill road. */
function hammerRoad() {
  const root = new THREE.Group(), road = road0({ x: z => 2.4 * Math.sin(z * 0.035) });
  const T = terrain({ height: hillsAway(road), road }); root.add(T, makeRoad(road, { z0: 20, z1: -180 }), );
  const cols = [['purple', 'angry'], ['red', 'angry'], ['green', 'angry', 1.5], ['cyan', 'angry'], ['yellow', 'angry']];
  cols.forEach(([c, f, r], i) => root.add(place(createMoonCar({ color: c, face: f, seed: i * 3 + 2, radius: r || 1 }), road.x(-i * 3.6) + (i % 2 ? 1.5 : -1.5), 0, -i * 3.6)));
  root.add(place(createGiantHammer(), -6.5, 0, -8, -Math.PI / 2));
  root.add(place(createCharacter('knight', { size: 5 }), 5.2, T.userData.heightAt(5.2, -10), -10, -0.2));
  root.add(place(createSlapHand({ scale: 1.3 }), -10, 3.4, -26)); trees(root, T, road);
  return { root, cam: { pos: [0, 4.6, 13], target: [0, 2.2, -10], fov: 50 } };
}

/** 2. Axe crossroads: two roads, green fields, giant moons in the background. */
function axeCrossroads() {
  const root = new THREE.Group(), road = road0();
  const T = terrain({ height: (x, z) => -0.08 + smooth(60, 130, Math.hypot(x, z + 40)) * 14, road: null }); root.add(T);
  root.add(makeRoad(road, { z0: 20, z1: -120 }));
  const cross = makeRoad(road0(), { z0: 90, z1: -90, edge: true }); cross.rotation.y = Math.PI / 2; cross.position.set(0, 0.015, -16); root.add(cross);
  const R = 7;
  root.add(place(createMoonCar({ radius: R, color: 'white', seed: 12 }), -13, 0, -50), place(createMoonCar({ radius: R, color: 'clownRed', face: 'clown', seed: 4 }), 0, 0, -58), place(createMoonCar({ radius: R, color: 'brown', seed: 9 }), 13, 0, -50));
  const small = [['pink', 'cute'], ['blue', 'angry'], ['yellow', 'angry'], ['green', 'clown'], ['purple', 'cute']];
  small.forEach(([c, f], i) => root.add(place(createMoonCar({ color: c, face: f, seed: i + 20, radius: 0.85 }), (i % 2 ? 1.2 : -1.2), 0, -2 - i * 2.8)));
  root.add(place(createGiantAxe({ length: 11 }), -8.5, 0, -9, -Math.PI / 2));
  scatter(root, (i, r) => createTree(i + 8, 5 + r() * 3), { n: 40, x: [14, 60], z: [10, -100], seed: 6, heightAt: T.userData.heightAt });
  return { root, cam: { pos: [0, 5.2, 15], target: [0, 3.4, -14], fov: 54 } };
}

/** 3. Pylon hill: giant Tung Tung with bat chasing moon cars. */
function pylonDestroyer() {
  const root = new THREE.Group(), road = road0({ x: z => -3 * Math.sin(z * 0.04) + 2, half: 4.2 });
  const T = terrain({ height: hillsAway(road, 5), road }); root.add(T, makeRoad(road, { z0: 20, z1: -180 }));
  [['black', 1.7], ['cyan', 1.0], ['purple', 1.3], ['red', 0.9]].forEach(([c, r], i) => root.add(place(createMoonCar({ color: c, radius: r, seed: i * 5 + 1 }), road.x(-i * 4) + (i % 2 ? 1.4 : -1.2), 0, -i * 4)));
  root.add(place(createCharacter('tung-tung', { size: 9 }), 5.4, T.userData.heightAt(5.4, -12), -12, -0.25));
  for (const [x, z] of [[-14, -38], [22, -62]]) root.add(place(createPylon(30), x, T.userData.heightAt(x, z), z));
  trees(root, T, road, 50, 11);
  return { root, cam: { pos: [0.5, 4.2, 17], target: [0.5, 3.4, -12], fov: 52 } };
}

/** 4. Gate road: stone gate posts, hill ramp, Tung statue, shark + bomber. */
function gateRoad() {
  const root = new THREE.Group(), road = road0({ x: z => 1.5 * Math.sin(z * 0.03), y: z => 3.2 * Math.exp(-Math.pow((z + 34) / 16, 2)), half: 4.6, blend: 8 });
  const T = terrain({ height: hillsAway(road, 4), road }); root.add(T, makeRoad(road, { z0: 20, z1: -180 }));
  for (const s of [-1, 1]) root.add(place(createStonePillar(), s * 5.4, road.y(-14), -14));
  root.add(place(createCharacter('tung-tung', { size: 9 }), -8.4, T.userData.heightAt(-8.4, -22), -22, 0.25), place(createCharacter('bobrito-bandito', { size: 4.5 }), 6.5, T.userData.heightAt(6.5, -34), -34, -0.2));
  root.add(place(createCharacter('tralalero', { size: 2.6 }), 0.4, 0, -2, 0.1));
  root.add(place(createCharacter('bombardino', { size: 6 }), 2.5, 9, -22, 0.1));
  trees(root, T, road, 40, 5);
  return { root, cam: { pos: [0, 4.2, 12], target: [0, 3, -14], fov: 52 } };
}

/** 5. Pipe tunnel: cage gate on road, bus on hill road, red arrow, palm + candy trees. */
function pipeTunnel() {
  const root = new THREE.Group(), road = road0({ x: z => 0.8 * Math.sin(z * 0.05), y: z => 4.5 * smooth(-60, -20, z), half: 4.6, blend: 6 });
  const T = terrain({ height: (x, z) => hillsAway(road, 3)(x, z) + smooth(-70, -30, z) * 3, road }); root.add(T, makeRoad(road, { z0: 20, z1: -180, lines: 'dash-white' }));
  root.add(place(createPipeGate({ r: 4.4, len: 6 }), 0, 0, -6));
  root.add(place(createSchoolBus(), road.x(-52), road.y(-52), -52, Math.PI));
  const arrow = createArrow(4); arrow.rotation.set(-Math.PI / 2, 0, -2.2); arrow.position.set(-3, 0.1, 4); root.add(arrow);
  root.add(place(createPalm(11), 10, T.userData.heightAt(10, -18), -18), place(createCandyTree(7, 3), 14, T.userData.heightAt(14, -30), -30), place(createCandyTree(6, 8), 9, T.userData.heightAt(9, -42), -42));
  trees(root, T, road, 30, 9);
  return { root, cam: { pos: [0, 7, 24], target: [0, 4, -30], fov: 56 } };
}

/** 6. Lava ramp: elevated road over lava, giant face at the end. */
function lavaRamp() {
  const root = new THREE.Group(), road = road0({ y: () => 2.2, half: 3.6 });
  const lt = canvasTex(256, (c, s) => { const r = rng(3); c.fillStyle = '#c4200b'; c.fillRect(0, 0, s, s); c.strokeStyle = '#ffd21a'; c.lineWidth = 6; c.lineCap = 'round'; for (let i = 0; i < 30; i++) { c.beginPath(); let x = r() * s, y = r() * s; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; c.lineTo(x, y); } c.stroke(); } }, { repeat: [20, 20] });
  const lava = mesh(new THREE.PlaneGeometry(300, 300), mat(0xffffff, { map: lt, emissive: 0xff4a00, emissiveMap: lt, emissiveIntensity: 0.7 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, 0, -80] }); lava.castShadow = false; root.add(lava);
  root.add(makeRoad(road, { z0: 22, z1: -64, width: 7.2, edge: true, lines: 'dash-white' }));
  for (let z = 14; z > -60; z -= 12) root.add(box(1.2, 2.2, 1.2, mat(0x777770), { pos: [0, 1.1, z] }));
  const big = createLavaPit({ w: 24, d: 20, tilt: -0.5 }); root.add(place(big, 0, 2.2, -52));
  root.add(place(createRealCar({ color: 0xe8d22a, length: 4.4 }), 0, 2.2, 2, Math.PI));
  return { root, cam: { pos: [0, 7.5, 14], target: [0, 3.5, -30], fov: 52 }, env: { sky: ['#4a8be0', '#9ccdf5', '#e6c8a8'], fog: [0xe6b79a, 60, 200] } };
}

/** 7. Squid bridge: sand yard, grey road, colored fence, runners, doll-face lava. */
function squidBridge() {
  const root = new THREE.Group(), road = road0({ half: 4 });
  const sand = canvasTex(256, (c, s) => { const r = rng(5); c.fillStyle = '#c8a46a'; c.fillRect(0, 0, s, s); for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(${150 + r() * 70},${120 + r() * 50},${70 + r() * 30},0.5)`; c.fillRect(r() * s, r() * s, 2, 2); } }, { repeat: [30, 30] });
  const T = terrain({ height: () => -0.08, map: sand }); root.add(T);
  const grey = canvasTex(64, (c, s) => { c.fillStyle = '#7d8284'; c.fillRect(0, 0, s, s); }, {});
  root.add(makeRoad(road, { z0: 20, z1: -120, lines: 'dash-white', asphaltMap: grey }));
  for (let i = -20; i <= 20; i++) root.add(place(createFencePole(8 + (i % 3)), i * 2.1, 0, -96));
  root.add(box(120, 5, 0.6, mat(0x3a9ed8), { pos: [0, 2.5, -97] }));
  const r = rng(2); for (let i = 0; i < 7; i++) root.add(place(createRunner({ scale: 1.4 }), (r() - 0.5) * 6, 0, -4 - i * 5, Math.PI));
  root.add(place(createLavaPit({ w: 6.5, d: 9, tilt: -0.85 }), 0, 0.01, -22));
  root.add(place(createCharacter('tralalero', { size: 2.4 }), -2.6, 0, 3, 0.2));
  return { root, cam: { pos: [0, 7.5, 12], target: [0, 1, -20], fov: 50 }, env: { sky: ['#53a0e6', '#a8d4f2', '#e8f4fb'], fog: [0xd8ecf8, 90, 260] } };
}

/** 8. Sea runway: coast, airstrip, column of footballers, cyan supercar on top. */
function seaRunway() {
  const root = new THREE.Group(), road = road0({ half: 6 });
  const sea = mesh(new THREE.PlaneGeometry(600, 600), mat(0x2a8ed0, { roughness: 0.25, metalness: 0.1 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, -1.2, -120] }); sea.castShadow = false; root.add(sea);
  const land = terrain({ w: 70, d: 260, cz: -80, seg: 60, height: (x, z) => -0.08 - smooth(14, 30, Math.abs(x)) * 5, road: null }); root.add(land);
  root.add(makeRoad(road, { z0: 25, z1: -150, width: 12, lines: 'dash-white', edge: true }));
  for (const s of [-1, 1]) for (let i = 0; i < 8; i++) { const p = createFootballer({ scale: 1.5 }); root.add(place(p, s * 1.3, 0, -2 - i * 1.9, 0)); }
  const car = createRealCar({ color: 0x18b4e6, length: 4.4 }); root.add(place(car, 0, 2.6, -5, 0));
  const tower = new THREE.Group(); tower.add(box(3, 5, 3, mat(0xddd8cc), { pos: [0, 2.5, 0] }), box(4, 1.6, 4, mat(0x9fd6ef, { transparent: true, opacity: 0.8 }), { pos: [0, 5.8, 0] })); root.add(place(tower, 14, 0, -50));
  return { root, cam: { pos: [0, 5, 10], target: [0, 2, -20], fov: 55 }, env: { sky: ['#4a98e8', '#9ed0f4', '#e4f3fb'], fog: [0xcfe8f6, 90, 280], hemi: [0xcfe6ff, 0x4a7a9a, 0.95] } };
}

/** 9. Giant mouth: giant Tung head eating the road, cup ninja on a skateboard. */
function giantMouth() {
  const root = new THREE.Group(), road = road0({ x: z => 1.2 * Math.sin(z * 0.04), half: 5 });
  const T = terrain({ height: hillsAway(road, 3), road }); root.add(T, makeRoad(road, { z0: 20, z1: -180, lines: 'none', edge: true }));
  root.add(place(createCharacter('giant-tung-head', { size: 11 }), 4.6, 0, -12, -0.15));
  { const sk = new THREE.Group(); sk.add(box(0.7, 0.07, 2.0, mat(0x2a2a2e), { pos: [0, 0.28, 0] }));
    for (const [x, z] of [[-0.3, 0.7], [0.3, 0.7], [-0.3, -0.7], [0.3, -0.7]]) sk.add(cyl(0.16, 0.16, 0.14, mat(0x151515), { pos: [x, 0.16, z], rot: [0, 0, Math.PI / 2] }));
    sk.add(box(0.5, 0.12, 0.6, mat(0xd02a2a), { pos: [0, 0.2, 0.7] }), box(0.5, 0.12, 0.6, mat(0xd02a2a), { pos: [0, 0.2, -0.7] }));
    const c = createCharacter('cappuccino-assassino', { size: 1.9 }); c.position.y = 0.32; sk.add(c); root.add(place(sk, -2, 0, 0.5, 0.15)); }
  trees(root, T, road, 50, 14);
  return { root, cam: { pos: [-1, 4.2, 14], target: [2, 3.2, -10], fov: 56 } };
}

/** 11. Obstacle course: every moving obstacle, all with configurable motion. */
function obstacleCourse() {
  const root = new THREE.Group(), road = road0({ half: 4.6 });
  const T = terrain({ height: hillsAway(road, 3), road }); root.add(T, makeRoad(road, { z0: 20, z1: -180 }));
  root.add(place(createCrusher({ kind: 'press', width: 7, height: 5 }), 0, 0, -8));
  root.add(place(createPendulum({ head: 'ball', armLength: 6.5, span: 9.4 }), 0, 0, -20));
  root.add(place(createCrusher({ kind: 'pincer', width: 6, height: 3.5 }), 0, 0, -32));
  root.add(place(createPunchFist({ scale: 1.6 }), -8, 3.5, -44));
  root.add(place(createSlapHand({ scale: 1.6 }), -12, 3, -56));
  root.add(place(createGiantHammer(), -7.5, 0, -68, -Math.PI / 2), place(createGiantAxe(), 7.5, 0, -68, Math.PI / 2));
  ['green', 'red', 'purple', 'cyan'].forEach((c, i) => root.add(place(createMoonCar({ color: c, radius: 0.9, seed: i + 30 }), (i % 2 ? 1.3 : -1.3), 0, 4 - i * 2.8)));
  trees(root, T, road, 40, 21);
  return { root, cam: { pos: [0, 5.5, 16], target: [0, 2.5, -30], fov: 55 } };
}

/** 10. Muscle hills: big wooden bodybuilder, ballerina + chimp in the green hills. */
function muscleHills() {
  const root = new THREE.Group();
  const T = terrain({ height: (x, z) => 2 + 2.5 * Math.sin(x * 0.08) * Math.cos(z * 0.06) - smooth(0, 30, -z) * 1 + smooth(40, 120, Math.abs(x)) * 14 }); root.add(T);
  const hAt = T.userData.heightAt;
  root.add(hillMesh(16, 9, 12, 0x1f5d2a), place(createCharacter('muscle-man', { size: 6.5 }), 1.5, hAt(1.5, -8), -8, 0));
  root.children[root.children.length - 2].position.set(-10, hAt(-10, -30) - 2, -34);
  root.add(place(createCharacter('ballerina-cappuccina', { size: 2.6 }), -4.6, hAt(-4.6, -12), -12, 0.15), place(createCharacter('chimpanzini', { size: 2.6 }), 5.4, hAt(5.4, -12), -12, -0.15), place(createCharacter('cappuccino-assassino', { size: 2.2 }), -7.4, hAt(-7.4, -16), -16, 0.2));
  scatter(root, (i, r) => createTree(i + 2, 5 + r() * 3), { n: 36, x: [14, 60], z: [6, -90], seed: 4, heightAt: hAt });
  return { root, cam: { pos: [0, 2.2, 8], target: [0, 4, -8], fov: 55 }, env: { sky: ['#32b8e0', '#8fe0f0', '#e0f8f4'] } };
}

export const SCENES = {
  'hammer-road': { label: 'Cars vs hammer / knight / hand', make: hammerRoad },
  'axe-crossroads': { label: 'Axe crossroads', make: axeCrossroads },
  'pylon-destroyer': { label: 'Pylon hill + giant Tung', make: pylonDestroyer },
  'gate-road': { label: 'Gate road + statue', make: gateRoad },
  'pipe-tunnel': { label: 'Cage pipe tunnel + bus', make: pipeTunnel },
  'lava-ramp': { label: 'Lava ramp + giant face', make: lavaRamp },
  'squid-bridge': { label: 'Squid bridge', make: squidBridge },
  'sea-runway': { label: 'Sea runway + player stack', make: seaRunway },
  'giant-mouth': { label: 'Giant mouth', make: giantMouth },
  'muscle-hills': { label: 'Muscle man hills', make: muscleHills },
  'obstacle-course': { label: 'Obstacle course (all motions)', make: obstacleCourse },
};
