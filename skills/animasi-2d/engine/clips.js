// Klip animasi bersama (semua karakter): { duration (dtk), view, smooth?, pose(t) -> pose }.
//
// Aturan agar gerak halus & tanpa "error":
//  - Loop mulus: periode gerak periodik membagi `duration`, dan nilai keyframe di t=0 sama dengan t=duration.
//  - Perubahan posisi memakai keyframe + easing (`kf`), bukan lompatan nilai.
//  - Ganti ekspresi didahului kedip/pejam singkat agar tidak terasa "memotong".
//  - `samplePose()` menambahkan penghalusan (gaussian, sadar-loop) dan follow-through otomatis
//    (ahoge & rambut tertinggal mengikuti gerak kepala). Renderer selalu memakai samplePose.
//  - `fx` (fase efek) naik bilangan bulat per loop.

(function (root) {
  const TAU = Math.PI * 2;
  const wave = (t, period, phase = 0) => Math.sin(TAU * (t / period + phase));
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const EASE = {
    lin: (k) => k,
    in: (k) => k * k * k,
    out: (k) => 1 - Math.pow(1 - k, 3),
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    back: (k) => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }, // sedikit lewat lalu balik
  };
  // keyframe: [[waktu, nilai, easing-menuju-key-ini], ...]
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e = "io"] = keys[i];
      const [t0, v0] = keys[i - 1];
      if (t <= t1) return v0 + (v1 - v0) * EASE[e]((t - t0) / (t1 - t0 || 1));
    }
    return keys[keys.length - 1][1];
  }
  // kedip singkat pada detik-detik tertentu
  const blinkAt = (t, times, dur = 0.16) => {
    for (const k of times) { const d = t - k; if (d >= 0 && d <= dur) return Math.sin((Math.PI * d) / dur); }
    return 0;
  };
  // napas & ayun rambut dengan periode yang membagi durasi klip
  const life = (t, period = 2, k = 1) => ({
    breathe: (wave(t, period) + 1) / 2,
    hairSway: 1 * k * wave(t, period, 0.1),
  });

  const CLIPS = {
    // ---------- DIAM ----------
    idle: { duration: 4, view: "front", pose: (t) => ({
      ...life(t), headY: 1.2 * wave(t, 2, 0.15), armL: 1.5 * wave(t, 2, 0.1), armR: 1.5 * wave(t, 2, 0.1),
      ahoge: 4 * wave(t, 2, 0.35), blink: blinkAt(t, [1.1, 3.2, 3.42]) }) },
    idle_three: { duration: 4, view: "three", pose: (t) => CLIPS.idle.pose(t) },
    idle_side: { duration: 4, view: "side", pose: (t) => ({ ...CLIPS.idle.pose(t), armL: 2 * wave(t, 2), armR: 2 * wave(t, 2) }) },
    look_around: { duration: 4, view: "front", pose: (t) => {
      const look = kf(t, [[0, 0], [0.8, 0], [1.15, -1, "out"], [1.8, -1], [2.25, 1, "io"], [2.9, 1], [3.3, 0, "io"], [4, 0]]);
      return { ...life(t), lookX: look, headX: 3 * look, headTilt: -3 * look, mouth: "flat", blink: blinkAt(t, [0.85, 1.95, 3.0]) };
    } },

    // ---------- KOMUNIKASI ----------
    wave: { duration: 2, view: "front", pose: (t) => ({
      ...life(t), expr: "smile", mouth: "open", armR: 120 + 14 * wave(t, 0.5), armL: 2 * wave(t, 2),
      headTilt: 5 + wave(t, 1), blink: blinkAt(t, [1.4]) }) },
    talk: { duration: 2.4, view: "front", pose: (t) => {
      // suku kata dengan durasi bervariasi, lalu jeda
      const syl = [["open", 0.14], ["cat", 0.1], ["o", 0.16], ["open", 0.12], ["smile", 0.14], ["open", 0.1],
                   ["flat", 0.12], ["open", 0.16], ["o", 0.12], ["cat", 0.14]];
      let acc = 0, m = "smile";
      for (const [mm, d] of syl) { if (t < acc + d) { m = mm; break; } acc += d; }
      const speak = kf(t, [[0, 0], [0.1, 1], [1.3, 1], [1.6, 0], [2.4, 0]]);
      return { ...life(t, 2.4), expr: "smile", mouth: m, headY: 1.6 * speak * Math.abs(wave(t, 0.6)),
        headTilt: 3 * wave(t, 1.2), armR: 14 + 10 * speak + 6 * wave(t, 1.2), blink: blinkAt(t, [1.9]) };
    } },
    nod: { duration: 1.6, view: "front", pose: (t) => {
      const y = kf(t, [[0, 0], [0.22, 5, "io"], [0.45, 0, "io"], [0.67, 5, "io"], [0.92, 0, "io"], [1.6, 0]]);
      return { ...life(t, 1.6), expr: "smile", headY: y, lookY: 0.12 * y, blink: blinkAt(t, [1.2]) };
    } },
    shake_no: { duration: 1.6, view: "front", pose: (t) => {
      const env = kf(t, [[0, 0], [0.15, 1, "out"], [1.0, 1], [1.3, 0, "io"], [1.6, 0]]);
      return { ...life(t, 1.6), expr: "deadpan", eyes: "closed", headX: 5 * env * wave(t, 0.4), headTilt: 3 * env * wave(t, 0.4) };
    } },

    // ---------- GERAK ----------
    walk: { duration: 1, view: "side", pose: (t) => {
      const s = wave(t, 1);
      return { breathe: 0.5, legL: 24 * s, legR: -24 * s, armL: -22 * s, armR: 22 * s,
        bodyY: -3 * Math.abs(Math.cos(TAU * t)), headY: 0.8 * Math.abs(Math.cos(TAU * t)),
        hairSway: -2 + 0.8 * wave(t, 0.5, 0.2), lean: -2 };
    } },
    walk_front: { duration: 1, view: "front", pose: (t) => {
      const s = wave(t, 1);
      return { breathe: 0.5, legL: Math.max(0, 10 * s), legR: Math.max(0, -10 * s), armL: 6 * s, armR: -6 * s,
        bodyY: -2.2 * Math.abs(s), headTilt: 1.5 * s, hairSway: 1.2 * wave(t, 1, 0.2) };
    } },
    run: { duration: 0.6, view: "side", pose: (t) => {
      const s = wave(t, 0.6);
      return { expr: "nervous", legL: 36 * s, legR: -36 * s, armL: -45 * s, armR: 45 * s, lean: -7,
        bodyY: -6 * Math.abs(Math.cos(TAU * t / 0.6)), hairSway: -3.5 + 0.8 * wave(t, 0.3) };
    } },
    jump: { duration: 1.6, view: "front", pose: (t) => {
      const tUp = 0.34, tDown = 0.98;
      const u = clamp((t - tUp) / (tDown - tUp));
      const inAir = t > tUp && t < tDown;
      const squash = kf(t, [[0, 0], [0.3, 0.9, "out"], [0.37, -0.5, "out"], [0.62, 0, "io"], [0.92, -0.25, "in"],
                            [1.0, 0.8, "out"], [1.28, -0.1, "io"], [1.45, 0, "io"], [1.6, 0]]);
      const arm = kf(t, [[0, 0], [0.3, -14, "out"], [0.48, 108, "out"], [0.8, 100], [0.98, 30, "io"], [1.3, -4, "io"], [1.5, 0], [1.6, 0]]);
      const leg = kf(t, [[0, 0], [0.36, 0], [0.48, 10, "out"], [0.84, 10], [0.96, 0, "in"], [1.6, 0]]);
      return { expr: t > tUp && t < tDown + 0.05 ? "happy" : "neutral", eyes: t > 0.18 && t < tUp ? "closed" : undefined,
        sweat: false, bodyY: inAir ? -48 * 4 * u * (1 - u) : 0, squash, armL: arm, armR: arm, legL: leg, legR: leg,
        headY: 3 * squash, fx: t / 0.8, blink: blinkAt(t, [1.3]) };
    } },
    turnaround: { duration: 3.6, view: "front", smooth: 0.02, pose: (t) => {
      const views = [["front", false], ["three", false], ["side", false], ["back", false], ["side", true], ["three", true]];
      const step = 0.6, k = Math.floor(t / step) % views.length;
      const d = Math.min(t % step, step - (t % step));          // jarak ke titik ganti tampak
      const bump = EASE.io(clamp(1 - d / 0.11));                // 1 tepat di titik ganti
      return { ...life(t, 1.8), view: views[k][0], flip: views[k][1], scaleX: 1 - 0.16 * bump, bodyY: -5 * bump,
        squash: -0.15 * bump, hairSway: 2.2 * bump, blink: 0 };
    } },

    // ---------- EMOSI ----------
    happy: { duration: 1, view: "front", pose: (t) => {
      const h = Math.abs(Math.sin(TAU * t)); // dua lompatan kecil per detik
      return { expr: "happy", bodyY: -12 * h, squash: 0.38 * Math.pow(clamp(1 - h / 0.3), 2) - 0.1 * h,
        armL: 45 + 12 * h, armR: 45 + 12 * h, headTilt: 4 * wave(t, 1), hairSway: 1.2 * wave(t, 0.5, 0.2), fx: t * 2 };
    } },
    laugh: { duration: 1.2, view: "front", pose: (t) => ({
      expr: "laugh", bodyY: -3 * Math.abs(wave(t, 0.6)), headTilt: -4 + 2 * wave(t, 0.6), headY: -2,
      armL: -4, armR: -4, breathe: (wave(t, 0.6) + 1) / 2, fx: t / 0.6 }) },
    love: { duration: 2, view: "front", pose: (t) => ({
      expr: "love", lean: 2.5 * wave(t, 2), headTilt: 5 * wave(t, 2), armL: -6, armR: -6,
      breathe: (wave(t, 1) + 1) / 2, hairSway: 1.2 * wave(t, 2, 0.15), fx: t, blink: blinkAt(t, [1.2]) }) },
    shy: { duration: 2.4, view: "three", pose: (t) => ({
      ...life(t, 2.4, 0.6), expr: "shy", lean: 1.8 * wave(t, 1.2), headTilt: -6 + 2 * wave(t, 1.2), headY: 2,
      armL: -8, armR: -8, legL: 6 * Math.max(0, wave(t, 1.2, 0.25)), blink: blinkAt(t, [0.6, 1.9]) }) },
    sad: { duration: 3, view: "front", pose: (t) => ({
      expr: "sad", headY: 6, headTilt: -5, lookY: 1, armL: -4, armR: -4, lean: 0.8 * wave(t, 3),
      breathe: (wave(t, 3) + 1) / 2, hairSway: 0.8 * wave(t, 3), ahoge: -25 + 3 * wave(t, 1.5), bodyY: 2,
      blink: blinkAt(t, [2.1], 0.3) }) },
    cry: { duration: 1.2, view: "front", smooth: 0.015, pose: (t) => ({
      expr: "cry", bodyY: 1.4 * wave(t, 0.3), headY: 2 + 1.4 * wave(t, 0.3, 0.1), headTilt: -3,
      armL: -6 + 2.5 * wave(t, 0.6), armR: -6 + 2.5 * wave(t, 0.6, 0.5), ahoge: -18, fx: t / 0.4 }) },
    surprised: { duration: 2.4, view: "front", smooth: 0.02, pose: (t) => {
      const arm = kf(t, [[0, 0], [0.3, 0], [0.42, 55, "out"], [0.9, 38, "io"], [1.9, 38], [2.3, 0, "io"], [2.4, 0]]);
      const tremble = kf(t, [[0, 0], [0.6, 0], [0.8, 1], [1.8, 1], [2.0, 0], [2.4, 0]]);
      return { expr: t > 0.33 && t < 2.15 ? "surprised" : "neutral",
        eyes: t > 0.25 && t <= 0.33 ? "closed" : t > 2.15 && t < 2.23 ? "closed" : undefined,
        bodyY: kf(t, [[0, 0], [0.3, 0], [0.42, -14, "out"], [0.58, 0, "in"], [2.4, 0]]),
        squash: kf(t, [[0, 0], [0.26, 0.25, "out"], [0.36, -0.3, "out"], [0.58, 0, "io"], [0.64, 0.45, "out"], [0.85, 0, "io"], [2.4, 0]]),
        armL: arm, armR: arm, ahoge: kf(t, [[0, 0], [0.3, 0], [0.42, -30, "out"], [1.9, -30], [2.3, 0, "io"], [2.4, 0]]),
        bodyX: 0.7 * tremble * wave(t, 0.2), fx: t / 1.2 };
    } },
    shocked: { duration: 2, view: "front", smooth: 0.015, pose: (t) => ({
      expr: "shocked", bodyX: 0.8 * wave(t, 0.2), armL: -2, armR: -2, headY: 2, ahoge: -35, lean: -1, fx: t }) },
    angry: { duration: 1.2, view: "front", smooth: 0.02, pose: (t) => {
      const s = wave(t, 0.6);
      return { expr: "furious", legL: Math.max(0, 13 * s), legR: Math.max(0, -13 * s), bodyY: -3 * Math.abs(s),
        armL: -8, armR: -8, headX: 1.2 * wave(t, 0.15), hairSway: 1.5 * wave(t, 0.6, 0.2), fx: t / 0.6 };
    } },
    confused: { duration: 3, view: "three", pose: (t) => ({
      ...life(t, 3, 0.7), expr: "confused", headTilt: 9 + 3 * wave(t, 3), lookX: 0.4 * wave(t, 1.5),
      armL: 0, armR: 8, ahoge: 20 + 6 * wave(t, 1.5), fx: t / 1.5, blink: blinkAt(t, [1.3]) }) },
    dizzy: { duration: 2, view: "front", pose: (t) => ({
      expr: "dizzy", headX: 4 * Math.cos(TAU * t), headTilt: 7 * Math.sin(TAU * t), lean: 3 * Math.sin(TAU * t / 2),
      armL: 12 + 6 * wave(t, 1), armR: 12 + 6 * wave(t, 1, 0.5), hairSway: 1.5 * wave(t, 1, 0.15), fx: t / 2 }) },
    sleepy: { duration: 4, view: "front", pose: (t) => {
      const droop = kf(t, [[0, 0], [2.9, 1, "io"], [3.05, -0.25, "out"], [3.4, 0, "io"], [4, 0]]);
      const awake = t > 3.0 && t < 3.6;
      return { expr: "sleepy", eyes: awake ? "wide" : t >= 3.6 && t < 3.75 ? "closed" : t >= 3.75 ? "half" : "closed",
        mouth: awake ? "o" : t >= 3.6 ? "flat" : "o", headY: 7 * droop, headTilt: -7 * droop, ahoge: -30 * Math.max(0, droop),
        breathe: (wave(t, 2) + 1) / 2, armL: -3, armR: -3, fx: t / 2, above: awake ? "exclaim" : t >= 3.6 ? null : "zzz" };
    } },
    nervous: { duration: 3, view: "front", smooth: 0.015, pose: (t) => ({
      expr: "nervous", lookX: kf(t, [[0, 0], [0.4, 1, "out"], [1.2, 1], [1.7, -1, "io"], [2.5, -1], [3, 0, "io"]]),
      bodyY: 0.6 * wave(t, 0.2), headTilt: -3, armL: -3, armR: -3, blink: blinkAt(t, [0.9, 2.2]) }) },
    smug: { duration: 3, view: "three", pose: (t) => ({
      ...life(t, 3, 0.6), expr: "smug", headTilt: -6 + 1.5 * wave(t, 3), headY: -1, armL: -3, armR: -3, lean: -1.5 }) },
  };

  // ---------- Sampling: penghalusan + follow-through ----------
  const SMOOTH_KEYS = ["headTilt", "headX", "headY", "hairSway", "ahoge", "breathe", "armL", "armR", "legL", "legR",
    "bodyX", "bodyY", "lean", "squash", "scaleX", "lookX", "lookY", "blush"];

  function samplePose(clip, t, resolvePose) {
    const D = clip.duration;
    const wrap = (x) => ((x % D) + D) % D;
    const raw = (x) => resolvePose(Object.assign({ view: clip.view }, clip.pose(wrap(x))));
    const sigma = clip.smooth ?? 0.03;
    const OFF = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
    const smoothAt = (x) => {
      const base = raw(x);
      if (sigma <= 0) return base;
      const acc = {}; let wsum = 0;
      for (const o of OFF) {
        const w = Math.exp(-0.5 * o * o), p = o === 0 ? base : raw(x + o * sigma);
        wsum += w;
        for (const k of SMOOTH_KEYS) acc[k] = (acc[k] || 0) + w * (p[k] || 0);
      }
      for (const k of SMOOTH_KEYS) base[k] = acc[k] / wsum;
      return base;
    };
    const p = smoothAt(t);
    if (clip.followThrough !== false) {
      // ahoge & rambut tertinggal mengikuti gerak kepala (sekunder otomatis)
      const prev = smoothAt(t - 0.08);
      const Y = (q) => q.bodyY + q.headY + 2 * q.squash;
      const X = (q) => q.bodyX + q.headX + 1.2 * q.headTilt + 2.5 * q.lean;
      const dy = Y(p) - Y(prev), dx = X(p) - X(prev);
      p.ahoge += clamp(2.4 * dy - 1.4 * dx, -20, 20);
      p.hairSway += clamp(-0.25 * dx, -2, 2);
    }
    return p;
  }

  const api = { CLIPS, samplePose, kf, EASE };
  module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
