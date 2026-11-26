// Tema warna global. Default: abu-abu (gaya asli). Mode warna: jalankan alat dengan WARNA=1, mis.
//   WARNA=1 node tools/location.js --loc warung --png out/warung.png
// Tokoh memakai `colorsWarna` di design.js (bila ada); lingkungan memakai PAL_WARNA di props.js.
const COLOR = process.env.WARNA === "1";
module.exports = {
  COLOR,
  fogColor: COLOR ? "#dbe8ef" : "#dedede",
  // warna wajah (mode warna): pipi merona, mulut & lidah
  face: COLOR ? { blush: "#f3a3a3", mouthIn: "#7a2f35", tongue: "#e9848c" } : { blush: "#cfcfcf", mouthIn: "#3a3a3a", tongue: "#9a9a9a" },
};
