import "../../css/atoms/button.css";

/**
 * Botón reutilizable del catálogo visual.
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement> & { size?: string, csstype?: string }} props
 */
export default function Button({
    type = "button",
    size = "",
    csstype = "",
    className = "",
    children,
    ...props
}) {
    return <button {...props} type={type} className={`button ${size} ${csstype} ${className}`}>{children}</button>;
}
