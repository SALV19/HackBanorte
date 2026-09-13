// Catálogo A2UI compartido entre backend y frontend.
// Text, Button, Column, Row, Card y Slider vienen tal cual del catálogo base
// de @a2ui/web_core (solo name+schema, sin implementación de render) — no se
// recrean aquí. Los 9 componentes de dominio de retiro/pensión sí se definen
// en este paquete, uno por archivo.
import {
  TextApi,
  ButtonApi,
  ColumnApi,
  RowApi,
  CardApi,
  SliderApi,
} from "@a2ui/web_core/v0_9/basic_catalog";
import type { ComponentApi } from "@a2ui/web_core/v0_9";

// Re-exportado a propósito: cualquier consumidor que necesite componer
// (merge/extend) contra los schemas del manifest — ej. backend/a2ui/
// envolviendo cada entrada con {component, id} antes de convertir a JSON
// Schema — necesita la MISMA versión de zod (v3) con la que se construyeron
// estos schemas, no la v4 del resto del backend. Ver PASO 0.5 del plan.
export { z } from "zod";

import { RetirementTimeline } from "./RetirementTimeline";
import { GoalCard } from "./GoalCard";
import { ProjectionChart } from "./ProjectionChart";
import { ContributionSlider } from "./ContributionSlider";
import { ContributionBalance } from "./ContributionBalance";
import { ScenarioComparison } from "./ScenarioComparison";
import { MonthlyIncomeCard } from "./MonthlyIncomeCard";
import { ExpenseBreakdown } from "./ExpenseBreakdown";
import { ActionButton } from "./ActionButton";

export const CATALOG_ID = "banorte-retiro-v1";

// Array plano de ComponentApi ({name, schema}) — nunca una instancia de
// Catalog: nadie en el backend consume implementaciones de render (ni React
// ni Lit). El frontend construye su propia instancia de Catalog combinando
// este manifest con basicCatalog de @a2ui/react/v0_9 y sus propios renderers.
export const manifest: ComponentApi[] = [
  TextApi,
  ButtonApi,
  ColumnApi,
  RowApi,
  CardApi,
  SliderApi,
  RetirementTimeline,
  GoalCard,
  ProjectionChart,
  ContributionSlider,
  ContributionBalance,
  ScenarioComparison,
  MonthlyIncomeCard,
  ExpenseBreakdown,
  ActionButton,
];

export * from "./paths";
export * from "./actions";
