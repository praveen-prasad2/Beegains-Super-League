'use client';

import { useEffect, useId, useState } from 'react';
import { META } from '@/lib/config';

/* ============================================================
   Animated footballer illustrations, one pose per position.
   The figure is a small rig (hips → torso → arms, hips → legs)
   whose joints are rotated with SVG <animateTransform>.
   Angles: 0 = limb hanging straight down; negative = swing
   forward (towards +x, the way the player faces).
   ============================================================ */

type V = number | number[];

type Pose = {
  dur: number; // seconds per loop
  kt?: number[]; // key times (0..1), defaults to evenly spaced
  x: number; // hip position on the canvas
  y: number;
  scale?: number;
  shiftX?: number[]; // whole-body travel
  bobY?: number[]; // whole-body bounce
  fade?: number[]; // whole-body opacity
  lean: V;
  head: V;
  backHip: V;
  backKnee: V;
  frontHip: V;
  frontKnee: V;
  backShoulder: V;
  backElbow: V;
  frontShoulder: V;
  frontElbow: V;
  gloves?: boolean;
  shadowRx?: number[];
};

type Timing = {
  dur: string;
  repeatCount: 'indefinite';
  keyTimes: string;
  calcMode: 'spline';
  keySplines: string;
};

const SKIN = '#C68B59';
const SKIN_BACK = '#A5713F';
const HAIR = '#2A211C';
const SHORTS = '#F2F5F3';
const BOOT = '#111814';
const GROUND = 374;
const NUMBERS: Record<string, string> = { GK: '1', CB: '4', MID: '8', ST: '9', RB: '2', LB: '3' };
/** Which animated pose each position uses. */
const POSE_FOR: Record<string, string> = { GK: 'GK', CB: 'DEF', MID: 'MID', ST: 'FWD', RB: 'WB', LB: 'WB' };

// Limb lengths
const TH = 62; // thigh
const SH = 58; // shin
const UA = 48; // upper arm
const FA = 44; // forearm

/* ---------- colour helpers ---------- */
function mix(hex: string, target: number, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  return (
    '#' +
    [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map((v) => Math.round(v + (target - v) * amt).toString(16).padStart(2, '0'))
      .join('')
  );
}
const darken = (h: string, a: number) => mix(h, 0, a);
const lighten = (h: string, a: number) => mix(h, 255, a);

/* ---------- animation helpers ---------- */
const first = (v: V) => (Array.isArray(v) ? v[0] : v);
const easeSplines = (n: number) => Array.from({ length: n - 1 }, () => '0.42 0 0.58 1').join(';');
const evenTimes = (n: number) => Array.from({ length: n }, (_, i) => +(i / (n - 1)).toFixed(4)).join(';');

function timingFor(p: Pose): Timing {
  const n = p.kt?.length ?? countKeys(p);
  return {
    dur: `${p.dur}s`,
    repeatCount: 'indefinite',
    keyTimes: p.kt ? p.kt.join(';') : evenTimes(n),
    calcMode: 'spline',
    keySplines: easeSplines(n),
  };
}
function countKeys(p: Pose) {
  for (const v of Object.values(p)) if (Array.isArray(v)) return v.length;
  return 2;
}

/** A group rotated about its local origin, optionally animated through keyframes. */
function Rot({ v, t, on, children }: { v: V; t: Timing; on: boolean; children?: React.ReactNode }) {
  return (
    <g transform={`rotate(${first(v)})`}>
      {on && Array.isArray(v) && (
        <animateTransform attributeName="transform" type="rotate" values={v.join(';')} {...t} />
      )}
      {children}
    </g>
  );
}

/* ---------- body parts (drawn facing right, joint at 0,0) ---------- */
function Leg(props: { x: number; y: number; hip: V; knee: V; sock: string; skin: string; t: Timing; on: boolean }) {
  const { x, y, hip, knee, sock, skin, t, on } = props;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Rot v={hip} t={t} on={on}>
        <line x1={0} y1={0} x2={0} y2={TH} stroke={skin} strokeWidth={24} strokeLinecap="round" />
        <line x1={0} y1={-4} x2={0} y2={28} stroke={SHORTS} strokeWidth={33} strokeLinecap="round" />
        <g transform={`translate(0 ${TH})`}>
          <Rot v={knee} t={t} on={on}>
            <line x1={0} y1={0} x2={0} y2={SH} stroke={skin} strokeWidth={20} strokeLinecap="round" />
            <line x1={0} y1={24} x2={0} y2={SH - 4} stroke={sock} strokeWidth={21} strokeLinecap="round" />
            <line x1={-10} y1={30} x2={10} y2={30} stroke={lighten(sock, 0.45)} strokeWidth={3} />
            <path
              d={`M-12 ${SH - 9} L6 ${SH - 9} Q22 ${SH - 7} 25 ${SH + 3} L25 ${SH + 9} L-12 ${SH + 9} Z`}
              fill={BOOT}
            />
            <path d={`M-6 ${SH + 9} h28`} stroke="#3A4D43" strokeWidth={3} strokeLinecap="round" />
          </Rot>
        </g>
      </Rot>
    </g>
  );
}

