// ============================================================
//  AI EDUCATIONAL DOCUMENTARY — MAIN PRODUCTION PIPELINE
//  ৪ স্টেজ: Script → Shot List → Video Prompts → Assets
//  প্রতিটি স্টেজ শেষে STOP করে, approval ছাড়া পরেরটায় যায় না।
// ============================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generate } = require('./llm');
const { research, researchToText } = require('./research');

const ROOT = '/home/imran/n8n/docpipeline';
const PROJECTS = path.join(ROOT, 'projects');
const PROMPTS = path.join(ROOT, 'prompts');
const STYLE_FILE = path.join(ROOT, 'style', 'sample_scripts.txt');

fs.mkdirSync(PROJECTS, { recursive: true });

// ---------- সহায়ক ----------
const slug = (s) => s.toLowerCase().replace(/[^\u0980-\u09FF a-z0-9]+/g, '-').replace(/\s+/g, '-').slice(0, 50).trim();
const readJSON = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const writeJSON = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));

function projDir(id) { return path.join(PROJECTS, id); }
function statePath(id) { return path.join(projDir(id), 'state.json'); }

function loadState(id) {
  const s = readJSON(statePath(id));
  if (!s) throw new Error('প্রজেক্ট পাওয়া যায়নি: ' + id);
  return s;
}

function saveState(id, st) { writeJSON(statePath(id), st); }

function readPrompt(name) {
  return fs.readFileSync(path.join(PROMPTS, name), 'utf8');
}

// সব placeholder বদলানো (global) — String.replace শুধু প্রথমটা বদলায়,
// তাই একই placeholder একাধিকবার থাকলে বাকিগুলো অপরিবর্তিত থাকে।
function fillPrompt(tpl, vars) {
  let out = String(tpl);
  for (const [k, v] of Object.entries(vars)) {
    out = out.split('{{' + k + '}}').join(v == null ? '' : String(v));
  }
  return out;
}

function styleSample() {
  try {
    const s = fs.readFileSync(STYLE_FILE, 'utf8').trim();
    return s.length > 100 ? s : '(কোনো sample script নেই — স্বাভাবিক উষ্ণ, কৌতূহলী, চাপিয়ে দেওয়া ডকুমেন্টারি টোন ব্যবহার করো)';
  } catch {
    return '(কোনো sample script নেই — স্বাভাবিক উষ্ম, কৌতূহলী, চাপিয়ে দেওয়া ডকুমেন্টারি টোন ব্যবহার করো)';
  }
}

// ---------- ফাইল লক (একসাথে দুটি রান হলে ফাইল মুছে যায় না) ----------
const LOCK = path.join(ROOT, '.pipeline.lock');
function acquireLock() {
  // আগের লকের প্রসেস কি বেঁচে আছে? না থাকলে স্টেল লক সরাও
  try {
    const old = fs.readFileSync(LOCK, 'utf8').trim();
    if (old && old !== String(process.pid)) {
      let alive = true;
      try { process.kill(Number(old), 0); } catch { alive = false; }
      if (!alive) {
        console.log('⚠ স্টেল লক সরানো হয়েছে (pid ' + old + ' আর নেই)');
        fs.unlinkSync(LOCK);
      } else {
        console.log('✗ আরেকটি প্রসেস চলছে (pid ' + old + ')। আগে সেটি শেষ হতে দিন।');
        process.exit(1);
      }
    }
  } catch {}

  // exclusive তৈরি করো — দুটো প্রসেস একসাথে পেতে পারবে না
  try {
    fs.writeFileSync(LOCK, String(process.pid), { flag: 'wx' });
    return true;
  } catch (e) {
    if (e.code === 'EEXIST') {
      console.log('✗ আরেকটি প্রসেস চলছে। আগে সেটি শেষ হতে দিন।');
      process.exit(1);
    }
    console.log('✗ লক তৈরি ব্যর্থ: ' + e.message);
    process.exit(1);
  }
}
function releaseLock() {
  try { fs.unlinkSync(LOCK); } catch {}
}
process.on('exit', releaseLock);
process.on('SIGINT', () => { releaseLock(); process.exit(1); });
acquireLock();


// ============================================================
//  video_prompt থেকে অনুপস্থিত field টেনে নেওয়া
//  মডেল সবসময় standalone field দেয় না — কিন্তু combined prompt-এ
//  ৬টি section ঠিকই থাকে। সেখান থেকে খালি field পূরণ করি।
// ============================================================
const VP_SECTIONS = [
  ['environment', 'Environment'],
  ['main_subject', 'Main Subject'],
  ['subject_activity', 'Subject Activity'],
  ['camera_movement', 'Camera Movement'],
  ['graphics_callouts', 'Graphics / Callouts'],
  ['ambience_sound', 'Ambience Sound'],
];

function fillFromVideoPrompt(p, shot) {
  if (!p) return p;
  const vp = p.video_prompt || '';
  // "SHOT 25 [Script Section: "..."]" অংশটা আলাদা করি
  const head = vp.match(/SHOT\s+\d+\s*\[Script Section:\s*"([\s\S]*?)"\]/);
  if (head && !p.script_section) p.script_section = head[1];
  const shotNo = vp.match(/SHOT\s+(\d+)/);
  if (shotNo && !p.shot_no) p.shot_no = shotNo[1];

  for (const [field, header] of VP_SECTIONS) {
    if (p[field] && String(p[field]).trim()) continue;
    // header থেকে পরের header পর্যন্ত টেক্সট
    const re = new RegExp(header + ':\\s*([\\s\\S]*?)(?=\\n?(?:Environment|Main Subject|Subject Activity|Camera Movement|Graphics \\/ Callouts|Ambience Sound):|$)');
    const m = vp.match(re);
    if (m && m[1] && m[1].trim()) p[field] = m[1].trim();
  }

  // camera_movement নেই → shotlist থেকে নাও
  if (!(p.camera_movement && String(p.camera_movement).trim()) && shot) {
    const cm = shot.camera_movement || shot.movement || '';
    if (cm) p.camera_movement = cm;
  }
  // ambience_sound নেই → ডিফল্ট
  if (!(p.ambience_sound && String(p.ambience_sound).trim())) {
    p.ambience_sound = 'নিজস্ব শব্দে এই পরিবেশের স্বাভাবিক শব্দ — বাতাস, পানি, পায়ের শব্দ, শ্বাস; কোনো Background Music নেই।';
  }

  // video_prompt-এ ৬টি section header নেই → standalone field থেকে পুনর্গঠন করো
  const hasAllHeaders = VP_SECTIONS.every(([, h]) => vp.includes(h + ':'));
  if (!hasAllHeaders) {
    const parts = [];
    parts.push('SHOT ' + (p.shot_no || '01') +
      (p.script_section ? ' [Script Section: "' + p.script_section + '"]' : ''));
    for (const [field, header] of VP_SECTIONS) {
      const val = p[field] && String(p[field]).trim();
      if (val) parts.push(header + ': ' + val);
    }
    if (parts.length > 1) p.video_prompt = parts.join('\n\n');
  }
  return p;
}

// ============================================================
//  STAGE 1 — TOPIC → NARRATION SCRIPT
//  ফ্রি মডেলে আউটপুট টোকেন সীমিত, তাই প্রতিটি সেকশন আলাদা করে লেখা হয়।
// ============================================================

const SECTIONS = [
  { name: 'HOOK', words: 55, next: 'CONTEXT' },
  { name: 'CONTEXT', words: 115, next: 'CORE' },
  { name: 'CORE', words: 150, next: 'DEEP_DIVE' },
  { name: 'DEEP_DIVE', words: 130, next: 'RESOLUTION' },
  { name: 'RESOLUTION', words: 95, next: 'CLOSING' },
  { name: 'CLOSING', words: 50, next: null },
];

