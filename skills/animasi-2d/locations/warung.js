// Lokasi: WARUNG BU ATIN — mengikuti referensi kreator: warung tembok plester kusam beratap seng satu sisi
// (miring ke depan, tepi bergelombang, menjorok jauh, ditopang tiang kayu), renceng sachet panjang dua warna
// di depan dinding kiri, meja tembok dengan deretan toples + pagar besi kecil, rak kayu berisi toples di dalam,
// lampu gantung, bangku kayu panjang, pohon besar di kiri depan, rumah tetangga + pagar bata + tanaman.
const P = require("../engine/props.js");
const { mul } = require("../engine/world3d.js");

module.exports = {
  id: "warung",
  name: "Warung Bu Atin",
  camera: { cam: { x: -0.3, y: 2.7, z: 1.2 }, f: 980, horizon: 0.3 },
  spots: {
    balik_etalase: { x: 3.45, z: 9.75, y: 0.3 }, // di belakang meja tembok (kepala & bahu terlihat)
    depan: { x: 1.6, z: 6.4 }, bangku: { x: -1.5, z: 6.3 }, meja: { x: 0.2, z: 6.0 },
    jalan_kiri: { x: -3.0, z: 5.0 }, jalan_kanan: { x: 3.8, z: 5.2 }, samping: { x: 5.8, z: 8.2 },
  },
  build(w, { t = 0 } = {}) {
    P.sky(w, { clouds: [[0.55, 0.06, 1.1], [0.9, 0.12, 0.9]] });
    // halaman tanah + jalan setapak
    w.ground([[-30, 0, 0.6], [30, 0, 0.6], [30, 0, 60], [-30, 0, 60]], P.PAL.dirt, { stroke: false });
    w.ground([[-1, 0.003, 0.6], [2.5, 0.003, 0.6], [3.2, 0.003, 8.9], [-0.4, 0.003, 8.9]], "#cfcfcf", { stroke: false, bias: -0.2 });
    for (let k = 0; k < 14; k++) P.grassTuft(w, -4 + ((k * 37) % 11), 2.5 + ((k * 13) % 6));

    // ---- latar: rumah tetangga + pagar bata + tanaman ----
    P.house(w, { side: 1, fx: -9.5, z: 15, width: 6, depth: 6, wall: "plaster", wallColor: "#d6d6d6" });
    w.box(-11, 0, 11.5, 7.6, 1.3, 0.25, "#a9a9a9");
    w.texture((u, v) => [-11 + u, v, 11.49], 7.6, 1.3, "brick", { color: "#7f7f7f" });
    w.box(-11.1, 1.3, 11.45, 7.8, 0.1, 0.35, "#9a9a9a");
    for (const [x, z] of [[-6, 10.8], [-5, 10.6], [-3.8, 10.7], [-3, 9.6]]) P.bush(w, x, z, 0.5);
    P.tree(w, -10, 20, { h: 7 });
    P.tree(w, 9, 22, { h: 8, kind: "palm" });

    // ---- bangunan warung ----
    const xL = -2.6, xR = 4.6, zF = 9, zB = 13, Hf = 2.82;
    const wall = "#e3e3e3", stain = "#d2d2d2";
    // dinding belakang bagian dalam (gelap) + rak kayu berisi toples
    w.face([[xL, 0, zB - 0.25], [xR, 0, zB - 0.25], [xR, 3.2, zB - 0.25], [xL, 3.2, zB - 0.25]], "#9e9e9e");
    for (const y of [1.25, 1.85, 2.45]) {
      w.box(-0.2, y, zB - 0.9, 4.6, 0.06, 0.6, "#6f6f6f");
      for (let k = 0; k < 7; k++) {
        const jx = -0.0 + k * 0.62, jh = 0.3 + ((k + Math.round(y * 3)) % 3) * 0.05;
        w.prism(jx + 0.2, zB - 0.6, 0.15, y + 0.06, y + 0.06 + jh, 8, "#dcdcdc", { capColor: ["#5a5a5a", "#8a8a8a", "#b0b0b0"][k % 3], swk: 0.5 });
      }
    }
    // lantai dalam lebih tinggi 30 cm (penjual berdiri di atasnya)
    w.box(0, 0, zF + 0.35, xR - 0.25, 0.3, zB - zF - 0.6, "#bdbdbd");
    // dinding samping kiri & kanan
    w.box(xL, 0, zF, 0.25, Hf, zB - zF, wall);
    w.box(xR - 0.25, 0, zF, 0.25, Hf, zB - zF, wall);
    // dinding depan kiri (penuh) — tempat renceng
    w.box(xL, 0, zF, 2.6, Hf, 0.25, wall);
    w.face([[xL, 0.1, zF - 0.01], [xL + 2.6, 0.1, zF - 0.01], [xL + 2.6, 0.7, zF - 0.01], [xL, 0.45, zF - 0.01]], stain, { stroke: false, bias: -0.01 });
    // meja tembok (counter) + lis atas
    w.box(0, 0, zF, xR - 0.25, 0.95, 0.35, wall);
    w.face([[0, 0.1, zF - 0.01], [xR - 0.25, 0.1, zF - 0.01], [xR - 0.25, 0.5, zF - 0.01], [0, 0.35, zF - 0.01]], stain, { stroke: false, bias: -0.01 });
    w.box(-0.05, 0.95, zF - 0.05, xR - 0.15, 0.06, 0.45, "#cfcfcf");
    // toples bertutup di atas meja + pagar besi kecil
    const lids = ["#4a4a4a", "#8a8a8a", "#6a6a6a", "#a5a5a5", "#555555", "#9a9a9a"];
    for (let k = 0; k < 5; k++) w.prism(0.35 + k * 0.55, zF + 0.15, 0.17, 1.01, 1.36, 10, "#e9e9e9", { capColor: lids[k], swk: 0.6 });
    for (let k = 0; k < 5; k++) w.box(0.35 + k * 0.55 - 0.16, 1.36, zF + 0.0, 0.32, 0.05, 0.3, lids[k], { swk: 0.6 });
    w.line3([[0.05, 1.5, zF + 0.32], [xR - 0.35, 1.5, zF + 0.32]], "#4a4a4a", null, { bias: 0.05 });
    for (let x = 0.1; x < xR - 0.3; x += 0.55) w.line3([[x, 1.01, zF + 0.32], [x, 1.5, zF + 0.32]], "#4a4a4a", null, { bias: 0.05 });

    // ---- atap seng satu sisi: tinggi di belakang, rendah & menjorok di depan ----
    const rx0 = xL - 0.9, rx1 = xR + 0.5, rzB = zB + 0.3, ryB = 3.45, rzF = 5.6, ryF = 2.5;
    w.face([[rx0, ryF, rzF], [rx1, ryF, rzF], [rx1, ryB, rzB], [rx0, ryB, rzB]], "#a8a8a8", { bias: -3 }); // digambar setelah dinding di bawahnya
    const U = rx1 - rx0, V = Math.hypot(rzB - rzF, ryB - ryF);
    w.texture((u, v) => [rx0 + u, ryF + (ryB - ryF) * (v / V), rzF + (rzB - rzF) * (v / V)], U, V, "seng", { color: "#7c7c7c", bias: -3.05 });
    // tepi depan bergelombang (penampang seng) + bayangan karat
    const wave = [];
    for (let x = rx0; x <= rx1 + 1e-6; x += 0.075) wave.push([x, ryF - 0.03 - 0.04 * (1 + Math.sin(((x - rx0) / 0.15) * Math.PI)), rzF]);
    w.poly([...wave, [rx1, ryF + 0.02, rzF], [rx0, ryF + 0.02, rzF]], "#8e8e8e", { swk: 0.7, bias: -0.2 });
    // noda karat tipis
    for (let x = rx0 + 0.6; x < rx1; x += 1.7) w.line3([[x, ryF + 0.03, rzF + 0.05], [x + 0.05, ryF + 0.25, rzF + 1.9]], "#8d8d8d", null, { bias: -3.06, swk: 1.6 });
    // tiang kayu penopang di depan kiri + balok
    w.box(xL - 0.6, 0, rzF + 0.2, 0.16, ryF, 0.16, P.PAL.wood);
    w.box(rx0, ryF - 0.12, rzF + 0.15, U, 0.1, 0.1, "#7a7a7a");
    // papan nama kecil di dinding kiri
    // papan nama kayu berdiri di samping kanan warung
    for (const x of [2.15, 3.25]) w.box(x, 0, 6.7, 0.07, 1.5, 0.07, P.PAL.wood);
    w.box(2.0, 1.0, 6.65, 1.4, 0.55, 0.05, "#f2f2f2");
    w.text(2.04, 1.26, 3.36, 1.52, 6.64, "WARUNG", { size: 0.8 });
    w.text(2.04, 1.02, 3.36, 1.27, 6.64, "BU ATIN", { size: 0.8 });

    // ---- renceng sachet panjang, dua warna selang-seling ----
    const tones = [["#4f4f4f", "#3c3c3c"], ["#9b9b9b", "#858585"]];
    for (let i = 0; i < 7; i++) {
      const sx = xL + 0.2 + i * 0.32, zs = zF - 0.12, top = 2.12, n = 9 + ((i * 5) % 4);
      const [a, b] = tones[i < 4 ? 0 : 1];
      w.line3([[sx, top, zs], [sx, ryF + 0.4, zs]], "#555555", null, { bias: -0.1 });
      for (let j = 0; j < n; j++) {
        const y = top - j * 0.17;
        w.face([[sx - 0.13, y, zs], [sx + 0.13, y, zs], [sx + 0.13, y - 0.16, zs], [sx - 0.13, y - 0.16, zs]], j % 2 ? a : b, { swk: 0.45, bias: -0.15 });
        w.face([[sx - 0.05, y - 0.05, zs - 0.005], [sx + 0.05, y - 0.05, zs - 0.005], [sx + 0.05, y - 0.11, zs - 0.005], [sx - 0.05, y - 0.11, zs - 0.005]], "#e8e8e8", { stroke: false, bias: -0.16 });
      }
    }
    // ---- lampu gantung di dalam ----
    w.line3([[3.7, 3.2, 10.4], [3.7, 2.55, 10.4]], "#3a3a3a", null, { bias: -0.2 });
    w.sprite(3.7, 10.4, (sx, sy, p, fog, lc, sw) => {
      const r = 0.2 * p;
      return `<g transform="translate(${sx} ${sy - 2.55 * p})" stroke="${lc}" stroke-width="${sw}" stroke-linejoin="round">
        <path d="M${-r * 0.4},0 L${r * 0.4},0 L${r},${r * 0.9} L${-r},${r * 0.9} Z" fill="${fog("#3a3a3a")}"/>
        <path d="M${-r * 0.8},${r * 0.9} L${r * 0.8},${r * 0.9} L${r * 0.6},${r * 1.9} L${-r * 0.6},${r * 1.9} Z" fill="#f4f4f4"/>
        <path d="M0,${r * 0.9} L0,${r * 1.9} M${-r * 0.7},${r * 1.4} L${r * 0.7},${r * 1.4}" stroke-width="${sw * 0.7}"/>
        <path d="M${-r * 0.7},${r * 1.9} L${r * 0.7},${r * 1.9} L0,${r * 2.3} Z" fill="${fog("#3a3a3a")}"/></g>`;
    }, { bias: -0.3 });

    // ---- bangku kayu panjang di depan ----
    P.bench(w, -2.9, 6.6, 2.6, { color: "#7d7d7d" });
    // pohon besar di kiri depan (membingkai adegan)
    P.tree(w, -4.6, 7.4, { h: 7.5, bias: -4 });
    P.chicken(w, 3.6, 5.0, { t, kind: "betina", flip: true });
  },
};
