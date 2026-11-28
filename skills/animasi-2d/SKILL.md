---
name: animasi-2d
description: Membuat konten animasi 2D kartun chibi kampung Indonesia (channel ANIMASI RT 05) dari rig vektor SVG — tokoh Nana, Bima, Rara, Pak Hasan, Bu Atin, Pak RT, Mbah Sum, Bu Sari atau tokoh baru — di 10 lokasi 2.5D (kampung, warung, lapangan, masjid, pos ronda, kamar, sekolah, kelas hadap murid/guru, sawah), dengan 100+ klip gerak, 29 ekspresi, 4 tampak, lip sync, arah pandang, VO narator, subtitle Shorts, musik & SFX, render HD 1080x1920. Gunakan skill ini setiap kali user minta naskah/cerita lucu untuk animasi, membuat/merevisi/merender video animasi kartun, menyesuaikan animasi dengan VO, menambah tokoh/lokasi/gerakan/ekspresi, atau membuat thumbnail, foto profil, banner, Shorts untuk konten animasi — walau user tidak menyebut "skill" atau "animasi 2D".
---

# Animasi 2D — Karakter Rig Chibi

> **ATURAN KERJA (permintaan kreator): JANGAN langsung render video.**
> Urutan wajib untuk setiap konten/video baru:
> 1. Kirim naskah (alur, dialog, shot) + gambar pratinjau (`tools/episode.js --preview`) dulu.
> 2. Tunggu persetujuan/revisi kreator.
> 3. Baru render video setelah kreator bilang render/oke.
> Tes cepat cukup gambar diam, bukan video.
>
> **QA MANDIRI (permintaan kreator): setiap membuat/merevisi, periksa & perbaiki sendiri SEBELUM mengirim pratinjau.**
> `node tools/qa.js episodes/<ep>.json out/qa 1.5 8` -> lembar kontak seluruh video (frame tiap 1,5 dtk berlabel waktu).
> Periksa: tembus benda/tokoh (`--check` kini juga antartokoh), benda muncul/hilang tiba-tiba, ukuran benda berubah,
> ekspresi tidak sesuai aksi/dialog, tokoh/aksi penting terpotong frame atau tertutup benda depan, label/teks tersisa
> setelah pergantian shot, benda raksasa dekat kamera, benda yang akan dipakai (bola, barang) harus SUDAH terlihat sebelum aksi, gerakan tanpa animasi (jalan tanpa langkah), logika cerita
> (barang yang dilempar harus lepas dari tubuh, dsb). Perbaiki semuanya dulu, baru kirim.
> **STANDAR KUALITAS (permintaan kreator, berlaku untuk SETIAP video):** sebelum mengirim pratinjau, buka lembar QA
> (frame tiap 1 dtk) DAN render close-up di momen penting, lalu periksa satu per satu:
> 1. **Arah mata & kepala** — tiap tokoh benar-benar menatap yang ia perhatikan (lawan bicara, benda, kejadian);
>    tampak samping: kepala menunduk/mendongak ke arah yang benar (cek dengan render pitch -0.6/0/0.6 bila ragu).
>    Tokoh berjalan menatap arah tujuan. Tidak ada yang menatap kamera/pohon/langit tanpa alasan.
> 2. **Pegangan benda** — benda tergenggam di tangan (di balik jari), proporsi & ketebalan pantas (joran, sapu, buku).
> 3. **Tembus / terpotong / tertutup** — tokoh, benda, teks tidak menembus, tidak terpotong tepi frame, tidak tertutup
>    benda dekat kamera; tidak ada bayangan/benda raksasa dari objek di samping lensa.
> 4. **Logika aksi** — sebab-akibat terlihat (benda ada sebelum dipakai, isi wadah di DALAM wadah, makan ke mulut,
>    menulis di kertas, jalan maju searah badan), urutan cocok dengan VO.
> 5. **Kamera** — tiap shot punya gerak & sudut yang berbeda (lihat "Bahasa kamera"); tokoh utama selalu terbaca.
> 6. **Teks** — muat di kotak/papan, tidak menimpa wajah atau subtitle.
> Temukan & perbaiki sendiri dulu; kreator tidak boleh menjadi orang pertama yang menemukan bug.
> **Alur lengkap ide → upload: lihat [`docs/WORKFLOW.md`](docs/WORKFLOW.md) (10 langkah).**

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
locations/<id>.js     lokasi: kampung, warung, lapangan, masjid, posronda, kamar, sekolah, sawah, kelas, kelas_guru
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
cel sesuai arah cahaya, garis menipis menjauh, dan **perspektif atmosfer**: mulai ±5 m objek (pohon, rumah, tanah,
figuran) memudar ke abu muda `fogColor` (#dedede), ±50% di 25 m, hampir menyatu di ±40 m (`fogStart/fogRange/fogMax`
di kamera lokasi). Tokoh utama hanya terkena 35% kabut agar tetap jelas. Karakter dimasukkan sebagai sprite
pada posisi 3D — ukurannya otomatis sesuai jarak dan urutan depan-belakang benar.

