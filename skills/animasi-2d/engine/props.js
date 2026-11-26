// Perlengkapan lingkungan PERKAMPUNGAN Indonesia untuk world3d (satuan meter, grayscale seri).
// Gaya sederhana & tidak modern: jalan cor retak, rumah tembok kusam / papan kayu / bilik bambu,
// atap genteng atau seng, pagar bambu / tanaman, pohon pisang-kelapa-mangga, jemuran, tiang listrik kayu.
const { mul, mix, LINE } = require("./world3d.js");

const PAL_ABU = {
  sky: "#eeeeee", skyTop: "#d9d9d9", cloud: "#fbfbfb",
  concrete: "#b4b4b4", crack: "#8e8e8e", dirt: "#c6c6c6", dirtDark: "#b6b6b6", grass: "#b9b9b9", grassDark: "#adadad",
  asphalt: "#8c8c8c", gutter: "#7a7a7a", paving: "#cdcdcd",
  wallA: "#e6e6e6", wallB: "#dadada", wallC: "#cfcfcf", plank: "#a9a9a9", bamboo: "#c4c4c4",
  roof: "#6d6d6d", roofB: "#7c7c7c", seng: "#a3a3a3",
  door: "#8a8a8a", shutter: "#9a9a9a", glass: "#c3c3c3", frame: "#555555",
  trunk: "#6b6b6b", leaf: "#949494", leafB: "#a3a3a3", banana: "#9c9c9c", wood: "#8a8a8a", woodLight: "#a8a8a8",
  bambooPole: "#b0b0b0",
};
// palet berwarna (WARNA=1): kampung tropis cerah
const PAL_WARNA = {
  sky: "#e8f4f8", skyTop: "#6bb2e6", cloud: "#ffffff",
  concrete: "#c4beb2", crack: "#938c7f", dirt: "#dcc6a0", dirtDark: "#cdb48c", grass: "#97c46c", grassDark: "#80b157",
  asphalt: "#6f7275", gutter: "#5f6366", paving: "#ddd3c4",
  wallA: "#f3e7cf", wallB: "#e8d4b2", wallC: "#dac9a6", plank: "#b88c5e", bamboo: "#dcc489",
  roof: "#b9573a", roofB: "#c8693f", seng: "#9eabb3",
  door: "#7b5336", shutter: "#8fa2ae", glass: "#a8d0e2", frame: "#4b3a2b",
  trunk: "#7c5a3a", leaf: "#5c9d47", leafB: "#78b75a", banana: "#7bb95a", wood: "#8d5f3c", woodLight: "#b3845b",
  bambooPole: "#cbab6b",
};
const THEME = require("./theme.js");
const PAL = THEME.COLOR ? PAL_WARNA : PAL_ABU;
const SKYC = THEME.COLOR
  ? { cloudLine: "#bcd6e8", farTree: "#b7d2bf", farPalm: "#b2cdb9", farRoof: "#d8c9b8", hill1: "#c6dccf", hill2: "#b9d3c3" }
  : { cloudLine: "#cfcfcf", farTree: "#d6d6d6", farPalm: "#d2d2d2", farRoof: "#dcdcdc", hill1: "#e3e3e3", hill2: "#dbdbdb" };


// mode warna: abu-abu bawaan pohon/semak/rumput dipetakan ke hijau daun & coklat batang (fungsi fog dibungkus)
const TREE_TINT = { "#7d7d7d": "#8a6240", "#5f5f5f": "#6e4a2e", "#555555": "#5a3d26", "#8a8a8a": "#9c7b52", "#6f6f6f": "#e2a33a",
  "#5c5c5c": "#7a5a2e", "#9e9e9e": "#5f9f48", "#858585": "#4a8a3a", "#b4b4b4": "#82bf60", "#6e6e6e": "#3f7a32", "#7f7f7f": "#4f8f3c",
  "#9a9a9a": "#62a44a", "#a8a8a8": "#76b358", "#6a6a6a": "#3f7a32", "#4f4f4f": "#8a7a42", "#5a5a5a": "#3f7a32",
  "#b9b9b9": "#b5cf4c", "#a5a5a5": "#93b23c", "#d6d6d6": "#e3ef9a", "#4c4c4c": "#3d3a2a", "#5e5e5e": "#8a2f45", "#6c6c6c": "#5f1f30", "#8b8b8b": "#6f8a3a",
  "#a3a3a3": "#6fb052", "#8c8c8c": "#579a43", "#b2b2b2": "#86c463", "#777777": "#8a6a44", "#7a7a7a": "#7f6340" };
const BUSH_TINT = { "#6e6e6e": "#3f7a32", "#828282": "#4c8c3c", "#999999": "#5f9f48", "#b0b0b0": "#7cba5b" };
const GRASS_TINT = { "#9c9c9c": "#6aa84a", "#ababab": "#7fbb59" };
const tint = (fog, map) => (THEME.COLOR ? (c) => fog(map[c] || c) : fog);

