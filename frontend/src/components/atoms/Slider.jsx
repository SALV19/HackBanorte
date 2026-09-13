import "../../css/atoms/slider.css"

export default function Slider({ value, min, max, step = 1, onChange, ariaLabel = "Control deslizante", className = "" }) {
  return (
    <input
      aria-label={ariaLabel}
      className={`slider ${className}`.trim()}
      max={max}
      min={min}
      onChange={(event) => onChange?.(Number(event.target.value))}
      step={step}
      type="range"
      value={value}
    />
  )
}
