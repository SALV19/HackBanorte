import { CircleHelp } from "lucide-react"
import CardContainer from "../atoms/CardContainer.jsx"
import IconButton from "../atoms/IconButton.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "../molecules/CardHeader.jsx"
import MetricTile from "../molecules/MetricTile.jsx"
import "../../css/organisms/retirement-timeline.css"

export default function RetirementTimeline({
  currentAge,
  midpointAge,
  retirementAge,
  currentSavings,
  yearsToEnjoy,
}) {
  const points = [
    { age: currentAge, label: "Hoy", future: false },
    { age: midpointAge, label: "Mitad", future: false },
    { age: retirementAge, label: "Retiro", future: true },
  ]

  return (
    <CardContainer className="retirement-timeline">
      <CardHeader
        action={<IconButton ariaLabel="Ver ayuda de línea de tiempo"><CircleHelp aria-hidden="true" /></IconButton>}
        kicker="Tu línea de tiempo"
        title="El camino hacia tu retiro"
      />
      <div className="retirement-timeline__rail">
        {points.map((point) => (
          <div className="retirement-timeline__point" key={point.label}>
            <span className={`retirement-timeline__dot ${point.future ? "retirement-timeline__dot--future" : ""}`.trim()} />
            <span className="retirement-timeline__age">{point.age} años</span>
            <span className="retirement-timeline__label">{point.label}</span>
          </div>
        ))}
      </div>
      <div className="retirement-timeline__metrics">
        <MetricTile amount={currentSavings} label="Ahorrado hasta hoy" variant="warm" />
        <MetricTile label="Años para disfrutar" value={`${yearsToEnjoy} años`} />
      </div>
      <Text tone="muted">Te faltan {retirementAge - currentAge} años para tu retiro.</Text>
    </CardContainer>
  )
}
