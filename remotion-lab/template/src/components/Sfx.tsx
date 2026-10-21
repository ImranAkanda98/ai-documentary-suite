import React from 'react';
import {Audio, staticFile} from 'remotion';

export type SfxEvent = {
  name: string;
  at: number;
  volume?: number;
};

// সিন ট্রানজিশন ও মূল এন্ট্রিতে SFX। এই তালিকা generate.js থেকে লেখা হয়।
export const SFX_EVENTS: SfxEvent[] = [];

export const Sfx: React.FC = () => (
  <>
    {SFX_EVENTS.map((e, i) => (
      <Audio
        key={i}
        src={staticFile('sfx/' + e.name + '.wav')}
        startFrom={0}
        volume={e.volume ?? 0.28}
      />
    ))}
  </>
);
