// Lokasi: POS RONDA — gardu bambu di pinggir jalan kampung: lantai bale, atap seng, kentongan,
// papan "POS KAMLING", lampu bohlam, papan catur & kopi, tiang listrik, rumah & pohon di belakang.
const P = require("../engine/props.js");
const LIFE = require("../engine/life.js");

module.exports = {
  id: "posronda",
  name: "Pos Ronda",
  camera: { cam: { x: 0.4, y: 1.45, z: -1 }, f: 1250, horizon: 0.45 },
  spots: {
    depan: { x: 0.2, z: 5 }, kiri: { x: -2.6, z: 6 }, kanan: { x: 2.8, z: 6 }, jalan: { x: -0.8, z: 2.4 },
    jalan_kanan: { x: 3.5, z: 2.6 }, samping: { x: 3.4, z: 8.4 },
    duduk_bale: { x: -1.3, z: 6.5, seat: 0.55 }, duduk_bale2: { x: 1.25, z: 6.5, seat: 0.55 },
  },
  extras: [
    // bapak menyapu halaman rumah, ibu-ibu ngobrol, anak kejar-kejaran, petani lewat
    { seed: 54, kind: "bapak", spec: "sweep{face=l}@4.4,11.8/4.8+sweep{face=r}/4.8" },
    { seed: 51, kind: "ibu", spec: "chat_a{face=r}@-5.6,12.4" },
    { seed: 55, kind: "ibu", spec: "chat_b{face=l}@-4.8,12.7" },
    { seed: 53, kind: "anak_laki", spec: "run@-5,16>4.8,16+laugh/1.2+run@4.8,16>-5,16+idle_three/1" },
    { seed: 56, kind: "anak_perempuan", spec: "run@-5,16.6>4.8,16.6+laugh/1.2+run@4.8,16.6>-5,16.6+idle_three/1", phase: 0.6 },
    { seed: 52, kind: "petani", spec: "walk@8,17>-8,17+walk@-8,17>8,17", phase: 4 },
  ],

  // benda penghalang (dicek engine/collide.js agar karakter tidak menembus benda)
  obstacles: [
    { name: "tiang bendera", x: 2.75, z: 6.3, r: 0.08 }, { name: "sepeda", x0: -3.45, x1: -2.5, z0: 7.2, z1: 7.6 },
    { name: "ember", x: -3.0, z: 9.4, r: 0.16 }, { name: "kayu bakar", x0: 3.95, x1: 4.65, z0: 6.6, z1: 7.0 },
    { name: "gardu/bale ronda", x0: -2.4, x1: 2.4, z0: 6.6, z1: 9.6 }, { name: "tiang listrik", x: -4.2, z: 2.5, r: 0.12 },
    { name: "rumah kanan", x0: 5, x1: 12, z0: 7, z1: 13 }, { name: "rumah kiri", x0: -12.5, x1: -5.5, z0: 9, z1: 15 },
    { name: "semak", x: 3.4, z: 10.4, r: 0.55 }, { name: "ayam jago", x: 3.6, z: 4.6, r: 0.22 }, { name: "ayam betina", x: 4.3, z: 5.4, r: 0.22 },
  ],
  build(w, { t = 0 } = {}) {
    P.sky(w, { clouds: [[0.3, 0.08, 1.1], [0.86, 0.13, 0.9]] });
    // jalan cor melintang di depan
    w.ground([[-30, 0, -20], [30, 0, -20], [30, 0, 3.4], [-30, 0, 3.4]], P.PAL.concrete, { stroke: false });
    for (let x = -30; x < 30; x += 3) w.line3([[x, 0.002, 0.6], [x, 0.002, 3.4]], P.PAL.crack, null, { layer: "ground", bias: -0.1, swk: 0.5 });
    w.ground([[-30, 0, 3.4], [30, 0, 3.4], [30, 0, 60], [-30, 0, 60]], P.PAL.grass, { stroke: false, bias: -0.04 });
    w.ground([[-3.2, 0.005, 5.8], [3.2, 0.005, 5.8], [3.2, 0.005, 10.4], [-3.2, 0.005, 10.4]], P.PAL.dirt, { bias: -0.2 });

    P.groundDetail(w, -5, 5, 3.6, 11, 40, 31);
    // ---- gardu ----
    const x0 = -2.4, x1 = 2.4, z0 = 6.6, z1 = 9.6, floorY = 0.55, H = 2.7;
    // tiang bambu
    for (const x of [x0, x1 - 0.14]) for (const z of [z0, z1 - 0.14]) w.box(x, 0, z, 0.14, H, 0.14, P.PAL.bambooPole);
    // lantai bale bambu
    w.box(x0, floorY - 0.1, z0, x1 - x0, 0.1, z1 - z0, P.PAL.bamboo);
    for (let k = 1; k < 16; k++) w.line3([[x0 + ((x1 - x0) * k) / 16, floorY + 0.001, z0], [x0 + ((x1 - x0) * k) / 16, floorY + 0.001, z1]], "#8f8f8f", null, { bias: -0.02, swk: 0.5 });
    // dinding belakang bilik bambu setengah tinggi
    w.face([[x0, floorY, z1 - 0.07], [x1, floorY, z1 - 0.07], [x1, floorY + 1.0, z1 - 0.07], [x0, floorY + 1.0, z1 - 0.07]], P.PAL.bamboo);
    w.texture((u, v) => [x0 + u, floorY + v, z1 - 0.08], x1 - x0, 1.0, "bamboo", { color: "#9a9a9a" });
    // balok atas + atap seng pelana
    w.box(x0 - 0.1, H, z0 - 0.1, x1 - x0 + 0.2, 0.12, 0.12, P.PAL.wood);
    w.gable(x0, H + 0.1, z0, x1 - x0, z1 - z0, 1.0, P.PAL.seng, { ridge: "x", overhang: 0.35, wall: P.PAL.bamboo, seng: true });
    // papan nama
    w.box(-1.4, H - 0.45, z0 - 0.15, 2.8, 0.42, 0.05, "#f2f2f2");
    w.text(-1.35, H - 0.42, 1.35, H - 0.06, z0 - 0.16, "POS KAMLING RT 05", { size: 0.62 });
    // kentongan tergantung di tiang depan kanan
    w.sprite(x1 - 0.05, z0 - 0.05, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy - p * 2.2})" stroke="${lc}" stroke-width="${sw}">
        <path d="M0,0 L0,${p * 0.2}"/><rect x="${-p * 0.09}" y="${p * 0.2}" width="${p * 0.18}" height="${p * 0.85}" rx="${p * 0.06}" fill="${fog("#7a7a7a")}"/>
        <path d="M${-p * 0.02},${p * 0.35} L${-p * 0.02},${p * 0.9}" stroke-width="${sw * 1.4}"/></g>`, { bias: -0.2 });
    // lampu bohlam di bawah atap
    w.sprite(0, (z0 + z1) / 2, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy - p * 2.6})" stroke="${lc}" stroke-width="${sw}">
        <path d="M0,0 L0,${p * 0.25}"/><circle cx="0" cy="${p * 0.33}" r="${p * 0.09}" fill="#ffffff"/></g>`, { bias: -2 });
    // papan catur + kopi di atas bale
    w.box(-0.9, floorY, 7.6, 0.5, 0.04, 0.5, "#e8e8e8");
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) w.ground([[-0.9 + i * 0.125, floorY + 0.045, 7.6 + j * 0.125], [-0.9 + (i + 1) * 0.125, floorY + 0.045, 7.6 + j * 0.125], [-0.9 + (i + 1) * 0.125, floorY + 0.045, 7.6 + (j + 1) * 0.125], [-0.9 + i * 0.125, floorY + 0.045, 7.6 + (j + 1) * 0.125]], "#5a5a5a", { stroke: false, layer: "obj", bias: -0.3 });
    P.glassOfCoffee(w, 0.2, floorY, 7.5);
    P.glassOfCoffee(w, 0.5, floorY, 7.7);
    // sandal di depan bale
    for (const [x, z] of [[-1.6, 6.1], [-1.3, 6.15], [0.9, 6.0], [1.2, 6.05]]) w.ground([[x, 0.01, z], [x + 0.26, 0.01, z], [x + 0.26, 0.01, z + 0.11], [x, 0.01, z + 0.11]], "#5a5a5a", { bias: -0.5 });

    // latar: tiang listrik, rumah, pohon
    P.poles(w, -4.2, [2.5, 26], 7);
    P.house(w, { side: 1, fx: 5, z: 7, width: 6, wall: "plank", roof: "seng", jemuran: false });
    P.house(w, { side: -1, fx: -5.5, z: 9, width: 6, wall: "bamboo" });
    for (const [x, z, h, kind] of [[-7, 18, 6, "round"], [2.5, 20, 8, "palm"], [-3.5, 22, 3.8, "banana"], [8, 24, 5.5, "round"]]) P.tree(w, x, z, { h, kind });
    P.bush(w, 3.4, 10.4, 0.6);
    P.chicken(w, 3.6, 4.6, { t, kind: "jago", flip: true });
    P.chicken(w, 4.3, 5.4, { t, kind: "betina", phase: 1.6 });

    // ---- kehidupan ----
    LIFE.cat(w, 0.05, 7.7, { mode: "sleep", y: 0.56, color: "#9a9a9a", stripe: "#5a5a5a" });   // kucing tidur di bale
    LIFE.ducks(w, [[2.6, 1.6], [7.5, 1.9]], { n: 3 });
    LIFE.flag(w, 2.75, 6.3, { h: 3.6 });
    LIFE.smoke(w, 8.5, 10, { y: 3.4 });
    LIFE.butterfly(w, 3.2, 10, { y: 0.9 });
    LIFE.kite(w, -5, 40, { y: 17 });
    LIFE.bike(w, -2.85, 7.4, { flip: true }); LIFE.bucket(w, -3.0, 9.4); LIFE.firewood(w, 4.3, 6.6);
  },
};