// ---------- langit & latar jauh ----------
function sky(w, o = {}) {
  const { W, H, hy } = w;
  const clouds = (o.clouds || [[0.15, 0.12, 1], [0.55, 0.07, 1.3], [0.85, 0.16, 0.9]]).map(([cx, cy, s]) => {
    const x = cx * W, y = cy * H, r = 38 * s;
    return `<path d="M${x - r * 2.2},${y + r * 0.6} C${x - r * 2.4},${y - r * 0.2} ${x - r * 1.4},${y - r * 0.6} ${x - r * 0.9},${y - r * 0.2}
        C${x - r * 0.6},${y - r * 1.1} ${x + r * 0.7},${y - r * 1.1} ${x + r * 0.9},${y - r * 0.2}
        C${x + r * 1.6},${y - r * 0.5} ${x + r * 2.5},${y} ${x + r * 2.2},${y + r * 0.6} Z" fill="${PAL.cloud}" stroke="${SKYC.cloudLine}" stroke-width="2"/>`;
  }).join("");
  // siluet pepohonan (kelapa, rimbun) & atap jauh di garis cakrawala
  let far = "", x = -20, seed = o.seed || 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  while (x < W + 20) {
    const bw = 30 + rnd() * 50, bh = 14 + rnd() * 26, r = rnd();
    if (r < 0.45) far += `<circle cx="${x + bw / 2}" cy="${hy - bh * 0.7}" r="${bh}" fill="${SKYC.farTree}"/>`;
    else if (r < 0.65) far += `<path d="M${x + bw / 2},${hy} L${x + bw / 2},${hy - bh * 2.4}" stroke="${SKYC.farPalm}" stroke-width="3"/>
      <path d="M${x + bw / 2},${hy - bh * 2.4} q-18,-4 -30,10 M${x + bw / 2},${hy - bh * 2.4} q18,-4 30,10 M${x + bw / 2},${hy - bh * 2.4} q-6,-14 -22,-14 M${x + bw / 2},${hy - bh * 2.4} q6,-14 22,-14" stroke="${SKYC.farPalm}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    else far += `<path d="M${x},${hy} L${x},${hy - bh} L${x + bw / 2},${hy - bh - 12} L${x + bw},${hy - bh} L${x + bw},${hy} Z" fill="${SKYC.farRoof}"/>`;
    x += bw + rnd() * 10;
  }
  // perbukitan berlapis di kejauhan (makin jauh makin terang)
  const hill = (amp, base, col, ph) => {
    let d = `M0,${hy}`;
    for (let i = 0; i <= 24; i++) { const xx = (i / 24) * W; d += ` L${xx.toFixed(0)},${(hy - base - amp * (0.5 + 0.5 * Math.sin(i * 0.9 + ph)) * (0.6 + 0.4 * Math.sin(i * 0.37 + ph * 2))).toFixed(1)}`; }
    return `<path d="${d} L${W},${hy} Z" fill="${col}"/>`;
  };
  const hills = o.hills === false ? "" : hill(H * 0.06, H * 0.03, SKYC.hill1, 1.3) + hill(H * 0.04, H * 0.012, SKYC.hill2, 3.1);
  // mode warna: matahari bercahaya di kiri atas (searah cahaya & bayangan), gunung biru jauh, burung terbang
  let extra = "";
  if (THEME.COLOR) {
    const T = w.t || 0, sx = W * 0.14, sy = Math.max(H * 0.07, hy * 0.28);
    const mount = (amp, base, col, ph, n = 9) => { let d = `M0,${hy}`; for (let i = 0; i <= n; i++) { const xx = (i / n) * W; d += ` L${xx.toFixed(0)},${(hy - base - amp * Math.abs(Math.sin(i * 1.3 + ph)) * (0.7 + 0.3 * Math.sin(i * 0.5 + ph))).toFixed(1)}`; } return `<path d="${d} L${W},${hy} Z" fill="${col}"/>`; };
    const birds = [0, 1, 2, 3].map((k) => { const bx = ((W * (0.3 + k * 0.17) + T * 22 * (1 + k * 0.15)) % (W * 1.2)) - W * 0.1, by = hy * (0.3 + 0.1 * Math.sin(k * 2.1)) + 6 * Math.sin(T * 1.3 + k), f = 5 + 3 * Math.sin(T * 9 + k * 1.7), s2 = 7 + k;
      return `<path d="M${(bx - s2).toFixed(1)},${(by - f * 0.4).toFixed(1)} Q${(bx - s2 * 0.4).toFixed(1)},${(by - f).toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)} Q${(bx + s2 * 0.4).toFixed(1)},${(by - f).toFixed(1)} ${(bx + s2).toFixed(1)},${(by - f * 0.4).toFixed(1)}" fill="none" stroke="#5f7d93" stroke-width="2" stroke-linecap="round"/>`; }).join("");
    extra = `<defs><radialGradient id="sunG"><stop offset="0" stop-color="#fffbe6" stop-opacity="1"/><stop offset="0.25" stop-color="#fff3c4" stop-opacity="0.9"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs>
      <circle cx="${sx}" cy="${sy}" r="${H * 0.2}" fill="url(#sunG)"/><circle cx="${sx}" cy="${sy}" r="${H * 0.035}" fill="#fffdf0"/>
      ${mount(H * 0.09, H * 0.04, "#b4cfe0", 0.4, 7)}${mount(H * 0.06, H * 0.02, "#a8c8d8", 2.2, 11)}${birds}`;
  }
  w.add("sky", 1e9, `<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PAL.skyTop}"/>${THEME.COLOR ? `<stop offset="0.55" stop-color="#b3dbf4"/>` : ""}<stop offset="1" stop-color="${PAL.sky}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#skyg)"/>${extra}${clouds}${hills}
    ${o.skyline === false ? "" : far}
    <rect y="${hy}" width="${W}" height="${H - hy}" fill="${o.groundColor || PAL.dirt}"/>`);
}

// bidang tanah sepanjang Z dipotong-potong agar kabut bertambah sesuai jarak
function strip(w, x0, x1, z0, z1, color, o = {}) {
  let z = z0;
  while (z < z1) {
    const step = Math.max(1.5, z * 0.12), zb = Math.min(z1, z + step);
    const zo = Math.min(z1, zb + step * 0.06); // sedikit tumpang-tindih: tanpa celah garis
    w.ground([[x0, o.y || 0, z], [x1, o.y || 0, z], [x1, o.y || 0, zo], [x0, o.y || 0, zo]], color, Object.assign({ stroke: false }, o));
    z = zb;
  }
}

// ---------- detail tanah: kerikil & petak tanah (mengisi area depan yang kosong) ----------
function groundDetail(w, x0, x1, z0, z1, n = 40, seed = 1) {
  const r = treeRng(seed + x0 * 3.1 + z0 * 1.7);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), s = 0.04 + r() * 0.07;
    const pts = []; for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; pts.push([x + Math.cos(a) * s * (0.8 + r() * 0.4), 0.003, z + Math.sin(a) * s * 0.7]); }
    w.ground(pts, r() < 0.5 ? (THEME.COLOR ? "#a69c8d" : "#a9a9a9") : (THEME.COLOR ? "#dcd3c4" : "#d3d3d3"), { bias: -0.4, swk: 0.45 });
  }
  for (let i = 0; i < Math.max(2, n / 10); i++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), rr = 0.3 + r() * 0.5, pts = [];
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; pts.push([x + Math.cos(a) * rr * (0.75 + r() * 0.4), 0.002, z + Math.sin(a) * rr * 0.6 * (0.75 + r() * 0.4)]); }
    w.ground(pts, THEME.COLOR ? "#cdb58f" : "#bdbdbd", { stroke: false, bias: -0.3 });
  }
  if (THEME.COLOR) for (let i = 0; i < n / 2; i++) { // daun gugur (hijau tua, kuning, coklat)
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0), a = r() * Math.PI, L = 0.07 + r() * 0.05;
    const pts = [[x - Math.cos(a) * L, 0.004, z - Math.sin(a) * L * 0.6], [x + Math.sin(a) * L * 0.35, 0.004, z - Math.cos(a) * L * 0.2], [x + Math.cos(a) * L, 0.004, z + Math.sin(a) * L * 0.6], [x - Math.sin(a) * L * 0.35, 0.004, z + Math.cos(a) * L * 0.2]];
    w.ground(pts, ["#c9a03a", "#a8743a", "#7aa84a", "#d08a3a"][Math.floor(r() * 4)], { bias: -0.45, swk: 0.35 });
  }
}

// ---------- jalan kampung: cor semen retak, pinggir tanah & rumput liar ----------
function villageRoad(w, o = {}) {
  const hw = o.halfWidth ?? 1.7, z0 = o.z0 ?? 0.6, z1 = o.z1 ?? 110;
  strip(w, -hw, hw, z0, z1, PAL.concrete);
  for (let z = z0 + 2; z < z1; z += 3) w.line3([[-hw, 0.002, z], [hw, 0.002, z]], PAL.crack, null, { layer: "ground", bias: -0.1, swk: 0.5 });
  const cracks = [[-0.6, 3.2, 0.5, 4.4], [0.4, 6.5, -0.2, 7.8], [-1.1, 10, -0.4, 11.4], [0.9, 15, 0.2, 16.5], [-0.3, 22, 0.6, 23]];
  for (const [xa, za, xb, zb] of cracks) w.line3([[xa, 0.003, za], [(xa + xb) / 2 + 0.2, 0.003, (za + zb) / 2], [xb, 0.003, zb]], "#7c7c7c", null, { layer: "ground", bias: -0.2, swk: 0.6 });
  for (const [x, z, r] of [[0.7, 8.6, 0.35], [-0.9, 18, 0.5], [0.3, 30, 0.6]]) {
    const pts = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; pts.push([x + r * Math.cos(a) * (1 + 0.2 * Math.sin(a * 3)), 0.004, z + r * 0.6 * Math.sin(a)]); }
    w.ground(pts, "#9e9e9e", { bias: -0.3, swk: 0.6 });
  }
  groundDetail(w, -hw - 1.2, -hw, z0 + 1, 18, 26, 3);
  groundDetail(w, hw, hw + 1.2, z0 + 1, 18, 26, 5);
  for (const s of [-1, 1]) {
    strip(w, Math.min(s * hw, s * (hw + 1.2)), Math.max(s * hw, s * (hw + 1.2)), z0, z1, PAL.dirtDark, { bias: -0.05 });
    strip(w, Math.min(s * (hw + 1.2), s * 40), Math.max(s * (hw + 1.2), s * 40), z0, z1, PAL.grass, { bias: -0.04 });
    // tepi jalan: rumput liar, sesekali semak
    let k = 0;
    for (let z = z0 + 2.4; z < Math.min(z1, 40); z += 1.4 + ((z * 7) % 3) * 0.35, k++) {
      const ex = s * (hw + 0.25 + ((z * 13) % 10) / 12);
      grassTuft(w, ex, z);
      if (k % 5 === 2 && z > 5) bush(w, s * (hw + 1.6 + ((z * 3) % 5) / 10), z + 0.4, 0.45 + ((z * 7) % 3) * 0.08);
    }
  }
}
// ---------- rumah kampung (fasad menghadap jalan) ----------
// side -1 = kiri jalan (fasad di x=fx menghadap +X), +1 = kanan
// wall: "plaster" | "plank" | "bamboo"; roof: "genteng" | "seng"; teras/bale: bool; fence: "bamboo" | "bush" | null
function house(w, o) {
  const side = o.side, fx = o.fx, z0 = o.z, Wd = o.width || 6.5, D = o.depth || 7, Hh = o.height || 2.9, rh = o.roofH || 1.8;
  const kind = o.wall || "plaster";
  // mode warna: tiap rumah kampung beda warna (dinding pastel, pintu, kusen, tirai, genteng) dipilih dari seed posisi
  const hr = treeRng(Math.abs(o.z * 7.1 + o.fx * 3.3) + 1), pick = (a) => a[Math.floor(hr() * a.length) % a.length];
  const HC = THEME.COLOR ? {
    wall: pick(["#f3e7cf", "#d8ead2", "#d4e5f1", "#f6e2b0", "#f1d3c2", "#e6dcee", "#f4efe4"]),
    plank: pick(["#b88c5e", "#a97c50", "#c39a6b"]), bamboo: pick(["#dcc489", "#d2b878"]),
    door: pick(["#7b5336", "#3f6e8c", "#2f6b4f", "#8c3b2f", "#5a6f3a"]), shutter: pick(["#3f7f8f", "#2f6b4f", "#8c5a2b", "#a2463a", "#4a6a9a"]),
    curtain: pick(["#f2a7a0", "#f4d06f", "#9fc9e8", "#b8e0a8", "#e3b5e0"]), roof: pick(["#b9573a", "#a84b32", "#c9683f", "#9c5440"]), base: "#b9aea0",
  } : null;
  const wallCol = o.wallColor && !HC ? o.wallColor : (kind === "plank" ? (HC ? HC.plank : PAL.plank) : kind === "bamboo" ? (HC ? HC.bamboo : PAL.bamboo) : (HC ? HC.wall : o.wallColor || PAL.wallA));
  const x = side < 0 ? fx - D : fx;
  w.box(x, 0, z0, D, 0.35, Wd, HC ? HC.base : "#bdbdbd");
  w.box(x, 0.35, z0, D, Hh - 0.35, Wd, wallCol);
  const seng = o.roof === "seng";
  w.gable(x, Hh, z0, D, Wd, rh, seng ? PAL.seng : (o.roofColor || (HC ? HC.roof : PAL.roof)), { ridge: "x", overhang: 0.5, wall: wallCol, tiles: seng ? 0 : 6, seng });
  const fxx = fx - side * 0.02;
  if (kind !== "plaster") {
    const col = kind === "plank" ? "#7d7d7d" : "#9a9a9a";
    w.texture((u, v) => [fxx, 0.35 + v, z0 + u], Wd, Hh - 0.35, kind, { color: col });
    if (w.cam.z < z0) w.texture((u, v) => [x + u, 0.35 + v, z0 - 0.02], D, Hh - 0.35, kind, { color: col });
  } else {
    w.face([[fxx, 0.35, z0 + 0.2], [fxx, 0.35, z0 + Wd - 0.2], [fxx, 0.9, z0 + Wd - 0.2], [fxx, 0.6, z0 + 0.2]], mul(wallCol, 0.93), { stroke: false, bias: -0.005 });
  }
  const fq = (za, zb, ya, yb, col, extra = {}) => w.face([[fxx, ya, za], [fxx, ya, zb], [fxx, yb, zb], [fxx, yb, za]], col, Object.assign({ swk: 0.8, bias: -0.02 }, extra));
  // bayangan di bawah tepi atap + gelap di kaki dinding (oklusi) -> bangunan lebih "berdiri"
  w.poly([[fxx, Hh - 0.5, z0], [fxx, Hh - 0.5, z0 + Wd], [fxx, Hh, z0 + Wd], [fxx, Hh, z0]], mul(wallCol, 0.8), { stroke: false, bias: -0.012 });
  w.poly([[fxx, 0.35, z0], [fxx, 0.35, z0 + Wd], [fxx, 0.6, z0 + Wd], [fxx, 0.6, z0]], mul(wallCol, 0.9), { stroke: false, bias: -0.011 });
  if (w.cam.z < z0) w.poly([[x, Hh - 0.45, z0 - 0.015], [x + D, Hh - 0.45, z0 - 0.015], [x + D, Hh, z0 - 0.015], [x, Hh, z0 - 0.015]], mul(wallCol, 0.82), { stroke: false, bias: -0.012 });
  // pintu kayu
  fq(z0 + 1.0, z0 + 1.9, 0.35, 2.3, HC ? HC.door : PAL.door);
  // jendela kayu + daun jendela terbuka
  const wz0 = z0 + 2.5, wz1 = z0 + 3.6;
  fq(wz0, wz1, 1.0, 2.0, PAL.glass);
  if (HC) { // tirai kain di balik kaca, dibuka ke samping
    fq(wz0 + 0.04, wz0 + 0.32, 1.04, 1.96, HC.curtain, { stroke: false, bias: -0.03 });
    fq(wz1 - 0.32, wz1 - 0.04, 1.04, 1.96, HC.curtain, { stroke: false, bias: -0.03 });
  }
  w.line3([[fxx, 1.0, (wz0 + wz1) / 2], [fxx, 2.0, (wz0 + wz1) / 2]], PAL.frame, null, { bias: -0.05 });
  w.line3([[fxx, 1.5, wz0], [fxx, 1.5, wz1]], PAL.frame, null, { bias: -0.05 });
  const ox = fxx - side * 0.35;
  w.face([[fxx, 1.0, wz0], [ox, 1.0, wz0 - 0.4], [ox, 2.0, wz0 - 0.4], [fxx, 2.0, wz0]], HC ? HC.shutter : PAL.shutter, { swk: 0.7, bias: -0.04 });
  w.face([[fxx, 1.0, wz1], [ox, 1.0, wz1 + 0.4], [ox, 2.0, wz1 + 0.4], [fxx, 2.0, wz1]], HC ? HC.shutter : PAL.shutter, { swk: 0.7, bias: -0.04 });
  for (let i = 0; i < 4; i++) fq(z0 + 1.0 + i * 0.7, z0 + 1.3 + i * 0.7, 2.5, 2.7, "#8f8f8f", { swk: 0.5 });
  // teras: lantai + atap emperan + tiang kayu (+ bale-bale)
  if (o.teras) {
    const tx = side < 0 ? fx : fx - 2.2;
    w.box(tx, 0, z0 + 0.4, 2.2, 0.3, Wd - 0.8, "#c9c9c9");
    const eo = side < 0 ? fx + 2.3 : fx - 2.3;
    w.face([[fx, Hh - 0.1, z0 + 0.2], [fx, Hh - 0.1, z0 + Wd - 0.2], [eo, 2.35, z0 + Wd - 0.2], [eo, 2.35, z0 + 0.2]], seng ? PAL.seng : PAL.roof, { swk: 0.8 });
    const px = side < 0 ? fx + 2.05 : fx - 2.15;
    for (const pz of [z0 + 0.45, z0 + Wd - 0.55]) w.box(px, 0.3, pz, 0.12, 2.05, 0.12, PAL.wood);
    if (o.bale) bale(w, side < 0 ? fx + 0.4 : fx - 1.9, z0 + 2.2, 1.5, 1.0);
  }
  if (o.fence === "bamboo") bambooFence(w, side < 0 ? fx + 3.2 : fx - 3.2, z0, z0 + Wd);
  if (o.fence === "bush") for (let z = z0 + 0.4; z < z0 + Wd; z += 0.9) bush(w, side < 0 ? fx + 3.2 : fx - 3.2, z);
  if (o.jemuran) jemuran(w, side < 0 ? fx + 2.6 : fx - 2.6, z0 + Wd + 0.4, z0 + Wd + 3.4);
}

// ---------- pagar & tanaman ----------
function bambooFence(w, x, za, zb) {
  for (let z = za; z <= zb; z += 0.22) w.box(x - 0.04, 0, z, 0.08, 0.95 + ((Math.round(z * 37)) % 3) * 0.04, 0.08, PAL.bambooPole, { swk: 0.6 });
  w.box(x - 0.08, 0.7, za, 0.06, 0.06, zb - za, "#9a9a9a", { swk: 0.6 });
}
// rumput liar: helai melengkung meruncing, bergoyang pelan (w.t)
function grassTuft(w, x, z, o = {}) {
  const T = w.t || 0, seed = x * 17.3 + z * 5.1;
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    fog = tint(fog, GRASS_TINT);
    const r = treeRng(seed), H = (o.h || 0.22 + r() * 0.12) * p, n = 5 + Math.floor(r() * 3);
    const sway = Math.sin(T * 2 + seed) * 0.12;
    let blades = "";
    for (let i = 0; i < n; i++) {
      const bx = (i / (n - 1) - 0.5) * H * 0.9, lean = (i / (n - 1) - 0.5) * 0.9 + sway + (r() - 0.5) * 0.3, bh = H * (0.6 + r() * 0.5), bw = H * 0.07;
      const tx = bx + lean * bh, ty = -bh;
      blades += `<path d="M${(bx - bw).toFixed(1)},0 Q${(bx + lean * bh * 0.3).toFixed(1)},${(-bh * 0.6).toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)} Q${(bx + lean * bh * 0.4 + bw).toFixed(1)},${(-bh * 0.5).toFixed(1)} ${(bx + bw).toFixed(1)},0 Z" fill="${fog(i % 2 ? "#9c9c9c" : "#ababab")}"/>`;
    }
    return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})" stroke="${lc}" stroke-width="${(sw * 0.55).toFixed(2)}" stroke-linejoin="round">${blades}</g>`;
  }, { layer: o.layer || "ground", bias: -0.5 });
}

