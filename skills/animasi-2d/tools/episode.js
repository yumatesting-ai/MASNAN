#!/usr/bin/env node
// Render satu episode (beberapa adegan lokasi + narasi) menjadi satu MP4 bersubtitle.
//
//   node tools/episode.js episodes/pagi-di-kampung.json --out out/pagi.mp4
//   node tools/episode.js episodes/pagi-di-kampung.json --out out/pagi.mp4 --audio narasi.mp3   (pasang rekaman suara)
//   node tools/episode.js episodes/pagi-di-kampung.json --script out/naskah.md                  (cetak naskah saja)
//
// File episode (JSON): { title, format: "portrait"|"landscape", scenes: [
//   { loc, seconds, cast: "nana:walk_front@jauh>depan/4+wave", narasi: "kalimat...",
//     camera?: {x,y,z,f,horizon}, cameraTo?: {...} (gerak kamera halus selama adegan) } ] }
// Narasi tiap adegan dipecah per kalimat menjadi subtitle dengan durasi sebanding jumlah kata.
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i];
if (!file) { console.error("Pakai: node tools/episode.js <episode.json> --out out.mp4 [--audio narasi.mp3] [--script naskah.md]"); process.exit(1); }
const ep = JSON.parse(fs.readFileSync(file, "utf8"));
const portrait = (ep.format || "portrait") === "portrait";
const W = portrait ? 900 : 1600, H = portrait ? 1600 : 900;

// ---- timing narasi ----
const { lineDuration } = require("../engine/lipsync.js");
const NAME = (who) => { try { return require(path.join(__dirname, "..", "characters", who, "design.js")).name; } catch { return who; } };
const cues = []; let T = 0;
ep.scenes.forEach((s, i) => {
  const sent = (s.narasi || "").match(/[^.!?]+[.!?]*/g)?.map((x) => x.trim()).filter(Boolean) || [];
  const words = sent.map((x) => x.split(/\s+/).length), total = words.reduce((a, b) => a + b, 0) || 1;
  const pad = 0.35, avail = s.seconds - pad * 2;
  let t = T + pad;
  // adegan berdialog: narasi tampil di ATAS (gaya narator), dialog di bawah dengan nama tokoh
  const narrStyle = s.dialog && s.dialog.length ? "NarasiAtas" : "Narasi";
  sent.forEach((x, k) => { const d = (avail * words[k]) / total; cues.push({ a: t, b: t + d - 0.08, text: x, scene: i + 1, style: narrStyle }); t += d; });
  for (const d0 of s.dialog || []) { const d = Object.assign({}, d0, { text: d0.text.replace(/\[[^\]]+\]\s*/g, "").trim() }); cues.push({ a: T + d.at, b: Math.min(T + s.seconds - 0.05, T + d.at + (d.dur || lineDuration(d.text)) + 0.45), text: d.noname ? d.text : `${NAME(d.who)}: ${d.text}`, name: d.noname ? "" : NAME(d.who), line: d.text, scene: i + 1, style: "Dialog" }); }
  s._start = T; T += s.seconds;
});

