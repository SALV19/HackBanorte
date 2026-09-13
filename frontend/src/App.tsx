import { useMemo, useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Pencil,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react'
import './App.css'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)

const projection = [
  { age: 28, optimistic: 220000, expected: 180000, conservative: 145000 },
  { age: 35, optimistic: 820000, expected: 640000, conservative: 480000 },
  { age: 42, optimistic: 1780000, expected: 1320000, conservative: 930000 },
  { age: 49, optimistic: 3300000, expected: 2380000, conservative: 1580000 },
  { age: 56, optimistic: 5650000, expected: 3820000, conservative: 2390000 },
  { age: 63, optimistic: 9200000, expected: 5900000, conservative: 3430000 },
  { age: 67, optimistic: 12300000, expected: 7600000, conservative: 4200000 },
]

const expenses = [
  { label: 'Vivienda', value: 36, color: '#EF2945' },
  { label: 'Alimentos', value: 24, color: '#f37483' },
  { label: 'Transporte', value: 16, color: '#f8aab3' },
  { label: 'Entretenimiento', value: 14, color: '#fbcbd0' },
  { label: 'Otros', value: 10, color: '#e5e7eb' },
]

function Card({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section className={`plan-card ${className}`} id={id}>{children}</section>
}

function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-logo">P</div>
        <span>Planifica</span>
      </div>
      <nav className="nav-links" aria-label="Navegación principal">
        <a href="#resumen">Mi plan</a>
        <a href="#proyeccion">Proyección</a>
        <a href="#escenarios">Escenarios</a>
        <a href="#ayuda">Ayuda</a>
      </nav>
      <button className="profile-button" type="button" aria-label="Abrir perfil de Mariana">
        <span className="profile-avatar">M</span>
        <span>Mariana</span>
        <ChevronDown aria-hidden="true" />
      </button>
    </header>
  )
}

