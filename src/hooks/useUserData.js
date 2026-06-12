import { useState, useCallback, useEffect } from 'react'
import {
  loadUserData,
  saveUserData,
  updateStreak,
  addScore,
  tryAwardPokemon,
  getTodayKey,
  getSilhouetteState,
  skipSilhouetteAttempt,
} from '../utils/storage'
import { rollQuizCaptureShiny } from '../utils/shiny'

export function useUserData() {
  const [userData, setUserData] = useState(() => {
    const data = loadUserData()
    const updated = updateStreak(data)
    if (updated !== data) saveUserData(updated)
    return updated
  })

  const refresh = useCallback(() => {
    setUserData(loadUserData())
  }, [])

  const persist = useCallback((updater) => {
    setUserData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveUserData(next)
      return next
    })
  }, [])

  const earnPoints = useCallback(
    (points, pokemonId = null, { shiny = false } = {}) => {
      let capture = null
      persist((data) => {
        let next = addScore(data, points)
        if (pokemonId) {
          const isShiny = shiny
          const result = tryAwardPokemon(next, pokemonId, isShiny)
          next = result.data
          if (result.isNew) capture = { id: pokemonId, shiny: isShiny }
        }
        return next
      })
      return capture
    },
    [persist],
  )

  const completeSilhouette = useCallback(
    (pokemonId, { isShiny = false } = {}) => {
      const today = getTodayKey()
      let capture = null

      persist((data) => {
        const current = getSilhouetteState(data)
        if (current.attemptsLeft <= 0) return data

        let next = addScore(data, 3)
        const result = tryAwardPokemon(next, pokemonId, isShiny)
        next = result.data
        if (result.isNew) capture = { id: pokemonId, shiny: isShiny }

        const attempts = (current.date === today ? current.attempts : 0) + 1
        return {
          ...next,
          silhouette: {
            date: today,
            attempts,
            history: [...(current.history ?? []), pokemonId],
          },
        }
      })

      return capture
    },
    [persist],
  )

  const failSilhouette = useCallback(() => {
    persist((data) => skipSilhouetteAttempt(data))
  }, [persist])

  const recordQuizAnswer = useCallback(
    (isCorrect, pokemonId, { canShiny = true, isShiny: forcedShiny = null } = {}) => {
      if (!isCorrect || !pokemonId) return null

      let capture = null
      const rolledShiny = forcedShiny ?? rollQuizCaptureShiny(pokemonId)
      const isShiny = canShiny && rolledShiny

      persist((data) => {
        let next = addScore(data, 2)
        const result = tryAwardPokemon(next, pokemonId, isShiny)
        next = result.data
        if (result.isNew) capture = { id: pokemonId, shiny: isShiny }
        return next
      })

      return capture
    },
    [persist],
  )

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'pokepoke_user') refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  return {
    userData,
    refresh,
    persist,
    earnPoints,
    completeSilhouette,
    failSilhouette,
    recordQuizAnswer,
  }
}
