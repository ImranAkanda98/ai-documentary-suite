import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';

type Props = {
  text: string;
  delay?: number;
  gap?: number;
  size?: number;
  weight?: number;
  color?: string;
  align?: 'left' | 'center';
  maxWidth?: number;
  highlight?: string[];
};

// শব্দে-শব্দে স্ট্যাগার — অক্ষরে ভাঙে না (বাংলা যুক্তাক্ষর নিরাপদ)
export const WordByWord: React.FC<Props> = ({
  text,
  delay = 0,
  gap = 4,
  size = 64,
  weight = 700,
  color,
  align = 'left',
  maxWidth = 1400,
  highlight = [],
}) => {
  const frame = useCurrentFrame();
  const words = String(text).split(/\s+/).filter(Boolean);
  const hi = highlight.map((h) => h.toLowerCase().replace(/[^ঀ-৿a-z0-9]/g, ''));

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 0.28em',
        maxWidth,
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        lineHeight: 1.35,
        fontSize: size,
        fontWeight: weight,
        color: color || theme.colors.text,
        letterSpacing: 0,
      }}
    >
      {words.map((w, i) => {
        const start = delay + i * gap;
        const op = interpolate(frame, [start, start + 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const y = interpolate(frame, [start, start + 8], [16, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const clean = w.toLowerCase().replace(/[^ঀ-৿a-z0-9]/g, '');
        const isHi = hi.some((h) => h && clean.includes(h));
        return (
          <span
            key={i}
            style={{
              opacity: op,
              transform: 'translateY(' + y + 'px)',
              color: isHi ? theme.colors.accent : undefined,
              display: 'inline-block',
              whiteSpace: 'nowrap',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
