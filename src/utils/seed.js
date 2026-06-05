import { TOTAL_POKEMON } from './pokemonMeta'

export function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function dailyPokemonId(dateKey, min = 1, max = TOTAL_POKEMON) {
  const seed = hashString(`silhouette-${dateKey}`)
  return min + (seed % (max - min + 1))
}

export function silhouettePokemonId(today, attemptIndex) {
  return dailyPokemonId(`${today}-attempt-${attemptIndex}`)
}

export function dailyQuizPokemonIds(dateKey, count = 3) {
  const rand = seededRandom(hashString(`quiz-${dateKey}`))
  const ids = new Set()
  while (ids.size < count) {
    ids.add(1 + Math.floor(rand() * TOTAL_POKEMON))
  }
  return [...ids]
}

export function shuffleWithSeed(arr, seed) {
  const rand = seededRandom(seed)
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
