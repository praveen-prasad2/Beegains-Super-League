import { META } from '@/lib/config';

const SKIN = '#C68B59';

function Ball({ x, y, r }: { x: number; y: number; r: number }) {
  const pts = `${x},${y - 8} ${x + 7.6},${y - 2.5} ${x + 4.7},${y + 6.5} ${x - 4.7},${y + 6.5} ${x - 7.6},${y - 2.5}`;
  return (
    <>
      <circle cx={x} cy={y} r={r} fill="#F2F5F3" stroke="#0A110E" strokeWidth={2} />
      <polygon points={pts} fill="#0A110E" />
    </>
  );
}

function Head({ cx }: { cx: number }) {
  return (
    <>
      <circle cx={cx} cy={112} r={28} fill={SKIN} />
      <path d={`M${cx - 28} 108a28 28 0 0 1 56 0q-28 -14 -56 0z`} fill="#2A211C" />
    </>
  );
}

function Mark({ t, size }: { t: string; size: number }) {
  return (
    <text
      x={270}
      y={320}
      textAnchor="middle"
      style={{ fontFamily: 'var(--font-cond), sans-serif' }}
      fontWeight={800}
      fontSize={size}
      fill="#1C2B23"
    >
      {t}
    </text>
  );
}

const Shorts = () => <rect x={226} y={232} width={88} height={44} rx={12} fill="#F2F5F3" />;

const limb = (d: string, color: string, w = 22) => (
  <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" />
);

export default function PlayerArt({ pos, color: c }: { pos: string; color: string }) {
  const label = META[pos] ? META[pos].label : 'Player';
  const svg = (children: React.ReactNode) => (
    <svg viewBox="0 0 540 420" role="img" aria-label={`${label} illustration`}>
      {children}
    </svg>
  );

  if (pos === 'GK')
    return svg(
      <>
        <Mark t="GK" size={280} />
        <path
          d="M110 120V385M160 120V385M210 120V385M330 120V385M380 120V385M430 120V385M60 170H480M60 220H480M60 270H480M60 320H480"
          stroke="#22332A"
          strokeWidth={2}
        />
        <path d="M60 385V120H480V385" fill="none" stroke="#3A4D43" strokeWidth={8} strokeLinejoin="round" />
        <ellipse cx={270} cy={386} rx={110} ry={10} fill="#0F1813" />
        {limb('M250 272L220 330M290 272L320 330', SKIN)}
        {limb('M220 330L205 370M320 330L335 370', c)}
        <ellipse cx={200} cy={378} rx={20} ry={9} fill="#0A110E" />
        <ellipse cx={340} cy={378} rx={20} ry={9} fill="#0A110E" />
        <Shorts />
        {limb('M236 160L185 95M304 160L355 95', c)}
        <rect x={224} y={140} width={92} height={104} rx={30} fill={c} />
        <circle cx={180} cy={86} r={19} fill="#EEF3EF" stroke="#0A110E" strokeWidth={3} />
        <circle cx={360} cy={86} r={19} fill="#EEF3EF" stroke="#0A110E" strokeWidth={3} />
        <Head cx={270} />
        <Ball x={270} y={50} r={22} />
      </>
    );

  if (pos === 'MID')
    return svg(
      <>
        <Mark t="MID" size={230} />
        <path
          d="M404 340C462 280 472 200 432 136"
          fill="none"
          stroke={c}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray="14 12"
        />
        <polygon points="416,140 430,112 446,138" fill={c} />
        <ellipse cx={285} cy={386} rx={120} ry={10} fill="#0F1813" />
        {limb('M255 272L230 325M290 272L318 322', SKIN)}
        {limb('M230 325L205 365M318 322L332 368', c)}
        <ellipse cx={198} cy={372} rx={20} ry={9} fill="#0A110E" />
        <ellipse cx={342} cy={376} rx={20} ry={9} fill="#0A110E" />
        <Ball x={384} y={368} r={20} />
        <Shorts />
        {limb('M234 160L200 225M306 160L345 210', SKIN, 20)}
        <rect x={224} y={140} width={92} height={104} rx={30} fill={c} />
        <Head cx={272} />
      </>
    );

  if (pos === 'FWD')
    return svg(
      <>
        <Mark t="FWD" size={230} />
        <ellipse cx={260} cy={386} rx={110} ry={10} fill="#0F1813" />
        {limb('M250 272L240 330M292 268L345 300', SKIN)}
        {limb('M240 330L235 370M345 300L392 300', c)}
        <ellipse cx={232} cy={378} rx={20} ry={9} fill="#0A110E" />
        <ellipse cx={408} cy={300} rx={20} ry={10} fill="#0A110E" />
        <path d="M400 232H440M392 252H436M402 272H440" stroke={c} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        <Ball x={472} y={250} r={22} />
        <Shorts />
        {limb('M234 160L178 192M306 160L332 216', SKIN, 20)}
        <rect x={224} y={140} width={92} height={104} rx={30} fill={c} transform="rotate(-10 270 190)" />
        <Head cx={262} />
      </>
    );

  // DEF, RB, LB (RB is mirrored)
  const flip = pos === 'RB' ? 'translate(540 0) scale(-1 1)' : 'translate(0 0)';
  return svg(
    <>
      <Mark t={pos} size={220} />
      <g transform={flip}>
        <path
          d="M440 46L480 60V96C480 122 462 136 440 146C418 136 400 122 400 96V60Z"
          fill="none"
          stroke={c}
          strokeWidth={6}
          strokeLinejoin="round"
          opacity={0.7}
        />
        <ellipse cx={240} cy={386} rx={130} ry={10} fill="#0F1813" />
        {limb('M292 272L300 330M250 268L200 318', SKIN)}
        {limb('M300 330L305 370M200 318L152 350', c)}
        <ellipse cx={312} cy={378} rx={20} ry={9} fill="#0A110E" />
        <ellipse cx={140} cy={356} rx={20} ry={9} fill="#0A110E" />
        <Ball x={104} y={368} r={20} />
        <Shorts />
        {limb('M234 160L170 205M306 160L372 190', SKIN, 20)}
        <rect x={224} y={140} width={92} height={104} rx={30} fill={c} transform="rotate(-8 270 190)" />
        <Head cx={264} />
      </g>
    </>
  );
}
