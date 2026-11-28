#!/usr/bin/env node
// Render lokasi 2.5D (+ karakter di dalamnya) ke PNG atau MP4.
//
//   node tools/location.js --loc kampung --png out/kampung.png
//   node tools/location.js --loc warung --cast "atin:talk@balik_etalase,hasan:sit_drink@duduk_meja" --out out/warung.mp4
//   node tools/location.js --loc kampung --cast "nana:walk_front@jauh>depan" --seconds 4 --out out/pulang.mp4
//   node tools/location.js --loc warung --cast "hasan:walk@jalan_kiri>duduk_meja/3+sit_drink/5+sit_read/6" --out out/ngopi.mp4
//   node tools/location.js --list
//
// Format cast: karakter:rangkaian[:flip], dipisah koma. Rangkaian = fase "klip[@titik|@a>b][/detik]" dipisah "+"
//   (lihat engine/timeline.js). Titik dari spots lokasi atau "x,z" (meter); spot boleh punya y (lantai tinggi)
//   dan seat (tinggi tempat duduk -> klip sit_* otomatis duduk di situ).
// --format landscape (1600x900, default) | portrait (900x1600, untuk Reels/TikTok)
// --camera '{"x":1,"z":2,"f":1600}' [--camera-to '{...}']  -> atur/gerakkan kamera (pan, zoom, push-in)
// --t0 12        -> waktu lingkungan & figuran dimulai dari detik 12 (tokoh utama tetap dari 0)
// --time night  -> MALAM: langit gelap, bulan & bintang, filter malam, lampu menyala, kunang-kunang
// --locopts '{"poles":false}' -> opsi lokasi (mis. kampung: poles=false tanpa tiang/kabel, clearRight=true tanpa teras kanan)
// --extras off  -> tanpa figuran (karakter latar)
// --extras-style shadow (default: siluet abu polos + sedikit buram) | blur (bentuk asli diburamkan) | detail

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");
const { createWorld } = require("../engine/world3d.js");
const { createTimeline } = require("../engine/timeline.js");
const { figuran } = require("../engine/extras.js");
const { CLIPS, samplePose } = require("../engine/clips.js");
const { lineDuration, mouthAt } = require("../engine/lipsync.js");
const FX = require("../engine/fx.js");
const EMO = require("../engine/emotion.js");
const { checkTimeline } = require("../engine/collide.js");

const o = { loc: "kampung", fps: 30, scale: 1, format: "landscape" };
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const k = args[i].replace(/^--/, "");
  if (k === "list") o.list = true; else o[k] = args[++i];
}
o.fps = +o.fps; o.scale = +o.scale;
const locDir = path.join(__dirname, "..", "locations");
if (o.list) {
  for (const f of fs.readdirSync(locDir).filter((f) => f.endsWith(".js"))) {
    const L = require(path.join(locDir, f));
    console.log(`${L.id.padEnd(10)} ${L.name.padEnd(22)} titik: ${Object.keys(L.spots).join(", ")}`);
  }
  process.exit(0);
}
const LOC = require(path.join(locDir, `${o.loc}.js`));
const portrait = o.format === "portrait";
const W = portrait ? 900 : 1600, H = portrait ? 1600 : 900;
const KID_UNITS_PER_M = 270; // tinggi anak ±310 satuan rig = 1.15 m

