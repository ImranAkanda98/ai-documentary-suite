import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {theme} from '../theme';

// ============================================================
//  কবিতার দৃশ্য-লাইব্রেরি — প্রতিটি লাইনে আলাদা চিত্রকল্প
//  জসীমউদ্দীনের "কবর" — পল্লীজীবনের শোক ও স্মৃতি
// ============================================================

export type SceneKind =
  | 'grave'      // কবর, মাটি, কাফন
  | 'jasmine'    // ডালিম-গাছ, বাগান
  | 'night'      // রাত, জোনকি, ঝিঁঝি
  | 'mosque'     // মজিদ, আযান, চাঁদ
  | 'child'      // ছোট ফুপু, সোনার প্রতিমা, স্মৃতি
  | 'village'    // হাট, লাঙল, গ্রামীণ জীবন
  | 'river'      // সমুর, নৌকা, জল
  | 'forest'     // বন, সন্ধ্যা, পাখি
  | 'tears'      // কান্না, অশ্রু, বৃষ্টি
  | 'hands'      // হাত, আলিঙ্গন
  | 'time'       // জীবন, সময়, দিনরাত
  | 'dawn';      // আশা, ভবিষ্যৎ, উদয়

const S: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>{children}</AbsoluteFill>
);

const grad = (id: string, a: string, b: string) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={a} />
      <stop offset="100%" stopColor={b} />
    </linearGradient>
  </defs>
);

// ---------------- ১. কবর / মাটি ----------------
const Grave: React.FC<{f: number}> = ({f}) => {
  const rise = interpolate(f, [0, 40], [30, 0], {extrapolateRight: 'clamp'});
  const glow = 0.25 + 0.1 * Math.sin(f / 22);
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gg', '#241E14', '#0E0F14')}
        <rect width="1920" height="1080" fill="url(#gg)" />
        {/* মাটি */}
        <path d="M0,760 Q480,690 960,745 T1920,720 L1920,1080 L0,1080 Z" fill="#1C1813" />
        <path d="M0,790 Q480,720 960,775 T1920,750" stroke="#2A2419" strokeWidth="2" fill="none" opacity="0.6" />
        {/* কবরের পাহাড় */}
        <g transform={`translate(0,${rise})`}>
          <path d="M760,745 Q960,600 1160,745 Z" fill="#2E2820" />
          <path d="M760,745 Q960,600 1160,745 Z" fill="none" stroke="#5A4C33" strokeWidth="2" />
          <ellipse cx="960" cy="745" rx="200" ry="18" fill="#15120E" />
          {/* সোনালি ফলক */}
          <rect x="930" y="672" width="60" height="74" rx="6" fill="#C9A227" opacity={glow} />
          <rect x="930" y="672" width="60" height="74" rx="6" fill="none" stroke="#E8CE73" strokeWidth="1.5" />
          <line x1="960" y1="690" x2="960" y2="730" stroke="#0B0A09" strokeWidth="4" />
          <line x1="944" y1="702" x2="976" y2="702" stroke="#0B0A09" strokeWidth="4" />
        </g>
        {/* কোদাল */}
        <g transform="translate(1410,470) rotate(18)" opacity="0.5">
          <rect x="0" y="0" width="11" height="300" rx="5" fill="#9A825A" />
          <path d="M-34,0 L34,0 L30,-18 L-30,-18 Z" fill="#B0955F" />
        </g>
      </svg>
    </S>
  );
};

