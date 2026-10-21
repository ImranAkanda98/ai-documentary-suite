import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {DURATION, FPS, WIDTH, HEIGHT} from './data';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