**Bayangan & pencahayaan.** Matahari dari kiri-atas menjatuhkan bayangan lembut ke tanah: `box/gable/prism/hip`
otomatis (matikan dengan `{ shadow: false }`), pohon & semak lewat `w.castBlob(x, z, tinggi, radius, {trunk})`,
bentuk bebas lewat `w.castPoints(titik3D)`. Karakter & figuran juga berbayangan. Bayangan ikut memudar oleh kabut.
Rumah punya pita gelap di bawah tepi atap dan kaki dinding (oklusi), langit punya siluet bukit berlapis
(`P.sky(w, { hills: false })` untuk mematikan), tanah depan diberi kerikil/petak tanah lewat
`P.groundDetail(w, x0, x1, z0, z1, jumlah, seed)`, dan render diberi vinyet halus (`vignette: false` di opsi).

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
`gapura`, `bench`, `table`, `bale`, `glassOfCoffee`, `chicken`; tanaman: `bush` (semak berarsir), `grassTuft` (rumput melengkung)).
Pohon, semak & rumput bergoyang tertiup angin memakai `w.t` (diisi otomatis oleh `tools/location.js`). Gaya: kampung sederhana, jangan terlalu modern.
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

## Episode berNarasi (konten siap unggah)

Satu episode = file JSON di `episodes/` berisi judul, format, dan daftar adegan (`loc`, `seconds`, `cast`,
`narasi`, opsional `camera`/`cameraTo` untuk pan/zoom halus, `visual` sebagai catatan naskah).

```bash
node tools/episode.js episodes/pagi-di-kampung.json --out out/pagi.mp4              # video + subtitle narasi
node tools/episode.js episodes/pagi-di-kampung.json --script out/naskah.md          # naskah .md + subtitle .srt
node tools/episode.js episodes/pagi-di-kampung.json --out out/pagi.mp4 --audio vo.mp3  # pasang rekaman suara
```

- Narasi tiap adegan dipecah per kalimat jadi subtitle; durasinya sebanding jumlah kata (±2,5 kata/detik enak
  dibacakan). Judul episode muncul 3 detik pertama.
- Suara narator: rekam sendiri mengikuti `*.srt`/naskah, atau impor `.srt` ke CapCut lalu pakai teks-ke-suara,
  kemudian render ulang dengan `--audio`. (Layanan TTS online tidak bisa diakses dari container ini.)
- Kamera: `{"x","y","z","f","horizon"}` — `f` lebih besar = zoom; `cameraTo` membuat push-in/pan pelan.
  Di format vertikal jaga subjek dalam ±2 m dari `x` kamera pada jarak ±6–7 m.
- `--cast` boleh memakai koordinat "x,z" (koma di dalam koordinat aman).

## Gerak yang masuk akal (aturan timeline)

- **Arah otomatis:** `walk`/`run` memilih tampak dari arah gerak: samping (kiri/kanan), serong (`*_three`,
  mendekat diagonal), depan (`*_front`, mendekat), belakang (`*_back`, menjauh). Tidak ada lagi jalan mundur atau
  geser menyamping. `:flip` pada cast hanya mengatur arah hadap awal saat diam, tidak membalik arah jalan.
- **Kecepatan alami:** tanpa durasi, jalan ±0,8 m/dtk dan lari ±2,2 m/dtk (disesuaikan tinggi karakter);
  siklus langkah mengikuti jarak tempuh, jadi kaki tidak "ngebut".
- **Rute bertitik belok** agar tidak menembus meja/bangku/tiang: `walk@jalan_kiri>belok_masuk>pesan`.
  Warung punya titik `pesan`, `belok_masuk`, `belok_meja`, `celah_meja`, `celah_dalam`, `keluar_kanan`.
- **Pengubah pose per fase:** `walk{holdR=coffee;armR=-25;elbowR=85}` (jalan membawa kopi), `chat_a{face=r}`
  (hadap kanan), `sit_read{seat=0.48}` (tinggi duduk di koordinat bebas).
