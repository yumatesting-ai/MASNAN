// Rig karakter "Nana" — chibi grayscale, rambut panjang, ahoge, mata oval kosong, mulut ":3".
// Setiap bagian tubuh adalah grup SVG terpisah dengan titik pivot sendiri,
// sehingga bisa dianimasikan lewat parameter pose.
//
// Pemakaian: drawCharacter(view, pose) -> string <svg>
//   view: "front" (tampak lain menyusul)
//   pose: lihat DEFAULT_POSE di bawah

(function (root) {
  const PALETTE = {
    line: "#2a2a2a",
    hair: "#5b5b5b",
    hairBack: "#4f4f4f",   // rambut belakang sedikit lebih gelap -> kesan berlapis
    hairShade: "#454545",
    hairShine: "#717171",
    skin: "#efefef",
    skinShade: "#d6d6d6",
    shirt: "#f8f8f8",
    shirtShade: "#dedede",
    pants: "#4e4e4e",
    pantsShade: "#3d3d3d",
    shoe: "#fafafa",
    shoeShade: "#d9d9d9",
    eyeWhite: "#ffffff",
    ground: "rgba(0,0,0,0.13)",
  };

  const DEFAULT_POSE = {
    blink: 0,        // 0 = mata terbuka, 1 = tertutup
    headTilt: 0,     // derajat, + = miring ke kanan layar
    headY: 0,        // px, gerak naik-turun kepala
    breathe: 0,      // 0..1 dada mengembang
    armL: 0,         // derajat rotasi lengan kiri layar (+ = ke luar)
    armR: 0,         // derajat rotasi lengan kanan layar (+ = ke luar)
    hairSway: 0,     // derajat skew ujung rambut belakang (crown tetap), aman ±2
    ahoge: 0,        // derajat, pantulan ahoge
    lookX: 0,        // -1..1 arah pupil
    mouth: "cat",    // "cat" (:3) | "open" | "flat"
    sweat: true,     // tetes keringat
    bodyY: 0,        // px, pantulan seluruh badan
  };

  const S = (fill) =>
    `fill="${fill}" stroke="${PALETTE.line}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

  // ---------- Bentuk dasar (dipakai untuk isi sekaligus clipPath shading) ----------
  const SHAPE = {
    hairBack: `M150,72 C196,72 224,100 225,142 C226,178 230,208 235,236 C239,256 236,270 225,274
      C219,281 209,281 204,274 C198,280 189,279 186,272 L114,272 C111,279 102,280 96,274
      C91,281 81,281 75,274 C64,270 61,256 65,236 C70,208 74,178 75,142 C76,100 104,72 150,72 Z`,
    hairFront: `M80,196 C76,176 75,160 75,142 C76,100 104,72 150,72 C196,72 224,100 225,142
      C225,148 223,152 220,154 C214,140 208,126 200,114 C197,123 190,128 182,126
      C177,115 168,108 158,107 C155,117 149,124 141,125 C136,114 126,108 115,111
      C112,121 106,129 100,134 C96,152 96,174 101,192 C96,200 86,202 80,196 Z`,
    face: `M86,140 A64,58 0 1 0 214,140 A64,58 0 1 0 86,140 Z`,
    torso: `M114,208 C120,203 130,200 138,199 Q150,210 162,199 C170,200 180,203 186,208
      C188,232 190,262 192,284 C166,292 134,292 108,284 C110,262 112,232 114,208 Z`,
    pants: `M113,280 L187,280 C188,310 188,345 187,368 C178,372 164,372 154,368 L151,306 L149,306
      L146,368 C136,372 122,372 113,368 C112,345 112,310 113,280 Z`,
    arm: `M98,240 C96,260 95,277 96,290 C96,301 101,305 106,305 C112,305 114,300 114,290
      C114,277 114,260 114,244 Z`,
    sleeve: `M124,203 C110,206 100,212 95,224 C91,233 89,242 88,250 C96,255 105,257 115,256
      C117,238 119,220 128,206 Z`,
    shoe: `M110,374 C110,366 118,362 129,362 C140,362 149,366 149,374 C149,379 143,381 129,381
      C115,381 110,379 110,374 Z`,
  };

  function defs() {
    const clip = (id, d) => `<clipPath id="nana-${id}"><path d="${d}"/></clipPath>`;
    return `<defs>
      ${clip("hairBack", SHAPE.hairBack)}${clip("hairFront", SHAPE.hairFront)}
      ${clip("face", SHAPE.face)}${clip("torso", SHAPE.torso)}${clip("pants", SHAPE.pants)}
      ${clip("arm", SHAPE.arm)}${clip("sleeve", SHAPE.sleeve)}${clip("shoe", SHAPE.shoe)}
    </defs>`;
  }

  function front(p) {
    const C = PALETTE;
    const headPivot = "150 200"; // dagu/leher
    const breatheScale = 1 + 0.015 * p.breathe;
    const LINE = `stroke="${C.line}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
    const shade = (clipId, fill, d) => `<path clip-path="url(#nana-${clipId})" fill="${fill}" d="${d}"/>`;

    // ---------- Bayangan lantai ----------
    const ground = `<ellipse fill="${C.ground}" cx="150" cy="380" rx="${54 - p.bodyY}" ry="7"/>`;

    // ---------- Rambut belakang ----------
    const hairBack = `
      <g id="hair-back" transform="translate(0 ${p.headY}) rotate(${p.headTilt} ${headPivot})">
      <g transform="translate(0 142) skewX(${p.hairSway}) translate(0 -142)">
        <path fill="${C.hairBack}" d="${SHAPE.hairBack}"/>
        ${shade("hairBack", C.hairShade, "M60,180 C80,200 84,240 92,290 L60,290 Z M240,180 C220,200 216,240 208,290 L240,290 Z")}
        <path fill="none" ${LINE} d="${SHAPE.hairBack}"/>
        <path fill="none" stroke="${C.hairShade}" stroke-width="2" stroke-linecap="round"
          d="M84,206 C82,228 83,248 88,262 M216,206 C218,228 217,248 212,262"/>
      </g></g>`;

    // ---------- Kaki & sepatu ----------
    const legs = `
      <g id="legs">
        <path fill="${C.pants}" d="${SHAPE.pants}"/>
        ${shade("pants", C.pantsShade, "M100,276 L200,276 L200,294 C170,300 130,300 100,294 Z")}
        ${shade("pants", C.pantsShade, "M141,300 L150,300 L150,372 L139,372 Z M150,300 L160,300 L163,372 L150,372 Z")}
        <path fill="none" ${LINE} d="${SHAPE.pants}"/>
        ${[0, 42].map((dx) => `
        <g transform="translate(${dx} 0)">
          <path fill="${C.shoe}" d="${SHAPE.shoe}"/>
          ${shade("shoe", C.shoeShade, "M100,375 C115,378 145,378 160,375 L160,390 L100,390 Z")}
          <path fill="none" ${LINE} d="${SHAPE.shoe}"/>
        </g>`).join("")}
      </g>`;

    // ---------- Lengan ----------
    // Dua lapis per lengan dengan rotasi yang sama: kulit (di belakang badan) dan
    // lengan baju (di depan badan). + derajat = ayun keluar.
    const SHOULDER = "118 208";
    const armLayer = (side, deg, part) => {
      const mirror = side === 1 ? `translate(300 0) scale(-1 1)` : "";
      const id = `${part}-${side === -1 ? "l" : "r"}`;
      const shape = part === "arm"
        ? `<path fill="${C.skin}" d="${SHAPE.arm}"/>
           ${shade("arm", C.skinShade, "M90,236 L120,236 L120,266 C110,262 100,262 90,264 Z M108,236 L120,236 L120,310 L109,310 C111,290 110,262 108,236 Z")}
           <path fill="none" ${LINE} d="${SHAPE.arm}"/>`
        : `<path fill="${C.shirt}" d="${SHAPE.sleeve}"/>
           ${shade("sleeve", C.shirtShade, "M121,222 C117,236 108,246 86,247 L86,262 L124,262 Z")}
           <!-- garis luar lengan baju tanpa sisi dalam -> tidak ada jahitan panjang -->
           <path fill="none" ${LINE} d="M124,203 C110,206 100,212 95,224 C91,233 89,242 88,250 C96,255 105,257 114,256"/>
           <!-- jahitan setengah dari ketiak; penuh saat lengan diangkat -->
           <path fill="none" ${LINE} d="M115,256 C115.6,248 116.2,241 117,235"/>
           ${Math.abs(deg) > 25 ? `<path fill="none" ${LINE}
             opacity="${Math.min(1, (Math.abs(deg) - 25) / 30).toFixed(2)}"
             d="M117,235 C118,225 121,214 128,206"/>` : ""}`;
      return `<g id="${id}" transform="${mirror}"><g transform="rotate(${deg} ${SHOULDER})">${shape}</g></g>`;
    };

    // ---------- Badan (kaos) ----------
    const torso = `
      <g id="torso" transform="translate(150 286) scale(${breatheScale}) translate(-150 -286)">
        <path fill="${C.skinShade}" ${LINE} d="M141,186 L159,186 L159,208 L141,208 Z"/>
        <path fill="${C.shirt}" d="${SHAPE.torso}"/>
        ${shade("torso", C.shirtShade, "M112,196 C130,214 170,214 188,196 L188,190 L112,190 Z")}
        ${shade("torso", C.shirtShade, "M104,240 C114,250 120,268 119,296 L100,296 Z M196,240 C186,250 180,268 181,296 L200,296 Z")}
        <path fill="none" stroke="${C.shirtShade}" stroke-width="2.2" stroke-linecap="round"
          d="M140,274 C145,279 151,281 157,280"/>
        <path fill="none" ${LINE} d="${SHAPE.torso}"/>
      </g>`;

    // ---------- Wajah ----------
    const px = 3 * p.lookX;
    const eye = (cx, cy, inner) => {
      if (p.blink >= 0.6) {
        return `<path fill="none" stroke="${C.line}" stroke-width="3.2" stroke-linecap="round"
          d="M${cx - 19},${cy} Q${cx},${cy + 7} ${cx + 19},${cy}"/>`;
      }
      const sy = 1 - p.blink;
      return `
      <g transform="translate(${cx} ${cy}) scale(1 ${sy}) translate(${-cx} ${-cy})">
        <ellipse fill="${C.eyeWhite}" stroke="${C.line}" stroke-width="2.6" vector-effect="non-scaling-stroke"
          cx="${cx}" cy="${cy}" rx="22" ry="12"/>
        <path fill="none" stroke="${C.line}" stroke-width="3.8" stroke-linecap="round" vector-effect="non-scaling-stroke"
          d="M${cx - 21},${cy - 3} C${cx - 16},${cy - 13} ${cx + 16},${cy - 13} ${cx + 21},${cy - 3}"/>
        <circle fill="${C.line}" cx="${cx + inner + px}" cy="${cy + 1}" r="2.7"/>
      </g>`;
    };

    const mouths = {
      cat: `<path fill="none" stroke="${C.line}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
              d="M142,172 Q146,178 150,172 Q154,178 158,172"/>`,
      open: `<path fill="#3a3a3a" ${LINE} stroke-width="2.6" d="M143,171 Q150,169 157,171 Q156,182 150,182 Q144,182 143,171 Z"/>`,
      flat: `<path fill="none" stroke="${C.line}" stroke-width="2.6" stroke-linecap="round" d="M144,174 L156,174"/>`,
    };

    const sweat = p.sweat
      ? `<path fill="#ffffff" ${LINE} stroke-width="2.2" d="M199,165 C196,172 194,176 196,179 C198,182 203,182 204,178 C205,175 202,171 199,165 Z"/>`
      : "";

    const head = `
      <g id="head" transform="translate(0 ${p.headY}) rotate(${p.headTilt} ${headPivot})">
        <circle fill="${C.skin}" ${LINE} cx="214" cy="162" r="9"/>
        <path fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round" d="M213,158 Q217,162 213,166"/>
        <path fill="${C.skin}" d="${SHAPE.face}"/>
        <!-- bayangan poni di dahi -->
        <path clip-path="url(#nana-face)" fill="${C.skinShade}" transform="translate(2 7)" d="${SHAPE.hairFront}"/>
        <path fill="none" ${LINE} d="${SHAPE.face}"/>
        ${eye(122, 148, 6)}
        ${eye(178, 148, -6)}
        ${mouths[p.mouth] || mouths.cat}
        ${sweat}
        <!-- Rambut depan: atap kepala + poni + helai pembingkai wajah kiri -->
        <path fill="${C.hair}" d="${SHAPE.hairFront}"/>
        <g clip-path="url(#nana-hairFront)">
          <path fill="none" stroke="${C.hairShine}" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 9"
            d="M98,108 C118,88 182,88 202,108"/>
          <path fill="${C.hairShade}" d="M70,150 C84,150 92,170 96,210 L70,210 Z"/>
        </g>
        <path fill="none" ${LINE} d="${SHAPE.hairFront}"/>
        <path fill="none" stroke="${C.hairShade}" stroke-width="2" stroke-linecap="round"
          d="M150,76 C141,86 137,96 139,107 M172,80 C184,89 190,100 192,110 M122,84 C112,95 106,110 104,124"/>
        <!-- Ahoge -->
        <g id="ahoge" transform="rotate(${p.ahoge} 150 76)">
          <path fill="none" stroke="${C.line}" stroke-width="2.8" stroke-linecap="round"
            d="M150,76 C151,64 156,58 152,50 C148,43 139,46 141,53 C143,58 149,57 150,53"/>
        </g>
      </g>`;

    return `
      ${defs()}
      ${ground}
      <g transform="translate(0 ${p.bodyY})">
        ${hairBack}
        ${legs}
        ${armLayer(-1, p.armL, "arm")}
        ${armLayer(1, p.armR, "arm")}
        ${torso}
        ${armLayer(-1, p.armL, "sleeve")}
        ${armLayer(1, p.armR, "sleeve")}
        ${head}
      </g>`;
  }

  const VIEWS = { front };

  function drawCharacter(view = "front", pose = {}, opts = {}) {
    const p = Object.assign({}, DEFAULT_POSE, pose);
    const w = opts.width || 300;
    const h = opts.height || 400;
    const bg = opts.background ? `<rect width="300" height="400" fill="${opts.background}"/>` : "";
    const fn = VIEWS[view];
    if (!fn) throw new Error(`View "${view}" belum tersedia. Ada: ${Object.keys(VIEWS).join(", ")}`);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="${w}" height="${h}">${bg}${fn(p)}</svg>`;
  }

  const api = { drawCharacter, DEFAULT_POSE, PALETTE, VIEWS: Object.keys(VIEWS) };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NanaRig = api;
})(typeof window !== "undefined" ? window : globalThis);
