import { ALL_TYPE_KEYS, TYPE_KO } from './pokemonMeta'

const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, fairy: 2, steel: 0.5 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

export function getTypeEffectiveness(attackType, defenseType) {
  return TYPE_CHART[attackType]?.[defenseType] ?? 1
}

export function getCombinedEffectiveness(attackType, defenseTypes) {
  return defenseTypes.reduce(
    (mult, def) => mult * getTypeEffectiveness(attackType, def),
    1,
  )
}

export function getEffectivenessKey(multiplier) {
  if (multiplier === 0) return 'none'
  if (multiplier <= 0.5) return 'weak'
  if (multiplier >= 2) return 'strong'
  return 'normal'
}

export const EFFECTIVENESS_OPTIONS = {
  none: { id: 'none', label: '효과가 없다 (0배)' },
  weak: { id: 'weak', label: '효과가 별로다 (0.5배)' },
  normal: { id: 'normal', label: '보통이다 (1배)' },
  strong: { id: 'strong', label: '효과가 굉장히 좋다 (2배)' },
}

export function getSuperEffectiveTypesAgainst(defenseTypes) {
  return ALL_TYPE_KEYS.filter(
    (attack) => getCombinedEffectiveness(attack, defenseTypes) >= 2,
  )
}

export function getNotVeryEffectiveTypesAgainst(defenseTypes) {
  return ALL_TYPE_KEYS.filter((attack) => {
    const mult = getCombinedEffectiveness(attack, defenseTypes)
    return mult > 0 && mult < 1
  })
}

export function getImmuneTypesAgainst(defenseTypes) {
  return ALL_TYPE_KEYS.filter(
    (attack) => getCombinedEffectiveness(attack, defenseTypes) === 0,
  )
}

function resolveTypeKey(input) {
  const norm = input.replace(/\s+/g, '').toLowerCase()
  if (ALL_TYPE_KEYS.includes(norm)) return norm

  for (const [key, ko] of Object.entries(TYPE_KO)) {
    const koNorm = ko.replace(/\s+/g, '').toLowerCase()
    if (norm === koNorm) return key
  }
  return null
}

function extractTypesFromAnswer(text) {
  const parts = text.trim().split(/[/,\s·]+/).filter(Boolean)
  const found = []

  for (const part of parts) {
    const key = resolveTypeKey(part)
    if (key && !found.includes(key)) found.push(key)
  }

  return found
}

export function checkDualTypeAnswer(text, correctTypes) {
  const inputTypes = extractTypesFromAnswer(text)
  if (inputTypes.length !== 2) return false

  const sortedInput = [...inputTypes].sort().join('/')
  const sortedCorrect = [...correctTypes].sort().join('/')
  return sortedInput === sortedCorrect
}

export function getInterestingMatchupPairs() {
  const pairs = []
  for (const attack of ALL_TYPE_KEYS) {
    for (const defense of ALL_TYPE_KEYS) {
      const mult = getTypeEffectiveness(attack, defense)
      if (mult !== 1) {
        pairs.push({ attack, defense, mult })
      }
    }
  }
  return pairs
}
