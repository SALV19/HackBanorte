import { useState } from "react"
import CardContainer from "../atoms/CardContainer.jsx"
import CurrencyText from "../atoms/CurrencyText.jsx"
import Slider from "../atoms/Slider.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "./CardHeader.jsx"
import "../../css/molecules/monthly-income-control.css"

export default function MonthlyIncomeControl({
  kicker,
  title,
  value,
  min,
  max,
  step,
  description,
  suffix,
  percentLabel,
  note,
  action,
  onChange,
}) {
  const [internalValue, setInternalValue] = useState(value)
  const currentValue = value ?? internalValue

  function handleChange(nextValue) {
    setInternalValue(nextValue)
    onChange?.(nextValue)
  }

  return (
    <CardContainer className="monthly-income-control">
      <CardHeader action={action} kicker={kicker} title={title} />
      <div className="monthly-income-control__row">
        <div>
          {description && <Text>{description}</Text>}
          <div className="monthly-income-control__amount">
            <CurrencyText amount={currentValue} size="lg" />
            {suffix && <Text>{suffix}</Text>}
          </div>
        </div>
        {percentLabel && <span className="monthly-income-control__percent">{percentLabel}</span>}
      </div>
      <Slider ariaLabel={title} max={max} min={min} onChange={handleChange} step={step} value={currentValue} />
      {note && <Text className="monthly-income-control__note">{note}</Text>}
    </CardContainer>
  )
}
