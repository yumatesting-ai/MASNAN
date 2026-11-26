# Workflow Pembuatan Video (dari ide sampai upload)

Pegangan standar untuk SEMUA konten animasi-2d. Ikuti urutan ini; langkah yang ditandai ✅ sudah didukung alat
di skill ini, ⏳ = belum ada alatnya (kerjakan manual / tambahkan saat dibutuhkan).

## 1. Tentukan topik & gaya
Topik menentukan gaya visual. Gaya skill ini: kartun chibi kampung Indonesia (abu-abu atau `WARNA=1`).
Lokasi tersedia: kampung, warung, lapangan, masjid, posronda, kamar (konten kecantikan/tutorial).

## 2. Riset & cek fakta ⏳
Setiap angka/klaim dicek ke sumber primer (WHO, NASA, jurnal, situs pemerintah). Sumber tidak jelas = klaim tidak dipakai.
Catat sumber di file naskah episode.

## 3. Tulis naskah
Pola (konten edukasi):
- **Hook 0–3 dtk**: klaim mengejutkan, menyapa penonton langsung
- **Fakta**: 2–3 angka bertingkat, masing-masing dengan pembanding visual
- **Masalah**: 2–3 poin
- **Twist**: statistik buruk → dibalik jadi harapan ("19 juta → tapi 80% bisa dicegah")
- **Solusi**: 4–5 poin pendek yang bisa langsung dilakukan
- **Penutup**: kalimat emosional + ajakan komentar ("Comment 1, 2 or 3")
Shorts: ±150–175 kata (±60 dtk). Audiens luar negeri: bahasa Inggris.
Konten komedi/dialog: hook lucu → eskalasi → punchline → reaksi.

## 4. Voiceover ElevenLabs ✅
- Hapus label bagian, angka ditulis huruf, tiap bagian satu paragraf (bisa di-generate ulang terpisah).
- Eleven v3: tag `[curious]`, `[serious]`, `[hopeful]`, `[pause]`, HURUF KAPITAL untuk penekanan.
- Narator hangat, Stability: Natural. Dialog: menu *Text to Dialogue*, satu suara per tokoh.
- Kirim mp3 + **teks persis** yang dipakai (Claude tidak bisa mendengar audio).

## 5. Sinkronisasi timing ✅
Jeda audio dideteksi → tiap kalimat dipetakan ke detiknya (proporsional suku kata) → shot berganti di jeda,
`dialog[].at/dur` diisi dari audio, lip sync diregangkan mengikuti durasi asli.

## 6. Animasi
Aturan:
- Visual berganti tiap 1–5 dtk; kamera selalu bergerak pelan (push-in/pan), tidak pernah diam ✅ (`camkeys`)
- Maks 6 kata per layar untuk teks besar ✅ (`fx` text)
- Subtitle kata per kata, 1 kata kunci amber ⏳ (sekarang per kalimat)
- Safe area 9:16: teks tidak di 12% atas & 20% bawah (UI TikTok/Reels) ⏳ dicek manual di pratinjau
- Lingkungan hidup, tidak menembus benda (`--check`) ✅

## 7. Cek kualitas ✅
`tools/episode.js <ep>.json --check 1` lalu `--preview` di momen terpadat: teks terpotong, tokoh tertutup,
props salah, lengan putus. **Kirim pratinjau + naskah ke kreator, render HANYA setelah disetujui.**

## 8. Render & audio
- Render ✅ (`WARNA=1 node tools/episode.js <ep>.json --audio vo.mp3 --out x.mp4`), saat ini 900×1600 30 fps
  ⏳ target 1080×1920
- Musik latar −20 dB di bawah VO, SFX (whoosh transisi, klik checklist, glitch twist) ⏳

## 9. Distribusi ⏳
Satu konten → 3 format: YouTube panjang (16:9, 3–5 mnt), YouTube Shorts, Reels FB/IG.

## 10. Caption & upload ⏳
Caption: ulang hook, 3–4 poin + emoji + angka kunci, pertanyaan pancingan komentar, ajakan save/share,
8–11 hashtag. Konten kesehatan/kecantikan: "Educational only, not medical advice." Konten affiliate:
sebut produk + "cek keranjang kuning".