function Arm(props: {
  x: number; y: number; sh: V; el: V; sleeve: string; skin: string; gloves?: boolean; t: Timing; on: boolean;
}) {
  const { x, y, sh, el, sleeve, skin, gloves, t, on } = props;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Rot v={sh} t={t} on={on}>
        <line x1={0} y1={0} x2={0} y2={UA} stroke={skin} strokeWidth={17} strokeLinecap="round" />
        <line x1={0} y1={-2} x2={0} y2={22} stroke={sleeve} strokeWidth={24} strokeLinecap="round" />
        <g transform={`translate(0 ${UA})`}>
          <Rot v={el} t={t} on={on}>
            <line x1={0} y1={0} x2={0} y2={FA} stroke={skin} strokeWidth={14} strokeLinecap="round" />
            {gloves ? (
              <>
                <circle cx={0} cy={FA + 4} r={13} fill="#F2F5F3" stroke="#0A110E" strokeWidth={2} />
                <path d={`M-9 ${FA + 1} h18`} stroke="#C8F03C" strokeWidth={4} strokeLinecap="round" />
              </>
            ) : (
              <circle cx={0} cy={FA + 2} r={8.5} fill={skin} />
            )}
          </Rot>
        </g>
      </Rot>
    </g>
  );
}

function Torso({ id, c, num, flip }: { id: string; c: string; num: string; flip?: boolean }) {
  return (
    <>
      <rect x={-1} y={-122} width={14} height={18} rx={5} fill={SKIN_BACK} />
      <path
        d="M-24 6 L-31 -86 Q-31 -106 -12 -108 L16 -108 Q34 -106 33 -86 L27 6 Q2 12 -24 6 Z"
        fill={`url(#${id}-jersey)`}
      />
      <path d="M27 6 L33 -86 Q34 -100 26 -106 L22 -80 L20 6 Z" fill={darken(c, 0.18)} opacity={0.55} />
      <path d="M-6 -108 Q5 -96 16 -108" stroke={darken(c, 0.35)} strokeWidth={5} fill="none" strokeLinecap="round" />
      <text
        x={4}
        y={-44}
        textAnchor="middle"
        fontWeight={800}
        fontSize={40}
        fill={darken(c, 0.45)}
        opacity={0.55}
        transform={flip ? 'translate(8 0) scale(-1 1)' : undefined}
        style={{ fontFamily: 'var(--font-cond), sans-serif' }}
      >
        {num}
      </text>
    </>
  );
}

function Head({ v, t, on }: { v: V; t: Timing; on: boolean }) {
  return (
    <g transform="translate(6 -140)">
      <Rot v={v} t={t} on={on}>
        <circle r={26} fill={SKIN} />
        <path d="M-27 2 Q-30 -30 0 -31 Q25 -31 27 -10 Q14 -19 -2 -15 Q-10 -2 -27 2 Z" fill={HAIR} />
        <ellipse cx={-6} cy={3} rx={5} ry={6} fill={SKIN_BACK} />
        <circle cx={15} cy={-1} r={3.2} fill="#1B1410" />
        <path d="M9 -10 L21 -9" stroke={HAIR} strokeWidth={3} strokeLinecap="round" />
        <path d="M13 13 Q18 15 22 12" stroke="#7A4A2A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </Rot>
    </g>
  );
}

