import { formatMXN } from "../../utils/formatters.js"
import "../../css/atoms/currency-text.css"

export default function CurrencyText({ amount, size = "md", inverse = false, className = "" }) {
  return (
    <span className={`currency-text currency-text--${size} ${inverse ? "currency-text--inverse" : ""} ${className}`.trim()}>
      {formatMXN(amount)}
    </span>
  )
}
