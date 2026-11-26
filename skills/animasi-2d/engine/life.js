// KEHIDUPAN LINGKUNGAN: hewan, benda bergerak & benda kampung agar latar ramai dan hidup.
// Semua bergerak menurut waktu w.t (deterministik). Warna otomatis abu-abu bila bukan mode warna (WARNA=1).
//
//   const L = require("../engine/life.js");
//   L.cat(w, x, z, { mode: "sleep" | "sit" | "walk", to: [x2, z2], speed, color })
//   L.ducks(w, [[x,z], [x,z], ...], { n: 4 })          bebek berbaris menyusuri rute (loop)
//   L.butterfly(w, x, z, { y, r })                     kupu-kupu terbang berputar di sekitar titik
//   L.kite(w, x, z, { y })                             layangan di langit + benang, meliuk
//   L.flag(w, x, z, { h })                             bendera merah-putih berkibar di tiang bambu
//   L.smoke(w, x, z, { y })                            asap dapur mengepul (loop)
//   L.leaves(w, x, z, { y, spread })                   daun berguguran melayang dari pohon
//   L.perchBirds(w, x, z, { y, n, len })               burung kecil hinggap di kabel/atap, mematuk & meloncat
//   L.cyclist(w, [x0,z0], [x1,z1], { period, phase })  orang bersepeda ontel lewat (siluet figuran)
//   L.cart(w, [x0,z0], [x1,z1], { period, phase })     gerobak bakso didorong pedagang lewat
//   L.bike(w, x, z) / L.bucket / L.trashBin / L.sack / L.firewood / L.waterJar    benda kampung diam
const THEME = require("./theme.js");

// warna: mode abu-abu -> luminansi (gaya asli tetap abu-abu)
const col = (h) => {
  if (THEME.COLOR) return h;
  const n = parseInt(h.slice(1), 16), v = Math.round(0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255));
  const x = v.toString(16).padStart(2, "0");
  return `#${x}${x}${x}`;
};
const TAU = Math.PI * 2;
const hash = (a) => { const s = Math.sin(a * 127.1) * 43758.5453; return s - Math.floor(s); };
const lerp = (a, b, k) => a + (b - a) * k;

