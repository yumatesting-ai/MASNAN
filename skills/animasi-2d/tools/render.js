#!/usr/bin/env node
// Render klip animasi karakter ke MP4 (atau PNG satu frame).
//
//   node tools/render.js --char nana --clip idle --out out/idle.mp4
//   node tools/render.js --char nana --clip wave --fps 30 --scale 3 --bg "#ffffff"
//   node tools/render.js --char nana --pose '{"blink":1}' --out out/pose.png
//
// Butuh: Playwright (Chromium) dan ffmpeg.

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

function args() {
  const a = process.argv.slice(2);
  const o = { char: "nana", clip: "idle", view: "front", fps: 30, scale: 3, bg: "#ffffff", loops: 2 };
  for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, "")] = a[i + 1];
  o.fps = +o.fps; o.scale = +o.scale; o.loops = +o.loops;
  return o;
}

(async () => {
  const o = args();
  const dir = path.join(__dirname, "..", "characters", o.char);
  const rig = require(path.join(dir, "rig.js"));
  const { CLIPS } = require(path.join(dir, "animations.js"));
  const W = 300, H = 400;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: o.scale });
  const shot = async (pose, file) => {
    const svg = rig.drawCharacter(o.view, pose, { width: W, height: H, background: o.bg === "none" ? null : o.bg });
    await page.setContent(`<body style="margin:0">${svg}</body>`);
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
    await shot(clip.pose(i / o.fps), path.join(tmp, `f${String(i).padStart(5, "0")}.png`));
  }
  await browser.close();

  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-stream_loop", String(o.loops - 1), "-framerate", String(o.fps),
    "-i", path.join(tmp, "f%05d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out,
  ]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Tersimpan: ${out} (${n} frame x ${o.loops} loop @ ${o.fps}fps)`);
})();
