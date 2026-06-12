import { TYPE_KO, TYPE_COLORS } from '../utils/pokemonMeta'

const LIGHT_TYPES = new Set(['electric', 'ice', 'ground', 'bug', 'rock', 'steel', 'fairy'])

export default function TypeBadge({ typeKey, size = 'md', className = '' }) {
  const light = LIGHT_TYPES.has(typeKey)

  return (
    <span
      className={`pokemon-type-badge pokemon-type-badge-${size} ${light ? 'light' : ''} ${className}`.trim()}
      style={{ background: TYPE_COLORS[typeKey] }}
    >
      {TYPE_KO[typeKey]}
    </span>
  )
}