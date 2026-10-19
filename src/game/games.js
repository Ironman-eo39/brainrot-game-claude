// The 10 gauntlet game styles from the md analyses, built on createGauntlet (+ custom showcase / bridge in custom.js).
import * as THREE from 'three';
import { mat, box, cyl, sphere, mesh, canvasTex } from '../core/util.js';
import { terrain, makeRoad, scatter, smooth, applyEnv } from '../scenes/common.js';
import { createTree } from '../scenes/roadScene.js';
import { place, hillsAway, trees } from '../scenes/scenes.js';
import { createGauntlet } from './gauntlet.js';
import { createMoonCar } from '../vehicles/moonCar.js';
import { createJeep, createSchoolBus } from '../vehicles/cars.js';
import { createRealCar } from '../vehicles/realCar.js';
import { createCharacter } from '../characters/photo.js';
import { createGiantHammer, createGiantAxe, createSlapHand, createPipeGate } from '../obstacles/obstacles.js';
import { createPistonGate, createJawTrap, createEvilTrain, createStompFoot, createZombie, createTractor, createPigCart, createDoubleDecker, onBoard } from '../obstacles/extra.js';
import { createShowcaseGame, createBridgeGame } from './custom.js';

const slope = (k = 0.1, o = {}) => ({ x: () => 0, y: z => Math.max(0, -z) * k, half: 4.6, blend: 8, ...o });
const moon = (color, expression, r = 0.9, seed = 3, o = {}) => () => createMoonCar({ color, expression, radius: r, seed, ...o });
const ch = (key, size, o = {}) => () => createCharacter(key, { size, ...o });
const car = (color, len = 4.2) => () => createRealCar({ color, length: len });

/** Road + hills world. extra(root, T, road) adds scenery. */
function roadWorld({ road, hill = 3, treeN = 40, lines = 'double-yellow', env, extra, seed = 5 }) {
  return () => {
    const root = new THREE.Group(), T = terrain({ height: hillsAway(road, hill), road });
    root.add(T, makeRoad(road, { z0: 30, z1: -200, lines }));
    if (treeN) trees(root, T, road, treeN, seed);
    extra?.(root, T, road);
    return { root, road, env, T };
  };
}

/* 01 axe squad: parody ball cars vs giant swinging axe, boss clown moon finale (18s, 1.5s cadence) */
const axeSquad = () => createGauntlet({
  title: 'Axe squad', interval: 1.5, travel: 2.6, spawnZ: -30, strikeZ: -2, hud: false,
  build: () => {
    const root = new THREE.Group(), road = { x: () => 0, y: () => 0, half: 4.5, blend: 6 };
    root.add(terrain({ height: (x, z) => -0.08 + smooth(70, 140, Math.hypot(x, z + 40)) * 14 }), makeRoad(road, { z0: 30, z1: -150 }));
    const cr = makeRoad({ x: () => 0, y: () => 0, half: 4, blend: 5 }, { z0: 90, z1: -90 }); cr.rotation.y = Math.PI / 2; cr.position.set(0, 0.015, -18); root.add(cr);
    root.add(place(createMoonCar({ radius: 7, color: 'white', expression: 'bulge', seed: 12 }), -13, 0, -52), place(createMoonCar({ radius: 7, color: 'clownRed', face: 'clown', seed: 4 }), 0, 0, -58), place(createMoonCar({ radius: 7, color: 'brown', expression: 'scream', seed: 9 }), 13, 0, -52));
    scatter(root, (i, r) => createTree(i + 8, 5 + r() * 3), { n: 36, x: [14, 60], z: [10, -100], seed: 6 });
    return { root, road };
  },
  destroyer: { make: () => createGiantAxe({ length: 6, motion: { amplitude: 1.4 } }), place: [-6, 0, -2, -Math.PI / 2], hitPhase: 0.53, effect: 'launch', launch: [6, 8, 2] },
  roster: [
    { make: moon('orange', 'sleepy', 0.85, 21), fate: 'smash', label: 'ninja' }, { make: moon('pink', null, 0.85, 22, { face: 'cute' }), fate: 'smash', label: 'ballerina' },
    { make: moon('blue', 'scared', 0.85, 23), fate: 'smash', label: 'blue' }, { make: moon('green', 'derp', 0.85, 24), fate: 'smash', label: 'gummy' },
    { make: moon('purple', 'smug', 0.9, 25), fate: 'smash', label: 'monster' }, { make: moon('white', 'scream', 0.85, 26), fate: 'smash', label: 'cat' },
    { make: () => createMoonCar({ radius: 3.4, color: 'clownRed', face: 'clown', seed: 4 }), fate: 'boss', label: 'boss', scale: 1 },
  ],
  camera: { pos: [0, 3.8, 10], target: [0, 2.2, -8], fov: 52, climaxFov: 38, shake: 0.3 },
}, null);

