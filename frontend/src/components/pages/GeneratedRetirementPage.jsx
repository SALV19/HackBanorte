import { useMemo, useState } from "react"
import { CircleHelp, Pencil, SlidersHorizontal } from "lucide-react"
import Badge from "../atoms/Badge.jsx"
import IconButton from "../atoms/IconButton.jsx"
import Text from "../atoms/Text.jsx"
import Title from "../atoms/Title.jsx"
import ActionPrompt from "../molecules/ActionPrompt.jsx"
import AppHeader from "../molecules/AppHeader.jsx"
import ContributionControl from "../molecules/ContributionControl.jsx"
import ExpenseBreakdown from "../molecules/ExpenseBreakdown.jsx"
import GoalSummary from "../molecules/GoalSummary.jsx"
import MonthlyIncomeControl from "../molecules/MonthlyIncomeControl.jsx"
import ProjectionChart from "../molecules/ProjectionChart.jsx"
import ScenarioComparison from "../molecules/ScenarioComparison.jsx"
import TimelineSummary from "../molecules/TimelineSummary.jsx"
import { formatMXN } from "../../utils/formatters.js"
import {
  expensesData,
  navItems,
  projectionData,
  projectionSeries,
  scenariosData,
} from "../../data/demoRetirementData.js"
import "../../css/pages/generated-retirement-page.css"

export default function GeneratedRetirementPage() {
  const [contribution, setContribution] = useState(7500)
  const [selectedScenarioId, setSelectedScenarioId] = useState("balanced")

  const contributionMessage = useMemo(
    () => contribution >= 10000 ? "Vas adelantando tu objetivo." : "Vas por buen camino.",
    [contribution],
  )

  return (
    <div className="generated-retirement-page">
      <AppHeader
        brandInitial="P"
        brandName="Planifica"
        navItems={navItems}
        userInitial="M"
        userName="Mariana"
      />
      <main className="generated-retirement-page__main" id="resumen">
        <section className="generated-retirement-page__hero">
          <div>
            <p className="generated-retirement-page__eyebrow">Tu espacio financiero</p>
            <h1 className="generated-retirement-page__title">Hola, Mariana</h1>
            <p className="generated-retirement-page__subtitle">
              Aquí tienes una vista clara de tu camino hacia el retiro.
            </p>
          </div>
          <Badge dot variant="success">Plan actualizado hoy</Badge>
        </section>

        <section className="generated-retirement-page__grid">
          <div className="generated-retirement-page__wide">
            <TimelineSummary
              action={<IconButton ariaLabel="Ver ayuda de línea de tiempo"><CircleHelp aria-hidden="true" /></IconButton>}
              helperText="Te faltan 39 años para tu retiro."
              kicker="Tu línea de tiempo"
              metrics={[
                { label: "Ahorrado hasta hoy", amount: 180000, variant: "warm" },
                { label: "Años para disfrutar", value: "20 años" },
              ]}
              points={[
                { value: "28 años", label: "Hoy", completed: true, color: "var(--color-primary)" },
                { value: "48 años", label: "Mitad", completed: true, color: "var(--color-primary)" },
                { value: "67 años", label: "Retiro", completed: false, color: "var(--color-red-light)" },
              ]}
              title="El camino hacia tu retiro"
            />
          </div>
          <GoalSummary
            action={<IconButton ariaLabel="Editar objetivo"><Pencil aria-hidden="true" /></IconButton>}
            bodyText="Vas por buen camino. Has avanzado más de la mitad hacia tu meta."
            currentValue={5320000}
            footerLabel="Meta estimada"
            highlightText="Faltan 39 años"
            kicker="Tu objetivo"
            targetValue={7600000}
            title="Retirarte a los 67"
          />
          <div className="generated-retirement-page__wide">
            <ProjectionChart
              data={projectionData}
              kicker="Proyección de crecimiento"
              mode="area"
              series={projectionSeries}
              title="Tu dinero con el tiempo"
            />
          </div>
          <ContributionControl
            action={<SlidersHorizontal color="var(--color-text-muted)" aria-hidden="true" />}
            badge={`+${Math.round(contribution / 2500)}% vs. actual`}
            kicker="Ajusta tu estrategia"
            max={15000}
            min={2500}
            note="Con esta aportación alcanzarías tu meta en tiempo."
            onChange={setContribution}
            step={500}
            suffix="al mes"
            title="Aportación mensual"
            value={contribution}
          />
          <ScenarioComparison
            action={<button className="segmented-control__item" type="button">Ver detalles</button>}
            kicker="Compara opciones"
            onSelectScenario={setSelectedScenarioId}
            scenarios={scenariosData}
            selectedScenarioId={selectedScenarioId}
            selectedLabel="Tu selección"
            title="Encuentra tu escenario"
          />
          <MonthlyIncomeControl
            action={<IconButton ariaLabel="Editar ingreso"><Pencil aria-hidden="true" /></IconButton>}
            description="Necesitarías aproximadamente"
            kicker="Cuando te retires"
            max={80000}
            min={25000}
            note="Esto representa el 85% de tu ingreso actual."
            percentLabel="85%"
            step={2500}
            suffix="/ mes"
            title="Ingreso mensual deseado"
            value={45000}
          />
          <ExpenseBreakdown
            centerLabel="mensuales"
            centerValue="$45k"
            expenses={expensesData}
            footerText={`Disponible estimado: ${formatMXN(45000 - expensesData.reduce((sum, item) => sum + item.amount, 0))}`}
            kicker="Tu vida hoy"
            title="Desglose de gastos"
          />
        </section>

        <section className="generated-retirement-page__cta" id="ayuda">
          <div className="generated-retirement-page__cta-copy">
            <Title size="sm">{contributionMessage}</Title>
            <Text>Pequeños cambios hoy pueden hacer una gran diferencia mañana.</Text>
          </div>
          <ActionPrompt
            action="confirmPlan"
            description="Revisa tu plan personalizado"
            label="Siguiente paso"
            onAction={(action, payload) => console.log("action_requested", { action, payload })}
          />
        </section>

        <p className="generated-retirement-page__disclaimer">
          Esta proyección es estimativa y no constituye asesoría financiera.
        </p>
      </main>
    </div>
  )
}
