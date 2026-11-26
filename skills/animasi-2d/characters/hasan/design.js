// Desain karakter: PAK HASAN (laki-laki dewasa) — botak, kumis tebal, kutang putih, sarung kotak-kotak,
// perut buncit, sandal jepit.
module.exports = {
  id: "hasan",
  name: "Pak Hasan",
  gender: "laki-laki",
  fullName: "Hasan Basri",
  role: "Bapak-bapak komplek — si santai, pelanggan setia warung Buk Atin",
  age: "dewasa (50-an)",
  personality: "santai, kalem, suka ngopi & ngobrol di pos ronda, hobi kasih nasihat panjang",
  hobbies: "ngopi, main catur, pelihara burung",
  catchphrase: "Hidup itu dibawa santai aja, Nak.",
  colors: { hair: "#767676", top: "#f6f6f6", bottom: "#6e6e6e", shoe: "#4a4a4a", skin: "#efefef", accent: "#cfcfcf" },
  hair: {
    long: false,
    bald: true,
    sideClosed: true, // potongan rambut kecil: garis luar utuh // kepala botak: tampak belakang menggambar kulit kepala + sisa rambut di tengkuk
    shapes: {
      hairBack: "M90,150 L96,150 L96,160 L90,160 Z",
      hairBackView: "M90,156 C98,174 118,186 150,187 C182,186 202,174 210,156 C200,168 180,176 150,176 C120,176 100,168 90,156 Z",
      // sisa rambut tipis di atas telinga
      hairFront: "M90,121 C86,130 85,145 88,156 C91,158 94,157 96,154 C94,145 94,132 97,123 C95,120 92,119 90,121 Z M210,121 C214,130 215,145 212,156 C209,158 206,157 204,154 C206,145 206,132 203,123 C205,120 208,119 210,121 Z",
      hairBackSide: "M94,170 C96,184 104,194 116,198 C118,190 120,180 120,170 C110,172 102,172 94,170 Z",
      hairFrontSide: "M126,152 C128,142 136,136 146,136 C154,136 158,140 160,146 C154,144 146,144 140,146 C134,148 130,152 126,152 Z",
    },
    shineFront: "M0,0", shineBack: "M0,0", shineSide: "M0,0",
    frontShade: "M0,0",
    frontStrands: "M89,132 L95,130 M88,142 L94,141 M206,130 L212,132 M207,141 L213,142",
  },
  ears: { front: ["l", "r"], side: true, back: ["l", "r"] },
  ahoge: null,
  face: { mustache: true, baldShine: true },
  top: "singlet",       // kutang
  sleeves: "none",
  bottom: "sarong",
  legwear: null,
  shoes: "sandal",
  build: { armDX: 14, armRest: 12 },  // perut buncit -> lengan sedikit keluar
  // wajah default: mata setengah (santai/ngantuk), mulut datar di bawah kumis
  expr: { neutral: { eyes: "half", mouth: "flat", sweat: false } },
};
