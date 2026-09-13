import { useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import AppHeader from "../molecules/AppHeader.jsx"
import CardContainer from "../atoms/CardContainer.jsx"
import Button from "../atoms/Button.jsx"
import Text from "../atoms/Text.jsx"
import TextArea from "../atoms/TextArea.jsx"
import Title from "../atoms/Title.jsx"
import { navItems } from "../../data/demoRetirementData.js"
import { sendFinancialMessage } from "../../services/retirementProfileApi.js"
import "../../css/pages/generated-retirement-page.css"

function A2uiComponent({ component, onAction }) {
  if (component.tipo === "texto") return <CardContainer><Text>{component.contenido}</Text></CardContainer>
  if (component.tipo === "tarjeta_resultado") return <CardContainer><Text tone="muted">{component.titulo}</Text><Title level={2}>{component.valor}</Title></CardContainer>
  if (component.tipo === "grafica") return <CardContainer className="a2ui-chart"><Title level={3} size="sm">Proyección</Title><ResponsiveContainer width="100%" height={240}><LineChart data={component.series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="etiqueta" /><YAxis /><Tooltip /><Line type="monotone" dataKey="valor" stroke="var(--color-primary)" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContainer>
  if (component.tipo === "opciones") return <CardContainer><Title level={3} size="sm">{component.pregunta}</Title><div className="a2ui-options">{component.opciones.map((option) => <Button key={option.id} variant="secondary" onClick={() => onAction(option.texto)}>{option.texto}</Button>)}</div></CardContainer>
  if (component.tipo === "formulario") return <CardContainer><Title level={3} size="sm">Información necesaria</Title>{component.campos.map((field) => <label className="profile-form__field" key={field.nombre}><Text>{field.etiqueta}</Text><input className="text-input" name={field.nombre} type={field.tipo === "numero" ? "number" : field.tipo === "fecha" ? "date" : "text"} /></label>)}</CardContainer>
  if (component.tipo === "boton_confirmacion") return <Button onClick={() => onAction(component.accion)}>{component.etiqueta}</Button>
  return null
}

export default function GeneratedRetirementPage({ result, onRestart }) {
  const [question, setQuestion] = useState("")
  const [current, setCurrent] = useState(result.response)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const profile = result.profile
  const components = current?.componentes?.componentes ?? []
  async function ask(content) {
    if (!content.trim() || !profile) return
    setLoading(true); setError("")
    try { const response = await sendFinancialMessage({ userName: profile.name, content, conversationId: current.conversationId }); setCurrent(response.message); setQuestion("") }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  return <div className="generated-retirement-page"><AppHeader brandInitial="P" brandName="Planifica" navItems={navItems} userInitial={profile?.name?.[0] ?? "P"} userName={profile?.name ?? "Perfil"} />
    <main className="generated-retirement-page__main"><section className="generated-retirement-page__hero"><div><p className="generated-retirement-page__eyebrow">Respuesta personalizada</p><h1 className="generated-retirement-page__title">{current?.componentes?.mensaje ?? "Tu consulta financiera"}</h1><p className="generated-retirement-page__subtitle">Intención detectada: {current?.intention ?? "consulta"}</p></div><Button variant="secondary" onClick={onRestart}>Cambiar perfil</Button></section>
      <section className="generated-retirement-page__grid a2ui-grid">{components.map((component) => <A2uiComponent component={component} key={component.id} onAction={ask} />)}</section>
      <CardContainer className="a2ui-followup"><Title level={3} size="sm">Haz otra consulta</Title><TextArea value={question} onChange={setQuestion} ariaLabel="Nueva consulta" placeholder="Ej. Pronostica mis gastos para los próximos tres meses" /><Button disabled={loading} onClick={() => ask(question)}>{loading ? "Consultando…" : "Enviar consulta"}</Button>{error && <Text tone="danger">{error}</Text>}</CardContainer>
    </main>
  </div>
}
