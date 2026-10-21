import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {scenes} from './data';
import {theme} from './theme';
import {SceneView} from './components/SceneView';
import {PreviewAudio} from './components/PreviewAudio';
import {Sfx} from './components/Sfx';
import './Font';

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.colors.bg, fontFamily: theme.font}}>
      {scenes.map((scene) => (
        <Sequence
          key={scene.index}
          from={scene.startFrame}
          durationInFrames={scene.durationInFrames}
          name={'scene-' + scene.index}
        >
          <SceneView scene={scene} />
        </Sequence>
      ))}
      <PreviewAudio />
      <Sfx />
    </AbsoluteFill>
  );
};
