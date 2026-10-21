// ============================================================
//  WEB RESEARCH MODULE — MP-01 এর জন্য তথ্য সংগ্রহ
//  উৎস: Wikipedia API (bn + en) + DuckDuckGo HTML search
//  ফ্রি, key লাগে না।
// ============================================================

const { execSync } = require('child_process');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

function curl(url, timeout = 25) {
  try {
    return execSync(`curl -s -m ${timeout} -A "${UA}" ${JSON.stringify(url)}`, {
      maxBuffer: 8 * 1024 * 1024, encoding: 'utf8',
    });
  } catch { return ''; }
}

// ---------- Wikipedia ----------
function wikiSearch(query, lang = 'en', limit = 5) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search` +
    `&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${limit}`;
  try {
    const d = JSON.parse(curl(url) || '{}');
    return (d.query && d.query.search) || [];
  } catch { return []; }
}

function wikiSummary(title, lang = 'en') {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
  try {
    const d = JSON.parse(curl(url) || '{}');
    if (!d.extract) return null;
    return { title: d.title, extract: d.extract, url: d.content_urls ? d.content_urls.desktop.page : '' };
  } catch { return null; }
}

function wikiExtract(title, lang = 'en', chars = 4000) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1` +
    `&exintro=0&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
  try {
    const d = JSON.parse(curl(url) || '{}');
    const pages = d.query && d.query.pages;
    if (!pages) return '';
    const first = Object.values(pages)[0];
    return (first && first.extract) ? first.extract.slice(0, chars) : '';
  } catch { return ''; }
}

// ---------- DuckDuckGo ----------
function ddgSearch(query, limit = 6) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = curl(url);
  if (!html) return [];
  const out = [];
  const re = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) && out.length < limit) {
    const title = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
    const link = m[1].replace(/&amp;/g, '&');
    out.push({ title, link });
  }
  if (out.length) return out;
  // ব্যাকআপ পার্সার
  const re2 = /result__url[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  while ((m = re2.exec(html)) && out.length < limit) {
    out.push({ title: m[2].replace(/<[^>]+>/g, '').trim(), link: m[1].replace(/&amp;/g, '&') });
  }
  return out;
}

// ---------- relevance scoring ----------
// টপিকের সাথে কতটা মিলছে তা মাপা — যাতে marginal fact (যেমন "Gus") বাদ পড়ে
function tokenize(s) {
  return String(s).toLowerCase()
    .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// সাধারণ ইংরেজি stopwords (research query তৈরিতে কাজে লাগে)
const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'how', 'what', 'why',
  'does', 'are', 'was', 'its', 'his', 'her', 'their', 'they', 'you', 'not', 'can', 'has', 'have',
  'when', 'where', 'which', 'into', 'about', 'process', 'mechanism', 'explain', 'works']);

function relevance(factText, topic) {
  const t = new Set(tokenize(topic).filter((w) => !STOP.has(w)));
  if (!t.size) return 0;
  const f = new Set(tokenize(factText).filter((w) => !STOP.has(w)));
  let hit = 0;
  t.forEach((w) => { if (f.has(w)) hit++; });
  return hit / t.size;
}

function scoreAndSortFacts(facts, topic, keep = 4) {
  const scored = facts.map((f) => ({ ...f, score: relevance(f.title + ' ' + f.text, topic) }));
  scored.sort((a, b) => b.score - a.score);
  // অন্তত ২টি রাখি (score যাই হোক), তারপর relevance অনুযায়ী trim
  const keepList = scored.slice(0, Math.max(2, keep));
  return keepList;
}

// ---------- মূল research ----------
// topic: string
// opts: { lang: 'en'|'bn', depth: 'quick'|'full' }
function research(topic, opts = {}) {
  const lang = opts.lang || 'en';
  // relevance মূল বাংলা টপিকের সাথে মাপা উচিত (searchTopic আলাদা)
  const relevanceTopic = opts.relevanceTopic || topic;
  const result = {
    topic,
    sources: [],
    facts: [],
    snippets: [],
    search_terms: [],
  };

  // ১. Topic থেকে research query বানাও
  const queries = [
    topic,
    `${topic} how it works mechanism`,
    `${topic} process explanation`,
  ];

  // ২. Wikipedia search + summary
  // বাংলা টপিক হলেও ইংরেজি উৎস আগে — বাংলা Wikipedia-এ অনেক টপিক নেই
  const seen = new Set();
  const langs = lang === 'bn' ? ['en', 'bn'] : ['en'];

  for (const L of langs) {
    for (const q of queries.slice(0, 2)) {
      const hits = wikiSearch(q, L, 3);
      for (const h of hits) {
        if (seen.has(h.title)) continue;
        seen.add(h.title);
        const sum = wikiSummary(h.title, L);
        if (sum && sum.extract && sum.extract.length > 120) {
          result.sources.push({ title: sum.title, url: sum.url, lang: L });
          result.facts.push({ title: sum.title, text: sum.extract.slice(0, 1800) });
        }
      }
      if (result.facts.length >= 3) break;
    }
    if (result.facts.length >= 3) break;
  }

  // ৩. Web search snippets
  if (opts.depth !== 'quick') {
    for (const q of queries) {
      const hits = ddgSearch(q, 5);
      for (const h of hits) {
        if (seen.has(h.title)) continue;
        seen.add(h.title);
        result.search_terms.push(q);
        result.snippets.push(h);
      }
      if (result.snippets.length >= 8) break;
    }
  }

  // ৪. বাংলা উৎস (বাংলা টপিকে)
  if (lang === 'bn') {
    const bhits = wikiSearch(topic, 'bn', 3);
    for (const h of bhits) {
      if (seen.has(h.title)) continue;
      seen.add(h.title);
      const ex = wikiExtract(h.title, 'bn', 2500);
      if (ex && ex.length > 150) {
        result.sources.push({ title: h.title, url: `https://bn.wikipedia.org/wiki/${encodeURIComponent(h.title)}`, lang: 'bn' });
        result.facts.push({ title: h.title, text: ex });
      }
    }
  }

  // relevance অনুযায়ী সবচেয়ে প্রাসঙ্গিক তথ্য আগে রাখি
  if (result.facts.length) {
    result.facts = scoreAndSortFacts(result.facts, relevanceTopic, 4);
    // যেসব সোর্স retained আছে শুধু তাদের source রাখি
    const keepTitles = new Set(result.facts.map((f) => f.title));
    result.sources = result.sources.filter((s) => keepTitles.has(s.title));
  }

  return result;
}

// research কে prompt-এর জন্য ফরম্যাট
function researchToText(r, maxChars = 7000) {
  let out = '';
  if (r.facts && r.facts.length) {
    out += '=== RESEARCH FACTS (Wikipedia) ===\n';
    r.facts.forEach((f) => { out += `\n[${f.title}]\n${f.text}\n`; });
  }
  if (r.snippets && r.snippets.length) {
    out += '\n=== WEB SEARCH RESULTS ===\n';
    r.snippets.forEach((s, i) => { out += `${i + 1}. ${s.title} — ${s.link}\n`; });
  }
  if (r.sources && r.sources.length) {
    out += '\n=== SOURCES (reference হিসেবে উল্লেখযোগ্য) ===\n';
    r.sources.forEach((s) => { out += `- ${s.title} (${s.lang}.wikipedia) ${s.url}\n`; });
  }
  return out.slice(0, maxChars);
}

module.exports = { research, researchToText, wikiSearch, wikiSummary, wikiExtract, ddgSearch };

if (require.main === module) {
  const t = process.argv[2] || 'Emperor penguin';
  console.log(researchToText(research(t), 12000));
}
