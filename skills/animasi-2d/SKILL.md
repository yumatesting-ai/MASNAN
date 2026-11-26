---
name: animasi-2d
description: Membuat konten animasi 2D dari karakter chibi rig vektor (SVG) milik kreator — Nana, Bima, Rara, Pak Hasan, Buk Atin, atau karakter baru — dengan 18 ekspresi, 4 tampak (depan, 3/4, samping, belakang), 27 klip gerak, dan adegan multi-karakter, dirender ke PNG/MP4. Gunakan saat user minta membuat/menggerakkan karakter animasi 2D, menambah karakter/baju/rambut/ekspresi/gerakan/tampak baru, atau merender klip/adegan untuk konten.
---

# Animasi 2D — Karakter Rig Chibi

Semua karakter dibangun dari **satu mesin rig SVG** (`engine/chibi-rig.js`). Bagian badan (rambut belakang,
kepala, ahoge, lengan, badan, kaki) adalah grup terpisah dengan pivot sendiri, digerakkan objek **pose**.
Perbedaan antar karakter ada di **desain** (`characters/<nama>/design.js`): rambut, atasan, lengan,
bawahan, kaus kaki, sepatu, warna, aksesori, ekspresi default. Klip animasi (`engine/clips.js`) =
fungsi `waktu → pose`, dipakai bersama oleh semua karakter.

## Karakter
| id | Nama (lengkap) | Gender | Rambut | Pakaian |
|---|---|---|---|---|
| `nana` | Nana (Nana Kirana) — tokoh utama, si canggung | perempuan | panjang abu tua, poni runcing, ahoge ikal | kaos putih, celana panjang, sneakers |
| `bima` | Bima (Bima Saputra) — sahabat Nana, si usil | laki-laki | pendek jabrik hitam, jambul | hoodie lengan panjang, celana pendek, kaus kaki, sneakers |
| `rara` | Rara (Rara Ayudia) — teman sekelas, si manis | perempuan | bob terang, poni lurus, jepit rambut | sweater kerah bulat, rok lipit, kaus kaki panjang, sepatu hitam |
| `hasan` | Pak Hasan (Hasan Basri) — bapak komplek, si santai | laki-laki dewasa | botak + kumis tebal | kutang, perut buncit, sarung kotak-kotak, sandal jepit |
| `atin` | Buk Atin (Hartini) — ibu warung, ratu gosip | perempuan dewasa | dicepol + kacamata | badan gemuk, daster motif bunga, sandal jepit |

Lihat `characters/<nama>/CHARACTER.md` untuk ciri wajib dan profil (sifat, hobi, kalimat khas) tiap karakter.
Pakai profil itu saat menulis dialog/cerita agar kepribadian konsisten. Data profil juga ada di `design.js`
(`fullName`, `role`, `personality`, `hobbies`, `catchphrase`).

## Struktur
```
engine/chibi-rig.js   createRig(design) -> { drawCharacter, drawPart, resolvePose, EXPRESSIONS, ... }
engine/clips.js       CLIPS bersama + samplePose (penghalusan & follow-through) + kf/EASE
engine/timeline.js    rangkaian aksi per karakter (fase berurutan + blend + gerak antar titik)
engine/extras.js      figuran acak (kerudung, peci, caping, sarung, daster) untuk latar
characters/<nama>/
  design.js           desain karakter (lihat format di bawah)
  CHARACTER.md        model sheet: ciri wajib, palet, sifat
  rig.js              createRig(design)       animations.js   klip bersama (+ klip khusus)
  reference.jpg       gambar referensi (jika ada)
tools/render.js       klip -> MP4, pose -> PNG (satu karakter)
tools/scene.js        adegan multi-karakter berdampingan -> MP4/PNG
tools/sheet.js        contact sheet (ekspresi / tampak / frame klip)
tools/check.js        QA numerik: lompatan parameter antar frame & sambungan loop
tools/location.js     lokasi kampung 2.5D + karakter di dalamnya -> PNG/MP4 (landscape/portrait)
engine/world3d.js     mesin 2.5D (kamera perspektif, bidang berarsir, kabut, sprite)
engine/props.js       perlengkapan kampung (rumah, pohon, pagar, tiang, gapura, perabot)
locations/<id>.js     lokasi: kampung, warung, lapangan, masjid, posronda
```