const spotOf = (s) => {
  if (LOC.spots[s]) return LOC.spots[s];
  const [x, z] = s.split(",").map(Number);
  if (Number.isFinite(x) && Number.isFinite(z)) return { x, z };
  throw new Error(`Titik "${s}" tidak ada di ${LOC.id}. Pilihan: ${Object.keys(LOC.spots).join(", ")}`);
};
const cast = (o.cast ? o.cast.split(/,(?=\s*[a-z_]+:)/) : []).map((s) => {
  const [who, specRaw = "idle", flag] = s.trim().split(":");
  let spec = specRaw;
  if (!spec.split("+")[0].includes("@")) { // fase pertama tanpa titik -> berdiri di "depan"
    const parts = spec.split("+"); const [c0, d0] = parts[0].split("/");
    parts[0] = `${c0}@${LOC.spots.depan ? "depan" : Object.keys(LOC.spots)[0]}${d0 ? "/" + d0 : ""}`; spec = parts.join("+");
  }
  const rig = require(path.join(__dirname, "..", "characters", who, "rig.js"));
  const tl = createTimeline(spec, spotOf, rig.resolvePose, { flip: flag === "flip", seconds: o.seconds ? +o.seconds : null, scale: (rig.CANVAS && rig.CANVAS.scale) || 1 });
  return { who, rig, tl };
});
const duration = o.seconds ? +o.seconds : Math.max(1, ...cast.map((m) => m.tl.total));
// cek tabrakan rute tokoh dengan benda lokasi -> peringatan (--check: hanya cek, tanpa render)
const crash = cast.flatMap((m) => checkTimeline(LOC, m.who, m.tl));
for (const c of crash) console.error(`PERINGATAN TEMBUS: ${c}`);
// --dialog '[{"who":"hasan","at":1.2,"text":"Bu, kopi satu!"}]' -> LIP SYNC: mulut mengikuti huruf (bukan satu bentuk)
const dialog = (o.dialog ? JSON.parse(o.dialog) : []).map((d0) => {
  const { emo, clean } = EMO.parse(d0); // emosi dari d.emo / tag ElevenLabs [..] / tebakan teks
  const d = Object.assign({}, d0, { text: clean, emo });
  return Object.assign({ dur: lineDuration(clean) }, d, { est: lineDuration(clean) });
});
// --positions '{"bima":[-0.4,6.8],"hasan":[2.3,5.3]}' -> posisi tokoh di luar layar (untuk arah pandang saat close-up)
const positions = o.positions ? JSON.parse(o.positions) : {};
// ARAH PANDANG OTOMATIS: pendengar menatap pembicara, pembicara menatap lawan bicara (mata + kepala, dihaluskan),
// anak mendongak ke orang dewasa & sebaliknya; tanpa dialog -> lirikan kecil alami. Override: {look=0} mematikan.
function gazeTarget(who, t) {
  const actors = new Set([...cast.map((c) => c.who), ...Object.keys(positions)]);
  const cur = dialog.find((d) => actors.has(d.who) && t >= d.at && t < d.at + d.dur + 0.2); // narator tidak menarik pandangan
  if (!cur) return null;
  if (cur.who !== who) return cur.who;
  if (cur.to) return cur.to;
  const others = dialog.filter((d) => d.who !== who && actors.has(d.who));
  const prev = others.filter((d) => d.at <= cur.at).pop() || others.find((d) => d.at > cur.at);
  return prev ? prev.who : null;
}
// --looks '[{"t0":4,"t1":9,"who":"*","at":[x,y,z] | "hasan"}]' -> perhatian ke kejadian/tokoh (konteks adegan)
const looks = o.looks ? JSON.parse(o.looks) : [];
const visibleAt = (c, t) => { const st = c.tl.at(t); return st.pose.hide ? null : st; };
function gazeAt(m, t, self) {
  const sc = (m.rig.CANVAS && m.rig.CANVAS.scale) || 1, eye = 1.0 * sc;
  const toPoint = (tx, ty, tz) => { // lirikan ke titik 3D (x kanan, y tinggi)
    const dx = tx - self.x, dz = tz - self.z, d = Math.max(0.5, Math.hypot(dx, dz));
    const lx = Math.max(-1, Math.min(1, (dx / Math.max(0.6, Math.abs(dx) + Math.abs(dz) * 0.5)) * 1.5));
    return { lx, ly: Math.max(-1.2, Math.min(0.8, (-(ty - eye) / d) * 1.4)), hx: lx };
  };
  const toWho = (name) => {
    const other = cast.find((c) => c.who === name);
    if (other) { const st = visibleAt(other, t); if (!st) return null; const osc = (other.rig.CANVAS && other.rig.CANVAS.scale) || 1; return toPoint(st.x, (st.y || 0) + 1.0 * osc, st.z); }
    if (positions[name]) { const [tx, tz] = positions[name]; return toPoint(tx, /hasan|atin/.test(name) ? 1.28 : 1.0, tz); }
    return null;
  };
  // 1) perhatian terarah (konteks adegan)
  const L = looks.find((l) => t >= l.t0 && t < l.t1 && (l.who === "*" || l.who === m.who || (Array.isArray(l.who) && l.who.includes(m.who))) && l.at !== m.who);
  if (L) { const g = Array.isArray(L.at) ? toPoint(L.at[0], L.at[1], L.at[2]) : toWho(L.at); if (g) return g; }
  // 2) dialog: pendengar ke pembicara, pembicara ke lawan bicara
  const tg = gazeTarget(m.who, t);
  if (tg) { const g = toWho(tg); if (g) return g; }
  // 3) tanpa konteks: melirik tokoh terdekat yang terlihat (bukan menatap kamera); sesekali kembali ke depan
  let best = null, bd = 1e9;
  for (const c of cast) if (c.who !== m.who) { const st = visibleAt(c, t); if (st) { const d = Math.hypot(st.x - self.x, st.z - self.z); if (d < bd) { bd = d; best = c.who; } } }
  if (best && bd < 6 && Math.sin(t * 0.45 + m.who.length * 1.7) > -0.55) { const g = toWho(best); if (g) return { lx: g.lx * 0.8, ly: g.ly * 0.8, hx: g.hx * 0.7 }; }
  return { lx: 0.22 * Math.sin(t * 0.7 + m.who.length) + 0.12 * Math.sin(t * 2.3), ly: 0.1 * Math.sin(t * 0.5), hx: 0 };
}
// --camkeys '[{"t":0,"x":0,"z":-1,"f":1300},{"t":3,"f":1800,"track":"hasan","dx":0.3}]' -> kamera sinematik:
//   pan/tilt (x/y/horizon), zoom in/out (f), dolly (z), tracking (track=nama tokoh, dx/dz offset). Antar key: ease in-out.
const camkeys = o.camkeys ? JSON.parse(o.camkeys) : null;
// --fx '[{"type":"shake","t":2,"dur":0.5,"amp":0.08}, {"type":"text","t":2,"text":"BYUR!"}, ...]' (lihat engine/fx.js)
const fxList = o.fx ? JSON.parse(o.fx) : [];
// --fg '[{"kind":"leaves","x":-1,"z":1.5}]' -> latar depan buram dekat kamera (parallax & kedalaman)
const fgList = o.fg ? JSON.parse(o.fg) : [];
// figuran: karakter latar acak yang beraktivitas sendiri (diulang). --extras off untuk mematikan.
// locopts.extras: daftar figuran khusus adegan (mis. teman sekelas yang tertawa di detik tertentu) menggantikan bawaan lokasi
const LOCOPTS0 = o.locopts ? JSON.parse(o.locopts) : {};
if (LOCOPTS0.extras) LOC.extras = LOCOPTS0.extras;
const extras = o.extras === "off" ? [] : (LOC.extras || []).map((e) => {
  const rig = figuran(e.seed, e.kind);
  // motion(t) -> { x, z, clip, ct, faceRight } : gerak terskrip (mis. main bola, engine/football.js)
  if (e.motion) return { rig, phase: 0, extra: true, tl: { total: 1e9, at(t) {
    const m = e.motion(t), clip = CLIPS[m.clip];
    const pose = samplePose(clip, m.ct, rig.resolvePose);
    const v = pose.view || clip.view;
    if ((v === "side" || v === "three") && m.faceRight) pose.flip = !pose.flip;
    pose.view = v;
    return { pose, x: m.x, z: m.z, y: 0 };
  } } };
  return { rig, tl: createTimeline(e.spec, spotOf, rig.resolvePose, { flip: !!e.flip, scale: (rig.CANVAS && rig.CANVAS.scale) || 1 }), phase: e.phase || 0, extra: true };
});

