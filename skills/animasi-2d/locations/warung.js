// Lokasi: WARKOP BU ATIN — warung kopi kampung sederhana: kios papan kayu kecil beratap seng (ditopang tiang kayu),
// spanduk kain "WARKOP", meja jualan kayu (toples kerupuk, termos, gelas kopi, piring gorengan), kompor + ceret,
// renceng kopi yang bergoyang, rak kecil & kalender di dinding, bangku panjang pelanggan, meja + bangku di bawah pohon,
// kursi plastik, galon & tabung gas. (Unsur referensi kreator: atap seng, renceng, toples, bangku kayu, pohon besar.)
const P = require("../engine/props.js");

module.exports = {
  id: "warung",
  name: "Warkop Bu Atin",
  camera: { cam: { x: 0.5, y: 1.45, z: 1.2 }, f: 1150, horizon: 0.47 },
  spots: {
    balik_etalase: { x: 0.75, z: 9.15, y: 0.15 }, // penjual di balik meja (lantai sedikit lebih tinggi)
    depan: { x: 1.3, z: 6.0 }, bangku: { x: -0.7, z: 6.3 }, meja: { x: -2.0, z: 5.8 },
    duduk_meja: { x: -2.85, z: 7.28, seat: 0.48 },        // bangku di belakang meja (menghadap kamera)
    duduk_depan_meja: { x: -0.35, z: 7.1, seat: 0.48 },   // bangku depan meja jualan (membelakangi kamera)
    duduk_depan_meja2: { x: 0.2, z: 7.1, seat: 0.48 },
    pesan: { x: 0.95, z: 7.95 },                          // berdiri di depan meja jualan untuk memesan (hadap Bu Atin)
    // titik belok agar jalan tidak menembus meja/bangku/tiang
    belok_masuk: { x: 0.9, z: 6.6 }, belok_meja: { x: -1.55, z: 6.3 }, celah_meja: { x: -1.85, z: 7.22 },
    jalan_kiri: { x: -2.4, z: 4.2 }, jalan_kanan: { x: 3.0, z: 4.4 }, samping: { x: 3.4, z: 7.6 },
  },
  extras: [
    // pelanggan: duduk membelakangi kamera di bangku depan meja jualan, bapak main HP di kursi plastik
    { seed: 21, kind: "pemuda", spec: "sit_back@-1.1,7.1" },
    { seed: 22, kind: "bapak", spec: "sit_phone@2.75,6.85" },
    // tetangga menyapu halaman, dua bapak ngobrol di depan rumah seberang
    { seed: 25, kind: "ibu", spec: "sweep{face=r}@-3.4,12.2/4.8+sweep{face=l}/4.8" },
    { seed: 26, kind: "bapak", spec: "chat_a{face=r}@3.7,11.2" },
    { seed: 27, kind: "kakek", spec: "chat_b{face=l}@4.5,11.5" },
    // orang lewat di jalan belakang
    { seed: 23, kind: "pemudi", spec: "walk@-8,14.5>8,14.5+walk@8,14.5>-8,14.5" },
  ],

  seatsExtra: true,
  build(w, { t = 0 } = {}) {
    P.sky(w, { clouds: [[0.22, 0.08, 1], [0.8, 0.12, 0.9]] });
    w.ground([[-30, 0, -20], [30, 0, -20], [30, 0, 60], [-30, 0, 60]], P.PAL.dirt, { stroke: false });
    w.ground([[-30, 0.002, -20], [30, 0.002, -20], [30, 0.002, 3.0], [-30, 0.002, 3.0]], P.PAL.concrete, { stroke: false, bias: -0.1 }); // jalan cor
    for (let x = -30; x < 30; x += 3) w.line3([[x, 0.003, 0.6], [x, 0.003, 3.0]], P.PAL.crack, null, { layer: "ground", bias: -0.2, swk: 0.5 });
    P.groundDetail(w, -5, 5, 3.2, 9, 46, 21);
    for (let k = 0; k < 12; k++) P.grassTuft(w, -4.5 + ((k * 37) % 10), 3.3 + ((k * 13) % 5) * 0.8);

    // ---- latar kampung ----
    P.house(w, { side: -1, fx: -5.5, z: 10, width: 6, wall: "plaster", wallColor: "#d8d8d8" });
    P.house(w, { side: 1, fx: 5.2, z: 9, width: 6, wall: "plank", roof: "seng" });
    P.bambooFence(w, 4.0, 4.5, 8.8);
    P.tree(w, 7, 20, { h: 8, kind: "palm" });
    P.tree(w, -2.5, 16, { h: 3.6, kind: "banana" });

    // ---- kios papan kecil ----
    const xL = -1.8, xR = 1.8, zF = 8.6, zB = 10.6, Hw = 2.3;
    const plank = "#a6a6a6";
    // dinding belakang papan + rak kecil + kalender
    w.face([[xL, 0, zB], [xR, 0, zB], [xR, Hw, zB], [xL, Hw, zB]], "#9a9a9a");
    w.texture((u, v) => [xL + u, v, zB - 0.01], xR - xL, Hw, "plank", { color: "#7a7a7a" });
    w.box(-1.4, 1.45, zB - 0.35, 1.7, 0.05, 0.3, "#6f6f6f");
    for (let k = 0; k < 6; k++) w.box(-1.3 + k * 0.27, 1.5, zB - 0.3, 0.18, 0.22 + (k % 2) * 0.06, 0.18, ["#e8e8e8", "#8a8a8a", "#cfcfcf"][k % 3], { swk: 0.5 });
    for (let k = 0; k < 5; k++) w.prism(-1.2 + k * 0.3, zB - 0.2, 0.06, 1.9, 2.05, 8, "#f0f0f0", { swk: 0.4 }); // gelas terbalik
    w.box(0.6, 1.1, zB - 0.02, 0.55, 0.75, 0.01, "#f2f2f2", { swk: 0.6 }); // kalender
    w.face([[0.65, 1.55, zB - 0.03], [1.1, 1.55, zB - 0.03], [1.1, 1.8, zB - 0.03], [0.65, 1.8, zB - 0.03]], "#9c9c9c", { swk: 0.4 });
    for (let r = 0; r < 3; r++) w.line3([[0.67, 1.2 + r * 0.11, zB - 0.03], [1.08, 1.2 + r * 0.11, zB - 0.03]], "#9a9a9a", null, { bias: -0.05, swk: 0.4 });
    // dinding samping papan
    for (const x of [xL, xR - 0.08]) {
      w.box(x, 0, zF, 0.08, Hw, zB - zF, plank);
      w.texture((u, v) => [x === xL ? xL + 0.081 : xR - 0.081, v, zF + u], zB - zF, Hw, "plank", { color: "#7d7d7d" });
    }
    w.box(0, 0, zF + 0.6, xR - 0.1, 0.15, zB - zF - 0.7, "#b3b3b3"); // lantai dalam sedikit tinggi

    // ---- atap seng kecil miring ke depan, ditopang tiang kayu ----
    const rx0 = xL - 0.45, rx1 = xR + 0.45, rzF = 6.6, ryF = 2.35, rzB = zB + 0.35, ryB = 2.72;
    w.face([[rx0, ryF, rzF], [rx1, ryF, rzF], [rx1, ryB, rzB], [rx0, ryB, rzB]], "#9a9a9a", { bias: -0.6 });
    const U = rx1 - rx0, V = Math.hypot(rzB - rzF, ryB - ryF);
    w.texture((u, v) => [rx0 + u, ryF + (ryB - ryF) * (v / V), rzF + (rzB - rzF) * (v / V)], U, V, "seng", { color: "#777777", bias: -0.62 });
    const wave = [];
    for (let x = rx0; x <= rx1 + 1e-6; x += 0.075) wave.push([x, ryF - 0.02 - 0.035 * (1 + Math.sin(((x - rx0) / 0.15) * Math.PI)), rzF]);
    w.poly([...wave, [rx1, ryF + 0.02, rzF], [rx0, ryF + 0.02, rzF]], "#8e8e8e", { swk: 0.7, bias: -0.7 });
    for (const x of [xL - 0.2, xR + 0.12]) w.box(x, 0, rzF + 0.1, 0.1, ryF - 0.02, 0.1, "#8a8a8a"); // tiang kayu
    w.box(rx0, ryF - 0.1, rzF + 0.08, U, 0.08, 0.08, "#7a7a7a");
    // spanduk kain "WARKOP" di tepi atap (sedikit melendut)
    const by0 = 1.88, by1 = 2.24, bz = rzF + 0.06;
    w.poly([[xL - 0.1, by1, bz], [xR + 0.1, by1, bz], [xR + 0.1, by0, bz], [0, by0 - 0.04, bz], [xL - 0.1, by0, bz]], "#f2f2f2", { swk: 0.8, bias: -0.8 });
    w.text(xL, by0 + 0.02, xR, by1 - 0.02, bz - 0.01, "WARKOP BU ATIN", { size: 0.68, bias: -0.8 });
    for (const x of [xL - 0.08, xR + 0.08]) w.line3([[x, by1, bz], [x, ryF - 0.08, bz]], "#3a3a3a", null, { bias: -0.85 });

    // ---- meja jualan kayu ----
    const cz = 8.2;
    w.box(-1.6, 0, cz, 3.2, 0.88, 0.55, "#a8a8a8");
    w.texture((u, v) => [-1.6 + u, v, cz - 0.01], 3.2, 0.88, "plank", { color: "#7d7d7d" });
    w.box(-1.68, 0.88, cz - 0.05, 3.36, 0.05, 0.65, "#8e8e8e");
    // toples kerupuk besar
    for (const [x, lid] of [[-1.3, "#5a5a5a"], [-0.85, "#8a8a8a"], [-0.4, "#6a6a6a"]]) {
      w.prism(x, cz + 0.25, 0.17, 0.93, 1.33, 10, "#ededed", { capColor: lid, swk: 0.6 });
      w.box(x - 0.15, 1.33, cz + 0.1, 0.3, 0.05, 0.3, lid, { swk: 0.5 });
      for (const dy of [0.1, 0.2, 0.3]) w.line3([[x - 0.12, 0.93 + dy, cz + 0.08], [x + 0.1, 0.93 + dy + 0.03, cz + 0.08]], "#bdbdbd", null, { bias: -0.05, swk: 0.5 });
    }
    // termos air panas
    w.prism(0.3, cz + 0.3, 0.12, 0.93, 1.35, 10, "#7a7a7a", { capColor: "#4a4a4a" });
    w.box(0.22, 1.35, cz + 0.22, 0.16, 0.06, 0.16, "#4a4a4a");
    // gelas kopi berjajar
    for (let k = 0; k < 4; k++) P.glassOfCoffee(w, -0.05 + k * 0.17 - 0.3, 0.93, cz + 0.05);
    // piring gorengan
    w.sprite(1.15, cz + 0.2, (sx, sy, p, fog, lc, sw) => {
      const r = p * 0.2;
      return `<g transform="translate(${sx} ${sy})" stroke="${lc}" stroke-width="${sw * 0.7}">
        <ellipse cx="0" cy="0" rx="${r}" ry="${r * 0.28}" fill="${fog("#f2f2f2")}"/>
        ${[[-0.45, -0.25], [0.05, -0.35], [0.45, -0.2], [-0.15, -0.6], [0.3, -0.55]].map(([dx, dy]) => `<ellipse cx="${dx * r}" cy="${dy * r * 0.6}" rx="${r * 0.32}" ry="${r * 0.14}" fill="${fog("#9a9a9a")}" transform="rotate(${dx * 30} ${dx * r} ${dy * r * 0.6})"/>`).join("")}</g>`;
    }, { y: 0.93, bias: -0.1 });
    // meja samping: kompor + ceret
    w.box(1.95, 0, 8.3, 0.7, 0.75, 0.5, "#9a9a9a");
    w.box(2.0, 0.75, 8.35, 0.6, 0.1, 0.4, "#5a5a5a"); // kompor
    w.prism(2.3, 8.55, 0.15, 0.85, 1.12, 10, "#cfcfcf", { capColor: "#9a9a9a" }); // ceret
    w.line3([[2.42, 1.0, 8.5], [2.6, 1.12, 8.5]], "#5a5a5a", null, { bias: -0.1, swk: 1.6 });
    // galon & tabung gas di bawah meja samping
    w.prism(2.85, 8.3, 0.17, 0, 0.42, 10, "#9a9a9a");
    w.prism(-2.2, 9.6, 0.17, 0, 0.48, 10, "#7a7a7a");
    w.prism(-2.2, 9.6, 0.19, 0.48, 0.9, 10, "#d9d9d9");

    // ---- renceng kopi yang bergoyang tertiup angin ----
    for (let i = 0; i < 6; i++) {
      const sx = -1.6 + i * 0.26, zs = 7.3, top = 2.2, n = 5 + ((i * 3) % 4);
      const dark = i % 3 !== 1;
      w.line3([[sx, top, zs], [sx, ryF - 0.06, zs]], "#555555", null, { bias: -0.9 });
      for (let j = 0; j < n; j++) {
        const sway = 0.03 * j * Math.sin(t * 2.2 + i * 0.9);
        const y = top - j * 0.15, x = sx + sway;
        w.face([[x - 0.1, y, zs], [x + 0.1, y, zs], [x + 0.1, y - 0.14, zs], [x - 0.1, y - 0.14, zs]], j % 2 ? (dark ? "#4a4a4a" : "#8d8d8d") : (dark ? "#3c3c3c" : "#a3a3a3"), { swk: 0.45, bias: -0.9 });
        w.face([[x - 0.04, y - 0.04, zs - 0.005], [x + 0.04, y - 0.04, zs - 0.005], [x + 0.04, y - 0.09, zs - 0.005], [x - 0.04, y - 0.09, zs - 0.005]], "#e6e6e6", { stroke: false, bias: -0.91 });
      }
    }

    // ---- tempat duduk pelanggan ----
    P.bench(w, -1.5, 7.15, 2.0, { color: "#7d7d7d" }); // bangku di depan meja jualan (ujung kanan kosong: tempat memesan)
    // meja + bangku di bawah pohon (kiri)
    P.table(w, -3.5, 6.5, 1.3, 0.6);
    P.bench(w, -3.5, 7.32, 1.3, { color: "#8a8a8a" });
    P.glassOfCoffee(w, -3.15, 0.78, 6.75);
    // kursi plastik
    for (const [x, z] of [[2.2, 6.4], [2.75, 6.9]]) {
      w.box(x - 0.2, 0.42, z - 0.2, 0.4, 0.05, 0.4, "#cfcfcf");
      w.prism(x, z, 0.17, 0, 0.42, 8, "#bdbdbd", { cap: false });
    }
    // pohon besar di kiri (referensi)
    P.tree(w, -5.0, 9.2, { h: 7.2, bias: -2 });
    // semak
    P.bush(w, -4.8, 10.5, 0.6);
    P.chicken(w, 2.6, 7.6, { t, kind: "betina", flip: true });
    P.chicken(w, -3.0, 5.3, { t, kind: "jago", phase: 1.4 });
  },
};
