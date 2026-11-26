// Rangkaian aksi (timeline) per karakter: beberapa klip berurutan dengan transisi halus.
//
//   "walk@jalan>bangku/3 + sit_drink/6 + stretch"
//     - fase dipisah "+"; tiap fase: klip[@titik | @dari>ke][/durasi detik]
//     - "@a>b" = bergerak dari a ke b selama fase (posisi linier); tanpa titik = tetap di posisi terakhir
//     - "walk" otomatis memilih arah: samping (kiri/kanan), walk_front (mendekat) atau walk_back (menjauh)
//     - antar fase di-blend 0.35 dtk: nilai pose dihaluskan (mis. sit 0 -> 1 = gerakan duduk),
//       tampak yang berbeda berganti di tengah transisi dengan sedikit "squeeze"
//     - titik dengan `seat` (meter) otomatis membuat pose duduk memakai tinggi kursi itu
const { CLIPS, samplePose } = require("./clips.js");

const BLEND = 0.35;
const NUM_SKIP = new Set(["fx"]);

function parsePhases(spec, spotOf) {
  return spec.split("+").map((raw) => {
    const s = raw.trim();
    const [head, durStr] = s.split("/");
    const [clipName, where] = head.split("@");
    if (!CLIPS[clipName]) throw new Error(`Klip "${clipName}" tidak ada. Pilihan: ${Object.keys(CLIPS).join(", ")}`);
    const ph = { clipName, dur: durStr ? +durStr : null };
    if (where) {
      const [a, b] = where.split(">");
      ph.from = spotOf(a);
      if (b) ph.to = spotOf(b);
    }
    return ph;
  });
}

function createTimeline(spec, spotOf, resolvePose, o = {}) {
  const phases = parsePhases(spec, spotOf);
  let t0 = 0, pos = phases[0].from || { x: 0, z: 5 };
  for (const ph of phases) {
    ph.start = t0;
    ph.from = ph.from || pos;
    const end = ph.to || ph.from;
    // pilih klip jalan sesuai arah gerak
    let name = ph.clipName;
    const dx = end.x - ph.from.x, dz = end.z - ph.from.z;
    if (name === "walk" && ph.to && Math.abs(dz) > Math.abs(dx) * 1.2) name = dz < 0 ? "walk_front" : "walk_back";
    ph.clip = CLIPS[name];
    ph.autoFlip = ph.to && (ph.clip.view === "side" || ph.clip.view === "three") && Math.abs(dx) > 0.05 ? dx > 0 : false;
    // satu fase bergerak tanpa durasi: bergerak sepanjang video (o.seconds)
    ph.dur = ph.dur || (phases.length === 1 && ph.to && o.seconds ? o.seconds : ph.clip.duration);
    t0 += ph.dur;
    pos = end;
  }
  const total = t0;

  function rawAt(i, lt) {
    const ph = phases[i];
    const pose = samplePose(ph.clip, lt, resolvePose);
    const k = ph.to ? Math.min(1, Math.max(0, lt / ph.dur)) : 0;
    const end = ph.to || ph.from;
    const x = ph.from.x + (end.x - ph.from.x) * k, z = ph.from.z + (end.z - ph.from.z) * k;
    const spot = ph.to && k >= 1 ? ph.to : ph.from;
    if (spot.seat != null) pose.seat = spot.seat;
    if (ph.autoFlip) pose.flip = !pose.flip;
    pose.view = pose.view || ph.clip.view;
    return { pose, x, z, y: spot.y || 0 };
  }

  function at(t) {
    let i = phases.length - 1;
    for (let k = 0; k < phases.length; k++) if (t < phases[k].start + phases[k].dur) { i = k; break; }
    const lt = t - phases[i].start;
    const cur = rawAt(i, lt);
    if (i === 0 || lt >= BLEND) return finish(cur);
    const prev = rawAt(i - 1, phases[i - 1].dur);
    const kk = lt / BLEND, k = kk * kk * (3 - 2 * kk);
    const out = { pose: {}, x: cur.x, z: cur.z, y: prev.y + (cur.y - prev.y) * k };
    for (const key of new Set([...Object.keys(prev.pose), ...Object.keys(cur.pose)])) {
      const a = prev.pose[key], b = cur.pose[key];
      if (typeof a === "number" && typeof b === "number" && !NUM_SKIP.has(key)) out.pose[key] = a + (b - a) * k;
      else out.pose[key] = k < 0.5 ? a : b;
    }
    if (prev.pose.view !== cur.pose.view || !!prev.pose.flip !== !!cur.pose.flip) out.pose.scaleX = (out.pose.scaleX || 1) * (1 - 0.15 * Math.sin(Math.PI * k));
    return finish(out);
  }
  const finish = (r) => (o.flip ? Object.assign(r, { pose: Object.assign(r.pose, { flip: !r.pose.flip }) }) : r);

  return { at, total, phases };
}

module.exports = { createTimeline, parsePhases };
