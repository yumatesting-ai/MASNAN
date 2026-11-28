#!/usr/bin/env python3
"""Generator episode "Mancing Bareng Pak Hasan" (narator tunggal, 72,4 dtk). Lokasi: locations/empang.js.
Waktu kalimat dari potongan suara VO (mancing.mp3) — 48 potongan cocok 1:1 dengan kalimat naskah.
Joran digambar fx "rod" yang MENGIKUTI tangan tokoh (posisi dihitung dari jalur & kecepatan jalan yang sama
dengan engine/timeline.js), jadi joran tidak pernah muncul/hilang tiba-tiba.
Jalankan: python3 episodes/src/mancing.py -> episodes/mancing.json"""
import json, math, os
OUT = os.path.join(os.path.dirname(__file__), "..", "mancing.json")
END = 72.44
NARR = [(0.12, 0.92, "Minggu pagi,"), (1.23, 3.79, "Pak Hasan mengajak Bima mancing di empang Mbah Sum."),
 (4.18, 6.40, "Pak Hasan bawa joran baru yang mahal."), (6.85, 9.43, "“Joran ini, Bima... bisa narik ikan paus!”"),
 (9.83, 11.35, "Bima cuma bawa bambu..."), (11.55, 12.31, "dan cacing."), (12.71, 13.26, "Lempar!"),
 (13.82, 15.12, "Bima langsung dapat ikan."), (15.48, 16.05, "Masuk ember."), (16.34, 16.68, "Plung!"),
 (17.13, 18.29, "Pak Hasan juga dapat..."), (18.76, 19.49, "sepatu bot."), (19.99, 21.22, "Bima dapat ikan lagi."), (21.48, 21.83, "Plung!"),
 (22.28, 23.40, "Pak Hasan dapat..."), (23.77, 24.13, "kaleng."), (24.70, 25.24, "Diam-diam,"),
 (25.67, 28.18, "ada yang datang dan duduk di dekat ember Bima."), (28.61, 29.21, "Si Oyen."), (29.73, 29.98, "Meong."),
 (30.46, 31.28, "Pak Hasan kesal."), (31.66, 32.58, "“Bima, tukar tempat!"), (32.89, 34.31, "Ikannya pasti ngumpul di situ!”"),
 (34.70, 35.69, "Mereka tukar tempat."), (36.10, 37.81, "Bima... tetap dapat ikan."), (38.20, 38.83, "Pak Hasan..."), (39.06, 39.71, "dapat ranting."),
 (40.17, 42.16, "Tiba-tiba, joran Pak Hasan melengkung!"), (42.49, 43.05, "“Ini dia!"), (43.27, 44.15, "Ikan paus!”"),
 (44.43, 46.01, "Pak Hasan menarik sekuat tenaga."), (46.33, 46.70, "Tarik!"), (46.99, 47.33, "Tarik!"), (47.81, 48.48, "BYUR!"),
 (48.77, 51.32, "Yang masuk empang... Pak Hasannya."), (51.63, 52.84, "Pak Hasan naik ke pinggir."), (53.08, 53.84, "Basah kuyup."),
 (54.27, 55.70, "Lalu bajunya bergerak-gerak..."), (56.07, 57.80, "ada ikan masuk ke dalam bajunya!"),
 (58.12, 60.37, "“Bima! Akhirnya Bapak dapat ikan!”"), (60.77, 62.02, "Bima menoleh ke embernya."), (62.45, 62.85, "Kosong."),
 (63.30, 65.12, "Di sebelahnya, Oyen tidur..."), (65.40, 66.10, "perutnya bulat."),
 (67.01, 69.94, "Hari itu, yang pulang bawa ikan cuma satu."), (70.28, 70.91, "Pak Hasan..."), (71.21, 72.22, "di dalam bajunya.")]
QUOTES = [("hasan", 6.85, 9.43, "Joran ini, Bima... bisa narik ikan paus!", "proud"), ("hasan", 31.66, 34.31, "Bima, tukar tempat! Ikannya pasti ngumpul di situ!", "badmood"),
          ("hasan", 42.49, 44.15, "Ini dia! Ikan paus!", "excited"), ("hasan", 46.33, 47.33, "Tarik! Tarik!", "angry"),
          ("hasan", 58.12, 60.37, "Bima! Akhirnya Bapak dapat ikan!", "happy")]
