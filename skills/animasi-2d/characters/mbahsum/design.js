// Desain karakter: MBAH SUM (nenek) — rambut putih dicepol, berkacamata, kebaya lengan panjang, kain jarik,
// sandal. Paling tua, lucu, suka cerita "zaman dulu".
const A = require("../atin/design.js");
module.exports = {
  id: "mbahsum",
  name: "Mbah Sum",
  gender: "perempuan",
  fullName: "Sumiyati",
  role: "Nenek paling sepuh di RT 05 — penjual jamu, sumber cerita zaman dulu",
  age: "lansia (70-an)",
  personality: "kalem, jenaka, sering salah dengar, tapi paling bijak",
  hobbies: "meracik jamu, mengunyah sirih, cerita zaman dulu",
  catchphrase: "Zaman Mbah dulu ya, Nak...",
  colors: { hair: "#e6e6e6", top: "#c9c9c9", bottom: "#6a6a6a", shoe: "#5a5a5a", skin: "#efefef", accent: "#f2f2f2" },
  colorsWarna: { hair: "#eeeeea", top: "#5f8a6e", bottom: "#7a4e2e", shoe: "#5a3b2a", skin: "#dcae86", accent: "#e8d9b0" },
  hair: A.hair,
  ears: A.ears,
  ahoge: null,
  face: { glasses: true },
  accessory: A.accessory,
  top: "sweater",       // kebaya lengan panjang
  sleeves: "long",
  bottom: "sarong",     // kain jarik
  legwear: null,
  shoes: "sandal",
  build: { armDX: 6, armRest: 4, scale: 1.1 }, // nenek: lebih pendek dari orang dewasa lain
  expr: { neutral: { eyes: "half", mouth: "smile", blush: 0.2, sweat: false } },
};
