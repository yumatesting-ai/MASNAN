#!/usr/bin/env python3
"""Generator episode "Bola Nyangkut" (narator tunggal, 74,4 dtk). Waktu diambil dari subtitle VO kreator.
Jalankan: python3 episodes/src/bola-nyangkut.py  -> episodes/bola-nyangkut.json"""
import json, os
OUT = os.path.join(os.path.dirname(__file__), "..", "bola-nyangkut.json")
# narasi: (mulai, selesai, teks) — dari subtitle video VO
NARR = [(0.23, 3.23, "Siang itu Bima nendang bola sekuat tenaga."), (3.6, 4.1, "DUAK!"),
 (4.77, 8.9, "Bolanya terbang tinggi-tinggi dan nyangkut di pohon mangga."), (9.3, 11.73, "Pak Hasan lewat, langsung busungin dada."),
 (12.07, 15.77, "“Tenang, serahkan sama ahlinya!” Beliau copot sandal,"), (15.77, 17.23, "ancang-ancang, lempar!"),
 (17.9, 18.93, "Sandalnya nyangkut."), (19.33, 21.7, "Lempar sandal satunya lagi, nyangkut juga."),
 (22.13, 23.5, "Pak Hasan pinjem sapu Bu Atin."), (23.8, 25.17, "Lempar, nyangkut."), (25.53, 27.8, "Pinjem ember, lempar, nyangkut."),
 (28.07, 30.43, "Ember sama sapunya malah pelukan di atas."), (30.87, 32.8, "Lalu datang si Oyen, kucing warung."),
 (33.07, 36.03, "Dia manjat mau bantu, dan Oyen ikut nyangkut."), (36.43, 41.23, "“Meong!” Sekarang pohon mangga itu berbuah bola, sandal,"),
 (41.23, 43.37, "sapu, ember, dan kucing."), (43.93, 44.87, "Lalu datang Nana."), (45.2, 48.57, "Dia pegang pohonnya terus bilang, “Permisi ya, pohon.”"),
 (48.57, 49.4, "Goyang sedikit."), (49.67, 50.37, "Bola jatuh!"), (50.67, 50.87, "TUK!"), (51.23, 52.6, "Sandal, PLOK, PLOK!"),
 (52.97, 53.97, "Sapu, SREK!"), (54.27, 55.53, "Ember, KONTANG!"), (55.83, 57.2, "Dan terakhir... Oyen."), (57.5, 57.73, "HAP!"),
 (57.93, 60.6, "Mendarat pas di kepala Pak Hasan, kayak topi."), (61.03, 61.87, "Bu Atin datang."),
 (62.17, 65.63, "“Pak, ember saya kok penyok?” Pak Hasan cuma nunjuk Oyen."), (65.93, 67.1, "Oyen pura-pura tidur."),
 (67.47, 71.4, "Sejak hari itu, Bima janji main bola di tempat yang nggak ada pohonnya."), (71.77, 72.23, "DUAK!"),
 (72.73, 74.2, "Bolanya nyangkut di jemuran.")]
QUOTES = [("hasan", 12.07, 13.9, "Tenang, serahkan sama ahlinya!", "proud"), ("nana", 47.1, 48.45, "Permisi ya, pohon.", "happy"),
          ("atin", 62.17, 64.05, "Pak, ember saya kok penyok?", "badmood")]
SPLIT = 67.3; END = 74.4
TREE = (3.6, 11.8); HX, HZ = 2.9, 10.9; HEAD = 1.5        # posisi Pak Hasan di bawah pohon, tinggi kepala
Z_ST = 11.35                                              # bidang benda yang nyangkut (depan tajuk)
HAND = (HX + 0.15, 1.65, HZ)

def F(t, txt, **k):  # teks komik
    d = {"type": "text", "t": t, "dur": k.pop("dur", 1.0), "text": txt, "size": k.pop("size", 0.12), "rot": k.pop("rot", -6)}; d.update(k); return d
