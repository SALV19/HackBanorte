import { A2uiSurface } from "@a2ui/react/v0_9";
import type { SurfaceModel } from "@a2ui/web_core/v0_9";
import type { A2uiStatus } from "../../hooks/useA2ui";
import "../../css/organisms/surface-panel.css";

interface SurfacePanelProps {
  surface: SurfaceModel<any> | null;
  status: A2uiStatus;
}

// Contenedor donde se monta <A2uiSurface>. El árbol que manda el backend
// siempre incluye un componente id="root" que sirve de punto de entrada
// (ver withRootWrapper en services/llm.ts, y A2UI-ESTADO.md) — A2uiSurface
// depende de esa convención para saber por dónde empezar a renderizar; este
// panel no necesita saber nada de eso, solo darle un SurfaceModel o no.
export function SurfacePanel({ surface, status }: SurfacePanelProps) {
  return (
    <section className="surface-panel">
      <h2 className="surface-panel__title">Vista generada</h2>
      <div className="surface-panel__canvas">
        {status === "loading" && <div className="surface-panel__loading-bar" aria-hidden="true" />}
        {surface ? <A2uiSurface surface={surface} /> : <p className="surface-panel__empty">Aún no hay nada que mostrar — manda un mensaje.</p>}
      </div>
    </section>
  );
}
