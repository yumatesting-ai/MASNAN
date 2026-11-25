---
name: animasi-2d
description: Membuat konten animasi 2D dari karakter rig vektor (SVG) milik kreator — pose, ekspresi, dan klip animasi (idle, melambai, gugup, dll) dirender ke PNG/MP4. Gunakan saat user minta membuat/menggerakkan karakter animasi 2D, menambah ekspresi/gerakan/tampak baru, atau merender klip untuk konten.
---

# Animasi 2D — Karakter Rig

Karakter dibangun sebagai **rig SVG**: setiap bagian (rambut belakang, kepala, ahoge, lengan, badan, kaki)
adalah grup terpisah dengan pivot sendiri dan digerakkan oleh objek **pose**. Klip animasi = fungsi
`waktu → pose`. Renderer menangkap tiap frame dengan Playwright lalu menyatukannya dengan ffmpeg.

## Struktur
```
characters/<nama>/
  CHARACTER.md    model sheet: ciri wajib, palet, bagian rig, status tampak
  reference.jpg   gambar referensi asli dari kreator
  rig.js          drawCharacter(view, pose, opts) -> string SVG; EXPRESSIONS; SHAPE; LAYOUT
  animations.js   CLIPS { nama: { duration, view, pose(t) } }
tools/render.js   render klip -> MP4, atau pose -> PNG
tools/sheet.js    contact sheet (ekspresi / tampak / frame klip) untuk cek visual
```

## Alur kerja
1. **Baca `CHARACTER.md` dulu.** Ciri wajib karakter tidak boleh berubah antar konten (konsistensi model).
2. **Render pose / klip**:
   ```bash
   node tools/render.js --char nana --clip idle --out out/idle.mp4
   node tools/render.js --char nana --clip wave --fps 30 --scale 3 --loops 3
   node tools/render.js --char nana --pose '{"expr":"happy","view":"three"}' --out out/pose.png
   node tools/render.js --char nana --clip walk --label "jalan"   # label teks di bawah
   node tools/render.js --char nana --clip idle --bg none          # latar transparan
   node tools/render.js --list                                     # daftar klip & ekspresi
   ```
   Contact sheet untuk cek cepat:
   ```bash
   node tools/sheet.js --mode expr  --out out/ekspresi.png   # semua preset ekspresi
   node tools/sheet.js --mode views --out out/tampak.png     # semua tampak + flip
   node tools/sheet.js --mode clip --clip jump --frames 6    # potongan frame klip
   ```
3. **Selalu cek hasil secara visual** sebelum menyerahkan (`tools/sheet.js --mode clip`):
   bagian tidak hilang/tertutup, outline tidak terdistorsi, tidak ada garis ganda, loop mulus.
4. **Menyusun adegan**: pilih `view` + `expr` + klip. Pose bisa memakai preset ekspresi (`expr`) lalu
   menimpa field tertentu (mis. `{ expr: "happy", mouth: "o" }`).
5. **Menambah klip baru**: tambah entri `{ duration, view, pose(t) }` di `animations.js`. Pakai
   `wave(t, periode)` (periode harus membagi `duration` agar loop mulus), `seg/easeOut/easeInOut` untuk
   gerak berfase (ancang-ancang -> aksi -> mendarat), `blinkAt` untuk kedip, `life(t)` untuk gerak
   sekunder (napas, rambut, ahoge). Efek beranimasi pakai `fx` yang naik bilangan bulat per loop.
   Prinsip: ancang-ancang + squash/stretch, ahoge & rambut tertinggal (follow-through), jangan diam total.
6. **Menambah ekspresi**: varian mata di `eye()`, mulut di `mouth()`, efek di `faceExtras/aboveFx`,
   lalu preset di `EXPRESSIONS`. Dokumentasikan di `CHARACTER.md`.
7. **Menambah tampak (view)**: tambah bentuk di `SHAPE`, tata letak wajah di `LAYOUT`, fungsi gambar,
   daftarkan di `drawCharacter`; cocokkan dengan `reference.jpg`, perbarui `CHARACTER.md`.

## Aturan gaya
- Pakai palet `PALETTE` di `rig.js`; jangan menambah warna di luar grayscale karakter tanpa diminta.
- Shading cel: isi -> blok bayangan (clip-path ke `SHAPE`) -> garis luar. Bentuk dasar ada di `SHAPE`
  agar isi dan clipPath selalu sama. Lihat bagian Shading di `CHARACTER.md`.
- Stroke 3px, `stroke-linejoin="round"`. Bentuk yang di-scale memakai `vector-effect="non-scaling-stroke"`.
- Urutan lapisan: rambut belakang → kaki → lengan → badan → kepala (wajah, poni, ahoge).
- Lengan terangkat >~130° tertutup kepala; untuk melambai/angkat tangan pakai ±100–125°.
- Tampak `three`/`side` menghadap kiri; pakai `flip` untuk kanan. Teks efek dibuat path agar tidak bergantung font.

## Kanvas
viewBox `300×400`, lantai di y≈382. `--scale 3` → 900×1200 px. Untuk video konten vertikal 9:16,
komposisikan karakter di adegan (latar, teks) pada langkah berikutnya.
