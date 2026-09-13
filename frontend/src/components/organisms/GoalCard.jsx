import { Pencil } from "lucide-react"
import CardContainer from "../atoms/CardContainer.jsx"
import CurrencyText from "../atoms/CurrencyText.jsx"
import IconButton from "../atoms/IconButton.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "../molecules/CardHeader.jsx"
import ProgressRing from "../molecules/ProgressRing.jsx"
import "../../css/organisms/goal-card.css"

export default function GoalCard({ currentSavings, targetSavings, retirementAge, yearsLeft }) {
  const progress = targetSavings <= 0 ? 0 : (currentSavings / targetSavings) * 100

  return (
    <CardContainer>
      <CardHeader
        action={<IconButton ariaLabel="Editar objetivo"><Pencil aria-hidden="true" /></IconButton>}
        kicker="Tu objetivo"
        title={`Retirarte a los ${retirementAge}`}
      />
      <div className="goal-card__body">
        <ProgressRing value={progress} label={`${Math.round(progress)}%`} />
        <div className="goal-card__copy">
          <Text>Vas por buen camino. Has avanzado más de la mitad hacia tu meta.</Text>
          <Text tone="brand" bold>Faltan {yearsLeft} años</Text>
        </div>
      </div>
      <div className="goal-card__footer">
        <Text tone="muted">Meta estimada</Text>
        <CurrencyText amount={targetSavings} size="sm" />
      </div>
    </CardContainer>
  )
}
