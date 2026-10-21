const { getImage, keywordsFrom } = require('/home/imran/n8n/docpipeline/images');

(async () => {
  const prompts = [
    'Extreme close-up of a sleeping adult person in a bed, morning light, photorealistic',
    'Microscopic view of neurons and synapses in the brain, glowing, scientific visualization',
    'A person sleeping peacefully under a blanket, bedroom, soft morning light, 9:16 vertical',
  ];
  for (let i = 0; i < prompts.length; i++) {
    const kw = keywordsFrom(prompts[i]);
    console.log('\n' + (i+1) + '. prompt:', prompts[i].slice(0, 60));
    console.log('   keywords:', JSON.stringify(kw));
    const r = await getImage(prompts[i], `/tmp/imgtest_${i}.jpg`, kw);
    console.log('   ->', r.ok ? `${r.source} (${(r.size/1024).toFixed(0)}KB) ${r.title||''}` : 'FAIL ' + r.error);
  }
})();
