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
tools/check.js    QA numerik: lompatan parameter antar frame & sambungan loop
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
3. **QA sebelum menyerahkan**:
   - Visual: `tools/sheet.js --mode clip --clip <nama> --frames 8` — bagian tidak hilang/tertutup,
     outline tidak terdistorsi, tidak ada garis ganda, tidak terpotong tepi kanvas.
   - Numerik: `node tools/check.js` — daftar parameter yang melompat antar frame (termasuk sambungan loop).
     Yang tersisa hanya boleh gerak cepat yang disengaja (lari, ayunan lompat).
4. **Menyusun adegan**: pilih `view` + `expr` + klip. Pose bisa memakai preset ekspresi (`expr`) lalu
   menimpa field tertentu (mis. `{ expr: "happy", mouth: "o" }`).
5. **Menambah klip baru**: tambah `{ duration, view, smooth?, pose(t) }` di `animations.js`. Aturan wajib
   agar gerak halus dan tidak "error":
   - **Loop mulus**: periode `wave(t, P)` harus membagi `duration`; keyframe di t=0 sama dengan t=duration.
   - **Jangan melompatkan nilai**: perpindahan posisi pakai `kf(t, [[waktu, nilai, easing], ...])`
     (easing `io`, `out`, `in`, `back`, `lin`), bukan `t < x ? a : b`.
   - **Ganti ekspresi didahului kedip/pejam singkat** (2–5 frame) agar tidak terasa memotong.
   - Akting: ancang-ancang -> aksi -> mendarat (squash/stretch), gerak sekunder lewat `life(t, periode)`.
   - Getaran cepat (gemetar, isak) periodenya >= 0.15 dtk dan set `smooth` kecil (0.015) agar tidak hilang.
   - Renderer selalu memakai `samplePose()` yang menambah penghalusan gaussian (sadar-loop) dan
     **follow-through otomatis** (ahoge & rambut tertinggal mengikuti kepala) — tidak perlu animasi ahoge manual.
   - Setelah membuat klip, jalankan cek lompatan per frame (lihat bagian QA) dan contact sheet.
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
  Lengan baju hanya ikut berputar 60% (`SLEEVE_K`) dan lengan berputar dari dalamnya, agar tidak "mengepak".
- Video default 60fps (`--fps 30` untuk file lebih kecil).
- Tampak `three`/`side` menghadap kiri; pakai `flip` untuk kanan. Teks efek dibuat path agar tidak bergantung font.

## Kanvas
viewBox `300×400`, lantai di y≈382. `--scale 3` → 900×1200 px. Untuk video konten vertikal 9:16,
komposisikan karakter di adegan (latar, teks) pada langkah berikutnya.
