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
//   { type: "cat", t, x, z, flip?, food?, from?: [x,z], dur?, h? }  kucing muncul di detik t (from: melompat dari titik itu)                       kucing duduk muncul di detik t (food: menggigit gorengan)
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

// posisi benda dari keyframe [t,x,y,z,rot,arc,mode,flip]; arc = tinggi lengkung (lempar/lompat) ruas menuju key ini;
// arc < 0 = jatuh (makin cepat). Sebelum key pertama/ sesudah key terakhir: tampil diam bila hold (default "both").
function keyAt(keys, t, hold = "both") {
  if (!keys || !keys.length) return null;
  const K = keys.map((k) => ({ t: k[0], x: k[1], y: k[2], z: k[3], rot: k[4] || 0, arc: k[5] || 0, mode: k[6], flip: k[7] }));
  if (t < K[0].t) return hold === "both" || hold === "start" ? K[0] : null;
  if (t >= K[K.length - 1].t) return hold === "both" || hold === "end" ? K[K.length - 1] : null;
  let i = 0; while (K[i + 1].t <= t) i++;
  const a = K[i], b = K[i + 1];
  if (b.mode === "hide") return null;
  let u = (t - a.t) / (b.t - a.t || 1);
  const ue = b.arc < 0 ? u * u : u;
  const y = a.y + (b.y - a.y) * ue + (b.arc > 0 ? 4 * b.arc * u * (1 - u) : 0);
  const moving = Math.abs(b.x - a.x) + Math.abs(b.y - a.y) + Math.abs(b.z - a.z) > 0.01;
  return { x: a.x + (b.x - a.x) * u, y, z: a.z + (b.z - a.z) * u, rot: a.rot + (b.rot - a.rot) * u,
    mode: moving ? (b.mode === "walk" || b.mode === "climb" ? b.mode : a.mode === "hide" ? b.mode : b.arc ? "leap" : b.mode || a.mode) : a.mode,
    flip: b.flip ?? (Math.abs(b.x - a.x) > 0.02 ? b.x > a.x : a.flip), moving };
}
function drawProp(w, kind, st, dent, e) {
  const t0open = (e) => e.open !== undefined && st.t >= e.open;
  const C = require("./life.js").col;
  if (kind === "ball") return P.ball(w, st.x, st.z, { y: st.y, r: e.r || 0.11, spin: st.rot / 30, bias: e.bias ?? -0.2 });
  w.sprite(st.x, st.z, (sx, sy, p, fog, lc, sw) => {
    // skala per jenis agar ukuran SAMA dengan saat dipegang tokoh (sandal ±0,22 m, sapu ±0,75 m, ember ±0,3 m)
    const s = p * ({ sandal: 0.0068, sapu: 0.0063, ember: 0.0088, mango: 0.008, book: 0.0064, fish: 0.0062, worm: 0.005, boot: 0.0072, can: 0.0065, branch: 0.0075 }[kind] || 0.01), L = `stroke="${lc}" stroke-width="${(sw * 0.7).toFixed(2)}" stroke-linejoin="round" stroke-linecap="round"`;
    let g = "";
    if (kind === "sandal") g = `<path d="M-14,-4 Q-16,-12 -6,-13 L14,-11 Q20,-6 14,-1 L-8,1 Q-14,1 -14,-4 Z" fill="${fog(C("#7a4a2a"))}" ${L}/>
      <path d="M-4,-12 Q2,-20 8,-11" fill="none" stroke="${fog(C("#2f6b8f"))}" stroke-width="4" stroke-linecap="round"/>`;
    else if (kind === "sapu") g = `<path d="M0,-55 L0,25" stroke="${lc}" stroke-width="6.5" stroke-linecap="round"/><path d="M0,-55 L0,25" stroke="${fog("#a9895a")}" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M-3,22 L-20,62 L20,62 L3,22 Z" fill="${fog(C("#d9c27a"))}" ${L}/><path d="M0,24 L-10,61 M0,24 L0,61 M0,24 L10,61" stroke="${fog("#a9895a")}" stroke-width="1.4"/>`;
    else if (kind === "ember") g = `<path d="M-18,-30 Q0,-52 18,-30" fill="none" ${L}/>
      <path d="${dent ? "M-18,-30 L18,-30 L12,0 L4,-6 L-2,1 L-12,0 Z" : "M-18,-30 L18,-30 L13,0 L-13,0 Z"}" fill="${fog(C("#3f86c4"))}" ${L}/>
      <ellipse cx="0" cy="-30" rx="18" ry="5" fill="${fog(C("#2c5f8a"))}" ${L}/>`;
    else if (kind === "book") { // buku PR: tertutup, atau terbuka (e.open = detik dibuka) dengan cap kaki kucing & nilai
      const op = t0open(e), paws = e.paws && st.t >= e.paws, score = e.score && st.t >= e.score[0] ? e.score[1] : null;
      if (!op) g = `<path d="M-20,-28 L20,-28 L20,0 L-20,0 Z" fill="${fog(C("#3f86c4"))}" ${L}/><path d="M-20,-28 L-20,0" stroke="${lc}" stroke-width="2.4"/>
        <path d="M-12,-21 L12,-21 L12,-11 L-12,-11 Z" fill="${fog("#ffffff")}" ${L}/><text x="0" y="-13.4" font-size="8" font-family="DejaVu Sans" font-weight="700" text-anchor="middle" fill="${lc}">PR BIMA</text>
        <ellipse cx="11" cy="-5" rx="4" ry="2.2" fill="${fog("#c98532")}" opacity="0.45"/>`;
      else {
        const lines = [-22, -17, -12, -7].map((y) => `<path d="M-33,${y} L-5,${y} M5,${y} L33,${y}" stroke="${fog("#9ab7d6")}" stroke-width="1"/>`).join("");
        const scrib = [-21, -16, -11].map((y, i) => `<path d="M-31,${y} q4,-2 8,0 t8,0 t8,0" fill="none" stroke="${lc}" stroke-width="0.9"/><path d="M7,${y} q4,-2 8,0 t8,0 t${i === 2 ? 2 : 8},0" fill="none" stroke="${lc}" stroke-width="0.9"/>`).join("");
        const paw = (px, py, a) => `<g transform="translate(${px} ${py}) rotate(${a})" fill="${fog(C("#7a4a2a"))}" opacity="0.85"><ellipse cx="0" cy="1.6" rx="2.6" ry="2.1"/><circle cx="-2.6" cy="-1.8" r="0.95"/><circle cx="-0.9" cy="-2.9" r="0.95"/><circle cx="1" cy="-2.9" r="0.95"/><circle cx="2.7" cy="-1.8" r="0.95"/></g>`;
        g = `<path d="M-36,-28 L0,-26 L36,-28 L36,0 L0,2 L-36,0 Z" fill="${fog("#fbfaf4")}" ${L}/><path d="M0,-26 L0,2" stroke="${lc}" stroke-width="1.4"/>${lines}${scrib}
          ${paws ? [[-26, -9, -20], [-14, -20, 15], [-8, -6, -5], [12, -22, 25], [22, -9, -12], [28, -19, 10], [3, -14, 0]].map((q) => paw(...q)).join("") : ""}
          ${(e.writes || []).map(([w0, wd, txt, wx, wy, ws]) => { // tulisan tangan pulpen merah muncul bertahap (kiri -> kanan)
              if (st.t < w0) return "";
              const k = Math.min(1, (st.t - w0) / wd), sz = ws || 12, wdt = txt.length * sz * 0.62;
              const id = `wr${Math.round(w0 * 100)}`;
              return `<defs><clipPath id="${id}"><rect x="${wx - wdt / 2 - 2}" y="${wy - sz}" width="${(wdt + 4) * k}" height="${sz * 1.6}"/></clipPath></defs>
                <g clip-path="url(#${id})"><text x="${wx}" y="${wy}" font-size="${sz}" font-family="DejaVu Sans" font-weight="700" font-style="italic" text-anchor="middle" fill="#d8423a">${txt}</text>
                <path d="M${wx - wdt / 2 - 3},${wy + 3} q${wdt / 2},4 ${wdt + 6},0" fill="none" stroke="#d8423a" stroke-width="1.3"/></g>`;
            }).join("")}
          ${(() => { // tangan + pulpen merah: ujung pena di ujung tulisan yang sedang ditulis
              const w = (e.writes || []).find(([w0, wd]) => st.t >= w0 - 0.5 && st.t < w0 + wd + 0.5);
              if (!w) return "";
              const [w0, wd, txt, wx, wy, ws] = w, sz = ws || 12, wdt = txt.length * sz * 0.62;
              const k = Math.max(0, Math.min(1, (st.t - w0) / wd));
              const px = wx - wdt / 2 + wdt * k, py = wy - sz * 0.35 + Math.sin(st.t * 40) * sz * 0.22 * (k > 0 && k < 1 ? 1 : 0);
              const lift = st.t < w0 ? (w0 - st.t) * 30 : st.t > w0 + wd ? (st.t - w0 - wd) * 30 : 0;
              return `<g transform="translate(${px} ${py - lift}) rotate(28) scale(0.72)">
                <path d="M-1.6,0 L1.6,0 L1.6,-30 L-1.6,-30 Z" fill="#d8423a" stroke="${lc}" stroke-width="0.8"/><path d="M-1.6,0 L1.6,0 L0,4 Z" fill="#f4f4f4" stroke="${lc}" stroke-width="0.6"/>
                <path d="M-2,-30 L2,-30 L2,-35 L-2,-35 Z" fill="#f4f4f4" stroke="${lc}" stroke-width="0.6"/>
                <path d="M-6,-12 C-8,-20 -2,-26 5,-24 C12,-22 16,-14 12,-6 C9,-1 1,0 -3,-4 Z" fill="${C(e.handSkin || "#f2cba8")}" stroke="${lc}" stroke-width="0.9"/>
                <path d="M-6,-12 C-14,-14 -22,-22 -30,-26 L-28,-34 C-20,-30 -10,-24 -4,-20 Z" fill="${C(e.sleeve || "#c8a96b")}" stroke="${lc}" stroke-width="0.9"/></g>`;
            })()}
          ${score ? `<text x="${e.scoreX ?? 20}" y="-2" font-size="13" font-family="DejaVu Sans" font-weight="700" text-anchor="middle" fill="#d8423a" transform="rotate(-10 20 -6)">${score}</text>` : ""}`;
      }
    }
    else if (kind === "worm") g = `<path d="M0,-14 C6,-10 -6,-6 0,-2 C6,2 -4,6 0,10" fill="none" stroke="${lc}" stroke-width="6" stroke-linecap="round"/>
        <path d="M0,-14 C6,-10 -6,-6 0,-2 C6,2 -4,6 0,10" fill="none" stroke="${fog(C("#e98aa0"))}" stroke-width="3.6" stroke-linecap="round"/><path d="M0,-20 L0,-14" stroke="${lc}" stroke-width="1.4"/>`;
    else if (kind === "fish") g = `<g transform="rotate(${Math.sin((e.t0 || 0) + st.x * 9) * 8})"><path d="M-16,0 C-10,-9 8,-9 14,0 C8,9 -10,9 -16,0 Z" fill="${fog(C(e.color || "#e0913a"))}" ${L}/>
        <path d="M14,0 L24,-8 L22,0 L24,8 Z" fill="${fog(C(e.color || "#e0913a"))}" ${L}/><circle cx="-9" cy="-2" r="2" fill="${lc}"/><path d="M-2,-5 Q2,0 -2,5" fill="none" ${L}/></g>`;
    else if (kind === "boot") g = `<path d="M-8,-34 L8,-34 L8,-6 L22,-4 Q26,4 20,6 L-8,6 Z" fill="${fog(C("#2f6b4f"))}" ${L}/><path d="M-8,-30 L8,-30" ${L}/>
        <path d="M-8,6 L20,6" stroke="${lc}" stroke-width="3"/><path d="M-6,-20 q4,-3 8,0" fill="none" stroke="${fog("#6fa58a")}" stroke-width="2"/>`;
    else if (kind === "can") g = `<rect x="-9" y="-24" width="18" height="24" rx="2" fill="${fog(C("#d84a4a"))}" ${L}/><ellipse cx="0" cy="-24" rx="9" ry="3" fill="${fog("#cfcfcf")}" ${L}/>
        <rect x="-9" y="-16" width="18" height="7" fill="${fog("#f3ead6")}"/><path d="M-4,-2 l3,-4 l3,4" fill="none" stroke="${lc}" stroke-width="1.2"/>`;
    else if (kind === "branch") g = `<path d="M-26,4 L22,-4" stroke="${lc}" stroke-width="7" stroke-linecap="round"/><path d="M-26,4 L22,-4" stroke="${fog(C("#8a6a45"))}" stroke-width="4" stroke-linecap="round"/>
        <path d="M2,0 L14,-14 M-10,2 L-18,-10" stroke="${fog(C("#8a6a45"))}" stroke-width="3" stroke-linecap="round"/><ellipse cx="16" cy="-16" rx="5" ry="3" fill="${fog(C("#5f9c45"))}" ${L}/>`;
    else if (kind === "mango") g = `<ellipse cx="0" cy="-10" rx="8" ry="10" fill="${fog(C("#e0b13a"))}" ${L}/><path d="M0,-20 l2,-5" ${L}/>`;
    return `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${st.rot.toFixed(1)}) scale(${s.toFixed(4)})">${g}</g>`;
  }, { y: st.y, bias: e.bias ?? -0.2 });
}

