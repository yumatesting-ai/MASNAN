#!/usr/bin/env node
// Render lokasi 2.5D (+ karakter di dalamnya) ke PNG atau MP4.
//
//   node tools/location.js --loc komplek --png out/komplek.png
//   node tools/location.js --loc warung --cast "atin:talk@etalase,hasan:laugh@bangku" --out out/warung.mp4 --seconds 3
//   node tools/location.js --loc komplek --cast "nana:walk_front@jauh>depan" --seconds 4 --out out/pulang.mp4
//   node tools/location.js --list
//
// Format cast: karakter:klip@titik[:flip]   — titik dari spots lokasi, atau "x,z" (meter).
//   "a>b" = berjalan dari titik a ke titik b selama durasi video.
// --format landscape (1600x900, default) | portrait (900x1600, untuk Reels/TikTok)

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");
const { createWorld } = require("../engine/world3d.js");
const { CLIPS, samplePose } = require("../engine/clips.js");

const o = { loc: "komplek", fps: 30, scale: 1, format: "landscape" };
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const k = args[i].replace(/^--/, "");
  if (k === "list") o.list = true; else o[k] = args[++i];
}
o.fps = +o.fps; o.scale = +o.scale;
const locDir = path.join(__dirname, "..", "locations");
if (o.list) {
  for (const f of fs.readdirSync(locDir).filter((f) => f.endsWith(".js"))) {
    const L = require(path.join(locDir, f));
    console.log(`${L.id.padEnd(10)} ${L.name.padEnd(22)} titik: ${Object.keys(L.spots).join(", ")}`);
  }
  process.exit(0);
}
const LOC = require(path.join(locDir, `${o.loc}.js`));
const portrait = o.format === "portrait";
const W = portrait ? 900 : 1600, H = portrait ? 1600 : 900;
const KID_UNITS_PER_M = 270; // tinggi anak ±310 satuan rig = 1.15 m

const spotOf = (s) => {
  if (LOC.spots[s]) return LOC.spots[s];
  const [x, z] = s.split(",").map(Number);
  if (Number.isFinite(x) && Number.isFinite(z)) return { x, z };
  throw new Error(`Titik "${s}" tidak ada di ${LOC.id}. Pilihan: ${Object.keys(LOC.spots).join(", ")}`);
};
const cast = (o.cast ? o.cast.split(",") : []).map((s) => {
  const [who, rest] = s.trim().split(":").length > 1 ? [s.trim().split(":")[0], s.trim().split(":").slice(1).join(":")] : [s, "idle"];
  const [clipPart, flag] = rest.split(":");
  const [clip, where = "depan"] = clipPart.split("@");
  const [a, b] = where.split(">");
  const rig = require(path.join(__dirname, "..", "characters", who, "rig.js"));
  if (!CLIPS[clip]) throw new Error(`Klip "${clip}" tidak ada.`);
  return { rig, clip: CLIPS[clip], from: spotOf(a), to: b ? spotOf(b) : null, flip: flag === "flip" };
});
const duration = o.seconds ? +o.seconds : Math.max(1, ...cast.map((m) => m.clip.duration));

function frame(t) {
  const camOpt = Object.assign({}, LOC.camera, portrait ? LOC.cameraPortrait || {} : {});
  if (portrait && !LOC.cameraPortrait) { camOpt.f = (camOpt.f || 1300) * 1.3; camOpt.horizon = 0.4; } // vertikal: lebih dekat
  const w = createWorld(Object.assign({ W, H }, camOpt));
  LOC.build(w, { t });
  for (const m of cast) {
    const k = m.to ? Math.min(1, t / duration) : 0;
    const x = m.from.x + ((m.to ? m.to.x : m.from.x) - m.from.x) * k;
    const z = m.from.z + ((m.to ? m.to.z : m.from.z) - m.from.z) * k;
    const pose = samplePose(m.clip, t % m.clip.duration, m.rig.resolvePose);
    if (m.flip) pose.flip = !pose.flip;
    w.sprite(x, z, (sx, sy, p) => {
      const s = p / KID_UNITS_PER_M;
      return `<g transform="translate(${(sx - 150 * s).toFixed(1)} ${(sy - 382 * s).toFixed(1)}) scale(${s.toFixed(4)})">${m.rig.drawPart(m.clip.view, pose)}</g>`;
    }, { bias: -0.05 });
  }
  return w.render();
}

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: o.scale });
  const shot = async (t, file) => {
    await pg.setContent(`<body style="margin:0">${frame(t)}</body>`);
    await pg.screenshot({ path: file });
  };
  if (o.png || !o.out) {
    const out = o.png || `out/${LOC.id}.png`;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await shot(+(o.t || 0), out);
    await b.close();
    return console.log(`Tersimpan: ${out}`);
  }
  fs.mkdirSync(path.dirname(o.out), { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "loc-"));
  const n = Math.round(duration * o.fps);
  for (let i = 0; i < n; i++) await shot(i / o.fps, path.join(tmp, `f${String(i).padStart(5, "0")}.png`));
  await b.close();
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(o.fps), "-i", path.join(tmp, "f%05d.png"),
    "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2:color=white", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", o.out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Tersimpan: ${o.out} (${n} frame @ ${o.fps}fps)`);
})();
