// Course editor. Generated from schema.js (FIELDS, ITEM_RANGE): every parameter has a control, changes are live,
// and the whole course can be exported/imported as JSON. Play hands the normalized config to the game.
import { FIELDS, PLAYER_TYPES, COURSE_EXAMPLE, normalizeCourse, getPath, setPath } from './schema.js';
import { DESTROYERS } from './destroyers.js';

export function createEditor(root, { onPlay }) {
  let cfg = normalizeCourse(COURSE_EXAMPLE).config;
  const esc = s => String(s).replace(/"/g, '&quot;');
  const sec = prefix => FIELDS.filter(f => f.path.startsWith(prefix + '.')).map(f => {
    const v = getPath(cfg, f.path);
    if (f.select) return `<label class="row">${f.label}<select data-path="${f.path}">${f.options().map(o => `<option ${o === v ? 'selected' : ''} value="${o}">${o}</option>`).join('')}</select></label>`;
    return `<label class="row">${f.label} <input type="range" data-path="${f.path}" min="${f.min}" max="${f.max}" step="${f.step}" value="${v}"><output>${v}</output></label>`;
  }).join('');
  const num = (i, k, label) => `<label>${label}<input type="number" step="0.1" data-item="${i}" data-key="${k}" value="${cfg.items[i][k]}"></label>`;
  const itemHTML = (it, i) => {
    const types = it.kind === 'destroyer' ? Object.keys(DESTROYERS) : PLAYER_TYPES;
    const extra = it.kind === 'destroyer'
      ? num(i, 'rot', 'rot°') + num(i, 'speed', 'speed (cyc/s)') + num(i, 'amplitude', 'amplitude') + num(i, 'phase', 'phase 0-1')
      : num(i, 'show', 'appears (s)') + num(i, 'launch', 'launches (s)') + num(i, 'vx', 'vx (m/s)') + num(i, 'vz', 'vz (m/s)');
    return `<div class="item">
      <div class="row"><select data-item="${i}" data-key="kind"><option value="destroyer" ${it.kind === 'destroyer' ? 'selected' : ''}>destroyer</option><option value="roster" ${it.kind === 'roster' ? 'selected' : ''}>roster</option></select>
      <select data-item="${i}" data-key="type">${types.map(t => `<option value="${t}" ${t === it.type ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <button data-del="${i}">remove</button></div>
      <div class="grid">${num(i, 'x', 'x (m)')}${num(i, 'z', 'z (m)')}${num(i, 'scale', 'scale')}${extra}</div></div>`;
  };
  function render() {
    root.innerHTML = `
      <div class="row"><input data-name value="${esc(cfg.name)}" style="width:60%"> <button data-play>▶ play</button> <button data-close>close</button></div>
      <h4>physics</h4>${sec('physics')}
      <h4>player</h4>${sec('player')}
      <h4>road</h4>${sec('road')}
      <h4>destroyers and roster</h4>
      <div class="row"><button data-add="destroyer">+ destroyer</button> <button data-add="roster">+ roster item</button></div>
      ${cfg.items.map(itemHTML).join('') || '<div class="row">no items yet</div>'}
      <h4>save / load</h4>
      <div class="row"><button data-export>export JSON</button> <button data-import>import JSON</button></div>
      <textarea id="jsonbox" spellcheck="false"></textarea>
      <div id="warn"></div>`;
  }
  const warn = msgs => { const el = root.querySelector('#warn'); if (el) el.textContent = msgs.join(' · '); };

  root.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.path) {
      const f = FIELDS.find(x => x.path === t.dataset.path);
      setPath(cfg, t.dataset.path, f.select ? t.value : +t.value);
      const out = t.parentElement.querySelector('output'); if (out) out.textContent = t.value;
    } else if (t.dataset.item !== undefined && t.dataset.key && t.type === 'number') {
      cfg.items[+t.dataset.item][t.dataset.key] = +t.value;
    } else if (t.hasAttribute('data-name')) cfg.name = t.value;
  });
  root.addEventListener('change', e => {
    const t = e.target, i = +t.dataset.item;
    if (t.dataset.item !== undefined && (t.dataset.key === 'kind' || t.dataset.key === 'type')) {
      const it = cfg.items[i];
      const kind = t.dataset.key === 'kind' ? t.value : it.kind;
      const type = t.dataset.key === 'type' ? t.value : (kind === it.kind ? it.type : (kind === 'destroyer' ? 'hammer' : 'moon-green'));
      const fresh = normalizeCourse({ items: [{ kind, type }] }).config.items[0];
      cfg.items[i] = { ...fresh, x: it.x, z: it.z, scale: it.scale };
      render();
    }
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-play')) { const r = normalizeCourse(cfg); warn(r.warnings); cfg = r.config; onPlay(r.config); }
    else if (b.hasAttribute('data-close')) root.style.display = 'none';
    else if (b.dataset.add) { cfg.items.push(normalizeCourse({ items: [{ kind: b.dataset.add, type: b.dataset.add === 'destroyer' ? 'hammer' : 'moon-green' }] }).config.items[0]); render(); }
    else if (b.dataset.del !== undefined) { cfg.items.splice(+b.dataset.del, 1); render(); }
    else if (b.hasAttribute('data-export')) { root.querySelector('#jsonbox').value = JSON.stringify(normalizeCourse(cfg).config, null, 2); warn(['exported: copy the text above to save it']); }
    else if (b.hasAttribute('data-import')) {
      try { const r = normalizeCourse(JSON.parse(root.querySelector('#jsonbox').value)); cfg = r.config; render(); warn(r.warnings.length ? r.warnings : ['imported']); }
      catch (err) { warn(['import failed: ' + err.message]); }
    }
  });
  render();
  return { getConfig: () => normalizeCourse(cfg).config, setConfig: c => { cfg = normalizeCourse(c).config; render(); } };
}