function Timeline() {
  return (
    <Card className="timeline-card wide-card">
      <div className="card-header">
        <div>
          <p className="card-kicker">Tu línea de tiempo</p>
          <h2>El camino hacia tu retiro</h2>
        </div>
        <CircleHelp className="muted-icon" aria-hidden="true" />
      </div>
      <div className="timeline-rail" aria-label="Línea de tiempo de retiro">
        {[
          ['28', 'Hoy', 'active'],
          ['48', 'Mitad', 'active'],
          ['67', 'Retiro', 'future'],
        ].map(([age, label, state]) => (
          <div className="timeline-point" key={age}>
            <span className={`timeline-dot ${state === 'future' ? 'timeline-dot-soft' : ''}`} />
            <strong>{age} años</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="metric-grid">
        <div className="metric-tile metric-tile-warm">
          <p>Ahorrado hasta hoy</p>
          <strong>{formatMoney(180000)}</strong>
        </div>
        <div className="metric-tile">
          <p>Años para disfrutar</p>
          <strong>20 años</strong>
        </div>
      </div>
    </Card>
  )
}

function GoalCard() {
  return (
    <Card>
      <div className="card-header">
        <div>
          <p className="card-kicker">Tu objetivo</p>
          <h2>Retirarte a los 67</h2>
        </div>
        <button className="icon-button" type="button" aria-label="Editar objetivo">
          <Pencil aria-hidden="true" />
        </button>
      </div>
      <div className="goal-body">
        <div className="progress-ring" aria-label="70 por ciento alcanzado">
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#f3f3f3" strokeWidth="4" />
            <circle cx="20" cy="20" r="16" fill="none" stroke="#EF2945" strokeDasharray="70 100" strokeLinecap="round" strokeWidth="4" />
          </svg>
          <span>70%</span>
        </div>
        <div>
          <p>Vas por buen camino. Has avanzado más de la mitad hacia tu meta.</p>
          <strong>Faltan 39 años</strong>
        </div>
      </div>
      <div className="divider-row">
        <span>Meta estimada</span>
        <strong>{formatMoney(7600000)}</strong>
      </div>
    </Card>
  )
}

function ProjectionChart({ mode }: { mode: 'line' | 'area' }) {
  return (
    <Card className="wide-card" id="proyeccion">
      <div className="card-header">
        <div>
          <p className="card-kicker">Proyección de crecimiento</p>
          <h2>Tu dinero con el tiempo</h2>
        </div>
        <div className="segmented-control" aria-label="Tipo de gráfica">
          <button className={mode === 'area' ? 'active' : ''} type="button">Área</button>
          <button className={mode === 'line' ? 'active' : ''} type="button">Líneas</button>
        </div>
      </div>
      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projection} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="expectedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF2945" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#EF2945" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#eeeeee" />
            <XAxis dataKey="age" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(value) => `${value}a`} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#888' }} tickFormatter={(value) => `${Number(value) / 1000000}M`} />
            <Tooltip formatter={(value) => formatMoney(Number(value))} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Area type="monotone" dataKey="optimistic" name="Optimista" stroke="#f5a2ac" fill="none" strokeWidth={2} />
            <Area type="monotone" dataKey="expected" name="Esperada" stroke="#EF2945" fill={mode === 'area' ? 'url(#expectedFill)' : 'none'} strokeWidth={2.5} />
            <Area type="monotone" dataKey="conservative" name="Conservadora" stroke="#b9b9b9" fill="none" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function ContributionSlider({ value, setValue }: { value: number; setValue: (value: number) => void }) {
  return (
    <Card>
      <div className="card-header">
        <div>
          <p className="card-kicker">Ajusta tu estrategia</p>
          <h2>Aportación mensual</h2>
        </div>
        <SlidersHorizontal className="muted-icon" aria-hidden="true" />
      </div>
      <div className="amount-row">
        <div>
          <strong>{formatMoney(value)}</strong>
          <span>al mes</span>
        </div>
        <span className="soft-badge">+{Math.round(value / 2500)}% vs. actual</span>
      </div>
      <input aria-label="Aportación mensual" className="range-input" max="15000" min="2500" onChange={(event) => setValue(Number(event.target.value))} step="500" type="range" value={value} />
      <div className="range-labels">
        <span>{formatMoney(2500)}</span>
        <span>{formatMoney(15000)}</span>
      </div>
      <p className="trend-note"><TrendingUp aria-hidden="true" /> Con esta aportación alcanzarías tu meta en tiempo.</p>
    </Card>
  )
}

function ScenarioCard() {
  const [selected, setSelected] = useState('Equilibrado')
  const data = [
    { subject: 'Crecimiento', value: selected === 'Dinámico' ? 95 : selected === 'Equilibrado' ? 72 : 45 },
    { subject: 'Estabilidad', value: selected === 'Conservador' ? 95 : selected === 'Equilibrado' ? 72 : 45 },
    { subject: 'Liquidez', value: selected === 'Conservador' ? 80 : 60 },
    { subject: 'Riesgo', value: selected === 'Dinámico' ? 90 : selected === 'Equilibrado' ? 58 : 25 },
  ]

  return (
    <Card id="escenarios">
      <div className="card-header">
        <div>
          <p className="card-kicker">Compara opciones</p>
          <h2>Encuentra tu escenario</h2>
        </div>
        <button className="text-button" type="button">Ver detalles</button>
      </div>
      <div className="scenario-tabs">
        {['Conservador', 'Equilibrado', 'Dinámico'].map((item) => (
          <button className={`scenario-tab ${selected === item ? 'selected' : ''}`} key={item} onClick={() => setSelected(item)} type="button">
            <span>{item}</span>
            <strong>{item === 'Conservador' ? '4.5%' : item === 'Equilibrado' ? '7.0%' : '9.5%'} anual</strong>
          </button>
        ))}
      </div>
      <div className="radar-box">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#777' }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="#EF2945" fill="#EF2945" fillOpacity={0.18} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="selected-copy">Tu selección: <strong>{selected}</strong></p>
    </Card>
  )
}

function IncomeCard() {
  const [income, setIncome] = useState(45000)
  return (
    <Card>
      <div className="card-header">
        <div>
          <p className="card-kicker">Cuando te retires</p>
          <h2>Ingreso mensual deseado</h2>
        </div>
        <button className="icon-button" type="button" aria-label="Editar ingreso"><Pencil aria-hidden="true" /></button>
      </div>
      <div className="income-row">
        <div>
          <p>Necesitarías aproximadamente</p>
          <strong>{formatMoney(income)}</strong>
          <span>/ mes</span>
        </div>
        <span className="income-percent">85%</span>
      </div>
      <input aria-label="Ingreso mensual deseado" className="range-input" max="80000" min="25000" onChange={(event) => setIncome(Number(event.target.value))} step="2500" type="range" value={income} />
      <p className="income-note">Esto representa el <strong>85%</strong> de tu ingreso actual.</p>
    </Card>
  )
}

function ExpenseBreakdown() {
  const gradient = expenses.map((expense, index) => {
    const start = expenses.slice(0, index).reduce((sum, item) => sum + item.value, 0)
    const end = expenses.slice(0, index + 1).reduce((sum, item) => sum + item.value, 0)
    return `${expense.color} ${start}% ${end}%`
  }).join(', ')

  return (
    <Card>
      <div>
        <p className="card-kicker">Tu vida hoy</p>
        <h2>Desglose de gastos</h2>
      </div>
      <div className="expense-layout">
        <div className="donut-chart" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="donut-hole"><strong>$45k</strong><small>mensuales</small></div>
        </div>
        <div className="expense-list">
          {expenses.map((expense) => (
            <div className="expense-item" key={expense.label}>
              <span style={{ backgroundColor: expense.color }} />
              <p>{expense.label}</p>
              <strong>{expense.value}%</strong>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function ActionButton() {
  return (
    <button className="action-button" type="button">
      <span><strong>Siguiente paso</strong><small>Revisa tu plan personalizado</small></span>
      <ArrowRight aria-hidden="true" />
    </button>
  )
}

export default function App() {
  const [contribution, setContribution] = useState(7500)
  const [chartMode] = useState<'line' | 'area'>('area')
  const contributionMessage = useMemo(() => contribution >= 10000 ? 'Vas adelantando tu objetivo.' : 'Vas por buen camino.', [contribution])

  return (
    <div className="app-shell">
      <Header />
      <main className="dashboard" id="resumen">
        <section className="hero-block">
          <div>
            <p className="eyebrow">Tu espacio financiero</p>
            <h1>Hola, Mariana</h1>
            <p>Aquí tienes una vista clara de tu camino hacia el retiro.</p>
          </div>
          <div className="updated-status"><span /> Plan actualizado hoy</div>
        </section>
        <section className="dashboard-grid">
          <Timeline />
          <GoalCard />
          <ProjectionChart mode={chartMode} />
          <ContributionSlider value={contribution} setValue={setContribution} />
          <ScenarioCard />
          <IncomeCard />
          <ExpenseBreakdown />
        </section>
        <section className="cta-panel" id="ayuda">
          <div>
            <h2>{contributionMessage}</h2>
            <p>Pequeños cambios hoy pueden hacer una gran diferencia mañana.</p>
          </div>
          <ActionButton />
        </section>
        <p className="disclaimer">Esta proyección es estimativa y no constituye asesoría financiera.</p>
      </main>
    </div>
  )
}
