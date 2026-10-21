// ============================================================
//  SFX SYNTHESIZER — কোডেই তৈরি (কোনো ফাইল ডাউনলোড নয়)
//  pop · click · whoosh · chime — সবই natural-ish, সরল beep নয়
//  ব্যবহার: node sfx.js <out_dir>
// ============================================================

const fs = require('fs');
const path = require('path');

const SR = 44100;

// ---------- হেল্পার ----------

// এক-পোল (one-pole) লো-পাস ফিল্টার
function lowpass(buf, cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SR;
  const alpha = dt / (rc + dt);
  let prev = 0;
  for (let i = 0; i < buf.length; i++) {
    prev += alpha * (buf[i] - prev);
    buf[i] = prev;
  }
  return buf;
}

// লো-পাস + রেজোনেন্স (সরল 2-পোল) — Reverb-এর কাছাকাছি
function reverb(buf, amount = 0.16, decay = 0.35) {
  const n = buf.length;
  const wet = new Float32Array(n);
  const d1 = Math.floor(SR * 0.017);
  const d2 = Math.floor(SR * 0.031);
  for (let i = 0; i < n; i++) {
    let s = 0;
    if (i >= d1) s += buf[i - d1] * decay;
    if (i >= d2) s += buf[i - d2] * decay * 0.6;
    wet[i] = buf[i] + s * amount;
  }
  return wet;
}

// নরম attack / দ্রুত decay envelope
function envelope(i, n, attack = 0.005, decayPow = 2.2) {
  const a = Math.floor(SR * attack);
  if (i < a) return i / Math.max(1, a);
  const t = (i - a) / Math.max(1, n - a);
  return Math.pow(1 - t, decayPow);
}

// সব নম্বর peak-এ normalize, তারপর target gain
function normalize(buf, peak = 0.85) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  if (max < 1e-9) return buf;
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
}

function softClip(buf) {
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    buf[i] = Math.tanh(x * 1.2) * 0.92;
  }
  return buf;
}

// ---------- শব্দ তৈরি ----------

// pop — দ্রুত নিচে নামা pitch-এর sine + ছোট envelope
function makePop(dur = 0.22) {
  const n = Math.floor(SR * dur);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 620 * Math.exp(-9 * t) + 90;     // দ্রুত নিচে নামা
    buf[i] = Math.sin(2 * Math.PI * f * t) * envelope(i, n, 0.003, 2.6);
  }
  lowpass(buf, 5200);
  return normalize(reverb(softClip(buf), 0.1), 0.8);
}

// click — high-pass করা ছোট noise burst
function makeClick(dur = 0.09) {
  const n = Math.floor(SR * dur);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    buf[i] = (Math.random() * 2 - 1) * envelope(i, n, 0.001, 3.4);
  }
  // high-pass: original থেকে lowpass সরিয়ে দেওয়া
  const lp = lowpass(Float32Array.from(buf), 1800);
  for (let i = 0; i < n; i++) buf[i] = buf[i] - lp[i];
  lowpass(buf, 12000);
  return normalize(reverb(softClip(buf), 0.07), 0.7);
}

// whoosh — band-passed noise sweep + fade in/out
function makeWhoosh(dur = 0.55) {
  const n = Math.floor(SR * dur);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * t) ** 1.4;    // fade in + out
    raw[i] = (Math.random() * 2 - 1) * env;
  }
  // band-pass প্রায়: lowpass 6000 - lowpass 700
  const hi = lowpass(Float32Array.from(raw), 6000);
  const lo = lowpass(Float32Array.from(raw), 700);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = hi[i] - lo[i];
  lowpass(buf, 7000);
  return normalize(reverb(softClip(buf), 0.14), 0.75);
}

// chime / pluck — নরম overtones সহ ছোট decay
function makeChime(dur = 0.5) {
  const n = Math.floor(SR * dur);
  const buf = new Float32Array(n);
  const partials = [
    { f: 880, a: 1.0, d: 2.0 },
    { f: 1320, a: 0.42, d: 2.6 },
    { f: 1760, a: 0.22, d: 3.2 },
    { f: 2640, a: 0.1, d: 4.0 },
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const p of partials) s += Math.sin(2 * Math.PI * p.f * t) * p.a * Math.exp(-p.d * t);
    buf[i] = s * envelope(i, n, 0.002, 1.2);
  }
  lowpass(buf, 6000);
  return normalize(reverb(softClip(buf), 0.2), 0.7);
}

// thud — খুব হালকা soft thud (হুক/মূল বার্তা)
function makeThud(dur = 0.3) {
  const n = Math.floor(SR * dur);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 120 * Math.exp(-7 * t) + 45;
    buf[i] = Math.sin(2 * Math.PI * f * t) * envelope(i, n, 0.004, 2.4);
  }
  lowpass(buf, 900);
  return normalize(reverb(softClip(buf), 0.12), 0.7);
}

// ---------- WAV লেখা ----------

function writeWav(file, samples) {
  const n = samples.length;
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    let v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);            // PCM
  header.writeUInt16LE(1, 22);            // mono
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);       // byte rate
  header.writeUInt16LE(2, 32);            // block align
  header.writeUInt16LE(16, 34);           // bits
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, data]));
  return { file, dur: n / SR, peak: Math.max(...Array.from(samples, (v) => Math.abs(v))) };
}

// ---------- main ----------

const SOUNDS = {
  pop: makePop,
  click: makeClick,
  whoosh: makeWhoosh,
  chime: makeChime,
  thud: makeThud,
};

function generateAll(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const report = [];
  for (const [name, fn] of Object.entries(SOUNDS)) {
    const samples = fn();
    const info = writeWav(path.join(outDir, name + '.wav'), samples);
    report.push({ name, dur: +info.dur.toFixed(3), peak: +info.peak.toFixed(3) });
  }
  return report;
}

module.exports = { generateAll, writeWav, SOUNDS, SR };

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, 'sfx');
  const rep = generateAll(out);
  console.log('✓ SFX তৈরি হয়েছে → ' + out);
  rep.forEach((r) => {
    const clip = r.peak > 1 ? ' ⚠ CLIPPING' : '';
    console.log(`  ${r.name.padEnd(8)} ${r.dur}s  peak ${r.peak}${clip}`);
  });
}