def SH(t, amp=0.05, dur=0.4): return {"type": "shake", "t": t, "dur": dur, "amp": amp}
def LABEL(t, txt, at, dur=4.4): return {"type": "text", "t": t, "dur": dur, "text": txt, "at": at, "size": 0.05, "rot": 0}

# ----- benda (waktu absolut) -----
ST = {"ball": (3.15, 3.3), "sandal1": (3.95, 3.2), "sandal2": (4.35, 3.45), "sapu": (2.75, 3.4), "ember": (3.55, 3.05), "cat": (4.15, 2.95)}
def hd(dx=0): return (HX + dx, HEAD + 0.05, HZ + 0.02)
PROPS = [
 {"type": "prop", "kind": "ball", "hold": "end", "keys": [[0, 1.52, 0.11, 9.15, 0], [3.55, 1.52, 0.11, 9.15, 0], [7.9, ST["ball"][0], ST["ball"][1], Z_ST, 900, 3.2], [49.7, ST["ball"][0], ST["ball"][1], Z_ST, 900],
   [50.72, *hd(0.05), 1300, -1], [51.3, 2.2, 0.11, 10.2, 1600, 0.5]]},
 {"type": "prop", "kind": "sandal", "hold": "end", "keys": [[16.85, *HAND, 0, 0, "hide"], [16.86, *HAND, 0], [17.6, ST["sandal1"][0], ST["sandal1"][1], Z_ST, 520, 0.7],
   [51.3, ST["sandal1"][0], ST["sandal1"][1], Z_ST, 520], [51.72, *hd(0.08), 700, -1], [52.1, 3.4, 0.03, 10.5, 720, 0.3]]},
 {"type": "prop", "kind": "sandal", "hold": "end", "keys": [[20.05, *HAND, 0, 0, "hide"], [20.06, *HAND, 0], [20.8, ST["sandal2"][0], ST["sandal2"][1], Z_ST, -470, 0.8],
   [51.78, ST["sandal2"][0], ST["sandal2"][1], Z_ST, -470], [52.22, *hd(-0.05), -650, -1], [52.6, 2.4, 0.03, 10.7, -700, 0.3]]},
 {"type": "prop", "kind": "sapu", "hold": "end", "keys": [[24.4, *HAND, 0, 0, "hide"], [24.41, *HAND, 0], [25.1, ST["sapu"][0], ST["sapu"][1], Z_ST, -35, 0.6],
   [52.98, ST["sapu"][0], ST["sapu"][1], Z_ST, -35], [53.45, *hd(), 30, -1], [53.85, 2.2, 0.05, 11.1, 90, 0.2]]},
 {"type": "prop", "kind": "ember", "hold": "end", "dentAt": 54.85, "keys": [[26.85, *HAND, 0, 0, "hide"], [26.86, *HAND, 0], [27.6, ST["ember"][0], ST["ember"][1], Z_ST, 15, 0.7],
   [54.28, ST["ember"][0], ST["ember"][1], Z_ST, 15], [54.85, HX, HEAD + 0.02, HZ + 0.03, 175, -1], [55.35, 3.45, 0.0, 10.35, 200, 0.4]]},
 # Oyen: jalan masuk -> lompat ke dahan -> duduk -> jatuh ke kepala Pak Hasan -> duduk lalu "tidur" di kepala
 {"type": "prop", "kind": "cat", "hold": "end", "color": "#e59a4c", "stripe": "#b8692c", "keys": [
   [0, 5.6, 0, 10.6, 0, 0, "hide"], [30.85, 5.6, 0, 10.6, 0, 0, "hide"], [30.9, 5.6, 0, 10.6, 0, 0, "walk"], [32.7, 3.9, 0, 11.5, 0, 0, "walk"],
   [33.3, 3.9, 0, 11.5, 0, 0, "sit"], [33.35, 3.9, 0.05, 11.5, 0, 0, "climb"], [35.3, 3.9, 2.45, 11.5, 0, 0, "climb"],
   [35.7, ST["cat"][0], ST["cat"][1], Z_ST, 0, 0.25, "sit"], [57.0, ST["cat"][0], ST["cat"][1], Z_ST, 0, 0, "sit"],
   [57.58, HX, HEAD - 0.06, HZ + 0.03, 0, 0.35, "sit"], [65.9, HX, HEAD - 0.06, HZ + 0.03, 0, 0, "sit"], [65.95, HX, HEAD - 0.06, HZ + 0.03, 0, 0, "sleep"]]},
]
FXK = PROPS + [
 F(3.6, "DUAK!", sx=0.35, sy=0.3, size=0.13), {"type": "burst", "t": 3.6, "sx": 0.35, "sy": 0.66}, SH(3.6, 0.03, 0.3),
 F(7.95, "NYANGKUT!", sy=0.2), F(17.95, "NYANGKUT!", sy=0.2), F(20.85, "NYANGKUT x2!", sy=0.2), F(24.85, "NYANGKUT x3!", sy=0.2), F(27.35, "NYANGKUT x4!", sy=0.2),
 {"type": "text", "t": 28.6, "dur": 1.8, "text": "❤", "at": [3.15, 3.65, Z_ST], "size": 0.09, "rot": 0},
 F(35.75, "NYANGKUT x5!", sy=0.2), F(36.45, "MEONG!", sx=0.62, sy=0.2, size=0.11, rot=6),
 LABEL(39.0, "BOLA", [ST["ball"][0], ST["ball"][1] + 0.25, Z_ST]), LABEL(39.9, "SANDAL", [ST["sandal1"][0] + 0.2, ST["sandal1"][1] + 0.45, Z_ST]),
 LABEL(41.2, "SAPU", [ST["sapu"][0], ST["sapu"][1] + 0.75, Z_ST], 2.2), LABEL(41.8, "EMBER", [ST["ember"][0], ST["ember"][1] - 0.25, Z_ST], 1.6),
 LABEL(42.5, "KUCING", [ST["cat"][0], ST["cat"][1] - 0.15, Z_ST], 0.9),
 {"type": "treeshake", "t": 48.6, "dur": 1.0, "amp": 7, "x": TREE[0], "z": TREE[1]}, SH(48.6, 0.025, 0.9),
 F(50.72, "TUK!", sx=0.62, sy=0.3, size=0.1, dur=0.6), SH(50.72, 0.03, 0.3),
 F(51.72, "PLOK!", sx=0.35, sy=0.3, size=0.1, dur=0.5), F(52.22, "PLOK!", sx=0.65, sy=0.33, size=0.1, dur=0.5),
 F(53.45, "SREK!", sx=0.6, sy=0.28, size=0.1, dur=0.6), F(54.85, "KONTANG!", sy=0.26, size=0.13, dur=0.8), SH(54.85, 0.05, 0.5),
 F(57.58, "HAP!", sy=0.24, size=0.13, dur=0.8), SH(57.58, 0.03, 0.3), F(66.0, "zzz...", sx=0.68, sy=0.25, size=0.07, rot=0, dur=1.3),
]
def local(fxlist, t0, t1):
    out = []
    for f in fxlist:
        g = json.loads(json.dumps(f))
        if g["type"] == "prop": g["keys"] = [[k[0] - t0] + k[1:] for k in g["keys"]]; out.append(g); continue
        if g["type"] == "text" and not (t0 - 2 <= g["t"] < t1): continue
        if "t" in g: g["t"] -= t0
        out.append(g)
    return out