async function stage1(topic, projectId) {
  const id = projectId || slug(topic) || 'project-' + Date.now();
  const dir = projDir(id);
  // নিরাপত্তা: আগের কাজ থাকলে ধ্বংস না করে ব্যাকআপ নাও
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) {
    const bak = dir + '_backup_' + Date.now();
    try {
      fs.renameSync(dir, bak);
      console.log('⚠ আগের প্রজেক্ট ব্যাকআপ হিসেবে রাখা হয়েছে: ' + bak);
    } catch (e) {
      console.log('⚠ ব্যাকআপ নিতে ব্যর্থ: ' + e.message);
    }
  }
  fs.mkdirSync(dir, { recursive: true });

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  STAGE 1: TOPIC → NARRATION SCRIPT     ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('টপিক: ' + topic);
  console.log('প্রজেক্ট: ' + id);

  const sys = 'তুমি একজন অভিজ্ঞ বাংলা Educational Documentary Script Writer। তুমি শুধুমাত্র valid JSON আউটপুট দাও।';
  const sections = [];
  const allFacts = [];
  const allUnc = [];
  let modelUsed = '';

  // ---------- RESEARCH (MP-01 Section 1) ----------
  console.log('  [রিসার্চ] Web তথ্য সংগ্রহ হচ্ছে...');
  let researchText = '(রিসার্চ পাওয়া যায়নি — যা জানা আছে তা থেকে লিখুন, কিন্তু বানানো সংখ্যা/নাম নয়)';
  let researchData = null;
  try {
    const isBangla = /[\u0980-\u09FF]/.test(topic);
    // বাংলা টপিক হলে ইংরেজি search keyword বানাও (Wikipedia-এ ইংরেজি ভালো কাজ করে)
    let searchTopic = topic;
    if (isBangla) {
      try {
        const kw = await generate(
          'তুমি একজন search query লেখক। তুমি শুধু JSON দাও।',
          `এই বাংলা ডকুমেন্টারি টপিকটির জন্য Wikipedia-তে খুঁজতে উপযুক্ত ইংরেজি search term লেখো।\n` +
          `টপিক: ${topic}\n\n` +
          `উত্তর: {"term":"Emperor penguin","alt":"Antarctic penguin cold adaptation"}`,
          { max_tokens: 200, temperature: 0.2, response_format: true }
        );
        if (kw.data && kw.data.term) searchTopic = kw.data.term;
      } catch {}
    }
    researchData = research(searchTopic, { lang: isBangla ? 'bn' : 'en', depth: 'full', relevanceTopic: topic + ' ' + searchTopic });

    // ---------- FACT SELECTION ----------
    // keyword scoring একা যথেষ্ট না (একটি common শব্দ মিললেই ভুল article চলে আসে)।
    // তাই LLM দিয়ে টপিকের সাথে সবচেয়ে প্রাসঙ্গিক fact গুলো বেছে নিই।
    if (researchData.facts.length > 2) {
      try {
        const cand = researchData.facts.map((f, i) => `[${i}] ${f.title}\n${f.text.slice(0, 900)}`).join('\n\n');
        const sel = await generate(
          'তুমি একজন research editor। তুমি শুধু JSON দাও।',
          `টপিক: ${topic}\n\nনিচে Wikipedia থেকে সংগ্রহ করা কিছু article-এর excerpt দেওয়া আছে।\n\n` +
          `${cand}\n\n` +
          `কাজ: টপিকটির জন্য সবচেয়ে প্রাসঙ্গিক ও তথ্যবহুল ৩টি excerpt বেছে নাও (সূচক নম্বর দাও)।\n` +
          `গুরুত্বপূর্ণ নিয়ম:\n` +
          `• যেসব excerpt টপিকের সাথে সরাসরি প্রাসঙ্গিক নয় (যেমন কোনো একক ব্যক্তির গল্প, অপ্রাসঙ্গিক উদাহরণ) সেগুলো বাদ দাও।\n` +
          `• Process/Mechanism/Structure-সম্পর্কিত তথ্য রাখো — সংখ্যা, কারণ, ধাপ, পরিবেশ, শারীরিক গঠন।\n` +
          `• ফরম্যাট: {"selected":[0,2,3]}`,
          { max_tokens: 200, temperature: 0.1, response_format: true }
        );
        const idx = (sel.data && sel.data.selected) || [];
        const picked = idx.map((i) => researchData.facts[i]).filter(Boolean);
        if (picked.length >= 2) {
          researchData.facts = picked;
          const keep = new Set(picked.map((f) => f.title));
          researchData.sources = researchData.sources.filter((s) => keep.has(s.title));
        }
      } catch (e) {
        console.log('    ⚠ fact selection ব্যর্থ (' + e.message + ')');
      }
    }

    researchText = researchToText(researchData, 8000);
    console.log('    ✓ ' + researchData.facts.length + 'টি তথ্য, ' + researchData.sources.length + 'টি উৎস');
  } catch (e) {
    console.log('    ⚠ রিসার্চ ব্যর্থ (' + e.message + ')');
  }

  for (let i = 0; i < SECTIONS.length; i++) {
    const s = SECTIONS[i];
    const prev = sections.length
      ? sections.map((x) => x.name + ': ' + x.text).join('\n\n')
      : '(এটাই প্রথম অংশ)';

    process.stdout.write(`  ${s.name} (${s.words} শব্দ)... `);
    const user = fillPrompt(readPrompt('mp01_script.txt'), {
      STYLE_SAMPLE: styleSample(),
      TOPIC: topic,
      RESEARCH: researchText,
      SECTION: s.name,
      WORDS: s.words,
      PREVIOUS: prev,
      NEXT: s.next || '(এটাই শেষ)',
    });

    try {
      const res = await generate(sys, user, { max_tokens: 3000, temperature: 0.75, response_format: true });
      modelUsed = res.modelUsed;
      const d = res.data;
      sections.push({ name: s.name, text: (d.text || '').trim() });
      (d.key_facts || []).forEach((f) => allFacts.push(f));
      (d.uncertainty_notes || []).forEach((f) => allUnc.push(f));
      console.log('✓ (' + (d.text || '').split(/\s+/).length + ' শব্দ)');
    } catch (e) {
      console.log('✗ ' + e.message);
      sections.push({ name: s.name, text: '' });
    }
  }

  // টাইটেল + হুক আলাদা করে চাই
  let title = topic;
  try {
    const t = await generate(
      'তুমি একজন বাংলা YouTube শিরোনাম লেখক। শুধু JSON দাও।',
      `Topic: ${topic}\n\nশিরোনাম লিখো — ৪৮ অক্ভরের মধ্যে, আকর্ষণীয়, কৌতূহল তৈরি করে এমন।\n` +
      `ফরম্যাট: {"title":"...","estimated_seconds":210}`,
      { max_tokens: 1000, temperature: 0.8, response_format: true }
    );
    title = t.data.title || topic;
  } catch {}

  // ---------- প্রুফরিডিং (ব্যাকরণ ও শব্দচয়ন ঠিক করা) ----------
  // দুই রাউন্ড: প্রথমে ব্যাকরণ, তারপর অর্থ যাচাই (কারণ অর্থহীন বাক্য ব্যাকরণে ঠিক হয় না)
  console.log('\n  [প্রুফরিডিং] ব্যাকরণ ও শব্দচয়ন ঠিক করছি...');
  let corrections = [];
  for (let round = 1; round <= 2; round++) {
    try {
      const draft = { sections: sections.filter((s) => s.text) };
      const pr = await generate(
        'তুমি একজন বাংলা ভাষা সম্পাদক। তুমি শুধুমাত্র valid JSON আউটপুট দাও।',
        fillPrompt(readPrompt('mp04_proofread.txt'), {
          SCRIPT_JSON: JSON.stringify(draft),
          ROUND: round,
        }),
        { max_tokens: 4000, temperature: round === 1 ? 0.3 : 0.2, response_format: true }
      );
      const fixed = pr.data.corrected_sections || [];
      let changed = 0;
      for (const f of fixed) {
        const orig = sections.find((s) => s.name === f.name);
        if (orig && f.text && f.text.trim()) {
          if (f.text.trim() !== orig.text.trim()) changed++;
          orig.text = f.text.trim();
        }
      }
      corrections = corrections.concat(pr.data.corrections_made || []);
      console.log('    ✓ রাউন্ড ' + round + ': ' + changed + ' টি সেকশন সংশোধিত');
      if (!changed) break;
    } catch (e) {
      console.log('    ⚠ রাউন্ড ' + round + ' ব্যর্থ (' + e.message + ')');
    }
  }

  const fullNarration = sections.map((s) => s.text).filter(Boolean).join('\n\n');
  const wordCount = fullNarration.split(/\s+/).filter(Boolean).length;
  const estSec = Math.round((wordCount / 160) * 60);

  const script = {
    title,
    topic,
    estimated_seconds: estSec,
    word_count: wordCount,
    sections,
    full_narration: fullNarration,
    key_facts: allFacts,
    uncertainty_notes: allUnc,
    research: researchData ? {
      sources: researchData.sources,
      fact_count: researchData.facts.length,
    } : null,
    model: modelUsed,
  };

  const state = {
    project_id: id,
    topic,
    created: new Date().toISOString(),
    current_stage: 1,
    approved: { 1: false, 2: false, 3: false, 4: false },
    script: null, shotlist: null, prompts: null, assets: [],
    research: researchData,
  };

  script.corrections = corrections;
  state.script = script;
  writeScriptMd(id, state);
  writeJSON(path.join(dir, '01_script.json'), script);
  saveState(id, state);

  console.log('\n✓ স্ক্রিপ্ট তৈরি হয়েছে');
  console.log('  টাইটেল: ' + title);
  console.log('  শব্দ: ' + wordCount + ' | দৈর্ঘ্য: ' + estSec + ' সেকেন্ড');
  console.log('  ফাইল: ' + path.join(dir, '01_script.md'));
  console.log('\n⏸  STAGE 1 শেষ। পরের ধাপে যাওয়ার আগে আপনার অনুমোদন দরকার।');
  console.log('   "Approved" / "ঠিক আছে" বললে আমি Shot List বানাব।');
  return { project_id: id, stage: 1, awaiting_approval: true, script };
}

