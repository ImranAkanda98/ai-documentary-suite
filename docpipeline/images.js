// ============================================================
//  ফ্রি ইমেজ সোর্স (কোনো API key ছাড়াই)
//  ১. Pollinations   — AI-জেনারেটেড (cached প্রম্পটে free, নতুনে paid)
//  ২. Wikimedia Commons (Category) — curated, relevant, free + no rate limit
//  ৩. Wikimedia Commons (Search) — fallback
//  ৪. picsum        — random, শেষ ব্যাকআপ
// ============================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wikimedia বট-নীতি: Node fetch-এর ডিফল্ট UA ব্লক করে — ব্রাউজারের মতো UA দিতে হয়
const BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const API = 'https://commons.wikimedia.org/w/api.php';

async function fetchRetry(url, opts = {}, tries = 3, timeoutMs = 60000) {
  let lastErr = '';
  for (let t = 1; t <= tries; t++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e.name === 'AbortError' ? 'timeout' : e.message;
      if (t < tries) await sleep(1500 * t);
    }
  }
  throw new Error(lastErr);
}

async function getJSON(url) {
  const res = await fetchRetry(url, { headers: { 'User-Agent': BROWSER_UA, 'Accept': 'application/json' } }, 3, 30000);
  if (!res.ok) throw new Error('api ' + res.status);
  return res.json();
}

function isUsableImage(p) {
  const ii = p.imageinfo?.[0];
  const title = (p.title || '').toLowerCase();
  if (!ii || !ii.thumburl) return false;
  if (!/image\/(jpeg|png)/.test(ii.mime || '')) return false;
  if (title.includes('.pdf') || title.endsWith('.svg') || title.endsWith('.gif') || title.endsWith('.tif') || title.endsWith('.webm') || title.endsWith('.ogv')) return false;
  if ((ii.thumbwidth || 0) < 600) return false;
  return true;
}

