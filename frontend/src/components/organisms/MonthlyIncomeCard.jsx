import { useState } from "react"
import { Pencil } from "lucide-react"
import CardContainer from "../atoms/CardContainer.jsx"
import CurrencyText from "../atoms/CurrencyText.jsx"
import IconButton from "../atoms/IconButton.jsx"
import Slider from "../atoms/Slider.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "../molecules/CardHeader.jsx"
import "../../css/organisms/monthly-income-card.css"

export default function MonthlyIncomeCard({ monthlyIncome, min = 25000, max = 80000, step = 2500, onSave }) {
  const [income, setIncome] = useState(monthlyIncome)

  return (
    <CardContainer className="monthly-income-card">
      <CardHeader
        action={<IconButton ariaLabel="Editar ingreso"><Pencil aria-hidden="true" /></IconButton>}
        kicker="Cuando te retires"
        title="Ingreso mensual deseado"
      />
      <div className="monthly-income-card__row">
        <div>
          <Text>Necesitarías aproximadamente</Text>
          <div className="monthly-income-card__amount">
            <CurrencyText amount={income} size="lg" />
            <Text>/ mes</Text>
          </div>
        </div>
        <span className="monthly-income-card__percent">85%</span>
      </div>
      <Slider ariaLabel="Ingreso mensual deseado" max={max} min={min} onChange={(value) => { setIncome(value); onSave?.(value) }} step={step} value={income} />
      <Text className="monthly-income-card__note">Esto representa el <strong>85%</strong> de tu ingreso actual.</Text>
    </CardContainer>
  )
}
