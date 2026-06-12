import { useState, useEffect } from 'react'
import PokemonImage from './PokemonImage'
import { fetchPokemonBasic } from '../services/pokemonApi'
import { TYPE_KO } from '../utils/pokemonMeta'

export default function CaptureNotify({ capture, onClose }) {
  const [pokemon, setPokemon] = useState(null)

  useEffect(() => {
    if (!capture) {
      setPokemon(null)
      return
    }

    let cancelled = false
    fetchPokemonBasic(capture.id).then((data) => {
      if (!cancelled) setPokemon(data)
    })

    return () => { cancelled = true }
  }, [capture])

  if (!capture) return null

  const isShiny = capture.shiny

  return (
    <div className="capture-overlay" onClick={onClose} role="presentation">
      <div
        className={`capture-modal ${isShiny ? 'capture-shiny' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {isShiny && <div className="capture-sparkles" aria-hidden>✨</div>}

        <div className="capture-image-wrap">
          {pokemon ? (
            <PokemonImage
              id={pokemon.id}
              src={isShiny ? pokemon.shinySprite : pokemon.sprite}
              alt={pokemon.name}
              shiny={isShiny}
              className={`capture-sprite ${isShiny ? 'shiny-reveal' : ''}`}
            />
          ) : (
            <div className="spinner" />
          )}
        </div>

        {pokemon && (
          <>
            <p className="capture-number">No. {String(pokemon.id).padStart(4, '0')}</p>
            <h3 className="capture-name">{pokemon.name}</h3>
            <p className="capture-type">{pokemon.types.map((t) => TYPE_KO[t]).join(' · ')}</p>
            <p className="capture-message">
              {isShiny ? '✨ 이로치를 획득했습니다!' : '🎉 획득했습니다!'}
            </p>
            <p className="capture-sub">
              {isShiny ? '도감에 이로치 버전이 등록되었어요!' : '도감에 등록되었어요!'}
            </p>
          </>
        )}

        <button type="button" className="capture-close-btn" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  )
}
