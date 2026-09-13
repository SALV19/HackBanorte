import { useMemo, useState } from "react"
import { CircleHelp, Pencil, SlidersHorizontal } from "lucide-react"
import Badge from "../atoms/Badge.jsx"
import Button from "../atoms/Button.jsx"
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
import RecommendationList from "../molecules/RecommendationList.jsx"
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

function buildDefaultDashboard() {
  return {
    header: {
      brandInitial: "P",
      brandName: "Planifica",
      navItems,
      userInitial: "M",
      userName: "Mariana",
    },
    hero: {
      eyebrow: "Tu espacio financiero",
      title: "Hola, Mariana",
      subtitle: "Aquí tienes una vista clara de tu camino hacia el retiro.",
      status: "Plan actualizado hoy",
    },
    timeline: {
      kicker: "Tu línea de tiempo",
      title: "El camino hacia tu retiro",
      helperText: "Te faltan 39 años para tu retiro.",
      points: [
        { value: "28 años", label: "Hoy", completed: true, color: "var(--color-primary)" },
        { value: "48 años", label: "Mitad", completed: true, color: "var(--color-primary)" },
        { value: "67 años", label: "Retiro", completed: false, color: "var(--color-red-light)" },
      ],
      metrics: [
        { label: "Ahorrado hasta hoy", amount: 180000, variant: "warm" },
        { label: "Años para disfrutar", value: "20 años" },
      ],
    },
    goal: {
      kicker: "Tu objetivo",
      title: "Retirarte a los 67",
      currentValue: 5320000,
      targetValue: 7600000,
      bodyText: "Vas por buen camino. Has avanzado más de la mitad hacia tu meta.",
      highlightText: "Faltan 39 años",
      footerLabel: "Meta estimada",
    },
    projection: {
      kicker: "Proyección de crecimiento",
      title: "Tu dinero con el tiempo",
      data: projectionData,
      series: projectionSeries,
      mode: "area",
    },
    contribution: {
      kicker: "Ajusta tu estrategia",
      title: "Aportación mensual",
      value: 7500,
      min: 2500,
      max: 15000,
      step: 500,
      badge: "+3% vs. actual",
      suffix: "al mes",
      note: "Con esta aportación alcanzarías tu meta en tiempo.",
    },
    scenarios: {
      kicker: "Compara opciones",
      title: "Encuentra tu escenario",
      selectedLabel: "Tu selección",
      selectedScenarioId: "balanced",
      scenarios: scenariosData,
    },
    income: {
      kicker: "Cuando te retires",
      title: "Ingreso mensual deseado",
      value: 45000,
      min: 25000,
      max: 80000,
      step: 2500,
      description: "Necesitarías aproximadamente",
      suffix: "/ mes",
      percentLabel: "85%",
      note: "Esto representa el 85% de tu ingreso actual.",
    },
    expenses: {
      kicker: "Tu vida hoy",
      title: "Desglose de gastos",
      expenses: expensesData,
      centerValue: "$45k",
      centerLabel: "mensuales",
      footerText: `Disponible estimado: ${formatMXN(45000 - expensesData.reduce((sum, item) => sum + item.amount, 0))}`,
    },
    cta: {
      title: "Vas por buen camino.",
      description: "Pequeños cambios hoy pueden hacer una gran diferencia mañana.",
      actionLabel: "Siguiente paso",
      actionDescription: "Revisa tu plan personalizado",
      action: "confirmPlan",
    },
    recommendations: {
      kicker: "Tips personalizados",
      title: "Qué hacer ahora",
      items: [
        {
          title: "Empieza con una aportación automática",
          description: "Programa una aportación mensual para convertir el ahorro en hábito.",
          impact: "Primer paso claro para avanzar.",
        },
      ],
    },
    disclaimer: "Esta proyección es estimativa y no constituye asesoría financiera.",
  }
}