// ---------------- ২. ডালিম গাছ ----------------
const Jasmine: React.FC<{f: number}> = ({f}) => {
  const sway = Math.sin(f / 26) * 7;
  const drop = (f % 120) / 120;
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gj', '#18261C', '#0C100E')}
        <rect width="1920" height="1080" fill="url(#gj)" />
        <g transform={`translate(0,${sway})`}>
          <rect x="930" y="470" width="30" height="360" rx="8" fill="#4A3D28" />
          <path d="M945,540 Q830,470 720,500" stroke="#2C2419" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M945,520 Q1060,450 1180,490" stroke="#2C2419" strokeWidth="14" fill="none" strokeLinecap="round" />
          {[[720,500],[820,455],[1060,455],[1180,490],[880,420],[1020,415]].map(([cx, cy], i) => (
            <g key={i} opacity="0.95">
              <ellipse cx={cx} cy={cy} rx="86" ry="58" fill="#2E452E" />
              <ellipse cx={cx} cy={cy} rx="86" ry="58" fill="none" stroke="#4A7048" strokeWidth="1.5" />
              {[[-30,-12],[10,-24],[42,0],[-6,16],[26,22]].map(([ox, oy], j) => (
                <circle key={j} cx={cx + ox} cy={cy + oy} r="7" fill="#F2EDE3" opacity="0.9" />
              ))}
            </g>
          ))}
        </g>
        {/* পাতা পড়ছে */}
        {[0, 1, 2, 3].map((i) => {
          const t = ((f / 90) + i * 0.27) % 1;
          return (
            <ellipse key={i} cx={560 + i * 240} cy={420 + t * 520} rx="9" ry="4.5"
              fill="#F2EDE3" opacity={0.5 * (1 - t)} transform={`rotate(${t * 220} ${560 + i * 240} ${420 + t * 520})`} />
          );
        })}
      </svg>
    </S>
  );
};

// ---------------- ৩. রাত / জোনকি ----------------
const Night: React.FC<{f: number}> = ({f}) => {
  const stars = Array.from({length: 46}, (_, i) => ({
    x: (i * 197) % 1900 + 10, y: (i * 83) % 520 + 20,
    r: 0.8 + ((i * 37) % 10) / 7, ph: (i * 13) % 100,
  }));
  const flies = Array.from({length: 16}, (_, i) => ({
    x: 300 + ((i * 317) % 1320) + Math.sin(f / 24 + i) * 46,
    y: 380 + ((i * 149) % 380) + Math.cos(f / 19 + i * 1.7) * 34,
  }));
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gn', '#141C33', '#090B14')}
        <rect width="1920" height="1080" fill="url(#gn)" />
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r}
            fill="#F2EDE3" opacity={0.25 + 0.55 * Math.abs(Math.sin(f / 30 + s.ph))} />
        ))}
        {/* চাঁদ */}
        <circle cx="1480" cy="190" r="66" fill="#E8E2D2" opacity="0.9" />
        <circle cx="1512" cy="172" r="58" fill="#0A0D1A" />
        {/* জোনকি */}
        {flies.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="16" fill="#C9A227" opacity="0.14" />
            <circle cx={p.x} cy={p.y} r="3.4" fill="#F5E9A8" opacity={0.55 + 0.45 * Math.abs(Math.sin(f / 12 + i))} />
          </g>
        ))}
        {/* মাটির রেখা */}
        <path d="M0,880 Q600,845 1920,872 L1920,1080 L0,1080 Z" fill="#070810" />
      </svg>
    </S>
  );
};

// ---------------- ৪. মজিদ / আযান ----------------
const Mosque: React.FC<{f: number}> = ({f}) => {
  const pulse = 0.5 + 0.5 * Math.sin(f / 40);
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gm', '#15242C', '#0A0F12')}
        <rect width="1920" height="1080" fill="url(#gm)" />
        {/* মসজিদ */}
        <g>
          <rect x="700" y="620" width="520" height="230" fill="#1E323B" />
          <path d="M960,410 Q1080,470 1080,620 L840,620 Q840,470 960,410 Z" fill="#26404D" />
          <path d="M960,410 Q1080,470 1080,620 L840,620 Q840,470 960,410 Z" fill="none" stroke="#4A6B7A" strokeWidth="2" />
          <path d="M960,410 L960,360" stroke="#C9A227" strokeWidth="3" />
          <circle cx="960" cy="352" r="8" fill="#C9A227" />
          {/* মিনারেট */}
          <rect x="470" y="480" width="56" height="370" fill="#1E323B" />
          <path d="M498,480 L498,400" stroke="#4A6B7A" strokeWidth="3" />
          <circle cx="498" cy="392" r="7" fill="#C9A227" />
          <rect x="1394" y="480" width="56" height="370" fill="#1E323B" />
          <path d="M1422,480 L1422,400" stroke="#4A6B7A" strokeWidth="3" />
          <circle cx="1422" cy="392" r="7" fill="#C9A227" />
          {/* দরজা */}
          <path d="M920,850 L920,700 Q960,660 1000,700 L1000,850 Z" fill="#C9A227" opacity={0.1 + 0.12 * pulse} />
        </g>
        <rect x="0" y="845" width="1920" height="240" fill="#0D0F11" />
      </svg>
    </S>
  );
};

