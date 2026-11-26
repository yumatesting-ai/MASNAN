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
  eyes: "normal", mouth: "cat", blink: 0, lookX: 0, lookY: 0, blush: 0, sweat: true,
  tears: "none", anger: false, gloom: false, above: null, fx: 0,
  headTilt: 0, headX: 0, headY: 0, hairSway: 0, ahoge: 0,
  breathe: 0, armL: 0, armR: 0, legL: 0, legR: 0, bodyX: 0, bodyY: 0, lean: 0, squash: 0, scaleX: 1,
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
  const strokeLines = (d, color, w = 2) => (d ? `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" d="${d}"/>` : "");
  const MIRROR = `translate(300 0) scale(-1 1)`;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function defs() {
    const clip = (id, d) => `<clipPath id="${ID}-${id}"><path d="${d}"/></clipPath>`;
    return `<defs>${Object.entries(SHAPE).map(([k, d]) => clip(k, d)).join("")}</defs>`;
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
  const acc = (where) => (design.accessory && design.accessory[where] ? design.accessory[where](PALETTE, LINE) : "");
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
    const strap = design.shoes === "dark"
      ? (isSide ? outline("M146,364 C150,370 158,371 164,366") : outline("M118,365 C125,369 133,369 140,365"))
        + (isSide ? "" : `<ellipse fill="#ffffff" opacity="0.35" cx="122" cy="368" rx="4" ry="2"/>`)
      : "";
    return `<path fill="${C.shoe}" d="${SHAPE[shapeKey]}"/>
      ${isBack ? shade(shapeKey, C.shoeShade, "M100,360 L160,360 L160,371 C140,368 120,368 100,371 Z") : ""}
      ${shade(shapeKey, C.shoeShade, isSide ? "M120,375 L200,375 L200,390 L120,390 Z" : "M100,375 C115,378 145,378 160,375 L160,390 L100,390 Z")}
      ${outline(SHAPE[shapeKey])}${strap}`;
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
        : front ? shade(key, C.hairShade, "M60,168 C110,182 190,182 240,168 L240,230 L60,230 Z", 'opacity="0.7"') : "";
      return `
      <g id="hair-back" transform="${headT} translate(${hx} 0)">
      <g transform="translate(0 142) skewX(${p.hairSway}) translate(0 -142)">
        <path fill="${front ? C.hair : C.hairBack}" d="${d}"/>
        ${shades}
        ${front ? `<path clip-path="url(#${ID}-${key})" fill="none" stroke="${C.hairShine}" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 9" d="${H.shineBack || "M96,104 C118,84 182,84 204,104"}"/>` : ""}
        ${outline(d)}
        ${strokeLines(front ? H.backViewStrands : H.backStrands, C.hairShade, front ? 2.2 : 2)}
      </g></g>`;
    };

    const leg = (side, lift) => {
      const l = side === "l";
      const k = 1 - Math.max(0, lift) / 95;
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
      return `<g id="leg-${side}">
        <g transform="translate(0 282) scale(1 ${k}) translate(0 -282)">${skinLeg}${garment}</g>
        <g transform="translate(${l ? 0 : 42} ${-Math.max(0, lift)})">${shoeSvg("shoe", isBack, false)}</g></g>`;
    };
    const legs = `<g id="legs" transform="${isThree ? "translate(-3 0)" : ""}">
      ${p.legL > p.legR ? leg("r", p.legR) + leg("l", p.legL) : leg("l", p.legL) + leg("r", p.legR)}</g>`;

    // ---------- lengan ----------
    const LONG = design.sleeves === "long";
    const SHOULDER = "118 208";     // pivot lengan baju
    const ARM_ROOT = "106 236";     // pivot lengan di dalam lengan baju pendek
    const SLEEVE_K = LONG ? 1 : 0.6; // lengan baju pendek ikut 60% -> tidak "mengepak"
    const armLayer = (side, deg, part) => {
      const mirror = side === 1 ? MIRROR : "";
      const far = isThree && side === -1;
      const shift = far ? "translate(7 0)" : "";
      const id = `${part}-${side === -1 ? "l" : "r"}`;
      const seamOp = isBack ? 1 : clamp01((Math.abs(deg) - 25) / 30);
      let shape;
      if (part === "arm") {
        shape = LONG
          ? `<circle fill="${far ? C.skinFar : C.skin}" ${LINE} cx="103" cy="297" r="8.5"/>`
          : `<path fill="${far ? C.skinFar : C.skin}" d="${SHAPE.arm}"/>
             ${shade("arm", C.skinShade, "M90,236 L120,236 L120,266 C110,262 100,262 90,264 Z M108,236 L120,236 L120,310 L109,310 C111,290 110,262 108,236 Z")}
             ${outline(SHAPE.arm)}`;
      } else if (LONG) {
        shape = `<path fill="${C.shirt}" d="${SHAPE.longSleeve}"/>
           ${shade("longSleeve", C.shirtShade, "M108,230 L122,230 L122,300 L109,300 C111,280 110,250 108,230 Z")}
           ${outline("M114,205.5 C110,206.4 106,207.8 102,210", `opacity="${clamp01(1 - (Math.abs(deg) - 8) / 22).toFixed(2)}"`)}
           ${outline("M102,210 C99,213 96,220 93,232 C91,252 90,272 91,291 C98,295 108,295 115,291")}
           ${outline("M115,291 C115,276 116,262 117,248")}
           ${outline("M92,284 C99,287 108,287 115,284", 'stroke-width="2.2"')}
           ${seamOp > 0 ? outline("M117,248 C118,232 121,216 128,206", `opacity="${seamOp.toFixed(2)}"`) : ""}`;
      } else {
        shape = `<path fill="${C.shirt}" d="${SHAPE.sleeve}"/>
           ${shade("sleeve", C.shirtShade, "M121,222 C117,236 108,246 86,247 L86,262 L124,262 Z")}
           ${outline("M114,205.5 C110,206.4 106,207.8 102,210", `opacity="${clamp01(1 - (Math.abs(deg) - 8) / 22).toFixed(2)}"`)}
           ${outline("M102,210 C99,213 97,218 95,224 C91,233 89,242 88,250 C96,255 105,257 114,256")}
           ${outline("M115,256 C115.6,248 116.2,241 117,235")}
           ${seamOp > 0 ? outline("M117,235 C118,225 121,214 128,206", `opacity="${seamOp.toFixed(2)}"`) : ""}`;
      }
      const rs = deg * SLEEVE_K;
      const inner = part === "arm" && !LONG
        ? `<g transform="rotate(${rs} ${SHOULDER})"><g transform="rotate(${deg - rs} ${ARM_ROOT})">${shape}</g></g>`
        : `<g transform="rotate(${part === "arm" ? deg : rs} ${SHOULDER})">${shape}</g>`;
      return `<g id="${id}" transform="${mirror} ${shift}">${inner}</g>`;
    };

    // ---------- badan ----------
    const top = design.top;
    const tKey = top + (isBack ? "Back" : "");
    const torsoD = SHAPE[tKey];
    const skirt = B === "skirt" ? `
        <path fill="${C.pants}" d="${SHAPE.skirt}"/>
        ${shade("skirt", C.pantsShade, "M90,300 C130,312 170,312 210,300 L210,330 L90,330 Z M126,262 L116,330 L104,330 L104,262 Z")}
        ${strokeLines("M127,264 L120,322 M142,262 L139,325 M158,262 L161,325 M173,264 L180,322", C.line, 2)}
        ${outline(SHAPE.skirt)}` : "";
    let topExtra = "";
    if (top === "tee") topExtra = strokeLines("M140,274 C145,279 151,281 157,280", C.shirtShade, 2.2);
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
    const torso = `
      <g id="torso" transform="translate(150 286) scale(${(isThree ? 0.95 : 1) * breatheScale} ${breatheScale}) translate(-150 -286)">
        ${neck}
        ${skirt}
        <path fill="${C.shirt}" d="${torsoD}"/>
        ${isBack ? "" : shade(tKey, C.shirtShade, "M112,196 C130,214 170,214 188,196 L188,190 L112,190 Z")}
        ${shade(tKey, C.shirtShade, "M104,240 C114,250 120,268 119,300 L100,300 Z M196,240 C186,250 180,268 181,300 L200,300 Z")}
        ${isThree ? shade(tKey, C.shirtShade, "M100,200 C118,220 124,260 122,300 L100,300 Z") : ""}
        ${outline(torsoD)}
        ${topExtra}
      </g>`;

    let head;
    if (isBack) {
      const ears = (design.ears.back || []).map((s) => (s === "r" ? earSvg(214, 160) : earSvg(86, 160, true))).join("");
      head = { before: `<g transform="${headT}">${ears}</g>`,
        after: `<g id="head" transform="${headT}">${acc("back")}${angerMark(L, p)}${AHOGE(p)}</g>` };
    } else {
      const ears = design.ears.front || [];
      const earR = ears.includes("r") ? (isThree ? earSvg(205, 162) : earSvg(214, 162)) : "";
      const earL = ears.includes("l") && !isThree ? earSvg(86, 162, true) : "";
      head = `
      <g id="head" transform="${headT}">
        ${isThree ? "" : earR}${earL}
        <path fill="${C.skin}" d="${SHAPE.face}"/>
        <path clip-path="url(#${ID}-face)" fill="${C.skinShade}" transform="translate(${2 + hx} 7)" d="${SHAPE.hairFront}"/>
        ${isThree ? shade("face", C.skinShade, "M196,90 C214,120 216,170 196,206 L230,206 L230,90 Z") : ""}
        ${outline(SHAPE.face)}
        ${isThree ? earR : ""}
        ${faceExtras(L, p, "face")}
        ${L.eyes.map((e) => eye(e, p)).join("")}
        ${mouth(L.mouth, p)}
        <g transform="translate(${hx} 0)">
          <path fill="${C.hair}" d="${SHAPE.hairFront}"/>
          <g clip-path="url(#${ID}-hairFront)">
            <path fill="none" stroke="${C.hairShine}" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 9" d="${H.shineFront || "M98,108 C118,88 182,88 202,108"}"/>
            <path fill="${C.hairShade}" d="${H.frontShade || "M70,150 C84,150 92,170 96,210 L70,210 Z"}"/>
          </g>
          ${outline(SHAPE.hairFront)}
          ${strokeLines(H.frontStrands, C.hairShade)}
          ${acc("front")}
        </g>
        ${angerMark(L, p)}
        ${AHOGE(p)}
      </g>`;
    }

    if (isBack) {
      return `${legs}${armLayer(-1, p.armL, "arm")}${armLayer(1, p.armR, "arm")}${torso}
        ${armLayer(-1, p.armL, "sleeve")}${armLayer(1, p.armR, "sleeve")}${head.before}${hairBackG(true)}${head.after}`;
    }
    return `${hairBackG(false)}${legs}
      ${armLayer(-1, p.armL, "arm")}${armLayer(1, p.armR, "arm")}${torso}
      ${armLayer(-1, p.armL, "sleeve")}${armLayer(1, p.armR, "sleeve")}${head}`;
  }

  // ================= TAMPAK SAMPING (digambar menghadap kanan, lalu dicerminkan) =================
  function side(p) {
    const C = PALETTE;
    const L = LAYOUT.side;
    const headPivot = "150 200";
    const headT = `translate(${p.headX} ${p.headY}) rotate(${p.headTilt} ${headPivot})`;
    const breatheScale = 1 + 0.015 * p.breathe;
    const LONG = design.sleeves === "long";

    const hairBackG = `
      <g id="hair-back" transform="${headT}">
      <g transform="translate(0 142) skewX(${p.hairSway}) translate(0 -142)">
        <path fill="${C.hairBack}" d="${SHAPE.hairBackSide}"/>
        ${H.long ? shade("hairBackSide", C.hairShade, "M80,200 C96,220 100,250 104,290 L80,290 Z") : ""}
        ${outline(SHAPE.hairBackSide)}
        ${strokeLines(H.sideBackStrands, C.hairShade)}
      </g></g>`;

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
      return `<g transform="rotate(${deg} 150 284)">${skin}${garment}${shoeSvg("shoeSide", false, true)}</g>`;
    };

    const arm = (deg, far) => {
      const body = LONG
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
      return `<g transform="${far ? "translate(5 0)" : ""} rotate(${-deg} 150 212)">${body}</g>`;
    };

    const tKey = design.top + "Side";
    const skirt = B === "skirt" ? `
        <path fill="${C.pants}" d="${SHAPE.skirtSide}"/>
        ${shade("skirtSide", C.pantsShade, "M100,300 C140,312 170,312 200,300 L200,330 L100,330 Z")}
        ${strokeLines("M138,264 L128,320 M156,263 L154,322 M170,263 L178,320", C.line, 2)}
        ${outline(SHAPE.skirtSide)}` : "";
    const hood = design.top === "hoodie" ? fillLine(C.shirtShade, "M126,216 C112,208 114,192 130,192 C136,194 140,200 142,206 Z") : "";
    const torso = `
      <g id="torso" transform="translate(150 286) scale(${breatheScale}) translate(-150 -286)">
        ${fillLine(C.skinShade, "M144,186 L160,186 L160,208 L144,208 Z")}
        ${skirt}
        <path fill="${C.shirt}" d="${SHAPE[tKey]}"/>
        ${shade(tKey, C.shirtShade, "M116,200 C134,214 136,250 132,300 L116,300 Z M150,196 C160,210 172,210 180,200 L180,190 L150,190 Z")}
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
        ${faceExtras(L, p, "face")}
        ${L.eyes.map((e) => eye(e, p)).join("")}
        ${mouth(L.mouth, p)}
        <path fill="${C.hair}" d="${SHAPE.hairFrontSide}"/>
        <g clip-path="url(#${ID}-hairFrontSide)">
          <path fill="none" stroke="${C.hairShine}" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 9" d="${H.shineSide || "M100,110 C118,86 172,84 200,104"}"/>
          <path fill="${C.hairShade}" d="M80,150 C96,160 104,180 110,206 L80,206 Z"/>
        </g>
        ${outline(SHAPE.hairFrontSide)}
        ${strokeLines(H.sideStrands, C.hairShade)}
        ${design.ears.side ? `<circle fill="${C.skin}" ${LINE} cx="142" cy="160" r="10"/>
          <path fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round" d="M144,155 Q139,160 144,165"/>` : ""}
        ${acc("side")}
        ${angerMark(L, p)}
        ${AHOGE(p)}
      </g>`;

    return `${arm(p.armR, true)}${leg(-p.legR, true)}${hairBackG}${leg(-p.legL, false)}${torso}${arm(p.armL, false)}${head}`;
  }

  // ================= RAKIT =================
  function resolvePose(pose) {
    const preset = EXPRESSIONS[pose.expr || "neutral"] || {};
    const clean = {};
    for (const k in pose) if (pose[k] !== undefined) clean[k] = pose[k]; // undefined = pakai preset
    return Object.assign({}, DEFAULT_POSE, preset, clean);
  }

  // isi karakter (tanpa <svg>) dalam kanvas 300x400 — dipakai juga untuk adegan multi-karakter
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
    return `${defs()}${ground}
      <g transform="${rootT}">
        <g transform="${p.flip ? MIRROR : ""}">${body}</g>
        ${aboveFx(p, { x: ax, y: ay })}
      </g>`;
  }

  function drawCharacter(view = "front", pose = {}, opts = {}) {
    const w = opts.width || 300, h = opts.height || 400;
    const bg = opts.background ? `<rect width="300" height="400" fill="${opts.background}"/>` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="${w}" height="${h}">${bg}${drawPart(view, pose)}</svg>`;
  }

  return { design, drawCharacter, drawPart, resolvePose, DEFAULT_POSE, EXPRESSIONS, PALETTE, VIEWS: ["front", "three", "side", "back"] };
}

module.exports = { createRig, BASE_EXPRESSIONS, BASE_DEFAULT_POSE, makePalette };
