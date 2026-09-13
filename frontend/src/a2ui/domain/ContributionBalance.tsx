import type { ReactA2uiComponentProps } from "@a2ui/react/v0_9";
import "./ContributionBalance.css";

// Balanza de equilibrio: platillo izquierdo = montoActual (ahorro
// acumulado hoy), platillo derecho = montoObjetivo (meta de ahorro) —
// misma pareja de datos que GoalCard, ambos MONTOS TOTALES y por eso
// comparables en una balanza. El ángulo se deriva de ambos valores — nunca
// lo manda el agente — y llega a 0 (horizontal) exactamente cuando
// current === target, es decir, cuando la meta está alcanzada.
//
// Antes esta balanza comparaba aportación mensual (un flujo) contra saldo
// proyectado (un total) — dos magnitudes de tipo distinto que casi nunca
// son comparables en escala, así que la balanza quedaba siempre al tope
// sin comunicar nada. Ver catalog/ContributionBalance.ts para el fix.
interface ContributionBalanceProps {
  montoActual: number;
  montoObjetivo: number;
}

const CENTER_X = 120;
const PIVOT_Y = 50;
const BEAM_HALF_WIDTH = 80;
const STRING_LENGTH = 40;
const MAX_ANGLE_DEG = 24;
const MAX_COINS = 5;
const COIN_RADIUS = 9;
const COIN_STACK_STEP = 7;

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function formatMonto(valor: number): string {
  return currencyFormatter.format(Number.isFinite(valor) ? valor : 0);
}

// Tope de 5 monedas visibles: la denominación (cuánto vale cada moneda) se
// deriva del lado más grande de la balanza, para que ese lado siempre
// muestre exactamente 5 y el otro escale en proporción sin pasarse del
// tope. El monto exacto siempre se lee en el texto de abajo, así que un
// solo platillo con una moneda nunca deja de comunicar la cifra real.
function coinCount(valor: number, maxValor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  if (!Number.isFinite(maxValor) || maxValor <= 0) return 1;
  const ratio = valor / maxValor;
  return Math.max(1, Math.min(MAX_COINS, Math.round(ratio * MAX_COINS)));
}

function Coin({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g className="contribution-balance__coin">
      <circle cx={cx} cy={cy} r={COIN_RADIUS} />
      <circle cx={cx} cy={cy} r={COIN_RADIUS * 0.6} className="contribution-balance__coin-inner" />
    </g>
  );
}

interface PanProps {
  side: "izquierdo" | "derecho";
  anchorX: number;
  translateX: number;
  translateY: number;
  monto: number;
  maxMonto: number;
}

// Ojo: este <g> solo recibe `translate`, nunca `rotate` — así el platillo y
// las monedas se quedan siempre en horizontal aunque el brazo (el <g> padre
// en el SVG principal) esté girado. Si este grupo rotara con el brazo, las
// monedas se verían "cayéndose" del platillo.
function Pan({ side, anchorX, translateX, translateY, monto, maxMonto }: PanProps) {
  const plateY = PIVOT_Y + STRING_LENGTH;
  const count = coinCount(monto, maxMonto);

  return (
    <g
      className={`contribution-balance__pan contribution-balance__pan--${side}`}
      style={{ transform: `translate(${translateX}px, ${translateY}px)` }}
    >
      <line className="contribution-balance__string" x1={anchorX} y1={PIVOT_Y} x2={anchorX} y2={plateY} />
      <ellipse className="contribution-balance__plate" cx={anchorX} cy={plateY} rx={34} ry={8} />
      {Array.from({ length: count }, (_, i) => (
        <Coin key={i} cx={anchorX} cy={plateY - 5 - i * COIN_STACK_STEP} />
      ))}
    </g>
  );
}

export function ContributionBalance({ props }: ReactA2uiComponentProps<ContributionBalanceProps>) {
  const current = Number(props.montoActual) || 0;
  const target = Number(props.montoObjetivo) || 0;
  const total = current + target;
  // 0 cuando current === target; se acerca a ±MAX_ANGLE_DEG mientras más
  // se separan, pero nunca lo rebasa (queda acotado por construcción).
  const angleDeg = total > 0 ? (MAX_ANGLE_DEG * (target - current)) / total : 0;
  const rad = (angleDeg * Math.PI) / 180;
  const maxMonto = Math.max(current, target);

  const leftAnchorX = CENTER_X - BEAM_HALF_WIDTH;
  const rightAnchorX = CENTER_X + BEAM_HALF_WIDTH;
  const leftX = CENTER_X - BEAM_HALF_WIDTH * Math.cos(rad);
  const leftY = PIVOT_Y - BEAM_HALF_WIDTH * Math.sin(rad);
  const rightX = CENTER_X + BEAM_HALF_WIDTH * Math.cos(rad);
  const rightY = PIVOT_Y + BEAM_HALF_WIDTH * Math.sin(rad);

  const ariaLabel = `Balanza entre el monto actual de ${formatMonto(current)} y la meta de ${formatMonto(target)}`;

  return (
    <div className="contribution-balance">
      <svg className="contribution-balance__svg" viewBox="0 0 240 150" role="img" aria-label={ariaLabel} preserveAspectRatio="xMidYMid meet">
        <g className="contribution-balance__stand">
          <path className="contribution-balance__base" d={`M${CENTER_X - 30},140 L${CENTER_X + 30},140 L${CENTER_X + 8},110 L${CENTER_X - 8},110 Z`} />
          <line className="contribution-balance__pole" x1={CENTER_X} y1={PIVOT_Y} x2={CENTER_X} y2={112} />
        </g>

        {/* Rotación real: SOLO este <g> gira, y solo vía transform CSS — los
            x1/y1 de la línea de abajo son fijos, nunca se tocan para animar. */}
        <g className="contribution-balance__beam" style={{ transform: `rotate(${angleDeg}deg)`, transformOrigin: `${CENTER_X}px ${PIVOT_Y}px` }}>
          <line className="contribution-balance__bar" x1={leftAnchorX} y1={PIVOT_Y} x2={rightAnchorX} y2={PIVOT_Y} />
        </g>

        <circle className="contribution-balance__pivot" cx={CENTER_X} cy={PIVOT_Y} r={4} />

        <Pan side="izquierdo" anchorX={leftAnchorX} translateX={leftX - leftAnchorX} translateY={leftY - PIVOT_Y} monto={current} maxMonto={maxMonto} />
        <Pan side="derecho" anchorX={rightAnchorX} translateX={rightX - rightAnchorX} translateY={rightY - PIVOT_Y} monto={target} maxMonto={maxMonto} />
      </svg>

      <div className="contribution-balance__captions">
        <div className="contribution-balance__caption">
          <span className="contribution-balance__caption-label">Monto actual</span>
          <span className="contribution-balance__caption-value">{formatMonto(current)}</span>
        </div>
        <div className="contribution-balance__caption contribution-balance__caption--target">
          <span className="contribution-balance__caption-label">Meta</span>
          <span className="contribution-balance__caption-value">{formatMonto(target)}</span>
        </div>
      </div>
    </div>
  );
}
