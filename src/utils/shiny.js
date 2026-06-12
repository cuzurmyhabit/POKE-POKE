import { hashString } from './seed'
import { SHINY_ODDS } from './pokemonMeta'

export function rollShiny(seed, canShiny = true) {
  if (!canShiny) return false
  return hashString(String(seed)) % SHINY_ODDS === 0
}

export function rollSilhouetteShiny(today, attemptIndex, canShiny) {
  return rollShiny(`silhouette-shiny-${today}-${attemptIndex}`, canShiny)
}

export function rollQuizCaptureShiny(pokemonId) {
  return rollShiny(`quiz-capture-${pokemonId}-${Date.now()}`, true)
}