- **Cerita logis:** contoh pesan kopi:
  `hasan:walk@jalan_kiri>belok_masuk>pesan+order/3+wait_back/1.2+receive/2.4+walk{holdR=coffee;armR=-25;elbowR=85}@pesan>belok_masuk>belok_meja>celah_meja>duduk_meja+sit_drink/5`
  dengan `atin:idle@balik_etalase/6.2+nod/1.6+talk/2.4+give/2.4+idle/2` (serah-terima pas di detik ke-10).

Klip kegiatan baru: `sweep` (menyapu dengan sapu lidi), `order` (memesan, membelakangi kamera), `wait_back`,
`give` (menyerahkan kopi), `receive`, `kick` (menendang bola), `cheer` (bersorak), `listen`, `walk_three`,
`run_front`, `run_back`, `run_three`.

## Figuran berkegiatan

Figuran tidak lagi hanya mondar-mandir: menyapu halaman, ngobrol berpasangan (`chat_a{face=r}` + `chat_b{face=l}`),
membaca koran di bangku, main HP, anak kejar-kejaran, orang lewat dengan arah jalan yang benar.
Di **lapangan**, enam anak **main bola** lewat `engine/football.js` (`createMatch`): oper, giring, kejar bola,
tendang, sesekali gol ke gawang lalu bersorak. Bola (`P.ball`) bermotif segilima, berputar saat menggelinding,
melambung saat dioper jauh, dan punya bayangan. Entri figuran boleh `motion: (t) => ({ x, z, clip, ct, faceRight })`
untuk gerak terskrip. `--t0 <detik>` menggeser waktu lingkungan & figuran (mis. agar gol jatuh di tengah adegan;
di episode: `"t0": 11.7`).

## Teknik animasi profesional

| Teknik | Cara pakai |
|---|---|
| **Walk cycle** | `walk`, `walk_front`, `walk_three`: pose kontak → turun → melintas → naik, badan memantul 2x per siklus, lengan berlawanan kaki dan tertinggal sedikit (overlap), siku menekuk saat lengan ke depan, bobot badan bergeser kiri-kanan (tampak depan), kepala memantul terlambat. Lengan jauh di tampak samping tidak lagi "patah". |
| **Lip sync** | `dialog` di adegan / `--dialog '[{"who":"hasan","at":1.2,"text":"..."}]'`. `engine/lipsync.js` mengubah tiap huruf jadi bentuk mulut (a=terbuka, i/e=lebar, o/u=bulat, m/b/p=rapat, teriak/kapital=berteriak), berjeda di koma/titik, plus anggukan penekanan. Subtitle: "Nama: kalimat". |
| **Anticipation & follow-through** | Otomatis di timeline: sebelum jalan/lari, karakter merendah dan condong ke belakang; saat berhenti, badan terayun ke depan lalu mantap dan rambut ikut tertinggal. Klip komedi berpola ancang-ancang → aksi → follow-through (`big_kick`, `double_take`, `spit_take`, `skid`). |
| **Kamera sinematik** | `camkeys`: `[{t, x, y, z, f, horizon, ease?, track?, dx?}]`. Pan = x, tilt = horizon/y, zoom = f, dolly = z, tracking = `"track":"hasan"`, snap zoom = dua key berdekatan, `"ease":"cut"` = potong. Guncangan: fx `shake`. |
| **Parallax / kedalaman** | Dunia 3D perspektif: objek dekat bergerak lebih cepat saat kamera bergeser. `fg`: latar depan buram dekat kamera (`grass`, `bush`, `post`, `leaves`) untuk depth of field. |
| **Efek komik** | `fx`: `text` (onomatope "BYURR!", muncul membesar), `burst` (garis kejut), `splash` (cipratan kopi), `spray` (semburan), `ball` (bola melambung, `rFly` membesar saat terbang), `shake`. |

Klip ekspresif baru: `blow`, `spit_take`, `hot_fan`, `pat_belly`, `deadpan`, `deadpan_look`, `eye_twitch`,
`double_take`, `big_kick`, `look_up`, `skid`, `sheepish`, `angry_shake`, `laugh_hard`, `run_panic`, `run_angry`,
`wipe_face`. Pose baru: `dirty` (wajah kecipratan kopi, 0..1), mulut `tongue` (melet kepanasan).
Klip sekali-jalan memakai `once: true` (tidak diulang, tepi tidak tercampur).

Pratinjau komposisi cepat sebelum render: `node tools/episode.js episodes/kopi-pak-hasan.json --preview out/cek.png --at "0.2,0.5,0.8"`.
Contoh episode komedi lengkap: `episodes/kopi-pak-hasan.json` (8 adegan, dialog, variasi shot, efek).