function frame(t) {
  const camOpt = Object.assign({}, LOC.camera, portrait ? LOC.cameraPortrait || {} : {});
  if (portrait && !LOC.cameraPortrait) { camOpt.f = (camOpt.f || 1300) * 1.3; camOpt.horizon = 0.4; } // vertikal: lebih dekat
  // --camera / --camera-to: geser & zoom kamera per adegan ({"x","y","z","f","horizon"}); dengan --camera-to kamera
  // bergerak halus (ease in-out) dari --camera ke --camera-to selama durasi klip (push-in / pan).
  if (o.camera || o["camera-to"]) {
    const base = Object.assign({}, camOpt.cam || { x: 0, y: 1.5, z: 0 }, { f: camOpt.f || 1300, horizon: camOpt.horizon ?? 0.42 });
    const A = Object.assign({}, base, o.camera ? JSON.parse(o.camera) : {});
    const B = Object.assign({}, A, o["camera-to"] ? JSON.parse(o["camera-to"]) : {});
    const dur = o.seconds ? +o.seconds : 6, u0 = Math.min(1, Math.max(0, t / dur)), u = u0 * u0 * (3 - 2 * u0);
    const L = (k) => A[k] + (B[k] - A[k]) * u;
    camOpt.cam = { x: L("x"), y: L("y"), z: L("z") }; camOpt.f = L("f"); camOpt.horizon = L("horizon");
  }
  const states = cast.map((m) => m.tl.at(t));
  if (camkeys) {
    const base = Object.assign({}, camOpt.cam || { x: 0, y: 1.5, z: 0 }, { f: camOpt.f || 1300, horizon: camOpt.horizon ?? 0.42 });
    const keys = []; let prev = base;
    for (const k of camkeys) {
      const full = Object.assign({}, prev, k); full.ease = k.ease; // ease TIDAK diwarisi (dulu "cut" terbawa -> kamera membeku setelah potongan)
      if (k.track) { const i = cast.findIndex((m) => m.who === k.track); if (i >= 0) { full.x = states[i].x + (k.dx || 0); if (k.dz != null) full.z = states[i].z + k.dz; } }
      if (!k.track) delete full.track;
      keys.push(full); prev = Object.assign({}, full, { track: undefined });
    }
    let a = keys[0], b = keys[0];
    for (let i = 0; i < keys.length; i++) { if (keys[i].t <= t) { a = keys[i]; b = keys[i + 1] || keys[i]; } }
    const u0 = b === a ? 0 : Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
    const u = a.ease === "cut" ? 0 : a.ease === "lin" ? u0 : u0 < 0.5 ? 4 * u0 ** 3 : 1 - Math.pow(-2 * u0 + 2, 3) / 2;
    const L = (k) => a[k] + (b[k] - a[k]) * u;
    camOpt.cam = { x: L("x"), y: L("y"), z: L("z") }; camOpt.f = L("f"); camOpt.horizon = L("horizon");
  }
  const sh = FX.shake(fxList, t);
  if (sh) camOpt.cam = { x: camOpt.cam.x + sh[0], y: camOpt.cam.y + sh[1], z: camOpt.cam.z };
  const w = createWorld(Object.assign({ W, H, night: o.time === "night" }, camOpt));
  const te = t + (+o.t0 || 0); // --t0: geser waktu lingkungan & figuran (mis. agar gol terjadi di tengah adegan)
  w.t = te; // waktu untuk animasi lingkungan (pohon bergoyang, dll.)
  for (const e of fxList) if (e.type === "treeshake" && t >= e.t && t < e.t + (e.dur || 1)) // tokoh menggoyang pohon
    w.treeShake = { x: e.x, z: e.z, deg: (e.amp || 6) * Math.sin((t - e.t) * 28) * (1 - 0.5 * (t - e.t) / (e.dur || 1)) };
  LOC.build(w, { t: te, extras: o.extras !== "off", opts: o.locopts ? JSON.parse(o.locopts) : {} });
  FX.draw(w, fxList, t);
  FX.foreground(w, fgList, t);
  // kabut jarak untuk karakter: makin jauh makin pudar (filter warna menuju warna langit)
  const fogIds = new Set();
  const fogFilter = (k) => {
    const b = Math.round(k * 20) / 20;
    if (b <= 0) return "";
    const id = `chfog${Math.round(b * 100)}`;
    if (!fogIds.has(id)) {
      fogIds.add(id);
      const sl = (1 - b).toFixed(3), ic = (b * 0.87).toFixed(3);
      w.add("sky", 2e9, `<defs><filter id="${id}" color-interpolation-filters="sRGB"><feComponentTransfer>
        <feFuncR type="linear" slope="${sl}" intercept="${ic}"/><feFuncG type="linear" slope="${sl}" intercept="${ic}"/>
        <feFuncB type="linear" slope="${sl}" intercept="${ic}"/></feComponentTransfer></filter></defs>`);
    }
    return `filter="url(#${id})"`;
  };
  // gaya figuran: siluet/buram agar tidak bersaing dengan tokoh utama (filter di ruang piksel kanvas)
  const exStyle = o["extras-style"] || LOCOPTS0.extrasStyle || LOC.extrasStyle || "shadow"; // kelas: teman sekelas dekat kamera -> "detail"
  const exFilter = (z) => {
    if (exStyle === "detail") return fogFilter(w.fogK(z) * 0.95);
    const k = Math.round(Math.min(0.6, w.fogK(z)) * 10) / 10, id = `fig_${exStyle}_${Math.round(k * 10)}`;
    if (!fogIds.has(id)) {
      fogIds.add(id);
      const g = (0.5 + k * 0.6).toFixed(3); // siluet makin terang (pudar) bila jauh
      const body = exStyle === "shadow"
        ? `<feColorMatrix type="matrix" values="0 0 0 0 ${g}  0 0 0 0 ${g}  0 0 0 0 ${g}  0 0 0 0.85 0"/><feGaussianBlur stdDeviation="${LOC.extrasBlur || 1.6}"/>`
        : `<feGaussianBlur stdDeviation="3.2"/><feComponentTransfer><feFuncR type="linear" slope="${(0.75 - k * 0.4).toFixed(2)}" intercept="${(0.24 + k * 0.37).toFixed(2)}"/>
           <feFuncG type="linear" slope="${(0.75 - k * 0.4).toFixed(2)}" intercept="${(0.24 + k * 0.37).toFixed(2)}"/><feFuncB type="linear" slope="${(0.75 - k * 0.4).toFixed(2)}" intercept="${(0.24 + k * 0.37).toFixed(2)}"/></feComponentTransfer>`;
      w.add("sky", 2e9, `<defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">${body}</filter></defs>`);
    }
    return `filter="url(#${id})"`;
  };
  for (const m of [...extras, ...cast]) {
    const tt = m.extra ? (te + m.phase) % m.tl.total : t;
    const { pose, x, z, y } = m.extra ? m.tl.at(tt) : states[cast.indexOf(m)];
    if (pose.hide) continue; // tokoh disembunyikan (belum masuk adegan)
    if (pose.holdR === "__item") pose.holdR = pose.item || null; // barang yang sedang dilempar (klip throw)
    // KEDIP ALAMI per tokoh (jadwal berbeda tiap tokoh, sesekali kedip ganda) -> tidak berkedip bersamaan
    if (!m.extra) {
      let hsh = 0; for (const ch of m.who) hsh = (hsh * 31 + ch.charCodeAt(0)) % 997;
      const per = 2.8 + (hsh % 7) * 0.25, off = (hsh % 13) * 0.21, u = (t + off) % per;
      const bl = (x) => (x >= 0 && x < 0.15 ? Math.sin((Math.PI * x) / 0.15) : 0);
      pose.blink = Math.max(bl(u), hsh % 3 === 0 ? bl(u - 0.25) : 0);
    }
    // TRANSISI EMOSI HALUS: bila bentuk mata berganti (mis. senyum -> kaget), sisipkan kedipan singkat agar tidak meloncat
    if (!m.extra && t > 0.12) {
      const pr = m.tl.at(t - 0.1).pose;
      if (pr.eyes !== pose.eyes && !["closed", "happy", "cry"].includes(pose.eyes)) pose.blink = Math.max(pose.blink || 0, 0.85);
    }
    // ARAH PANDANG (rata-rata 3 sampel waktu -> perpindahan lirikan halus)
    if (!m.extra && pose.look !== 0 && pose.view !== "back") {
      const self = { x, z }, g = [0, 0.1, 0.2].map((d) => gazeAt(m, Math.max(0, t - d), self));
      let lx = (g[0].lx + g[1].lx + g[2].lx) / 3, ly = (g[0].ly + g[1].ly + g[2].ly) / 3;
      if (pose.flip) lx = -lx; // tampak serong/samping dicerminkan
      const side = pose.view === "side";
      pose.lookX = side ? (pose.lookX || 0) : lx;
      pose.lookY = (pose.lookY || 0) * 0.3 + ly;
      if (!side) { pose.headX = (pose.headX || 0) + 3.2 * lx; pose.headTilt = (pose.headTilt || 0) + 2.5 * lx; }
      // kepala ikut mendongak / menunduk ke arah target (bukan hanya bola mata)
      const pitch = Math.max(-1, Math.min(1, ly * 0.9));
      pose.pitch = Math.abs(pose.pitch || 0) > Math.abs(pitch) ? pose.pitch : pitch;
      if (pitch < -0.3) pose.lean = (pose.lean || 0) + 4 * (-pitch - 0.3); // badan sedikit condong ke belakang saat mendongak
    }
    // LIP SYNC: saat tokoh berdialog, mulut mengikuti huruf + anggukan kecil penekanan
    if (!m.extra) for (const d of dialog) if (d.who === m.who && t >= d.at && t < d.at + d.dur) {
      const mo = mouthAt(d.text, (t - d.at) * (d.est / d.dur)); // diregangkan agar pas dengan durasi audio asli
      EMO.applySpeak(pose, d.emo, mo, t - d.at, m.rig); // wajah + mulut + gerak kepala sesuai emosi baris
    }
    // DUDUK: titik duduk ada di atas permukaan tempat duduk; tokoh digambar DI DEPAN tepi tempat duduknya
    // (pinggul di permukaan, kaki menjuntai di depan sisi bangku/bale) -> tepi tidak menembus badan.
    const seated = (pose.sit || 0) > 0.5;
    // tempat duduk tinggi (bale): kaki menjuntai berayun pelan bergantian -> jelas terbaca sedang duduk
    if (seated && (pose.seat || 0) > 0.5 && !m.extra && pose.view !== "back") {
      const ph = (m.who || "").length * 0.9;
      pose.legL = (pose.legL || 0) + 9 * Math.max(0, Math.sin(t * 3 + ph));
      pose.legR = (pose.legR || 0) + 9 * Math.max(0, Math.sin(t * 3 + ph + Math.PI));
    }
    // bayangan matahari karakter (searah bayangan lingkungan)
    const hS = 0.55 * ((m.rig.CANVAS && m.rig.CANVAS.scale) || 1) + (pose.sit ? (pose.seat || 0.45) * 0.6 : 0);
    w.castBlob(x, z, hS, 0.24 * ((m.rig.CANVAS && m.rig.CANVAS.scale) || 1), { trunk: 0.12, strength: m.extra ? 0.6 : 0.9 });
    if (m.extra && exStyle === "shadow") Object.assign(pose, { above: null, sweat: false, blush: 0, anger: false }); // siluet: tanpa efek wajah
    w.sprite(x, z, (sx, sy, p) => {
      const s = p / KID_UNITS_PER_M;
      const inner = `<g transform="translate(${(sx - 150 * s).toFixed(1)} ${(sy - 382 * s).toFixed(1)}) scale(${s.toFixed(4)})">${m.rig.drawPart(pose.view, pose)}</g>`;
      return `<g ${m.extra ? exFilter(z) : fogFilter(w.fogK(z) * 0.35)}>${inner}</g>`; // tokoh utama hanya sedikit berkabut
    }, { bias: (m.extra ? -0.04 : -0.05) + (seated ? -0.4 : 0), y });
  }
  return w.render();
}

