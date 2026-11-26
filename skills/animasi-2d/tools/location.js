#!/usr/bin/env node
// Render lokasi 2.5D (+ karakter di dalamnya) ke PNG atau MP4.
//
//   node tools/location.js --loc kampung --png out/kampung.png
//   node tools/location.js --loc warung --cast "atin:talk@balik_etalase,hasan:sit_drink@duduk_meja" --out out/warung.mp4
//   node tools/location.js --loc kampung --cast "nana:walk_front@jauh>depan" --seconds 4 --out out/pulang.mp4
//   node tools/location.js --loc warung --cast "hasan:walk@jalan_kiri>duduk_meja/3+sit_drink/5+sit_read/6" --out out/ngopi.mp4
//   node tools/location.js --list
//
// Format cast: karakter:rangkaian[:flip], dipisah koma. Rangkaian = fase "klip[@titik|@a>b][/detik]" dipisah "+"
//   (lihat engine/timeline.js). Titik dari spots lokasi atau "x,z" (meter); spot boleh punya y (lantai tinggi)
//   dan seat (tinggi tempat duduk -> klip sit_* otomatis duduk di situ).
// --format landscape (1600x900, default) | portrait (900x1600, untuk Reels/TikTok)
// --extras off  -> tanpa figuran (karakter latar)
// --extras-style shadow (default: siluet abu polos + sedikit buram) | blur (bentuk asli diburamkan) | detail

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");
const { createWorld } = require("../engine/world3d.js");
const { createTimeline } = require("../engine/timeline.js");
const { figuran } = require("../engine/extras.js");

const o = { loc: "kampung", fps: 30, scale: 1, format: "landscape" };
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
  const [who, specRaw = "idle", flag] = s.trim().split(":");
  let spec = specRaw;
  if (!spec.split("+")[0].includes("@")) { // fase pertama tanpa titik -> berdiri di "depan"
    const parts = spec.split("+"); const [c0, d0] = parts[0].split("/");
    parts[0] = `${c0}@${LOC.spots.depan ? "depan" : Object.keys(LOC.spots)[0]}${d0 ? "/" + d0 : ""}`; spec = parts.join("+");
  }
  const rig = require(path.join(__dirname, "..", "characters", who, "rig.js"));
  const tl = createTimeline(spec, spotOf, rig.resolvePose, { flip: flag === "flip", seconds: o.seconds ? +o.seconds : null });
  return { rig, tl };
});
const duration = o.seconds ? +o.seconds : Math.max(1, ...cast.map((m) => m.tl.total));
// figuran: karakter latar acak yang beraktivitas sendiri (diulang). --extras off untuk mematikan.
const extras = o.extras === "off" ? [] : (LOC.extras || []).map((e) => {
  const rig = figuran(e.seed, e.kind);
  return { rig, tl: createTimeline(e.spec, spotOf, rig.resolvePose, { flip: !!e.flip }), phase: e.phase || 0, extra: true };
});

function frame(t) {
  const camOpt = Object.assign({}, LOC.camera, portrait ? LOC.cameraPortrait || {} : {});
  if (portrait && !LOC.cameraPortrait) { camOpt.f = (camOpt.f || 1300) * 1.3; camOpt.horizon = 0.4; } // vertikal: lebih dekat
  const w = createWorld(Object.assign({ W, H }, camOpt));
  w.t = t; // waktu untuk animasi lingkungan (pohon bergoyang, dll.)
  LOC.build(w, { t });
  // kabut jarak untuk karakter: makin jauh makin pudar (filter warna menuju warna langit)
  const fogIds = new Set();
  const fogFilter = (k) => {
    const b = Math.round(k * 20) / 20;
    if (b <= 0) return "";
    const id = `chfog${Math.round(b * 100)}`;
    if (!fogIds.has(id)) {
      fogIds.add(id);
      const sl = (1 - b).toFixed(3), ic = (b * 0.87).toFixed(3);
      w.add("sky", 2e9, `<defs><filter id="${id}" color-interpolation-filters="sRGB"><feComponentTransfer>
        <feFuncR type="linear" slope="${sl}" intercept="${ic}"/><feFuncG type="linear" slope="${sl}" intercept="${ic}"/>
        <feFuncB type="linear" slope="${sl}" intercept="${ic}"/></feComponentTransfer></filter></defs>`);
    }
    return `filter="url(#${id})"`;
  };
  // gaya figuran: siluet/buram agar tidak bersaing dengan tokoh utama (filter di ruang piksel kanvas)
  const exStyle = o["extras-style"] || "shadow";
  const exFilter = (z) => {
    if (exStyle === "detail") return fogFilter(w.fogK(z) * 0.95);
    const k = Math.round(Math.min(0.6, w.fogK(z)) * 10) / 10, id = `fig_${exStyle}_${Math.round(k * 10)}`;
    if (!fogIds.has(id)) {
      fogIds.add(id);
      const g = (0.62 + k * 0.45).toFixed(3); // siluet makin terang (pudar) bila jauh
      const body = exStyle === "shadow"
        ? `<feColorMatrix type="matrix" values="0 0 0 0 ${g}  0 0 0 0 ${g}  0 0 0 0 ${g}  0 0 0 0.85 0"/><feGaussianBlur stdDeviation="1.6"/>`
        : `<feGaussianBlur stdDeviation="3.2"/><feComponentTransfer><feFuncR type="linear" slope="${(0.75 - k * 0.4).toFixed(2)}" intercept="${(0.24 + k * 0.37).toFixed(2)}"/>
           <feFuncG type="linear" slope="${(0.75 - k * 0.4).toFixed(2)}" intercept="${(0.24 + k * 0.37).toFixed(2)}"/><feFuncB type="linear" slope="${(0.75 - k * 0.4).toFixed(2)}" intercept="${(0.24 + k * 0.37).toFixed(2)}"/></feComponentTransfer>`;
      w.add("sky", 2e9, `<defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">${body}</filter></defs>`);
    }
    return `filter="url(#${id})"`;
  };
  for (const m of [...extras, ...cast]) {
    const tt = m.extra ? (t + m.phase) % m.tl.total : t;
    const { pose, x, z, y } = m.tl.at(tt);
    // bayangan matahari karakter (searah bayangan lingkungan)
    const hS = 0.55 * ((m.rig.CANVAS && m.rig.CANVAS.scale) || 1) + (pose.sit ? (pose.seat || 0.45) * 0.6 : 0);
    w.castBlob(x, z, hS, 0.24 * ((m.rig.CANVAS && m.rig.CANVAS.scale) || 1), { trunk: 0.12, strength: m.extra ? 0.6 : 0.9 });
    if (m.extra && exStyle === "shadow") Object.assign(pose, { above: null, sweat: false, blush: 0, anger: false }); // siluet: tanpa efek wajah
    w.sprite(x, z, (sx, sy, p) => {
      const s = p / KID_UNITS_PER_M;
      const inner = `<g transform="translate(${(sx - 150 * s).toFixed(1)} ${(sy - 382 * s).toFixed(1)}) scale(${s.toFixed(4)})">${m.rig.drawPart(pose.view, pose)}</g>`;
      return `<g ${m.extra ? exFilter(z) : fogFilter(w.fogK(z) * 0.35)}>${inner}</g>`; // tokoh utama hanya sedikit berkabut
    }, { bias: m.extra ? -0.04 : -0.05, y });
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
