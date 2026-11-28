// Lokasi: EMPANG (kolam ikan Mbah Sum di pinggir sawah) — tepian rumput di kiri, air kolam luas di kanan
// (permukaan sedikit lebih rendah dari tepian), riak air bergerak, teratai, rumput tinggi/eceng di tepi, pancang bambu,
// gubuk kecil di seberang, sawah & gunung di kejauhan. Tokoh memancing berdiri di tepian menghadap KANAN (ke air).
// Tokoh yang tercebur: spot `dalam_empang` (y negatif) + fx "waterfront" menutup badan di bawah permukaan air.
const P = require("../engine/props.js");
const LIFE = require("../engine/life.js");
const c = LIFE.col;
const WATER_Y = -0.12, EDGE_X = 0.75;

module.exports = {
  id: "empang",
  name: "Empang Mbah Sum",
  WATER_Y, EDGE_X,
  camera: { cam: { x: 0.6, y: 1.3, z: 0.2 }, f: 1150, horizon: 0.45 },
  cameraPortrait: { cam: { x: 0.5, y: 1.25, z: 1.0 }, f: 1050, horizon: 0.45 },
  spots: {
    tepi: { x: 0.15, z: 4.3 }, dermaga: { x: 1.75, z: 6.25 }, dermaga_pangkal: { x: 0.45, z: 6.25 }, jalan: { x: -2.6, z: 3.2 },
    ember: { x: -0.45, z: 4.2 }, dalam_empang: { x: 1.45, z: 4.55, y: -0.82 },
  },
  extras: [
    { seed: 81, kind: "petani", spec: "walk@-6,16>6,16+idle/2+walk@6,16>-6,16", phase: 2 },
    { seed: 82, kind: "bapak", spec: "idle_side{face=r}@5.6,13.2" }, // pemancing lain di seberang (jauh, siluet)
  ],
  obstacles: [
    { name: "empang (depan dermaga)", water: true, x0: EDGE_X + 0.05, x1: 14, z0: 1.5, z1: 5.8 }, { name: "empang (belakang dermaga)", water: true, x0: EDGE_X + 0.05, x1: 14, z0: 6.7, z1: 13 },
    { name: "empang (ujung dermaga)", water: true, x0: 2.35, x1: 14, z0: 5.8, z1: 6.7 },
    { name: "pohon pisang", x: -2.4, z: 8.2, r: 0.4 }, { name: "pancang bambu", x: 0.55, z: 7.6, r: 0.08 },
  ],
  build(w, { t = 0 } = {}) {
    P.sky(w, { clouds: [[0.2, 0.08, 1.1], [0.7, 0.11, 1.2]] });
    // tanah & sawah di kejauhan (pita kedalaman agar kabut bertahap)
    for (const [z0, z1] of [[-20, 13], [13, 20], [20, 35], [35, 60]]) w.ground([[-40, 0, z0], [40, 0, z0], [40, 0, z1], [-40, 0, z1]], c("#7fb35a"), { stroke: false });
    w.ground([[-40, 0.002, -20], [EDGE_X, 0.002, -20], [EDGE_X, 0.002, 13], [-40, 0.002, 13]], c("#8cc063"), { stroke: false, bias: -0.05 }); // tepian rumput
    w.ground([[-4.2, 0.004, -20], [-2.9, 0.004, -20], [-2.9, 0.004, 13], [-4.2, 0.004, 13]], c("#b89b6e"), { stroke: false, bias: -0.1 }); // jalan setapak
    for (let z = 15; z < 40; z += 0.7) w.line3([[-30, 0.01, z], [30, 0.01, z]], c("#5f9c45"), null, { layer: "ground", bias: -0.3, swk: 0.7 }); // larik padi jauh
    // AIR KOLAM: sedikit di bawah tepian; tebing tanah tipis di sisi tepian
    const X1 = 14, Z0 = 1.5, Z1 = 13;
    w.ground([[EDGE_X, WATER_Y, Z0 - 8], [X1, WATER_Y, Z0 - 8], [X1, WATER_Y, Z1], [EDGE_X, WATER_Y, Z1]], c("#5aa5c4"), { stroke: false, bias: -0.15 });
    w.ground([[EDGE_X, WATER_Y + 0.001, Z1 - 0.6], [X1, WATER_Y + 0.001, Z1 - 0.6], [X1, WATER_Y + 0.001, Z1], [EDGE_X, WATER_Y + 0.001, Z1]], c("#4f9a5a"), { stroke: false, bias: -0.16 });
    w.face([[EDGE_X, WATER_Y, Z0 - 8], [EDGE_X, 0, Z0 - 8], [EDGE_X, 0, Z1], [EDGE_X, WATER_Y, Z1]], c("#8a6a45"), { swk: 0.7, bias: -0.12 });
    // riak & kilau air bergerak pelan
    for (let i = 0; i < 26; i++) {
      const x = EDGE_X + 0.6 + ((i * 2.37) % (X1 - EDGE_X - 1)), z = Z0 - 3 + ((i * 3.11) % (Z1 - Z0 + 2.5)), dx = 0.25 * Math.sin(t * 0.6 + i);
      w.line3([[x - 0.35 + dx, WATER_Y + 0.002, z], [x + 0.35 + dx, WATER_Y + 0.002, z]], c("#c9e6f2"), null, { layer: "ground", bias: -0.17, swk: 0.9 });
    }
    // teratai
    for (const [x, z, r] of [[3.4, 8.8, 0.28], [4.1, 9.4, 0.22], [6.2, 7.2, 0.3], [2.6, 10.6, 0.25], [7.5, 11.2, 0.3]]) {
      const pts = []; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + 0.3; if (k === 0) continue; pts.push([x + Math.cos(a) * r, WATER_Y + 0.004, z + Math.sin(a) * r * 0.9]); }
      pts.push([x, WATER_Y + 0.004, z]);
      w.ground(pts, c("#4f9a5a"), { bias: -0.18 });
    }
    w.sprite(4.1, 9.4, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy - p * 0.04})" stroke="${lc}" stroke-width="${sw * 0.6}">
      ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="${-p * 0.05}" rx="${p * 0.03}" ry="${p * 0.06}" fill="${fog(c("#f7b6c2"))}" transform="rotate(${a})"/>`).join("")}
      <circle r="${p * 0.025}" fill="${fog(c("#f4d06f"))}"/></g>`, { y: WATER_Y, bias: -0.05 });
    // rumput tinggi & eceng di tepi air (depan & belakang tokoh)
    for (const [x, z] of [[0.72, 7.4], [0.6, 8.3], [0.75, 9.6], [0.65, 11.2], [1.2, 12.6]])
      w.sprite(x, z, (sx, sy, p, fog, lc, sw) => { let d = ""; for (let i = 0; i < 7; i++) { const bx = (i - 3) * p * 0.05, h = p * (0.45 + (i % 3) * 0.12), lean = (i - 3) * p * 0.03 + Math.sin(t * 1.4 + x + i) * p * 0.02;
        d += `M${sx + bx},${sy} Q${sx + bx + lean * 0.5},${sy - h * 0.6} ${sx + bx + lean},${sy - h} `; }
        return `<path d="${d}" stroke="${lc}" stroke-width="${sw * 1.8}" fill="none"/><path d="${d}" stroke="${fog(c("#4f9a3c"))}" stroke-width="${sw * 1.1}" fill="none"/>`; }, { bias: -0.04 });
    // DERMAGA BAMBU kecil menjorok ke air (tempat memancing kedua): lantai bilah bambu + tiang di air
    w.box(EDGE_X - 0.3, 0, 5.8, 2.3 - EDGE_X + 0.3 + 0.05, 0.05, 0.9, P.PAL.bamboo);
    for (let k = 0; k < 9; k++) w.line3([[EDGE_X - 0.3 + k * 0.18, 0.051, 5.8], [EDGE_X - 0.3 + k * 0.18, 0.051, 6.7]], c("#8f7a4c"), null, { bias: -0.02, swk: 0.5 });
    for (const [x, z] of [[1.1, 5.82], [2.25, 5.82], [1.1, 6.62], [2.25, 6.62]]) w.box(x - 0.04, WATER_Y - 0.3, z - 0.04, 0.08, 0.38, 0.08, P.PAL.bambooPole);
    // pancang bambu di tepi + papan kecil "EMPANG MBAH SUM"
    w.box(0.5, 0, 7.55, 0.1, 1.1, 0.1, P.PAL.bambooPole);
    // papan nama di sisi kiri jalan setapak (jauh dari jalur kamera -> tidak ada bayangan raksasa di depan lensa)
    const SX = -5.2, SZ = 4.6;
    w.box(SX + 0.56, 0, SZ + 0.02, 0.08, 0.9, 0.08, c("#8d5f3c"));
    w.box(SX, 0.72, SZ, 1.2, 0.42, 0.05, c("#f3ead6"));
    w.text(SX + 0.07, 0.92, SX + 1.13, 1.08, SZ - 0.01, "EMPANG", { size: 0.55 });
    w.text(SX + 0.07, 0.76, SX + 1.13, 0.9, SZ - 0.01, "MBAH SUM", { size: 0.5 });
    // pohon pisang & semak di belakang tepian; gubuk kecil di seberang kolam
    P.tree(w, -2.4, 8.2, { h: 3.6, kind: "banana" }); P.tree(w, -5.5, 11, { h: 6.5, kind: "round" }); P.bush(w, -1.6, 10.4, 0.55);
    for (const [x, z] of [[8.2, 13.6], [9.8, 13.6], [8.2, 14.8], [9.8, 14.8]]) w.box(x - 0.05, 0, z - 0.05, 0.1, 2.0, 0.1, P.PAL.bambooPole);
    w.box(8.1, 0.5, 13.5, 1.8, 0.07, 1.4, P.PAL.bamboo);
    w.gable(8.0, 2.0, 13.4, 2.0, 1.6, 0.8, c("#c7a45a"), { ridge: "x", overhang: 0.25, wall: P.PAL.bamboo });
    for (const [x, z, h, k] of [[-12, 45, 9, "palm"], [10, 40, 7, "round"], [16, 52, 9, "palm"], [-20, 55, 6, "round"], [3, 60, 8, "palm"]]) P.tree(w, x, z, { h, kind: k });
    // kehidupan: bebek berenang, capung (kupu kecil), burung, layangan
    LIFE.ducks(w, [[5.5, 10.5], [9.5, 8.5], [11, 11.5]], { n: 3, speed: 0.22 });
    LIFE.butterfly(w, 1.6, 7.8, { y: 0.7 }); LIFE.kite(w, 5, 45, { y: 16 });
    LIFE.perchBirds(w, 0.55, 7.6, { y: 1.12, n: 1, len: 0.1 });
  },
};
