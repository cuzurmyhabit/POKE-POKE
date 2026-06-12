import { useState, useEffect } from 'react'
import { getSpriteCandidates, getShinySpriteCandidates } from '../utils/pokemonSprites'

export default function PokemonImage({ id, src, alt, className, shiny = false }) {
  const candidates = shiny ? getShinySpriteCandidates(id, src) : getSpriteCandidates(id, src)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [src, id, shiny])

  const imgSrc = candidates[index] || candidates[candidates.length - 1]

  const handleError = () => {
    setIndex((i) => (i < candidates.length - 1 ? i + 1 : i))
  }

  if (!imgSrc) return null

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  )
}
