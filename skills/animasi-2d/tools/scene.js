#!/usr/bin/env node
// Adegan multi-karakter: beberapa karakter berdampingan, masing-masing memainkan klipnya.
//
//   node tools/scene.js --cast "nana:wave,bima:happy,rara:shy" --out out/adegan.mp4
//   node tools/scene.js --cast "nana:idle,bima:talk" --seconds 4 --label "Halo!"
//   node tools/scene.js --cast "nana:walk:flip,rara:walk" --png out/frame.png   # satu frame PNG
//   node tools/scene.js --cast "nana:idle,bima:idle,rara:idle" --names            # nama di bawah tiap karakter
//
// Format cast: karakter:klip[:flip], dipisah koma. Durasi default = klip terpanjang (semua klip loop).

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");
const { CLIPS, samplePose } = require("../engine/clips.js");

const o = { fps: 60, scale: 2, bg: "#ffffff", gap: 0, seconds: null };
const a = process.argv.slice(2).filter((x) => x !== "--names");
for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, "")] = a[i + 1];
o.fps = +o.fps; o.scale = +o.scale; o.gap = +o.gap;
if (!o.cast) throw new Error('Butuh --cast, mis. "nana:wave,bima:happy"');

const cast = o.cast.split(",").map((s) => {
  const [char, clip = "idle", flag] = s.trim().split(":");
  const rig = require(path.join(__dirname, "..", "characters", char, "rig.js"));
  const c = CLIPS[clip];
  if (!c) throw new Error(`Klip "${clip}" tidak ada. Pilihan: ${Object.keys(CLIPS).join(", ")}`);
  return { char, rig, clip: c, flip: flag === "flip" };
});
const step = 300 + o.gap;
const NAMES = process.argv.includes("--names");
const nameH = NAMES ? 44 : 0;
const W = step * cast.length - o.gap, Hh = 400 + nameH + (o.label ? 36 : 0); // ruang nama & label di bawah
const duration = o.seconds ? +o.seconds : Math.max(...cast.map((m) => m.clip.duration));

function frame(t) {
  const parts = cast.map((m, i) => {
    const pose = samplePose(m.clip, t % m.clip.duration, m.rig.resolvePose);
    if (m.flip) pose.flip = !pose.flip;
    return `<g transform="translate(${i * step} 0)">${m.rig.drawPart(m.clip.view, pose)}</g>`;
  }).join("");
  const names = NAMES ? `<div style="display:flex;gap:${o.gap}px">${cast.map((m) => `<div style="width:300px;text-align:center;font:800 24px sans-serif;color:#333;line-height:${nameH}px">${m.rig.design.name}</div>`).join("")}</div>` : "";
  const label = o.label ? `<div style="position:fixed;left:0;right:0;bottom:8px;text-align:center;font:700 20px sans-serif;color:#555">${o.label}</div>` : "";
  return `<body style="margin:0;background:${o.bg}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 400" width="${W}" height="400" style="display:block">${parts}</svg>${names}${label}</body>`;
}

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: W, height: Hh }, deviceScaleFactor: o.scale });
  if (o.png) {
    fs.mkdirSync(path.dirname(o.png), { recursive: true });
    await pg.setContent(frame(+(o.t || 0)));
    await pg.screenshot({ path: o.png });
    await b.close();
    return console.log(`Tersimpan: ${o.png}`);
  }
  const out = o.out || "out/adegan.mp4";
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scene-"));
  const n = Math.round(duration * o.fps);
  for (let i = 0; i < n; i++) {
    await pg.setContent(frame(i / o.fps));
    await pg.screenshot({ path: path.join(tmp, `f${String(i).padStart(5, "0")}.png`) });
  }
  await b.close();
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(o.fps), "-i", path.join(tmp, "f%05d.png"),
    "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Tersimpan: ${out} (${n} frame @ ${o.fps}fps, ${cast.length} karakter)`);
})();
