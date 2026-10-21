// শুধু AI ইমেজ বানানো (ক্লিপ বানানো ছাড়া) — দ্রুত টেস্টের জন্য
// ব্যবহার: node images_only.js <project_id> [start_shot] [end_shot]
const fs = require('fs');
const path = require('path');
const { getImage } = require('/home/imran/n8n/docpipeline/images');
const { generate } = require('/home/imran/n8n/docpipeline/llm');

const ROOT = '/home/imran/n8n/docpipeline';
const pid = process.argv[2];
const from = parseInt(process.argv[3] || '1', 10);
const to = parseInt(process.argv[4] || '999', 10);

const dir = path.join(ROOT, 'projects', pid);
const assets = path.join(dir, 'assets');
fs.mkdirSync(assets, { recursive: true });

const prompts = JSON.parse(fs.readFileSync(path.join(dir, '03_video_prompts.json'), 'utf8'));

(async () => {
  const list = prompts.prompts;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const no = String(p.shot_no).padStart(2, '0');
    const num = parseInt(no, 10);
    if (num < from || num > to) continue;

    const file = path.join(assets, `shot_${no}.jpg`);
    process.stdout.write(`শট ${no}: `);
    try {
      const r = await getImage(p.image_prompt || p.video_prompt, file, [], []);
      console.log(`${(r.size / 1024).toFixed(0)}KB (${r.source})`);
    } catch (e) {
      console.log('✗ ' + e.message);
    }
  }
})();
