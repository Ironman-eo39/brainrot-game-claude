// Shared scene tools: heightfield terrain with a carved road, road ribbons + lane lines, sky/lighting, set-dressing props.
import * as THREE from 'three';
import { makeSkyTexture } from '../core/textures.js';
import { mat, mesh, sphere, cyl, box, canvasTex, rng } from '../core/util.js';
import { asphalt, grass } from './roadScene.js';

export const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = THREE.MathUtils.lerp;

/** road = { x(z), y(z), half, blend }. Road runs along z; vehicles drive toward +z (camera). */
export function terrain({ w = 320, d = 320, cx = 0, cz = -90, seg = 170, height = () => 0, road = null, map = grass(), color = 0xffffff } = {}) {
  const heightAt = (x, z) => {
    let y = height(x, z);
    if (road) { const k = 1 - smooth(road.half, road.half + road.blend, Math.abs(x - road.x(z))); y = lerp(y, road.y(z) - 0.08, k); }
    return y;
  };
  const geo = new THREE.PlaneGeometry(w, d, seg, seg); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz; p.setXYZ(i, x, heightAt(x, z), z); uv.setXY(i, x / 10, z / 10); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map, color, roughness: 1 })); m.receiveShadow = true; m.userData.heightAt = heightAt; return m;
}

function ribbon(road, { z0, z1, offset = 0, width, lift = 0.02, material, vScale = 4 }) {
  const n = Math.max(2, Math.ceil(Math.abs(z1 - z0))), pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const z = lerp(z0, z1, i / n), x = road.x(z) + offset, y = road.y(z) + lift;
    pos.push(x - width / 2, y, z, x + width / 2, y, z); uv.push(0, i * Math.abs(z1 - z0) / n / vScale, 1, i * Math.abs(z1 - z0) / n / vScale);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, material); m.receiveShadow = true; return m;
}
const dashTex = (color) => canvasTex(64, (c, s) => { c.fillStyle = color; c.fillRect(8, 0, s - 16, s * 0.5); }, { srgb: true });
const lineMat = (color, dashed) => dashed
  ? new THREE.MeshStandardMaterial({ map: dashTex(color), transparent: true, alphaTest: 0.5, roughness: 0.7, side: THREE.DoubleSide })
  : new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide });

/** lines: 'double-yellow' | 'dash-white' | 'dash-yellow' | 'none' */
export function makeRoad(road, { z0 = 20, z1 = -200, width = 9, lines = 'double-yellow', edge = true, asphaltMap = asphalt() } = {}) {
  const g = new THREE.Group(); g.name = 'Road';
  const base = new THREE.MeshStandardMaterial({ map: asphaltMap.clone(), roughness: 0.92, side: THREE.DoubleSide });
  base.map.repeat.set(width / 3, Math.abs(z1 - z0) / 12); base.map.needsUpdate = true;
  g.add(ribbon(road, { z0, z1, width, lift: 0, material: base, vScale: 12 }));
  const o = { z0, z1 };
  if (lines === 'double-yellow') for (const s of [-1, 1]) g.add(ribbon(road, { ...o, offset: s * 0.13, width: 0.12, lift: 0.02, material: lineMat(0xf2b81c, false) }));
  if (lines === 'dash-white') g.add(ribbon(road, { ...o, width: 0.18, lift: 0.02, material: lineMat('#f4f4f4', true), vScale: 6 }));
  if (lines === 'dash-yellow') g.add(ribbon(road, { ...o, width: 0.16, lift: 0.02, material: lineMat('#f2b81c', true), vScale: 6 }));
  if (edge) for (const s of [-1, 1]) g.add(ribbon(road, { ...o, offset: s * (width / 2 - 0.3), width: 0.14, lift: 0.02, material: lineMat(0xf2f2f2, false) }));
  return g;
}

/** Outdoor reflection environment (sky dome gradient -> PMREM) so paint/chrome/glass reflect something believable. */
export function skyEnvironment(renderer, { top = 0x4a8be0, horizon = 0xdfeefa, ground = 0x6b7a55 } = {}) {
  const sc = new THREE.Scene(), geo = new THREE.SphereGeometry(50, 32, 16), col = [], p = geo.attributes.position;
  const a = new THREE.Color(top), b = new THREE.Color(horizon), c = new THREE.Color(ground), t = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 50; if (y > 0) t.copy(b).lerp(a, Math.pow(y, 0.6)); else t.copy(b).lerp(c, Math.min(1, -y * 3)); col.push(t.r, t.g, t.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  sc.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const sun = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d8 })); sun.position.set(-30, 35, 20); sc.add(sun);
  const pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(sc, 0.02).texture; pm.dispose(); return tex;
}

