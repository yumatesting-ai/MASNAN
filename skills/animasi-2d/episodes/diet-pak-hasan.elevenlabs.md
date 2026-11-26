# Diet Pak Hasan — Naskah Voice Over (ElevenLabs)

Durasi video: 20 detik · 9:16 · 3 shot. Gerak mulut di video sudah mengikuti teks di bawah.

## Pemeran suara (Voice Library ElevenLabs)

| Tokoh | Karakter suara | Saran pengaturan (v3) |
|---|---|---|
| **Bima** (anak laki-laki, ±9 th) | ceria, polos, agak usil | Stability: Creative · Style tinggi |
| **Pak Hasan** (bapak 50-an, buncit) | berat, santai, sok bijak; gugup saat ketahuan | Stability: Natural |
| **Bu Atin** (ibu warung 40-an) | datar & ketus, lalu meledak di akhir | Stability: Natural → baris terakhir Creative |

Model: **Eleven v3** (mendukung tag emosi dalam kurung siku). Bahasa: Indonesia.
Tag dalam `[ ]` tidak diucapkan; itu arahan emosi/aksi.

## Salin-tempel ke "Text to Dialogue" (Eleven v3)

```
Bima: [curious] Pak Hasan, katanya lagi diet?
Pak Hasan: [proudly] Iya dong. Kopi pahit, tanpa gula.
Bima: [suspicious] Terus... gorengan sepuluh itu?
Pak Hasan: [nervous] [gulps] Itu... temannya kopi, Bim.
Bu Atin: [deadpan] Belum dibayar juga, Pak.
Pak Hasan: [sheepishly] [awkward laugh] Catat aja, Bu... kayak biasa.
Bu Atin: [shouting] BUKUNYA UDAH PENUH, PAK!
Bima: [laughs hard]
```

## Waktu tiap baris (agar pas dengan gerak mulut)

| # | Detik | Tokoh | Teks | Arahan |
|---|---|---|---|---|
| 1 | 00:00.5 | Bima | Pak Hasan, katanya lagi diet? | penasaran, nada naik di akhir |
| 2 | 00:03.3 | Pak Hasan | Iya dong. Kopi pahit, tanpa gula. | bangga, pelan, sok bijak |
| 3 | 00:06.3 | Bima | Terus... gorengan sepuluh itu? | curiga, jeda di "Terus..." |
| 4 | 00:09.1 | Pak Hasan | Itu... temannya kopi, Bim. | gugup, menelan ludah dulu (GLEK) |
| 5 | 00:12.3 | Bu Atin | Belum dibayar juga, Pak. | datar, tanpa ekspresi |
| 6 | 00:14.8 | Pak Hasan | Catat aja, Bu... kayak biasa. | malu-malu, tawa canggung |
| 7 | 00:17.4 | Bu Atin | BUKUNYA UDAH PENUH, PAK! | teriak, meledak |
| 8 | 00:17.9 | Bima | (tertawa terbahak-bahak) | sampai akhir video |

## Kalau membuat per baris (Text to Speech biasa)

Buat 8 file terpisah dengan nama `vo_01_bima.mp3` … `vo_08_bima.mp3`, lalu kirim ke Claude.
File akan ditempatkan sesuai detik di tabel dan digabung ke video (`tools/episode.js --audio`).
