// Desain karakter: RARA (perempuan) — rambut bob terang + poni lurus + jepit, sweater kerah bulat, rok lipit.
module.exports = {
  id: "rara",
  name: "Rara",
  gender: "perempuan",
  fullName: "Rara Ayudia",
  role: "Teman sekelas — si manis",
  age: "remaja (15)",
  personality: "manis, kalem, rapi, perhatian, gampang malu",
  hobbies: "membaca, merajut, bikin kue",
  catchphrase: "Pelan-pelan aja, ya~",
  colors: { hair: "#a6a6a6", top: "#c9c9c9", bottom: "#3f3f3f", shoe: "#3a3a3a", skin: "#efefef", sock: "#fafafa", accent: "#ffffff" },
  hair: {
    long: false,
    shapes: {
      hairBack: "M150,70 C200,70 230,100 230,150 C230,174 228,190 222,198 L78,198 C72,190 70,174 70,150 C70,100 100,70 150,70 Z",
      hairBackView: "M150,70 C200,70 230,100 230,150 C230,180 228,198 222,210 C190,218 110,218 78,210 C72,198 70,180 70,150 C70,100 100,70 150,70 Z",
      // poni lurus (hime) + dua helai samping sampai dagu -> telinga tertutup
      hairFront: "M76,202 C70,172 70,142 74,118 C80,88 110,70 150,70 C190,70 220,88 226,118 C230,142 230,172 224,202 C218,208 208,208 202,202 C201,182 200,162 200,142 L200,124 C170,128 130,128 100,124 L100,142 C100,162 99,182 98,202 C92,208 82,208 76,202 Z",
      hairBackSide: "M152,70 C110,70 84,100 84,150 C84,176 88,196 96,208 C110,214 128,214 140,208 L150,150 Z",
      hairFrontSide: "M84,150 C84,100 110,70 152,70 C196,70 220,96 214,124 C196,128 178,128 162,124 C158,150 158,182 162,208 C140,216 110,214 96,208 C88,196 84,176 84,150 Z",
    },
    shineFront: "M96,106 C118,86 182,86 204,106",
    shineBack: "M94,104 C118,84 182,84 206,104",
    frontShade: "M70,150 C84,150 92,170 96,212 L70,212 Z M230,150 C216,150 208,170 204,212 L230,212 Z",
    frontStrands: "M150,74 C146,90 146,108 148,124 M126,80 C118,96 114,110 114,124 M174,80 C182,96 186,110 186,124",
    backStrands: null,
    backViewStrands: "M150,74 L150,96 M120,84 C110,120 108,170 110,210 M180,84 C190,120 192,170 190,210 M150,100 C148,140 148,180 150,214",
    sideStrands: "M150,74 C132,82 116,100 110,130 M176,78 C188,90 196,104 200,122",
    sideBackStrands: "M96,170 C96,186 100,198 108,206",
  },
  ears: { front: [], side: false, back: [] },
  ahoge: null,
  // jepit rambut putih (dua batang) di sisi kanan layar
  accessory: {
    front: (C, LINE) => `
      <g transform="translate(188 100) rotate(-30)"><rect x="-11" y="-3.5" width="22" height="7" rx="3.5" fill="#ffffff" ${LINE} stroke-width="2.2"/></g>
      <g transform="translate(195 112) rotate(-30)"><rect x="-9" y="-3" width="18" height="6" rx="3" fill="#ffffff" ${LINE} stroke-width="2.2"/></g>`,
    side: (C, LINE) => `
      <g transform="translate(140 92) rotate(20)"><rect x="-11" y="-3.5" width="22" height="7" rx="3.5" fill="#ffffff" ${LINE} stroke-width="2.2"/></g>
      <g transform="translate(134 104) rotate(20)"><rect x="-9" y="-3" width="18" height="6" rx="3" fill="#ffffff" ${LINE} stroke-width="2.2"/></g>`,
    back: (C, LINE) => `
      <g transform="translate(112 100) rotate(30)"><rect x="-11" y="-3.5" width="22" height="7" rx="3.5" fill="#ffffff" ${LINE} stroke-width="2.2"/></g>
      <g transform="translate(105 112) rotate(30)"><rect x="-9" y="-3" width="18" height="6" rx="3" fill="#ffffff" ${LINE} stroke-width="2.2"/></g>`,
  },
  top: "sweater",
  sleeves: "long",
  bottom: "skirt",
  legwear: "kneeSocks",
  shoes: "dark",
  // sifat: manis & kalem -> senyum kecil + pipi merona tipis
  expr: { neutral: { mouth: "smile", blush: 0.45, sweat: false } },
};