const fmt = (t) => { const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return `${h}:${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}`; };
const srt = (t) => { const ms = Math.round(t * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };

if (opt.script) {
  let md = `# ${ep.title}\n\nDurasi ±${Math.round(T)} detik · format ${portrait ? "9:16 (Reels/TikTok/Shorts)" : "16:9"}\n\n`;
  ep.scenes.forEach((s, i) => {
    md += `## Adegan ${i + 1} — ${s.judul || s.loc} (${fmt(s._start).slice(2, 7)}–${fmt(s._start + s.seconds).slice(2, 7)})\n\n`;
    md += `*Visual:* ${s.visual || s.cast}\n\n`;
    if (s.narasi) md += `**Narator:** ${s.narasi}\n\n`;
    for (const d of s.dialog || []) md += `- \`${fmt(s._start + d.at).slice(2, 10)}\` **${NAME(d.who)}:** ${d.text}\n`;
    if ((s.dialog || []).length) md += "\n";
  });
  fs.writeFileSync(opt.script, md);
  const srtTxt = cues.map((c, i) => `${i + 1}\n${srt(c.a)} --> ${srt(c.b)}\n${c.text}\n`).join("\n");
  fs.writeFileSync(opt.script.replace(/\.md$/, "") + ".srt", srtTxt);
  console.log("Naskah:", opt.script);
  if (!opt.out) process.exit(0);
}

// ---- render adegan ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "episode-"));
function sceneArgs(s, extra) {
  const a = [path.join(__dirname, "location.js"), "--loc", s.loc, "--format", portrait ? "portrait" : "landscape", "--seconds", String(s.seconds), ...extra];
  if (s.cast) a.push("--cast", s.cast);
  if (s.extras) a.push("--extras", s.extras);
  if (s.t0) a.push("--t0", String(s.t0));
  if (s.time || ep.time) a.push("--time", s.time || ep.time);
  if (s.dialog) a.push("--dialog", JSON.stringify(s.dialog));
  if (s.positions || ep.positions) a.push("--positions", JSON.stringify(Object.assign({}, ep.positions, s.positions)));
  if (s.camkeys) a.push("--camkeys", JSON.stringify(s.camkeys));
  if (s.fx) a.push("--fx", JSON.stringify(s.fx));
  if (s.fg) a.push("--fg", JSON.stringify(s.fg));
  if (s.camera) a.push("--camera", JSON.stringify(s.camera));
  if (s.cameraTo) a.push("--camera-to", JSON.stringify(s.cameraTo));
  return a;
}
// --check: cek rute semua adegan (tokoh menembus benda?) tanpa render
if (opt.check !== undefined || process.argv.includes("--check")) {
  let bad = 0;
  ep.scenes.forEach((s, i) => {
    try { execFileSync("node", [...sceneArgs(s, ["--check", "1"])], { stdio: ["ignore", "pipe", "pipe"] }); console.log(`Adegan ${i + 1} (${s.loc}): OK`); }
    catch (e) { bad++; console.log(`Adegan ${i + 1} (${s.loc}):\n${String(e.stderr).trim()}`); }
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(bad ? 2 : 0);
}
// --preview <file.png> [--at "0.2,0.5,0.8"]: lembar kontak gambar diam per adegan (cek komposisi cepat)
if (opt.preview) {
  const us = (opt.at || "0.15,0.5,0.85").split(",").map(Number), ims = [];
  ep.scenes.forEach((s, i) => us.forEach((u, k) => {
    const f = path.join(tmp, `p${i}_${k}.png`);
    execFileSync("node", sceneArgs(s, ["--t", String(+(s.seconds * u).toFixed(2)), "--png", f]), { stdio: ["ignore", "ignore", "inherit"] });
    ims.push(f);
  }));
  const n = us.length, rows = ep.scenes.length;
  const inputs = ims.flatMap((f) => ["-i", f]);
  const fc = ims.map((_, k) => `[${k}]scale=240:-1[v${k}]`).join(";") + ";" +
    Array.from({ length: rows }, (_, r) => (n > 1 ? Array.from({ length: n }, (_, c) => `[v${r * n + c}]`).join("") + `hstack=inputs=${n}` : `[v${r * n}]null`) + `[r${r}]`).join(";") + ";" +
    (rows > 1 ? Array.from({ length: rows }, (_, r) => `[r${r}]`).join("") + `vstack=inputs=${rows}` : "[r0]null");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...inputs, "-filter_complex", fc, opt.preview]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("Pratinjau:", opt.preview);
  process.exit(0);
}
const parts = ep.scenes.map((s, i) => {
  const out = path.join(tmp, `s${i}.mp4`);
  process.stdout.write(`Adegan ${i + 1}/${ep.scenes.length} (${s.loc})...\n`);
  execFileSync("node", sceneArgs(s, ["--out", out]), { stdio: ["ignore", "ignore", "inherit"] });
  return out;
});

// ---- subtitle ASS: judul + narasi ----
const fs1 = Math.round(W * 0.052), ft = Math.round(W * 0.085);
let ass = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 0\n\n[V4+ Styles]\n`;
ass += "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n";
ass += `Style: Narasi,DejaVu Sans,${fs1},&H00FFFFFF,&H00FFFFFF,&H00202020,&H80000000,1,0,0,0,100,100,0,0,1,${Math.round(fs1 * 0.14)},${Math.round(fs1 * 0.06)},2,${Math.round(W * 0.07)},${Math.round(W * 0.07)},${Math.round(H * (portrait ? 0.16 : 0.07))},1\n`;
ass += `Style: Dialog,DejaVu Sans,${Math.round(fs1 * 1.05)},&H00FFFFFF,&H00FFFFFF,&H00202020,&H80000000,1,0,0,0,100,100,0,0,1,${Math.round(fs1 * 0.16)},${Math.round(fs1 * 0.06)},2,${Math.round(W * 0.06)},${Math.round(W * 0.06)},${Math.round(H * (portrait ? 0.14 : 0.06))},1\n`;
ass += `Style: NarasiAtas,DejaVu Sans,${Math.round(fs1 * 0.85)},&H00F0F0F0,&H00FFFFFF,&H00303030,&H80000000,0,1,0,0,100,100,0,0,1,${Math.round(fs1 * 0.12)},0,8,${Math.round(W * 0.08)},${Math.round(W * 0.08)},${Math.round(H * (portrait ? 0.2 : 0.12))},1\n`;
ass += `Style: Judul,DejaVu Sans,${ft},&H00FFFFFF,&H00FFFFFF,&H00202020,&H80000000,1,0,0,0,100,100,0,0,1,${Math.round(ft * 0.12)},${Math.round(ft * 0.05)},8,40,40,${Math.round(H * (portrait ? 0.1 : 0.06))},1\n\n`;
ass += "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";
if (ep.title) ass += `Dialogue: 1,${fmt(0.2)},${fmt(Math.min(3.2, ep.scenes[0].seconds - 0.2))},Judul,,0,0,0,,{\\fad(300,400)}${ep.title}\n`;
for (const c of cues) ass += `Dialogue: 0,${fmt(c.a)},${fmt(c.b)},${c.style || "Narasi"},,0,0,0,,{\\fad(120,120)}${c.style === "Dialog" && c.name ? `{\\c&H00C8C8C8&}${c.name}:{\\c&H00FFFFFF&} ${c.line}` : c.style === "Dialog" ? c.line : c.text}\n`;
const assPath = path.join(tmp, "sub.ass");
fs.writeFileSync(assPath, ass);

const list = path.join(tmp, "list.txt");
fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
const joined = path.join(tmp, "joined.mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined]);
const out = opt.out || "out/episode.mp4";
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const ff = ["-loglevel", "error", "-y", "-i", joined];
if (opt.audio) ff.push("-i", opt.audio);
ff.push("-vf", `ass=${assPath}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20");
if (opt.audio) ff.push("-map", "0:v", "-map", "1:a", "-af", "apad", "-c:a", "aac", "-shortest"); // audio lebih pendek -> diisi senyap
ff.push(out);
execFileSync("ffmpeg", ff);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Tersimpan: ${out} (${T.toFixed(1)} detik, ${cues.length} baris narasi)`);
