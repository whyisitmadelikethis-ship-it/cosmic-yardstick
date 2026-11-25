// node tools/events.mjs <web-dir>  -> {"dur":..,"ev":[{t,type}]} from the scene (used by mix.py)
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const d = path.resolve(process.argv[2]);
const K = await import(pathToFileURL(path.join(d, 'scale.js'))), { scene } = await import(pathToFileURL(path.join(d, 'scene.js')));
const T = JSON.parse(fs.readFileSync(path.join(d, 'timing.json'), 'utf8'));
const ev = (scene(K, T).ev || []).filter(e => isFinite(e.t)).sort((a, b) => a.t - b.t);
console.log(JSON.stringify({ dur: T.dur, ev }));
