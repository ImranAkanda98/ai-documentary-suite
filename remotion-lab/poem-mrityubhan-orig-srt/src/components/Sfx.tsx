import React from 'react';
import {Audio, staticFile} from 'remotion';

export type SfxEvent = {
  name: string;
  at: number;
  volume?: number;
};

// স্ট্যানজা ব্রেকে chime, লাইন বদলে মৃদু pop — কবিতার স্বরে বিরল
export const SFX_EVENTS: SfxEvent[] = [
  {
    "name": "thud",
    "at": 0,
    "volume": 0.2
  },
  {
    "name": "pop",
    "at": 60,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 225,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 405,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 570,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 795,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 975,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 1155,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 1335,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 1635,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 1815,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 1995,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2175,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 2475,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 2655,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2820,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3015,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3180,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3360,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3540,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3720,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 3945,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 4125,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4305,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4485,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4650,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4830,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 5100,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 5280,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 5445,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 5625,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 5820,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 6000,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 6165,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 6345,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 6615,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 6780,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 6960,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7140,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7335,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7515,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7695,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7875,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 8055,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 8220,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 8475,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 8655,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 8835,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9015,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9210,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9390,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9570,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9750,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9960,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 10140,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 10365,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 10545,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 10725,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 10905,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11070,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11250,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11430,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11610,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11790,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11970,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 12180,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 12360,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 12555,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 12735,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 12915,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13095,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13275,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13455,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13620,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13800,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 14070,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 14250,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14430,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14610,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14805,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14985,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15165,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15345,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15525,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15705,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15885,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16065,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16230,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16410,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 16620,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 16800,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16980,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17160,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17340,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17520,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 17775,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 17955,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 18135,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 18315,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 18480,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 18660,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 18840,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19020,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 19245,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 19425,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19590,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19770,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19950,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20130,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20310,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20490,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20670,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20850,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 21075,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 21255,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 21420,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 21600,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 21780,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 21960,
    "volume": 0.05
  }
];

export const Sfx: React.FC = () => (
  <>
    {SFX_EVENTS.map((e, i) => (
      <Audio
        key={i}
        src={staticFile('sfx/' + e.name + '.wav')}
        startFrom={0}
        volume={e.volume ?? 0.1}
      />
    ))}
  </>
);
