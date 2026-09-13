import "../../css/atoms/input.css"

export default function NumberInput({ value, min, max, step = 1, onChange, ariaLabel = "Monto", className = "" }) {
  return (
    <input
      aria-label={ariaLabel}
      className={`number-input ${className}`.trim()}
      inputMode="numeric"
      max={max}
      min={min}
      onChange={(event) => onChange?.(Number(event.target.value))}
      step={step}
      type="number"
      value={value}
    />
  )
}
