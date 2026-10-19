// Turns a normalized course config into a playable level: road + terrain + trees, destroyers, roster, player.
import * as THREE from 'three';
import { terrain, makeRoad } from '../scenes/common.js';
import { hillsAway, trees } from '../scenes/scenes.js';
import { REGISTRY } from '../registry.js';
import { DESTROYERS } from './destroyers.js';

export function buildCourse(cfg) {
  const root = new THREE.Group(); root.name = 'Course';
  const road = { x: z => cfg.road.curve * Math.sin(z * cfg.road.curveFreq), y: () => 0, half: cfg.road.width / 2 + 0.5, blend: 6 };
  const T = terrain({ height: hillsAway(road, cfg.road.hill), road });
  root.add(T, makeRoad(road, { z0: cfg.road.from, z1: cfg.road.to, width: cfg.road.width, lines: cfg.road.lines }));
  trees(root, T, road, 40, 5);
  const hAt = T.userData.heightAt;
  const destroyers = [], roster = [];
  for (const it of cfg.items) {
    if (it.kind === 'destroyer') {
      const motion = { speed: it.speed, amplitude: it.amplitude, phase: it.phase };
      const obj = DESTROYERS[it.type].make(motion);
      obj.position.set(it.x, hAt(it.x, it.z), it.z); obj.rotation.y = THREE.MathUtils.degToRad(it.rot);
      obj.scale.multiplyScalar(it.scale);
      root.add(obj); destroyers.push(obj);
    } else {
      const obj = REGISTRY[it.type].make({});
      const wrap = new THREE.Group(); wrap.add(obj); wrap.visible = false; root.add(wrap);
      roster.push({ type: it.type, obj, wrap, x: it.x, z: it.z, scale: it.scale, show: it.show, launch: it.launch,
        vx: it.vx, vz: it.vz, tPass: it.launch + 4 });
    }
  }
  const pz = cfg.player.startZ;
  return {
    root, destroyers, roster, startZ: pz, startX: road.x(pz), heading: THREE.MathUtils.degToRad(cfg.player.heading), player: cfg.player.vehicle,
    duration: Math.max(8, ...roster.map(r => r.launch + 6)),
  };
}

/** Physics parameters derived from a course config (names match PHYS_DEFAULTS). */
export function courseParams(cfg) {
  return {
    player: cfg.player.vehicle, gravity: cfg.physics.gravity, friction: cfg.physics.friction,
    rosterRestitution: cfg.physics.rosterBounce, destroyerRestitution: cfg.physics.destroyerBounce,
    rosterMass: cfg.physics.rosterMass, playerMass: cfg.physics.playerMass,
    maxSpeed: cfg.player.maxSpeed, accel: cfg.player.accel, brakeForce: cfg.player.brake, coast: cfg.player.coast,
    steer: cfg.player.steer, grip: cfg.player.grip,
  };
}
