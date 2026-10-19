// Physics runner (Rapier, fixed 60 Hz). Runs any "level": a custom course from the editor, or a gauntlet game.
//   level = {
//     root,                       Object3D with the terrain (userData.heightAt) and everything visual
//     destroyers: [Object3D],     each mesh becomes a kinematic collider that copies its world pose every step
//     roster: [{ type, obj, wrap, x, z, scale, show, launch, vx, vz, tPass }],   dynamic bodies
//     player, startZ, startX, heading       the vehicle you drive (REGISTRY key) and where it starts
//   }
//   params: any key of PHYS_DEFAULTS (see docs/PARAMETERS.md)
import * as THREE from 'three';
import { tick } from '../core/util.js';

export const PHYS_DEFAULTS = {
  gravity: 9.81, rosterRestitution: 0.35, destroyerRestitution: 0.55, friction: 0.7,
  rosterMass: 300, playerMass: 1200, player: 'jeep',
  maxSpeed: 18, accel: 9, coast: 3, brakeForce: 14, steer: 1.1, grip: 6,
};
/** Driver input: set by keyboard, on-screen pad or URL flags. */
export const INPUT = { gas: false, brake: false, left: false, right: false };

const H = 1 / 60;
const approach = (v, t, d) => (v < t ? Math.min(t, v + d) : Math.max(t, v - d));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const T_P = new THREE.Vector3(), T_Q = new THREE.Quaternion(), T_S = new THREE.Vector3();

