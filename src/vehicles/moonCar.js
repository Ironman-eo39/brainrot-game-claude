// Moon car: cratered sphere with angry glowing eyes, teeth grin and four small wheels.
// Ref: green/red/purple/cyan/yellow/white/black moon cars in the hammer/slap/axe clips.
import * as THREE from 'three';
import { mat, mesh, sphere, box, cyl, rng, animate } from '../core/util.js';

export const MOON_COLORS = {
  pink: 0xf59ac0, blue: 0x2a52d8, clownRed: 0xc8222a, orange: 0xf08a1c,
  green: 0x2fd626, red: 0xd81f26, purple: 0xb21fd6, cyan: 0x22b8c8,
  yellow: 0xe8d22a, white: 0xcfc8b8, black: 0x2a2a2e, brown: 0x8a4a2a,
};

/** Cratered sphere geometry; per-vertex darkening inside craters. */
export function craterSphere(R, { seed = 3, craters = 90, depth = 0.1, faceDir = new THREE.Vector3(0, 0.05, 1) } = {}) {
  const geo = new THREE.SphereGeometry(R, 128, 96);
  const rand = rng(seed);
  const cs = [];
  for (let i = 0; i < craters; i++) {
    const d = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    if (d.dot(faceDir.clone().normalize()) > 0.62) continue; // keep face area clean
    cs.push({ d, r: 0.07 + rand() * 0.2, k: 0.5 + rand() * 0.9 });
  }
  const p = geo.attributes.position, col = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let h = 0;
    for (const c of cs) {
      const a = Math.acos(Math.min(1, v.dot(c.d))) / c.r; // 0 center .. 1 rim
      if (a < 1) h -= c.k * (1 - a * a);                    // bowl
      else if (a < 1.3) h += c.k * 0.12 * Math.exp(-Math.pow((a - 1.1) * 5, 2)); // soft rim
    }
    h += 0.025 * Math.sin(v.x * 9 + v.y * 7) * Math.sin(v.z * 8 - v.y * 5); // gentle lumpiness
    h = THREE.MathUtils.clamp(h, -1.1, 0.35);
    v.multiplyScalar(R * (1 + depth * h));
    p.setXYZ(i, v.x, v.y, v.z);
    const shade = THREE.MathUtils.clamp(1 + h * 0.8, 0.28, 1.1);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = shade;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

// ---- expressions -------------------------------------------------------------------------------
// Each expression: eye 'glow'|'white', eyeScale, eyeColor, pupil (0..1 of eyeball), pupilDx/Dy, cross (cross-eyed), lid (0..1 closed from top),
// browAngle (+ angry, - worried), mouth kind.
export const EXPRESSIONS = {
  angry:     { eye: 'glow', browAngle: 0.42, mouth: 'grin' },
  furious:   { eye: 'glow', eyeScale: 1.15, eyeColor: 0xff2a10, browAngle: 0.7, mouth: 'scream' },
  smug:      { eye: 'glow', lid: 0.42, browAngle: -0.08, mouth: 'smirk' },
  scared:    { eye: 'white', eyeScale: 1.35, pupil: 0.26, browAngle: -0.5, mouth: 'o' },
  derp:      { eye: 'white', eyeScale: 1.2, pupil: 0.4, cross: true, browAngle: 0, mouth: 'tongue' },
  scream:    { eye: 'white', eyeScale: 1.3, pupil: 0.33, browAngle: -0.3, mouth: 'scream' },
  sleepy:    { eye: 'glow', lid: 0.66, eyeColor: 0xffb040, browAngle: -0.15, mouth: 'flat' },
  evil:      { eye: 'glow', eyeColor: 0xff1010, eyeScale: 0.9, browAngle: 0.62, mouth: 'zigzag' },
  sad:       { eye: 'white', pupil: 0.4, pupilDy: -0.3, browAngle: -0.55, mouth: 'frown' },
  surprised: { eye: 'white', eyeScale: 1.2, pupil: 0.3, browAngle: -0.2, mouth: 'o' },
  bulge:     { eye: 'white', eyeScale: 1.65, pupil: 0.36, browAngle: 0.12, mouth: 'smirk' },
};
export const EXPRESSION_BY_COLOR = { green: 'angry', red: 'furious', purple: 'smug', cyan: 'scared', yellow: 'derp', white: 'bulge', black: 'evil', brown: 'scream', blue: 'sad', orange: 'sleepy', pink: 'surprised' };

function buildMouth(R, kind, dark, tooth) {
  const m = new THREE.Group(), red = mat(0xc23a4a, { roughness: 0.5 });
  const row = (n, w, h, y, z, spread, dx = 0) => { for (let i = 0; i < n; i++) m.add(box(w, h, R * 0.05, tooth, { pos: [(i - (n - 1) / 2) * spread + dx, y, z] })); };
  if (kind === 'grin' || kind === 'tongue') {
    m.add(sphere(R * 0.44, dark, { scale: [1, 0.42, 0.3] }));
    for (let i = 0; i < 9; i++) { const x = (i - 4) * R * 0.09, k = 1 - Math.abs(i - 4) * 0.09; m.add(box(R * 0.08, R * 0.1 * k, R * 0.05, tooth, { pos: [x, R * 0.085, R * 0.07] })); m.add(box(R * 0.08, R * 0.09 * k, R * 0.05, tooth, { pos: [x + R * 0.045, -R * 0.075, R * 0.07] })); }
    if (kind === 'tongue') m.add(sphere(R * 0.16, red, { pos: [R * 0.05, -R * 0.2, R * 0.08], scale: [1.1, 1.5, 0.55] }));
  } else if (kind === 'scream') {
    m.add(sphere(R * 0.3, dark, { scale: [1.0, 1.35, 0.3] })); row(5, R * 0.085, R * 0.12, R * 0.3, R * 0.06, R * 0.1); row(4, R * 0.085, R * 0.1, -R * 0.3, R * 0.06, R * 0.11);
    m.add(sphere(R * 0.16, red, { pos: [0, -R * 0.2, R * 0.05], scale: [1.2, 0.8, 0.5] }));
  } else if (kind === 'smirk') {
    m.add(mesh(new THREE.SphereGeometry(R * 0.4, 24, 12), dark, { scale: [1, 0.26, 0.3], rot: [0, 0, 0.14] })); row(5, R * 0.07, R * 0.08, R * 0.035, R * 0.06, R * 0.085, R * 0.05);
  } else if (kind === 'frown') {
    m.add(mesh(new THREE.TorusGeometry(R * 0.3, R * 0.05, 8, 24, Math.PI), dark, { rot: [0, 0, 0], pos: [0, -R * 0.1, 0] })); row(4, R * 0.06, R * 0.07, -R * 0.07, R * 0.05, R * 0.1);
  } else if (kind === 'flat') {
    m.add(box(R * 0.42, R * 0.045, R * 0.05, dark));
  } else if (kind === 'o') {
    m.add(sphere(R * 0.14, dark, { scale: [1, 1.15, 0.4] })); m.add(mesh(new THREE.TorusGeometry(R * 0.14, R * 0.025, 8, 20), mat(0x3a1a1a), { scale: [1, 1.15, 1] }));
  } else if (kind === 'zigzag') {
    m.add(sphere(R * 0.42, dark, { scale: [1, 0.22, 0.3] }));
    for (let i = 0; i < 12; i++) { const up = i % 2 === 0; m.add(mesh(new THREE.ConeGeometry(R * 0.032, R * 0.09, 5), tooth, { pos: [(i - 5.5) * R * 0.066, up ? R * 0.045 : -R * 0.045, R * 0.07], rot: [up ? Math.PI : 0, 0, 0] })); }
  }
  return m;
}

function buildFace(R, expression, bodyColor) {
  const spec = { eye: 'glow', eyeScale: 1, eyeColor: 0xff4a12, pupil: 0.4, pupilDx: 0, pupilDy: 0, cross: false, lid: 0, browAngle: 0.4, mouth: 'grin', ...EXPRESSIONS[expression] };
  const g = new THREE.Group(); g.name = 'face'; g.userData.expression = expression;
  const dark = mat(0x120808, { roughness: 0.9 }), tooth = mat(0xf2efe0, { roughness: 0.35 }), bodyM = mat(bodyColor, { roughness: 0.85 });
  const er = R * 0.15 * spec.eyeScale;
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    if (spec.eye === 'glow') {
      const glow = mat(spec.eyeColor, { emissive: spec.eyeColor, emissiveIntensity: 1.2, roughness: 0.3 });
      e.add(sphere(er * 1.4, dark, { scale: [1, 0.9, 0.5] })); e.add(sphere(er, glow, { pos: [0, 0, R * 0.035], scale: [1, 1, 0.6] }));
      e.add(sphere(er * 0.38, mat(0x000000), { pos: [-s * er * 0.1, -er * 0.1, R * 0.085], scale: [1, 1, 0.5] }));
    } else {
      e.add(sphere(er * 1.08, mat(0xf8f8f2, { roughness: 0.2 }), { scale: [1, 1, 0.62] }));
      const cr = spec.cross ? -s * 0.38 : 0;
      e.add(sphere(er * spec.pupil * 1.6, mat(0x070707, { roughness: 0.15 }), { pos: [(cr + spec.pupilDx) * er, spec.pupilDy * er, er * 0.55], scale: [1, 1, 0.5] }));
      e.add(sphere(er * 0.12, mat(0xffffff), { pos: [(cr + 0.08) * er, er * 0.12, er * 0.72], scale: [1, 1, 0.5] }));
    }
    if (spec.lid > 0) e.add(box(er * 2.9, er * 2.4 * spec.lid, R * 0.06, bodyM, { pos: [0, er * 1.2 * (1 - spec.lid) + er * 0.0, R * 0.075] }));
    const bw = er * 2.5; e.add(box(bw, R * 0.07, R * 0.07, dark, { pos: [0, er * 1.45 + R * 0.04, R * 0.03], rot: [0, 0, s * spec.browAngle] }));
    e.position.set(s * R * 0.30, R * 0.20, R * 0.90); e.lookAt(e.position.clone().multiplyScalar(2)); g.add(e);
  }
  const mouth = buildMouth(R, spec.mouth, dark, tooth);
  const dir = new THREE.Vector3(0, -0.34, 0.94).normalize().multiplyScalar(R * 0.97); mouth.position.copy(dir); mouth.lookAt(dir.clone().multiplyScalar(2)); g.add(mouth);
  return g;
}

