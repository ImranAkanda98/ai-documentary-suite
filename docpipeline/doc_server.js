// ============================================================
//  AI EDUCATIONAL DOCUMENTARY — API সার্ভার
//  n8n এবং ব্রাউজার উভয় থেকে ব্যবহারযোগ্য
//  চালানো: node doc_server.js
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const P = require('./pipeline');

const PORT = 4100;
const ROOT = '/home/imran/n8n/docpipeline';

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type });
  res.end(body);
}
const json = (res, code, obj) => send(res, code, 'application/json; charset=utf-8', JSON.stringify(obj));

function listProjects() {
  if (!fs.existsSync(P.PROJECTS)) return [];
  return fs.readdirSync(P.PROJECTS).map((id) => {
    const st = P.loadState(id);
    return {
      id,
      topic: st.topic,
      title: st.script?.title || st.topic,
      stage: st.current_stage,
      approved: st.approved,
      shots: st.shotlist?.shots?.length || 0,
      prompts: st.prompts?.prompts?.length || 0,
      assets: st.assets?.filter((a) => a.clip).length || 0,
      created: st.created,
    };
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  // ---------- UI ----------
  if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
    return send(res, 200, 'text/html; charset=utf-8', fs.readFileSync(path.join(ROOT, 'ui.html')));
  }

  // ---------- প্রজেক্ট তালিকা ----------
  if (req.method === 'GET' && p === '/api/projects') {
    return json(res, 200, { projects: listProjects() });
  }

  // ---------- প্রজেক্ট ডিটেইল ----------
  if (req.method === 'GET' && p.startsWith('/api/project/')) {
    const id = decodeURIComponent(p.replace('/api/project/', ''));
    try {
      const st = P.loadState(id);
      return json(res, 200, st);
    } catch (e) {
      return json(res, 404, { error: e.message });
    }
  }

  // ---------- ফাইল ডাউনলোড ----------
  if (req.method === 'GET' && p.startsWith('/api/file/')) {
    const rel = decodeURIComponent(p.replace('/api/file/', ''));
    const fp = path.join(P.PROJECTS, rel);
    if (!fp.startsWith(P.PROJECTS) || !fs.existsSync(fp)) return send(res, 404, 'text/plain', 'Not found');
    const ext = path.extname(fp);
    const types = { '.md': 'text/markdown', '.json': 'application/json', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.txt': 'text/plain' };
    return send(res, 200, types[ext] || 'application/octet-stream', fs.readFileSync(fp));
  }

  // ---------- স্টেজ চালানো ----------
  if (req.method === 'POST' && p.startsWith('/api/stage/')) {
    const parts = p.split('/');           // /api/stage/1  or  /api/stage/2/<id>
    const stage = parts[3];
    const id = parts[4] ? decodeURIComponent(parts[4]) : null;

    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      let input = {};
      try { input = JSON.parse(body || '{}'); } catch {}
      try {
        let out;
        if (stage === '1') out = await P.stage1(input.topic, id);
        else if (stage === '2') out = await P.stage2(id);
        else if (stage === '3') out = await P.stage3(id);
        else if (stage === '4') out = await P.stage4(id);
        else return json(res, 400, { error: 'ভুল স্টেজ' });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { error: e.message });
      }
    });
    return;
  }

  // ---------- §৮ অনুমোদন ----------
  if (req.method === 'POST' && p.startsWith('/api/approve/')) {
    const parts = p.split('/');
    const id = decodeURIComponent(parts[3] || '');
    const stage = Number(parts[4]);
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try { return json(res, 200, await P.approveStage(id, stage)); }
      catch (e) { return json(res, 500, { error: e.message }); }
    });
    return;
  }

  // ---------- §৯ targeted correction ----------
  if (req.method === 'POST' && p.startsWith('/api/fix/')) {
    const parts = p.split('/');
    const id = decodeURIComponent(parts[3] || '');
    const stage = Number(parts[4]);
    const target = decodeURIComponent(parts[5] || '');
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      let input = {};
      try { input = JSON.parse(body || '{}'); } catch {}
      try {
        return json(res, 200, await P.fixPart(id, stage, target, input.instruction || ''));
      } catch (e) { return json(res, 500, { error: e.message }); }
    });
    return;
  }

  // ---------- §১৯ quality checklist ----------
  if (req.method === 'GET' && p.startsWith('/api/qc/')) {
    const id = decodeURIComponent(p.replace('/api/qc/', ''));
    try { return json(res, 200, P.qualityCheck(id)); }
    catch (e) { return json(res, 500, { error: e.message }); }
  }

  send(res, 404, 'text/plain', 'Not found');
});

server.listen(PORT, () => {
  console.log('AI Documentary Pipeline চালু!');
  console.log('ব্রাউজারে খুলুন: http://localhost:' + PORT);
});
