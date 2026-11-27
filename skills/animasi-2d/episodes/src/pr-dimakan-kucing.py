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
   [12.7, 0.95, 0, 6.15, 0, 0, "walk"], [12.75, 0.95, 0, 6.15, 0, 0, "sit"], [13.2, 0.95, 0, 6.15, 0, 0, "sit"], [13.6, 0.5, BALE_Y, 6.85, 0, 0.5, "sit"]]},
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

# ======================= D. KELAS (21,4 - 62,15): shot bergantian HADAP GURU (kelas_guru) / HADAP MURID (kelas) =======================
# Koordinat tiap sudut: lihat locations/kelas.js (x_guru = -x_murid, z_guru = 6.8 - z_murid).
D = SC[3]; DESK = [-2.15, 0.76, 5.85]; CAT_DESK = [-2.6, 0.76, 5.9]; GURU_POS = [-0.9, 6.05]
BIMA_M = [-0.85, 2.8]; GURU_M = [0.9, 0.75]; DOOR_M = [3.75, 0.3, -0.2]
PARTS = {  # (mulai_abs, klip) — tampak murid (wajah). Tampak guru: murid memakai sit_back.
 "bima": [(D, "sit_idle"), (25.9, "sit_nervous"), (28.35, "sit_nervous{sweat=1}"), (32.6, "sit_idle{expr=nervous;sweat=1;blush=1}"),
   (34.5, "sit_idle{expr=sad}"), (37.3, "sit_idle{expr=curious}"), (39.86, "sit_shock"), (41.5, "sit_idle{expr=surprised}"),
   (50.9, "sit_idle{expr=happy}"), (52.3, "sit_idle{expr=deadpan}"), (55.87, "sit_idle{expr=hopeful}"), (58.82, "sit_idle{expr=sad}"), (60.4, "sit_idle{expr=deadpan;gloom=1}")],
 "rara": [(D, "sit_idle"), (23.6, "sit_idle{holdR=book;armR=75;elbowR=35;expr=smile}"), (26.2, "sit_idle"), (33.0, "sit_laugh"), (34.5, "sit_idle{expr=smile}"),
   (39.86, "sit_shock"), (41.5, "sit_idle{expr=surprised}"), (48.4, "sit_idle"), (59.8, "sit_laugh"), (61.4, "sit_idle{expr=smile}")],
 "nana": [(D, "sit_idle"), (23.8, "sit_idle{holdR=book;armR=75;elbowR=35;expr=happy}"), (26.4, "sit_idle"), (33.0, "sit_laugh"), (34.5, "sit_idle{expr=smile}"),
   (39.86, "sit_shock"), (41.5, "sit_idle{expr=surprised}"), (48.4, "sit_idle"), (59.8, "sit_laugh"), (61.4, "sit_idle{expr=smile}")],
 "busari": [(D, "idle"), (23.47, "explain"), (25.36, "arms_crossed"), (28.35, "arms_crossed{expr=suspicious}"), (32.6, "arms_crossed{expr=deadpan}"),
   (34.5, "shake_head"), (35.55, "hands_hips{expr=deadpan}"), (37.3, "idle{expr=surprised}"), (45.4, "idle{expr=deadpan}"), (48.4, "read_desk{face=l}"),
   (54.0, "idle{holdR=redpen;armR=112;elbowR=-28;expr=deadpan}"), (55.87, "write_score{face=l}"), (58.82, "idle{holdR=redpen;expr=deadpan}")],
}
SPOT = {"bima": "duduk_bima", "rara": "duduk_rara", "nana": "duduk_nana", "busari": "depan_guru"}
def cast_slice(a, b, view):
    out = []
    for who, parts in PARTS.items():
        if view == "murid" and who == "busari": continue
        seg = [(max(t, a), c) for i, (t, c) in enumerate(parts) if t < b and (i + 1 == len(parts) or parts[i + 1][0] > a)]
        if view == "guru" and who != "busari": seg = [(seg[0][0], "sit_back")]
        specs = []
        for i, (t, c) in enumerate(seg):
            t1 = seg[i + 1][0] if i + 1 < len(seg) else b
            specs.append(f"{c}{'@' + SPOT[who] if i == 0 else ''}/{round(t1 - t, 2)}")
        out.append(f"{who}:" + "+".join(specs))
    return ", ".join(out)
