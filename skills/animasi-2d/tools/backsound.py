#!/usr/bin/env python3
"""BACKSOUND otomatis untuk episode (musik orisinal disintesis + suasana + SFX dari efek di naskah).

    python3 tools/backsound.py episodes/peronda-terberani.json --out out/bs.wav
    python3 tools/backsound.py episodes/x.json --out out/bs.wav --vo vo.mp3 --mix out/final_audio.m4a

Lapisan:
  1. MUSIK  : petikan pizzicato kartun (Karplus-Strong) + bas + shaker. Gaya dari ep["music"]:
              {"style": "kocak"|"santai", "tense_until": detik, "bpm": 112}. Sebelum tense_until = misterius (minor,
              jarang), sesudahnya = ceria-kocak (mayor, memantul). Bebas hak cipta (dibuat dari nol).
  2. SUASANA: malam (ep/scene "time":"night") -> jangkrik; siang -> burung & angin pelan.
  3. SFX    : otomatis dari fx tiap adegan: shake -> whoosh+dentum, text -> pop, cat.from -> boing, pergantian
              shot -> whoosh halus; tambahan manual ep["sfx"] = [{"t": detik_absolut, "type": "dundun"|"wahwah"|...}].
Mix (--vo): musik di-duck otomatis saat VO bicara (sidechain) dan berada ±-20 dB di bawah suara.
"""
import json, math, sys, subprocess, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4))
    return e


def pluck(freq, dur, bright=0.5, gain=1.0):
    """Karplus-Strong: senar dipetik (pizzicato/ukulele)."""
    n = int(dur * SR)
    p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p) * gain
    out = np.zeros(n)
    k = 0.5 + 0.49 * bright
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = k * buf[i % p] + (1 - k) * buf[(i + 1) % p] if i % p < p - 1 else 0.5 * (buf[i % p] + buf[0])
        buf[i % p] *= 0.996
    return out * env(n, 0.002, dur * 0.45)


def note(name):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    pitch, octv = name[:-1], int(name[-1])
    return 440 * 2 ** ((names[pitch] + 12 * (octv - 4) - 9) / 12)


def add(buf, sig, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


def noise(dur):
    return rng.uniform(-1, 1, int(dur * SR))


# ---------------- SFX ----------------
def sfx_whoosh(dur=0.45, gain=0.5):
    n = int(dur * SR); x = noise(dur)
    t = np.linspace(0, 1, n)
    # sapuan: filter low-pass yang membuka lalu menutup
    y = np.zeros(n); acc = 0.0
    for i in range(n):
        a = 0.02 + 0.25 * math.sin(math.pi * t[i])
        acc += a * (x[i] - acc); y[i] = acc
    return y * np.sin(np.pi * t) ** 1.5 * gain * 2.2


def sfx_thud(gain=0.7):
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 90 * np.exp(-t * 6) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * gain


def sfx_pop(gain=0.45):
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 900 + 1400 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * gain


def sfx_boing(gain=0.45):
    n = int(0.6 * SR); t = np.arange(n) / SR
    f = 220 + 160 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 3) + 120 * np.exp(-t * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5) * gain


def sfx_rustle(dur=0.6, gain=0.5):
    """kresek-kresek: semak bergesek (ledakan noise pendek bertubi)."""
    out = np.zeros(int(dur * SR))
    for k in range(9):
        b = noise(0.05) * env(int(0.05 * SR), 0.003, 0.02)
        b = b - lowpass(b, 0.15)  # high-pass kasar
        add(out, b, k * dur / 9 + rng.uniform(0, 0.02), rng.uniform(0.5, 1.0))
    return out * gain


def sfx_dundun(gain=0.6):
    out = np.zeros(int(1.4 * SR))
    for t0, f in ((0, note("D3")), (0.32, note("C#3"))):
        n = int(0.9 * SR); t = np.arange(n) / SR
        s = sum(np.sin(2 * np.pi * f * h * t) / h for h in (1, 2, 3, 4)) * np.exp(-t * 2.5)
        add(out, s, t0, 1.0)
    return out / np.max(np.abs(out)) * gain


