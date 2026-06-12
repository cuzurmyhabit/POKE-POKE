import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import TodaySilhouette from './components/TodaySilhouette'
import QuizPage from './components/QuizPage'
import Encyclopedia from './components/Encyclopedia'
import CaptureNotify from './components/CaptureNotify'
import { useUserData } from './hooks/useUserData'
import './App.css'

function App() {
  const { userData, completeSilhouette, failSilhouette, recordQuizAnswer } = useUserData()
  const [capture, setCapture] = useState(null)

  const handleSilhouetteComplete = (pokemonId, options) => {
    const result = completeSilhouette(pokemonId, options)
    if (result) setCapture(result)
  }

  const handleQuizAnswer = (isCorrect, pokemonId, options) => {
    const result = recordQuizAnswer(isCorrect, pokemonId, options)
    if (result) setCapture(result)
    return result
  }

  return (
    <Layout userData={userData}>
      <Routes>
        <Route path="/" element={<Home userData={userData} />} />
        <Route
          path="/silhouette"
          element={
            <TodaySilhouette
              userData={userData}
              onComplete={handleSilhouetteComplete}
              onFail={failSilhouette}
            />
          }
        />
        <Route
          path="/quiz"
          element={
            <QuizPage
              userData={userData}
              onAnswer={handleQuizAnswer}
            />
          }
        />
        <Route path="/dogam" element={<Encyclopedia userData={userData} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CaptureNotify capture={capture} onClose={() => setCapture(null)} />
    </Layout>
  )
}

export default App