OYEN = {"color": "#e59a4c", "stripe": "#b8692c"}
WY = -0.12
TEPI, DERMAGA, PANGKAL = (0.15, 4.3), (1.75, 6.25), (0.45, 6.25)
EMBER = (-0.45, 4.2); OYEN_DUDUK = (-0.95, 4.12); AIR = (1.45, 4.55)
DECK = 0.05
SPEED = {"bima": 0.8, "hasan": 0.8 * math.sqrt(1.28)}
HAND = {"bima": (0.18, 0.5), "hasan": (0.25, 0.62)}  # tangan relatif kaki (dx menghadap kanan, tinggi) saat fish_wait

class Actor:
    """Rangkaian fase (klip diam di titik / jalan lewat titik) -> spec timeline + posisi kaki tiap detik."""
    def __init__(s, who, start, y=0.0): s.who, s.ph, s.t, s.pos, s.y = who, [], 0.0, start, y; s.track = [(0.0, start, y)]
    def stay(s, until, clip):
        d = round(until - s.t, 2)
        s.ph.append(f"{clip}{'@' + ','.join(map(str, s.pos)) if not s.ph else ''}/{d}"); s.t = until; s.track.append((s.t, s.pos, s.y))
    def walk(s, *pts, clip="walk", y_end=None):
        path = [s.pos] + list(pts)
        for a, b in zip(path, path[1:]):
            dur = math.dist(a, b) / SPEED[s.who]; s.t += dur; s.track.append((s.t, b, s.y))
        spec = ">".join(",".join(map(str, p)) for p in path)
        s.ph.append(f"{clip}@{spec}"); s.pos = pts[-1]
    def at(s, t):
        tr = s.track
        if t <= tr[0][0]: return tr[0][1]
        for (t0, p0, _), (t1, p1, _) in zip(tr, tr[1:]):
            if t0 <= t <= t1:
                u = (t - t0) / (t1 - t0) if t1 > t0 else 1
                return (p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u)
        return tr[-1][1]
    def spec(s): return f"{s.who}:" + "+".join(s.ph)

# ---------------- PAK HASAN ----------------
H = Actor("hasan", DERMAGA)
H.stay(4.18, "fish_wait{face=r}"); H.stay(6.85, "fish_wait{face=r;expr=proud}"); H.stay(9.43, "fish_wait{face=r;expr=smug}")
H.stay(12.71, "fish_wait{face=r;expr=smug}"); H.stay(13.71, "fish_cast{face=r}"); H.stay(17.6, "fish_wait{face=r}")
H.stay(18.6, "fish_lift{face=r}"); H.stay(19.9, "fish_wait{face=r;expr=deadpan;armL=60;armR=55}"); H.stay(22.7, "fish_wait{face=r;expr=determined}")
H.stay(23.7, "fish_lift{face=r}"); H.stay(24.6, "fish_wait{face=r;expr=deadpan;gloom=1}"); H.stay(30.46, "fish_wait{face=r;expr=badmood}")
H.stay(31.4, "fish_wait{face=r;expr=furious;bodyX=1}")
H.walk(PANGKAL, clip="walk{armL=50;elbowL=35;armR=42;elbowR=40;expr=badmood}")             # 31.4 -> turun dari dermaga
H.stay(33.6, "fish_wait{face=l;expr=badmood}")                                              # bicara ke Bima
H.walk((0.35, 5.2), TEPI, clip="walk{armL=50;elbowL=35;armR=42;elbowR=40;expr=badmood}")   # ke tepi (tempat Bima)
H.stay(37.3, "fish_wait{face=r;expr=smug}"); H.stay(38.2, "fish_cast{face=r}"); H.stay(39.0, "fish_lift{face=r}")
H.stay(40.17, "fish_wait{face=r;expr=deadpan;gloom=1}"); H.stay(40.9, "fish_wait{face=r;expr=surprised}"); H.stay(44.43, "fish_wait{face=r;expr=excited;lean=-4}")
H.stay(47.5, "pull_hard{face=r}"); H.stay(48.0, "fall_in{face=r}")
H.stay(48.75, "idle{hide=1}")
HASAN_OUT_OF_WATER = 51.63

