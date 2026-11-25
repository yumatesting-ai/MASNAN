#!/usr/bin/env node
// QA gerak: cari parameter pose yang melompat antar frame (termasuk sambungan loop).
//   node tools/check.js [--char nana] [--clip walk] [--fps 60]
const path = require("path");
const o = { char: "nana", fps: 60 };
const a = process.argv.slice(2);
for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, "")] = a[i + 1];
const dir = path.join(__dirname, "..", "characters", o.char);
const rig = require(path.join(dir, "rig.js"));
const { CLIPS, samplePose } = require(path.join(dir, "animations.js"));
// batas perubahan per frame @60fps
const TH = { headX: 1.2, headY: 1.2, bodyX: 1.2, bodyY: 3, armL: 6, armR: 6, legL: 3, legR: 4, headTilt: 1.5, lean: 1,
  squash: 0.12, lookX: 0.2, lookY: 0.2, ahoge: 5, hairSway: 0.5, breathe: 0.1, scaleX: 0.05 };
const fps = +o.fps, scale = 60 / fps;
for (const [name, c] of Object.entries(CLIPS)) {
  if (o.clip && o.clip !== name) continue;
  const n = Math.round(c.duration * fps), out = [];
  const P = (i) => samplePose(c, (i % n) / fps, rig.resolvePose);
  let prev = P(0);
  for (let i = 0; i < n; i++) {
    const cur = P(i + 1);
    for (const k in TH) {
      const d = Math.abs(cur[k] - prev[k]);
      if (d > TH[k] * scale) out.push(`${k}@${(i / fps).toFixed(2)}${i === n - 1 ? "(LOOP)" : ""}:${d.toFixed(1)}`);
    }
    prev = cur;
  }
  console.log(name.padEnd(13), out.length ? `${out.length} lompatan: ${out.slice(0, 6).join("  ")}` : "ok");
}
