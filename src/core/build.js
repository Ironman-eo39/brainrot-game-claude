// Shared builders for realistic vehicles/props: rounded boxes, wheels with tread + rims, glass, paint, label decals.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { surface } from './textures.js';
import { animate } from './util.js';

const TAU = Math.PI * 2;
function place(me, o = {}) {
  if (o.pos) me.position.set(...o.pos);
  if (o.rot) me.rotation.set(...o.rot);
  if (o.scale !== undefined) me.scale.set(...(typeof o.scale === 'number' ? [o.scale, o.scale, o.scale] : o.scale));
  me.castShadow = me.receiveShadow = true; return me;
}
export const rbox = (w, h, d, r, m, o = {}) => place(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(0.004, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01))), m), o);
export const cyl = (rt, rb, h, m, o = {}, seg = 32) => place(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m), o);
export const sph = (r, m, o = {}, seg = 24) => place(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), m), o);
export const plane = (w, h, m, o = {}) => place(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), o);

export const paint = (c, o = {}) => surface('paint', { color: c, clear: 0.85, ...o });
export const dark = (c = 0x181818, o = {}) => surface('soot', { color: c, ...o });
export const chrome = (o = {}) => surface('brushed', { color: 0xd8dde3, metal: 1, ...o });
export const steel = (c = 0x9aa1a8, o = {}) => surface('brushed', { color: c, metal: 0.85, ...o });
export const rust = () => surface('rust', { color: 0xffffff });
export const glass = (o = {}) => new THREE.MeshPhysicalMaterial({ color: 0x0d1b26, roughness: 0.03, metalness: 0.05, transparent: true, opacity: 0.55, envMapIntensity: 1.8, ...o });
export const lamp = (c = 0xfff5d0, e = 0xffe9a0, k = 0.8) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: k, roughness: 0.2 });

/** Wheel with tread tyre, dished steel rim, chrome hub and spokes. Axle runs along the car's X axis. Spins with time t. */
export function wheel(r, w, { tire = true, rim = 0xaab1b8, spokes = 5, spin = 6, rimMat } = {}) {
  const root = new THREE.Group(), spinner = new THREE.Group(), axle = new THREE.Group();
  root.add(spinner); spinner.add(axle); axle.rotation.z = Math.PI / 2;
  if (tire) axle.add(cyl(r, r, w, surface('tread', { color: 0x222222, rough: 0.92 }), {}, 40));
  const rm = rimMat || steel(rim);
  axle.add(cyl(r * 0.66, r * 0.66, w * 1.02, rm, {}, 36));
  axle.add(cyl(r * 0.2, r * 0.2, w * 1.08, chrome(), {}, 24));
  for (let k = 0; k < spokes; k++) { const s = new THREE.Group(); s.rotation.y = k * TAU / spokes; s.add(rbox(r * 0.12, w * 1.04, r * 0.5, 0.02, rm, { pos: [0, 0, r * 0.31] })); axle.add(s); }
  animate(root, t => { spinner.rotation.x = -t * spin; });
  return root;
}

/** Destination/side label (e.g. "SCHOOL BUS") as a transparent decal material. */
export function labelMat(text, { color = '#141414', bg = null, w = 1024, h = 128 } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d');
  if (bg) { cx.fillStyle = bg; cx.fillRect(0, 0, w, h); }
  cx.fillStyle = color; cx.font = `900 ${Math.round(h * 0.72)}px Arial, Helvetica, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.55, alphaTest: 0.05 });
}