function Figure(props: {
  p: Pose; id: string; c: string; num: string; on: boolean; flip?: boolean;
  /** Drawn in the torso's frame, between the body and the near arm (e.g. a ball held in the hands). */
  held?: (t: Timing) => React.ReactNode;
}) {
  const { p, id, c, num, on, flip, held } = props;
  const t = timingFor(p);
  const n = countKeys(p);
  const sx = p.shiftX ?? Array(n).fill(0);
  const by = p.bobY ?? Array(n).fill(0);
  const travel = sx.map((x, i) => `${x} ${by[i] ?? 0}`);
  const backSleeve = darken(c, 0.25);

  return (
    <g>
      {/* ground shadow travels with the body but stays on the ground */}
      <g transform={`translate(${sx[0]} 0)`}>
        {on && p.shiftX && (
          <animateTransform attributeName="transform" type="translate" values={sx.map((x) => `${x} 0`).join(';')} {...t} />
        )}
        <ellipse cx={p.x + 14} cy={GROUND + 2} rx={p.shadowRx?.[0] ?? 72} ry={9} fill="#050907" opacity={0.55}>
          {on && p.shadowRx && <animate attributeName="rx" values={p.shadowRx.join(';')} {...t} />}
        </ellipse>
      </g>

      <g opacity={p.fade ? p.fade[0] : 1}>
        {on && p.fade && <animate attributeName="opacity" values={p.fade.join(';')} {...t} />}
        <g transform={`translate(${p.x} ${p.y}) scale(${p.scale ?? 1})`}>
          <g transform={`translate(${travel[0]})`}>
            {on && (p.shiftX || p.bobY) && (
              <animateTransform attributeName="transform" type="translate" values={travel.join(';')} {...t} />
            )}

            {/* far side */}
            <Rot v={p.lean} t={t} on={on}>
              <Arm x={-12} y={-96} sh={p.backShoulder} el={p.backElbow} sleeve={backSleeve} skin={SKIN_BACK} gloves={p.gloves} t={t} on={on} />
            </Rot>
            <Leg x={-8} y={4} hip={p.backHip} knee={p.backKnee} sock={darken(c, 0.25)} skin={SKIN_BACK} t={t} on={on} />

            {/* hips / shorts */}
            <path d="M-27 -10 H29 L33 18 Q2 24 -31 18 Z" fill={SHORTS} />
            <path d="M-27 -10 H29 L30 -2 H-28 Z" fill="#D9E0DC" />

            {/* near side */}
            <Leg x={10} y={4} hip={p.frontHip} knee={p.frontKnee} sock={c} skin={SKIN} t={t} on={on} />
            <Rot v={p.lean} t={t} on={on}>
              <Torso id={id} c={c} num={num} flip={flip} />
              <Head v={p.head} t={t} on={on} />
              {held?.(t)}
              <Arm x={14} y={-96} sh={p.frontShoulder} el={p.frontElbow} sleeve={c} skin={SKIN} gloves={p.gloves} t={t} on={on} />
            </Rot>
          </g>
        </g>
      </g>
    </g>
  );
}

