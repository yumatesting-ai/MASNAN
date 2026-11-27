// Desain karakter: BU SARI (guru SD) — berkerudung, berkacamata, seragam guru khaki lengan panjang, rok gelap,
// sepatu pantofel. Sabar, tapi tatapannya bikin murid diam.
const { HIJAB, EARS } = require("../../engine/extras.js");
module.exports = {
  id: "busari",
  name: "Bu Sari",
  gender: "perempuan",
  fullName: "Sari Wulandari",
  role: "Guru SD kampung — wali kelas Bima, Rara & Nana",
  age: "dewasa (30-an)",
  personality: "sabar, tegas, penuh perhatian; satu tatapan bikin kelas hening",
  hobbies: "membaca, berkebun, memeriksa PR",
  catchphrase: "Anak-anak, PR-nya sudah dikerjakan?",
  colors: { hair: "#bdbdbd", top: "#a9a9a9", bottom: "#4a4a4a", shoe: "#2e2e2e", skin: "#efefef", accent: "#f2f2f2" },
  colorsWarna: { hair: "#5a7fb0", top: "#c8a96b", bottom: "#3a3a46", shoe: "#2a2422", skin: "#f2cba8", accent: "#ffffff" },
  hair: HIJAB,
  ears: EARS.hijab,
  ahoge: null,
  face: { glasses: true },
  top: "sweater",
  sleeves: "long",
  bottom: "pants",      // celana panjang seragam
  legwear: null,
  shoes: "dark",
  build: { armDX: 2, armRest: 2, scale: 1.2 },
  expr: { neutral: { mouth: "smile", sweat: false } },
};
