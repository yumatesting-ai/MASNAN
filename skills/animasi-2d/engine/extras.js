// FIGURAN (karakter latar): dibuat otomatis dari benih acak (seed) + jenis.
// Memakai mesin rig yang sama dengan tokoh utama, tetapi kombinasi rambut/pakaian/warna/tinggi diacak
// sehingga tidak ada yang kembar. Ciri kampung Indonesia: kerudung, peci, caping, sarung, daster.
//
//   const { figuran } = require("./extras.js");
//   const rig = figuran(7, "ibu");          // rig siap pakai (di-cache per seed+jenis)
//   rig.drawPart("front", { expr: "smile" })
//
// Jenis: bapak, ibu, pemuda, pemudi, anak_laki, anak_perempuan, kakek, petani
const path = require("path");
const { createRig } = require("./chibi-rig.js");

const D = (id) => require(path.join(__dirname, "..", "characters", id, "design.js"));
const HAIR = {
  long: () => D("nana").hair, spiky: () => D("bima").hair, bob: () => D("rara").hair,
  bun: () => D("atin").hair, bald: () => D("hasan").hair,
};
const EARS = {
  long: { front: ["r"], side: true, back: [] }, spiky: { front: ["l", "r"], side: true, back: ["l", "r"] },
  bob: { front: [], side: false, back: [] }, bun: { front: ["l", "r"], side: true, back: ["l", "r"] },
  bald: { front: ["l", "r"], side: true, back: ["l", "r"] }, hijab: { front: [], side: false, back: [] },
};
// kerudung: tudung menutup kepala & leher, lubang wajah, menjuntai ke dada
const HIJAB = {
  long: false,
  shapes: {
    hairBack: "M150,64 C204,64 230,100 228,150 C226,190 230,222 236,246 L64,246 C70,222 74,190 72,150 C70,100 96,64 150,64 Z",
    hairBackView: "M150,64 C204,64 230,100 228,150 C226,196 224,226 216,250 L84,250 C76,226 74,196 72,150 C70,100 96,64 150,64 Z",
    hairFront: "M150,62 C204,62 230,98 230,148 C230,186 220,206 202,216 C204,238 188,258 150,262 C112,258 96,238 98,216 C80,206 70,186 70,148 C70,98 96,62 150,62 Z M92,150 A58,54 0 1 0 208,150 A58,54 0 1 0 92,150 Z",
    hairBackSide: "M150,64 C106,64 84,98 86,148 C88,190 94,226 104,250 L170,250 C166,226 160,200 158,180 L150,120 Z",
    hairFrontSide: "M86,148 C84,98 110,62 152,62 C194,62 218,92 214,124 C200,112 184,108 170,110 C160,114 156,126 156,142 C156,172 162,198 178,212 C172,236 150,246 128,240 C106,232 90,204 86,148 Z",
  },
  shineFront: "M98,92 C120,72 180,72 202,92", shineBack: "M96,94 C118,74 182,74 204,94", shineSide: "M100,96 C120,74 172,72 200,92",
  frontShade: "M70,180 L230,180 L230,270 L70,270 Z",
  frontStrands: "M150,64 C146,80 146,92 150,98 M112,206 C120,226 134,240 150,244 M188,206 C180,226 166,240 150,244",
  backViewStrands: "M150,70 L150,248 M116,90 C110,150 110,200 116,246 M184,90 C190,150 190,200 184,246",
  sideStrands: "M120,70 C104,96 96,130 96,170", sideBackStrands: "M100,180 C104,206 110,228 116,246",
};

// aksesori kepala
const PECI = {
  front: () => `<path fill="#2c2c2c" stroke="#2a2a2a" stroke-width="3" stroke-linejoin="round" d="M102,98 C102,80 112,70 150,70 C188,70 198,80 198,98 Z"/>
    <path fill="none" stroke="#5a5a5a" stroke-width="2" d="M106,92 C130,88 170,88 194,92"/>`,
  side: () => `<path fill="#2c2c2c" stroke="#2a2a2a" stroke-width="3" stroke-linejoin="round" d="M92,102 C94,80 116,70 150,70 C182,70 198,80 198,100 Z"/>`,
  back: () => `<path fill="#2c2c2c" stroke="#2a2a2a" stroke-width="3" stroke-linejoin="round" d="M102,98 C102,80 112,70 150,70 C188,70 198,80 198,98 Z"/>`,
};
const CAPING = {
  front: () => `<path fill="#d6d6d6" stroke="#2a2a2a" stroke-width="3" stroke-linejoin="round" d="M52,106 L150,46 L248,106 Q150,120 52,106 Z"/>
    <path fill="none" stroke="#9a9a9a" stroke-width="2" d="M150,48 L104,108 M150,48 L196,108 M150,48 L150,114 M150,48 L76,106 M150,48 L224,106"/>`,
  side: () => `<path fill="#d6d6d6" stroke="#2a2a2a" stroke-width="3" stroke-linejoin="round" d="M60,108 L150,48 L240,108 Q150,120 60,108 Z"/>
    <path fill="none" stroke="#9a9a9a" stroke-width="2" d="M150,50 L110,110 M150,50 L190,110 M150,50 L150,114"/>`,
  back: () => CAPING.front(),
};

function rng(seed) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
const grey = (r, lo, hi) => { const v = Math.round(lo + r() * (hi - lo)); const h = v.toString(16).padStart(2, "0"); return `#${h}${h}${h}`; };

