// ============================================================
//  ফ্রি OpenRouter ক্লায়েন্ট - ফ্রি মডেল ব্যাকআপ সহ
//  দৈনিক লিমিট হলে পরের মডেলে চলে যায়
// ============================================================

const fs = require('fs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// নেটওয়ার্ক ধীর হলে fetch ব্যর্থ হয় — তাই retry ও বেশি timeout
const agent = new (require('http').Agent)({ keepAlive: true, maxSockets: 4 });
const httpsAgent = new (require('https').Agent)({ keepAlive: true, maxSockets: 4 });

async function fetchRetry(url, opts = {}, tries = 3, timeoutMs = 120000) {
  let lastErr = '';
  for (let t = 1; t <= tries; t++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal, dispatcher: undefined });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e.name === 'AbortError' ? 'timeout' : e.message;
      if (t < tries) await sleep(1500 * t);
    }
  }
  throw new Error('fetch ব্যর্থ: ' + lastErr);
}

const FREE_MODELS = [
  'minimax/minimax-m3.1-flash:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3.5-lightning:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'liquid/lfm-2.5-2.6b:free',
  'dots-studio/dots-3-note-preview:free',
  'poolside/laguna-s-2.1:free',
  'xingchen-agi/xing4.0-29b-a4b:free',
  'cohere/north-mini-code:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];

function getKey() {
  try {
    const line = fs.readFileSync('/home/imran/.hermes/.env', 'utf8')
      .split('\n').find((l) => l.startsWith('OPENROUTER_API_KEY='));
    if (line) return line.split('=').slice(1).join('=').trim();
  } catch {}
  return process.env.OPENROUTER_API_KEY || '';
}

// ---------- লুজ JSON পার্সার ----------
function parseLooseJson(raw) {
  const attempts = [
    raw,
    raw.replace(/```json|```/g, '').trim(),
    raw.replace(/(?<!\\)\n/g, '\\n'),
    raw.replace(/,\s*([}\]])/g, '$1'),
  ];
  for (const a of attempts) {
    try { return JSON.parse(a); } catch {}
  }
  // ব্লক ধরে বের করার চেষ্টা
  // IMPORTANT: বড়/নেস্টেড JSON-এ blocks খুঁজলে একাধিক পাওয়া যায়।
  // আগে সবচেয়ে বড় (top-level) ব্লকটি ধরতে হবে — নইলে শেষের nested object
  // ফিরে যায় (যেমন {"prompts":[{...}]} থেকে শুধু {...} পাওয়া যায়)।
  const blocks = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/g);
  if (blocks) {
    // বড় থেকে ছোট করে সাজাও — top-level ব্লক সবচেয়ে বড়
    const sorted = blocks.slice().sort((a, b) => b.length - a.length);
    for (const b of sorted) {
      try { return JSON.parse(b); } catch {}
    }
  }
  // ---- TRUNCATED JSON মেরামত ----
  // মডেল max_tokens শেষে কেটে গেছে। অসম্পূর্ণ অবজেক্ট বন্ধ করে দেওয়ার চেষ্টা
  const fixed = repairTruncated(raw);
  if (fixed) return fixed;

  throw new Error('JSON পার্স করা যায়নি: ' + String(raw).slice(0, 200));
}

