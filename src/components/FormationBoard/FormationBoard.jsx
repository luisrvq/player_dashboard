import React from 'react';

// ─── field dimensions (px) ────────────────────────────────────────────────────
// Real FIFA pitch ratio is ~105m × 68m (length:width ≈ 1.54:1).
// We render portrait (tall), so W is the short axis, H the long axis.
const W = 480;
const H = 740;

// ─── pitch markings constants (all in px, matching official ratios) ────────────
// Border inset — white outer boundary line sits inside the canvas edge
const PAD = 20;

// Field inner bounds (the white border rectangle)
const FX = PAD;          // left edge of field
const FY = PAD;          // top edge of field
const FW = W - PAD * 2;  // field width
const FH = H - PAD * 2;  // field height
const CX = W / 2;        // center x
const CY = H / 2;        // center y

// ── center circle ─────────────────────────────────────────────────────────────
// Real: 9.15 m radius on a 68 m wide pitch  →  ~13.5% of field width
const CR = FW * 0.135;   // center circle radius ≈ 59 px

// ── penalty area (large box) ──────────────────────────────────────────────────
// Real: 40.32 m wide, 16.5 m deep  →  ~59% of field width, ~11% of field height
const PB_W = FW * 0.59;               // penalty box width
const PB_H = FH * 0.118;              // penalty box depth
const PB_X = CX - PB_W / 2;          // left edge of penalty box

// ── goal area (six-yard box) ──────────────────────────────────────────────────
// Real: 18.32 m wide, 5.5 m deep  →  ~27% of field width, ~3.9% of field height
const GA_W = FW * 0.27;
const GA_H = FH * 0.045;
const GA_X = CX - GA_W / 2;

// ── penalty spot ──────────────────────────────────────────────────────────────
// Real: 11 m from goal line  →  ~7.8% of field height
const P_SPOT_DEPTH = FH * 0.078;

// ── penalty arc (D-ring) ──────────────────────────────────────────────────────
// Real arc radius = 9.15 m (same as center circle).
// The arc is drawn centered on the penalty spot. Only the part OUTSIDE the
// penalty box is visible — i.e. it curves AWAY from the goal.
const ARC_R = CR; // same radius as center circle

// ── goal rectangle (outside field boundary) ───────────────────────────────────
// Real: 7.32 m wide, ~2 m deep  →  ~10.8% of field width
const GOAL_W = FW * 0.108;
const GOAL_H = 14;          // depth outside the field boundary
const GOAL_X = CX - GOAL_W / 2;

// ── corner arc ────────────────────────────────────────────────────────────────
const CORNER_R = 8;

// ─── derived positions: top end (opponent goal) and bottom end (own goal) ─────
// TOP — penalty box sits flush with top field line, extending INWARD
const TOP_PB_Y1  = FY;                      // flush with top field line
const TOP_PB_Y2  = FY + PB_H;
const TOP_GA_Y1  = FY;
const TOP_GA_Y2  = FY + GA_H;
const TOP_P_SPOT = { x: CX, y: FY + P_SPOT_DEPTH };
// Arc: centered on penalty spot, opening AWAY from goal (downward into field)
// startAngle/endAngle in degrees from 3 o'clock. We want the arc that faces
// AWAY from the top goal, i.e. the bottom semicircle of the circle centered on
// the penalty spot. clipPathId keeps only the part outside the penalty box.
const TOP_ARC_CY = TOP_P_SPOT.y;

// BOTTOM — mirror of top
const BOT_PB_Y1  = FY + FH - PB_H;
const BOT_PB_Y2  = FY + FH;
const BOT_GA_Y1  = FY + FH - GA_H;
const BOT_GA_Y2  = FY + FH;
const BOT_P_SPOT = { x: CX, y: FY + FH - P_SPOT_DEPTH };
const BOT_ARC_CY = BOT_P_SPOT.y;

// ─── 4-4-2 formation (fractions of field interior, top = attack) ──────────────
// y fractions are relative to the full H canvas, positioned within FY..FY+FH
const F_ROWS = [
  { yFrac: 0.10, xFracs: [0.30, 0.70] },                    // 2 FW
  { yFrac: 0.32, xFracs: [0.12, 0.37, 0.63, 0.88] },        // 4 MF
  { yFrac: 0.62, xFracs: [0.12, 0.37, 0.63, 0.88] },        // 4 DF
  { yFrac: 0.87, xFracs: [0.50] },                           // 1 GK
];

