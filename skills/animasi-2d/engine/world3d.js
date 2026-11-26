// Mesin "2.5D" kecil: dunia 3D sederhana (satuan meter) diproyeksikan ke SVG dengan perspektif kamera,
// lalu digambar dengan gaya seri (grayscale, garis tegas, shading cel per bidang).
//
//   const w = createWorld({ W: 1600, H: 900, cam: { x: 0, y: 1.5, z: 0 }, f: 1300, horizon: 0.42 });
//   w.box(x, y, z, sx, sy, sz, "#e6e6e6")   // kotak: sudut minimum (x,y,z), ukuran (sx,sy,sz)
//   w.gable(...), w.poly(points3D, fill), w.ground(points3D, fill), w.line3(points3D, stroke, width)
//   w.sprite(x, z, drawFn)  // objek 2D yang berdiri tegak (pohon, karakter): drawFn(sx, sy, pxPerMeter, fog)
//   w.render(background)    -> string <svg>
//
// Sumbu: X ke kanan, Y ke atas, Z menjauhi kamera. Kamera menghadap +Z.
// Urutan gambar: lapisan "sky" -> "ground" (jauh ke dekat) -> objek & sprite (jauh ke dekat, painter's algorithm).

const LINE = "#2a2a2a";
const toRGB = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const toHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mul = (h, f) => toHex(toRGB(h).map((v) => v * f));
const mix = (h, h2, k) => { const a = toRGB(h), b = toRGB(h2); return toHex(a.map((v, i) => v + (b[i] - v) * k)); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// cahaya dari kiri-atas-depan; bidang menghadap kamera (-Z) = faktor 1
const L = (() => { const v = [-0.45, 0.75, -0.5]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
const shadeOf = (n) => { const d = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]); return (0.62 + 0.42 * d) / 0.828; };

function createWorld(opt = {}) {
  const W = opt.W || 1600, H = opt.H || 900;
  const cam = Object.assign({ x: 0, y: 1.5, z: 0 }, opt.cam);
  const f = opt.f || 1300;
  const hy = H * (opt.horizon ?? 0.42);
  const sky = opt.sky || "#eeeeee";
  // perspektif atmosfer: makin jauh makin pudar menuju abu-abu muda (fogColor)
  const fogStart = opt.fogStart ?? 5, fogRange = opt.fogRange ?? 40, fogMax = opt.fogMax ?? 0.82;
  const fogColor = opt.fogColor || "#dedede";
  const NEAR = 0.3;
  const items = []; // { layer, z, svg }

  const proj = ([x, y, z]) => {
    const d = Math.max(NEAR, z - cam.z);
    return [W / 2 + ((x - cam.x) * f) / d, hy - ((y - cam.y) * f) / d];
  };
  const depth = (z) => Math.max(NEAR, z - cam.z);
  const fogK = (z) => clamp((depth(z) - fogStart) / fogRange, 0, fogMax);
  const fog = (color, z) => mix(color, fogColor, fogK(z));
  const lineCol = (z) => mix(LINE, fogColor, fogK(z) * 0.9);
  const sw = (z, base = 1) => +(clamp(14 / depth(z), 0.6, 2.6) * base).toFixed(2);
  const ppm = (z) => f / depth(z); // piksel per meter pada kedalaman z
  const P = (pts) => pts.map(proj).map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

  // bidang poligon 3D (fill sudah final; fog diterapkan di sini)
  // potong poligon pada bidang dekat kamera (z = cam.z + NEAR) agar bidang yang melewati kamera tidak rusak
  function clipNear(pts) {
    const zn = cam.z + NEAR + 0.02;
    if (pts.every((p) => p[2] >= zn)) return pts;
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const A = pts[i], B = pts[(i + 1) % pts.length], ina = A[2] >= zn, inb = B[2] >= zn;
      if (ina) out.push(A);
      if (ina !== inb) { const k = (zn - A[2]) / (B[2] - A[2]); out.push([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, zn]); }
    }
    return out;
  }
  function poly(pts0, fill, o = {}) {
    const zc = o.z ?? pts0.reduce((a, p) => a + Math.max(p[2], cam.z + NEAR), 0) / pts0.length;
    const pts = clipNear(pts0);
    if (pts.length < 3) return;
    const zs = o.zLine ?? zc;
    const stroke = o.stroke === false ? 'stroke="none"' : `stroke="${o.stroke || lineCol(zs)}" stroke-width="${o.sw ?? sw(zs, o.swk || 1)}" stroke-linejoin="round"`;
    const svg = `<polygon points="${P(pts)}" fill="${o.noFog ? fill : fog(fill, zc)}" ${stroke} ${o.extra || ""}/>`;
    items.push({ layer: o.layer || "obj", z: zc + (o.bias || 0), svg });
  }
  // bidang dengan shading otomatis dari normal
  function face(pts, base, o = {}) {
    const [a, b, c] = pts;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = Math.hypot(...n) || 1; n = n.map((x) => x / m);
    // arahkan normal ke kamera
    const ctr = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
    const toCam = [cam.x - ctr[0], cam.y - ctr[1], cam.z - ctr[2]];
    if (n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] < 0) n = n.map((x) => -x);
    poly(pts, mul(base, shadeOf(n) * (o.k || 1)), o);
  }
  const ground = (pts, fill, o = {}) => poly(pts, fill, Object.assign({ layer: "ground" }, o));
  // garis 3D (kabel, garis lapangan); curve = lengkung kabel (meter) di tengah
  function line3(pts, stroke = LINE, width = null, o = {}) {
    const zc = pts.reduce((a, p) => a + p[2], 0) / pts.length;
    let d;
    if (o.sag) {
      const [a, b] = pts.map(proj);
      const mid = proj([(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2 - o.sag, (pts[0][2] + pts[1][2]) / 2]);
      const cx = 2 * mid[0] - (a[0] + b[0]) / 2, cy = 2 * mid[1] - (a[1] + b[1]) / 2;
      d = `M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    } else d = "M" + pts.map(proj).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
    items.push({ layer: o.layer || "obj", z: zc + (o.bias || 0),
      svg: `<path d="${d}" fill="none" stroke="${fog(stroke, zc)}" stroke-width="${width ?? sw(zc, o.swk || 0.7)}" stroke-linecap="round" ${o.extra || ""}/>` });
  }

  // ---------- bayangan matahari (jatuh ke tanah, searah cahaya: ke kanan-belakang) ----------
  // titik 3D di ketinggian y diproyeksikan ke tanah sepanjang arah cahaya
  const SH = [-L[0] / L[1], -L[2] / L[1]]; // geser (x,z) per meter tinggi
  const toGround = ([x, y, z]) => [x + SH[0] * y, z + SH[1] * y];
  function hull(pts) {
    const P2 = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o2, a, b) => (a[0] - o2[0]) * (b[1] - o2[1]) - (a[1] - o2[1]) * (b[0] - o2[0]);
    const lo = [], up = [];
    for (const p of P2) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P2.length - 1; i >= 0; i--) { const p = P2[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function shadowPoly(g2, strength = 1) {
    if (opt.shadows === false || g2.length < 3) return;
    const zc = g2.reduce((a, p) => a + p[1], 0) / g2.length;
    const k = (1 - fogK(zc) / Math.max(0.01, fogMax)) * strength;
    if (k <= 0.02 || zc - cam.z < NEAR) return;
    items.push({ layer: "shadow", z: zc, svg: `<polygon points="${g2.map(([x, z]) => proj([x, 0.002, z])).map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ")}" fill="#000" fill-opacity="${k.toFixed(2)}"/>` });
  }
  const castPoints = (pts3, strength) => shadowPoly(hull(pts3.map(toGround)), strength);
  // bayangan objek tegak berbentuk gumpalan (pohon, semak, karakter): elips di ujung bayangan + "batang"
  function castBlob(x, z, h, rx, o = {}) {
    const [cx, cz] = toGround([x, h, z]), pts = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rx * 0.85]); }
    shadowPoly(pts, o.strength ?? 1);
    if (o.trunk) { const w2 = o.trunk; shadowPoly(hull([[x - w2, z], [x + w2, z], [cx - w2, cz], [cx + w2, cz]]), o.strength ?? 1); }
  }

  // kotak (badan rumah, tiang, meja...). Hanya bidang yang menghadap kamera yang digambar.
  function box(x, y, z, sx, sy, sz, base, o = {}) {
    const x1 = x + sx, y1 = y + sy, z1 = z + sz;
    const fc = o.faces || {};
    if (cam.z < z) face([[x, y, z], [x1, y, z], [x1, y1, z], [x, y1, z]], fc.front || base, o);              // depan
    if (cam.x < x) face([[x, y, z], [x, y, z1], [x, y1, z1], [x, y1, z]], fc.left || base, o);              // sisi kiri
    if (cam.x > x1) face([[x1, y, z], [x1, y, z1], [x1, y1, z1], [x1, y1, z]], fc.right || base, o);        // sisi kanan
    if (cam.y > y1) face([[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]], fc.top || base, o);          // atas
    if (cam.y < y) face([[x, y, z], [x1, y, z], [x1, y, z1], [x, y, z1]], fc.bottom || base, o);           // bawah
    if (o.shadow !== false && sy >= 0.12) castPoints([[x, y, z], [x1, y, z], [x1, y, z1], [x, y, z1], [x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]]);
  }

  // atap pelana. ridge "x": bubungan sejajar X (segitiga di bidang x=const); "z": sejajar Z.
  function gable(x, y, z, sx, sz, h, base, o = {}) {
    const ov = o.overhang ?? 0.4, x0 = x - ov, x1 = x + sx + ov, z0 = z - ov, z1 = z + sz + ov;
    const gableCol = o.gableColor || o.wall || "#e8e8e8";
    if ((o.ridge || "x") === "x") {
      const zm = (z0 + z1) / 2;
      if (o.shadow !== false) castPoints([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y + h, zm], [x1, y + h, zm]]);
      face([[x0, y, z0], [x1, y, z0], [x1, y + h, zm], [x0, y + h, zm]], base, o);           // lereng depan
      if (cam.y > y + h) face([[x0, y + h, zm], [x1, y + h, zm], [x1, y, z1], [x0, y, z1]], base, o);
      if (cam.x < x) face([[x, y, z], [x, y, z + sz], [x, y + h, zm]], gableCol, o);
      if (cam.x > x + sx) face([[x + sx, y, z], [x + sx, y, z + sz], [x + sx, y + h, zm]], gableCol, o);
      if (o.tiles) tileLines([[x0, y, z0], [x1, y, z0], [x1, y + h, zm], [x0, y + h, zm]], o.tiles);
      if (o.seng) { // atap seng: garis gelombang tegak lurus bubungan
        const a = [x0, y, z0], b = [x1, y, z0], d = [x0, y + h, zm], U = x1 - x0, V = Math.hypot(h, zm - z0);
        texture((u, v) => a.map((c, k) => c + (b[k] - c) * (u / U) + (d[k] - c) * (v / V)), U, V, "seng", { color: "#8a8a8a", bias: -0.02 });
      }
    } else {
      const xm = (x0 + x1) / 2;
      if (o.shadow !== false) castPoints([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [xm, y + h, z0], [xm, y + h, z1]]);
      if (cam.x < xm) face([[x0, y, z0], [x0, y, z1], [xm, y + h, z1], [xm, y + h, z0]], base, o);
      if (cam.x > xm) face([[x1, y, z0], [x1, y, z1], [xm, y + h, z1], [xm, y + h, z0]], base, o);
      if (cam.z < z) face([[x, y, z], [x + sx, y, z], [xm, y + h, z]], gableCol, o);
      if (o.tiles) {
        if (cam.x < xm) tileLines([[x0, y, z0], [x0, y, z1], [xm, y + h, z1], [xm, y + h, z0]], o.tiles, true);
        if (cam.x > xm) tileLines([[x1, y, z0], [x1, y, z1], [xm, y + h, z1], [xm, y + h, z0]], o.tiles, true);
      }
    }
  }
  // garis genteng: garis sejajar sisi bawah lereng
  function tileLines(q, n, along = false) {
    const [a, b, c, d] = q;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const p1 = a.map((v, k) => v + (d[k] - v) * t), p2 = b.map((v, k) => v + (c[k] - v) * t);
      line3([p1, p2], "#4a4a4a", null, { bias: -0.02 });
    }
  }
  // prisma bersegi-n tegak (menara, tiang bulat)
  function prism(cx, cz, r, y0, y1, n, base, o = {}) {
    if (o.shadow !== false && y1 - y0 >= 0.12) {
      const ring = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ring.push([cx + r * Math.cos(a), y0, cz + r * Math.sin(a)], [cx + r * Math.cos(a), y1, cz + r * Math.sin(a)]); }
      castPoints(ring);
    }
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      const p0 = [cx + r * Math.cos(a0), cz + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cz + r * Math.sin(a1)];
      const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
      const nx = mx - cx, nz = mz - cz;
      if (nx * (cam.x - mx) + nz * (cam.z - mz) <= 0) continue;
      face([[p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]]], base, o);
    }
    if (o.cap !== false && cam.y > y1) {
      const pts = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([cx + r * Math.cos(a), y1, cz + r * Math.sin(a)]); }
      face(pts, o.capColor || base, o);
    }
  }
  // kubah (setengah bola) sebagai sprite berbayang
  function dome(cx, y, cz, r, base, o = {}) {
    const [sx, sy] = proj([cx, y, cz]);
    const p = ppm(cz), R = r * p, ry = R * (o.squash || 1.05);
    const fill = fog(base, cz), dark = fog(mul(base, 0.78), cz), lite = fog(mul(base, 1.12), cz);
    const id = `dm${Math.round(cx * 100)}_${Math.round(cz * 100)}_${Math.round(y * 10)}`;
    const d = `M${sx - R},${sy} A${R},${ry} 0 0 1 ${sx + R},${sy} Z`;
    items.push({ layer: "obj", z: cz - r * 0.5 + (o.bias || 0), svg: `
      <clipPath id="${id}"><path d="${d}"/></clipPath>
      <path d="${d}" fill="${fill}"/>
      <ellipse clip-path="url(#${id})" cx="${sx + R * 0.55}" cy="${sy - ry * 0.1}" rx="${R * 0.75}" ry="${ry * 1.1}" fill="${dark}"/>
      <path clip-path="url(#${id})" d="M${sx - R * 0.55},${sy - ry * 0.45} Q${sx - R * 0.2},${sy - ry * 0.95} ${sx + R * 0.15},${sy - ry * 0.98}" fill="none" stroke="${lite}" stroke-width="${R * 0.08}" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="${lineCol(cz)}" stroke-width="${sw(cz)}"/>
      ${o.finial ? `<path d="M${sx},${sy - ry} L${sx},${sy - ry - R * 0.45}" stroke="${lineCol(cz)}" stroke-width="${sw(cz)}"/>
        <path d="M${sx + R * 0.02},${sy - ry - R * 0.62} a${R * 0.12},${R * 0.12} 0 1 0 ${R * 0.13},${R * 0.14} a${R * 0.09},${R * 0.09} 0 1 1 -${R * 0.13},-${R * 0.14} Z" fill="${lineCol(cz)}"/>` : ""}` });
  }
  // sprite tegak (pohon, karakter, papan): drawFn(sx, sy, pxPerMeter, fogFn, lineColor, strokeWidth)
  function sprite(x, z, drawFn, o = {}) {
    const [sx, sy] = proj([x, o.y || 0, z]);
    items.push({ layer: o.layer || "obj", z: z + (o.bias || 0),
      svg: drawFn(sx, sy, ppm(z), (c) => fog(c, z), lineCol(z), sw(z)) });
  }
  // teks pada bidang yang menghadap kamera (z tetap)
  function text(x0, y0, x1, y1, z, str, o = {}) {
    const [a, b] = proj([x0, y1, z]), [c, d] = proj([x1, y0, z]);
    const h = d - b, size = h * (o.size || 0.62);
    items.push({ layer: "obj", z: z - 0.01 + (o.bias || 0), svg: `<text x="${(a + c) / 2}" y="${b + h / 2 + size * 0.36}" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${size.toFixed(1)}" letter-spacing="${(size * (o.spacing || 0.04)).toFixed(1)}"
      fill="${fog(o.color || LINE, z)}">${str}</text>` });
  }
  // teks pada bidang x=tetap (fasad rumah yang menghadap jalan) — miring mengikuti perspektif
  function textSide(x, y0, y1, z0, z1, str, o = {}) {
    const p0 = proj([x, (y0 + y1) / 2, z0]), p1 = proj([x, (y0 + y1) / 2, z1]);
    const h0 = proj([x, y0, z0])[1] - proj([x, y1, z0])[1];
    const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180 / Math.PI;
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const zc = (z0 + z1) / 2;
    items.push({ layer: "obj", z: zc - 0.01, svg: `<g transform="translate(${p0[0]} ${p0[1]}) rotate(${ang})">
      <text x="${len / 2}" y="${h0 * 0.22}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800"
        font-size="${(h0 * (o.size || 0.55)).toFixed(1)}" fill="${fog(o.color || LINE, zc)}" textLength="${(len * 0.86).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${str}</text></g>` });
  }

  // atap limas / tajug: 4 bidang menuju puncak; top>0 = limas terpotong (untuk atap tumpang bertingkat)
  function hip(x, y, z, sx, sz, h, base, o = {}) {
    const ov = o.overhang ?? 0.4, x0 = x - ov, x1 = x + sx + ov, z0 = z - ov, z1 = z + sz + ov;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, tw = (o.top || 0) / 2;
    const T = [[cx - tw, y + h, cz - tw], [cx + tw, y + h, cz - tw], [cx + tw, y + h, cz + tw], [cx - tw, y + h, cz + tw]];
    if (o.shadow !== false) castPoints([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], ...T]);
    const q = (pts) => face(tw > 0 ? pts : [pts[0], pts[1], pts[2]], base, o);
    if (cam.z < cz) q([[x0, y, z0], [x1, y, z0], T[1], T[0]]);
    if (cam.x < cx) q([[x0, y, z1], [x0, y, z0], T[0], T[3]]);
    if (cam.x > cx) q([[x1, y, z0], [x1, y, z1], T[2], T[1]]);
    if (o.tiles) {
      for (let i = 1; i < o.tiles; i++) {
        const t = i / o.tiles, lerp = (a, b) => a.map((v, k) => v + (b[k] - v) * t);
        line3([lerp([x0, y, z0], T[0]), lerp([x1, y, z0], T[1])], "#4a4a4a", null, { bias: -0.02 });
      }
    }
  }
  // tekstur garis pada persegi panjang di sebuah bidang: map(u,v) -> titik 3D, u in [0,U], v in [0,V]
  // jenis: "plank" (papan kayu mendatar), "bamboo" (anyaman bilik), "seng" (gelombang tegak)
  function texture(map, U, V, kind, o = {}) {
    const col = o.color || "#9a9a9a", segs = [];
    if (kind === "plank") for (let v = 0.25; v < V; v += 0.25) segs.push([map(0, v), map(U, v)]);
    if (kind === "seng") for (let u = 0.15; u < U; u += 0.15) segs.push([map(u, 0), map(u, V)]);
    if (kind === "brick") {
      let row = 0;
      for (let v = 0; v < V; v += 0.2, row++) {
        if (v > 0) segs.push([map(0, v), map(U, v)]);
        for (let u = (row % 2) * 0.2 + 0.4; u < U; u += 0.4) segs.push([map(u, v), map(u, Math.min(V, v + 0.2))]);
      }
    }
    if (kind === "bamboo") {
      const st = 0.32;
      for (let c = -V; c < U; c += st) {
        const a0 = Math.max(0, c), a1 = Math.min(U, c + V); if (a1 > a0) segs.push([map(a0, a0 - c), map(a1, a1 - c)]);
        const b0 = Math.max(0, c), b1 = Math.min(U, c + V); if (b1 > b0) segs.push([map(b0, V - (b0 - c)), map(b1, V - (b1 - c))]);
      }
    }
    for (const sg of segs) line3(sg, col, null, { bias: o.bias ?? 0.01, swk: 0.5 });
  }

  // lengkung (arch) pada bidang z tetap: persegi + setengah lingkaran di atas
  function arch(x0, x1, y0, y1, z, fill, o = {}) {
    const r = (x1 - x0) / 2, cx = (x0 + x1) / 2, yc = y1 - r, pts = [[x0, y0, z], [x1, y0, z]];
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; pts.push([cx + r * Math.cos(a), yc + r * Math.sin(a), z]); }
    pts.push([x0, y0, z]);
    face(pts.slice(0, -1), fill, o);
  }

  function render(background = "") {
    const order = { sky: 0, far: 1, ground: 2, shadow: 2.5, obj: 3, front: 4, ui: 5 };
    items.sort((a, b) => order[a.layer] - order[b.layer] || b.z - a.z);
    const shadows = items.filter((i) => i.layer === "shadow").map((i) => i.svg).join("");
    const before = items.filter((i) => order[i.layer] < 2.5).map((i) => i.svg).join("\n");
    const after = items.filter((i) => order[i.layer] > 2.5).map((i) => i.svg).join("\n");
    // vinyet lembut di tepi (sinematik)
    const vignette = opt.vignette === false ? "" : `<defs><radialGradient id="vgn" cx="50%" cy="48%" r="75%">
        <stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#vgn)" pointer-events="none"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      ${background}${before}<g opacity="0.2">${shadows}</g>${after}${vignette}</svg>`;
  }

  return { castPoints, castBlob, toGround, W, H, cam, f, hy, sky, proj, ppm, fog, fogK, lineCol, sw, poly, face, ground, line3, box, gable, prism, dome, hip, texture, arch, sprite, text, textSide, render, items,
    add: (layer, z, svg) => items.push({ layer, z, svg }) };
}

module.exports = { createWorld, mul, mix, LINE };
