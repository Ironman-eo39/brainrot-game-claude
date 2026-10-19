// Procedural PBR material library. Each preset generates albedo + normal + roughness maps on canvas (periodic, so tiles seamlessly).
import * as THREE from 'three';

const TAU = Math.PI * 2;
const ihash = (x, y, s) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 982451653); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const wrap = (n, p) => ((n % p) + p) % p;
function pnoise(x, y, px, py, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const x0 = wrap(xi, px), x1 = wrap(xi + 1, px), y0 = wrap(yi, py), y1 = wrap(yi + 1, py);
  const a = ihash(x0, y0, s), b = ihash(x1, y0, s), c = ihash(x0, y1, s), d = ihash(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
/** Periodic fBm over u,v in [0,1). fx, fy = integer cells per tile. */
export function fbm(u, v, fx = 4, fy = 4, oct = 4, s = 1) {
  let amp = 0.5, sum = 0, norm = 0, X = fx, Y = fy;
  for (let i = 0; i < oct; i++) { sum += amp * pnoise(u * X, v * Y, X, Y, s + i * 31); norm += amp; amp *= 0.5; X *= 2; Y *= 2; }
  return sum / norm;
}
const clamp01 = x => Math.min(1, Math.max(0, x));
const toRGB = c => { if (Array.isArray(c)) return c; const n = typeof c === 'number' ? c : parseInt(String(c).replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const PRESET = {
  asphalt: { bump: 2.5, fn: (u, v) => { const a = fbm(u, v, 6, 6, 4, 1), g = fbm(u, v, 64, 64, 2, 2), p = fbm(u, v, 3, 3, 3, 5), cr = Math.abs(fbm(u, v, 4, 4, 3, 9) - 0.5) < 0.008 ? 1 : 0; const k = 0.17 + 0.07 * a + 0.05 * g + (p > 0.6 ? 0.035 : 0) - 0.07 * cr; return { h: 0.6 * g + 0.4 * a - 0.5 * cr, c: [k, k, k * 1.03], r: 0.86 + 0.1 * g }; } },
  concrete: { bump: 2, fn: (u, v) => { const a = fbm(u, v, 4, 4, 4, 3), g = fbm(u, v, 48, 48, 3, 4), k = 0.55 + 0.1 * a + 0.06 * g; return { h: 0.5 * g + 0.5 * a, c: [k, k * 0.99, k * 0.95], r: 0.85 }; } },
  grass: { bump: 2, fn: (u, v) => { const a = fbm(u, v, 6, 6, 4, 7), b = fbm(u, v, 48, 6, 3, 8), d = fbm(u, v, 24, 24, 2, 9); return { h: b, c: [0.15 + 0.1 * a + 0.04 * d, 0.34 + 0.2 * a + 0.1 * b, 0.09 + 0.05 * a], r: 0.92 }; } },
  planks: { bump: 2, fn: (u, v) => { const pv = (v * 6) % 1, seam = pv < 0.035 || pv > 0.965 ? 1 : 0, gr = fbm(u, v, 2, 40, 4, 12), k = 0.8 + 0.25 * gr - 0.5 * seam; return { h: 0.5 + 0.5 * gr - seam * 0.8, c: [0.78 * k, 0.52 * k, 0.3 * k], r: 0.72 + 0.2 * gr }; } },
  bark: { bump: 3, fn: (u, v) => { const n = fbm(u, v, 6, 28, 4, 11), ridge = 1 - Math.abs(2 * n - 1); return { h: ridge, c: [0.3 + 0.12 * n, 0.22 + 0.08 * n, 0.13 + 0.04 * n], r: 0.95 }; } },
  skin: { bump: 0.6, fn: (u, v) => { const p = fbm(u, v, 96, 96, 2, 13), t = fbm(u, v, 6, 6, 3, 2); return { h: p, c: [clamp01(0.96 + 0.03 * t), clamp01(0.8 + 0.05 * t), clamp01(0.7 + 0.04 * t)], r: 0.45 + 0.15 * p }; } },
  pinkskin: { bump: 0.6, fn: (u, v) => { const p = fbm(u, v, 96, 96, 2, 14); return { h: p, c: [1, 0.72 + 0.05 * p, 0.76], r: 0.42 + 0.1 * p }; } },
  mottled: { bump: 1.5, fn: (u, v) => { const a = fbm(u, v, 6, 6, 4, 51), p = fbm(u, v, 96, 96, 2, 52); return { h: p * 0.6 + a * 0.4, c: [0.5 + 0.12 * a, 0.62 + 0.12 * a, 0.44 + 0.08 * a], r: 0.7 }; } },
  paint: { bump: 0.6, fn: (u, v) => { const h = fbm(u, v, 40, 40, 2, 21), k = 0.97 + 0.04 * h; return { h, c: [k, k, k], r: 0.26 + 0.06 * h }; } },
  tread: { bump: 3, fn: (u, v) => { const lug = Math.sin(u * TAU * 18) > 0.25 ? 1 : 0, n = fbm(u, v, 12, 12, 2, 61), k = 0.09 + 0.05 * lug; return { h: 0.7 * lug + 0.1 * n, c: [k, k, k], r: 0.92 }; } },
  ribbed: { bump: 1.5, fn: (u, v) => { const s = 0.5 + 0.5 * Math.sin(v * TAU * 14), k = 0.9 + 0.1 * s; return { h: s, c: [k, k, k], r: 0.42 }; } },
  rivets: { bump: 3, fn: (u, v) => { const cu = (u * 24) % 1 - 0.5, cv = (v * 12) % 1 - 0.5, rv = Math.hypot(cu, cv) < 0.22 ? 1 : 0, n = fbm(u, v, 8, 8, 3, 71), k = 0.95 + 0.05 * n; return { h: 0.25 * n + 0.6 * rv, c: [k, k, k], r: 0.45 + 0.1 * n }; } },
  brushed: { bump: 1, fn: (u, v) => { const s = fbm(u, v, 2, 80, 2, 31), k = 0.9 + 0.08 * s; return { h: 0.2 * s, c: [k, k, k + 0.02], r: 0.3 + 0.1 * s }; } },
  fabric: { bump: 1, fn: (u, v) => { const w = 0.5 + 0.25 * Math.sin(u * TAU * 64) * Math.sin(v * TAU * 64), n = fbm(u, v, 8, 8, 2, 81); return { h: w, c: [0.25 + 0.1 * n, 0.23 + 0.08 * n, 0.2 + 0.06 * n], r: 0.95 }; } },
  rust: { bump: 3, fn: (u, v) => { const a = fbm(u, v, 8, 8, 4, 41), b = fbm(u, v, 40, 40, 2, 42); return { h: a * 0.7 + b * 0.3, c: [0.42 + 0.25 * a, 0.2 + 0.12 * a, 0.07 + 0.03 * b], r: 0.95 }; } },
  soot: { bump: 1.5, fn: (u, v) => { const a = fbm(u, v, 6, 6, 3, 91), k = 0.06 + 0.05 * a; return { h: a, c: [k, k, k], r: 0.7 }; } },
  grille: { bump: 2, fn: (u, v) => { const cell = Math.sin(u * TAU * 22) * Math.sin(v * TAU * 10) > 0; return { h: cell ? 0.2 : 0.8, c: [0.22, 0.22, 0.22], r: 0.4 }; } },
  hair: { bump: 1, fn: (u, v) => { const h = fbm(u, v, 2, 80, 2, 41); return { h, c: [0.14 + 0.08 * h, 0.1 + 0.05 * h, 0.07 + 0.04 * h], r: 0.45 }; } },
  needles: { bump: 2, fn: (u, v) => { const s = fbm(u, v, 40, 4, 3, 101); return { h: s, c: [0.1 + 0.08 * s, 0.26 + 0.14 * s, 0.1 + 0.05 * s], r: 0.8 }; } },
  mouth: { bump: 1.5, fn: (u, v) => { const n = fbm(u, v, 12, 12, 3, 111); return { h: n, c: [0.3 + 0.1 * n, 0.04, 0.05], r: 0.4 }; } },
};

const cache = new Map();
/** Builds (once) and caches {map, normalMap, roughnessMap} for a preset. */
export function buildMaps(name, size = 256) {
  if (cache.has(name)) return cache.get(name);
  const P = PRESET[name]; if (!P) throw new Error('no preset ' + name);
  const n = size * size, H = new Float32Array(n), A = new Uint8ClampedArray(n * 4), R = new Uint8ClampedArray(n * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const o = P.fn((x + 0.5) / size, (y + 0.5) / size), i = y * size + x;
    H[i] = o.h; A[i * 4] = clamp01(o.c[0]) * 255; A[i * 4 + 1] = clamp01(o.c[1]) * 255; A[i * 4 + 2] = clamp01(o.c[2]) * 255; A[i * 4 + 3] = 255;
    const rr = clamp01(o.r) * 255; R[i * 4] = R[i * 4 + 1] = R[i * 4 + 2] = rr; R[i * 4 + 3] = 255;
  }
  const N = new Uint8ClampedArray(n * 4), bump = P.bump ?? 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const hl = H[y * size + ((x - 1 + size) % size)], hr = H[y * size + ((x + 1) % size)], hd = H[((y - 1 + size) % size) * size + x], hu = H[((y + 1) % size) * size + x];
    let nx = -(hr - hl) * bump, ny = -(hu - hd) * bump; const nz = 1, l = Math.hypot(nx, ny, nz); nx /= l; ny /= l;
    N[i * 4] = (nx * 0.5 + 0.5) * 255; N[i * 4 + 1] = (ny * 0.5 + 0.5) * 255; N[i * 4 + 2] = (nz / l * 0.5 + 0.5) * 255; N[i * 4 + 3] = 255;
  }
  const mk = (data, srgb) => { const c = document.createElement('canvas'); c.width = c.height = size; const cx = c.getContext('2d'), img = cx.createImageData(size, size); img.data.set(data); cx.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  const out = { map: mk(A, true), normalMap: mk(N, false), roughnessMap: mk(R, false) };
  cache.set(name, out); return out;
}

/** Physical material from a preset. Extra opts override (color tints the albedo map). */
export function surface(name, { color = 0xffffff, rough, metal = 0, clear = 0, sheen = 0, repeat = [1, 1], transparent, opacity, side, emissive = 0x000000, emissiveIntensity = 1, envMapIntensity = 1 } = {}) {
  const o = { color, roughness: rough ?? 0.6, metalness: metal, clearcoat: clear, clearcoatRoughness: 0.1, sheen, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffd6c8), emissive, emissiveIntensity, envMapIntensity };
  if (transparent !== undefined) o.transparent = transparent; if (opacity !== undefined) o.opacity = opacity; if (side !== undefined) o.side = side;
  const m = new THREE.MeshPhysicalMaterial(o);
  if (name && PRESET[name]) {
    const maps = buildMaps(name);
    for (const k of ['map', 'normalMap', 'roughnessMap']) { const t = maps[k].clone(); t.repeat.set(...repeat); t.needsUpdate = true; m[k] = t; }
    m.roughness = 1; m.normalScale = new THREE.Vector2(0.9, 0.9);
  }
  return m;
}

let leafCache = null;
/** Leaf-card texture with alpha (transparent background). */
export function leafTexture() {
  if (leafCache) return leafCache;
  const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s; const cx = cv.getContext('2d');
  let seed = 7; const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 190; i++) { const x = r() * s, y = r() * s, L = 24 + r() * 30, a = r() * TAU, g = 0.45 + r() * 0.5; cx.fillStyle = `rgb(${Math.round(30 + 50 * r())},${Math.round(70 + 110 * g)},${Math.round(20 + 40 * r())})`; cx.beginPath(); cx.ellipse(x, y, L * 0.5, L * 0.2, a, 0, TAU); cx.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; leafCache = t; return t;
}

/** Sky gradient with fBm clouds. stops: [top, middle, horizon]. */
export function makeSkyTexture(stops = ['#3d7de0', '#8cc4f5', '#dff0fb'], { clouds = true } = {}) {
  const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d'), img = cx.createImageData(W, H), d = img.data;
  const A = toRGB(stops[0]), B = toRGB(stops[1]), C = toRGB(stops[2]);
  for (let y = 0; y < H; y++) {
    const v = y / H, base = v < 0.6 ? mixc(A, B, v / 0.6) : mixc(B, C, (v - 0.6) / 0.4);
    for (let x = 0; x < W; x++) {
      let col = base;
      if (clouds) { const f = fbm(x / W, v * 0.7 + 0.2, 4, 3, 5, 77); col = mixc(col, [1, 1, 1], clamp01((f - 0.5) * 3.2) * (1 - v * 0.6) * 0.85); }
      const i = (y * W + x) * 4; d[i] = col[0] * 255; d[i + 1] = col[1] * 255; d[i + 2] = col[2] * 255; d[i + 3] = 255;
    }
  }
  cx.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
