// Lokasi: SEKOLAH (SD Negeri Sukamaju) — halaman upacara berpaving, tiang bendera merah-putih, gedung kelas
// memanjang beratap genteng dengan jendela & pintu, papan nama sekolah, pagar & gerbang, pohon ketapang,
// bangku, tong sampah, sepeda murid, murid-murid (figuran) bermain.
const P = require("../engine/props.js");
const LIFE = require("../engine/life.js");
const c = LIFE.col;

module.exports = {
  id: "sekolah",
  name: "SD Sukamaju",
  camera: { cam: { x: 0, y: 1.5, z: 2.6 }, f: 1050, horizon: 0.46 }, // kamera di dalam gerbang
  cameraPortrait: { cam: { x: 0, y: 1.6, z: 1.2 }, f: 1150, horizon: 0.42 },
  spots: {
    depan: { x: 0, z: 6.2 }, kiri: { x: -1.8, z: 6.8 }, kanan: { x: 1.8, z: 6.8 }, tengah: { x: 0, z: 8.4 },
    tiang_bendera: { x: -2.4, z: 8.6 }, pintu_kelas: { x: 1.6, z: 11.3 }, gerbang: { x: 0, z: 2.9 },
    duduk_bangku: { x: 3.9, z: 8.75, seat: 0.45 }, duduk_bangku2: { x: 4.7, z: 8.75, seat: 0.45 },
  },
  extras: [
    { seed: 61, kind: "anak_laki", spec: "run@-5.6,10.4>-3.4,10.4+laugh/1.2+run@-3.4,10.4>-5.6,10.4+idle_three/1" },
    { seed: 62, kind: "anak_perempuan", spec: "run@-5.6,11.0>-3.4,11.0+laugh/1.2+run@-3.4,11.0>-5.6,11.0+idle_three/1", phase: 0.5 },
    { seed: 63, kind: "anak_perempuan", spec: "chat_a{face=r}@5.4,10.6" },
    { seed: 64, kind: "anak_laki", spec: "chat_b{face=l}@6.2,10.9" },
    { seed: 65, kind: "anak_laki", spec: "walk@7.8,7.0>2.6,7.0+idle/2+walk@2.6,7.0>7.8,7.0" },
  ],
  obstacles: [
    { name: "tiang bendera", x: -2.4, z: 9.2, r: 0.12 }, { name: "gedung kelas", x0: -9, x1: 9, z0: 12.0, z1: 18 },
    { name: "bangku", x0: 3.5, x1: 5.3, z0: 8.8, z1: 9.25 }, { name: "pohon ketapang", x: -6.2, z: 8.5, r: 0.4 },
    { name: "tong sampah", x: 6.2, z: 7.6, r: 0.24 }, { name: "sepeda", x0: -8.4, x1: -6.8, z0: 11.2, z1: 11.6 },
    { name: "pagar kiri", x0: -10, x1: -1.4, z0: 2.0, z1: 2.2 }, { name: "pagar kanan", x0: 1.4, x1: 10, z0: 2.0, z1: 2.2 },
  ],
  build(w, { t = 0 } = {}) {
    P.sky(w, { clouds: [[0.2, 0.09, 1], [0.75, 0.06, 1.2]] });
    w.ground([[-30, 0, -20], [30, 0, -20], [30, 0, 60], [-30, 0, 60]], P.PAL.grass, { stroke: false });
    // jalan depan & halaman paving (pola kotak)
    w.ground([[-30, 0.001, -20], [30, 0.001, -20], [30, 0.001, 1.8], [-30, 0.001, 1.8]], P.PAL.concrete, { stroke: false, bias: -0.1 });
    w.ground([[-8.5, 0.002, 2.2], [8.5, 0.002, 2.2], [8.5, 0.002, 12], [-8.5, 0.002, 12]], c("#d9cfc0"), { stroke: false, bias: -0.15 });
    for (let x = -8; x <= 8; x += 1) w.line3([[x, 0.003, 2.2], [x, 0.003, 12]], c("#bdb2a2"), null, { layer: "ground", bias: -0.2, swk: 0.4 });
    for (let z = 3; z <= 12; z += 1) w.line3([[-8.5, 0.003, z], [8.5, 0.003, z]], c("#bdb2a2"), null, { layer: "ground", bias: -0.2, swk: 0.4 });
    // gedung kelas memanjang: lantai teras, dinding, jendela, pintu, atap genteng
    const z0 = 12, H = 3.0;
    w.box(-9, 0, z0, 18, 0.35, 6, c("#bfb3a3"));
    w.box(-9, 0.35, z0 + 1.5, 18, H - 0.35, 4.5, c("#f3e7cf"));
    w.box(-9, 0.35, z0 + 1.5, 18, 0.9, 0.04, c("#7a9a6e"), { bias: -0.02 }); // lis bawah hijau
    for (let k = 0; k < 4; k++) {
      const x = -8 + k * 4.5;
      w.face([[x + 0.3, 1.2, z0 + 1.48], [x + 1.6, 1.2, z0 + 1.48], [x + 1.6, 2.4, z0 + 1.48], [x + 0.3, 2.4, z0 + 1.48]], c("#a8d0e2"), { swk: 0.8, bias: -0.05 });
      w.line3([[x + 0.95, 1.2, z0 + 1.47], [x + 0.95, 2.4, z0 + 1.47]], c("#ffffff"), null, { bias: -0.06, swk: 1.2 });
      w.face([[x + 2.4, 0.35, z0 + 1.48], [x + 3.4, 0.35, z0 + 1.48], [x + 3.4, 2.45, z0 + 1.48], [x + 2.4, 2.45, z0 + 1.48]], c("#8a5a34"), { swk: 0.8, bias: -0.05 });
      w.text(x + 2.35, 2.55, x + 3.45, 2.85, z0 + 1.47, `KELAS ${k + 3}`, { size: 0.55, bias: -0.06 });
    }
    // tiang teras + atap emperan
    for (let x = -9; x <= 9; x += 3) w.box(x - 0.08, 0.35, z0 + 0.1, 0.16, H - 0.35, 0.16, c("#f4f4f4"));
    w.face([[-9.5, H, z0 + 1.5], [9.5, H, z0 + 1.5], [9.5, H - 0.4, z0 - 0.3], [-9.5, H - 0.4, z0 - 0.3]], c("#b9573a"), { swk: 0.8 });
    w.gable(-9, H, z0 + 1.5, 18, 4.5, 1.8, c("#b9573a"), { ridge: "x", overhang: 0.5, wall: c("#f3e7cf"), tiles: 10 });
    // papan nama sekolah
    w.box(-3.2, 3.15, z0 - 0.35, 6.4, 0.9, 0.08, c("#2f6b4f"));
    w.text(-3.1, 3.55, 3.1, 4.0, z0 - 0.36, "SD NEGERI 1 SUKAMAJU", { size: 0.62, color: "#ffffff" });
    w.text(-3.1, 3.2, 3.1, 3.5, z0 - 0.36, "KEC. SUKAMAJU — RT 05", { size: 0.5, color: "#e8e8e8" });
    // tiang bendera + bendera berkibar + dasar
    w.box(-2.9, 0, 8.7, 1.0, 0.3, 1.0, c("#bdb2a2"));
    LIFE.flag(w, -2.4, 9.2, { h: 6.5 });
    // pagar & gerbang
    for (const [a, b] of [[-10, -1.4], [1.4, 10]]) {
      w.box(a, 0, 2.0, b - a, 0.5, 0.2, c("#e8e0d4"));
      for (let x = a + 0.3; x < b; x += 0.45) w.box(x, 0.5, 2.05, 0.06, 0.9, 0.06, c("#2f6b4f"), { swk: 0.5 });
      w.box(a, 1.35, 2.05, b - a, 0.06, 0.06, c("#2f6b4f"), { swk: 0.5 });
    }
    for (const x of [-1.6, 1.4]) w.box(x, 0, 1.95, 0.3, 2.0, 0.3, c("#e8e0d4"));
    // pohon ketapang, semak, bangku, tong sampah, sepeda
    P.tree(w, -6.2, 8.5, { h: 6.5 }); P.tree(w, 7.5, 19, { h: 7, kind: "palm" }); P.tree(w, -10, 20, { h: 6 });
    P.bush(w, -8, 11.4, 0.6); P.bush(w, 8, 11.4, 0.6);
    P.bench(w, 3.5, 8.8, 1.8, { color: c("#8d5f3c") });
    LIFE.trashBin(w, 6.2, 7.6); LIFE.bike(w, -7.6, 11.4, { flip: true });
    LIFE.butterfly(w, -5.8, 10.5, { y: 1.1 }); LIFE.kite(w, 4, 40, { y: 18 });
    LIFE.perchBirds(w, 0, z0 + 1.0, { y: H + 0.05, n: 4, len: 6 });
  },
};
