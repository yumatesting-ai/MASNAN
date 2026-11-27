#!/usr/bin/env python3
"""Generator episode "PR Dimakan Kucing" (narator tunggal, 66,5 dtk).
Waktu kalimat = estimasi dari jeda suara VO (pr_bima.mp3) + jumlah suku kata; perbaiki NARR bila teks VO berbeda.
Jalankan: python3 episodes/src/pr-dimakan-kucing.py  -> episodes/pr-dimakan-kucing.json"""
import json, os
OUT = os.path.join(os.path.dirname(__file__), "..", "pr-dimakan-kucing.json")
END = 66.51
NARR = [(0.12, 3.06, "Malam itu, Bima mengerjakan PR di pos ronda..."), (3.40, 4.83, "sambil makan gorengan."),
 (5.24, 6.72, "Satu suap, satu soal."), (7.05, 8.57, "Satu suap, satu soal."), (9.04, 10.76, "Bukunya jadi bau gorengan."),
 (11.21, 12.45, "Ada yang mencium baunya."), (12.79, 14.31, "Si Oyen, kucing kampung."), (14.74, 15.20, "Meong."),
 (15.72, 17.46, "Paginya, Bima kesiangan!"), (17.85, 18.81, "Dia lari ke sekolah..."), (19.34, 20.99, "tapi bukunya ketinggalan."),
 (21.53, 23.11, "Di kelas, Bu Sari berkata,"), (23.47, 25.36, "“Anak-anak, kumpulkan PR kalian!”"), (25.90, 27.91, "Bima keringat dingin."),
 (28.35, 32.56, "“Bu... PR saya... dibawa kucing!”"), (33.00, 34.04, "Satu kelas tertawa."),
 (34.52, 36.83, "Bu Sari geleng-geleng. “Bima, alasan itu sudah kuno.”"), (37.33, 39.35, "Tiba-tiba... dari pintu kelas... “Meong.”"),
 (39.86, 41.64, "Si Oyen masuk... sambil menggigit buku PR Bima!"), (41.94, 45.33, "Oyen jalan pelan-pelan, naik ke meja Bu Sari,"),
 (45.56, 47.82, "lalu menaruh bukunya. Rapi."), (48.39, 50.51, "Bu Sari membuka buku itu."),
 (50.89, 53.67, "PR-nya lengkap... tapi penuh cap kaki kucing."), (54.00, 55.36, "Bu Sari mengambil pulpen merah."),
 (55.87, 58.41, "“Oyen, nilai seratus. Datang tepat waktu.”"), (58.82, 61.90, "“Bima, nilai enam puluh. Kamu terlambat.”"),
 (62.37, 65.28, "Besok paginya... yang berangkat sekolah paling pagi..."), (65.67, 66.22, "Si Oyen.")]
QUOTES = [("busari", 23.47, 25.36, "Anak-anak, kumpulkan PR kalian!", "normal"), ("bima", 28.35, 32.56, "Bu... PR saya... dibawa kucing!", "nervous"),
          ("busari", 35.55, 36.83, "Bima, alasan itu sudah kuno.", "deadpan"), ("busari", 55.87, 58.41, "Oyen, nilai seratus. Datang tepat waktu.", "deadpan"),
          ("busari", 58.82, 61.90, "Bima, nilai enam puluh. Kamu terlambat.", "deadpan")]
SC = [0, 15.5, 19.2, 21.4, 62.15, END]   # batas adegan: pos ronda malam | kampung pagi | pos ronda pagi | kelas | sekolah besok
OYEN = {"color": "#e59a4c", "stripe": "#b8692c"}

def F(t, txt, **k):  # teks komik
    d = {"type": "text", "t": t, "dur": k.pop("dur", 1.0), "text": txt, "size": k.pop("size", 0.1), "rot": k.pop("rot", -6)}; d.update(k); return d
