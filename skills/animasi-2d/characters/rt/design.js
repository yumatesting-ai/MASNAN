// Desain karakter: PAK RT (Pak Darto, laki-laki dewasa) — ketua RT 05: peci hitam, kumis, kemeja batik coklat,
// celana panjang, sepatu. Berwibawa tapi gampang panik.
const { PECI } = require("../../engine/extras.js");
const H = require("../hasan/design.js").hair; // kepala di balik peci: sisa rambut di samping (seperti Pak Hasan)
module.exports = {
  id: "rt",
  name: "Pak RT",
  gender: "laki-laki",
  fullName: "Sudarto",
  role: "Ketua RT 05 — tukang pengumuman, penengah semua masalah warga",
  age: "dewasa (50-an)",
  personality: "berwibawa, suka pidato panjang, sok tegas tapi gampang panik",
  hobbies: "rapat warga, kerja bakti, pengumuman lewat toa masjid",
  catchphrase: "Bapak-bapak, ibu-ibu, mohon perhatiannya!",
  colors: { hair: "#5a5a5a", top: "#9a9a9a", bottom: "#4a4a4a", shoe: "#2e2e2e", skin: "#efefef", accent: "#d0d0d0" },
  colorsWarna: { hair: "#3a3a3a", top: "#8a5a2b", bottom: "#3a3a46", shoe: "#2a2422", skin: "#e2b289", accent: "#e8c27a" },
  hair: H,
  ears: { front: ["l", "r"], side: true, back: ["l", "r"] },
  ahoge: null,
  face: { mustache: true },
  accessory: { front: PECI.front, side: PECI.side, back: PECI.back },
  top: "tee",
  sleeves: "short",
  bottom: "pants",
  legwear: null,
  shoes: "dark",
  build: { armDX: 8, armRest: 6, scale: 1.3 }, // dewasa paling tinggi
  expr: { neutral: { mouth: "flat", sweat: false } },
};
