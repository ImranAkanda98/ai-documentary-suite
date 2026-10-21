// 03_video_prompts.md পুনর্লিখন (LLM call ছাড়া — শুধু ফরম্যাটিং)
// ব্যবহার: node rewrite_md.js <project_id>
const fs = require('fs');
const path = require('path');
const P = require('./pipeline');

const id = process.argv[2];
if (!id) { console.error('project_id দিন'); process.exit(1); }

const dir = P.projDir(id);
const st = P.loadState(id);
const prompts = JSON.parse(fs.readFileSync(path.join(dir, '03_video_prompts.json'), 'utf8'));

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
  '> Global Style Guide: ' + (prompts.global_style_guide || ''),
  '> মোট প্রম্পট: ' + prompts.prompts.length + ' | মোট দৈর্ঘ্য: ' + (prompts.total_duration_sec || 0) + ' সেকেন্ড',
  '',
].join('\n');

prompts.prompts.forEach((p) => {
  md += '## SHOT ' + p.shot_no + '\n\n';
  if (p.script_section) md += '**স্ক্রিপ্ট অংশ:** ' + p.script_section + '\n\n';
  SECTIONS.forEach(([k, label]) => {
    md += '**' + label + ':** ' + (p[k] || '-') + '\n\n';
  });
  md += '**Video Prompt (copy-paste ready):**\n```\n' + p.video_prompt + '\n```\n\n';
  md += '**Negative:**\n```\n' + p.negative_prompt + '\n```\n\n';
  md += '**Image Prompt (9:16 still):**\n```\n' + p.image_prompt + '\n```\n\n---\n\n';
});

fs.writeFileSync(path.join(dir, '03_video_prompts.md'), md);
console.log('✓ md লেখা হয়েছে: ' + md.length + ' অক্ষর, ' + prompts.prompts.length + 'টি প্রম্পট');
