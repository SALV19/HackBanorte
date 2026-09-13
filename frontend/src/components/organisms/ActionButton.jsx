import { ArrowRight } from "lucide-react"
import Button from "../atoms/Button.jsx"
import "../../css/organisms/action-button.css"

export default function ActionButton({ label, description, action, payload, onAction }) {
  return (
    <Button className="action-button" onClick={() => onAction?.(action, payload)} size="lg" variant="primary">
      <span className="action-button__text">
        <span>{label}</span>
        {description && <span className="action-button__description">{description}</span>}
      </span>
      <ArrowRight aria-hidden="true" />
    </Button>
  )
}