// অসম্পূর্ণ/truncated JSON মেরামত
function repairTruncated(raw) {
  let s = String(raw).replace(/```json|```/g, '').trim();
  // অচিহ্নিত newline ঠিক
  s = s.replace(/(?<!\\)\n/g, '\\n');

  const lastBrace = s.lastIndexOf('}');
  const lastBracket = s.lastIndexOf(']');
  const cut = Math.max(lastBrace, lastBracket);
  if (cut > 0) s = s.slice(0, cut + 1);

  // string-এর ভেতরে কাটা হয়ে থাকলে সেটা বন্ধ করো
  let inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') inStr = !inStr;
  }
  if (inStr) s += '"';

  // অসম্পূর্ণ অ্যারে/অবজেক্ট বন্ধ করো
  const opens = (s.match(/[{[]/g) || []).length;
  const closes = (s.match(/[}\]]/g) || []).length;
  let add = '';
  const stack = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '{' ) stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }
  for (let i = stack.length - 1; i >= 0; i--) add += stack[i];

  const candidates = [s + add, s.replace(/,\s*$/, '') + add];
  for (const c of candidates) {
    try { return JSON.parse(c); } catch {}
  }

  // নতুন শেষ: যে অংশগুলো পুরো হয়েছে সেগুলো বের করো
  // sections বা shots অ্যারে থেকে সম্পূর্ণ আইটেমগুলো নিয়ে নতুন অবজেক্ট বানাও
  const items = [];
  const itemRe = /\{[^{}]*?"(?:text|shot_no)"[^{}]*?\}/g;
  let m;
  while ((m = itemRe.exec(raw)) !== null) {
    try { items.push(JSON.parse(m[0])); } catch {}
  }
  if (items.length) {
    const key = items[0].shot_no !== undefined ? 'shots' : 'sections';
    return { [key]: items, _truncated: true };
  }
  return null;
}

async function callModel(model, system, user, opts = {}) {
  const key = getKey();
  if (!key) throw new Error('OpenRouter key নেই');

  // কিছু ফ্রি মডেল reasoning model — reasoning বন্ধ করা যায় না, তাই effort কমিয়ে দিই
  // না হলে সব token reasoning-এ খরচ হয়ে content খালি থেকে যায়।
  const isReasoningModel = /nemotron|gemma|minimax|inkling|think|lfm|dots|laguna|xing|poolside|north/i.test(model);
  const reasoningParam = isReasoningModel ? { reasoning: { effort: opts.effort || 'low' } } : {};

  const res = await fetchRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:4000',
      'X-Title': 'AI Documentary Pipeline',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 4000,
      ...reasoningParam,
      ...(opts.response_format ? { response_format: { type: 'json_object' } } : {}),
    }),
  }, 3, 150000);

  if (res.status === 429) throw new Error('429 দৈনিক লিমিট');
  if (res.status === 400) {
    const t = await res.text();
    if (/reasoning/i.test(t)) {
      // reasoning model যেখানে effort সাপোর্ট করে না - max_tokens বাড়িয়ে চেষ্টা
      const res2 = await fetchRetry('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          temperature: opts.temperature ?? 0.7,
          max_tokens: (opts.max_tokens ?? 4000) * 3,
        }),
      }, 2, 180000);
      if (!res2.ok) throw new Error('HTTP ' + res2.status);
      const j2 = await res2.json();
      const raw2 = j2.choices?.[0]?.message?.content || '';
      if (!raw2.trim()) throw new Error('খালি রিপ্লাই');
      return { raw: raw2, data: parseLooseJson(raw2), model };
    }
    throw new Error('HTTP 400: ' + t.slice(0, 160));
  }
  if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()).slice(0, 160));
  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content || '';
  if (!raw.trim()) throw new Error('খালি রিপ্লাই');
  return { raw, data: parseLooseJson(raw), model };
}

// ---------- মূল ফাংশন: মডেল ব্যাকআপ সহ ----------
async function generate(system, user, opts = {}) {
  const models = opts.model ? [opts.model] : FREE_MODELS;
  let lastErr = '';
  for (const m of models) {
    try {
      const r = await callModel(m, system, user, opts);
      return { ...r, modelUsed: m };
    } catch (e) {
      lastErr = e.message;
      if (opts.verbose) console.log('  ✗ ' + m + ' → ' + e.message);
    }
  }
  throw new Error('কোনো ফ্রি মডেল কাজ করেনি। শেষ ত্রুটি: ' + lastErr);
}

module.exports = { generate, callModel, parseLooseJson, getKey, FREE_MODELS };