// ---------------- HEWAN ----------------
function cat(w, x, z, o = {}) {
  const T = w.t || 0, mode = o.mode || "sleep", c = col(o.color || "#e59a4c"), c2 = col(o.stripe || "#b8692c");
  let px = x, pz = z, dir = o.flip ? -1 : 1;
  if (mode === "walk" && o.to) { // bolak-balik dengan jeda
    const L = Math.hypot(o.to[0] - x, o.to[1] - z), sp = o.speed || 0.35, per = (2 * L) / sp + 4, u = ((T + (o.phase || 0)) % per);
    const go = L / sp;
    const k = u < go ? u / go : u < go + 2 ? 1 : u < 2 * go + 2 ? 1 - (u - go - 2) / go : 0;
    px = lerp(x, o.to[0], k); pz = lerp(z, o.to[1], k);
    dir = (u < go + 2 ? 1 : -1) * Math.sign(o.to[0] - x || 1);
    var moving = (u < go) || (u > go + 2 && u < 2 * go + 2);
  }
  if (w.castBlob) w.castBlob(px, pz, 0.15 + (o.y || 0), 0.2, { strength: 0.6 });
  w.sprite(px, pz, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.01, L = `stroke="${lc}" stroke-width="${(sw * 0.7).toFixed(2)}" stroke-linejoin="round" stroke-linecap="round"`;
    if (mode === "sleep") { // meringkuk, napas, ekor melingkar, zzz kecil
      const br = 1 + 0.04 * Math.sin(T * 2.4);
      return `<g transform="translate(${sx} ${sy}) scale(${dir * s} ${s})">
        <ellipse cx="0" cy="${-9 * br}" rx="${21}" ry="${10 * br}" fill="${fog(c)}" ${L}/>
        <path d="M-8,${-17 * br} q4,4 0,9 M0,${-18 * br} q4,4 0,10 M8,${-17 * br} q4,4 0,9" stroke="${fog(c2)}" stroke-width="2.5" fill="none"/>
        <path d="M18,-4 Q28,-2 22,-12 Q14,-18 8,-12" fill="none" ${L} stroke-width="${sw * 1.6}" stroke="${fog(c)}"/>
        <circle cx="-16" cy="${-12 * br}" r="8" fill="${fog(c)}" ${L}/><path d="M-22,${-18 * br} l1,-7 l5,5 M-14,${-19 * br} l3,-6 l3,6" fill="${fog(c)}" ${L}/>
        <path d="M-20,${-12 * br} q2,2 4,0" fill="none" ${L}/>
        <text x="-20" y="${-30 - 4 * Math.sin(T * 1.2)}" font-size="9" font-family="DejaVu Sans" fill="${lc}" opacity="${0.5 + 0.5 * Math.sin(T * 1.2)}">z</text></g>`;
    }
    const tail = mode === "sit" ? 18 * Math.sin(T * 2.2 + x) : 10 * Math.sin(T * 6);
    const step = moving ? Math.sin(T * 10) * 5 : 0, look = mode === "sit" ? 3 * Math.sin(T * 0.7 + z) : 0;
    if (mode === "sit") return `<g transform="translate(${sx} ${sy}) scale(${dir * s} ${s})">
        <path d="M10,-2 Q${26 + tail * 0.3},${-6} ${22 + tail * 0.4},${-22 - tail * 0.3}" fill="none" stroke="${fog(c)}" stroke-width="${sw * 1.8}" stroke-linecap="round"/>
        <ellipse cx="0" cy="-14" rx="12" ry="15" fill="${fog(c)}" ${L}/><path d="M-6,-24 q6,3 12,0" stroke="${fog(c2)}" stroke-width="2.5" fill="none"/>
        <g transform="translate(${look} 0)"><circle cx="-2" cy="-33" r="9" fill="${fog(c)}" ${L}/>
        <path d="M-10,-38 l1,-9 l6,5 M2,-41 l4,-7 l3,8" fill="${fog(c)}" ${L}/>
        <circle cx="-6" cy="-34" r="1.4" fill="${lc}"/><circle cx="1" cy="-34" r="1.4" fill="${lc}"/></g>
        <path d="M-7,-2 l0,2 M5,-2 l0,2" ${L}/></g>`;
    return `<g transform="translate(${sx} ${sy}) scale(${dir * s} ${s})">
        <path d="M18,-14 Q30,${-20 - tail} 34,${-30 - tail}" fill="none" stroke="${fog(c)}" stroke-width="${sw * 1.8}" stroke-linecap="round"/>
        <path d="M-12,-8 l${step * 0.6},8 M-4,-8 l${-step * 0.6},8 M10,-8 l${-step * 0.6},8 M16,-8 l${step * 0.6},8" ${L} stroke-width="${sw * 1.4}" stroke="${fog(c2)}"/>
        <ellipse cx="2" cy="-14" rx="20" ry="9" fill="${fog(c)}" ${L}/><path d="M-4,-21 q2,4 0,7 M4,-22 q2,4 0,8" stroke="${fog(c2)}" stroke-width="2.5" fill="none"/>
        <circle cx="-20" cy="${-22 + Math.abs(step) * 0.2}" r="8" fill="${fog(c)}" ${L}/><path d="M-26,-27 l0,-8 l5,5 M-18,-29 l3,-7 l2,7" fill="${fog(c)}" ${L}/>
        <circle cx="-24" cy="-23" r="1.3" fill="${lc}"/></g>`;
  }, { bias: -0.05, y: o.y || 0 });
}