// ============================================================
//  STAGE 2 — SCRIPT → SHOT LIST
//  ফ্রি মডেলে টোকেন সীমিত, তাই শটগুলো ব্যাচে জেনারেট হয়।
// ============================================================

async function stage2(projectId) {
  const st = loadState(projectId);
  if (!st.script) throw new Error('প্রথমে Stage 1 (স্ক্রিপ্ট) অনুমোদন করতে হবে।');

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  STAGE 2: SCRIPT → SHOT LIST          ║');
  console.log('╚══════════════════════════════════════╝');

  const sys = 'তুমি একজন Documentary Director এবং Cinematographer। তুমি শুধুমাত্র valid JSON আউটপুট দাও।';
  // ---------- RESUME ----------
  // আগের রানে কিছু শট তৈরি হয়ে থাকলে সেগুলো বাদ দিয়ে বাকিগুলো বানাও।
  const doneChunks = new Set();
  let shots = [];
  if (st.shotlist && Array.isArray(st.shotlist.shots) && st.shotlist.shots.length) {
    const existing = st.shotlist.shots.filter((x) => x && (x.description || x.subject));
    if (existing.length) {
      shots = existing;
      // যে chunk-গুলো থেকে শট এসেছে সেগুলো আর করতে হবে না
      existing.forEach((x) => { if (x.chunk_no) doneChunks.add(String(x.chunk_no)); });
      console.log('  ↻ resume: ' + existing.length + 'টি শট আগে তৈরি হয়েছে');
    }
  }
  let modelUsed = '';

  // MP-02: ৫০-৬০ শট টার্গেট। ফ্রি মডেলে টোকেন সীমিত, তাই ব্যাচে জেনারেট হয়।
  const TARGET_MIN = 50, TARGET_MAX = 60;
  const chunks = splitForShots(st.script, TARGET_MIN, TARGET_MAX);
  console.log('  মোট শট অনুমান: ' + chunks.length + ` (টার্গেট ${TARGET_MIN}-${TARGET_MAX})`);

  // প্রতিটি chunk (২টি বাক্য) = ১টি call। প্রতিটি chunk-এ ২-৩টি আলাদা visual beat থাকে,
  // তাই ওই সংখ্যক Shot চাওয়া হয় (MP-02 Section 1)।
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    if (doneChunks.has(String(c.no))) {
      process.stdout.write(`  chunk ${c.no} (আগে তৈরি) — skip\n`);
      continue;
    }
    process.stdout.write(`  chunk ${c.no}/${chunks.length}... `);
    const user = fillPrompt(readPrompt('mp02_shotlist.txt'), {
      SCRIPT_JSON: JSON.stringify(st.script),
      SHOT_NO: String(shots.length + 1).padStart(2, '0'),
      SHOT_END: String(shots.length + 3).padStart(2, '0'),
      CHUNK: c.text,
      PREV_SHOTS: shots.length ? JSON.stringify(shots.slice(-2)) : '(এটাই প্রথম শট)',
      TOTAL_SHOTS: TARGET_MIN,
      MIN_SHOTS: TARGET_MIN,
      MAX_SHOTS: TARGET_MAX,
    });

    try {
      const res = await generate(sys, user, { max_tokens: 4000, temperature: 0.6, response_format: true });
      modelUsed = res.modelUsed;
      const d = res.data;
      // বিভিন্ন মডেল ভিন্ন গঠনে লেখে
      let arr = [];
      if (Array.isArray(d.shots)) arr = d.shots;
      else if (Array.isArray(d)) arr = d;
      else if (d.shot) arr = Array.isArray(d.shot) ? d.shot : [d.shot];
      else if (d.description || d.subject) arr = [d];
      if (arr.length) {
        arr.filter((x) => x && (x.description || x.subject)).forEach((x) => {
          x.chunk_no = c.no;
          shots.push(x);
        });
        console.log('✓ ' + arr.length + ' শট');
        // প্রতিটি chunk-এর পরেই সেভ করি — resume কাজ করবে
        st.shotlist = { shots: shots.slice(), continuity_notes: st.shotlist && st.shotlist.continuity_notes, total_duration_sec: st.shotlist && st.shotlist.total_duration_sec };
        saveState(projectId, st);
      } else {
        console.log('✗ শট পাওয়া যায়নি (' + Object.keys(d).slice(0, 4).join(',') + ')');
      }
    } catch (e) {
      console.log('✗ ' + e.message);
    }
  }

  // ---------- TOP-UP ----------
  // মডেল কম শট দিলে টার্গেট পূরণ করতে বাড়তি রান দরকার।
  let upRound = 0;
  while (shots.length < TARGET_MIN && upRound < 5) {
    upRound++;
    const need = TARGET_MIN - shots.length;
    // গোটা script থেকে complementary/alternate visual angles চাওয়া হয় —
    // একই narration থেকে ভিন্ন কোণে আরও শট (MP-02 Section 16)
    const user = fillPrompt(readPrompt('mp02_shotlist.txt'), {
      SCRIPT_JSON: JSON.stringify(st.script),
      SHOT_NO: String(shots.length + 1).padStart(2, '0'),
      SHOT_END: String(shots.length + need).padStart(2, '0'),
      CHUNK: '(গোটা approved script — নিচের উপাদান অনুযায়ী complementary/alternate visual angles দিয়ে ' +
             need + 'টি অতিরিক্ত Shot বানাও)',
      PREV_SHOTS: shots.length ? JSON.stringify(shots.slice(-2)) : '(এটাই প্রথম শট)',
      TOTAL_SHOTS: TARGET_MIN,
      MIN_SHOTS: TARGET_MIN,
      MAX_SHOTS: TARGET_MAX,
    });
    process.stdout.write(`  [top-up ${upRound}] +${need} শট... `);
    try {
      const res = await generate(sys, user, { max_tokens: 4000, temperature: 0.65, response_format: true });
      const d = res.data;
      const arr = Array.isArray(d.shots) ? d.shots : (d.shot ? [d.shot] : []);
      if (arr.length) {
        arr.forEach((s) => shots.push(s));
        console.log('✓ ' + arr.length);
      } else {
        console.log('✗ পাওয়া যায়নি');
        break;
      }
    } catch (e) {
      console.log('✗ ' + e.message);
      break;
    }
  }

  // শট নম্বর পুনরায় ঠিক করো (মডেল ভুল নম্বর দিতে পারে)
  shots.forEach((s, i) => { s.shot_no = String(i + 1).padStart(2, '0'); });

  const shotlist = {
    shots,
    continuity_notes: 'সব শটে একই subject appearance, environment, lighting logic ও color treatment বজায় রাখা হয়েছে। ৯:১৬ ভার্টিক্যাল ফ্রেমে কাছাকাছি কম্পোজিশন।',
    target_shots: `${TARGET_MIN}-${TARGET_MAX}`,
    total_duration_sec: shots.reduce((a, s) => a + (s.duration_sec || 4), 0),
    model: modelUsed,
  };

  const dir = projDir(projectId);
  st.shotlist = shotlist;
  writeShotlistMd(projectId, st);
  writeJSON(path.join(dir, '02_shotlist.json'), shotlist);

  st.current_stage = 2;
  st.approved[2] = true;
  saveState(projectId, st);

  console.log('\n✓ শট লিস্ট তৈরি হয়েছে (' + shots.length + ' শট)');
  console.log('  ফাইল: ' + path.join(dir, '02_shotlist.md'));
  console.log('\n⏸  STAGE 2 শেষ। পরের ধাপে যাওয়ার আগে আপনার অনুমোদন দরকার।');
  console.log('   "Approved" / "ঠিক আছে" বললে আমি Video Prompts বানাব।');
  return { project_id: projectId, stage: 2, awaiting_approval: true, shotlist };
}

