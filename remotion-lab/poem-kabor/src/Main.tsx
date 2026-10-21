import React from 'react';
import {AbsoluteFill, Sequence, Audio, staticFile} from 'remotion';
import {scenes} from './data';
import {theme} from './theme';
import {PoemLine} from './components/PoemLine';
import {Sfx} from './components/Sfx';
import {TitleCard} from './components/TitleCard';
import './Font';

// "কবর" — জসীমউদ্দীন
// প্রতিটি কবিতার লাইনে আলাদা দৃশ্য, লেখা ভয়েসের সাথে সিঙ্ক করা
export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg, fontFamily: theme.font}}>
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
      <Audio src={staticFile('voiceover.mp3')} />
      <Sfx />
    </AbsoluteFill>
  );
};
