// ============================================================
//  SRT PARSER — Remotion motion-graphics ভিডিওর জন্য
//  SRT-কে cue (সময় + টেক্সট) এ ভাঙে, আর Remotion-এর জন্য
//  frame-based timing হিসাব করে।
// ============================================================

/**
 * SRT পার্স করে cue রাখে।
 * @param {string} srt  SRT টেক্সট
 * @returns {Array<{index:number,start:number,end:number,startMs:number,endMs:number,text:string,lines:string[]}>}
 */
function parseSrt(srt) {
  const cues = [];
  if (!srt) return cues;

  // ঘন্টা:মিনিট:সেকেন্ড,মিলিসেকেন্ড
  const toMs = (ts) => {
    const m = String(ts).trim().match(/(\d+):(\d{1,2}):(\d{1,2})[,.](\d{1,3})/);
    if (!m) return 0;
    const ms = m[4].length === 3 ? m[4] : (m[4] + '00').slice(0, 3);
    return Number(m[1]) * 3600000 + Number(m[2]) * 60000 + Number(m[3]) * 1000 + Number(ms);
  };

  // BOM ও \r সরাই, blank line-এ ভাগ করি
  const clean = String(srt).replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
  const blocks = clean.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    let i = 0;
    if (/^\d+$/.test(lines[0])) i = 1;           // index line

    const timeLine = lines[i];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [rawStart, rawEnd] = timeLine.split('-->').map((x) => x.trim());
    const startMs = toMs(rawStart);
    const endMs = toMs(rawEnd);
    if (!endMs || endMs <= startMs) continue;

    const textLines = lines.slice(i + 1);
    cues.push({
      index: cues.length + 1,
      start: startMs / 1000,
      end: endMs / 1000,
      startMs,
      endMs,
      text: textLines.join(' ').replace(/\s+/g, ' ').trim(),
      lines: textLines,
    });
  }
  return cues;
}

/**
 * Remotion-এর জন্য frame-based timing।
 * @param {Array} cues
 * @param {number} fps
 */
function toFrames(cues, fps) {
  return cues.map((c) => ({
    ...c,
    startFrame: Math.max(0, Math.round(c.start * fps)),
    endFrame: Math.round(c.end * fps),
    durationInFrames: Math.max(1, Math.round(c.end * fps) - Math.round(c.start * fps)),
  }));
}

/**
 * SRT থেকে সিন (scene) ভাগ — অর্থ অনুযায়ী, কিন্তু cue boundary মেনে চলে।
 * maxCuesPerScene: একটি সিনে সর্বোচ্চ কয়টি cue
 */
function buildScenes(cues, opts = {}) {
  const maxCues = opts.maxCuesPerScene || 4;
  const minGapSec = opts.minGapSec || 0.6;
  const scenes = [];

  let cur = null;
  for (const c of cues) {
    const gapFromPrev = cur ? c.start - cur.cues[cur.cues.length - 1].end : Infinity;
    const shouldBreak = !cur
      || cur.cues.length >= maxCues
      || gapFromPrev >= minGapSec
      || cur.cues.length >= 1 && c.end - cur.cues[0].start > (opts.maxSceneSec || 12);
    if (shouldBreak) {
      cur = { index: scenes.length, cues: [] };
      scenes.push(cur);
    }
    cur.cues.push(c);
  }
  return scenes.map((s) => ({
    index: s.index,
    cues: s.cues,
    start: s.cues[0].start,
    end: s.cues[s.cues.length - 1].end,
    text: s.cues.map((c) => c.text).join(' '),
  }));
}

/**
 * SRT থেকে সংক্ষিপ্ত বিশ্লেষণ — টোন, টপিক, সংখ্যা, ব্র্যান্ড নাম।
 */
function analyzeSrt(cues) {
  const text = cues.map((c) => c.text).join(' ');
  const words = text.split(/\s+/).filter(Boolean);

  // সংখ্যাসহ বাক্য
  const numbers = [];
  const numRe = /[০-৯0-9]+(?:\.[০-৯0-9]+)?\s*(?:%|টাকা|ডলার|কেজি|গ্রাম|মিলিমিটার|সেকেন্ড|মিনিট|ঘণ্টা|দিন|বছর|কিলো|মিটার|বছর|টাইম|গুণ|ভাগ)?/g;
  const m = text.match(numRe);
  if (m) numbers.push(...[...new Set(m.map((x) => x.trim()))].slice(0, 20));

  // ব্র্যান্ড/টুল নাম — বড় হাতের ইংরেজি শব্দ
  const brands = [...new Set((text.match(/\b[A-Z][A-Za-z0-9.+-]{1,20}\b/g) || []))].slice(0, 20);

  // প্রযুক্তিগত ইংরেজি শব্দ
  const tech = [...new Set((text.match(/\b[a-z]{3,}\b/g) || []).filter((w) =>
    ['সার্ভার', 'ভিডিও'].indexOf(w) === -1))].slice(0, 40);

  return {
    cue_count: cues.length,
    total_seconds: cues.length ? cues[cues.length - 1].end : 0,
    word_count: words.length,
    text,
    numbers,
    brands,
    avg_cue_seconds: cues.length
      ? cues.reduce((a, c) => a + (c.end - c.start), 0) / cues.length : 0,
  };
}

module.exports = { parseSrt, toFrames, buildScenes, analyzeSrt };

if (require.main === module) {
  const fs = require('fs');
  const f = process.argv[2];
  const cues = parseSrt(fs.readFileSync(f, 'utf8'));
  const a = analyzeSrt(cues);
  console.log(`cue: ${a.cue_count} | মোট: ${a.total_seconds.toFixed(1)}s | শব্দ: ${a.word_count} | গড় cue: ${a.avg_cue_seconds.toFixed(2)}s`);
  console.log('সংখ্যা:', a.numbers.join(', '));
  console.log('ব্র্যান্ড:', a.brands.join(', '));
  console.log('\nপ্রথম ৩টি cue:');
  a.cue_count && cues.slice(0, 3).forEach((c) => console.log(`  [${c.start.toFixed(1)}–${c.end.toFixed(1)}] ${c.text}`));
}
