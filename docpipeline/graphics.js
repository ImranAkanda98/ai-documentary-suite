// ============================================================
//  GRAPHICS / CALLOUT RENDERER
//  ভিডিও প্রম্পটের graphics_callouts থেকে exact text ও position বের করে
//  ffmpeg দিয়ে আসল educational overlay বসায় (docu-style)।
//  এটাই স্লাইডশোকে ডকুমেন্টারিতে রূপ দেয়।
// ============================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BANGLA_FONT = '/usr/share/fonts/truetype/noto/NotoSansBengaliUI-Bold.ttf';
const BANGLA_FONT_REG = '/usr/share/fonts/truetype/noto/NotoSansBengaliUI-Regular.ttf';
const LATIN_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

// ---------- exact text বের করা ----------
// প্রম্পটে “...” বা "..." ভিতরের লেখাগুলোই exact text
function extractExactTexts(graphicsText) {
  if (!graphicsText) return [];
  const out = [];
  const re = /[“"]([^”"]{2,80})[”"]/g;
  let m;
  while ((m = re.exec(graphicsText))) {
    const t = m[1].trim();
    if (!t) continue;
    // বাংলা বা ইংরেজি/সংখ্যা — ছোট লেবেল
    if (t.length <= 60) out.push(t);
  }
  // একই লেবেল বারবার এলে একবারই নেব
  return [...new Set(out)];
}

// ---------- position বের করা ----------
function detectPosition(graphicsText) {
  const t = (graphicsText || '').toLowerCase();
  const pos = { x: 'left', y: 'top' };

  if (/ডান-ডান|ডান পাশে|right|উপরে-ডানে|top-right/.test(t)) {
    pos.x = 'right'; pos.y = 'top';
  } else if (/ডান-নিচে|bottom-right|ডান নিচে/.test(t)) {
    pos.x = 'right'; pos.y = 'bottom';
  } else if (/বাম-উপরে|top-left|উপরে-বামে|উপরের বাম/.test(t)) {
    pos.x = 'left'; pos.y = 'top';
  } else if (/বাম-নিচে|bottom-left|নিচে-বামে|বাম নিচে/.test(t)) {
    pos.x = 'left'; pos.y = 'bottom';
  } else if (/বাঁ পাশে|বাম পাশে|left side|বামে/.test(t)) {
    pos.x = 'left';
  } else if (/ডান পাশে|right side|ডানে/.test(t)) {
    pos.x = 'right';
  }

  if (/নিচে|বাম-নিচে|নিচের|ডান-নিচে|bottom/.test(t) && pos.y === 'top') pos.y = 'bottom';
  if (/উপরে|top/.test(t) && pos.y === 'bottom') pos.y = 'top';

  return pos;
}

// ---------- ফন্ট বাছাই ----------
function pickFont(text) {
  return /[\u0980-\u09FF]/.test(text) ? BANGLA_FONT : LATIN_FONT;
}

// ---------- ffmpeg drawtext escaping ----------
function escDrawText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "’")
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, ' ');
}

// ---------- overlay plan ----------
// প্রতিটি text-এর জন্য: position, style (label/measure/hud), size
function buildOverlayPlan(graphicsText) {
  const texts = extractExactTexts(graphicsText);
  if (!texts.length) return [];

  const pos = detectPosition(graphicsText);
  const t = (graphicsText || '').toLowerCase();
  const isMeasure = /measurement|measurement line|scale indicator|দূরত্ব|মাপ/.test(t);
  const isHud = /hud|data panel|dashboard|টেবিল|প্যানেল/.test(t);

  const plan = [];
  const maxLabels = 4;

  texts.slice(0, maxLabels).forEach((text, i) => {
    const style = isMeasure ? 'measure' : (isHud ? 'hud' : 'label');
    // একাধিক text হলে প্রথমটি বড়, বাকিগুলো ছোট
    const size = texts.length === 1 ? 54 : (i === 0 ? 50 : 40);
    plan.push({ text, style, size, pos, index: i, total: texts.length });
  });

  return plan;
}

