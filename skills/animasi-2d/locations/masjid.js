// Lokasi: MASJID KAMPUNG — masjid sederhana beratap tumpang (tajug) bertingkat dengan mustaka, serambi
// bertiang kayu, bedug & kentongan, toa di tiang bambu, halaman tanah + pohon sawo, pagar tembok rendah.
const P = require("../engine/props.js");

module.exports = {
  id: "masjid",
  name: "Masjid Kampung",
  camera: { cam: { x: 0, y: 1.6, z: -5 }, f: 1150, horizon: 0.5 },
  spots: {
    gerbang: { x: 0, z: 5.2 }, halaman_kiri: { x: -4.6, z: 9.5 }, halaman_kanan: { x: 4.4, z: 9.5 }, setapak: { x: 0.2, z: 8.5 },
    serambi: { x: 1.2, z: 12.4 }, depan: { x: 0.6, z: 3.2 }, bedug: { x: -3.2, z: 12.6 },
    duduk_serambi: { x: -1.8, z: 10.85, seat: 0.4 }, duduk_serambi2: { x: 1.6, z: 10.85, seat: 0.4 },
  },
  extras: [
    { seed: 41, kind: "bapak", spec: "walk@0.2,5.4>0.3,11.6/5+idle/2.5+walk@0.3,11.6>0.2,5.4/5" },
    { seed: 42, kind: "kakek", spec: "sit@4.4,10.85" },
    { seed: 43, kind: "anak_laki", spec: "run@-5,8.2>-1.8,8.2/1.6+run@-1.8,8.2>-5,8.2/1.6", phase: 0.4 },
    { seed: 44, kind: "pemuda", spec: "walk@0.3,11.6>0.2,5.4/5+idle/2+walk@0.2,5.4>0.3,11.6/5", phase: 3 },
    { seed: 45, kind: "ibu", spec: "walk@-9,3>9,3/9+walk@9,3>-9,3/9", phase: 5 },
  ],
  build(w) {
    P.sky(w, { clouds: [[0.12, 0.1, 1], [0.7, 0.06, 1.1]] });
    // jalan kampung di depan + halaman tanah
    w.ground([[-30, 0, 0.6], [30, 0, 0.6], [30, 0, 3.6], [-30, 0, 3.6]], P.PAL.concrete, { stroke: false });
    w.ground([[-30, 0, 3.6], [30, 0, 3.6], [30, 0, 60], [-30, 0, 60]], P.PAL.dirt, { stroke: false, bias: -0.04 });
    w.ground([[-1.2, 0.005, 4.2], [1.2, 0.005, 4.2], [1.2, 0.005, 11.4], [-1.2, 0.005, 11.4]], "#cfcfcf", { bias: -0.2 }); // jalan setapak

    // pagar tembok rendah + gerbang
    for (const s of [-1, 1]) {
      const xa = s < 0 ? -9 : 1.6, len = 7.4;
      w.box(xa, 0, 4.2, len, 0.8, 0.25, "#e2e2e2");
      w.box(s < 0 ? -1.9 : 1.4, 0, 4.1, 0.5, 1.6, 0.45, "#eeeeee");
      w.hip(s < 0 ? -1.9 : 1.4, 1.6, 4.1, 0.5, 0.45, 0.4, P.PAL.roof, { overhang: 0.06 });
    }

    // ---- bangunan masjid ----
    const x0 = -6, x1 = 6, zf = 13.5, zb = 23, H = 3.6;
    w.box(x0, 0, zf, x1 - x0, 0.45, zb - zf, "#c9c9c9"); // lantai panggung
    w.box(x0, 0.45, zf, x1 - x0, H - 0.45, zb - zf, "#ececec");
    // jendela & pintu lengkung di dinding depan
    for (const cx of [-4.4, -2.2, 2.2, 4.4]) w.arch(cx - 0.55, cx + 0.55, 1.2, 2.9, zf - 0.02, "#a9a9a9", { swk: 0.8, bias: -0.05 });
    w.arch(-0.8, 0.8, 0.45, 3.0, zf - 0.02, "#8a8a8a", { swk: 0.9, bias: -0.05 });
    // serambi: lantai + atap emperan + tiang kayu
    w.box(x0 - 0.5, 0, zf - 2.6, x1 - x0 + 1, 0.4, 2.6, "#d2d2d2");
    w.face([[x0 - 0.8, H - 0.1, zf], [x1 + 0.8, H - 0.1, zf], [x1 + 0.8, 2.75, zf - 2.9], [x0 - 0.8, 2.75, zf - 2.9]], P.PAL.roof, { swk: 0.9 });
    // papan nama di tepi atap serambi
    w.box(-2.4, 2.35, zf - 2.95, 4.8, 0.55, 0.08, "#f4f4f4");
    w.text(-2.35, 2.4, 2.35, 2.85, zf - 2.96, "MASJID AL-IKHLAS", { size: 0.66 });
    for (let k = 0; k <= 6; k++) w.box(x0 - 0.3 + (k * (x1 - x0 + 0.6)) / 6 - 0.08, 0.4, zf - 2.5, 0.16, 2.35, 0.16, P.PAL.wood);
    // atap tumpang (tajug) dua tingkat + mustaka
    w.hip(x0, H, zf, x1 - x0, zb - zf, 2.6, P.PAL.roof, { overhang: 0.9, top: 4.2, tiles: 5 });
    w.box(-2.1, H + 2.6, (zf + zb) / 2 - 2.1, 4.2, 0.9, 4.2, "#e4e4e4");
    w.hip(-2.1, H + 3.5, (zf + zb) / 2 - 2.1, 4.2, 4.2, 2.6, P.PAL.roof, { overhang: 0.6, tiles: 4 });
    w.sprite(0, (zf + zb) / 2, (sx, sy, p, fog, lc, sw) => {
      const s = p;
      return `<g transform="translate(${sx} ${sy})" stroke="${lc}" stroke-width="${sw}">
        <path d="M0,${-s * 0.35} L${s * 0.18},${-s * 0.05} L0,0 L${-s * 0.18},${-s * 0.05} Z" fill="${fog("#8a8a8a")}"/>
        <circle cx="0" cy="${-s * 0.5}" r="${s * 0.12}" fill="${fog("#bdbdbd")}"/></g>`;
    }, { y: H + 6.1, bias: -3 });
    // bedug & kentongan di serambi
    w.box(-5.2, 0.4, zf - 1.6, 0.1, 1.4, 0.1, P.PAL.wood);
    w.box(-3.9, 0.4, zf - 1.6, 0.1, 1.4, 0.1, P.PAL.wood);
    w.sprite(-4.55, zf - 1.55, (sx, sy, p, fog, lc, sw) => {
      const r = p * 0.42, L2 = p * 0.62;
      return `<g transform="translate(${sx} ${sy - p * 1.3})" stroke="${lc}" stroke-width="${sw}">
        <rect x="${-L2}" y="${-r}" width="${L2 * 2}" height="${r * 2}" rx="${r * 0.3}" fill="${fog("#8a8a8a")}"/>
        <ellipse cx="${-L2}" cy="0" rx="${r * 0.35}" ry="${r}" fill="${fog("#d8d8d8")}"/>
        ${[-0.6, -0.3, 0, 0.3, 0.6].map((k) => `<circle cx="${-L2 + r * 0.25}" cy="${k * r}" r="${r * 0.05}" fill="${lc}"/>`).join("")}</g>`;
    }, { y: 0.4, bias: -0.3 });
    w.sprite(5.1, zf - 1.55, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy - p * 2.2})" stroke="${lc}" stroke-width="${sw}">
        <path d="M0,0 L0,${p * 0.25}" /><rect x="${-p * 0.08}" y="${p * 0.25}" width="${p * 0.16}" height="${p * 0.8}" rx="${p * 0.05}" fill="${fog("#7a7a7a")}"/>
        <path d="M${-p * 0.02},${p * 0.4} L${-p * 0.02},${p * 0.9}" stroke-width="${sw * 1.4}"/></g>`, { y: 0.4, bias: -0.3 });
    // toa di tiang bambu
    w.box(7.4, 0, 12, 0.12, 8.5, 0.12, P.PAL.bambooPole);
    w.sprite(7.46, 12.06, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy - p * 8.2})" stroke="${lc}" stroke-width="${sw}">
        <path d="M0,0 L${-p * 0.6},${-p * 0.25} L${-p * 0.6},${p * 0.3} Z" fill="${fog("#e6e6e6")}"/>
        <path d="M0,${p * 0.5} L${p * 0.6},${p * 0.25} L${p * 0.6},${p * 0.8} Z" fill="${fog("#e6e6e6")}"/></g>`);
    // bunga & semak di halaman
    for (const [x, z] of [[-2.6, 4.7], [2.6, 4.7], [-4, 10.2], [4.2, 10.4]]) P.flowerClump(w, x, z);
    for (const [x, z] of [[-6.5, 8.5], [6.2, 8.2]]) P.bush(w, x, z, 0.65, { flowers: true });
    // pepohonan & rumah tetangga
    P.tree(w, -8.2, 9, { h: 5.8 });
    P.tree(w, 9.5, 16, { h: 8.5, kind: "palm" });
    P.tree(w, -10.5, 20, { h: 8, kind: "palm" });
    P.tree(w, 4.2, 6.8, { h: 3.2, kind: "banana" });
    P.house(w, { side: 1, fx: 11, z: 5, width: 6, wall: "plank", roof: "seng" });
    P.house(w, { side: -1, fx: -11.5, z: 3.5, width: 6, wall: "plaster" });
  },
};
