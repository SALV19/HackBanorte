import "../../css/atoms/legend-dot.css"

export default function LegendDot({ color = "var(--color-primary)" }) {
  return <span className="legend-dot" style={{ "--legend-dot-color": color }} />
}
