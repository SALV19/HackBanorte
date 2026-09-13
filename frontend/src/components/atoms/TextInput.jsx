import "../../css/atoms/input.css"

export default function TextInput({ value, placeholder, onChange, ariaLabel = "Texto", className = "" }) {
  return (
    <input
      aria-label={ariaLabel}
      className={`text-input ${className}`.trim()}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      type="text"
      value={value}
    />
  )
}
