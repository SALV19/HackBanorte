import Text from "../atoms/Text.jsx"
import "../../css/molecules/scenario-option.css"

export default function ScenarioOption({ label, annualReturn, selected, onSelect }) {
  return (
    <button
      className={`scenario-option ${selected ? "scenario-option--selected" : ""}`.trim()}
      onClick={onSelect}
      type="button"
    >
      <Text size="sm" tone="muted">{label}</Text>
      <Text tone="primary" bold>{annualReturn}% anual</Text>
    </button>
  )
}
