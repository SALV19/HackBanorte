import "../../css/atoms/badge.css"

export default function Badge({ children, variant = "default", dot = false, className = "" }) {
  const variantClass = variant === "default" ? "" : `badge--${variant}`

  return (
    <span className={`badge ${variantClass} ${className}`.trim()}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  )
}
