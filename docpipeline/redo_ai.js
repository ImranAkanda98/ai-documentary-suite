// নির্দিষ্ট শটগুলো AI দিয়ে পুনরায় বানানো (picsum/random বাদ দিয়ে)
// ব্যবহার: node redo_ai.js <project_id> <shot_no> [shot_no...]
// শুধু pollinations ব্যবহার করে — কোনো random ছবি আসবে না
const fs = require('fs');
const path = require('path');
const { pollinations } = require('/home/imran/n8n/docpipeline/images');

const ROOT = '/home/imran/n8n/docpipeline';
const pid = process.argv[2];
const shots = process.argv.slice(3).map(Number);
const dir = path.join(ROOT, 'projects', pid);
const assets = path.join(dir, 'assets');
const prompts = JSON.parse(fs.readFileSync(path.join(dir, '03_video_prompts.json'), 'utf8'));

(async () => {
  for (const num of shots) {
    const p = prompts.prompts.find(x => parseInt(x.shot_no, 10) === num);
    if (!p) { console.log(`shot ${num}: prompt নেই`); continue; }
    const no = String(p.shot_no).padStart(2, '0');
    const file = path.join(assets, `shot_${no}.jpg`);
    process.stdout.write(`shot ${no}: `);
    let ok = false;
    // ৬ বার চেষ্টা — pollinations free tier মিনিটে ১টি
    for (let t = 0; t < 6 && !ok; t++) {
      const r = await pollinations(p.image_prompt || p.video_prompt, file, 1);
      if (r.ok) { console.log(`✓ ${(r.size / 1024).toFixed(0)}KB`); ok = true; }
      else {
        console.log(`... (${r.error})`);
        await new Promise(res => setTimeout(res, 65000));
      }
    }
    if (!ok) console.log(`shot ${no}: ব্যর্থ — পুরনো ছবি রাখা হলো`);
  }
})();
