const { getKey } = require('/home/imran/n8n/docpipeline/llm');
const key = getKey();

const sys = 'তুমি একজন বাংলা ডকুমেন্টারি স্ক্রিপ্ট রাইটার। শুধু valid JSON দাও।';
const user = 'Topic: একটি শুঁয়োপোকা কীভাবে প্রজাপতি হয়ে ওঠে\n\nJSON আকৃতি: {"title":"...","hook":"...","sections":[{"name":"HOOK","text":"...","word_count":50}],"full_narration":"...","key_facts":["..."]}';

async function t(label, extra) {
  const body = {
    model: 'minimax/minimax-m3.1-flash:free',
    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    ...extra,
  };
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  const m = j.choices?.[0]?.message || {};
  console.log(label, '| status', res.status, '| finish:', j.choices?.[0]?.finish_reason,
    '| content:', (m.content || '').length, '| reasoning:', (m.reasoning || '').length,
    '| rtok:', j.usage?.completion_tokens_details?.reasoning_tokens);
  if ((m.content || '').length) console.log('   ->', (m.content || '').slice(0, 90));
  if (j.error) console.log('   err:', JSON.stringify(j.error).slice(0, 160));
}

(async () => {
  await t('A) reasoning.enabled=false ', { max_tokens: 4000, reasoning: { enabled: false } });
  await t('B) reasoning.effort=low    ', { max_tokens: 4000, reasoning: { effort: 'low' } });
  await t('C) max_tokens=20000       ', { max_tokens: 20000 });
  await t('D) temperature=0.1         ', { max_tokens: 4000, temperature: 0.1 });
})();
