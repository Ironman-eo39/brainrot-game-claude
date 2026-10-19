// Rolling-hills road environment: asphalt w/ double yellow line, grass, hills, trees, pylons, sky.
import * as THREE from 'three';
import { buildMaps, surface, leafTexture } from '../core/textures.js';
import { mat, mesh, sphere, cyl, box, canvasTex, rng } from '../core/util.js';

export const ROAD = { width: 9, length: 160 };

export function asphalt() { return buildMaps('asphalt').map.clone(); }
export function grass() { return buildMaps('grass').map.clone(); }

export function createPylon(h = 28) {
  const g = new THREE.Group(), steel = mat(0x7a8088, { metalness: 0.5, roughness: 0.6 });
  const w = h * 0.12;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const a = new THREE.Vector3(x * w, 0, z * w), b = new THREE.Vector3(x * w * 0.25, h, z * w * 0.25);
    const m = mesh(new THREE.CylinderGeometry(0.12, 0.16, a.distanceTo(b), 6), steel);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(m);
  }
  for (let i = 1; i < 6; i++) { const y = (i / 6) * h, k = 1 - (i / 6) * 0.75; g.add(box(w * 2 * k, 0.1, 0.1, steel, { pos: [0, y, w * k] }), box(w * 2 * k, 0.1, 0.1, steel, { pos: [0, y, -w * k] }), box(0.1, 0.1, w * 2 * k, steel, { pos: [w * k, y, 0] }), box(0.1, 0.1, w * 2 * k, steel, { pos: [-w * k, y, 0] })); }
  return g;
}

export function createTree(seed = 1, h = 6) {
  const r = rng(seed), g = new THREE.Group();
  g.add(cyl(0.14, 0.24, h * 0.45, surface('bark', { color: 0xffffff }), { pos: [0, h * 0.225, 0] }, 12));
  if (seed % 3 === 0) {
    const nm = surface('needles', { color: 0xffffff, rough: 0.8 });
    for (let i = 0; i < 3; i++) g.add(mesh(new THREE.ConeGeometry(h * (0.3 - i * 0.07), h * 0.42, 14), nm, { pos: [0, h * (0.45 + i * 0.22), 0] }));
  } else {
    const lm = new THREE.MeshStandardMaterial({ map: leafTexture(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
    for (let c = 0; c < 9; c++) {
      const cx = (r() - 0.5) * h * 0.6, cy = h * (0.62 + r() * 0.3), cz = (r() - 0.5) * h * 0.6;
      for (let k = 0; k < 3; k++) { const card = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.55, h * 0.55), lm); card.position.set(cx, cy, cz); card.rotation.set(0, k * Math.PI / 3 + r(), (r() - 0.5) * 0.4); card.castShadow = true; g.add(card); }
    }
  }
  return g;
}

export function createRoadScene({ width = ROAD.width, length = ROAD.length, hills = true } = {}) {
  const g = new THREE.Group(); g.name = 'RoadScene';
  // ground + road (road runs along -Z from z=+20 toward -Z; vehicles drive toward +Z camera)
  const ground = mesh(new THREE.PlaneGeometry(400, length + 80), mat(0xffffff, { map: grass(), roughness: 1 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, -0.02, -length / 2 + 20] });
  g.add(ground);
  const road = mesh(new THREE.PlaneGeometry(width, length), mat(0xffffff, { map: asphalt(), roughness: 0.92 }), { rot: [-Math.PI / 2, 0, 0], pos: [0, 0.01, -length / 2 + 20] });
  g.add(road);
  const yellow = mat(0xf2b81c, { roughness: 0.6 }), white = mat(0xf2f2f2, { roughness: 0.6 });
  for (const x of [-0.12, 0.12]) g.add(mesh(new THREE.PlaneGeometry(0.1, length), yellow, { rot: [-Math.PI / 2, 0, 0], pos: [x, 0.02, -length / 2 + 20] }));
  for (const x of [-width / 2 + 0.3, width / 2 - 0.3]) g.add(mesh(new THREE.PlaneGeometry(0.12, length), white, { rot: [-Math.PI / 2, 0, 0], pos: [x, 0.02, -length / 2 + 20] }));
  for (const s of [-1, 1]) g.add(box(0.5, 0.05, length, mat(0x9b7a4a, { roughness: 1 }), { pos: [s * (width / 2 + 0.25), 0, -length / 2 + 20] })); // dirt shoulder
  const r = rng(7);
  if (hills) for (let i = 0; i < 14; i++) { const s = i % 2 ? 1 : -1, hs = 14 + r() * 22; g.add(sphere(1, mat(new THREE.Color().setHSL(0.27, 0.45, 0.28 + r() * 0.1), { roughness: 1 }), { pos: [s * (45 + r() * 50), 0, -r() * length + 10], scale: [hs * 1.4, hs * 0.55, hs] })); }
  for (let i = 0; i < 70; i++) { const s = r() < 0.5 ? -1 : 1; const t = createTree(i + 3, 4 + r() * 4); t.position.set(s * (8 + r() * 28), 0, 15 - r() * length); g.add(t); }
  for (const [x, z] of [[-14, -45], [18, -70]]) { const p = createPylon(); p.position.set(x, 0, z); g.add(p); }
  return g;
}

export function setupEnvironment(scene, renderer) {
  scene.background = skyTex();
  scene.fog = new THREE.Fog(0xbfdcf2, 60, 190);
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5a7a3a, 0.85); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.6); sun.position.set(-22, 38, 18); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 120; sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return { sun };
}