const KINDS = {
  bapak:          { hair: ["spiky", "bald", "spiky"], hat: [["peci", 0.4]], tops: [["tee", "short"], ["singlet", "none"], ["hoodie", "long"]], bottoms: ["pants", "sarong", "pants"], shoes: ["sandal", "sandal", "sneaker"], scale: [1.2, 1.3], mustache: 0.45, armDX: [4, 10] },
  ibu:            { hair: ["hijab", "hijab", "bun"], tops: [["daster", "short"], ["sweater", "long"], ["tee", "short"]], bottoms: ["none", "skirt", "pants"], shoes: ["sandal", "dark"], scale: [1.14, 1.22], glasses: 0.2, armDX: [6, 14] },
  pemuda:         { hair: ["spiky"], hat: [["peci", 0.15]], tops: [["hoodie", "long"], ["tee", "short"]], bottoms: ["pants", "shorts"], shoes: ["sneaker", "sandal"], scale: [1.1, 1.18], armDX: [0, 2] },
  pemudi:         { hair: ["hijab", "long", "bob"], tops: [["sweater", "long"], ["tee", "short"]], bottoms: ["skirt", "pants"], shoes: ["dark", "sneaker"], scale: [1.06, 1.12], armDX: [0, 2] },
  anak_laki:      { hair: ["spiky"], tops: [["tee", "short"], ["hoodie", "long"], ["singlet", "none"]], bottoms: ["shorts"], shoes: ["sneaker", "sandal"], scale: [0.92, 1.0], armDX: [0, 0] },
  anak_perempuan: { hair: ["bob", "long", "hijab"], tops: [["tee", "short"], ["sweater", "long"]], bottoms: ["skirt"], shoes: ["dark", "sneaker"], scale: [0.92, 1.0], armDX: [0, 0] },
  kakek:          { hair: ["bald", "spiky"], hat: [["peci", 0.7]], tops: [["singlet", "none"], ["tee", "short"]], bottoms: ["sarong"], shoes: ["sandal"], scale: [1.16, 1.22], mustache: 0.5, grayHair: true, armDX: [6, 12] },
  petani:         { hair: ["spiky", "bald"], hat: [["caping", 1]], tops: [["tee", "short"], ["hoodie", "long"]], bottoms: ["pants"], shoes: ["sandal"], scale: [1.2, 1.28], armDX: [2, 6] },
};

function figuranDesign(seed, kind) {
  const K = KINDS[kind];
  if (!K) throw new Error(`Jenis figuran "${kind}" tidak ada. Pilihan: ${Object.keys(KINDS).join(", ")}`);
  const r = rng(seed * 31 + kind.length * 7);
  const hairKind = pick(r, K.hair);
  const [top, sleeves] = pick(r, K.tops);
  let bottom = pick(r, K.bottoms);
  if (top === "daster") bottom = "none";
  if (bottom === "none" && top !== "daster") bottom = "skirt";
  const hat = (K.hat || []).find(([, p]) => r() < p);
  const hair = hairKind === "hijab" ? HIJAB : JSON.parse(JSON.stringify(HAIR[hairKind]()));
  const hairCol = hairKind === "hijab" ? grey(r, 0x70, 0xe6) : K.grayHair ? grey(r, 0x9a, 0xc2) : grey(r, 0x2c, 0x60);
  const acc = hat ? (hat[0] === "peci" ? PECI : CAPING) : null;
  const scale = +(K.scale[0] + r() * (K.scale[1] - K.scale[0])).toFixed(2);
  const design = {
    id: `fig${seed}${kind.slice(0, 3)}`,
    name: `Figuran ${kind} #${seed}`,
    gender: /ibu|pemudi|perempuan/.test(kind) ? "perempuan" : "laki-laki",
    colors: {
      hair: hairCol, top: grey(r, 0x6a, 0xf2), bottom: grey(r, 0x3a, 0x8a), shoe: pick(r, ["#f4f4f4", "#4a4a4a", "#6a6a6a"]),
      skin: grey(r, 0xe4, 0xf0), sock: "#f4f4f4", accent: grey(r, 0xe0, 0xfa),
    },
    hair,
    ears: EARS[hairKind],
    ahoge: null,
    face: { mustache: K.mustache && r() < K.mustache, glasses: K.glasses && r() < K.glasses, baldShine: hairKind === "bald" && !hat, doubleChin: top === "daster" },
    accessory: acc ? { front: acc.front, side: acc.side, back: acc.back } : undefined,
    top, sleeves, bottom,
    legwear: bottom === "shorts" && r() < 0.4 ? "socks" : null,
    shoes: pick(r, K.shoes),
    build: { scale, armDX: Math.round(K.armDX[0] + r() * (K.armDX[1] - K.armDX[0])), armRest: top === "singlet" ? 8 : 0 },
    expr: { neutral: { mouth: pick(r, ["cat", "smile", "flat", "smile"]), sweat: false } },
  };
  if (hairKind === "hijab") design.ears = EARS.hijab;
  return design;
}

const cache = new Map();
function figuran(seed, kind) {
  const key = `${seed}:${kind}`;
  if (!cache.has(key)) cache.set(key, createRig(figuranDesign(seed, kind)));
  return cache.get(key);
}

module.exports = { figuran, figuranDesign, KINDS: Object.keys(KINDS), HIJAB, PECI, CAPING, EARS };