// ---------------- ৫. ছোট ফুপু / সোনার প্রতিমা ----------------
const Child: React.FC<{f: number}> = ({f}) => {
  const glow = 0.3 + 0.12 * Math.sin(f / 28);
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gc', '#2A2010', '#0F0E13')}
        <rect width="1920" height="1080" fill="url(#gc)" />
        <g>
          {/* সোনার প্রতিমা */}
          <circle cx="960" cy="480" r="150" fill="#C9A227" opacity={glow * 0.35} />
          <circle cx="960" cy="480" r="100" fill="#C9A227" opacity={glow * 0.5} />
          <path d="M960,330 Q1030,400 1010,490 Q995,560 960,600 Q925,560 910,490 Q890,400 960,330 Z" fill="#D9B443" />
          <path d="M960,330 Q1030,400 1010,490 Q995,560 960,600 Q925,560 910,490 Q890,400 960,330 Z" fill="none" stroke="#F0DA92" strokeWidth="2" />
          <rect x="930" y="596" width="60" height="24" rx="4" fill="#C9A227" />
        </g>
        {/* ছোট্ট হাত (ফুপুর) */}
        <path d="M760,830 Q720,740 760,700" stroke="#C9A227" strokeWidth="3" fill="none" opacity="0.35" strokeLinecap="round" />
        <circle cx="760" cy="694" r="9" fill="#C9A227" opacity="0.5" />
        <rect x="0" y="850" width="1920" height="230" fill="#070709" />
      </svg>
    </S>
  );
};

// ---------------- ৬. গ্রামীণ জীবন ----------------
const Village: React.FC<{f: number}> = ({f}) => {
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gv', '#262014', '#0D0E0C')}
        <rect width="1920" height="1080" fill="url(#gv)" />
        {/* ঘর */}
        <g>
          <rect x="620" y="580" width="300" height="270" fill="#33291A" />
          <path d="M600,580 L770,430 L940,580 Z" fill="#463420" />
          <path d="M600,580 L770,430 L940,580" stroke="#63502F" strokeWidth="2" fill="none" />
          <rect x="720" y="700" width="70" height="150" fill="#17130D" />
          <rect x="820" y="640" width="60" height="60" fill="#C9A227" opacity="0.32" />
        </g>
        {/* লাঙল */}
        <g transform="translate(1250,790)">
          <path d="M0,0 Q110,-58 220,0" stroke="#A68A56" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M0,0 L-40,70" stroke="#A68A56" strokeWidth="8" strokeLinecap="round" />
        </g>
        {/* হাটের ছাতা */}
        {[1180, 1290, 1400].map((x, i) => (
          <path key={i} d={`M${x - 46},760 L${x},712 L${x + 46},760 Z`} fill={i % 2 ? '#2A2013' : '#33270F'} />
        ))}
        <rect x="0" y="758" width="1920" height="330" fill="#090A08" />
      </svg>
    </S>
  );
};

// ---------------- ৭. সমুর / নৌকা ----------------
const River: React.FC<{f: number}> = ({f}) => {
  const waves = Array.from({length: 9}, (_, i) => {
    const y = 700 + i * 34;
    const o = 0.1 + (i % 3) * 0.07;
    return (
      <path key={i}
        d={`M0,${y} Q320,${y - 12 + Math.sin(f / 30 + i) * 7} 640,${y} T1280,${y} T1920,${y}`}
        stroke="#6E9AB4" strokeWidth="2" fill="none" opacity={o} />
    );
  });
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gr', '#162836', '#0B1119')}
        <rect width="1920" height="1080" fill="url(#gr)" />
        {waves}
        {/* নৌকা */}
        <g transform="translate(1150,640)">
          <path d="M-180,30 Q0,96 180,30 L140,66 Q0,112 -140,66 Z" fill="#332C1D" />
          <path d="M-180,30 Q0,96 180,30" stroke="#8A7550" strokeWidth="2.5" fill="none" />
          <line x1="20" y1="20" x2="20" y2="-190" stroke="#8A7550" strokeWidth="5" />
          <path d="M20,-190 Q96,-100 20,-16 Z" fill="#C9A227" opacity="0.3" />
        </g>
        <rect x="0" y="690" width="1920" height="60" fill="#15212C" opacity="0.6" />
      </svg>
    </S>
  );
};

