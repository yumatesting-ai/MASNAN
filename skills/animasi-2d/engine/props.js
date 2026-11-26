// Perlengkapan lingkungan PERKAMPUNGAN Indonesia untuk world3d (satuan meter, grayscale seri).
// Gaya sederhana & tidak modern: jalan cor retak, rumah tembok kusam / papan kayu / bilik bambu,
// atap genteng atau seng, pagar bambu / tanaman, pohon pisang-kelapa-mangga, jemuran, tiang listrik kayu.
const { mul, mix, LINE } = require("./world3d.js");

const PAL = {
  sky: "#eeeeee", skyTop: "#d9d9d9", cloud: "#fbfbfb",
  concrete: "#b4b4b4", crack: "#8e8e8e", dirt: "#c6c6c6", dirtDark: "#b6b6b6", grass: "#b9b9b9", grassDark: "#adadad",
  asphalt: "#8c8c8c", gutter: "#7a7a7a", paving: "#cdcdcd",
  wallA: "#e6e6e6", wallB: "#dadada", wallC: "#cfcfcf", plank: "#a9a9a9", bamboo: "#c4c4c4",
  roof: "#6d6d6d", roofB: "#7c7c7c", seng: "#a3a3a3",
  door: "#8a8a8a", shutter: "#9a9a9a", glass: "#c3c3c3", frame: "#555555",
  trunk: "#6b6b6b", leaf: "#949494", leafB: "#a3a3a3", banana: "#9c9c9c", wood: "#8a8a8a", woodLight: "#a8a8a8",
  bambooPole: "#b0b0b0",
};

// ---------- langit & latar jauh ----------
function sky(w, o = {}) {
  const { W, H, hy } = w;
  const clouds = (o.clouds || [[0.15, 0.12, 1], [0.55, 0.07, 1.3], [0.85, 0.16, 0.9]]).map(([cx, cy, s]) => {
    const x = cx * W, y = cy * H, r = 38 * s;
    return `<path d="M${x - r * 2.2},${y + r * 0.6} C${x - r * 2.4},${y - r * 0.2} ${x - r * 1.4},${y - r * 0.6} ${x - r * 0.9},${y - r * 0.2}
        C${x - r * 0.6},${y - r * 1.1} ${x + r * 0.7},${y - r * 1.1} ${x + r * 0.9},${y - r * 0.2}
        C${x + r * 1.6},${y - r * 0.5} ${x + r * 2.5},${y} ${x + r * 2.2},${y + r * 0.6} Z" fill="${PAL.cloud}" stroke="#cfcfcf" stroke-width="2"/>`;
  }).join("");
  // siluet pepohonan (kelapa, rimbun) & atap jauh di garis cakrawala
  let far = "", x = -20, seed = o.seed || 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  while (x < W + 20) {
    const bw = 30 + rnd() * 50, bh = 14 + rnd() * 26, r = rnd();
    if (r < 0.45) far += `<circle cx="${x + bw / 2}" cy="${hy - bh * 0.7}" r="${bh}" fill="#d6d6d6"/>`;
    else if (r < 0.65) far += `<path d="M${x + bw / 2},${hy} L${x + bw / 2},${hy - bh * 2.4}" stroke="#d2d2d2" stroke-width="3"/>
      <path d="M${x + bw / 2},${hy - bh * 2.4} q-18,-4 -30,10 M${x + bw / 2},${hy - bh * 2.4} q18,-4 30,10 M${x + bw / 2},${hy - bh * 2.4} q-6,-14 -22,-14 M${x + bw / 2},${hy - bh * 2.4} q6,-14 22,-14" stroke="#d2d2d2" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    else far += `<path d="M${x},${hy} L${x},${hy - bh} L${x + bw / 2},${hy - bh - 12} L${x + bw},${hy - bh} L${x + bw},${hy} Z" fill="#dcdcdc"/>`;
    x += bw + rnd() * 10;
  }
  w.add("sky", 1e9, `<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PAL.skyTop}"/><stop offset="1" stop-color="${PAL.sky}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#skyg)"/>${clouds}
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
  for (const s of [-1, 1]) {
    strip(w, Math.min(s * hw, s * (hw + 1.2)), Math.max(s * hw, s * (hw + 1.2)), z0, z1, PAL.dirtDark, { bias: -0.05 });
    strip(w, Math.min(s * (hw + 1.2), s * 40), Math.max(s * (hw + 1.2), s * 40), z0, z1, PAL.grass, { bias: -0.04 });
    for (let z = z0 + 2.6; z < Math.min(z1, 40); z += 1.7 + ((z * 7) % 3) * 0.4) grassTuft(w, s * (hw + 0.2 + ((z * 13) % 10) / 10), z);
  }
}
function grassTuft(w, x, z) {
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.11;
    return `<path transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})" d="M${-s},0 L${-s * 0.6},${-s * 1.1} L${-s * 0.2},0 L${s * 0.1},${-s * 1.4} L${s * 0.4},0 L${s * 0.8},${-s} L${s},0 Z"
      fill="${fog("#a2a2a2")}" stroke="${lc}" stroke-width="${(sw * 0.6).toFixed(2)}" stroke-linejoin="round"/>`;
  }, { layer: "ground", bias: -0.5 });
}

