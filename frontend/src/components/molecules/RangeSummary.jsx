import Badge from "../atoms/Badge.jsx"
import CurrencyText from "../atoms/CurrencyText.jsx"
import Slider from "../atoms/Slider.jsx"
import "../../css/molecules/range-summary.css"

export default function RangeSummary({
  value,
  min,
  max,
  step,
  badge,
  suffix,
  onChange,
  ariaLabel,
}) {
  return (
    <div className="range-summary">
      <div className="range-summary__value">
        <div className="range-summary__amount">
          <CurrencyText amount={value} size="lg" />
          {suffix && <span className="range-summary__suffix">{suffix}</span>}
        </div>
        {badge && <Badge>{badge}</Badge>}
      </div>
      <Slider ariaLabel={ariaLabel} max={max} min={min} onChange={onChange} step={step} value={value} />
      <div className="range-summary__labels">
        <span><CurrencyText amount={min} size="sm" /></span>
        <span><CurrencyText amount={max} size="sm" /></span>
      </div>
    </div>
  )
}