function ducks(w, route, o = {}) {
  const T = w.t || 0, n = o.n || 4, sp = o.speed || 0.35;
  const segs = []; let total = 0;
  for (let i = 0; i < route.length; i++) { const a = route[i], b = route[(i + 1) % route.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, L]); total += L; }
  const at = (d) => { d = ((d % total) + total) % total; for (const [a, b, L] of segs) { if (d <= L) return [lerp(a[0], b[0], d / L), lerp(a[1], b[1], d / L), Math.sign(b[0] - a[0]) || 1]; d -= L; } return [route[0][0], route[0][1], 1]; };
  for (let i = 0; i < n; i++) {
    const big = i === 0, [x, z, dir] = at(T * sp - i * 0.45);
    if (w.castBlob) w.castBlob(x, z, 0.12, 0.13, { strength: 0.5 });
    w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
      const s = p * (big ? 0.0105 : 0.0085), wob = Math.sin(T * 9 + i) * 6, b = Math.abs(Math.sin(T * 9 + i)) * 1.5;
      const L = `stroke="${lc}" stroke-width="${(sw * 0.7).toFixed(2)}" stroke-linejoin="round"`;
      return `<g transform="translate(${sx} ${sy - b}) scale(${dir * s} ${s}) rotate(${wob})">
        <path d="M-14,-10 Q-16,-24 0,-22 Q16,-24 18,-14 Q14,-2 0,-2 Q-12,-2 -14,-10 Z" fill="${fog(col("#f7f3e8"))}" ${L}/>
        <path d="M-2,-16 q8,-2 12,4" fill="none" ${L}/>
        <path d="M12,-18 Q10,-34 18,-36 Q26,-36 25,-28 Q24,-22 18,-20" fill="${fog(col("#f7f3e8"))}" ${L}/>
        <path d="M24,-31 l9,1 l-8,3 Z" fill="${fog(col("#f0a03a"))}" ${L}/><circle cx="20" cy="-31" r="1.4" fill="${lc}"/>
        <path d="M-4,-2 l0,3 l-3,0 M6,-2 l0,3 l3,0" fill="none" stroke="${fog(col("#f0a03a"))}" stroke-width="2"/></g>`;
    }, { bias: -0.05 });
  }
}

function butterfly(w, x, z, o = {}) {
  const T = (w.t || 0) + (o.phase || 0), r = o.r || 0.6;
  const px = x + r * Math.sin(T * 0.9) + 0.2 * Math.sin(T * 2.3), pz = z + r * 0.5 * Math.cos(T * 0.7), py = (o.y || 0.9) + 0.25 * Math.sin(T * 1.7);
  w.sprite(px, pz, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.006, fl = Math.abs(Math.cos(T * 14)) * 0.85 + 0.15, c = col(o.color || "#f2b632"), c2 = col(o.color2 || "#e2632c");
    return `<g transform="translate(${sx} ${sy}) scale(${s})" stroke="${lc}" stroke-width="1.2">
      <g transform="scale(${fl} 1)"><path d="M0,0 C-14,-18 -24,-6 -16,4 C-22,12 -10,16 0,4 Z" fill="${fog(c)}"/><path d="M0,0 C14,-18 24,-6 16,4 C22,12 10,16 0,4 Z" fill="${fog(c)}"/>
      <circle cx="-12" cy="-6" r="3" fill="${fog(c2)}" stroke="none"/><circle cx="12" cy="-6" r="3" fill="${fog(c2)}" stroke="none"/></g>
      <path d="M0,-6 L0,8" stroke-width="2.4"/></g>`;
  }, { y: py, bias: -0.1 });
}

