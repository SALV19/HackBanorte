import { useState } from "react";
import type { LogEntry } from "../../hooks/useA2ui";
import type { DiscardedComponent } from "../../a2ui/types";
import "../../css/organisms/debug-panel.css";

interface DebugPanelProps {
  log: LogEntry[];
  discarded: DiscardedComponent[];
}

// Panel de depuración: muestra el JSON crudo de cada intercambio con el
// backend y, aparte, cualquier nodo que backend/a2ui/validate.ts haya
// descartado (con su "kind" — ver A2UI-ESTADO.md, "mezcla" es el riesgo real
// medido, ~10%). Abierto por default a propósito: se pidió visible mientras
// se desarrolla, no escondido tras un clic.
export function DebugPanel({ log, discarded }: DebugPanelProps) {
  const [open, setOpen] = useState(true);
  const lastLogId = log[log.length - 1]?.id;

  return (
    <section className={`debug-panel ${open ? "debug-panel--open" : ""}`}>
      <button type="button" className="debug-panel__toggle" onClick={() => setOpen((value) => !value)}>
        {open ? "▾" : "▸"} Depuración A2UI · {log.length} mensajes
        {discarded.length > 0 ? ` · ${discarded.length} descartados` : ""}
      </button>

      {open && (
        <div className="debug-panel__body">
          {discarded.length > 0 && (
            <div className="debug-panel__discarded">
              <h3>Componentes descartados</h3>
              {discarded.map((entry, index) => (
                <details key={index} className="debug-panel__discard-entry">
                  <summary>
                    <span className={`debug-panel__kind debug-panel__kind--${entry.kind}`}>{entry.kind}</span> {entry.component ?? "?"}
                    {entry.id ? ` (${entry.id})` : ""}
                    {entry.mixedFrom?.length ? ` — mezclado con: ${entry.mixedFrom.join(", ")}` : ""}
                  </summary>
                  <p className="debug-panel__discard-reason">{entry.reason}</p>
                  <pre>{JSON.stringify(entry.candidate, null, 2)}</pre>
                </details>
              ))}
            </div>
          )}

          <div className="debug-panel__log">
            <h3>Mensajes crudos</h3>
            {log.length === 0 && <p className="debug-panel__empty">Sin actividad todavía.</p>}
            {log.map((entry) => (
              <details key={entry.id} open={entry.id === lastLogId}>
                <summary>
                  {entry.direction === "send" ? "→" : "←"} {entry.label}
                </summary>
                <pre>{JSON.stringify(entry.data, null, 2)}</pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