def dlg(t0, t1):
    d = [{"who": "narator", "noname": True, "at": round(a - t0, 2), "dur": round(max(0.2, b - a - 0.4), 2), "text": x} for a, b, x in NARR if t0 <= a < t1]
    d += [{"who": w, "nosub": True, "emo": e, "at": round(a - t0, 2), "dur": round(b - a, 2), "text": x} for w, a, b, x, e in QUOTES if t0 <= a < t1]
    return d

# ----- tokoh (adegan kampung 0..67,3) -----
CAST_K = ", ".join([
 "bima:idle_three{face=r}@1.2,9.2/2.55+big_kick{face=r}/2.4+look_up/4.35+idle_three{face=r}/27.1+look_up{expr=surprised}/7.0"
 "+idle_three{face=r}/6.2+idle_three{face=r;expr=surprised}/8.3+laugh_hard/3.1+idle_three{face=r;expr=smile}/6.3",
 f"hasan:idle_three{{hide=1}}@4.6,9.9/9.3+walk@4.6,9.9>{HX},{HZ}/2.2+pat_belly{{expr=proud}}/2.6"
 "+idle_three{face=r;legR=38;armR=-12;elbowR=-25;armL=25;lean=-5;headY=6;pitch=0.75;squash=0.06;expr=smug}/1.2+idle_three{face=r;holdR=sandal;barefoot=r;expr=smug}/0.9"
 "+throw{item=sandal;face=r;barefoot=r}/1.2+look_up{expr=deadpan;barefoot=r}/1.1"
 "+idle_three{face=r;legL=38;armR=-12;elbowR=-25;armL=25;lean=-5;headY=6;pitch=0.75;squash=0.06;barefoot=r}/0.5+idle_three{face=r;holdR=sandal;barefoot=both}/0.4"
 "+throw{item=sandal;face=r;barefoot=both}/1.2+look_up{expr=shocked;barefoot=both}/1.55"
 "+idle_three{face=r;holdR=sapu;expr=smug;barefoot=both}/1.6+throw{item=sapu;face=r;barefoot=both}/1.2+idle_three{face=r;holdR=ember;expr=smug;barefoot=both}/1.25+throw{item=ember;face=r;barefoot=both}/1.2"
 "+scratch_head{barefoot=both}/2.9+look_up{expr=deadpan;barefoot=both}/5.5+look_up{expr=badmood;barefoot=both}/7.0+idle_three{face=r;expr=deadpan;barefoot=both}/7.9"
 "+bonk{barefoot=both}/0.6+idle{expr=dizzy;barefoot=both}/0.4+bonk{barefoot=both}/0.5+bonk{barefoot=both}/0.5+idle{expr=dizzy;barefoot=both}/0.75+bonk{barefoot=both}/0.5"
 "+idle{expr=dizzy;barefoot=both}/0.85+bonk{barefoot=both}/0.6+dizzy{barefoot=both}/2.15"
 "+bonk{barefoot=both}/0.5+dizzy{barefoot=both}/2.7+idle{expr=nervous;sweat=true;barefoot=both}/3.45+point_up{barefoot=both}/1.8+idle{expr=nervous;sweat=true;barefoot=both}/1.3",
 "nana:idle_three{hide=1}@5.4,10.4/43.9+run@5.4,10.4>4.15,11.6/1.3+hold_tree{face=l}/3.4+shake_tree{face=l}/1.0+idle_three{face=l;expr=surprised}/8.0"
 "+laugh/3.1+idle_three{face=l;expr=smile}/5.1+idle_three{hide=1}/1.5",
 "atin:idle{hide=1}@-1.5,6.6/60.6+run@-1.5,6.6>1.95,10.35/1.5+deadpan{expr=badmood}/2.0+angry_shake/2.1+deadpan{expr=badmood}/1.1",
])
CUT = lambda t, **k: dict(t=t, ease="cut", **k)
CAM_K = [
 {"t": 0, "x": 1.4, "y": 1.0, "z": 5.6, "f": 1500, "horizon": 0.5}, CUT(4.49, x=1.4, y=1.0, z=6.0, f=1500, horizon=0.5),        # 1 Bima
 {"t": 4.5, "x": 1.8, "y": 1.2, "z": 5.0, "f": 1150, "horizon": 0.55}, CUT(9.09, x=3.2, y=2.6, z=6.0, f=1150, horizon=0.85),    # 2 tilt ikut bola
 {"t": 9.1, "x": 2.6, "y": 1.2, "z": 6.0, "f": 1250, "horizon": 0.48}, CUT(11.99, x=2.8, y=1.2, z=6.4, f=1250, horizon=0.48),  # 3 Pak Hasan datang
 {"t": 12.0, "x": 2.9, "y": 0.8, "z": 7.6, "f": 1400, "horizon": 0.62}, CUT(15.69, x=2.9, y=0.8, z=8.0, f=1400, horizon=0.62), # 4 low angle bangga
 {"t": 15.7, "x": 3.0, "y": 1.6, "z": 4.6, "f": 1000, "horizon": 0.5}, CUT(17.59, x=3.0, y=1.6, z=4.8, f=1000, horizon=0.5),   # 5 lempar
 {"t": 17.6, "x": 3.6, "y": 3.2, "z": 8.2, "f": 1400, "horizon": 0.5}, CUT(19.19, x=3.6, y=3.2, z=8.4, f=1400, horizon=0.5),   #   nyangkut
 {"t": 19.2, "x": 3.0, "y": 1.6, "z": 4.6, "f": 1000, "horizon": 0.5}, CUT(20.79, x=3.0, y=1.6, z=4.8, f=1000, horizon=0.5),   # 6 lempar 2
 {"t": 20.8, "x": 3.7, "y": 3.2, "z": 8.2, "f": 1400, "horizon": 0.5}, CUT(21.89, x=3.7, y=3.2, z=8.35, f=1400, horizon=0.5),
 {"t": 21.9, "x": 2.9, "y": 1.3, "z": 7.0, "f": 1300, "horizon": 0.48}, CUT(23.79, x=2.9, y=1.3, z=7.2, f=1300, horizon=0.48), # 7 sapu
 {"t": 23.8, "x": 3.0, "y": 1.6, "z": 4.6, "f": 1000, "horizon": 0.5}, CUT(25.29, x=3.0, y=1.6, z=4.8, f=1000, horizon=0.5),
 {"t": 25.3, "x": 2.9, "y": 1.3, "z": 7.0, "f": 1300, "horizon": 0.48}, CUT(26.29, x=2.9, y=1.3, z=7.1, f=1300, horizon=0.48), # 8 ember
 {"t": 26.3, "x": 3.0, "y": 1.6, "z": 4.6, "f": 1000, "horizon": 0.5}, CUT(27.99, x=3.0, y=1.6, z=4.8, f=1000, horizon=0.5),
 {"t": 28.0, "x": 3.4, "y": 3.3, "z": 8.4, "f": 1550, "horizon": 0.5}, CUT(30.69, x=3.4, y=3.3, z=8.8, f=1650, horizon=0.5),  #   pelukan
 {"t": 30.7, "x": 4.6, "y": 0.5, "z": 8.9, "f": 1300, "horizon": 0.55}, CUT(32.99, x=4.4, y=0.5, z=9.1, f=1300, horizon=0.55), # 9 Oyen datang
 {"t": 33.0, "x": 4.1, "y": 1.3, "z": 6.6, "f": 2000, "horizon": 0.62}, {"t": 35.3, "x": 4.0, "y": 2.5, "z": 6.6, "f": 2000, "horizon": 0.5}, {"t": 35.8, "x": 4.0, "y": 2.8, "z": 7.9, "f": 1300, "horizon": 0.5}, CUT(36.19, x=4.0, y=2.8, z=8.0, f=1300, horizon=0.5),  #   manjat
 {"t": 36.2, "x": 3.6, "y": 3.2, "z": 7.3, "f": 1150, "horizon": 0.5}, CUT(43.59, x=3.5, y=3.2, z=7.8, f=1200, horizon=0.5),   # 10 berbuah
 {"t": 43.6, "x": 2.3, "y": 1.2, "z": 5.4, "f": 1150, "horizon": 0.48}, CUT(49.59, x=2.6, y=1.3, z=6.1, f=1250, horizon=0.48), # 11 Nana
 {"t": 49.6, "x": 2.95, "y": 1.9, "z": 6.6, "f": 1150, "horizon": 0.4}, CUT(55.59, x=2.95, y=1.9, z=6.8, f=1150, horizon=0.4), # 12 berjatuhan
 {"t": 55.6, "x": 4.0, "y": 3.0, "z": 8.6, "f": 1500, "horizon": 0.5}, CUT(57.39, x=4.0, y=3.0, z=8.75, f=1500, horizon=0.5),  # 13 Oyen terakhir
 {"t": 57.4, "x": 2.9, "y": 1.45, "z": 7.4, "f": 1350, "horizon": 0.42}, CUT(60.99, x=2.9, y=1.45, z=7.7, f=1400, horizon=0.42), #   topi
 {"t": 61.0, "x": 2.35, "y": 1.3, "z": 6.0, "f": 1150, "horizon": 0.46}, CUT(65.79, x=2.4, y=1.3, z=6.3, f=1200, horizon=0.46), # 14 Bu Atin
 {"t": 65.8, "x": 2.9, "y": 1.6, "z": 8.6, "f": 1600, "horizon": 0.45}, {"t": 67.3, "x": 2.9, "y": 1.6, "z": 8.75, "f": 1650, "horizon": 0.45},  # 15 pura-pura tidur
]
# ----- arah perhatian (konteks): siapa melihat apa, waktu absolut -----
TREE_HI = [3.5, 3.25, Z_ST]; HEADPT = [HX, 1.62, HZ]
LOOKS = [
 # menunduk ke benda yang jatuh ke tanah (prioritas: ditulis paling atas)
 {"t0": 50.9, "t1": 51.6, "who": ["bima", "nana"], "at": [2.2, 0.05, 10.2]},       # bola menggelinding
 {"t0": 52.3, "t1": 52.95, "who": ["bima", "nana"], "at": [2.4, 0.03, 10.7]},       # sandal di tanah
 {"t0": 53.85, "t1": 54.25, "who": ["bima", "nana"], "at": [2.2, 0.05, 11.1]},      # sapu di tanah
 {"t0": 55.35, "t1": 55.6, "who": ["bima", "nana"], "at": [3.45, 0.0, 10.35]},      # ember penyok
 {"t0": 55.4, "t1": 57.4, "who": ["bima", "nana"], "at": [3.0, 0.05, 10.5]}, {"t0": 55.5, "t1": 57.0, "who": "hasan", "at": [3.4, 0.0, 10.0]},
 {"t0": 63.6, "t1": 65.0, "who": "atin", "at": [3.45, 0.0, 10.35]},
 {"t0": 4.0, "t1": 9.3, "who": "bima", "at": TREE_HI},
 {"t0": 11.5, "t1": 16.2, "who": "bima", "at": "hasan"},
 {"t0": 16.2, "t1": 30.6, "who": "bima", "at": TREE_HI}, {"t0": 17.4, "t1": 30.6, "who": "hasan", "at": TREE_HI},
 {"t0": 30.8, "t1": 33.3, "who": "*", "at": [4.4, 0.2, 11.2]}, {"t0": 33.3, "t1": 35.4, "who": "*", "at": [3.9, 1.4, 11.5]}, {"t0": 35.4, "t1": 43.9, "who": "*", "at": TREE_HI},
 {"t0": 45.2, "t1": 49.6, "who": ["bima", "hasan"], "at": "nana"}, {"t0": 45.2, "t1": 49.6, "who": "nana", "at": [3.6, 1.2, 11.8]},
 {"t0": 49.6, "t1": 57.6, "who": "hasan", "at": TREE_HI}, {"t0": 49.6, "t1": 57.6, "who": ["bima", "nana"], "at": "hasan"},
 {"t0": 57.6, "t1": 61.0, "who": ["bima", "nana"], "at": HEADPT},
 {"t0": 61.0, "t1": 62.1, "who": "*", "at": "atin"}, {"t0": 62.1, "t1": 67.3, "who": ["bima", "nana", "atin"], "at": "hasan"},
 {"t0": 62.1, "t1": 64.1, "who": "hasan", "at": "atin"},
]
def looks_local(t0, t1):
    return [dict(l, t0=round(l["t0"] - t0, 2), t1=round(l["t1"] - t0, 2)) for l in LOOKS if l["t1"] > t0 and l["t0"] < t1]