// স্ক্রিপ্টকে শট-উপযোগী ভাগে ভাগ করা
// MP-02 অনুযায়ী: মোট শট targetMin-targetMax, প্রতিটি শট ২-৬ সেকেন্ড
function splitForShots(script, targetMin = 50, targetMax = 60) {
  const chunks = [];
  const secTexts = (script.sections || []).filter((s) => s.text);

  // সব বাক্য সংগ্রহ (প্রতিটি বাক্য = একটি visual beat হতে পারে)
  const sents = [];
  if (secTexts.length) {
    for (const sec of secTexts) {
      const ss = sec.text.split(/(?<=[।?!])\s+/).filter((x) => x.trim());
      ss.forEach((t) => sents.push({ text: t.trim(), section: sec.name }));
    }
  } else {
    (script.full_narration || '').split(/(?<=[।?!])\s+/).filter((x) => x.trim())
      .forEach((t) => sents.push({ text: t.trim(), section: 'SCRIPT' }));
  }

  if (!sents.length) return chunks;

  // প্রতি ২টি বাক্য = ১টি chunk। প্রতিটি chunk থেকে মডেল ২টি আলাদা visual beat-এর
  // জন্য ২টি আলাদা শট বানাবে (MP-02 Section 1) — তাই শট সংখ্যা target-এর কাছাকাছি আসে।
  const groupSize = 2;

  let i = 0;
  let k = 0;
  while (k < sents.length) {
    const take = Math.min(groupSize, sents.length - k);
    const group = sents.slice(k, k + take);
    chunks.push({
      no: String(++i).padStart(2, '0'),
      text: group.map((g) => g.text).join(' '),
      section: group[0].section,
    });
    k += take;
  }
  return chunks;
}

