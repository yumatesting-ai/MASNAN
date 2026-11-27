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
    // WALK CYCLE (1 dtk = 2 langkah): kontak (kaki terbuka) -> turun (badan terendah, sedikit squash) ->
    // melintas (kaki berpapasan) -> naik (badan tertinggi). Lengan berlawanan kaki & tertinggal sedikit
    // (overlap), siku menekuk saat lengan ke depan, kepala memantul terlambat (follow-through).
    walk: { duration: 1, view: "side", smooth: 0.02, pose: (t) => {
      const u = t % 1, sp = Math.sin(TAU * u), sa = Math.sin(TAU * (u - 0.06));
      const leg = 26 * Math.sign(sp) * Math.pow(Math.abs(sp), 0.75); // tahan sebentar di posisi kontak
      const bob = Math.cos(2 * TAU * (u - 0.06)); // 2x per siklus: +1 = naik (melintas), -1 = turun
      return { breathe: 0.5, legL: leg, legR: -leg, armL: -24 * sa, armR: 24 * sa,
        elbowL: 8 + 14 * Math.max(0, -sa), elbowR: 8 + 14 * Math.max(0, sa),
        bodyY: -1 - 2.8 * bob, squash: 0.05 * Math.max(0, -bob), headY: 0.9 * Math.cos(2 * TAU * (u - 0.14)),
        headTilt: 1.2 * Math.sin(2 * TAU * (u - 0.1)), lean: -3 - 0.8 * bob, hairSway: -2 + 0.8 * wave(t, 0.5, 0.2) };
    } },
    walk_front: { duration: 1, view: "front", smooth: 0.02, pose: (t) => {
      const u = t % 1, sp = Math.sin(TAU * u), sa = Math.sin(TAU * (u - 0.06));
      const bob = Math.cos(2 * TAU * (u - 0.06));
      return { breathe: 0.5, legL: Math.max(0, 13 * sp), legR: Math.max(0, -13 * sp), armL: 4 + 7 * sa, armR: 4 - 7 * sa,
        elbowL: 6 + 8 * Math.max(0, sa), elbowR: 6 + 8 * Math.max(0, -sa),
        bodyX: 2.2 * Math.sin(TAU * (u - 0.1)), bodyY: -1 - 2.4 * bob, squash: 0.04 * Math.max(0, -bob),
        headTilt: -2 * Math.sin(TAU * (u - 0.14)), headY: 0.8 * Math.cos(2 * TAU * (u - 0.14)), hairSway: 1.4 * wave(t, 1, 0.25) };
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

    // ================= AKSI SEHARI-HARI =================
    // ---------- duduk ----------
    sit: { duration: 4, view: "front", pose: (t) => ({
      ...life(t), sit: 1, legL: 7 * Math.max(0, wave(t, 2)), legR: 7 * Math.max(0, wave(t, 2, 0.5)),
      armL: -8, armR: -8, elbowL: 35, elbowR: 35, headY: 1 * wave(t, 2, 0.15),
      lookX: kf(t, [[0, 0], [1.6, 0], [1.9, -0.8, "out"], [2.6, -0.8], [2.9, 0, "io"], [4, 0]]), blink: blinkAt(t, [1.2, 3.3]) }) },
    sit_side: { duration: 4, view: "side", pose: (t) => ({
      ...life(t), sit: 1, legL: 8 * wave(t, 2), legR: -6 * wave(t, 2), armL: 18, armR: 14, elbowL: 30, elbowR: 30,
      blink: blinkAt(t, [1.2, 3.3]) }) },
    sit_back: { duration: 4, view: "back", pose: (t) => ({ ...life(t), sit: 1, armsFwd: true, armL: 10, armR: 10, elbowL: 70, elbowR: 70, // sama dgn sit_idle (tangan di meja)
      headTilt: 3 * wave(t, 4) }) },
    sit_sleepy: { duration: 4, view: "front", pose: (t) => ({ ...CLIPS.sleepy.pose(t), sit: 1, armL: -8, armR: -8, elbowL: 30, elbowR: 30 }) },
    // duduk sambil ngopi: angkat gelas -> seruput (mata pejam) -> turunkan -> "ahh" lega
    sit_drink: { duration: 4.8, view: "front", pose: (t) => drinkPose(t, 1) },
    drink: { duration: 4.8, view: "front", pose: (t) => drinkPose(t, 0) },
    sit_drink_side: { duration: 4.8, view: "side", pose: (t) => {
      const up = kf(t, [[0, 0], [1.0, 0], [1.5, 1, "io"], [2.6, 1], [3.1, 0, "io"], [4.8, 0]]);
      return { ...life(t, 2.4), sit: 1, holdL: "coffee", armL: 15 + 30 * up, elbowL: 60 + 60 * up, holdTilt: 35 * up,
        armR: 14, elbowR: 30, eyes: up > 0.8 ? "closed" : t > 3.1 && t < 3.9 ? "happy" : undefined,
        mouth: t > 3.1 && t < 3.9 ? "open" : undefined, headTilt: -3 * up, blink: blinkAt(t, [0.5, 4.3]) };
    } },
    // duduk baca koran: sesekali menurunkan koran untuk melirik, lalu membalik halaman
    sit_read: { duration: 6, view: "front", pose: (t) => readPose(t, 1) },
    read: { duration: 6, view: "front", pose: (t) => readPose(t, 0) },
    // main HP: menunduk, jempol mengetik, sesekali tertawa kecil
    phone: { duration: 4, view: "front", pose: (t) => phonePose(t, 0) },
    sit_phone: { duration: 4, view: "front", pose: (t) => phonePose(t, 1) },
    // ---------- ngobrol berpasangan (A bicara dulu, B mendengar; lalu gantian) ----------
    chat_a: { duration: 4.8, view: "three", pose: (t) => chatPose(t, true, 0) },
    chat_b: { duration: 4.8, view: "three", pose: (t) => chatPose(t, false, 0) },
    sit_chat_a: { duration: 4.8, view: "three", pose: (t) => chatPose(t, true, 1) },
    sit_chat_b: { duration: 4.8, view: "three", pose: (t) => chatPose(t, false, 1) },
    // ---------- gerak lain ----------
    walk_back: { duration: 1, view: "back", pose: (t) => ({ ...CLIPS.walk_front.pose(t) }) },
    // jalan serong (mendekat diagonal): kaki terangkat seperti tampak depan + ayunan lengan sedang
    walk_three: { duration: 1, view: "three", smooth: 0.02, pose: (t) => {
      const u = t % 1, sp = Math.sin(TAU * u), sa = Math.sin(TAU * (u - 0.06));
      const bob = Math.cos(2 * TAU * (u - 0.06));
      return { breathe: 0.5, legL: Math.max(0, 16 * sp), legR: Math.max(0, -16 * sp), armL: -12 * sa, armR: 12 * sa,
        elbowL: 8 + 10 * Math.max(0, sa), elbowR: 8 + 10 * Math.max(0, -sa), bodyX: 1.6 * Math.sin(TAU * (u - 0.1)),
        bodyY: -1 - 2.6 * bob, squash: 0.04 * Math.max(0, -bob), headTilt: 1.4 * Math.sin(TAU * (u - 0.14)),
        headY: 0.8 * Math.cos(2 * TAU * (u - 0.14)), hairSway: -1 + 1.0 * wave(t, 1, 0.2), lean: -1.5 };
    } },
    run_front: { duration: 0.6, view: "front", pose: (t) => {
      const s = wave(t, 0.6);
      return { expr: "smile", legL: Math.max(0, 22 * s), legR: Math.max(0, -22 * s), armL: 6 + 10 * s, armR: 6 - 10 * s,
        elbowL: 45, elbowR: 45, bodyY: -6 * Math.abs(s), headTilt: 2.5 * s, hairSway: 2 * wave(t, 0.3) };
    } },
    run_back: { duration: 0.6, view: "back", pose: (t) => ({ ...CLIPS.run_front.pose(t) }) },
    run_three: { duration: 0.6, view: "three", pose: (t) => {
      const s = wave(t, 0.6);
      return { expr: "smile", legL: Math.max(0, 26 * s), legR: Math.max(0, -26 * s), armL: -30 * s, armR: 30 * s,
        elbowL: 55, elbowR: 55, lean: -4, bodyY: -6 * Math.abs(s), hairSway: -2.5 + 0.8 * wave(t, 0.3) };
    } },
    // ---------- KEGIATAN SEHARI-HARI ----------
    // menyapu halaman dengan sapu lidi (tampak samping): sapuan pendek berirama, sesekali melangkah
    sweep: { duration: 1.6, view: "side", smooth: 0.04, pose: (t) => {
      const sw = wave(t, 0.8);
      return { ...life(t, 1.6), holdL: "broom", holdTilt: 8 * sw, armL: -16 + 12 * sw, elbowL: 22, armR: -26 + 8 * sw, elbowR: 40,
        lean: -7, headY: 3, lookY: 1, bodyX: 2 * sw, legL: 6 * wave(t, 1.6), legR: -6 * wave(t, 1.6), mouth: "flat", sweat: false };
    } },
    // memesan di warung (membelakangi kamera, menghadap penjual): bicara + gestur menunjuk ke etalase
    order: { once: true, duration: 3, view: "back", pose: (t) => {
      const g = kf(t, [[0, 0], [0.4, 1, "out"], [1.8, 1], [2.3, 0, "io"], [3, 0]]);
      return { ...life(t, 1.5), armR: 55 * g, elbowR: 25 * g + 8 * g * wave(t, 0.5), headTilt: 3 * wave(t, 1.5), headY: 1.2 * Math.abs(wave(t, 0.5)) };
    } },
    // menunggu pesanan sambil mengangguk kecil (membelakangi kamera)
    wait_back: { duration: 2, view: "back", pose: (t) => ({ ...life(t, 2), headY: 1.5 * Math.max(0, wave(t, 1)), armL: 2, armR: 2 }) },
    // menyerahkan gelas kopi ke depan (penjual di balik meja)
    give: { once: true, duration: 2.4, view: "front", pose: (t) => {
      const g = kf(t, [[0, 0], [0.6, 1, "io"], [1.7, 1], [2.2, 0, "io"], [2.4, 0]]);
      return { ...life(t, 1.2), expr: "smile", mouth: t > 0.5 && t < 1.6 ? "open" : "smile", holdR: t < 1.75 ? "coffee" : null,
        armR: -10 - 25 * g, elbowR: 30 + 60 * g, bodyY: -1.5 * g, headY: 2 * g, headTilt: 4 * g, blink: blinkAt(t, [0.3]) };
    } },
    // menerima sesuatu (membelakangi kamera): tangan terulur lalu kembali membawa barang
    receive: { once: true, duration: 2.4, view: "back", pose: (t) => {
      const g = kf(t, [[0, 0], [0.6, 1, "io"], [1.7, 1], [2.2, 0.35, "io"], [2.4, 0.35]]);
      return { ...life(t, 1.2), holdR: t > 1.5 ? "coffee" : null, armR: 25 * g, elbowR: 45 * g, headY: 1.5 * g };
    } },
    // menendang bola (tampak samping): ancang-ancang, tendang, kembali
    kick: { duration: 0.9, view: "side", smooth: 0.015, pose: (t) => {
      const leg = kf(t, [[0, 0], [0.25, 28, "out"], [0.42, -55, "out"], [0.65, -20, "io"], [0.9, 0, "io"]]);
      return { expr: "smile", legR: leg, legL: -0.2 * leg, armL: 0.6 * leg, armR: -0.6 * leg, lean: -3 - 0.08 * leg, bodyY: -2 * Math.abs(leg) / 55 };
    } },
    // bersorak (gol!): lompat kecil, kedua tangan ke atas
    cheer: { duration: 1.2, view: "front", pose: (t) => {
      const h = Math.abs(Math.sin((TAU * t) / 1.2));
      return { expr: "happy", mouth: "open", armL: 150 - 15 * h, armR: 150 - 15 * h, elbowL: -20, elbowR: -20, bodyY: -10 * h,
        squash: 0.25 * Math.pow(clamp(1 - h / 0.3), 2), headTilt: 3 * wave(t, 1.2), fx: t / 0.6 };
    } },
    // ---------- KOMEDI (ekspresif: ancang-ancang -> aksi -> follow-through -> tahan) ----------
    // meniup kopi panas sebelum diminum
    blow: { duration: 2, view: "front", pose: (t) => ({ ...life(t, 2), sit: 1, holdR: "coffee", armR: -62, elbowR: 128, holdTilt: 6,
      armL: -8, elbowL: 35, mouth: "o", eyes: "half", headY: 2, bodyY: -0.8 * Math.abs(wave(t, 0.5)), sweat: false, blink: blinkAt(t, [1.2]) }) },
    // menyeruput -> KAGET kepanasan -> menyembur (PFFT!) -> melet sambil mengipas mulut
    spit_take: { once: true, duration: 3.2, view: "front", smooth: 0.012, pose: (t) => {
      const sip = kf(t, [[0, 0], [0.45, 1, "io"], [0.85, 1], [1.0, 0.2, "out"], [3.2, 0.2]]);
      const jolt = kf(t, [[0, 0], [0.85, 0], [0.95, 1, "out"], [1.35, 0.3, "io"], [3.2, 0]]);
      const spray = t > 0.9 && t < 1.5, after = t >= 1.5;
      return { ...life(t, 1.6), sit: 1, holdR: "coffee", armR: -20 - 50 * sip, elbowR: 75 + 75 * sip, holdTilt: 30 * sip,
        armL: after ? 110 + 18 * wave(t, 0.25) : -8, elbowL: after ? -70 : 35,
        eyes: t < 0.85 ? "closed" : spray ? "wide" : "cry", mouth: t < 0.85 ? "o" : spray ? "shout" : "tongue",
        bodyY: -14 * jolt, squash: -0.25 * jolt, headY: -4 * jolt, headTilt: after ? 4 * wave(t, 0.5) : 0,
        sweat: t > 0.9, above: t > 0.9 && t < 2 ? "exclaim" : null, blush: after ? 0.8 : 0, fx: t / 0.4 };
    } },
    // kepanasan: melet + mengipas mulut (loop)
    hot_fan: { duration: 1.2, view: "front", pose: (t) => ({ ...life(t, 1.2), sit: 1, holdR: "coffee", armR: -20, elbowR: 75,
      armL: 110 + 18 * wave(t, 0.3), elbowL: -70, eyes: "cry", mouth: "tongue", sweat: true, blush: 0.8,
      bodyY: -2 * Math.abs(wave(t, 0.3)), headTilt: 3 * wave(t, 0.6), fx: t / 0.4 }) },
    // menepuk perut dengan bangga (menghadap kamera)
    pat_belly: { duration: 2.4, view: "front", pose: (t) => {
      const pat = Math.max(0, wave(t, 0.4));
      return { ...life(t, 1.2), expr: "smug", armR: -28, elbowR: 70 + 14 * pat, armL: -10, elbowL: 20, lean: 0,
        bodyY: -2 - 1.2 * pat, squash: -0.05, headTilt: -4, headY: -2, blink: blinkAt(t, [1.7]) };
    } },
    // melirik curiga dari atas ke bawah (deadpan), lalu kembali menatap
    deadpan_look: { once: true, duration: 3, view: "front", smooth: 0.04, pose: (t) => {
      const down = kf(t, [[0, 0], [0.5, 1, "io"], [1.7, 1], [2.2, 0, "io"], [3, 0]]);
      return { ...life(t, 3), expr: "deadpan", lookY: 1.2 * down, headY: 3 * down, headTilt: 3 * down, blink: blinkAt(t, [2.4]) };
    } },
    // tatapan datar ke kamera (jeda komedi)
    deadpan: { duration: 3, view: "front", pose: (t) => ({ ...life(t, 3), expr: "deadpan", blink: blinkAt(t, [1.9]) }) },
    // mata berkedut menahan kesal (wajah datar + garis suram)
    eye_twitch: { duration: 2.4, view: "front", smooth: 0.008, pose: (t) => ({ ...life(t, 2.4), sit: 1, expr: "deadpan", gloom: true,
      blink: blinkAt(t, [0.6, 0.72, 1.7, 1.78, 1.86], 0.07) * 0.7, headY: 1, armL: -8, elbowL: 35, armR: -8, elbowR: 35 }) },
    // tengok balik kaget (double take): lihat ke samping, buang muka, lalu SADAR dan melompat kaget
    double_take: { once: true, duration: 2.4, view: "front", smooth: 0.012, pose: (t) => {
      const look = kf(t, [[0, 0], [0.35, 1, "io"], [0.75, 1], [0.95, -0.6, "io"], [1.15, -0.6], [1.25, 0, "out"], [2.4, 0]]);
      const jump = kf(t, [[0, 0], [1.2, 0], [1.3, -0.2, "out"], [1.42, 1, "out"], [1.75, 0, "in"], [1.85, -0.15, "out"], [2.05, 0, "io"], [2.4, 0]]);
      const shock = t > 1.25;
      return { ...life(t, 2.4), expr: shock ? "surprised" : "neutral", lookX: look, headX: 4 * look,
        bodyY: -16 * Math.max(0, jump), squash: jump < 0 ? -jump * 1.2 : -0.25 * jump, armL: shock ? 50 * Math.max(0, jump) + 10 : 0,
        armR: shock ? 50 * Math.max(0, jump) + 10 : 0, fx: t / 1.2 };
    } },
    // tendangan andalan: ancang-ancang panjang (mundur, jongkok, tangan naik) -> TENDANG -> follow-through -> mendarat
    big_kick: { once: true, duration: 2.4, view: "side", smooth: 0.012, pose: (t) => {
      const wind = kf(t, [[0, 0], [0.9, 1, "io"], [1.0, 1], [1.08, 0, "in"], [2.4, 0]]);
      const kick = kf(t, [[0, 0], [1.0, 0], [1.12, 1, "out"], [1.6, 0.8, "io"], [2.1, 0, "io"], [2.4, 0]]);
      const hop = kf(t, [[0, 0], [1.1, 0], [1.3, 1, "out"], [1.55, 0, "in"], [1.65, -0.3, "out"], [1.9, 0, "io"], [2.4, 0]]);
      return { expr: t < 1.0 ? "angry" : t < 1.7 ? "furious" : "happy", mouth: t > 0.95 && t < 1.7 ? "shout" : undefined,
        legR: -42 * wind + 80 * kick, legL: 10 * wind - 8 * kick, armL: 70 * wind - 30 * kick, armR: -40 * wind + 60 * kick,
        elbowL: 40 * wind, elbowR: 20, lean: 9 * wind - 10 * kick, squash: 0.28 * wind - 0.12 * kick + 0.2 * Math.max(0, -hop),
        bodyY: -14 * Math.max(0, hop) + 4 * wind, headY: 2 * wind, hairSway: -4 * kick, fx: t / 1.2 };
    } },
    // mendongak mengikuti sesuatu yang terbang tinggi
    look_up: { once: true, duration: 2.4, view: "front", smooth: 0.03, pose: (t) => {
      const up = kf(t, [[0, 0], [0.6, 1, "out"], [2.4, 1]]);
      return { ...life(t, 2.4), eyes: "wide", mouth: "o", lookY: -1.2 * up, pitch: -0.9 * up, headY: -2 * up, headTilt: -3 * up, lean: 3 * up, sweat: false };
    } },
    // berhenti mendadak setelah lari (rem kaki, badan condong ke belakang, follow-through)
    skid: { once: true, duration: 1, view: "side", smooth: 0.015, pose: (t) => {
      const k = kf(t, [[0, 1], [0.35, 0.7, "out"], [0.6, -0.25, "io"], [0.8, 0.08, "io"], [1, 0, "io"]]);
      return { expr: "surprised", lean: 12 * k, legL: -22 * Math.max(0, k), legR: 10 * Math.max(0, k), armL: 40 * k, armR: 30 * k,
        bodyY: 2 * Math.abs(k), hairSway: 4 * k, fx: t };
    } },
    // malu-malu nyengir sambil garuk kepala
    sheepish: { duration: 2.4, view: "front", pose: (t) => ({ ...life(t, 1.2), eyes: "happy", mouth: "smile", blush: 1, sweat: true,
      armR: 140, elbowR: -(85 + 12 * wave(t, 0.3)), headTilt: 6, bodyY: -1 * Math.abs(wave(t, 0.6)), fx: t / 1.2 }) },
    // marah meledak: berdiri, tinju gemetar, tanda marah
    angry_shake: { duration: 1.2, view: "front", pose: (t) => ({ expr: "furious", armL: 22, armR: 22, elbowL: 105, elbowR: 105,
      bodyX: 1.5 * wave(t, 0.1), bodyY: -2 - 1 * Math.abs(wave(t, 0.2)), squash: -0.06, headY: -1, fx: t / 0.6 }) },
    // tertawa terbahak: badan membungkuk & berguncang, tangan memegang perut, tangan lain menepuk paha
    laugh_hard: { duration: 1.2, view: "front", pose: (t) => ({ expr: "laugh", eyes: "cry", mouth: "grin", tears: "stream", blush: 1,
      armL: -30, elbowL: 80, armR: 10 + 22 * Math.max(0, wave(t, 0.4)), elbowR: 10, headY: 5, squash: 0.12,
      bodyY: 3 - 3 * Math.abs(wave(t, 0.2)), headTilt: 5 * wave(t, 0.6), fx: t / 0.3 }) },
    // lari panik (tangan melambai-lambai ke atas, keringat)
    run_panic: { duration: 0.5, view: "side", pose: (t) => {
      const sv = wave(t, 0.5);
      return { expr: "nervous", mouth: "shout", eyes: "wide", sweat: true, legL: 40 * sv, legR: -40 * sv,
        armL: 130 + 30 * sv, armR: 120 - 30 * sv, elbowL: -20, elbowR: -20, lean: -9, bodyY: -7 * Math.abs(Math.cos(TAU * t / 0.5)),
        hairSway: -4 + wave(t, 0.25), fx: t / 0.25 };
    } },
    // lari mengejar dengan marah
    run_angry: { duration: 0.6, view: "side", pose: (t) => ({ ...CLIPS.run.pose(t), expr: "furious", mouth: "shout", fx: t / 0.3 }) },
    // menyeka wajah dengan punggung tangan (masih duduk)
    wipe_face: { once: true, duration: 2, view: "front", smooth: 0.03, pose: (t) => {
      const up = kf(t, [[0, 0], [0.4, 1, "io"], [1.6, 1], [2, 0, "io"]]);
      return { ...life(t, 2), sit: 1, expr: "deadpan", armR: 120 * up - 8, elbowR: -95 * up + 35 * (1 - up) + 18 * up * wave(t, 0.4),
        armL: -8, elbowL: 35, headTilt: 4 * up * wave(t, 0.8), eyes: up > 0.5 ? "closed" : "half" };
    } },
    // ---------- GESTUR (akting) ----------
    // jempol: angkat tangan + jempol ke atas, sedikit hentakan, senyum yakin
    thumbs_up: { duration: 1.6, view: "front", pose: (t) => {
      const up = kf(t, [[0, 0], [0.3, 1, "back"], [1.6, 1]]);
      return { ...life(t, 1.6), expr: "smile", eyes: t > 0.35 && t < 0.55 ? "happy" : undefined, holdR: up > 0.6 ? "thumb" : null,
        armR: 45 * up, elbowR: -120 * up, bodyY: -1.5 * up, headTilt: -4 * up, blink: blinkAt(t, [1.2]) };
    } },
    // tepuk jidat: tangan ke dahi, kepala menunduk, mata terpejam, garis suram
    facepalm: { duration: 2.0, view: "front", smooth: 0.03, pose: (t) => {
      const up = kf(t, [[0, 0], [0.35, 1, "out"], [2.0, 1]]);
      return { ...life(t, 2), handToFace: true, armR: 120 * up, elbowR: -110 * up, pitch: 0.45 * up, headY: 4 * up, headTilt: 8 * up,
        eyes: up > 0.5 ? "closed" : undefined, mouth: "frown", gloom: up > 0.7, sweat: true, bodyY: 2 * up };
    } },
    // tepuk tangan berulang (gembira)
    clap: { duration: 0.6, view: "front", pose: (t) => {
      const k = Math.abs(Math.sin((Math.PI * t) / 0.3));
      return { expr: "happy", armL: -20, armR: -20, elbowL: 70 + 40 * k, elbowR: 70 + 40 * k, bodyY: -1.5 * k, fx: t / 0.3 };
    } },
    // angkat bahu: tidak tahu
    shrug: { duration: 1.8, view: "front", smooth: 0.03, pose: (t) => {
      const up = kf(t, [[0, 0], [0.35, 1, "back"], [1.3, 1], [1.8, 0.8, "io"]]);
      return { ...life(t, 1.8), eyes: "half", mouth: "wavy", armL: 35 * up, armR: 35 * up, elbowL: -60 * up, elbowR: -60 * up,
        bodyY: -3 * up, headTilt: 6 * up, headY: -2 * up, above: up > 0.6 ? "question" : null, sweat: false };
    } },
    // tolak pinggang: berdiri pede / galak
    hands_hips: { duration: 2.4, view: "front", pose: (t) => ({ ...life(t, 2.4), expr: "smug", armL: 30, armR: 30, elbowL: 110, elbowR: 110,
      headTilt: -3, bodyY: -1, blink: blinkAt(t, [1.7]) }) },
    // berpikir: tangan di pipi, mata melirik ke atas, tanda tanya
    think: { duration: 2.4, view: "front", smooth: 0.03, pose: (t) => ({ ...life(t, 2.4), handToFace: true, armR: 105, elbowR: -125, armL: -28, elbowL: 80,
      lookY: -0.9, lookX: -0.5, headTilt: 6, mouth: "flat", eyes: "half", above: "question", fx: t / 1.2, sweat: false }) },
    // melipat tangan di dada: kesal / menunggu
    arms_crossed: { duration: 2.4, view: "front", pose: (t) => ({ ...life(t, 2.4), expr: "badmood", armL: -35, armR: -35, elbowL: 110, elbowR: 110,
      headTilt: -4, blink: blinkAt(t, [1.2]) }) },
    // ---------- AKSI KOMEDI FISIK ----------
    // melempar ke atas (tampak serong): ancang-ancang ke belakang -> lempar (lepas di 0.65 dtk) -> follow-through.
    // Barang di tangan: override {item=sandal|sapu|ember}; hilang dari tangan saat lepas.
    throw: { once: true, duration: 1.2, view: "three", smooth: 0.015, pose: (t) => {
      const wind = kf(t, [[0, 0], [0.5, 1, "io"], [0.6, 1], [0.7, 0, "in"], [1.2, 0]]);
      const up = kf(t, [[0, 0], [0.6, 0], [0.72, 1, "out"], [1.0, 0.85, "io"], [1.2, 0.6, "io"]]);
      // ekspresi: ancang-ancang FOKUS (alis menukik, gigi terkatup) -> lempar MENGERAHKAN TENAGA (>_< teriak)
      // -> follow-through MENDONGAK PENUH HARAP ke arah lemparan
      const ex = t < 0.55 ? "determined" : t < 0.85 ? "effort" : "hopeful";
      const after = kf(t, [[0, 0], [0.85, 0], [1.05, 1, "out"], [1.2, 1]]);
      return { ...life(t, 1.2), expr: ex, pitch: -0.75 * after, lookY: -1.1 * after, holdR: t < 0.65 ? "__item" : null, holdTilt: -30 * wind,
        armR: -45 * wind + 165 * up, elbowR: 70 * wind - 10 * up, armL: 25 * wind - 10 * up, lean: 6 * wind - 6 * up,
        squash: 0.12 * wind - 0.08 * up, bodyY: 3 * wind - 4 * up, headY: -3 * up, fx: t / 0.6 };
    } },
    // memegang batang pohon (tangan ke depan)
    hold_tree: { duration: 2.4, view: "three", pose: (t) => ({ ...life(t, 2.4), expr: "smile", armR: 70, armL: 62, elbowR: 15, elbowL: 20, lean: 3, blink: blinkAt(t, [1.4]) }) },
    // menggoyang pohon: tangan ke depan, badan maju-mundur cepat
    shake_tree: { duration: 0.5, view: "three", pose: (t) => ({ expr: "happy", eyes: "closed", mouth: "grin", armR: 70 + 6 * wave(t, 0.25), armL: 62 + 6 * wave(t, 0.25),
      elbowR: 15, elbowL: 20, bodyX: 3.5 * wave(t, 0.25), lean: 4 + 3 * wave(t, 0.25), fx: t / 0.25 }) },
    // kepala kejatuhan benda: kepala & badan tertekan, mata terpejam, lalu memantul
    bonk: { once: true, duration: 0.6, view: "front", smooth: 0.01, pose: (t) => {
      const hit = kf(t, [[0, 0], [0.06, 1, "out"], [0.25, 0.4, "io"], [0.4, -0.15, "io"], [0.6, 0, "io"]]);
      return { expr: "dizzy", eyes: t < 0.35 ? "cry" : "dizzy", mouth: "shout", squash: 0.25 * hit, headY: 7 * hit, bodyY: 4 * hit, armL: 20 * hit, armR: 20 * hit, fx: t / 0.3 };
    } },
    // menunjuk ke atas kepala sendiri (mis. ke kucing di kepala)
    point_up: { duration: 1.6, view: "front", pose: (t) => ({ ...life(t, 1.6), expr: "nervous", armR: 168, elbowR: -6 + 4 * wave(t, 0.4), lookY: -1, lookX: 0.3, headY: -1, blink: blinkAt(t, [1.1]) }) },
    // ---------- KONTEN KECANTIKAN ----------
    // mengoles bibir (lipstik / lip balm): tangan ke mulut, gerakan oles kiri-kanan, mata melirik ke bawah
    apply_lip: { duration: 1.6, view: "front", smooth: 0.03, pose: (t) => {
      const up = kf(t, [[0, 0.85], [0.3, 1, "io"], [1.3, 1], [1.6, 0.85, "io"]]);
      return { ...life(t, 1.6), handToFace: true, holdR: "lipstick", armR: -68 * up, elbowR: 148 * up + 6 * wave(t, 0.4), holdTilt: -14,
        headTilt: 3 * wave(t, 0.8), headY: 7 * up, lookY: 0.6, eyes: "half", mouth: "o", sweat: false };
    } },
    // makan gorengan: gigit -> kunyah (pipi bergerak) -> gigit lagi
    // ---------- DUDUK BELAJAR / KELAS ----------
    // menulis di buku yang ada di samping kanan (bale/meja): menunduk, tangan kanan menggores pensil
    // menulis di buku yang terbuka di PANGKUAN: tangan kiri memegang tepi buku, ujung pensil (tangan kanan) menggores
    // halaman bergerak kiri-kanan per baris; kepala menunduk ke buku
    sit_write: { duration: 2.4, view: "front", smooth: 0.012, pose: (t) => {
      const stroke = (t * 2.5) % 1, line = Math.floor(t * 2.5) % 3;
      return { ...life(t, 2.4), sit: 1, lapBook: true, holdR: "pencil", holdTilt: 25,
        armR: -11 + 7 * stroke, elbowR: 40 - 5 * stroke + 2 * line, armL: -14, elbowL: 52,
        pitch: 0.8, lookY: 1, headY: 4, mouth: "smallflat", eyes: "half", blink: blinkAt(t, [1.5]), sweat: false };
    } },
    // makan gorengan sambil duduk (buku tetap di pangkuan): angkat -> gigit di mulut -> kunyah; gorengan tergigit
    sit_eat: { duration: 2.4, view: "front", smooth: 0.02, pose: (t) => {
      const up = kf(t, [[0, 0.1], [0.45, 1, "io"], [0.85, 1], [1.25, 0.15, "io"], [2.4, 0.1]]);
      const chew = t > 0.85 ? Math.abs(Math.sin(t * 12)) : 0;
      return { ...life(t, 2.4), sit: 1, lapBook: true, holdR: "gorengan", bite: t > 0.75, handToFace: up > 0.6,
        armR: -12 - 58 * up, elbowR: 55 + 107 * up, holdTilt: 0, armL: -14, elbowL: 52,
        headY: 2, pitch: -0.1 * up, mouth: t > 0.45 && t < 0.75 ? "open" : chew > 0.5 ? "cat" : "flat",
        eyes: t > 0.85 && t < 1.8 ? "happy" : undefined, blush: 0.5, sweat: false };
    } },
    // duduk tegak menghadap samping (dengar guru)
    sit_idle: { duration: 4, view: "front", pose: (t) => ({ ...life(t, 4), sit: 1, armL: 10, armR: 10, elbowL: 70, elbowR: 70, blink: blinkAt(t, [1.3, 3.1]) }) },
    // duduk tertawa terbahak (memegang perut, berguncang)
    sit_laugh: { duration: 1.2, view: "front", pose: (t) => ({ ...CLIPS.laugh.pose(t), sit: 1, armL: -20, elbowL: 80, armR: -20, elbowR: 80, fx: t / 0.3 }) },
    // duduk gugup: keringat dingin, mata melirik, tangan meremas
    sit_nervous: { duration: 3, view: "front", smooth: 0.015, pose: (t) => ({ ...CLIPS.nervous.pose(t), sit: 1, sweat: true, armL: 15, armR: 15, elbowL: 95, elbowR: 95,
      bodyX: 0.6 * wave(t, 0.15) }) },
    // duduk kaget (tersentak, mata bulat)
    sit_shock: { duration: 1.6, view: "front", smooth: 0.01, pose: (t) => { const k = kf(t, [[0, 0], [0.12, 1, "out"], [1.6, 0.8]]);
      return { ...life(t, 1.6), sit: 1, expr: "shocked", eyes: "wide", mouth: "o", bodyY: -8 * k + 6 * k * (1 - k), armL: 40 * k, armR: 40 * k, elbowL: 60, elbowR: 60, above: t < 1.2 ? "exclaim" : null }; } },
    // geleng-geleng kepala (tidak percaya) sambil tangan di pinggang
    shake_head: { duration: 2, view: "front", smooth: 0.01, pose: (t) => ({ ...life(t, 2), expr: "deadpan", armL: -30, armR: -30, elbowL: 110, elbowR: 110,
      headX: 5 * Math.sin(t * 9), headTilt: 3 * Math.sin(t * 9), eyes: "closed", mouth: "flat" }) },
    // menulis nilai di buku (berdiri, menunduk ke meja, pulpen merah)
    write_score: { duration: 2.4, view: "three", smooth: 0.015, pose: (t) => ({ ...life(t, 2.4), holdR: "redpen", armR: 32 + 5 * wave(t, 0.35), elbowR: 62 + 12 * wave(t, 0.25),
      armL: -10, elbowL: 30, pitch: 0.7, lookY: 1, headY: 3, lean: 8, mouth: "smallflat", blink: blinkAt(t, [1.2]) }) },
    // membaca buku di atas meja (berdiri, menunduk, tangan di tepi meja)
    read_desk: { duration: 3, view: "three", smooth: 0.015, pose: (t) => ({ ...life(t, 3), armR: 30, elbowR: 55, armL: 25, elbowL: 50, pitch: 0.65, lookY: 1, headY: 3, lean: 8,
      mouth: "flat", eyes: t > 1.2 ? "wide" : undefined, blink: blinkAt(t, [0.7]) }) },
    // membuka & membaca buku (dipegang dua tangan di depan dada) lalu melongo
    read_book: { duration: 3, view: "front", smooth: 0.015, pose: (t) => ({ ...life(t, 3), holdR: "book", armR: 35, elbowR: 85, armL: 35, elbowL: 85,
      pitch: 0.45, lookY: 0.8, eyes: t > 1.6 ? "wide" : undefined, mouth: t > 1.6 ? "o" : "flat", blink: blinkAt(t, [0.9]) }) },
    eat: { duration: 2.4, view: "front", smooth: 0.02, pose: (t) => {
      const up = kf(t, [[0, 0.3], [0.4, 1, "io"], [0.8, 1], [1.2, 0.35, "io"], [2.4, 0.3]]);
      const chew = t > 0.8 ? Math.abs(Math.sin(t * 12)) : 0;
      return { ...life(t, 2.4), handToFace: up > 0.6, holdR: "gorengan", armR: -10 - 52 * up, elbowR: 60 + 85 * up, holdTilt: 10,
        headY: 7 * up, mouth: t > 0.5 && t < 0.8 ? "open" : chew > 0.5 ? "cat" : "flat", eyes: t > 0.8 && t < 1.6 ? "happy" : undefined,
        blush: 0.5, sweat: false };
    } },
    // presenter menerangkan ke kamera: tangan terbuka bergantian + anggukan
    explain: { duration: 2.4, view: "front", pose: (t) => {
      const g = Math.max(0, wave(t, 2.4)), g2 = Math.max(0, -wave(t, 2.4));
      return { ...life(t, 1.2), expr: "smile", armR: 18 + 30 * g, elbowR: 70 + 20 * g, armL: 18 + 30 * g2, elbowL: 70 + 20 * g2,
        headTilt: 3 * wave(t, 1.2), headY: 1.2 * Math.abs(wave(t, 0.6)) };
    } },
    // memamerkan produk ke kamera (botol di tangan kanan, terangkat)
    show_product: { duration: 2.4, view: "front", pose: (t) => ({ ...life(t, 1.2), expr: "happy", holdR: "lipstickBottle",
      armR: 70 + 6 * wave(t, 1.2), elbowR: 70, holdTilt: 0, headTilt: -3 + 2 * wave(t, 1.2), fx: t / 1.2 }) },
    // mengangguk sambil mendengarkan (serong) — pasangan ngobrol berdiri
    listen: { duration: 2.4, view: "three", pose: (t) => ({ ...life(t, 2.4), expr: "smile", headY: 2.5 * Math.max(0, wave(t, 1.2)), armL: 0, armR: 0, blink: blinkAt(t, [1.6]) }) },
    stretch: { duration: 3.6, view: "front", pose: (t) => {
      const up = kf(t, [[0, 0], [0.2, 0], [1.0, 1, "io"], [2.2, 1], [3.0, 0, "io"], [3.6, 0]]);
      const yawn = t > 1.0 && t < 2.3;
      return { ...life(t, 1.8), armL: 150 * up, armR: 150 * up, elbowL: -40 * up, elbowR: -40 * up, bodyY: -3 * up, squash: -0.2 * up,
        eyes: yawn ? "closed" : undefined, mouth: yawn ? "o" : undefined, headTilt: 3 * up, sweat: false,
        above: yawn ? "zzz" : null, fx: t / 1.8 };
    } },
    scratch_head: { duration: 3, view: "front", pose: (t) => {
      const up = kf(t, [[0, 0], [0.7, 1, "io"], [2.3, 1], [2.95, 0, "io"], [3, 0]]);
      return { ...life(t, 1.5), expr: "confused", armR: 140 * up, elbowR: -(85 * up + 12 * up * wave(t, 0.25)), headTilt: 6 * up, fx: t / 1.5 };
    } },
    point: { duration: 2.4, view: "front", pose: (t) => {
      const up = kf(t, [[0, 0], [0.4, 1, "back"], [1.9, 1], [2.35, 0, "io"], [2.4, 0]]);
      return { ...life(t, 1.2), expr: t < 0.2 ? "neutral" : "surprised", mouth: t > 0.2 ? "open" : undefined, armR: 78 * up,
        elbowR: 0, headTilt: 5 * up, lookX: 1 * up, bodyY: -2 * up, fx: t / 1.2 };
    } },
  };

  // ---------- pose bantu untuk aksi ----------
  function drinkPose(t, sit) {
    const up = kf(t, [[0, 0], [1.0, 0], [1.5, 1, "io"], [2.6, 1], [3.1, 0, "io"], [4.8, 0]]);
    const ahh = t > 3.1 && t < 3.9;
    return { ...life(t, 2.4), sit, holdR: "coffee", armR: -20 - 50 * up, elbowR: 75 + 75 * up, holdTilt: 30 * up,
      armL: -8, elbowL: sit ? 35 : 10, headTilt: 5 * up, headY: -2 * up,
      eyes: up > 0.8 ? "closed" : ahh ? "happy" : t > 2.95 && t < 3.1 ? "closed" : undefined,
      mouth: up > 0.8 ? "o" : ahh ? "open" : undefined, blush: ahh ? 0.6 : undefined, sweat: false,
      blink: blinkAt(t, [0.5, 4.3]) };
  }
  function readPose(t, sit) {
    const peek = kf(t, [[0, 0], [2.2, 0], [2.6, 1, "io"], [3.4, 1], [3.8, 0, "io"], [6, 0]]);
    const flip = kf(t, [[0, 0], [4.4, 0], [4.6, 1, "out"], [4.9, 0, "io"], [6, 0]]);
    return { ...life(t, 3), sit, hold: "newspaper", armL: -30 + 25 * flip, armR: -30, elbowL: 95 - 40 * flip, elbowR: 95,
      paperY: 16 * peek, headY: 3 - 3 * peek, lookY: 1 - peek, lookX: 0.5 * peek, mouth: "flat", sweat: false,
      eyes: t > 2.5 && t < 3.5 ? "half" : undefined, blink: blinkAt(t, [1.4, 5.2]) };
  }
  function phonePose(t, sit) {
    const lol = t > 2.4 && t < 3.3;
    return { ...life(t, 2), sit, holdR: "phone", armR: -32, elbowR: 118 + 4 * wave(t, 0.25), armL: -10, elbowL: sit ? 40 : 20,
      headY: 3, lookY: 1, lookX: 0.3, expr: lol ? "laugh" : "smile", mouth: lol ? "grin" : "smile",
      bodyY: lol ? -1.5 * Math.abs(wave(t, 0.3)) : 0, fx: t / 2, blink: blinkAt(t, [1.2]) };
  }
  // ngobrol: bicara (mulut bergerak + gestur tangan) atau mendengar (angguk, senyum, reaksi)
  function chatPose(t, talkFirst, sit) {
    const D = 4.8, half = D / 2;
    const talking = talkFirst ? t < half : t >= half;
    const lt = t % half;
    const syl = ["open", "cat", "o", "open", "smile", "open", "flat", "open", "o", "smile"];
    if (talking) {
      const m = lt > half - 0.35 ? "smile" : syl[Math.floor(lt / 0.16) % syl.length];
      const g = kf(lt, [[0, 0], [0.3, 1, "out"], [half - 0.4, 1], [half, 0, "io"]]);
      return { ...life(t, 2.4), sit, expr: "smile", mouth: m, armR: (sit ? -10 : 10) + 22 * g, elbowR: 40 + 55 * g + 18 * g * wave(lt, 0.6),
        armL: sit ? -8 : 0, elbowL: sit ? 35 : 0, headTilt: 3 * wave(lt, 1.2), headY: 1.2 * Math.abs(wave(lt, 0.4)),
        blink: blinkAt(t, [talkFirst ? 1.3 : 3.7]) };
    }
    const react = lt > half * 0.55 && lt < half * 0.8; // tertawa kecil saat lawan bicara melucu
    return { ...life(t, 2.4), sit, expr: react ? "laugh" : "smile", headY: react ? 0 : 3 * Math.max(0, wave(lt, 0.8)),
      bodyY: react ? -1.5 * Math.abs(wave(lt, 0.3)) : 0, armL: sit ? -8 : 0, armR: sit ? -8 : 0, elbowL: sit ? 35 : 0, elbowR: sit ? 35 : 0,
      fx: t / 1.2, blink: blinkAt(t, [talkFirst ? 3.4 : 1.1]) };
  }

  // ---------- Sampling: penghalusan + follow-through ----------
  const SMOOTH_KEYS = ["headTilt", "headX", "headY", "hairSway", "ahoge", "breathe", "armL", "armR", "legL", "legR",
    "bodyX", "bodyY", "lean", "squash", "scaleX", "lookX", "lookY", "pitch", "blush", "elbowL", "elbowR", "holdTilt", "paperY", "sit"];

  function samplePose(clip, t, resolvePose) {
    const D = clip.duration;
    // klip sekali-jalan (once): waktu dijepit, bukan diulang -> tepi awal/akhir tidak tercampur
    const wrap = clip.once ? (x) => Math.max(0, Math.min(D, x)) : (x) => ((x % D) + D) % D;
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
