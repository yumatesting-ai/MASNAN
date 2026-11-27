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

// objek JAUH dibuat seperti figuran: siluet abu-abu buram, makin jauh makin pudar (selaras gaya figuran)
const FAR_FROM = 0.25; // fogK mulai berubah jadi siluet (±15 m dari kamera)
function farWrap(w, z, svg) {
  const k = w.fogK ? w.fogK(z) : 0;
  if (k < FAR_FROM) return svg;
  const b = Math.round(Math.min(0.6, k) * 10) / 10, id = `lifeFar${Math.round(b * 10)}`;
  w._lifeFar = w._lifeFar || new Set();
  if (!w._lifeFar.has(id)) {
    w._lifeFar.add(id);
    const g = (0.5 + b * 0.6).toFixed(3);
    w.add("sky", 2e9, `<defs><filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 ${g}  0 0 0 0 ${g}  0 0 0 0 ${g}  0 0 0 0.85 0"/><feGaussianBlur stdDeviation="1.4"/></filter></defs>`);
  }
  return `<g filter="url(#${id})">${svg}</g>`;
}
const spr = (w, x, z, fn, o) => w.sprite(x, z, (sx, sy, p, fog, lc, sw) => farWrap(w, z, fn(sx, sy, p, fog, lc, sw)), o);
// benda bergerak mendaftarkan posisinya (untuk cek tabrakan tokoh vs kendaraan/hewan, tools/location.js --check)
const mover = (w, name, x, z, r) => { if (w.movers) w.movers.push({ name, x, z, r }); };
const TAU = Math.PI * 2;
const hash = (a) => { const s = Math.sin(a * 127.1) * 43758.5453; return s - Math.floor(s); };
const lerp = (a, b, k) => a + (b - a) * k;

