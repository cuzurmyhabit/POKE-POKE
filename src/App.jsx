import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import TodaySilhouette from './components/TodaySilhouette'
import QuizPage from './components/QuizPage'
import Encyclopedia from './components/Encyclopedia'
import { useUserData } from './hooks/useUserData'
import './App.css'

function App() {
  const { userData, completeSilhouette, recordQuizAnswer } = useUserData()

  return (
    <Layout userData={userData}>
      <Routes>
        <Route path="/" element={<Home userData={userData} />} />
        <Route
          path="/silhouette"
          element={
            <TodaySilhouette
              userData={userData}
              onComplete={completeSilhouette}
            />
          }
        />
        <Route
          path="/quiz"
          element={
            <QuizPage
              userData={userData}
              onAnswer={recordQuizAnswer}
            />
          }
        />
        <Route path="/dogam" element={<Encyclopedia userData={userData} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
