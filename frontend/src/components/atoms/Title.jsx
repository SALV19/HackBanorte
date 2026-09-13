import "../../css/atoms/type.css"

export default function Title({ children, level = 2, size = "md", className = "" }) {
  const Tag = `h${level}`
  return <Tag className={`title title--${size} ${className}`.trim()}>{children}</Tag>
}
