import { useMemo, useState } from "react"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"
import Button from "../atoms/Button.jsx"
import CardContainer from "../atoms/CardContainer.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "../molecules/CardHeader.jsx"
import ScenarioOption from "../molecules/ScenarioOption.jsx"
import "../../css/organisms/scenario-comparison.css"

export default function ScenarioComparison({ scenarios, selectedScenarioId, onSelectScenario }) {
  const [internalSelected, setInternalSelected] = useState(selectedScenarioId || scenarios[1]?.id || scenarios[0]?.id)
  const selectedId = selectedScenarioId || internalSelected
  const selected = scenarios.find((scenario) => scenario.id === selectedId) || scenarios[0]
  const data = useMemo(() => ([
    { subject: "Crecimiento", value: selected.metrics.growth },
    { subject: "Estabilidad", value: selected.metrics.stability },
    { subject: "Liquidez", value: selected.metrics.liquidity },
    { subject: "Riesgo", value: selected.metrics.risk },
  ]), [selected])

  function handleSelect(id) {
    setInternalSelected(id)
    onSelectScenario?.(id)
  }

  return (
    <CardContainer className="scenario-comparison" id="escenarios">
      <CardHeader
        action={<Button size="sm" variant="ghost">Ver detalles</Button>}
        kicker="Compara opciones"
        title="Encuentra tu escenario"
      />
      <div className="scenario-comparison__options">
        {scenarios.map((scenario) => (
          <ScenarioOption
            annualReturn={scenario.annualReturn}
            key={scenario.id}
            label={scenario.label}
            onSelect={() => handleSelect(scenario.id)}
            selected={scenario.id === selectedId}
          />
        ))}
      </div>
      <div className="scenario-comparison__chart">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.18} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <Text className="scenario-comparison__selected">Tu selección: <strong>{selected.label}</strong></Text>
    </CardContainer>
  )
}
