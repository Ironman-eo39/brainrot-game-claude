// usage: node tools/shot.mjs "<query>" out.png [w] [h]   (server must run on :8123)
import { chromium } from '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const [, , query = '', out = 'shot.png', w = '405', h = '720'] = process.argv;
const browser = await chromium.launch({ executablePath: '/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = []; page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); }); page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
await page.goto('http://localhost:8123/index.html?' + query);
await page.waitForFunction(() => (window.__frames || 0) > 3, null, { timeout: 60000 }).catch(() => logs.push('TIMEOUT frames'));
await page.waitForFunction(() => (window.__loading ?? 0) === 0 && (window.__hudPending ?? 0) === 0, null, { timeout: 50000 }).catch(() => logs.push('TIMEOUT loading'));
await page.waitForTimeout(1000);
await page.screenshot({ path: out });
console.log(logs.slice(0, 8).join('\n') || 'ok');
await browser.close();
