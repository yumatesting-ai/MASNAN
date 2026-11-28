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
    // tanah dasar TIDAK menutupi kolam (dulu tergambar di atas air bagian belakang -> kotak hijau di belakang dermaga)
    for (const [z0, z1] of [[13, 20], [20, 35], [35, 60]]) w.ground([[-40, 0, z0], [40, 0, z0], [40, 0, z1], [-40, 0, z1]], c("#7fb35a"), { stroke: false });
    w.ground([[14, 0, -20], [40, 0, -20], [40, 0, 13], [14, 0, 13]], c("#7fb35a"), { stroke: false });
    w.ground([[-40, 0.002, -20], [EDGE_X, 0.002, -20], [EDGE_X, 0.002, 13], [-40, 0.002, 13]], c("#8cc063"), { stroke: false, bias: -0.05 }); // tepian rumput
    w.ground([[-4.2, 0.004, -20], [-2.9, 0.004, -20], [-2.9, 0.004, 13], [-4.2, 0.004, 13]], c("#b89b6e"), { stroke: false, bias: -0.1 }); // jalan setapak
    for (let z = 15; z < 40; z += 0.7) w.line3([[-30, 0.01, z], [30, 0.01, z]], c("#5f9c45"), null, { layer: "ground", bias: -0.3, swk: 0.7 }); // larik padi jauh
    // AIR KOLAM (natural): tepi berkelok tidak lurus, pita lumpur basah & batu di tepian, air bergradasi (dekat jernih
    // kehijauan -> jauh biru gelap), pantulan langit & bayangan pohon seberang, riak melengkung + kilau berkelip,
    // ganggang di tepi, teratai bertakik dengan bunga, gelembung ikan.
    const X1 = 14, Z0 = -7, Z1 = 13;
    const shore = (z) => EDGE_X + 0.07 * Math.sin(z * 1.3) + 0.025 * Math.sin(z * 3.1 + 1); // garis tepi berkelok
    const zs = []; for (let z = Z0; z <= Z1; z += 0.25) zs.push(z);
    // lumpur basah (pita coklat gelap di bibir air) + tebing tanah
    w.ground([...zs.map((z) => [shore(z) - 0.07, 0.003, z]), ...zs.slice().reverse().map((z) => [shore(z) + 0.02, 0.003, z])], c("#9c7d55"), { stroke: false, bias: -0.08 });
    // air: tiga pita gradasi kedalaman
    for (const [z0, z1, col] of [[Z0, 2.5, "#6ab3c8"], [2.5, 6, "#62abc4"], [6, 9.5, "#57a0bc"], [9.5, Z1, "#4d93b2"]]) {
      const zz = zs.filter((z) => z >= z0 && z <= z1);
      w.ground([...zz.map((z) => [shore(z), WATER_Y, z]), [X1, WATER_Y, z1], [X1, WATER_Y, z0]], c(col), { stroke: false, bias: -0.15 });
    }
    // bayangan tebing di air: pita tipis sedikit lebih gelap dari air (bukan hijau) mengikuti kelokan tepi
    w.ground([...zs.map((z) => [shore(z), WATER_Y + 0.001, z]), ...zs.slice().reverse().map((z) => [shore(z) + 0.12, WATER_Y + 0.001, z])], c("#4f93ad"), { stroke: false, bias: -0.155 });
    // bayangan pohon & gubuk seberang di air (pantulan gelap) + pantulan awan terang
    w.ground([[2.5, WATER_Y + 0.002, 11.6], [12, WATER_Y + 0.002, 11.6], [12, WATER_Y + 0.002, 12.6], [2.5, WATER_Y + 0.002, 12.6]], c("#3f7f8a"), { stroke: false, bias: -0.16 });
    for (const [x, z, r] of [[4.5, 5.5, 1.1], [8, 9.5, 1.4]]) {
      const pts = []; for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; pts.push([x + Math.cos(a) * r * (1 + 0.15 * Math.sin(k * 2.3)), WATER_Y + 0.002, z + Math.sin(a) * r * 0.45]); }
      w.ground(pts, c("#8fcbe0"), { stroke: false, bias: -0.16 });
    }
    // tebing tepian (sisi tanah turun ke air) mengikuti kelokan
    for (let i = 0; i + 1 < zs.length; i++) w.face([[shore(zs[i]), WATER_Y, zs[i]], [shore(zs[i]), 0, zs[i]], [shore(zs[i + 1]), 0, zs[i + 1]], [shore(zs[i + 1]), WATER_Y, zs[i + 1]]], c("#8a6a45"), { stroke: false, bias: -0.12 });
    w.line3(zs.map((z) => [shore(z), 0.002, z]), c("#5e4630"), null, { bias: -0.11, swk: 0.9 });
    // batu-batu kecil di bibir air
    for (const [z, r] of [[8.4, 0.08], [9.6, 0.1], [11.2, 0.08]])
      w.sprite(shore(z) - 0.05, z, (sx, sy, p, fog, lc, sw) => `<ellipse cx="${sx}" cy="${sy - p * r * 0.35}" rx="${p * r}" ry="${p * r * 0.55}" fill="${fog(c("#9a958a"))}" stroke="${lc}" stroke-width="${sw * 0.7}"/>
        <ellipse cx="${sx - p * r * 0.3}" cy="${sy - p * r * 0.55}" rx="${p * r * 0.35}" ry="${p * r * 0.15}" fill="#ffffff" opacity="0.35"/>`, { bias: -0.04 });
    // riak melengkung (bergerak pelan) + kilau matahari berkelip
    for (let i = 0; i < 30; i++) {
      const x = EDGE_X + 1.0 + ((i * 2.37) % (X1 - EDGE_X - 1.5)), z = Z0 + 4 + ((i * 3.11) % (Z1 - Z0 - 5)), dx = 0.25 * Math.sin(t * 0.6 + i), L = 0.18 + (i % 3) * 0.08;
      w.line3([[x - L + dx, WATER_Y + 0.003, z], [x + dx, WATER_Y + 0.003, z - 0.04], [x + L + dx, WATER_Y + 0.003, z]], c("#d8eef6"), null, { layer: "ground", bias: -0.17, swk: 0.9 });
    }
    for (let i = 0; i < 12; i++) {
      const x = 2 + ((i * 3.7) % 10), z = 1 + ((i * 2.9) % 10), on = Math.max(0, Math.sin(t * 3 + i * 1.9));
      if (on > 0.3) w.sprite(x, z, (sx, sy, p) => `<path d="M${sx - p * 0.06},${sy} L${sx + p * 0.06},${sy} M${sx},${sy - p * 0.03} L${sx},${sy + p * 0.03}" stroke="#ffffff" stroke-width="${p * 0.012}" opacity="${on.toFixed(2)}" stroke-linecap="round"/>`, { y: WATER_Y + 0.01, bias: -0.16 });
    }
    // gelembung ikan (naik & pecah) — tanda ada ikan di empang
    for (const [x, z, ph] of [[2.3, 3.6, 0], [3.0, 7.6, 1.3], [5.2, 4.4, 2.1]]) {
      const k = (t * 0.7 + ph) % 1;
      w.sprite(x, z, (sx, sy, p, fog, lc, sw) => `<circle cx="${sx}" cy="${sy}" r="${p * (0.015 + 0.02 * k)}" fill="none" stroke="#e6f4fa" stroke-width="${sw * 0.8}" opacity="${(1 - k).toFixed(2)}"/>`, { y: WATER_Y + 0.005, bias: -0.16 });
    }
    // teratai bertakik (daun bulat dengan celah) + bunga
    for (const [x, z, r] of [[3.4, 8.8, 0.28], [4.1, 9.4, 0.22], [6.2, 7.2, 0.3], [2.6, 10.6, 0.25], [7.5, 11.2, 0.3], [4.8, 10.2, 0.18]]) {
      const pts = []; for (let k = 1; k < 14; k++) { const a = (k / 14) * Math.PI * 2 + z; pts.push([x + Math.cos(a) * r, WATER_Y + 0.004, z + Math.sin(a) * r * 0.9]); }
      pts.push([x, WATER_Y + 0.004, z]);
      w.ground(pts, c("#4f9a5a"), { bias: -0.18, swk: 0.6 });
    }
    for (const [x, z] of [[4.1, 9.4], [6.2, 7.2], [7.5, 11.2]]) w.sprite(x, z, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy - p * 0.04})" stroke="${lc}" stroke-width="${sw * 0.6}">
      ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="${-p * 0.05}" rx="${p * 0.03}" ry="${p * 0.06}" fill="${fog(c("#f7b6c2"))}" transform="rotate(${a})"/>`).join("")}
      <circle r="${p * 0.025}" fill="${fog(c("#f4d06f"))}"/></g>`, { y: WATER_Y, bias: -0.05 });
    // rumput tinggi & eceng di tepi air (depan & belakang tokoh)
    for (const [x, z] of [[0.72, 7.4], [0.6, 8.3], [0.75, 9.6], [0.65, 11.2], [1.2, 12.6], [13, 12.8], [11.5, 12.9], [6, 12.95], [3.5, 12.9]])
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
