import { useState } from 'react'
import './App.css'
import GeneratedRetirementPage from './components/pages/GeneratedRetirementPage.jsx'
import ProfileSelectionPage from './components/pages/ProfileSelectionPage.jsx'

export default function App() {
  const [generatedResult, setGeneratedResult] = useState(null)

  if (!generatedResult) {
    return <ProfileSelectionPage onDashboardGenerated={setGeneratedResult} />
  }

  return (
    <GeneratedRetirementPage
      result={generatedResult}
      onRestart={() => setGeneratedResult(null)}
      profile={generatedResult.profile}
    />
  )
}
