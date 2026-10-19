// Roster HUD (top bar of icons with red X / green check) + caption. Icons are rendered from the real 3D assets.
import * as THREE from 'three';

export async function renderIcon(renderer, make, size = 128) {
  const obj = make(); await (obj.userData.ready || Promise.resolve());
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x556677, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(3, 6, 8); sc.add(key); sc.add(obj);
  const box = new THREE.Box3().setFromObject(obj), sz = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 500), d = Math.max(sz.y, sz.x, sz.z * 0.7) / (2 * Math.tan(THREE.MathUtils.degToRad(15))) * 1.15 + sz.z * 0.5;
  cam.position.copy(c).add(new THREE.Vector3(0.25, 0.18, 1).normalize().multiplyScalar(d)); cam.lookAt(c);
  const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4 }), prevT = renderer.getRenderTarget(), prevC = new THREE.Color(), prevA = renderer.getClearAlpha();
  renderer.getClearColor(prevC); renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(sc, cam);
  const buf = new Uint8Array(size * size * 4); renderer.readRenderTargetPixels(rt, 0, 0, size, size, buf);
  renderer.setRenderTarget(prevT); renderer.setClearColor(prevC, prevA); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const cx = cv.getContext('2d'), img = cx.createImageData(size, size);
  for (let y = 0; y < size; y++) img.data.set(buf.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
  cx.putImageData(img, 0, 0); return cv.toDataURL();
}

export function createHud(renderer, items) {
  const bar = document.getElementById('hud'); bar.innerHTML = ''; bar.style.display = 'flex';
  const cells = items.map((it, i) => {
    const el = document.createElement('div'); el.className = 'hud-item'; el.title = it.label || '';
    const img = document.createElement('img'); el.appendChild(img);
    const mark = document.createElement('div'); mark.className = 'hud-mark'; el.appendChild(mark); bar.appendChild(el); return { el, img, mark, state: '' };
  });
  window.__hudPending = items.length;
  items.forEach(async (it, i) => { try { cells[i].img.src = await renderIcon(renderer, it.make); } catch (e) { console.error('icon', e); } window.__hudPending--; });
  return {
    set(states) { states.forEach((s, i) => { const c = cells[i]; if (!c || c.state === s) return; c.state = s; c.el.dataset.state = s; c.mark.textContent = s === 'dead' ? '✖' : s === 'ok' ? '✔' : ''; }); },
    caption(txt) { const el = document.getElementById('caption'); if (el) el.textContent = txt || ''; },
    clear() { bar.innerHTML = ''; bar.style.display = 'none'; },
  };
}
