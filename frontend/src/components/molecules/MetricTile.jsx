import CurrencyText from "../atoms/CurrencyText.jsx"
import Text from "../atoms/Text.jsx"
import "../../css/molecules/metric-tile.css"

export default function MetricTile({ label, value, amount, variant = "default" }) {
  const variantClass = variant === "default" ? "" : `metric-tile--${variant}`

  return (
    <div className={`metric-tile ${variantClass}`.trim()}>
      <Text className="metric-tile__label" tone="muted">{label}</Text>
      {amount !== undefined ? <CurrencyText amount={amount} size="lg" /> : <Text tone="primary" size="lg" bold>{value}</Text>}
    </div>
  )
}
