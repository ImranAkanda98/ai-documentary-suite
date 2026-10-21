// ============================================================
//  REMOTION PROJECT GENERATOR
//  SRT + theme থেকে সম্পূর্ণ Remotion প্রজেক্ট তৈরি করে।
//  কম্পোনেন্ট ফাইলগুলো template/ থেকে কপি হয় (escaping সমস্যা নেই)।
//  ব্যবহার: node generate.js <srt_path> <out_dir> [options.json]
// ============================================================

const fs = require('fs');
const path = require('path');
const { parseSrt, toFrames, buildScenes, analyzeSrt } = require('./srt');

const TEMPLATE = path.join(__dirname, 'template');

const DEFAULT_THEME = {
  name: 'Midnight Tech',
  bg: '#0B1020',
  hero: '#4F7CFF',
  accent: '#F5A524',
  text: '#F2F5FF',
  muted: '#8C97C4',
  surface: '#161D33',
  font: 'Hind Siliguri',
};

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;

// ---------------- layout বাছাই ----------------

function extractStats(text) {
  const re = /([০-৯0-9]+(?:\.[০-৯0-9]+)?)\s*(%|টাকা|ডলার|কেজি|গ্রাম|মিলিমিটার|সেকেন্ড|মিনিট|ঘণ্টা|দিন|বছর|কিলো|মিটার|টাইম|গুণ|ভাগ|টি|x|X|ms|s)/g;
  const out = [];
  let m;
  while ((m = re.exec(text)) && out.length < 4) out.push({ value: m[1], unit: m[2] });
  return out;
}

function cleanItem(s) {
  return String(s).replace(/^[•\-–—]\s*/, '').replace(/^[১২৩৪৫৬৭৮৯০]+[.)।]\s*/, '').trim();
}

function buildLayout(cue) {
  const text = cue.text;
  const lines = cue.lines;
  const title = lines[0] || text;

  if (lines.length >= 3) {
    return { id: 'bullets', title, items: lines.slice(1).map(cleanItem).filter(Boolean), style: 'bento' };
  }
  if (lines.length === 2) {
    if (/(আগে|পরে|থেকে|বনাম|vs|before|after)/i.test(text)) {
      return { id: 'split', title, left: lines[1] || '', right: '', style: 'split' };
    }
    return { id: 'cards', title, items: [lines[1]], style: 'glass' };
  }

  const stats = extractStats(text);
  if (stats.length >= 2) return { id: 'dashboard', title, stats, style: 'dashboard' };
  return { id: 'statement', title: text, style: 'statement' };
}

// ---------------- ফাইল লেখা ----------------

function writeFile(dir, rel, content) {
  const fp = path.join(dir, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content);
}

function copyDir(dir, src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(dir, s, d);
    else fs.copyFileSync(s, d);
  }
}

const packageJson = (name) => JSON.stringify({
  name: name || 'remotion-video',
  version: '1.0.0',
  private: true,
  scripts: {
    studio: 'remotion studio',
    render: 'remotion render src/index.ts Main out/video.mp4',
  },
  dependencies: {
    '@remotion/cli': '4.0.537',
    '@remotion/google-fonts': '4.0.537',
    remotion: '4.0.537',
    react: '19.0.0',
    'react-dom': '19.0.0',
  },
  devDependencies: {
    typescript: '5.6.3',
    '@types/react': '19.0.0',
  },
}, null, 2);

const remotionConfig = [
  "import {Config} from '@remotion/cli/config';",
  '',
  "Config.setVideoImageFormat('jpeg');",
  'Config.setOverwriteOutput(true);',
  "Config.setChromiumOpenGlRenderer('angle');",
  '',
].join('\n');

const tsconfig = JSON.stringify({
  compilerOptions: {
    target: 'ES2018',
    lib: ['dom', 'dom.iterable', 'esnext'],
    jsx: 'react-jsx',
    module: 'esnext',
    moduleResolution: 'bundler',
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  },
  include: ['src'],
}, null, 2);

