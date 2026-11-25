# Nana — Model Sheet

Referensi turnaround: `reference.jpg` (6 tampak: depan, 3/4 depan, samping, 3/4 belakang, belakang, menunduk).

## Ciri wajib (jangan diubah antar konten)
- **Gaya**: chibi, grayscale penuh, outline gelap tebal (`#2a2a2a`, 3px), tanpa gradasi.
- **Proporsi**: kepala ±40% tinggi badan; badan pendek, kaki lurus.
- **Rambut**: panjang sampai pinggang, abu tua `#5b5b5b`, ujung bergelombang, poni runcing menutup dahi,
  helai samping kiri menutupi telinga kiri; telinga kanan terlihat.
- **Ahoge**: satu helai ikal di puncak kepala, selalu ada, ikut memantul saat bergerak.
- **Mata**: oval putih horizontal, pupil titik kecil di sisi dalam (ekspresi "kosong").
- **Mulut default**: `:3`. Tetes keringat di pipi kanan (ciri khas canggung).
- **Pakaian**: kaos putih lengan pendek (bahu landai, garis leher melengkung, potongan sedikit A-line), celana panjang abu tua `#4e4e4e`, sepatu putih.

## Bagian rig (`rig.js`)
| Grup | Pivot | Parameter pose |
|---|---|---|
| `hair-back` | puncak kepala | `hairSway` |
| `head` | leher (150,200) | `headTilt`, `headY`, `blink`, `lookX`, `mouth`, `sweat` |
| `ahoge` | pangkal ahoge | `ahoge` |
| `arm-*` (kulit, di belakang badan) + `sleeve-*` (lengan baju, di depan badan) | bahu (118,208) | `armL`, `armR` (+ = ayun ke luar, ±120 = angkat/melambai) |
| `torso` | pinggang | `breathe` |
| seluruh badan | — | `bodyY` |

Mulut: `cat` (:3), `open`, `flat`.

## Status tampak
- [x] Depan (`front`)
- [ ] 3/4 depan, samping, 3/4 belakang, belakang, menunduk
