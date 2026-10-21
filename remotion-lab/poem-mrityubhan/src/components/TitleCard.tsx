import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {theme} from '../theme';

// কবিতার শুরুর টাইটেল কার্ড
export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [42, 59], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const rise = interpolate(frame, [0, 28], [28, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = interpolate(frame, [0, 60], [0, -20], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ruleW = interpolate(frame, [10, 40], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      {/* উষ্ণ আভা */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 46%, rgba(201,162,39,0.13), transparent 70%)',
          transform: 'translateY(' + drift + 'px)',
        }}
      />
      {/* ধূসর আঁশ */}
      <AbsoluteFill
        style={{
          opacity: 0.55,
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.035) 0, transparent 45%),' +
            'radial-gradient(circle at 78% 66%, rgba(255,255,255,0.028) 0, transparent 42%)',
        }}
      />

      <div
        style={{
          transform: 'translateY(' + rise + 'px)',
          textAlign: 'center',
          padding: '0 120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 104,
            fontWeight: 600,
            letterSpacing: 2,
            color: theme.colors.text,
            lineHeight: 1.25,
            textShadow: '0 0 70px rgba(201,162,39,0.28)',
          }}
        >
          মৃত্যুভাণ
        </div>

        <div
          style={{
            width: 150 * ruleW,
            height: 1,
            margin: '36px 0 0',
            background:
              'linear-gradient(90deg, transparent, ' + theme.colors.accent + ', transparent)',
          }}
        />

        <div
          style={{
            marginTop: 32,
            fontSize: 34,
            fontWeight: 400,
            letterSpacing: 8,
            color: theme.colors.muted,
          }}
        >
          রবীন্দ্রনাথ ঠাকুর
        </div>
      </div>
    </AbsoluteFill>
  );
};
