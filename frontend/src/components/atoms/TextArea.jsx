import "../../css/atoms/input.css"

export default function TextArea({ value, placeholder, onChange, ariaLabel = "Pregunta abierta", className = "" }) {
  return (
    <textarea
      aria-label={ariaLabel}
      className={`textarea-input ${className}`.trim()}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  )
}
