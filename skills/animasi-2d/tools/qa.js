// QA: render frame tiap `step` detik untuk seluruh episode, beri label waktu, susun lembar kontak
const fs = require("fs"), { execFileSync } = require("child_process"), path = require("path");
const [epFile, outDir, step = "1.5", cols = "8"] = process.argv.slice(2);
const ep = JSON.parse(fs.readFileSync(epFile));
fs.mkdirSync(outDir, { recursive: true });
let T = 0, k = 0; const files = [];
for (const s of ep.scenes) {
  for (let t = 0.3; t < s.seconds; t += +step) {
    const a = ["tools/location.js", "--loc", s.loc, "--format", "portrait", "--seconds", String(s.seconds), "--t", t.toFixed(2), "--png", path.join(outDir, `f${String(k).padStart(3, "0")}.png`)];
    for (const [key, flag] of [["cast", "--cast"], ["extras", "--extras"], ["t0", "--t0"]]) if (s[key] !== undefined) a.push(flag, String(s[key]));
    for (const [key, flag] of [["dialog", "--dialog"], ["looks", "--looks"], ["camkeys", "--camkeys"], ["fx", "--fx"], ["fg", "--fg"], ["locopts", "--locopts"]]) if (s[key]) a.push(flag, JSON.stringify(s[key]));
    if (ep.positions) a.push("--positions", JSON.stringify(ep.positions));
    if (s.time || ep.time) a.push("--time", s.time || ep.time);
    execFileSync("node", a, { stdio: "ignore", env: { ...process.env, WARNA: "1" } });
    const f = path.join(outDir, `f${String(k).padStart(3, "0")}.png`), g = f.replace(".png", "_l.png");
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", f, "-vf", `scale=225:400,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${(T + t).toFixed(1)}':fontcolor=yellow:box=1:boxcolor=black@0.6:fontsize=18:x=4:y=4`, g]);
    files.push(g); k++;
  }
  T += s.seconds;
}
const C = +cols, rows = [];
for (let r = 0; r * C < files.length; r++) {
  const row = files.slice(r * C, r * C + C); while (row.length < C) row.push(row[row.length - 1]);
  const out = path.join(outDir, `row${r}.png`);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...row.flatMap((x) => ["-i", x]), "-filter_complex", `hstack=inputs=${C}`, out]); rows.push(out);
}
for (let p = 0; p * 4 < rows.length; p++) {
  const part = rows.slice(p * 4, p * 4 + 4);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...part.flatMap((x) => ["-i", x]), "-filter_complex", part.length > 1 ? `vstack=inputs=${part.length}` : "null", path.join(outDir, `sheet${p}.png`)]);
}
console.log(files.length, "frames,", Math.ceil(rows.length / 4), "sheets");