## Cek tembus benda (WAJIB sebelum render)

Tiap lokasi punya `obstacles` (meja, bangku, pagar, tiang, pohon, rumah, ayam, gardu, tembok, gawang).
`engine/collide.js` mengecek setiap rute bergerak tokoh & figuran (jari-jari badan 0,16 m); ujung rute ke titik
duduk boleh menempel bangku. Render otomatis mencetak `PERINGATAN TEMBUS: ...` bila ada yang menembus.

```bash
node tools/episode.js episodes/kopi-pak-hasan.json --check 1     # semua adegan, tanpa render
node tools/location.js --loc warung --cast "..." --check 1        # satu adegan + figuran lokasi
```

Bila tembus: tambahkan titik belok (`a>belok>b`) yang mengitari benda, atau geser rute. Menambah benda baru ke
lokasi = tambahkan juga kotak/lingkarannya ke `obstacles`.

## STANDAR GAYA VISUAL (pegangan untuk SEMUA konten, termasuk tokoh baru)

Skill ini dibuat agar setiap konten baru, dengan tokoh apa pun, langsung memakai model animasi yang sama.
Patuhi standar berikut setiap membuat tokoh, lokasi, atau episode baru.

**Tokoh (chibi):**
- Kepala besar ±45% tinggi badan, mata bulat besar, garis luar gelap `#2a2a2a` tebal 3, arsiran cel 2 tingkat (tanpa gradasi).
- Anak skala 1.0 (±1,15 m); dewasa `build.scale` 1.2–1.3. Bentuk badan lewat `build` (perut buncit, tubuh lebar), bukan bentuk baru.
- Tokoh baru = folder `characters/<id>/` berisi `design.js` (salin dari tokoh paling mirip), `rig.js`, `CHARACTER.md`.
  Wajib ada dua palet: `colors` (abu-abu) dan `colorsWarna` (berwarna).
- Palet warna tokoh: kulit hangat (`#ffe0c8` cerah s/d `#e8b88d` sawo matang); pakaian satu warna utama jenuh-sedang
  (oranye, pink, kuning, magenta, hijau sarung) + bawahan gelap (navy/jeans). Tokoh harus LEBIH jenuh daripada latar agar menonjol.
- Lengan selalu satu bentuk utuh saat menekuk (sudah otomatis di rig). Cek pose baru dengan `tools/sheet.js` diperbesar.

**Latar (mode warna, `WARNA=1`):**
- Kampung Indonesia sederhana, bukan modern. Langit biru bergradasi, matahari kiri-atas (searah bayangan), gunung biru jauh, burung.
- Rumah: dinding pastel berbeda-beda, pintu/kusen berwarna, tirai, genteng terakota (otomatis per rumah dari posisinya).
- Latar lebih pucat/kurang jenuh dari tokoh; makin jauh makin pudar kebiruan (kabut). Abu-abu netral otomatis dihangatkan.
- Figuran: siluet abu-abu buram (tidak bersaing dengan tokoh utama).
- Cahaya: bayangan matahari ke kanan-bawah, sapuan cahaya hangat dari kiri atas, vinyet halus.

**Gerak & sinematik:** walk cycle bounce, lip sync dari teks, ancang-ancang & follow-through, variasi shot (wide → medium →
close-up), kamera `camkeys`, latar depan buram (`fg`) untuk parallax, efek komik (`fx`) untuk lelucon.

**Checklist sebelum render:**
1. `node tools/episode.js <ep>.json --check 1` → tidak ada rute menembus benda.
2. `node tools/episode.js <ep>.json --preview out/cek.png` → komposisi tiap adegan (tidak terpotong, tokoh tidak tertutup).
3. Pose baru → `tools/sheet.js` diperbesar (lengan, tangan, prop).
4. Render: `WARNA=1 node tools/episode.js <ep>.json --out out/x.mp4`.

## Lingkungan hidup (`engine/life.js`) — WAJIB ada di setiap lokasi

Latar tidak boleh sepi/statis. Setiap lokasi minimal punya: 1–2 hewan, 2–3 benda bergerak, beberapa benda kampung.
Semua bergerak menurut waktu dan otomatis abu-abu di mode abu-abu.