export function createPhysicsRun({ RAPIER, level, params = {}, REGISTRY }) {
  const P = { ...PHYS_DEFAULTS, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) };
  const root = level.root;
  const world = new RAPIER.World({ x: 0, y: -P.gravity, z: 0 });
  world.timestep = H;
  const eq = new RAPIER.EventQueue(true);
  const handles = new Map(), kin = [], roster = [];
  const stats = { smashed: 0, crashes: 0, total: level.roster.length };
  let simT = 0, accT = 0;
  root.updateMatrixWorld(true);

  // ---- ground: the terrain mesh (road carved in) as a static trimesh
  let terrain = null;
  root.traverse(o => { if (!terrain && o.isMesh && o.userData.heightAt) terrain = o; });
  const heightAt = terrain ? terrain.userData.heightAt : () => 0;
  if (terrain) {
    const g = terrain.geometry;
    world.createCollider(
      RAPIER.ColliderDesc.trimesh(new Float32Array(g.attributes.position.array), new Uint32Array(g.index.array)).setFriction(0.9).setRestitution(0.05),
      world.createRigidBody(RAPIER.RigidBodyDesc.fixed()));
  }

  // ---- destroyers: one kinematic box per mesh, following the scripted motion
  const addKin = mesh => {
    mesh.updateWorldMatrix(true, false);
    const geo = mesh.geometry; if (!geo.boundingBox) geo.computeBoundingBox();
    const c = new THREE.Vector3(), s = new THREE.Vector3();
    geo.boundingBox.getCenter(c); geo.boundingBox.getSize(s); s.multiplyScalar(0.5);
    mesh.matrixWorld.decompose(T_P, T_Q, T_S);
    const sx = Math.abs(T_S.x), sy = Math.abs(T_S.y), sz = Math.abs(T_S.z);
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(T_P.x, T_P.y, T_P.z).setRotation({ x: T_Q.x, y: T_Q.y, z: T_Q.z, w: T_Q.w }));
    const col = world.createCollider(RAPIER.ColliderDesc.cuboid(Math.max(0.03, s.x * sx), Math.max(0.03, s.y * sy), Math.max(0.03, s.z * sz))
      .setTranslation(c.x * sx, c.y * sy, c.z * sz).setRestitution(P.destroyerRestitution).setFriction(P.friction)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
    handles.set(col.handle, { kind: 'destroyer' });
    kin.push({ mesh, body });
  };
  for (const d of level.destroyers || []) d.traverse(o => { if (o.isMesh && o.geometry) addKin(o); });

  // ---- roster: dynamic bodies. Moon cars are balls (they roll); everything else is a box that stays upright.
  level.roster.forEach((it, i) => {
    const wrap = it.wrap, obj = it.obj;
    wrap.scale.setScalar(it.scale ?? 1);
    wrap.position.set(it.x, heightAt(it.x, it.z), it.z); wrap.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(wrap), size = box.getSize(new THREE.Vector3()), cen = box.getCenter(new THREE.Vector3());
    const ball = /^MoonCar/.test(obj.name || '');
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(cen.x, cen.y + 0.05, cen.z).setLinearDamping(0.05).setAngularDamping(0.4));
    if (!ball) body.lockRotations(true, true);
    const cd = ball ? RAPIER.ColliderDesc.ball(Math.max(size.x, size.y, size.z) / 2 * 0.92)
      : RAPIER.ColliderDesc.cuboid(Math.max(0.2, size.x / 2), Math.max(0.2, size.y / 2), Math.max(0.2, size.z / 2));
    const col = world.createCollider(cd.setMass(P.rosterMass).setRestitution(P.rosterRestitution).setFriction(P.friction).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), body);
    handles.set(col.handle, { kind: 'roster', idx: i });
    roster.push({
      body, wrap, ball, off: cen.clone().sub(wrap.position),
      tShow: it.show ?? 0, tLaunch: it.launch ?? it.show ?? 0,
      vel: { x: it.vx ?? 0, y: 0, z: it.vz ?? 0 }, launched: false, dead: false, tPass: it.tPass ?? (it.launch ?? 0) + 4,
    });
    wrap.visible = false;
  });

  // ---- player vehicle
  const pdef = REGISTRY[P.player] || REGISTRY.jeep;
  const pv = pdef.make({}); root.add(pv);
  const pst = { heading: level.heading ?? Math.PI, speed: 0 };      // PI = driving toward -z, away from the camera
  const sx = level.startX ?? 0, sz = level.startZ ?? 12;
  pv.position.set(sx, heightAt(sx, sz), sz); pv.rotation.set(0, pst.heading, 0); pv.updateMatrixWorld(true);
  const pbox = new THREE.Box3().setFromObject(pv), psize = pbox.getSize(new THREE.Vector3()), pcen = pbox.getCenter(new THREE.Vector3());
  const pball = /^MoonCar/.test(pv.name || '') || P.player.startsWith('moon');
  const pbody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pcen.x, pcen.y + 0.1, pcen.z).setLinearDamping(0.02).setAngularDamping(0.5));
  if (!pball) pbody.lockRotations(true, true);
  const pcd = pball ? RAPIER.ColliderDesc.ball(Math.max(psize.x, psize.y, psize.z) / 2 * 0.92)
    : RAPIER.ColliderDesc.cuboid(Math.max(0.5, psize.x / 2), Math.max(0.4, psize.y / 2), Math.max(0.8, psize.z / 2));
  const pcol = world.createCollider(pcd.setMass(P.playerMass).setRestitution(0.2).setFriction(0.6).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS), pbody);
  handles.set(pcol.handle, { kind: 'player' });
  const poff = pcen.clone().sub(pv.position);

  // ---- driving: throttle eases speed toward a target, steering turns the heading, velocity follows the heading with some grip
  function drive(h) {
    const lv = pbody.linvel(), s = pst;
    let target = INPUT.gas ? P.maxSpeed : 0, rate = INPUT.gas ? P.accel : P.coast;
    if (INPUT.brake) { target = 0; rate = P.brakeForce; }
    s.speed = approach(s.speed, target, rate * h);
    const turn = (INPUT.right ? 1 : 0) - (INPUT.left ? 1 : 0);        // right turn = heading decreases
    s.heading -= turn * P.steer * clamp(Math.abs(s.speed) / 5, 0.3, 1) * h;
    const dvx = Math.sin(s.heading) * s.speed, dvz = Math.cos(s.heading) * s.speed, k = Math.min(1, P.grip * h);
    pbody.setLinvel({ x: lv.x + (dvx - lv.x) * k, y: lv.y, z: lv.z + (dvz - lv.z) * k }, true);
    if (!pball) pbody.setRotation({ x: 0, y: Math.sin(s.heading / 2), z: 0, w: Math.cos(s.heading / 2) }, true);
  }

  function syncVisual(obj, body, off) {
    const t = body.translation(), q = body.rotation();
    obj.quaternion.set(q.x, q.y, q.z, q.w);
    const o = off.clone().applyQuaternion(obj.quaternion);
    obj.position.set(t.x - o.x, t.y - o.y, t.z - o.z);
  }

  function stepOnce() {
    simT += H;
    tick(root, simT, H);                                  // scripted motion of destroyers and animated parts
    root.updateMatrixWorld(true);
    for (const k of kin) {
      k.mesh.getWorldPosition(T_P); k.mesh.getWorldQuaternion(T_Q);
      k.body.setNextKinematicTranslation({ x: T_P.x, y: T_P.y, z: T_P.z });
      k.body.setNextKinematicRotation({ x: T_Q.x, y: T_Q.y, z: T_Q.z, w: T_Q.w });
    }
    for (const r of roster) {
      if (!r.launched && simT >= r.tLaunch) { r.launched = true; r.body.setLinvel(r.vel, true); }
      r.wrap.visible = simT >= r.tShow;
    }
    drive(H);
    world.step(eq);
    eq.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      const a = handles.get(h1), b = handles.get(h2); if (!a || !b) return;
      const ri = a.kind === 'roster' ? a : b.kind === 'roster' ? b : null;
      if (ri) {
        const other = ri === a ? b : a;
        if (other.kind === 'destroyer' || other.kind === 'player') { const it = roster[ri.idx]; if (!it.dead) { it.dead = true; stats.smashed++; } }
      }
      if ((a.kind === 'player' && b.kind === 'destroyer') || (b.kind === 'player' && a.kind === 'destroyer')) stats.crashes++;
    });
    for (const r of roster) syncVisual(r.wrap, r.body, r.off);
    syncVisual(pv, pbody, poff);
  }

  function update(dt) { accT += Math.min(dt, 0.1); while (accT >= H) { stepOnce(); accT -= H; } }
  function advanceTo(t) { while (simT < t - 1e-6) stepOnce(); }
  function hudStates() { return roster.map(r => (simT < r.tShow ? 'pending' : r.dead ? 'dead' : simT >= r.tPass ? 'ok' : 'active')); }
  function cameraPose() {
    const t = pbody.translation(), h = pst.heading, fx = Math.sin(h), fz = Math.cos(h);
    return { pos: [t.x - fx * 13, t.y + 6.2, t.z - fz * 13], target: [t.x + fx * 9, t.y + 1.0, t.z + fz * 9], fov: 54 };
  }
  function speedKmh() { const v = pbody.linvel(); return Math.hypot(v.x, v.z) * 3.6; }

  return { root, world, P, pbody, pst, update, advanceTo, stepOnce, hudStates, cameraPose, speedKmh, stats: () => ({ ...stats }), simTime: () => simT, player: pv };
}