# ----- adegan 2: lapangan (67,3..74,4) -----
L0 = SPLIT
CAST_L = "bima:nod{expr=smile;face=r}@0,7/3.42+big_kick{face=r}/2.4+idle_three{face=r;expr=shocked}/2.0"
FX_L = [{"type": "jemuran", "x": 2.4, "za": 9.0, "zb": 12.0},
        {"type": "prop", "kind": "ball", "hold": "end", "keys": [[71.77 - L0, 0.3, 0.12, 7.0, 0], [72.9 - L0, 2.4, 1.72, 10.2, 700, 1.0]]},
        F(71.77 - L0, "DUAK!", sx=0.35, sy=0.3, size=0.13, dur=0.6), F(72.95 - L0, "NYANGKUT LAGI!", sy=0.2, size=0.1, dur=1.5)]
CAM_L = [{"t": 0, "x": 0.4, "y": 1.2, "z": 2.4, "f": 1150, "horizon": 0.47}, CUT(4.49, x=0.5, y=1.2, z=2.8, f=1150, horizon=0.47),
         {"t": 4.5, "x": 1.3, "y": 1.3, "z": 4.6, "f": 1150, "horizon": 0.48}, {"t": 7.1, "x": 1.9, "y": 1.4, "z": 6.0, "f": 1300, "horizon": 0.48}]

