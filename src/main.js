import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { REGISTRY } from './registry.js';
import { SCENES } from './scenes/scenes.js';
import { GAMES } from './game/games.js';
import { createHud } from './game/hud.js';
import { applyEnv } from './scenes/common.js';
import { tick } from './core/util.js';
import { loadRapier } from './physics/rapier.js';
import { createPhysicsRun, INPUT } from './physics/physics-run.js';
import { buildCourse, courseParams } from './course/builder.js';
import { normalizeCourse, COURSE_EXAMPLE } from './course/schema.js';
import { createEditor } from './course/editor.js';
import { levelFromGauntlet } from './course/adapters.js';

const q = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
const stage = $('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
stage.prepend(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, 9 / 16, 0.1, 600);
const controls = new OrbitControls(camera, renderer.domElement);

/** Portrait only: the stage is always 9:16, fitted and centred in whatever window is open. */
function fitStage() {
  const H = innerHeight; let W = Math.min(innerWidth, Math.round(H * 9 / 16)); let Hh = Math.round(W * 16 / 9);
  if (Hh > H) { Hh = H; W = Math.round(H * 9 / 16); }
  stage.style.width = W + 'px'; stage.style.height = Hh + 'px';
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, Hh, false);
  camera.aspect = W / Hh; camera.updateProjectionMatrix();
  document.documentElement.style.setProperty('--u', (W / 405).toFixed(3));
}
addEventListener('resize', fitStage); fitStage();

// ---- driver input: keyboard, on-screen pad, and URL flags (?gas=1&left=1) for testing
const KEYS = { ArrowUp: 'gas', KeyW: 'gas', ArrowDown: 'brake', KeyS: 'brake', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
addEventListener('keydown', e => { const k = KEYS[e.code]; if (k) { INPUT[k] = true; e.preventDefault(); } });
addEventListener('keyup', e => { const k = KEYS[e.code]; if (k) INPUT[k] = false; });
document.querySelectorAll('#pad button').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); INPUT[k] = true; });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { INPUT[k] = false; });
});
for (const k of ['gas', 'brake', 'left', 'right']) if (q.has(k)) INPUT[k] = true;

let mode = q.get('mode') === 'physics' ? 'physics' : 'scripted';
let scene = new THREE.Scene(), game = null, physRun = null, hud = null, current = null, spin = true, currentName = '', token = 0, lastCourse = null;
const fixedT = q.has('t') ? parseFloat(q.get('t')) : null;

function frameObject(obj, dir) {
  const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const dist = Math.max(size.y, size.x / camera.aspect, size.z * 0.6) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.18 + size.z * 0.4;
  camera.position.copy(c).add(new THREE.Vector3(...dir).normalize().multiplyScalar(dist)); controls.target.copy(c); controls.update();
}
function resetScene() {
  scene = new THREE.Scene(); current = null; game = null; physRun = null; controls.enabled = true;
  if (hud) { hud.clear(); hud = null; }
  $('caption').textContent = ''; $('emoji').textContent = '';
  camera.fov = 45; camera.updateProjectionMatrix();
}
function studioLights() {
  scene.background = new THREE.Color(0x1d2230);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(4, 8, 6); key.castShadow = true; scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 1.2); rim.position.set(-5, 3, -6); scene.add(rim);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.8;
  scene.add(new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 1 })).rotateX(-Math.PI / 2));
}
async function loadAsset(name) {
  const def = REGISTRY[name]; if (!def) return;
  resetScene(); studioLights(); spin = true;
  const opts = {}; if (q.has('size')) opts.size = parseFloat(q.get('size'));
  current = def.make(opts); scene.add(current);
  await (current.userData.ready || Promise.resolve());
  if (q.has('yaw')) current.rotation.y = parseFloat(q.get('yaw'));
  frameObject(current, q.get('view') === 'front' ? [0, 0.15, 1] : [0.55, 0.35, 1]);
}
function loadScene(name) {
  const def = SCENES[name]; if (!def) return;
  resetScene(); spin = false;
  const out = def.make({ scene, renderer });
  applyEnv(scene, renderer, out.env || {});
  current = out.root; scene.add(current);
  camera.fov = out.cam.fov || 50; camera.updateProjectionMatrix();
  camera.position.set(...out.cam.pos); controls.target.set(...out.cam.target); controls.update();
}
const physSettings = () => ({ player: $('pcar').value, maxSpeed: +$('pSpeed').value, steer: +$('pSteer').value, gravity: +$('pGrav').value, rosterRestitution: +$('pBounce').value });
function setPhysUI() {
  const on = mode === 'physics';
  $('pset').style.display = on ? 'block' : 'none';
  $('pad').style.display = on ? 'flex' : 'none';
  if (!on) showEditor(false);
}
async function loadGame(name) {
  const def = GAMES[name]; if (!def) return;
  const my = ++token;
  resetScene(); spin = false;
  game = def.make({ scene, renderer });
  applyEnv(scene, renderer, game.env || {});
  current = game.root; scene.add(current);
  if (game.showHud !== false && game.hud.items.length) hud = createHud(renderer, game.hud.items);
  if (game.caption) $('emoji').textContent = game.caption;
  window.__duration = game.duration;
  if (mode === 'physics') {
    if (!game.api || !game.api.ents) { $('pad').style.display = 'none'; window.__noPhysics = true; return; }
    window.__loading = (window.__loading || 0) + 1;
    const RAPIER = await loadRapier();
    await Promise.all(game.api.ents.map(e => (e.obj.userData && e.obj.userData.ready) || null).filter(Boolean));
    window.__loading--;
    if (my !== token) return;                           // a newer load replaced this one
    physRun = createPhysicsRun({ RAPIER, level: levelFromGauntlet(game), params: physSettings(), REGISTRY });
    window.__phys = physRun;
    controls.enabled = false;
    if (fixedT != null) physRun.advanceTo(fixedT);
  }
}