| Jenis | Fungsi |
|---|---|
| Hewan | `cat` (mode `sleep` / `sit` / `walk` bolak-balik, bisa di atas bangku `y`), `ducks` (berbaris menyusuri rute), `butterfly`, `perchBirds` (di kabel/atap/mistar, `axis:"z"`), ayam (`P.chicken`) |
| Bergerak | `kite` (layangan + benang), `flag` (merah-putih berkibar), `smoke` (asap dapur / uap ceret), `leaves` (daun berguguran), jemuran bergoyang, `cyclist` (sepeda ontel lewat), `cart` (gerobak bakso didorong) |
| Benda kampung | `bike` (sepeda bersandar), `bucket`, `trashBin`, `sack` (karung beras), `firewood`, `waterJar` (gentong) |

Objek JAUH otomatis jadi siluet abu-abu buram (sama seperti figuran). Kendaraan & hewan berjalan mendaftarkan
posisinya (`w.movers`) dan `--check` mengecek tiap 0,2 dtk: tidak boleh menabrak tokoh/figuran/benda.
Aturan penempatan: benda diam yang bisa ditabrak WAJIB ditambahkan ke `obstacles` lokasi (sepeda = kotak 1,6 m); jangan taruh di rute
figuran/tokoh (jalankan `--check`). Kendaraan lewat di jalan melintang/jauh (bergerak sumbu x) atau jalan depan.

## Mode malam (`--time night` / `"time": "night"` di episode)

Langit gelap bergradasi, bulan bercahaya, bintang berkelip; semua benda & tokoh diberi filter gelap kebiruan
(tetap terbaca), lampu (`w.light(x, y, z, radius)`) digambar di atas filter sehingga tetap menyala hangat
(bohlam pos ronda, lampu tiang `P.bulbLamp`). Kunang-kunang `LIFE.fireflies`. Kupu-kupu, layangan & burung
otomatis tidak muncul. Lokasi baru: beri `w.light` pada setiap sumber cahaya bila `w.night`.

## Duduk di tempatnya (aturan titik duduk)

Titik duduk (`seat`) diletakkan di TENGAH kedalaman permukaan duduk (bukan di depan bangku/bale), supaya tepi
bangku/bale tergambar menutupi pangkal paha dan kaki menjuntai di depannya. Untuk tempat duduk lebih tinggi dari
panjang kaki (bale ±0,55 m), `tools/location.js` otomatis mengangkat seluruh tokoh & kaki menjuntai.
Rute jalan menuju titik duduk: lewat titik di depan tempat duduk dulu (mis. `jalan>-1.3,6.2>duduk_bale`).

## Arah pandang otomatis (saling tatap)

`tools/location.js` mengatur mata & kepala dari dialog: pendengar menatap pembicara, pembicara menatap lawan
bicara (baris sebelumnya / berikutnya dari tokoh lain, atau `dialog[].to`), anak mendongak ke orang dewasa dan
sebaliknya, lirikan dihaluskan. Close-up satu tokoh: beri `"positions": {"bima":[x,z], ...}` di episode agar tokoh
melirik ke arah lawan bicara di luar layar. Tanpa dialog: lirikan kecil alami. Matikan per fase dengan `{look=0}`.
Jangan pakai `lookX` statis di cast untuk adegan ngobrol.

**Perhatian sesuai konteks (WAJIB, tokoh jangan terus menatap kamera):** urutan arah pandang:
1. `looks` di adegan: `[{"t0":4,"t1":9,"who":"*"|"bima"|["bima","nana"],"at":"hasan" | [x,y,z]}]` — menoleh/mendongak ke
   kejadian (bola nyangkut, orang melempar, benda jatuh). Target di atas -> kepala ikut mendongak.
2. dialog: pendengar ke pembicara, pembicara ke lawan bicara (narator tidak menarik pandangan).
3. tanpa konteks: melirik tokoh terdekat yang terlihat (sesekali kembali ke depan).
Menatap kamera hanya untuk momen sengaja (janji ke penonton, tatapan datar komedi).
Kepala ikut **mendongak/menunduk** (`pose.pitch` -1..1, otomatis dari tinggi target `looks`): wajah bergeser naik/turun &
memipih di dalam kepala, poni ikut, dagu tampak saat mendongak; tampak samping kepala berputar. Klip `look_up` memakainya.
Beri juga lirikan singkat ke bawah saat benda jatuh ke tanah (`looks` dengan target y≈0).

## Backsound (musik + suasana + SFX)

`python3 tools/backsound.py episodes/<ep>.json --out out/bs.wav --vo vo.mp3 --mix out/audio.m4a`
- Musik orisinal disintesis (petikan pizzicato kartun, bebas hak cipta): bagian tegang/misterius sampai
  `music.tense_until` lalu ceria-kocak. `"music": {"tense_until": 9.95, "bpm": 112}` di episode.
