import { useEffect, useState } from "react"
import Badge from "../atoms/Badge.jsx"
import Button from "../atoms/Button.jsx"
import CardContainer from "../atoms/CardContainer.jsx"
import Text from "../atoms/Text.jsx"
import TextArea from "../atoms/TextArea.jsx"
import Title from "../atoms/Title.jsx"
import AppHeader from "../molecules/AppHeader.jsx"
import { navItems } from "../../data/demoRetirementData.js"
import { getRegisteredUser, getRegisteredUsers, sendFinancialMessage } from "../../services/retirementProfileApi.js"
import "../../css/pages/profile-selection-page.css"

export default function ProfileSelectionPage({ onDashboardGenerated }) {
  const [users, setUsers] = useState([])
  const [selectedName, setSelectedName] = useState("")
  const [profile, setProfile] = useState(null)
  const [question, setQuestion] = useState("¿Cómo están mis gastos y qué puedo mejorar?")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { getRegisteredUsers().then(({ users }) => { setUsers(users); if (users[0]) setSelectedName(users[0].name) }).catch((err) => setError(err.message)) }, [])
  useEffect(() => { if (!selectedName) return; setProfile(null); getRegisteredUser(selectedName).then(setProfile).catch((err) => setError(err.message)) }, [selectedName])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!selectedName || !question.trim()) return
    setIsSubmitting(true); setError("")
    try {
      const result = await sendFinancialMessage({ userName: selectedName, content: question.trim() })
      onDashboardGenerated({ profile: profile?.user, response: result.message })
    } catch (err) { setError(err.message) } finally { setIsSubmitting(false) }
  }

  return <div className="profile-selection-page">
    <AppHeader brandInitial="P" brandName="Planifica" navItems={navItems} userInitial={(selectedName[0] ?? "P").toUpperCase()} userName={selectedName || "Perfil"} />
    <main className="profile-selection-page__main"><section className="profile-selection-page__hero"><Badge>Asesor financiero inteligente</Badge><h1 className="profile-selection-page__title">Consulta tu información financiera</h1><p className="profile-selection-page__subtitle">Selecciona un perfil registrado. Sus datos y movimientos disponibles se usarán para construir una respuesta personalizada.</p></section>
      <form className="profile-form" onSubmit={handleSubmit}><CardContainer><label className="profile-form__field"><Title level={3} size="sm">Perfil registrado</Title><select className="text-input" aria-label="Perfil registrado" value={selectedName} onChange={(event) => setSelectedName(event.target.value)}>{users.map((user) => <option key={user._id} value={user.name}>{user.name}</option>)}</select></label>
        {profile && <div className="profile-form__grid profile-form__read-only"><div><Text tone="muted" size="sm">Edad</Text><Text bold>{profile.user.age} años</Text></div><div><Text tone="muted" size="sm">Ocupación</Text><Text bold>{profile.user.job}</Text></div><div><Text tone="muted" size="sm">Último ingreso registrado</Text><Text bold>${profile.finance.income.toLocaleString("es-MX")}</Text></div><div><Text tone="muted" size="sm">Últimos gastos registrados</Text><Text bold>${profile.finance.expenses.toLocaleString("es-MX")}</Text></div></div>}</CardContainer>
        <CardContainer><label className="profile-form__field"><Title level={3} size="sm">¿Qué quieres consultar?</Title><Text>Por ejemplo: “Dame un reporte de gastos”, “pronostica mis ingresos” o “ayúdame con mi retiro”.</Text><TextArea ariaLabel="Consulta financiera" value={question} onChange={setQuestion} /></label></CardContainer>
        {error && <Text tone="danger">{error}</Text>}<div className="profile-form__actions"><Text className="profile-form__note">El servidor identifica la intención, consulta los movimientos mediante herramientas y genera la interfaz A2UI.</Text><Button disabled={isSubmitting || !profile} size="lg" type="submit">{isSubmitting ? "Consultando…" : "Consultar"}</Button></div></form>
    </main>
  </div>
}