LAUGH_T = [(33.0, 34.5), (59.8, 61.4)]
def extras_slice(a, b, view):
    if view == "guru": return None
    ex = []
    for i, seat in enumerate(["duduk_a", "duduk_b", "duduk_c", "duduk_d", "duduk_e"]):
        segs, t = [], a
        for l0, l1 in LAUGH_T:
            if l1 <= a or l0 >= b: continue
            if l0 > t: segs.append(("sit_idle", l0 - t)); t = l0
            segs.append(("sit_laugh", min(l1, b) - t)); t = min(l1, b)
        if t < b: segs.append(("sit_idle", b - t + 30))
        spec = "+".join(f"{c}{'@' + seat if k == 0 else ''}/{round(d, 2)}" for k, (c, d) in enumerate(segs))
        ex.append({"seed": 71 + i, "kind": "anak_perempuan" if i % 2 else "anak_laki", "spec": spec})
    return ex
# shot: (mulai_abs, sudut, kamera_awal, kamera_akhir)
SHOTS_D = [
 (D, "guru", cam(0.45, 1.3, 2.5, 740), cam(0.45, 1.3, 2.65, 760)),               # Bu Sari menagih PR (punggung murid di depan)
 (25.36, "murid", cam(-0.85, 1.12, 1.2, 1100), cam(-0.85, 1.12, 1.25, 1250)),     # close Bima keringat dingin
 (28.3, "murid", cam(-0.5, 1.15, 0.6, 900), cam(-0.5, 1.15, 0.85, 930)),          # Bima beralasan (Rara & Nana ikut terlihat)
 (32.6, "murid", cam(0.0, 1.2, 0.1, 860), cam(0.0, 1.2, 0.35, 880)),              # satu kelas tertawa
 (34.5, "guru", cam(-0.85, 1.3, 3.7, 1100), cam(-0.85, 1.3, 3.95, 1130)),         # Bu Sari geleng-geleng
 (37.3, "guru", cam(-3.2, 1.0, 4.1, 1100), cam(-3.2, 1.0, 4.4, 1150)),            # pintu kelas: "meong"
 (39.86, "murid", cam(0.0, 1.2, 0.3, 880), cam(0.0, 1.2, 0.5, 900)),              # satu kelas kaget
 (41.8, "guru", cam(-2.9, 0.9, 3.3, 1000), cam(-2.8, 0.95, 3.55, 1030)),           # Oyen jalan & lompat ke meja guru
 (45.5, "guru", cam(-2.25, 1.15, 3.9, 1100), cam(-2.2, 1.15, 4.1, 1120)),          # Oyen menaruh buku
 (48.4, "guru", cam(-1.5, 1.3, 3.7, 1050), cam(-1.5, 1.3, 3.9, 1070)),            # Bu Sari membuka buku
 (50.85, "guru", cam(-2.15, 1.1, 4.75, 1450), cam(-2.15, 1.1, 4.9, 1500)),        # close-up buku: lengkap + cap kaki
 (53.7, "guru", cam(-1.2, 1.35, 3.8, 1050), cam(-1.2, 1.35, 3.95, 1060)),         # pulpen merah
 (55.85, "guru", cam(-1.75, 1.15, 4.75, 600), cam(-1.75, 1.15, 4.85, 630)),       # Oyen 100
 (58.8, "murid", cam(-0.85, 1.12, 1.15, 1050), cam(-0.85, 1.12, 1.2, 1300)),     # Bima 60
]
FX_G = [  # hanya tampak guru (koordinat kelas_guru)
 {"type": "prop", "kind": "cat", "hold": "end", **OYEN, "carry": [0, 46.35], "keys": [[D, -3.75, 0, 7.4, 0, 0, "hide"], [38.55, -3.75, 0, 7.4, 0, 0, "hide"],
   [38.6, -3.75, 0, 7.4, 0, 0, "sit"], [41.9, -3.75, 0, 7.4, 0, 0, "sit"], [43.4, -3.55, 0, 6.2, 0, 0, "walk"], [44.6, -3.12, 0, 5.2, 0, 0, "walk"],
   [44.75, -3.12, 0, 5.2, 0, 0, "sit"], [45.35, CAT_DESK[0], CAT_DESK[1], CAT_DESK[2], 0, 0.35, "sit"]]},
 {"type": "prop", "kind": "book", "hold": "end", "open": 48.9, "paws": 48.9, "keys": [[D, *DESK, 0, 0, "hide"], [46.35, *DESK, 0, 0, "hide"], [46.36, *DESK, 0]]},
 F(38.9, "MEONG...", sx=0.62, sy=0.28, size=0.09, dur=0.9),
 AT(46.5, "RAPI.", [CAT_DESK[0], 1.35, CAT_DESK[2]], dur=1.3, size=0.06),
 AT(51.0, "LENGKAP ✓", [DESK[0], 1.15, DESK[2]], dur=1.3, size=0.05), AT(52.3, "CAP KAKI KUCING!", [DESK[0], 1.15, DESK[2]], dur=1.4, size=0.045),
 AT(56.6, "100", [CAT_DESK[0], 1.45, CAT_DESK[2]], dur=2.3, size=0.11, rot=-8), {"type": "burst", "t": 56.6, "sx": 0.35, "sy": 0.4},
]
FX_M = [AT(59.9, "60", [BIMA_M[0], 1.45, BIMA_M[1]], dur=2.2, size=0.1, rot=8), SH(59.9, 0.015, 0.25), SH(39.9, 0.02, 0.3), F(39.9, "!!", sx=0.5, sy=0.22, size=0.12, dur=0.8)]
LOOK_G = [
 {"t0": 48.4, "t1": 55.9, "who": "busari", "at": [DESK[0], 0.8, DESK[2]]},
 {"t0": 28.35, "t1": 37.3, "who": "busari", "at": "bima"}, {"t0": 37.3, "t1": 41.8, "who": "busari", "at": [-3.75, 0.3, 7.2]},
 {"t0": 41.8, "t1": 45.4, "who": "busari", "at": [-3.4, 0.3, 5.6]}, {"t0": 45.4, "t1": 48.4, "who": "busari", "at": [CAT_DESK[0], 1.0, CAT_DESK[2]]},
 {"t0": 55.9, "t1": 58.8, "who": "busari", "at": [CAT_DESK[0], 1.0, CAT_DESK[2]]}, {"t0": 58.8, "t1": 62.2, "who": "busari", "at": "bima"},
]
LOOK_M = [
 {"t0": 21.4, "t1": 28.35, "who": ["rara", "nana"], "at": "busari"}, {"t0": 21.4, "t1": 25.9, "who": "bima", "at": "busari"},
 {"t0": 28.35, "t1": 34.5, "who": ["rara", "nana"], "at": "bima"}, {"t0": 28.35, "t1": 32.6, "who": "bima", "at": "busari"},
 {"t0": 34.5, "t1": 37.3, "who": ["bima", "rara", "nana"], "at": "busari"},
 {"t0": 37.3, "t1": 48.4, "who": ["bima", "rara", "nana"], "at": DOOR_M},
 {"t0": 48.4, "t1": 58.8, "who": ["bima", "rara", "nana"], "at": "busari"},
 {"t0": 58.8, "t1": 62.2, "who": "bima", "at": "busari"}, {"t0": 58.8, "t1": 62.2, "who": ["rara", "nana"], "at": "bima"},
]
def kelas_scenes():
    out = []
    for i, (a, view, c0, c1) in enumerate(SHOTS_D):
        b = SHOTS_D[i + 1][0] if i + 1 < len(SHOTS_D) else SC[4]
        # kamera tampak guru yang sudah melewati barisan murid (z > 3): murid & figuran ada di belakang kamera -> tidak digambar
        # (mencegah siluet raksasa / badan terpotong menutupi layar)
        past_rows = view == "guru" and c0["z"] > 3.0
        cast = cast_slice(a, b, view)
        if past_rows: cast = ", ".join(x for x in cast.split(", ") if x.startswith("busari:"))
        sc = {"judul": f"Kelas ({'hadap guru' if view == 'guru' else 'hadap murid'}) {a:.1f}-{b:.1f}", "loc": "kelas_guru" if view == "guru" else "kelas",
              "seconds": round(b - a, 2), "cast": cast,
              "camkeys": [dict(t=0, **c0), dict(t=round(b - a, 2), **c1)],
              "fx": [f for f in loc_fx(FX_G if view == "guru" else FX_M, a) if f["type"] == "prop" or -0.5 < f.get("t", 0) < b - a],
              "dialog": [d for d in dlg(a, b) if view == "guru" or d["who"] != "busari"] if True else [],
              "looks": [dict(l, t0=round(l["t0"] - a, 2), t1=round(l["t1"] - a, 2)) for l in (LOOK_G if view == "guru" else LOOK_M) if l["t1"] > a and l["t0"] < b],
              "positions": {"busari": GURU_M, "bima": BIMA_M} if view == "murid" else {"busari": GURU_POS, "bima": [0.85, 4.0]}, "visual": "", "narasi": ""}
        if view == "murid": sc["locopts"] = {"extras": extras_slice(a, b, view)}
        elif past_rows: sc["extras"] = "off"
        out.append(sc)
    return out

