import type { SimulationInput } from '../../shared/a2ui';

export function simulateRetirement(input: SimulationInput) {
  let balance = input.initialSavings;
  const points = [{ label: 'Hoy', value: Math.round(balance * 100) / 100 }];
  for (let month = 1; month <= input.years * 12; month++) {
    balance = balance * (1 + input.annualRate / 100 / 12) + input.monthlyContribution;
    if (month % 12 === 0) points.push({ label: `Año ${month / 12}`, value: Math.round(balance * 100) / 100 });
  }
  return { points, finalBalance: Math.round(balance * 100) / 100, assumptions: input };
}
