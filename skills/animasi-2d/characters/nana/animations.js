// Klip animasi untuk Nana: fungsi waktu (detik) -> pose.
// Semua klip loop mulus pada durasinya.

(function (root) {
  const TAU = Math.PI * 2;
  const wave = (t, period, phase = 0) => Math.sin(TAU * (t / period + phase));

  // Kedip singkat pada waktu-waktu tertentu (detik), durasi ~0.18 dtk
  function blinkAt(t, times, dur = 0.18) {
    for (const k of times) {
      const d = t - k;
      if (d >= 0 && d <= dur) return Math.sin((Math.PI * d) / dur);
    }
    return 0;
  }

  const CLIPS = {
    // Diam bernapas, kedip, rambut & ahoge bergoyang pelan
    idle: {
      duration: 4,
      pose: (t) => ({
        breathe: (wave(t, 2) + 1) / 2,
        headY: 1.2 * wave(t, 2, 0.15),
        hairSway: 0.8 * wave(t, 4),
        ahoge: 6 * wave(t, 2, 0.3),
        armL: 1.5 * wave(t, 2, 0.1),
        armR: 1.5 * wave(t, 2, 0.1),
        blink: blinkAt(t, [1.1, 3.2, 3.45]),
      }),
    },

    // Melambai dengan tangan kanan layar
    wave: {
      duration: 2,
      pose: (t) => ({
        breathe: (wave(t, 2) + 1) / 2,
        armR: 122 + 16 * wave(t, 0.5),
        armL: 2 * wave(t, 2),
        headTilt: 5,
        ahoge: 10 * wave(t, 0.5, 0.2),
        hairSway: 1.2 * wave(t, 1),
        mouth: "open",
        sweat: false,
        blink: blinkAt(t, [1.4]),
      }),
    },

    // Gugup: lirik kiri-kanan, keringat, badan sedikit gemetar
    nervous: {
      duration: 3,
      pose: (t) => ({
        lookX: Math.max(-1, Math.min(1, 1.6 * wave(t, 3))),
        bodyY: 0.8 * wave(t, 0.15),
        headTilt: -3,
        ahoge: 4 * wave(t, 0.3),
        mouth: "flat",
        sweat: true,
        armL: -3,
        armR: -3,
        blink: blinkAt(t, [0.7, 2.2]),
      }),
    },
  };

  const api = { CLIPS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NanaClips = api;
})(typeof window !== "undefined" ? window : globalThis);
