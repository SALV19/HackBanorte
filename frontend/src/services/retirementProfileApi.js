import {
  expensesData,
  navItems,
  projectionSeries,
  scenariosData,
} from "../data/demoRetirementData.js"

function buildProjection(profile) {
  const yearsLeft = Math.max(1, profile.retirementAge - profile.currentAge)
  const step = Math.max(1, Math.floor(yearsLeft / 6))

  return Array.from({ length: 7 }, (_, index) => {
    const age = Math.min(profile.retirementAge, profile.currentAge + step * index)
    const years = Math.max(0, age - profile.currentAge)
    const base = profile.currentSavings + profile.monthlyContribution * 12 * years
    const growthFactor = 1 + years * 0.045

    return {
      age,
      conservative: Math.round(base * (growthFactor * 0.82)),
      expected: Math.round(base * (growthFactor * 1.08)),
      optimistic: Math.round(base * (growthFactor * 1.34)),
    }
  })
}

function inferTargetSavings(profile) {
  const retirementYears = profile.profileType === "retired" ? 18 : 20
  return profile.desiredMonthlyIncome * 12 * retirementYears
}

function buildExpenses(profile) {
  const monthlyIncome = Math.max(profile.desiredMonthlyIncome, 1)
  return expensesData.map((expense) => ({
    ...expense,
    amount: Math.round(monthlyIncome * (expense.value / 100)),
  }))
}

export async function generateDashboardFromProfile(profile) {
  const targetSavings = inferTargetSavings(profile)
  const yearsLeft = Math.max(0, profile.retirementAge - profile.currentAge)
  const progress = targetSavings <= 0 ? 0 : profile.currentSavings / targetSavings
  const midpointAge = Math.round((profile.currentAge + profile.retirementAge) / 2)
  const expenses = buildExpenses(profile)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const generatedDashboard = {
    header: {
      brandInitial: "P",
      brandName: "Planifica",
      navItems,
      userInitial: profile.name.charAt(0).toUpperCase(),
      userName: profile.name,
    },
    hero: {
      eyebrow: "Tu espacio financiero",
      title: `Hola, ${profile.name}`,
      subtitle: "Aquí tienes una vista clara de tu camino hacia el retiro.",
      status: "Plan actualizado hoy",
    },
    timeline: {
      kicker: "Tu línea de tiempo",
      title: "El camino hacia tu retiro",
      helperText: yearsLeft > 0 ? `Te faltan ${yearsLeft} años para tu retiro.` : "Ya estás en etapa de retiro.",
      points: [
        { value: `${profile.currentAge} años`, label: "Hoy", completed: true, color: "var(--color-primary)" },
        { value: `${midpointAge} años`, label: "Mitad", completed: true, color: "var(--color-primary)" },
        { value: `${profile.retirementAge} años`, label: "Retiro", completed: false, color: "var(--color-red-light)" },
      ],
      metrics: [
        { label: "Ahorrado hasta hoy", amount: profile.currentSavings, variant: "warm" },
        { label: "Años para disfrutar", value: "20 años" },
      ],
    },
    goal: {
      kicker: "Tu objetivo",
      title: `Retirarte a los ${profile.retirementAge}`,
      currentValue: profile.currentSavings,
      targetValue: targetSavings,
      bodyText: progress >= 0.7
        ? "Vas por buen camino. Has avanzado más de la mitad hacia tu meta."
        : "Todavía hay espacio para fortalecer tu plan de ahorro.",
      highlightText: yearsLeft > 0 ? `Faltan ${yearsLeft} años` : "Meta en etapa activa",
      footerLabel: "Meta estimada",
    },
    projection: {
      kicker: "Proyección de crecimiento",
      title: "Tu dinero con el tiempo",
      data: buildProjection(profile),
      series: projectionSeries,
      mode: "area",
    },
    contribution: {
      kicker: "Ajusta tu estrategia",
      title: "Aportación mensual",
      value: profile.monthlyContribution,
      min: 500,
      max: Math.max(15000, profile.monthlyContribution * 2),
      step: 500,
      badge: profile.riskTolerance === "dynamic" ? "Perfil dinámico" : "Plan ajustable",
      suffix: "al mes",
      note: "Con esta aportación puedes actualizar tu proyección en tiempo real.",
    },
    scenarios: {
      kicker: "Compara opciones",
      title: "Encuentra tu escenario",
      selectedLabel: "Tu selección",
      selectedScenarioId: profile.riskTolerance,
      scenarios: scenariosData,
    },
    income: {
      kicker: profile.profileType === "retired" ? "Ingreso actual" : "Cuando te retires",
      title: "Ingreso mensual deseado",
      value: profile.desiredMonthlyIncome,
      min: 10000,
      max: Math.max(80000, profile.desiredMonthlyIncome * 2),
      step: 2500,
      description: "Necesitarías aproximadamente",
      suffix: "/ mes",
      percentLabel: "85%",
      note: "Este valor ayuda a estimar la meta de ahorro.",
    },
    expenses: {
      kicker: "Tu vida hoy",
      title: "Desglose de gastos",
      expenses,
      centerValue: `$${Math.round(totalExpenses / 1000)}k`,
      centerLabel: "mensuales",
      footerText: `Disponible estimado: ${new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
      }).format(profile.desiredMonthlyIncome - totalExpenses)}`,
    },
    cta: {
      title: profile.mainGoal === "reduce_expenses" ? "Enfoquémonos en optimizar tus gastos." : "Vas por buen camino.",
      description: "Pequeños cambios hoy pueden hacer una gran diferencia mañana.",
      actionLabel: "Siguiente paso",
      actionDescription: "Revisa tu plan personalizado",
      action: "confirmPlan",
    },
    disclaimer: "Esta proyección es estimativa y no constituye asesoría financiera.",
  }

  return new Promise((resolve) => {
    window.setTimeout(() => resolve(generatedDashboard), 350)
  })
}