# ======================= E. SEKOLAH, BESOK PAGI (62,15 - 66,51): Oyen paling pagi =======================
E = SC[4]
CAST_E = "bima:idle_three{hide=1}@-2.3,10.1/" + str(round(65.3 - E, 2)) + "+run_panic@-2.3,10.1>-0.3,10.4/" + str(round(END - 65.3, 2))
FX_E = [{"type": "prop", "kind": "cat", "hold": "end", **OYEN, "carry": [0, 99], "keys": [[0, -3.2, 0, 10.2, 0, 0, "walk"], [64.9 - E, 0.9, 0, 10.6, 0, 0, "walk"], [65.0 - E, 0.9, 0, 10.6, 0, 0, "sit"]]},
 AT(65.0 - E, "PALING PAGI!", [0.9, 0.75, 10.6], dur=0.85, size=0.05), F(65.8 - E, "TELAT LAGI!", sx=0.32, sy=0.3, size=0.07, dur=0.75, rot=-4)]
CAM_E = [dict(t=0, **cam(-0.9, 0.85, 7.6, 1100, 0.5)), dict(t=round(END - E, 2), **cam(0.25, 0.85, 8.0, 980, 0.5))]

ep = {"title": "PR Dimakan Kucing", "format": "portrait", "hd": True, "captionStyle": "shorts", "captionCaps": True,
      "keywords": ["PR", "GORENGAN", "OYEN", "MEONG", "KESIANGAN", "KETINGGALAN", "KUCING", "SERATUS", "ENAM", "PULUH", "TERLAMBAT", "RAPI"],
      "music": {"style": "kocak", "tense_until": 0, "bpm": 112},
      "sfx": [{"t": 14.74, "type": "pop"}, {"t": 15.72, "type": "whoosh"}, {"t": 20.4, "type": "pop"}, {"t": 33.0, "type": "dundun"}, {"t": 38.9, "type": "pop"},
              {"t": 45.35, "type": "boing"}, {"t": 46.4, "type": "thud"}, {"t": 56.6, "type": "pop"}, {"t": 59.9, "type": "wahwah"}, {"t": 65.8, "type": "whoosh"}],
      "scenes": [
        {"judul": "Pos ronda malam: PR + gorengan, Oyen datang", "loc": "posronda", "time": "night", "locopts": {"noCat": True, "noCoffee": True}, "extras": "off",
         "seconds": SC[1] - A, "cast": CAST_A, "camkeys": CAM_A, "fx": loc_fx(FX_A, A), "dialog": dlg(A, SC[1]), "looks": looks(LOOK_A, A), "visual": "", "narasi": ""},
        {"judul": "Kampung pagi: Bima kesiangan", "loc": "kampung", "t0": 20, "seconds": round(SC[2] - B, 2), "cast": CAST_B, "camkeys": CAM_B, "fx": FX_B,
         "dialog": dlg(B, SC[2]), "visual": "", "narasi": ""},
        {"judul": "Pos ronda pagi: buku ketinggalan, Oyen membawanya", "loc": "posronda", "locopts": {"noCat": True}, "t0": 30, "seconds": round(SC[3] - C, 2),
         "camkeys": CAM_C, "fx": FX_C, "dialog": dlg(C, SC[3]), "visual": "", "narasi": ""},
        *kelas_scenes(),
        {"judul": "Sekolah besok pagi: Oyen paling pagi", "loc": "sekolah", "extras": "off", "seconds": round(END - E, 2), "cast": CAST_E, "camkeys": CAM_E,
         "fx": FX_E, "dialog": dlg(E, END), "visual": "", "narasi": ""}]}
json.dump(ep, open(OUT, "w"), indent=1, ensure_ascii=False)
print("ok", OUT)