def AT(t, txt, at, dur=1.6, size=0.06, rot=0): return {"type": "text", "t": t, "dur": dur, "text": txt, "at": at, "size": size, "rot": rot}
def SH(t, amp=0.03, dur=0.35): return {"type": "shake", "t": t, "dur": dur, "amp": amp}
CUT = lambda t, **k: dict(t=t, ease="cut", **k)
def shots(lst, t0):
    """lst: [(mulai_abs, kamera_awal, kamera_akhir)] -> camkeys lokal dengan potongan (cut) antar shot"""
    out = []
    for i, (a, c0, c1) in enumerate(lst):
        b = lst[i + 1][0] if i + 1 < len(lst) else None
        out.append(dict(t=round(a - t0, 2), **c0))
        if b is not None: out.append(CUT(round(b - t0 - 0.01, 2), **c1))
        else: out.append(dict(t=round(SC[SC.index(t0) + 1] - t0, 2), **c1))
    return out
def cam(x, y, z, f, h=0.5): return {"x": x, "y": y, "z": z, "f": f, "horizon": h}
def seq(t0, parts):
    """parts: [(mulai_abs, klip)] -> rangkaian 'klip/durasi' sampai akhir adegan"""
    t1 = SC[SC.index(t0) + 1]; out = []
    for i, (a, c) in enumerate(parts):
        b = parts[i + 1][0] if i + 1 < len(parts) else t1
        out.append(f"{c}/{round(b - a, 2)}")
    return "+".join(out)
def dlg(t0, t1):
    d = [{"who": "narator", "noname": True, "at": round(a - t0, 2), "dur": round(max(0.2, b - a), 2), "text": x} for a, b, x in NARR if t0 <= a < t1]
    d += [{"who": w, "nosub": True, "emo": e, "at": round(a - t0, 2), "dur": round(b - a, 2), "text": x} for w, a, b, x, e in QUOTES if t0 <= a < t1]
    return d
def loc_fx(lst, t0):
    out = []
    for f in lst:
        g = json.loads(json.dumps(f))
        if g["type"] == "prop":
            g["keys"] = [[round(k[0] - t0, 2)] + k[1:] for k in g["keys"]]
            for key in ("open", "paws"):
                if key in g: g[key] = round(g[key] - t0, 2)
            if "carry" in g: g["carry"] = [round(c - t0, 2) for c in g["carry"]]
        elif "t" in g: g["t"] = round(g["t"] - t0, 2)
        out.append(g)
    return out
def looks(lst, t0):
    t1 = SC[SC.index(t0) + 1]
    return [dict(l, t0=round(l["t0"] - t0, 2), t1=round(l["t1"] - t0, 2)) for l in lst if l["t1"] > t0 and l["t0"] < t1]

# ======================= A. POS RONDA MALAM (0 - 15,5) =======================
A = SC[0]; BALE_Y = 0.56; BOOK = [0.08, BALE_Y, 6.9]
CAST_A = "bima:" + seq(A, [(0, "sit_write{face=r}@duduk_dekat"), (3.4, "sit_eat{face=r}"), (5.24, "sit_eat{face=r}"), (6.0, "sit_write{face=r}"),
    (7.05, "sit_eat{face=r}"), (7.85, "sit_write{face=r}"), (9.04, "sit_eat{face=r}"), (11.2, "sit_write{face=r}"), (13.6, "sit_eat{face=r}")])
FX_A = [{"type": "gorengan", "x": -0.98, "y": BALE_Y, "z": 6.95, "n": 8},
 {"type": "prop", "kind": "book", "hold": "both", "keys": [[0, *BOOK, 0]]},
 {"type": "prop", "kind": "cat", "hold": "end", **OYEN, "keys": [[0, 2.8, 0, 5.4, 0, 0, "hide"], [10.95, 2.8, 0, 5.4, 0, 0, "hide"], [11.0, 2.8, 0, 5.4, 0, 0, "walk"],
   [12.7, 0.95, 0, 6.3, 0, 0, "walk"], [12.75, 0.95, 0, 6.3, 0, 0, "sit"], [13.2, 0.95, 0, 6.3, 0, 0, "sit"], [13.55, 0.5, BALE_Y, 6.85, 0, 0.3, "sit"]]},
 F(5.3, "SUAP!", sx=0.3, sy=0.3, dur=0.7), F(6.05, "SOAL!", sx=0.7, sy=0.3, dur=0.7, rot=6), F(7.1, "SUAP!", sx=0.3, sy=0.3, dur=0.7), F(7.9, "SOAL!", sx=0.7, sy=0.3, dur=0.7, rot=6),
 AT(9.1, "~ bau gorengan ~", [BOOK[0], 0.95, BOOK[2]], dur=1.9, size=0.05),
 AT(11.3, "? ? ?", [2.3, 0.55, 5.6], dur=1.2, size=0.05), F(14.74, "MEONG!", sx=0.62, sy=0.26, size=0.1, rot=6, dur=0.8)]
