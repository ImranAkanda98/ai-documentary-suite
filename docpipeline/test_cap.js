const { getKey } = require('/home/imran/n8n/docpipeline/llm');
const key = getKey();

async function t(model, maxTokens) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Write a 500 word essay about spiders.' }],
      max_tokens: maxTokens,
    }),
  });
  const j = await res.json();
  const m = j.choices?.[0]?.message || {};
  console.log(`${model} max=${maxTokens} | status ${res.status} | finish: ${j.choices?.[0]?.finish_reason} | content len: ${(m.content || '').length} | err: ${j.error ? JSON.stringify(j.error).slice(0, 120) : 'none'}`);
}

(async () => {
  await t('minimax/minimax-m3.1-flash:free', 4000);
  await t('minimax/minimax-m3.1-flash:free', 2048);
  await t('minimax/minimax-m3.1-flash:free', 1024);
  await t('poolside/laguna-xs-2.1:free', 4096);
})();