function kite(w, x, z, o = {}) {
  const T = (w.t || 0) + (o.phase || 0), y = (o.y || 14) + 0.6 * Math.sin(T * 0.8), dx = 0.8 * Math.sin(T * 0.6);
  w.sprite(x + dx, z, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.03, rot = 10 * Math.sin(T * 1.1), c = col(o.color || "#e0453a"), c2 = col(o.color2 || "#f4d23c");
    let tail = `M0,22`; for (let i = 1; i <= 8; i++) tail += ` L${(6 * Math.sin(T * 3 + i * 0.8)).toFixed(1)},${22 + i * 7}`;
    return `<g transform="translate(${sx} ${sy}) rotate(${rot}) scale(${s})" stroke="${lc}" stroke-width="1.4" stroke-linejoin="round">
      <path d="M0,-22 L16,0 L0,22 L-16,0 Z" fill="${fog(c)}"/><path d="M0,-22 L0,22 M-16,0 L16,0" stroke-width="1"/>
      <path d="M0,-22 L16,0 L0,0 Z" fill="${fog(c2)}"/><path d="${tail}" fill="none" stroke="${fog(c2)}" stroke-width="2"/></g>
      <path d="M${sx},${sy} Q${sx + 40},${sy + 120} ${sx + 60 + 20 * Math.sin(T)},${w.H * 1.1}" fill="none" stroke="${fog("#9a9a9a")}" stroke-width="0.8"/>`;
  }, { y, layer: "far", bias: -1 });
}

function flag(w, x, z, o = {}) {
  const T = w.t || 0, h = o.h || 4;
  w.box(x - 0.04, 0, z - 0.04, 0.08, h, 0.08, col("#cbab6b"));
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const W2 = p * 0.9, H2 = p * 0.6;
    const wave = (u, ph) => Math.sin(T * 5 - u * 5 + ph) * p * 0.06 * u;
    let top = "", bot = "";
    for (let i = 0; i <= 10; i++) { const u = i / 10; top += `${i ? "L" : "M"}${(sx + u * W2).toFixed(1)},${(sy + wave(u, 0)).toFixed(1)} `; }
    for (let i = 10; i >= 0; i--) { const u = i / 10; bot += `L${(sx + u * W2).toFixed(1)},${(sy + H2 + wave(u, 0.4)).toFixed(1)} `; }
    let mid = ""; for (let i = 0; i <= 10; i++) { const u = i / 10; mid += `${i ? "L" : "M"}${(sx + u * W2).toFixed(1)},${(sy + H2 / 2 + wave(u, 0.2)).toFixed(1)} `; }
    let midB = ""; for (let i = 10; i >= 0; i--) { const u = i / 10; midB += `L${(sx + u * W2).toFixed(1)},${(sy + wave(u, 0)).toFixed(1)} `; }
    return `<path d="${top}${bot}Z" fill="${fog("#fafafa")}"/><path d="${mid}${midB}Z" fill="${fog(col("#d8343a"))}"/><path d="${top}${bot}Z" fill="none" stroke="${lc}" stroke-width="${sw * 0.7}"/>
      <path d="${mid}" fill="none" stroke="${fog("#eeeeee")}" stroke-width="0.6"/>`;
  }, { y: h - 0.05, bias: -0.1 });
}

function smoke(w, x, z, o = {}) {
  const T = (w.t || 0) + (o.phase || 0), y0 = o.y || 2.6;
  for (let i = 0; i < 6; i++) {
    const age = ((T * 0.35 + i / 6) % 1), y = y0 + age * 2.2, dx = 0.25 * Math.sin(age * 6 + i) + age * 0.6;
    w.sprite(x + dx, z, (sx, sy, p, fog, lc, sw) => {
      const r = p * (0.12 + age * 0.35);
      return `<circle cx="${sx}" cy="${sy}" r="${r.toFixed(1)}" fill="${fog(col("#e8e6e1"))}" opacity="${(0.55 * (1 - age)).toFixed(2)}"/>`;
    }, { y, layer: "obj", bias: -0.5 });
  }
}

