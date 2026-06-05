import { QUIZ_CATEGORIES } from '../services/quizGenerator'

const SESSION_KEY = 'pokepoke_quiz_session'

function createDefaultCategories() {
  const categories = {}
  const correctCount = {}
  QUIZ_CATEGORIES.forEach((cat) => {
    categories[cat.key] = 'idle'
    correctCount[cat.key] = 0
  })
  return { categories, correctCount }
}

const DEFAULT = createDefaultCategories()

export function loadQuizSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) {
      return {
        categories: { ...DEFAULT.categories },
        correctCount: { ...DEFAULT.correctCount },
        activeCategory: null,
      }
    }
    const parsed = JSON.parse(raw)
    const merged = createDefaultCategories()
    return {
      activeCategory: parsed.activeCategory ?? null,
      categories: { ...merged.categories, ...parsed.categories },
      correctCount: { ...merged.correctCount, ...parsed.correctCount },
    }
  } catch {
    return {
      categories: { ...DEFAULT.categories },
      correctCount: { ...DEFAULT.correctCount },
      activeCategory: null,
    }
  }
}

export function saveQuizSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function startCategory(categoryKey) {
  const session = loadQuizSession()
  session.categories[categoryKey] = 'playing'
  session.activeCategory = categoryKey
  saveQuizSession(session)
  return session
}

export function completeCategory(categoryKey, correctCount) {
  const session = loadQuizSession()
  session.categories[categoryKey] = 'completed'
  session.activeCategory = null
  session.correctCount[categoryKey] = correctCount
  saveQuizSession(session)
  return session
}

export function abandonActiveQuiz() {
  const session = loadQuizSession()
  if (session.activeCategory) {
    session.categories[session.activeCategory] = 'abandoned'
    session.activeCategory = null
    saveQuizSession(session)
  }
  return session
}

export function isCategoryPlayable(categoryKey) {
  const session = loadQuizSession()
  return session.categories[categoryKey] === 'idle'
}

export function hasAbandonedQuiz() {
  const session = loadQuizSession()
  return Object.values(session.categories).some((s) => s === 'abandoned')
}
