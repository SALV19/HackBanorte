import "../../css/organisms/header.css";

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark">Banorte</span>
        <span className="app-header__divider" aria-hidden="true" />
        <span className="app-header__product">Asistente de Retiro</span>
      </div>
    </header>
  );
}
