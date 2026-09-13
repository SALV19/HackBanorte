import { ChevronDown } from "lucide-react"
import "../../css/organisms/app-header.css"

export default function AppHeader({ userName = "Mariana" }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__mark">P</div>
        <span className="app-header__name">Planifica</span>
      </div>
      <nav className="app-header__nav" aria-label="Navegación principal">
        <a href="#resumen">Mi plan</a>
        <a href="#proyeccion">Proyección</a>
        <a href="#escenarios">Escenarios</a>
        <a href="#ayuda">Ayuda</a>
      </nav>
      <button className="app-header__profile" type="button" aria-label={`Abrir perfil de ${userName}`}>
        <span className="app-header__avatar">{userName.charAt(0)}</span>
        <span>{userName}</span>
        <ChevronDown aria-hidden="true" />
      </button>
    </header>
  )
}
