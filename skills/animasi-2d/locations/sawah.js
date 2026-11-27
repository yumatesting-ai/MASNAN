// Lokasi: SAWAH — hamparan petak padi hijau bergoyang, pematang tanah, saluran air, gubuk bambu (dangau),
// orang-orangan sawah, gunung biru di kejauhan, petani bercaping (figuran), burung & kupu-kupu.
const P = require("../engine/props.js");
const LIFE = require("../engine/life.js");
const c = LIFE.col;

// rumpun padi kecil bergoyang (sprite) — hanya di dekat kamera agar ringan
function padi(w, x, z, T, ripe) {
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const H = p * 0.42, sway = Math.sin(T * 1.8 + x * 2.3 + z) * p * 0.04;
    let d = "";
    for (let i = 0; i < 6; i++) { const bx = (i - 2.5) * p * 0.035, tx = bx + (i - 2.5) * p * 0.03 + sway, h = H * (0.75 + 0.05 * (i % 3));
      d += `M${(sx + bx).toFixed(1)},${sy.toFixed(1)} Q${(sx + bx + sway * 0.4).toFixed(1)},${(sy - h * 0.6).toFixed(1)} ${(sx + tx).toFixed(1)},${(sy - h).toFixed(1)} `; }
    const grain = ripe ? `<path d="M${(sx + sway).toFixed(1)},${(sy - H * 0.95).toFixed(1)} q${(p * 0.08).toFixed(1)},${(p * 0.05).toFixed(1)} ${(p * 0.1).toFixed(1)},${(p * 0.16).toFixed(1)}" stroke="${fog(c("#d9b44a"))}" stroke-width="${(sw * 1.6).toFixed(2)}" fill="none" stroke-linecap="round"/>` : "";
    return `<path d="${d}" stroke="${lc}" stroke-width="${(sw * 1.5).toFixed(2)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${fog(c(ripe ? "#9cbf4a" : "#5fae46"))}" stroke-width="${(sw * 0.9).toFixed(2)}" fill="none" stroke-linecap="round"/>${grain}`;
  }, { bias: -0.05 });
}

