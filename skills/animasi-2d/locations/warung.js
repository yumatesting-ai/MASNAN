// Lokasi: WARUNG BUK ATIN — warung kampung semi-permanen: dinding papan, atap seng, emperan terpal belang,
// renceng sachet kopi, etalase kayu berkaca, rak barang, termos es, bale bambu & bangku kayu, galon & tabung gas.
const P = require("../engine/props.js");

module.exports = {
  id: "warung",
  name: "Warung Buk Atin",
  camera: { cam: { x: 0.3, y: 1.5, z: -3.2 }, f: 1250, horizon: 0.44 },
  spots: {
    balik_etalase: { x: 0.7, z: 9.25 }, // di belakang etalase (badan bawah tertutup etalase)
    depan: { x: 0.4, z: 5.2 }, bangku: { x: -2.6, z: 5.4 }, meja: { x: -1.2, z: 5.0 },
    jalan_kiri: { x: -3.6, z: 2.6 }, jalan_kanan: { x: 3.4, z: 2.8 }, samping: { x: 3.6, z: 7 },
  },
  build(w, { t = 0 } = {}) {
    P.sky(w, { clouds: [[0.2, 0.1, 1], [0.78, 0.08, 1.2]] });
    // jalan cor melintang di depan + tanah halaman
    w.ground([[-30, 0, 0.6], [30, 0, 0.6], [30, 0, 3.4], [-30, 0, 3.4]], P.PAL.concrete, { stroke: false });
    for (let x = -30; x < 30; x += 3) w.line3([[x, 0.002, 0.6], [x, 0.002, 3.4]], P.PAL.crack, null, { layer: "ground", bias: -0.1, swk: 0.5 });
    w.ground([[-30, 0, 3.4], [30, 0, 3.4], [30, 0, 40], [-30, 0, 40]], P.PAL.dirt, { stroke: false, bias: -0.04 });
    w.ground([[-5, 0.01, 6.6], [5, 0.01, 6.6], [5, 0.01, 12], [-5, 0.01, 12]], "#c0c0c0", { bias: -0.2 });

    // rumah tetangga & pepohonan
    P.house(w, { side: 1, fx: 7.2, z: 6, width: 7, wall: "plank", roof: "seng" });
    P.house(w, { side: -1, fx: -7.2, z: 5, width: 7, wall: "plaster", wallColor: "#d6d6d6" });
    P.tree(w, -6.2, 4.2, { h: 3.6, kind: "banana" });
    P.tree(w, -8.5, 16, { h: 7.5, kind: "palm" });
    P.tree(w, 9.5, 18, { h: 5.5 });
    P.poles(w, 6.0, [2.2, 30], 7);
    P.chicken(w, 4.8, 4.2, { t, kind: "betina", flip: true });

    // ---- bangunan warung ----
    const x0 = -4.5, x1 = 4.5, z0 = 8, z1 = 12.5, H = 3.0;
    const plank = P.PAL.plank;
    // dinding belakang (bagian dalam) + rak kayu berisi barang
    w.face([[x0, 0, z1 - 0.3], [x1, 0, z1 - 0.3], [x1, H, z1 - 0.3], [x0, H, z1 - 0.3]], "#9e9e9e");
    w.texture((u, v) => [x0 + u, v, z1 - 0.31], x1 - x0, H, "plank", { color: "#7d7d7d" });
    for (let r = 0; r < 4; r++) {
      const y = 0.6 + r * 0.55;
      w.box(x0 + 0.3, y, z1 - 0.8, x1 - x0 - 0.6, 0.05, 0.5, "#7f7f7f");
      for (let k = 0; k < 16; k++) {
        const bx = x0 + 0.45 + k * 0.5, bh = 0.22 + ((k * 7 + r * 3) % 4) * 0.06;
        w.box(bx, y + 0.05, z1 - 0.7, 0.32, bh, 0.3, ["#f0f0f0", "#c4c4c4", "#d8d8d8", "#a9a9a9"][(k + r) % 4], { swk: 0.5 });
      }
    }
    // dinding samping papan
    w.box(x0, 0, z0, 0.2, H, z1 - z0, plank);
    w.box(x1 - 0.2, 0, z0, 0.2, H, z1 - z0, plank);
    w.texture((u, v) => [x1 - 0.21, v, z0 + u], z1 - z0, H, "plank", { color: "#7d7d7d" });
    // tiang kayu depan
    w.box(x0, 0, z0, 0.25, H, 0.25, P.PAL.wood);
    w.box(x1 - 0.25, 0, z0, 0.25, H, 0.25, P.PAL.wood);
    w.gable(x0, H, z0, x1 - x0, z1 - z0, 1.3, P.PAL.seng, { ridge: "x", overhang: 0.4, wall: plank, seng: true });
    // papan nama kayu tulisan tangan
    w.box(-2.6, H - 0.05, z0 - 0.3, 5.2, 0.7, 0.06, "#f0f0f0");
    w.text(-2.5, H, 2.5, H + 0.6, z0 - 0.31, "WARUNG BU ATIN", { size: 0.62 });
    // emperan terpal belang
    const ty0 = H - 0.2, ty1 = 2.15, tz1 = 5.6;
    for (let i = 0; i < 12; i++) {
      const a = x0 + ((x1 - x0) * i) / 12, b = x0 + ((x1 - x0) * (i + 1)) / 12;
      w.face([[a, ty0, z0 - 0.06], [b, ty0, z0 - 0.06], [b, ty1, tz1], [a, ty1, tz1]], i % 2 ? "#f0f0f0" : "#9c9c9c", { swk: 0.6, bias: 0.4 });
    }
    w.box(x0 + 0.05, 0, tz1 - 0.05, 0.1, ty1, 0.1, P.PAL.bambooPole);
    w.box(x1 - 0.15, 0, tz1 - 0.05, 0.1, ty1, 0.1, P.PAL.bambooPole);
    // renceng sachet kopi bergantungan di emperan
    for (let i = 0; i < 9; i++) {
      const sx = x0 + 0.8 + i * 0.95, zs = z0 - 0.15;
      for (let j = 0; j < 5; j++) {
        const y = H - 0.35 - j * 0.2;
        w.face([[sx - 0.12, y, zs], [sx + 0.12, y, zs], [sx + 0.12, y - 0.18, zs], [sx - 0.12, y - 0.18, zs]], j % 2 ? "#5d5d5d" : "#dcdcdc", { swk: 0.4 });
      }
    }
    // etalase kayu berkaca
    w.box(-2.6, 0, 8.6, 5.2, 0.78, 0.7, P.PAL.woodLight, { faces: { front: "#c7c7c7" } });
    w.box(-2.6, 0, 8.58, 5.2, 0.25, 0.02, P.PAL.wood);
    w.box(-2.6, 0.78, 8.6, 5.2, 0.06, 0.7, P.PAL.wood);
    for (let k = 0; k < 6; k++) w.box(-2.3 + k * 0.85, 0.3, 8.75, 0.5, 0.3, 0.3, k % 2 ? "#ededed" : "#9a9a9a", { swk: 0.4 });
    // toples kerupuk di atas etalase
    for (const kx of [-2.2, -1.5, 2.1]) w.prism(kx, 8.95, 0.2, 0.84, 1.28, 8, "#e9e9e9", { capColor: "#6a6a6a" });
    // termos es (cooler) & galon & tabung gas
    w.box(3.0, 0, 9.2, 0.8, 0.6, 0.55, "#e9e9e9");
    w.box(2.95, 0.6, 9.15, 0.9, 0.1, 0.65, "#9a9a9a");
    w.prism(-3.6, 9.3, 0.18, 0, 0.5, 10, "#7a7a7a");
    w.prism(-3.6, 9.3, 0.2, 0.5, 0.95, 10, "#d9d9d9");
    w.prism(-3.1, 9.3, 0.17, 0, 0.42, 10, "#9a9a9a");
    // teras: bale bambu, meja & bangku kayu, kopi
    P.bale(w, -4.2, 6.2, 1.8, 0.9);
    P.table(w, -1.9, 6.3, 1.5, 0.6);
    P.bench(w, -1.9, 5.5, 1.6);
    P.glassOfCoffee(w, -1.5, 0.78, 6.6);
    P.glassOfCoffee(w, -0.9, 0.78, 6.55);
    // papan menu kapur
    w.box(2.5, 0, 6.2, 1.1, 1.25, 0.06, "#4a4a4a");
    w.text(2.55, 0.82, 3.55, 1.15, 6.19, "KOPI 3RB", { size: 0.6, color: "#f4f4f4" });
    w.text(2.55, 0.42, 3.55, 0.76, 6.19, "MIE · ES", { size: 0.6, color: "#f4f4f4" });
  },
};
