const STORAGE_KEY = 'pokepoke_user'

const DEFAULT_DATA = {
  totalScore: 0,
  streak: 0,
  lastVisitDate: null,
  collectedPokemon: [],
  collectedShiny: [],
  silhouette: { date: null, attempts: 0, history: [] },
  quiz: { date: null, completedCount: 0, correctToday: 0, finished: false },
}

export function loadUserData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_DATA, collectedShiny: [] }
    const parsed = { ...DEFAULT_DATA, ...JSON.parse(raw) }
    if (!Array.isArray(parsed.collectedShiny)) parsed.collectedShiny = []
    return parsed
  } catch {
    return { ...DEFAULT_DATA, collectedShiny: [] }
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

export function addPokemon(data, pokemonId, { shiny = false } = {}) {
  const key = shiny ? 'collectedShiny' : 'collectedPokemon'
  if (data[key].includes(pokemonId)) return data
  return {
    ...data,
    [key]: [...data[key], pokemonId].sort((a, b) => a - b),
  }
}

export function hasNormalForm(data, pokemonId) {
  return data.collectedPokemon.includes(pokemonId)
}

export function hasShinyForm(data, pokemonId) {
  return data.collectedShiny.includes(pokemonId)
}

export function getUniqueCaughtCount(data) {
  return new Set([...data.collectedPokemon, ...data.collectedShiny]).size
}

export function getAllCaughtIds(data) {
  return [...new Set([...data.collectedPokemon, ...data.collectedShiny])].sort((a, b) => a - b)
}

export function tryAwardPokemon(data, pokemonId, isShiny) {
  let next = data
  let isNew = false

  if (isShiny) {
    if (!hasNormalForm(next, pokemonId)) {
      next = addPokemon(next, pokemonId, { shiny: false })
      isNew = true
    }
    if (!hasShinyForm(next, pokemonId)) {
      next = addPokemon(next, pokemonId, { shiny: true })
      isNew = true
    }
    return { data: next, isNew }
  }

  if (!hasNormalForm(next, pokemonId)) {
    next = addPokemon(next, pokemonId, { shiny: false })
    isNew = true
  }
  return { data: next, isNew }
}

export function addScore(data, points) {
  return {
    ...data,
    totalScore: data.totalScore + points,
  }
}

export const MAX_SILHOUETTE_PER_DAY = 2

export function skipSilhouetteAttempt(data) {
  const today = getTodayKey()
  const current = getSilhouetteState(data)
  if (current.attemptsLeft <= 0) return data

  const attempts = (current.date === today ? current.attempts : 0) + 1
  return {
    ...data,
    silhouette: {
      date: today,
      attempts,
      history: current.history ?? [],
    },
  }
}
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