// ---------------- HEWAN ----------------
function cat(w, x, z, o = {}) {
  const T = (w.t || 0) + (o.phase || 0), mode = o.mode || "sleep";
  const c = col(o.color || "#e59a4c"), c2 = col(o.stripe || "#b8692c"), cream = col(o.belly || "#f8ecd9"), pink = col("#f2a3ae");
  let px = x, pz = z, dir = o.flip ? -1 : 1, moving = false;
  if (mode === "walk" && o.to) { // bolak-balik dengan jeda
    const L = Math.hypot(o.to[0] - x, o.to[1] - z), sp = o.speed || 0.35, per = (2 * L) / sp + 4, u = T % per, go = L / sp;
    const k = u < go ? u / go : u < go + 2 ? 1 : u < 2 * go + 2 ? 1 - (u - go - 2) / go : 0;
    px = lerp(x, o.to[0], k); pz = lerp(z, o.to[1], k);
    dir = (u < go + 2 ? -1 : 1) * Math.sign(o.to[0] - x || 1);
    moving = u < go || (u > go + 2 && u < 2 * go + 2);
  }
  if (o.moving !== undefined) moving = o.moving; // digerakkan dari luar (fx prop): kaki melangkah saat bergerak
  if (mode === "walk") mover(w, "kucing", px, pz, 0.25);
  if (w.castBlob) w.castBlob(px, pz, 0.15 + (o.y || 0), 0.2, { strength: 0.6 });
  // kedip & kedut telinga sesekali (deterministik)
  const blink = (Math.sin(T * 0.9 + x * 3) > 0.985 || ((T + x) % 3.7) < 0.12) ? 1 : 0;
  const earT = Math.max(0, Math.sin(T * 1.7 + z)) > 0.97 ? -14 : 0;
  spr(w, px, pz, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.01, Lw = (sw * 0.65).toFixed(2), L = `stroke="${lc}" stroke-width="${Lw}" stroke-linejoin="round" stroke-linecap="round"`;
    const F = (h) => fog(h);
    const eye = (ex, ey, closed) => closed
      ? `<path d="M${ex - 2.6},${ey} q2.6,2.2 5.2,0" fill="none" ${L}/>`
      : `<ellipse cx="${ex}" cy="${ey}" rx="2.4" ry="3" fill="${lc}"/><circle cx="${ex - 0.8}" cy="${ey - 1.1}" r="0.9" fill="#ffffff"/>`;
    const head = (hx, hy, closed, food) => `
      <g transform="translate(${hx} ${hy})">
        <g transform="rotate(${earT} -7 -8)"><path d="M-11,-5 L-8,-17 L-1,-9 Z" fill="${F(c)}" ${L}/><path d="M-9,-7 L-7.5,-13.5 L-3.5,-9 Z" fill="${F(pink)}"/></g>
        <path d="M3,-9 L9,-17 L11,-5 Z" fill="${F(c)}" ${L}/><path d="M4.5,-9 L8.5,-13.5 L9.5,-7 Z" fill="${F(pink)}"/>
        <ellipse cx="0" cy="0" rx="12.5" ry="10.5" fill="${F(c)}" ${L}/>
        <path d="M-3,-10 q1,4 0,6 M1,-10.5 q1,4 0,6 M5,-10 q-0.5,3.5 -1,5.5" fill="none" stroke="${F(c2)}" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="-3" cy="5" rx="7" ry="4.6" fill="${F(cream)}"/>
        ${eye(-7.2, -0.5, closed)}${eye(1.8, -0.5, closed)}
        <path d="M-3.6,2.6 l1.4,1.3 l1.4,-1.3 Z" fill="${F(pink)}" ${L} stroke-width="${(sw * 0.4).toFixed(2)}"/>
        ${food ? "" : `<path d="M-4.9,4.6 q1.2,1.5 2.7,0 q1.5,1.5 2.7,0" fill="none" ${L} stroke-width="${(sw * 0.45).toFixed(2)}"/>`}
        <path d="M-10,2.5 l-7,-1.3 M-10,4.2 l-7,1.2 M5,2.5 l7,-1.3 M5,4.2 l7,1.2" stroke="${lc}" stroke-width="${(sw * 0.3).toFixed(2)}" opacity="0.7"/>
        <ellipse cx="-8.5" cy="3.6" rx="2" ry="1.1" fill="${F(pink)}" opacity="0.6"/><ellipse cx="3.5" cy="3.6" rx="2" ry="1.1" fill="${F(pink)}" opacity="0.6"/>
        ${food ? `<g transform="rotate(28 -6 7)"><ellipse cx="-9" cy="9" rx="6" ry="3.2" fill="${F(col("#d99a3f"))}" ${L}/>
          <path d="M-13,9 q2,-1.6 4,0 q2,1.6 4,0" fill="none" stroke="${F(col("#b0702a"))}" stroke-width="1"/></g>
          <path d="M-4.6,4.4 q1.6,2 3.4,0.2" fill="${F(col("#7a2f35"))}" ${L} stroke-width="${(sw * 0.4).toFixed(2)}"/>` : ""}
      </g>`;
    let body;
    if (mode === "sleep") { // meringkuk: napas, ekor melingkar ke depan, kepala bersandar
      const br = 1 + 0.035 * Math.sin(T * 2.2);
      body = `<g transform="translate(0 0) scale(1 ${br.toFixed(3)})" transform-origin="0 0">
        <ellipse cx="2" cy="-9" rx="22" ry="10.5" fill="${F(c)}" ${L}/>
        <path d="M-6,-18 q3,4 0,8 M2,-19.5 q3,4 0,9 M10,-18 q3,4 0,8" fill="none" stroke="${F(c2)}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M20,-5 Q28,2 14,3 L-14,3 Q-22,2 -20,-3" fill="${F(c)}" ${L}/>
        <path d="M-14,2 Q-4,5 8,2" fill="none" stroke="${F(c2)}" stroke-width="2" stroke-linecap="round" opacity="0.8"/></g>
        <g transform="scale(0.85) translate(-16 -10)">${head(0, 0, true, false)}</g>
        <ellipse cx="-24" cy="-2" rx="4" ry="2.6" fill="${F(c)}" ${L}/>
        <text x="-22" y="${-30 - 3 * Math.sin(T * 1.2)}" font-size="9" font-family="DejaVu Sans" font-weight="700" fill="${lc}" opacity="${(0.4 + 0.5 * Math.abs(Math.sin(T * 1.2))).toFixed(2)}">z</text>`;
    } else if (mode === "walk" || mode === "leap" || mode === "climb") { // tampak samping menghadap kiri: 4 kaki bergantian, ekor tegak bergoyang
      const LEAP = mode === "leap"; // melompat: kaki depan menjulur ke depan, kaki belakang ke belakang, ekor lurus
      const g = moving ? T * (mode === "climb" ? 12 : 9) : 0, A = moving ? (mode === "climb" ? 9 : 7) : 0, bob = moving ? Math.abs(Math.sin(g)) * 1.2 : 0;
      const leg = (lx, ph, back) => { const a = LEAP ? (lx < 0 ? -16 : 16) : Math.sin(g + ph) * A; return `<path d="M${lx},-10 L${lx + a * 0.5},-1 L${lx + a * 0.5 - 2.5},0" fill="none" stroke="${F(back ? c2 : c)}" stroke-width="${(sw * 2.6).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M${lx},-10 L${lx + a * 0.5},-1 L${lx + a * 0.5 - 2.5},0" fill="none" stroke="${lc}" stroke-width="${(sw * 2.6 + sw * 1.3).toFixed(2)}" stroke-linecap="round" opacity="0" />`; };
      const sway = LEAP ? 14 : Math.sin(T * 3) * 6;
      body = `<g transform="translate(0 ${-bob})">
        ${leg(12, Math.PI, true)}${leg(-6, 0, true)}
        <path d="M17,-17 Q30,-22 ${30 + sway * 0.4},${-36 + Math.abs(sway) * 0.3} Q${32 + sway * 0.6},${-44} ${27 + sway},${-46}" fill="none" stroke="${lc}" stroke-width="${(sw * 3.4).toFixed(2)}" stroke-linecap="round"/>
        <path d="M17,-17 Q30,-22 ${30 + sway * 0.4},${-36 + Math.abs(sway) * 0.3} Q${32 + sway * 0.6},${-44} ${27 + sway},${-46}" fill="none" stroke="${F(c)}" stroke-width="${(sw * 2.2).toFixed(2)}" stroke-linecap="round"/>
        <path d="M-12,-14 C-12,-24 18,-24 20,-15 C21,-8 14,-6 4,-6 L-6,-6 C-11,-6 -12,-9 -12,-14 Z" fill="${F(c)}" ${L}/>
        <path d="M-2,-21 q2,4 0,7 M5,-21.5 q2,4 0,7 M12,-20.5 q2,4 0,6.5" fill="none" stroke="${F(c2)}" stroke-width="2" stroke-linecap="round"/>
        <path d="M-10,-9 Q0,-5 12,-8" fill="none" stroke="${F(cream)}" stroke-width="2.4" stroke-linecap="round"/>
        ${leg(15, 0, false)}${leg(-9, Math.PI, false)}
        ${head(-17, -24 + bob * 0.5, blink, o.food)}</g>`;
      if (mode === "climb") body = `<g transform="rotate(90 2 -14)">${body}</g>`; // memanjat: badan tegak, kepala ke atas, kaki mencengkeram batang
    } else { // duduk menghadap kamera (serong kiri): ekor melingkar & mengibas, dada krem
      const tail = Math.sin(T * 2.2 + x) * 10, br = 0.6 * Math.sin(T * 2);
      body = `
        <path d="M10,-3 Q24,-2 ${24 + tail * 0.3},${-12} Q${25 + tail * 0.5},${-22 - Math.abs(tail) * 0.2} ${18 + tail},${-24}" fill="none" stroke="${lc}" stroke-width="${(sw * 3.6).toFixed(2)}" stroke-linecap="round"/>
        <path d="M10,-3 Q24,-2 ${24 + tail * 0.3},${-12} Q${25 + tail * 0.5},${-22 - Math.abs(tail) * 0.2} ${18 + tail},${-24}" fill="none" stroke="${F(c)}" stroke-width="${(sw * 2.3).toFixed(2)}" stroke-linecap="round"/>
        <path d="M-11,-2 C-15,-12 -12,-26 -3,-29 C6,-31 13,-24 14,-13 C15,-5 12,0 5,0 L-6,0 C-10,0 -12,-1 -11,-2 Z" fill="${F(c)}" ${L} transform="translate(0 ${-br})"/>
        <path d="M5,-25 q3,3 3,7 M9,-20 q3,3 3,7" fill="none" stroke="${F(c2)}" stroke-width="2" stroke-linecap="round"/>
        <path d="M-8,-4 C-10,-14 -6,-24 0,-24 C4,-22 4,-12 2,-4 Z" fill="${F(cream)}" transform="translate(0 ${-br})"/>
        <ellipse cx="-6.5" cy="-1.5" rx="3.6" ry="2.4" fill="${F(cream)}" ${L}/><ellipse cx="0.5" cy="-1.5" rx="3.6" ry="2.4" fill="${F(cream)}" ${L}/>
        ${head(-3, -36 - br, blink, o.food)}`;
    }
    return `<g transform="translate(${sx} ${sy}) scale(${dir * s} ${s})">${body}</g>`;
  }, { bias: -0.05, y: o.y || 0 });
}

function ducks(w, route, o = {}) {
  const T = w.t || 0, n = o.n || 4, sp = o.speed || 0.35;
  const segs = []; let total = 0;
  for (let i = 0; i < route.length; i++) { const a = route[i], b = route[(i + 1) % route.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, L]); total += L; }
  const at = (d) => { d = ((d % total) + total) % total; for (const [a, b, L] of segs) { if (d <= L) return [lerp(a[0], b[0], d / L), lerp(a[1], b[1], d / L), Math.sign(b[0] - a[0]) || 1]; d -= L; } return [route[0][0], route[0][1], 1]; };
  for (let i = 0; i < n; i++) {
    const big = i === 0, [x, z, dir] = at(T * sp - i * 0.45);
    mover(w, "bebek", x, z, 0.15);
    if (w.castBlob) w.castBlob(x, z, 0.12, 0.13, { strength: 0.5 });
    spr(w, x, z, (sx, sy, p, fog, lc, sw) => {
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
  if (w.night) return; // tidak muncul di malam hari
  const T = (w.t || 0) + (o.phase || 0), r = o.r || 0.6;
  const px = x + r * Math.sin(T * 0.9) + 0.2 * Math.sin(T * 2.3), pz = z + r * 0.5 * Math.cos(T * 0.7), py = (o.y || 0.9) + 0.25 * Math.sin(T * 1.7);
  spr(w, px, pz, (sx, sy, p, fog, lc, sw) => {
    const s = p * 0.0032, fl = Math.abs(Math.cos(T * 14)) * 0.85 + 0.15, c = col(o.color || "#f2b632"), c2 = col(o.color2 || "#e2632c");
    return `<g transform="translate(${sx} ${sy}) scale(${s})" stroke="${lc}" stroke-width="1.2">
      <g transform="scale(${fl} 1)"><path d="M0,0 C-14,-18 -24,-6 -16,4 C-22,12 -10,16 0,4 Z" fill="${fog(c)}"/><path d="M0,0 C14,-18 24,-6 16,4 C22,12 10,16 0,4 Z" fill="${fog(c)}"/>
      <circle cx="-12" cy="-6" r="3" fill="${fog(c2)}" stroke="none"/><circle cx="12" cy="-6" r="3" fill="${fog(c2)}" stroke="none"/></g>
      <path d="M0,-6 L0,8" stroke-width="2.4"/></g>`.replace("<g ", `<g opacity="0.75" `);
  }, { y: py, bias: -0.1 });
}

function kite(w, x, z, o = {}) {
  if (w.night) return; // tidak muncul di malam hari
  const T = (w.t || 0) + (o.phase || 0), y = (o.y || 14) + 0.6 * Math.sin(T * 0.8), dx = 0.8 * Math.sin(T * 0.6);
  spr(w, x + dx, z, (sx, sy, p, fog, lc, sw) => {
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
  spr(w, x, z, (sx, sy, p, fog, lc, sw) => {
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
    spr(w, x + dx, z, (sx, sy, p, fog, lc, sw) => {
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
    spr(w, px, pz, (sx, sy, p, fog, lc, sw) => {
      const s = p * 0.0045, rot = (T * 140 + i * 60) % 360, flip = Math.cos(T * 3 + i);
      return `<g transform="translate(${sx} ${sy}) rotate(${rot}) scale(${(s * flip).toFixed(4)} ${s})"><path d="M-10,0 Q0,-7 10,0 Q0,7 -10,0 Z" fill="${fog(col(cs[i % 4]))}" stroke="${lc}" stroke-width="1"/></g>`;
    }, { y: py, bias: -0.2 });
  }
}

function perchBirds(w, x, z, o = {}) {
  if (w.night) return; // tidak muncul di malam hari
  const T = w.t || 0, n = o.n || 3, len = o.len || 1.2, y = o.y || 3;
  for (let i = 0; i < n; i++) {
    const off = (i / Math.max(1, n - 1) - 0.5) * len, bx = o.axis === "z" ? x : x + off, bz = o.axis === "z" ? z + off : z, ph = hash(i + x), hop = Math.max(0, Math.sin(T * 1.3 + ph * 9)) > 0.97 ? 1 : 0;
    const peck = Math.sin(T * 4 + ph * 20) > 0.8;
    spr(w, bx, bz, (sx, sy, p, fog, lc, sw) => {
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
  mover(w, "sepeda ontel", m.x, m.z, 0.8);
  if (w.castBlob) w.castBlob(m.x, m.z, 0.9, 0.5, { strength: 0.5 });
  spr(w, m.x, m.z, (sx, sy, p, fog, lc, sw) => {
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
  mover(w, "gerobak bakso", m.x, m.z, 1.1);
  if (w.castBlob) w.castBlob(m.x, m.z, 1.2, 0.7, { strength: 0.6 });
  spr(w, m.x, m.z, (sx, sy, p, fog, lc, sw) => {
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
  spr(w, x, z, (sx, sy, p, fog, lc, sw) => {
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
  spr(w, x, z, (sx, sy, p, fog, lc, sw) => { const s = p * 0.01;
    return `<g transform="translate(${sx} ${sy}) scale(${s})" stroke="${lc}" stroke-width="2"><path d="M-22,0 Q-28,-30 -16,-46 L16,-46 Q28,-30 22,0 Z" fill="${fog(col("#e7dcc0"))}"/>
      <path d="M-16,-46 Q0,-56 16,-46" fill="none"/><text x="0" y="-18" font-size="10" text-anchor="middle" font-family="DejaVu Sans" fill="${fog(col("#3a6ea5"))}" stroke="none">BERAS</text></g>`; }, { bias: -0.04 });
}
function firewood(w, x, z, o = {}) {
  const n = o.n || 6;
  for (let i = 0; i < n; i++) w.box(x - 0.35, 0.07 * Math.floor(i / 3) * 1.6, z + (i % 3) * 0.12, 0.7, 0.1, 0.1, col(i % 2 ? "#8d5f3c" : "#7a5236"), { swk: 0.5 });
}
function waterJar(w, x, z) { // gentong tanah liat
  spr(w, x, z, (sx, sy, p, fog, lc, sw) => { const s = p * 0.01;
    return `<g transform="translate(${sx} ${sy}) scale(${s})" stroke="${lc}" stroke-width="2.2"><path d="M-18,0 Q-36,-26 -20,-50 L20,-50 Q36,-26 18,0 Z" fill="${fog(col("#b8643a"))}"/>
      <rect x="-22" y="-56" width="44" height="8" rx="3" fill="${fog(col("#9c5330"))}"/><path d="M-24,-30 Q0,-24 24,-30" fill="none" stroke="${fog(col("#8a4a2a"))}"/></g>`; }, { bias: -0.04 });
}

// kunang-kunang (malam): titik cahaya kuning-hijau melayang & berkedip
function fireflies(w, x, z, o = {}) {
  if (!w.night || !w.light) return;
  const T = w.t || 0, n = o.n || 8, sp = o.spread || 3;
  for (let i = 0; i < n; i++) {
    const px = x + (hash(i + 1) - 0.5) * sp + 0.4 * Math.sin(T * 0.7 + i), pz = z + (hash(i + 5) - 0.5) * sp * 0.6 + 0.3 * Math.cos(T * 0.5 + i);
    const py = 0.4 + hash(i + 9) * 1.2 + 0.2 * Math.sin(T * 1.1 + i * 2), on = Math.max(0, Math.sin(T * 2.2 + i * 1.9));
    if (on > 0.15) w.light(px, py, pz, 0.22, { color: "#d8ff7a", strength: on * 0.8, core: 0.018, coreColor: "#f2ff9a" });
  }
}
module.exports = { fireflies, col, cat, ducks, butterfly, kite, flag, smoke, leaves, perchBirds, cyclist, cart, bike, bucket, trashBin, sack, firewood, waterJar };
