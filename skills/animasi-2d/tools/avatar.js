#!/usr/bin/env node
// Foto profil (avatar) kanal: komposisi tokoh di lingkaran berlatar, 800x800 PNG (aman dipotong bulat oleh YouTube).
//   WARNA=1 node tools/avatar.js --style geng|oyen|hasan --out out/avatar.png
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const LIFE = require("../engine/life.js");
const o = { style: "geng", out: "out/avatar.png" };
const a = process.argv.slice(2); for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, "")] = a[i + 1];
const R = (id) => require(path.join(__dirname, "..", "characters", id, "rig.js"));
const S = 800;
// tokoh: bagian dalam drawPart memakai koordinat rig (kaki di y=382, tengah x=150; dewasa sudah diskala di dalamnya)
const put = (id, pose, cx, footY, sc, view = "front") => `<g transform="translate(${cx - 150 * sc} ${footY - 382 * sc}) scale(${sc})">${R(id).drawPart(view, pose)}</g>`;
function cat(cx, cy, sc, opt) { // pinjam LIFE.cat dengan dunia tiruan
  let out = "";
  const w = { t: 1.3, sprite: (x, z, fn) => { out += fn(cx, cy, sc * 100, (c) => c, "#2a2a2a", 2.2); } };
  LIFE.cat(w, 0, 0, Object.assign({ mode: "sit", color: "#e59a4c", stripe: "#b8692c" }, opt));
  return out;
}
const bg = (c1, c2) => `<defs><radialGradient id="bg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>
  <radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6c8" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient></defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  ${Array.from({ length: 16 }, (_, i) => { const t = (i / 16) * Math.PI * 2; return `<path d="M400,330 L${400 + 900 * Math.cos(t)},${330 + 900 * Math.sin(t)} L${400 + 900 * Math.cos(t + 0.18)},${330 + 900 * Math.sin(t + 0.18)} Z" fill="#ffffff" opacity="0.07"/>`; }).join("")}
  <circle cx="400" cy="330" r="300" fill="url(#sun)"/>`;
const ground = `<ellipse cx="400" cy="760" rx="520" ry="170" fill="#8fc067"/><ellipse cx="400" cy="745" rx="470" ry="140" fill="#9fcd74"/>`;
let body = "";
if (o.style === "geng") {
  body = bg("#ffe9a8", "#f4a640") + ground +
    put("hasan", { expr: "laugh", armR: 30, armL: 30 }, 215, 640, 1.0) +
    put("atin", { expr: "smug" }, 585, 640, 1.0) +
    put("bima", { expr: "happy", armR: 150, armL: 20, elbowR: -20 }, 255, 735, 1.12) +
    put("rara", { expr: "laugh" }, 545, 735, 1.12) +
    put("nana", { expr: "smile", armR: 160, elbowR: -30 }, 400, 745, 1.15) +
    cat(400, 330, 2.4, {});
} else if (o.style === "oyen") {
  body = bg("#c9ecff", "#4aa3df") + ground + cat(400, 690, 10.5, {});
} else { // hasan: Pak Hasan dengan Oyen tidur di kepala
  body = bg("#d7f5c4", "#5fb35a") + ground + put("hasan", { expr: "deadpan", sweat: true }, 400, 1060, 2.2) +
    cat(390, 300, 5.2, { mode: "sleep" });
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${body}</svg>`;
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: S, height: S } });
  await pg.setContent(`<body style="margin:0">${svg}</body>`); fs.mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true });
  await pg.screenshot({ path: o.out }); await b.close(); console.log("Tersimpan:", o.out);
})();
