// Configurable obstacle motion. attachMotion(group, pivot, defaults, cfg) drives `pivot` every frame.
// cfg (all optional): type, speed (cycles/sec), phase (0..1), delay (sec), amplitude, axis, direction (+1/-1),
//                     windup / hit / hold (fractions of one cycle), motion:false disables.
// Change at runtime: group.userData.setMotion({ type:'pendulum', speed:1.2, amplitude:0.9 })
import { animate } from './util.js';

const TAU = Math.PI * 2;
const clamp01 = x => Math.min(1, Math.max(0, x));
const easeIn = x => x * x * x, easeOut = x => 1 - Math.pow(1 - x, 3), easeInOut = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** 0 at rest -> 1 at impact -> hold -> eased return. */
export function strike(phi, { windup = 0.45, hit = 0.1, hold = 0.15 } = {}) {
  if (phi < windup) return 0;
  if (phi < windup + hit) return easeIn((phi - windup) / hit);
  if (phi < windup + hit + hold) return 1;
  return 1 - easeInOut((phi - windup - hit - hold) / (1 - windup - hit - hold));
}
/** Punch: slow pull-back (-0.25), fast thrust to 1, hold, retract. */
export function punchCurve(phi, { windup = 0.4, hit = 0.08, hold = 0.12 } = {}) {
  if (phi < windup) return -0.25 * easeInOut(phi / windup);
  if (phi < windup + hit) return -0.25 + 1.25 * easeOut((phi - windup) / hit);
  if (phi < windup + hit + hold) return 1;
  return 1 - easeInOut((phi - windup - hit - hold) / (1 - windup - hit - hold));
}

export const MOTIONS = {
  // rotation about `axis` by amplitude(rad) * direction * strike
  swing:    (p, b, phi, m) => { p.rotation[m.axis] = b.rot[m.axis] + m.direction * m.amplitude * strike(phi, m); },
  // symmetric pendulum: rotation[axis] = base + amplitude * sin
  pendulum: (p, b, phi, m) => { p.rotation[m.axis] = b.rot[m.axis] + m.direction * m.amplitude * Math.sin(phi * TAU); },
  // translation along `axis` by amplitude(m) * direction * strike (crusher press, side pincers)
  slam:     (p, b, phi, m) => { p.position[m.axis] = b.pos[m.axis] + m.direction * m.amplitude * strike(phi, m); },
  punch:    (p, b, phi, m) => { p.position[m.axis] = b.pos[m.axis] + m.direction * m.amplitude * punchCurve(phi, m); },
  // fast sideways slap: translation with ease-out strike
  slap:     (p, b, phi, m) => { const v = strike(phi, m); p.position[m.axis] = b.pos[m.axis] + m.direction * m.amplitude * (v < 1 ? easeOut(v) : 1); },
  sweep:    (p, b, phi, m) => { p.rotation[m.axis] = b.rot[m.axis] + m.direction * m.amplitude * Math.sin(phi * TAU); },
  spin:     (p, b, phi, m) => { p.rotation[m.axis] = b.rot[m.axis] + m.direction * phi * TAU; },
  // linear pass: crosses its centre at phi=0.5 (trains, sliding walls)
  sweepline:(p, b, phi, m) => { p.position[m.axis] = b.pos[m.axis] + m.direction * m.amplitude * (2 * phi - 1); },
  bob:      (p, b, phi, m) => { p.position[m.axis] = b.pos[m.axis] + m.direction * m.amplitude * Math.sin(phi * TAU); },
};

export function attachMotion(group, pivot, defaults, cfg = {}) {
  if (cfg === false) return group;
  const m = { type: 'swing', speed: 0.5, phase: 0, delay: 0, amplitude: 1, axis: 'x', direction: 1, windup: 0.45, hit: 0.1, hold: 0.15, ...defaults, ...cfg };
  const base = { rot: pivot.rotation.clone(), pos: pivot.position.clone() };
  (group.userData.motions ||= []).push(m);
  group.userData.motion = m;
  group.userData.setMotion = c => group.userData.motions.forEach(mm => Object.assign(mm, c));
  animate(group, t => {
    const f = MOTIONS[m.type]; if (!f || m.enabled === false) return;
    const tt = t - m.delay; if (tt < 0) { Object.keys(MOTIONS).length; return; }
    f(pivot, base, (((tt * m.speed + m.phase) % 1) + 1) % 1, m);
  });
  return group;
}
