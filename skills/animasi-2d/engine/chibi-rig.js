// Mesin rig karakter chibi (SVG). Semua karakter berbagi kerangka, wajah, ekspresi, tampak dan klip;
// perbedaannya ada di objek DESAIN (rambut, baju, bawahan, kaus kaki, sepatu, warna, aksesori).
//
//   const rig = createRig(design);
//   rig.drawCharacter(view, pose, opts) -> string <svg>
//   rig.drawPart(view, pose) -> isi <g> saja (untuk adegan multi-karakter; opts.x/scale lewat sceneGroup)
//
//   view : "front" | "three" (3/4) | "side" | "back"   (pose.view mengalahkan argumen)
//   pose : lihat DEFAULT_POSE. pose.expr memakai preset EXPRESSIONS (bisa di-override per desain).
// Tampak "three" dan "side" menghadap ke KIRI layar. pose.flip = true membalik.
//
// Desain (lihat characters/*/design.js):
//   id, name, colors{hair,top,bottom,shoe,skin,sock}, hair{shapes, strands, ...}, ears{front,side,back},
//   ahoge: "curl"|"spike"|null, accessory{front,side,back}(C)->svg, top: "tee"|"hoodie"|"sweater",
//   sleeves: "short"|"long", bottom: "pants"|"shorts"|"skirt", legwear: null|"socks"|"kneeSocks",
//   shoes: "sneaker"|"dark", expr{ preset: {...} }

const BASE_DEFAULT_POSE = {
  view: null, flip: false, expr: null,
  eyes: "normal", mouth: "cat", blink: 0, lookX: 0, lookY: 0, blush: 0, dirty: 0, sweat: true,
  tears: "none", anger: false, gloom: false, above: null, fx: 0,
  headTilt: 0, headX: 0, headY: 0, hairSway: 0, ahoge: 0,
  breathe: 0, armL: 0, armR: 0, legL: 0, legR: 0, bodyX: 0, bodyY: 0, lean: 0, squash: 0, scaleX: 1,
  // --- aksi ---
  elbowL: 0, elbowR: 0,     // tekuk siku (deg, + = lengan bawah naik ke arah dada/wajah)
  holdL: null, holdR: null, // barang di tangan: "coffee" | "phone" | "broom" (sapu lidi)
  holdTilt: 0,              // kemiringan gelas (minum: negatif = dituang ke mulut)
  hold: null,               // barang dua tangan: "newspaper"
  paperY: 0,                // naik-turun koran (px)
  sit: 0,                   // 0 = berdiri, 1 = duduk (bisa di-blend: gerakan duduk/berdiri)
  seat: 0.42,               // tinggi tempat duduk (meter) — bangku 0.42, bale 0.5
};

const BASE_EXPRESSIONS = {
  neutral:    { eyes: "normal", mouth: "cat", sweat: true },
  smile:      { eyes: "normal", mouth: "smile", blush: 0.6, sweat: false },
  happy:      { eyes: "happy", mouth: "grin", blush: 1, sweat: false, above: "sparkles" },
  laugh:      { eyes: "cry", mouth: "grin", blush: 1, sweat: false, above: "music" },
  surprised:  { eyes: "wide", mouth: "o", sweat: true, above: "exclaim" },
  shocked:    { eyes: "wide", mouth: "wavy", sweat: true, gloom: true },
  sad:        { eyes: "sad", mouth: "frown", sweat: false, tears: "drop" },
  cry:        { eyes: "cry", mouth: "shout", sweat: false, tears: "stream" },
  angry:      { eyes: "angry", mouth: "frown", sweat: false, anger: true },
  furious:    { eyes: "angry", mouth: "shout", sweat: false, anger: true },
  confused:   { eyes: "normal", mouth: "wavy", lookX: 0.6, lookY: -1, sweat: true, above: "question" },
  dizzy:      { eyes: "dizzy", mouth: "wavy", sweat: false, above: "stars" },
  sleepy:     { eyes: "closed", mouth: "o", sweat: false, above: "zzz" },
  smug:       { eyes: "half", mouth: "smirk", sweat: false },
  deadpan:    { eyes: "half", mouth: "flat", sweat: false },
  shy:        { eyes: "normal", mouth: "wavy", lookX: -1, blush: 1, sweat: true },
  love:       { eyes: "sparkle", mouth: "smile", blush: 1, sweat: false, above: "heart" },
  nervous:    { eyes: "normal", mouth: "flat", sweat: true },
};

// ---------- warna ----------
const toRGB = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const toHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mul = (h, f) => toHex(toRGB(h).map((v) => v * f));
const mix = (h, h2, k) => { const a = toRGB(h), b = toRGB(h2); return toHex(a.map((v, i) => v + (b[i] - v) * k)); };

function makePalette(c) {
  const dark = (h) => toRGB(h)[0] < 120;
  return {
    line: "#2a2a2a",
    hair: c.hair, hairBack: mul(c.hair, 0.87), hairShade: mul(c.hair, 0.76), hairShine: mix(c.hair, "#ffffff", dark(c.hair) ? 0.16 : 0.2),
    skin: c.skin, skinShade: mul(c.skin, 0.9), skinFar: mul(c.skin, 0.947),
    shirt: c.top, shirtShade: mul(c.top, dark(c.top) ? 0.84 : 0.896), shirtDeep: mul(c.top, 0.78),
    pants: c.bottom, pantsShade: mul(c.bottom, 0.785),
    shoe: c.shoe, shoeShade: mul(c.shoe, 0.87),
    sock: c.sock || "#fafafa", sockShade: mul(c.sock || "#fafafa", 0.88),
    accent: c.accent || "#ffffff",
    eyeWhite: "#ffffff", mouthIn: "#3a3a3a", tongue: "#9a9a9a", blush: "#cfcfcf", ground: "rgba(0,0,0,0.13)",
  };
}

// ---------- bentuk badan bersama ----------
const BODY_SHAPES = {
  // badan dewasa: kulit (di bawah kutang) & atasan baru
  bellyBody: `M112,206 C124,198 176,198 188,206 C200,222 214,246 216,268 C218,290 196,302 150,302 C104,302 82,290 84,268 C86,246 100,222 112,206 Z`,
  bellyBodyBack: `M112,206 C124,198 176,198 188,206 C200,222 212,246 214,268 C216,290 196,302 150,302 C104,302 84,290 86,268 C88,246 100,222 112,206 Z`,
  bellyBodySide: `M128,206 C140,198 164,198 172,206 C190,220 206,244 206,270 C206,294 184,302 150,302 C134,302 122,296 120,286 C120,262 122,232 128,206 Z`,
  singlet: `M126,200 L134,200 C136,214 164,214 166,200 L174,200 C178,214 188,224 198,236 C212,252 216,270 212,286 C202,300 178,304 150,304 C122,304 98,300 88,286 C84,270 88,252 102,236 C112,224 122,214 126,200 Z`,
  singletBack: `M126,200 L136,200 C140,206 160,206 164,200 L174,200 C178,214 188,224 198,236 C210,252 214,270 210,286 C200,300 178,304 150,304 C122,304 100,300 90,286 C86,270 90,252 102,236 C112,224 122,214 126,200 Z`,
  singletSide: `M136,200 L146,200 C148,210 154,212 160,208 L166,200 C182,214 202,238 204,264 C206,290 186,300 152,300 C136,300 124,294 122,284 C122,262 126,230 136,200 Z`,
  daster: `M108,206 C120,200 132,199 138,199 Q150,212 162,199 C168,199 180,200 192,206 C208,226 220,256 222,286 C224,312 224,334 224,352 C184,366 116,366 76,352 C76,334 76,312 78,286 C80,256 92,226 108,206 Z`,
  dasterBack: `M108,206 C128,199 172,199 192,206 C208,226 220,256 222,286 C224,312 224,334 224,352 C184,366 116,366 76,352 C76,334 76,312 78,286 C80,256 92,226 108,206 Z`,
  dasterSide: `M128,206 C138,198 166,198 178,206 C196,230 206,262 208,292 C210,318 210,336 210,352 C172,364 126,364 98,352 C100,330 104,300 110,270 C116,246 122,222 128,206 Z`,
  sarong: `M102,276 C130,284 170,284 198,276 C200,304 202,334 204,362 C170,372 130,372 96,362 C98,334 100,304 102,276 Z`,
  sarongSide: `M116,276 C140,282 166,282 188,276 C190,304 191,334 192,362 C162,370 136,370 110,362 C112,334 114,304 116,276 Z`,
  armFull: `M120,203 C106,206 97,216 95,232 C93,256 95,276 96,290 C96,301 101,305 106,305 C112,305 114,300 114,290 C115,270 116,252 118,238 C119,226 121,214 126,206 Z`,
  armSideFull: `M141,205 C134,218 140,236 141,250 L141,290 C141,301 146,305 151,305 C157,305 159,300 159,290 L159,250 C160,236 168,218 161,205 C156,200 146,200 141,205 Z`,
  sandalSole: `M110,377 C110,371 118,369 129,369 C140,369 149,371 149,377 C149,381 143,383 129,383 C115,383 110,381 110,377 Z`,
  sandalFoot: `M114,372 C114,363 120,359 129,359 C138,359 145,363 145,372 C140,375 118,375 114,372 Z`,
  sandalSoleSide: `M130,378 C130,374 140,373 158,373 C176,373 186,375 186,379 C186,383 176,384 158,384 C140,384 130,383 130,378 Z`,
  sandalFootSide: `M136,376 C136,366 146,360 158,362 C170,364 180,370 182,376 C170,378 148,378 136,376 Z`,
  face: `M86,140 A64,58 0 1 0 214,140 A64,58 0 1 0 86,140 Z`,
  // atasan
  tee: `M114,208 C120,203 130,200 138,199 Q150,210 162,199 C170,200 180,203 186,208
    C188,232 190,262 192,284 C166,292 134,292 108,284 C110,262 112,232 114,208 Z`,
  teeBack: `M114,208 C130,200 170,200 186,208 C188,232 190,262 192,284 C166,292 134,292 108,284 C110,262 112,232 114,208 Z`,
  teeSide: `M128,206 C138,199 164,199 174,206 C180,232 182,262 181,286 C162,292 138,292 120,286 C120,262 122,232 128,206 Z`,
  hoodie: `M112,208 C120,202 132,199 140,198 Q150,206 160,198 C168,199 180,202 188,208
    C191,234 193,264 194,292 C166,299 134,299 106,292 C107,264 109,234 112,208 Z`,
  hoodieBack: `M112,208 C130,200 170,200 188,208 C191,234 193,264 194,292 C166,299 134,299 106,292 C107,264 109,234 112,208 Z`,
  hoodieSide: `M126,206 C138,198 166,198 176,206 C182,232 184,262 184,292 C162,298 136,298 118,292 C118,262 120,232 126,206 Z`,
  sweater: `M114,208 C120,203 130,200 138,199 Q150,210 162,199 C170,200 180,203 186,208
    C188,230 189,252 190,272 C166,279 134,279 110,272 C111,252 112,230 114,208 Z`,
  sweaterBack: `M114,208 C130,200 170,200 186,208 C188,230 189,252 190,272 C166,279 134,279 110,272 C111,252 112,230 114,208 Z`,
  sweaterSide: `M128,206 C138,199 164,199 174,206 C180,230 182,252 182,272 C162,278 138,278 120,272 C120,252 122,230 128,206 Z`,
  // lengan
  arm: `M98,240 C96,260 95,277 96,290 C96,301 101,305 106,305 C112,305 114,300 114,290 C114,277 114,260 114,244 Z`,
  armSide: `M142,236 C141,258 140,276 141,290 C141,301 146,305 151,305 C157,305 159,300 159,290 C159,276 159,258 158,236 Z`,
  sleeve: `M124,203 C110,206 100,212 95,224 C91,233 89,242 88,250 C96,255 105,257 115,256 C117,238 119,220 128,206 Z`,
  sleeveSide: `M140,205 C133,217 133,236 136,252 C146,257 158,257 166,252 C169,236 169,217 162,205 C156,200 146,200 140,205 Z`,
  longSleeve: `M124,203 C108,206 97,216 93,232 C91,252 90,272 91,291 C98,295 108,295 115,291 C115,272 116,252 118,238 C119,226 121,214 128,206 Z`,
  longSleeveSide: `M140,205 C133,217 133,236 136,252 L138,292 C144,296 156,296 163,292 L166,252 C169,236 169,217 162,205 C156,200 146,200 140,205 Z`,
  // kaki
  legL: `M113,282 L150,282 L150,300 L146,368 C136,372 122,372 113,368 C112,345 112,310 113,282 Z`,
  legR: `M150,282 L187,282 C188,310 188,345 187,368 C178,372 164,372 154,368 L150,300 Z`,
  legLs: `M121,282 L146,282 L145,368 C139,371 128,371 122,368 C121,345 120,310 121,282 Z`,
  legRs: `M154,282 L179,282 C180,310 179,345 178,368 C172,371 161,371 155,368 L155,282 Z`,
  shortsL: `M112,278 L150,278 L150,298 L148,322 C138,326 122,326 113,322 C112,306 111,292 112,278 Z`,
  shortsR: `M150,278 L188,278 C189,292 188,306 187,322 C178,326 162,326 152,322 L150,298 Z`,
  legSide: `M136,280 L166,280 C167,310 167,340 166,366 L136,366 C135,340 135,310 136,280 Z`,
  legSideS: `M141,280 L161,280 C162,310 161,340 160,366 L142,366 C141,340 140,310 141,280 Z`,
  shortsSide: `M133,276 L169,276 C170,292 170,306 169,322 L135,322 C134,306 133,292 133,276 Z`,
  skirt: `M110,262 C130,256 170,256 190,262 C196,282 200,300 204,318 C170,328 130,328 96,318 C100,300 104,282 110,262 Z`,
  skirtSide: `M124,262 L178,262 C184,280 188,298 192,316 C162,324 136,324 110,316 C114,298 118,280 124,262 Z`,
  shoe: `M110,374 C110,366 118,362 129,362 C140,362 149,366 149,374 C149,379 143,381 129,381 C115,381 110,379 110,374 Z`,
  shoeSide: `M130,372 C130,364 142,360 158,361 C174,362 186,367 186,373 C186,379 176,381 158,381 C140,381 130,379 130,372 Z`,
};

