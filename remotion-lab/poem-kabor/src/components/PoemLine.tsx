import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {theme} from '../theme';
import {SceneVisual, SceneKind} from './Scenes';

type Scene = any;

// ============================================================
//  কবিতার লাইন — দৃশ্যের উপরে লেখা
// ============================================================
export const PoemLine: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const L = scene.layout;
  const text = L.title || '';
  const kind = (L.scene as SceneKind) || 'grave';

  const inO = interpolate(frame, [0, 16], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textFrames = (scene.textFrames as number) || scene.durationInFrames;
  const outO = interpolate(frame, [textFrames - 14, textFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(inO, outO);

  const rise = interpolate(frame, [0, 20], [24, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ruleW = interpolate(frame, [5, 22], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // শব্দে শব্দে, ব্লার থেকে পরিষ্কার
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* দৃশ্য — প্রতিটি লাইনে আলাদা চিত্রকল্প */}
      <SceneVisual kind={kind} variant={scene.index || 0} />

      {/* লেখার জন্য হালকা স্ক্রিম (পাঠযোগ্যতার জন্য) */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 58% 42% at 50% 52%, rgba(4,5,8,0.55), rgba(4,5,8,0.12) 70%, transparent 84%)',
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 220px',
        }}
      >
        <div
          style={{
            opacity,
            transform: 'translateY(' + rise + 'px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            // কাচের প্যানেল — দৃশ্য থাকবে চারপাশে, লেখা পড়া যাবে নিশ্চিত
            background: 'rgba(6,7,11,0.52)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderRadius: 28,
            padding: '54px 72px',
            border: '1px solid rgba(201,162,39,0.18)',
            boxShadow: '0 30px 90px rgba(0,0,0,0.55)',
          }}
        >
          {/* উপরের সোনালি রেখা */}
          <div
            style={{
              width: 110 * ruleW,
              height: 1,
              marginBottom: 34,
              background:
                'linear-gradient(90deg, transparent, ' + theme.colors.accent + 'AA, transparent)',
            }}
          />

          {/* কবিতার লাইন */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0 0.3em',
              maxWidth: 1400,
              lineHeight: 1.5,
              fontSize: 72,
              fontWeight: 500,
              color: theme.colors.text,
              textAlign: 'center',
              textShadow: '0 3px 30px rgba(0,0,0,0.85), 0 0 60px rgba(0,0,0,0.6)',
            }}
          >
            {words.map((w, i) => {
              const st = 3 + i * 5;
              const o = interpolate(frame, [st, st + 8], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const y = interpolate(frame, [st, st + 10], [12, 0], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const blur = interpolate(frame, [st, st + 9], [5, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <span
                  key={i}
                  style={{
                    opacity: o,
                    transform: 'translateY(' + y + 'px)',
                    filter: 'blur(' + blur + 'px)',
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>

          {/* নিচের সোনালি রেখা */}
          <div
            style={{
              width: 96 * ruleW,
              height: 2,
              marginTop: 38,
              background:
                'linear-gradient(90deg, transparent, ' + theme.colors.accent + 'AA, transparent)',
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