const POSITIONS = [];
let shirt = 1;
for (const { yFrac, xFracs } of F_ROWS) {
  for (const xFrac of xFracs) {
    // Convert field-relative fractions to canvas coordinates
    const canvasX = FX + xFrac * FW;
    const canvasY = FY + yFrac * FH;
    POSITIONS.push({ x: canvasX / W, y: canvasY / H, shirt });
    shirt++;
  }
}

// ─── stripe pattern ────────────────────────────────────────────────────────────
// Alternating dark/light grass bands (5 per half = 10 total)
const STRIPE_COUNT = 10;
const stripes = Array.from({ length: STRIPE_COUNT }, (_, i) => ({
  y: FY + (FH / STRIPE_COUNT) * i,
  h: FH / STRIPE_COUNT,
  dark: i % 2 === 0,
}));

// ─── SVG attribute helpers ─────────────────────────────────────────────────────
const LINE = { stroke: '#ffffff', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' };
const DOT  = { fill: '#ffffff' };

// Helper: SVG arc path (large-arc=0 always for our < 180° arcs, but the
// penalty D is exactly 180° on the outside, so we build it as a full arc path)
function arcPath(cx, cy, r, startDeg, endDeg) {
  const toRad = d => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// ─── FieldMarkings SVG ────────────────────────────────────────────────────────
function FieldMarkings() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Clip: only the area OUTSIDE (above) the top penalty box — for top D-arc */}
        <clipPath id="topArcClip">
          <rect x={0} y={TOP_PB_Y2} width={W} height={H} />
        </clipPath>
        {/* Clip: only the area OUTSIDE (below) the bottom penalty box — for bottom D-arc */}
        <clipPath id="botArcClip">
          <rect x={0} y={0} width={W} height={BOT_PB_Y1} />
        </clipPath>
        {/* Goal net pattern */}
        <pattern id="netPattern" x={0} y={0} width={6} height={6} patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 6 6 M 6 0 L 0 6" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
        </pattern>
      </defs>

      {/* ── grass stripes ── */}
      {stripes.map((stripe, i) => (
        <rect
          key={i}
          x={FX} y={stripe.y}
          width={FW} height={stripe.h}
          fill={stripe.dark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'}
        />
      ))}

      {/* ── goal rectangles (outside field, with net pattern) ── */}
      {/* top goal */}
      <rect x={GOAL_X} y={FY - GOAL_H} width={GOAL_W} height={GOAL_H} fill="url(#netPattern)" stroke="#ffffff" strokeWidth={1.5} />
      {/* bottom goal */}
      <rect x={GOAL_X} y={FY + FH} width={GOAL_W} height={GOAL_H} fill="url(#netPattern)" stroke="#ffffff" strokeWidth={1.5} />

      {/* ── outer field boundary ── */}
      <rect x={FX} y={FY} width={FW} height={FH} {...LINE} />

      {/* ── halfway line ── */}
      <line x1={FX} y1={CY} x2={FX + FW} y2={CY} {...LINE} />

      {/* ── center circle & spot ── */}
      <circle cx={CX} cy={CY} r={CR} {...LINE} />
      <circle cx={CX} cy={CY} r={3.5} {...DOT} />

      {/* ══ TOP HALF markings ══ */}
      {/* penalty box */}
      <rect x={PB_X} y={TOP_PB_Y1} width={PB_W} height={PB_H} {...LINE} />
      {/* goal area */}
      <rect x={GA_X} y={TOP_GA_Y1} width={GA_W} height={GA_H} {...LINE} />
      {/* penalty spot */}
      <circle cx={TOP_P_SPOT.x} cy={TOP_P_SPOT.y} r={3} {...DOT} />
      {/* D-arc: curves away from goal (downward), clipped to outside penalty box */}
      <path
        d={arcPath(TOP_ARC_CY === TOP_P_SPOT.y ? CX : CX, TOP_P_SPOT.y, ARC_R, 0, 180)}
        clipPath="url(#topArcClip)"
        {...LINE}
      />

      {/* ══ BOTTOM HALF markings ══ */}
      {/* penalty box */}
      <rect x={PB_X} y={BOT_PB_Y1} width={PB_W} height={PB_H} {...LINE} />
      {/* goal area */}
      <rect x={GA_X} y={BOT_GA_Y1} width={GA_W} height={GA_H} {...LINE} />
      {/* penalty spot */}
      <circle cx={BOT_P_SPOT.x} cy={BOT_P_SPOT.y} r={3} {...DOT} />
      {/* D-arc: curves away from goal (upward), clipped to outside penalty box */}
      <path
        d={arcPath(CX, BOT_P_SPOT.y, ARC_R, 180, 360)}
        clipPath="url(#botArcClip)"
        {...LINE}
      />

      {/* ── corner arcs ── */}
      {/* top-left */}
      <path d={arcPath(FX, FY, CORNER_R, 0, 90)} {...LINE} />
      {/* top-right */}
      <path d={arcPath(FX + FW, FY, CORNER_R, 90, 180)} {...LINE} />
      {/* bottom-left */}
      <path d={arcPath(FX, FY + FH, CORNER_R, 270, 360)} {...LINE} />
      {/* bottom-right */}
      <path d={arcPath(FX + FW, FY + FH, CORNER_R, 180, 270)} {...LINE} />
    </svg>
  );
}