// semak: tajuk bergelombang berarsir + tekstur daun, opsional berbunga (kembang sepatu / bugenvil)
function bush(w, x, z, r0 = 0.55, o = {}) {
  const seed = x * 11.1 + z * 3.7 + r0, T = w.t || 0;
  if (w.castBlob) w.castBlob(x, z, r0 * 0.9, r0 * 1.1, { strength: 0.8 });
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    fog = tint(fog, BUSH_TINT);
    const r = treeRng(seed), R = r0 * p, flowers = !!o.flowers; // bunga dimatikan secara bawaan
    const sway = Math.sin(T * 1.6 + seed) * 1.2;
    const cy = -R * 0.85;
    const body = cloudPath(0, cy, R * 1.15, R * 0.9, 9, r, 0.22);
    const dark = cloudPath(R * 0.25, cy + R * 0.35, R * 0.95, R * 0.6, 8, r, 0.2);
    const lite = cloudPath(-R * 0.35, cy - R * 0.35, R * 0.55, R * 0.38, 7, r, 0.2);
    const id = `bs${Math.round(Math.abs(seed) * 100)}`;
    const tufts = Array.from({ length: 8 }, () => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.8, px = Math.cos(a) * R * 1.1 * d, py = cy + Math.sin(a) * R * 0.85 * d, s = R * 0.13;
      return `M${(px - s).toFixed(1)},${py.toFixed(1)} q${s.toFixed(1)},${(-s * 1.2).toFixed(1)} ${(s * 2).toFixed(1)},0`;
    }).join(" ");
    const fl = flowers ? Array.from({ length: 5 }, () => {
      const a = r() * Math.PI * 2, d = 0.3 + r() * 0.6, fx = Math.cos(a) * R * 1.0 * d, fy = cy + Math.sin(a) * R * 0.75 * d - R * 0.1;
      return flower(fx, fy, R * 0.16, fog, lc, sw, r() < 0.5 ? "#f6f6f6" : "#d0d0d0");
    }).join("") : "";
    return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${sway.toFixed(2)} 0 0)" stroke="${lc}" stroke-width="${sw}" stroke-linejoin="round">
      <ellipse cx="0" cy="0" rx="${(R * 1.2).toFixed(1)}" ry="${(R * 0.18).toFixed(1)}" fill="rgba(0,0,0,0.12)" stroke="none"/>
      <clipPath id="${id}"><path d="${body}"/></clipPath>
      <path d="${body}" fill="${fog("#999999")}" stroke="none"/>
      <path clip-path="url(#${id})" d="${dark}" fill="${fog("#828282")}" stroke="none"/>
      <path clip-path="url(#${id})" d="${lite}" fill="${fog("#b0b0b0")}" stroke="none"/>
      <path clip-path="url(#${id})" d="${tufts}" fill="none" stroke="${fog("#6e6e6e")}" stroke-width="${sw * 0.7}" stroke-linecap="round"/>
      <path d="${body}" fill="none"/>
      ${fl}</g>`;
  }, { bias: o.bias || 0 });
}
// satu kuntum bunga 5 kelopak (koordinat piksel)
function flower(fx, fy, s, fog, lc, sw, col) {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return `<ellipse cx="${(fx + Math.cos(a) * s * 0.55).toFixed(1)}" cy="${(fy + Math.sin(a) * s * 0.55).toFixed(1)}" rx="${(s * 0.42).toFixed(1)}" ry="${(s * 0.3).toFixed(1)}" transform="rotate(${((a * 180) / Math.PI).toFixed(0)} ${(fx + Math.cos(a) * s * 0.55).toFixed(1)} ${(fy + Math.sin(a) * s * 0.55).toFixed(1)})" fill="${fog(col)}"/>`;
  }).join("");
  return `<g stroke="${lc}" stroke-width="${(sw * 0.5).toFixed(2)}">${petals}<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="${(s * 0.2).toFixed(1)}" fill="${fog("#555555")}"/></g>`;
}
// rumpun bunga liar di pinggir jalan: batang + daun + beberapa kuntum
function flowerClump(w, x, z, o = {}) {
  const seed = x * 7.7 + z * 13.1, T = w.t || 0;
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const r = treeRng(seed), H = (o.h || 0.35 + r() * 0.2) * p, n = 3 + Math.floor(r() * 3), sway = Math.sin(T * 1.8 + seed) * 0.1;
    let stems = "", leaves = "", heads = "";
    for (let i = 0; i < n; i++) {
      const bx = (i - (n - 1) / 2) * H * 0.14, lean = (i - (n - 1) / 2) * 0.18 + sway, hh = H * (0.7 + r() * 0.35);
      const tx = bx + lean * hh, ty = -hh;
      stems += `M${bx.toFixed(1)},0 Q${(bx + lean * hh * 0.2).toFixed(1)},${(-hh * 0.6).toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)} `;
      const ly = -hh * (0.3 + r() * 0.2), ls = H * 0.16, dir = i % 2 ? 1 : -1;
      leaves += `<path d="M${(bx + lean * hh * 0.25).toFixed(1)},${ly.toFixed(1)} q${(dir * ls).toFixed(1)},${(-ls * 0.9).toFixed(1)} ${(dir * ls * 1.6).toFixed(1)},${(-ls * 0.2).toFixed(1)} q${(-dir * ls * 0.8).toFixed(1)},${(ls * 0.5).toFixed(1)} ${(-dir * ls * 1.6).toFixed(1)},${(ls * 0.2).toFixed(1)} Z" fill="${fog("#9a9a9a")}"/>`;
      heads += flower(tx, ty, H * (0.16 + r() * 0.05), fog, lc, sw, o.color || (r() < 0.5 ? "#f6f6f6" : "#cfcfcf"));
    }
    return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})" stroke="${lc}" stroke-width="${(sw * 0.6).toFixed(2)}" stroke-linejoin="round">
      <path d="${stems}" fill="none" stroke="${fog("#6f6f6f")}" stroke-width="${(sw * 0.9).toFixed(2)}" stroke-linecap="round"/>${leaves}${heads}</g>`;
  }, { bias: o.bias || -0.2 });
}
// tanaman dalam pot kaleng/ember bekas (khas kampung)
function potPlant(w, x, z, o = {}) {
  const seed = x * 9.9 + z * 2.3;
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const r = treeRng(seed), s = p * (o.size || 0.35), kind = o.pot || (r() < 0.5 ? "kaleng" : "ember");
    const pot = kind === "kaleng"
      ? `<path d="M${-s * 0.35},${-s * 0.55} L${s * 0.35},${-s * 0.55} L${s * 0.32},0 L${-s * 0.32},0 Z" fill="${fog("#a9a9a9")}"/>
         <path d="M${-s * 0.34},${-s * 0.4} L${s * 0.34},${-s * 0.4} M${-s * 0.33},${-s * 0.15} L${s * 0.33},${-s * 0.15}" fill="none" stroke="${fog("#7f7f7f")}"/>`
      : `<path d="M${-s * 0.42},${-s * 0.55} L${s * 0.42},${-s * 0.55} L${s * 0.32},0 L${-s * 0.32},0 Z" fill="${fog("#7a7a7a")}"/>
         <path d="M${-s * 0.42},${-s * 0.55} Q0,${-s * 0.85} ${s * 0.42},${-s * 0.55}" fill="none" stroke="${fog("#555555")}"/>`;
    const leaves = Array.from({ length: 6 }, (_, i) => {
      const a = (-150 + i * 24 + (r() - 0.5) * 10) * Math.PI / 180, L = s * (0.55 + r() * 0.35);
      const ex = Math.cos(a) * L, ey = -s * 0.55 + Math.sin(a) * L;
      return `<path d="M0,${-s * 0.55} Q${(ex * 0.3 - s * 0.12).toFixed(1)},${((ey - s * 0.55) / 2).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} Q${(ex * 0.5 + s * 0.12).toFixed(1)},${((ey - s * 0.4) / 2).toFixed(1)} 0,${-s * 0.55} Z" fill="${fog(i % 2 ? "#9a9a9a" : "#acacac")}"/>`;
    }).join("");
    const fl = r() < 0.6 ? flower(s * 0.1, -s * 1.15, s * 0.28, fog, lc, sw, "#f4f4f4") : "";
    return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})" stroke="${lc}" stroke-width="${(sw * 0.8).toFixed(2)}" stroke-linejoin="round">
      <ellipse cx="0" cy="0" rx="${s * 0.45}" ry="${s * 0.08}" fill="rgba(0,0,0,0.13)" stroke="none"/>${leaves}${pot}${fl}</g>`;
  }, { bias: o.bias || -0.1, y: o.y || 0 });
}

// ---------- pohon (sprite berarsir, bergoyang tertiup angin) ----------
// kind: "round" (pohon rindang/mangga), "palm" (kelapa), "banana" (pisang). Waktu animasi diambil dari w.t.
function treeRng(seed) {
  let s = (Math.abs(Math.round(seed * 1000)) * 2654435761) >>> 0 || 7;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
// garis luar bergelombang seperti awan (tajuk daun)
function cloudPath(cx, cy, rx, ry, n, r, amp = 0.16) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.2;
    const k = 1 - amp * 0.5 + r() * amp * 0.6;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const ox = (mx - cx) * (0.22 + r() * 0.12), oy = (my - cy) * (0.22 + r() * 0.12);
    d += ` Q${(mx + ox).toFixed(1)},${(my + oy).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d + " Z";
}
function tree(w, x, z, o = {}) {
  const h = o.h || 5.5, kind = o.kind || "round";
  const seed = x * 13.7 + z * 7.3 + h;
  const T = w.t || 0;
  if (w.castBlob) {
    if (kind === "round") w.castBlob(x, z, h * 0.75, h * 0.34, { trunk: h * 0.05 });
    else if (kind === "palm") w.castBlob(x, z, h, h * 0.3, { trunk: h * 0.035 });
    else w.castBlob(x, z, h * 0.75, h * 0.32, { trunk: h * 0.06 });
  }
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    fog = tint(fog, TREE_TINT);
    const r = treeRng(seed);
    const id = `tr${Math.round(Math.abs(seed) * 100)}`;
    const P = (v) => (v * p).toFixed(1);
    const sway = Math.sin(T * 1.3 + seed) * 1.6 + Math.sin(T * 2.7 + seed * 2) * 0.5; // derajat
    const shadow = `<ellipse cx="0" cy="0" rx="${P(h * (kind === "round" ? 0.32 : 0.2))}" ry="${P(0.16)}" fill="rgba(0,0,0,0.13)" stroke="none"/>`;
    const L = `stroke="${lc}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
    let out = "";

    if (kind === "round") {
      const tw = h * 0.055, th = h * 0.42;
      const trunkD = `M${P(-tw * 1.9)},0 C${P(-tw * 1.1)},${P(-0.12)} ${P(-tw)},${P(-h * 0.12)} ${P(-tw * 0.85)},${P(-th)}
        L${P(tw * 0.85)},${P(-th)} C${P(tw)},${P(-h * 0.12)} ${P(tw * 1.1)},${P(-0.12)} ${P(tw * 1.9)},0 Z`;
      const branches = `M0,${P(-th * 0.92)} C${P(-h * 0.05)},${P(-h * 0.48)} ${P(-h * 0.12)},${P(-h * 0.55)} ${P(-h * 0.2)},${P(-h * 0.66)}
        M0,${P(-th * 0.95)} C${P(h * 0.05)},${P(-h * 0.5)} ${P(h * 0.11)},${P(-h * 0.57)} ${P(h * 0.17)},${P(-h * 0.7)}
        M0,${P(-th)} L${P(h * 0.01)},${P(-h * 0.72)}`;
      const bark = Array.from({ length: 5 }, (_, i) => `M${P((r() - 0.5) * tw * 1.2)},${P(-h * (0.08 + i * 0.09))} l0,${P(-h * 0.05)}`).join(" ");
      const cx = 0, cy = -h * 0.75, rx = h * 0.38, ry = h * 0.26;
      const canopy = cloudPath(cx * p, cy * p, rx * p, ry * p, 13, r);
      const dark = cloudPath((cx + rx * 0.25) * p, (cy + ry * 0.35) * p, rx * 0.85 * p, ry * 0.75 * p, 11, r, 0.2);
      const lite = cloudPath((cx - rx * 0.3) * p, (cy - ry * 0.35) * p, rx * 0.5 * p, ry * 0.42 * p, 9, r, 0.2);
      const tufts = Array.from({ length: 22 }, () => {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.85;
        const px = (cx + Math.cos(a) * rx * d) * p, py = (cy + Math.sin(a) * ry * d) * p, s = h * 0.035 * p;
        return `M${(px - s).toFixed(1)},${py.toFixed(1)} q${s.toFixed(1)},${(-s * 1.2).toFixed(1)} ${(s * 2).toFixed(1)},0`;
      }).join(" ");
      const fruits = o.fruit === false ? "" : Array.from({ length: 4 }, () => {
        const fx = (cx + (r() - 0.5) * rx * 1.2) * p, fy = (cy + ry * (0.25 + r() * 0.45)) * p, fr = h * 0.022 * p;
        return `<path d="M${fx.toFixed(1)},${(fy - fr).toFixed(1)} l0,${(-fr * 0.8).toFixed(1)}" ${L} fill="none"/>
          <ellipse cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" rx="${(fr * 0.8).toFixed(1)}" ry="${fr.toFixed(1)}" fill="${fog("#6f6f6f")}" ${L}/>`;
      }).join("");
      out = `${shadow}
        <path d="${trunkD}" fill="${fog("#7d7d7d")}" ${L}/>
        <clipPath id="${id}t"><path d="${trunkD}"/></clipPath>
        <rect clip-path="url(#${id}t)" x="0" y="${P(-h)}" width="${P(tw * 2)}" height="${P(h)}" fill="${fog("#5f5f5f")}" opacity="0.7"/>
        <path d="${bark}" fill="none" stroke="${fog("#555555")}" stroke-width="${sw * 0.7}" stroke-linecap="round"/>
        <path d="${branches}" fill="none" stroke="${lc}" stroke-width="${(tw * 0.9 * p + sw * 2).toFixed(1)}" stroke-linecap="round"/>
        <path d="${branches}" fill="none" stroke="${fog("#7d7d7d")}" stroke-width="${(tw * 0.9 * p).toFixed(1)}" stroke-linecap="round"/>
        <g transform="rotate(${sway.toFixed(2)} 0 ${P(-th)})">
          <clipPath id="${id}c"><path d="${canopy}"/></clipPath>
          <path d="${canopy}" fill="${fog("#9e9e9e")}"/>
          <path clip-path="url(#${id}c)" d="${dark}" fill="${fog("#858585")}"/>
          <path clip-path="url(#${id}c)" d="${lite}" fill="${fog("#b4b4b4")}"/>
          <path clip-path="url(#${id}c)" d="${tufts}" fill="none" stroke="${fog("#6e6e6e")}" stroke-width="${sw * 0.75}" stroke-linecap="round"/>
          <path d="${canopy}" fill="none" ${L}/>
          ${fruits}
        </g>`;
    } else if (kind === "palm") {
      const lean = (o.lean ?? (r() - 0.5) * 0.5) * h, tb = h * 0.05, tt = h * 0.032;
      const top = [lean + Math.sin(T * 1.1 + seed) * h * 0.008, -h];
      const bez = (t) => { const u = 1 - t; return [3 * u * t * t * lean * 0.9 + t * t * t * top[0], -(3 * u * u * t * h * 0.3 + 3 * u * t * t * h * 0.75 + t * t * t * h)]; };
      const left = [], right = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12, [bx, by] = bez(t), wd = tb + (tt - tb) * t; left.push([bx - wd, by]); right.push([bx + wd, by]); }
      const trunkD = "M" + [...left, ...right.reverse()].map(([a, b]) => `${P(a)},${P(b)}`).join(" L") + " Z";
      const rings = Array.from({ length: 11 }, (_, i) => { const t = (i + 0.6) / 12, [bx, by] = bez(t), wd = tb + (tt - tb) * t; return `M${P(bx - wd)},${P(by)} Q${P(bx)},${P(by + 0.06)} ${P(bx + wd)},${P(by)}`; }).join(" ");
      // pelepah: pita melengkung meruncing + celah antar anak daun (garis warna langit)
      const frond = (ang, len, droop, col) => {
        const a = (ang * Math.PI) / 180, segs = 14, pts = [];
        for (let i = 0; i <= segs; i++) {
          const t = i / segs;
          pts.push([top[0] + Math.cos(a) * len * t, top[1] - Math.sin(a) * len * t * (1 - 0.35 * t) + droop * t * t]);
        }
        const L1 = [], R1 = [], cuts = [];
        for (let i = 0; i <= segs; i++) {
          const [x0, y0] = pts[Math.max(0, i - 1)], [x1, y1] = pts[Math.min(segs, i + 1)];
          const dx = x1 - x0, dy = y1 - y0, m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m;
          const t = i / segs, wd = len * 0.13 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + len * 0.01;
          const [px, py] = pts[i];
          L1.push([px + nx * wd, py + ny * wd + wd * 0.5]); R1.push([px - nx * wd, py - ny * wd + wd * 0.5]);
          if (i > 1 && i < segs) cuts.push(`M${P(px)},${P(py)} L${P(px + nx * wd * 1.05 - dx * 0.1)},${P(py + ny * wd * 1.05 + wd * 0.5)} M${P(px)},${P(py)} L${P(px - nx * wd * 1.05 - dx * 0.1)},${P(py - ny * wd * 1.05 + wd * 0.5)}`);
        }
        const body = "M" + [...L1, ...R1.reverse()].map(([a2, b2]) => `${P(a2)},${P(b2)}`).join(" L") + " Z";
        const mid = "M" + pts.map(([a2, b2]) => `${P(a2)},${P(b2)}`).join(" L");
        return `<path d="${body}" fill="${fog(col)}" ${L} stroke-width="${sw * 0.8}"/>
          <path d="${cuts.join(" ")}" fill="none" stroke="${fog("#eeeeee")}" stroke-width="${sw * 0.9}"/>
          <path d="${mid}" fill="none" stroke="${fog("#5a5a5a")}" stroke-width="${sw * 0.8}"/>`;
      };
      const sw2 = Math.sin(T * 1.4 + seed) * 6;
      const back = [[140 + sw2, h * 0.34, h * 0.08], [40 + sw2, h * 0.34, h * 0.08], [92 + sw2 * 0.5, h * 0.24, h * 0.02]].map(([a, l, d]) => frond(a, l, d, "#7f7f7f")).join("");
      const front = [[175 + sw2, h * 0.42, h * 0.26], [5 + sw2, h * 0.42, h * 0.26], [205 + sw2, h * 0.32, h * 0.3], [-25 + sw2, h * 0.32, h * 0.3]]
        .map(([a, l, d], i) => frond(a, l, d, i % 2 ? "#9a9a9a" : "#a8a8a8")).join("");
      const nuts = [[-0.11, 0.1], [0.1, 0.12], [0, 0.17], [-0.05, 0.05]].map(([dx, dy]) =>
        `<circle cx="${P(top[0] + dx * h * 0.5)}" cy="${P(top[1] + dy * h * 0.35)}" r="${P(h * 0.03)}" fill="${fog("#5c5c5c")}" ${L} stroke-width="${sw * 0.8}"/>`).join("");
      out = `${shadow}<path d="${trunkD}" fill="${fog("#8a8a8a")}" ${L}/>
        <path d="${rings}" fill="none" stroke="${fog("#5f5f5f")}" stroke-width="${sw * 0.7}"/>
        ${back}${nuts}${front}`;
    } else if (kind === "banana") {
      const sh = h * 0.62, sw0 = h * 0.07;
      const stem = `M${P(-sw0)},0 C${P(-sw0)},${P(-sh * 0.4)} ${P(-sw0 * 0.75)},${P(-sh * 0.8)} ${P(-sw0 * 0.6)},${P(-sh)} L${P(sw0 * 0.6)},${P(-sh)} C${P(sw0 * 0.75)},${P(-sh * 0.8)} ${P(sw0)},${P(-sh * 0.4)} ${P(sw0)},0 Z`;
      const sheaths = `M${P(-sw0 * 0.4)},0 C${P(-sw0 * 0.3)},${P(-sh * 0.4)} ${P(-sw0 * 0.2)},${P(-sh * 0.7)} ${P(-sw0 * 0.1)},${P(-sh)}
        M${P(sw0 * 0.35)},0 C${P(sw0 * 0.3)},${P(-sh * 0.5)} ${P(sw0 * 0.25)},${P(-sh * 0.75)} ${P(sw0 * 0.2)},${P(-sh * 0.95)}`;
      // daun pisang: lebar, melengkung menjuntai, tulang daun, sobekan (celah warna langit)
      const leaf = (ang, len, droop, col, torn, dead) => {
        const a = (ang * Math.PI) / 180, base = [0, -sh * 0.97], segs = 12, mid = [];
        for (let i = 0; i <= segs; i++) {
          const t = i / segs;
          mid.push([base[0] + Math.cos(a) * len * t, base[1] - Math.sin(a) * len * t + droop * t * t * 1.4 - len * 0.25 * Math.sin(Math.PI * t) * Math.max(0, Math.sin(a))]);
        }
        const up = [], dn = [], cuts = [];
        for (let i = 0; i <= segs; i++) {
          const [x0, y0] = mid[Math.max(0, i - 1)], [x1, y1] = mid[Math.min(segs, i + 1)];
          const dx = x1 - x0, dy = y1 - y0, m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m;
          const t = i / segs, wd = len * (dead ? 0.07 : 0.17) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.7);
          const [px, py] = mid[i];
          up.push([px + nx * wd, py + ny * wd]); dn.push([px - nx * wd, py - ny * wd]);
          if (torn && i > 2 && i < segs - 1 && i % 2 === 0) {
            const sgn = i % 4 === 0 ? 1 : -1;
            cuts.push(`M${P(px + nx * wd * 1.1 * sgn)},${P(py + ny * wd * 1.1 * sgn)} L${P(px + nx * wd * 0.2 * sgn - dx * 0.15)},${P(py + ny * wd * 0.2 * sgn - dy * 0.15)}`);
          }
        }
        const body = "M" + [...up, ...dn.reverse()].map(([a2, b2]) => `${P(a2)},${P(b2)}`).join(" L") + " Z";
        const rib = "M" + mid.map(([a2, b2]) => `${P(a2)},${P(b2)}`).join(" L");
        const veins = mid.filter((_, i) => i > 0 && i < segs && i % 2).map(([px, py], k) => `M${P(px)},${P(py)} l${P(0.06)},${P(-0.08)}`).join(" ");
        return `<path d="${body}" fill="${fog(col)}" ${L}/>
          <path d="${rib}" fill="none" stroke="${fog(dead ? "#4f4f4f" : "#6a6a6a")}" stroke-width="${sw * 0.9}"/>
          ${cuts.length ? `<path d="${cuts.join(" ")}" fill="none" stroke="${fog("#eeeeee")}" stroke-width="${sw * 1.3}"/>` : ""}`;
      };
      const s2 = Math.sin(T * 1.5 + seed) * 4;
      // TANDAN PISANG: tangkai melengkung keluar dari pucuk lalu menjuntai; sisir bertingkat (makin bawah makin kecil),
      // buah berbentuk sabit melengkung KE ATAS dengan ujung gelap & kilap; jantung pisang di ujung tangkai.
      const sway2 = Math.sin(T * 1.2 + seed) * h * 0.004;
      const top0 = [0, -sh * 0.95], hang = [h * 0.15 + sway2, -sh * 0.86], tip = [h * 0.16 + sway2 * 2, -sh * 0.86 + h * 0.21];
      const stalk = `M${P(top0[0])},${P(top0[1])} Q${P(h * 0.13)},${P(-sh * 1.02)} ${P(hang[0])},${P(hang[1])} Q${P(h * 0.17)},${P(-sh * 0.86 + h * 0.1)} ${P(tip[0])},${P(tip[1])}`;
      const finger = (bx0, by0, dir, len, back) => { // sabit: pangkal di tangkai, melengkung keluar lalu ke atas
        const tx = bx0 + dir * len * 0.6, ty = by0 - len * 0.66, th = len * 0.34;
        const c1x = bx0 + dir * len * 0.72, c1y = by0 + len * 0.1;            // tepi luar (perut buah)
        const c2x = bx0 + dir * len * 0.28, c2y = by0 - len * 0.18;           // tepi dalam
        const body = `M${P(bx0)},${P(by0 + th * 0.35)} Q${P(c1x)},${P(c1y)} ${P(tx)},${P(ty)} Q${P(c2x)},${P(c2y)} ${P(bx0)},${P(by0 - th * 0.45)} Z`;
        const hl = `M${P(bx0 + dir * len * 0.14)},${P(by0 + th * 0.05)} Q${P(c1x - dir * len * 0.12)},${P(c1y - len * 0.1)} ${P(tx - dir * len * 0.06)},${P(ty + len * 0.16)}`;
        return `<path d="${body}" fill="${fog(back ? "#a5a5a5" : "#b9b9b9")}" ${L} stroke-width="${sw * 0.7}"/>
          ${back ? "" : `<path d="${hl}" fill="none" stroke="${fog("#d6d6d6")}" stroke-width="${sw * 0.6}" stroke-linecap="round" opacity="0.8"/>`}
          <circle cx="${P(tx)}" cy="${P(ty)}" r="${P(len * 0.035)}" fill="${fog("#4c4c4c")}"/>`;
      };
      let backF = "", frontF = "";
      const tiers = 4;
      for (let r2 = 0; r2 < tiers; r2++) {
        const k = r2 / (tiers - 1), ty0 = hang[1] + h * (0.035 + 0.036 * r2), tx0 = hang[0] + (tip[0] - hang[0]) * (0.1 + 0.3 * k);
        const len = h * (0.085 - 0.013 * r2);
        for (const [dx, dir, back] of [[-0.016, -1, true], [0.016, 1, true], [-0.004, -1, true], [0.004, 1, true], [-0.011, -1, false], [0.011, 1, false], [-0.002, -1, false], [0.003, 1, false]]) {
          const f = finger(tx0 + dx * h, ty0, dir, len * (back ? 0.9 : 1), back);
          if (back) backF += f; else frontF += f;
        }
      }
      // jantung pisang (merah keunguan) + kelopak
      const hx = tip[0], hyy = tip[1];
      const heart = `<path d="M${P(hx)},${P(hyy - h * 0.025)} c${P(-h * 0.048)},${P(h * 0.03)} ${P(-h * 0.042)},${P(h * 0.11)} 0,${P(h * 0.135)} c${P(h * 0.042)},${P(-h * 0.025)} ${P(h * 0.048)},${P(-h * 0.105)} 0,${P(-h * 0.135)} Z" fill="${fog("#5e5e5e")}" ${L}/>
        <path d="M${P(hx)},${P(hyy + h * 0.005)} c${P(-h * 0.03)},${P(h * 0.03)} ${P(-h * 0.02)},${P(h * 0.07)} ${P(h * 0.002)},${P(h * 0.09)} M${P(hx)},${P(hyy + h * 0.03)} c${P(h * 0.025)},${P(h * 0.02)} ${P(h * 0.02)},${P(h * 0.05)} 0,${P(h * 0.075)}" fill="none" stroke="${fog("#6c6c6c")}" stroke-width="${sw * 0.7}"/>`;
      out = `${shadow}
        ${leaf(-60 + s2 * 0.3, h * 0.4, h * 0.25, "#777777", false, true)}
        ${leaf(150 + s2, h * 0.52, h * 0.35, "#8c8c8c", true)}${leaf(30 + s2, h * 0.52, h * 0.35, "#8c8c8c", true)}
        <path d="${stem}" fill="${fog("#a3a3a3")}" ${L}/>
        <path d="${sheaths}" fill="none" stroke="${fog("#7a7a7a")}" stroke-width="${sw * 0.7}"/>
        ${backF}
        <path d="${stalk}" fill="none" stroke="${lc}" stroke-width="${(sw * 3.2).toFixed(2)}" stroke-linecap="round"/>
        <path d="${stalk}" fill="none" stroke="${fog("#8b8b8b")}" stroke-width="${(sw * 1.8).toFixed(2)}" stroke-linecap="round"/>
        ${frontF}${heart}
        ${leaf(125 + s2, h * 0.5, h * 0.18, "#a3a3a3", true)}${leaf(55 + s2, h * 0.5, h * 0.18, "#a3a3a3", false)}
        ${leaf(95 + s2 * 0.5, h * 0.4, h * 0.02, "#b2b2b2", true)}`;
    }
    return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})">${out}</g>`;
  }, { bias: o.bias || 0 });
}
// jemuran: dua tiang bambu + tali + pakaian
function jemuran(w, x, za, zb) {
  for (const z of [za, zb]) w.box(x - 0.04, 0, z, 0.08, 1.9, 0.08, PAL.bambooPole);
  w.line3([[x, 1.85, za], [x, 1.85, zb]], "#4a4a4a", null, { sag: 0.12 });
  const clothes = THEME.COLOR ? [["#f2f2f2", 0.6, 0.7], ["#d84a4a", 0.45, 0.5], ["#4a7fc4", 0.7, 0.8], ["#f2c14e", 0.5, 0.55], ["#3f8a5a", 0.55, 0.9]]
    : [["#f2f2f2", 0.6, 0.7], ["#7a7a7a", 0.45, 0.5], ["#cfcfcf", 0.7, 0.8], ["#9e9e9e", 0.5, 0.55]];
  const T = w.t || 0;
  let z = za + 0.3;
  for (const [c, wd, ht] of clothes) {
    if (z + wd > zb - 0.1) break;
    const y = 1.82 - 0.06 * Math.sin(((z - za) / (zb - za)) * Math.PI);
    const sw2 = 0.07 * Math.sin(T * 2.1 + z * 1.7); // baju bergoyang tertiup angin
    w.face([[x, y, z], [x, y, z + wd], [x + sw2, y - ht, z + wd + sw2 * 0.5], [x + sw2, y - ht, z + sw2 * 0.5]], c, { swk: 0.6, bias: -0.03 });
    z += wd + 0.2;
  }
}
// bale-bale bambu (tempat duduk)
function bale(w, x, z, sx = 1.8, sz = 1.0) {
  w.box(x, 0.4, z, sx, 0.08, sz, PAL.bamboo);
  for (let k = 1; k < 8; k++) w.line3([[x + (sx * k) / 8, 0.481, z], [x + (sx * k) / 8, 0.481, z + sz]], "#8f8f8f", null, { bias: -0.02, swk: 0.5 });
  for (const dx of [0.05, sx - 0.13]) for (const dz of [0.05, sz - 0.13]) w.box(x + dx, 0, z + dz, 0.08, 0.4, 0.08, PAL.bambooPole);
}

