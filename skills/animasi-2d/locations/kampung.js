// Lokasi: JALAN KAMPUNG — jalan cor sempit, rumah tembok kusam / papan / bilik bambu, atap genteng & seng,
// teras dengan bale-bale, pagar bambu & tanaman, pohon pisang-kelapa-mangga, jemuran, tiang listrik kayu,
// ayam kampung, gapura "SELAMAT DATANG".
const P = require("../engine/props.js");
const LIFE = require("../engine/life.js");

module.exports = {
  id: "kampung",
  name: "Jalan Kampung",
  camera: { cam: { x: 0.3, y: 1.45, z: 0 }, f: 1300, horizon: 0.42 },
  spots: {
    depan: { x: 0, z: 4.2 }, kiri: { x: -1.0, z: 4.8 }, kanan: { x: 1.1, z: 4.8 },
    tengah: { x: 0, z: 7.5 }, jauh: { x: 0.3, z: 13 }, pinggir_kiri: { x: -2.4, z: 6 }, pinggir_kanan: { x: 2.5, z: 6 },
    duduk_bangku: { x: -2.55, z: 7.8, seat: 0.48 }, duduk_bangku2: { x: -3.4, z: 7.8, seat: 0.48 },
  },
  // figuran (karakter latar): { seed, kind, spec (rangkaian aksi, diulang), flip?, phase? }
  extras: [
    // ibu menyapu halaman (berganti arah sapuan), dua ibu ngobrol di depan rumah
    { seed: 11, kind: "ibu", spec: "sweep{face=l}@4.2,14.6/4.8+sweep{face=r}/4.8" },
    { seed: 15, kind: "ibu", spec: "chat_a{face=r}@-4.6,13.2" },
    { seed: 16, kind: "ibu", spec: "chat_b{face=l}@-3.8,13.5" },
    // kakek membaca koran di bangku depan rumah
    { seed: 12, kind: "kakek", spec: "sit_read{seat=0.48}@3.9,22.45" },
    // dua anak kejar-kejaran menyeberang jalan
    { seed: 13, kind: "anak_laki", spec: "run@-2.6,20>2.4,20+laugh/1.2+run@2.4,20>-2.6,20+idle_three/1" },
    { seed: 14, kind: "anak_perempuan", spec: "run@-2.6,20.6>2.4,20.6+laugh/1.2+run@2.4,20.6>-2.6,20.6+idle_three/1", phase: 0.55 },
    // orang lewat: bapak pulang dari jauh lalu kembali, petani menyeberang di kejauhan
    { seed: 18, kind: "bapak", spec: "walk@0.9,30>0.9,12+look_around/3+walk@0.9,12>0.9,30" },
    { seed: 17, kind: "petani", spec: "walk@-5.2,34>5,34+walk@5,34>-5.2,34", phase: 3 },
  ],

  // benda penghalang (dicek engine/collide.js agar karakter tidak menembus benda)
  obstacles: [
    { name: "tiang bendera", x: -3.0, z: 11.4, r: 0.08 }, { name: "sepeda bersandar", x0: -5.85, x1: -4.25, z0: 9.4, z1: 9.8 },
    { name: "ember", x: -4.9, z: 11.0, r: 0.16 }, { name: "gentong", x: -4.9, z: 4.2, r: 0.25 }, { name: "tong sampah", x: 3.3, z: 5.6, r: 0.24 },
    { name: "karung", x: 4.9, z: 8.4, r: 0.25 }, { name: "kayu bakar", x0: 4.45, x1: 5.15, z0: 9.1, z1: 9.5 },
    { name: "bangku pinggir jalan", x0: -4.0, x1: -2.0, z0: 7.6, z1: 8.02 }, { name: "bangku kakek", x0: 3.2, x1: 4.8, z0: 22.5, z1: 22.92 },
    { name: "pohon pisang", x: -3.4, z: 9.6, r: 0.3 }, { name: "pohon kelapa", x: -3.6, z: 17.5, r: 0.25 }, { name: "pohon mangga", x: 3.6, z: 11.8, r: 0.35 },
    { name: "pohon pisang 2", x: 3.4, z: 19.5, r: 0.3 }, { name: "pohon", x: -3.8, z: 33, r: 0.35 }, { name: "pohon kelapa 2", x: 3.8, z: 36, r: 0.25 },
    { name: "tiang listrik", x: 2.9, z: 3.5, r: 0.12 }, { name: "tiang listrik 2", x: 2.9, z: 20, r: 0.12 }, { name: "tiang lampu", x: -2.9, z: 14, r: 0.1 },
    { name: "ayam jago", x: -2.3, z: 9.2, r: 0.22 }, { name: "ayam betina", x: -2.9, z: 10.2, r: 0.22 }, { name: "ayam betina 2", x: -3.3, z: 9.0, r: 0.22 },
    { name: "rumah kiri", x0: -14, x1: -5.8, z0: 0, z1: 70 }, { name: "rumah kanan", x0: 5.6, x1: 14, z0: 0, z1: 70 },
  ],
  build(w, { t = 0, opts = {} } = {}) {
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
    if (opts.clearRight) R[0] = Object.assign({}, R[0], { teras: false, bale: false }); // ruang kamera di sisi kanan depan
    for (const h of R) P.house(w, Object.assign({ side: 1, fx: 5.6 + (h.z % 2) * 0.5, width: 6.4 }, h));
    // pepohonan khas kampung
    P.tree(w, -3.4, 9.6, { h: 3.6, kind: "banana" });
    P.tree(w, -3.6, 17.5, { h: 7.5, kind: "palm" });
    P.tree(w, 3.6, 11.8, { h: 5.2 });
    P.tree(w, 3.4, 19.5, { h: 3.4, kind: "banana" });
    P.tree(w, -3.8, 33, { h: 5.5 });
    P.tree(w, 3.8, 36, { h: 8, kind: "palm" });
    P.tree(w, -3.5, 42, { h: 3.5, kind: "banana" });
    if (opts.poles !== false) P.poles(w, 2.9, [3.5, 20, 37, 54], 7);
    P.bulbLamp(w, -2.9, 14);
    P.bench(w, -4.0, 7.6, 2.0); // bangku kayu di pinggir jalan
    P.bench(w, 3.2, 22.5, 1.6); // bangku depan rumah (kakek baca koran)
    P.chicken(w, -2.3, 9.2, { t, kind: "jago" });
    P.chicken(w, -2.9, 10.2, { t, kind: "betina", flip: true, phase: 1.3 });
    P.chicken(w, -3.3, 9.0, { t, kind: "betina", phase: 2.2 });
    P.gapura(w, 48, "SELAMAT DATANG", "KAMPUNG SUKAMAJU RT 05");

    // ---- kehidupan: hewan, benda bergerak, benda kampung ----
    LIFE.cat(w, -3.0, 7.82, { mode: "sleep", y: 0.49 });                       // kucing tidur di bangku
    LIFE.cat(w, -4.7, 15.2, { mode: "walk", to: [-4.7, 19.0], color: "#f4f1ea", stripe: "#3a3a3a" });
    LIFE.ducks(w, [[-2.3, 25.2], [-0.2, 25.8]], { n: 4 });                      // bebek menyeberang jalan
    LIFE.butterfly(w, -2.5, 6.3, { y: 0.9 }); LIFE.butterfly(w, 2.4, 9.5, { y: 1.1, phase: 2, color: "#f7f3e8", color2: "#5a8ad0" });
    LIFE.kite(w, 7, 45, { y: 17 }); LIFE.kite(w, -9, 60, { y: 22, phase: 3, color: "#3a7fd0", color2: "#ffffff" });
    LIFE.flag(w, -3.0, 11.4, { h: 4 });
    LIFE.smoke(w, -9, 21, { y: 3.4 }); LIFE.smoke(w, 8.5, 15, { y: 3.6, phase: 1.3 });
    LIFE.leaves(w, 3.6, 11.8, { y: 4, spread: 2 });
    if (opts.poles !== false) LIFE.perchBirds(w, 2.9, 11, { y: 6.45, n: 4, len: 2.4, axis: "z" });     // burung di kabel listrik
    LIFE.cyclist(w, [-3.5, 30.6], [3.5, 30.6], { period: 14 });     // anak bersepeda bolak-balik di jalan
    LIFE.cart(w, [-3.2, 38], [3.2, 38], { period: 30, phase: 8 });
    LIFE.bike(w, -5.05, 9.6, { flip: true }); LIFE.bucket(w, -4.9, 11.0); LIFE.waterJar(w, -4.9, 4.2);
    LIFE.trashBin(w, 3.3, 5.6); LIFE.sack(w, 4.9, 8.4); LIFE.firewood(w, 4.8, 9.1);
  },
};