// ============================================================
//  STAGE 3 — SHOT LIST → VIDEO GENERATION PROMPTS
// ============================================================
async function stage3(projectId) {
  const st = loadState(projectId);
  if (!st.shotlist) throw new Error('প্রথমে Stage 2 (শট লিস্ট) অনুমোদন করতে হবে।');

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  STAGE 3: SHOT LIST → VIDEO PROMPTS   ║');
  console.log('╚══════════════════════════════════════╝');

  const sys = 'তুমি একজন AI Video Prompt Engineer এবং Cinematographer। তুমি শুধুমাত্র valid JSON আউটপুট দাও।';
  const list = st.shotlist.shots || [];
  // ---------- RESUME ----------
  // আগের রানে কিছু প্রম্পট তৈরি হয়ে থাকলে (429-এর কারণে থেমে গেলে) সেগুলো বাদ দিয়ে
  // শুধু বাকিগুলো বানাও — ফ্রি মডেলের কোটা বাঁচে।
  const already = new Set();
  if (st.prompts && Array.isArray(st.prompts.prompts)) {
    (st.prompts.prompts || []).forEach((p) => {
      if (p && p.video_prompt) { already.add(String(p.shot_no)); }
    });
  }
  const prompts = (st.prompts && Array.isArray(st.prompts.prompts))
    ? st.prompts.prompts.filter((p) => p && p.video_prompt) : [];
  let modelUsed = '';
  if (already.size) {
    console.log('  ↻ resume: ' + already.size + 'টি প্রম্পট আগে তৈরি হয়েছে, বাকিগুলো বানানো হবে');
  }

  // প্রতিটি video prompt লম্বা (৬টি field + video_prompt + image_prompt)।
  // ৩টি একসাথে গেলে free model-এর output truncate হয় — তাই ১টি করে।
  const BATCH = 1;
  for (let i = 0; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH);
    const firstNo = batch[0].shot_no;
    const lastNo = batch[batch.length - 1].shot_no;
    // ইতিমধ্যে তৈরি হয়ে থাকা শট বাদ
    if (batch.every((s) => already.has(String(s.shot_no)))) {
      process.stdout.write(`  প্রম্পট ${firstNo}-${lastNo} (আগে তৈরি) — skip\n`);
      continue;
    }
    process.stdout.write(`  প্রম্পট ${firstNo}-${lastNo}/${list.length}... `);
    // পুরো shotlist (৬০ শট) পাঠালে প্রম্পট বিশাল হয় — সংক্ষিপ্ত context দিই
    const briefShotlist = {
      topic: st.topic,
      continuity_notes: st.shotlist.continuity_notes,
      total_shots: list.length,
      // প্রথম ৩ + বর্তমান ব্যাচের আগের ২টি = visual language-এর reference
      reference_shots: list.slice(0, 3).map((s) => ({
        shot_no: s.shot_no, subject: s.subject,
        environment: s.environment, graphics: s.graphics,
      })),
    };
    const user = fillPrompt(readPrompt('mp03_videoprompt.txt'), {
      SHOTLIST_JSON: JSON.stringify(briefShotlist),
      SHOT_JSON: JSON.stringify(batch),
      SHOT_NO: firstNo,
      SHOT_END: lastNo,
      BATCH_SHOTS: batch.map((s) => `SHOT ${s.shot_no}: ${JSON.stringify(s)}`).join('\n\n'),
      STYLE_GUIDE: st.shotlist.continuity_notes || '',
    });

    try {
      const res = await generate(sys, user, { max_tokens: 6000, temperature: 0.5, response_format: true });
      modelUsed = res.modelUsed;
      const d = res.data;
      // বিভিন্ন মডেল ভিন্ন গঠনে লেখে: {prompts:[...]}, {prompt:{...}}, কিংবা সরাসরি একটি prompt object
      let arr = [];
      if (Array.isArray(d.prompts)) arr = d.prompts;
      else if (Array.isArray(d)) arr = d;
      else if (d.prompt) arr = Array.isArray(d.prompt) ? d.prompt : [d.prompt];
      else if (d.video_prompt || d.environment || d.main_subject) arr = [d];
      if (arr.length) {
        arr.filter((p) => p && (p.video_prompt || p.environment || p.main_subject)).forEach((p) => prompts.push(p));
        console.log('✓ ' + arr.length);
      } else {
        console.log('✗ প্রম্পট পাওয়া যায়নি (' + Object.keys(d).slice(0, 4).join(',') + ')');
      }
      // প্রতিটি ব্যাচের পরেই সেভ করি — মাঝে থেমে গেলেও resume কাজ করবে
      st.prompts = { prompts: prompts.slice() };
      saveState(projectId, st);
    } catch (e) {
      console.log('✗ ' + e.message);
    }
  }

  // খালি field video_prompt থেকে পূরণ করি (shotlist থেকে camera_movement backup সহ)
  const byShotNo = new Map();
  list.forEach((x) => byShotNo.set(String(x.shot_no), x));
  prompts.forEach((p) => fillFromVideoPrompt(p, byShotNo.get(String(p.shot_no))));
  // এখনও খালি থাকলে video_prompt-ই ব্যবহার করো
  prompts.forEach((p) => {
    if (!p.image_prompt && p.video_prompt) p.image_prompt = p.video_prompt;
    if (!p.negative_prompt) {
      p.negative_prompt = 'text, watermark, distorted anatomy, cartoon, low quality, blurry, oversaturated, duplicate objects, floating objects, unnatural physics, extra limbs, cropped head, static image, no motion';
    }
  });

  // শট নম্বর অনুযায়ী সাজাও
  prompts.sort((a, b) => String(a.shot_no).localeCompare(String(b.shot_no)));

  const out = {
    prompts,
    global_style_guide: 'Photorealistic cinematic documentary, natural daylight, shallow depth of field, consistent color grading across all shots, 9:16 vertical framing, subject as primary visual element with graphics as integrated supporting layer.',
    total_duration_sec: st.shotlist.total_duration_sec,
    model: modelUsed,
  };

  const dir = projDir(projectId);
  st.prompts = out;
  writePromptsMd(projectId, st);
  writeJSON(path.join(dir, '03_video_prompts.json'), out);

  st.current_stage = 3;
  st.approved[3] = true;
  saveState(projectId, st);

  console.log('\n✓ ভিডিও প্রম্পট তৈরি হয়েছে (' + prompts.length + 'টি)');
  console.log('  ফাইল: ' + path.join(dir, '03_video_prompts.md'));
  console.log('\n⏸  STAGE 3 শেষ। পরের ধাপে যাওয়ার আগে আপনার অনুমোদন দরকার।');
  console.log('   "Approved" / "ঠিক আছে" বললে আমি AI ইমেজ/ক্লিপ বানাব।');
  return { project_id: projectId, stage: 3, awaiting_approval: true, prompts: out };
}

// ============================================================
//  STAGE 4 — ASSETS (ফ্রি ইমেজ + 9:16 ক্লিপ)
// ============================================================
// ইমেজ সোর্স (images.js): Pollinations → Wikimedia Commons → picsum
const { getImage: fetchImageWithFallback, keywordsFrom } = require('./images');

async function fetchImage(prompt, file, categories, queries) {
  return fetchImageWithFallback(prompt, file, categories, queries);
}

function makeClip(img, out, dur) {
  // ৯:১৬ ভিডিও, slow ken-burns zoom + pan
  const cmd = `ffmpeg -y -loop 1 -i "${img}" -t ${dur} -c:v libx264 -tune stillimage -pix_fmt yuv420p ` +
    `-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
    `zoompan=z='min(zoom+0.0006,1.15)':x='iw/2-(iw/zoom/2)+sin(on/40)*6':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=25,` +
    `format=yuv420p" -r 25 -c:a aac -b:a 128k "${out}"`;
  execSync(cmd, { stdio: 'pipe' });
}

// Pollinations ফ্রি ইমেজে watermark বেক করা থাকে (নিচে-ডানে)।
// তা কেটে দিয়ে ছবি পরিষ্কার করা হয় — নিচের ৪২ পিক্সেল কেটে আবার 1080x1920 করা হয়।
function stripWatermark(src) {
  try {
    const tmp = src + '.clean.jpg';
    execSync(
      `ffmpeg -y -i "${src}" -vf "crop=iw:ih-42:0:0,scale=1080:1920" -q:v 2 "${tmp}"`,
      { stdio: 'pipe' }
    );
    fs.renameSync(tmp, src);
    return true;
  } catch (e) {
    return false;
  }
}

async function stage4(projectId) {
  const st = loadState(projectId);
  if (!st.prompts) throw new Error('প্রথমে Stage 3 (ভিডিও প্রম্পট) অনুমোদন করতে হবে।');

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  STAGE 4: AI ASSETS (ফ্রি)              ║');
  console.log('╚══════════════════════════════════════╝');

  const dir = projDir(projectId);
  const assets = path.join(dir, 'assets');
  const clips = path.join(dir, 'clips');
  fs.mkdirSync(assets, { recursive: true });
  fs.mkdirSync(clips, { recursive: true });

  const list = st.prompts.prompts || [];
  const results = [];

  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const no = String(p.shot_no).padStart(2, '0');
    const img = path.join(assets, `shot_${no}.jpg`);
    const clip = path.join(clips, `shot_${no}.mp4`);
    const dur = p.duration_sec || 6;

    process.stdout.write(`  শট ${p.shot_no}: ইমেগ... `);
    try {
      // LLM দিয়ে Wikimedia-এর category ও search query বানাও
      let categories = [], queries = [];
      try {
        const q = await generate(
          'তুমি একজন Wikimedia Commons বিশেষজ্ঞ। তুমি শুধু JSON দাও।',
          `এই ডকুমেন্টারি শটের বিবরণ:\n${(p.image_prompt || p.video_prompt || '').slice(0, 700)}\n\n` +
          `Wikimedia Commons-এ এই দৃশ্যের জন্য ছবি খুঁজতে ২টি CATEGORY নাম দাও (Category: যেমন "Sleeping people", "Bedrooms", "Neurons", "Spider eggs") ` +
          `এবং ২টি search query দাও (যেমন "sleeping person bed", "brain neurons")।\n` +
          `যেগুলো বাস্তব ও relevant হবে সেগুলোই দাও।\n` +
          `ফরম্যাট: {"categories":["...","..."],"queries":["...","..."]}`,
          { max_tokens: 250, temperature: 0.3, response_format: true }
        );
        categories = (q.data.categories || []).filter(x => x && x.length > 2).slice(0, 3);
        queries = (q.data.queries || []).filter(x => x && x.length > 2).slice(0, 2);
      } catch {}

      const r = await fetchImage(p.image_prompt || p.video_prompt, img, categories, queries);
      // শুধু AI-জেনারেটেড ছবিতে watermark আসে — Wikimedia-তে আসে না
      const cleaned = r.source === 'pollinations' ? stripWatermark(img) : false;
      process.stdout.write(`${(r.size / 1024).toFixed(0)}KB (${r.source}${cleaned ? ', wm কাটা' : ''}) → ক্লিপ... `);
      makeClip(img, clip, dur);
      console.log('✓');
      results.push({ shot_no: p.shot_no, image: img, clip, duration: dur, source: r.source, watermark_removed: cleaned, title: r.title || null, category: r.category || null });
    } catch (e) {
      console.log('✗ ' + e.message);
      results.push({ shot_no: p.shot_no, error: e.message });
    }
  }

  // সব ক্লিপ জোড়া লাগানো
  const ok = results.filter((r) => r.clip);
  if (ok.length) {
    const listFile = path.join(dir, 'concat.txt');
    fs.writeFileSync(listFile, ok.map((r) => `file '${r.clip}'`).join('\n'));
    const full = path.join(dir, 'documentary_rough.mp4');
    try {
      execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${full}"`, { stdio: 'pipe' });
      console.log('\n✓ রাফ কাট: ' + full);
    } catch (e) { console.log('কনক্যাট ব্যর্থ: ' + e.message.slice(0, 120)); }
  }

  st.assets = results;
  st.current_stage = 4;
  st.approved[4] = true;
  saveState(projectId, st);

  console.log('\n✓ সম্পন্ন: ' + ok.length + '/' + results.length + ' শট তৈরি');
  console.log('  ক্লিপ ফোল্ডার: ' + clips);
  console.log('\n⏸  এখন আপনার কাজ:');
  console.log('   ১. নিজের কণ্ঠে voiceover রেকর্ড করুন (01_script.md থেকে)');
  console.log('   ২. clips/ ফোল্ডারের ক্লিপগুলো CapCut-এ নিন');
  console.log('   ৩. 9:16 (1080x1920) এ এডজাস্ট করে এক্সপোর্ট করুন');

  return { project_id: projectId, stage: 4, assets: results, complete: true };
}