const indexTs = [
  "import {registerRoot} from 'remotion';",
  "import {RemotionRoot} from './Root';",
  '',
  'registerRoot(RemotionRoot);',
  '',
].join('\n');

function rootTs(totalFrames, fps) {
  return [
    "import React from 'react';",
    "import {Composition} from 'remotion';",
    "import {Main} from './Main';",
    "import {DURATION, FPS, WIDTH, HEIGHT} from './data';",
    '',
    'export const RemotionRoot: React.FC = () => {',
    '  return (',
    '    <Composition',
    '      id="Main"',
    '      component={Main}',
    '      durationInFrames={DURATION}',
    '      fps={FPS}',
    '      width={WIDTH}',
    '      height={HEIGHT}',
    '    />',
    '  );',
    '};',
    '',
  ].join('\n');
}

function themeTs(t) {
  return [
    '// সব রঙ, ইজিং, ফন্ট — এক জায়গায়',
    'export const theme = {',
    '  name: ' + JSON.stringify(t.name) + ',',
    '  colors: {',
    '    bg: ' + JSON.stringify(t.bg) + ',',
    '    hero: ' + JSON.stringify(t.hero) + ',',
    '    accent: ' + JSON.stringify(t.accent) + ',',
    '    text: ' + JSON.stringify(t.text) + ',',
    '    muted: ' + JSON.stringify(t.muted) + ',',
    '    surface: ' + JSON.stringify(t.surface) + ',',
    '  },',
    '  radius: 22,',
    '  font: ' + JSON.stringify(t.font) + ',',
    '  easing: {',
    "    enter: 'cubic-bezier(0.16, 1, 0.3, 1)',",
    "    exit: 'cubic-bezier(0.7, 0, 0.84, 0)',",
    '  },',
    '  motion: {',
    '    soft: {damping: 200, mass: 0.7, stiffness: 120},',
    '    snap: {damping: 26, mass: 0.6, stiffness: 220},',
    '  },',
    '};',
    '',
    'export type Theme = typeof theme;',
    '',
  ].join('\n');
}

function dataTs(scenes, cues, fps, totalFrames, w, h) {
  return [
    '// অটো-জেনারেটেড — SRT থেকে',
    'export const FPS = ' + fps + ';',
    'export const WIDTH = ' + w + ';',
    'export const HEIGHT = ' + h + ';',
    'export const DURATION = ' + totalFrames + ';',
    '',
    'export type Cue = {',
    '  index: number;',
    '  startFrame: number;',
    '  endFrame: number;',
    '  text: string;',
    '  lines: string[];',
    '};',
    '',
    'export type Scene = {',
    '  index: number;',
    '  startFrame: number;',
    '  endFrame: number;',
    '  durationInFrames: number;',
    '  layout: any;',
    '};',
    '',
    'export const cues: Cue[] = ' + JSON.stringify(cues, null, 2) + ';',
    '',
    'export const scenes: Scene[] = ' + JSON.stringify(scenes, null, 2) + ';',
    '',
  ].join('\n');
}

// ---------------- মূল ----------------

