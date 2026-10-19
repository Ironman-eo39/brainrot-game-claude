// Drives the physics game headless and reports the car's motion: proves throttle, steering and braking change the result.
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const runs = [
  { name: 'straight', query: 'game=axe-squad&mode=physics&gas=1' },
  { name: 'steer-right', query: 'game=axe-squad&mode=physics&gas=1&right=1' },
  { name: 'steer-left', query: 'game=axe-squad&mode=physics&gas=1&left=1' },
  { name: 'brake', query: 'game=axe-squad&mode=physics&brake=1' },
  { name: 'course-steer', query: 'game=custom&play=1&gas=1&left=1' },
  { name: 'char-player', query: 'game=custom&play=1&player=tung-tung&gas=1' },
];
const browser = await chromium.launch({ executablePath: '/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const r of runs) {
  const page = await browser.newPage({ viewport: { width: 405, height: 720 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://localhost:8123/index.html?ui=0&' + r.query);
  await page.waitForFunction(() => !!window.__phys, null, { timeout: 60000 }).catch(() => {});
  await page.waitForFunction(() => window.__phys && window.__phys.simTime() > 0.5, null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(6000);
  const res = await page.evaluate(() => { const p = window.__phys; if (!p) return null; const t = p.pbody.translation(); const s = p.stats(); return { x: +t.x.toFixed(2), z: +t.z.toFixed(2), heading: +p.pst.heading.toFixed(3), speed: +p.pst.speed.toFixed(2), kmh: +p.speedKmh().toFixed(1), simT: +p.simTime().toFixed(2), smashed: s.smashed, crashes: s.crashes }; });
  console.log(r.name.padEnd(12), JSON.stringify(res), errs.slice(0, 2).join(' | ') || 'no errors');
  await page.close();
}
await browser.close();
