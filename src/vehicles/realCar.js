// Real photoreal car from a glTF file (default: Ferrari 458 from three.js examples, CC-BY 3.0 vicent091036).
// Drop other realistic GLBs into assets/models/ and pass url + bodyMaterial/wheelNames. Faces +Z, wheels on y=0, length = `length` m.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { animate } from '../core/util.js';
import { loading } from '../core/photoRelief.js';

let loader;
function getLoader() {
  if (!loader) { const d = new DRACOLoader(); d.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/gltf/'); loader = new GLTFLoader(); loader.setDRACOLoader(d); }
  return loader;
}

export function createRealCar({ url = './assets/models/ferrari.glb', color = 0xff5a14, length = 4.6, bodyMaterial = 'Body_Color', wheelNames = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'], name = 'RealCar', spin = true, flip = true } = {}) {
  const g = new THREE.Group(); g.name = name; g.userData.color = color;
  loading.n++; window.__loading = loading.n;
  g.userData.ready = getLoader().loadAsync(url).then(gltf => {
    const car = gltf.scene, box = new THREE.Box3().setFromObject(car), size = box.getSize(new THREE.Vector3());
    const k = length / Math.max(size.x, size.z); car.scale.setScalar(k);
    car.updateMatrixWorld(true); box.setFromObject(car); const c = box.getCenter(new THREE.Vector3()); car.position.set(-c.x, -box.min.y, -c.z);
    if (flip) car.rotation.y = Math.PI;   // source model faces -Z
    const wheels = [];
    car.traverse(o => {
      if (o.isMesh) { o.castShadow = o.receiveShadow = true; const m = o.material; if (m && m.name === bodyMaterial) { m.color.set(color); m.metalness = 0.75; m.roughness = 0.28; m.clearcoat = 1; m.clearcoatRoughness = 0.05; } }
      if (wheelNames.includes(o.name)) wheels.push(o);
    });
    g.add(car); g.userData.car = car; g.userData.wheels = wheels;
    g.userData.setColor = c2 => car.traverse(o => { if (o.isMesh && o.material?.name === bodyMaterial) o.material.color.set(c2); });
    loading.n--; window.__loading = loading.n;
  }).catch(e => { console.error('realCar', e); loading.n--; window.__loading = loading.n; });
  if (spin) animate(g, (t, dt) => (g.userData.wheels || []).forEach(w => { w.rotation.x += dt * 8; }));
  return g;
}