// ---------- tiang listrik kayu + kabel semrawut ----------
function poles(w, x, zs, h = 7) {
  for (const z of zs) {
    w.box(x - 0.09, 0, z, 0.18, h, 0.18, "#8f8f8f");
    w.box(x - 0.6, h - 0.5, z, 1.2, 0.1, 0.1, "#7a7a7a");
  }
  for (let i = 0; i < zs.length - 1; i++) {
    for (const [dx, dy, sag] of [[-0.5, -0.45, 0.7], [0, -0.15, 0.5], [0.5, -0.45, 0.9], [0.2, -0.9, 1.2]]) {
      w.line3([[x + dx, h + dy, zs[i]], [x + dx, h + dy, zs[i + 1]]], "#3a3a3a", null, { sag });
    }
  }
}
// lampu bohlam di tiang bambu
function bulbLamp(w, x, z, h = 3.2) {
  w.box(x - 0.05, 0, z, 0.1, h, 0.1, PAL.bambooPole);
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy - h * p})" stroke="${lc}" stroke-width="${sw}">
    <path d="M${-0.25 * p},0 L${0.25 * p},0 L${0.18 * p},${0.12 * p} L${-0.18 * p},${0.12 * p} Z" fill="${fog("#6a6a6a")}"/>
    <circle cx="0" cy="${0.2 * p}" r="${0.08 * p}" fill="#ffffff"/></g>`, { bias: -0.1 });
}

// ---------- gapura kampung (tembok bercat belang) ----------
function gapura(w, z, line1, line2, o = {}) {
  const hw = o.halfWidth ?? 2.6, H = o.height ?? 3.6;
  for (const s of [-1, 1]) {
    const x = s < 0 ? -hw - 0.6 : hw;
    w.box(x, 0, z, 0.6, H, 0.6, "#eeeeee");
    for (let y = 0.2; y < H - 0.3; y += 0.6) w.face([[x, y, z - 0.01], [x + 0.6, y, z - 0.01], [x + 0.6, y + 0.3, z - 0.01], [x, y + 0.3, z - 0.01]], "#8a8a8a", { swk: 0.5, bias: -0.02 });
    w.hip(x - 0.05, H, z - 0.05, 0.7, 0.7, 0.6, PAL.roof, { overhang: 0.08 });
  }
  w.box(-hw, H - 1.1, z + 0.05, hw * 2, 0.95, 0.4, "#f2f2f2");
  w.text(-hw + 0.15, H - 0.62, hw - 0.15, H - 0.22, z + 0.04, line1, { size: 0.75 });
  if (line2) w.text(-hw + 0.3, H - 1.02, hw - 0.3, H - 0.68, z + 0.04, line2, { size: 0.65 });
}

// ---------- perabot ----------
function bench(w, x, z, len = 2.2, o = {}) {
  const c = o.color || PAL.wood;
  w.box(x, 0.42, z, len, 0.07, 0.42, c);
  for (const dx of [0.1, len - 0.18]) for (const dz of [0.05, 0.3]) w.box(x + dx, 0, z + dz, 0.08, 0.42, 0.08, mul(c, 0.85));
}
function table(w, x, z, sx = 1.2, sz = 0.7) {
  w.box(x, 0.72, z, sx, 0.06, sz, PAL.woodLight);
  for (const dx of [0.06, sx - 0.12]) for (const dz of [0.06, sz - 0.12]) w.box(x + dx, 0, z + dz, 0.06, 0.72, 0.06, PAL.wood);
}
function glassOfCoffee(w, x, y, z) {
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.11;
    return `<g transform="translate(${sx} ${sy})"><path d="M${-s * 0.35},${-s} L${s * 0.35},${-s} L${s * 0.28},0 L${-s * 0.28},0 Z" fill="${fog("#5a5a5a")}" stroke="${lc}" stroke-width="${sw * 0.6}"/>
      <path d="M${-s * 0.1},${-s * 1.2} q${s * 0.1},${-s * 0.3} 0,${-s * 0.6}" fill="none" stroke="#bbbbbb" stroke-width="${sw * 0.6}" stroke-linecap="round"/></g>`;
  }, { y, bias: -0.5 });
}
// ayam kampung beranimasi (sprite). 1 satuan = 1 cm, menghadap kanan (flip = kiri).
// o: { flip, t (detik), phase (detik), kind: "jago" | "betina" }
// Siklus 3.2 dtk: jalan di tempat (kepala maju-mundur) -> mematuk tanah 2x -> diam sambil menengok.
function chickenPose(t) {
  const u = ((t % 3.2) + 3.2) % 3.2, TAU = Math.PI * 2;
  const smooth = (k) => k * k * (3 - 2 * k);
  let head = 0, bob = 0, legA = 0, legB = 0, nod = 0, look = 1;
  if (u < 1.0) { // jalan di tempat
    const s = Math.sin(TAU * u * 2);
    legA = s; legB = -s; bob = Math.abs(s) * 1.2; nod = 3 * Math.sin(TAU * u * 2 + 0.6);
  } else if (u < 2.0) { // mematuk 2x
    const k = (u - 1.0) / 1.0, peck = Math.max(0, Math.sin(Math.PI * ((k * 2) % 1)));
    head = 62 * smooth(Math.min(1, peck * 1.6));
  } else { // diam, menengok cepat
    look = u < 2.5 ? 1 : u < 2.9 ? -1 : 1;
    head = -6;
  }
  return { head, bob, legA, legB, nod, look };
}
// ---------- bola sepak (segilima hitam + jahitan, berputar saat menggelinding, bayangan di tanah) ----------
let ballId = 0;
function ball(w, x, z, o = {}) {
  const R = o.r || 0.11, y = o.y || 0, spin = o.spin || 0;
  // bayangan kontak di tanah: mengecil & memudar saat bola melambung
  const sk = 1 / (1 + y * 1.5), pts = [];
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; pts.push([x + Math.cos(a) * R * 1.05 * sk, 0.004, z + Math.sin(a) * R * 0.5 * sk]); }
  w.ground(pts, "#000000", { stroke: false, bias: -0.6, extra: `fill-opacity="${(0.28 * sk).toFixed(2)}"` });
  const id = `ball${ballId++}`;
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const r = p * R, deg = ((spin * 180) / Math.PI) % 360;
    const pent = (cx, cy, s, rot) => { let d = ""; for (let k = 0; k < 5; k++) { const a = rot + (k * 2 * Math.PI) / 5 - Math.PI / 2; d += `${k ? "L" : "M"}${(cx + s * Math.cos(a)).toFixed(2)},${(cy + s * Math.sin(a)).toFixed(2)} `; } return d + "Z"; };
    const outer = [0, 1, 2, 3, 4].map((k) => { const a = (k * 2 * Math.PI) / 5 + Math.PI / 2; return [Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98, a]; });
    const seams = [0, 1, 2, 3, 4].map((k) => { const a = (k * 2 * Math.PI) / 5 + Math.PI / 2, b = a + Math.PI / 5;
      return `M${(Math.cos(b) * r * 0.36).toFixed(2)},${(Math.sin(b) * r * 0.36).toFixed(2)} L${(Math.cos(b) * r * 0.72).toFixed(2)},${(Math.sin(b) * r * 0.72).toFixed(2)} L${(Math.cos(a) * r * 0.68).toFixed(2)},${(Math.sin(a) * r * 0.68).toFixed(2)} M${(Math.cos(b) * r * 0.72).toFixed(2)},${(Math.sin(b) * r * 0.72).toFixed(2)} L${(Math.cos(b) * r * 1.02).toFixed(2)},${(Math.sin(b) * r * 1.02).toFixed(2)}`; }).join(" ");
    return `<g transform="translate(${sx.toFixed(1)} ${(sy - r).toFixed(1)})">
      <defs><clipPath id="${id}"><circle r="${r.toFixed(2)}"/></clipPath></defs>
      <circle r="${r.toFixed(2)}" fill="${fog("#fbfbfb")}"/>
      <g clip-path="url(#${id})"><g transform="rotate(${deg.toFixed(1)})">
        <path d="${pent(0, 0, r * 0.36, Math.PI)}" fill="${fog("#262626")}"/>
        ${outer.map(([cx, cy, a]) => `<path d="${pent(cx, cy, r * 0.34, a + Math.PI)}" fill="${fog("#262626")}"/>`).join("")}
        <path d="${seams}" fill="none" stroke="${fog("#8a8a8a")}" stroke-width="${(sw * 0.45).toFixed(2)}"/></g>
        <circle cx="${(r * 0.35).toFixed(2)}" cy="${(r * 0.4).toFixed(2)}" r="${(r * 1.05).toFixed(2)}" fill="none" stroke="#000" stroke-opacity="0.16" stroke-width="${(r * 0.5).toFixed(2)}" transform="translate(${(r * 0.25).toFixed(2)} ${(r * 0.25).toFixed(2)})"/>
        <ellipse cx="${(-r * 0.4).toFixed(2)}" cy="${(-r * 0.45).toFixed(2)}" rx="${(r * 0.28).toFixed(2)}" ry="${(r * 0.16).toFixed(2)}" fill="#ffffff" fill-opacity="0.85" transform="rotate(-35 ${(-r * 0.4).toFixed(2)} ${(-r * 0.45).toFixed(2)})"/></g>
      <circle r="${r.toFixed(2)}" fill="none" stroke="${lc}" stroke-width="${(sw * 0.9).toFixed(2)}"/></g>`;
  }, { y, bias: o.bias ?? -0.06 });
}

function chicken(w, x, z, o = {}) {
  if (typeof o === "boolean") o = { flip: o };
  const kind = o.kind || "jago", jago = kind === "jago";
  const pz = chickenPose((o.t || 0) + (o.phase ?? (x * 1.7 + z * 0.9)));
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.01 * (jago ? 1 : 0.85), f = (o.flip ? -1 : 1) * pz.look;
    const W = (sw / s).toFixed(2), Wt = (sw * 0.55 / s).toFixed(2);
    const body = fog(jago ? "#7a7a7a" : "#c9c9c9"), hackle = fog(jago ? "#c4c4c4" : "#dcdcdc");
    const tail = fog(jago ? "#3d3d3d" : "#a3a3a3"), wing = fog(jago ? "#5f5f5f" : "#b3b3b3");
    const comb = fog("#4e4e4e"), leg = fog("#a9a9a9"), beak = fog("#b9b9b9");
    const footL = (dx) => `<path d="M${dx},0 l5,0 M${dx},0 l3,-2 M${dx},0 l-3,0" fill="none" stroke="${lc}" stroke-width="${Wt}" stroke-linecap="round"/>`;
    const legSvg = (bx, swing) => {
      const fx = bx + swing * 4, lift = Math.max(0, swing) * 2.5;
      return `<path d="M${bx},-9 L${fx},${-lift}" fill="none" stroke="${lc}" stroke-width="${(sw * 1.2 / s).toFixed(2)}" stroke-linecap="round"/>
        <path d="M${bx},-9 L${fx},${-lift}" fill="none" stroke="${leg}" stroke-width="${(sw * 0.6 / s).toFixed(2)}" stroke-linecap="round"/>
        <g transform="translate(0 ${-lift})">${footL(fx)}</g>`;
    };
    const tailSvg = jago
      ? `<path d="M-12,-24 C-18,-40 -26,-50 -36,-48 C-30,-44 -24,-36 -20,-22 Z" fill="${tail}"/>
         <path d="M-13,-22 C-24,-34 -34,-38 -40,-30 C-32,-30 -26,-26 -20,-18 Z" fill="${tail}"/>
         <path d="M-12,-26 C-14,-38 -18,-46 -24,-50 C-22,-42 -20,-34 -17,-24 Z" fill="${fog("#555555")}"/>
         <path d="M-26,-46 C-22,-44 -20,-40 -19,-34" fill="none" stroke="${fog("#8a8a8a")}" stroke-width="${Wt}" stroke-linecap="round"/>`
      : `<path d="M-12,-22 C-16,-30 -20,-36 -24,-38 C-22,-30 -20,-24 -16,-17 Z" fill="${tail}"/>`;
    const k = Math.max(0, pz.head) / 62; // 0..1 seberapa dalam mematuk
    const head = `<g transform="translate(${(5 * k).toFixed(2)} ${(13 * k).toFixed(2)}) rotate(${pz.head} 10 -30) translate(${pz.nod * 0.4} 0)">
        <path d="M6,-30 C7,-38 11,-44 16,-46 C20,-46 23,-43 22,-39 C21,-35 18,-31 16,-26 Z" fill="${hackle}"/>
        ${jago ? `<path d="M7,-31 l-3,4 l5,-1 l-1,4 l4,-2 l0,4 l4,-3" fill="none" stroke="${lc}" stroke-width="${Wt}" stroke-linejoin="round"/>` : ""}
        <circle cx="17" cy="-41" r="6" fill="${hackle}"/>
        <path d="M12,-46 q0,-${jago ? 6 : 3} 3,-${jago ? 3 : 1.5} q1,-${jago ? 5 : 2.5} 3,-${jago ? 1 : 0.5} q2,-${jago ? 4 : 2} 3,${jago ? 1 : 0.5} q2,${jago ? 1 : 0.5} 0,${jago ? 3.5 : 2} Z" fill="${comb}"/>
        <path d="M22,-42 L28,-40 L22,-38 Z" fill="${beak}"/>
        <path d="M21,-37 c-1,${jago ? 5 : 3} 3,${jago ? 5 : 3} 2,0 Z" fill="${comb}"/>
        <circle cx="19" cy="-42.5" r="1.3" fill="${LINE}" stroke="none"/><circle cx="19.4" cy="-43" r="0.4" fill="#fff" stroke="none"/>
      </g>`;
    return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${(s * f).toFixed(4)} ${s.toFixed(4)})" stroke="${lc}" stroke-width="${W}" stroke-linejoin="round">
      <ellipse cx="0" cy="0" rx="16" ry="3" fill="rgba(0,0,0,0.13)" stroke="none"/>
      ${legSvg(-3, pz.legB)}
      <g transform="translate(0 ${-pz.bob}) rotate(${(14 * k).toFixed(1)} 0 -9)">
        ${tailSvg}
        <path d="M-14,-22 C-16,-33 -5,-38 6,-34 C14,-32 20,-25 18,-17 C15,-9 5,-7 -4,-8 C-12,-10 -14,-15 -14,-22 Z" fill="${body}"/>
        <path d="M-7,-27 C1,-30 9,-26 10,-20 C4,-14 -5,-15 -10,-20 C-10,-23 -9,-26 -7,-27 Z" fill="${wing}"/>
        <path d="M-6,-22 C-2,-21 3,-21 7,-22 M-7,-19 C-3,-18 2,-18 6,-19" fill="none" stroke="${fog("#4a4a4a")}" stroke-width="${Wt}" stroke-linecap="round"/>
        ${head}
      </g>
      ${legSvg(3, pz.legA)}</g>`;
  }, { bias: -0.05 });
}

module.exports = { PAL, ball, sky, strip, groundDetail, villageRoad, grassTuft, flowerClump, potPlant, house, bambooFence, bush, tree, jemuran, bale, poles, bulbLamp, gapura, bench, table, glassOfCoffee, chicken, chickenPose };