def sfx_wahwah(gain=0.5):
    """trombon sedih kartun: wah-wah-wah-waaah."""
    out = np.zeros(int(2.4 * SR))
    for i, (st, d, f0) in enumerate(((0, 0.35, note("D4")), (0.4, 0.35, note("C#4")), (0.8, 0.35, note("C4")), (1.2, 1.1, note("B3")))):
        n = int(d * SR); t = np.arange(n) / SR
        vib = 1 + (0.012 * np.sin(2 * np.pi * 6 * t) if i == 3 else 0)
        ph = 2 * np.pi * np.cumsum(f0 * vib) / SR
        s = sum(np.sin(h * ph) / h ** 0.8 for h in range(1, 7))
        mute = 0.5 + 0.5 * np.sin(2 * np.pi * (2.2 if i == 3 else 3) * t - 1.2)  # efek "wah"
        add(out, s * mute * env(n, 0.03, d * 0.9), st, 1.0)
    return out / np.max(np.abs(out)) * gain


SFX = {"whoosh": sfx_whoosh, "thud": sfx_thud, "pop": sfx_pop, "boing": sfx_boing, "rustle": sfx_rustle,
       "dundun": sfx_dundun, "wahwah": sfx_wahwah}


# ---------------- MUSIK ----------------
def music(T, tense_until, bpm=112, style="kocak"):
    out = np.zeros(int(T * SR) + SR)
    beat = 60 / bpm
    # misterius (D minor, jinjit): bas D-A, melodi chromatic pelan
    sneaky_bass = ["D2", "A2", "D2", "A2", "A#2", "A2", "G2", "A2"]
    sneaky_mel = ["D4", None, "F4", None, "E4", None, "C#4", None, "D4", None, "A3", None, "A#3", "A3", "G#3", "A3"]
    # kocak (G mayor, memantul): bas oom-pah, melodi riang
    bouncy_bass = ["G2", "D3", "G2", "D3", "C3", "G3", "D3", "A2"]
    bouncy_mel = ["B4", "D5", "G4", "B4", "A4", None, "F#4", "A4", "G4", "B4", "E5", "D5", "C5", "A4", "F#4", "D4"]
    t, i = 0.0, 0
    while t < T:
        tense = t < tense_until
        bass = sneaky_bass if tense else bouncy_bass
        mel = sneaky_mel if tense else bouncy_mel
        sub = beat / 2
        if i % 2 == 0:
            add(out, pluck(note(bass[(i // 2) % len(bass)]), beat * 1.6, 0.3), t, 0.55 if tense else 0.6)
        m = mel[i % len(mel)]
        if m and (not tense or i % 2 == 0):
            add(out, pluck(note(m), beat * 1.2, 0.75), t, 0.32 if tense else 0.36)
        if not tense:  # shaker ringan di ketukan ganjil
            if i % 2 == 1:
                s = noise(0.05) * env(int(0.05 * SR), 0.002, 0.015); add(out, s - lowpass(s, 0.3), t, 0.12)
        else:  # tik jam pelan (tegang)
            if i % 4 == 0:
                add(out, sfx_pop(0.08), t, 1.0)
        t += sub; i += 1
    # akor pembuka/penutup lembut
    return out[: int(T * SR)]


def ambience(T, night):
    n = int(T * SR); out = np.zeros(n)
    if night:  # jangkrik: dengung 4,6 kHz bergetar cepat, berselang
        t = np.arange(n) / SR
        for k, (f, ph) in enumerate(((4600, 0), (4200, 1.3), (5000, 2.1))):
            chirp = (np.sin(2 * np.pi * 28 * t + ph) > 0.2) * (np.sin(2 * np.pi * (0.55 + 0.1 * k) * t + ph) > 0.1)
            out += np.sin(2 * np.pi * f * t) * chirp * 0.035
        out += lowpass(noise(T), 0.01) * 0.25  # angin malam
    else:
        out += lowpass(noise(T), 0.008) * 0.3
        for k in range(int(T / 3)):
            tt = rng.uniform(0, T); m = int(0.12 * SR); tw = np.arange(m) / SR
            add(out, np.sin(2 * np.pi * (3200 + 900 * np.sin(2 * np.pi * 18 * tw)) * tw) * env(m, 0.01, 0.05), tt, 0.05)
    return out


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def main():
    args = sys.argv[1:]
    ep = json.load(open(args[0]))
    opt = {args[i][2:]: args[i + 1] for i in range(1, len(args) - 1) if args[i].startswith("--")}
    scenes = ep["scenes"]; starts = []; T = 0
    for s in scenes:
        starts.append(T); T += s["seconds"]
    mus = ep.get("music", {})
    night = ep.get("time") == "night"
    # titik "berubah jadi kocak": momen kaget pertama (shake) bila tidak ditentukan
    tense = mus.get("tense_until")
    if tense is None:
        shakes = [starts[k] + f["t"] for k, s in enumerate(scenes) for f in s.get("fx", []) if f.get("type") == "shake"]
        tense = shakes[0] if shakes else 0
    m = music(T, tense, mus.get("bpm", 112), mus.get("style", "kocak"))
    a = ambience(T, night)
    fx = np.zeros(len(m))
    for k, s in enumerate(scenes):
        base = starts[k]
        if k > 0:
            add(fx, sfx_whoosh(0.35, 0.18), base - 0.12)
        for f in s.get("fx", []):
            ty, t0 = f.get("type"), base + f.get("t", 0)
            if ty == "shake":
                add(fx, sfx_whoosh(0.3, 0.35), t0 - 0.1); add(fx, sfx_thud(0.55), t0)
            elif ty == "text":
                add(fx, sfx_pop(0.35), t0)
                if f.get("text", "").upper().startswith("KRESEK"):
                    add(fx, sfx_rustle(0.6, 0.55), t0 - 0.05)
            elif ty == "cat" and f.get("from"):
                add(fx, sfx_boing(0.4), t0 + 0.05)
            elif ty == "ball":
                add(fx, sfx_whoosh(0.5, 0.3), base + f.get("t0", 0))
            elif ty == "splash":
                add(fx, sfx_thud(0.4), t0); add(fx, sfx_rustle(0.4, 0.4), t0)
    for e in ep.get("sfx", []):
        add(fx, SFX[e["type"]](), e["t"])
    bed = m * 0.55 + a  # musik + suasana (di-duck terhadap VO saat mix)
    out = opt.get("out", "backsound.wav")
    write_wav(out.replace(".wav", "_bed.wav"), bed / max(1e-6, np.max(np.abs(bed))) * 0.9)
    write_wav(out.replace(".wav", "_sfx.wav"), fx)
    print("Bed:", out.replace(".wav", "_bed.wav"), "| SFX:", out.replace(".wav", "_sfx.wav"), f"| {T:.1f} dtk, musik tegang s/d {tense:.1f} dtk")
    if opt.get("vo") and opt.get("mix"):
        # VO dominan; bed -20 dB & di-duck saat VO bicara; SFX di atas bed
        fc = ("[1:a]volume=0.12[bed];[0:a]asplit=2[vo][sc];[bed][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck];"
              "[2:a]volume=0.7[sfx];[vo][duck][sfx]amix=inputs=3:normalize=0:duration=longest,alimiter=limit=0.95[a]")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", opt["vo"], "-i", out.replace(".wav", "_bed.wav"), "-i", out.replace(".wav", "_sfx.wav"),
                        "-filter_complex", fc, "-map", "[a]", "-t", f"{T:.2f}", "-c:a", "aac", "-b:a", "192k", opt["mix"]], check=True)
        print("Mix:", opt["mix"])


if __name__ == "__main__":
    main()
