# 🎬 AI Educational Documentary — Production Pipeline

পুরো ডকুমেন্ট "AI EDUCATIONAL DOCUMENTARY — MAIN PRODUCTION PIPELINE"-এর ৪-স্টেজ পাইপলাইন বাস্তবায়িত।
সম্পূর্ণ ফ্রি — কোনো API কেনার দরকার নেই (শুধু OpenRouter-এর ফ্রি মডেল)।

## 🚀 চালু করুন

```bash
bash /home/imran/n8n/docpipeline/start_doc.sh
```

| কোথায় | কী |
|---|---|
| **http://localhost:4100** | ওয়েব UI (Stage বাটন সহ) |
| **http://localhost:5678** | n8n UI — `imran@local.test` / `LocalOnly12345!` |

---

## ৪ স্টেজ

```
TOPIC
  ↓  Stage 1  ওয়েব রিসার্চ (Wikipedia) → fact selection → বাংলা ন্যারেশন স্ক্রিপ্ট
             (৬টি সেকশনে ভাগ করে জেনারেট, MP-01-এর ২৯টি নিয়ম অনুযায়ী)
             → স্বয়ংক্রিয় প্রুফরিডিং (২ রাউন্ড: ব্যাকরণ + অর্থ যাচাই)
  ⏸  ⬅ আপনার অনুমোদন দরকার
  ↓  Stage 2  শট লিস্ট — MP-02 অনুযায়ী ৫০-৬০ শট
             (Process-visualization philosophy, ৬০-৭০% শটে graphics, transparency rule)
  ⏸  ⬅ আপনার অনুমোদন দরকার
  ↓  Stage 3  ভিডিও জেনারেশন প্রম্পট — ঠিক ৬টি section
             (Environment · Main Subject · Subject Activity · Camera Movement ·
              Graphics/Callouts · Ambience Sound)
  ⏸  ⬅ আপনার অনুমোদন দরকার
  ↓  Stage 4  AI ইমেজ (9:16) → ffmpeg ক্লিপ → CapCut রেডি
```

**Stage skip করা যায় না।** প্রতিটি স্টেজ শেষে পাইপলাইন থামে এবং অনুমোদনের জন্য জিজ্ঞেস করে।

---

## 📁 ফাইল

```
/home/imran/n8n/docpipeline/
├── start_doc.sh          ← সব চালু করে
├── pipeline.js           ← মূল ইঞ্জিন (৪ স্টেজ)
├── llm.js                ← ফ্রি OpenRouter ক্লায়েন্ট + মডেল ব্যাকআপ
├── research.js           ← ওয়েব রিসার্চ (Wikipedia + DuckDuckGo) + relevance scoring
├── doc_server.js         ← API সার্ভার (port 4100)
├── ui.html               ← ওয়েব UI
├── prompts/
│   ├── mp01_script.txt       ← Master Prompt 01: স্ক্রিপ্ট (আপনার ৩৪-নিয়মের সংস্করণ)
│   ├── mp02_shotlist.txt     ← Master Prompt 02: শট লিস্ট (Shortlist.pdf-এর সংস্করণ)
│   ├── mp03_videoprompt.txt  ← Master Prompt 03: ভিডিও প্রম্পট (৬-সেকশন ফরম্যাট)
│   ├── mp04_proofread.txt    ← Master Prompt 04: প্রুফরিডিং (ব্যাকরণ ও অর্থ)
│   └── _backup_*/            ← আগের সংস্করণের ব্যাকআপ
├── style/
│   └── sample_scripts.txt   ← ← এখানে আপনার নিজের স্ক্রিপ্ট স্যাম্পল রাখুন
└── projects/
    └── <project_id>/
        ├── 01_script.md        ← voiceover পড়ার ফাইল
        ├── 02_shotlist.md
        ├── 03_video_prompts.md
        ├── assets/             ← AI ইমেজ (1080x1920)
        ├── clips/              ← ভিডিও ক্লিপ (CapCut-এ নেবেন)
        └── documentary_rough.mp4
```

---

## 🎨 আপনার টোন বজায় রাখতে

`style/sample_scripts.txt` ফাইলে আপনার নিজের লেখা ২-৩টি স্ক্রিপ্ট স্যাম্পল রাখুন।
Stage 1 সেগুলোর টোন, বাক্যগঠন ও শব্দচয়ন অনুসরণ করবে।

---

## 🎯 ফ্রি উপাদান

| কাজ | সেবা | খরচ |
|---|---|---|
| স্ক্রিপ্ট / শট লিস্ট / প্রম্পট | OpenRouter `:free` মডেল (১২টি ব্যাকআপ) | ০ |
| AI ইমেজ 9:16 | image.pollinations.ai → picsum → ffmpeg gradient | ০ |
| ভিডিও ক্লিপ | ffmpeg (ken-burns zoom + pan) | ০ |
| Voiceover | **আপনার নিজের কণ্ঠ** (AI TTS নয়, ডকুমেন্ট অনুযায়ী) | ০ |

---

## ⚙️ CLI

```bash
cd /home/imran/n8n/docpipeline
node pipeline.js stage1 "<টপিক>"                       # স্ক্রিপ্ট
node pipeline.js stage2 <project_id>                   # শট লিস্ট
node pipeline.js stage3 <project_id>                   # ভিডিও প্রম্পট
node pipeline.js stage4 <project_id>                   # ক্লিপ

# §৮/§১০ — অনুমোদন + APPROVED সংস্করণ সংরক্ষণ
node pipeline.js approve <project_id> <stage>

# §৯ — নির্দিষ্ট অংশে সংশোধন (বাকি অংশ অপরিবর্তিত)
node pipeline.js fix <project_id> 1 CLOSING "<নির্দেশনা>"   # স্ক্রিপ্টের একটি সেকশন
node pipeline.js fix <project_id> 2 05 "<নির্দেশনা>"       # শট ০৫
node pipeline.js fix <project_id> 3 05 "<নির্দেশনা>"       # প্রম্পট ০৫

# §১৯ — ফাইনাল কোয়ালিটি চেকলিস্ট
node pipeline.js qc <project_id>
```