# ---------------- BIMA ----------------
B = Actor("bima", TEPI)
B.stay(9.83, "fish_wait{face=r}"); B.stay(12.71, "fish_wait{face=r;expr=sheepish;lookX=0.2;pitch=0}"); B.stay(13.71, "fish_cast{face=r}")
B.stay(13.82, "fish_wait{face=r}"); B.stay(14.82, "fish_lift{face=r}"); B.stay(17.13, "fish_wait{face=r;expr=happy}")
B.stay(19.99, "fish_wait{face=r;expr=smile}"); B.stay(20.99, "fish_lift{face=r}"); B.stay(24.7, "fish_wait{face=r;expr=happy}")
B.stay(30.46, "fish_wait{face=r}"); B.stay(32.0, "fish_wait{face=r;expr=surprised}")
B.walk((-0.55, 5.35), clip="walk{armL=50;elbowL=35;armR=42;elbowR=40}")                      # minggir memberi jalan
B.stay(33.8, "fish_wait{face=r;expr=confused}")
B.walk((0.05, 6.25), DERMAGA, clip="walk{armL=50;elbowL=35;armR=42;elbowR=40}")             # ke dermaga
B.stay(37.35, "fish_wait{face=r;expr=smile}"); B.stay(38.35, "fish_lift{face=r}"); B.stay(40.17, "fish_wait{face=r;expr=happy}")
B.stay(40.9, "fish_wait{face=l;expr=surprised;lookY=-0.15;pitch=-0.05}"); B.stay(47.81, "fish_wait{face=l;expr=excited;lookY=-0.15;pitch=-0.05}")   # menonton Pak Hasan (sejajar mata)
B.stay(51.6, "fish_wait{face=l;expr=shocked;lookY=0.5;pitch=0.35}"); B.stay(54.27, "fish_wait{face=l;expr=laugh;lookY=-0.15;pitch=-0.05}")   # ke air, lalu ke Pak Hasan
B.stay(60.77, "fish_wait{face=l;expr=smile;lookY=-0.15;pitch=-0.05}"); B.stay(62.45, "fish_wait{face=l;expr=curious;lookY=1;pitch=0.6}"); B.stay(67.0, "fish_wait{face=l;expr=shocked;lookY=1;pitch=0.6}")   # menunduk ke ember
B.stay(END, "fish_wait{face=l;expr=deadpan;gloom=1;lookY=-0.15;pitch=-0.05}")

# Pak Hasan setelah tercebur: kepala di air, lalu naik ke tepi basah kuyup
H.stay(HASAN_OUT_OF_WATER, "idle{hide=1}")   # (selama di air dipakai aktor kedua "hasan" di dalam_empang -> lihat CAST_WATER)
H.stay(54.27, "wet_idle"); H.stay(58.12, "shirt_wiggle"); H.stay(60.37, "pat_belly{expr=proud;dirty=0}")
H.stay(66.9, "wet_idle{expr=smile;eyes=happy;mouth=smile;gloom=0}")
H.walk((-1.5, 3.75), (-3.0, 3.05), (-4.3, 1.8), (-5.4, 0.6), clip="walk{expr=proud}")   # pulang bangga, ikan menggelepar di dalam kaus

def hasan_spec():
    # fase "di air" disisipkan: hide 48.75..48.75, lalu in_water di dalam_empang, lalu kembali ke tepi
    s = H.spec()
    return s.replace("idle{hide=1}/2.88", "in_water@dalam_empang/2.88").replace(
        "+wet_idle/", "+wet_idle@tepi/", 1)

# ---------------- JORAN ----------------
def rod_keys(actor, plan, style):
    """plan: [(t, sudut, lengkung, tangkapan, arah)] — arah 'r'/'l'. Pangkal joran = posisi tangan (mengikuti jalan)."""
    keys = []
    hx, hy = HAND[actor.who]
    # sampel tiap 0,1 dtk agar pangkal mengikuti tangan saat berjalan
    times = sorted(set([p[0] for p in plan] + [round(k * 0.1, 2) for k in range(int(END * 10) + 1)]))
    def plan_at(t):
        cur = plan[0]
        for p in plan:
            if p[0] <= t: cur = p
        nxt = next((p for p in plan if p[0] > t), None)
        return cur, nxt
    for t in times:
        cur, nxt = plan_at(t)
        if cur[3] == "hide": keys.append([round(t, 2), 0, 0, 0, 0, 0, 0, "hide"]); continue
        ang, bend = cur[1], cur[2]
        if nxt and nxt[3] != "hide" and nxt[0] - cur[0] <= 1.2:  # interpolasi halus antar rencana dekat
            u = (t - cur[0]) / (nxt[0] - cur[0]); ang = cur[1] + (nxt[1] - cur[1]) * u; bend = cur[2] + (nxt[2] - cur[2]) * u
        x, z = actor.at(t); face = cur[4]
        dx = hx if face == "r" else -hx
        if face == "l": ang = 180 - ang
        deck = DECK if (x > 0.7 and abs(z - 6.25) < 0.5) else 0
        keys.append([round(t, 2), round(x + dx, 3), round(hy + deck, 3), round(z - 0.01, 3), round(ang, 1), 1.55 if actor.who == "bima" else 1.75, round(bend, 2), cur[3]])
    return keys

