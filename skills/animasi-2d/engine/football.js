// Simulasi main bola sederhana untuk figuran (deterministik: posisi = fungsi waktu, cocok untuk render per frame).
// Bola dioper dari satu anak ke anak lain: penerima berlari menjemput bola, menggiring beberapa langkah,
// lalu menendang (klip "kick"). Anak lain bergerak santai di sekitar posisinya (jogging/jalan/diam
// menghadap bola). Sesekali tendangan ke gawang -> penendang bersorak (klip "cheer").
//
//   const M = createMatch({ seed: 3, homes: [[-5, 13], [0, 15], ...], bounds: { x0: -10, x1: 10, z0: 11, z1: 23 },
//                           goals: [{ x: -11.4, z: 17.5 }, { x: 11.4, z: 17.5 }] });
//   M.ball(t)        -> { x, y, z, spin }
//   M.player(i, t)   -> { x, z, clip, ct, faceRight }   (clip = nama klip; ct = waktu lokal klip)
const { gaitVariant } = require("./timeline.js");

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };

function createMatch(o) {
  const r = rng(o.seed || 1);
  const N = o.homes.length, B = o.bounds, LOOP = o.loop || 120;
  const ph = o.homes.map(() => [r() * 6.28, r() * 6.28, 0.6 + r() * 0.5]);
  // posisi santai tiap pemain (bergerak pelan di sekitar rumahnya)
  const wander = (i, t) => {
    const [a, b, s] = ph[i], [hx, hz] = o.homes[i];
    return [hx + 1.4 * Math.sin(t * 0.23 * s + a) + 0.6 * Math.sin(t * 0.51 + b), hz + 0.9 * Math.sin(t * 0.19 * s + b)];
  };
  const clampB = ([x, z]) => [Math.max(B.x0, Math.min(B.x1, x)), Math.max(B.z0, Math.min(B.z1, z))];

  // ---- jadwal oper-operan ----
  const ev = []; // { holder, t0 (terima), t1 (tendang), R (titik terima), D (titik tendang), target, goal }
  let holder = 0, t = 0.5, R = wander(0, 0.5), recent = [0];
  let shotEvery = 6 + Math.floor(r() * 3), count = 0;
  while (t < LOOP + 20) {
    const dribble = 0.9 + r() * 1.3;
    const ang = r() * 6.28;
    const D = clampB([R[0] + Math.cos(ang) * 1.6 * dribble, R[1] + Math.sin(ang) * 0.9 * dribble]);
    const t1 = t + dribble;
    count++;
    const goal = o.goals && count % shotEvery === 0 ? o.goals[D[0] < 0 ? 0 : 1] : null;
    ev.push({ holder, t0: t, t1, R, D, goal });
    if (goal) {
      // tembakan ke gawang: bola meluncur ke gawang, lalu anak terdekat mengambil & memulai lagi
      const dist = Math.hypot(goal.x - D[0], goal.z - D[1]), fl = dist / 9;
      const near = o.homes.map((h, i) => [i, Math.hypot(h[0] - goal.x, h[1] - goal.z)]).filter(([i]) => i !== holder).sort((a, b) => a[1] - b[1])[0][0];
      ev[ev.length - 1].flight = fl; ev[ev.length - 1].cheer = true;
      const tFetch = t1 + fl + 1.6;
      const Rn = [goal.x * 0.92, goal.z];
      ev[ev.length - 1].next = near; ev[ev.length - 1].Rn = Rn; ev[ev.length - 1].tArr = tFetch;
      holder = near; R = Rn; t = tFetch; recent = [near];
      continue;
    }
    // pilih penerima: bukan yang baru saja pegang bola, jarak 3-11 m
    const cand = [];
    for (let i = 0; i < N; i++) if (!recent.includes(i)) {
      const W = wander(i, t1 + 1);
      const d = Math.hypot(W[0] - D[0], W[1] - D[1]);
      if (d > 2.5 && d < 12) cand.push([i, W, d]);
    }
    const [nx, W] = cand.length ? cand[Math.floor(r() * cand.length)] : [(holder + 1) % N, wander((holder + 1) % N, t1 + 1)];
    const d = Math.hypot(W[0] - D[0], W[1] - D[1]);
    const fl = Math.max(0.5, d / (5 + r() * 2));
    // penerima menjemput: titik terima sedikit ke arah bola
    const Rn = clampB([W[0] + (D[0] - W[0]) * 0.18, W[1] + (D[1] - W[1]) * 0.18]);
    Object.assign(ev[ev.length - 1], { flight: fl, next: nx, Rn, tArr: t1 + fl, lob: d > 7 });
    recent = [holder, nx].slice(-2);
    holder = nx; R = Rn; t = t1 + fl;
  }

  const evAt = (tt) => { let k = 0; while (k + 1 < ev.length && ev[k + 1].t0 <= tt) k++; return k; };

  function ball(T) {
    const tt = T % LOOP, e = ev[evAt(tt)];
    if (tt < e.t0) return { x: e.R[0], y: 0, z: e.R[1], spin: 0 };
    if (tt <= e.t1) { // digiring: bola sedikit di depan kaki, menggelinding
      const k = (tt - e.t0) / (e.t1 - e.t0);
      const x = lerp(e.R[0], e.D[0], k), z = lerp(e.R[1], e.D[1], k);
      const dx = e.D[0] - e.R[0], dz = e.D[1] - e.R[1], L = Math.hypot(dx, dz) || 1;
      return { x: x + (dx / L) * 0.32, y: 0, z: z + (dz / L) * 0.2, spin: (k * L) / 0.11 };
    }
    // terbang/menggelinding ke penerima atau gawang
    const k = Math.min(1, (tt - e.t1) / e.flight);
    const tgt = e.goal ? [e.goal.x, e.goal.z] : e.Rn;
    const ease = 1 - Math.pow(1 - k, 1.6); // melambat karena gesekan
    const x = lerp(e.D[0], tgt[0], ease), z = lerp(e.D[1], tgt[1], ease);
    const h = e.lob || e.goal ? (e.goal ? 0.7 : 1.1) * Math.sin(Math.PI * Math.min(1, k * 1.15)) : 0;
    const L = Math.hypot(tgt[0] - e.D[0], tgt[1] - e.D[1]);
    return { x, y: Math.max(0, h), z, spin: (ease * L) / 0.11 };
  }

  // posisi pemain i pada waktu T
  function pos(i, T) {
    const tt = T % LOOP;
    const k = evAt(tt), e = ev[k];
    // sedang memegang bola (menggiring)
    if (e.holder === i && tt >= e.t0 && tt <= e.t1) return { p: [lerp(e.R[0], e.D[0], (tt - e.t0) / (e.t1 - e.t0)), lerp(e.R[1], e.D[1], (tt - e.t0) / (e.t1 - e.t0))], st: "dribble", e };
    // sedang menjemput bola (penerima berikutnya)
    if (e.next === i && tt > e.t1) {
      const from = posBase(i, e.t1), u = smooth((tt - e.t1) / (e.tArr - e.t1));
      return { p: [lerp(from[0], e.Rn[0], u), lerp(from[1], e.Rn[1], u)], st: "chase", e };
    }
    return { p: posBase(i, tt), st: "free", e };
  }
  // posisi bebas: kembali pelan ke jalur santai setelah menendang
  function posBase(i, tt) {
    const W = wander(i, tt);
    for (let k = ev.length - 1; k >= 0; k--) {
      const e = ev[k];
      if (e.t1 > tt) continue;
      if (e.holder !== i) continue;
      const back = 2.2, u = smooth((tt - e.t1) / back);
      if (u >= 1) break;
      return [lerp(e.D[0], W[0], u), lerp(e.D[1], W[1], u)];
    }
    return W;
  }

  function player(i, T) {
    const tt = T % LOOP;
    const a = pos(i, tt), b = pos(i, tt + 0.1);
    const vx = (b.p[0] - a.p[0]) / 0.1, vz = (b.p[1] - a.p[1]) / 0.1, sp = Math.hypot(vx, vz);
    const e = a.e, bl = ball(tt);
    // menendang: 0.45 dtk sebelum s/d sesudah tendangan
    if (e.holder === i && Math.abs(tt - e.t1) < 0.45) {
      const tgt = e.goal ? [e.goal.x, e.goal.z] : e.Rn;
      return { x: a.p[0], z: a.p[1], clip: "kick", ct: tt - e.t1 + 0.42, faceRight: tgt[0] > a.p[0] };
    }
    if (e.cheer && e.holder === i && tt > e.t1 + 0.45 && tt < e.t1 + e.flight + 2.4)
      return { x: a.p[0], z: a.p[1], clip: "cheer", ct: tt - e.t1, faceRight: true };
    if (sp < 0.3) return { x: a.p[0], z: a.p[1], clip: "idle_three", ct: tt + i, faceRight: bl.x > a.p[0] };
    const base = sp > 1.5 ? "run" : "walk";
    return { x: a.p[0], z: a.p[1], clip: gaitVariant(base, vx, vz), ct: tt + i * 0.37, faceRight: vx > 0 };
  }

  return { ball, player, events: ev, loop: LOOP };
}

module.exports = { createMatch };
