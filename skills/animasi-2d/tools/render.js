#!/usr/bin/env node
// Render klip animasi karakter ke MP4 (atau PNG satu frame).
//
//   node tools/render.js --char nana --clip idle --out out/idle.mp4
//   node tools/render.js --char nana --clip wave --fps 30 --scale 3 --bg "#ffffff"   # default 60fps
//   node tools/render.js --char nana --pose '{"expr":"happy","view":"three"}' --out out/pose.png
//   node tools/render.js --clip happy --label "senang"   # teks label di bawah
//   node tools/render.js --list            # daftar klip & ekspresi
//
// Butuh: Playwright (Chromium) dan ffmpeg.

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

function args() {
  const a = process.argv.slice(2);
  const o = { char: "nana", clip: "idle", view: null, fps: 60, scale: 3, bg: "#ffffff", loops: 2 };
  for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, "")] = a[i + 1];
  o.fps = +o.fps; o.scale = +o.scale; o.loops = +o.loops;
  return o;
}

(async () => {
  const o = args();
  if (process.argv.includes("--list")) {
    const d = path.join(__dirname, "..", "characters", o.char);
    console.log("Klip:", Object.keys(require(path.join(d, "animations.js")).CLIPS).join(", "));
    console.log("Ekspresi:", Object.keys(require(path.join(d, "rig.js")).EXPRESSIONS).join(", "));
    return;
  }
  const dir = path.join(__dirname, "..", "characters", o.char);
  const rig = require(path.join(dir, "rig.js"));
  const { CLIPS, samplePose } = require(path.join(dir, "animations.js"));
  const W = 300, H = 400 + (o.label ? 30 : 0); // ruang label di bawah gambar

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: o.scale });
  const shot = async (pose, file, view = "front") => {
    const svg = rig.drawCharacter(o.view || view, pose, { width: W, height: 400, background: o.bg === "none" ? null : o.bg });
    const label = o.label ? `<div style="position:fixed;left:0;right:0;bottom:6px;text-align:center;font:700 16px sans-serif;color:#666">${o.label}</div>` : "";
    await page.setContent(`<body style="margin:0;background:${o.bg === "none" ? "transparent" : o.bg}"><div style="line-height:0">${svg}</div>${label}</body>`);
    await page.screenshot({ path: file, omitBackground: o.bg === "none" });
  };

  if (o.pose) {
    const out = o.out || `out/${o.char}-pose.png`;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await shot(JSON.parse(o.pose), out);
    await browser.close();
    return console.log(`Tersimpan: ${out}`);
  }

  const clip = CLIPS[o.clip];
  if (!clip) throw new Error(`Klip "${o.clip}" tidak ada. Pilihan: ${Object.keys(CLIPS).join(", ")}`);
  const out = o.out || `out/${o.char}-${o.clip}.mp4`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "frames-"));
  const n = Math.round(clip.duration * o.fps);
  for (let i = 0; i < n; i++) {
    await shot(samplePose(clip, i / o.fps, rig.resolvePose), path.join(tmp, `f${String(i).padStart(5, "0")}.png`), clip.view);
  }
  await browser.close();

  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-stream_loop", String(o.loops - 1), "-framerate", String(o.fps),
    "-i", path.join(tmp, "f%05d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out,
  ]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Tersimpan: ${out} (${n} frame x ${o.loops} loop @ ${o.fps}fps)`);
})();