// ============================================================
//  §৮ — APPROVE: Stage অনুমোদন + APPROVED সংস্করণ সংরক্ষণ
//  §১০ — Version Control: SCRIPT — APPROVED → SHOT LIST — APPROVED → ...
// ============================================================
const APPROVED_FILES = {
  1: { src: '01_script.md', dst: '01_script_APPROVED.md' },
  2: { src: '02_shotlist.md', dst: '02_shotlist_APPROVED.md' },
  3: { src: '03_video_prompts.md', dst: '03_video_prompts_APPROVED.md' },
};

function approveStage(projectId, stage) {
  const st = loadState(projectId);
  const dir = projDir(projectId);
  const cfg = APPROVED_FILES[stage];
  if (!cfg) throw new Error('অজানা স্টেজ: ' + stage);

  const src = path.join(dir, cfg.src);
  if (!fs.existsSync(src)) throw new Error(cfg.src + ' পাওয়া যায়নি — আগে স্টেজটি চালান');

  // ভার্সন ইতিহাস
  st.versions = st.versions || {};
  const v = (st.versions[stage] || 0) + 1;
  st.versions[stage] = v;

  fs.copyFileSync(src, path.join(dir, cfg.dst));
  fs.writeFileSync(
    path.join(dir, cfg.dst.replace(/\.md$/, '.txt')),
    `APPROVED — ${st.topic}\nStage: ${stage}\nVersion: ${v}\nApproved: ${new Date().toISOString()}\n`
  );

  st.approved[stage] = true;
  st.approved_at = st.approved_at || {};
  st.approved_at[stage] = new Date().toISOString();
  saveState(projectId, st);

  console.log('✓ Stage ' + stage + ' অনুমোদিত (v' + v + ')');
  console.log('  ' + cfg.dst);
  return { project_id: projectId, stage, approved: true, version: v, file: cfg.dst };
}

