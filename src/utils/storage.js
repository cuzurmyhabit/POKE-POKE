const STORAGE_KEY = 'pokepoke_user'

const DEFAULT_DATA = {
  totalScore: 0,
  streak: 0,
  lastVisitDate: null,
  collectedPokemon: [],
  silhouette: { date: null, attempts: 0, history: [] },
  quiz: { date: null, completedCount: 0, correctToday: 0, finished: false },
}

export function loadUserData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_DATA }
    return { ...DEFAULT_DATA, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_DATA }
  }
}

export function saveUserData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getTodayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDateDisplay(dateKey = getTodayKey()) {
  const [y, m, d] = dateKey.split('-')
  return `${y}.${m}.${d}`
}

export function formatDateLong(dateKey = getTodayKey()) {
  const [y, m, d] = dateKey.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`
}

function daysBetween(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return Math.round((db - da) / 86400000)
}

export function updateStreak(data) {
  const today = getTodayKey()
  if (data.lastVisitDate === today) return data

  const diff = data.lastVisitDate ? daysBetween(data.lastVisitDate, today) : null
  return {
    ...data,
    streak: !data.lastVisitDate ? 1 : diff === 1 ? data.streak + 1 : 1,
    lastVisitDate: today,
  }
}

export function addPokemon(data, pokemonId) {
  if (data.collectedPokemon.includes(pokemonId)) return data
  return {
    ...data,
    collectedPokemon: [...data.collectedPokemon, pokemonId].sort((a, b) => a - b),
  }
}

export function addScore(data, points) {
  return {
    ...data,
    totalScore: data.totalScore + points,
  }
}

export const MAX_SILHOUETTE_PER_DAY = 2

export function getSilhouetteState(data) {
  const today = getTodayKey()
  if (data.silhouette?.date !== today) {
    return { date: today, attempts: 0, history: [], attemptsLeft: MAX_SILHOUETTE_PER_DAY }
  }
  const sil = data.silhouette
  const attempts = sil.attempts ?? (sil.completed ? 1 : 0)
  const history = sil.history ?? (sil.pokemonId ? [sil.pokemonId] : [])
  return {
    date: sil.date,
    attempts,
    history,
    attemptsLeft: Math.max(0, MAX_SILHOUETTE_PER_DAY - attempts),
  }
}
