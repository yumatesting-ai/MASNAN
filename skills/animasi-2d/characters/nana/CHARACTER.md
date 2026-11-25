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
- **Pakaian**: kaos putih lengan pendek (bahu landai, garis leher melengkung, potongan sedikit A-line; garis jahitan lengan hanya setengah dari ketiak, penuh saat lengan diangkat), celana panjang abu tua `#4e4e4e`, sepatu putih.

## Shading (cel, tanpa gradasi)
Bayangan berupa blok warna tegas, satu tingkat lebih gelap, dipotong (clipPath) ke bentuk masing-masing:
- Rambut: kilau putus-putus melengkung di puncak (`hairShine`), rambut belakang lebih gelap (`hairBack`),
  sisi bawah rambut belakang & helai kiri pakai `hairShade`.
- Wajah: bayangan poni di dahi (bentuk poni digeser 2,7px). Leher seluruhnya `skinShade`.
- Kaos: bayangan dagu di garis leher, sisi badan di bawah ketiak, bawah lengan baju, satu lipatan kecil.
- Lengan: bawah lengan baju + sisi dalam. Celana: di bawah ujung kaos + sisi dalam kaki. Sepatu: sol.
- Bayangan lantai: elips `ground` di bawah kaki (mengecil saat badan memantul).
Arah cahaya: dari atas-depan. Jangan menambah gradasi atau warna di luar palet.

## Tampak (view)
| view | Keterangan |
|---|---|
| `front` | depan |
| `three` | 3/4, menghadap kiri layar (telinga kanan terlihat, mata jauh lebih kecil) |
| `side` | samping, menghadap kiri layar (rambut jatuh di punggung) |
| `back` | belakang (rambut menutup kepala & punggung, ahoge tetap) |

`flip: true` membalik arah hadap (efek ?, !, z tetap terbaca normal).
Belum ada: 3/4 belakang dan menunduk.

## Parameter pose (`rig.js` -> `DEFAULT_POSE`)
| Grup | Parameter |
|---|---|
| Wajah | `eyes`, `mouth`, `blink`, `lookX`, `lookY`, `blush`, `sweat`, `tears`, `anger`, `gloom`, `above`, `fx` |
| Kepala | `headTilt`, `headX`, `headY`, `hairSway` (±3), `ahoge` |
| Lengan | `armL`, `armR` — depan/3-4/belakang: + = ayun keluar (±110–125 melambai); samping: + = ke depan |
| Kaki | `legL`, `legR` — depan/3-4/belakang: angkat (px, 0–15); samping: rotasi (deg, + = ke depan) |
| Badan | `breathe`, `bodyX`, `bodyY`, `lean` (condong, pivot kaki), `squash` (+ gepeng, - memanjang) |

- **Mata**: `normal`, `closed`, `happy` (^ ^), `wide`, `sad`, `angry`, `half`, `sparkle`, `dizzy` (spiral), `cry` (> <)
- **Mulut**: `cat` (:3), `open`, `flat`, `smile`, `frown`, `o`, `grin`, `wavy`, `shout`, `smirk`
- **Efek atas kepala** (`above`): `question`, `exclaim`, `zzz`, `heart`, `sparkles`, `stars`, `music`
- **Efek wajah**: `blush` (0–1), `tears` (`drop`/`stream`), `anger` (urat marah), `gloom` (garis suram), `sweat`

## Preset ekspresi (`expr`)
neutral, smile, happy, laugh, surprised, shocked, sad, cry, angry, furious, confused, dizzy,
sleepy, smug, deadpan, shy, love, nervous. Field pose yang ditulis langsung mengalahkan preset.

## Klip animasi (`animations.js`)
| Kategori | Klip |
|---|---|
| Diam | `idle`, `idle_three`, `idle_side`, `look_around` |
| Komunikasi | `wave`, `talk`, `nod`, `shake_no` |
| Gerak | `walk` (samping), `walk_front`, `run`, `jump`, `turnaround` |
| Emosi | `happy`, `laugh`, `love`, `shy`, `sad`, `cry`, `surprised`, `shocked`, `angry`, `confused`, `dizzy`, `sleepy`, `nervous`, `smug` |