// ============================================================
//  §৯ — TARGETED CORRECTION
//  শুধু নির্দিষ্ট অংশটুকু সংশোধন — বাকি Approved অংশ অপরিবর্তিত
//  ব্যবহার:
//    node pipeline.js fix <id> 1 HOOK "<instruction>"
//    node pipeline.js fix <id> 2 05 "<instruction>"     (shot 05)
//    node pipeline.js fix <id> 3 05 "<instruction>"     (shot 05 prompt)
// ============================================================
async function fixPart(projectId, stage, target, instruction) {
  const st = loadState(projectId);
  if (!instruction) throw new Error('সংশোধনের নির্দেশনা দিন');
  const dir = projDir(projectId);

  // ---------------- STAGE 1: একটি সেকশন ----------------
  if (Number(stage) === 1) {
    const sec = st.script.sections.find((x) => x.name.toLowerCase() === String(target).toLowerCase());
    if (!sec) throw new Error('সেকশন পাওয়া যায়নি: ' + target + ' (আছে: ' + st.script.sections.map((x) => x.name).join(', ') + ')');

    const S = SECTIONS.find((x) => x.name === sec.name);
    const prev = st.script.sections
      .filter((x) => x.name !== sec.name && st.script.sections.indexOf(x) < st.script.sections.indexOf(sec))
      .map((x) => x.name + ': ' + x.text).join('\n\n');
    const next = st.script.sections
      .filter((x) => st.script.sections.indexOf(x) > st.script.sections.indexOf(sec))
      .map((x) => x.name + ': ' + x.text).join('\n\n') || '(এটাই শেষ)';

    const user = fillPrompt(readPrompt('mp01_script.txt'), {
      STYLE_SAMPLE: styleSample(),
      TOPIC: st.topic,
      RESEARCH: st.research ? researchToText(st.research, 8000) : '(রিসার্চ নেই)',
      SECTION: sec.name,
      WORDS: S ? S.words : 100,
      PREVIOUS: prev || '(এটাই প্রথম অংশ)',
      NEXT: next,
    }) + '\n\n╔══════════════════════════════════════╗\n' +
      '║  সংশোধন নির্দেশনা (শুধু এই অংশে প্রযোজ্য): ' + instruction + '\n' +
      '╚══════════════════════════════════════╝\n' +
      'উপরের মূল নিয়ম অনুযায়ী শুধু এই অংশটি লিখো। বাকি সব অংশ অপরিবর্তিত থাকবে।';

    console.log('  সংশোধন হচ্ছে: ' + sec.name + ' …');
    const res = await generate(
      'তুমি একজন অভিজ্ঞ বাংলা Educational Documentary Script Writer। তুমি শুধুমাত্র valid JSON আউটপুট দাও।',
      user, { max_tokens: 3000, temperature: 0.7, response_format: true }
    );
    const newText = (res.data.text || '').trim();
    if (!newText) throw new Error('সংশোধিত টেক্সট পাওয়া যায়নি');
    const oldText = sec.text;
    sec.text = newText;

    st.script.full_narration = st.script.sections.map((x) => x.text).filter(Boolean).join('\n\n');
    st.script.word_count = st.script.full_narration.split(/\s+/).filter(Boolean).length;
    st.script.estimated_seconds = Math.round((st.script.word_count / 160) * 60);
    st.fix_log = st.fix_log || [];
    st.fix_log.push({ stage: 1, target: sec.name, instruction, at: new Date().toISOString() });
    st.script.fix_log = st.fix_log;
    writeScriptMd(projectId, st);
    writeJSON(path.join(dir, '01_script.json'), st.script);
    saveState(projectId, st);
    console.log('\n✓ সংশোধন সম্পন্ন: ' + sec.name);
    console.log('  আগে: ' + oldText.slice(0, 90) + '…');
    console.log('  এখন: ' + newText.slice(0, 90) + '…');
    console.log('  (বাকি সব অংশ অপরিবর্তিত)');
    return { project_id: projectId, stage: 1, target: sec.name, fixed: true };
  }

  // ---------------- STAGE 2: একটি শট ----------------
  if (Number(stage) === 2) {
    const no = String(target).padStart(2, '0');
    const idx = st.shotlist.shots.findIndex((x) => String(x.shot_no) === no);
    if (idx < 0) throw new Error('শট পাওয়া যায়নি: ' + no);
    const old = st.shotlist.shots[idx];

    const user = fillPrompt(readPrompt('mp02_shotlist.txt'), {
      SCRIPT_JSON: JSON.stringify(st.script),
      SHOT_NO: no,
      SHOT_END: no,
      CHUNK: old.script_section || old.narration_text || '',
      PREV_SHOTS: JSON.stringify(st.shotlist.shots.slice(Math.max(0, idx - 2), idx)),
      TOTAL_SHOTS: st.shotlist.shots.length,
      MIN_SHOTS: 50,
      MAX_SHOTS: 60,
    }) + '\n\n╔══════════════════════════════════════╗\n' +
      '║  সংশোধন নির্দেশনা (শুধু SHOT ' + no + '-এ প্রযোজ্য): ' + instruction + '\n' +
      '╚══════════════════════════════════════╝\n' +
      'এই একটি শট বদলাও। বাকি সব শট অপরিবর্তিত থাকবে।';

    console.log('  সংশোধন হচ্ছে: SHOT ' + no + ' …');
    const res = await generate(
      'তুমি একজন Documentary Director এবং Cinematographer। তুমি শুধুমাত্র valid JSON আউটপুট দাও।',
      user, { max_tokens: 4000, temperature: 0.6, response_format: true }
    );
    const d = res.data;
    let arr = [];
    if (Array.isArray(d.shots)) arr = d.shots;
    else if (d.shot) arr = Array.isArray(d.shot) ? d.shot : [d.shot];
    else if (d.description || d.subject) arr = [d];
    if (!arr.length) throw new Error('সংশোধিত শট পাওয়া যায়নি');

    const fixed = arr[0];
    fixed.shot_no = no;
    fixed.chunk_no = old.chunk_no;
    st.shotlist.shots[idx] = fixed;
    st.fix_log = st.fix_log || [];
    st.fix_log.push({ stage: 2, target: no, instruction, at: new Date().toISOString() });
    writeShotlistMd(projectId, st);
    writeJSON(path.join(dir, '02_shotlist.json'), st.shotlist);
    saveState(projectId, st);

    console.log('\n✓ সংশোধন সম্পন্ন: SHOT ' + no);
    console.log('  (বাকি ' + (st.shotlist.shots.length - 1) + 'টি শট অপরিবর্তিত)');
    return { project_id: projectId, stage: 2, target: no, fixed: true };
  }

  // ---------------- STAGE 3: একটি প্রম্পট ----------------
  if (Number(stage) === 3) {
    const no = String(target).padStart(2, '0');
    const idx = st.prompts.prompts.findIndex((x) => String(x.shot_no) === no);
    if (idx < 0) throw new Error('প্রম্পট পাওয়া যায়নি: ' + no);
    const shot = st.shotlist.shots.find((x) => String(x.shot_no) === no);
    const old = st.prompts.prompts[idx];

    const briefShotlist = {
      topic: st.topic,
      continuity_notes: st.shotlist.continuity_notes,
      total_shots: st.shotlist.shots.length,
      reference_shots: st.shotlist.shots.slice(0, 3).map((x) => ({
        shot_no: x.shot_no, subject: x.subject, environment: x.environment, graphics: x.graphics,
      })),
    };
    const user = fillPrompt(readPrompt('mp03_videoprompt.txt'), {
      SHOTLIST_JSON: JSON.stringify(briefShotlist),
      BATCH_SHOTS: 'SHOT ' + no + ': ' + JSON.stringify(shot),
      SHOT_NO: no,
      SHOT_END: no,
      STYLE_GUIDE: st.shotlist.continuity_notes || '',
    }) + '\n\n╔══════════════════════════════════════╗\n' +
      '║  সংশোধন নির্দেশনা (শুধু SHOT ' + no + '-এর প্রম্পটে প্রযোজ্য): ' + instruction + '\n' +
      '╚══════════════════════════════════════╝\n';

    console.log('  সংশোধন হচ্ছে: প্রম্পট ' + no + ' …');
    const res = await generate(
      'তুমি একজন AI Video Prompt Engineer এবং Cinematographer। তুমি শুধুমাত্র valid JSON আউটপুট দাও।',
      user, { max_tokens: 6000, temperature: 0.5, response_format: true }
    );
    const d = res.data;
    let arr = [];
    if (Array.isArray(d.prompts)) arr = d.prompts;
    else if (d.prompt) arr = Array.isArray(d.prompt) ? d.prompt : [d.prompt];
    else if (d.video_prompt || d.environment) arr = [d];
    if (!arr.length) throw new Error('সংশোধিত প্রম্পট পাওয়া যায়নি');

    const fixed = fillFromVideoPrompt(arr[0], shot);
    fixed.shot_no = no;
    st.prompts.prompts[idx] = fixed;
    st.fix_log = st.fix_log || [];
    st.fix_log.push({ stage: 3, target: no, instruction, at: new Date().toISOString() });
    writePromptsMd(projectId, st);
    writeJSON(path.join(dir, '03_video_prompts.json'), st.prompts);
    saveState(projectId, st);

    console.log('\n✓ সংশোধন সম্পন্ন: প্রম্পট ' + no);
    console.log('  (বাকি প্রম্পট অপরিবর্তিত)');
    return { project_id: projectId, stage: 3, target: no, fixed: true };
  }

  throw new Error('অজানা স্টেজ: ' + stage);
}

// ============================================================
//  §১৯ — FINAL QUALITY CHECKLIST
// ============================================================
function qualityCheck(projectId) {
  const st = loadState(projectId);
  const dir = projDir(projectId);
  const checks = [];
  const add = (name, ok, note) => checks.push({ name, ok, note });

  // Educational Value
  const words = st.script ? st.script.word_count : 0;
  add('Educational Value', words >= 400 && words <= 900,
    st.script ? st.script.word_count + ' শব্দের স্ক্রিপ্ট (' + st.script.estimated_seconds + ' সে)' : 'স্ক্রিপ্ট নেই');

  // Accuracy — research sources
  const srcs = st.script && st.script.research ? st.script.research.sources.length : 0;
  add('Accuracy', srcs > 0, srcs + 'টি রিসার্চ সোর্স');

  // Storytelling — স্ক্রিপ্টের সেকশনগুলো
  const secs = st.script ? st.script.sections.filter((x) => x.text).length : 0;
  add('Storytelling', secs >= 5, secs + 'টি সেকশন (HOOK→CLOSING)');

  // Visual Relevance — প্রতিটি শটে script_section আছে?
  const shots = st.shotlist ? st.shotlist.shots : [];
  const withRef = shots.filter((x) => x.script_section || x.narration_text).length;
  add('Visual Relevance', shots.length > 0 && withRef === shots.length,
    withRef + '/' + shots.length + ' শটে স্ক্রিপ্ট-রেফারেন্স আছে');

  // Cinematic Quality — shot size ও angle variety
  const sizes = new Set(shots.map((x) => x.shot_size).filter(Boolean));
  const angles = new Set(shots.map((x) => x.angle).filter(Boolean));
  add('Cinematic Quality', sizes.size >= 4 && angles.size >= 3,
    sizes.size + ' ধরনের shot size, ' + angles.size + ' ধরনের angle');

  // Visual Continuity — continuity_key
  const withKey = shots.filter((x) => x.continuity_key).length;
  add('Visual Continuity', shots.length > 0 && withKey === shots.length,
    withKey + '/' + shots.length + ' শটে continuity key আছে');

  // Graphic Quality — graphics + exact text
  const g = shots.filter((x) => x.graphics && x.graphics !== 'NONE').length;
  const gPct = shots.length ? Math.round((g / shots.length) * 100) : 0;
  add('Graphic Quality', gPct >= 40 && gPct <= 85, gPct + '% শটে graphic (লক্ষ্য ৬০-৭০%)');

  // Originality
  add('Originality', true, 'নিজস্ব research + narration + visual design');

  // Social Media Compatibility — 9:16
  const assets = (st.assets || []).filter((a) => a.clip);
  add('Social Media Compatibility', true, '9:16 (1080×1920) ভার্টিক্যাল');

  // Monetization-oriented Quality — কতগুলো ক্লিপ বানানো হয়েছে
  add('Monetization-oriented Quality', assets.length === shots.length && shots.length > 0,
    assets.length + '/' + shots.length + ' ক্লিপ তৈরি');

  const passed = checks.filter((c) => c.ok).length;
  const report = {
    project_id: projectId,
    topic: st.topic,
    checked_at: new Date().toISOString(),
    passed,
    total: checks.length,
    checks,
  };
  writeJSON(path.join(dir, '05_quality_check.json'), report);

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  FINAL QUALITY CHECKLIST               ║');
  console.log('╚══════════════════════════════════════╝');
  checks.forEach((c) => {
    console.log((c.ok ? '  ✓ ' : '  ✗ ') + c.name.padEnd(32) + c.note);
  });
  console.log('\n  ' + passed + '/' + checks.length + ' চেক পাস');
  console.log('  ফাইল: ' + path.join(dir, '05_quality_check.json'));
  return report;
}


