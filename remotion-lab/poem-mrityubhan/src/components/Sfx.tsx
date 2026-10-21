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
    "at": 23,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 749,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 821,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 969,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 1251,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 1650,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 1754,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 1838,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 1937,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2098,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2229,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2388,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2528,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2689,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2700,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2716,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2732,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 3421,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 3505,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3592,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3714,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3869,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 4091,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 4282,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4457,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4654,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4859,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4968,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 5236,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 5393,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 5706,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 5777,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 6129,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 6295,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 6465,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 6706,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 6940,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 7087,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 7160,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7341,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7550,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7774,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7918,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 8142,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 8345,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 8604,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 8714,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 8767,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 8854,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9072,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9308,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9455,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9589,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9747,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9910,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 10057,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 10243,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 10421,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 11120,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 11168,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11207,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11241,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11281,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11495,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11609,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11850,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 12134,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 12280,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 12462,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 12640,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 12844,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 13022,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 13179,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 13242,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13290,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13777,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13882,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13983,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14093,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14224,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14420,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14616,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14812,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14968,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15143,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15283,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15446,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15602,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 15804,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 15961,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16126,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16278,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16446,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16643,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 16878,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 17036,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17216,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17479,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17558,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17681,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17825,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17988,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 18192,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 18302,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 18522,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 18632,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 18825,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 18996,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19203,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19388,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19602,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19780,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19956,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20125,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20325,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20519,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20699,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20944,
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
