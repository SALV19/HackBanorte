import { ChevronDown } from "lucide-react"
import "../../css/molecules/app-header.css"

export default function AppHeader({ brandInitial, brandName, navItems, userInitial, userName }) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__mark">{brandInitial}</div>
        <span className="app-header__name">{brandName}</span>
      </div>
      <nav className="app-header__nav" aria-label="Navegación principal">
        {navItems.map((item) => (
          <a aria-current={item.active ? "page" : undefined} href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <button className="app-header__profile" type="button" aria-label={userName}>
        <span className="app-header__avatar">{userInitial}</span>
        <span>{userName}</span>
        <ChevronDown aria-hidden="true" />
      </button>
    </header>
  )
}