# (t, sudut, lengkung, tangkapan, arah). tangkapan: None = senar di air + pelampung; "worm" = cacing tergantung
HASAN_ROD = [(0, 72, 0, "worm", "r"), (12.71, 72, 0, "worm", "r"), (12.95, 110, 0, "worm", "r"), (13.25, 30, 0, None, "r"),
  (18.6, 30, 0.2, None, "r"), (18.8, 62, 0.1, "boot", "r"), (19.9, 62, 0.05, "boot", "r"), (20.0, 30, 0, None, "r"),
  (23.7, 30, 0.2, None, "r"), (23.9, 62, 0.1, "can", "r"), (24.6, 62, 0.05, "can", "r"), (24.7, 30, 0, None, "r"),
  (31.4, 75, 0, "worm", "l"), (35.8, 75, 0, "worm", "r"),
  (38.2, 75, 0, "worm", "r"), (38.45, 110, 0, "worm", "r"), (38.7, 30, 0, None, "r"), (39.0, 30, 0.2, None, "r"), (39.2, 62, 0.1, "branch", "r"),
  (40.1, 62, 0.05, "branch", "r"), (40.17, 30, 0, None, "r"), (40.4, 30, 0.75, None, "r"), (44.43, 55, 0.85, None, "r"), (47.5, 60, 0.95, None, "r"),
  (47.8, 20, 0.95, None, "r"), (48.0, "hide", 0, "hide", "r")]
BIMA_ROD = [(0, 70, 0, "worm", "r"), (12.71, 70, 0, "worm", "r"), (12.95, 108, 0, "worm", "r"), (13.25, 28, 0, None, "r"),
  (14.82, 28, 0.2, None, "r"), (15.0, 58, 0.1, "fish", "r"), (15.45, 58, 0.05, "fish", "r"), (15.5, 58, 0, "worm", "r"), (16.6, 58, 0, "worm", "r"), (17.0, 28, 0, None, "r"),
  (20.99, 28, 0.2, None, "r"), (21.15, 58, 0.1, "fish", "r"), (21.45, 58, 0.05, "fish", "r"), (21.5, 58, 0, "worm", "r"), (22.3, 58, 0, "worm", "r"), (22.7, 28, 0, None, "r"),
  (32.0, 75, 0, "worm", "r"), (32.1, 75, 0, "worm", "l"), (33.8, 75, 0, "worm", "r"),
  (36.3, 75, 0, "worm", "r"), (36.55, 28, 0, None, "r"), (37.35, 28, 0.2, None, "r"), (37.5, 58, 0.1, "fish", "r"), (38.3, 58, 0.05, "fish", "r"), (38.35, 58, 0, "worm", "r"),
  (39.0, 28, 0, None, "r"), (40.05, 28, 0, None, "r"), (40.5, 75, 0, "worm", "l"), (END, 75, 0, "worm", "l")]  # angkat joran & berbalik menonton
ROD_H = {"type": "rod", "style": "mahal", "waterY": WY, "keys": rod_keys(H, [(p[0], p[1] if p[1] != "hide" else 0, p[2], p[3], p[4]) for p in HASAN_ROD], "mahal"),
         "bites": [[17.2, 18.5], [22.4, 23.6], [38.8, 39.0]]}
ROD_B = {"type": "rod", "style": "bambu", "waterY": WY, "keys": rod_keys(B, BIMA_ROD, "bambu"), "bites": [[13.9, 14.8], [20.1, 20.95], [37.0, 37.3]]}
# joran Pak Hasan setelah tercebur: mengapung di air
ROD_FLOAT = {"type": "rod", "style": "mahal", "waterY": WY, "keys": [[0, 0, 0, 0, 0, 0, 0, "hide"], [48.0, 0, 0, 0, 0, 0, 0, "hide"], [48.05, 1.6, WY + 0.02, 4.0, 5, 1.75, 0, None]]}

def tip(keys, t):
    k = max((k for k in keys if k[0] <= t), key=lambda k: k[0])
    a = math.radians(k[4]); return (k[1] + math.cos(a) * k[5], k[2] + math.sin(a) * k[5] - 0.32, k[3])

# ---------------- BENDA & EFEK ----------------
def F(t, txt, **k):
    d = {"type": "text", "t": t, "dur": k.pop("dur", 1.0), "text": txt, "size": k.pop("size", 0.1), "rot": k.pop("rot", -6)}; d.update(k); return d
