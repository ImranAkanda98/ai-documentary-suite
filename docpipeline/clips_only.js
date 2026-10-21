// শুধু ক্লিপ বানানো (ছবি আগে থেকেই আছে)
// ব্যবহার: node clips_only.js <project_id>
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = '/home/imran/n8n/docpipeline';
const pid = process.argv[2];
const dir = path.join(ROOT, 'projects', pid);
const assets = path.join(dir, 'assets');
const clips = path.join(dir, 'clips');
fs.mkdirSync(clips, { recursive: true });

const prompts = JSON.parse(fs.readFileSync(path.join(dir, '03_video_prompts.json'), 'utf8'));

(async () => {
  const list = prompts.prompts;
  for (const p of list) {
    const no = String(p.shot_no).padStart(2, '0');
    const img = path.join(assets, `shot_${no}.jpg`);
    const clip = path.join(clips, `shot_${no}.mp4`);
    if (!fs.existsSync(img)) { console.log(`shot ${no}: ইমেজ নেই`); continue; }
    const dur = p.duration_sec || 6;
    process.stdout.write(`shot ${no} (${dur}s)... `);
    try {
      execSync(`ffmpeg -y -loop 1 -i "${img}" -t ${dur} -c:v libx264 -tune stillimage -pix_fmt yuv420p ` +
        `-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
        `zoompan=z='min(zoom+0.0006,1.15)':x='iw/2-(iw/zoom/2)+sin(on/40)*6':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=25,` +
        `format=yuv420p" -r 25 -c:a aac -b:a 128k "${clip}"`, { stdio: 'pipe' });
      console.log('✓');
    } catch (e) { console.log('✗ ' + e.message.slice(0, 80)); }
  }

  // জোড়া লাগানো
  const segs = list.map(p => path.join(clips, `shot_${String(p.shot_no).padStart(2, '0')}.mp4`)).filter(f => fs.existsSync(f));
  if (segs.length) {
    const listFile = path.join(dir, 'concat.txt');
    fs.writeFileSync(listFile, segs.map(s => `file '${s}'`).join('\n'));
    const full = path.join(dir, 'documentary_rough.mp4');
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${full}"`, { stdio: 'pipe' });
    console.log('\n✓ রাফ কাট: ' + full);
    console.log('  সাইজ: ' + (fs.statSync(full).size / 1048576).toFixed(2) + ' MB | সেগমেন্ট: ' + segs.length);
  }
})();