function draw(w, list, t) {
  const C2 = require("./life.js").col;
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
      drops(w, e, t, 1.0, (r) => { const a = r() * Math.PI * 2, s = 0.6 + r() * 1.6; return [Math.cos(a) * s * 0.7, 2.2 + r() * 2.2, Math.sin(a) * s * 0.5 - 0.4]; }, e.color || "#5a5a5a");
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
      let X0 = w.W * (e.sx ?? 0.5), Y0 = w.H * (e.sy ?? 0.3);
      if (e.at) { const q = w.proj(e.at); X0 = q[0]; Y0 = q[1]; } // teks menempel pada titik 3D (label benda)
      const fs = w.W * (e.size || 0.1), X = X0, Y = Y0, wob = 2 * Math.sin(tau * 30) * (tau < 0.4 ? 1 : 0);
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
      if (e.from && t < e.t + (e.dur || 0.4)) { // melompat dari e.from ke (x,z) dengan lintasan busur
        const k = (t - e.t) / (e.dur || 0.4), x = e.from[0] + (e.x - e.from[0]) * k, z = e.from[1] + (e.z - e.from[1]) * k;
        LIFE.cat(w, x, z, { mode: "leap", y: 4 * (e.h || 0.45) * k * (1 - k), flip: e.x > e.from[0], color: e.color, stripe: e.stripe, food: !!e.food });
      } else LIFE.cat(w, e.x, e.z, { mode: e.mode || "sit", flip: e.flip, color: e.color, stripe: e.stripe, food: !!e.food });
    } else if (e.type === "rod") {
      // JORAN: keys [[t, bx,by,bz, sudut(°), panjang, lengkung(0..1), tangkapan|null, lempar(0..1)]] — pangkal (dekat tangan),
      // arah dir (+1 kanan). Senar dari ujung: tanpa tangkapan -> turun ke air + pelampung; tegang -> miring ke dalam air;
      // dengan tangkapan -> benda tergantung di ujung senar, berayun.
      const K = e.keys; if (!K || !K.length || t < K[0][0] - (e.pre ?? 1e9)) continue;
      let i = 0; while (i + 1 < K.length && K[i + 1][0] <= t) i++;
      const a = K[i], b = K[Math.min(i + 1, K.length - 1)], u = b[0] > a[0] ? Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))) : 0;
      const L = (j) => (typeof a[j] === "number" && typeof b[j] === "number" ? a[j] + (b[j] - a[j]) * u : a[j]);
      if (a[7] === "hide") continue;
      const dir = e.dir || 1, bx = L(1), by = L(2), bz = L(3), ang = (L(4) * Math.PI) / 180, len = L(5), bend = L(6), cat = a[7];
      const WY = e.waterY ?? -0.12, pts = [];
      for (let k = 0; k <= 10; k++) { const q = k / 10, sag = bend * len * 0.55 * q * q; pts.push([bx + dir * Math.cos(ang) * len * q, by + Math.sin(ang) * len * q - sag, bz]); }
      const tip = pts[10];
      w.line3(pts, "#2a2a2a", null, { bias: -0.12, swk: 3.4 });
      const mahal = e.style === "mahal";
      w.line3(pts, C2(mahal ? "#2c5f8a" : "#c9a35a"), null, { bias: -0.13, swk: mahal ? 1.8 : 2.2 });
      if (mahal) { // joran mahal: pegangan hitam + gulungan (reel) perak berkilau
        w.line3([pts[0], pts[2]], C2("#2a2a2a"), null, { bias: -0.135, swk: 2.8 });
        const rp = pts[1];
        w.sprite(rp[0], rp[2], (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy + p * 0.05})"><circle r="${p * 0.045}" fill="#d9d9d9" stroke="${lc}" stroke-width="${sw * 0.7}"/>
          <circle r="${p * 0.015}" fill="#9a9a9a"/><path d="M0,0 L${p * 0.04 * Math.cos(t * 9)},${p * 0.04 * Math.sin(t * 9)}" stroke="${lc}" stroke-width="${sw * 0.6}"/></g>`, { y: rp[1], bias: -0.14 });
      } else for (let k = 2; k < 10; k += 2) { const q = pts[k + 1], m = pts[k].map((v, j) => v + (q[j] - v) * 0.12); w.line3([pts[k], m], "#7d5a2a", null, { bias: -0.135, swk: 2.8 }); } // ruas bambu
      const sway = Math.sin(t * 7) * 0.04;
      if (cat) { // tangkapan tergantung
        const hy = tip[1] - 0.32, hx = tip[0] + sway;
        w.line3([tip, [hx, hy + 0.06, bz]], "#3a3a3a", null, { bias: -0.125, swk: 0.5 });
        drawProp(w, cat, { x: hx, y: hy - (cat === "boot" ? 0.12 : cat === "can" ? 0.1 : cat === "worm" ? -0.18 : 0.02), z: bz - 0.01, rot: cat === "fish" ? 80 + Math.sin(t * 14) * 20 : cat === "worm" ? Math.sin(t * 5) * 15 : sway * 200, t }, false, { ...e, t0: t });
      } else if (bend > 0.25) { // tegang: senar miring masuk ke air
        const ex = tip[0] + dir * 0.6, ez = bz;
        w.line3([tip, [ex, WY, ez]], "#3a3a3a", null, { bias: -0.125, swk: 0.6 });
        drops(w, { t: Math.floor(t * 3) / 3, x: ex, y: WY, z: ez, n: 4, size: 0.6 }, t, 0.3, (r) => [(r() - 0.5) * 0.8, 1 + r(), (r() - 0.5) * 0.3], "#e6f4fa");
      } else {
        const bob = Math.sin(t * 2.4) * 0.012 - (e.bites || []).some(([b0, b1]) => t > b0 && t < b1) * (0.03 + 0.03 * Math.sin(t * 30));
        w.line3([tip, [tip[0], WY + 0.03 + bob, bz]], "#3a3a3a", null, { bias: -0.125, swk: 0.5 });
        w.sprite(tip[0], bz, (sx, sy, p, fog, lc, sw) => `<g transform="translate(${sx} ${sy})"><ellipse rx="${p * 0.025}" ry="${p * 0.035}" fill="#d84a4a" stroke="${lc}" stroke-width="${sw * 0.6}"/>
          <path d="M${-p * 0.025},0 L${p * 0.025},0" stroke="#ffffff" stroke-width="${sw * 0.8}"/></g>`, { y: WY + 0.03 + bob, bias: -0.13 });
        w.line3([[tip[0] - 0.08, WY + 0.002, bz], [tip[0] + 0.08, WY + 0.002, bz]], "#d6eef7", null, { layer: "ground", bias: -0.19, swk: 0.8 });
      }
    } else if (e.type === "ember") { // ember berisi ikan: fills [[t, jumlah]] (jumlah terakhir yang sudah lewat dipakai)
      let n = 0; for (const [ft, fn] of e.fills || []) if (t >= ft) n = fn;
      w.sprite(e.x, e.z, (sx, sy, p, fog, lc, sw) => {
        const s = p * 0.0085, L = `stroke="${lc}" stroke-width="${(sw * 0.7).toFixed(2)}" stroke-linejoin="round"`;
        let fish = "";
        for (let k = 0; k < Math.min(n, 5); k++) { const fx = -10 + k * 5, rot = -60 + k * 30 + Math.sin(t * 6 + k) * 8;
          fish += `<g transform="translate(${fx} -30) rotate(${rot})"><path d="M0,0 C-4,-6 -4,-14 0,-18 C4,-14 4,-6 0,0 Z" fill="${fog(C2("#e0913a"))}" ${L}/><path d="M0,-18 L-5,-25 L0,-22 L5,-25 Z" fill="${fog(C2("#e0913a"))}" ${L}/></g>`; }
        return `<g transform="translate(${sx} ${sy}) scale(${s})"><path d="M-18,-30 Q0,-52 18,-30" fill="none" ${L}/>
          <path d="M-18,-30 L18,-30 L13,0 L-13,0 Z" fill="${fog(C2("#3f86c4"))}" ${L}/>${fish}
          <ellipse cx="0" cy="-30" rx="18" ry="5" fill="${fog(C2(n ? "#4f9ac0" : "#2c5f8a"))}" ${L}/>
          <path d="M-18,-30 L18,-30 L13,0 L-13,0 Z" fill="none" ${L}/></g>`;
      }, { bias: e.bias ?? -0.08 });
    } else if (e.type === "waterfront") { // permukaan air di depan tokoh yang tercebur: menutup badan di bawah air
      if (e.t0 !== undefined && (t < e.t0 || t > (e.t1 ?? 1e9))) continue;
      const y = e.y ?? -0.12, d = e.depth || 1.4;
      w.face([[e.x0, y - d, e.z], [e.x1, y - d, e.z], [e.x1, y, e.z], [e.x0, y, e.z]], C2(e.color || "#5aa5c4"), { stroke: false, bias: -0.3 });
      const T = t * 3; // riak lingkaran di sekitar tokoh
      for (let k = 0; k < 2; k++) { const r = 0.25 + ((T + k * 0.5) % 1) * 0.5;
        w.line3(Array.from({ length: 13 }, (_, j) => { const a = (j / 12) * Math.PI * 2; return [e.cx + Math.cos(a) * r, y + 0.003, e.cz + Math.sin(a) * r * 0.6]; }), "#d6eef7", null, { layer: "ground", bias: -0.2, swk: 0.8 }); }
    } else if (e.type === "drip") { // tetesan air dari badan basah
      if (t < e.t0 || t > e.t1) continue;
      for (let k = 0; k < (e.n || 7); k++) { const ph = ((t * 1.6 + k * 0.37) % 1), x = e.x + ((k * 0.13) % 0.4) - 0.2, y = (e.y ?? 1.0) * (1 - ph) - 0.05;
        w.sprite(x, e.z, (sx, sy, p, fog, lc, sw) => `<ellipse cx="${sx}" cy="${sy}" rx="${p * 0.012}" ry="${p * 0.02}" fill="#7fc3e0" stroke="${lc}" stroke-width="${sw * 0.4}" opacity="${(1 - ph * 0.6).toFixed(2)}"/>`, { y, bias: -0.3 }); }
    } else if (e.type === "prop") { // benda bergerak berkeyframe: keys [[t,x,y,z,rot,arc,mode]] (mode untuk kucing)
      const st = keyAt(e.keys, t, e.hold);
      if (!st) continue;
      if (e.kind === "cat") {
        const LIFE = require("./life.js");
        const carry = e.carry && t >= (e.carry[0] ?? -1e9) && t < (e.carry[1] ?? 1e9) ? e.carryKind || "book" : null;
        LIFE.cat(w, st.x, st.z - 0.001, { mode: st.mode || "sit", y: st.y, flip: st.flip ?? e.flip, color: e.color, stripe: e.stripe, phase: 0, moving: st.moving, carry, fat: e.fatAt !== undefined && t >= e.fatAt });
      } else drawProp(w, e.kind, { ...st, t }, t >= (e.dentAt ?? 1e9), e);
    } else if (e.type === "jemuran") {
      P.jemuran(w, e.x, e.za, e.zb);
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
