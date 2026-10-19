// Shared builders. Units: meters. Y up. Models face +Z. Origin at ground contact (feet/wheels).
import * as THREE from 'three';

export const mat = (color, o = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o });

export function mesh(geo, material, { pos, rot, scale, name, shadow = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  if (scale) typeof scale === 'number' ? m.scale.setScalar(scale) : m.scale.set(...scale);
  if (name) m.name = name;
  m.castShadow = m.receiveShadow = shadow;
  return m;
}

export const sphere = (r, material, o = {}) => mesh(new THREE.SphereGeometry(r, 32, 20), material, o);
export const box = (w, h, d, material, o = {}) => mesh(new THREE.BoxGeometry(w, h, d), material, o);
export const cyl = (rt, rb, h, material, o = {}) => mesh(new THREE.CylinderGeometry(rt, rb, h, 24), material, o);
export const capsule = (r, len, material, o = {}) => mesh(new THREE.CapsuleGeometry(r, len, 8, 16), material, o);

/** Cylinder/capsule limb from point a to point b. */
export function limb(a, b, r, material, { rEnd = r, caps = true } = {}) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const geo = caps && rEnd === r ? new THREE.CapsuleGeometry(r, Math.max(len - 2 * r, 0.001), 6, 12)
                                 : new THREE.CylinderGeometry(rEnd, r, len, 16);
  const m = new THREE.Mesh(geo, material);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** Googly eye: white ball + black pupil facing +Z. */
export function eye(r, { pupil = 0.45, look = [0, 0], irisColor = 0x111111, white = 0xffffff } = {}) {
  const g = new THREE.Group();
  g.add(sphere(r, mat(white, { roughness: 0.25 })));
  const p = sphere(r * pupil, mat(irisColor, { roughness: 0.2 }));
  p.position.set(look[0] * r, look[1] * r, r * 0.85);
  g.add(p);
  return g;
}

/** Lathe from [radius, y] profile (revolved around Y). */
export const lathe = (pts, material, o = {}) =>
  mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 40), material, o);

/** Seeded RNG so procedural detail is stable between runs. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Procedural canvas texture helper. draw(ctx, size). */
export function canvasTex(size, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

/** Register a per-frame animation on a group. */
export function animate(group, fn) {
  (group.userData.updaters ||= []).push(fn);
  return group;
}
export function tick(root, t, dt) {
  root.traverse(o => o.userData.updaters?.forEach(f => f(t, dt, o)));
}

/** Vertex colors blending `top` -> `belly` by normal direction (belly faces +Z / down). */
export function bellyColors(geo, top, belly, { zk = 1, yk = 0.5, edge = 0.15 } = {}) {
  const n = geo.attributes.normal, c = new Float32Array(n.count * 3);
  const a = new THREE.Color(top), b = new THREE.Color(belly), t = new THREE.Color();
  for (let i = 0; i < n.count; i++) {
    const k = THREE.MathUtils.smoothstep(n.getZ(i) * zk - n.getY(i) * yk, -edge, edge);
    t.copy(a).lerp(b, k); c.set([t.r, t.g, t.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}