CAM_A = shots([(0, cam(-0.2, 1.15, 4.3, 1250), cam(-0.2, 1.12, 4.6, 1300)), (5.2, cam(-0.3, 1.15, 4.7, 1300), cam(-0.3, 1.15, 4.9, 1350)),
  (9.0, cam(-0.15, 1.0, 5.2, 1350, 0.52), cam(-0.1, 1.0, 5.4, 1400, 0.52)), (11.1, cam(1.5, 0.8, 3.7, 1150), cam(1.3, 0.8, 3.9, 1150)),
  (12.7, cam(0.15, 1.1, 4.4, 1300), cam(0.15, 1.1, 4.7, 1350))], A)
LOOK_A = [{"t0": 0, "t1": 15.5, "who": "bima", "at": [BOOK[0], 0.6, BOOK[2]]}]

# ======================= B. KAMPUNG PAGI (15,5 - 19,2): Bima lari kesiangan =======================
B = SC[1]
CAST_B = "bima:run_panic@-1.0,9.0>0.6,5.0>3.4,4.6/" + str(round(SC[2] - B, 2))
FX_B = [F(15.75 - B, "KESIANGAN!", sy=0.2, size=0.11, dur=1.4), SH(15.75 - B, 0.02, 0.3)]
CAM_B = [dict(t=0, **cam(0.2, 1.2, 1.4, 1200, 0.45)), dict(t=round(SC[2] - B, 2), **cam(0.9, 1.2, 1.7, 1200, 0.45))]

# ======================= C. POS RONDA PAGI (19,2 - 21,4): buku ketinggalan, Oyen mengambilnya =======================
C = SC[2]
FX_C = [{"type": "prop", "kind": "book", "hold": "start", "keys": [[0, *BOOK, 0], [20.35 - C, *BOOK, 0], [20.36 - C, *BOOK, 0, 0, "hide"]]},
 {"type": "prop", "kind": "cat", "hold": "end", **OYEN, "carry": [20.35 - C, 99], "keys": [[0, 0.5, BALE_Y, 6.85, 0, 0, "sit"], [20.3 - C, 0.5, BALE_Y, 6.85, 0, 0, "sit"],
   [20.75 - C, 0.95, 0, 6.2, 0, 0.25, "walk"], [21.4 - C, 1.9, 0, 5.4, 0, 0, "walk"]]},
 F(19.5 - C, "KETINGGALAN!", sy=0.22, size=0.1, dur=1.5)]
CAM_C = [dict(t=0, **cam(0.25, 0.95, 5.3, 1350, 0.55)), dict(t=round(SC[3] - C, 2), **cam(0.4, 0.95, 5.1, 1300, 0.55))]