function leaves(w, x, z, o = {}) {
  const T = (w.t || 0) + (o.phase || 0), y0 = o.y || 3.5, sp = o.spread || 1.2;
  const cs = ["#7aa84a", "#c9a03a", "#a8743a", "#d08a3a"];
  for (let i = 0; i < (o.n || 5); i++) {
    const per = 5 + hash(i + x) * 3, age = ((T + hash(i * 3 + z) * per) % per) / per;
    const px = x + (hash(i + 7) - 0.5) * sp + 0.4 * Math.sin(T * 1.5 + i) , py = y0 * (1 - age), pz = z + (hash(i + 11) - 0.5) * sp;
    if (py < 0.02) continue;
    w.sprite(px, pz, (sx, sy, p, fog, lc, sw) => {
      const s = p * 0.0045, rot = (T * 140 + i * 60) % 360, flip = Math.cos(T * 3 + i);
      return `<g transform="translate(${sx} ${sy}) rotate(${rot}) scale(${(s * flip).toFixed(4)} ${s})"><path d="M-10,0 Q0,-7 10,0 Q0,7 -10,0 Z" fill="${fog(col(cs[i % 4]))}" stroke="${lc}" stroke-width="1"/></g>`;
    }, { y: py, bias: -0.2 });
  }
}

function perchBirds(w, x, z, o = {}) {
  const T = w.t || 0, n = o.n || 3, len = o.len || 1.2, y = o.y || 3;
  for (let i = 0; i < n; i++) {
    const off = (i / Math.max(1, n - 1) - 0.5) * len, bx = o.axis === "z" ? x : x + off, bz = o.axis === "z" ? z + off : z, ph = hash(i + x), hop = Math.max(0, Math.sin(T * 1.3 + ph * 9)) > 0.97 ? 1 : 0;
    const peck = Math.sin(T * 4 + ph * 20) > 0.8;
    w.sprite(bx, bz, (sx, sy, p, fog, lc, sw) => {
      const s = p * 0.006, d = ph > 0.5 ? 1 : -1;
      return `<g transform="translate(${sx} ${sy - hop * p * 0.06}) scale(${d * s} ${s})" stroke="${lc}" stroke-width="1.3" stroke-linejoin="round">
        <path d="M-10,-8 Q-8,-18 4,-16 Q12,-14 10,-6 Q4,0 -6,-2 Z" fill="${fog(col("#8a6a4a"))}"/>
        <path d="M-10,-8 L-18,-4 L-10,-4" fill="${fog(col("#6a4a32"))}"/>
        <g transform="rotate(${peck ? 25 : 0} 6 -14)"><circle cx="8" cy="-16" r="5" fill="${fog(col("#8a6a4a"))}"/><path d="M12,-17 l5,1.5 l-5,1.5 Z" fill="${fog(col("#e0a030"))}"/><circle cx="9" cy="-17" r="1" fill="${lc}"/></g>
        <path d="M-2,-2 l0,4 M2,-2 l0,4" stroke-width="1"/></g>`;
    }, { y, bias: -0.3 });
  }
}

// ---------------- BENDA BERGERAK (figuran kendaraan) ----------------
function travel(T, a, b, per, phase) { // bolak-balik a->b->a dengan periode per
  const u = (((T + (phase || 0)) % per) + per) % per / per;
  const k = u < 0.5 ? u * 2 : 2 - u * 2, dir = u < 0.5 ? Math.sign(b[0] - a[0]) || 1 : -(Math.sign(b[0] - a[0]) || 1);
  return { x: lerp(a[0], b[0], k), z: lerp(a[1], b[1], k), dir };
}
const SIL = () => col("#8d8d8d"); // siluet figuran (selaras gaya figuran)

