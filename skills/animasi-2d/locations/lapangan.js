// Lapangan bola kampung: tanah berumput tidak rata, gawang bambu tanpa jaring, sandal sebagai tanda,
// pagar bambu, pohon pisang/kelapa, rumah kampung di belakang, masjid beratap tumpang di kejauhan.
const P = require("../engine/props.js");

module.exports = {
  id: "lapangan",
  name: "Lapangan Bola",
  camera: { cam: { x: 0, y: 1.7, z: 0 }, f: 1050, horizon: 0.4 },
  spots: {
    tengah: { x: 0, z: 9 }, kiri: { x: -3.5, z: 7.5 }, kanan: { x: 3.5, z: 7.5 }, pinggir: { x: -1.5, z: 4.8 },
    gawang_kiri: { x: -8.5, z: 15 }, gawang_kanan: { x: 8.5, z: 15 }, jauh: { x: 1, z: 18 },
    duduk_pinggir: { x: -5.2, z: 5.95, seat: 0.48 }, duduk_pinggir2: { x: -6.2, z: 5.95, seat: 0.48 },
  },
  extras: [
    { seed: 31, kind: "anak_laki", spec: "run@-6,11>6,11/3+run@6,11>-6,11/3" },
    { seed: 32, kind: "anak_laki", spec: "run@6,13>-6,13/3.2+run@-6,13>6,13/3.2", phase: 0.7 },
    { seed: 33, kind: "anak_perempuan", spec: "run@-5,15>5,15/3.4+happy/1+run@5,15>-5,15/3.4", phase: 1.3 },
    { seed: 34, kind: "anak_laki", spec: "run@4,17.5>-7,17.5/3.6+run@-7,17.5>4,17.5/3.6", phase: 2.1 },
    { seed: 35, kind: "anak_laki", spec: "idle@9.6,17.5+happy/1+idle/2", flip: true },
    { seed: 36, kind: "anak_perempuan", spec: "happy@-3,31+laugh/1.2" },
    { seed: 37, kind: "bapak", spec: "idle@2,31.5" },
  ],
  build(w, { t = 0 } = {}) {
    P.sky(w, { groundColor: P.PAL.dirt });
    const X0 = -12, X1 = 12, Z0 = 3.5, Z1 = 32;
    // rumput belang (bekas potong)
    P.strip(w, X0, X1, Z0, Z1, "#a4a4a4");
    // petak tanah gundul tidak beraturan
    for (const [cx, cz, r] of [[-4, 9, 2.2], [3, 13, 2.8], [0, 18, 2.4], [-7, 22, 2], [6, 25, 2.5], [-1, 6, 1.6]]) {
      const pts = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([cx + r * Math.cos(a) * (1 + 0.25 * Math.sin(a * 3)), 0.002, cz + r * 0.7 * Math.sin(a)]); }
      w.ground(pts, "#cbcbcb", { stroke: false, bias: -0.1 });
    }
    for (let k = 0; k < 18; k++) P.grassTuft(w, -11 + ((k * 37) % 22), 5 + ((k * 13) % 20));
    // tanah di depan & tanah botak dekat gawang
    w.ground([[-30, 0, -20], [30, 0, -20], [30, 0, Z0], [-30, 0, Z0]], P.PAL.dirt, { stroke: false });
    for (const s of [-1, 1]) w.ground([[s * 11.5, 0.003, 14.5], [s * 9.2, 0.003, 13.8], [s * 8.8, 0.003, 19.5], [s * 11.5, 0.003, 20.5]], "#cdcdcd", { stroke: false, bias: -0.2 });
    // gawang bambu tanpa jaring di kedua sisi
    for (const sgn of [-1, 1]) {
      const gx = sgn * 11.4, zA = 15.8, zB = 19.2, gh = 1.9;
      w.box(gx - 0.07, 0, zA, 0.14, gh, 0.14, P.PAL.bambooPole);
      w.box(gx - 0.07, 0, zB, 0.14, gh, 0.14, P.PAL.bambooPole);
      w.box(gx - 0.06, gh - 0.05, zA - 0.1, 0.12, 0.12, zB - zA + 0.35, P.PAL.bambooPole);
      for (const z of [zA, zB]) w.line3([[gx, gh - 0.2, z - 0.05], [gx, gh + 0.05, z + 0.2]], "#555555", null, { bias: -0.1 }); // ikatan tali
    }
    // bola
    w.sprite(2.2, 8.2, (sx, sy, p, fog, lc, sw) => {
      const r = p * 0.11;
      return `<g transform="translate(${sx} ${sy - r})"><ellipse cx="0" cy="${r}" rx="${r}" ry="${r * 0.25}" fill="rgba(0,0,0,0.15)"/>
        <circle r="${r}" fill="#f8f8f8" stroke="${lc}" stroke-width="${sw}"/>
        <path d="M0,${-r * 0.35} L${r * 0.33},${-r * 0.1} L${r * 0.2},${r * 0.3} L${-r * 0.2},${r * 0.3} L${-r * 0.33},${-r * 0.1} Z" fill="#3a3a3a"/></g>`;
    });
    P.groundDetail(w, -11, 11, 3.6, 14, 40, 51);
    // sandal sebagai tanda (khas lapangan kampung)
    for (const [x, z] of [[-1.2, 4.2], [-0.8, 4.3], [4.8, 4.1], [5.2, 4.2], [-6, 14.2], [-6, 15.4]]) w.ground([[x, 0.01, z], [x + 0.28, 0.01, z], [x + 0.28, 0.01, z + 0.12], [x, 0.01, z + 0.12]], "#5a5a5a", { bias: -0.5 });
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
  },
};
