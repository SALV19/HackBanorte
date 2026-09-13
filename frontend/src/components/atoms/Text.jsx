import "../../css/atoms/type.css"

export default function Text({ children, size = "md", tone = "secondary", bold = false, className = "" }) {
  return (
    <p className={`text text--${size} text--${tone} ${bold ? "text--bold" : ""} ${className}`.trim()}>
      {children}
    </p>
  )
}
