// Lokasi: KELAS SD — dua sudut kamera dari ruang yang sama (kamera engine selalu menghadap +z):
//   kelas       : HADAP MURID. Kamera di depan kelas (dekat papan tulis), murid duduk MENGHADAP KAMERA di balik
//                 meja dua-orang (meja menutup pinggang ke bawah -> terbaca duduk di bangku sekolah). Dinding belakang:
//                 rak buku, jadwal piket, mading. Guru & pintu ada di belakang kamera (depan kelas).
//   kelas_guru  : HADAP GURU. Kamera di belakang kelas: papan tulis, pintu depan, meja guru, Bu Sari menghadap murid;
//                 punggung murid (sit_back) di latar depan.
// Koordinat dicerminkan antar sudut: x_guru = -x_murid, z_guru = 6.8 - z_murid  (mis. bangku Bima: murid (-0.85,2.8)
// <-> guru (0.85,4.0)). Figuran teman sekelas: siluet abu-abu + blur kuat (fokus ke tokoh utama).
const LIFE = require("../engine/life.js");
const c = LIFE.col;

const SEAT = 0.42, DESK_H = 0.5, MIRROR_Z = 6.8;
// bangku (tampak murid): 4 kolom (2 meja berdua per baris), 2 baris
const SEATS_M = {
  duduk_bima: [-0.85, 2.8], duduk_rara: [0.85, 2.8], duduk_a: [-1.75, 2.8], duduk_b: [1.75, 2.8],
  duduk_nana: [-0.85, 4.4], duduk_c: [0.85, 4.4], duduk_d: [-1.75, 4.4], duduk_e: [1.75, 4.4],
};
const toGuru = ([x, z]) => [-x, +(MIRROR_Z - z).toFixed(2)];
const TDESK = { x0: -2.9, x1: -1.7, z0: 5.6, z1: 6.2, h: 0.76 }; // meja guru (tampak guru)

function room(w, t, { ZB, wallCol, side }) {
  const X0 = -4.8, X1 = 4.8, H = 3.2, ZF = -6, floor = c("#d8cbb4");
  w.ground([[X0, 0, ZF], [X1, 0, ZF], [X1, 0, ZB], [X0, 0, ZB]], floor, { stroke: false });
  for (let x = X0; x <= X1; x += 0.6) w.line3([[x, 0.002, ZF], [x, 0.002, ZB]], c("#bfb19a"), null, { layer: "ground", bias: -0.1, swk: 0.45 });
  for (let z = ZF; z <= ZB; z += 0.6) w.line3([[X0, 0.002, z], [X1, 0.002, z]], c("#bfb19a"), null, { layer: "ground", bias: -0.1, swk: 0.45 });
  const wall2 = c("#ead9b8");
  w.face([[X0, 0, ZF], [X0, 0, ZB], [X0, H, ZB], [X0, H, ZF]], wall2, { swk: 0.6, bias: 6 });
  w.face([[X1, 0, ZB], [X1, 0, ZF], [X1, H, ZF], [X1, H, ZB]], wall2, { swk: 0.6, bias: 6 });
  w.face([[X0, H, ZF], [X1, H, ZF], [X1, H, ZB], [X0, H, ZB]], c("#fbf6ea"), { swk: 0.5, bias: 6 });
  for (let x = X0; x <= X1; x += 1.2) w.line3([[x, H - 0.001, ZF], [x, H - 0.001, ZB]], c("#e2dccb"), null, { bias: 5, swk: 0.6 });
  for (let z = ZF; z <= ZB; z += 1.2) w.line3([[X0, H - 0.001, z], [X1, H - 0.001, z]], c("#e2dccb"), null, { bias: 5, swk: 0.6 });
  for (const [x, z] of [[-1.8, 1.5], [1.8, 1.5], [-1.8, 4.5], [1.8, 4.5]]) {
    w.box(x - 0.6, H - 0.08, z - 0.06, 1.2, 0.06, 0.12, c("#ffffff"));
    w.box(x - 0.55, H - 0.12, z - 0.04, 1.1, 0.04, 0.08, c("#fff6c8"), { swk: 0.4 });
  }
  // jendela di dinding samping (sisi kanan tampak murid = sisi kiri tampak guru)
  const WX = side === "murid" ? X1 - 0.01 : X0 + 0.01;
  for (const z of [0.8, 3.4, 6.0]) {
    w.face([[WX, 1.0, z - 0.8], [WX, 1.0, z + 0.8], [WX, 2.4, z + 0.8], [WX, 2.4, z - 0.8]], c("#a8d0e2"), { swk: 0.9, bias: 5 });
    w.line3([[WX, 1.0, z], [WX, 2.4, z]], c("#ffffff"), null, { bias: 4.9, swk: 1.6 });
    w.line3([[WX, 1.7, z - 0.8], [WX, 1.7, z + 0.8]], c("#ffffff"), null, { bias: 4.9, swk: 1.6 });
  }
  w.face([[X0, 0, ZB], [X1, 0, ZB], [X1, H, ZB], [X0, H, ZB]], wallCol, { swk: 0.6, bias: 3 });
  w.face([[X0, 0, ZB - 0.01], [X1, 0, ZB - 0.01], [X1, 0.15, ZB - 0.01], [X0, 0.15, ZB - 0.01]], c("#7a9a6e"), { stroke: false, bias: 2.9 });
}

