// Poseable realistic-proportion human hand (fingers along +Y, palm faces +Z, thumb toward +X). Pose: open | fist | slap | point.
import * as THREE from 'three';
import { mat, mesh, sphere, rng, canvasTex } from '../core/util.js';

function skinMaterial(color) {
  const r = rng(7);
  const bump = canvasTex(256, (c, s) => { c.fillStyle = '#808080'; c.fillRect(0, 0, s, s); for (let i = 0; i < 5000; i++) { const v = 100 + r() * 60; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(r() * s, r() * s, 2, 2); } c.strokeStyle = 'rgba(60,60,60,0.5)'; for (let i = 0; i < 18; i++) { c.beginPath(); const y = r() * s; c.moveTo(0, y); c.bezierCurveTo(s * .3, y + 6, s * .6, y - 6, s, y); c.stroke(); } }, { srgb: false, repeat: [2, 2] });
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.52, bumpMap: bump, bumpScale: 0.6, sheen: 1, sheenColor: new THREE.Color(0xffb08a), sheenRoughness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.5 });
}

const POSES = {
  open:  { fingers: [[0.12, 0.08, 0.05], [0.1, 0.06, 0.04], [0.12, 0.08, 0.05], [0.16, 0.1, 0.06]], spread: 0.06, thumb: { base: -0.7, curl: [0.1, 0.05] } },
  slap:  { fingers: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], spread: 0.02, thumb: { base: -0.35, curl: [0, 0] } },
  fist:  { fingers: [[1.45, 1.65, 1.2], [1.5, 1.7, 1.2], [1.55, 1.7, 1.2], [1.6, 1.7, 1.15]], spread: 0, thumb: { base: 0.55, curl: [0.7, 1.15], across: true } },
  point: { fingers: [[0, 0, 0], [1.5, 1.7, 1.2], [1.55, 1.7, 1.2], [1.6, 1.7, 1.15]], spread: 0, thumb: { base: 0.55, curl: [0.7, 1.15], across: true } },
};

export function createHand({ pose = 'open', scale = 1, forearm = 3, skin = 0xc98c68, sleeve = null } = {}) {
  const g = new THREE.Group(); g.name = 'Hand';
  const M = skinMaterial(skin), nail = mat(0xf2cdbd, { roughness: 0.25 });
  const root = new THREE.Group(); root.scale.setScalar(scale); g.add(root);
  // palm + back-of-hand
  const palm = mesh(new THREE.BoxGeometry(0.92, 1.0, 0.36, 4, 4, 2), M, { name: 'palm' });
  const pp = palm.geometry.attributes.position; for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), y = pp.getY(i); pp.setX(i, x * (1 - 0.06 * (y < 0 ? 1 : 0) * 1.4)); pp.setZ(i, pp.getZ(i) * (1 - 0.25 * Math.abs(x))); } palm.geometry.computeVertexNormals();
  root.add(palm);
  root.add(mesh(new THREE.CapsuleGeometry(0.4, 0.22, 8, 16), M, { pos: [0, -0.56, 0], scale: [1, 0.55, 0.62] }));   // heel of hand
  // forearm
  root.add(mesh(new THREE.CylinderGeometry(0.34, 0.46, forearm, 24), sleeve ? mat(sleeve, { roughness: 0.8 }) : M, { pos: [0, -0.62 - forearm / 2, 0], scale: [1, 1, 0.9] }));
  const cfg = POSES[pose] || POSES.open, fingers = [], fl = [[0.40, 0.27, 0.22], [0.44, 0.30, 0.23], [0.40, 0.28, 0.22], [0.31, 0.2, 0.18]], fr = [0.095, 0.1, 0.092, 0.08], fx = [-0.33, -0.11, 0.11, 0.33];
  fx.reverse();   // index nearest thumb (+x)
  for (let f = 0; f < 4; f++) {
    const k = new THREE.Group(); k.position.set(fx[f], 0.5, 0.02); k.rotation.z = (f - 1.5) * -cfg.spread; root.add(k);
    let parent = k; const segs = [];
    for (let s = 0; s < 3; s++) {
      const L = fl[f][s], r = fr[f] * (1 - s * 0.13), j = new THREE.Group(); j.position.y = s === 0 ? 0 : fl[f][s - 1]; parent.add(j);
      j.add(mesh(new THREE.CapsuleGeometry(r, L - 2 * r, 6, 12), M, { pos: [0, L / 2, 0], scale: [1, 1, 0.9] }));
      j.add(sphere(r * 1.02, M, { pos: [0, 0, 0] }));
      if (s === 2) j.add(mesh(new THREE.SphereGeometry(r * 0.78, 12, 8), nail, { pos: [0, L * 0.62, -r * 0.55], scale: [1, 1.1, 0.35] }));
      j.rotation.x = cfg.fingers[f][s]; segs.push(j); parent = j;
    }
    fingers.push(segs);
  }
  // thumb: metacarpal + 2 phalanges from the +x side of the palm
  const t = new THREE.Group(); t.position.set(0.46, -0.2, 0.08); t.rotation.z = -0.55 - cfg.thumb.base * 0.5; t.rotation.y = cfg.thumb.across ? -0.9 : 0; root.add(t);
  const tl = [0.42, 0.3, 0.26], tr = 0.12; let tp = t; const tsegs = [];
  for (let s = 0; s < 3; s++) {
    const j = new THREE.Group(); j.position.y = s === 0 ? 0 : tl[s - 1]; tp.add(j);
    j.add(mesh(new THREE.CapsuleGeometry(tr * (1 - s * 0.14), tl[s] - 2 * tr * (1 - s * 0.14), 6, 12), M, { pos: [0, tl[s] / 2, 0] })); j.add(sphere(tr * (1 - s * 0.14), M));
    if (s === 2) j.add(mesh(new THREE.SphereGeometry(0.085, 12, 8), nail, { pos: [0, tl[s] * 0.6, -0.07], scale: [1, 1.1, 0.35] }));
    j.rotation.x = s === 0 ? 0 : cfg.thumb.curl[s - 1]; tsegs.push(j); tp = j;
  }
  g.userData = { fingers, thumb: tsegs, pose, root };
  return g;
}
