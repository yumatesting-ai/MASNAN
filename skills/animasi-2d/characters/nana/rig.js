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
    hairSway: 0,     // derajat, ayunan rambut belakang
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
    const hairBack = `
      <g id="hair-back" transform="rotate(${p.hairSway} 150 100)">
        <path ${S(C.hair)} d="
          M96,96
          C64,140 80,182 68,222
          C60,250 70,272 86,268
          C92,280 108,280 114,270
          C120,278 132,276 136,266
          L164,266
          C168,276 180,278 186,270
          C192,280 208,280 214,268
          C230,272 240,250 232,222
          C220,182 236,140 204,96 Z"/>
        <path fill="none" stroke="${C.hairShade}" stroke-width="2" stroke-linecap="round"
          d="M84,190 C80,215 82,240 90,258 M216,190 C220,215 218,240 210,258"/>
      </g>`;

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

    // ---------- Lengan (sleeve ikut berputar bersama lengan) ----------
    const arm = (side, deg) => {
      // Digambar untuk sisi kiri layar, sisi kanan dicerminkan. + derajat = ayun keluar.
      const mirror = side === 1 ? `translate(300 0) scale(-1 1)` : "";
      return `
      <g id="arm-${side === -1 ? "l" : "r"}" transform="${mirror}">
        <g transform="rotate(${deg} 116 206)">
          <path ${S(C.skin)} d="
            M99,236 C97,258 96,276 97,290
            C97,301 102,305 107,305
            C113,305 115,300 115,290
            C115,276 115,258 115,240 Z"/>
          <path ${S(C.shirt)} d="
            M120,198 C104,202 94,216 90,244
            C98,249 108,251 117,250
            C117,236 118,224 122,216 Z"/>
        </g>
      </g>`;
    };

    // ---------- Badan ----------
    const torso = `
      <g id="torso" transform="translate(150 284) scale(${breatheScale}) translate(-150 -284)">
        <path ${S(C.shirt)} d="
          M116,200 C132,192 168,192 184,200
          C190,226 190,262 189,284
          C164,288 136,288 111,284
          C110,262 110,226 116,200 Z"/>
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
        <rect ${S(C.skin)} x="141" y="188" width="18" height="16" rx="3"/>
        <circle ${S(C.skin)} cx="214" cy="152" r="10"/>
        <path fill="none" stroke="${C.line}" stroke-width="2" d="M212,147 Q217,152 212,157"/>
        <ellipse ${S(C.skin)} cx="150" cy="140" rx="64" ry="58"/>
        ${eye(122, 148, 6)}
        ${eye(178, 148, -6)}
        ${mouths[p.mouth] || mouths.cat}
        ${sweat}
        <!-- Rambut depan: atap kepala + poni -->
        <path ${S(C.hair)} d="
          M86,168
          C76,108 108,76 150,76
          C194,76 226,108 212,150
          C208,130 202,118 194,110
          C193,120 189,127 183,131
          C178,118 170,110 160,106
          C158,116 154,122 148,127
          C141,114 131,108 120,110
          C116,119 110,125 104,129
          C101,138 98,150 97,168 Z"/>
        <!-- Helai samping kiri menutupi telinga -->
        <path ${S(C.hair)} d="
          M98,124 C84,148 82,190 90,218
          C98,208 104,190 104,170
          C104,154 102,140 106,128 Z"/>
        <path fill="none" stroke="${C.hairShade}" stroke-width="2" stroke-linecap="round"
          d="M146,80 C142,90 144,100 150,106 M176,82 C184,92 190,100 194,110 M118,86 C114,96 114,104 120,110"/>
        <!-- Ahoge -->
        <g id="ahoge" transform="rotate(${p.ahoge} 150 78)">
          <path fill="none" stroke="${C.line}" stroke-width="2.8" stroke-linecap="round"
            d="M150,78 C151,66 156,58 152,50 C148,43 139,46 141,53 C143,58 149,57 150,53"/>
        </g>
      </g>`;

    return `
      <g transform="translate(0 ${p.bodyY})">
        ${hairBack}
        ${legs}
        ${arm(-1, p.armL)}
        ${arm(1, p.armR)}
        ${torso}
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