/* ---------- props ---------- */
function pentagon(cx: number, cy: number, r: number, rot = -90) {
  return Array.from({ length: 5 }, (_, i) => {
    const a = ((rot + i * 72) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function Ball({ id, on, spin = 0.7 }: { id: string; on: boolean; spin?: number }) {
  return (
    <g>
      <circle r={17} fill={`url(#${id}-ball)`} stroke="#0A110E" strokeWidth={1.5} />
      <g clipPath={`url(#${id}-ballclip)`}>
        <g>
          {on && (
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur={`${spin}s`} repeatCount="indefinite" />
          )}
          <polygon points={pentagon(0, 0, 6.5)} fill="#1A2620" />
          {[0, 1, 2, 3, 4].map((k) => {
            const a = ((-90 + k * 72) * Math.PI) / 180;
            return <polygon key={k} points={pentagon(17 * Math.cos(a), 17 * Math.sin(a), 6.5, 90 + k * 72)} fill="#1A2620" />;
          })}
        </g>
      </g>
      <circle r={17} fill={`url(#${id}-shine)`} />
    </g>
  );
}

function Dust({ c, on }: { c: string; on: boolean }) {
  const motes = [
    [70, 330, 2.2, 5.5, 0], [140, 300, 1.6, 6.5, 1.8], [205, 345, 2.6, 5, 3.1], [330, 320, 1.8, 7, 0.9],
    [395, 350, 2.4, 6, 2.4], [455, 310, 1.6, 5.5, 4], [490, 340, 2, 6.8, 1.2], [260, 300, 1.4, 7.5, 3.6],
  ];
  return (
    <g>
      {motes.map(([x, y, r, d, b], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#EEF3EF' : c} opacity={on ? 0 : 0.25}>
          {on && (
            <>
              <animate attributeName="cy" values={`${y};${y - 120}`} dur={`${d}s`} begin={`${b}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.55;0" dur={`${d}s`} begin={`${b}s`} repeatCount="indefinite" />
            </>
          )}
        </circle>
      ))}
    </g>
  );
}

function SpeedLines({ x, y, on, c }: { x: number; y: number; on: boolean; c: string }) {
  if (!on) return null;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={x} y1={y + i * 26} x2={x + 46 - i * 6} y2={y + i * 26} stroke={i % 2 ? c : '#EEF3EF'} strokeWidth={4} strokeLinecap="round" opacity={0}>
          <animateTransform attributeName="transform" type="translate" values="30 0;-50 0" dur="0.7s" begin={`${i * 0.17}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.6;0" dur="0.7s" begin={`${i * 0.17}s`} repeatCount="indefinite" />
        </line>
      ))}
    </g>
  );
}

/* ---------- poses ---------- */
const POSES: Record<string, Pose> = {
  // Dribbling run with the ball at his feet.
  MID: {
    dur: 0.8, x: 236, y: 236, bobY: [0, -7, 0, -7, 0],
    lean: 12, head: [-4, -1, -4, -1, -4],
    frontHip: [-50, -10, 30, 0, -50], frontKnee: [30, 10, 40, 100, 30],
    backHip: [30, 0, -50, -10, 30], backKnee: [40, 100, 30, 10, 40],
    frontShoulder: [40, 10, -45, -10, 40], frontElbow: [-80, -70, -95, -70, -80],
    backShoulder: [-45, -10, 40, 10, -45], backElbow: [-95, -70, -80, -70, -95],
    shadowRx: [70, 64, 70, 64, 70],
  },
  // Wing-back sprint (RB faces right, LB is mirrored).
  WB: {
    dur: 0.62, x: 250, y: 232, bobY: [0, -9, 0, -9, 0],
    lean: 17, head: [-8, -5, -8, -5, -8],
    frontHip: [-60, -15, 35, 0, -60], frontKnee: [35, 10, 50, 115, 35],
    backHip: [35, 0, -60, -15, 35], backKnee: [50, 115, 35, 10, 50],
    frontShoulder: [55, 15, -60, -15, 55], frontElbow: [-85, -70, -100, -70, -85],
    backShoulder: [-60, -15, 55, 15, -60], backElbow: [-100, -70, -85, -70, -100],
    shadowRx: [74, 66, 74, 66, 74],
  },
  // Wind up and strike.
  FWD: {
    dur: 1.7, kt: [0, 0.35, 0.47, 0.7, 1], x: 210, y: 236,
    lean: [4, -6, 14, 10, 4], head: [-2, -8, 6, 2, -2],
    backHip: [4, 10, 2, 0, 4], backKnee: [10, 22, 8, 8, 10],
    frontHip: [6, 48, -55, -75, 6], frontKnee: [8, 100, 25, 0, 8],
    frontShoulder: [25, 70, 10, 20, 25], frontElbow: [-30, -20, -40, -30, -30],
    backShoulder: [-25, -95, -45, -30, -25], backElbow: [-20, -10, -30, -20, -20],
  },
  // Crouch, spring and catch overhead.
  GK: {
    dur: 2.2, kt: [0, 0.3, 0.5, 0.75, 1], x: 250, y: 262, scale: 0.86,
    bobY: [10, 18, -38, 0, 10],
    lean: [8, 12, -4, 4, 8], head: [-6, -8, -14, -6, -6],
    backHip: [-35, -45, -10, -25, -35], backKnee: [60, 80, 55, 40, 60],
    frontHip: [-40, -50, -65, -30, -40], frontKnee: [65, 85, 95, 45, 65],
    backShoulder: [-60, -70, -182, -150, -60], backElbow: [-35, -35, 0, -15, -35],
    frontShoulder: [-70, -80, -168, -140, -70], frontElbow: [-35, -35, 0, -15, -35],
    gloves: true, shadowRx: [72, 76, 46, 70, 72],
  },
  // Sliding tackle.
  DEF: {
    dur: 2.6, kt: [0, 0.12, 0.45, 0.85, 1], x: 150, y: 350,
    shiftX: [-150, -110, 10, 22, 22], fade: [0, 1, 1, 1, 0],
    lean: -40, head: [20, 20, 28, 24, 20],
    frontHip: [-74, -74, -88, -80, -80], frontKnee: [4, 4, 0, 4, 4],
    backHip: [-75, -75, -75, -75, -75], backKnee: [158, 158, 158, 158, 158],
    backShoulder: [60, 60, 62, 60, 60], backElbow: [0, 0, 0, 0, 0],
    frontShoulder: [-80, -80, -95, -85, -80], frontElbow: [-30, -30, -40, -30, -30],
    shadowRx: [110, 110, 110, 110, 110],
  },
};

/* ---------- scene ---------- */
function useMotion() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const set = () => setOn(!mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);
  return on;
}

export default function PlayerArt({ pos, color: c }: { pos: string; color: string }) {
  const rawId = useId();
  const id = 'pa' + rawId.replace(/[^a-zA-Z0-9]/g, '');
  const on = useMotion();
  const label = META[pos] ? META[pos].label : 'Player';
  const kind = POSE_FOR[pos] ?? 'MID';
  const pose = POSES[kind];
  const flip = pos === 'LB';
  const num = NUMBERS[pos] ?? '';
  const mark = pos.length <= 3 ? pos : pos.slice(0, 3);

  return (
    <svg viewBox="0 0 540 420" role="img" aria-label={`${label} illustration`}>
      <defs>
        <radialGradient id={`${id}-spot`} cx="50%" cy="38%" r="62%">
          <stop offset="0" stopColor={c} stopOpacity={0.32} />
          <stop offset="0.55" stopColor={c} stopOpacity={0.06} />
          <stop offset="1" stopColor={c} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#13201A" />
          <stop offset="1" stopColor="#0C1511" />
        </linearGradient>
        <linearGradient id={`${id}-jersey`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={lighten(c, 0.28)} />
          <stop offset="0.55" stopColor={c} />
          <stop offset="1" stopColor={darken(c, 0.2)} />
        </linearGradient>
        <radialGradient id={`${id}-ball`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#C9D2CD" />
        </radialGradient>
        <radialGradient id={`${id}-shine`} cx="34%" cy="28%" r="60%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#000000" stopOpacity={0.25} />
        </radialGradient>
        <clipPath id={`${id}-ballclip`}>
          <circle r={16.5} />
        </clipPath>
        <clipPath id={`${id}-pitch`}>
          <rect x={0} y={292} width={540} height={128} />
        </clipPath>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>

      {/* stadium light + pitch */}
      <rect width={540} height={420} fill={`url(#${id}-spot)`}>
        {on && <animate attributeName="opacity" values="0.75;1;0.75" dur="4s" repeatCount="indefinite" />}
      </rect>
      <rect y={292} width={540} height={128} fill={`url(#${id}-floor)`} />
      <g clipPath={`url(#${id}-pitch)`} stroke="#1E3027" strokeWidth={2}>
        {[-260, -130, 0, 130, 260, 390, 520, 650, 780].map((bx) => (
          <line key={bx} x1={270} y1={150} x2={bx} y2={460} />
        ))}
        <line x1={0} y1={318} x2={540} y2={318} />
        <line x1={0} y1={GROUND + 8} x2={540} y2={GROUND + 8} />
      </g>
      <line x1={0} y1={292} x2={540} y2={292} stroke="#24332B" strokeWidth={2} />

      {/* faded position code */}
      <text
        x={270}
        y={300}
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-cond), sans-serif' }}
        fontWeight={800}
        fontSize={mark.length > 2 ? 210 : 260}
        fill="#1C2B23"
      >
        {mark}
      </text>

      <Dust c={c} on={on} />

      <g transform={flip ? 'translate(540 0) scale(-1 1)' : undefined}>
        {/* glow under the player */}
        <ellipse cx={kind === 'DEF' ? 200 : pose.x + 14} cy={GROUND} rx={130} ry={26} fill={c} opacity={0.22} filter={`url(#${id}-blur)`} />

        {kind === 'GK' && (
          <g>
            <path d="M88 330 V118 H452 V330" fill="none" stroke="#3A4D43" strokeWidth={9} strokeLinejoin="round" />
            <path
              d="M128 118V330M168 118V330M208 118V330M248 118V330M288 118V330M328 118V330M368 118V330M408 118V330M88 160H452M88 202H452M88 244H452M88 286H452"
              stroke="#1B2A22"
              strokeWidth={2}
            />
          </g>
        )}

        {kind === 'WB' && (
          <>
            <SpeedLines x={120} y={150} on={on} c={c} />
            <g transform="translate(410 120)">
              {[0, 1, 2].map((i) => (
                <path key={i} d={`M${i * 26} -18 L${i * 26 + 18} 0 L${i * 26} 18`} fill="none" stroke={c} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={on ? 0.15 : 0.6}>
                  {on && <animate attributeName="opacity" values="0.15;0.9;0.15" dur="0.9s" begin={`${i * 0.18}s`} repeatCount="indefinite" />}
                </path>
              ))}
            </g>
          </>
        )}

        {kind === 'MID' && <SpeedLines x={110} y={170} on={on} c={c} />}

        <Figure
          p={pose}
          id={id}
          c={c}
          num={num}
          on={on}
          flip={flip}
          held={
            kind === 'GK'
              ? (t) => (
                  // Ball flies in, is caught between the gloves at the top of the jump, then thrown back out.
                  // Positions are in the torso's frame so the ball stays in the hands.
                  <g transform={on ? undefined : 'translate(10 -191)'}>
                    {on && (
                      <>
                        <animateTransform
                          attributeName="transform"
                          type="translate"
                          values="250 -150;120 -175;10 -191;44 -180;250 -260"
                          {...t}
                        />
                        <animate attributeName="opacity" values="0;1;1;1;0" {...t} />
                      </>
                    )}
                    <Ball id={id} on={on} spin={0.6} />
                  </g>
                )
              : undefined
          }
        />

        {/* the ball */}
        {kind === 'MID' && (
          <g transform={`translate(${pose.x + 92} ${GROUND - 17})`}>
            {on && <animateTransform attributeName="transform" type="translate" additive="sum" values="0 0;8 -16;0 0" dur="0.4s" repeatCount="indefinite" />}
            <Ball id={id} on={on} spin={0.5} />
          </g>
        )}

        {kind === 'FWD' && (
          <g transform={`translate(${pose.x + 62} ${GROUND - 17})`}>
            <g>
              {on && (
                <>
                  <animateTransform attributeName="transform" type="translate" values="0 0;0 0;290 -230;0 0;0 0" keyTimes="0;0.44;0.66;0.68;1" dur={`${pose.dur}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.56;0.66;0.88;1" dur={`${pose.dur}s`} repeatCount="indefinite" />
                </>
              )}
              <g opacity={0}>
                {on && <animate attributeName="opacity" values="0;0;0.8;0;0" keyTimes="0;0.44;0.5;0.66;1" dur={`${pose.dur}s`} repeatCount="indefinite" />}
                <path d="M-18 6 L-70 40 M-14 14 L-56 52 M-20 -2 L-80 26" stroke={c} strokeWidth={5} strokeLinecap="round" />
              </g>
              <Ball id={id} on={on} spin={0.35} />
            </g>
            <circle r={18} fill="none" stroke="#EEF3EF" strokeWidth={4} opacity={0}>
              {on && (
                <>
                  <animate attributeName="r" values="18;18;60;60" keyTimes="0;0.44;0.58;1" dur={`${pose.dur}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;0;0.8;0;0" keyTimes="0;0.43;0.45;0.58;1" dur={`${pose.dur}s`} repeatCount="indefinite" />
                </>
              )}
            </circle>
          </g>
        )}

        {kind === 'DEF' && (
          <g transform={`translate(${pose.x + 22 + 150} ${GROUND - 17})`}>
            <g>
              {on && (
                <>
                  <animateTransform attributeName="transform" type="translate" values="0 0;0 0;220 -60;0 0;0 0" keyTimes="0;0.43;0.62;0.64;1" dur={`${pose.dur}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.52;0.62;0.9;1" dur={`${pose.dur}s`} repeatCount="indefinite" />
                </>
              )}
              <Ball id={id} on={on} spin={0.4} />
            </g>
            {/* turf spray at the moment of the tackle */}
            {on &&
              [[-30, -10], [-44, -24], [-20, -30], [-52, -6]].map(([dx, dy], i) => (
                <circle key={i} cx={-20} cy={10} r={4 - (i % 2)} fill={i % 2 ? '#2EC4B6' : '#7BD389'} opacity={0}>
                  <animate attributeName="cx" values={`-20;-20;${dx - 20};${dx - 20}`} keyTimes="0;0.4;0.6;1" dur={`${pose.dur}s`} repeatCount="indefinite" />
                  <animate attributeName="cy" values={`10;10;${dy};${dy + 20}`} keyTimes="0;0.4;0.6;1" dur={`${pose.dur}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;0;0.8;0" keyTimes="0;0.4;0.5;0.7" dur={`${pose.dur}s`} repeatCount="indefinite" />
                </circle>
              ))}
          </g>
        )}
      </g>
    </svg>
  );
}