// ---------------- ৮. বন / সন্ধ্যা ----------------
const Forest: React.FC<{f: number}> = ({f}) => {
  const birds = Array.from({length: 5}, (_, i) => ({
    x: 1250 + i * 110 + Math.sin(f / 30 + i) * 30,
    y: 250 + i * 34 + Math.cos(f / 24 + i) * 12,
  }));
  const trees = [140, 330, 520, 700, 1420, 1620, 1810];
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gf', '#33260E', '#0C0D10')}
        <rect width="1920" height="1080" fill="url(#gf)" />
        {/* সন্ধ্যার আভা */}
        <circle cx="960" cy="700" r="420" fill="#C9A227" opacity="0.10" />
        {/* গাছ */}
        {trees.map((x, i) => (
          <g key={i} opacity="0.9">
            <rect x={x} y="620" width="22" height="290" fill="#151815" />
            <path d={`M${x + 11},620 Q${x - 90},480 ${x + 11},360 Q${x + 112},480 ${x + 11},620 Z`} fill="#151815" />
          </g>
        ))}
        <rect x="0" y="900" width="1920" height="190" fill="#0C0E0C" />
        {/* পাখি */}
        {birds.map((b, i) => (
          <path key={i}
            d={`M${b.x - 18},${b.y} Q${b.x - 9},${b.y - 9} ${b.x},${b.y} Q${b.x + 9},${b.y - 9} ${b.x + 18},${b.y}`}
            stroke="#F2EDE3" strokeWidth="2.2" fill="none" opacity="0.55" strokeLinecap="round" />
        ))}
      </svg>
    </S>
  );
};

// ---------------- ৯. কান্না / অশ্রু ----------------
const Tears: React.FC<{f: number}> = ({f}) => {
  const drops = Array.from({length: 34}, (_, i) => {
    const t = ((f / 70) + i * 0.137) % 1;
    return (
      <line key={i} x1={100 + ((i * 173) % 1720)} y1={t * 1080}
        x2={100 + ((i * 173) % 1720)} y2={t * 1080 + 26}
        stroke="#9FB6C4" strokeWidth="1.6" opacity={0.42 * (1 - t)} strokeLinecap="round" />
    );
  });
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gt', '#161D28', '#0B0E14')}
        <rect width="1920" height="1080" fill="url(#gt)" />
        {drops}
        {/* ঝুঁকে থাকা সিলুট */}
        <g opacity="0.5" transform="translate(960,760)">
          <path d="M0,0 Q-70,-120 -30,-210 Q0,-240 30,-210 Q70,-120 0,0 Z" fill="#1A2028" />
          <circle cx="0" cy="-262" r="46" fill="#1A2028" />
        </g>
        <ellipse cx="960" cy="880" rx="260" ry="34" fill="#0B0E12" opacity="0.8" />
      </svg>
    </S>
  );
};