## Alur kerja
1. **Baca `CHARACTER.md` karakter yang dipakai.** Ciri wajib tidak boleh berubah antar konten.
2. **Render**:
   ```bash
   node tools/render.js --char bima --clip wave --out out/bima-wave.mp4
   node tools/render.js --char rara --pose '{"expr":"happy","view":"three"}' --out out/rara.png
   node tools/render.js --char nana --clip walk --label "jalan"     # label di bawah gambar
   node tools/render.js --char nana --clip idle --bg none           # latar transparan
   node tools/render.js --list                                      # daftar klip & ekspresi
   node tools/scene.js --cast "nana:wave,bima:happy,rara:shy" --label "Halo!" --out out/trio.mp4
   node tools/scene.js --cast "nana:walk:flip,rara:walk" --png out/frame.png --t 0.3
   node tools/scene.js --cast "nana:idle,bima:idle,rara:idle" --names   # nama di bawah tiap karakter
   ```
   Contact sheet: `node tools/sheet.js --char rara --mode expr|views` atau `--mode clip --clip jump --frames 6`.
3. **QA sebelum menyerahkan**:
   - Visual: contact sheet — bagian tidak hilang/tertutup, tidak ada garis ganda, tidak terpotong kanvas.
   - Numerik: `node tools/check.js` — yang tersisa hanya gerak cepat yang disengaja (lari, ayunan lompat).
4. **Menyusun adegan**: pilih karakter + `view` + `expr` + klip. Pose bisa memakai preset (`expr`) lalu
   menimpa field tertentu (mis. `{ expr: "happy", mouth: "o" }`); nilai `undefined` = pakai preset.

## Menambah karakter baru
1. Salin folder karakter yang paling mirip (`characters/rara` untuk rambut pendek/bob, `nana` untuk panjang).
2. Ubah `design.js`:
   - `colors`: `hair`, `top`, `bottom`, `shoe`, `skin`, `sock`, `accent` (bayangan dihitung otomatis).
   - `hair.long` (rambut panjang menutup punggung di tampak belakang), `hair.shapes`:
     `hairBack` (di belakang kepala), `hairFront` (atap + poni), `hairBackSide`, `hairFrontSide`
     (samping, digambar menghadap kanan), opsional `hairBackView` (tampak belakang, harus menutup kepala).
     Garis helai: `frontStrands`, `backStrands`, `backViewStrands`, `sideStrands`, `sideBackStrands`.
   - `ears`: `{ front: ["l","r"], side: true, back: [...] }` — telinga yang tidak tertutup rambut.
   - `ahoge`: `"curl"` | `"spike"` | `null`. `accessory`: `{ front, side, back }` -> SVG (jepit, pita, kacamata).
   - `top`: `"tee"` | `"hoodie"` | `"sweater"` | `"singlet"` (kutang + perut buncit) | `"daster"` (badan gemuk);
     `sleeves`: `"short"` | `"long"` | `"none"`;
     `bottom`: `"pants"` | `"shorts"` | `"skirt"` | `"sarong"` | `"none"` (tertutup daster);
     `legwear`: `null` | `"socks"` | `"kneeSocks"`; `shoes`: `"sneaker"` | `"dark"` | `"sandal"`.
   - `face`: `{ mustache, glasses, doubleChin, baldShine }` — ciri wajah yang mengikuti posisi mata/mulut tiap tampak.
     `hair.bald: true` untuk kepala botak (tampak belakang menggambar kulit kepala).
   - `build`: `{ armDX, armRest, scale }` — badan lebar: lengan bergeser keluar (px) & membuka saat istirahat (deg);
     `scale` = tinggi relatif (anak 1, Buk Atin 1.2, Pak Hasan 1.28). Karakter diperbesar dari titik pijak,
     kanvasnya (`rig.CANVAS`) otomatis melebar ke atas & samping, tebal garis tetap sama. Alat render/sheet/scene
     menyesuaikan sendiri.
   - `expr`: override preset per karakter (sifat), mis. `{ neutral: { mouth: "smirk", sweat: false } }`.
