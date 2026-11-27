// Lokasi: KELAS (ruang kelas SD) — dilihat dari samping depan: papan tulis hijau & pintu di dinding belakang,
// meja guru di kiri, murid duduk di bangku menghadap kiri (ke guru/papan), meja murid di sisi kiri tiap murid
// (tidak menutupi badan -> tidak ada tembus), jendela di dinding kanan, foto Garuda, jam dinding, rak buku.
// Kucing/benda masuk lewat pintu (kiri belakang) -> jalan ke depan -> melompat ke meja guru (tinggi 0,75 m).
const P = require("../engine/props.js");
const LIFE = require("../engine/life.js");
const c = LIFE.col;

const DESK_H = 0.62, SEAT = 0.42, TDESK = { x0: -3.0, x1: -1.9, z0: 4.0, z1: 4.65, h: 0.76 };
// tempat duduk murid: [x, z]; meja murid di kirinya (x-0.62..x-0.24)
const SEATS = { duduk_bima: [0.8, 3.7], duduk_rara: [2.25, 3.7], duduk_a: [3.7, 3.7], duduk_nana: [0.8, 5.3], duduk_b: [2.25, 5.3], duduk_c: [3.7, 5.3] };

module.exports = {
  id: "kelas",
  name: "Ruang Kelas",
  extrasStyle: "detail",
  camera: { cam: { x: 0.2, y: 1.45, z: -3.2 }, f: 1050, horizon: 0.46, fogStart: 60, vignette: true },
  cameraPortrait: { cam: { x: -0.6, y: 1.3, z: -0.6 }, f: 820, horizon: 0.5 },
  spots: {
    depan_guru: { x: -1.45, z: 4.35 }, papan: { x: -1.2, z: 6.4 }, pintu: { x: -3.05, z: 7.4 }, pintu_dalam: { x: -3.05, z: 6.6 },
    lantai_meja_guru: { x: -2.45, z: 3.6 }, atas_meja_guru: { x: -2.45, z: 4.32, y: TDESK.h },
    ...Object.fromEntries(Object.entries(SEATS).map(([k, [x, z]]) => [k, { x, z, seat: SEAT }])),
  },
  extras: [
    { seed: 71, kind: "anak_laki", spec: "sit_idle{face=l}@duduk_a" },
    { seed: 72, kind: "anak_perempuan", spec: "sit_idle{face=l}@duduk_b", phase: 1.3 },
    { seed: 73, kind: "anak_laki", spec: "sit_idle{face=l}@duduk_c", phase: 2.1 },
  ],
  obstacles: [
    { name: "meja guru", x0: TDESK.x0, x1: TDESK.x1, z0: TDESK.z0, z1: TDESK.z1 },
    { name: "kursi guru", x: -2.45, z: 5.05, r: 0.22 },
    ...Object.values(SEATS).map(([x, z]) => ({ name: "meja murid", x0: x - 0.62, x1: x - 0.24, z0: z - 0.3, z1: z + 0.3 })),
    { name: "dinding belakang", x0: -5, x1: 5, z0: 7.0, z1: 7.3 },
    { name: "rak buku", x0: 3.4, x1: 4.4, z0: 6.5, z1: 6.95 },
  ],
  build(w, { t = 0 } = {}) {
    const X0 = -4.8, X1 = 4.8, ZB = 7.0, H = 3.2, ZF = -6;
    const wall = c("#f3e7cf"), wall2 = c("#ead9b8"), floor = c("#d8cbb4"), wood = c("#9a6a42"), wood2 = c("#7d5434");
    // lantai keramik kotak-kotak
    w.ground([[X0, 0, ZF], [X1, 0, ZF], [X1, 0, ZB], [X0, 0, ZB]], floor, { stroke: false });
    for (let x = X0; x <= X1; x += 0.6) w.line3([[x, 0.002, ZF], [x, 0.002, ZB]], c("#bfb19a"), null, { layer: "ground", bias: -0.1, swk: 0.45 });
    for (let z = ZF; z <= ZB; z += 0.6) w.line3([[X0, 0.002, z], [X1, 0.002, z]], c("#bfb19a"), null, { layer: "ground", bias: -0.1, swk: 0.45 });
    // dinding belakang (dengan lubang pintu), samping, plafon
    const DX0 = -3.5, DX1 = -2.6, DH = 2.3;
    w.face([[X0, 0, ZB], [DX0, 0, ZB], [DX0, H, ZB], [X0, H, ZB]], wall, { swk: 0.6, bias: 3 });
    w.face([[DX1, 0, ZB], [X1, 0, ZB], [X1, H, ZB], [DX1, H, ZB]], wall, { swk: 0.6, bias: 3 });
    w.face([[DX0, DH, ZB], [DX1, DH, ZB], [DX1, H, ZB], [DX0, H, ZB]], wall, { swk: 0.6, bias: 3 });
    w.face([[DX0, 0, ZB + 1.2], [DX1, 0, ZB + 1.2], [DX1, DH, ZB + 1.2], [DX0, DH, ZB + 1.2]], c("#cfe6c4"), { swk: 0.6, bias: 4 }); // teras luar terang
    w.ground([[DX0, 0.001, ZB], [DX1, 0.001, ZB], [DX1, 0.001, ZB + 1.2], [DX0, 0.001, ZB + 1.2]], c("#bfb3a3"), { stroke: false });
    w.face([[DX1, 0, ZB], [DX1 + 0.05, 0, ZB - 0.85], [DX1 + 0.05, DH, ZB - 0.85], [DX1, DH, ZB]], c("#8a5a34"), { swk: 0.8, bias: -0.05 }); // daun pintu terbuka
    w.line3([[DX0, 0, ZB - 0.01], [DX0, DH, ZB - 0.01], [DX1, DH, ZB - 0.01], [DX1, 0, ZB - 0.01]], c("#6b4426"), null, { bias: -0.06, swk: 2.2 });
    w.face([[X0, 0, ZF], [X0, 0, ZB], [X0, H, ZB], [X0, H, ZF]], wall2, { swk: 0.6, bias: 6 });
    w.face([[X1, 0, ZB], [X1, 0, ZF], [X1, H, ZF], [X1, H, ZB]], wall2, { swk: 0.6, bias: 6 });
    w.face([[X0, H, ZF], [X1, H, ZF], [X1, H, ZB], [X0, H, ZB]], c("#fbf6ea"), { swk: 0.5, bias: 6 });
    // plafon: papan eternit bergaris + lampu neon & kipas angin berputar
    for (let x = X0; x <= X1; x += 1.2) w.line3([[x, H - 0.001, ZF], [x, H - 0.001, ZB]], c("#e2dccb"), null, { bias: 5, swk: 0.6 });
    for (let z = ZF; z <= ZB; z += 1.2) w.line3([[X0, H - 0.001, z], [X1, H - 0.001, z]], c("#e2dccb"), null, { bias: 5, swk: 0.6 });
    for (const [x, z] of [[-1.8, 1.5], [1.8, 1.5], [-1.8, 5], [1.8, 5]]) {
      w.box(x - 0.6, H - 0.08, z - 0.06, 1.2, 0.06, 0.12, c("#ffffff"));
      w.box(x - 0.55, H - 0.12, z - 0.04, 1.1, 0.04, 0.08, c("#fff6c8"), { swk: 0.4 });
    }
    w.sprite(0, 3.2, (sx, sy, p, fog, lc, sw) => {
      const a = (t * 400) % 120; let bl = "";
      for (let k = 0; k < 3; k++) bl += `<ellipse cx="${p * 0.45}" cy="0" rx="${p * 0.42}" ry="${p * 0.07}" fill="${c("#d9d2c0")}" stroke="${lc}" stroke-width="${sw * 0.6}" transform="rotate(${a + k * 120}) scale(1 0.35)"/>`;
      return `<g transform="translate(${sx} ${sy})"><path d="M0,${-p * 0.35} L0,0" stroke="${lc}" stroke-width="${sw * 1.4}"/>${bl}<circle r="${p * 0.08}" fill="#ffffff" stroke="${lc}" stroke-width="${sw}"/></g>`;
    }, { y: H - 0.4, bias: 0 });
    w.face([[X0, 0, ZB - 0.01], [X1, 0, ZB - 0.01], [X1, 0.15, ZB - 0.01], [X0, 0.15, ZB - 0.01]], c("#7a9a6e"), { stroke: false, bias: -0.01 }); // plint hijau
    // jendela di dinding kanan (langit & daun)
    for (const z of [0.6, 3.2, 5.8]) {
      w.face([[X1 - 0.01, 1.0, z - 0.8], [X1 - 0.01, 1.0, z + 0.8], [X1 - 0.01, 2.4, z + 0.8], [X1 - 0.01, 2.4, z - 0.8]], c("#a8d0e2"), { swk: 0.9, bias: -0.03 });
      w.line3([[X1 - 0.02, 1.0, z], [X1 - 0.02, 2.4, z]], c("#ffffff"), null, { bias: -0.04, swk: 1.6 });
      w.line3([[X1 - 0.02, 1.7, z - 0.8], [X1 - 0.02, 1.7, z + 0.8]], c("#ffffff"), null, { bias: -0.04, swk: 1.6 });
    }
    // papan tulis hijau + tulisan kapur + kapur & penghapus
    const BX0 = -2.3, BX1 = 0.7, BY0 = 1.0, BY1 = 2.25, bz = ZB - 0.03;
    w.face([[BX0 - 0.08, BY0 - 0.08, bz + 0.01], [BX1 + 0.08, BY0 - 0.08, bz + 0.01], [BX1 + 0.08, BY1 + 0.08, bz + 0.01], [BX0 - 0.08, BY1 + 0.08, bz + 0.01]], wood, { swk: 0.8, bias: -0.02 });
    w.face([[BX0, BY0, bz], [BX1, BY0, bz], [BX1, BY1, bz], [BX0, BY1, bz]], c("#3d6b52"), { swk: 0.8, bias: -0.03 });
    w.text(BX0 + 0.15, BY1 - 0.42, BX1 - 0.15, BY1 - 0.1, bz - 0.01, "Kamis, 27 Nov", { size: 0.55, color: "#f2f2f2", bias: -0.04 });
    w.text(BX0 + 0.15, BY0 + 0.4, BX1 - 0.15, BY0 + 0.75, bz - 0.01, "PR: Hal. 12, no. 1-10", { size: 0.55, color: "#f2f2f2", bias: -0.04 });
    w.box(BX0, BY0 - 0.12, bz - 0.12, BX1 - BX0, 0.04, 0.12, wood2);
    // foto Garuda di tengah atas + jam dinding + poster
    w.face([[-0.95, 2.45, ZB - 0.02], [-0.65, 2.45, ZB - 0.02], [-0.65, 2.85, ZB - 0.02], [-0.95, 2.85, ZB - 0.02]], c("#e0b13a"), { swk: 0.8, bias: -0.03 });
    w.text(-0.95, 2.55, -0.65, 2.75, ZB - 0.03, "★", { size: 0.7, color: "#7a2f35", bias: -0.04 });
    w.sprite(1.6, ZB - 0.04, (sx, sy, p, fog, lc, sw) => {
      const r = p * 0.18, a = (t * 6) % 360;
      return `<g transform="translate(${sx} ${sy - p * 2.55})"><circle r="${r}" fill="#ffffff" stroke="${lc}" stroke-width="${sw * 1.2}"/>
        <path d="M0,0 L0,${-r * 0.6}" stroke="${lc}" stroke-width="${sw * 1.2}"/><path d="M0,0 L${r * 0.45},0" stroke="${lc}" stroke-width="${sw}" transform="rotate(${a})"/></g>`;
    }, { bias: -0.04 });
    w.face([[2.3, 1.2, ZB - 0.02], [3.1, 1.2, ZB - 0.02], [3.1, 2.2, ZB - 0.02], [2.3, 2.2, ZB - 0.02]], c("#fbe7a1"), { swk: 0.7, bias: -0.02 });
    w.text(2.35, 1.6, 3.05, 1.95, ZB - 0.03, "A B C", { size: 0.5, bias: -0.03 });
    w.text(2.35, 1.3, 3.05, 1.55, ZB - 0.03, "1 2 3", { size: 0.5, bias: -0.03 });
    // rak buku di pojok kanan belakang
    w.box(3.4, 0, 6.5, 1.0, 1.3, 0.45, wood);
    for (let k = 0; k < 7; k++) w.prism(3.5 + k * 0.12, 6.55, 0.05, 0.75, 1.05 + (k % 3) * 0.06, 4, c(["#d8423a", "#3f86c4", "#f2c84b", "#4f9a5a"][k % 4]), { swk: 0.4 });
    // MEJA GURU + kursi guru + vas bunga & tumpukan buku
    const T = TDESK;
    w.box(T.x0, T.h - 0.05, T.z0, T.x1 - T.x0, 0.05, T.z1 - T.z0, wood);
    w.box(T.x0, 0.12, T.z0, T.x1 - T.x0, T.h - 0.17, 0.04, wood2); // panel depan
    for (const x of [T.x0, T.x1 - 0.06]) w.box(x, 0, T.z0, 0.06, T.h - 0.05, 0.06, wood2);
    w.box(-2.75, 0, 4.85, 0.5, 0.45, 0.45, wood); w.box(-2.75, 0.45, 5.25, 0.5, 0.5, 0.05, wood);
    w.prism(-2.85, 4.5, 0.06, T.h, T.h + 0.16, 8, c("#9fd3f0"), { swk: 0.5 });
    w.sprite(-2.85, 4.5, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy})">${[[-0.06, -0.24], [0.05, -0.27], [0, -0.3]].map(([dx, dy]) => `<circle cx="${dx * p}" cy="${dy * p}" r="${p * 0.04}" fill="${c("#f2a3ae")}" stroke="${lc}" stroke-width="${sw * 0.6}"/>`).join("")}</g>`, { y: T.h, bias: -0.06 });
    for (let k = 0; k < 3; k++) w.box(-2.1, T.h + k * 0.04, 4.45, 0.18, 0.04, 0.14, c(["#f4f4f4", "#e0b13a", "#4f9a5a"][k]), { swk: 0.4 });
    // MEJA & BANGKU MURID: meja di sisi kiri murid (murid menghadap kiri)
    for (const [x, z] of Object.values(SEATS)) {
      w.box(x - 0.62, DESK_H - 0.04, z - 0.3, 0.38, 0.04, 0.6, wood);
      for (const dz of [-0.28, 0.24]) w.box(x - 0.6, 0, z + dz, 0.04, DESK_H - 0.04, 0.04, wood2);
      w.box(x - 0.6, 0.2, z - 0.28, 0.34, 0.03, 0.56, wood2); // laci bawah
      w.box(x - 0.2, SEAT - 0.04, z + 0.05, 0.42, 0.04, 0.32, wood, { bias: 0.3 }); // bangku (di belakang badan)
      for (const dx of [-0.18, 0.18]) w.box(x + dx, 0, z + 0.3, 0.04, SEAT - 0.04, 0.04, wood2, { bias: 0.3 });
    }
  },
};