def AT(t, txt, at, dur=1.4, size=0.06, rot=0): return {"type": "text", "t": t, "dur": dur, "text": txt, "at": list(at), "size": size, "rot": rot}
def SH(t, amp=0.03, dur=0.35): return {"type": "shake", "t": t, "dur": dur, "amp": amp}
def fish_to_ember(t0, t1, src):
    return {"type": "prop", "kind": "fish", "hold": "none", "keys": [[t0, *src, 80], [t1, EMBER[0], 0.3, EMBER[1] - 0.01, 200, 0.5], [t1 + 0.05, EMBER[0], 0.3, EMBER[1], 200, 0, "hide"]]}
def drop_to(kind, t0, src, dst, rot=0):
    return {"type": "prop", "kind": kind, "hold": "end", "keys": [[t0 - 0.01, *src, rot, 0, "hide"], [t0, *src, rot], [t0 + 0.4, *dst, rot + 70, -1]]}
BOOT_AT = tip(ROD_H["keys"], 19.85); CAN_AT = tip(ROD_H["keys"], 24.55); BRANCH_AT = tip(ROD_H["keys"], 40.05)
FX = [
 {"type": "ember", "x": EMBER[0], "z": EMBER[1], "fills": [[0, 0], [16.3, 1], [21.8, 2], [39.4, 3], [49.0, 0]]},
 ROD_H, ROD_B, ROD_FLOAT,
 fish_to_ember(15.5, 16.3, tip(ROD_B["keys"], 15.45)), fish_to_ember(21.5, 21.8, tip(ROD_B["keys"], 21.45)),
 fish_to_ember(38.35, 39.4, tip(ROD_B["keys"], 38.3)),
 drop_to("boot", 19.9, BOOT_AT, (1.2, DECK + 0.02, 5.92)), drop_to("can", 24.6, CAN_AT, (1.0, DECK + 0.02, 6.58)),
 drop_to("branch", 40.1, BRANCH_AT, (-0.35, 0.02, 3.55)),
 # Oyen: datang diam-diam, duduk di samping ember, (makan ikan saat semua menonton BYUR), tidur kekenyangan
 {"type": "prop", "kind": "cat", "hold": "end", **OYEN, "fatAt": 49.5, "keys": [[0, -3.6, 0, 4.9, 0, 0, "hide"], [24.6, -3.6, 0, 4.9, 0, 0, "hide"],
   [24.7, -3.6, 0, 4.9, 0, 0, "walk"], [27.9, OYEN_DUDUK[0], 0, OYEN_DUDUK[1], 0, 0, "walk"], [28.0, OYEN_DUDUK[0], 0, OYEN_DUDUK[1], 0, 0, "sit"],
   [49.4, OYEN_DUDUK[0], 0, OYEN_DUDUK[1], 0, 0, "sit"], [49.5, OYEN_DUDUK[0] - 0.15, 0, OYEN_DUDUK[1] + 0.05, 0, 0, "sleep"],
   [68.4, OYEN_DUDUK[0] - 0.15, 0, OYEN_DUDUK[1] + 0.05, 0, 0, "sleep"], [68.45, OYEN_DUDUK[0] - 0.15, 0, OYEN_DUDUK[1] + 0.05, 0, 0, "sit"]]
   + [[round(69.2 + k * 0.3, 2), round(H.at(69.2 + k * 0.3 - 1.4)[0] + 0.35, 3), 0, round(H.at(69.2 + k * 0.3 - 1.4)[1] - 0.05, 3), 0, 0, "walk"] for k in range(int((END - 69.2) / 0.3) + 1)]},
 AT(68.5, "!", (OYEN_DUDUK[0] - 0.1, 0.5, OYEN_DUDUK[1]), dur=0.7, size=0.06), AT(69.0, "~ bau ikan ~", (OYEN_DUDUK[0], 0.6, OYEN_DUDUK[1]), dur=1.5, size=0.045),
 # tercebur: cipratan besar + tokoh di air (permukaan menutup badan) + tetesan saat naik
 {"type": "splash", "t": 47.85, "x": 1.2, "y": WY, "z": 4.5, "n": 40, "size": 2.2, "color": "#7fc3e0"},
 {"type": "splash", "t": 48.1, "x": 1.5, "y": WY, "z": 4.6, "n": 24, "size": 1.6, "color": "#a8d8ec"},
 {"type": "waterfront", "t0": 48.7, "t1": HASAN_OUT_OF_WATER, "x0": AIR[0] - 0.8, "x1": AIR[0] + 0.8, "z": AIR[1] - 0.12, "cx": AIR[0], "cz": AIR[1], "y": WY},
 {"type": "drip", "t0": HASAN_OUT_OF_WATER, "t1": 66.8, "x": TEPI[0], "y": 1.1, "z": TEPI[1] - 0.05, "n": 9},
 # ikan di dalam baju: ekor menyembul dari bawah kaus, menggelepar kiri-kanan; ikut berjalan bersama Pak Hasan
 {"type": "prop", "kind": "fish", "hold": "end", "color": "#e0913a", "bias": -0.6, "keys": [[0, TEPI[0], 0.55, TEPI[1] - 0.12, 90, 0, "hide"], [54.25, TEPI[0], 0.55, TEPI[1] - 0.12, 90, 0, "hide"]]
   + [[round(54.3 + k * 0.25, 2), round(H.at(54.3 + k * 0.25)[0] + (0.06 if k % 2 else -0.06), 3), 0.55, round(H.at(54.3 + k * 0.25)[1] - 0.12, 3), 90 + (25 if k % 2 else -25)]
      for k in range(int((END - 54.3) / 0.25) + 1)]},
 F(12.75, "LEMPAR!", sy=0.24, size=0.1, dur=0.7), AT(16.34, "PLUNG!", (EMBER[0], 0.55, EMBER[1]), dur=0.6, size=0.06),
 AT(21.48, "PLUNG!", (EMBER[0], 0.55, EMBER[1]), dur=0.6, size=0.06), AT(39.4, "PLUNG!", (EMBER[0], 0.55, EMBER[1]), dur=0.6, size=0.06),
 F(18.8, "SEPATU BOT?!", sy=0.22, size=0.09, dur=1.2), F(23.85, "KALENG?!", sy=0.22, size=0.09, dur=1.0), F(39.2, "RANTING?!", sy=0.22, size=0.09, dur=1.0),
 F(29.73, "MEONG~", sx=0.6, sy=0.3, size=0.08, rot=6, dur=0.8),
 F(40.4, "!!", sx=0.55, sy=0.2, size=0.13, dur=0.8), SH(40.4, 0.02, 0.3),
 F(46.33, "TARIK!", sx=0.3, sy=0.25, size=0.09, dur=0.5), F(46.99, "TARIK!", sx=0.68, sy=0.28, size=0.1, rot=6, dur=0.5),
 F(47.81, "BYUR!!", sy=0.24, size=0.15, dur=1.0), SH(47.81, 0.06, 0.6), {"type": "burst", "t": 47.81, "sx": 0.5, "sy": 0.55},
 F(53.1, "BASAH KUYUP", sy=0.2, size=0.08, dur=0.9), F(54.4, "MENGGELIAT!", sx=0.5, sy=0.2, size=0.08, dur=1.0),
 F(62.45, "KOSONG!", sy=0.24, size=0.12, dur=1.4), AT(64.0, "z z z", (OYEN_DUDUK[0] - 0.15, 0.45, OYEN_DUDUK[1]), dur=3.0, size=0.05),
]

