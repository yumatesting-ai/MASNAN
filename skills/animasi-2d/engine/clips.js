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

    // ================= AKSI SEHARI-HARI =================
    // ---------- duduk ----------
    sit: { duration: 4, view: "front", pose: (t) => ({
      ...life(t), sit: 1, legL: 7 * Math.max(0, wave(t, 2)), legR: 7 * Math.max(0, wave(t, 2, 0.5)),
      armL: -8, armR: -8, elbowL: 35, elbowR: 35, headY: 1 * wave(t, 2, 0.15),
      lookX: kf(t, [[0, 0], [1.6, 0], [1.9, -0.8, "out"], [2.6, -0.8], [2.9, 0, "io"], [4, 0]]), blink: blinkAt(t, [1.2, 3.3]) }) },
    sit_side: { duration: 4, view: "side", pose: (t) => ({
      ...life(t), sit: 1, legL: 8 * wave(t, 2), legR: -6 * wave(t, 2), armL: 18, armR: 14, elbowL: 30, elbowR: 30,
      blink: blinkAt(t, [1.2, 3.3]) }) },
    sit_back: { duration: 4, view: "back", pose: (t) => ({ ...life(t), sit: 1, armL: -8, armR: -8, elbowL: 35, elbowR: 35,
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
    walk_three: { duration: 1, view: "three", pose: (t) => {
      const s = wave(t, 1);
      return { breathe: 0.5, legL: Math.max(0, 14 * s), legR: Math.max(0, -14 * s), armL: -12 * s, armR: 12 * s,
        bodyY: -2.6 * Math.abs(s), headTilt: 1.2 * s, hairSway: -1 + 1.0 * wave(t, 1, 0.2), lean: -1 };
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
    order: { duration: 3, view: "back", pose: (t) => {
      const g = kf(t, [[0, 0], [0.4, 1, "out"], [1.8, 1], [2.3, 0, "io"], [3, 0]]);
      return { ...life(t, 1.5), armR: 55 * g, elbowR: 25 * g + 8 * g * wave(t, 0.5), headTilt: 3 * wave(t, 1.5), headY: 1.2 * Math.abs(wave(t, 0.5)) };
    } },
    // menunggu pesanan sambil mengangguk kecil (membelakangi kamera)
    wait_back: { duration: 2, view: "back", pose: (t) => ({ ...life(t, 2), headY: 1.5 * Math.max(0, wave(t, 1)), armL: 2, armR: 2 }) },
    // menyerahkan gelas kopi ke depan (penjual di balik meja)
    give: { duration: 2.4, view: "front", pose: (t) => {
      const g = kf(t, [[0, 0], [0.6, 1, "io"], [1.7, 1], [2.2, 0, "io"], [2.4, 0]]);
      return { ...life(t, 1.2), expr: "smile", mouth: t > 0.5 && t < 1.6 ? "open" : "smile", holdR: t < 1.75 ? "coffee" : null,
        armR: -10 - 25 * g, elbowR: 30 + 60 * g, bodyY: -1.5 * g, headY: 2 * g, headTilt: 4 * g, blink: blinkAt(t, [0.3]) };
    } },
    // menerima sesuatu (membelakangi kamera): tangan terulur lalu kembali membawa barang
    receive: { duration: 2.4, view: "back", pose: (t) => {
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
    "bodyX", "bodyY", "lean", "squash", "scaleX", "lookX", "lookY", "blush", "elbowL", "elbowR", "holdTilt", "paperY", "sit"];

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
