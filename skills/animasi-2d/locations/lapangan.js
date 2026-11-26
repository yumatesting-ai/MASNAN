// Lapangan bola kampung: tanah berumput tidak rata, gawang bambu tanpa jaring, sandal sebagai tanda,
// pagar bambu, pohon pisang/kelapa, rumah kampung di belakang, masjid beratap tumpang di kejauhan.
const P = require("../engine/props.js");
const LIFE = require("../engine/life.js");
const WARNA = require("../engine/theme.js").COLOR;
const FIELD = WARNA ? { grass: "#8fc067", bare: "#d9c49c", bare2: "#d4bd92" } : { grass: "#a4a4a4", bare: "#cbcbcb", bare2: "#cdcdcd" };
const { createMatch } = require("../engine/football.js");
const MATCH = createMatch({
  seed: 7, homes: [[-5, 11], [-2, 13.5], [1.5, 11], [4.5, 14], [6.5, 11.5], [-6.5, 14.5]],
  bounds: { x0: -8, x1: 8, z0: 10, z1: 16 }, goals: [{ x: -9.4, z: 13 }, { x: 9.4, z: 13 }],
});

module.exports = {
  id: "lapangan",
  name: "Lapangan Bola",
  camera: { cam: { x: 0, y: 1.7, z: 0 }, f: 1050, horizon: 0.4 },
  spots: {
    tengah: { x: 0, z: 9 }, kiri: { x: -3.5, z: 7.5 }, kanan: { x: 3.5, z: 7.5 }, pinggir: { x: -1.5, z: 4.8 },
    gawang_kiri: { x: -7.5, z: 13 }, gawang_kanan: { x: 7.5, z: 13 }, jauh: { x: 1, z: 18 },
    duduk_pinggir: { x: -5.2, z: 6.2, seat: 0.48 }, duduk_pinggir2: { x: -6.2, z: 6.2, seat: 0.48 },
  },
  // figuran: anak-anak MAIN BOLA sungguhan (oper, giring, tendang, kejar bola, sesekali tembak ke gawang & sorak),
  // ditambah penonton di pinggir yang mengobrol / bersorak.
  extras: [
    ...[[31, "anak_laki"], [32, "anak_laki"], [33, "anak_perempuan"], [34, "anak_laki"], [38, "anak_laki"], [39, "anak_laki"]].map(([seed, kind], i) => ({ seed, kind, motion: (t) => MATCH.player(i, t) })),
    { seed: 35, kind: "anak_perempuan", spec: "idle_three{face=r}@-10.2,24+cheer/1.2+idle_three/3" },
    { seed: 36, kind: "ibu", spec: "chat_a{face=r}@9.8,25" },
    { seed: 37, kind: "bapak", spec: "chat_b{face=l}@10.7,25.3" },
  ],
  // benda penghalang (dicek engine/collide.js agar karakter tidak menembus benda)
  obstacles: [
    { name: "sepeda", x0: -8.4, x1: -6.8, z0: 5.2, z1: 5.6 }, { name: "ember", x: -4.2, z: 5.7, r: 0.16 },
    { name: "bangku pinggir lapangan", x0: -6.8, x1: -4.6, z0: 6.0, z1: 6.42 },
    { name: "tiang gawang kiri", x: -9.6, z: 11.3, r: 0.1 }, { name: "tiang gawang kiri 2", x: -9.6, z: 14.7, r: 0.1 },
    { name: "tiang gawang kanan", x: 9.6, z: 11.3, r: 0.1 }, { name: "tiang gawang kanan 2", x: 9.6, z: 14.7, r: 0.1 },
    { name: "pohon", x: -15, z: 12, r: 0.35 }, { name: "pagar bambu", x0: -26, x1: 26, z0: 33.9, z1: 34.1 },
  ],
  build(w, { t = 0, extras = true } = {}) {
    P.sky(w, { groundColor: P.PAL.dirt });
    const X0 = -12, X1 = 12, Z0 = 3.5, Z1 = 32;
    // rumput belang (bekas potong)
    P.strip(w, X0, X1, Z0, Z1, FIELD.grass);
    // petak tanah gundul tidak beraturan
    for (const [cx, cz, r] of [[-4, 9, 2.2], [3, 13, 2.8], [0, 18, 2.4], [-7, 22, 2], [6, 25, 2.5], [-1, 6, 1.6]]) {
      const pts = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([cx + r * Math.cos(a) * (1 + 0.25 * Math.sin(a * 3)), 0.002, cz + r * 0.7 * Math.sin(a)]); }
      w.ground(pts, FIELD.bare, { stroke: false, bias: -0.1 });
    }
    for (let k = 0; k < 18; k++) P.grassTuft(w, -11 + ((k * 37) % 22), 5 + ((k * 13) % 20));
    // tanah di depan & tanah botak dekat gawang
    w.ground([[-30, 0, -20], [30, 0, -20], [30, 0, Z0], [-30, 0, Z0]], P.PAL.dirt, { stroke: false });
    for (const s of [-1, 1]) w.ground([[s * 9.8, 0.003, 10], [s * 7.6, 0.003, 9.3], [s * 7.2, 0.003, 15], [s * 9.8, 0.003, 16]], FIELD.bare2, { stroke: false, bias: -0.2 });
    // gawang bambu tanpa jaring di kedua sisi
    for (const sgn of [-1, 1]) {
      const gx = sgn * 9.6, zA = 11.3, zB = 14.7, gh = 1.9;
      w.box(gx - 0.07, 0, zA, 0.14, gh, 0.14, P.PAL.bambooPole);
      w.box(gx - 0.07, 0, zB, 0.14, gh, 0.14, P.PAL.bambooPole);
      w.box(gx - 0.06, gh - 0.05, zA - 0.1, 0.12, 0.12, zB - zA + 0.35, P.PAL.bambooPole);
      for (const z of [zA, zB]) w.line3([[gx, gh - 0.2, z - 0.05], [gx, gh + 0.05, z + 0.2]], "#555555", null, { bias: -0.1 }); // ikatan tali
    }
    // bola yang sedang dimainkan figuran
    if (extras !== false) { const b = MATCH.ball(t); P.ball(w, b.x, b.z, { y: b.y, spin: b.spin }); } // tanpa figuran = tanpa bola pertandingan
    P.groundDetail(w, -11, 11, 3.6, 14, 40, 51);
    // sandal sebagai tanda (khas lapangan kampung)
    for (const [x, z] of [[-1.2, 4.2], [-0.8, 4.3], [4.8, 4.1], [5.2, 4.2], [-6, 9.2], [-6, 10.4]]) w.ground([[x, 0.01, z], [x + 0.28, 0.01, z], [x + 0.28, 0.01, z + 0.12], [x, 0.01, z + 0.12]], "#5a5a5a", { bias: -0.5 });
    // pagar bambu di belakang
    const fz = 34;
    w.box(-26, 0.9, fz, 52, 0.1, 0.1, "#9e9e9e");
    w.box(-26, 0.4, fz, 52, 0.1, 0.1, "#9e9e9e");
    for (let x = -26; x <= 26; x += 1.6) w.box(x, 0, fz - 0.05, 0.12, 1.3, 0.12, "#a9a9a9");
    // pohon & rumah di belakang pagar
    for (const [x, z, h] of [[-14, 38, 6], [-6, 40, 5.5], [3, 39, 6.5], [11, 37, 5.8], [17, 41, 6]]) P.tree(w, x, z, { h });
    P.tree(w, -15, 12, { h: 6.5 });
    P.bench(w, -6.8, 6.0, 2.2); // bangku kayu di pinggir lapangan
    P.tree(w, 15.5, 9, { h: 5.8, kind: "palm" });
    for (const [x, wall, seng] of [[-20, P.PAL.plank, true], [-10, P.PAL.wallB, false], [8, P.PAL.bamboo, true], [18, P.PAL.wallA, false]]) {
      w.box(x - 3.5, 0, 46, 7, 2.8, 6, wall);
      w.gable(x - 3.5, 2.8, 46, 7, 6, 1.7, seng ? P.PAL.seng : P.PAL.roof, { ridge: "x", wall, tiles: seng ? 0 : 4, seng });
    }
    P.tree(w, -13, 30, { h: 3.6, kind: "banana" });
    P.tree(w, 13.5, 32, { h: 3.4, kind: "banana" });
    // masjid kecil di kejauhan
    w.box(-1.5, 0, 70, 9, 4, 8, "#e6e6e6");
    w.hip(-1.5, 4, 70, 9, 8, 2.4, P.PAL.roof, { overhang: 0.8, top: 3.2 });
    w.box(1.4, 6.4, 72.4, 3.2, 1.0, 3.2, "#e0e0e0");
    w.hip(1.4, 7.4, 72.4, 3.2, 3.2, 2.0, P.PAL.roof, { overhang: 0.5 });

    // ---- kehidupan ----
    LIFE.kite(w, -4, 42, { y: 16 }); LIFE.kite(w, 6, 50, { y: 21, phase: 2, color: "#3a9a5a", color2: "#f4d23c" });
    LIFE.cyclist(w, [-12, 36], [12, 36], { period: 22 });
    LIFE.smoke(w, -10, 49, { y: 3.4 });
    LIFE.butterfly(w, -5.6, 5.4, { y: 0.8 });
    LIFE.perchBirds(w, -9.6, 13, { y: 1.97, n: 3, len: 2.6, axis: "z" });     // burung di mistar gawang
    LIFE.bike(w, -7.6, 5.4); LIFE.bucket(w, -4.2, 5.7, { color: "#d84a4a" });
  },
};