module.exports = {
  id: "sawah",
  name: "Sawah",
  camera: { cam: { x: 0, y: 1.45, z: -1 }, f: 1150, horizon: 0.44 },
  cameraPortrait: { cam: { x: 0.6, y: 1.55, z: 0.6 }, f: 1250, horizon: 0.42 },
  spots: {
    depan: { x: 0, z: 4 }, pematang: { x: 0, z: 7 }, pematang_jauh: { x: 0, z: 13 }, kiri: { x: -1.2, z: 5 }, kanan: { x: 1.2, z: 5 },
    gubuk: { x: 3.4, z: 9.2 }, duduk_gubuk: { x: 3.0, z: 9.95, seat: 0.6 }, duduk_gubuk2: { x: 3.8, z: 9.95, seat: 0.6 },
  },
  extras: [
    { seed: 71, kind: "petani", spec: "walk@-0.1,22>-0.1,14+idle/2+walk@-0.1,14>-0.1,22" },
    { seed: 72, kind: "petani", spec: "look_around@-0.2,30/4+idle/3" },
    { seed: 73, kind: "ibu", spec: "walk@-8,20.25>8,20.25+walk@8,20.25>-8,20.25", phase: 3 },
  ],
  obstacles: [
    { name: "gubuk", x0: 2.3, x1: 4.6, z0: 9.6, z1: 11.4 }, { name: "orang-orangan sawah", x: -3.5, z: 9.5, r: 0.2 },
    { name: "petak sawah kiri", x0: -30, x1: -1.3, z0: 3.2, z1: 19.9 }, { name: "petak sawah kanan", x0: 0.75, x1: 2.2, z0: 3.2, z1: 8.6 },
  ],
  build(w, { t = 0 } = {}) {
    P.sky(w, { clouds: [[0.15, 0.1, 1.1], [0.6, 0.07, 1.3], [0.9, 0.12, 0.9]] });
    // dasar: air sawah berkilau di petak, pematang tanah memanjang & melintang
    // tanah dibagi pita kedalaman agar kabut jarak bertahap (pita dekat tetap hijau segar)
    for (const [z0, z1] of [[-20, 8], [8, 16], [16, 30], [30, 50], [50, 80]]) w.ground([[-40, 0, z0], [40, 0, z0], [40, 0, z1], [-40, 0, z1]], c("#7fb35a"), { stroke: false });
    w.ground([[-40, 0.001, -20], [40, 0.001, -20], [40, 0.001, 3.2], [-40, 0.001, 3.2]], c("#b89b6e"), { stroke: false, bias: -0.1 }); // jalan tanah
    const rows = [3.2, 8.6, 14, 20, 27, 35, 45];
    for (const z of rows) w.ground([[-40, 0.004, z], [40, 0.004, z], [40, 0.004, z + 0.5], [-40, 0.004, z + 0.5]], c("#a8875a"), { stroke: false, bias: -0.2 });
    w.ground([[-0.75, 0.005, 3.2], [0.75, 0.005, 3.2], [0.75, 0.005, 80], [-0.75, 0.005, 80]], c("#b0905f"), { stroke: false, bias: -0.25 }); // pematang tengah
    // saluran air kecil di kiri pematang
    w.ground([[-1.25, 0.003, 3.2], [-0.8, 0.003, 3.2], [-0.8, 0.003, 80], [-1.25, 0.003, 80]], c("#6fb7d6"), { stroke: false, bias: -0.22 });
    // garis tanaman padi (larik) di tiap petak + rumpun padi dekat kamera
    for (const [z0, z1] of [[3.8, 10], [10, 20], [20, 40]]) for (let x = -30; x <= 30; x += 0.6) if (Math.abs(x) > 0.9) w.line3([[x, 0.01, z0], [x, 0.01, z1]], c("#4f9a3c"), null, { layer: "ground", bias: -0.3, swk: 0.9 });
    for (let z = 3.9; z < 8.4; z += 0.55) for (let x = -6; x <= 6; x += 0.6) if (Math.abs(x) > 0.9 && !(x > 2.1 && z > 7.6)) padi(w, x + ((z * 7) % 0.2), z, t, x < 0);
    // gubuk bambu (dangau) di kanan
    for (const [x, z] of [[2.4, 9.7], [4.5, 9.7], [2.4, 11.3], [4.5, 11.3]]) w.box(x - 0.06, 0, z - 0.06, 0.12, 2.3, 0.12, P.PAL.bambooPole);
    w.box(2.3, 0.55, 9.6, 2.3, 0.08, 1.8, P.PAL.bamboo);
    w.gable(2.2, 2.3, 9.5, 2.5, 2.0, 0.9, c("#c7a45a"), { ridge: "x", overhang: 0.3, wall: P.PAL.bamboo });
    // orang-orangan sawah
    w.box(-3.55, 0, 9.45, 0.1, 1.7, 0.1, c("#8d5f3c"));
    w.box(-4.1, 1.25, 9.47, 1.1, 0.08, 0.06, c("#8d5f3c"));
    w.sprite(-3.5, 9.5, (sx, sy, p, fog, lc, sw) => `<g stroke="${lc}" stroke-width="${sw}" stroke-linejoin="round">
      <path d="M${sx - p * 0.45},${sy - p * 1.32} L${sx + p * 0.45},${sy - p * 1.32} L${sx + p * 0.3},${sy - p * 0.75} L${sx - p * 0.3},${sy - p * 0.75} Z" fill="${fog(c("#d84a4a"))}"/>
      <circle cx="${sx}" cy="${sy - p * 1.55}" r="${p * 0.18}" fill="${fog(c("#e9d9b0"))}"/>
      <path d="M${sx - p * 0.38},${sy - p * 1.62} L${sx},${sy - p * 1.95} L${sx + p * 0.38},${sy - p * 1.62} Z" fill="${fog(c("#d9c27a"))}"/>
      <circle cx="${sx - p * 0.06}" cy="${sy - p * 1.56}" r="${p * 0.02}" fill="${lc}"/><circle cx="${sx + p * 0.06}" cy="${sy - p * 1.56}" r="${p * 0.02}" fill="${lc}"/></g>`, { bias: -0.05 });
    // pepohonan & desa di kejauhan
    for (const [x, z, h, k] of [[-14, 50, 9, "palm"], [-9, 55, 8, "palm"], [12, 48, 6, "round"], [18, 58, 9, "palm"], [-20, 62, 6, "round"], [6, 66, 8, "palm"]]) P.tree(w, x, z, { h, kind: k });
    LIFE.perchBirds(w, -4.1, 9.47, { y: 1.33, n: 2, len: 0.9 });
    LIFE.butterfly(w, -2, 6.5, { y: 0.9 }); LIFE.kite(w, -6, 45, { y: 16 });
    LIFE.ducks(w, [[-1.02, 6.5], [-1.02, 12.5]], { n: 4, speed: 0.25 }); // bebek berenang di saluran air
  },
};