/** Sky gradient + fog + sun. Returns { sun }. */
export function applyEnv(scene, renderer, { sky = ['#3d7de0', '#8cc4f5', '#dff0fb'], fog = [0xbfdcf2, 70, 210], sunPos = [-22, 38, 18], sunI = 2.6, hemi = [0xcfe6ff, 0x5a7a3a, 0.85] } = {}) {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, sky[0]); gr.addColorStop(0.6, sky[1]); gr.addColorStop(1, sky[2]); c.fillStyle = gr; c.fillRect(0, 0, 4, 256);
  scene.background = makeSkyTexture(sky);
  scene.fog = fog ? new THREE.Fog(fog[0], fog[1], fog[2]) : null;
  scene.add(new THREE.HemisphereLight(hemi[0], hemi[1], hemi[2]));
  const sun = new THREE.DirectionalLight(0xfff1d6, sunI); sun.position.set(...sunPos); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -36; sc.right = 36; sc.top = 36; sc.bottom = -36; sc.near = 1; sc.far = 140; sun.shadow.bias = -0.0004;
  sun.target.position.set(0, 0, -12); scene.add(sun, sun.target);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.environment = skyEnvironment(renderer, { top: new THREE.Color(sky[0]), horizon: new THREE.Color(sky[2]) }); scene.environmentIntensity = 0.9;
  return { sun };
}

/** Scatter helper: place factory(i) results with a seeded random in an annulus-free region, skipping the road corridor. */
export function scatter(parent, factory, { n = 40, x = [8, 40], z = [10, -150], seed = 1, road = null, clear = 0, heightAt = () => 0 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const s = r() < 0.5 ? -1 : 1, px = s * lerp(x[0], x[1], r()), pz = lerp(z[0], z[1], r());
    if (road && Math.abs(px - road.x(pz)) < clear) continue;
    const o = factory(i, r); o.position.set(px, heightAt(px, pz), pz); o.rotation.y = r() * 6.28; parent.add(o);
  }
}
export function hillMesh(rx, ry, rz, color, seed = 1) {
  const m = sphere(1, mat(color, { roughness: 1 }), { scale: [rx, ry, rz] }); m.castShadow = false; return m;
}
export function createPalm(h = 9) {
  const g = new THREE.Group(), trunk = mat(0x8a6a3a), leaf = mat(0x2f9a3a, { roughness: 0.8, side: THREE.DoubleSide });
  const curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0.3, h * 0.4, 0], [0.1, h * 0.75, 0], [-0.3, h, 0]].map(p => new THREE.Vector3(...p)));
  g.add(mesh(new THREE.TubeGeometry(curve, 12, 0.28, 8), trunk));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const l = mesh(new THREE.CapsuleGeometry(0.35, h * 0.38, 4, 8), leaf, { scale: [1, 1, 0.12] }); const piv = new THREE.Group(); piv.position.set(-0.3, h, 0); piv.rotation.set(0, a, 1.15); l.position.y = h * 0.22; piv.add(l); g.add(piv); }
  return g;
}
export function createCandyTree(h = 6, seed = 1) {
  const r = rng(seed), g = new THREE.Group(); g.add(cyl(0.3, 0.4, h * 0.5, mat(0xf4e6cf), { pos: [0, h * 0.25, 0] }));
  const cols = [0xff6fa8, 0x6fd6ff, 0xffd84a, 0x8f6fff, 0x6fe08a];
  for (let i = 0; i < 4; i++) g.add(sphere(h * (0.26 - i * 0.02), mat(cols[(i + (r() * 5 | 0)) % 5], { roughness: 0.4 }), { pos: [(r() - 0.5) * 1.6, h * (0.6 + i * 0.1), (r() - 0.5) * 1.6] }));
  return g;
}
export function createFencePole(h = 6, colors = [0xe03a3a, 0xf2c81c, 0x3a7be0, 0x36b84a]) {
  const g = new THREE.Group(); colors.forEach((c, i) => g.add(cyl(0.18, 0.18, h, mat(c, { roughness: 0.5 }), { pos: [i * 0.5, h / 2, 0] }))); return g;
}
export function createArrow(len = 4) {
  const g = new THREE.Group(), red = mat(0xe02020, { emissive: 0x801010, roughness: 0.4 });
  g.add(box(len * 0.7, 0.5, 0.3, red, { pos: [-len * 0.15, 0, 0] }));
  g.add(mesh(new THREE.ConeGeometry(0.9, len * 0.4, 3), red, { pos: [len * 0.35, 0, 0], rot: [0, 0, -Math.PI / 2], scale: [1, 1, 0.35] }));
  return g;
}
