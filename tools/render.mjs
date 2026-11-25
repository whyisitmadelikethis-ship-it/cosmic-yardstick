// Render a Scale Zoom page (a folder with index.html, scale.js, scene.js, timing.json, fonts/) in headless Chrome.
//   node tools/render.mjs stills <web-dir> <out.jpg> t1 t2 ...        contact sheet of those times (6 per row, time-stamped)
//   node tools/render.mjs frame  <web-dir> <out.jpg> <t> [query]       one full-size frame (query e.g. "thumb=12&l1=..&l2=..")
//   node tools/render.mjs video  <web-dir> <out.mp4> [--fps 30]        silent H.264 video of the whole timeline (window.DUR)
// Size is always 1080x1920. Chrome: $CHROME or /usr/bin/google-chrome.
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { chromium } from 'playwright-core';

const [mode, dirArg, out, ...rest] = process.argv.slice(2);
if (!mode || !dirArg || !out) { console.error('usage: render.mjs stills|frame|video <web-dir> <out> ...'); process.exit(2); }
const dir = path.resolve(dirArg), W = 1080, H = 1920;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.otf': 'font/otf', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/favicon')) { res.writeHead(204); return res.end(); }
  const p = path.join(dir, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'] });

async function open(query = '') {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(base + (query ? '?' + query : ''));
  try { await page.waitForFunction('window.READY === true', null, { timeout: 30000 }); }
  catch { throw new Error('page never got READY: ' + errs.join(' | ')); }
  if (errs.length) throw new Error('page errors: ' + errs.join(' | '));
  return page;
}
const grab = (page, t) => page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93).split(',')[1]; }, t);

try {
  if (mode === 'frame') {
    const page = await open(rest[1] || '');
    fs.writeFileSync(out, Buffer.from(await grab(page, +rest[0] || 0), 'base64'));
  } else if (mode === 'stills') {
    const page = await open(); const tmp = fs.mkdtempSync('/tmp/stills-'); const files = [];
    for (const [i, t] of rest.map(Number).entries()) { const f = `${tmp}/${String(i).padStart(3, '0')}.jpg`; fs.writeFileSync(f, Buffer.from(await grab(page, t), 'base64')); files.push([f, t]); }
    // label each frame with its time, then tile 6 per row at 300 px wide
    const lab = files.map(([f, t]) => { const o = f.replace('.jpg', '_l.jpg'); execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, '-vf', `scale=300:-1,drawbox=x=0:y=0:w=300:h=26:color=black@0.7:t=fill,drawtext=text='t=${t}':x=6:y=5:fontsize=18:fontcolor=white`, o]); return o; });
    const cols = Math.min(6, lab.length), rows = Math.ceil(lab.length / cols);
    while (lab.length < rows * cols) lab.push(lab[lab.length - 1]);
    const inputs = lab.flatMap(f => ['-i', f]);
    const layout = lab.map((_, i) => `${(i % cols) * 300}_${Math.floor(i / cols) * 533}`).join('|');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `xstack=inputs=${lab.length}:layout=${layout}`, out]);
  } else if (mode === 'video') {
    const fi = rest.indexOf('--fps'), FPS = fi >= 0 ? +rest[fi + 1] : 30;
    const page = await open(); const dur = await page.evaluate('window.DUR'); const n = Math.round(dur * FPS);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < n; i++) {
      const buf = Buffer.from(await grab(page, i / FPS), 'base64');
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 120 === 0) process.stdout.write(`frame ${i}/${n}\r`);
    }
    ff.stdin.end(); const code = await new Promise(r => ff.on('close', r)); if (code) throw new Error('ffmpeg exited ' + code);
    console.log(`video ${out} ${n} frames @${FPS}fps`);
  } else throw new Error('unknown mode ' + mode);
} catch (e) { console.error('RENDER FAILED: ' + e.message); process.exitCode = 1; }
finally { await browser.close(); server.close(); }
