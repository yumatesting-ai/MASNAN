// CEK TABRAKAN rute karakter vs benda di lokasi (agar karakter tidak menembus meja, pagar, tiang, pohon, dll.).
// Tiap lokasi punya `obstacles`: { name, x0, x1, z0, z1 } (kotak, meter) atau { name, x, z, r } (lingkaran).
// Hanya fase BERGERAK yang dicek; ujung rute yang berada di titik duduk (seat) / titik khusus boleh menempel benda
// (mis. duduk di bangku) -> 0,35 m terakhir/pertama ke titik itu diabaikan.
//
//   const { checkTimeline } = require("./collide.js");
//   checkTimeline(LOC, "hasan", tl)  -> [ "hasan: fase 3 (walk) menembus 'pagar bambu' di x=4.0 z=5.4", ... ]
const BODY = 0.16; // jari-jari badan (m)

function hit(o, x, z, r) {
  if (o.r != null) return Math.hypot(x - o.x, z - o.z) < o.r + r;
  return x > o.x0 - r && x < o.x1 + r && z > o.z0 - r && z < o.z1 + r;
}

function checkTimeline(LOC, who, tl, opt = {}) {
  const obs = LOC.obstacles || [], out = [], r = opt.radius ?? BODY;
  tl.phases.forEach((ph, i) => {
    if (!ph.to || ph.dist < 0.02) return;
    if (ph.over && ph.over.intoWater) return; // gerak sengaja masuk ke air (tercebur) -> bukan tembus
    const n = Math.max(2, Math.ceil(ph.dist / 0.05));
    const loose = (spot) => spot && (spot.seat != null || spot.y);
    for (let k = 0; k <= n; k++) {
      const u = k / n, x = ph.from.x + (ph.to.x - ph.from.x) * u, z = ph.from.z + (ph.to.z - ph.from.z) * u;
      if (loose(ph.from) && u * ph.dist < 0.35) continue;
      if (loose(ph.to) && (1 - u) * ph.dist < 0.35) continue;
      const o = obs.find((ob) => hit(ob, x, z, r));
      if (o) { out.push(`${who}: fase ${i + 1} (${ph.clipName}) menembus '${o.name}' di x=${x.toFixed(2)} z=${z.toFixed(2)}`); return; }
    }
  });
  return out;
}

module.exports = { checkTimeline, hit, BODY };
