// Rangkaian aksi (timeline) per karakter: beberapa klip berurutan dengan transisi halus.
//
//   "walk@jalan>belok>bangku + sit_drink/6 + stretch"
//     - fase dipisah "+"; tiap fase: klip[{kunci=nilai;...}][@titik | @a>b>c...][/durasi detik]
//     - "@a>b>c" = bergerak lewat titik-titik belok (rute menghindari meja/bangku/orang lain).
//       Tanpa durasi, kecepatan alami dipakai (jalan ±0,8 m/dtk, lari ±2,2 m/dtk, disesuaikan tinggi karakter).
//     - klip jalan/lari OTOMATIS memilih tampak sesuai arah gerak: samping (kiri/kanan), serong (mendekat
//       diagonal), depan (mendekat) atau belakang (menjauh) -> tidak ada lagi jalan mundur / geser menyamping.
//     - langkah kaki mengikuti jarak tempuh (tidak "ngebut"/meluncur): 1 siklus langkah = jarak alami.
//     - {..} = pengubah pose fase itu, mis. "walk{holdR=coffee;armR=-28;elbowR=80}" (jalan sambil bawa kopi).
//       Kunci khusus: face=l|r (arah hadap saat diam, untuk tampak samping/serong).
//     - arah hadap setelah berjalan dipertahankan (berhenti menghadap arah datang), kecuali diatur face=.
//     - antar fase di-blend 0.35 dtk: nilai pose dihaluskan (mis. sit 0 -> 1 = gerakan duduk),
//       tampak yang berbeda berganti di tengah transisi dengan sedikit "squeeze"
//     - titik dengan `seat` (meter) otomatis membuat pose duduk memakai tinggi kursi itu
const { CLIPS, samplePose } = require("./clips.js");

const BLEND = 0.35;
const NUM_SKIP = new Set(["fx"]);
// kecepatan alami (m/dtk untuk karakter skala 1) per keluarga klip gerak
const GAIT = { walk: 0.8, run: 2.2 };

function parseOverrides(txt) {
  const o = {};
  for (const kv of txt.split(";")) {
    const [k, v] = kv.split("=").map((s) => s && s.trim());
    if (!k) continue;
    o[k] = v === undefined ? true : v !== "" && !isNaN(+v) ? +v : v === "true" ? true : v === "false" ? false : v;
  }
  return o;
}

function parsePhases(spec, spotOf) {
  const out = [];
  for (const raw of spec.split("+")) {
    let s = raw.trim();
    let over = {};
    s = s.replace(/\{([^}]*)\}/, (_, b) => { over = parseOverrides(b); return ""; });
    const [head, durStr] = s.split("/");
    const [clipName, where] = head.split("@");
    if (!CLIPS[clipName]) throw new Error(`Klip "${clipName}" tidak ada. Pilihan: ${Object.keys(CLIPS).join(", ")}`);
    const pts = where ? where.split(">").map(spotOf) : [];
    const dur = durStr ? +durStr : null;
    if (pts.length <= 2) { out.push({ clipName, over, dur, from: pts[0], to: pts[1] }); continue; }
    // rute bertitik belok -> pecah jadi beberapa fase; durasi dibagi menurut panjang tiap ruas
    const segs = [];
    for (let i = 0; i + 1 < pts.length; i++) segs.push([pts[i], pts[i + 1], Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z)]);
    const L = segs.reduce((a, s2) => a + s2[2], 0) || 1;
    for (const [a, b, len] of segs) out.push({ clipName, over, dur: dur ? (dur * len) / L : null, from: a, to: b, seg: true });
  }
  return out;
}

// pilih varian klip menurut arah gerak (dx ke kanan, dz menjauh)
function gaitVariant(name, dx, dz) {
  const base = name.replace(/_(front|back|three)$/, "");
  const has = (v) => CLIPS[`${base}_${v}`];
  const a = Math.abs(dx), b = Math.abs(dz);
  if (!has("front") && !has("back")) return name;
  if (b > 1.5 * a) return dz < 0 ? (has("front") ? `${base}_front` : base) : has("back") ? `${base}_back` : base;
  if (dz < 0 && b > 0.45 * a && has("three")) return `${base}_three`;
  if (dz > 0 && b > 1.0 * a && has("back")) return `${base}_back`;
  return base;
}
const gaitFamily = (name) => { const b = name.replace(/_(front|back|three)$/, ""); return GAIT[b] ? b : null; };