function cyclist(w, a, b, o = {}) {
  const T = w.t || 0, per = o.period || 18, m = travel(T, a, b, per, o.phase);
  if (w.castBlob) w.castBlob(m.x, m.z, 0.9, 0.5, { strength: 0.5 });
  w.sprite(m.x, m.z, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.01, R = 30, sp = (T * 6) % TAU, frame = fog(col(o.color || "#2f6b8f")), sil = fog(SIL());
    const spokes = (cx) => [0, 1, 2, 3].map((k) => { const an = sp + (k * Math.PI) / 4; return `M${cx + Math.cos(an) * R},${-R + Math.sin(an) * R} L${cx - Math.cos(an) * R},${-R - Math.sin(an) * R}`; }).join(" ");
    const ped = Math.sin(T * 6) * 14;
    return `<g transform="translate(${sx} ${sy}) scale(${m.dir * s} ${s})" stroke="${lc}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="-48" cy="${-R}" r="${R}" fill="none" stroke-width="3"/><circle cx="48" cy="${-R}" r="${R}" fill="none" stroke-width="3"/>
      <path d="${spokes(-48)} ${spokes(48)}" stroke-width="0.8" opacity="0.7"/>
      <path d="M-48,${-R} L-6,${-R} L22,-74 L-14,-74 Z M22,-74 L48,${-R} M-14,-74 L-20,-86 M22,-74 L26,-96 L36,-98" fill="none" stroke="${frame}" stroke-width="4"/>
      <g opacity="0.92"><path d="M-6,${-R} l${ped * 0.6},${-12 - ped * 0.3} l4,-34" stroke="${sil}" stroke-width="9"/><path d="M-6,${-R} l${-ped * 0.6},${-12 + ped * 0.3} l4,-34" stroke="${sil}" stroke-width="9"/>
      <path d="M-14,-92 Q-6,-130 6,-132 Q20,-120 30,-98" stroke="${sil}" stroke-width="14" fill="none"/>
      <circle cx="4" cy="-152" r="17" fill="${sil}" stroke="none"/></g></g>`;
  }, { bias: -0.05 });
}

function cart(w, a, b, o = {}) {
  const T = w.t || 0, per = o.period || 30, m = travel(T, a, b, per, o.phase);
  if (w.castBlob) w.castBlob(m.x, m.z, 1.2, 0.7, { strength: 0.6 });
  w.sprite(m.x, m.z, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.01, wl = (T * 3) % TAU, sil = fog(SIL()), walk = Math.sin(T * 6) * 12;
    return `<g transform="translate(${sx} ${sy}) scale(${m.dir * s} ${s})" stroke="${lc}" stroke-width="2.2" stroke-linejoin="round">
      <rect x="-60" y="-112" width="110" height="62" rx="4" fill="${fog(col("#f1e6c8"))}"/>
      <rect x="-60" y="-112" width="110" height="14" fill="${fog(col("#c8452f"))}"/>
      <text x="-5" y="-66" font-size="20" font-weight="900" font-family="DejaVu Sans" text-anchor="middle" fill="${fog(col("#c8452f"))}" stroke="none">BAKSO</text>
      <path d="M-66,-112 L-66,-170 L56,-170 L56,-112" fill="none" stroke-width="3"/><path d="M-76,-170 L66,-170 L56,-186 L-66,-186 Z" fill="${fog(col("#3f7f8f"))}"/>
      <rect x="18" y="-140" width="22" height="26" rx="3" fill="${fog(col("#9a9a9a"))}"/>
      <path d="M${10 + 8 * Math.sin(T * 2)},-146 q6,-10 0,-18 M${24 + 6 * Math.sin(T * 2 + 1)},-148 q6,-10 0,-18" fill="none" stroke="${fog("#dddddd")}" stroke-width="2" opacity="0.7"/>
      <circle cx="-30" cy="-28" r="22" fill="${fog(col("#555555"))}"/><path d="M-30,-28 l${Math.cos(wl) * 20},${Math.sin(wl) * 20} M-30,-28 l${-Math.sin(wl) * 20},${Math.cos(wl) * 20}" stroke-width="1.5"/>
      <path d="M50,-80 L84,-70" stroke-width="4"/>
      <g opacity="0.92"><path d="M96,0 l${walk * 0.5},-44 M96,0 l${-walk * 0.5},-44" stroke="${sil}" stroke-width="10" stroke-linecap="round" transform="translate(0 0)"/>
      <path d="M96,-44 L100,-100" stroke="${sil}" stroke-width="22" stroke-linecap="round"/><path d="M98,-86 L84,-72" stroke="${sil}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="102" cy="-122" r="16" fill="${sil}" stroke="none"/><path d="M80,-126 L124,-126 L102,-146 Z" fill="${fog(col("#d9c28a"))}"/></g></g>`;
  }, { bias: -0.05 });
}

