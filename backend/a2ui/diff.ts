// Diff incremental contra el estado del surface (Conversacion.a2uiSurface).
// Un hash por componente (no solo el id) porque un mismo id con props
// distintas se ve idéntico a "sin cambios" si solo se compara existencia.
//
// ADVERTENCIA DE DISEÑO — esto asume que `currentTurnComponents` es SIEMPRE
// la pantalla completa que se espera ver en este momento, no un delta de lo
// que cambió. Esa garantía no la impone ningún schema: depende de una
// instrucción en prosa dentro de services/prompt.service.ts ("componentes
// es siempre la pantalla completa"). Si Gemini alguna vez manda solo lo
// nuevo/cambiado en vez del árbol completo, este módulo no tiene forma de
// distinguir eso de "la pantalla genuinamente se achicó" — por eso
// `diffComponents` loguea un warning cuando el turno actual trae MENOS IDs
// que los que ya estaban en `previousSentComponents` (ver abajo): no puede
// corregirlo solo, pero al menos no falla en silencio.
//
// `nextSentComponents` se construye desde cero a partir de los componentes
// de ESTE turno — no es un merge sobre el anterior. Decisión deliberada:
// los IDs que dejan de aparecer se PODAN de sentComponents (no quedan como
// entradas huérfanas). Si en vez de podar se dejaran ahí, un componente que
// desaparece un turno y vuelve más tarde con el MISMO contenido de antes
// compararía igual contra el hash viejo y se OMITIRÍA por error — el
// cliente nunca lo habría recibido en el turno donde faltó, así que
// "sin cambios" sería la conclusión equivocada. Podando, ese mismo caso se
// trata como "nuevo" (hash no encontrado → se manda), que es siempre
// correcto aunque a veces redundante. El único costo de podar es, en el
// peor caso, un reenvío de un componente que volvió sin cambios tras haber
// desaparecido un turno — una ineficiencia menor, nunca una incorrección.
import { createHash } from "node:crypto";
import type { AnyComponent } from "@a2ui/web_core/v0_9";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

export function hashComponent(component: AnyComponent): string {
  return createHash("sha1").update(stableStringify(component)).digest("hex");
}

export interface DiffResult {
  /** Componentes que hay que mandar en el próximo updateComponents. */
  toSend: AnyComponent[];
  /** Reemplazo completo de a2uiSurface.sentComponents para este turno. */
  nextSentComponents: Record<string, string>;
}

export function diffComponents(currentTurnComponents: AnyComponent[], previousSentComponents: Record<string, string>): DiffResult {
  const toSend: AnyComponent[] = [];
  const nextSentComponents: Record<string, string> = {};

  for (const component of currentTurnComponents) {
    const id = (component as { id?: string }).id;
    const hash = hashComponent(component);

    if (!id) {
      // Sin id no se puede diferenciar de un turno a otro — se manda siempre.
      toSend.push(component);
      continue;
    }

    nextSentComponents[id] = hash;
    if (previousSentComponents[id] !== hash) {
      toSend.push(component);
    }
  }

  // El turno actual trajo menos IDs de los que ya estaban mandados. Puede
  // ser legítimo (la pantalla cambió de tema de verdad y esos componentes ya
  // no aplican) o puede ser que Gemini mandó un delta en vez de la pantalla
  // completa (ver advertencia de diseño arriba) — no hay forma de saber cuál
  // desde aquí, así que se loguea explícito en vez de podar en silencio.
  const idsDesaparecidos = Object.keys(previousSentComponents).filter((id) => !(id in nextSentComponents));
  if (idsDesaparecidos.length > 0) {
    console.warn(
      `[a2ui/diff] ${idsDesaparecidos.length} componente(s) que estaban mandados ya no aparecen en este turno ` +
        `(se podan de sentComponents): ${idsDesaparecidos.join(", ")}. Si esto no era intencional, revisa si Gemini ` +
        `está devolviendo la pantalla completa o solo un delta.`
    );
  }

  return { toSend, nextSentComponents };
}
