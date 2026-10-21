import React, {useEffect, useState} from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {theme} from '../theme';
import {WordByWord} from './WordByWord';

type Scene = any;

const enter = (frame: number, delay = 0) =>
  interpolate(frame, [delay, delay + 14], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

const rise = (frame: number, delay = 0, d = 36) =>
  interpolate(frame, [delay, delay + 16], [d, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

const slideX = (frame: number, delay = 0, d = -40) =>
  interpolate(frame, [delay, delay + 16], [d, 0], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

export const SceneView: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const L = scene.layout;
  const op = enter(frame);

  const titleBlock = (size = 72) => (
    <div style={{opacity: op, transform: 'translateY(' + rise(frame, 0) + 'px)'}}>
      <WordByWord text={L.title} size={size} weight={700} align="center" maxWidth={1500} />
    </div>
  );

  const body = () => {
    switch (L.style) {
      case 'kinetic':
        return (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: 120}}>
            {titleBlock(96)}
            {L.subtitle ? (
              <div style={{marginTop: 36, opacity: enter(frame, 10)}}>
                <WordByWord
                  text={L.subtitle}
                  size={40}
                  weight={500}
                  color={theme.colors.muted}
                  align="center"
                  maxWidth={1300}
                />
              </div>
            ) : null}
          </AbsoluteFill>
        );

      case 'statement':
        return (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: 140}}>
            <div
              style={{
                opacity: op,
                transform: 'translateY(' + rise(frame) + 'px)',
                background: theme.colors.surface,
                border: '1px solid ' + theme.colors.hero + '44',
                borderRadius: theme.radius,
                padding: '56px 72px',
                maxWidth: 1500,
              }}
            >
              <WordByWord text={L.title} size={68} weight={700} align="center" maxWidth={1350} />
            </div>
          </AbsoluteFill>
        );

      case 'bento':
        return (
          <AbsoluteFill style={{padding: 110, display: 'flex', flexDirection: 'column', gap: 48}}>
            {titleBlock(60)}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, flex: 1}}>
              {(L.items || []).map((it: string, i: number) => (
                <div
                  key={i}
                  style={{
                    opacity: enter(frame, 8 + i * 5),
                    transform: 'translateY(' + rise(frame, 8 + i * 5) + 'px)',
                    background: theme.colors.surface,
                    borderRadius: theme.radius,
                    padding: 40,
                    border: '1px solid #ffffff14',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <WordByWord text={it} size={34} weight={600} maxWidth={420} />
                </div>
              ))}
            </div>
          </AbsoluteFill>
        );

      case 'timeline':
        return (
          <AbsoluteFill style={{padding: 110, display: 'flex', flexDirection: 'column', gap: 44}}>
            {titleBlock(60)}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                flex: 1,
                justifyContent: 'center',
              }}
            >
              {(L.items || []).map((it: string, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 28,
                    opacity: enter(frame, 8 + i * 6),
                    transform: 'translateX(' + slideX(frame, 8 + i * 6) + 'px)',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      flexShrink: 0,
                      background: theme.colors.hero,
                      color: theme.colors.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 30,
                      fontWeight: 800,
                    }}
                  >
                    {i + 1}
                  </div>
                  <WordByWord text={it} size={38} weight={600} maxWidth={1300} />
                </div>
              ))}
            </div>
          </AbsoluteFill>
        );

      case 'split':
        return (
          <AbsoluteFill style={{padding: 110, display: 'flex', flexDirection: 'column', gap: 50}}>
            {titleBlock(60)}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, flex: 1}}>
              {[L.left, L.right].map((txt: string, i: number) => (
                <div
                  key={i}
                  style={{
                    opacity: enter(frame, 8 + i * 8),
                    transform: 'translateY(' + rise(frame, 8 + i * 8) + 'px)',
                    background: theme.colors.surface,
                    borderRadius: theme.radius,
                    padding: 48,
                    border:
                      '1px solid ' +
                      (i === 0 ? theme.colors.hero + '55' : theme.colors.accent + '55'),
                  }}
                >
                  <WordByWord text={txt || '—'} size={42} weight={600} maxWidth={700} />
                </div>
              ))}
            </div>
          </AbsoluteFill>
        );

      case 'dashboard':
        return (
          <AbsoluteFill style={{padding: 110, display: 'flex', flexDirection: 'column', gap: 48}}>
            {titleBlock(60)}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 30, flex: 1}}>
              {(L.stats || []).map((s: any, i: number) => (
                <div
                  key={i}
                  style={{
                    opacity: enter(frame, 8 + i * 5),
                    transform: 'translateY(' + rise(frame, 8 + i * 5) + 'px)',
                    background: theme.colors.surface,
                    borderRadius: theme.radius,
                    padding: 48,
                    border: '1px solid #ffffff14',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 84,
                      fontWeight: 800,
                      color: i % 2 ? theme.colors.accent : theme.colors.hero,
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{fontSize: 28, color: theme.colors.muted, fontWeight: 600}}>
                    {s.unit}
                  </div>
                </div>
              ))}
            </div>
          </AbsoluteFill>
        );

      case 'glass':
      default:
        return (
          <AbsoluteFill style={{padding: 110, display: 'flex', flexDirection: 'column', gap: 48}}>
            {titleBlock(60)}
            <div style={{display: 'flex', gap: 32, flex: 1}}>
              {(L.items || []).map((it: string, i: number) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    opacity: enter(frame, 8 + i * 6),
                    transform: 'translateY(' + rise(frame, 8 + i * 6) + 'px)',
                    background: 'linear-gradient(160deg, #ffffff14, #ffffff05)',
                    backdropFilter: 'blur(18px)',
                    borderRadius: theme.radius,
                    padding: 44,
                    border: '1px solid #ffffff1f',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <WordByWord text={it} size={36} weight={600} maxWidth={460} />
                </div>
              ))}
            </div>
          </AbsoluteFill>
        );
    }
  };

  return <AbsoluteFill>{body()}</AbsoluteFill>;
};
