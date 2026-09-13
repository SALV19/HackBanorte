export const projectionData = [
  { age: 28, optimistic: 220000, expected: 180000, conservative: 145000 },
  { age: 35, optimistic: 820000, expected: 640000, conservative: 480000 },
  { age: 42, optimistic: 1780000, expected: 1320000, conservative: 930000 },
  { age: 49, optimistic: 3300000, expected: 2380000, conservative: 1580000 },
  { age: 56, optimistic: 5650000, expected: 3820000, conservative: 2390000 },
  { age: 63, optimistic: 9200000, expected: 5900000, conservative: 3430000 },
  { age: 67, optimistic: 12300000, expected: 7600000, conservative: 4200000 },
]

export const expensesData = [
  { label: 'Vivienda', value: 36, amount: 16200, color: 'var(--color-primary)' },
  { label: 'Alimentos', value: 24, amount: 10800, color: 'var(--color-red-light)' },
  { label: 'Transporte', value: 16, amount: 7200, color: 'var(--color-gray-300)' },
  { label: 'Entretenimiento', value: 14, amount: 6300, color: 'var(--color-gray-200)' },
  { label: 'Otros', value: 10, amount: 4500, color: 'var(--color-gray-500)' },
]

export const scenariosData = [
  {
    id: 'conservative',
    label: 'Conservador',
    annualReturn: 4.5,
    chartMetrics: [
      { subject: 'Crecimiento', value: 45 },
      { subject: 'Estabilidad', value: 95 },
      { subject: 'Liquidez', value: 80 },
      { subject: 'Riesgo', value: 25 },
    ],
  },
  {
    id: 'balanced',
    label: 'Equilibrado',
    annualReturn: 7,
    chartMetrics: [
      { subject: 'Crecimiento', value: 72 },
      { subject: 'Estabilidad', value: 72 },
      { subject: 'Liquidez', value: 60 },
      { subject: 'Riesgo', value: 58 },
    ],
  },
  {
    id: 'dynamic',
    label: 'Dinámico',
    annualReturn: 9.5,
    chartMetrics: [
      { subject: 'Crecimiento', value: 95 },
      { subject: 'Estabilidad', value: 45 },
      { subject: 'Liquidez', value: 60 },
      { subject: 'Riesgo', value: 90 },
    ],
  },
]

export const projectionSeries = [
  { key: 'optimistic', label: 'Optimista', color: 'var(--color-red-light)', strokeWidth: 2 },
  { key: 'expected', label: 'Esperada', color: 'var(--color-primary)', fill: true, strokeWidth: 2.5 },
  { key: 'conservative', label: 'Conservadora', color: 'var(--color-gray-500)', strokeWidth: 2 },
]

export const navItems = [
  { href: '#resumen', label: 'Mi plan', active: true },
  { href: '#proyeccion', label: 'Proyección' },
  { href: '#escenarios', label: 'Escenarios' },
  { href: '#ayuda', label: 'Ayuda' },
]