# ---------------- KAMERA (shot) ----------------
def cam(x, y, z, f, h=0.47): return {"x": x, "y": y, "z": z, "f": f, "horizon": h}
# Bahasa kamera: establishing crane, low-angle "pahlawan" untuk kesombongan, insert pelampung (setinggi air),
# reveal tangkapan dari bawah, kamera setinggi kucing (mengendap), snap-zoom, close-up tegang, high angle BYUR,
# kamera setinggi air, reveal ember dari atas lalu pan ke Oyen, crane naik di akhir. Shot berselang-seling Bima vs
# Pak Hasan untuk ritme komedi (pola: dapat ikan / dapat sampah).
SHOTS = [
 (0.0, cam(2.6, 3.4, -3.2, 760, 0.22), cam(0.9, 1.3, 0.6, 900, 0.47)),     # crane turun: empang Minggu pagi -> dua pemancing
 (4.1, cam(1.85, 0.42, 4.75, 1050, 0.74), cam(1.85, 0.45, 5.0, 1200, 0.74)), # low angle "pahlawan": joran mahal, push-in
 (6.8, cam(2.0, 1.2, 4.55, 1300), cam(2.0, 1.2, 4.7, 1450)),                # sombong: "bisa narik ikan paus!"
 (9.75, cam(0.15, 0.9, 3.05, 1300), cam(0.15, 0.9, 3.15, 1350)),            # Bima: cuma bambu...
 (11.5, cam(0.85, 1.75, 3.45, 1700, 0.62), cam(0.85, 1.75, 3.5, 1850, 0.62)),# ...dan cacing (insert cacing menggeliat)
 (12.65, cam(1.0, 1.3, 0.5, 830), cam(1.0, 1.3, 0.7, 850)),                  # LEMPAR! keduanya
 (13.75, cam(0.85, 0.3, 2.2, 820, 0.5), cam(0.9, 0.3, 2.4, 900, 0.5)),    # pelampung Bima menyelam (Bima & senar terlihat)
 (14.8, cam(0.35, 0.95, 2.15, 950), cam(0.3, 0.95, 2.3, 980)),              # angkat ikan -> lempar ke ember. Plung!
 (17.0, cam(3.5, 0.14, 5.5, 1500, 0.5), cam(3.5, 0.14, 5.55, 1650, 0.5)),   # insert pelampung Pak Hasan menyelam
 (18.6, cam(2.25, 0.9, 4.45, 1000, 0.66), cam(2.25, 0.9, 4.55, 1050, 0.66)),# reveal dari bawah: ...sepatu bot
 (19.95, cam(0.35, 0.95, 2.15, 950), cam(0.3, 0.95, 2.3, 980)),             # Bima dapat lagi, Plung!
 (22.2, cam(2.0, 1.2, 4.6, 1350), cam(2.0, 1.2, 4.7, 1450)),                # Pak Hasan tegang menunggu (push-in wajah)
 (23.7, cam(2.25, 0.9, 4.45, 1000, 0.66), cam(2.25, 0.9, 4.55, 1050, 0.66)),# ...kaleng
 (24.65, cam(-3.3, 0.32, 2.85, 900, 0.5), cam(-1.0, 0.32, 2.75, 900, 0.5)),    # kamera setinggi kucing: Oyen mengendap (tracking)
 (28.55, cam(-0.75, 0.45, 3.05, 1250, 0.5), cam(-0.75, 0.45, 3.15, 1350, 0.5)),# Oyen melirik ember penuh ikan. Meong.
 (30.4, cam(2.0, 1.15, 4.6, 1500), cam(2.0, 1.15, 4.65, 1600)),             # Pak Hasan kesal (close)
 (31.6, cam(0.9, 1.2, 1.3, 900), cam(0.55, 1.2, 1.6, 920)),                 # tukar tempat (lebar, pan mengikuti)
 (36.05, cam(2.1, 1.0, 4.15, 1050), cam(2.1, 1.0, 4.3, 1100)),              # Bima tetap dapat ikan (dermaga)
 (38.15, cam(0.55, 0.75, 2.75, 1050, 0.66), cam(0.55, 0.75, 2.85, 1100, 0.66)),# reveal dari bawah: ...ranting
 (40.1, cam(1.0, 1.05, 2.0, 850), cam(0.9, 1.05, 2.25, 1350)),              # snap-zoom: joran melengkung!
 (42.45, cam(0.2, 1.22, 2.85, 1400), cam(0.2, 1.22, 2.9, 1500)),              # close-up: "Ini dia! Ikan paus!"
 (44.35, cam(0.9, 0.45, 2.3, 950, 0.7), cam(0.9, 0.45, 2.45, 1000, 0.7)),   # low angle lebar: tarik-menarik
 (46.3, cam(0.15, 1.25, 2.9, 1500), cam(0.15, 1.25, 2.92, 1600)),           # TARIK! wajah mengejan
 (46.95, cam(1.75, 1.0, 4.85, 1300), cam(1.75, 1.0, 4.87, 1400)),          # TARIK! Bima melongo
 (47.75, cam(0.95, 2.7, 1.7, 850, 0.28), cam(0.95, 2.8, 1.6, 830, 0.28)),   # high angle: BYUR!
 (48.7, cam(1.45, 0.04, 3.35, 1250, 0.5), cam(1.45, 0.04, 3.5, 1350, 0.5)), # kamera setinggi air: Pak Hasan megap-megap
 (51.55, cam(0.3, 0.95, 2.35, 1100), cam(0.3, 0.95, 2.55, 1150)),           # naik, basah kuyup
 (54.2, cam(0.18, 0.85, 3.0, 1300), cam(0.18, 0.85, 3.15, 1600)),           # baju menggeliat (push-in ke ekor ikan)
 (58.05, cam(0.85, 1.1, 1.9, 950), cam(0.85, 1.1, 2.05, 980)),              # "Akhirnya Bapak dapat ikan!" (dua tokoh)
 (60.7, cam(1.75, 0.95, 4.7, 1350), cam(1.75, 0.95, 4.8, 1450)),            # Bima menoleh...
 (62.4, cam(-0.45, 0.95, 3.45, 1400, 0.12), cam(-0.85, 0.6, 2.6, 1050, 0.47)),# ember KOSONG (dari atas) -> pan turun ke Oyen
 (66.85, cam(-0.3, 1.2, 1.0, 850), cam(-1.2, 2.0, -0.6, 800, 0.36)),      # crane naik: Pak Hasan pulang, Oyen terbangun
 (70.2, cam(-2.6, 0.95, 0.55, 1050), cam(-4.0, 0.95, -0.55, 1050)),       # tracking: ikan menggelepar di kaus, Oyen membuntuti         # crane naik: pulang, Oyen membuntuti
]
CUT = lambda t, c: dict(t=round(t, 2), ease="cut", **c)
CAMKEYS = []
for i, (a, c0, c1) in enumerate(SHOTS):
    b = SHOTS[i + 1][0] if i + 1 < len(SHOTS) else END
    CAMKEYS += [dict(t=round(a, 2), **c0), CUT(b - 0.01, c1) if i + 1 < len(SHOTS) else dict(t=round(b, 2), **c1)]