# ======================= D. KELAS (21,4 - 62,15) =======================
D = SC[3]; DESK = [-2.25, 0.76, 4.25]; CAT_DESK = [-2.62, 0.76, 4.35]
BIMA = [0.8, 1.0, 3.7]; DOOR = [-3.05, 0.3, 7.2]
CAST_D = ", ".join([
 "bima:" + seq(D, [(D, "sit_idle{face=l}@duduk_bima"), (25.9, "sit_nervous{face=l}"), (28.35, "sit_nervous{face=l;sweat=1}"), (32.6, "sit_idle{face=l;expr=nervous;sweat=1;blush=1}"),
   (34.5, "sit_idle{face=l;expr=sad}"), (37.3, "sit_idle{face=l;expr=curious}"), (39.86, "sit_shock{face=l}"), (41.5, "sit_idle{face=l;expr=surprised}"),
   (50.9, "sit_idle{face=l;expr=happy}"), (52.3, "sit_idle{face=l;expr=deadpan}"), (55.87, "sit_idle{face=l;expr=hopeful}"), (58.82, "sit_idle{face=l;expr=sad}"), (60.4, "sit_idle{face=l;expr=deadpan;gloom=1}")]),
 "rara:" + seq(D, [(D, "sit_idle{face=l}@duduk_rara"), (23.6, "sit_idle{face=l;holdR=book;armR=75;elbowR=35;expr=smile}"), (26.2, "sit_idle{face=l}"),
   (33.0, "sit_laugh{face=l}"), (34.5, "sit_idle{face=l;expr=smile}"), (39.86, "sit_shock{face=l}"), (41.5, "sit_idle{face=l;expr=surprised}"), (48.4, "sit_idle{face=l}"), (59.8, "sit_laugh{face=l}"), (61.4, "sit_idle{face=l;expr=smile}")]),
 "nana:" + seq(D, [(D, "sit_idle{face=l}@duduk_nana"), (23.8, "sit_idle{face=l;holdR=book;armR=75;elbowR=35;expr=happy}"), (26.4, "sit_idle{face=l}"),
   (33.0, "sit_laugh{face=l}"), (34.5, "sit_idle{face=l;expr=smile}"), (39.86, "sit_shock{face=l}"), (41.5, "sit_idle{face=l;expr=surprised}"), (48.4, "sit_idle{face=l}"), (59.8, "sit_laugh{face=l}"), (61.4, "sit_idle{face=l;expr=smile}")]),
 "busari:" + seq(D, [(D, "idle{face=r}@depan_guru"), (23.47, "explain{face=r}"), (25.36, "arms_crossed{face=r}"), (28.35, "arms_crossed{face=r;expr=suspicious}"),
   (32.6, "arms_crossed{face=r;expr=deadpan}"), (34.5, "shake_head"), (35.55, "hands_hips{expr=deadpan}"), (37.3, "idle{expr=surprised}"), (45.4, "idle{expr=deadpan}"),
   (48.4, "read_desk{face=l}"), (54.0, "idle{holdR=redpen;armR=112;elbowR=-28;expr=deadpan}"), (55.87, "write_score{face=l}"), (58.82, "idle_three{face=r;holdR=redpen;expr=deadpan}")]),
])
LAUGH = lambda seat, ph=0: {"spec": f"sit_idle{{face=l}}@{seat}/{round(33.0 - D + ph, 2)}+sit_laugh{{face=l}}/{round(1.5 - ph, 2)}+sit_idle{{face=l;expr=smile}}/{round(59.8 - 34.5, 2)}+sit_laugh{{face=l}}/1.6+sit_idle{{face=l}}/20"}
EXTRAS_D = [dict(seed=71, kind="anak_laki", **LAUGH("duduk_a")), dict(seed=72, kind="anak_perempuan", **LAUGH("duduk_b", 0.2)), dict(seed=73, kind="anak_laki", **LAUGH("duduk_c", 0.1))]
FX_D = [
 # Oyen: muncul di pintu -> jalan pelan menggigit buku -> lompat ke meja guru -> menaruh buku -> duduk manis
 {"type": "prop", "kind": "cat", "hold": "end", **OYEN, "carry": [0, 46.35], "keys": [[D, -3.05, 0, 7.45, 0, 0, "hide"], [38.55, -3.05, 0, 7.45, 0, 0, "hide"],
   [38.6, -3.05, 0, 7.45, 0, 0, "sit"], [39.9, -3.05, 0, 7.45, 0, 0, "sit"], [43.0, -3.45, 0, 5.5, 0, 0, "walk"], [44.6, -3.4, 0, 3.75, 0, 0, "walk"],
   [44.75, -3.4, 0, 3.75, 0, 0, "sit"], [45.35, CAT_DESK[0], CAT_DESK[1], CAT_DESK[2], 0, 0.35, "sit"]]},
 {"type": "prop", "kind": "book", "hold": "end", "open": 48.9, "paws": 48.9, "keys": [[D, *DESK, 0, 0, "hide"], [46.35, *DESK, 0, 0, "hide"], [46.36, *DESK, 0]]},
 F(38.9, "MEONG...", sx=0.35, sy=0.28, size=0.09, dur=0.9), SH(39.9, 0.02, 0.3),
 AT(46.5, "RAPI.", [CAT_DESK[0], 1.35, CAT_DESK[2]], dur=1.3, size=0.06),
 AT(51.0, "LENGKAP ✓", [DESK[0], 1.15, DESK[2]], dur=1.3, size=0.05), AT(52.3, "CAP KAKI KUCING!", [DESK[0], 1.15, DESK[2]], dur=1.4, size=0.045),
 AT(56.6, "100", [CAT_DESK[0], 1.45, CAT_DESK[2]], dur=5.5, size=0.11, rot=-8), {"type": "burst", "t": 56.6, "sx": 0.5, "sy": 0.4},
 AT(59.9, "60", [BIMA[0], 1.75, BIMA[2]], dur=2.2, size=0.1, rot=8), SH(59.9, 0.015, 0.25),
]
CAM_D = shots([
 (D, cam(-0.4, 1.2, 1.0, 800, 0.45), cam(-0.4, 1.2, 1.4, 820, 0.45)),            # wide: Bu Sari + kelas
 (25.36, cam(0.65, 1.0, 2.0, 1100), cam(0.65, 1.0, 2.35, 1150)),       # close Bima keringat dingin
 (28.3, cam(0.2, 1.05, 1.4, 1000), cam(0.2, 1.05, 1.6, 1000)),         # Bima beralasan (Rara & Nana terlihat)
 (32.6, cam(1.6, 1.15, 1.2, 760, 0.45), cam(1.6, 1.15, 1.45, 780, 0.45)),             # satu kelas tertawa
 (34.5, cam(-1.25, 1.35, 2.1, 1050), cam(-1.25, 1.35, 2.4, 1080)),     # Bu Sari geleng-geleng
 (37.3, cam(-3.5, 1.0, 3.6, 1100), cam(-3.5, 1.0, 3.9, 1150)),           # pintu kelas: "meong"
 (41.8, cam(-2.6, 0.75, 1.6, 950), cam(-2.4, 0.85, 1.9, 980)),         # Oyen jalan & lompat ke meja
 (45.5, cam(-2.45, 1.1, 2.5, 1100), cam(-2.4, 1.1, 2.7, 1120)),       # Oyen menaruh buku, Bu Sari
 (48.4, cam(-1.7, 1.3, 2.1, 1050), cam(-1.7, 1.3, 2.3, 1060)),         # Bu Sari membuka buku
 (50.85, cam(-2.2, 1.1, 3.15, 1450), cam(-2.2, 1.1, 3.3, 1500)),       # close-up buku: lengkap + cap kaki
 (53.7, cam(-1.6, 1.35, 2.2, 1000), cam(-1.6, 1.35, 2.35, 1000)),      # pulpen merah
 (55.85, cam(-2.0, 1.15, 2.1, 950), cam(-2.0, 1.15, 2.3, 980)),      # Oyen 100
 (58.8, cam(0.6, 1.0, 1.9, 1050), cam(0.6, 1.0, 2.3, 1120)),           # Bima 60
], D)
STUD = ["bima", "rara", "nana"]
LOOK_D = [
 {"t0": 48.4, "t1": 55.9, "who": "busari", "at": [DESK[0], 0.8, DESK[2]]},
 {"t0": 21.4, "t1": 25.5, "who": STUD, "at": "busari"},
 {"t0": 28.35, "t1": 32.6, "who": ["busari", "rara", "nana"], "at": "bima"}, {"t0": 28.35, "t1": 32.6, "who": "bima", "at": "busari"},
 {"t0": 32.6, "t1": 34.5, "who": ["rara", "nana"], "at": "bima"}, {"t0": 32.6, "t1": 37.3, "who": "busari", "at": "bima"},
 {"t0": 34.5, "t1": 37.3, "who": STUD, "at": "busari"},
 {"t0": 37.3, "t1": 41.6, "who": "*", "at": DOOR}, {"t0": 41.6, "t1": 43.4, "who": "*", "at": [-3.45, 0.3, 5.5]},
 {"t0": 43.4, "t1": 45.3, "who": "*", "at": [-3.4, 0.3, 3.9]}, {"t0": 45.3, "t1": 48.4, "who": "*", "at": [CAT_DESK[0], 1.0, CAT_DESK[2]]},
 {"t0": 48.4, "t1": 55.9, "who": STUD, "at": "busari"},
 {"t0": 55.9, "t1": 58.8, "who": "*", "at": [CAT_DESK[0], 1.0, CAT_DESK[2]]},
 {"t0": 58.8, "t1": 62.2, "who": ["busari", "rara", "nana"], "at": "bima"}, {"t0": 58.8, "t1": 62.2, "who": "bima", "at": "busari"},
]