export default function GeneratedRetirementPage({ dashboard, onRestart }) {
  const config = dashboard || buildDefaultDashboard()
  const [contribution, setContribution] = useState(config.contribution.value)
  const [selectedScenarioId, setSelectedScenarioId] = useState(config.scenarios.selectedScenarioId)
  const isRetiredDashboard = config.mode === "retired"

  const contributionMessage = useMemo(
    () => contribution >= 10000 ? "Vas adelantando tu objetivo." : config.cta.title,
    [contribution],
  )

  return (
    <div className="generated-retirement-page">
      <AppHeader
        brandInitial={config.header.brandInitial}
        brandName={config.header.brandName}
        navItems={config.header.navItems}
        userInitial={config.header.userInitial}
        userName={config.header.userName}
      />
      <main className="generated-retirement-page__main" id="resumen">
        <section className="generated-retirement-page__hero">
          <div>
            <p className="generated-retirement-page__eyebrow">{config.hero.eyebrow}</p>
            <h1 className="generated-retirement-page__title">{config.hero.title}</h1>
            <p className="generated-retirement-page__subtitle">
              {config.hero.subtitle}
            </p>
          </div>
          <div className="generated-retirement-page__hero-actions">
            <Badge dot variant="success">{config.hero.status}</Badge>
            {onRestart && <Button onClick={onRestart} size="sm" variant="secondary">Editar perfil</Button>}
          </div>
        </section>

        <section className="generated-retirement-page__grid">
          <div className="generated-retirement-page__wide">
            <TimelineSummary
              action={<IconButton ariaLabel="Ver ayuda de línea de tiempo"><CircleHelp aria-hidden="true" /></IconButton>}
              helperText={config.timeline.helperText}
              kicker={config.timeline.kicker}
              metrics={config.timeline.metrics}
              points={config.timeline.points}
              title={config.timeline.title}
            />
          </div>
          <GoalSummary
            action={<IconButton ariaLabel="Editar objetivo"><Pencil aria-hidden="true" /></IconButton>}
            bodyText={config.goal.bodyText}
            currentValue={config.goal.currentValue}
            footerLabel={config.goal.footerLabel}
            highlightText={config.goal.highlightText}
            kicker={config.goal.kicker}
            targetValue={config.goal.targetValue}
            title={config.goal.title}
          />
          {!isRetiredDashboard && (
            <div className="generated-retirement-page__wide">
            <ProjectionChart
              data={config.projection.data}
              kicker={config.projection.kicker}
              mode={config.projection.mode}
              series={config.projection.series}
              title={config.projection.title}
            />
            </div>
          )}
          <ContributionControl
            action={<SlidersHorizontal color="var(--color-text-muted)" aria-hidden="true" />}
            badge={config.contribution.badge}
            kicker={config.contribution.kicker}
            max={config.contribution.max}
            min={config.contribution.min}
            note={config.contribution.note}
            onChange={setContribution}
            step={config.contribution.step}
            suffix={config.contribution.suffix}
            title={config.contribution.title}
            value={contribution}
          />
          {!isRetiredDashboard && (
            <ScenarioComparison
              action={<button className="segmented-control__item" type="button">Ver detalles</button>}
              kicker={config.scenarios.kicker}
              onSelectScenario={setSelectedScenarioId}
              scenarios={config.scenarios.scenarios}
              selectedScenarioId={selectedScenarioId}
              selectedLabel={config.scenarios.selectedLabel}
              title={config.scenarios.title}
            />
          )}
          <MonthlyIncomeControl
            action={<IconButton ariaLabel="Editar ingreso"><Pencil aria-hidden="true" /></IconButton>}
            description={config.income.description}
            kicker={config.income.kicker}
            max={config.income.max}
            min={config.income.min}
            note={config.income.note}
            percentLabel={config.income.percentLabel}
            step={config.income.step}
            suffix={config.income.suffix}
            title={config.income.title}
            value={config.income.value}
          />
          <ExpenseBreakdown
            centerLabel={config.expenses.centerLabel}
            centerValue={config.expenses.centerValue}
            expenses={config.expenses.expenses}
            footerText={config.expenses.footerText}
            kicker={config.expenses.kicker}
            title={config.expenses.title}
          />
          <div className="generated-retirement-page__wide">
            <RecommendationList
              items={config.recommendations.items}
              kicker={config.recommendations.kicker}
              title={config.recommendations.title}
            />
          </div>
        </section>

        <section className="generated-retirement-page__cta" id="ayuda">
          <div className="generated-retirement-page__cta-copy">
            <Title size="sm">{contributionMessage}</Title>
            <Text>{config.cta.description}</Text>
          </div>
          <ActionPrompt
            action={config.cta.action}
            description={config.cta.actionDescription}
            label={config.cta.actionLabel}
            onAction={(action, payload) => console.log("action_requested", { action, payload })}
          />
        </section>

        <p className="generated-retirement-page__disclaimer">
          {config.disclaimer}
        </p>
      </main>
    </div>
  )
}
