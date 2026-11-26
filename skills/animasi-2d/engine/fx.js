// Efek adegan (komik & sinematik) untuk tools/location.js --fx / --fg. Semua deterministik (fungsi waktu).
//
// --fx: daftar efek
//   { type: "shake", t, dur: 0.5, amp: 0.06 }                 guncangan kamera (meter), meluruh
//   { type: "ball", t0, t1, from: [x,y,z], to: [x,y,z], h: 2, hold: "both"|"start"|"end"|"none", r?, rFly? }
//                                                             (rFly: bola dibesarkan saat melambung agar terbaca)
//                                                             bola melambung (parabola tinggi h), berputar
//   { type: "splash", t, x, y, z, n: 16, size: 1 }            cipratan kopi ke atas + mahkota cairan
//   { type: "spray", t, x, y, z, dx: 0, dz: -1, n: 20 }       semburan (mis. kopi disembur ke arah kamera)
//   { type: "text", t, dur: 1.2, text: "BYUR!", sx: 0.5, sy: 0.3, size: 0.1, rot: -8 }
//                                                             teks onomatope komik: muncul membesar lalu memudar
//   { type: "burst", t, sx, sy, dur: 0.35 }                   garis kejut radial (impact)
//   { type: "cat", t, x, z, flip?, food? }                       kucing duduk muncul di detik t (food: menggigit gorengan)
//   { type: "gorengan", x, y, z, n: 10 }                        properti: piring gorengan menumpuk (selalu tampil)
// --fg: latar depan dekat kamera, DIBURAMKAN (depth of field) -> parallax kuat saat kamera bergerak
//   { kind: "grass"|"leaves"|"post"|"bush", x, z, y?, s? }
const P = require("./props.js");

function rng(seed) {
  let s = (Math.floor(seed * 9973) * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

function shake(list, t) {
  let dx = 0, dy = 0, any = false;
  for (const e of list) if (e.type === "shake" && t >= e.t && t < e.t + (e.dur || 0.5)) {
    const k = 1 - (t - e.t) / (e.dur || 0.5), a = (e.amp || 0.06) * k * k;
    dx += a * Math.sin((t - e.t) * 61); dy += a * 0.7 * Math.cos((t - e.t) * 47); any = true;
  }
  return any ? [dx, dy] : null;
}

function drops(w, e, t, life, vel, col) {
  const r = rng(e.t + (e.x || 0) * 3 + (e.z || 0) * 7), n = e.n || 16, tau = t - e.t;
  if (tau < 0 || tau > life) return;
  for (let i = 0; i < n; i++) {
    const [vx, vy, vz] = vel(r), d = 0.6 + r() * 0.5;
    const x = e.x + vx * tau, y = e.y + vy * tau - 4.9 * tau * tau, z = e.z + vz * tau;
    if (y < 0) continue;
    const fade = 1 - tau / life, rad = (0.018 + 0.02 * r()) * (e.size || 1);
    w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
      const R = Math.max(1.5, p * rad);
      return `<g opacity="${fade.toFixed(2)}"><ellipse cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" rx="${(R * 0.85).toFixed(1)}" ry="${(R * (1 + d * 0.6)).toFixed(1)}" fill="${col}" stroke="${lc}" stroke-width="${(sw * 0.5).toFixed(2)}"/></g>`;
    }, { y, bias: -0.3 });
  }
}