function clownFace(R) {
  const g = new THREE.Group(); g.name = 'face';
  const white = mat(0xf7f2ea, { roughness: 0.6 }), red = mat(0xd81f26, { roughness: 0.4 }), dark = mat(0x140a0a);
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    e.add(sphere(R * 0.22, white, { scale: [1, 1.15, 0.4] })); e.add(sphere(R * 0.09, mat(0xffffff), { pos: [0, 0, R * 0.06], scale: [1, 1, 0.5] })); e.add(sphere(R * 0.045, dark, { pos: [0, 0, R * 0.1], scale: [1, 1, 0.5] }));
    e.position.set(s * R * 0.3, R * 0.2, R * 0.88); e.lookAt(e.position.clone().multiplyScalar(2)); g.add(e);
  }
  const nose = sphere(R * 0.13, red, { pos: [0, -0.02 * R, R * 0.97] }); g.add(nose);
  const mouth = new THREE.Group(); mouth.add(sphere(R * 0.42, dark, { scale: [1, 0.4, 0.3] }));
  const tooth = mat(0xf2efe0);
  for (let i = 0; i < 9; i++) { const x = (i - 4) * R * 0.085; mouth.add(box(R * 0.07, R * 0.1, R * 0.05, tooth, { pos: [x, R * 0.08, R * 0.07] })); mouth.add(box(R * 0.07, R * 0.08, R * 0.05, tooth, { pos: [x + R * 0.04, -R * 0.07, R * 0.07] })); }
  const dir = new THREE.Vector3(0, -0.4, 0.92).normalize().multiplyScalar(R * 0.97); mouth.position.copy(dir); mouth.lookAt(dir.clone().multiplyScalar(2)); g.add(mouth);
  return g;
}
function cuteFace(R) {
  const g = new THREE.Group(); g.name = 'face';
  const white = mat(0xffffff), dark = mat(0x2a1a1a), blush = mat(0xff7aa0, { transparent: true, opacity: 0.7 });
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    e.add(sphere(R * 0.17, white, { scale: [1, 1.15, 0.45] })); e.add(sphere(R * 0.1, mat(0x3a2a6a), { pos: [0, -R * 0.01, R * 0.05], scale: [1, 1.1, 0.5] })); e.add(sphere(R * 0.035, white, { pos: [R * 0.03, R * 0.04, R * 0.1], scale: [1, 1, 0.4] }));
    e.add(box(R * 0.2, R * 0.025, R * 0.03, dark, { pos: [0, R * 0.2, R * 0.03], rot: [0, 0, s * 0.3] }));
    e.position.set(s * R * 0.28, R * 0.12, R * 0.9); e.lookAt(e.position.clone().multiplyScalar(2)); g.add(e);
    const b = sphere(R * 0.08, blush, { scale: [1.3, 0.8, 0.3] }); b.position.set(s * R * 0.42, -R * 0.12, R * 0.84); b.lookAt(b.position.clone().multiplyScalar(2)); g.add(b);
  }
  const m = mesh(new THREE.TorusGeometry(R * 0.13, R * 0.018, 6, 16, Math.PI), mat(0xc03a58), { pos: [0, -R * 0.18, R * 0.95], rot: [0.2, 0, Math.PI] }); g.add(m);
  return g;
}