- Suasana: malam = jangkrik + angin; siang = burung + angin.
- SFX otomatis dari `fx`: shake → whoosh+dentum, text → pop (teks "KRESEK" → gesekan semak), kucing melompat → boing,
  pergantian shot → whoosh halus. Manual: `"sfx": [{"t": 19.45, "type": "dundun"}, {"t": 26.2, "type": "wahwah"}]`
  (whoosh, thud, pop, boing, rustle, dundun, wahwah).
- Mix: VO dominan, musik ±-20 dB dan di-duck otomatis saat VO bicara. Gabung ke video tanpa render ulang:
  `ffmpeg -i video.mp4 -i out/audio.m4a -map 0:v -map 1:a -c copy final.mp4`.

## Emosi saat bicara (`engine/emotion.js`)

Tiap baris dialog punya emosi; wajah, mulut (lip sync) & gerak kepala mengikuti emosi itu.
Sumber emosi (urutan): `dialog[].emo` → tag ElevenLabs di teks (`[whispering] ...`, tag dibuang dari subtitle)
→ tebakan teks (HURUF BESAR = marah/teriak, "?" = penasaran).

| emo | wajah | mulut saat bicara | gerak |
|---|---|---|---|
| whisper | melirik, pipi merona | kecil (`small`) | condong |
| scared | mata lebar, garis suram, keringat | gemetar (`wavy`) | gemetar |
| shock | mata lebar, "!" | teriak (`shout`) | tersentak |
| angry | alis turun, tanda marah | gigi terkatup / teriak | bergetar, anggukan kuat |
| badmood | mata setengah, suram | cemberut (`pout`) | lesu |
| deadpan | datar | minimal | — |
| sad | alis sedih, air mata | sedih terbuka | kepala tertunduk |
| happy / excited | mata senang / berbinar | "D" lebar | memantul |
| laugh | mata terpejam | tertawa | memantul |
| curious, suspicious, nervous, proud, worried | sesuai nama | dipetakan | miring / gemetar / dagu naik |

Ekspresi baru di rig: `whisper, scared, badmood, worried, suspicious, proud, excited`; mulut baru:
`small, smallflat, sad_open, teeth, happy_open, pout`. Kedipan otomatis berbeda tiap tokoh (tidak serempak).

## Format narator tunggal + komedi fisik (contoh: `episodes/bola-nyangkut.json`, generator `episodes/src/bola-nyangkut.py`)

- VO dari kreator boleh berupa video ber-subtitle otomatis (CapCut): baca subtitle per pergantian frame
  (`ffmpeg ... select='gt(scene,0.003)',showinfo`) -> teks + waktu persis tiap kalimat.
- Narasi = `dialog` dengan `"who":"narator","noname":true`; kutipan tokoh ("Tenang, serahkan sama ahlinya!") =
  dialog tokoh dengan `"nosub":true` (hanya gerak mulut). `"captionCaps": true` -> subtitle huruf besar.
- Satu adegan panjang + `camkeys` dengan `"ease":"cut"` = banyak shot dengan kontinuitas benda terjaga.
- `fx` baru: `prop` (benda berkeyframe `[t,x,y,z,rot,arc,mode]`: sandal, sapu, ember, ball, mango, cat; arc>0 = lempar,
  arc<0 = jatuh, mode cat: hide/walk/sit/sleep; `dentAt` ember penyok), `treeshake`, `jemuran`, teks 3D `at:[x,y,z]` (label).
- Klip baru: `throw` (override `{item=sandal|sapu|ember}`), `hold_tree`, `shake_tree`, `bonk`, `point_up`. Override `{hide=1}`
  menyembunyikan tokoh sampai masuk adegan. Opsi lokasi: `"locopts": {"poles": false, "clearRight": true}` (kampung).

## Tokoh & lokasi tambahan

| Tokoh | Folder | Ciri |
|---|---|---|
| **Pak RT** (Sudarto) | `characters/rt` | peci hitam, kumis, kemeja batik coklat, celana panjang, sepatu; dewasa tertinggi (1,3×) |
| **Mbah Sum** (Sumiyati) | `characters/mbahsum` | nenek, rambut putih dicepol, kacamata, kebaya hijau, jarik; 1,1× |
| **Bu Sari** (guru SD) | `characters/busari` | kerudung biru, kacamata, seragam khaki lengan panjang, celana; 1,2× |

