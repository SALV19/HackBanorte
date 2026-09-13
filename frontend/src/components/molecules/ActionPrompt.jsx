import { ArrowRight } from "lucide-react"
import Button from "../atoms/Button.jsx"
import "../../css/molecules/action-prompt.css"

export default function ActionPrompt({ label, description, action, payload, onAction }) {
  return (
    <Button className="action-prompt" onClick={() => onAction?.(action, payload)} size="lg" variant="primary">
      <span className="action-prompt__text">
        <span>{label}</span>
        {description && <span className="action-prompt__description">{description}</span>}
      </span>
      <ArrowRight aria-hidden="true" />
    </Button>
  )
}