HTTP API:
```bash
curl -X POST http://localhost:4100/api/approve/<id>/<stage>
curl -X POST http://localhost:4100/api/fix/<id>/<stage>/<target> \
     -H 'Content-Type: application/json' -d '{"instruction":"..."}'
curl http://localhost:4100/api/qc/<id>
```

n8n ওয়েবহুক:
```bash
curl -X POST http://localhost:5678/webhook/doc-stage1 -H 'Content-Type: application/json' -d '{"topic":"..."}'
curl -X POST http://localhost:5678/webhook/doc-stage2 -H 'Content-Type: application/json' -d '{"project_id":"..."}'
```

---

## ⚠️ জানা দরকার (বাস্তব টেস্ট থেকে শেখা)

### ফ্রি সেবাগুলোর আসল সীমা

| সেবা | সীমা | বিকল্প |
|---|---|---|
| **OpenRouter ফ্রি মডেল** | দৈনিক `free-models-per-day` লিমিট (429) | ১২টি মডেল ব্যাকআপে চালানো হয় |
| **Wikipedia API** | free, no key — কিন্তু bn.wikipedia-এ অনেক টপিক নেই | LLM দিয়ে ইংরেজি search term বানিয়ে en.wikipedia ব্যবহার |
| **ফ্রি মডেল = reasoning model** | reasoning বন্ধ করা যায় না, সব টোকেন reasoning-এ যায় → content খালি | `reasoning: {effort: 'low'}` পাঠাতে হয় |
| **ফ্রি মডেলের output সীমা** | বড় JSON একসাথে আসে না (truncated) | সেকশন/শট ভিত্তিকে আলাদা করে জেনারেট |
| **Pollinations free tier** | **মিনিটে ~১টি ছবি**, resolution 576×1024, নতুন প্রম্পটে 402 | ৬৫ সেকেন্ড অপেক্ষা + রিট্রাই, ছবি 1080×1920-এ স্কেল |
| **Wikimedia Commons** | free, no limit, no key — কিন্তু category loose, মিসম্যাচ ছবি আসে | `USE_WIKIMEDIA=1` দিলে ব্যবহার হয়, ডিফল্টে বন্ধ |
| **Google TTS** | ফ্রি, তবে লম্বা টেক্সটে ব্যর্থ হয় | ছোট টুকরো করে |

### বাংলা ব্যাকরণ
ফ্রি মডেলের বাংলা ব্যাকরণ দুর্বল (মস্তিষ্ণের→মস্তিষ্কের, কার্যক্রল→কার্যক্রম)।
তাই **Master Prompt 04 (প্রুফরিডিং)** যোগ করা হয়েছে — ২ রাউন্ডে (ব্যাকরণ → অর্থ যাচাই)।

### ছবির watermark
- Pollinations: নিচে-ডানে watermark → ffmpeg দিয়ে নিচের ৮% কেটে ফেলা হয়
- Wikimedia: ক্যামেরা watermark (যেমন "REDMI A7") → একইভাবে কাটা হয়

### 9:16 নিশ্চিত করা
সব ছবি `crop → scale=1080:1920 → crop` দিয়ে 9:16 করা হয় (ffmpeg)।

### রিসার্চের প্রাসঙ্গিকতা
Wikipedia থেকে আসা article-এর মধ্যে অপ্রাসঙ্গিক জিনিস (যেমন কোনো একক প্রাণীর গল্প) ঢুকে গেলে ভুল হুক বানে।
তাই ৩ স্তরের ছাঁকনি: (১) keyword relevance scoring → (২) LLM fact selection (সবচেয়ে প্রাসঙ্গিক ৩টি) →
(৩) স্ক্রিপ্টে "RESEARCH NOTES-এ না থাকা কিছু বানাবে না" নিয়ম।

### ফ্রি মডেলে বড় আউটপুট
MP-02-এ ৫০-৬০ শট, MP-03-এ ৬০টি প্রম্পট — একসাথে আসে না।
তাই ব্যাচিং: Stage 2-এ ১টি narration chunk/কল (২-৩ শট), Stage 3-এ ১টি প্রম্পট/কল।
Stage 3-এ ৩টি একসাথে দিলে output truncate হয় → JSON পার্স fail।

### JSON parse: top-level ব্লক
`llm.js`-এর `parseLooseJson` fallback-এ blocks সবচেয়ে **বড়** (top-level) থেকে ধরে।
আগে `reverse()` করত — ফলে nested object ফিরে যেত ({"prompts":[{...}]} থেকে শুধু {...})।

### Resume (429 সামলানো)
Stage 2 ও 3 এখন **resume** করে — আগের রানে যেটুকু তৈরি হয়েছে (state.json-এ সেভ করা) সেটা বাদ দিয়ে
বাকিটা বানায়। তাই দৈনিক ফ্রি লিমিট শেষ হয়ে গেলেও পরে আবার `stage3 <id>` চালালেই চালিয়ে যায়।

### JS replace বাগ (গুরুত্বপূর্ণ)
`String.replace('{{X}}', v)` শুধু **প্রথম** occurrence বদলায় — একই placeholder একাধিকবার থাকলে বাকিগুলো
লেখা থেকে যায় (যেমন `{{WORDS}}` ন্যারেশনের ভেতরে চুঁকে গিয়েছিল)।
`fillPrompt()` হেল্পারটি **সব** occurrence বদলায় — এটাই ব্যবহার করা হয়।
