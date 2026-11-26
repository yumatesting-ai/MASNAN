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
    bald: true, // kepala botak: tampak belakang menggambar kulit kepala + sisa rambut di tengkuk
    shapes: {
      hairBack: "M84,150 C82,170 86,186 96,194 L102,150 Z M216,150 C218,170 214,186 204,194 L198,150 Z",
      hairBackView: "M88,152 C94,172 114,188 150,190 C186,188 206,172 212,152 C200,166 182,174 150,174 C118,174 100,166 88,152 Z",
      // sisa rambut tipis di atas telinga
      hairFront: "M87,158 C85,145 87,132 93,122 C96,133 98,145 99,156 Z M213,158 C215,145 213,132 207,122 C204,133 202,145 201,156 Z",
      hairBackSide: "M92,166 C92,184 100,196 114,200 C120,190 124,178 126,166 C114,168 100,168 92,166 Z",
      hairFrontSide: "M122,150 C118,138 122,126 130,120 C136,132 138,142 136,152 Z",
    },
    shineFront: "M0,0", shineBack: "M0,0", shineSide: "M0,0",
    frontShade: "M0,0",
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
