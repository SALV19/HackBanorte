import CardContainer from "../atoms/CardContainer.jsx"
import Text from "../atoms/Text.jsx"
import CardHeader from "./CardHeader.jsx"
import "../../css/molecules/recommendation-list.css"

export default function RecommendationList({ kicker, title, items }) {
  return (
    <CardContainer className="recommendation-list">
      <CardHeader kicker={kicker} title={title} />
      <div className="recommendation-list__items">
        {items.map((item) => (
          <article className="recommendation-list__item" key={item.title}>
            <Text tone="primary" bold>{item.title}</Text>
            <Text>{item.description}</Text>
            {item.impact && <Text className="recommendation-list__impact" size="sm">{item.impact}</Text>}
          </article>
        ))}
      </div>
    </CardContainer>
  )
}
