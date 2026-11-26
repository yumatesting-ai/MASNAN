// Lokasi: KAMAR (untuk konten kecantikan / tutorial / review produk) — kamar remaja sederhana: dinding pastel,
// jendela bertirai, lampu tumbler bercahaya, meja rias dengan cermin & alat makeup, kasur dengan kucing tidur,
// poster, rak kecil. Kamera dalam ruangan (tanpa kabut).
const P = require("../engine/props.js");
const LIFE = require("../engine/life.js");
const c = LIFE.col;

module.exports = {
  id: "kamar",
  name: "Kamar (meja rias)",
  camera: { cam: { x: 0, y: 1.2, z: 0.6 }, f: 1250, horizon: 0.45, fogStart: 60, vignette: true },
  spots: {
    depan: { x: 0, z: 3.4 }, tengah: { x: 0, z: 4.6 }, meja_rias: { x: 1.9, z: 4.9 },
    duduk_rias: { x: 2.2, z: 5.25, seat: 0.45 }, kasur: { x: -2.1, z: 5.4, seat: 0.5 },
  },
  obstacles: [
    { name: "kasur", x0: -3.5, x1: -1.3, z0: 5.6, z1: 7.0 }, { name: "meja rias", x0: 1.3, x1: 3.3, z0: 6.2, z1: 6.9 },
    { name: "kursi rias", x: 2.2, z: 5.6, r: 0.25 }, { name: "dinding belakang", x0: -4, x1: 4, z0: 7.0, z1: 7.3 },
  ],
  extras: [],
  build(w, { t = 0 } = {}) {
    const X0 = -3.6, X1 = 3.6, ZB = 7.0, H = 2.9;
    const wall = c("#f6dfe3"), wall2 = c("#eccfd5"), floor = c("#c79a6e");
    // lantai kayu + karpet bulat
    w.ground([[X0 - 2, 0, -2], [X1 + 2, 0, -2], [X1 + 2, 0, ZB], [X0 - 2, 0, ZB]], floor, { stroke: false });
    for (let x = X0; x < X1; x += 0.45) w.line3([[x, 0.002, -2], [x, 0.002, ZB]], c("#a97e56"), null, { layer: "ground", bias: -0.1, swk: 0.5 });
    const rug = []; for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; rug.push([0.2 + Math.cos(a) * 1.5, 0.004, 4.6 + Math.sin(a) * 0.8]); }
    w.ground(rug, c("#f4e7c6"), { bias: -0.3 });
    // dinding belakang & samping
    w.face([[X0, 0, ZB], [X1, 0, ZB], [X1, H, ZB], [X0, H, ZB]], wall, { swk: 0.6 });
    w.face([[X0, 0, -2], [X0, 0, ZB], [X0, H, ZB], [X0, H, -2]], wall2, { swk: 0.6 });
    w.face([[X1, 0, ZB], [X1, 0, -2], [X1, H, -2], [X1, H, ZB]], wall2, { swk: 0.6 });
    w.face([[X0, 0, ZB - 0.01], [X1, 0, ZB - 0.01], [X1, 0.12, ZB - 0.01], [X0, 0.12, ZB - 0.01]], c("#ffffff"), { swk: 0.5, bias: -0.01 }); // plint
    // jendela bertirai (kiri belakang) dengan langit
    const wx0 = -2.3, wx1 = -0.7, wy0 = 1.1, wy1 = 2.35, wz = ZB - 0.02;
    w.face([[wx0, wy0, wz], [wx1, wy0, wz], [wx1, wy1, wz], [wx0, wy1, wz]], c("#9fd3f0"), { swk: 0.9, bias: -0.02 });
    w.face([[wx0, wy0, wz - 0.005], [wx1, wy0, wz - 0.005], [wx1, wy0 + 0.35, wz - 0.005], [wx0, wy0 + 0.35, wz - 0.005]], c("#c9e9f8"), { stroke: false, bias: -0.025 });
    w.line3([[(wx0 + wx1) / 2, wy0, wz - 0.01], [(wx0 + wx1) / 2, wy1, wz - 0.01]], c("#ffffff"), null, { bias: -0.03, swk: 1.6 });
    w.line3([[wx0, (wy0 + wy1) / 2, wz - 0.01], [wx1, (wy0 + wy1) / 2, wz - 0.01]], c("#ffffff"), null, { bias: -0.03, swk: 1.6 });
    const sway = 0.03 * Math.sin(t * 1.3);
    for (const [a, b] of [[wx0 - 0.3, wx0 + 0.15], [wx1 - 0.15, wx1 + 0.3]])
      w.face([[a, 0.9, wz - 0.03], [b, 0.9 + sway, wz - 0.03], [b, wy1 + 0.25, wz - 0.03], [a, wy1 + 0.25, wz - 0.03]], c("#f7b6c2"), { swk: 0.7, bias: -0.04 });
    w.box(wx0 - 0.4, wy1 + 0.25, wz - 0.06, wx1 - wx0 + 0.8, 0.05, 0.05, c("#ffffff"));
    // lampu tumbler (fairy lights) melengkung di dinding, berkelip pelan
    for (let i = 0; i <= 16; i++) {
      const u = i / 16, x = -3.2 + u * 6.4, y = 2.55 - 0.18 * Math.sin(u * Math.PI * 3) ** 2;
      const on = 0.6 + 0.4 * Math.sin(t * 2 + i * 1.7);
      w.sprite(x, ZB - 0.05, (sx, sy, p) => `<circle cx="${sx}" cy="${sy}" r="${p * 0.06}" fill="${c("#fff1b0")}" opacity="${(0.35 * on).toFixed(2)}"/><circle cx="${sx}" cy="${sy}" r="${p * 0.025}" fill="${c("#ffd86a")}" stroke="#2a2a2a" stroke-width="0.8"/>`, { y, bias: -0.06 });
    }
    // poster & rak kecil
    w.face([[0.1, 1.35, ZB - 0.02], [0.9, 1.35, ZB - 0.02], [0.9, 2.25, ZB - 0.02], [0.1, 2.25, ZB - 0.02]], c("#fbe7a1"), { swk: 0.7, bias: -0.02 });
    w.text(0.15, 1.75, 0.85, 2.15, ZB - 0.03, "GLOW", { size: 0.55, bias: -0.03 });
    w.box(1.3, 1.55, ZB - 0.3, 1.0, 0.05, 0.28, c("#ffffff"));
    for (let k = 0; k < 4; k++) w.prism(1.42 + k * 0.24, ZB - 0.16, 0.06, 1.6, 1.72 + (k % 2) * 0.06, 8, c(["#e98aa0", "#9fd3f0", "#f4d06f", "#b8e0a8"][k]), { swk: 0.5 });
    // KASUR (kiri) + selimut + bantal + kucing tidur
    w.box(-3.5, 0, 5.6, 2.2, 0.45, 1.4, c("#ffffff"));
    w.box(-3.5, 0.45, 5.6, 2.2, 0.08, 1.4, c("#a9d6e8"));
    w.box(-3.3, 0.53, 6.35, 0.8, 0.16, 0.5, c("#ffffff"));
    LIFE.cat(w, -2.0, 6.0, { mode: "sleep", y: 0.53, color: "#f2f0ea", stripe: "#9a9a9a" });
    // MEJA RIAS (kanan) + cermin oval + makeup
    w.box(1.3, 0, 6.2, 2.0, 0.75, 0.7, c("#ffffff"));
    w.box(1.3, 0.75, 6.2, 2.0, 0.05, 0.7, c("#f3e3d3"));
    w.sprite(2.3, ZB - 0.05, (sx, sy, p, fog, lc, sw) => `<ellipse cx="${sx}" cy="${sy}" rx="${p * 0.55}" ry="${p * 0.72}" fill="${c("#ffffff")}" stroke="${lc}" stroke-width="${sw}"/>
        <ellipse cx="${sx}" cy="${sy}" rx="${p * 0.47}" ry="${p * 0.64}" fill="${c("#cfe9f5")}" stroke="${lc}" stroke-width="${sw * 0.6}"/>
        <path d="M${sx - p * 0.25},${sy - p * 0.35} l${p * 0.18},${-p * 0.18} M${sx - p * 0.15},${sy - p * 0.15} l${p * 0.25},${-p * 0.25}" stroke="#ffffff" stroke-width="${sw * 1.6}" stroke-linecap="round"/>`, { y: 1.55, bias: -0.05 });
    const items = [["#2b2b2b", 0.06, 0.2], ["#e98aa0", 0.05, 0.12], ["#f4d06f", 0.07, 0.08], ["#b3263c", 0.035, 0.16], ["#9fd3f0", 0.05, 0.1]];
    items.forEach(([col, r2, hgt], k) => w.prism(1.55 + k * 0.32, 6.5, r2, 0.8, 0.8 + hgt, 10, c(col), { swk: 0.5 }));
    // kursi rias bulat
    w.prism(2.2, 5.6, 0.25, 0.4, 0.45, 12, c("#f7b6c2"));
    w.prism(2.2, 5.6, 0.04, 0, 0.4, 6, c("#bbbbbb"), { cap: false });
  },
};