function generate(srtPath, outDir, opts = {}) {
  const srt = fs.readFileSync(srtPath, 'utf8');
  const cues = parseSrt(srt);
  if (!cues.length) throw new Error('SRT-তে কোনো cue পাওয়া যায়নি');

  const fps = opts.fps || FPS;
  const w = opts.width || WIDTH;
  const h = opts.height || HEIGHT;
  const theme = Object.assign({}, DEFAULT_THEME, opts.theme || {});
  const fCues = toFrames(cues, fps);
  const rawScenes = buildScenes(fCues, opts.scenes || {});

  const scenes = rawScenes.map((s) => {
    const layout = buildLayout(s.cues[0]);
    return {
      index: s.index,
      startFrame: s.cues[0].startFrame,
      endFrame: s.cues[s.cues.length - 1].endFrame,
      durationInFrames: Math.max(1, s.cues[s.cues.length - 1].endFrame - s.cues[0].startFrame),
      layout,
    };
  });

  const totalFrames = fCues[fCues.length - 1].endFrame + Math.round(fps * 0.6);

  // ---------------- ফাইল লেখা ----------------
  fs.mkdirSync(outDir, { recursive: true });
  copyDir(outDir, path.join(TEMPLATE, 'src'), path.join(outDir, 'src'));

  // SFX তৈরি ও কপি
  const sfxDir = path.join(outDir, 'public', 'sfx');
  fs.mkdirSync(sfxDir, { recursive: true });
  const {generateAll} = require('./sfx');
  const sfxReport = generateAll(sfxDir);

  // SFX ইভেন্ট: সিন ট্রানজিশন + প্রথম সিনে soft thud
  const sfxEvents = scenes.map((sc, i) => ({
    name: i === 0 ? 'thud' : 'whoosh',
    at: sc.startFrame,
    volume: i === 0 ? 0.24 : 0.2,
  }));
  writeFile(outDir, 'package.json', packageJson(opts.name));
  writeFile(outDir, 'remotion.config.ts', remotionConfig);
  writeFile(outDir, 'tsconfig.json', tsconfig);
  writeFile(outDir, 'src/index.ts', indexTs);
  writeFile(outDir, 'src/Root.tsx', rootTs(totalFrames, fps));
  writeFile(outDir, 'src/theme.ts', themeTs(theme));
  writeFile(outDir, 'src/data.ts', dataTs(scenes, fCues, fps, totalFrames, w, h));
  // SFX ইভেন্ট লিখে দিই
  const sfxPath = path.join(outDir, 'src', 'components', 'Sfx.tsx');
  let sfxSrc = fs.readFileSync(sfxPath, 'utf8');
  sfxSrc = sfxSrc.replace(
    'export const SFX_EVENTS: SfxEvent[] = [];',
    'export const SFX_EVENTS: SfxEvent[] = ' + JSON.stringify(sfxEvents, null, 2) + ';'
  );
  fs.writeFileSync(sfxPath, sfxSrc);
  writeFile(outDir, 'public/.gitkeep', '');
  writeFile(outDir, 'public/sfx/.gitkeep', '');
  // SRT আগে কপি করি (manifest-এ তালিকা দেখাতে হবে)
  fs.copyFileSync(srtPath, path.join(outDir, 'public', path.basename(srtPath)));

  // manifest.json — কোন অপশনাল ফাইল আছে (PreviewAudio 404 ছাড়া যাচাই করার জন্য)
  const manifest = {
    voiceover: fs.existsSync(path.join(outDir, 'public', 'voiceover.mp3')),
    srt: fs.readdirSync(path.join(outDir, 'public')).filter((f) => f.endsWith('.srt')),
    assets: [],
  };
  const assetsDir = path.join(outDir, 'public', 'assets');
  if (fs.existsSync(assetsDir)) {
    manifest.assets = fs.readdirSync(assetsDir).filter((f) => !f.startsWith('.'));
  }
  writeFile(outDir, 'public/manifest.json', JSON.stringify(manifest, null, 2));
  writeFile(outDir, 'srt.json', JSON.stringify({ fps, totalFrames, scenes, cues: fCues }, null, 2));

  return {
    outDir,
    sfxReport,
    cueCount: cues.length,
    sceneCount: scenes.length,
    totalFrames,
    totalSeconds: totalFrames / fps,
    theme,
    analysis: analyzeSrt(cues),
  };
}

module.exports = { generate, DEFAULT_THEME, buildLayout, TEMPLATE };

if (require.main === module) {
  const [srtPath, outDir, optsPath] = process.argv.slice(2);
  if (!srtPath || !outDir) {
    console.error('ব্যবহার: node generate.js <srt> <out_dir> [opts.json]');
    process.exit(1);
  }
  const opts = optsPath ? JSON.parse(fs.readFileSync(optsPath, 'utf8')) : {};
  const r = generate(srtPath, outDir, opts);
  console.log('✓ ' + r.outDir);
  console.log('  cue: ' + r.cueCount + ' | সিন: ' + r.sceneCount +
    ' | মোট: ' + r.totalSeconds.toFixed(1) + 's (' + r.totalFrames + ' frame)');
}
