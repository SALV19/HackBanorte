import "../../css/atoms/icon-button.css"

export default function IconButton({ children, ariaLabel, onClick, className = "" }) {
  return (
    <button aria-label={ariaLabel} className={`icon-button ${className}`.trim()} onClick={onClick} type="button">
      {children}
    </button>
  )
}
