import type { ReactA2uiComponentProps } from "@a2ui/react/v0_9";
import "./DomainPlaceholder.css";

// Placeholder visible para los 9 componentes de dominio: todavía no tienen
// renderer diseñado (eso es el siguiente turno). Muestra el nombre exacto
// del componente y sus props ya resueltas (bindings {path}/{call} incluidos)
// en JSON — deja ver en el navegador qué está pidiendo Gemini/el backend
// antes de que exista el componente visual real. No es relleno: es la
// única ventana a ese contenido mientras no hay diseño.
//
// createComponentImplementation llama a este render con {props, context,
// buildChild} pero SIN el nombre del componente — por eso es una factory
// que cierra sobre el nombre en vez de un componente único (ver
// frontend/src/a2ui/catalog.ts, que la invoca una vez por componente de
// dominio).
export function makeDomainPlaceholder(componentName: string) {
  function DomainPlaceholder({ props }: ReactA2uiComponentProps<unknown>) {
    return (
      <div className="domain-placeholder">
        <span className="domain-placeholder__badge">{componentName}</span>
        <pre className="domain-placeholder__props">{JSON.stringify(props, null, 2)}</pre>
      </div>
    );
  }
  DomainPlaceholder.displayName = `DomainPlaceholder(${componentName})`;
  return DomainPlaceholder;
}