| Lokasi | Isi | Titik |
|---|---|---|
| `sekolah` | SD Negeri 1 Sukamaju: halaman paving, tiang bendera, gedung kelas 3–6, pagar/gerbang, pohon ketapang, murid figuran | depan, kiri, kanan, tengah, tiang_bendera, pintu_kelas, gerbang, duduk_bangku(2) |
| `sawah` | petak padi bergoyang, pematang, saluran air (bebek berenang), dangau bambu, orang-orangan sawah, gunung | depan, pematang, pematang_jauh, kiri, kanan, gubuk, duduk_gubuk(2) |

Tokoh baru dibuat dari bagian tokoh lama (`hair` Pak Hasan / Bu Atin, `HIJAB`/`PECI` dari `engine/extras.js`).

## Shorts, akting & thumbnail

- **Subtitle gaya Shorts**: di episode `"captionStyle": "shorts"` -> kata muncul satu per satu (maks 5 kata/layar),
  kata kunci amber (kata HURUF BESAR di naskah atau `"keywords": ["NYANGKUT"]`), kata terbaru "pop", posisi di area aman.
- **HD**: `"hd": true` -> render 1080x1920 (atau 1920x1080).
- **Potong Shorts/Reels (<60 dtk)**: `node tools/shorts.js --in out/ep.mp4 --out out/ep-shorts.mp4 --from 10 --to 69`.
- **Gestur baru**: `thumbs_up` (jempol), `facepalm` (pegang kepala pusing), `clap`, `shrug` (angkat bahu "?"),
  `hands_hips` (tolak pinggang), `think` (tangan di pipi "?"), `arms_crossed` (lipat tangan, bete). Prop tangan `thumb`.
- **Transisi emosi halus**: saat bentuk mata berganti, otomatis disisipkan kedipan singkat.
- **Thumbnail**: `WARNA=1 node tools/thumbnail.js episodes/<ep>.json --scene 0 --t 58.8 --text "OYEN JADI TOPI!" --key "OYEN TOPI"
  [--format landscape|portrait] [--camera '{...}'] --out out/thumb.png` -> 1280x720 / 1080x1920, judul tebal otomatis muat,
  kata kunci kuning, bingkai kuning. Pilih momen paling lucu & wajah ekspresif.
- **Banner & foto profil**: `tools/banner.js` (2560x1440, area aman) & `tools/avatar.js`.

## Pelajaran dari revisi kreator (cek ulang setiap konten baru)
Semua sudah tertanam di mesin; poin ini menjelaskan *kenapa*, supaya pola yang sama dipakai di tokoh/lokasi lain.

**Waktu VO.** Bila hanya ada mp3 tanpa teks/subtitle, perkirakan waktu kalimat dari jeda suara (energi < -36 dB,
jeda ≥ 0,2 dtk) + jumlah suku kata (≈6 suku kata/dtk), lalu pasangkan kalimat↔potongan suara dengan pemrograman
dinamis (contoh lengkap: `episodes/src/pr-dimakan-kucing.py`, tabel `NARR`). Katakan ke kreator bahwa timing
adalah tebakan, dan minta teks persis atau video VO bersubtitle (CapCut) agar pasti.

**Kelas / duduk di meja.** Kamera engine selalu menghadap +z, jadi satu ruang dibuat dua sudut: `kelas` (hadap murid:
murid menghadap kamera di balik meja dua-orang, meja menutup pinggang) dan `kelas_guru` (dari belakang: papan tulis,
guru, punggung murid). Shot bergantian antar sudut = shot–reverse-shot. Jangan dudukkan murid menyamping di sebelah
mejanya — tidak masuk akal.
- Dari belakang (`sit_back`), kaki TIDAK digambar (ada di kolong meja) dan pinggul menempel di papan bangku tipis;
  tangan diarahkan ke depan (`armsFwd`) tertutup badan — sama dengan tampak depan (tangan di meja).
- Kamera tampak guru yang sudah melewati barisan murid: murid & figuran di belakang kamera jangan digambar
  (siluet raksasa menutupi layar).
- Close-up: jangan majukan kamera sampai menembus meja (meja hilang, tokoh tampak di depan meja). Berhenti ±1 m,
  zoom pakai lensa (`f` besar).
- Teman sekelas = figuran siluet abu + blur kuat (`extrasStyle`, `extrasBlur`), supaya fokus ke tokoh utama.

