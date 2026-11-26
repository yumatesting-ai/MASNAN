// Lokasi: JALAN KAMPUNG — jalan cor sempit, rumah tembok kusam / papan / bilik bambu, atap genteng & seng,
// teras dengan bale-bale, pagar bambu & tanaman, pohon pisang-kelapa-mangga, jemuran, tiang listrik kayu,
// ayam kampung, gapura "SELAMAT DATANG".
const P = require("../engine/props.js");

module.exports = {
  id: "kampung",
  name: "Jalan Kampung",
  camera: { cam: { x: 0.3, y: 1.45, z: 0 }, f: 1300, horizon: 0.42 },
  spots: {
    depan: { x: 0, z: 4.2 }, kiri: { x: -1.0, z: 4.8 }, kanan: { x: 1.1, z: 4.8 },
    tengah: { x: 0, z: 7.5 }, jauh: { x: 0.3, z: 13 }, pinggir_kiri: { x: -2.4, z: 6 }, pinggir_kanan: { x: 2.5, z: 6 },
  },
  build(w) {
    P.sky(w);
    P.villageRoad(w);
    // deretan rumah dengan variasi (jarak, dinding, atap, teras, pagar)
    const L = [
      { z: 2.5, wall: "plaster", teras: true, bale: true, fence: "bush" },
      { z: 10.5, wall: "plank", roof: "seng", fence: "bamboo", jemuran: true },
      { z: 19, wall: "plaster", wallColor: "#d8d8d8", teras: true },
      { z: 27, wall: "bamboo", roof: "seng", fence: "bamboo" },
      { z: 35, wall: "plaster", teras: true, fence: "bush" },
      { z: 44, wall: "plank" }, { z: 52, wall: "plaster" }, { z: 60, wall: "bamboo", roof: "seng" },
    ];
    const R = [
      { z: 5, wall: "plank", teras: true, bale: true },
      { z: 13, wall: "plaster", fence: "bamboo" },
      { z: 21.5, wall: "bamboo", roof: "seng", jemuran: true },
      { z: 30, wall: "plaster", wallColor: "#dcdcdc", teras: true, fence: "bush" },
      { z: 38, wall: "plank", roof: "seng" }, { z: 47, wall: "plaster" }, { z: 55, wall: "plank" }, { z: 63, wall: "plaster" },
    ];
    for (const h of L) P.house(w, Object.assign({ side: -1, fx: -5.8 - (h.z % 3) * 0.4, width: 6.4 }, h));
    for (const h of R) P.house(w, Object.assign({ side: 1, fx: 5.6 + (h.z % 2) * 0.5, width: 6.4 }, h));
    // pepohonan khas kampung
    P.tree(w, -3.4, 9.6, { h: 3.6, kind: "banana" });
    P.tree(w, -3.6, 17.5, { h: 7.5, kind: "palm" });
    P.tree(w, 3.6, 11.8, { h: 5.2 });
    P.tree(w, 3.4, 19.5, { h: 3.4, kind: "banana" });
    P.tree(w, -3.8, 33, { h: 5.5 });
    P.tree(w, 3.8, 36, { h: 8, kind: "palm" });
    P.tree(w, -3.5, 42, { h: 3.5, kind: "banana" });
    P.poles(w, 2.9, [3.5, 20, 37, 54], 7);
    P.bulbLamp(w, -2.9, 14);
    P.chicken(w, -2.3, 9.2);
    P.chicken(w, -2.8, 9.8, true);
    P.gapura(w, 48, "SELAMAT DATANG", "KAMPUNG SUKAMAJU RT 05");
  },
};
