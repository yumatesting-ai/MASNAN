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
    hairShade: "#4a4a4a",
    skin: "#efefef",
    skinShade: "#dcdcdc",
    shirt: "#f8f8f8",
    shirtShade: "#e2e2e2",
    pants: "#4e4e4e",
    shoe: "#fafafa",
    eyeWhite: "#ffffff",
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

  function front(p) {
    const C = PALETTE;
    const headPivot = "150 200"; // dagu/leher
    const breatheScale = 1 + 0.015 * p.breathe;

    // ---------- Rambut belakang ----------
    // Satu siluet mulus: puncak mengikuti bentuk kepala, jatuh lurus di samping badan,
    // ujung bawah bergelombang lembut.
    const hairBack = `
      <g id="hair-back" transform="translate(0 ${p.headY}) rotate(${p.headTilt} ${headPivot})">
      <g transform="translate(0 142) skewX(${p.hairSway}) translate(0 -142)">
        <path ${S(C.hair)} d="
          M150,72
          C196,72 224,100 225,142
          C226,178 230,208 235,236
          C239,256 236,270 225,274
          C219,281 209,281 204,274
          C198,280 189,279 186,272
          L114,272
          C111,279 102,280 96,274
          C91,281 81,281 75,274
          C64,270 61,256 65,236
          C70,208 74,178 75,142
          C76,100 104,72 150,72 Z"/>
        <path fill="none" stroke="${C.hairShade}" stroke-width="2" stroke-linecap="round"
          d="M82,200 C80,224 81,246 86,262 M218,200 C220,224 219,246 214,262"/>
      </g></g>`;

    // ---------- Kaki & sepatu ----------
    const legs = `
      <g id="legs">
        <path ${S(C.pants)} d="
          M113,280 L187,280
          C188,310 188,345 187,368
          C178,372 164,372 154,368
          L151,306 L149,306
          L146,368
          C136,372 122,372 113,368
          C112,345 112,310 113,280 Z"/>
        <ellipse ${S(C.shoe)} cx="129" cy="373" rx="20" ry="8"/>
        <ellipse ${S(C.shoe)} cx="171" cy="373" rx="20" ry="8"/>
      </g>`;

    // ---------- Lengan ----------
    // Dua lapis per lengan dengan rotasi yang sama: kulit (di belakang badan) dan
    // lengan baju (di depan badan, sambungan ketiak melengkung). + derajat = ayun keluar.
    const SHOULDER = "118 208";
    const armLayer = (side, deg, part) => {
      const mirror = side === 1 ? `translate(300 0) scale(-1 1)` : "";
      const id = `${part}-${side === -1 ? "l" : "r"}`;
      const shape = part === "arm"
        ? `<path ${S(C.skin)} d="
            M98,240 C96,260 95,277 96,290
            C96,301 101,305 106,305
            C112,305 114,300 114,290
            C114,277 114,260 114,244 Z"/>`
        : `<path ${S(C.shirt)} d="
            M123,204
            C110,206 100,212 95,224
            C91,233 89,242 88,250
            C96,255 107,257 118,256
            C116,238 117,220 123,204 Z"/>
           <path fill="none" stroke="${C.shirtShade}" stroke-width="2" stroke-linecap="round"
             d="M93,246 C100,249 108,250 115,250"/>`;
      return `<g id="${id}" transform="${mirror}"><g transform="rotate(${deg} ${SHOULDER})">${shape}</g></g>`;
    };

    // ---------- Badan (kaos) ----------
    // Bahu landai, garis leher melengkung, badan sedikit melebar ke bawah (A-line),
    // ujung bawah melengkung lembut.
    const torso = `
      <g id="torso" transform="translate(150 286) scale(${breatheScale}) translate(-150 -286)">
        <path ${S(C.skin)} d="M141,186 L159,186 L159,208 L141,208 Z"/>
        <path ${S(C.shirt)} d="
          M114,208
          C120,203 130,200 138,199
          Q150,210 162,199
          C170,200 180,203 186,208
          C188,232 190,262 192,284
          C166,292 134,292 108,284
          C110,262 112,232 114,208 Z"/>
      </g>`;

    // ---------- Wajah ----------
    const px = 3 * p.lookX;
    const eye = (cx, cy, inner) => {
      if (p.blink >= 0.6) {
        return `<path fill="none" stroke="${C.line}" stroke-width="3" stroke-linecap="round"
          d="M${cx - 19},${cy} Q${cx},${cy + 7} ${cx + 19},${cy}"/>`;
      }
      const sy = 1 - p.blink;
      return `
      <g transform="translate(${cx} ${cy}) scale(1 ${sy}) translate(${-cx} ${-cy})">
        <ellipse ${S(C.eyeWhite)} vector-effect="non-scaling-stroke" cx="${cx}" cy="${cy}" rx="22" ry="12"/>
        <circle fill="${C.line}" cx="${cx + inner + px}" cy="${cy + 1}" r="2.6"/>
      </g>`;
    };

    const mouths = {
      cat: `<path fill="none" stroke="${C.line}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
              d="M142,172 Q146,178 150,172 Q154,178 158,172"/>`,
      open: `<path ${S("#3a3a3a")} d="M143,171 Q150,169 157,171 Q156,182 150,182 Q144,182 143,171 Z"/>`,
      flat: `<path fill="none" stroke="${C.line}" stroke-width="2.6" stroke-linecap="round" d="M144,174 L156,174"/>`,
    };

    const sweat = p.sweat
      ? `<path ${S("#ffffff")} stroke-width="2.2" d="M199,158 C196,165 194,169 196,172 C198,175 203,175 204,171 C205,168 202,164 199,158 Z"/>`
      : "";

    const head = `
      <g id="head" transform="translate(0 ${p.headY}) rotate(${p.headTilt} ${headPivot})">
        <circle ${S(C.skin)} cx="213" cy="160" r="10"/>
        <path fill="none" stroke="${C.line}" stroke-width="2" d="M211,155 Q216,160 211,165"/>
        <ellipse ${S(C.skin)} cx="150" cy="140" rx="64" ry="58"/>
        ${eye(122, 148, 6)}
        ${eye(178, 148, -6)}
        ${mouths[p.mouth] || mouths.cat}
        ${sweat}
        <!-- Rambut depan: atap kepala + poni lembut + helai pembingkai wajah kiri (satu bentuk) -->
        <path ${S(C.hair)} d="
          M80,196
          C76,176 75,160 75,142
          C76,100 104,72 150,72
          C196,72 224,100 225,142
          C225,148 223,152 220,154
          C214,140 208,126 200,114
          C197,123 190,128 182,126
          C177,115 168,108 158,107
          C155,117 149,124 141,125
          C136,114 126,108 115,111
          C112,121 106,129 100,134
          C96,152 96,174 101,192
          C96,200 86,202 80,196 Z"/>
        <!-- Helai tipis (detail) -->
        <path fill="none" stroke="${C.hairShade}" stroke-width="2" stroke-linecap="round"
          d="M150,80 C140,88 137,98 139,108 M172,82 C184,90 190,100 192,110 M122,86 C112,96 106,110 104,124"/>
        <!-- Ahoge -->
        <g id="ahoge" transform="rotate(${p.ahoge} 150 76)">
          <path fill="none" stroke="${C.line}" stroke-width="2.8" stroke-linecap="round"
            d="M150,76 C151,64 156,58 152,50 C148,43 139,46 141,53 C143,58 149,57 150,53"/>
        </g>
      </g>`;

    return `
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
