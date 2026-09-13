import "../../css/atoms/card-container.css"

export default function CardContainer({ children, variant = "default", className = "", id }) {
  const variantClass = variant === "default" ? "" : `card-container--${variant}`

  return (
    <section className={`card-container ${variantClass} ${className}`.trim()} id={id}>
      {children}
    </section>
  )
}
