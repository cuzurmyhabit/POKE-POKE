import { useState, useCallback, useEffect } from 'react'
import {
  loadUserData,
  saveUserData,
  updateStreak,
  addPokemon,
  addScore,
  getTodayKey,
  getSilhouetteState,
} from '../utils/storage'

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
    (points, pokemonId = null) => {
      persist((data) => {
        let next = addScore(data, points)
        if (pokemonId) next = addPokemon(next, pokemonId)
        return next
      })
    },
    [persist],
  )

  const completeSilhouette = useCallback(
    (pokemonId) => {
      const today = getTodayKey()
      persist((data) => {
        const current = getSilhouetteState(data)
        if (current.attemptsLeft <= 0) return data

        let next = addScore(data, 3)
        next = addPokemon(next, pokemonId)
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
    },
    [persist],
  )

  const recordQuizAnswer = useCallback(
    (isCorrect, pokemonId) => {
      if (!isCorrect) return
      persist((data) => {
        let next = addScore(data, 2)
        if (pokemonId) next = addPokemon(next, pokemonId)
        return next
      })
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
    recordQuizAnswer,
  }
}
