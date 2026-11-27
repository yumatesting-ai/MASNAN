#!/usr/bin/env node
// Thumbnail video dari sebuah momen episode: frame adegan + judul besar bergaris tebal + kata kunci kuning + bingkai.
//   WARNA=1 node tools/thumbnail.js episodes/bola-nyangkut.json --scene 0 --t 58.8 --text "OYEN JADI TOPI!" \
//     --key "OYEN" --out out/thumb.png [--format landscape|portrait] [--camera '{"x":2.9,"y":1.5,"z":7.4,"f":1500,"horizon":0.42}']
// landscape = 1280x720 (thumbnail video panjang), portrait = 1080x1920 (Shorts).
const fs = require("fs"), path = require("path"), os = require("os");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");
const args = process.argv.slice(2), file = args.find((x) => !x.startsWith("--") && x.endsWith(".json"));
const o = { scene: "0", t: "1", text: "", key: "", format: "landscape", out: "out/thumb.png" };
for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) o[args[i].slice(2)] = args[++i];
const ep = JSON.parse(fs.readFileSync(file)), s = ep.scenes[+o.scene];
const L = o.format === "landscape", W = L ? 1280 : 1080, H = L ? 720 : 1920;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "thumb-")), frame = path.join(tmp, "f.png");
const a = [path.join(__dirname, "location.js"), "--loc", s.loc, "--format", L ? "landscape" : "portrait", "--scale", String(L ? 0.8 : 1.2),
  "--seconds", String(s.seconds), "--t", String(o.t), "--png", frame];
for (const [k, f] of [["cast", "--cast"], ["extras", "--extras"], ["t0", "--t0"]]) if (s[k] !== undefined) a.push(f, String(s[k]));
for (const [k, f] of [["dialog", "--dialog"], ["looks", "--looks"], ["fx", "--fx"], ["locopts", "--locopts"]]) if (s[k]) a.push(f, JSON.stringify(s[k]));
if (o.camera) a.push("--camkeys", JSON.stringify([Object.assign({ t: 0 }, JSON.parse(o.camera))])); else if (s.camkeys) a.push("--camkeys", JSON.stringify(s.camkeys));
if (ep.positions) a.push("--positions", JSON.stringify(ep.positions));
if (s.time || ep.time) a.push("--time", s.time || ep.time);
execFileSync("node", a, { stdio: "ignore", env: process.env });
const img = `data:image/png;base64,${fs.readFileSync(frame).toString("base64")}`;
// judul: maks 2 baris, kata kunci kuning, garis hitam tebal, sedikit miring
const words = o.text.toUpperCase().split(/\s+/).filter(Boolean), keys = new Set(o.key.toUpperCase().split(/[,\s]+/).filter(Boolean));
const lines = []; let cur = [];
const LIM = L ? 16 : 9;
for (const w of words) { if (cur.length && [...cur, w].join(" ").length > LIM) { lines.push(cur); cur = []; } cur.push(w); } if (cur.length) lines.push(cur);
const longest = Math.max(...lines.map((l) => l.join(" ").length)), fit = ((L ? 0.86 : 0.9) * W) / (0.74 * longest); // muat lebar
const fsz = Math.min(L ? (lines.length > 1 ? 96 : 118) : 130, fit), x0 = L ? 48 : W / 2, y0 = L ? 40 + fsz : 300, anchor = L ? "start" : "middle";
const txt = lines.map((ln, i) => `<text x="${x0}" y="${y0 + i * fsz * 1.08}" text-anchor="${anchor}" font-family="DejaVu Sans, Arial Black, sans-serif" font-weight="900" font-size="${fsz}"
  stroke="#141414" stroke-width="${fsz * 0.2}" stroke-linejoin="round" paint-order="stroke">${ln.map((w) => `<tspan fill="${keys.has(w.replace(/[^A-Z0-9]/g, "")) ? "#ffd23d" : "#ffffff"}">${w}</tspan>`).join(" ")}</text>`).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><linearGradient id="sh" x1="0" y1="0" x2="${L ? 1 : 0}" y2="${L ? 0 : 1}"><stop offset="0" stop-color="#000" stop-opacity="0.45"/><stop offset="0.55" stop-color="#000" stop-opacity="0"/></linearGradient>
  <radialGradient id="vg" cx="50%" cy="50%" r="75%"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient></defs>
  <image href="${img}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${W}" height="${H}" fill="url(#sh)"/><rect width="${W}" height="${H}" fill="url(#vg)"/>
  <g transform="rotate(${L ? -3 : -2} ${x0} ${y0})">${txt}</g>
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="#ffd23d" stroke-width="12" rx="10"/></svg>`;
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: W, height: H } });
  await pg.setContent(`<body style="margin:0">${svg}</body>`); fs.mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true });
  await pg.screenshot({ path: o.out }); await b.close(); fs.rmSync(tmp, { recursive: true, force: true }); console.log("Tersimpan:", o.out);
})();