/* 02 train + zombie: stalled victims on railway, evil train sweeps through (18s, 3s cadence) */
const trainZombie = () => createGauntlet({
  title: 'Evil train', interval: 3, mode: 'static', popLead: 1.1, strikeZ: -3, spawnZ: -3,
  build: () => {
    const root = new THREE.Group(); const sand = canvasTex(256, (c, s) => { c.fillStyle = '#e2cf9d'; c.fillRect(0, 0, s, s); for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${190 + Math.random() * 50},${170 + Math.random() * 40},120,0.5)`; c.fillRect(Math.random() * s, Math.random() * s, 2, 2); } }, { repeat: [30, 30] });
    root.add(terrain({ height: (x, z) => -0.08 + smooth(-10, 25, x) * 0 + Math.max(0, x - 18) * 0.12 * Math.max(0, Math.sin(z * 0.08) + 1.2), map: sand }));
    const sea = mesh(new THREE.PlaneGeometry(400, 400), mat(0x2a8ed0, { roughness: 0.2, metalness: 0.1 }), { rot: [-Math.PI / 2, 0, 0], pos: [-215, -0.6, -60] }); sea.castShadow = false; root.add(sea);
    const g = new THREE.Group(); g.position.set(0, 0, -3);
    g.add(box(240, 0.18, 3.6, mat(0x6c655c, { roughness: 1 }), { pos: [0, 0.05, 0] }));
    for (let x = -118; x < 120; x += 0.9) g.add(box(0.28, 0.1, 2.6, mat(0x4a3322), { pos: [x, 0.17, 0] }));
    for (const z of [-0.72, 0.72]) g.add(box(240, 0.14, 0.12, mat(0x9aa0a6, { metalness: 0.9, roughness: 0.3 }), { pos: [0, 0.26, z] }));
    root.add(g);
    return { root, env: { sky: ['#4a98e8', '#9ed0f4', '#e8f4fb'], fog: [0xd2e8f6, 90, 260] } };
  },
  destroyer: { make: () => createEvilTrain(), place: [0, 0, -3], effect: 'launch', launch: [15, 7, 0] },
  roster: [
    { make: car(0xe8c820), fate: 'smash', label: 'supercar', debris: [0xe8c820, 0x222222] }, { make: () => createJeep({ color: 0xc41e1e }), fate: 'smash', label: 'jeep', debris: [0xc41e1e, 0x222222] },
    { make: createPigCart, fate: 'smash', label: 'pig cart', debris: [0xf59ab4, 0x8b5a2b] }, { make: createTractor, fate: 'smash', label: 'tractor', debris: [0xc41e1e, 0x181818] },
    { make: createSchoolBus, fate: 'smash', label: 'bus', debris: [0xf6b800, 0x111111] }, { make: car(0x18b4e6), fate: 'smash', label: 'cyan', debris: [0x18b4e6, 0x222222] },
  ],
  hooks: { update(t, api) { if (!api.zombie) { api.zombie = createZombie({ scale: 1.7 }); api.zombie.position.set(4.5, 0, 0); api.zombie.rotation.y = -0.7; api.root.add(api.zombie); } } },
  camera: { pos: [0, 3.4, 14], target: [0, 2.0, -4], fov: 52, shake: 0.4 },
}, null);

/* 03 tunnel moon: gate on hill road, first bus smashes the bars, orange moon rolls in */
const tunnelMoon = () => {
  const road = slope(0.13);
  return createGauntlet({
    title: 'Tunnel gate', interval: 1.8, travel: 2.6, spawnZ: -40, strikeZ: -8, hud: false, caption: '😱',
    build: roadWorld({ road, hill: 4, treeN: 30, seed: 7, env: {}, extra: (root, T) => { root.add(place(createPipeGate({ r: 3.4, len: 5 }), 0, road.y(-8), -8)); const ar = new THREE.Group(); ar.add(mesh(new THREE.BoxGeometry(2.6, 0.4, 0.3), mat(0xe02020, { emissive: 0x801010 }))); ar.add(mesh(new THREE.ConeGeometry(0.7, 1.3, 3), mat(0xe02020, { emissive: 0x801010 }), { pos: [1.7, 0, 0], rot: [0, 0, -Math.PI / 2], scale: [1, 1, 0.3] })); ar.rotation.set(-Math.PI / 2, 0, -0.8); ar.position.set(-3, 0.1, 5); root.add(ar); } }),
    destroyer: { make: () => new THREE.Group(), place: [0, 0, 0] },
    roster: [
      { make: () => createDoubleDecker(), fate: 'pass', label: 'bus' }, { make: createSchoolBus, fate: 'pass', label: 'school bus' },
      { make: moon('orange', 'furious', 1.9, 30), fate: 'smash', label: 'moon', effect: 'flatten', debris: [0xf08a1c, 0x8a4a2a] }, { make: car(0x2a52d8), fate: 'pass', label: 'blue' },
    ],
    hooks: { update(t, api) {
      const gate = api.world.root.children.find(o => o.name === 'PipeGate'); if (!gate) return;
      const e0 = api.ents[0], tau = Math.max(0, t - e0.tArr);
      gate.traverse(o => { if (!o.userData.bar) return; if (!o.userData.b0) { o.userData.b0 = o.position.clone(); o.userData.k = Math.random(); }
        if (t < e0.tArr) { o.position.copy(o.userData.b0); o.rotation.set(0, 0, 0); o.visible = true; } else { const k = o.userData.k, v = [(k - 0.5) * 8, 4 + k * 6, 3 + k * 5]; o.position.set(o.userData.b0.x + v[0] * tau, o.userData.b0.y + v[1] * tau - 4.9 * tau * tau, o.userData.b0.z + v[2] * tau); o.rotation.set(tau * 8 * k, tau * 5, tau * 6 * (k - 0.5)); o.visible = tau < 1.6; } });
    } },
    camera: { pos: [0, 4.6, 7], target: [0, 3.4, -12], fov: 56, shake: 0.35 },
  }, null);
};

/* 04 slap hand: roster vs giant hand slapping down (18s) */
const slapHand = () => createGauntlet({
  title: 'Slap hand', interval: 3.2, travel: 3, spawnZ: -38, strikeZ: -2,
  build: roadWorld({ road: slope(0.09), hill: 3, seed: 11 }),
  destroyer: { make: () => createSlapHand({ scale: 1.7, motion: { type: 'slam', axis: 'y', direction: -1, amplitude: 6.2, windup: 0.45, hit: 0.08, hold: 0.16 } }), place: [-2.4, 6.8, -2], hitPhase: 0.51, effect: 'flatten' },
  roster: [
    { make: () => createJeep({ color: 0xf5f5f5 }), fate: 'smash', label: 'jeep', debris: [0xf5f5f5, 0x222222] }, { make: car(0xe8c820), fate: 'smash', label: 'sports', debris: [0xe8c820, 0x222222] },
    { make: createSchoolBus, fate: 'smash', label: 'bus', debris: [0x2a62c8, 0xffffff] }, { make: ch('tralalero', 2.4), fate: 'smash', label: 'shark', debris: [0x3b5878, 0x1f6bff] },
  ],
  camera: { pos: [0, 4.0, 7.5], target: [0, 2.6, -6], fov: 58, climaxFov: 44, shake: 0.4 },
}, null);

/* 06 piston gauntlet: dual reciprocating pistons on a hill road, giant operator at the side */
const pistonGauntlet = () => createGauntlet({
  title: 'Piston gauntlet', interval: 2.8, travel: 3, spawnZ: -38, strikeZ: -2,
  build: roadWorld({ road: slope(0.12), hill: 4, seed: 13, extra: (root, T) => { root.add(place(createCharacter('tung-tung', { size: 8 }), -7, T.userData.heightAt(-7, -4), -4, 0.15)); } }),
  destroyer: { make: () => createPistonGate({ width: 7 }), place: [0, 0.96, -2], hitPhase: 0.25, passPhase: 0.75, effect: 'squeeze' },
  roster: [
    { make: ch('tralalero', 2.3), fate: 'smash', label: 'shark' }, { make: ch('bombardino', 4.2), fate: 'smash', label: 'croc plane', y: 0.8 },
    { make: ch('bobrito-bandito', 1.8), fate: 'smash', label: 'bobrito' }, { make: ch('brr-brr-patapim', 2.8), fate: 'smash', label: 'patapim' },
    { make: ch('tung-tung', 2.4), fate: 'smash', label: 'tung' }, { make: ch('tralalero', 1.3), fate: 'smash', label: 'mini shark' },
  ],
  camera: { pos: [0, 3.2, 7.5], target: [0, 2.2, -8], fov: 54, climaxFov: 40, shake: 0.35 },
}, null);

/* 07 tung gauntlet: giant wooden head obstacle + stomping foot, roster on skateboards/scooters */
const tungGauntlet = () => createGauntlet({
  title: 'Tung gauntlet', interval: 2.6, travel: 3, spawnZ: -38, strikeZ: -2,
  build: roadWorld({ road: { x: z => 0.9 * Math.sin(z * 0.04), y: () => 0, half: 4.6, blend: 6 }, hill: 3, seed: 17, extra: root => { root.add(place(createCharacter('giant-tung-head', { size: 9 }), 6.8, 0, -4, -0.1)); } }),
  destroyer: { make: () => createStompFoot({ scale: 1 }), place: [0, 0, -2], hitPhase: 0.53, effect: 'flatten' },
  roster: [
    { make: ch('brr-brr-patapim', 2.8), fate: 'smash', label: 'patapim' }, { make: () => onBoard(createCharacter('cappuccino-assassino', { size: 1.7 })), fate: 'smash', label: 'ninja' },
    { make: () => onBoard(createCharacter('ballerina-cappuccina', { size: 2.0 }), { kind: 'scooter', lift: 0.3 }), fate: 'pass', label: 'ballerina' },
    { make: ch('bombardino', 4.2), fate: 'smash', label: 'croc plane', y: 0.8 }, { make: ch('tralalero', 2.3), fate: 'smash', label: 'shark' },
    { make: () => onBoard(createCharacter('trippi-troppi', { size: 2.0 })), fate: 'pass', label: 'cat' },
  ],
  camera: { pos: [0, 5.2, 14], target: [0, 3.6, -6], fov: 54, climaxFov: 44, shake: 0.4 },
}, null);

/* 08 hammer squad: shark-shoe roster vs giant hammer (18s) */
const hammerSquad = () => createGauntlet({
  title: 'Hammer squad', interval: 2.2, travel: 2.8, spawnZ: -38, strikeZ: -2,
  build: roadWorld({ road: slope(0.1), hill: 3, seed: 19 }),
  destroyer: { make: () => createGiantHammer({ length: 6, motion: { amplitude: 1.35 } }), place: [6, 0, -2, Math.PI / 2], hitPhase: 0.53, effect: 'flatten' },
  roster: [
    { make: ch('tralalero', 2.3), fate: 'smash', label: 'shark' }, { make: ch('bombardino', 4.2), fate: 'smash', label: 'croc plane', y: 0.8 },
    { make: ch('cappuccino-assassino', 1.7), fate: 'smash', label: 'ninja' }, { make: ch('tung-tung', 2.6), fate: 'smash', label: 'tung' }, { make: ch('trippi-troppi', 2.2), fate: 'smash', label: 'cat' },
  ],
  camera: { pos: [0, 3.2, 7.5], target: [0, 2.2, -8], fov: 54, climaxFov: 38, shake: 0.45 },
}, null);

/* 10 jaw gauntlet: cars drive away into a giant head's snapping jaws; only the red car times it right */
const jawGauntlet = () => {
  const road = { x: () => 0, y: () => 0, half: 4.6, blend: 6 };
  return createGauntlet({
    title: 'Jaw gauntlet', interval: 3.4, travel: 3.4, dir: -1, spawnZ: 8, strikeZ: -27.5,
    build: () => {
      const root = new THREE.Group();
      const lt = canvasTex(256, (c, s) => { const r = ((x) => () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296)(7); c.fillStyle = '#c4200b'; c.fillRect(0, 0, s, s); c.strokeStyle = '#ffd21a'; c.lineWidth = 6; c.lineCap = 'round'; for (let i = 0; i < 30; i++) { c.beginPath(); let x = r() * s, y = r() * s; c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; c.lineTo(x, y); } c.stroke(); } }, { repeat: [20, 20] });
      const lava = mesh(new THREE.PlaneGeometry(300, 300), mat(0xffffff, { map: lt, emissive: 0xff4a00, emissiveMap: lt, emissiveIntensity: 0.7 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, -0.1, -80] }); lava.castShadow = false; root.add(lava);
      root.add(box(11, 0.6, 140, mat(0x8a8078, { roughness: 1 }), { pos: [0, -0.35, -50] }), makeRoad(road, { z0: 22, z1: -40, width: 9, lines: 'dash-white' }));
      return { root, road, env: { sky: ['#3d7de0', '#8cc4f5', '#e6c8a8'], fog: [0xe6b79a, 70, 220] } };
    },
    destroyer: { make: () => createJawTrap({ size: 10 }), place: [0, 0, -34], hitPhase: 0.54, passPhase: 0.08, effect: 'flatten' },
    roster: [
      { make: car(0xf08a1c), fate: 'smash', label: 'orange', debris: [0xf08a1c, 0x222222] },
      { make: () => { const j = createJeep({ color: 0x2fd626 }); j.scale.set(1.15, 1.35, 1.15); return j; }, fate: 'smash', label: 'monster', debris: [0x2fd626, 0x111111] },
      { make: car(0xe8c820), fate: 'near', label: 'yellow' },
      { make: () => createDoubleDecker({ lower: 0x18b4c8, upper: 0x18b4c8 }), fate: 'smash', label: 'bus', debris: [0x18b4c8, 0x222222] },
      { make: () => { const c = createRealCar({ color: 0xff69b4, length: 3.4 }); return c; }, fate: 'smash', label: 'pink', debris: [0xff69b4, 0x222222] },
      { make: car(0xd01818), fate: 'pass', label: 'red' },
    ],
    camera: { pos: [0, 4.4, 13], target: [0, 3.4, -30], fov: 54, climaxFov: 40, shake: 0.5 },
  }, null);
};
export { slope, roadWorld };

export const GAMES = {
  'axe-squad': { label: '01 Axe squad', make: axeSquad }, 'train-zombie': { label: '02 Evil train', make: trainZombie }, 'tunnel-moon': { label: '03 Tunnel gate', make: tunnelMoon },
  'slap-hand': { label: '04 Slap hand', make: slapHand }, 'hulk-punch': { label: '05 Fist showcase', make: createShowcaseGame }, 'piston-gauntlet': { label: '06 Piston gauntlet', make: pistonGauntlet },
  'tung-gauntlet': { label: '07 Tung gauntlet', make: tungGauntlet }, 'hammer-squad': { label: '08 Hammer squad', make: hammerSquad }, 'bridge-challenge': { label: '09 Player bridge', make: createBridgeGame },
  'jaw-gauntlet': { label: '10 Jaw gauntlet', make: jawGauntlet },
};