**Aksi harus terbaca benar.**
- Menulis: buku terbuka di pangkuan (`lapBook`, varian `"oily"` bernoda minyak), ujung pensil menggores halaman.
- Makan: makanan diangkat ke MULUT (bukan mata), dipegang jari, ada bekas gigitan (`bite`), mulut mengunyah.
- Memberi nilai: tangan + pulpen merah menulis di kertas, tulisan muncul bertahap mengikuti ujung pena
  (prop `book` dengan `writes: [[t, durasi, "100", x, y, ukuran]]`) + close-up buku. Jangan cuma memegang pulpen.
- Benda yang akan dipakai harus sudah terlihat sebelum aksi; benda yang dilempar/dibawa harus lepas dari tubuh;
  kucing membawa barang pakai `carry` (barang di mulut).

**Lari.** Varian depan/serong/belakang/samping dipilih otomatis dari arah gerak (jangan lari menyamping saat
mendekati kamera). Tampak samping punya lutut (`kneeL/kneeR`): kaki ayun & kaki belakang menekuk, kaki tumpu lurus;
badan condong KE ARAH lari, melayang di tengah langkah, squash saat mendarat; lengan siku ±90° memompa berlawanan kaki.

**Mata & mulut.** Tokoh tidak menatap kamera saat bergerak/beraksi: mata ke arah lari, lawan bicara, atau benda.
Tampak samping memakai mata profil (putih lonjong, pupil di sisi depan) dan mulut profil (bukaan menghadap depan,
di dalam wajah) untuk semua bentuk lip sync. Override `{expr=...}` di timeline menerapkan seluruh preset ekspresi.

**Badan & sambungan.** Celana punya sambungan pinggang (badan tidak terlihat putus saat condong/serong); lengan
tekuk satu bentuk (tidak patah/tembus badan).

**Komposisi.** Subtitle Shorts ada di sepertiga bawah — aksi penting (buku, nilai, wajah) taruh di atasnya
(atur `horizon`/`y` kamera). Teks komik jangan menimpa tokoh; angka/label jangan terpotong tepi; tokoh yang masuk
di akhir video harus sudah utuh di layar saat teks kuncinya muncul.

**Proses.** Naskah → VO kreator → episode (generator Python di `episodes/src/`) → `--check` → `tools/qa.js` lembar
kontak tiap 0,5–1 dtk → perbaiki sendiri → kirim pratinjau → render HANYA setelah kreator bilang "render".
Kata "render" berlaku untuk versi yang sudah dilihat kreator; setelah ada perubahan baru, kirim pratinjau dulu.
Render: `WARNA=1 node tools/episode.js <ep>.json --audio vo.mp3 --out video.mp4`, lalu
`python3 tools/backsound.py <ep>.json --out bs.wav --vo vo.mp3 --mix audio.m4a` dan gabung dengan ffmpeg.

**Bahasa kamera (jangan polos).** Satu adegan = banyak shot berganti (camkeys dengan `ease:"cut"`), dan tiap shot
punya gerak (push-in, pan, crane, tracking). Variasikan: establishing crane turun di awal, low angle untuk tokoh
sombong, insert setinggi benda (pelampung di air, kamera setinggi kucing), reveal dari bawah untuk benda lucu,
snap-zoom saat kejutan, close-up wajah saat tegang, high angle untuk jatuh/BYUR, crane naik / tracking di akhir.
Selang-seling dua tokoh untuk ritme komedi. (Bug lama: `ease` terbawa ke key berikutnya sehingga kamera membeku
setelah potongan — sudah diperbaiki di `tools/location.js`; kini gerak kamera dalam shot benar-benar jalan.)
**Benda dalam wadah** (ember, gelas, keranjang): gambar bukaan elips + isi di dalamnya terpotong bibir wadah,
dinding depan menutup bagian bawah — jangan menempel isi di atas wadah (terlihat di luar). Contoh: fx `ember`.
**Benda dipegang panjang (joran, tongkat, sapu panjang)**: gambar di BELAKANG pemegang (tangan & badan menutupi
pegangan) dengan pangkal menjulur ke belakang tangan — kalau di depan tangan terlihat menempel, bukan digenggam.
Garis 3D yang lewat di belakang kamera dipotong di bidang dekat (`world3d.line3`), jadi tidak melintang layar.
**Arah pandang saat berjalan**: tanpa konteks lain, tokoh yang bergerak menatap ke arah tujuan (otomatis di
`gazeAt`); dulu melirik tokoh terdekat di belakangnya sehingga terlihat jalan mundur. Saat tokoh menonton/mencari
sesuatu, set arah hadap (`face=`), `lookY`/`pitch` (menunduk ke ember, sejajar mata ke lawan) secara eksplisit.
