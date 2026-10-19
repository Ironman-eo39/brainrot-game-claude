// Real rigged humanoids (three.js examples: Soldier, Xbot; Mixamo rigs, free for use). Tinted per body region, animated with real clips.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { animate } from '../core/util.js';
import { loading } from '../core/photoRelief.js';

let loader; const cache = new Map();
function gl() { if (!loader) { const d = new DRACOLoader(); d.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/gltf/'); loader = new GLTFLoader(); loader.setDRACOLoader(d); } return loader; }
function loadModel(url) { if (!cache.has(url)) cache.set(url, gl().loadAsync(url)); return cache.get(url); }

/** Vertex-colour the body by height fraction: shoes < 0.08, pants < 0.5, shirt < 0.86, skin above. */
function tintByRegion(model, parts) {
  const meshes = []; model.traverse(o => { if (o.isMesh) meshes.push(o); });
  let minY = Infinity, maxY = -Infinity;
  for (const m of meshes) { m.geometry.computeBoundingBox(); minY = Math.min(minY, m.geometry.boundingBox.min.y); maxY = Math.max(maxY, m.geometry.boundingBox.max.y); }
  const H = maxY - minY, cols = { skin: new THREE.Color(parts.skin), shirt: new THREE.Color(parts.shirt), pants: new THREE.Color(parts.pants), shoes: new THREE.Color(parts.shoes) };
  for (const m of meshes) {
    m.geometry = m.geometry.clone();
    const p = m.geometry.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) - minY) / H, col = t < 0.08 ? cols.shoes : t < 0.5 ? cols.pants : t < 0.86 ? cols.shirt : cols.skin;
      c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
    }
    m.geometry.setAttribute('color', new THREE.BufferAttribute(c, 3));
    m.material = Array.isArray(m.material) ? m.material.map(mt => mt.clone()) : m.material.clone();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    mats.forEach(mt => { if (/visor|glass|eye/i.test(mt.name)) return; mt.vertexColors = true; mt.color.set(0xffffff); mt.roughness = 0.6; });
  }
}

/** Generic rigged human that plays a real clip. `height` in metres. */
export function makeHuman({ url, height = 1.8, parts, clip = 'Idle', speed = 1, name = 'Human' } = {}) {
  const root = new THREE.Group(); root.name = name; const holder = new THREE.Group(); root.add(holder);
  loading.n++; window.__loading = loading.n;
  root.userData.ready = loadModel(url).then(gltf => {
    const model = clone(gltf.scene);
    model.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    tintByRegion(model, parts);
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model), sz = box.getSize(new THREE.Vector3()), k = height / sz.y;
    model.scale.setScalar(k); model.position.y = -box.min.y * k; holder.add(model);
    const mixer = new THREE.AnimationMixer(model), cl = gltf.animations.find(a => a.name === clip) || gltf.animations[0];
    mixer.clipAction(cl).play(); root.userData.mixer = mixer; root.userData.speed = speed; root.userData.model = model;
    loading.n--; window.__loading = loading.n;
  }).catch(e => { console.error('human', e); loading.n--; window.__loading = loading.n; });
  animate(root, t => { if (root.userData.mixer) root.userData.mixer.setTime(t * root.userData.speed); });
  return root;
}

const SOLDIER = './assets/models/Soldier.glb', XBOT = './assets/models/Xbot.glb';
/** Football/runner player: real rigged soldier body in kit colours (no real-person likeness). */
export function createFootballer({ kit = 0xf2d21c, shorts = 0x1e4fd0, scale = 1 } = {}) {
  return makeHuman({ url: SOLDIER, height: 1.85 * scale, parts: { skin: 0xc68b67, shirt: kit, pants: shorts, shoes: 0xf4f4f4 }, clip: 'Idle', name: 'Footballer' });
}
export function createRunner({ scale = 1, shirt = 0x1f8a5a } = {}) {
  return makeHuman({ url: SOLDIER, height: 1.85 * scale, parts: { skin: 0xc68b67, shirt, pants: shirt, shoes: 0x111111 }, clip: 'Run', speed: 1.4, name: 'Runner' });
}
export function createZombieBody({ scale = 1 } = {}) {
  return makeHuman({ url: XBOT, height: 1.8 * scale, parts: { skin: 0x6e8c58, shirt: 0x2a2420, pants: 0x23201c, shoes: 0x101010 }, clip: 'walk', speed: 0.7, name: 'Zombie' });
}
