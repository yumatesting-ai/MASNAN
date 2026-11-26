// Desain karakter: BUK ATIN (perempuan dewasa) — ibu warung, badan gemuk, daster bermotif bunga,
// rambut dicepol (diikat), berkacamata, sandal jepit.
module.exports = {
  id: "atin",
  name: "Buk Atin",
  gender: "perempuan",
  fullName: "Hartini",
  role: "Pemilik warung — ratu gosip komplek",
  age: "dewasa (40-an)",
  personality: "ramah, cerewet, heboh, suka gosip, tapi baik hati (sering kasih utang)",
  hobbies: "jaga warung, nonton sinetron, arisan",
  catchphrase: "Eh, udah denger belum?!",
  colors: { hair: "#3c3c3c", top: "#a9a9a9", bottom: "#4a4a4a", shoe: "#5a5a5a", skin: "#efefef", accent: "#f2f2f2" },
  hair: {
    long: false,
    shapes: {
      // rambut disisir ke belakang + cepol di atas kepala
      hairBack: "M150,70 C200,70 224,100 222,150 L78,150 C76,100 100,70 150,70 Z M128,60 A22,19 0 1 1 172,60 A22,19 0 1 1 128,60 Z",
      hairBackView: "M150,72 C200,72 226,100 222,150 C220,176 210,194 196,200 L104,200 C90,194 80,176 78,150 C74,100 100,72 150,72 Z M126,62 A24,20 0 1 1 174,62 A24,20 0 1 1 126,62 Z",
      hairFront: "M80,160 C74,110 104,76 150,76 C196,76 226,110 220,160 C214,140 206,118 190,106 C176,98 162,96 150,100 C138,96 124,98 110,106 C94,118 86,140 80,160 Z",
      hairBackSide: "M150,72 C108,72 86,100 88,146 C90,170 98,188 112,196 L130,170 L150,140 Z M96,80 A20,18 0 1 1 136,80 A20,18 0 1 1 96,80 Z",
      hairFrontSide: "M88,146 C86,100 110,74 152,74 C188,74 210,92 214,116 C200,104 184,98 168,98 C156,98 146,106 140,120 C136,134 134,146 132,156 C126,172 118,186 108,194 C96,186 90,170 88,146 Z",
    },
    shineFront: "M102,100 C120,84 180,84 198,100",
    frontShade: "M70,140 C80,140 86,150 88,170 L70,170 Z",
    frontStrands: "M150,78 L150,100 M130,82 C122,90 116,98 112,106 M170,82 C178,90 184,98 188,106",
    backViewStrands: "M150,82 L150,196 M120,90 C126,120 130,160 128,196 M180,90 C174,120 170,160 172,196",
    sideStrands: "M190,96 C170,86 146,84 120,92 M196,106 C176,100 150,98 130,108",
  },
  ears: { front: ["l", "r"], side: true, back: ["l", "r"] },
  ahoge: null,
  face: { glasses: true, doubleChin: true },
  // karet rambut di pangkal cepol
  accessory: {
    front: (C) => `<path fill="none" stroke="#f4f4f4" stroke-width="4" stroke-linecap="round" d="M134,77 C142,80 158,80 166,77"/>`,
    back: (C) => `<path fill="none" stroke="#f4f4f4" stroke-width="4" stroke-linecap="round" d="M130,78 C140,84 160,84 170,78"/>`,
    side: (C) => `<path fill="none" stroke="#f4f4f4" stroke-width="4" stroke-linecap="round" d="M104,94 C112,100 124,100 132,96"/>`,
  },
  top: "daster",
  sleeves: "short",
  bottom: "none",
  legwear: null,
  shoes: "sandal",
  build: { armDX: 16, armRest: 5 }, // badan gemuk -> lengan keluar
  expr: { neutral: { mouth: "smile", blush: 0.3, sweat: false } },
};