// ---------------- BENDA KAMPUNG (diam) ----------------
function bike(w, x, z, o = {}) { // sepeda ontel bersandar
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.0095 * (o.flip ? -1 : 1), R = 30, fr = fog(col(o.color || "#2f6b4f"));
    return `<g transform="translate(${sx} ${sy}) scale(${s} ${Math.abs(s)}) rotate(-4)" stroke="${lc}" stroke-width="2.2" fill="none" stroke-linecap="round">
      <circle cx="-48" cy="${-R}" r="${R}" stroke-width="3"/><circle cx="48" cy="${-R}" r="${R}" stroke-width="3"/>
      <path d="M-48,${-R} L-6,${-R} L22,-74 L-14,-74 Z M22,-74 L48,${-R} M-14,-74 L-20,-86 M22,-74 L26,-96 L36,-98" stroke="${fr}" stroke-width="4"/>
      <path d="M-30,-88 L-8,-88" stroke-width="5"/><rect x="-62" y="-72" width="24" height="8" fill="${fog(col("#8d5f3c"))}"/></g>`;
  }, { bias: -0.04 });
}
function bucket(w, x, z, o = {}) { w.prism(x, z, 0.14, 0, 0.26, 10, col(o.color || "#3f86c4"), { capColor: col("#2c5f8a") }); }
function trashBin(w, x, z) { w.prism(x, z, 0.22, 0, 0.62, 10, col("#2f7a4f"), { capColor: col("#245f3d") }); }
function sack(w, x, z) {
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => { const s = p * 0.01;
    return `<g transform="translate(${sx} ${sy}) scale(${s})" stroke="${lc}" stroke-width="2"><path d="M-22,0 Q-28,-30 -16,-46 L16,-46 Q28,-30 22,0 Z" fill="${fog(col("#e7dcc0"))}"/>
      <path d="M-16,-46 Q0,-56 16,-46" fill="none"/><text x="0" y="-18" font-size="10" text-anchor="middle" font-family="DejaVu Sans" fill="${fog(col("#3a6ea5"))}" stroke="none">BERAS</text></g>`; }, { bias: -0.04 });
}
function firewood(w, x, z, o = {}) {
  const n = o.n || 6;
  for (let i = 0; i < n; i++) w.box(x - 0.35, 0.07 * Math.floor(i / 3) * 1.6, z + (i % 3) * 0.12, 0.7, 0.1, 0.1, col(i % 2 ? "#8d5f3c" : "#7a5236"), { swk: 0.5 });
}
function waterJar(w, x, z) { // gentong tanah liat
  w.sprite(x, z, (sx, sy, p, fog, lc, sw) => { const s = p * 0.01;
    return `<g transform="translate(${sx} ${sy}) scale(${s})" stroke="${lc}" stroke-width="2.2"><path d="M-18,0 Q-36,-26 -20,-50 L20,-50 Q36,-26 18,0 Z" fill="${fog(col("#b8643a"))}"/>
      <rect x="-22" y="-56" width="44" height="8" rx="3" fill="${fog(col("#9c5330"))}"/><path d="M-24,-30 Q0,-24 24,-30" fill="none" stroke="${fog(col("#8a4a2a"))}"/></g>`; }, { bias: -0.04 });
}

module.exports = { col, cat, ducks, butterfly, kite, flag, smoke, leaves, perchBirds, cyclist, cart, bike, bucket, trashBin, sack, firewood, waterJar };