(async () => {
  if (o.check) {
    const exCrash = extras.flatMap((m, i) => (m.tl.phases ? checkTimeline(LOC, `figuran#${LOC.extras[i].seed}`, m.tl) : []));
    // benda bergerak (sepeda ontel, gerobak, kucing jalan, bebek) vs tokoh, figuran & benda diam, dicek tiap 0,2 dtk
    const { hit } = require("../engine/collide.js");
    const seen = new Set();
    for (let t = 0; t <= duration + 1e-6; t += 0.2) {
      const te = t + (+o.t0 || 0), w = createWorld(Object.assign({ W, H }, LOC.camera));
      w.movers = []; w.t = te; LOC.build(w, { t: te, extras: o.extras !== "off", opts: o.locopts ? JSON.parse(o.locopts) : {} });
      const people = [...cast.map((m) => ({ who: m.who, ...m.tl.at(t) })), ...extras.map((m, i) => ({ who: `figuran#${LOC.extras[i].seed}`, ...m.tl.at((te + m.phase) % m.tl.total) }))];
      // antartokoh: dua tokoh terlihat tidak boleh saling tembus (jarak badan < 0,34 m) saat salah satunya bergerak
      const vis = cast.map((m) => ({ who: m.who, st: m.tl.at(t), st2: m.tl.at(Math.min(duration, t + 0.2)) })).filter((c) => !c.st.pose.hide);
      for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
        const A = vis[i], B = vis[j], mov = Math.hypot(A.st2.x - A.st.x, A.st2.z - A.st.z) + Math.hypot(B.st2.x - B.st.x, B.st2.z - B.st.z) > 0.01;
        if (mov && Math.hypot(A.st.x - B.st.x, A.st.z - B.st.z) < 0.34) {
          const key = `${A.who}|${B.who}`; if (!seen.has(key)) { seen.add(key); exCrash.push(`${A.who} menembus ${B.who} pada t=${t.toFixed(1)} dtk (x=${A.st.x.toFixed(2)} z=${A.st.z.toFixed(2)})`); }
        }
      }
      for (const mv of w.movers) {
        for (const pp of people) if (Math.hypot(pp.x - mv.x, pp.z - mv.z) < mv.r + 0.16) {
          const key = `${pp.who}|${mv.name}`; if (seen.has(key)) continue; seen.add(key);
          exCrash.push(`${pp.who} bertabrakan/tembus dengan '${mv.name}' pada t=${t.toFixed(1)} dtk (x=${mv.x.toFixed(2)} z=${mv.z.toFixed(2)})`);
        }
        const ob = (LOC.obstacles || []).find((ob2) => !(ob2.water && /bebek|itik/.test(mv.name)) && hit(ob2, mv.x, mv.z, mv.r * 0.9)); // air: bebek boleh berenang
        if (ob) { const key = `${mv.name}|${ob.name}`; if (!seen.has(key)) { seen.add(key); exCrash.push(`'${mv.name}' menembus '${ob.name}' pada t=${t.toFixed(1)} dtk (x=${mv.x.toFixed(2)} z=${mv.z.toFixed(2)})`); } }
      }
    }
    for (const c of exCrash) console.error(`PERINGATAN TEMBUS: ${c}`);
    console.log(crash.length + exCrash.length ? `${crash.length + exCrash.length} rute menembus benda` : "OK: tidak ada rute yang menembus benda");
    process.exit(crash.length + exCrash.length ? 2 : 0);
  }
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: o.scale });
  const shot = async (t, file) => {
    await pg.setContent(`<body style="margin:0">${frame(t)}</body>`);
    await pg.screenshot({ path: file });
  };
  if (o.png || !o.out) {
    const out = o.png || `out/${LOC.id}.png`;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await shot(+(o.t || 0), out);
    await b.close();
    return console.log(`Tersimpan: ${out}`);
  }
  fs.mkdirSync(path.dirname(o.out), { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "loc-"));
  const n = Math.round(duration * o.fps);
  for (let i = 0; i < n; i++) await shot(i / o.fps, path.join(tmp, `f${String(i).padStart(5, "0")}.png`));
  await b.close();
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(o.fps), "-i", path.join(tmp, "f%05d.png"),
    "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2:color=white", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", o.out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Tersimpan: ${o.out} (${n} frame @ ${o.fps}fps)`);
})();
