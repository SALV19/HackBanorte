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

function classifyMvpQuery(profile) {
  const question = profile.openQuestion.toLowerCase()

  if (profile.profileType === "retired" || question.includes("pensionado") || question.includes("dure más")) {
    return "make_money_last"
  }

  if (question.includes("aportación") || question.includes("aportar") || question.includes("cambio")) {
    return "change_contribution"
  }

  if (question.includes("voy bien") || profile.mainGoal === "know_if_on_track") {
    return "on_track"
  }

  return "needed_amount"
}

function buildExpenses(profile) {
  const monthlyIncome = Math.max(profile.desiredMonthlyIncome, 1)
  return expensesData.map((expense) => ({
    ...expense,
    amount: Math.round(monthlyIncome * (expense.value / 100)),
  }))
}

function buildRecommendations(profile, mvpQuery, progress) {
  if (mvpQuery === "make_money_last") {
    return [
      {
        title: "Prioriza gastos esenciales",
        description: "Separa vivienda, salud y alimentos del resto para saber cuánto ingreso realmente necesitas proteger.",
        impact: "Primer paso: identifica gastos recortables este mes.",
      },
      {
        title: "Define una regla de retiro mensual",
        description: "Evita retirar más de lo planeado cada mes para que el capital dure más tiempo.",
        impact: "Meta sugerida: mantener disponible mensual positivo.",
      },
      {
        title: "Compara escenarios de duración",
        description: "Evalúa cuánto durarían tus ahorros con gasto actual, gasto reducido y gasto optimizado.",
        impact: "Útil para responder: ¿cómo hago que mi dinero dure más?",
      },
    ]
  }

  if (profile.currentSavings <= 0) {
    return [
      {
        title: "Empieza con una aportación automática",
        description: `Programa una aportación mensual inicial de ${new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          maximumFractionDigits: 0,
        }).format(profile.monthlyContribution)} para crear el hábito antes de optimizar rendimiento.`,
        impact: "Acción inmediata: automatizar el primer depósito.",
      },
      {
        title: "Construye tu primer colchón",
        description: "Antes de subir mucho el riesgo, separa ahorro de emergencia y ahorro para retiro.",
        impact: "Reduce la probabilidad de retirar tu inversión antes de tiempo.",
      },
      {
        title: "Mide avance mensual, no solo la meta final",
        description: "Tu meta total puede verse lejana; conviértela en objetivos de 3, 6 y 12 meses.",
        impact: "Primer hito sugerido: juntar 3 meses de aportaciones.",
      },
    ]
  }

  if (mvpQuery === "change_contribution") {
    return [
      {
        title: "Prueba incrementos pequeños",
        description: "Subir tu aportación en bloques manejables te permite ver impacto sin romper tu presupuesto.",
        impact: "Usa el slider para comparar escenarios.",
      },
      {
        title: "Aumenta al recibir ingresos extra",
        description: "Bonos, aguinaldo o aumentos pueden acelerar tu retiro sin afectar tu gasto mensual base.",
        impact: "Buen candidato para automatizar aportaciones extraordinarias.",
      },
    ]
  }

  return [
    {
      title: progress >= 0.7 ? "Mantén el ritmo" : "Cierra la brecha principal",
      description: progress >= 0.7
        ? "Tu avance es sólido; el foco está en sostener aportaciones y revisar riesgo."
        : "Tu dashboard muestra una brecha contra la meta. Ajusta aportación, edad objetivo o ingreso deseado.",
      impact: progress >= 0.7 ? "Revisa una vez al mes." : "Empieza comparando escenarios.",
    },
    {
      title: "Valida tu ingreso objetivo",
      description: "Una meta mensual demasiado alta puede inflar el monto necesario para retirarte.",
      impact: "Ajusta el ingreso mensual deseado para ver sensibilidad.",
    },
  ]
}

export async function generateDashboardFromProfile(profile) {
  const mvpQuery = classifyMvpQuery(profile)
  const targetSavings = inferTargetSavings(profile)
  const yearsLeft = Math.max(0, profile.retirementAge - profile.currentAge)
  const progress = targetSavings <= 0 ? 0 : profile.currentSavings / targetSavings
  const midpointAge = Math.round((profile.currentAge + profile.retirementAge) / 2)
  const expenses = buildExpenses(profile)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const isRetired = mvpQuery === "make_money_last"

  const generatedDashboard = {
    mode: isRetired ? "retired" : "planning",
    mvpQuery,
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
      subtitle: isRetired
        ? "Aquí tienes una vista clara para administrar tu ingreso y cuidar que tu dinero dure más."
        : "Aquí tienes una vista clara de tu camino hacia el retiro.",
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
      title: isRetired ? "Hacer que tu dinero dure más" : `Retirarte a los ${profile.retirementAge}`,
      currentValue: profile.currentSavings,
      targetValue: targetSavings,
      bodyText: progress >= 0.7
        ? "Vas por buen camino. Has avanzado más de la mitad hacia tu meta."
        : profile.currentSavings <= 0
          ? "Hoy estás empezando desde cero. Lo importante es activar el primer hábito y medir avances pequeños."
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
      title: isRetired ? "Retiro mensual sugerido" : "Aportación mensual",
      value: profile.monthlyContribution,
      min: 500,
      max: Math.max(15000, profile.monthlyContribution * 2),
      step: 500,
      badge: profile.riskTolerance === "dynamic" ? "Perfil dinámico" : "Plan ajustable",
      suffix: isRetired ? "de retiro" : "al mes",
      note: isRetired
        ? "Ajustar tu retiro mensual cambia cuánto tiempo puede durar tu dinero."
        : "Con esta aportación puedes actualizar tu proyección en tiempo real.",
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
      title: isRetired ? "Ingreso mensual disponible" : "Ingreso mensual deseado",
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
      title: profile.mainGoal === "reduce_expenses" || isRetired
        ? "Enfoquémonos en optimizar tus gastos."
        : profile.currentSavings <= 0
          ? "Tu siguiente paso es empezar, no resolver todo hoy."
          : "Vas por buen camino.",
      description: isRetired
        ? "Reducir gastos flexibles puede extender la duración de tus ahorros."
        : "Pequeños cambios hoy pueden hacer una gran diferencia mañana.",
      actionLabel: isRetired ? "Ver plan de duración" : "Siguiente paso",
      actionDescription: isRetired ? "Optimiza tu retiro mensual" : "Revisa tu plan personalizado",
      action: "confirmPlan",
    },
    recommendations: {
      kicker: "Tips personalizados",
      title: isRetired ? "Cómo hacer que tu dinero dure más" : "Qué hacer ahora",
      items: buildRecommendations(profile, mvpQuery, progress),
    },
    disclaimer: "Esta proyección es estimativa y no constituye asesoría financiera.",
  }

  return new Promise((resolve) => {
    window.setTimeout(() => resolve(generatedDashboard), 350)
  })
}
