import "../../css/atoms/button.css"

export default function Button({
  type = "button",
  size = "md",
  variant = "primary",
  className = "",
  onClick,
  disabled = false,
  children,
  ariaLabel,
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`button button--${size} button--${variant} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}
