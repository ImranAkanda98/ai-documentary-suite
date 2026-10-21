const { generate, callModel } = require('/home/imran/n8n/docpipeline/llm');
const fs = require('fs');

(async () => {
  const sys = 'তুমি একজন বাংলা ডকুমেন্টারি স্ক্রিপ্ট রাইটার। শুধু valid JSON দাও।';
  const user = 'Topic: একটি শুঁয়োপোকা কীভাবে প্রজাপতি হয়ে ওঠে\n\n' +
    'JSON আকৃতি: {"title":"...","hook":"...","sections":[{"name":"HOOK","text":"...","word_count":50}],"full_narration":"...","key_facts":["..."]}';

  // ১. response_format সহ
  try {
    const r = await callModel('minimax/minimax-m3.1-flash:free', sys, user, { max_tokens: 4000, response_format: true });
    console.log('A) response_format=json_object → OK, len', r.raw.length);
  } catch (e) { console.log('A) response_format=json_object → ✗', e.message); }

  // ২. response_format ছাড়া
  try {
    const r = await callModel('minimax/minimax-m3.1-flash:free', sys, user, { max_tokens: 4000 });
    console.log('B) no response_format → OK, len', r.raw.length);
  } catch (e) { console.log('B) no response_format → ✗', e.message); }

  // ৩. no response_format, max_tokens বেশি
  try {
    const r = await callModel('minimax/minimax-m3.1-flash:free', sys, user, { max_tokens: 8000 });
    console.log('C) max_tokens=8000 → OK, len', r.raw.length);
  } catch (e) { console.log('C) max_tokens=8000 → ✗', e.message); }

  // ৪. কাঁচা request দেখি
  const key = require('/home/imran/n8n/docpipeline/llm').getKey();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'minimax/minimax-m3.1-flash:free',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      max_tokens: 4000,
    }),
  });
  const j = await res.json();
  console.log('D) raw status', res.status, '| finish:', j.choices?.[0]?.finish_reason,
    '| content len:', (j.choices?.[0]?.message?.content || '').length,
    '| reasoning len:', (j.choices?.[0]?.message?.reasoning || '').length);
  console.log('   usage:', JSON.stringify(j.usage?.completion_tokens_details));
  console.log('   err:', j.error ? JSON.stringify(j.error).slice(0, 200) : 'none');
})();