export function createMoonCar({ radius = 1, size, color = 'green', seed = 3, eyeColor, face: faceStyle, expression } = {}) {
  // size = diameter in meters (overrides radius); expression: see EXPRESSIONS; face: 'clown' | 'cute' special faces
  const R = size ? size / 2 : radius, g = new THREE.Group(); g.name = `MoonCar_${color}`;
  const base = typeof color === 'string' ? MOON_COLORS[color] ?? 0x2fd626 : color;
  const body = mesh(craterSphere(R, { seed }), new THREE.MeshStandardMaterial({ color: base, vertexColors: true, roughness: 0.9, envMapIntensity: 0.3 }), { name: 'body' });
  body.position.y = R * 0.92;
  const expr = expression ?? EXPRESSION_BY_COLOR[color] ?? 'angry';
  const face = faceStyle === 'clown' ? clownFace(R) : faceStyle === 'cute' ? cuteFace(R) : buildFace(R, expr, base);
  body.add(face);
  g.add(body);

  // wheels
  const tire = mat(0x151515, { roughness: 0.9 }), rim = mat(0x8a8a90, { metalness: 0.6, roughness: 0.4 });
  const wr = R * 0.2, wheels = [];
  for (const [x, z] of [[-0.55, 0.45], [0.55, 0.45], [-0.55, -0.45], [0.55, -0.45]]) {
    const w = new THREE.Group();
    const t = cyl(wr, wr, R * 0.16, tire, { rot: [0, 0, Math.PI / 2] });
    const h = cyl(wr * 0.55, wr * 0.55, R * 0.18, rim, { rot: [0, 0, Math.PI / 2] });
    w.add(t, h);
    w.position.set(x * R, wr, z * R);
    g.add(w); wheels.push(w);
  }
  animate(g, (t, dt) => wheels.forEach(w => w.rotation.x += dt * 6));
  animate(g, t => { body.rotation.z = Math.sin(t * 3) * 0.03; });
  g.userData.radius = R;
  return g;
}