3. Koordinat kepala tetap: wajah elips (150,140) rx64 ry58, mata y≈148, poni sebaiknya berakhir y≈110–130.
4. Cek: `sheet.js --char <id> --mode views`, `--mode expr`, beberapa klip (`wave`, `walk`, `jump`), lalu
   tulis `CHARACTER.md`. Pakaian/rambut jenis baru ditambahkan di mesin (`BODY_SHAPES` + cabang di
   `frontish()`/`side()`), bukan disalin per karakter.

## Lingkungan kampung 2.5D (`locations/`)
Dunia 3D sederhana (satuan meter) diproyeksikan dengan perspektif kamera ke SVG bergaya seri: bidang diarsir
cel sesuai arah cahaya, kabut atmosfer di kejauhan, garis menipis menjauh. Karakter dimasukkan sebagai sprite
pada posisi 3D — ukurannya otomatis sesuai jarak dan urutan depan-belakang benar.

| id | Lokasi | Titik berdiri (spots) |
|---|---|---|
| `kampung` | Jalan kampung: jalan cor retak, rumah tembok/papan/bilik bambu, atap genteng & seng, teras + bale, pagar bambu/tanaman, pisang-kelapa-mangga, jemuran, tiang listrik kayu, ayam, gapura "SELAMAT DATANG" | depan, kiri, kanan, tengah, jauh, pinggir_kiri, pinggir_kanan |
| `warung` | Warkop Bu Atin (warkop kampung sederhana): kios papan kecil beratap seng + tiang kayu, spanduk "WARKOP BU ATIN", meja jualan kayu (toples kerupuk, termos, gelas kopi, gorengan), kompor + ceret, renceng kopi bergoyang, rak & kalender, bangku panjang pelanggan, meja di bawah pohon, kursi plastik, galon & gas | balik_etalase (y 0.15), depan, bangku, meja, jalan_kiri, jalan_kanan, samping |
| `lapangan` | Lapangan bola kampung: tanah berumput, gawang bambu, sandal, pagar bambu, masjid jauh | tengah, kiri, kanan, pinggir, gawang_kiri, gawang_kanan, jauh |
| `masjid` | Masjid kampung beratap tumpang + mustaka, serambi, bedug, kentongan, toa | gerbang, setapak, halaman_kiri, halaman_kanan, serambi, depan, bedug |
| `posronda` | Pos ronda bambu: bale, atap seng, kentongan, papan catur & kopi, lampu bohlam | depan, kiri, kanan, jalan, jalan_kanan, samping |

```bash
node tools/location.js --list
node tools/location.js --loc kampung --png out/kampung.png                       # latar kosong
node tools/location.js --loc warung --cast "atin:talk@balik_etalase,hasan:laugh@bangku" --seconds 3 --out out/warung.mp4
node tools/location.js --loc kampung --cast "nana:walk_front@jauh>depan" --seconds 4 --out out/pulang.mp4   # berjalan
node tools/location.js --loc kampung --format portrait --cast "nana:idle@depan" --png out/reels.png        # 9:16
```
Cast: `karakter:klip@titik[:flip]`; titik bisa nama spot atau `"x,z"` (meter); `a>b` = bergerak dari a ke b.
Spot boleh punya `y` (berdiri di lantai yang lebih tinggi). Bidang besar yang menaungi benda lain (atap) diberi
`bias` negatif agar digambar setelah dinding di bawahnya; sprite di depannya (pohon) diberi bias lebih negatif.

