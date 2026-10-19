// name -> { group, make(opts) }. Every make() accepts { size } (meters; meaning per asset) so any asset is resizable from code.
import * as THREE from 'three';
import { createMoonCar, MOON_COLORS, EXPRESSIONS } from './vehicles/moonCar.js';
import { createJeep, createSchoolBus } from './vehicles/cars.js';
import { createRealCar } from './vehicles/realCar.js';
import { createCharacter, CHARACTERS } from './characters/photo.js';
import { createRunner, createFootballer } from './characters/extras.js';
import { createEvilTrain, createTractor, createPigCart, createJawTrap, createZombie } from './obstacles/realistic.js';
import { createGiantHammer, createGiantAxe, createPunchFist, createSlapHand, createPendulum, createCrusher, createLavaPit, createDollFace, createStonePillar, createPipeGate } from './obstacles/obstacles.js';

/** Uniformly rescale any group so its largest dimension (or height with axis 'y') equals `size`. */
export function fitSize(obj, size, axis = 'max') {
  const wrap = new THREE.Group(); wrap.name = obj.name + '_sized'; wrap.add(obj);
  const b = new THREE.Box3().setFromObject(obj), s = b.getSize(new THREE.Vector3());
  const cur = axis === 'y' ? s.y : Math.max(s.x, s.y, s.z); if (cur > 0) wrap.scale.setScalar(size / cur);
  wrap.userData.ready = obj.userData.ready; wrap.userData.setMotion = obj.userData.setMotion; return wrap;
}
const sized = (make, axis = 'y') => (o = {}) => { const { size, ...rest } = o; const obj = make(rest); return size ? fitSize(obj, size, axis) : obj; };

export const REGISTRY = {};
for (const c of ['green', 'red', 'purple', 'cyan', 'yellow', 'white', 'black', 'brown', 'blue', 'orange']) REGISTRY['moon-' + c] = { group: 'moons', make: o => createMoonCar({ color: c, seed: c.length * 3 + 1, ...o }) };
REGISTRY['moon-clown'] = { group: 'moons', make: o => createMoonCar({ color: 'clownRed', face: 'clown', seed: 4, ...o }) };
REGISTRY['moon-pink'] = { group: 'moons', make: o => createMoonCar({ color: 'pink', face: 'cute', seed: 6, ...o }) };
Object.assign(REGISTRY, {
  supercar:      { group: 'cars', make: o => createRealCar({ color: 0xff5a14, length: o?.size ?? 4.6, ...o }) },
  'supercar-cyan': { group: 'cars', make: o => createRealCar({ color: 0x18b4e6, length: o?.size ?? 4.6, ...o }) },
  jeep:          { group: 'cars', make: sized(createJeep, 'max') },
  'school-bus':  { group: 'cars', make: sized(createSchoolBus, 'max') },
  runner:        { group: 'humans', make: sized(createRunner) },
  footballer:    { group: 'humans', make: sized(createFootballer) },
  hammer:        { group: 'obstacles', make: sized(createGiantHammer, 'max') },
  axe:           { group: 'obstacles', make: sized(createGiantAxe, 'max') },
  'punch-fist':  { group: 'obstacles', make: sized(createPunchFist, 'max') },
  'slap-hand':   { group: 'obstacles', make: sized(createSlapHand, 'max') },
  'pendulum-ball': { group: 'obstacles', make: o => createPendulum({ head: 'ball', ...o }) },
  'pendulum-axe':  { group: 'obstacles', make: o => createPendulum({ head: 'axe', ...o }) },
  'crusher-press': { group: 'obstacles', make: o => createCrusher({ kind: 'press', ...o }) },
  'crusher-pincer':{ group: 'obstacles', make: o => createCrusher({ kind: 'pincer', ...o }) },
  'lava-doll':   { group: 'obstacles', make: sized(createLavaPit, 'max') },
  'doll-face':   { group: 'obstacles', make: sized(o => createDollFace({ lift: 1.15, ...o }), 'max') },
  'evil-train':  { group: 'obstacles', make: sized(createEvilTrain, 'max') },
  tractor:       { group: 'cars', make: sized(createTractor, 'max') },
  'pig-cart':    { group: 'obstacles', make: sized(createPigCart, 'max') },
  'jaw-trap':    { group: 'obstacles', make: sized(o => createJawTrap({ size: 10, ...o }), 'max') },
  zombie:        { group: 'humans', make: sized(createZombie) },
  pillar:        { group: 'obstacles', make: sized(createStonePillar, 'max') },
  'pipe-gate':   { group: 'obstacles', make: sized(createPipeGate, 'max') },
});
for (const k of Object.keys(CHARACTERS)) REGISTRY[k] = { group: 'characters', make: o => createCharacter(k, o) };
export { MOON_COLORS, EXPRESSIONS };