const LAYOUT = {
  front: {
    eyes: [{ cx: 122, cy: 148, rx: 22, ry: 12, inner: 6 }, { cx: 178, cy: 148, rx: 22, ry: 12, inner: -6 }],
    mouth: { x: 150, y: 174, s: 1 }, cheeks: [{ x: 114, y: 167 }, { x: 186, y: 167 }],
    sweat: { x: 199, y: 165 }, anger: { x: 198, y: 94 }, top: { x: 206, y: 62 },
  },
  three: {
    eyes: [{ cx: 116, cy: 150, rx: 15, ry: 11.5, inner: 4 }, { cx: 163, cy: 148, rx: 21, ry: 12, inner: -5 }],
    mouth: { x: 137, y: 175, s: 0.95 }, cheeks: [{ x: 110, y: 168 }, { x: 170, y: 168 }],
    sweat: { x: 190, y: 166 }, anger: { x: 192, y: 94 }, top: { x: 92, y: 62 },
  },
  side: {
    eyes: [{ cx: 184, cy: 147, rx: 13, ry: 12, inner: 4 }],
    mouth: { x: 192, y: 177, s: 0.72 }, cheeks: [{ x: 178, y: 167 }],
    sweat: { x: 114, y: 112 }, anger: { x: 128, y: 98 }, top: { x: 196, y: 62 },
  },
  back: { eyes: [], mouth: null, cheeks: [], sweat: null, anger: { x: 198, y: 94 }, top: { x: 206, y: 62 } },
};

const AHOGE_PATHS = {
  curl: { stroke: true, d: "M150,76 C151,64 156,58 152,50 C148,43 139,46 141,53 C143,58 149,57 150,53" },
  spike: { stroke: false, d: "M141,76 C140,68 136,62 131,58 C140,58 146,63 149,68 C150,60 154,53 160,50 C158,58 158,66 160,76 Z" },
};