async function downloadTo(url, file) {
  const res = await fetchRetry(url, {
    headers: { 'User-Agent': BROWSER_UA, 'Accept': 'image/*,*/*;q=0.8', 'Referer': 'https://commons.wikimedia.org/' },
    redirect: 'follow',
  }, 3, 45000);
  if (!res.ok) throw new Error('img ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error('ফাইল ছোট');
  fs.writeFileSync(file, buf);
  return buf.length;
}

// ---------- 9:16 ফরম্যাটে কনভার্ট + ক্যামেরা watermark কাটা ----------
// Pollinations ফ্রি টায়ারে ছোট resolution (576x1024) দেয়, আর Wikimedia ছবি landscape হয়।
// তাই সব ছবি এখানে 1080x1920-এ নিয়ে আসা হয়।
// নিচের ~8% কেটে ফেলা হয় (camera watermark সাধারণত এখানেই থাকে)।
function toVertical9x16(src) {
  try {
    const tmp = src + '.v.jpg';
    execSync(
      `ffmpeg -y -i "${src}" -vf "crop=iw:ih*0.92:0:0,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -q:v 2 "${tmp}"`,
      { stdio: 'pipe' }
    );
    fs.renameSync(tmp, src);
    return true;
  } catch (e) { return false; }
}

// ---------- ১. Pollinations (AI-জেনারেটেড) ----------
// ফ্রি টায়ারে প্রতি মিনিটে ~১টি ছবি — তাই 402 পেলে ধৈর্যে অপেক্ষা করে আবার চেষ্টা
const POLL_WAIT_MS = 65000;

async function pollinations(prompt, file, tries = 3) {
  let lastErr = '';
  for (let t = 1; t <= tries; t++) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=1080&height=1920&nologo=true&seed=${Math.floor(Math.random() * 1e6)}`;
    try {
      const res = await fetchRetry(url, { headers: { 'User-Agent': BROWSER_UA } }, 1, 60000);
      if (res.status === 402) {
        lastErr = 'quota';
        // ফ্রি টায়ারে মিনিটে ১টি — অপেক্ষা করে আবার চেষ্টা
        if (t < tries) { await sleep(POLL_WAIT_MS); continue; }
        break;
      }
      if (!res.ok) { lastErr = 'HTTP ' + res.status; await sleep(3000); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) { lastErr = 'ফাইল ছোট'; await sleep(2000); continue; }
      fs.writeFileSync(file, buf);
      toVertical9x16(file);
      return { ok: true, size: buf.length, source: 'pollinations' };
    } catch (e) { lastErr = e.message; await sleep(3000); }
  }
  return { ok: false, error: lastErr };
}

// ---------- ২. Wikimedia Category (সবচেয়ে relevant) ----------
async function wikimediaCategory(catName, file) {
  try {
    const cat = catName.startsWith('Category:') ? catName : 'Category:' + catName;
    const api = API + '?action=query&generator=categorymembers' +
      `&gcmtitle=${encodeURIComponent(cat)}&gcmtype=file&gcmlimit=50` +
      '&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1080&format=json&origin=*';
    const data = await getJSON(api);
    const pages = Object.values(data?.query?.pages || {}).filter(isUsableImage);
    if (!pages.length) return { ok: false, error: 'category খালি' };
    const pick = pages[Math.floor(Math.random() * pages.length)];
    const size = await downloadTo(pick.imageinfo[0].thumburl, file);
    toVertical9x16(file);
    return { ok: true, size, source: 'wikimedia-category', title: pick.title, category: cat };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ---------- ৩. Wikimedia Search (fallback) ----------
async function wikimediaSearch(query, file) {
  try {
    const api = API + '?action=query&generator=search' +
      `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=40` +
      '&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1080&format=json&origin=*';
    const data = await getJSON(api);
    const pages = Object.values(data?.query?.pages || {}).filter(isUsableImage);
    if (!pages.length) return { ok: false, error: 'search খালি' };
    const pick = pages[Math.floor(Math.random() * pages.length)];
    const size = await downloadTo(pick.imageinfo[0].thumburl, file);
    toVertical9x16(file);
    return { ok: true, size, source: 'wikimedia-search', title: pick.title };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ---------- ৪. picsum (random ব্যাকআপ) ----------
async function picsum(file) {
  try {
    const seed = encodeURIComponent(String(Math.random()).slice(2) + Date.now());
    const res = await fetchRetry(`https://picsum.photos/seed/${seed}/1080/1920`, { headers: { 'User-Agent': BROWSER_UA } }, 2, 30000);
    if (!res.ok) throw new Error('picsum ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(file, buf);
    return { ok: true, size: buf.length, source: 'picsum' };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ============================================================
//  প্রধান ফাংশন
//  categories: ['Sleeping people', 'Bedrooms']  ← LLM থেকে আসবে
//  queries:    ['sleeping person bed']           ← search fallback
// ============================================================
async function getImage(imagePrompt, file, categories, queries) {
  // ১. AI-জেনারেটেড — হুবহু প্রম্পট অনুসরণ করে, consistency সবচেয়ে ভালো
  //    (Wikimedia real photo ব্যবহার করলে category loose হওয়ায় মিসম্যাচ ছবি আসে,
  //     তাই ডিফল্টভাবে শুধু AI ইমেজ ব্যবহার হয়)
  const p = await pollinations(imagePrompt, file, 4);
  if (p.ok) return p;

  // ২. Wikimedia — শুধু তখনই যখন AI পুরোপুরি ব্যর্থ
  if (process.env.USE_WIKIMEDIA === '1') {
    for (const c of (categories || [])) {
      const w = await wikimediaCategory(c, file);
      if (w.ok) return w;
    }
    for (const q of (queries || [])) {
      const w = await wikimediaSearch(q, file);
      if (w.ok) return w;
    }
  }

  // ৩. picsum (random, শেষ ব্যাকআপ — ব্যবহার করবেন না, শুধু যেন ভিডিও তৈরি হয়)
  const s = await picsum(file);
  if (s.ok) return s;

  throw new Error(p.error || 'সব ইমেজ সোর্স ব্যর্থ');
}

module.exports = { getImage, pollinations, wikimediaCategory, wikimediaSearch, picsum, BROWSER_UA };
