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
  rig.js          drawCharacter(view, pose, opts) -> string SVG
  animations.js   CLIPS { nama: { duration, pose(t) } }
tools/render.js   render klip -> MP4, atau pose -> PNG
```

## Alur kerja
1. **Baca `CHARACTER.md` dulu.** Ciri wajib karakter tidak boleh berubah antar konten (konsistensi model).
2. **Render pose / klip**:
   ```bash
   node tools/render.js --char nana --clip idle --out out/idle.mp4
   node tools/render.js --char nana --clip wave --fps 30 --scale 3 --loops 3
   node tools/render.js --char nana --pose '{"blink":1,"mouth":"open"}' --out out/pose.png
   node tools/render.js --char nana --clip idle --bg none   # latar transparan (frame PNG)
   ```
3. **Selalu cek hasil secara visual** sebelum menyerahkan: ambil beberapa frame
   (`ffmpeg -i x.mp4 -vf "select='eq(n,0)+eq(n,15)+eq(n,30)',tile=3x1" -frames:v 1 sheet.png`)
   dan periksa: bagian tidak hilang/tertutup, outline tidak terdistorsi, loop mulus.
4. **Menambah klip baru**: tambah entri di `animations.js`. Gunakan `wave(t, periode)` untuk gerak
   periodik (periode harus membagi `duration` agar loop mulus) dan `blinkAt(t, [detik...])` untuk kedip.
   Tambahkan gerak sekunder (ahoge, `hairSway`, `breathe`) agar tidak kaku.
5. **Menambah ekspresi**: tambah varian di `mouths` / mata di `rig.js`, dokumentasikan di `CHARACTER.md`.
6. **Menambah tampak (view)**: buat fungsi baru di `rig.js` (mis. `side`), daftarkan di `VIEWS`,
   cocokkan dengan `reference.jpg`, perbarui checklist di `CHARACTER.md`.

## Aturan gaya
- Pakai palet `PALETTE` di `rig.js`; jangan menambah warna di luar grayscale karakter tanpa diminta.
- Stroke 3px, `stroke-linejoin="round"`. Bentuk yang di-scale memakai `vector-effect="non-scaling-stroke"`.
- Urutan lapisan: rambut belakang → kaki → lengan → badan → kepala (wajah, poni, ahoge).
- Lengan terangkat >~140° akan tertutup kepala; untuk melambai pakai ±110–135°.

## Kanvas
viewBox `300×400`, lantai di y≈382. `--scale 3` → 900×1200 px. Untuk video konten vertikal 9:16,
komposisikan karakter di adegan (latar, teks) pada langkah berikutnya.
