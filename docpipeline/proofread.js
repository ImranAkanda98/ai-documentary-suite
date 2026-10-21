// দুই রাউন্ডে প্রুফরিডিং
const fs = require('fs');
const path = require('path');
const { generate } = require('/home/imran/n8n/docpipeline/llm');

const ROOT = '/home/imran/n8n/docpipeline';
const pid = process.argv[2];
const dir = path.join(ROOT, 'projects', pid);
const script = JSON.parse(fs.readFileSync(path.join(dir, '01_script.json'), 'utf8'));
const PROOF = fs.readFileSync(path.join(ROOT, 'prompts', 'mp04_proofread.txt'), 'utf8');

(async () => {
  let all = [];
  for (let round = 1; round <= 2; round++) {
    const prompt = PROOF
      .replace('{{SCRIPT_JSON}}', JSON.stringify({ sections: script.sections.filter(s => s.text) }))
      .replace('{{ROUND}}', String(round));
    const pr = await generate(
      'তুমি একজন বাংলা ভাষা সম্পাদক। তুমি শুধুমাত্র valid JSON আউটপুট দাও।',
      prompt, { max_tokens: 4000, temperature: round === 1 ? 0.3 : 0.2, response_format: true, verbose: true }
    );
    let changed = 0;
    for (const f of (pr.data.corrected_sections || [])) {
      const orig = script.sections.find(s => s.name === f.name);
      if (orig && f.text && f.text.trim()) {
        if (f.text.trim() !== orig.text.trim()) { changed++; console.log('রাউন্ড' + round + ' সংশোধিত: ' + f.name); }
        orig.text = f.text.trim();
      }
    }
    all = all.concat(pr.data.corrections_made || []);
    console.log('রাউন্ড ' + round + ': ' + changed + ' সেকশন সংশোধিত');
    if (!changed) break;
  }

  script.full_narration = script.sections.map(s => s.text).filter(Boolean).join('\n\n');
  script.word_count = script.full_narration.split(/\s+/).filter(Boolean).length;
  script.estimated_seconds = Math.round((script.word_count / 160) * 60);
  script.corrections = all;
  fs.writeFileSync(path.join(dir, '01_script.json'), JSON.stringify(script, null, 2));

  const md = [
    '# ' + script.title, '',
    '> টপিক: ' + script.topic,
    '> মডেল: ' + script.model,
    '> শব্দ: ' + script.word_count + ' | আনুমানিক দৈর্ঘ্য: ' + script.estimated_seconds + ' সেকেন্ড',
    '', '## ন্যারেশন', '', script.full_narration, '',
    '## মূল তথ্য', ...(script.key_facts || []).map(f => '- ' + f),
    ...(script.uncertainty_notes?.length ? ['', '## অনিশ্চয়তা', ...script.uncertainty_notes.map(f => '- ' + f)] : []),
    ...(all.length ? ['', '## প্রুফরিডিং সংশোধন', ...all.map(c => '- ' + c)] : []),
  ].join('\n');
  fs.writeFileSync(path.join(dir, '01_script.md'), md);
  console.log('\n✓ সম্পন্ন। শব্দ: ' + script.word_count);
})();
