import React, {useEffect, useState} from 'react';
import {Audio, staticFile} from 'remotion';

declare global {
  interface Window {
    __PREVIEW_AUDIO__?: boolean;
  }
}

// ফাইলের অস্তিত্ব manifest.json দিয়ে দেখা হয় (404 এড়াতে)।
// manifest না থাকলে ধরে নেওয়া হয় যে voiceover নেই — তাই কোনো 404 লগ হয় না।
export const PreviewAudio: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [hasVoiceover, setHasVoiceover] = useState(false);

  useEffect(() => {
    // preview-তে চালু, render-এ বন্ধ
    const want = typeof window !== 'undefined' && window.__PREVIEW_AUDIO__ !== false;
    setEnabled(want);

    let cancelled = false;
    fetch(staticFile('manifest.json'))
      .then((r) => (r.ok ? r.json() : { voiceover: false }))
      .then((m) => {
        if (!cancelled) setHasVoiceover(!!m.voiceover);
      })
      .catch(() => {
        if (!cancelled) setHasVoiceover(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!enabled || !hasVoiceover) return null;
  return <Audio src={staticFile('voiceover.mp3')} />;
};
