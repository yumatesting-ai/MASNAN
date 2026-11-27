#!/usr/bin/env node
// Potong video jadi versi YouTube Shorts / Reels (< 60 dtk) dengan fade masuk/keluar video & audio.
//   node tools/shorts.js --in out/episode.mp4 --out out/episode-shorts.mp4 [--from 0] [--to 59]
const { execFileSync } = require("child_process");
const o = { from: "0" }; const a = process.argv.slice(2); for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, "")] = a[i + 1];
const dur = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", o.in]).toString();
const from = +o.from, to = Math.min(dur, o.to ? +o.to : from + 59, from + 59.5), len = to - from, f = 0.35;
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(from), "-i", o.in, "-t", String(len),
  "-vf", `fade=t=in:st=0:d=${f},fade=t=out:st=${(len - f).toFixed(2)}:d=${f}`, "-af", `afade=t=in:st=0:d=${f},afade=t=out:st=${(len - f).toFixed(2)}:d=${f}`,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-c:a", "aac", "-b:a", "192k", o.out]);
console.log(`Shorts: ${o.out} (${len.toFixed(1)} dtk dari ${from}-${to.toFixed(1)})`);