// ─── inline styles ────────────────────────────────────────────────────────────
const s = {
  outer: {
    // outer shell: adds padding at top/bottom for goal rectangles that bleed out
    position: 'relative',
    width: W,
    paddingTop: GOAL_H,
    paddingBottom: GOAL_H,
    margin: '0 auto',
  },
  wrapper: {
    width: W,
    height: H,
    borderRadius: 10,
    border: '2px solid rgba(255,255,255,0.15)',
    boxShadow: 'inset 0 0 60px rgba(0,0,0,0.35), 0 6px 24px rgba(0,0,0,0.5)',
    background: 'linear-gradient(180deg, #3a9e3a 0%, #2e882e 30%, #2a7a2a 60%, #2e882e 85%, #3a9e3a 100%)',
    position: 'relative',
    overflow: 'visible',   // goals bleed outside
    userSelect: 'none',
  },
  svg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    overflow: 'visible',   // allow goal rects outside bounds
  },
  emptyOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: '0.02em',
    textAlign: 'center',
    padding: '0 2rem',
    lineHeight: 1.6,
  },
  token: (xFrac, yFrac) => ({
    position: 'absolute',
    left: `${xFrac * 100}%`,
    top: `${yFrac * 100}%`,
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    zIndex: 1,
  }),
  ring: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: '2px solid #fff',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
    background: '#1a5c1a',
    flexShrink: 0,
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  photoFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#f0c040',
    color: '#000',
    fontSize: 8,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
    lineHeight: 1,
  },
  name: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 600,
    textShadow: '0 1px 4px rgba(0,0,0,1)',
    textAlign: 'center',
    maxWidth: 60,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

// ─── player token ─────────────────────────────────────────────────────────────
function PlayerToken({ player, shirt: shirtNum }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={s.ring}>
        {player.photo
          ? <img src={player.photo} alt={player.name} style={s.photo} />
          : <div style={s.photoFallback}>?</div>
        }
      </div>
      <div style={s.badge}>{shirtNum}</div>
    </div>
  );
}

// ─── component ────────────────────────────────────────────────────────────────
/**
 * @typedef {{ id: number, name: string, photo: string | null }} PlayerInfo
 * @typedef {{ player: PlayerInfo }} PlayerEntry
 * @param {{ players: PlayerEntry[] }} props  Pass exactly 11 entries.
 */
function FormationBoard({ players = [] }) {
  const hasPlayers = players.length > 0;

  return (
    <div style={s.outer}>
      <div style={s.wrapper}>
        <FieldMarkings />

        {!hasPlayers && (
          <div style={s.emptyOverlay}>
            <p style={s.emptyText}>
              Click <strong>Generate Random Team</strong><br />to see the formation
            </p>
          </div>
        )}

        {hasPlayers && POSITIONS.map(({ x, y, shirt: shirtNum }, i) => {
          const entry = players[i];
          if (!entry) return null;
          return (
            <div key={entry.player.id} style={s.token(x, y)}>
              <PlayerToken player={entry.player} shirt={shirtNum} />
              <span style={s.name}>{entry.player.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FormationBoard;