LOOKS = [
 {"t0": 0, "t1": 30.4, "who": "bima", "at": [2.0, WY, 4.3]}, {"t0": 0, "t1": 30.4, "who": "hasan", "at": [3.4, WY, 6.25]},
 {"t0": 30.4, "t1": 34.4, "who": ["bima", "hasan"], "at": "*"}, {"t0": 31.66, "t1": 34.31, "who": "hasan", "at": "bima"}, {"t0": 31.66, "t1": 34.31, "who": "bima", "at": "hasan"},
 {"t0": 37.3, "t1": 40.2, "who": "bima", "at": [3.4, WY, 6.25]}, {"t0": 37.3, "t1": 47.8, "who": "hasan", "at": [2.0, WY, 4.3]},
 {"t0": 40.2, "t1": 47.8, "who": "bima", "at": "hasan"}, {"t0": 47.8, "t1": 51.6, "who": "bima", "at": [AIR[0], 0.3, AIR[1]]},
 {"t0": 51.6, "t1": 60.77, "who": "bima", "at": "hasan"}, {"t0": 60.77, "t1": 67.0, "who": "bima", "at": [EMBER[0], 0.3, EMBER[1]]},
 {"t0": 67.0, "t1": END, "who": "bima", "at": "hasan"},
]
LOOKS = [l for l in LOOKS if l["at"] != "*"]

