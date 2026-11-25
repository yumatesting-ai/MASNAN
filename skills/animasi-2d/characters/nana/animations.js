// Klip animasi Nana: { duration (dtk), view, pose(t) -> pose }.
// Semua gerak periodik memakai periode yang membagi durasi -> loop mulus.
// `fx` (fase efek) dibuat bertambah bilangan bulat per loop agar efek ikut mulus.

(function (root) {
  const TAU = Math.PI * 2;
  const wave = (t, period, phase = 0) => Math.sin(TAU * (t / period + phase));
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
  const easeInOut = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  const seg = (t, a, b) => clamp((t - a) / (b - a)); // 0..1 di dalam [a,b]
  // kedip singkat pada detik-detik tertentu
  const blinkAt = (t, times, dur = 0.18) => {
    for (const k of times) { const d = t - k; if (d >= 0 && d <= dur) return Math.sin((Math.PI * d) / dur); }
    return 0;
  };
  // gerak sekunder standar: napas, rambut, ahoge
  const life = (t, k = 1) => ({
    breathe: (wave(t, 2) + 1) / 2,
    hairSway: 1.2 * k * wave(t, 2, 0.1),
    ahoge: 6 * k * wave(t, 1, 0.3),
  });

  const CLIPS = {
    // ---------- DIAM ----------
    idle: { duration: 4, view: "front", pose: (t) => ({
      ...life(t), headY: 1.2 * wave(t, 2, 0.15), armL: 1.5 * wave(t, 2, 0.1), armR: 1.5 * wave(t, 2, 0.1),
      blink: blinkAt(t, [1.1, 3.2, 3.45]) }) },
    idle_three: { duration: 4, view: "three", pose: (t) => CLIPS.idle.pose(t) },
    idle_side: { duration: 4, view: "side", pose: (t) => ({ ...CLIPS.idle.pose(t), armL: 2 * wave(t, 2), armR: 2 * wave(t, 2) }) },
    look_around: { duration: 4, view: "front", pose: (t) => {
      const look = t < 1 ? 0 : t < 2 ? -1 : t < 3 ? 1 : 0;
      return { ...life(t), lookX: look, headX: 3 * look, headTilt: -3 * look, mouth: "flat", blink: blinkAt(t, [0.5, 2.0, 3.0]) };
    } },

    // ---------- KOMUNIKASI ----------
    wave: { duration: 2, view: "front", pose: (t) => ({
      ...life(t), expr: "smile", mouth: "open", armR: 122 + 16 * wave(t, 0.5), armL: 2 * wave(t, 2),
      headTilt: 5, ahoge: 10 * wave(t, 0.5, 0.2), blink: blinkAt(t, [1.4]) }) },
    talk: { duration: 2.4, view: "front", pose: (t) => {
      const seq = ["open", "cat", "o", "open", "smile", "open", "cat", "flat"];
      const i = Math.floor(t / 0.15) % seq.length;
      const pause = t > 1.8; // jeda bicara
      return { ...life(t), expr: "smile", mouth: pause ? "smile" : seq[i], headY: pause ? 0 : 1.5 * Math.abs(wave(t, 0.3)),
        headTilt: 3 * wave(t, 1.2), armR: 18 + 14 * wave(t, 1.2), blink: blinkAt(t, [0.9]) };
    } },
    nod: { duration: 1.6, view: "front", pose: (t) => ({
      ...life(t), expr: "smile", headY: 5 * Math.max(0, wave(t, 0.8)), lookY: 0.6 * Math.max(0, wave(t, 0.8)),
      ahoge: -12 * Math.max(0, wave(t, 0.8, 0.1)) }) },
    shake_no: { duration: 1.6, view: "front", pose: (t) => ({
      ...life(t), expr: "deadpan", eyes: "closed", headX: 5 * wave(t, 0.4), headTilt: 3 * wave(t, 0.4),
      ahoge: -14 * wave(t, 0.4, 0.15), hairSway: 2 * wave(t, 0.4, 0.2) }) },

    // ---------- GERAK ----------
    walk: { duration: 1, view: "side", pose: (t) => {
      const s = wave(t, 1);
      return { breathe: 0.5, legL: 26 * s, legR: -26 * s, armL: -24 * s, armR: 24 * s,
        bodyY: -3 * Math.abs(Math.cos(TAU * t)), headY: 1 * Math.abs(Math.cos(TAU * t)),
        hairSway: -2.5 + 1.2 * wave(t, 0.5, 0.2), ahoge: 10 * wave(t, 0.5, 0.25), lean: -2 };
    } },
    walk_front: { duration: 1, view: "front", pose: (t) => {
      const s = wave(t, 1);
      return { breathe: 0.5, legL: Math.max(0, 11 * s), legR: Math.max(0, -11 * s), armL: 7 * s, armR: -7 * s,
        bodyY: -2.5 * Math.abs(s), headTilt: 2 * s, hairSway: 1.5 * wave(t, 1, 0.2), ahoge: 8 * wave(t, 0.5, 0.25) };
    } },
    run: { duration: 0.6, view: "side", pose: (t) => {
      const s = wave(t, 0.6);
      return { expr: "nervous", legL: 40 * s, legR: -40 * s, armL: -55 * s, armR: 55 * s, lean: -8,
        bodyY: -7 * Math.abs(Math.cos(TAU * t / 0.6)), hairSway: -4 + wave(t, 0.3), ahoge: 16 * wave(t, 0.3, 0.25) };
    } },
    jump: { duration: 1.4, view: "front", pose: (t) => {
      const pre = seg(t, 0, 0.3), air = seg(t, 0.3, 0.85), land = seg(t, 0.85, 1.15);
      const inAir = t >= 0.3 && t < 0.85;
      const y = inAir ? -70 * Math.sin(Math.PI * air) : 0;
      const squash = t < 0.3 ? 0.9 * easeOut(pre) : inAir ? -0.6 * Math.sin(Math.PI * Math.min(1, air * 1.6)) : 0.8 * (1 - easeOut(land));
      const arm = inAir ? 105 + 10 * Math.sin(Math.PI * air) : t < 0.3 ? -10 * pre : 30 * (1 - land);
      return { expr: inAir ? "happy" : "neutral", sweat: false, bodyY: y, squash, armL: arm, armR: arm,
        legL: inAir ? 10 : 0, legR: inAir ? 10 : 0, hairSway: inAir ? 0 : 2 * (1 - land),
        ahoge: inAir ? -20 * Math.cos(Math.PI * air) : 15 * (1 - land) * wave(t, 0.2), fx: t / 0.7, headY: squash * 3 };
    } },
    turnaround: { duration: 3.6, view: "front", pose: (t) => {
      const views = [["front", false], ["three", false], ["side", false], ["back", false], ["side", true], ["three", true]];
      const step = 3.6 / views.length;
      const k = Math.floor(t / step) % views.length, u = (t % step) / step;
      return { view: views[k][0], flip: views[k][1], bodyY: -6 * Math.sin(Math.PI * Math.min(1, u * 3)),
        ahoge: 14 * Math.sin(Math.PI * Math.min(1, u * 2)), hairSway: 2 * Math.sin(Math.PI * Math.min(1, u * 2)) };
    } },

    // ---------- EMOSI ----------
    happy: { duration: 1, view: "front", pose: (t) => {
      const h = Math.abs(Math.sin(TAU * t)); // dua lompatan kecil per detik
      return { expr: "happy", bodyY: -12 * h, squash: h < 0.2 ? 0.4 * (1 - h * 5) : -0.15 * h,
        armL: 45 + 15 * h, armR: 45 + 15 * h, headTilt: 4 * wave(t, 1), ahoge: 14 * wave(t, 0.5, 0.25),
        hairSway: 1.5 * wave(t, 0.5, 0.2), fx: t * 2 };
    } },
    laugh: { duration: 1.2, view: "front", pose: (t) => ({
      expr: "laugh", bodyY: -3 * Math.abs(wave(t, 0.3)), headTilt: -4 + 2 * wave(t, 0.3), headY: -2,
      armL: -4, armR: -4, breathe: (wave(t, 0.3) + 1) / 2, ahoge: 10 * wave(t, 0.3, 0.2), fx: t / 0.6 }) },
    love: { duration: 2, view: "front", pose: (t) => ({
      expr: "love", lean: 3 * wave(t, 2), headTilt: 6 * wave(t, 2), armL: -6, armR: -6,
      breathe: (wave(t, 1) + 1) / 2, hairSway: 1.5 * wave(t, 2, 0.15), ahoge: 8 * wave(t, 1), fx: t,
      blink: blinkAt(t, [1.2]) }) },
    shy: { duration: 2.4, view: "three", pose: (t) => ({
      ...life(t, 0.6), expr: "shy", lean: 2 * wave(t, 1.2), headTilt: -6 + 2 * wave(t, 1.2), headY: 2,
      armL: -8, armR: -8, legL: Math.max(0, 6 * wave(t, 1.2, 0.25)), breathe: 0.5, blink: blinkAt(t, [0.6, 1.9]) }) },
    sad: { duration: 3, view: "front", pose: (t) => ({
      expr: "sad", headY: 6, headTilt: -5, lookY: 1, armL: -4, armR: -4, lean: 0.8 * wave(t, 3),
      breathe: (wave(t, 3) + 1) / 2, hairSway: 0.8 * wave(t, 3), ahoge: -25 + 3 * wave(t, 1.5), bodyY: 2 }) },
    cry: { duration: 1.2, view: "front", pose: (t) => ({
      expr: "cry", bodyY: 1.5 * wave(t, 0.2), headY: 2 + 1.5 * wave(t, 0.2, 0.1), headTilt: -3,
      armL: -6 + 3 * wave(t, 0.4), armR: -6 + 3 * wave(t, 0.4, 0.5), ahoge: -18 + 5 * wave(t, 0.2), fx: t / 0.4 }) },
    surprised: { duration: 2, view: "front", pose: (t) => {
      const jolt = seg(t, 0.1, 0.35), settle = seg(t, 0.35, 0.8);
      const y = t < 0.35 ? -14 * Math.sin(Math.PI * jolt) : 0;
      const arm = t < 0.1 ? 0 : lerp(55, 35, easeOut(settle));
      return { expr: t < 0.1 ? "neutral" : "surprised", bodyY: y, squash: t >= 0.35 && t < 0.8 ? 0.5 * (1 - settle) : 0,
        armL: arm, armR: arm, ahoge: t < 0.1 ? 0 : -30 + 10 * wave(t, 0.25), bodyX: t > 0.35 ? 0.8 * wave(t, 0.1) : 0, fx: t };
    } },
    shocked: { duration: 2, view: "front", pose: (t) => ({
      expr: "shocked", bodyX: 1 * wave(t, 0.1), armL: -2, armR: -2, headY: 2, ahoge: -35, lean: -1, fx: t }) },
    angry: { duration: 1.2, view: "front", pose: (t) => {
      const s = wave(t, 0.6);
      return { expr: "furious", legL: Math.max(0, 14 * s), legR: Math.max(0, -14 * s), bodyY: -3 * Math.abs(s),
        armL: -8, armR: -8, headX: 1.5 * wave(t, 0.1), ahoge: 20 * wave(t, 0.3), hairSway: 2 * wave(t, 0.3), fx: t / 0.6 };
    } },
    confused: { duration: 3, view: "three", pose: (t) => ({
      ...life(t, 0.7), expr: "confused", headTilt: 9 + 3 * wave(t, 3), lookX: 0.4 * wave(t, 1.5),
      armL: 0, armR: 8, ahoge: 20 + 8 * wave(t, 1), fx: t / 1.5, blink: blinkAt(t, [1.3]) }) },
    dizzy: { duration: 2, view: "front", pose: (t) => ({
      expr: "dizzy", headX: 4 * Math.cos(TAU * t), headTilt: 7 * Math.sin(TAU * t), lean: 3 * Math.sin(TAU * t / 2),
      armL: 12 + 6 * wave(t, 1), armR: 12 + 6 * wave(t, 1, 0.5), ahoge: 25 * wave(t, 1), hairSway: 2 * wave(t, 1), fx: t / 2 }) },
    sleepy: { duration: 4, view: "front", pose: (t) => {
      const droop = t < 3 ? easeInOut(t / 3) : 1 - easeOut((t - 3) / 0.25);
      const awake = t > 3 && t < 3.6;
      return { expr: "sleepy", eyes: awake ? "wide" : "closed", headY: 7 * droop, headTilt: -7 * droop,
        ahoge: -30 * droop, breathe: (wave(t, 2) + 1) / 2, armL: -3, armR: -3, fx: t / 2, above: awake ? "exclaim" : "zzz" };
    } },
    nervous: { duration: 3, view: "front", pose: (t) => ({
      expr: "nervous", lookX: clamp(1.6 * wave(t, 3), -1, 1), bodyY: 0.8 * wave(t, 0.15), headTilt: -3,
      ahoge: 4 * wave(t, 0.3), armL: -3, armR: -3, blink: blinkAt(t, [0.7, 2.2]) }) },
    smug: { duration: 3, view: "three", pose: (t) => ({
      ...life(t, 0.6), expr: "smug", headTilt: -6 + 1.5 * wave(t, 3), headY: -1, armL: -3, armR: -3, lean: -1.5 }) },
  };

  const api = { CLIPS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NanaClips = api;
})(typeof window !== "undefined" ? window : globalThis);
