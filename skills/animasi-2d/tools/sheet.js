#!/usr/bin/env node
// Contact sheet untuk cek visual cepat.
//
//   node tools/sheet.js --char nana --mode expr  --out out/ekspresi.png   # semua preset ekspresi
//   node tools/sheet.js --char nana --mode views --out out/tampak.png     # semua tampak (+flip)
//   node tools/sheet.js --char nana --mode clip --clip walk --frames 6    # beberapa frame dari klip
//   node tools/sheet.js --char nana --poses '[{"expr":"happy"},{"view":"side"}]'

const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const o = { char: "nana", mode: "expr", cols: 6, scale: 1.5, frames: 6 };
const a = process.argv.slice(2);
for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, "")] = a[i + 1];
o.cols = +o.cols; o.scale = +o.scale; o.frames = +o.frames;

const dir = path.join(__dirname, "..", "characters", o.char);
const rig = require(path.join(dir, "rig.js"));
const { CLIPS } = require(path.join(dir, "animations.js"));

let items; // [{label, pose}]
if (o.poses) items = JSON.parse(o.poses).map((p, i) => ({ label: p.expr || p.view || `#${i}`, pose: p }));
else if (o.mode === "expr") items = Object.keys(rig.EXPRESSIONS).map((k) => ({ label: k, pose: { expr: k, fx: 0.15 } }));
else if (o.mode === "views") items = [...rig.VIEWS.map((v) => ({ label: v, pose: { view: v } })),
  ...["three", "side"].map((v) => ({ label: `${v} (flip)`, pose: { view: v, flip: true } }))];
else if (o.mode === "clip") {
  const c = CLIPS[o.clip];
  if (!c) throw new Error(`Klip tidak ada. Pilihan: ${Object.keys(CLIPS).join(", ")}`);
  items = Array.from({ length: o.frames }, (_, i) => {
    const t = (i / o.frames) * c.duration;
    return { label: `${o.clip} t=${t.toFixed(2)}`, pose: Object.assign({ view: c.view }, c.pose(t)) };
  });
}

(async () => {
  const cols = Math.min(o.cols, items.length);
  const rows = Math.ceil(items.length / cols);
  const W = 300 * cols, H = 430 * rows;
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: o.scale });
  const cells = items.map((it) => `<div style="width:300px;height:430px;text-align:center;font:600 18px sans-serif;color:#555">
      ${rig.drawCharacter("front", it.pose, { background: "#fff" })}<div>${it.label}</div></div>`).join("");
  await pg.setContent(`<body style="margin:0;background:#fff;display:grid;grid-template-columns:repeat(${cols},300px)">${cells}</body>`);
  const out = o.out || `out/${o.char}-${o.mode}.png`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await pg.screenshot({ path: out });
  await b.close();
  console.log(`Tersimpan: ${out}`);
})();