// meja dua-orang + bangku panjang. facing: "cam" (tampak murid: meja di depan murid) | "away" (tampak guru: meja di balik murid)
function deskPair(w, xc, zSeat, facing) {
  const wood = c("#a8754a"), wood2 = c("#7d5434"), L = 1.8;
  const dz = facing === "cam" ? -0.42 : 0.42; // meja di sisi arah hadap murid
  const zd = zSeat + dz, zb = zSeat + (facing === "cam" ? 0.08 : -0.08);
  // bangku panjang. Tampak murid: di belakang/bawah badan. Tampak guru (dari belakang): bangku papan tertutup digambar
  // DI DEPAN punggung murid -> menutup pinggul & kaki (kaki ada di kolong meja) -> jelas terbaca duduk di bangku.
  if (facing === "cam") {
    w.box(xc - L / 2, SEAT - 0.05, zb - 0.15, L, 0.05, 0.3, wood, { bias: 0.35 });
    for (const dx of [-L / 2 + 0.06, L / 2 - 0.1]) w.box(xc + dx, 0, zb - 0.1, 0.05, SEAT - 0.05, 0.05, wood2, { bias: 0.35 });
  } else {
    // papan duduk tipis: tepi belakangnya digambar DI DEPAN pinggul murid (pinggul tampak menempel di papan), kaki bangku ke lantai
    const zf = zSeat - 0.12;
    w.box(xc - L / 2, SEAT - 0.06, zf, L, 0.05, 0.28, wood, { bias: 0.2 });
    w.face([[xc - L / 2, SEAT - 0.07, zf], [xc + L / 2, SEAT - 0.07, zf], [xc + L / 2, SEAT - 0.01, zf], [xc - L / 2, SEAT - 0.01, zf]], wood, { swk: 0.7, bias: -0.95 });
    for (const dx of [-L / 2 + 0.05, L / 2 - 0.1]) w.box(xc + dx, 0, zf + 0.02, 0.05, SEAT - 0.07, 0.05, wood2, { bias: -0.2 });
  }
  // meja: daun meja + panel depan (menutup kaki) + kaki meja; tampak murid digambar DI DEPAN murid yang duduk
  const b = facing === "cam" ? -0.3 : 0.1;
  w.box(xc - L / 2 - 0.05, DESK_H - 0.04, zd - 0.22, L + 0.1, 0.04, 0.44, wood, { bias: b });
  const zp = facing === "cam" ? zd - 0.2 : zd + 0.2;
  w.face([[xc - L / 2, 0.12, zp], [xc + L / 2, 0.12, zp], [xc + L / 2, DESK_H - 0.04, zp], [xc - L / 2, DESK_H - 0.04, zp]], wood2, { swk: 0.7, bias: b - 0.01 });
  for (const dx of [-L / 2, L / 2 - 0.05]) w.box(xc + dx, 0, zp - 0.02, 0.05, 0.14, 0.05, wood2, { bias: b - 0.02 });
}

