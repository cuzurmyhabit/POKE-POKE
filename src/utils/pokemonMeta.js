export const TYPE_KO = {
  normal: '노말',
  fire: '불꽃',
  water: '물',
  electric: '전기',
  grass: '풀',
  ice: '얼음',
  fighting: '격투',
  poison: '독',
  ground: '땅',
  flying: '비행',
  psychic: '에스퍼',
  bug: '벌레',
  rock: '바위',
  ghost: '고스트',
  dragon: '드래곤',
  dark: '악',
  steel: '강철',
  fairy: '페어리',
}

export const TYPE_EMOJI = {
  normal: '⚪',
  fire: '🔥',
  water: '💧',
  electric: '⚡',
  grass: '🌿',
  ice: '❄️',
  fighting: '👊',
  poison: '☠️',
  ground: '🌍',
  flying: '🪽',
  psychic: '🔮',
  bug: '🐛',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '✨',
}

export const TYPE_COLORS = {
  normal: '#a8a878',
  fire: '#f08030',
  water: '#6890f0',
  electric: '#f8d030',
  grass: '#78c850',
  ice: '#98d8d8',
  fighting: '#c03028',
  poison: '#a040a0',
  ground: '#e0c068',
  flying: '#a890f0',
  psychic: '#f85888',
  bug: '#a8b820',
  rock: '#b8a038',
  ghost: '#705898',
  dragon: '#7038f8',
  dark: '#705848',
  steel: '#b8b8d0',
  fairy: '#ee99ac',
}

export const ALL_TYPE_KEYS = Object.keys(TYPE_KO)

export const GENERATIONS = [
  { gen: 1, start: 1, end: 151 },
  { gen: 2, start: 152, end: 251 },
  { gen: 3, start: 252, end: 386 },
  { gen: 4, start: 387, end: 493 },
  { gen: 5, start: 494, end: 649 },
  { gen: 6, start: 650, end: 721 },
  { gen: 7, start: 722, end: 809 },
  { gen: 8, start: 810, end: 905 },
  { gen: 9, start: 906, end: 1025 },
]

export const TOTAL_POKEMON = GENERATIONS[GENERATIONS.length - 1].end

export function getTypeFilterLabel(typeKey) {
  return `${TYPE_EMOJI[typeKey] ?? ''} ${TYPE_KO[typeKey]}`
}

export function getGeneration(id) {
  const found = GENERATIONS.find((g) => id >= g.start && id <= g.end)
  return found?.gen ?? 9
}

export function getGenerationLabel(gen) {
  return `${gen}세대`
}

export function getGenerationInfo(gen) {
  return GENERATIONS.find((g) => g.gen === gen)
}

export function getIdsForGeneration(gen) {
  const info = getGenerationInfo(gen)
  if (!info) return []
  return Array.from({ length: info.end - info.start + 1 }, (_, i) => info.start + i)
}

export function getAllPokemonIds() {
  return Array.from({ length: TOTAL_POKEMON }, (_, i) => i + 1)
}

export function randomPokemonId(exclude = []) {
  const excluded = new Set(exclude)
  let id
  do {
    id = 1 + Math.floor(Math.random() * TOTAL_POKEMON)
  } while (excluded.has(id))
  return id
}

export function normalizePokemonName(name) {
  return name.replace(/\s+/g, '').toLowerCase()
}

export const COLOR_KO = {
  black: '검정',
  blue: '파랑',
  brown: '갈색',
  gray: '회색',
  green: '초록',
  pink: '분홍',
  purple: '보라',
  red: '빨강',
  white: '하양',
  yellow: '노랑',
}

export const SHINY_ODDS = 200

export function getShinyRateInfo(hasShinySprite) {
  if (!hasShinySprite) {
    return {
      canShiny: false,
      oddsText: '이로치 불가',
      percentText: '-',
    }
  }
  const percent = ((1 / SHINY_ODDS) * 100).toFixed(3)
  return {
    canShiny: true,
    oddsText: `1 / ${SHINY_ODDS.toLocaleString()}`,
    percentText: `약 ${percent}%`,
  }
}

export const STAT_COLORS = {
  hp: '#ef4444',
  attack: '#f97316',
  defense: '#eab308',
  'special-attack': '#3b82f6',
  'special-defense': '#22c55e',
  speed: '#ec4899',
}
