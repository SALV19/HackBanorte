import { useState } from "react"
import Badge from "../atoms/Badge.jsx"
import Button from "../atoms/Button.jsx"
import CardContainer from "../atoms/CardContainer.jsx"
import NumberInput from "../atoms/NumberInput.jsx"
import Text from "../atoms/Text.jsx"
import TextInput from "../atoms/TextInput.jsx"
import Title from "../atoms/Title.jsx"
import AppHeader from "../molecules/AppHeader.jsx"
import OptionGroup from "../molecules/OptionGroup.jsx"
import { navItems } from "../../data/demoRetirementData.js"
import { generateDashboardFromProfile } from "../../services/retirementProfileApi.js"
import "../../css/pages/profile-selection-page.css"

const profileTypeOptions = [
  { value: "starter", label: "Estoy empezando", description: "Quiero entender cuánto ahorrar." },
  { value: "planning", label: "Ya ahorro", description: "Quiero saber si voy bien." },
  { value: "near_retirement", label: "Estoy cerca", description: "Quiero afinar mi plan." },
  { value: "retired", label: "Ya estoy pensionado", description: "Quiero administrar mi ingreso." },
]

const riskOptions = [
  { value: "conservative", label: "Conservador", description: "Prefiero estabilidad." },
  { value: "balanced", label: "Equilibrado", description: "Busco balance entre riesgo y crecimiento." },
  { value: "dynamic", label: "Dinámico", description: "Acepto más riesgo por mayor rendimiento." },
]

const goalOptions = [
  { value: "know_if_on_track", label: "Saber si voy bien", description: "Quiero claridad sobre mi avance." },
  { value: "save_more", label: "Ahorrar más", description: "Quiero mejorar mi aportación." },
  { value: "compare_scenarios", label: "Comparar escenarios", description: "Quiero ver diferentes caminos." },
  { value: "reduce_expenses", label: "Reducir gastos", description: "Quiero optimizar mi flujo mensual." },
]

export default function ProfileSelectionPage({ onDashboardGenerated }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState({
    name: "Mariana",
    profileType: "planning",
    currentAge: 28,
    retirementAge: 67,
    currentSavings: 180000,
    monthlyContribution: 7500,
    desiredMonthlyIncome: 45000,
    riskTolerance: "balanced",
    mainGoal: "know_if_on_track",
  })

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    const dashboard = await generateDashboardFromProfile(profile)
    onDashboardGenerated({ profile, dashboard })
    setIsSubmitting(false)
  }

  return (
    <div className="profile-selection-page">
      <AppHeader
        brandInitial="P"
        brandName="Planifica"
        navItems={navItems}
        userInitial={profile.name.charAt(0).toUpperCase()}
        userName={profile.name}
      />
      <main className="profile-selection-page__main">
        <section className="profile-selection-page__hero">
          <Badge>Perfilamiento inteligente</Badge>
          <h1 className="profile-selection-page__title">Personaliza tu espacio financiero</h1>
          <p className="profile-selection-page__subtitle">
            Responde estas preguntas para generar un dashboard con los componentes correctos para tu etapa.
          </p>
        </section>

        <form className="profile-form" onSubmit={handleSubmit}>
          <CardContainer>
            <div className="profile-form__grid">
              <label className="profile-form__field">
                <Title level={3} size="sm">Nombre</Title>
                <TextInput ariaLabel="Nombre" onChange={(value) => updateProfile("name", value)} value={profile.name} />
              </label>
              <label className="profile-form__field">
                <Title level={3} size="sm">Edad actual</Title>
                <NumberInput ariaLabel="Edad actual" onChange={(value) => updateProfile("currentAge", value)} value={profile.currentAge} />
              </label>
              <label className="profile-form__field">
                <Title level={3} size="sm">Edad objetivo</Title>
                <NumberInput ariaLabel="Edad objetivo de retiro" onChange={(value) => updateProfile("retirementAge", value)} value={profile.retirementAge} />
              </label>
              <label className="profile-form__field">
                <Title level={3} size="sm">Ahorro actual</Title>
                <NumberInput ariaLabel="Ahorro actual" onChange={(value) => updateProfile("currentSavings", value)} step={1000} value={profile.currentSavings} />
              </label>
              <label className="profile-form__field">
                <Title level={3} size="sm">Aportación mensual</Title>
                <NumberInput ariaLabel="Aportación mensual" onChange={(value) => updateProfile("monthlyContribution", value)} step={500} value={profile.monthlyContribution} />
              </label>
              <label className="profile-form__field">
                <Title level={3} size="sm">Ingreso mensual deseado</Title>
                <NumberInput ariaLabel="Ingreso mensual deseado" onChange={(value) => updateProfile("desiredMonthlyIncome", value)} step={1000} value={profile.desiredMonthlyIncome} />
              </label>
            </div>
          </CardContainer>

          <OptionGroup
            label="¿En qué etapa estás?"
            onChange={(value) => updateProfile("profileType", value)}
            options={profileTypeOptions}
            value={profile.profileType}
          />

          <OptionGroup
            label="¿Qué nivel de riesgo prefieres?"
            onChange={(value) => updateProfile("riskTolerance", value)}
            options={riskOptions}
            value={profile.riskTolerance}
          />

          <OptionGroup
            label="¿Cuál es tu prioridad principal?"
            onChange={(value) => updateProfile("mainGoal", value)}
            options={goalOptions}
            value={profile.mainGoal}
          />

          <div className="profile-form__actions">
            <Text className="profile-form__note">
              Este submit simula el envío al backend. Luego se cambia por la ruta real que llame a Gemini.
            </Text>
            <Button disabled={isSubmitting} size="lg" type="submit">
              {isSubmitting ? "Generando..." : "Generar mi dashboard"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