// ---------------- ১০. হাত / আলিঙ্গন ----------------
const Hands: React.FC<{f: number}> = ({f}) => {
  const reach = interpolate(f, [0, 50], [60, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gh', '#211A2C', '#0C0C12')}
        <rect width="1920" height="1080" fill="url(#gh)" />
        <g transform={`translate(${reach},0)`} opacity="0.92">
          <path d="M120,760 Q330,700 700,600 L740,640 Q420,760 210,800 Z" fill="#322C3E" />
          <path d="M1800,760 Q1590,700 1220,600 L1180,640 Q1500,760 1710,800 Z" fill="#322C3E" />
        </g>
        <circle cx="960" cy="620" r="120" fill="#C9A227" opacity="0.07" />
        <circle cx="960" cy="620" r="62" fill="#C9A227" opacity="0.12" />
      </svg>
    </S>
  );
};

// ---------------- ১১. সময় / জীবন ----------------
const Time: React.FC<{f: number}> = ({f}) => {
  const rot = (f / 12) % 360;
  const sand = interpolate(f % 180, [0, 180], [0, 1]);
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gti', '#231E16', '#0C0D11')}
        <rect width="1920" height="1080" fill="url(#gti)" />
        <g transform="translate(960,520)">
          <path d="M-130,-190 L130,-190 L92,190 L-92,190 Z" fill="#282218" stroke="#5A4C33" strokeWidth="2.5" />
          <path d="M-92,40 L92,40 L92,190 L-92,190 Z" fill="#C9A227" opacity={0.18 + 0.12 * sand} />
          <rect x="-140" y="-204" width="280" height="20" rx="8" fill="#4A3F2C" />
          <rect x="-140" y="184" width="280" height="20" rx="8" fill="#4A3F2C" />
          <g transform={`rotate(${rot})`}>
            <rect x="-2" y="-176" width="4" height="176" fill="#C9A227" opacity="0.8" />
          </g>
        </g>
      </svg>
    </S>
  );
};

// ---------------- ১২. উদয় / আশা ----------------
const Dawn: React.FC<{f: number}> = ({f}) => {
  const t = (f % 200) / 200;
  const rise = interpolate(t, [0, 1], [90, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <S>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        {grad('gd', '#2E2416', '#101018')}
        <rect width="1920" height="1080" fill="url(#gd)" />
        <circle cx="960" cy={720 + rise} r="300" fill="#C9A227" opacity={0.16 + 0.1 * t} />
        <circle cx="960" cy={720 + rise} r="170" fill="#E8CE73" opacity={0.22 + 0.12 * t} />
        {/* দূরের পথ */}
        <path d="M760,1080 L930,760 L990,760 L1180,1080 Z" fill="#0C0B10" opacity="0.85" />
        <rect x="0" y="820" width="1920" height="270" fill="#08090C" />
      </svg>
    </S>
  );
};

// প্রতিটি লাইনে একই মোটিফ হলেও দৃশ্য আলাদা দেখাবে —
// ভিন্ন framing (স্থানান্তর/ঘোরানো/স্কেল) + ভিন্ন রঙ-তাপমাত্রা
export const SceneVisual: React.FC<{kind: SceneKind; variant?: number}> = ({kind, variant = 0}) => {
  const f = useCurrentFrame();
  const v = variant % 12;

  // ধীরে ভাসমান framing — প্রতিটি লাইনে অল্প আলাদা
  const driftX = Math.sin(f / (55 + v * 3) + v) * (10 + v * 2.5);
  const driftY = Math.cos(f / (71 + v * 4) + v * 1.7) * (7 + v * 1.6);
  const zoom = 1 + v * 0.008 + Math.sin(f / 90 + v) * 0.006;
  const rot = v * 0.22 + Math.sin(f / 120 + v) * 0.18;
  const hue = (v - 6) * 2.4;
  const sat = 1 + (v % 3) * 0.06;

  const inner = (() => {
    switch (kind) {
      case 'grave':   return <Grave f={f} />;
      case 'jasmine': return <Jasmine f={f} />;
      case 'night':   return <Night f={f} />;
      case 'mosque':  return <Mosque f={f} />;
      case 'child':   return <Child f={f} />;
      case 'village': return <Village f={f} />;
      case 'river':   return <River f={f} />;
      case 'forest':  return <Forest f={f} />;
      case 'tears':   return <Tears f={f} />;
      case 'hands':   return <Hands f={f} />;
      case 'time':    return <Time f={f} />;
      case 'dawn':    return <Dawn f={f} />;
    }
  })();

  return (
    <AbsoluteFill
      style={{
        transform:
          'translate(' + driftX + 'px,' + driftY + 'px) scale(' + zoom + ') rotate(' + rot + 'deg)',
        filter:
          'brightness(' + (1.42 + (v % 4) * 0.06).toFixed(2) +
          ') contrast(1.07) hue-rotate(' + hue + 'deg) saturate(' + sat + ')',
        transformOrigin: '50% 50%',
      }}
    >
      {inner}
    </AbsoluteFill>
  );
};