Menambah lokasi: buat `locations/<id>.js` dengan `{ id, name, camera, spots, build(w) }`. Bangun dengan
primitif `engine/world3d.js` (`box`, `gable` (genteng/`seng`), `hip` (limas/tajug, `top` untuk bertingkat),
`prism`, `dome`, `arch`, `texture` (`plank`/`bamboo`/`seng`), `ground`, `line3` (kabel: `sag`), `sprite`, `text`)
dan perlengkapan `engine/props.js` (`house` dengan `wall: plaster|plank|bamboo`, `roof: genteng|seng`, `teras`,
`bale`, `fence: bamboo|bush`, `jemuran`; `villageRoad`, `tree` (`round|palm|banana`), `bush`, `poles`, `bulbLamp`,
`gapura`, `bench`, `table`, `bale`, `glassOfCoffee`, `chicken`; tanaman: `bush` (semak berarsir, `flowers`),
`flowerClump` (rumpun bunga liar), `grassTuft` (rumput melengkung), `potPlant` (pot kaleng/ember)). Pohon, semak, rumput
& bunga bergoyang tertiup angin memakai `w.t` (diisi otomatis oleh `tools/location.js`). Gaya: kampung sederhana, jangan terlalu modern.
Sumbu: X kanan, Y atas, Z menjauh dari kamera; jalan kampung di sekitar x=0. Anak tinggi ±1.15 m.

## Aksi sehari-hari & rangkaian aksi
Rig mendukung **siku** (`elbowL/elbowR`), **barang di tangan** (`holdL/holdR`: `coffee`, `phone`; `hold: "newspaper"`
dua tangan; `holdTilt` untuk menyeruput), dan **duduk** (`sit` 0..1 + `seat` tinggi kursi dalam meter: badan naik ke
kursi, kaki memendek/menggantung; tampak samping: paha mendatar, betis turun dari lutut).

| Kategori | Klip |
|---|---|
| Duduk | `sit`, `sit_side`, `sit_back` (membelakangi kamera), `sit_sleepy` |
| Ngopi | `sit_drink` (angkat gelas -> seruput mata terpejam -> "ahh"), `sit_drink_side`, `drink` (berdiri) |
| Baca / HP | `sit_read`, `read` (koran: sesekali diturunkan untuk melirik, balik halaman), `phone`, `sit_phone` |
| Ngobrol | `chat_a` + `chat_b` (berdiri), `sit_chat_a` + `sit_chat_b` (duduk): A bicara dengan gestur lalu B; yang mendengar mengangguk/tertawa. Pasang A & B saling berhadapan (`:flip` untuk menghadap kanan) |
| Lain | `walk_back`, `stretch` (ngulet + menguap), `scratch_head` (garuk kepala), `point` (menunjuk) |

**Rangkaian aksi** (`engine/timeline.js`) — di `tools/location.js`, tiap karakter boleh punya beberapa fase:
```bash
node tools/location.js --loc warung --out out/ngopi.mp4 --cast \
  "hasan:walk@jalan_kiri>duduk_meja/3+sit_drink/4.8+sit_read/6,atin:chat_b@balik_etalase/14:flip"
node tools/location.js --loc posronda --out out/ronda.mp4 --cast \
  "hasan:sit_read@duduk_bale/6+sit_chat_b/9.6:flip,bima:walk@jalan_kanan>duduk_bale2/2.6+sit_drink_side/3.4+sit_chat_a/9.6"
```
- Fase: `klip[@titik | @dari>ke][/detik]`, dipisah `+`. Tanpa titik = tetap di posisi terakhir.
- `walk` memilih otomatis jalan samping (dan arah hadapnya), `walk_front` (mendekat) atau `walk_back` (menjauh).
- Antar fase di-blend 0.35 dtk -> berdiri ke duduk menjadi gerakan duduk yang halus.
- Titik duduk punya `seat`: warung `duduk_meja` (menghadap kamera, di balik meja), `duduk_depan_meja(2)` (pakai
  `sit_back`); posronda `duduk_bale(2)`; kampung `duduk_bangku(2)`; masjid `duduk_serambi(2)`; lapangan `duduk_pinggir(2)`.
