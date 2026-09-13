import Text from "../atoms/Text.jsx"
import Title from "../atoms/Title.jsx"
import "../../css/molecules/option-group.css"

export default function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="option-group">
      <Title level={3} size="sm">{label}</Title>
      <div className="option-group__options">
        {options.map((option) => (
          <button
            className={`option-group__option ${option.value === value ? "option-group__option--selected" : ""}`.trim()}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <Text tone="primary" bold>{option.label}</Text>
            {option.description && <Text size="sm" tone="muted">{option.description}</Text>}
          </button>
        ))}
      </div>
    </div>
  )
}