addEventListener('resize', fitStage);
const selA = $('asset'), selS = $('scene'), selG = $('game'), selM = $('mode');
for (const k of Object.keys(REGISTRY)) selA.add(new Option(`${REGISTRY[k].group} / ${k}`, k));
selS.add(new Option('— scene —', '')); for (const k of Object.keys(SCENES)) selS.add(new Option(SCENES[k].label, k));
selG.add(new Option('— game —', '')); for (const k of Object.keys(GAMES)) selG.add(new Option(GAMES[k].label, k));
selG.add(new Option('— custom course (editor) —', 'custom'));
const clearSel = except => [selA, selS, selG].forEach(s => { if (s !== except) s.value = ''; });
selA.onchange = () => { clearSel(selA); currentName = ''; loadAsset(selA.value); };
selS.onchange = () => { clearSel(selS); currentName = ''; loadScene(selS.value); };
selG.onchange = () => { clearSel(selG); if (selG.value === 'custom') { currentName = 'custom'; showEditor(true); return; } currentName = selG.value; showEditor(false); loadGame(currentName); };
selM.onchange = () => { mode = selM.value; setPhysUI(); if (currentName) loadGame(currentName); };
$('pcar').onchange = () => { if (currentName) loadGame(currentName); };
$('reset').onclick = () => { if (currentName === 'custom' && lastCourse) playCourse(lastCourse); else if (currentName) loadGame(currentName); };
$('editbtn').onclick = () => showEditor(true);
for (const id of ['pSpeed', 'pSteer']) $(id).addEventListener('input', () => { if (physRun) { physRun.P.maxSpeed = +$('pSpeed').value; physRun.P.steer = +$('pSteer').value; } });

selM.value = mode; setPhysUI();
if (q.get('game') === 'custom') { selG.value = 'custom'; currentName = 'custom'; if (q.has('play')) { const c0 = normalizeCourse(COURSE_EXAMPLE).config; if (q.get('player')) c0.player.vehicle = q.get('player'); playCourse(c0); } else showEditor(true); }
else if (q.get('game') && GAMES[q.get('game')]) { currentName = q.get('game'); selG.value = currentName; loadGame(currentName); }
else if (q.get('scene') && SCENES[q.get('scene')]) { selS.value = q.get('scene'); loadScene(q.get('scene')); }
else { const n = q.get('asset') || Object.keys(REGISTRY)[0]; selA.value = n; loadAsset(n); }
if (q.get('ui') === '0') $('ui').style.display = 'none';

async function playCourse(cfg) {
  const my = ++token; lastCourse = cfg; currentName = 'custom';
  resetScene(); spin = false;
  const course = buildCourse(cfg);
  applyEnv(scene, renderer, {});
  current = course.root; scene.add(current);
  if (course.roster.length) hud = createHud(renderer, course.roster.map(r => ({ make: () => REGISTRY[r.type].make({}), label: r.type })));
  $('emoji').textContent = ''; window.__duration = course.duration;
  $('pset').style.display = 'none'; $('pad').style.display = 'flex';
  window.__loading = (window.__loading || 0) + 1;
  const playerProbe = REGISTRY[cfg.player.vehicle].make({});
  const RAPIER = await loadRapier();
  await Promise.all([playerProbe, ...course.roster.map(r => r.obj)].map(o => (o.userData && o.userData.ready) || null).filter(Boolean));
  window.__loading--;
  if (my !== token) return;
  physRun = createPhysicsRun({ RAPIER, level: course, params: courseParams(cfg), REGISTRY });
  window.__phys = physRun;
  controls.enabled = false;
  showEditor(false);
  if (fixedT != null) physRun.advanceTo(fixedT);
}
function showEditor(on) { $('editor').style.display = on ? 'block' : 'none'; }
const editor = createEditor($('editor'), { onPlay: cfg => playCourse(cfg) });

const clock = new THREE.Clock();
function frame() {
  const dt = clock.getDelta();
  if (physRun) {
    if (fixedT == null) physRun.update(dt);
    const c = physRun.cameraPose();
    camera.position.set(...c.pos); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.lookAt(...c.target);
    if (hud) hud.set(physRun.hudStates());
    const s = physRun.stats();
    $('caption').textContent = `smashed ${s.smashed}/${s.total} · crashes ${s.crashes} · ${Math.round(physRun.speedKmh())} km/h`;
  } else if (game) {
    const tg = fixedT ?? (clock.elapsedTime % game.duration), c = game.update(tg);
    camera.position.set(...c.pos); camera.fov = c.fov; camera.updateProjectionMatrix(); camera.lookAt(...c.target);
    tick(current, tg, fixedT != null ? 0.016 : dt);
    if (hud) hud.set(game.hud.state(tg));
    const cap = game.hud.caption?.(tg); if (cap !== undefined) $('caption').textContent = cap;
  } else {
    const t = fixedT ?? clock.elapsedTime;
    if (current) { tick(current, t, fixedT != null ? 0.016 : dt); if (spin && fixedT == null) current.rotation.y += dt * 0.5; }
    controls.update();
  }
  renderer.render(scene, camera);
  window.__frames = (window.__frames || 0) + 1;
  requestAnimationFrame(frame);
}
frame();
