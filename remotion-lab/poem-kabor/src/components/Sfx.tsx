import React from 'react';
import {Audio, staticFile} from 'remotion';

export type SfxEvent = {
  name: string;
  at: number;
  volume?: number;
};

export const SFX_EVENTS: SfxEvent[] = [
  {
    "name": "thud",
    "at": 0,
    "volume": 0.2
  },
  {
    "name": "pop",
    "at": 24,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 750,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 795,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 970,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 1046,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 1651,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 1746,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 1789,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 1938,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 2097,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2230,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2389,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2528,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2690,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2701,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2712,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 2723,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 3422,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 3447,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3492,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3715,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 3795,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 4092,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 4174,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4233,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 4272,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 4860,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 4961,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 5237,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 5317,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 5707,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 5778,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 6130,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 6296,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 6466,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 6707,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 6941,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 7088,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 7159,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7277,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 7470,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 7775,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 7919,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 8143,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 8345,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 8605,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 8714,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 8766,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 8853,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 8864,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9308,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9380,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9590,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9724,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9911,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 9980,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 10244,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 10326,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 11121,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 11166,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11204,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11215,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11282,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11496,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11609,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 11681,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 12135,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 12281,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 12461,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 12639,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 12845,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 13023,
    "volume": 0.13
  },
  {
    "name": "chime",
    "at": 13180,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 13204,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13289,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13776,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13879,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13928,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 13982,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 14225,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 14298,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14353,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14813,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 14900,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 15144,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 15278,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15447,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 15526,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 15805,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 15929,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 16126,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 16224,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16447,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 16532,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 16879,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 16958,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17217,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17480,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17559,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17680,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17697,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 17773,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 18193,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 18267,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 18523,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 18605,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 18826,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 18843,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19204,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19388,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19603,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 19706,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 19957,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 20126,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20326,
    "volume": 0.05
  },
  {
    "name": "pop",
    "at": 20433,
    "volume": 0.05
  },
  {
    "name": "chime",
    "at": 20700,
    "volume": 0.13
  },
  {
    "name": "pop",
    "at": 20720,
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