function createTimeline(spec, spotOf, resolvePose, o = {}) {
  const phases = parsePhases(spec, spotOf);
  const sc = o.scale || 1;
  let t0 = 0, pos = phases[0].from || { x: 0, z: 5 };
  let facing = !!o.flip; // true = menghadap kanan (tampak samping/serong)
  for (const ph of phases) {
    ph.start = t0;
    ph.from = ph.from || pos;
    const end = ph.to || ph.from;
    const dx = end.x - ph.from.x, dz = end.z - ph.from.z;
    ph.dist = ph.to ? Math.hypot(dx, dz) : 0;
    let name = ph.clipName;
    if (ph.to && ph.dist > 0.02) name = gaitVariant(name, dx, dz);
    ph.clip = CLIPS[name];
    const fam = gaitFamily(name);
    ph.speed = fam ? GAIT[fam] * Math.sqrt(sc) : null; // kecepatan alami
    const lateral = ph.to && Math.abs(dx) > 0.05;
    if (lateral) facing = dx > 0;
    if (ph.over.face === "r") facing = true;
    if (ph.over.face === "l") facing = false;
    ph.flip = facing;
    // durasi: tertulis > seluruh video (satu fase bergerak) > jarak/kecepatan alami > durasi klip
    ph.dur = ph.dur || (phases.length === 1 && ph.to && o.seconds ? o.seconds
      : ph.to && ph.speed ? Math.max(0.4, ph.dist / ph.speed) : ph.clip.duration);
    t0 += ph.dur;
    pos = end;
  }
  const total = t0;

  function rawAt(i, lt) {
    const ph = phases[i];
    // langkah kaki mengikuti jarak tempuh (kaki tidak meluncur / ngebut)
    const k = ph.to ? Math.min(1, Math.max(0, lt / ph.dur)) : 0;
    let ct = lt;
    if (ph.to && ph.speed && ph.dist > 0.02) {
      let before = 0; // jarak ruas-ruas sebelumnya dalam rute yang sama -> siklus langkah menyambung
      for (let j = i - 1; j >= 0 && phases[j + 1].seg && phases[j].seg && phases[j].to; j--) before += phases[j].dist;
      ct = (before + ph.dist * k) / ph.speed;
    }
    const pose = samplePose(ph.clip, ct, resolvePose);
    for (const [kk, v] of Object.entries(ph.over)) if (kk !== "face") pose[kk] = v;
    const end = ph.to || ph.from;
    const x = ph.from.x + (end.x - ph.from.x) * k, z = ph.from.z + (end.z - ph.from.z) * k;
    const spot = ph.to && k >= 1 ? ph.to : ph.from;
    if (spot.seat != null && pose.seat == null) pose.seat = spot.seat;
    const v = pose.view || ph.clip.view;
    if ((v === "side" || v === "three") && ph.flip) pose.flip = !pose.flip;
    pose.view = v;
    return { pose, x, z, y: spot.y || 0 };
  }

  function at(t) {
    let i = phases.length - 1;
    for (let k = 0; k < phases.length; k++) if (t < phases[k].start + phases[k].dur) { i = k; break; }
    const lt = t - phases[i].start;
    const cur = rawAt(i, lt);
    if (i === 0 || lt >= BLEND) return cur;
    const prev = rawAt(i - 1, phases[i - 1].dur);
    const kk = lt / BLEND, k = kk * kk * (3 - 2 * kk);
    const out = { pose: {}, x: cur.x, z: cur.z, y: prev.y + (cur.y - prev.y) * k };
    for (const key of new Set([...Object.keys(prev.pose), ...Object.keys(cur.pose)])) {
      const a = prev.pose[key], b = cur.pose[key];
      if (typeof a === "number" && typeof b === "number" && !NUM_SKIP.has(key)) out.pose[key] = a + (b - a) * k;
      else out.pose[key] = k < 0.5 ? a : b;
    }
    if (prev.pose.view !== cur.pose.view || !!prev.pose.flip !== !!cur.pose.flip) out.pose.scaleX = (out.pose.scaleX || 1) * (1 - 0.15 * Math.sin(Math.PI * k));
    return out;
  }

  return { at, total, phases };
}

module.exports = { createTimeline, parsePhases, gaitVariant };
