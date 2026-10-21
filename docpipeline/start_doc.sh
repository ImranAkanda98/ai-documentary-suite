#!/bin/bash
# ============================================================
#  AI EDUCATIONAL DOCUMENTARY — সব চালু করার স্ক্রিপ্ট
#  চালানো: bash /home/imran/n8n/docpipeline/start_doc.sh
# ============================================================

echo "🎬 AI Educational Documentary Pipeline..."

# ১. ডকুমেন্টারি API সার্ভার (port 4100)
if ! curl -s -o /dev/null http://localhost:4100/api/projects 2>/dev/null; then
  cd /home/imran/n8n/docpipeline && nohup node doc_server.js > /home/imran/n8n/docpipeline/server.log 2>&1 &
  echo "  ✓ ডক সার্ভার চালু (port 4100)"
  sleep 2
else
  echo "  ✓ ডক সার্ভার আগে থেকেই চালু"
fi

# ২. n8n (port 5678)
if ! curl -s -o /dev/null http://localhost:5678/healthz 2>/dev/null; then
  cd /home/imran/n8n && \
  N8N_USER_FOLDER=/home/imran/n8n/.n8n \
  N8N_PORT=5678 \
  N8N_SECURE_COOKIE=false \
  N8N_DIAGNOSTICS_ENABLED=false \
  nohup ./node_modules/.bin/n8n > /home/imran/n8n/n8n.log 2>&1 &
  echo "  ✓ n8n চালু (port 5678)"
  sleep 12
else
  echo "  ✓ n8n আগে থেকেই চালু"
fi

echo ""
echo "================================================="
echo "  ওয়েব UI  : http://localhost:4100"
echo "  n8n UI   : http://localhost:5678"
echo "  ইউজার   : imran@local.test / LocalOnly12345!"
echo "  প্রজেক্ট : /home/imran/n8n/docpipeline/projects/"
echo "================================================="