ep = {"title": "Bola Nyangkut", "format": "portrait", "captionCaps": True,
      "music": {"style": "kocak", "tense_until": 0, "bpm": 116},
      "sfx": [{"t": 3.6, "type": "thud"}, {"t": 7.9, "type": "rustle"}, {"t": 17.6, "type": "rustle"}, {"t": 20.8, "type": "rustle"}, {"t": 25.1, "type": "rustle"},
              {"t": 27.6, "type": "rustle"}, {"t": 33.4, "type": "boing"}, {"t": 50.72, "type": "pop"}, {"t": 51.72, "type": "pop"}, {"t": 52.22, "type": "pop"},
              {"t": 53.45, "type": "rustle"}, {"t": 54.85, "type": "thud"}, {"t": 57.58, "type": "boing"}, {"t": 61.0, "type": "dundun"}, {"t": 71.77, "type": "thud"}, {"t": 72.9, "type": "wahwah"}],
      "positions": {"hasan": [HX, HZ], "bima": [1.2, 9.2], "nana": [4.15, 11.6], "atin": [1.95, 10.35]},
      "scenes": [
        {"judul": "Kampung: bola, sandal, sapu, ember, Oyen", "loc": "kampung", "locopts": {"poles": False, "clearRight": True}, "seconds": SPLIT, "extras": "off", "cast": CAST_K, "camkeys": CAM_K,
         "fx": local(FXK, 0, SPLIT), "dialog": dlg(0, SPLIT), "looks": looks_local(0, SPLIT), "visual": "15 shot di bawah pohon mangga jalan kampung", "narasi": ""},
        {"judul": "Lapangan: janji Bima... nyangkut di jemuran", "loc": "lapangan", "seconds": round(END - SPLIT, 2), "extras": "off", "cast": CAST_L, "camkeys": CAM_L,
         "fx": FX_L, "dialog": dlg(SPLIT, END), "looks": [{"t0": 4.7, "t1": 8, "who": "bima", "at": [2.4, 1.72, 10.2]}], "visual": "Bima berjanji di lapangan, menendang lagi, bola nyangkut di jemuran", "narasi": ""}]}
json.dump(ep, open(OUT, "w"), indent=1, ensure_ascii=False)
print("ok", OUT)
