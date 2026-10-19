// Course schema: every editable parameter, its default, its range and its label. The editor is generated from FIELDS,
// so adding a parameter here adds it to the UI and to the saved JSON.
import { REGISTRY } from '../registry.js';
import { DESTROYERS } from './destroyers.js';

export const ROSTER_GROUPS = ['moons', 'cars', 'characters', 'humans'];
export const PLAYER_TYPES = Object.keys(REGISTRY).filter(k => ROSTER_GROUPS.includes(REGISTRY[k].group));
export const LINES = ['double-yellow', 'dash-white', 'dash-yellow', 'none'];

export const COURSE_DEFAULTS = {
  name: 'my course',
  road: { width: 9, curve: 0, curveFreq: 0.035, hill: 2, lines: 'double-yellow', from: 30, to: -200 },
  physics: { gravity: 9.81, friction: 0.7, rosterBounce: 0.35, destroyerBounce: 0.55, rosterMass: 300, playerMass: 1200 },
  player: { vehicle: 'jeep', startZ: 12, heading: 180, maxSpeed: 18, accel: 9, brake: 14, coast: 3, steer: 1.1, grip: 6 },
  items: [],
};

/** One row per editable number. select: true for choice fields (options listed). */
export const FIELDS = [
  { path: 'physics.gravity', label: 'gravity (m/s²)', min: 0, max: 20, step: 0.1 },
  { path: 'physics.friction', label: 'friction', min: 0, max: 1.5, step: 0.05 },
  { path: 'physics.rosterBounce', label: 'roster bounce', min: 0, max: 1, step: 0.05 },
  { path: 'physics.destroyerBounce', label: 'destroyer bounce', min: 0, max: 1, step: 0.05 },
  { path: 'physics.rosterMass', label: 'roster mass (kg)', min: 20, max: 3000, step: 10 },
  { path: 'physics.playerMass', label: 'player mass (kg)', min: 200, max: 4000, step: 50 },
  { path: 'player.vehicle', label: 'player (vehicle or character)', select: true, options: () => PLAYER_TYPES },
  { path: 'player.startZ', label: 'start z (m)', min: -20, max: 40, step: 1 },
  { path: 'player.heading', label: 'start heading (deg, 180 = away from camera)', min: -180, max: 180, step: 1 },
  { path: 'player.maxSpeed', label: 'max speed (m/s)', min: 2, max: 40, step: 0.5 },
  { path: 'player.accel', label: 'acceleration (m/s²)', min: 1, max: 30, step: 0.5 },
  { path: 'player.brake', label: 'brake force (m/s²)', min: 2, max: 40, step: 0.5 },
  { path: 'player.coast', label: 'coast decel (m/s²)', min: 0, max: 10, step: 0.1 },
  { path: 'player.steer', label: 'steering (rad/s)', min: 0.2, max: 3, step: 0.05 },
  { path: 'player.grip', label: 'grip (1/s)', min: 0.5, max: 20, step: 0.5 },
  { path: 'road.width', label: 'road width (m)', min: 5, max: 20, step: 0.5 },
  { path: 'road.curve', label: 'road curve (m)', min: 0, max: 15, step: 0.1 },
  { path: 'road.curveFreq', label: 'curve frequency', min: 0.01, max: 0.1, step: 0.005 },
  { path: 'road.hill', label: 'hills (m)', min: 0, max: 15, step: 0.5 },
  { path: 'road.from', label: 'road starts at z', min: 0, max: 80, step: 1 },
  { path: 'road.to', label: 'road ends at z', min: -400, max: -40, step: 5 },
  { path: 'road.lines', label: 'road lines', select: true, options: () => LINES },
];

/** Per-item fields. Destroyers use speed/amplitude/phase/rot; roster items use show/launch/vx/vz. */
export const ITEM_RANGE = { x: [-15, 15], z: [-150, 40], rot: [-180, 180], scale: [0.2, 5], speed: [0, 3], amplitude: [0, 50], phase: [0, 1], show: [0, 60], launch: [0, 60], vx: [-30, 30], vz: [-30, 30] };

/** Example: a hammer across the road and a line of moons rolling into it. */
export const COURSE_EXAMPLE = {
  name: 'example: hammer and moons',
  road: { width: 9, curve: 2, curveFreq: 0.035, hill: 2, lines: 'double-yellow', from: 30, to: -200 },
  physics: {},
  player: { vehicle: 'jeep', startZ: 12, heading: 180, maxSpeed: 18, accel: 9, brake: 14, coast: 3, steer: 1.1, grip: 6 },
  items: [
    { kind: 'destroyer', type: 'hammer', x: 0, z: -8, rot: 90, scale: 1, speed: 0.5, amplitude: 1.1, phase: 0 },
    { kind: 'roster', type: 'moon-green', x: -1.2, z: -40, scale: 1, show: 0.5, launch: 0.5, vx: 0, vz: 13 },
    { kind: 'roster', type: 'moon-red', x: 1.2, z: -40, scale: 1, show: 1.5, launch: 1.5, vx: 0, vz: 13 },
    { kind: 'roster', type: 'moon-purple', x: 0, z: -40, scale: 1, show: 2.5, launch: 2.5, vx: 0, vz: 13 },
  ],
};

export function getPath(o, path) { return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
export function setPath(o, path, v) { const ks = path.split('.'), last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; }

const clampNum = (v, [lo, hi]) => Math.min(hi, Math.max(lo, Number.isFinite(+v) ? +v : lo));

/** Merges any input (a saved JSON or the editor state) over the defaults. Returns { config, warnings }. Never throws. */
export function normalizeCourse(input) {
  const warnings = [], c = structuredClone(COURSE_DEFAULTS), src = input && typeof input === 'object' ? input : {};
  if (typeof src.name === 'string') c.name = src.name.slice(0, 60);
  for (const f of FIELDS) {
    const v = getPath(src, f.path); if (v === undefined) continue;
    if (f.select) { if (f.options().includes(v)) setPath(c, f.path, v); else warnings.push(`${f.path}: "${v}" is not a known option (default kept)`); }
    else setPath(c, f.path, clampNum(v, [f.min, f.max]));
  }
  c.items = [];
  for (const it of Array.isArray(src.items) ? src.items : []) {
    const kind = it && it.kind === 'roster' ? 'roster' : 'destroyer', type = it && it.type;
    const known = kind === 'destroyer' ? !!DESTROYERS[type] : PLAYER_TYPES.includes(type);
    if (!known) { warnings.push(`item skipped: unknown ${kind} "${type}"`); continue; }
    const m = kind === 'destroyer' ? DESTROYERS[type].motion : {};
    const row = kind === 'destroyer'
      ? { kind, type, x: 0, z: -8, rot: 0, scale: 1, speed: m.speed, amplitude: m.amplitude, phase: 0 }
      : { kind, type, x: 0, z: -30, scale: 1, show: 0, launch: 0, vx: 0, vz: 10 };
    for (const k of Object.keys(row)) if (k !== 'kind' && k !== 'type' && it[k] !== undefined) row[k] = clampNum(it[k], ITEM_RANGE[k]);
    c.items.push(row);
  }
  return { config: c, warnings };
}