// ---------- একটি শটের clip বানানো (graphics সহ) ----------
// img: ছবির পথ, out: ক্লিপের পথ, dur: সেকেন্ড, plan: overlay plan
function makeClipWithGraphics(img, out, dur, plan) {
  const W = 1080, H = 1920;
  const PAD = 70;
  // eslint-disable-next-line no-unused-vars

  const filters = [];

  // ১. base: scale + crop + zoompan (ken burns) + unsharp + contrast
  filters.push(
    "scale=1080:1920:force_original_aspect_ratio=increase," +
    "crop=1080:1920," +
    "zoompan=z='min(zoom+0.00055,1.14)':x='iw/2-(iw/zoom/2)+sin(on/45)*7':y='ih/2-(ih/zoom/2)+cos(on/60)*5':d=1:s=1080x1920:fps=25," +
    "unsharp=5:5:0.85:5:5:0.0," +
    "eq=contrast=1.07:saturation=1.10"
  );

  // ২. overlay layers — সব পজিশন absolute pixel (drawbox-এ w/h ফ্রেমের সাইজ নয়)
  if (plan && plan.length) {
    const total = plan.length;
    plan.forEach((p, i) => {
      const font = pickFont(p.text);
      const t = escDrawText(p.text);
      const gap = 82;
      const isRight = p.pos.x === 'right';

      // text-এর y (absolute) — drawtext-এর কাছ থেকে
      const yAbs = p.pos.y === 'top'
        ? 108 + i * gap
        : H - 118 - (total - i) * gap;

      // drawtext-এ x: right হলে টেক্সট-প্রস্থ ব্যবহার করে ডানে লাগানো (drawtext-এ tw পাওয়া যায়)
      // right হলে বাড়তি gap — accent bar টেক্সটের উপরে উঠে না
      const xExpr = isRight ? `w-tw-${PAD + 30}` : String(PAD);

      // accent bar — constant অবস্থান (tw drawbox-এ নেই)
      const barX = isRight ? W - 84 : PAD - 22;
      const barH = Math.round(p.size * 1.7);

      // leader line + dot (প্রথম label-এর জন্য)
      if (p.style === 'label' && i === 0) {
        const lineY = Math.round(H * 0.615);
        const lx = isRight ? Math.round(W * 0.46) : Math.round(W * 0.40);
        const lw = Math.round(W * 0.18);
        filters.push(`drawbox=x=${lx}:y=${lineY}:w=${lw}:h=3:color=0xF5A524@0.92:t=fill`);
        filters.push(`drawbox=x=${isRight ? lx - 22 : lx + lw - 10}:y=${lineY - 9}:w=20:h=20:color=0xF5A524@0.96:t=fill`);
      }

      // text + translucent panel
      filters.push(
        `drawtext=fontfile=${font}:text='${t}':x=${xExpr}:y=${yAbs}:` +
        `fontsize=${p.size}:fontcolor=white@0.97:borderw=2:bordercolor=0x0B1020@0.55:` +
        `shadowx=1:shadowy=2:shadowcolor=0x000000@0.45:` +
        `box=1:boxcolor=0x0B1020@0.68:boxborderw=22`
      );
      // accent bar
      filters.push(`drawbox=x=${barX}:y=${yAbs - 11}:w=6:h=${barH}:color=0xF5A524@0.95:t=fill`);
    });
  }

  const vf = filters.join(',');

  const cmd = `ffmpeg -y -loop 1 -i "${img}" -t ${dur} -c:v libx264 -preset medium -crf 18 ` +
    `-profile:v high -level 4.1 -pix_fmt yuv420p -r 25 -c:a aac -b:a 160k -movflags +faststart ` +
    `-vf "${vf}" "${out}"`;

  execSync(cmd, { stdio: 'pipe' });
}

// ---------- সব শটের জন্য ----------
function buildClips(projectDir, prompts, outDir) {
  const assets = path.join(projectDir, 'assets');
  const clips = outDir || path.join(projectDir, 'clips');
  fs.mkdirSync(clips, { recursive: true });

  const results = [];
  for (const p of prompts) {
    const no = String(p.shot_no).padStart(2, '0');
    const img = path.join(assets, `shot_${no}.jpg`);
    const clip = path.join(clips, `shot_${no}.mp4`);
    if (!fs.existsSync(img)) { console.log(`shot ${no}: ছবি নেই`); continue; }

    const dur = p.duration_sec || 4;
    const plan = buildOverlayPlan(p.graphics_callouts || p.graphics);
    try {
      makeClipWithGraphics(img, clip, dur, plan);
      results.push({ shot_no: no, clip, labels: plan.length });
      console.log(`  shot ${no}: ${plan.length ? plan.length + 'টি ক্যালআউট' : 'গ্রাফিক্স নেই'} ✓`);
    } catch (e) {
      console.log(`  shot ${no}: ✗ ${e.message.slice(0, 90)}`);
    }
  }
  return results;
}

module.exports = {
  extractExactTexts, detectPosition, buildOverlayPlan,
  makeClipWithGraphics, buildClips, BANGLA_FONT, LATIN_FONT,
};

if (require.main === module) {
  const dir = process.argv[2];
  const pj = JSON.parse(fs.readFileSync(path.join(dir, '03_video_prompts.json'), 'utf8'));
  const only = process.argv[3] ? process.argv[3].split(',') : null;
  const list = only
    ? pj.prompts.filter((p) => only.includes(String(p.shot_no)))
    : pj.prompts;
  console.log('ক্যালআউট plan:');
  list.slice(0, 6).forEach((p) => {
    const plan = buildOverlayPlan(p.graphics_callouts);
    console.log(`  shot ${p.shot_no}: ` + (plan.length
      ? plan.map((x) => `[${x.pos.x}/${x.pos.y}] "${x.text}"`).join('  ')
      : '(কোনো exact text নেই)'));
  });
}
