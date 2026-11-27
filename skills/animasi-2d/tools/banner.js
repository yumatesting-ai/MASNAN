#!/usr/bin/env node
// Banner kanal YouTube 2560x1440. Area aman (tampil di semua perangkat): 1546x423 di tengah -> judul & wajah tokoh di situ.
//   WARNA=1 node tools/banner.js --title "ANIMASI RT 05" --tagline "Cerita Lucu Anak Kampung" --bg out/bg.png --out out/banner.png [--guides 1]
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const LIFE = require("../engine/life.js");
const o = { title: "ANIMASI RT 05", tagline: "Cerita Lucu Anak Kampung", out: "out/banner.png" };
const a = process.argv.slice(2); for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, "")] = a[i + 1];
const W = 2560, H = 1440, SX = (W - 1546) / 2, SY = (H - 423) / 2;
const R = (id) => require(path.join(__dirname, "..", "characters", id, "rig.js"));
const put = (id, pose, cx, footY, sc, view = "front") => `<g transform="translate(${cx - 150 * sc} ${footY - 382 * sc}) scale(${sc})">${R(id).drawPart(view, pose)}</g>`;
function cat(cx, cy, sc, opt) { let out = ""; const w = { t: 1.3, sprite: (x, z, fn) => { out += fn(cx, cy, sc * 100, (c) => c, "#2a2a2a", 2.2); } };
  LIFE.cat(w, 0, 0, Object.assign({ mode: "sit", color: "#e59a4c", stripe: "#b8692c" }, opt)); return out; }
const bgImg = o.bg ? `data:image/png;base64,${fs.readFileSync(o.bg).toString("base64")}` : null;
const cy = H / 2;
const STK = `<filter id="stk" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="7" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="w"/>
  <feGaussianBlur in="d" stdDeviation="9" result="b"/><feOffset in="b" dy="8" result="bo"/><feFlood flood-color="#000" flood-opacity="0.3"/><feComposite in2="bo" operator="in" result="sh"/>
  <feMerge><feMergeNode in="sh"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
// papan nama kayu (seperti papan pos kamling) di tengah area aman
const boardW = 1000, boardH = 240, bx = W / 2 - boardW / 2, by = cy - boardH / 2 - 25;
const board = `<g filter="url(#stk)">
  <rect x="${bx + 90}" y="${by + boardH - 10}" width="26" height="140" fill="#7a5236" stroke="#2a2a2a" stroke-width="5"/>
  <rect x="${bx + boardW - 116}" y="${by + boardH - 10}" width="26" height="140" fill="#7a5236" stroke="#2a2a2a" stroke-width="5"/>
  <rect x="${bx}" y="${by}" width="${boardW}" height="${boardH}" rx="22" fill="#c98a52" stroke="#2a2a2a" stroke-width="7"/>
  ${[0.25, 0.5, 0.75].map((k) => `<path d="M${bx + 12},${by + boardH * k} L${bx + boardW - 12},${by + boardH * k}" stroke="#a96f3e" stroke-width="4"/>`).join("")}
  <rect x="${bx + 22}" y="${by + 22}" width="${boardW - 44}" height="${boardH - 44}" rx="14" fill="#fff6e0" stroke="#2a2a2a" stroke-width="5"/>
  ${[[bx + 40, by + 40], [bx + boardW - 40, by + 40], [bx + 40, by + boardH - 40], [bx + boardW - 40, by + boardH - 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#7a5236"/>`).join("")}
  <text x="${W / 2}" y="${by + 128}" text-anchor="middle" font-family="DejaVu Sans, Arial Black, sans-serif" font-weight="900" font-size="98" letter-spacing="3"
    fill="#d8343a" stroke="#2a2a2a" stroke-width="10" paint-order="stroke" stroke-linejoin="round">${o.title}</text>
  <text x="${W / 2}" y="${by + 186}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-weight="700" font-size="40" fill="#3a5a86">${o.tagline}</text></g>`;
const HF = cy + 330, HS = 1.15; // Pak Hasan (Oyen tidur di kepalanya)
const kids = `<g filter="url(#stk)">
  ${put("atin", { expr: "smile" }, 300, cy + 330, 1.1)}
  ${put("bima", { expr: "happy", armL: 150, armR: 150, elbowL: -25, elbowR: -25 }, 500, cy + 300, 1.3)}
  ${put("nana", { expr: "happy", blush: 1 }, 690, cy + 300, 1.3)}
  ${put("rara", { expr: "laugh" }, 1880, cy + 300, 1.3)}
  ${put("hasan", { expr: "smug" }, 2120, HF, HS)}
  ${cat(2112, HF - 347 * HS + 4, 2.5, { mode: "sleep" })}</g>`;
const spark = (x, y, r) => `<path d="M${x},${y - r} Q${x + r * 0.18},${y - r * 0.18} ${x + r},${y} Q${x + r * 0.18},${y + r * 0.18} ${x},${y + r} Q${x - r * 0.18},${y + r * 0.18} ${x - r},${y} Q${x - r * 0.18},${y - r * 0.18} ${x},${y - r} Z" fill="#fff"/>`;
const guides = o.guides ? `<rect x="${SX}" y="${SY}" width="1546" height="423" fill="none" stroke="#ff00ff" stroke-width="6" stroke-dasharray="20 12"/>
  <rect x="${(W - 2560) / 2}" y="${(H - 423) / 2}" width="2560" height="423" fill="none" stroke="#00e5ff" stroke-width="4" stroke-dasharray="10 10"/>` : "";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${STK}
  <linearGradient id="band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.5" stop-color="#000" stop-opacity="0.18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
  ${bgImg ? `<image href="${bgImg}" width="${W}" height="${H}"/>` : `<rect width="${W}" height="${H}" fill="#9fd3f0"/>`}
  <rect x="0" y="${SY - 120}" width="${W}" height="${423 + 240}" fill="url(#band)"/>
  ${spark(W / 2 - 520, cy - 190, 28)}${spark(W / 2 + 500, cy - 200, 22)}${spark(W / 2 + 560, cy + 150, 16)}
  ${board}${kids}${guides}</svg>`;
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: W, height: H } });
  await pg.setContent(`<body style="margin:0">${svg}</body>`); fs.mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true });
  await pg.screenshot({ path: o.out }); await b.close(); console.log("Tersimpan:", o.out);
})();
