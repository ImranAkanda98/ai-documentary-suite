import React from 'react';
import {AbsoluteFill, Sequence, Audio, staticFile} from 'remotion';
import {scenes} from './data';
import {theme} from './theme';
import {PoemLine} from './components/PoemLine';
import {Sfx} from './components/Sfx';
import {TitleCard} from './components/TitleCard';
import './Font';

// "মৃত্যুভাণ" — রবীন্দ্রনাথ ঠাকুর
// প্রতিটি কবিতার লাইন = একটি সিন, কেন্দ্র-সারিবদ্ধ, সোনালি রেখা
export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg, fontFamily: theme.font}}>
      {/* সূক্ষ্ম ভিনেট — কেন্দ্রে আলো, প্রান্তে অন্ধকার */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 78% 62% at 50% 46%, rgba(124,138,168,0.10), transparent 72%)',
        }}
      />

      {/* টাইটেল কার্ড — প্রথম সিন শুরুর আগে (ফ্রেম 0-60) */}
      <Sequence from={0} durationInFrames={60} name="title-card">
        <TitleCard />
      </Sequence>

      {scenes.map((scene) => (
        <Sequence
          key={scene.index}
          from={scene.startFrame}
          durationInFrames={scene.durationInFrames}
          name={'line-' + scene.index}
        >
          <PoemLine scene={scene} />
        </Sequence>
      ))}

      {/* ভয়েসওভার — আপনার অডিও */}
      <Audio src={staticFile('voiceover.mp3')} />

      <Sfx />
    </AbsoluteFill>
  );
};
