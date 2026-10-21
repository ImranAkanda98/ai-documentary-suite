# মৃত্যুভাণ — Remotion Motion-Graphics ভিডিও

**রবীন্দ্রনাথ ঠাকুরের "মৃত্যুভাণ"** কবিতার ১২ মিনিটের অ্যানিমেটেড ভিডিও, আপনার নিজের স্বরলিপির অডিও সহ।

SRT → Remotion পাইপলাইন দিয়ে তৈরি — ১১৮টি কবিতার লাইন, প্রতিটি আলাদা সিনে।

---

## 🎬 ভিডিওর বিবরণ

| | |
|---|---|
| **রেজোলিউশন** | 1920×1080 (16:9) |
| **ফ্রেম রেট** | 30fps |
| **দৈর্ঘ্য** | 12 মিনিট ১৮ সেকেন্ড (২২,১৪৩ ফ্রেম) |
| **কিউ** | ১১৮ (প্রতিটি লাইন = ১ সিন) |
| **অডিও** | `public/voiceover.mp3` — আপনার নিজের স্বরলিপি |
| **SFX** | স্ট্যানজা ব্রেকে chime (×13), লাইন বদলে মৃদু pop (×105) |
| **ফন্ট** | Noto Serif Bengali (অফলাইন বান্ডেল করা, যুক্তাক্ষর-নিরাপদ) |

## 🎨 থিম

```
bg       #0B0C10   গাঢ় প্রায় কালো
hero     #7C8AA8   নীলচে ধূসর
accent   #C9A227   সোনালি
text     #F2EDE3   উষ্ণ সাদা
muted    #8A8d96
surface  #14161C
```

## 📁 ফাইল কাঠামো

```
src/
├── index.ts
├── Root.tsx              Composition "Main"
├── Main.tsx              ভিনেট + টাইটেল কার্ড + ১১৮টি সিন + অডিও
├── data.ts               কিউ/সিনের টাইমিং (SRT থেকে অটো-জেনারেটেড)
├── theme.ts              সব রং, ইজিং, ফন্ট
├── Font.tsx              Noto Serif Bengali লোডার
└── components/
    ├── TitleCard.tsx     শুরুর টাইটেল কার্ড (মৃত্যুভাণ / রবীন্দ্রনাথ ঠাকুর)
    ├── PoemLine.tsx      কবিতার লাইন — কেন্দ্র-সারিবদ্ধ, সোনালি রেখা, শব্দে শব্দে ফেড
    ├── Sfx.tsx           SFX ইভেন্ট তালিকা
    ├── SceneView.tsx     জেনারিক লেআউট (অন্য প্রজেক্টের জন্য)
    └── WordByWord.tsx    শব্দে-শব্দে অ্যানিমেশন
public/
├── voiceover.mp3         আপনার স্বরলিপি
├── mrityubhan.srt        সোর্স SRT
├── manifest.json         কোন মিডিয়া আছে
└── sfx/                  pop, click, whoosh, chime, thud (কোডে সিনথেসাইজড)
srt.json                  কিউ/সিন বিশ্লেষণ
```

## ▶️ ব্যবহার

```bash
npm install

# প্রিভিউ
npx remotion studio

# রেন্ডার
npx remotion render src/index.ts Main out/video.mp4
```

`node_modules` ছাড়াই চালাতে হলে:

```bash
ln -sfn /home/imran/n8n/remotion-lab/node_modules ./node_modules
```

## 🔁 নতুন SRT দিয়ে একই ধরনের ভিডিও

```bash
cd /home/imran/n8n/remotion-lab
node generate.js input/নতুন.srt out-নতুন opts-poem.json
```

`opts-poem.json`-এ `scenes: {maxCuesPerScene: 1, minGapSec: 0, maxSceneSec: 0}` দেওয়া
আছে — এটা না দিলে প্রতিটি সিনে **প্রথম কিউ ছাড়া বাকিগুলো ড্রপ হয়ে যায়** (এটা
জেনারেটরের একটা সিলেন্ট বাগ, এখানে ঠিক করা আছে)।

## 📜 কবিতা

রবীন্দ্রনাথ ঠাকুর, "মৃত্যুভাণ" — *কবিতা* (১৯১৬) থেকে।

## 📄 লাইসেন্স

MIT