// ---------- rumah kampung (fasad menghadap jalan) ----------
// side -1 = kiri jalan (fasad di x=fx menghadap +X), +1 = kanan
// wall: "plaster" | "plank" | "bamboo"; roof: "genteng" | "seng"; teras/bale: bool; fence: "bamboo" | "bush" | null
function house(w, o) {
  const side = o.side, fx = o.fx, z0 = o.z, Wd = o.width || 6.5, D = o.depth || 7, Hh = o.height || 2.9, rh = o.roofH || 1.8;
  const kind = o.wall || "plaster";
  const wallCol = o.wallColor || (kind === "plank" ? PAL.plank : kind === "bamboo" ? PAL.bamboo : PAL.wallA);
  const x = side < 0 ? fx - D : fx;
  w.box(x, 0, z0, D, 0.35, Wd, "#bdbdbd");
  w.box(x, 0.35, z0, D, Hh - 0.35, Wd, wallCol);
  const seng = o.roof === "seng";
  w.gable(x, Hh, z0, D, Wd, rh, seng ? PAL.seng : (o.roofColor || PAL.roof), { ridge: "x", overhang: 0.5, wall: wallCol, tiles: seng ? 0 : 6, seng });
  const fxx = fx - side * 0.02;
  if (kind !== "plaster") {
    const col = kind === "plank" ? "#7d7d7d" : "#9a9a9a";
    w.texture((u, v) => [fxx, 0.35 + v, z0 + u], Wd, Hh - 0.35, kind, { color: col });
    if (w.cam.z < z0) w.texture((u, v) => [x + u, 0.35 + v, z0 - 0.02], D, Hh - 0.35, kind, { color: col });
  } else {
    w.face([[fxx, 0.35, z0 + 0.2], [fxx, 0.35, z0 + Wd - 0.2], [fxx, 0.9, z0 + Wd - 0.2], [fxx, 0.6, z0 + 0.2]], mul(wallCol, 0.93), { stroke: false, bias: -0.005 });
  }
  const fq = (za, zb, ya, yb, col, extra = {}) => w.face([[fxx, ya, za], [fxx, ya, zb], [fxx, yb, zb], [fxx, yb, za]], col, Object.assign({ swk: 0.8, bias: -0.02 }, extra));
  // pintu kayu
  fq(z0 + 1.0, z0 + 1.9, 0.35, 2.3, PAL.door);
  // jendela kayu + daun jendela terbuka
  const wz0 = z0 + 2.5, wz1 = z0 + 3.6;
  fq(wz0, wz1, 1.0, 2.0, PAL.glass);
  w.line3([[fxx, 1.0, (wz0 + wz1) / 2], [fxx, 2.0, (wz0 + wz1) / 2]], PAL.frame, null, { bias: -0.05 });
  w.line3([[fxx, 1.5, wz0], [fxx, 1.5, wz1]], PAL.frame, null, { bias: -0.05 });
  const ox = fxx - side * 0.35;
  w.face([[fxx, 1.0, wz0], [ox, 1.0, wz0 - 0.4], [ox, 2.0, wz0 - 0.4], [fxx, 2.0, wz0]], PAL.shutter, { swk: 0.7, bias: -0.04 });
  w.face([[fxx, 1.0, wz1], [ox, 1.0, wz1 + 0.4], [ox, 2.0, wz1 + 0.4], [fxx, 2.0, wz1]], PAL.shutter, { swk: 0.7, bias: -0.04 });
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
function bush(w, x, z, r = 0.55) {
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const R = r * p;
    return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})" stroke="${lc}" stroke-width="${sw}">
      <circle cx="${-R * 0.5}" cy="${-R * 0.7}" r="${R * 0.7}" fill="${fog(PAL.leaf)}"/><circle cx="${R * 0.45}" cy="${-R * 0.75}" r="${R * 0.72}" fill="${fog(PAL.leafB)}"/>
      <circle cx="0" cy="${-R * 1.15}" r="${R * 0.6}" fill="${fog(PAL.leaf)}"/></g>`;
  });
}
function tree(w, x, z, o = {}) {
  const h = o.h || 5.5, kind = o.kind || "round";
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const t = (v) => (v * p).toFixed(1);
    let top = "";
    if (kind === "round") {
      top = [[0, -h * 0.74, h * 0.26], [-h * 0.18, -h * 0.62, h * 0.19], [h * 0.18, -h * 0.63, h * 0.2], [-h * 0.03, -h * 0.9, h * 0.17]]
        .map(([bx, by, r], i) => `<circle cx="${t(bx)}" cy="${t(by)}" r="${t(r)}" fill="${fog(i % 2 ? PAL.leafB : PAL.leaf)}"/>`).join("")
        + `<circle cx="${t(h * 0.08)}" cy="${t(-h * 0.6)}" r="${t(h * 0.2)}" fill="${fog(mul(PAL.leaf, 0.86))}" opacity="0.7"/>`;
    } else if (kind === "palm") {
      top = [-60, -25, 15, 50, 85, 120, 160].map((a) => {
        const r = (a * Math.PI) / 180, L2 = h * 0.42;
        return `<path d="M0,${t(-h)} Q${t(Math.cos(r) * L2 * 0.6)},${t(-h - 0.5 - Math.sin(r) * 0.6)} ${t(Math.cos(r) * L2)},${t(-h + Math.abs(Math.sin(r)) * 0.4 + 0.6)}" fill="none" stroke="${fog(PAL.leaf)}" stroke-width="${t(0.28)}" stroke-linecap="round"/>`;
      }).join("") + `<circle cx="${t(0.15)}" cy="${t(-h + 0.25)}" r="${t(0.18)}" fill="${fog("#7a7a7a")}"/><circle cx="${t(-0.15)}" cy="${t(-h + 0.3)}" r="${t(0.18)}" fill="${fog("#7a7a7a")}"/>`;
    } else if (kind === "banana") {
      top = [[-1, -0.2], [1, -0.1], [-0.7, 0.5], [0.8, 0.6], [0.1, -0.8]].map(([dx, dy], i) => {
        const ex = dx * h * 0.42, ey = -h * 0.82 + dy * h * 0.18;
        return `<path d="M0,${t(-h * 0.78)} Q${t(ex * 0.5)},${t(ey - h * 0.22)} ${t(ex)},${t(ey)} Q${t(ex * 0.6)},${t(ey - h * 0.05)} 0,${t(-h * 0.72)} Z" fill="${fog(i % 2 ? PAL.banana : PAL.leafB)}"/>
          <path d="M0,${t(-h * 0.76)} Q${t(ex * 0.5)},${t(ey - h * 0.16)} ${t(ex)},${t(ey)}" fill="none" stroke="${lc}" stroke-width="${sw * 0.6}"/>`;
      }).join("") + `<path d="M${t(0.1)},${t(-h * 0.66)} q${t(0.3)},${t(0.2)} ${t(0.2)},${t(0.6)} l${t(-0.2)},${t(0.05)} Z" fill="${fog("#7d7d7d")}"/>`;
    }
    const trunkTop = kind === "palm" ? 1 : kind === "banana" ? 0.78 : 0.6, tw = kind === "banana" ? 0.16 : 0.13;
    return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})" stroke="${lc}" stroke-width="${sw}" stroke-linejoin="round">
      <ellipse cx="0" cy="0" rx="${t(h * 0.2)}" ry="${t(0.12)}" fill="rgba(0,0,0,0.12)" stroke="none"/>
      <path d="M${t(-tw)},0 L${t(-tw * 0.7)},${t(-h * trunkTop)} L${t(tw * 0.7)},${t(-h * trunkTop)} L${t(tw)},0 Z" fill="${fog(kind === "banana" ? "#9a9a9a" : PAL.trunk)}"/>
      ${kind === "palm" ? [0.2, 0.4, 0.6, 0.8].map((k) => `<path d="M${t(-tw * 0.8)},${t(-h * k)} L${t(tw * 0.8)},${t(-h * k)}" stroke-width="${sw * 0.5}"/>`).join("") : ""}
      ${top}</g>`;
  });
}
// jemuran: dua tiang bambu + tali + pakaian
function jemuran(w, x, za, zb) {
  for (const z of [za, zb]) w.box(x - 0.04, 0, z, 0.08, 1.9, 0.08, PAL.bambooPole);
  w.line3([[x, 1.85, za], [x, 1.85, zb]], "#4a4a4a", null, { sag: 0.12 });
  const clothes = [["#f2f2f2", 0.6, 0.7], ["#7a7a7a", 0.45, 0.5], ["#cfcfcf", 0.7, 0.8], ["#9e9e9e", 0.5, 0.55]];
  let z = za + 0.3;
  for (const [c, wd, ht] of clothes) {
    if (z + wd > zb - 0.1) break;
    const y = 1.82 - 0.06 * Math.sin(((z - za) / (zb - za)) * Math.PI);
    w.face([[x, y, z], [x, y, z + wd], [x, y - ht, z + wd], [x, y - ht, z]], c, { swk: 0.6, bias: -0.03 });
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
// ayam kampung (sprite kecil)
function chicken(w, x, z, flip = false) {
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.0032, f = flip ? -1 : 1;
    return `<g transform="translate(${sx} ${sy}) scale(${(s * f).toFixed(4)} ${s.toFixed(4)})" stroke="${lc}" stroke-width="${(sw / s).toFixed(1)}" stroke-linejoin="round">
      <path d="M-40,-60 C-60,-100 -10,-120 20,-95 C40,-80 60,-90 70,-110 L80,-80 C85,-50 50,-25 10,-25 C-20,-25 -35,-40 -40,-60 Z" fill="${fog("#f2f2f2")}"/>
      <path d="M-40,-60 L-75,-90 L-60,-55 L-80,-60 L-50,-40 Z" fill="${fog("#6a6a6a")}"/>
      <path d="M70,-110 l8,-14 l6,10 l6,-8 l2,14 Z" fill="${fog("#8a8a8a")}"/><path d="M84,-96 l14,4 l-12,6 Z" fill="${fog("#9a9a9a")}"/>
      <circle cx="76" cy="-100" r="3" fill="${LINE}" stroke="none"/>
      <path d="M0,-25 L-5,0 M20,-25 L25,0" fill="none"/></g>`;
  }, { bias: -0.05 });
}

module.exports = { PAL, sky, strip, villageRoad, grassTuft, house, bambooFence, bush, tree, jemuran, bale, poles, bulbLamp, gapura, bench, table, glassOfCoffee, chicken };
