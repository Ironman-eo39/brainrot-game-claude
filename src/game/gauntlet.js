// Gauntlet sequencer (see the md rhythm analysis): roster spawns on a fixed cadence, a destroyer strikes in time with each arrival,
// HUD marks dead/ok, camera shakes on impact + punches in on the climax. Everything is a pure function of time t (scrubbable, loops).
import * as THREE from 'three';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), eo = x => 1 - Math.pow(1 - clamp(x), 3), lerp = (a, b, t) => a + (b - a) * t;
const srand = seed => { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

/**
 * cfg: { build(ctx)->{root,road?,env?}, interval T, travel, dir(+1 toward camera | -1 away), spawnZ, strikeZ, mode:'move'|'static', popLead,
 *        destroyer:{ make, place:[x,y,z,ry], hitPhase, passPhase, effect:'flatten'|'launch', launch:[vx,vy,vz], motion },
 *        roster:[{ make, label, fate:'smash'|'pass'|'near'|'boss', lane, y, effect, launch, scale, debris:[colors], hud }],
 *        camera:{ pos, target, fov, dolly, climaxFov, climaxLen, shake }, hooks:{ update(t, api) }, tail }
 */
export function createGauntlet(cfg, ctx) {
  const world = cfg.build(ctx), root = new THREE.Group(); root.add(world.root);
  const T = cfg.interval, travel = cfg.travel ?? 3, dir = cfg.dir ?? 1, zS = cfg.spawnZ, zH = cfg.strikeZ, mode = cfg.mode ?? 'move';
  const D = cfg.destroyer ?? {}, destroyer = D.make ? D.make() : null;
  const hitPhase = D.hitPhase ?? destroyer?.userData.hitPhase ?? 0.6, passPhase = D.passPhase ?? destroyer?.userData.passPhase ?? 0.04;
  const isPass = r => r.fate === 'pass' || r.fate === 'boss' || r.fate === 'near';
  const ph = r => (isPass(r) ? passPhase : hitPhase);
  const start = (mode === 'static' ? (cfg.popLead ?? 1.0) : travel) - Math.min(...cfg.roster.map((r, i) => i + ph(r))) * T;

  if (destroyer) {
    const p = D.place || [0, 0, 0]; destroyer.position.set(p[0], p[1], p[2]); destroyer.rotation.y = p[3] || 0; root.add(destroyer);
    destroyer.userData.setMotion?.({ speed: 1 / T, phase: -start / T, delay: 0, ...(D.motion || {}) });
  }
  const ents = cfg.roster.map((r, i) => {
    const obj = r.make(), wrap = new THREE.Group(); wrap.add(obj); wrap.visible = false; root.add(wrap);
    const tArr = start + (i + ph(r)) * T, spawn = mode === 'static' ? tArr - (cfg.popLead ?? 1.0) : tArr - travel;
    const rnd = srand(i * 97 + 5), deb = new THREE.Group(), pcs = [];
    const cols = r.debris || [0xd8d8d8, 0x777777, 0xffcc33];
    if (!isPass(r)) for (let j = 0; j < 16; j++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.12 + rnd() * 0.3, 0.1 + rnd() * 0.25, 0.1 + rnd() * 0.3), new THREE.MeshStandardMaterial({ color: cols[j % cols.length], roughness: 0.6 }));
      m.castShadow = true; deb.add(m); pcs.push({ m, v: [(rnd() - 0.5) * 9, 3 + rnd() * 7, (rnd() - 0.5) * 9], w: [rnd() * 9, rnd() * 9] });
    }
    deb.visible = false; root.add(deb);
    return { r, obj, wrap, deb, pcs, tArr, spawn, hitPos: new THREE.Vector3() };
  });
  const duration = Math.max(...ents.map(e => e.tArr)) + (cfg.tail ?? 2.6);
  const cam0 = cfg.camera, hitTimes = ents.filter(e => !isPass(e.r)).map(e => e.tArr);
  const api = { root, ents, world, destroyer, T, start, duration, mode, travel, zS, zH };

  function update(t) {
    ents.forEach(e => {
      const r = e.r, w = e.wrap, tau = t - e.tArr;
      let x, y, z;
      if (mode === 'static') {
        if (t < e.spawn) { w.visible = false; e.deb.visible = false; return; }
        z = zH; x = (r.lane ?? 0) + (world.road ? world.road.x(z) : 0); y = (world.road ? world.road.y(z) : 0) + (r.y ?? 0);
        const pop = eo((t - e.spawn) / 0.35); w.position.set(x, y, z); w.rotation.set(0, r.yaw ?? 0, 0); w.scale.setScalar((r.scale ?? 1) * pop); w.visible = true;
        if (isPass(r) && tau > 1.2) w.visible = false;
      } else {
        const u = (t - e.spawn) / travel;
        if (u < 0) { w.visible = false; e.deb.visible = false; return; }
        const zz = lerp(zS, zH, u); z = zz; x = (r.lane ?? 0) + (world.road ? world.road.x(z) : 0); y = (world.road ? world.road.y(z) : 0) + (r.y ?? 0);
        w.position.set(x, y, z); w.rotation.set(0, dir > 0 ? 0 : Math.PI, 0); w.scale.setScalar(r.scale ?? 1); w.visible = true;
        if (isPass(r)) { const past = dir > 0 ? z > (cam0.pos[2] + 4) : z < zH - 60; if (past) w.visible = false; }
      }
      if (!isPass(r) && tau >= 0) {
        if (!e.hitSet) { e.hitPos.set(mode === 'static' ? x : x, y, mode === 'static' ? zH : zH); e.hitSet = true; }
        const eff = r.effect ?? D.effect ?? 'flatten', sc0 = r.scale ?? 1;
        w.position.copy(e.hitPos); w.rotation.y = mode === 'static' ? (r.yaw ?? 0) : (dir > 0 ? 0 : Math.PI);
        if (eff === 'squeeze') {
          const s = eo(tau / 0.1), k = clamp((tau - 2.1) / 0.4); w.scale.set(sc0 * (1 - 0.9 * s) * (1 - k), sc0 * (1 + 0.1 * s) * (1 - k), sc0 * (1 + 0.15 * s) * (1 - k)); if (tau > 2.5) w.visible = false;
        } else if (eff === 'flatten') {
          const s = eo(tau / 0.08), k = clamp((tau - 2.1) / 0.4); w.scale.set(sc0 * (1 + 0.25 * s) * (1 - k), sc0 * (1 - 0.88 * s) * (1 - k), sc0 * (1 + 0.25 * s) * (1 - k));
          if (tau > 2.5) w.visible = false;
        } else {
          const v = r.launch ?? D.launch ?? [7, 9, 3]; w.position.set(e.hitPos.x + v[0] * tau, e.hitPos.y + 0.6 + v[1] * tau - 4.9 * tau * tau, e.hitPos.z + v[2] * tau);
          w.rotation.z = tau * 7 * Math.sign(v[0] || 1); w.rotation.x = tau * 3; if (tau > 2.4) w.visible = false;
        }
        e.deb.visible = tau < 1.5;
        if (e.deb.visible) e.pcs.forEach(p => { const a = tau; p.m.position.set(e.hitPos.x + p.v[0] * a, Math.max(0.06, e.hitPos.y + 0.5 + p.v[1] * a - 4.9 * a * a), e.hitPos.z + p.v[2] * a); p.m.rotation.set(p.w[0] * a, p.w[1] * a, 0); p.m.scale.setScalar(clamp(1.5 - a) / 1.0 > 1 ? 1 : clamp(1.5 - a)); });
      }
    });
    cfg.hooks?.update?.(t, api);
    // camera: base + dolly + shake + climax punch-in
    let sh = 0; hitTimes.forEach((th, k) => { const a = t - th; if (a >= 0 && a < 0.7) sh += (cam0.shake ?? 0.35) * Math.exp(-a * 9) * Math.sin(t * 70 + k); });
    const cl = cam0.climaxLen ?? 2.2, cp = clamp((t - (duration - (cfg.tail ?? 2.6) - 0.3)) / cl);
    const pos = cam0.pos.slice(), tgt = cam0.target.slice();
    pos[2] -= (cam0.dolly ?? 0) * (t / duration); pos[1] += sh; pos[0] += sh * 0.4;
    const fov = lerp(cam0.fov ?? 50, cam0.climaxFov ?? cam0.fov ?? 50, eo(cp) * (cam0.climaxFov ? 1 : 0));
    return { pos, target: tgt, fov };
  }
  const hud = {
    items: cfg.roster.map(r => ({ make: r.make, label: r.label })),
    state: t => ents.map(e => (t < e.spawn ? 'pending' : t < e.tArr ? 'active' : (e.r.hud ?? (isPass(e.r) && e.r.fate !== 'near' ? 'ok' : 'dead')))),
    caption: () => '',
  };
  return { root, duration, update, hud, api, env: world.env, title: cfg.title, showHud: cfg.hud !== false, caption: cfg.caption };
}