- Agar dua karakter ngobrol bergantian, mulai fase `chat_a`/`chat_b` pada detik yang sama.
- Pose siku: + = lengan bawah naik ke dada/wajah untuk lengan yang menggantung; untuk lengan terangkat (>90°) pakai
  nilai negatif agar tangan mengarah ke kepala (garuk kepala, ngulet).

## Figuran (karakter latar)
`engine/extras.js` membuat figuran acak dari `seed` + jenis (`bapak`, `ibu`, `pemuda`, `pemudi`, `anak_laki`,
`anak_perempuan`, `kakek`, `petani`): kombinasi rambut/kerudung/peci/caping, pakaian, warna, dan tinggi berbeda.
Tiap lokasi punya daftar `extras: [{ seed, kind, spec, flip?, phase? }]` — `spec` memakai sintaks rangkaian aksi dan
diulang terus (pejalan kaki lalu-lalang, ibu-ibu ngobrol, anak main bola, jamaah keluar-masuk, pelanggan warkop).

Gaya tampil di `tools/location.js`:
- `--extras-style shadow` (bawaan): **siluet abu polos + sedikit buram**, tanpa wajah/efek — suasana ramai tapi
  tidak bersaing dengan tokoh utama; makin jauh makin pudar.
- `--extras-style blur`: bentuk asli diburamkan (efek fokus kamera). `detail`: tampil penuh seperti tokoh utama.
- `--extras off`: tanpa figuran. Semua karakter juga diberi kabut jarak (makin jauh makin pudar).

## Menambah klip (engine/clips.js)
`{ duration, view, smooth?, pose(t) }`. Aturan agar gerak halus dan tidak "error":
- **Loop mulus**: periode `wave(t, P)` membagi `duration`; keyframe di t=0 sama dengan t=duration.
- **Jangan melompatkan nilai**: pakai `kf(t, [[waktu, nilai, easing], ...])` (easing `io|out|in|back|lin`).
- **Ganti ekspresi didahului kedip/pejam singkat** (2–5 frame).
- Akting: ancang-ancang -> aksi -> mendarat (squash/stretch); gerak sekunder lewat `life(t, periode)`.
- Getaran cepat periodenya >= 0.15 dtk dan set `smooth` kecil (0.015).
- `samplePose()` menambah penghalusan gaussian (sadar-loop) dan follow-through otomatis ahoge/rambut.
- Klip khusus satu karakter: tambahkan di `characters/<nama>/animations.js` (spread dari klip bersama).

## Menambah ekspresi / tampak
- Ekspresi: varian mata `eye()`, mulut `mouth()`, efek `faceExtras/aboveFx`, lalu preset di
  `BASE_EXPRESSIONS` (engine). Berlaku untuk semua karakter.
- Tampak: bentuk di `BODY_SHAPES`/desain, tata letak wajah di `LAYOUT`, fungsi gambar di engine.

## Aturan gaya
- Seri grayscale: warna desain abu-abu kecuali user minta warna. Bedakan karakter lewat nilai gelap-terang,
  siluet rambut, dan jenis pakaian.
- Shading cel: isi -> blok bayangan (clip-path ke `SHAPE`) -> garis luar. ID clipPath diberi prefix id karakter.
- Stroke 3px, `stroke-linejoin="round"`. Bentuk yang di-scale memakai `vector-effect="non-scaling-stroke"`.
- Urutan lapisan: rambut belakang → kaki → lengan → badan → lengan baju → kepala (wajah, poni, ahoge).
- Lengan terangkat >~130° tertutup kepala; melambai/angkat tangan ±100–125°. Lengan baju pendek ikut
  berputar 60% (`SLEEVE_K`), lengan panjang ikut penuh.
- Video default 60fps (`--fps 30` untuk file lebih kecil).
- Tampak `three`/`side` menghadap kiri; pakai `flip` untuk kanan. Teks efek dibuat path (tidak bergantung font).

## Kanvas
Per karakter viewBox `300×400`, lantai y≈382. `--scale 3` → 900×1200 px. Adegan: lebar 300 per karakter
(`--gap` untuk jarak). Untuk video vertikal 9:16 dengan latar/teks, komposisikan di langkah berikutnya.
