// Adapts the built-in gauntlet games to the generic physics level.
export function levelFromGauntlet(game) {
  const api = game.api, root = game.root;
  const roadX = z => (api.world && api.world.road ? api.world.road.x(z) : 0);
  const mode = api.mode ?? 'move', travel = api.travel ?? 3, zS = api.zS ?? -30, zH = api.zH ?? -3;
  const isStatic = mode === 'static';
  const roster = api.ents.map(e => {
    const r = e.r, z0 = isStatic ? zH : zS, x0 = (r.lane ?? 0) + roadX(z0);
    return {
      type: r.type ?? '', obj: e.obj, wrap: e.wrap, x: x0, z: z0, scale: r.scale ?? 1,
      show: e.spawn, launch: isStatic ? Infinity : e.spawn,
      vx: isStatic ? 0 : ((r.lane ?? 0) + roadX(zH) - x0) / travel, vz: isStatic ? 0 : (zH - z0) / travel,
      tPass: e.tArr + (isStatic ? 1.2 : 0.8),
    };
  });
  return { root, destroyers: api.destroyer ? [api.destroyer] : [], roster, startZ: 12, startX: roadX(12), heading: Math.PI };
}
