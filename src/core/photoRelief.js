// Photo-relief: a cut-out reference photo becomes an inflated mesh.
// Front = the photo (exact). Back = the same photo treated as a flat sheet seen from behind: mirrored, softened, darkened.
// Sides = real rim walls (not paper-thin) coloured from the photo's own edge pixels, so turns look like a solid body.
import * as THREE from 'three';
import { animate } from './util.js';

export const loading = { n: 0 };
const imgCache = new Map();
function loadImage(url) {
  if (!imgCache.has(url)) imgCache.set(url, new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('cannot load ' + url)); i.src = url; }));
  return imgCache.get(url);
}

function distanceField(mask, gw, gh) {
  const d = new Float32Array(gw * gh), INF = 1e9;
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? INF : 0;
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const i = y * gw + x; if (!d[i]) continue; let v = d[i];
    if (x === 0 || y === 0) v = Math.min(v, 1);
    if (x > 0) v = Math.min(v, d[i - 1] + 1);
    if (y > 0) { v = Math.min(v, d[i - gw] + 1); if (x > 0) v = Math.min(v, d[i - gw - 1] + 1.414); if (x < gw - 1) v = Math.min(v, d[i - gw + 1] + 1.414); }
    d[i] = v;
  }
  for (let y = gh - 1; y >= 0; y--) for (let x = gw - 1; x >= 0; x--) {
    const i = y * gw + x; if (!d[i]) continue; let v = d[i];
    if (x === gw - 1 || y === gh - 1) v = Math.min(v, 1);
    if (x < gw - 1) v = Math.min(v, d[i + 1] + 1);
    if (y < gh - 1) { v = Math.min(v, d[i + gw] + 1); if (x < gw - 1) v = Math.min(v, d[i + gw + 1] + 1.414); if (x > 0) v = Math.min(v, d[i + gw - 1] + 1.414); }
    d[i] = v;
  }
  return d;
}
function blur(d, gw, gh, mask, passes = 2) {
  let a = d, b = new Float32Array(d.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = y * gw + x; if (!mask[i]) { b[i] = 0; continue; }
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue; s += a[yy * gw + xx]; n++; }
      b[i] = s / n;
    }
    [a, b] = [b, a];
  }
  return a;
}
/** Back-side texture: the photo as seen through the sheet — softened, desaturated, dimmed, same silhouette. */
function backCanvas(img, w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d');
  cx.filter = 'blur(2.5px) saturate(0.55) brightness(0.62)'; cx.drawImage(img, 0, 0); cx.filter = 'none';
  cx.globalCompositeOperation = 'destination-in'; cx.drawImage(img, 0, 0);
  return cv;
}

/**
 * opts: size (m), fit 'height'|'width', thickness (fraction of half the smaller side), grid (cells on the long side),
 *       idle { sway, bob, speed } or null, roughness, flip (mirror X)
 */
