import Text from "../atoms/Text.jsx"
import Title from "../atoms/Title.jsx"
import "../../css/molecules/card-header.css"

export default function CardHeader({ kicker, title, action, titleLevel = 2 }) {
  return (
    <div className="card-header">
      <div>
        <Text tone="muted">{kicker}</Text>
        <Title level={titleLevel} size="md">{title}</Title>
      </div>
      {action}
    </div>
  )
}