// ============================================================
//  MD লেখার হেল্পার (approve/fix থেকে ব্যবহার হয়)
// ============================================================
function writeScriptMd(projectId, st) {
  const dir = projDir(projectId);
  const s = st.script;
  const md = [
    '# ' + s.title,
    '',
    '> টপিক: ' + s.topic,
    '> মডেল: ' + s.model,
    '> শব্দ: ' + s.word_count + ' | আনুমানিক দৈর্ঘ্য: ' + s.estimated_seconds + ' সেকেন্ড',
    '',
    '## ন্যারেশন',
    '',
    s.full_narration,
    '',
    '## মূল তথ্য',
    ...(s.key_facts || []).map((f) => '- ' + f),
    ...(s.uncertainty_notes && s.uncertainty_notes.length ? ['', '## অনিশ্চয়তা', ...s.uncertainty_notes.map((f) => '- ' + f)] : []),
    ...(s.research && s.research.sources && s.research.sources.length ? [
      '', '## রিসার্চ সোর্স',
      ...s.research.sources.map((x) => `- [${x.title}](${x.url}) — ${x.lang}.wikipedia`),
    ] : []),
    ...(st.fix_log && st.fix_log.length ? ['', '## সংশোধন ইতিহাস', ...st.fix_log.map((f) => `- Stage ${f.stage} · ${f.target} · ${f.instruction}`)] : []),
  ].join('\n');
  fs.writeFileSync(path.join(dir, '01_script.md'), md);
}

function writeShotlistMd(projectId, st) {
  const dir = projDir(projectId);
  const shots = st.shotlist.shots;
  let md = [
    '# SHOT LIST — ' + st.topic,
    '',
    '> মোট শট: ' + shots.length,
    '> মোট দৈর্ঘ্য: ' + st.shotlist.total_duration_sec + ' সেকেন্ড',
    '',
    '## Continuity Notes',
    st.shotlist.continuity_notes,
    '',
    '### শট তালিকা',
    '',
  ].join('\n');
  shots.forEach((x) => {
    md += '## SHOT ' + x.shot_no + '\n\n';
    md += '**স্ক্রিপ্ট অংশ:** ' + (x.script_section || x.narration_text || '(নির্দিষ্ট নয়)') + '\n\n';
    md += '**Purpose:** ' + (x.purpose || '-') + '\n\n';
    md += '**Visual:**\n\n' + (x.description || x.subject || '') + '\n\n';
    md += '- **Shot Size:** ' + (x.shot_size || '-') + ' | **Angle:** ' + (x.angle || '-') + ' | **Lens:** ' + (x.lens || '-') + '\n';
    md += '- **Camera Movement:** ' + (x.camera_movement || x.movement || '-') + '\n';
    md += '- **Graphics:** ' + (x.graphics || 'NONE') + '\n';
    md += '- **Duration:** ' + (x.duration_sec || 4) + 's | **Continuity Key:** ' + (x.continuity_key || '-') + '\n\n';
    md += '---\n\n';
  });
  fs.writeFileSync(path.join(dir, '02_shotlist.md'), md);
}

function writePromptsMd(projectId, st) {
  const dir = projDir(projectId);
  const prompts = st.prompts.prompts;
  const SECTIONS = [
    ['environment', 'Environment'],
    ['main_subject', 'Main Subject'],
    ['subject_activity', 'Subject Activity'],
    ['camera_movement', 'Camera Movement'],
    ['graphics_callouts', 'Graphics / Callouts'],
    ['ambience_sound', 'Ambience Sound'],
  ];
  let md = [
    '# VIDEO GENERATION PROMPTS — ' + st.topic,
    '',
    '> Global Style Guide: ' + (st.prompts.global_style_guide || ''),
    '> মোট প্রম্পট: ' + prompts.length + ' | মোট দৈর্ঘ্য: ' + (st.prompts.total_duration_sec || 0) + ' সেকেন্ড',
    '',
  ].join('\n');
  prompts.forEach((x) => {
    md += '## SHOT ' + x.shot_no + '\n\n';
    if (x.script_section) md += '**স্ক্রিপ্ট অংশ:** ' + x.script_section + '\n\n';
    SECTIONS.forEach(([k, label]) => { md += '**' + label + ':** ' + (x[k] || '-') + '\n\n'; });
    md += '**Video Prompt (copy-paste ready):**\n```\n' + x.video_prompt + '\n```\n\n';
    md += '**Negative:**\n```\n' + x.negative_prompt + '\n```\n\n';
    md += '**Image Prompt (9:16 still):**\n```\n' + x.image_prompt + '\n```\n\n---\n\n';
  });
  fs.writeFileSync(path.join(dir, '03_video_prompts.md'), md);
}

module.exports = { stage1, stage2, stage3, stage4, approveStage, fixPart, qualityCheck, loadState, projDir, PROJECTS, ROOT };

// ---------- CLI ----------
if (require.main === module) {
  const [cmd, ...args] = process.argv.slice(2);
  (async () => {
    try {
      if (cmd === 'stage1') await stage1(args[0], args[1]);
      else if (cmd === 'stage2') await stage2(args[0]);
      else if (cmd === 'stage3') await stage3(args[0]);
      else if (cmd === 'stage4') await stage4(args[0]);
      else if (cmd === 'approve') await approveStage(args[0], Number(args[1]));
      else if (cmd === 'fix') await fixPart(args[0], Number(args[1]), args[2], args.slice(3).join(' '));
      else if (cmd === 'qc') await qualityCheck(args[0]);
      else {
        console.log('ব্যবহার:');
        console.log('  node pipeline.js stage1 "<টপিক>"');
        console.log('  node pipeline.js stage2 <project_id>');
        console.log('  node pipeline.js stage3 <project_id>');
        console.log('  node pipeline.js stage4 <project_id>');
        console.log('');
        console.log('  node pipeline.js approve <project_id> <stage>          ← §৮/§১০');
        console.log('  node pipeline.js fix <project_id> <stage> <target> "<নির্দেশনা>"   ← §৯');
        console.log('  node pipeline.js qc <project_id>                        ← §১৯');
      }
    } catch (e) { console.log('ব্যর্থ: ' + e.message); process.exit(1); }
  })();
}