# ======================= E. SEKOLAH, BESOK PAGI (62,15 - 66,51): Oyen paling pagi =======================
E = SC[4]
CAST_E = "bima:idle_three{hide=1}@-2.3,10.1/" + str(round(65.3 - E, 2)) + "+run_panic@-2.3,10.1>-0.3,10.4/" + str(round(END - 65.3, 2))
FX_E = [{"type": "prop", "kind": "cat", "hold": "end", **OYEN, "carry": [0, 99], "keys": [[0, -3.2, 0, 10.2, 0, 0, "walk"], [64.9 - E, 0.9, 0, 10.6, 0, 0, "walk"], [65.0 - E, 0.9, 0, 10.6, 0, 0, "sit"]]},
 AT(65.0 - E, "PALING PAGI!", [0.9, 0.75, 10.6], dur=0.85, size=0.05), F(65.8 - E, "TELAT LAGI!", sx=0.3, sy=0.72, size=0.07, dur=0.75, rot=-4)]
CAM_E = [dict(t=0, **cam(-0.9, 0.85, 7.6, 1100, 0.5)), dict(t=round(END - E, 2), **cam(0.25, 0.85, 8.0, 980, 0.5))]

ep = {"title": "PR Dimakan Kucing", "format": "portrait", "captionStyle": "shorts", "captionCaps": True,
      "keywords": ["PR", "GORENGAN", "OYEN", "MEONG", "KESIANGAN", "KETINGGALAN", "KUCING", "SERATUS", "ENAM", "PULUH", "TERLAMBAT", "RAPI"],
      "music": {"style": "kocak", "tense_until": 0, "bpm": 112},
      "sfx": [{"t": 14.74, "type": "pop"}, {"t": 15.72, "type": "whoosh"}, {"t": 20.4, "type": "pop"}, {"t": 33.0, "type": "dundun"}, {"t": 38.9, "type": "pop"},
              {"t": 45.35, "type": "boing"}, {"t": 46.4, "type": "thud"}, {"t": 56.6, "type": "pop"}, {"t": 59.9, "type": "wahwah"}, {"t": 65.8, "type": "whoosh"}],
      "positions": {"busari": [-1.45, 4.35], "bima": [0.8, 3.7]},
      "scenes": [
        {"judul": "Pos ronda malam: PR + gorengan, Oyen datang", "loc": "posronda", "time": "night", "locopts": {"noCat": True, "noCoffee": True}, "extras": "off",
         "seconds": SC[1] - A, "cast": CAST_A, "camkeys": CAM_A, "fx": loc_fx(FX_A, A), "dialog": dlg(A, SC[1]), "looks": looks(LOOK_A, A), "visual": "", "narasi": ""},
        {"judul": "Kampung pagi: Bima kesiangan", "loc": "kampung", "t0": 20, "seconds": round(SC[2] - B, 2), "cast": CAST_B, "camkeys": CAM_B, "fx": FX_B,
         "dialog": dlg(B, SC[2]), "visual": "", "narasi": ""},
        {"judul": "Pos ronda pagi: buku ketinggalan, Oyen membawanya", "loc": "posronda", "locopts": {"noCat": True}, "t0": 30, "seconds": round(SC[3] - C, 2),
         "camkeys": CAM_C, "fx": FX_C, "dialog": dlg(C, SC[3]), "visual": "", "narasi": ""},
        {"judul": "Kelas: PR dibawa kucing", "loc": "kelas", "locopts": {"extras": EXTRAS_D}, "seconds": round(SC[4] - D, 2), "cast": CAST_D, "camkeys": CAM_D,
         "fx": loc_fx(FX_D, D), "dialog": dlg(D, SC[4]), "looks": looks(LOOK_D, D), "visual": "", "narasi": ""},
        {"judul": "Sekolah besok pagi: Oyen paling pagi", "loc": "sekolah", "extras": "off", "seconds": round(END - E, 2), "cast": CAST_E, "camkeys": CAM_E,
         "fx": FX_E, "dialog": dlg(E, END), "visual": "", "narasi": ""}]}
json.dump(ep, open(OUT, "w"), indent=1, ensure_ascii=False)
print("ok", OUT)
