// Desain karakter: BIMA (laki-laki) — rambut pendek jabrik hitam + jambul, hoodie, celana pendek.
module.exports = {
  id: "bima",
  name: "Bima",
  gender: "laki-laki",
  colors: { hair: "#2f2f2f", top: "#7a7a7a", bottom: "#4a4a4a", shoe: "#fafafa", skin: "#efefef", sock: "#fafafa", accent: "#fafafa" },
  hair: {
    long: false,
    shapes: {
      // di belakang kepala (tampak depan/3-4)
      hairBack: "M150,70 C200,70 224,100 220,145 C218,158 214,166 208,170 L92,170 C86,166 82,158 80,145 C76,100 100,70 150,70 Z",
      // tampak belakang: menutup kepala, ujung tengkuk jabrik
      hairBackView: "M150,70 C200,70 226,100 222,150 C221,170 216,184 208,192 L200,202 L190,194 L180,204 L170,196 L160,205 L150,197 L140,205 L130,196 L120,204 L110,194 L100,202 L92,192 C84,184 79,170 78,150 C74,100 100,70 150,70 Z",
      // poni jabrik, cambang pendek -> kedua telinga terlihat
      hairFront: "M84,154 C76,102 106,68 150,68 C196,68 226,102 216,154 C213,144 210,134 206,126 L200,140 L194,118 L184,134 L174,112 L164,130 L152,108 L142,128 L130,110 L120,130 L110,114 L102,136 L96,124 C92,134 88,144 84,154 Z",
      hairBackSide: "M150,68 C108,68 84,98 86,146 C88,172 96,190 110,198 L120,204 L126,196 L150,150 Z",
      hairFrontSide: "M86,146 C84,98 110,68 152,68 C194,68 218,98 214,132 L206,122 L200,136 L190,116 L182,132 L172,112 L164,128 L156,112 L148,130 C142,136 136,146 132,156 C126,172 118,186 108,194 C96,186 88,170 86,146 Z",
    },
    shineFront: "M100,102 C120,84 180,84 200,102",
    shineBack: "M96,100 C118,82 182,82 204,100",
    frontShade: "M70,150 C80,150 86,160 88,180 L70,180 Z",
    frontStrands: "M150,72 C144,84 142,96 146,106 M176,76 C184,86 188,96 190,106 M122,80 C114,90 110,102 110,112",
    backStrands: null,
    backViewStrands: "M150,72 L150,92 M120,84 C112,110 110,150 116,186 M180,84 C188,110 190,150 184,186",
    sideStrands: "M150,72 C128,80 110,100 104,130 M172,76 C182,86 188,96 190,106",
    sideBackStrands: null,
  },
  ears: { front: ["l", "r"], side: true, back: ["l", "r"] },
  ahoge: "spike",
  top: "hoodie",
  sleeves: "long",
  bottom: "shorts",
  legwear: "socks",
  shoes: "sneaker",
  // sifat: santai & usil -> wajah default senyum miring, tidak berkeringat
  expr: { neutral: { mouth: "smirk", sweat: false } },
};
