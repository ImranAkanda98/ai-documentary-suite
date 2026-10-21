# 🎬 AI Educational Documentary Suite

**বাংলা AI ডকুমেন্টারি ভিডিও তৈরির সম্পূর্ণ, সম্পূর্ণ ফ্রি পাইপলাইন।**

দুটি স্বাধীন টুলকিট:
1. **docpipeline/** — টপিক থেকে ডকুমেন্টারি ভিডিও (Research → Script → Shot List → Video Prompts → Clips)
2. **remotion-lab/** — SRT থেকে মোশন-গ্রাফিক্স ভিডিও (Remotion)

কোনো API কেনার দরকার নেই — শুধু ফ্রি টায়ার।

---

## 🚀 দ্রুত শুরু

### ১) ডকুমেন্টারি পাইপলাইন

```bash
cd docpipeline
bash start_doc.sh          # সব সার্ভিস চালু করে
```

| সার্ভিস | ঠিকানা |
|---|---|
| ডকুমেন্টারি UI | http://localhost:4100 |
| n8n | http://localhost:5678 (`imran@local.test` / `LocalOnly12345!`) |

CLI:
```bash
node pipeline.js stage1 "<টপিক>"                  # স্ক্রিপ্ট
node pipeline.js stage2 <project_id>              # ৫০-৬০ শট
node pipeline.js stage3 <project_id>              # ভিডিও প্রম্পট
node pipeline.js stage4 <project_id>              # AI ইমেজ + ক্লিপ

node pipeline.js approve <project_id> <stage>     # অনুমোদন + APPROVED সংস্করণ
node pipeline.js fix <project_id> 2 05 "<নির্দেশনা>"  # শুধু শট ০৫ সংশোধন
node pipeline.js qc <project_id>                   # ১০ মানদণ্ডের চেক
```

### ২) Remotion মোশন-গ্রাফিক্স

```bash
cd remotion-lab
npm install
node generate.js <file.srt> ./out-project
cd out-project && npx remotion studio          # প্রিভিউ
npx remotion render src/index.ts Main out/video.mp4
```

---

## 🎬 ডকুমেন্টারি পাইপলাইন — ৪ স্টেজ

```
TOPIC
  ↓  Stage 1  Web research (Wikipedia) → LLM fact selection → বাংলা ন্যারেশন স্ক্রিপ্ট
             (৬টি সেকশন, Master Prompt 01-এর ২৯টি নিয়ম)
             → স্বয়ংক্রিয় প্রুফ্রিডিং (২ রাউন্ড: ব্যাকরণ → অর্থ যাচাই)
  ⏸  অনুমোদন দরকার
  ↓  Stage 2  শট লিস্ট — Master Prompt 02 অনুযায়ী ৫০-৬০ শট
             (process-visualization, transparency rule, ৬০-৭০% শটে graphics)
  ⏸  অনুমোদন দরকার
  ↓  Stage 3  ভিডিও প্রম্পট — ঠিক ৬টি section
             (Environment · Main Subject · Subject Activity ·
              Camera Movement · Graphics/Callouts · Ambience Sound)
  ⏸  অনুমোদন দরকার
  ↓  Stage 4  AI ইমেজ (1080×1920) → ffmpeg ক্লিপ + educational callout overlay
```

**Stage skip করা যায় না।** প্রতিটি স্টেজে পাইপলাইন থামে ও অনুমোদনের জন্য জিজ্ঞেস করে।

### Master Prompt-সূত্র

| ফাইল | ভূমিকা |
|---|---|
| `prompts/mp01_script.txt` | Topic → Research → Script (২৯টি নিয়ম, AI-sounding phrase নিষিদ্ধ) |
| `prompts/mp02_shotlist.txt` | Script → ৫০-৬০ শট (process visualization, transparency rule) |
| `prompts/mp03_videoprompt.txt` | Shot List → ৬-সেকশন ভিডিও প্রম্পট (standalone, script-traceable) |
| `prompts/mp04_proofread.txt` | ব্যাকরণ ও অর্থ যাচাই (২ রাউন্ড) |
| `prompts/_original/` | মূল Master Prompt PDF (আসল স্পেক) |

### Educational Graphics

`graphics.js` — Stage 3-এর প্রম্পট থেকে **exact text** বের করে (যেমন `"COLD AIR"`, `"O₂ CAPTURE ACTIVE"`) আসল
callout overlay বসায়: translucent panel + accent bar + leader line + subject-এর দিকে ইঙ্গিত।
বাংলা লেবেলের জন্য Noto Sans Bengali (যুক্তাক্ষর-সঠিক)।

---

## 🎨 Remotion পাইপলাইন — SRT → মোশন-গ্রাফিক্স

```
SRT → সিন বিভাজন (অর্থ অনুযায়ী, cue boundary মেনে) → Remotion প্রজেক্ট
    → 1920×1080 MP4 + কোড-জেনারেটেড SFX
```

| ফাইল | কাজ |
|---|---|
| `srt.js` | SRT → cue, frame timing, scene split, script analysis |
| `generate.js` | SRT + theme → সম্পূর্ণ Remotion প্রজেক্ট |
| `sfx.js` | কোডেই ৫টি SFX তৈরি (pop, click, whoosh, chime, thud) — soft attack, fast decay, low-pass, reverb, no clipping |
| `template/src/` | React কম্পোনেন্ট (SceneView, WordByWord, PreviewAudio, Sfx) |

**নিয়ম:** শুধু একটিমাত্র প্রশ্ন (রঙের সিম) · বাংলা অক্ষরে ভাঙে না · SRT-ই একমাত্র timing-উৎস · শুধু SFX (music/voiceover নয়)

---

## 💰 সম্পূর্ণ ফ্রি

| কাজ | সেবা | খরচ |
|---|---|---|
| স্ক্রিপ্ট / শট লিস্ট / প্রম্পট | OpenRouter `:free` (১২টি মডেল ব্যাকআপ) | ০ |
| ওয়েব রিসার্চ | Wikipedia API (bn + en) | ০ |
| AI ইমেজ 9:16 | image.pollinations.ai | ০ |
| ভিডিও ক্লিপ + ক্যালআউট | ffmpeg | ০ |
| SFX | কোডে সিনথেসাইজ | ০ |
| Voiceover | **নিজের কণ্ঠ** (AI TTS নয়) | ০ |

---

## 🔧 ফ্রি টায়ারের সীমা ও সমাধান

| সীমা | সমাধান |
|---|---|
| ফ্রি মডেল = reasoning model | `reasoning: {effort: 'low'}` পাঠানো হয় |
| দৈনিক লিমিট (429) | ১২টি মডেল ব্যাকআপ + **resume** (বাকি কাজ থেকে শুরু) |
| বড় JSON truncated | ব্যাচিং: Stage 2 → ১ chunk/কল, Stage 3 → ১ প্রম্পট/কল |
| Pollinations: মিনিটে ১টি ছবি | ৬৫ সে অপেক্ষা + রিট্রাই, 1080×1920-এ স্কেল |
| Pollinations watermark | ffmpeg দিয়ে নিচের ৪২ পিক্সেল কাটা |
| bn.wikipedia-এ অনেক টপিক নেই | LLM ইংরেজি search term বানায় → en.wikipedia |
| `String.replace('{{X}}')` শুধু প্রথমটা বদলায় | `fillPrompt()` (global replace) |
| JSON parse-এ nested object ফিরে যায় | blocks-কে বড় থেকে ছোট করে (top-level আগে) |
| drawbox-এ `w`/`h` = বক্সের সাইজ | ফ্রেমের সাইজের জন্য `iw`/`ih`, বাকি সব absolute pixel |

---

## 📁 ফাইল কাঠামো

```
docpipeline/
├── pipeline.js          ← মূল ইঞ্জিন (৪ স্টেজ + approve/fix/qc)
├── research.js          ← Wikipedia + DuckDuckGo + relevance scoring
├── graphics.js          ← educational callout overlay renderer
├── images.js            ← Pollinations / Wikimedia / picsum
├── llm.js               ← ফ্রি OpenRouter ক্লায়েন্ট (JSON repair সহ)
├── doc_server.js        ← API সার্ভার (port 4100)
├── ui.html              ← ওয়েব UI
├── prompts/             ← Master Prompt 01-04 + _original/
└── projects/<id>/       ← আউটপুট

remotion-lab/
├── srt.js · generate.js · sfx.js
└── template/src/        ← React কম্পোনেন্ট
```

---

## 📚 ডকুমেন্টেশন

- `docpipeline/README.md` — ডকুমেন্টারি পাইপলাইনের বিস্তারিত
- Master Prompt PDF: `docpipeline/prompts/_original/`

## 📄 লাইসেন্স

MIT — ব্যবহার, পরিবর্তন, বিতরণে স্বাধীন।
