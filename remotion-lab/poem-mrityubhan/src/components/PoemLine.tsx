import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {theme} from '../theme';
import {WordByWord} from './WordByWord';

type Scene = any;

const ease = (frame: number, delay = 0, dur = 20) =>
  interpolate(frame, [delay, delay + dur], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

// ============================================================
//  কবিতার লাইন — কেন্দ্র-সারিবদ্ধ, সোনালি রেখা, ধীর ফেড
// ============================================================
export const PoemLine: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const L = scene.layout;
  const text = L.title || '';

  // পুরো লাইন ধীরে ধীরে আসে, শেষে থেকে যায়
  const inO = ease(frame, 0, 18);
  const outO = interpolate(frame, [scene.durationInFrames - 16, scene.durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(inO, outO);

  const rise = interpolate(frame, [0, 22], [22, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // সোনালি রেখা — বাঁ থেকে ধীরে বেরোয়
  const ruleW = ease(frame, 6, 24);

  // শব্দগুলো ধীরে ধীরে, প্রতিটির জন্য আলাদা ব্লার থেকে পরিষ্কার
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 220px',
      }}
    >
      {/* টেক্সটের পিছনে নরম আভা */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,162,39,0.075), transparent 70%)',
        }}
      />

      <div
        style={{
          opacity,
          transform: 'translateY(' + rise + 'px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* উপরের সোনালি রেখা */}
        <div
          style={{
            width: 110 * ruleW,
            height: 1,
            marginBottom: 40,
            background:
              'linear-gradient(90deg, transparent, ' + theme.colors.accent + 'AA, transparent)',
          }}
        />

        {/* কবিতার লাইন — শব্দে শব্দে, ব্লার থেকে পরিষ্কার */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0 0.3em',
            maxWidth: 1420,
            lineHeight: 1.5,
            fontSize: 76,
            fontWeight: 500,
            color: theme.colors.text,
            textAlign: 'center',
          }}
        >
          {words.map((w, i) => {
            const st = 4 + i * 5;
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
                  textShadow: '0 2px 26px rgba(0,0,0,0.55)',
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
            marginTop: 42,
            background:
              'linear-gradient(90deg, transparent, ' + theme.colors.accent + 'AA, transparent)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