ep = {"title": "Mancing Bareng Pak Hasan", "format": "portrait", "hd": True, "captionStyle": "shorts", "captionCaps": True,
      "keywords": ["JORAN", "PAUS", "IKAN", "PLUNG", "SEPATU", "BOT", "KALENG", "OYEN", "MEONG", "RANTING", "TARIK", "BYUR", "KOSONG", "BAJUNYA", "BULAT"],
      "music": {"style": "kocak", "tense_until": 0, "bpm": 112},
      "sfx": [{"t": 13.25, "type": "whoosh"}, {"t": 16.34, "type": "pop"}, {"t": 18.8, "type": "wahwah"}, {"t": 21.48, "type": "pop"}, {"t": 23.85, "type": "wahwah"},
              {"t": 29.73, "type": "pop"}, {"t": 39.2, "type": "wahwah"}, {"t": 39.4, "type": "pop"}, {"t": 40.4, "type": "dundun"}, {"t": 47.81, "type": "thud"},
              {"t": 47.85, "type": "rustle"}, {"t": 54.3, "type": "boing"}, {"t": 62.45, "type": "wahwah"}],
      "positions": {"hasan": list(TEPI), "bima": list(DERMAGA)},
      "scenes": [{"judul": "Empang: mancing bareng Pak Hasan", "loc": "empang", "seconds": END,
                  "cast": B.spec() + ", " + hasan_spec(), "camkeys": CAMKEYS, "fx": FX,
                  "dialog": [{"who": "narator", "noname": True, "at": a, "dur": round(b - a, 2), "text": x} for a, b, x in NARR]
                          + [{"who": w, "nosub": True, "emo": e, "at": a, "dur": round(b - a, 2), "text": x} for w, a, b, x, e in QUOTES],
                  "looks": LOOKS, "visual": "", "narasi": ""}]}
json.dump(ep, open(OUT, "w"), indent=1, ensure_ascii=False)
print("ok", OUT); print(B.spec()); print(hasan_spec())