function createRig(design) {
  const ID = design.id;
  const PALETTE = makePalette(design.colors);
  const H = design.hair;
  const SHAPE = Object.assign({}, BODY_SHAPES, H.shapes);
  const EXPRESSIONS = {};
  for (const k in BASE_EXPRESSIONS) EXPRESSIONS[k] = Object.assign({}, BASE_EXPRESSIONS[k], (design.expr || {})[k]);
  const DEFAULT_POSE = Object.assign({}, BASE_DEFAULT_POSE);

  const LINE = `stroke="${PALETTE.line}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const fillLine = (fill, d, extra = "") => `<path fill="${fill}" ${LINE} ${extra} d="${d}"/>`;
  const outline = (d, extra = "") => `<path fill="none" ${LINE} ${extra} d="${d}"/>`;
  const shade = (clipId, fill, d, extra = "") => `<path clip-path="url(#${ID}-${clipId})" fill="${fill}" ${extra} d="${d}"/>`;
  const strokeLines = (d, color, w = 2, clipKey = null) => (d ? `<path ${clipKey ? `clip-path="url(#${ID}-${clipKey})"` : ""} fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" d="${d}"/>` : "");
  // garis luar tutup rambut samping TANPA segmen terakhir (tepi belakang yang tertimbun rambut belakang)
  // -> tidak ada garis ganda di belakang kepala. Desain bisa menonaktifkan lewat hair.sideClosed.
  const openBack = (d) => { const i = d.lastIndexOf("C"); return i > 0 ? d.slice(0, i).trim() : d; };
  const MIRROR = `translate(300 0) scale(-1 1)`;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function defs() {
    const clip = (id, d) => `<clipPath id="${ID}-${id}"><path clip-rule="evenodd" d="${d}"/></clipPath>`;
    const rect = (id, y0, y1) => `<clipPath id="${ID}-${id}"><rect x="-200" y="${y0}" width="700" height="${y1 - y0}"/></clipPath>`;
    return `<defs>${Object.entries(SHAPE).map(([k, d]) => clip(k, d)).join("")}
      ${rect("armU", -200, 273)}${rect("armD", 271, 600)}${rect("armUL", -200, 269)}${rect("armDL", 267, 600)}
      ${rect("hipU", -200, 283)}${rect("hipD", 281, 600)}${rect("kneeU", -200, 327)}${rect("kneeD", 324, 600)}</defs>`;
  }

  // ================= WAJAH =================
  function eye(e, p) {
    const C = PALETTE;
    const { cx, cy, rx, ry, inner } = e;
    const s = Math.sign(inner) || 1; // arah sisi dalam
    const px = cx + inner + 3 * p.lookX, py = cy + 1 + 3 * p.lookY;
    const type = p.blink >= 0.6 && !["happy", "cry", "dizzy", "closed"].includes(p.eyes) ? "closed" : p.eyes;
    const sy = type === p.eyes ? 1 - Math.min(p.blink, 0.6) : 1;
    const wrap = (inner) => `<g transform="translate(${cx} ${cy}) scale(1 ${sy}) translate(${-cx} ${-cy})">${inner}</g>`;
    const white = (k = 1) => `<ellipse fill="${C.eyeWhite}" stroke="${C.line}" stroke-width="2.6" vector-effect="non-scaling-stroke" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry * k}"/>`;
    const lid = (k = 1) => `<path fill="none" stroke="${C.line}" stroke-width="3.8" stroke-linecap="round" vector-effect="non-scaling-stroke"
        d="M${cx - rx + 1},${cy - 3 * k} C${cx - rx * 0.72},${cy - ry * 1.08 * k} ${cx + rx * 0.72},${cy - ry * 1.08 * k} ${cx + rx - 1},${cy - 3 * k}"/>`;
    const pupil = (r = 2.7) => `<circle fill="${C.line}" cx="${px}" cy="${py}" r="${r}"/>`;
    // potong bagian atas mata dengan garis kelopak miring (sad/angry)
    const cut = (yOuter, yInner) => {
      const xo = cx - s * (rx + 4), xi = cx + s * (rx + 4);
      return `<path fill="${C.skin}" d="M${xo},${yOuter} L${xi},${yInner} L${xi},${cy - ry - 8} L${xo},${cy - ry - 8} Z"/>
        <path fill="none" stroke="${C.line}" stroke-width="3.6" stroke-linecap="round" d="M${cx - s * rx},${yOuter + (yInner - yOuter) * 0.04} L${cx + s * rx * 0.95},${yInner - (yInner - yOuter) * 0.02}"/>`;
    };
    switch (type) {
      case "closed":
        return `<path fill="none" stroke="${C.line}" stroke-width="3.2" stroke-linecap="round" d="M${cx - rx + 3},${cy} Q${cx},${cy + 7} ${cx + rx - 3},${cy}"/>`;
      case "happy":
        return `<path fill="none" stroke="${C.line}" stroke-width="3.4" stroke-linecap="round" d="M${cx - rx + 3},${cy + 4} Q${cx},${cy - 10} ${cx + rx - 3},${cy + 4}"/>`;
      case "cry": { // >  <
        const a = cx - s * rx * 0.45, b = cx + s * rx * 0.45;
        return `<path fill="none" stroke="${C.line}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" d="M${a},${cy - 7} L${b},${cy} L${a},${cy + 7}"/>`;
      }
      case "dizzy": {
        const k = Math.min(rx, ry * 1.6) / 10;
        return `<g transform="translate(${cx} ${cy}) scale(${k}) rotate(${p.fx * 360})"><path fill="none" stroke="${C.line}" stroke-width="${2.6 / k}" stroke-linecap="round"
          d="M0,0 a1.5,1.5 0 1 1 3,0 a3,3 0 1 1 -6,0 a4.5,4.5 0 1 1 9,0 a6,6 0 1 1 -12,0 a7.5,7.5 0 1 1 15,0"/></g>`;
      }
      case "wide":
        return wrap(`<ellipse fill="${C.eyeWhite}" stroke="${C.line}" stroke-width="2.6" vector-effect="non-scaling-stroke" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry * 1.35}"/>
          <circle fill="${C.line}" cx="${cx + 2 * p.lookX}" cy="${cy + 2 * p.lookY}" r="1.8"/>`);
      case "sparkle":
        return wrap(`${white(1.1)}${lid(1.1)}
          <circle fill="${C.line}" cx="${cx + inner * 0.4}" cy="${cy + 1}" r="${Math.min(rx, ry) * 0.62}"/>
          <circle fill="#fff" cx="${cx + inner * 0.4 - 2.5}" cy="${cy - 2}" r="2.4"/>
          <circle fill="#fff" cx="${cx + inner * 0.4 + 2.5}" cy="${cy + 3.5}" r="1.2"/>`);
      case "half":
        return wrap(`<path fill="${C.eyeWhite}" stroke="${C.line}" stroke-width="2.6" stroke-linejoin="round"
            d="M${cx - rx},${cy} C${cx - rx},${cy + ry * 1.25} ${cx + rx},${cy + ry * 1.25} ${cx + rx},${cy} Z"/>
          <circle fill="${C.line}" cx="${px}" cy="${cy + 4}" r="2.6"/>
          <path fill="none" stroke="${C.line}" stroke-width="3.8" stroke-linecap="round" d="M${cx - rx - 1},${cy} L${cx + rx + 1},${cy}"/>`);
      case "sad":
        return wrap(`${white()}${pupil()}${cut(cy - ry * 0.15, cy - ry * 0.95)}`);
      case "angry":
        return wrap(`${white()}${pupil()}${cut(cy - ry * 0.95, cy - ry * 0.05)}`);
      default:
        return wrap(`${white()}${lid()}${pupil()}`);
    }
  }

  function mouth(m, p) {
    if (!m) return "";
    const C = PALETTE;
    const st = `stroke="${C.line}" stroke-width="${2.6 / m.s}" stroke-linecap="round" stroke-linejoin="round"`;
    const shapes = {
      cat: `<path fill="none" ${st} d="M-8,-2 Q-4,4 0,-2 Q4,4 8,-2"/>`,
      open: `<path fill="${C.mouthIn}" ${st} d="M-7,-3 Q0,-5 7,-3 Q6,8 0,8 Q-6,8 -7,-3 Z"/>`,
      flat: `<path fill="none" ${st} d="M-6,0 L6,0"/>`,
      smile: `<path fill="none" ${st} d="M-8,-3 Q0,6 8,-3"/>`,
      frown: `<path fill="none" ${st} d="M-7,3 Q0,-4 7,3"/>`,
      o: `<ellipse fill="${C.mouthIn}" ${st} cx="0" cy="1" rx="3.6" ry="4.6"/>`,
      grin: `<path fill="${C.mouthIn}" ${st} d="M-10,-4 L10,-4 Q10,10 0,10 Q-10,10 -10,-4 Z"/>
             <path fill="${C.tongue}" d="M-5,8.2 Q0,2 5,8.2 Q0,10.2 -5,8.2 Z"/>
             <path fill="none" ${st} d="M-10,-4 L10,-4 Q10,10 0,10 Q-10,10 -10,-4 Z"/>`,
      wavy: `<path fill="none" ${st} d="M-10,1 Q-7.5,-3 -5,1 Q-2.5,5 0,1 Q2.5,-3 5,1 Q7.5,5 10,1"/>`,
      shout: `<path fill="${C.mouthIn}" ${st} d="M-10,-4 L10,-4 L6,12 Q0,14 -6,12 Z"/>
              <path fill="${C.tongue}" d="M-5,11.6 Q0,5 5,11.6 Q0,13.4 -5,11.6 Z"/>
              <path fill="none" ${st} d="M-10,-4 L10,-4 L6,12 Q0,14 -6,12 Z"/>`,
      smirk: `<path fill="none" ${st} d="M-7,1 Q1,4 8,-3"/>`,
      // melet kepanasan: mulut terbuka + lidah menjulur
      tongue: `<path fill="${C.mouthIn}" ${st} d="M-9,-4 L9,-4 Q8,7 0,7 Q-8,7 -9,-4 Z"/>
               <path fill="${C.tongue}" ${st} d="M-5,3 Q-6,16 0,17 Q6,16 5,3 Z"/><path fill="none" ${st} d="M0,6 L0,13"/>`,
    };
    return `<g transform="translate(${m.x} ${m.y}) scale(${m.s})">${shapes[p.mouth] || shapes.cat}</g>`;
  }

  function faceExtras(L, p, faceClip) {
    const C = PALETTE;
    let out = "";
    if (p.gloom) {
      const xs = [];
      for (let x = 104; x <= 196; x += 9) xs.push(`M${x},96 L${x},${126 + (x % 2) * 4}`);
      out += `<g clip-path="url(#${ID}-${faceClip})">
        <path fill="${C.skinShade}" d="M80,80 L220,80 L220,132 C190,138 110,138 80,132 Z"/>
        <path fill="none" stroke="#8c8c8c" stroke-width="2" stroke-linecap="round" d="${xs.join(" ")}"/></g>`;
    }
    if (p.blush > 0) {
      out += L.cheeks.map((c) => `<g opacity="${p.blush}">
        <ellipse fill="${C.blush}" cx="${c.x}" cy="${c.y}" rx="10" ry="4.5"/>
        <path fill="none" stroke="#9a9a9a" stroke-width="1.8" stroke-linecap="round"
          d="M${c.x - 6},${c.y + 3} l3,-6 M${c.x - 1},${c.y + 3} l3,-6 M${c.x + 4},${c.y + 3} l3,-6"/></g>`).join("");
    }
    if (p.tears === "drop") {
      const e = L.eyes[L.eyes.length - 1];
      if (e) out += `<path fill="#fff" ${LINE} stroke-width="2" d="M${e.cx - e.rx * 0.6},${e.cy + e.ry - 1} c-3,6 -4,9 -2,11 c2,3 6,2 6,-1 c1,-3 -2,-6 -4,-10 Z"/>`;
    }
    if (p.tears === "stream") {
      out += L.eyes.map((e) => {
        const x = e.cx, y = e.cy + 6, wob = 2 * Math.sin(p.fx * Math.PI * 8);
        return `<path fill="#ffffff" stroke="${C.line}" stroke-width="2.2" stroke-linejoin="round"
          d="M${x - 6},${y} C${x - 7},${y + 14} ${x - 9},${y + 28} ${x - 6 + wob},${y + 44}
             L${x + 6 + wob},${y + 44} C${x + 9},${y + 28} ${x + 7},${y + 14} ${x + 6},${y} Z"/>`;
      }).join("");
    }
    // wajah kecipratan kopi: noda gelap + tetesan yang mengalir (p.dirty 0..1, p.fx menggerakkan tetesan)
    if (p.dirty > 0) {
      const k = Math.min(1, p.dirty), dy = (p.fx * 14) % 14;
      out += `<g clip-path="url(#${ID}-${faceClip})" opacity="${(0.85 * k).toFixed(2)}" fill="#5c5c5c">
        <path d="M96,120 C110,104 132,112 140,126 C146,140 128,146 116,140 C104,150 90,138 96,120 Z"/>
        <path d="M170,112 C186,104 204,116 200,132 C196,146 178,140 174,150 C164,146 160,124 170,112 Z"/>
        <path d="M128,176 C140,168 162,170 168,182 C172,196 150,200 140,196 C126,198 120,186 128,176 Z"/>
        <circle cx="152" cy="132" r="6"/><circle cx="110" cy="168" r="4"/><circle cx="190" cy="168" r="5"/>
        <path d="M112,140 L110,${160 + dy} C110,${166 + dy} 118,${166 + dy} 117,${160 + dy} L116,142 Z"/>
        <path d="M184,146 L183,${170 + dy * 0.7} C183,${176 + dy * 0.7} 190,${176 + dy * 0.7} 189,${170 + dy * 0.7} L188,148 Z"/>
        <path d="M146,196 L145,${212 + dy * 0.5} C145,${218 + dy * 0.5} 152,${218 + dy * 0.5} 151,${212 + dy * 0.5} L150,198 Z"/></g>`;
    }
    if (p.sweat && L.sweat) {
      const { x, y } = L.sweat;
      out += `<path fill="#fff" ${LINE} stroke-width="2.2" d="M${x},${y} C${x - 3},${y + 7} ${x - 5},${y + 11} ${x - 3},${y + 14} C${x - 1},${y + 17} ${x + 4},${y + 17} ${x + 5},${y + 13} C${x + 6},${y + 10} ${x + 3},${y + 6} ${x},${y} Z"/>`;
    }
    return out;
  }

  function angerMark(L, p) {
    if (!p.anger || !L.anger) return "";
    const { x, y } = L.anger;
    const k = 1 + 0.12 * Math.sin(p.fx * Math.PI * 2 * 3);
    const d = "M-8,-3 Q-3,-3 -3,-8 M3,-8 Q3,-3 8,-3 M8,3 Q3,3 3,8 M-3,8 Q-3,3 -8,3";
    return `<g transform="translate(${x} ${y}) scale(${k})">
      <path fill="none" stroke="${PALETTE.line}" stroke-width="6.5" stroke-linecap="round" d="${d}"/>
      <path fill="none" stroke="#f2f2f2" stroke-width="3" stroke-linecap="round" d="${d}"/></g>`;
  }

  // Efek di atas kepala — digambar di luar grup cermin agar teks tidak terbalik
  function aboveFx(p, anchor) {
    if (!p.above) return "";
    const C = PALETTE;
    const { x, y } = anchor;
    const bob = 3 * Math.sin(p.fx * Math.PI * 2);
    const txt = (t, size, dx = 0, dy = 0, op = 1) => `<text x="${x + dx}" y="${y + dy}" font-family="Arial Black, Arial, Helvetica, sans-serif"
      font-weight="900" font-size="${size}" text-anchor="middle" fill="#ffffff" stroke="${C.line}" stroke-width="3"
      paint-order="stroke" stroke-linejoin="round" opacity="${op}">${t}</text>`;
    const GLYPH = {
      question: "M-8,-12 C-8,-22 8,-22 8,-12 C8,-5 1,-4 1,3 L-1,3 C-1,-6 4,-7 4,-12 C4,-17 -4,-17 -4,-12 Z M0,7 a3,3 0 1 1 0,6 a3,3 0 1 1 0,-6 Z",
      exclaim: "M-3.5,-20 L3.5,-20 L2,4 L-2,4 Z M0,7 a3.2,3.2 0 1 1 0,6.4 a3.2,3.2 0 1 1 0,-6.4 Z",
      z: "M-8,-8 L8,-8 L8,-4 L-2,6 L8,6 L8,10 L-8,10 L-8,6 L2,-4 L-8,-4 Z",
    };
    const glyph = (k, gx, gy, sc, op = 1) => `<g transform="translate(${gx} ${gy}) scale(${sc})" opacity="${op}">
      <path fill="#ffffff" stroke="${C.line}" stroke-width="${3 / sc}" stroke-linejoin="round" d="${GLYPH[k]}"/></g>`;
    const star = (sx, sy, r) => `<path fill="#ffffff" ${LINE} stroke-width="2"
      d="M${sx},${sy - r} Q${sx + r * 0.2},${sy - r * 0.2} ${sx + r},${sy} Q${sx + r * 0.2},${sy + r * 0.2} ${sx},${sy + r}
         Q${sx - r * 0.2},${sy + r * 0.2} ${sx - r},${sy} Q${sx - r * 0.2},${sy - r * 0.2} ${sx},${sy - r} Z"/>`;
    switch (p.above) {
      case "question": return glyph("question", x, y + bob, 1);
      case "exclaim": return glyph("exclaim", x, y + bob, 1) + `<path fill="none" ${LINE} stroke-width="2.4" d="M${x - 22},${y - 22} l-8,-6 M${x + 20},${y - 24} l7,-7 M${x - 24},${y - 4} l-9,0"/>`;
      case "zzz": {
        const f = p.fx % 1;
        return [0, 1, 2].map((i) => {
          const t = (f + i / 3) % 1;
          return glyph("z", x - 10 + 26 * t, y + 10 - 40 * t, 0.55 + 0.5 * t, Math.min(1, (1 - t) * 2.5));
        }).join("");
      }
      case "heart":
        return `<g transform="translate(${x} ${y + bob}) scale(${1 + 0.1 * Math.sin(p.fx * Math.PI * 4)})">
          <path fill="#ffffff" ${LINE} d="M0,10 C-14,0 -16,-10 -9,-14 C-4,-17 0,-13 0,-9 C0,-13 4,-17 9,-14 C16,-10 14,0 0,10 Z"/></g>`;
      case "sparkles": {
        const tw = (o) => 0.75 + 0.35 * Math.sin((p.fx + o) * Math.PI * 2);
        return star(x - 8, y + 6, 9 * tw(0)) + star(x + 14, y - 10, 6 * tw(0.33)) + star(x + 18, y + 22, 5 * tw(0.66));
      }
      case "music":
        return `<g transform="translate(${x} ${y + bob}) rotate(${10 * Math.sin(p.fx * Math.PI * 2)})">
          <path fill="none" ${LINE} d="M2,8 L2,-14 L12,-11"/><ellipse fill="${C.line}" cx="-1" cy="9" rx="4.5" ry="3.5"/></g>`;
      case "stars": {
        const cx = 150 + p.headX, cy = 66 + p.headY;
        return [0, 1, 2].map((i) => {
          const a = (p.fx + i / 3) * Math.PI * 2;
          return star(cx + 46 * Math.cos(a), cy + 10 * Math.sin(a), 6.5);
        }).join("");
      }
    }
    return "";
  }


  const AHOGE = (p) => {
    const a = AHOGE_PATHS[design.ahoge];
    if (!a) return "";
    const body = a.stroke
      ? `<path fill="none" stroke="${PALETTE.line}" stroke-width="2.8" stroke-linecap="round" d="${a.d}"/>`
      : fillLine(PALETTE.hair, a.d);
    return `<g id="ahoge" transform="rotate(${p.ahoge} 150 76)">${body}</g>`;
  };
  const acc = (where, view) => (design.accessory && design.accessory[where] ? design.accessory[where](PALETTE, LINE, view) : "");
  const F = design.face || {};
  // ciri wajah generik yang mengikuti tata letak tiap tampak
  function faceFeatures(L, view, p) {
    const C = PALETTE;
    let out = "";
    if (F.mustache && L.mouth) {
      const m = L.mouth, sc = m.s, cx = m.x + (view === "side" ? 4 : 0);
      out += `<g transform="translate(${cx} ${m.y - 11}) scale(${sc * 0.92})">
        <path fill="${F.mustacheColor || "#2c2c2c"}" stroke="${C.line}" stroke-width="${2.6 / sc}" stroke-linejoin="round"
          d="${view === "side" ? "M-22,-4 C-16,-14 -2,-14 6,-8 C14,-12 22,-10 26,-2 C18,2 10,0 4,-3 C-6,2 -16,2 -22,-4 Z"
            : "M-28,-2 C-22,-14 -8,-15 0,-9 C8,-15 22,-14 28,-2 C22,4 10,2 0,-4 C-10,2 -22,4 -28,-2 Z"}"/>
        <path fill="none" stroke="#555" stroke-width="${1.6 / sc}" stroke-linecap="round" d="M-16,-8 l-3,4 M-8,-9 l-2,4 M8,-9 l2,4 M16,-8 l3,4"/></g>`;
    }
    if (F.glasses && L.eyes.length) {
      const rim = (e) => `<ellipse fill="#ffffff" fill-opacity="0.12" stroke="${C.line}" stroke-width="3.2" cx="${e.cx}" cy="${e.cy}" rx="${e.rx + 5}" ry="${e.ry + 7}"/>`;
      out += L.eyes.map(rim).join("");
      if (L.eyes.length === 2) {
        const [a, b] = L.eyes;
        out += `<path fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round" d="M${a.cx + a.rx + 5},${a.cy - 2} Q${(a.cx + b.cx) / 2 + (a.cx + a.rx + b.cx - b.rx) / 2 - (a.cx + b.cx) / 2},${a.cy - 8} ${b.cx - b.rx - 5},${b.cy - 2}"/>`;
        if (view === "front") out += `<path fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round" d="M${a.cx - a.rx - 5},${a.cy - 4} L86,${a.cy - 6} M${b.cx + b.rx + 5},${b.cy - 4} L214,${b.cy - 6}"/>`;
        if (view === "three") out += `<path fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round" d="M${b.cx + b.rx + 5},${b.cy - 4} L204,${b.cy - 8}"/>`;
      } else {
        const e = L.eyes[0];
        out += `<path fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round" d="M${e.cx - e.rx - 5},${e.cy - 4} L148,${e.cy + 4}"/>`;
      }
    }
    return out;
  }
  const headSkinExtras = (view) => {
    const C = PALETTE;
    let out = "";
    if (F.baldShine) out += `<path fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.9" d="${view === "side" ? "M150,90 C166,86 184,92 194,104" : "M114,104 C124,92 140,86 156,86"}"/>`;
    if (F.doubleChin && view !== "back") out += `<path fill="none" stroke="${C.line}" stroke-width="2.2" stroke-linecap="round" d="${view === "side" ? "M150,201 C160,205 172,203 182,196" : "M128,196 C140,203 160,203 172,196"}"/>`;
    return out;
  };
  const ARM_DX = (design.build && design.build.armDX) || 0; // lengan bergeser keluar (badan lebar)
  const ARM_REST = (design.build && design.build.armRest) || 0; // lengan membuka (deg) saat istirahat, mis. perut buncit
  const earSvg = (x, y, mirror = false) => {
    const s = mirror ? -1 : 1;
    return `<circle fill="${PALETTE.skin}" ${LINE} cx="${x}" cy="${y}" r="9"/>
      <path fill="none" stroke="${PALETTE.line}" stroke-width="2" stroke-linecap="round" d="M${x - s},${y - 4} Q${x + 3 * s},${y} ${x - s},${y + 4}"/>`;
  };

  // ---------- bawahan & sepatu (tampak depan / 3-4 / belakang) ----------
  const B = design.bottom, SLIM = B !== "pants";
  const sockTop = design.legwear === "kneeSocks" ? 322 : design.legwear === "socks" ? 346 : null;
  function socks(clipId) {
    if (!sockTop) return "";
    const C = PALETTE;
    return `${shade(clipId, C.sock, `M90,${sockTop} L210,${sockTop} L210,390 L90,390 Z`)}
      <path clip-path="url(#${ID}-${clipId})" fill="none" stroke="${C.line}" stroke-width="5" d="M90,${sockTop} L210,${sockTop}"/>
      ${shade(clipId, C.sockShade, `M90,${sockTop + 2} L210,${sockTop + 2} L210,${sockTop + 7} L90,${sockTop + 7} Z`)}`;
  }
  function shoeSvg(shapeKey, isBack, isSide) {
    const C = PALETTE;
    if (design.shoes === "sandal") {
      const sole = isSide ? "sandalSoleSide" : "sandalSole", foot = isSide ? "sandalFootSide" : "sandalFoot";
      return `${fillLine(C.shoe, SHAPE[sole])}
        <path fill="${C.skin}" d="${SHAPE[foot]}"/>${shade(foot, C.skinShade, isSide ? "M120,372 L200,372 L200,380 L120,380 Z" : "M100,368 L160,368 L160,380 L100,380 Z")}${outline(SHAPE[foot])}
        ${isBack ? "" : `<path fill="none" stroke="${C.shoe}" stroke-width="3.4" stroke-linecap="round" d="${isSide ? "M150,366 L160,376 M150,366 L170,374" : "M121,364 L129,372 L137,364"}"/>`}`;
    }
    const strap = design.shoes === "dark"
      ? (isSide ? outline("M146,364 C150,370 158,371 164,366") : outline("M118,365 C125,369 133,369 140,365"))
        + (isSide ? "" : `<ellipse fill="#ffffff" opacity="0.35" cx="122" cy="368" rx="4" ry="2"/>`)
      : "";
    return `<path fill="${C.shoe}" d="${SHAPE[shapeKey]}"/>
      ${isBack ? shade(shapeKey, C.shoeShade, "M100,360 L160,360 L160,371 C140,368 120,368 100,371 Z") : ""}
      ${shade(shapeKey, C.shoeShade, isSide ? "M120,375 L200,375 L200,390 L120,390 Z" : "M100,375 C115,378 145,378 160,375 L160,390 L100,390 Z")}
      ${outline(SHAPE[shapeKey])}${strap}`;
  }

  // sarung kotak-kotak (pola diklip ke bentuk)
  function sarongSvg(key, isSide, isBack = false) {
    const C = PALETTE;
    const xs = [], ys = [];
    for (let x = 80; x <= 220; x += 15) xs.push(`M${x},270 L${x + 4},380`);
    for (let y = 290; y <= 370; y += 16) ys.push(`M80,${y} L220,${y + 2}`);
    return `<path fill="${C.pants}" d="${SHAPE[key]}"/>
      <g clip-path="url(#${ID}-${key})">
        <path fill="none" stroke="${C.pantsShade}" stroke-width="5" d="${xs.join(" ")}"/>
        <path fill="none" stroke="${C.pantsShade}" stroke-width="4" d="${ys.join(" ")}"/>
        <path fill="none" stroke="${C.accent}" stroke-width="1.4" opacity="0.55" d="${xs.join(" ")} ${ys.join(" ")}"/>
        <path fill="${C.pantsShade}" opacity="0.7" d="M80,270 L220,270 L220,292 C180,300 120,300 80,292 Z"/>
      </g>
      ${outline(SHAPE[key])}
      ${strokeLines(isSide ? "M118,290 C140,296 166,296 188,290" : "M102,290 C130,298 170,298 198,290", C.line, 2.2)}
      ${isSide || isBack ? "" : outline("M150,292 L142,334 M150,292 L160,330", 'stroke-width="2.2"')}`;
  }
  // motif bunga daster (diklip ke bentuk)
  function dasterPattern(key) {
    const C = PALETTE;
    let dots = "";
    let row = 0;
    for (let y = 222; y <= 352; y += 22, row++) {
      for (let x = 86 + (row % 2) * 13; x <= 214; x += 26) {
        dots += `<circle cx="${x}" cy="${y}" r="4.2"/><circle cx="${x}" cy="${y}" r="1.6" fill="${C.shirtDeep}"/>`;
      }
    }
    return `<g clip-path="url(#${ID}-${key})" fill="${C.accent}" stroke="${C.shirtDeep}" stroke-width="1.2">${dots}</g>`;
  }

  // ---------- barang di tangan (koordinat lokal tangan; gambar tetap tegak) ----------
  function handProp(kind, hx, hy, upright, tilt) {
    if (!kind) return "";
    const C = PALETTE;
    const lift = Math.min(14, Math.abs(tilt) * 0.4); // gelas terangkat sedikit saat dimiringkan ke mulut
    const rot = `rotate(${(upright + tilt).toFixed(1)} ${hx} ${hy}) translate(0 ${-lift})`;
    if (kind === "coffee") return `<g transform="${rot}">
        <path fill="#f4f4f4" ${LINE} stroke-width="2.4" d="M${hx - 10},${hy - 22} L${hx + 10},${hy - 22} L${hx + 8},${hy + 6} L${hx - 8},${hy + 6} Z"/>
        <path fill="#4a4a4a" d="M${hx - 9},${hy - 14} L${hx + 9},${hy - 14} L${hx + 7.6},${hy + 4.5} L${hx - 7.6},${hy + 4.5} Z"/>
        <path fill="none" stroke="#bdbdbd" stroke-width="2" stroke-linecap="round" d="M${hx - 3},${hy - 28} q3,-5 0,-10 M${hx + 4},${hy - 27} q3,-4 0,-8"/>
        <ellipse fill="${C.skin}" ${LINE} stroke-width="2.4" cx="${hx - 9}" cy="${hy - 4}" rx="5.5" ry="7"/></g>`;
    if (kind === "broom") { // sapu lidi: gagang miring ke depan-bawah, ikatan lidi mengembang menyentuh tanah
      const bx = hx + 64, by = hy + 60;
      return `<g transform="rotate(${(upright + tilt).toFixed(1)} ${hx} ${hy})">
        <path fill="none" stroke="${C.line}" stroke-width="7" stroke-linecap="round" d="M${hx - 14},${hy - 26} L${bx - 2},${by}"/>
        <path fill="none" stroke="#9a9a9a" stroke-width="3.6" stroke-linecap="round" d="M${hx - 14},${hy - 26} L${bx - 2},${by}"/>
        <path fill="#d0d0d0" ${LINE} stroke-width="2" stroke-linejoin="round" d="M${bx - 6},${by - 3} L${bx + 26},${by + 20} L${bx - 16},${by + 22} L${bx + 1},${by - 5} Z"/>
        <path fill="none" stroke="#8a8a8a" stroke-width="1.3" d="M${bx - 2},${by} L${bx + 16},${by + 20} M${bx - 2},${by} L${bx + 5},${by + 21} M${bx - 2},${by} L${bx - 7},${by + 21}"/>
        <path fill="none" stroke="${C.line}" stroke-width="2.6" d="M${bx - 7},${by + 1} L${bx + 4},${by + 1}"/>
        <ellipse fill="${C.skin}" ${LINE} stroke-width="2.4" cx="${hx}" cy="${hy - 4}" rx="6" ry="7.5"/></g>`;
    }
    if (kind === "phone") return `<g transform="${rot}">
        <rect fill="#3a3a3a" ${LINE} stroke-width="2.4" x="${hx - 8}" y="${hy - 26}" width="16" height="28" rx="3"/>
        <rect fill="#d9d9d9" x="${hx - 5.5}" y="${hy - 23}" width="11" height="20" rx="1.5"/>
        <ellipse fill="${C.skin}" ${LINE} stroke-width="2.4" cx="${hx - 8}" cy="${hy - 6}" rx="5" ry="6.5"/></g>`;
    return "";
  }
  // koran dipegang dua tangan di depan dada
  function newspaper(view, p) {
    const C = PALETTE;
    const three = view === "three", y = 214 + p.paperY;
    const x0 = three ? 96 : 100, x1 = three ? 180 : 200, h = 78;
    const lines = [];
    for (let k = 0; k < 6; k++) lines.push(`M${x0 + 8},${y + 30 + k * 7} L${(x0 + x1) / 2 - 5},${y + 30 + k * 7} M${(x0 + x1) / 2 + 5},${y + 30 + k * 7} L${x1 - 8},${y + 30 + k * 7}`);
    return `<g id="koran">
      <path fill="#f6f6f6" ${LINE} d="M${x0},${y} L${x1},${y - 3} L${x1 + 2},${y + h} L${x0 - 2},${y + h + 3} Z"/>
      <path fill="none" stroke="#bdbdbd" stroke-width="2" d="M${(x0 + x1) / 2},${y - 1} L${(x0 + x1) / 2},${y + h + 1}"/>
      <rect fill="#3c3c3c" x="${x0 + 8}" y="${y + 7}" width="${(x1 - x0) * 0.5}" height="9"/>
      <rect fill="#9a9a9a" x="${x1 - (x1 - x0) * 0.38}" y="${y + 7}" width="${(x1 - x0) * 0.3}" height="16"/>
      <path fill="none" stroke="#9a9a9a" stroke-width="2" stroke-linecap="round" d="${lines.join(" ")}"/>
      <ellipse fill="${C.skin}" ${LINE} stroke-width="2.4" cx="${x0 + 2}" cy="${y + 30}" rx="7" ry="8.5"/>
      <ellipse fill="${C.skin}" ${LINE} stroke-width="2.4" cx="${x1 - 2}" cy="${y + 28}" rx="7" ry="8.5"/></g>`;
  }

  // ================= TAMPAK DEPAN / 3-4 / BELAKANG =================
  function frontish(p, view) {
    const C = PALETTE;
    const L = LAYOUT[view];
    const isBack = view === "back", isThree = view === "three";
    const headPivot = "150 200";
    const breatheScale = 1 + 0.015 * p.breathe;
    const headT = `translate(${p.headX} ${p.headY}) rotate(${p.headTilt} ${headPivot})`;
    const hx = isThree ? -4 : 0;

    const hairBackG = (front) => {
      const key = front && SHAPE.hairBackView ? "hairBackView" : "hairBack";
      const d = SHAPE[key];
      const shades = H.long
        ? shade(key, C.hairShade, "M60,180 C80,200 84,240 92,290 L60,290 Z M240,180 C220,200 216,240 208,290 L240,290 Z")
          + (front ? shade(key, C.hairShade, "M60,236 C110,250 190,250 240,236 L240,290 L60,290 Z", 'opacity="0.6"') : "")
        : front ? shade(key, C.hairShade, "M60,188 C110,200 190,200 240,188 L240,230 L60,230 Z", 'opacity="0.6"') : "";
      return `
      <g id="hair-back" transform="${headT} translate(${hx} 0)">
      <g transform="translate(0 142) skewX(${p.hairSway}) translate(0 -142)">
        <path fill="${front ? C.hair : C.hairBack}" d="${d}"/>
        ${shades}
        ${front ? `<path clip-path="url(#${ID}-${key})" fill="none" stroke="${C.hairShine}" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 9" d="${H.shineBack || "M96,104 C118,84 182,84 204,104"}"/>` : ""}
        ${outline(d)}
        ${strokeLines(front ? H.backViewStrands : H.backStrands, C.hairShade, front ? 2.2 : 2, key)}
      </g></g>`;
    };

    // duduk: badan naik/turun ke tinggi kursi, kaki memendek (paha mengarah ke kamera), telapak menggantung
    const SIT = p.sit, seatU = (p.seat * 270) / SCALE;
    const sitDy = SIT * (382 - seatU - 282);
    const kS = 1 - 0.45 * SIT;
    const leg = (side, lift) => {
      const l = side === "l";
      const k = (1 - Math.max(0, lift) / 95) * kS;
      const skinKey = l ? "legLs" : "legRs";
      const gKey = B === "pants" ? (l ? "legL" : "legR") : B === "shorts" ? (l ? "shortsL" : "shortsR") : null;
      const skinLeg = SLIM ? `
          <path fill="${C.skin}" d="${SHAPE[skinKey]}"/>
          ${shade(skinKey, C.skinShade, l ? "M138,282 L150,282 L150,372 L137,372 Z" : "M150,282 L162,282 L163,372 L150,372 Z")}
          ${socks(skinKey)}
          ${outline(SHAPE[skinKey])}` : "";
      const garment = gKey ? `
          <path fill="${C.pants}" d="${SHAPE[gKey]}"/>
          ${shade(gKey, C.pantsShade, "M100,274 L200,274 L200,294 C170,300 130,300 100,294 Z")}
          ${shade(gKey, C.pantsShade, l ? "M139,300 L152,300 L152,372 L137,372 Z" : "M148,300 L161,300 L163,372 L148,372 Z")}
          ${B === "pants" ? socks(gKey) : ""}
          ${outline(SHAPE[gKey])}` : "";
      const shoeDy = -Math.max(0, lift) * kS - (1 - kS) * 88;
      return `<g id="leg-${side}">
        <g transform="translate(0 282) scale(1 ${k}) translate(0 -282)">${skinLeg}${garment}</g>
        <g transform="translate(${l ? 0 : 42} ${shoeDy.toFixed(2)})">${shoeSvg("shoe", isBack, false)}</g></g>`;
    };
    // pangkuan (paha yang mengarah ke kamera) saat duduk
    const lapCol = B === "pants" || B === "shorts" ? C.pants : C.skin;
    const lap = SIT > 0.35 && !isBack && B !== "sarong" && design.top !== "daster"
      ? `<path fill="${lapCol}" ${LINE} opacity="${clamp01((SIT - 0.35) / 0.4).toFixed(2)}" d="M112,281 L188,281 C191,292 189,302 182,306 L154,306 L150,300 L146,306 L118,306 C111,302 109,292 112,281 Z"/>` : "";
    const legs = `<g id="legs" transform="${isThree ? "translate(-3 0)" : ""} translate(0 ${sitDy.toFixed(2)})">
      ${p.legL > p.legR ? leg("r", p.legR) + leg("l", p.legL) : leg("l", p.legL) + leg("r", p.legR)}${lap}</g>`;

    // ---------- lengan ----------
    const LONG = design.sleeves === "long", NOSLEEVE = design.sleeves === "none";
    const SHOULDER = "118 208";     // pivot lengan baju
    const ARM_ROOT = "106 236";     // pivot lengan di dalam lengan baju pendek
    const SLEEVE_K = LONG || NOSLEEVE ? 1 : 0.6; // lengan baju pendek ikut 60% -> tidak "mengepak"
    const armLayer = (side, deg0, part) => {
      const deg = deg0 + ARM_REST;
      const elbow = side === -1 ? p.elbowL : p.elbowR;
      const holdK = side === -1 ? p.holdL : p.holdR;
      const EL = LONG ? [104, 268] : [106, 272];
      const cU = LONG ? "armUL" : "armU", cD = LONG ? "armDL" : "armD";
      const forearmT = `rotate(${(-elbow).toFixed(1)} ${EL[0]} ${EL[1]})`;
      const hand = LONG ? [103, 297] : [105, 300];
      const prop = (rotTotal) => (p.hold === "newspaper" ? "" : handProp(holdK, hand[0], hand[1], -rotTotal, side === -1 ? -p.holdTilt : -p.holdTilt));
      const mirror = side === 1 ? MIRROR : "";
      const far = isThree && side === -1;
      const shift = `translate(${(far ? 7 : 0) - ARM_DX} 0)`;
      const id = `${part}-${side === -1 ? "l" : "r"}`;
      const seamOp = isBack ? 1 : clamp01((Math.abs(deg) - 25) / 30);
      let shape;
      if (NOSLEEVE) {
        // tanpa lengan baju: lengan utuh di BELAKANG badan (bahu milik badan) -> tidak ada garis melintang di dada
        const full = `<path fill="${far ? C.skinFar : C.skin}" d="${SHAPE.armFull}"/>
           ${shade("armFull", C.skinShade, "M108,226 L122,226 L122,310 L109,310 C111,290 110,256 108,226 Z")}
           ${outline(SHAPE.armFull)}`;
        shape = part === "arm"
          ? `<circle fill="${far ? C.skinFar : C.skin}" ${LINE} cx="${EL[0]}" cy="${EL[1]}" r="9"/><g clip-path="url(#${ID}-${cU})">${full}</g>`
          : `<g transform="${forearmT}"><g clip-path="url(#${ID}-${cD})">${full}</g>${prop(deg - elbow)}</g>`;
      } else if (part === "arm") {
        shape = LONG
          ? ""
          : `<circle fill="${far ? C.skinFar : C.skin}" ${LINE} cx="${EL[0]}" cy="${EL[1]}" r="8.6"/>
             <g clip-path="url(#${ID}-${cU})">${skinArm(far)}</g>`;
      } else if (LONG) {
        const sleeveAll = `<path fill="${C.shirt}" d="${SHAPE.longSleeve}"/>
           ${shade("longSleeve", C.shirtShade, "M108,230 L122,230 L122,300 L109,300 C111,280 110,250 108,230 Z")}
           ${outline("M114,205.5 C110,206.4 106,207.8 102,210", `opacity="${clamp01(1 - (Math.abs(deg) - 8) / 22).toFixed(2)}"`)}
           ${outline("M102,210 C99,213 96,220 93,232 C91,252 90,272 91,291 C98,295 108,295 115,291")}
           ${outline("M115,291 C115,276 116,262 117,248")}
           ${outline("M92,284 C99,287 108,287 115,284", 'stroke-width="2.2"')}
           ${seamOp > 0 ? outline("M117,248 C118,232 121,216 128,206", `opacity="${seamOp.toFixed(2)}"`) : ""}`;
        shape = `<circle fill="${C.shirt}" ${LINE} cx="${EL[0]}" cy="${EL[1]}" r="11"/>
           <g clip-path="url(#${ID}-${cU})">${sleeveAll}</g>
           <g transform="${forearmT}">
             <circle fill="${far ? C.skinFar : C.skin}" ${LINE} cx="103" cy="297" r="8.5"/>
             <g clip-path="url(#${ID}-${cD})">${sleeveAll}</g>${prop(deg - elbow)}</g>`;
      } else {
        shape = `<path fill="${C.shirt}" d="${SHAPE.sleeve}"/>
           ${shade("sleeve", C.shirtShade, "M121,222 C117,236 108,246 86,247 L86,262 L124,262 Z")}
           ${outline("M114,205.5 C110,206.4 106,207.8 102,210", `opacity="${clamp01(1 - (Math.abs(deg) - 8) / 22).toFixed(2)}"`)}
           ${outline("M102,210 C99,213 97,218 95,224 C91,233 89,242 88,250 C96,255 105,257 114,256")}
           ${outline("M115,256 C115.6,248 116.2,241 117,235")}
           ${seamOp > 0 ? outline("M117,235 C118,225 121,214 128,206", `opacity="${seamOp.toFixed(2)}"`) : ""}`;
      }
      const rs = deg * SLEEVE_K;
      let inner;
      if (!LONG && !NOSLEEVE) {
        // lengan pendek: kulit lengan atas di belakang badan; lengan baju + lengan bawah (siku) di depan badan
        const armT = `rotate(${rs} ${SHOULDER}) rotate(${deg - rs} ${ARM_ROOT})`;
        inner = part === "arm"
          ? `<g transform="${armT}">${shape}</g>`
          : `<g transform="${armT} ${forearmT}"><g clip-path="url(#${ID}-${cD})">${skinArm(far)}</g>${prop(deg - elbow)}</g>
             <g transform="rotate(${rs} ${SHOULDER})">${shape}</g>`;
      } else {
        inner = `<g transform="rotate(${deg} ${SHOULDER})">${shape}</g>`;
      }
      return `<g id="${id}" transform="${mirror} ${shift}">${inner}</g>`;
    };

    function skinArm(far) {
      return `<path fill="${far ? C.skinFar : C.skin}" d="${SHAPE.arm}"/>
        ${shade("arm", C.skinShade, "M90,236 L120,236 L120,266 C110,262 100,262 90,264 Z M108,236 L120,236 L120,310 L109,310 C111,290 110,262 108,236 Z")}
        ${outline(SHAPE.arm)}`;
    }

    // ---------- badan ----------
    const top = design.top;
    const tKey = top + (isBack ? "Back" : "");
    const torsoD = SHAPE[tKey];
    const sarong = B === "sarong" ? sarongSvg("sarong", false, isBack) : "";
    const bodySkin = design.top === "singlet" ? `<path fill="${C.skin}" d="${SHAPE[isBack ? "bellyBodyBack" : "bellyBody"]}"/>
        ${shade(isBack ? "bellyBodyBack" : "bellyBody", C.skinShade, "M80,236 C100,250 104,270 104,300 L80,300 Z M220,236 C200,250 196,270 196,300 L220,300 Z")}
        ${outline(SHAPE[isBack ? "bellyBodyBack" : "bellyBody"])}` : "";
    const skirt = B === "skirt" ? `
        <path fill="${C.pants}" d="${SHAPE.skirt}"/>
        ${shade("skirt", C.pantsShade, "M90,300 C130,312 170,312 210,300 L210,330 L90,330 Z M126,262 L116,330 L104,330 L104,262 Z")}
        ${strokeLines("M127,264 L120,322 M142,262 L139,325 M158,262 L161,325 M173,264 L180,322", C.line, 2)}
        ${outline(SHAPE.skirt)}` : "";
    let topExtra = "";
    if (top === "tee") topExtra = strokeLines("M140,274 C145,279 151,281 157,280", C.shirtShade, 2.2);
    if (top === "singlet") topExtra = `${shade(tKey, C.shirtShade, "M84,270 C120,292 180,292 216,270 L216,306 L84,306 Z", 'opacity="0.8"')}
        ${isBack ? "" : strokeLines("M150,266 C147,270 147,274 150,276", C.line, 2.2)}
        ${isBack ? "" : `<path fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.8" d="M178,246 C188,254 194,264 196,274"/>`}
        ${strokeLines("M122,236 C120,250 122,262 126,272 M178,236 C180,250 178,262 174,272", C.shirtShade, 2)}`;
    if (top === "daster") topExtra = `${dasterPattern(tKey)}
        ${strokeLines("M84,344 C120,354 180,354 216,344", C.line, 2)}
        ${strokeLines("M84,348 l6,6 M100,351 l5,6 M116,353 l4,6 M132,354 l3,6 M148,355 l2,6 M164,354 l-2,6 M180,353 l-3,6 M196,351 l-4,6 M212,348 l-5,6", C.shirtDeep, 1.6)}`;
    if (top === "hoodie") {
      topExtra = isBack
        ? `${fillLine(C.shirtShade, "M122,206 C120,232 134,248 150,248 C166,248 180,232 178,206 C168,200 132,200 122,206 Z")}
           ${strokeLines("M134,214 C138,232 162,232 166,214", C.shirtDeep, 2)}
           ${strokeLines("M107,284 C134,291 166,291 193,284", C.line, 2)}`
        : `${fillLine(C.shirtShade, "M120,207 C126,194 174,194 180,207 C170,201 130,201 120,207 Z")}
           ${shade("hoodie", C.shirtShade, "M122,262 L178,262 L184,290 C160,296 140,296 116,290 Z")}
           ${outline("M126,262 L174,262 L180,286 C160,291 140,291 120,286 Z")}
           ${strokeLines("M107,284 C134,291 166,291 193,284", C.line, 2)}
           ${strokeLines("M143,208 L141,234 M157,208 L159,234", C.line, 2.2)}
           <circle fill="${C.accent}" ${LINE} stroke-width="1.8" cx="141" cy="236" r="2.6"/>
           <circle fill="${C.accent}" ${LINE} stroke-width="1.8" cx="159" cy="236" r="2.6"/>`;
    }
    if (top === "sweater") {
      topExtra = `${strokeLines("M111,264 C134,271 166,271 189,264", C.line, 2)}
        ${strokeLines("M116,268 L116,274 M126,269 L126,276 M136,270 L136,277 M146,270 L146,278 M156,270 L156,278 M166,270 L166,277 M176,269 L176,276 M186,267 L186,272", C.shirtDeep, 1.6)}
        ${isBack ? "" : `${fillLine(C.accent, "M150,207 C144,216 130,218 124,208 C128,202 135,200 139,200 Q145,206 150,207 Z")}
        ${fillLine(C.accent, "M150,207 C156,216 170,218 176,208 C172,202 165,200 161,200 Q155,206 150,207 Z")}`}`;
    }
    const neck = isBack && H.long ? "" : fillLine(C.skinShade, "M141,186 L159,186 L159,208 L141,208 Z");
    const torsoInner = `
        ${neck}
        ${sarong}
        ${skirt}
        ${bodySkin}
        <path fill="${C.shirt}" d="${torsoD}"/>
        ${isBack ? "" : shade(tKey, C.shirtShade, "M112,196 C130,214 170,214 188,196 L188,190 L112,190 Z")}
        ${shade(tKey, C.shirtShade, "M104,240 C114,250 120,268 119,300 L100,300 Z M196,240 C186,250 180,268 181,300 L200,300 Z")}
        ${isThree ? shade(tKey, C.shirtShade, "M100,200 C118,220 124,260 122,300 L100,300 Z") : ""}
        ${outline(torsoD)}
        ${topExtra}`;
    const torsoSplit = SIT > 0.01
      ? `<g clip-path="url(#${ID}-hipU)">${torsoInner}</g>
         <g transform="translate(0 282) scale(1 ${kS.toFixed(3)}) translate(0 -282)"><g clip-path="url(#${ID}-hipD)">${torsoInner}</g></g>`
      : torsoInner;
    const torso = `
      <g id="torso" transform="translate(150 286) scale(${(isThree ? 0.95 : 1) * breatheScale} ${breatheScale}) translate(-150 -286)">
        ${torsoSplit}
      </g>`;

    let head;
    if (isBack) {
      const ears = (design.ears.back || []).map((s) => (s === "r" ? earSvg(214, 160) : earSvg(86, 160, true))).join("");
      const bald = H.bald ? `<path fill="${C.skin}" d="${SHAPE.face}"/>
        ${shade("face", C.skinShade, "M80,150 C110,176 190,176 220,150 L220,210 L80,210 Z")}${outline(SHAPE.face)}
        <path fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity="0.9" d="M120,100 C134,90 166,90 180,100"/>` : "";
      head = { before: `<g transform="${headT}">${ears}${bald}</g>`,
        after: `<g id="head" transform="${headT}">${acc("back", view)}${angerMark(L, p)}${AHOGE(p)}</g>` };
    } else {
      const ears = design.ears.front || [];
      const earR = ears.includes("r") ? (isThree ? earSvg(205, 162) : earSvg(214, 162)) : "";
      const earL = ears.includes("l") && !isThree ? earSvg(86, 162, true) : "";
      head = `
      <g id="head" transform="${headT}">
        ${isThree ? "" : earR}${earL}
        <path fill="${C.skin}" d="${SHAPE.face}"/>
        <path clip-path="url(#${ID}-face)" fill="${C.skinShade}" fill-rule="evenodd" transform="translate(${2 + hx} 7)" d="${SHAPE.hairFront}"/>
        ${isThree ? shade("face", C.skinShade, "M196,90 C214,120 216,170 196,206 L230,206 L230,90 Z") : ""}
        ${outline(SHAPE.face)}
        ${headSkinExtras(view)}
        ${isThree ? earR : ""}
        ${faceExtras(L, p, "face")}
        ${L.eyes.map((e) => eye(e, p)).join("")}
        ${mouth(L.mouth, p)}
        ${faceFeatures(L, view, p)}
        <g transform="translate(${hx} 0)">
          <path fill="${C.hair}" fill-rule="evenodd" d="${SHAPE.hairFront}"/>
          <g clip-path="url(#${ID}-hairFront)">
            <path fill="none" stroke="${C.hairShine}" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 9" d="${H.shineFront || "M98,108 C118,88 182,88 202,108"}"/>
            <path fill="${C.hairShade}" d="${H.frontShade || "M70,150 C84,150 92,170 96,210 L70,210 Z"}"/>
          </g>
          ${outline(SHAPE.hairFront)}
          ${strokeLines(H.frontStrands, C.hairShade, 2, "hairFront")}
          ${acc("front", view)}
        </g>
        ${angerMark(L, p)}
        ${AHOGE(p)}
      </g>`;
    }

    const up = (svg) => `<g transform="translate(0 ${sitDy.toFixed(2)})">${svg}</g>`;
    const paper = p.hold === "newspaper" && !isBack ? newspaper(view, p) : "";
    if (isBack) {
      return `${legs}${up(`${armLayer(-1, p.armL, "arm")}${armLayer(1, p.armR, "arm")}${torso}
        ${armLayer(-1, p.armL, "sleeve")}${armLayer(1, p.armR, "sleeve")}${head.before}${hairBackG(true)}${head.after}`)}`;
    }
    return `${up(hairBackG(false))}${legs}
      ${up(`${armLayer(-1, p.armL, "arm")}${armLayer(1, p.armR, "arm")}${torso}
      ${armLayer(-1, p.armL, "sleeve")}${armLayer(1, p.armR, "sleeve")}${head}${paper}`)}`;
  }

  // ================= TAMPAK SAMPING (digambar menghadap kanan, lalu dicerminkan) =================
  function side(p) {
    const C = PALETTE;
    const L = LAYOUT.side;
    const headPivot = "150 200";
    const headT = `translate(${p.headX} ${p.headY}) rotate(${p.headTilt} ${headPivot})`;
    const breatheScale = 1 + 0.015 * p.breathe;
    const LONG = design.sleeves === "long", NOSLEEVE = design.sleeves === "none";

    const hairBackG = `
      <g id="hair-back" transform="${headT}">
      <g transform="translate(0 142) skewX(${p.hairSway}) translate(0 -142)">
        <path fill="${C.hairBack}" d="${SHAPE.hairBackSide}"/>
        ${H.long ? shade("hairBackSide", C.hairShade, "M80,200 C96,220 100,250 104,290 L80,290 Z") : ""}
        ${outline(SHAPE.hairBackSide)}
        ${strokeLines(H.sideBackStrands, C.hairShade, 2, "hairBackSide")}
      </g></g>`;

    const SIT = p.sit, seatU = (p.seat * 270) / SCALE;
    const sitDy = SIT * (382 - seatU - 282);
    const leg = (deg, far) => {
      const skin = SLIM ? `
        <path fill="${far ? C.skinFar : C.skin}" d="${SHAPE.legSideS}"/>
        ${shade("legSideS", C.skinShade, "M130,282 L146,282 L146,372 L130,372 Z")}
        ${socks("legSideS")}
        ${outline(SHAPE.legSideS)}` : "";
      const gKey = B === "pants" ? "legSide" : B === "shorts" ? "shortsSide" : null;
      const garment = gKey ? `
        <path fill="${far ? C.pantsShade : C.pants}" d="${SHAPE[gKey]}"/>
        ${far ? "" : shade(gKey, C.pantsShade, "M130,274 L172,274 L172,294 L130,294 Z")}
        ${B === "pants" ? socks(gKey) : ""}
        ${outline(SHAPE[gKey])}` : "";
      const content = `${skin}${garment}${shoeSvg("shoeSide", false, true)}`;
      if (SIT < 0.01) return `<g transform="rotate(${deg} 150 284)">${content}</g>`;
      // duduk: paha mendatar ke depan, betis menggantung dari lutut
      const kneeCol = B === "pants" || B === "shorts" ? (far ? C.pantsShade : C.pants) : far ? C.skinFar : C.skin;
      return `<g transform="translate(0 ${sitDy.toFixed(2)}) rotate(${(deg - 90 * SIT).toFixed(1)} 150 284)">
        <circle fill="${kneeCol}" ${LINE} cx="150" cy="326" r="${B === "pants" ? 14 : 10}"/>
        <g clip-path="url(#${ID}-kneeU)">${content}</g>
        <g transform="rotate(${(90 * SIT).toFixed(1)} 150 326)"><g clip-path="url(#${ID}-kneeD)">${content}</g></g></g>`;
    };

    const arm = (deg, far, elbow = 0, holdK = null) => {
      const body = NOSLEEVE
        ? `<path fill="${far ? C.skinFar : C.skin}" d="${SHAPE.armSideFull}"/>
           ${shade("armSideFull", C.skinShade, "M136,226 L164,226 L164,250 C154,246 146,246 136,248 Z", 'opacity="0.6"')}
           ${outline(SHAPE.armSideFull)}`
        : LONG
        ? `<circle fill="${far ? C.skinFar : C.skin}" ${LINE} cx="151" cy="298" r="8.5"/>
           <path fill="${far ? C.shirtShade : C.shirt}" d="${SHAPE.longSleeveSide}"/>
           ${far ? "" : shade("longSleeveSide", C.shirtShade, "M128,236 C140,246 160,246 172,236 L172,300 L128,300 Z", 'opacity="0.55"')}
           ${outline(SHAPE.longSleeveSide)}
           ${outline("M138,285 C145,288 156,288 163,285", 'stroke-width="2.2"')}`
        : `<path fill="${far ? C.skinFar : C.skin}" d="${SHAPE.armSide}"/>
           ${shade("armSide", C.skinShade, "M136,234 L164,234 L164,262 C154,258 146,258 136,260 Z")}
           ${outline(SHAPE.armSide)}
           <path fill="${far ? C.shirtShade : C.shirt}" d="${SHAPE.sleeveSide}"/>
           ${far ? "" : shade("sleeveSide", C.shirtShade, "M128,240 C140,248 160,248 172,240 L172,262 L128,262 Z")}
           ${outline(SHAPE.sleeveSide)}`;
      const pos = `translate(${far ? 5 + ARM_DX * 0.3 : -ARM_DX * 0.3} 0) rotate(${-deg} 150 212)`;
      if (Math.abs(elbow) < 0.5 && !holdK) return `<g transform="${pos}">${body}</g>`;
      // siku: lengan bawah berputar ke depan di (150,268)
      const E = LONG ? 266 : 270;
      const hand = LONG ? [151, 298] : [150, 300];
      const joint = `<circle fill="${LONG ? (far ? C.shirtShade : C.shirt) : far ? C.skinFar : C.skin}" ${LINE} cx="150" cy="${E}" r="${LONG ? 12 : 9}"/>`;
      return `<g transform="${pos}">${joint}
        <g clip-path="url(#${ID}-${LONG ? "armUL" : "armU"})">${body}</g>
        <g transform="rotate(${-elbow} 150 ${E})"><g clip-path="url(#${ID}-${LONG ? "armDL" : "armD"})">${body}</g>
          ${handProp(holdK, hand[0], hand[1], deg + elbow, -p.holdTilt)}</g></g>`;
    };

    const tKey = design.top + "Side";
    const skirt = B === "skirt" ? `
        <path fill="${C.pants}" d="${SHAPE.skirtSide}"/>
        ${shade("skirtSide", C.pantsShade, "M100,300 C140,312 170,312 200,300 L200,330 L100,330 Z")}
        ${strokeLines("M138,264 L128,320 M156,263 L154,322 M170,263 L178,320", C.line, 2)}
        ${outline(SHAPE.skirtSide)}` : "";
    const sarongS = B === "sarong" ? sarongSvg("sarongSide", true) : "";
    const bodySkinS = design.top === "singlet" ? fillLine(C.skin, SHAPE.bellyBodySide) : "";
    const extraS = design.top === "daster" ? dasterPattern(tKey) + strokeLines("M104,344 C140,354 170,354 200,344", C.line, 2)
      : design.top === "singlet" ? shade(tKey, C.shirtShade, "M110,262 C140,282 180,282 200,262 L200,300 L110,300 Z", 'opacity="0.8"') : "";
    const hood = design.top === "hoodie" ? fillLine(C.shirtShade, "M126,216 C112,208 114,192 130,192 C136,194 140,200 142,206 Z") : "";
    const torso = `
      <g id="torso" transform="translate(150 286) scale(${breatheScale}) translate(-150 -286)">
        ${fillLine(C.skinShade, "M144,186 L160,186 L160,208 L144,208 Z")}
        ${SIT > 0.01 && sarongS ? `<g transform="translate(0 278) scale(1 ${(1 - 0.5 * SIT).toFixed(3)}) translate(0 -278)">${sarongS}</g>` : sarongS}
        ${skirt}
        ${bodySkinS}
        <path fill="${C.shirt}" d="${SHAPE[tKey]}"/>
        ${shade(tKey, C.shirtShade, "M116,200 C134,214 136,250 132,300 L116,300 Z M150,196 C160,210 172,210 180,200 L180,190 L150,190 Z")}
        ${extraS}
        ${outline(SHAPE[tKey])}
        ${design.top === "hoodie" ? strokeLines("M118,284 C140,290 164,290 184,284", C.line, 2) : ""}
        ${design.top === "sweater" ? strokeLines("M120,264 C140,270 164,270 182,264", C.line, 2) : ""}
        ${hood}
      </g>`;

    const head = `
      <g id="head" transform="${headT}">
        <path fill="${C.skin}" d="${SHAPE.face}"/>
        <path clip-path="url(#${ID}-face)" fill="${C.skinShade}" transform="translate(3 7)" d="${SHAPE.hairFrontSide}"/>
        ${outline(SHAPE.face)}
        ${headSkinExtras("side")}
        ${faceExtras(L, p, "face")}
        ${L.eyes.map((e) => eye(e, p)).join("")}
        ${mouth(L.mouth, p)}
        ${faceFeatures(L, "side", p)}
        <path fill="${C.hair}" fill-rule="evenodd" d="${SHAPE.hairFrontSide}"/>
        <g clip-path="url(#${ID}-hairFrontSide)">
          <path fill="none" stroke="${C.hairShine}" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 9" d="${H.shineSide || "M100,110 C118,86 172,84 200,104"}"/>
          <path fill="${C.hairShade}" d="M80,150 C96,160 104,180 110,206 L80,206 Z"/>
        </g>
        ${outline(H.sideClosed ? SHAPE.hairFrontSide : openBack(SHAPE.hairFrontSide))}
        ${strokeLines(H.sideStrands, C.hairShade, 2, "hairFrontSide")}
        ${design.ears.side ? `<circle fill="${C.skin}" ${LINE} cx="142" cy="160" r="10"/>
          <path fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round" d="M144,155 Q139,160 144,165"/>` : ""}
        ${acc("side", "side")}
        ${angerMark(L, p)}
        ${AHOGE(p)}
      </g>`;

    const up = (svg) => `<g transform="translate(0 ${sitDy.toFixed(2)})">${svg}</g>`;
    const paperS = p.hold === "newspaper" ? `<g transform="translate(0 ${p.paperY})">
        <path fill="#f6f6f6" ${LINE} d="M176,206 L206,200 L210,284 L180,290 Z"/>
        <path fill="none" stroke="#9a9a9a" stroke-width="2" d="M184,222 L202,218 M184,232 L203,228 M185,242 L204,238 M185,252 L204,248 M186,262 L205,258"/>
        <ellipse fill="${C.skin}" ${LINE} stroke-width="2.4" cx="180" cy="246" rx="7" ry="8.5"/></g>` : "";
    // lengan jauh (di balik badan) saat berayun ke depan: ayunan dikurangi agar ujung lengan baju tidak
    // menyembul terpisah dari lengannya di depan dada (garis lengan terlihat "patah")
    const farSwing = !p.holdR && Math.abs(p.elbowR) < 25 && p.armR > 0 ? p.armR * 0.35 : p.armR;
    return `${up(arm(farSwing, true, p.elbowR, p.holdR))}${leg(-p.legR, true)}${up(hairBackG)}${leg(-p.legL, false)}${up(torso)}
      ${up(arm(p.armL, false, p.elbowL, p.holdL))}${up(head)}${up(paperS)}`;
  }

  // ================= RAKIT =================
  function resolvePose(pose) {
    const preset = EXPRESSIONS[pose.expr || "neutral"] || {};
    const clean = {};
    for (const k in pose) if (pose[k] !== undefined) clean[k] = pose[k]; // undefined = pakai preset
    return Object.assign({}, DEFAULT_POSE, preset, clean);
  }

  // isi karakter (tanpa <svg>) dalam kanvas 300x400 — dipakai juga untuk adegan multi-karakter
  // ---------- tinggi badan ----------
  // build.scale > 1: karakter diperbesar dari titik pijak (150,382) -> lebih tinggi, kaki tetap di lantai.
  // Kanvas diperluas ke atas (CANVAS.top negatif) agar kepala tidak terpotong. Ketebalan garis dijaga sama
  // dengan karakter lain (stroke-width dibagi SCALE).
  const SCALE = (design.build && design.build.scale) || 1;
  const CANVAS_TOP = SCALE > 1 ? -Math.ceil(((SCALE - 1) * 382 + 10) / 10) * 10 : 0;
  const CANVAS_LEFT = SCALE > 1 ? -Math.ceil(((SCALE - 1) * 160) / 5) * 5 : 0; // ruang tangan terentang
  const CANVAS = { top: CANVAS_TOP, height: 400 - CANVAS_TOP, left: CANVAS_LEFT, width: 300 - 2 * CANVAS_LEFT, scale: SCALE };

  function drawPart(view = "front", pose = {}) {
    const p = resolvePose(pose);
    const v = p.view || view;
    let body;
    if (v === "side") body = `<g transform="${MIRROR}">${side(p)}</g>`;
    else if (v === "front" || v === "three" || v === "back") body = frontish(p, v);
    else throw new Error(`View "${v}" tidak dikenal. Pilihan: front, three, side, back`);

    const top = LAYOUT[v].top;
    let ax = (v === "side" ? 300 - top.x : top.x) + (v === "side" ? -p.headX : p.headX);
    const ay = top.y + p.headY;
    if (p.flip) ax = 300 - ax;

    const sq = p.squash;
    const dir = p.flip ? -1 : 1;
    const rootT = `translate(${dir * p.bodyX} ${p.bodyY}) rotate(${dir * p.lean} 150 380)
      translate(150 380) scale(${(1 + 0.12 * sq) * p.scaleX} ${1 - 0.12 * sq}) translate(-150 -380)`;
    const lift = Math.max(0, -p.bodyY);
    const ground = `<ellipse fill="${PALETTE.ground}" cx="${150 + dir * p.bodyX}" cy="381" rx="${Math.max(20, 54 - lift * 0.5) * (1 + 0.1 * sq)}" ry="${Math.max(3, 7 - lift * 0.06)}"/>`;
    const inner = `${ground}
      <g transform="${rootT}">
        <g transform="${p.flip ? MIRROR : ""}">${body}</g>
        ${aboveFx(p, { x: ax, y: ay })}
      </g>`;
    if (SCALE === 1) return `${defs()}${inner}`;
    // tebal garis dibagi SCALE -> setelah diperbesar tetap sama dengan karakter lain (juga saat diskalakan di adegan 3D)
    const thin = inner.replace(/stroke-width="([\d.]+)"/g, (m, v) => `stroke-width="${(+v / SCALE).toFixed(2)}"`);
    return `${defs()}<g transform="translate(150 382) scale(${SCALE}) translate(-150 -382)">${thin}</g>`;
  }

  function drawCharacter(view = "front", pose = {}, opts = {}) {
    // opts.top: paksa batas atas kanvas (mis. agar sejajar dengan karakter yang lebih tinggi)
    const top = Math.min(opts.top ?? CANVAS.top, CANVAS.top), ch = 400 - top;
    const left = CANVAS.left, cw = CANVAS.width;
    const w = opts.width || cw, h = opts.height || ch;
    const bg = opts.background ? `<rect x="${left}" y="${top}" width="${cw}" height="${ch}" fill="${opts.background}"/>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${cw} ${ch}" width="${w}" height="${h}">${bg}${drawPart(view, pose)}</svg>`;
  }

  return { design, CANVAS, drawCharacter, drawPart, resolvePose, DEFAULT_POSE, EXPRESSIONS, PALETTE, VIEWS: ["front", "three", "side", "back"] };
}

module.exports = { createRig, BASE_EXPRESSIONS, BASE_DEFAULT_POSE, makePalette };