export function createPhotoRelief(url, opts = {}) {
  const { size = 2, fit = 'height', thickness = 0.6, grid = 230, idle = { sway: 0.03, bob: 0.015, speed: 2 }, roughness = 0.7, name = 'PhotoRelief', flip = false } = opts;
  const g = new THREE.Group(); g.name = name;
  loading.n++; window.__loading = loading.n;
  g.userData.ready = loadImage(url).then(img => {
    const w = img.naturalWidth, h = img.naturalHeight;
    const step = Math.max(1, Math.round(Math.max(w, h) / grid)), gw = Math.ceil(w / step), gh = Math.ceil(h / step);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
    const px = cx.getImageData(0, 0, w, h).data;
    // blurred copy: wall colours come from a soft average of the edge, not one raw pixel (no striping)
    const bcv = document.createElement('canvas'); bcv.width = w; bcv.height = h; const bcx = bcv.getContext('2d', { willReadFrequently: true }); bcx.filter = 'blur(5px)'; bcx.drawImage(img, 0, 0);
    const bpx = bcx.getImageData(0, 0, w, h).data;
    const at = (gx, gy) => ((Math.min(h - 1, gy * step)) * w + Math.min(w - 1, gx * step)) * 4;
    const solid = new Uint8Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) solid[gy * gw + gx] = px[at(gx, gy) + 3] > 128 ? 1 : 0;
    // silhouette: dilate by one cell, then two majority-filter passes so the rim has no pixel stair-steps (those read as stripes at turns)
    let mask = new Uint8Array(gw * gh);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { let m = 0; for (let dy = -1; dy <= 1 && !m; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < gw && yy < gh && solid[yy * gw + xx]) { m = 1; break; } } mask[y * gw + x] = m; }
    for (let pass = 0; pass < 2; pass++) {
      const nm = new Uint8Array(gw * gh);
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { let n = 0, c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= gw || yy >= gh) continue; n += mask[yy * gw + xx]; c++; } nm[y * gw + x] = n * 2 >= c ? 1 : 0; }
      mask = nm;
    }
    const df = blur(distanceField(mask, gw, gh), gw, gh, mask, 2);

    const sc = fit === 'width' ? size / w : size / h, wm = w * sc, hm = h * sc;
    const depthM = thickness * Math.min(wm, hm) * 0.5, dRef = 0.2 * Math.min(gw, gh);
    const pos = [], uv = [], col = [];
    const pushV = (x, y, z, u, v, rgb) => { pos.push(x, y, z); uv.push(u, v); col.push(rgb[0], rgb[1], rgb[2]); return pos.length / 3 - 1; };
    const idF = new Int32Array(gw * gh).fill(-1), idB = new Int32Array(gw * gh).fill(-1);
    const sx = flip ? -1 : 1, WHITE = [1, 1, 1], BACK = [0.85, 0.85, 0.85];
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      const i = gy * gw + gx; if (!mask[i]) continue;
      const t = Math.min(df[i] / dRef, 1), z = df[i] <= 1.01 ? 0 : depthM * Math.sqrt(1 - (1 - t) * (1 - t));
      const zb = -(z + depthM * 0.12 * (1 - t));
      const x = (gx * step - w / 2) * sc * sx, y = (h - gy * step) * sc, u = Math.min(1, gx * step / w), v = 1 - Math.min(1, gy * step / h);
      idF[i] = pushV(x, y, z, u, v, WHITE);
      idB[i] = pushV(x, y, zb, 1 - u, v, BACK);
    }
    const cellQ = (gx, gy) => gx >= 0 && gy >= 0 && gx < gw - 1 && gy < gh - 1 && mask[gy * gw + gx] && mask[gy * gw + gx + 1] && mask[(gy + 1) * gw + gx] && mask[(gy + 1) * gw + gx + 1];
    const front = [], back = [], wall = [];
    for (let gy = 0; gy < gh - 1; gy++) for (let gx = 0; gx < gw - 1; gx++) {
      if (!cellQ(gx, gy)) continue;
      const a = gy * gw + gx, b = a + 1, c = a + gw, d = c + 1;
      if (!flip) front.push(idF[a], idF[c], idF[b], idF[b], idF[c], idF[d]); else front.push(idF[a], idF[b], idF[c], idF[b], idF[d], idF[c]);
      if (!flip) back.push(idB[a], idB[b], idB[c], idB[b], idB[d], idB[c]); else back.push(idB[a], idB[c], idB[b], idB[b], idB[c], idB[d]);
    }
    // rim walls: copies of the silhouette vertices, coloured from the photo's own edge pixels
    const wf = new Map(), wb = new Map();
    // figure-average colour, so rim walls read as one body colour instead of stripes
    let ar = 0, ag = 0, ab = 0, an = 0; for (let i = 0; i < px.length; i += 4 * step) if (px[i + 3] > 128) { ar += px[i]; ag += px[i + 1]; ab += px[i + 2]; an++; } ar /= an * 255; ag /= an * 255; ab /= an * 255;
    const edgeRGB = () => [(0.35 * ar + 0.65 * ar * 0.9) * 0.8, (0.35 * ag + 0.65 * ag * 0.9) * 0.8, (0.35 * ab + 0.65 * ab * 0.9) * 0.8];   // one body colour for the whole rim
    const wallFront = i => { if (!wf.has(i)) { const k = idF[i] * 3; wf.set(i, pushV(pos[k], pos[k + 1], pos[k + 2], uv[idF[i] * 2], uv[idF[i] * 2 + 1], edgeRGB(i))); } return wf.get(i); };
    const wallBack = i => { if (!wb.has(i)) { const k = idB[i] * 3; wb.set(i, pushV(pos[k], pos[k + 1], pos[k + 2], uv[idB[i] * 2], uv[idB[i] * 2 + 1], edgeRGB(i))); } return wb.get(i); };
    const addWall = (p, q) => { const P0 = wallFront(p), Q0 = wallFront(q), P1 = wallBack(p), Q1 = wallBack(q); wall.push(P0, Q0, Q1, P0, Q1, P1); };
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw - 1; gx++) {
      const p = gy * gw + gx, q = p + 1; if (!mask[p] || !mask[q] || !solid[p] || !solid[q]) continue;
      const up = cellQ(gx, gy), dn = gy > 0 ? cellQ(gx, gy - 1) : false;
      if (up !== dn) addWall(p, q);
    }
    for (let gx = 0; gx < gw; gx++) for (let gy = 0; gy < gh - 1; gy++) {
      const p = gy * gw + gx, q = p + gw; if (!mask[p] || !mask[q] || !solid[p] || !solid[q]) continue;
      const right = cellQ(gx, gy), left = gx > 0 ? cellQ(gx - 1, gy) : false;
      if (right !== left) addWall(p, q);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex([...front, ...back, ...wall]);
    geo.addGroup(0, front.length, 0); geo.addGroup(front.length, back.length, 1); geo.addGroup(front.length + back.length, wall.length, 2);
    geo.computeVertexNormals();

    const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
    const backTex = new THREE.CanvasTexture(backCanvas(img, w, h)); backTex.colorSpace = THREE.SRGBColorSpace; backTex.anisotropy = 8;
    const frontM = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness, metalness: 0, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.25 });
    const backM = new THREE.MeshStandardMaterial({ map: backTex, alphaTest: 0.5, roughness: 0.9 });
    const wallM = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });   // unlit: pixel-stair normals would band as stripes
    const m = new THREE.Mesh(geo, [frontM, backM, wallM]); m.castShadow = m.receiveShadow = true; m.name = 'relief';
    g.add(m);
    g.userData.dims = { w: wm, h: hm, depth: depthM * 2 };
    loading.n--; window.__loading = loading.n;
  }).catch(e => { console.error(e); loading.n--; window.__loading = loading.n; });
  if (idle) animate(g, t => { g.rotation.z = Math.sin(t * idle.speed) * idle.sway; g.position.y = (g.userData.baseY ??= g.position.y) + Math.abs(Math.sin(t * idle.speed)) * idle.bob; });
  return g;
}
