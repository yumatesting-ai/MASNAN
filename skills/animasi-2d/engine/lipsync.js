// LIP SYNC sederhana dari teks dialog (tanpa audio): tiap huruf -> bentuk mulut (viseme), durasi per huruf
// mengikuti kecepatan bicara alami (±14 huruf/dtk), jeda pada koma/titik. Hasil: mulut tidak lagi satu bentuk.
//
//   const { lineDuration, mouthAt } = require("./lipsync.js");
//   lineDuration("Bu, kopi satu!")   -> detik
//   mouthAt("Bu, kopi satu!", 0.42)  -> "o" | "open" | "grin" | "flat" | "cat" | "shout" | null (selesai)
//
// Viseme: a -> open (shout bila teriak/huruf kapital semua), i/e -> grin, o/u -> o, m/b/p/f/v -> flat (bibir
// rapat), konsonan lain -> cat (mulut kecil), jeda -> smile/flat.
const DUR = { vowel: 0.085, cons: 0.055, space: 0.05, comma: 0.24, stop: 0.34, ellipsis: 0.45 };

function tokens(text) {
  const loud = text === text.toUpperCase() && /[A-Z]{3,}/.test(text);
  const out = [];
  const s = text.replace(/\.\.\.|…/g, "~");
  for (const ch of s) {
    const c = ch.toLowerCase();
    if ("aiueo".includes(c)) {
      const m = c === "a" ? (loud ? "shout" : "open") : c === "i" || c === "e" ? (loud ? "shout" : "grin") : "o";
      out.push([m, DUR.vowel * (loud ? 1.15 : 1)]);
    } else if ("mbpfv".includes(c)) out.push(["flat", DUR.cons]);
    else if (/[a-z]/.test(c)) out.push(["cat", DUR.cons]);
    else if (c === " ") out.push([null, DUR.space]);
    else if (c === ",") out.push(["smile", DUR.comma]);
    else if (c === "~") out.push(["flat", DUR.ellipsis]);
    else if (".!?".includes(c)) out.push([loud ? "shout" : "flat", DUR.stop * (c === "!" && loud ? 0.5 : 1)]);
  }
  // spasi mewarisi bentuk sebelumnya (mulut tidak menutup tiap kata)
  for (let i = 0; i < out.length; i++) if (out[i][0] === null) out[i][0] = i ? out[i - 1][0] : "cat";
  return out;
}

const lineDuration = (text) => tokens(text).reduce((a, [, d]) => a + d, 0) + 0.15;

function mouthAt(text, t) {
  if (t < 0) return null;
  let acc = 0;
  for (const [m, d] of tokens(text)) { acc += d; if (t < acc) return m; }
  return t < acc + 0.15 ? "smile" : null;
}

module.exports = { lineDuration, mouthAt, tokens };
