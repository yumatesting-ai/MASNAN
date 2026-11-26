// EMOSI SAAT BICARA: wajah, bentuk mulut (lip sync), & gerak kepala menyesuaikan emosi baris dialog.
// Emosi diambil dari dialog[].emo, atau tag ElevenLabs di teks ("[whispering] Bim..."), atau ditebak dari teks
// (HURUF BESAR/!! -> teriak, "?" -> penasaran).
//
//   const E = require("./emotion.js");
//   const { emo, clean } = E.parse(d);           // clean = teks tanpa tag (untuk subtitle)
//   E.applySpeak(pose, emo, mouthBase, tLocal, rig) // ubah pose pembicara
const TAGS = {
  whisper: "whisper", whispering: "whisper", whispers: "whisper",
  scared: "scared", afraid: "scared", terrified: "scared", screaming: "shock", scream: "shock", shocked: "shock", surprised: "shock", gasps: "shock",
  angry: "angry", furious: "angry", shouting: "angry", shout: "angry", yelling: "angry", annoyed: "badmood", sighs: "badmood", grumpy: "badmood", bored: "badmood",
  deadpan: "deadpan", flat: "deadpan", sad: "sad", crying: "sad", sobbing: "sad", happy: "happy", cheerful: "happy", excited: "excited", laughing: "laugh", laughs: "laugh",
  "laughs hard": "laugh", curious: "curious", suspicious: "suspicious", slowly: "suspicious", nervous: "nervous", sheepishly: "nervous", "awkward laugh": "nervous",
  confident: "proud", proudly: "proud", smug: "proud", worried: "worried", sipping: "normal", thinking: "curious", relieved: "happy",
};
// ekspresi wajah per emosi + pemetaan bentuk mulut lip sync (open/grin/o/flat/cat/shout/smile)
const EMO = {
  normal:     { expr: null, map: {} },
  whisper:    { expr: "whisper", map: { open: "small", grin: "small", shout: "small", o: "small", cat: "smallflat", flat: "smallflat", smile: "smallflat" }, lean: 4, amp: 0.4 },
  scared:     { expr: "scared", map: { open: "o", grin: "wavy", cat: "wavy", flat: "wavy", smile: "wavy" }, shake: 1.2 },
  shock:      { expr: "surprised", map: { open: "shout", grin: "shout", cat: "o", flat: "o", smile: "o" }, eyes: "wide", jolt: 1 },
  angry:      { expr: "furious", map: { open: "shout", grin: "teeth", cat: "teeth", flat: "teeth", smile: "teeth", o: "shout" }, shake: 0.8, amp: 1.6 },
  badmood:    { expr: "badmood", map: { open: "pout", grin: "flat", shout: "flat", o: "pout", cat: "flat", smile: "pout" }, amp: 0.3 },
  deadpan:    { expr: "deadpan", map: { open: "flat", grin: "flat", shout: "flat", o: "small", cat: "smallflat", smile: "flat" }, amp: 0.2 },
  sad:        { expr: "sad", map: { open: "sad_open", grin: "sad_open", shout: "sad_open", cat: "frown", flat: "frown", smile: "frown" }, droop: 4, amp: 0.5 },
  happy:      { expr: "smile", map: { open: "happy_open", grin: "grin", cat: "smile", flat: "smile" }, eyes: "happy", amp: 1.2 },
  excited:    { expr: "excited", map: { open: "happy_open", grin: "grin", cat: "smile", flat: "smile", shout: "happy_open" }, bounce: 1, amp: 1.4 },
  laugh:      { expr: "laugh", map: { open: "grin", cat: "grin", flat: "grin", o: "grin", smile: "grin", shout: "grin" }, bounce: 1 },
  curious:    { expr: "neutral", map: {}, eyes: "normal", tilt: 6 },
  suspicious: { expr: "suspicious", map: { open: "o", grin: "smirk", smile: "smirk", shout: "o" }, tilt: -4, amp: 0.5 },
  nervous:    { expr: "nervous", map: { open: "wavy", grin: "wavy", smile: "wavy", shout: "o" }, shake: 0.5, blush: 0.8 },
  proud:      { expr: "proud", map: { open: "happy_open", cat: "smile", flat: "smile", smile: "grin" }, chin: -3, amp: 1.1 },
  worried:    { expr: "worried", map: { open: "sad_open", grin: "wavy", smile: "wavy" }, droop: 2 },
};

function guess(text) {
  const letters = text.replace(/[^A-Za-z]/g, ""), caps = letters.replace(/[^A-Z]/g, "").length;
  if (letters.length > 3 && caps / letters.length > 0.6) return "angry";
  if (/!{1}/.test(text) && caps > 3) return "shock";
  if (/\?\s*$/.test(text)) return "curious";
  return "normal";
}

function parse(d) {
  const tags = [...(d.text || "").matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].toLowerCase().trim());
  const clean = (d.text || "").replace(/\[[^\]]+\]\s*/g, "").trim();
  let emo = d.emo;
  if (!emo) for (const tg of tags) if (TAGS[tg]) { emo = TAGS[tg]; break; }
  if (!emo) emo = guess(clean);
  return { emo: EMO[emo] ? emo : "normal", clean };
}

// pose pembicara: ekspresi + mulut emosi + gerak kepala khas emosi
function applySpeak(pose, emo, mouthBase, tl, rig) {
  const E = EMO[emo] || EMO.normal;
  if (E.expr && rig && rig.EXPRESSIONS && rig.EXPRESSIONS[E.expr]) {
    const pre = rig.EXPRESSIONS[E.expr];
    for (const k of ["eyes", "blush", "sweat", "anger", "gloom", "tears", "above"]) if (pre[k] !== undefined) pose[k] = pre[k];
  }
  if (E.eyes) pose.eyes = E.eyes;
  if (E.blush) pose.blush = Math.max(pose.blush || 0, E.blush);
  if (mouthBase) pose.mouth = E.map[mouthBase] || mouthBase;
  const amp = E.amp ?? 1;
  pose.headY = (pose.headY || 0) + 1.2 * amp * Math.abs(Math.sin(tl * 7));
  if (E.shake) pose.bodyX = (pose.bodyX || 0) + E.shake * Math.sin(tl * 45);
  if (E.lean) pose.headX = (pose.headX || 0) + E.lean;
  if (E.droop) pose.headY = (pose.headY || 0) + E.droop;
  if (E.tilt) pose.headTilt = (pose.headTilt || 0) + E.tilt;
  if (E.chin) pose.headY = (pose.headY || 0) + E.chin;
  if (E.bounce) pose.bodyY = (pose.bodyY || 0) - 2.5 * Math.abs(Math.sin(tl * 9));
  if (E.jolt && tl < 0.4) { pose.bodyY = (pose.bodyY || 0) - 8 * Math.sin((tl / 0.4) * Math.PI); pose.squash = -0.15; }
  return pose;
}

module.exports = { parse, applySpeak, EMO, TAGS };