function draw(w, list, t) {
  for (const e of list) {
    if (e.type === "ball") {
      const hold = e.hold || "end";
      let k;
      if (t < e.t0) { if (hold === "start" || hold === "both") k = 0; else continue; }
      else if (t > e.t1) { if (hold === "end" || hold === "both") k = 1; else continue; }
      else k = (t - e.t0) / (e.t1 - e.t0);
      const [x0, y0, z0] = e.from, [x1, y1, z1] = e.to;
      const x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k, y = y0 + (y1 - y0) * k + (e.h || 0) * 4 * k * (1 - k);
      const dist = Math.hypot(x1 - x0, z1 - z0, (e.h || 0) * 2) * k;
      P.ball(w, x, z, { y, r: e.rFly ? (e.r || 0.11) + (e.rFly - (e.r || 0.11)) * Math.min(1, k * 3) : e.r, spin: dist / 0.11 + (e.spin0 || 0), bias: -0.2 });
    } else if (e.type === "splash") {
      const tau = t - e.t;
      drops(w, e, t, 1.0, (r) => { const a = r() * Math.PI * 2, s = 0.6 + r() * 1.6; return [Math.cos(a) * s * 0.7, 2.2 + r() * 2.2, Math.sin(a) * s * 0.5 - 0.4]; }, "#5a5a5a");
      if (tau >= 0 && tau < 0.3) w.sprite(e.x, e.z, (sx, sy, p, fog, lc, sw) => { // mahkota cairan
        const R = p * 0.12 * (0.6 + tau * 3) * (e.size || 1), H = p * 0.18 * Math.sin((tau / 0.3) * Math.PI);
        return `<path d="M${sx - R},${sy} L${sx - R * 0.8},${sy - H} L${sx - R * 0.45},${sy - H * 0.4} L${sx - R * 0.2},${sy - H * 1.2} L${sx + R * 0.1},${sy - H * 0.5} L${sx + R * 0.4},${sy - H * 1.1} L${sx + R * 0.7},${sy - H * 0.45} L${sx + R},${sy - H * 0.9} L${sx + R},${sy} Z" fill="#5a5a5a" stroke="${lc}" stroke-width="${sw * 0.6}"/>`;
      }, { y: e.y, bias: -0.35 });
    } else if (e.type === "spray") {
      const dx = e.dx ?? 0, dz = e.dz ?? -1;
      drops(w, e, t, 0.7, (r) => [dx * (1.6 + r()) + (r() - 0.5) * 1.6, 0.6 + r() * 1.4, dz * (1.6 + r()) + (r() - 0.5) * 0.8], "#7a7a7a");
    } else if (e.type === "text") {
      const dur = e.dur || 1.2, tau = t - e.t;
      if (tau < 0 || tau > dur) continue;
      const pop = tau < 0.12 ? (tau / 0.12) * 1.3 : tau < 0.25 ? 1.3 - ((tau - 0.12) / 0.13) * 0.3 : 1;
      const op = tau > dur - 0.25 ? (dur - tau) / 0.25 : 1;
      const fs = w.W * (e.size || 0.1), X = w.W * (e.sx ?? 0.5), Y = w.H * (e.sy ?? 0.3), wob = 2 * Math.sin(tau * 30) * (tau < 0.4 ? 1 : 0);
      w.add("ui", 0, `<g transform="translate(${X} ${Y}) rotate(${(e.rot ?? -8) + wob}) scale(${pop.toFixed(3)})" opacity="${op.toFixed(2)}"
        font-family="DejaVu Sans, Arial Black, sans-serif" font-weight="900" font-size="${fs.toFixed(0)}" text-anchor="middle" dominant-baseline="middle">
        <text stroke="#1e1e1e" stroke-width="${(fs * 0.2).toFixed(1)}" stroke-linejoin="round" fill="#1e1e1e" x="${fs * 0.05}" y="${fs * 0.07}">${e.text}</text>
        <text stroke="#1e1e1e" stroke-width="${(fs * 0.12).toFixed(1)}" stroke-linejoin="round" paint-order="stroke" fill="#ffffff">${e.text}</text></g>`);
    } else if (e.type === "gorengan") { // piring gorengan menumpuk (properti adegan)
      const n = e.n || 10, C = require("./life.js").col;
      w.sprite(e.x, e.z, (sx, sy, p, fog, lc, sw) => {
        const r = p * 0.17;
        let pile = "";
        for (let i = 0; i < n; i++) {
          const row = i < 5 ? 0 : i < 8 ? 1 : 2, k = row === 0 ? i : row === 1 ? i - 5 : i - 8, cnt = row === 0 ? 5 : row === 1 ? 3 : 2;
          const px = (k - (cnt - 1) / 2) * r * 0.36, py = -r * 0.12 - row * r * 0.17, rot = ((i * 37) % 40) - 20;
          pile += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${(r * 0.21).toFixed(1)}" ry="${(r * 0.1).toFixed(1)}" fill="${fog(C(i % 3 ? "#d99a3f" : "#c98532"))}" stroke="${lc}" stroke-width="${(sw * 0.55).toFixed(2)}" transform="rotate(${rot} ${px.toFixed(1)} ${py.toFixed(1)})"/>`;
        }
        return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})"><ellipse cx="0" cy="0" rx="${r.toFixed(1)}" ry="${(r * 0.3).toFixed(1)}" fill="${fog("#f6f6f6")}" stroke="${lc}" stroke-width="${(sw * 0.7).toFixed(2)}"/>${pile}</g>`;
      }, { y: e.y || 0, bias: -0.12 });
    } else if (e.type === "cat") { // kucing (duduk) yang muncul pada detik t, opsional menggigit gorengan
      if (t < (e.t || 0)) continue;
      const LIFE = require("./life.js"), dir = e.flip ? -1 : 1;
      LIFE.cat(w, e.x, e.z, { mode: e.mode || "sit", flip: e.flip, color: e.color, stripe: e.stripe, food: !!e.food });
    } else if (e.type === "burst") {
      const dur = e.dur || 0.35, tau = t - e.t;
      if (tau < 0 || tau > dur) continue;
      const X = w.W * (e.sx ?? 0.5), Y = w.H * (e.sy ?? 0.4), k = tau / dur, R0 = w.W * (0.08 + 0.1 * k), R1 = w.W * (0.16 + 0.14 * k);
      let d = ""; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + 0.2; d += `M${X + Math.cos(a) * R0},${Y + Math.sin(a) * R0} L${X + Math.cos(a) * R1},${Y + Math.sin(a) * R1} `; }
      w.add("ui", 0, `<path d="${d}" stroke="#1e1e1e" stroke-width="${w.W * 0.008}" stroke-linecap="round" opacity="${(1 - k).toFixed(2)}"/>`);
    }
  }
}

