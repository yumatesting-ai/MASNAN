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
// gaya stiker: garis tepi putih tebal + bayangan lembut di sekeliling tokoh (menonjol saat foto profil kecil)
const STICKER = `<filter id="stk" x="-20%" y="-20%" width="140%" height="140%">
  <feMorphology in="SourceAlpha" operator="dilate" radius="9" result="d"/><feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="w"/>
  <feGaussianBlur in="d" stdDeviation="10" result="b"/><feOffset in="b" dy="8" result="bo"/><feFlood flood-color="#000" flood-opacity="0.25"/><feComposite in2="bo" operator="in" result="sh"/>
  <feMerge><feMergeNode in="sh"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const dots = (c) => `<pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="4" fill="${c}" opacity="0.18"/><circle cx="30" cy="30" r="4" fill="${c}" opacity="0.18"/></pattern>`;
const bg2 = (c1, c2, dc) => `<defs>${STICKER}${dots(dc)}<radialGradient id="bg" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/><rect width="${S}" height="${S}" fill="url(#dots)"/>
  <circle cx="400" cy="400" r="300" fill="#ffffff" opacity="0.18"/>`;
const ring = (c) => `<circle cx="400" cy="400" r="388" fill="none" stroke="${c}" stroke-width="16" opacity="0.9"/><circle cx="400" cy="400" r="374" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.8"/>`;
const spark = (x, y, r, c = "#ffffff") => `<path d="M${x},${y - r} Q${x + r * 0.18},${y - r * 0.18} ${x + r},${y} Q${x + r * 0.18},${y + r * 0.18} ${x},${y + r} Q${x - r * 0.18},${y + r * 0.18} ${x - r},${y} Q${x - r * 0.18},${y - r * 0.18} ${x},${y - r} Z" fill="${c}"/>`;
if (o.style === "trio") {          // tiga bocah close-up tertawa + Oyen mengintip
  body = bg2("#fff3b0", "#ff9f43", "#ffffff") + `<g filter="url(#stk)">` +
    put("bima", { expr: "happy", headTilt: -8 }, 175, 860, 1.85, "three") +
    put("rara", { expr: "laugh", headTilt: 8, flip: true }, 625, 860, 1.85, "three") +
    put("nana", { expr: "happy", eyes: "happy", mouth: "happy_open", blush: 1 }, 400, 930, 1.95) + `</g>` +
    `<g filter="url(#stk)">${cat(625, 262, 2.5, {})}</g>` + spark(150, 200, 26) + spark(110, 520, 16) + spark(250, 110, 14) + ring("#ff7a1a");
} else if (o.style === "oyenwink") { // maskot Oyen close-up, berkedip
  body = bg2("#d9f3ff", "#3d9be0", "#ffffff") + `<g filter="url(#stk)">${cat(400, 720, 11.5, {})}</g>` +
    spark(160, 200, 30) + spark(650, 170, 22) + spark(620, 290, 12) + ring("#2b7fd0");
} else if (o.style === "hasanoyen") { // Pak Hasan + Oyen tidur di kepala, gaya stiker
  body = bg2("#e5ffd6", "#4fb35a", "#ffffff") + `<g filter="url(#stk)">` + put("hasan", { expr: "smug", headTilt: -4 }, 400, 1110, 2.3) +
    cat(392, 312, 5.0, { mode: "sleep" }) + `</g>` + spark(150, 220, 24) + spark(660, 230, 18) + ring("#2f8f3e");
} else if (o.style === "nana") {   // Nana melambai, ceria
  body = bg2("#ffe1ec", "#ff6fa1", "#ffffff") + `<g filter="url(#stk)">` + put("nana", { expr: "happy", armR: 125, elbowR: -10, blush: 1 }, 380, 900, 2.2) + `</g>` +
    spark(170, 230, 26) + spark(640, 200, 20) + spark(600, 330, 12) + ring("#e0457b");
} else if (o.style === "geng") {

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