function make(side) {
  const SEATS = side === "murid" ? SEATS_M : Object.fromEntries(Object.entries(SEATS_M).map(([k, v]) => [k, toGuru(v)]));
  const pairs = [[-1.3, 2.8], [1.3, 2.8], [-1.3, 4.4], [1.3, 4.4]].map((v) => (side === "murid" ? v : toGuru(v)));
  const extrasSeats = ["duduk_a", "duduk_b", "duduk_c", "duduk_d", "duduk_e"];
  const clip = side === "murid" ? "sit_idle" : "sit_back";
  return {
    id: side === "murid" ? "kelas" : "kelas_guru",
    name: side === "murid" ? "Kelas (hadap murid)" : "Kelas (hadap guru)",
    extrasStyle: "shadow", extrasBlur: 4.5,
    camera: { cam: { x: 0, y: 1.2, z: 0.2 }, f: 900, horizon: 0.47, fogStart: 60, vignette: true },
    cameraPortrait: side === "murid" ? { cam: { x: 0, y: 1.15, z: 0.0 }, f: 820, horizon: 0.47 } : { cam: { x: -0.3, y: 1.3, z: 0.4 }, f: 820, horizon: 0.47 },
    spots: {
      ...Object.fromEntries(Object.entries(SEATS).map(([k, [x, z]]) => [k, { x, z, seat: SEAT }])),
      ...(side === "guru" ? { depan_guru: { x: -0.9, z: 6.05 }, papan: { x: 0.2, z: 6.3 }, pintu: { x: -3.75, z: 7.8 } } : {}),
    },
    extras: extrasSeats.map((s, i) => ({ seed: 71 + i, kind: i % 2 ? "anak_perempuan" : "anak_laki", spec: `${clip}@${s}`, phase: i * 0.7 })),
    obstacles: [
      ...pairs.map(([x, z]) => ({ name: "meja murid", x0: x - 0.95, x1: x + 0.95, z0: z + (side === "murid" ? -0.66 : 0.18), z1: z + (side === "murid" ? -0.18 : 0.66) })),
      ...(side === "guru" ? [{ name: "meja guru", x0: TDESK.x0, x1: TDESK.x1, z0: TDESK.z0, z1: TDESK.z1 }, { name: "dinding depan", x0: -5, x1: 5, z0: 7.0, z1: 7.3 }]
        : [{ name: "dinding belakang", x0: -5, x1: 5, z0: 6.2, z1: 6.5 }, { name: "rak buku", x0: 2.6, x1: 4.0, z0: 5.7, z1: 6.15 }]),
    ],
    build(w, { t = 0 } = {}) {
      if (side === "murid") {
        const ZB = 6.2;
        room(w, t, { ZB, wallCol: c("#f3e7cf"), side });
        // dinding belakang kelas: jadwal piket, mading, jam, rak buku, tempat sampah
        w.face([[-3.6, 1.1, ZB - 0.02], [-1.9, 1.1, ZB - 0.02], [-1.9, 2.2, ZB - 0.02], [-3.6, 2.2, ZB - 0.02]], c("#e9d3a8"), { swk: 0.8, bias: 2.8 });
        w.text(-3.5, 1.85, -2.0, 2.12, ZB - 0.03, "JADWAL PIKET", { size: 0.5, bias: 2.7 });
        for (let k = 0; k < 4; k++) w.line3([[-3.45, 1.7 - k * 0.15, ZB - 0.03], [-2.05, 1.7 - k * 0.15, ZB - 0.03]], c("#8a7a5a"), null, { bias: 2.7, swk: 0.6 });
        w.face([[-1.2, 1.0, ZB - 0.02], [1.2, 1.0, ZB - 0.02], [1.2, 2.25, ZB - 0.02], [-1.2, 2.25, ZB - 0.02]], c("#c98b5a"), { swk: 0.8, bias: 2.8 });
        w.text(-1.1, 1.95, 1.1, 2.2, ZB - 0.03, "MADING KELAS 4", { size: 0.5, color: "#ffffff", bias: 2.7 });
        for (const [x, y, col] of [[-0.95, 1.15, "#fbe7a1"], [-0.3, 1.2, "#a8d0e2"], [0.35, 1.12, "#f7b6c2"], [-0.6, 1.55, "#ffffff"], [0.3, 1.55, "#b8e0a8"]])
          w.face([[x, y, ZB - 0.03], [x + 0.5, y, ZB - 0.03], [x + 0.5, y + 0.32, ZB - 0.03], [x, y + 0.32, ZB - 0.03]], c(col), { swk: 0.5, bias: 2.6 });
        w.sprite(0, ZB - 0.04, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy - p * 2.65})"><circle r="${p * 0.17}" fill="#ffffff" stroke="${lc}" stroke-width="${sw * 1.2}"/>
          <path d="M0,0 L0,${-p * 0.1}" stroke="${lc}" stroke-width="${sw * 1.2}"/><path d="M0,0 L${p * 0.08},0" stroke="${lc}" stroke-width="${sw}" transform="rotate(${(t * 6) % 360})"/></g>`, { bias: 2.6 });
        w.box(2.6, 0, ZB - 0.45, 1.4, 1.2, 0.42, c("#9a6a42"));
        for (let k = 0; k < 9; k++) w.prism(2.72 + k * 0.14, ZB - 0.25, 0.05, 0.62, 0.95 + (k % 3) * 0.06, 4, c(["#d8423a", "#3f86c4", "#f2c84b", "#4f9a5a"][k % 4]), { swk: 0.4 });
        LIFE.trashBin(w, -4.2, ZB - 0.35);
        for (const [x, zs] of pairs) deskPair(w, x, zs, "cam");
      } else {
        const ZB = 7.0, DX0 = -4.2, DX1 = -3.3, DH = 2.3;
        room(w, t, { ZB, wallCol: c("#f3e7cf"), side });
        // pintu depan (lubang terang + daun pintu terbuka)
        w.face([[DX0, 0, ZB - 0.015], [DX1, 0, ZB - 0.015], [DX1, DH, ZB - 0.015], [DX0, DH, ZB - 0.015]], c("#cfe6c4"), { swk: 0.6, bias: 2.8 });
        w.face([[DX1, 0, ZB - 0.02], [DX1 + 0.05, 0, ZB - 0.85], [DX1 + 0.05, DH, ZB - 0.85], [DX1, DH, ZB - 0.02]], c("#8a5a34"), { swk: 0.8, bias: 0.6 });
        w.line3([[DX0, 0, ZB - 0.02], [DX0, DH, ZB - 0.02], [DX1, DH, ZB - 0.02], [DX1, 0, ZB - 0.02]], c("#6b4426"), null, { bias: 2.6, swk: 2.2 });
        // papan tulis + tulisan kapur
        const BX0 = -1.6, BX1 = 1.9, BY0 = 1.0, BY1 = 2.25, bz = ZB - 0.03;
        w.face([[BX0 - 0.08, BY0 - 0.08, bz + 0.01], [BX1 + 0.08, BY0 - 0.08, bz + 0.01], [BX1 + 0.08, BY1 + 0.08, bz + 0.01], [BX0 - 0.08, BY1 + 0.08, bz + 0.01]], c("#9a6a42"), { swk: 0.8, bias: 2.8 });
        w.face([[BX0, BY0, bz], [BX1, BY0, bz], [BX1, BY1, bz], [BX0, BY1, bz]], c("#3d6b52"), { swk: 0.8, bias: 2.7 });
        w.text(BX0 + 0.15, BY1 - 0.42, BX1 - 0.15, BY1 - 0.1, bz - 0.01, "Kamis, 27 Nov", { size: 0.55, color: "#f2f2f2", bias: 2.6 });
        w.text(BX0 + 0.15, BY0 + 0.4, BX1 - 0.15, BY0 + 0.75, bz - 0.01, "PR: Hal. 12, no. 1-10", { size: 0.55, color: "#f2f2f2", bias: 2.6 });
        w.box(BX0, BY0 - 0.12, bz - 0.12, BX1 - BX0, 0.04, 0.12, c("#7d5434"));
        // Garuda di tengah atas diapit dua foto, poster ABC
        w.face([[0.0, 2.45, ZB - 0.02], [0.32, 2.45, ZB - 0.02], [0.32, 2.85, ZB - 0.02], [0.0, 2.85, ZB - 0.02]], c("#e0b13a"), { swk: 0.8, bias: 2.7 });
        w.text(0.0, 2.55, 0.32, 2.75, ZB - 0.03, "★", { size: 0.7, color: "#7a2f35", bias: 2.6 });
        for (const x of [-0.55, 0.62]) w.face([[x, 2.45, ZB - 0.02], [x + 0.25, 2.45, ZB - 0.02], [x + 0.25, 2.8, ZB - 0.02], [x, 2.8, ZB - 0.02]], c("#d9d2c0"), { swk: 0.7, bias: 2.7 });
        w.face([[2.5, 1.2, ZB - 0.02], [3.3, 1.2, ZB - 0.02], [3.3, 2.2, ZB - 0.02], [2.5, 2.2, ZB - 0.02]], c("#fbe7a1"), { swk: 0.7, bias: 2.7 });
        w.text(2.55, 1.6, 3.25, 1.95, ZB - 0.03, "A B C", { size: 0.5, bias: 2.6 });
        w.text(2.55, 1.3, 3.25, 1.55, ZB - 0.03, "1 2 3", { size: 0.5, bias: 2.6 });
        // meja guru + kursi + vas bunga + tumpukan buku
        const T = TDESK, wood = c("#9a6a42"), wood2 = c("#7d5434");
        w.box(-2.55, 0, 6.35, 0.5, 0.45, 0.45, wood); w.box(-2.55, 0.45, 6.75, 0.5, 0.5, 0.05, wood);
        w.box(T.x0, T.h - 0.05, T.z0, T.x1 - T.x0, 0.05, T.z1 - T.z0, wood);
        w.box(T.x0, 0.12, T.z0, T.x1 - T.x0, T.h - 0.17, 0.04, wood2);
        for (const x of [T.x0, T.x1 - 0.06]) w.box(x, 0, T.z0, 0.06, T.h - 0.05, 0.06, wood2);
        w.prism(-2.75, 5.85, 0.06, T.h, T.h + 0.16, 8, c("#9fd3f0"), { swk: 0.5 });
        w.sprite(-2.75, 5.85, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy})">${[[-0.06, -0.24], [0.05, -0.27], [0, -0.3]].map(([dx, dy]) => `<circle cx="${dx * p}" cy="${dy * p}" r="${p * 0.04}" fill="${c("#f2a3ae")}" stroke="${lc}" stroke-width="${sw * 0.6}"/>`).join("")}</g>`, { y: T.h, bias: -0.06 });
        for (let k = 0; k < 3; k++) w.box(-1.95, T.h + k * 0.04, 5.95, 0.18, 0.04, 0.14, c(["#f4f4f4", "#e0b13a", "#4f9a5a"][k]), { swk: 0.4 });
        for (const [x, zs] of pairs) deskPair(w, x, zs, "away");
      }
    },
  };
}
module.exports = make("murid");
module.exports.make = make;
module.exports.toGuru = toGuru;
module.exports.TDESK = TDESK;