// latar depan buram (depth of field): digambar sebagai sprite 3D sangat dekat kamera -> bergerak cepat saat kamera
// pan (parallax) dan menutupi tepi frame seperti lensa sungguhan.
function foreground(w, list, t) {
  if (!list.length) return;
  w.add("sky", 3e9, `<defs><filter id="dofFg" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${(w.W / 160).toFixed(1)}"/></filter></defs>`);
  for (const e of list) {
    const s = e.s || 1, col = e.color || "#4f4f4f", sway = Math.sin(t * 1.6 + e.x) * 0.04;
    const fn = {
      grass: (sx, sy, p) => { let d = ""; for (let i = 0; i < 9; i++) { const bx = sx + (i - 4) * p * 0.07 * s, h = p * (0.45 + ((i * 37) % 5) * 0.08) * s, lean = (i - 4) * p * 0.03 + sway * p;
        d += `M${bx - p * 0.025 * s},${sy} Q${bx + lean * 0.5},${sy - h * 0.6} ${bx + lean},${sy - h} Q${bx + lean * 0.4 + p * 0.02},${sy - h * 0.55} ${bx + p * 0.025 * s},${sy} Z `; }
        return `<path d="${d}" fill="${col}"/>`; },
      leaves: (sx, sy, p) => { let g = `<path d="M${sx - p * 0.9 * s},${sy - p * 0.1} Q${sx},${sy + p * 0.1 * s} ${sx + p * 0.9 * s},${sy - p * 0.2}" stroke="${col}" stroke-width="${p * 0.03}" fill="none"/>`;
        for (let i = 0; i < 9; i++) { const lx = sx + (i - 4) * p * 0.2 * s, ly = sy + p * 0.02 * Math.abs(i - 4), a = (i - 4) * 12 + sway * 200;
          g += `<ellipse cx="${lx}" cy="${ly + p * 0.18 * s}" rx="${p * 0.08 * s}" ry="${p * 0.2 * s}" fill="${col}" transform="rotate(${a} ${lx} ${ly})"/>`; }
        return g; },
      post: (sx, sy, p) => `<rect x="${sx - p * 0.06 * s}" y="${sy - p * 3 * s}" width="${p * 0.12 * s}" height="${p * 3 * s}" fill="${col}"/>`,
      bush: (sx, sy, p) => [[-0.25, 0.3], [0.2, 0.36], [0, 0.5], [-0.45, 0.18], [0.45, 0.2]].map(([dx, r]) => `<circle cx="${sx + dx * p * s}" cy="${sy - r * p * s * 0.8}" r="${r * p * s}" fill="${col}"/>`).join(""),
    }[e.kind];
    if (!fn) continue;
    w.sprite(e.x, e.z, (sx, sy, p) => `<g filter="url(#dofFg)" opacity="${e.opacity ?? 0.92}">${fn(sx, sy, p)}</g>`, { y: e.y || 0, bias: -5 });
  }
}

module.exports = { shake, draw, foreground };
