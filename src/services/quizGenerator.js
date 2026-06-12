import { fetchPokemonQuiz, fetchPokemonBasic, attachEvolutionTree, getDirectEvolutions } from './pokemonApi'
import {
  TYPE_KO,
  TYPE_EMOJI,
  COLOR_KO,
  ALL_TYPE_KEYS,
  getGeneration,
  getGenerationLabel,
  TOTAL_POKEMON,
} from '../utils/pokemonMeta'
import {
  getEffectivenessKey,
  EFFECTIVENESS_OPTIONS,
  getSuperEffectiveTypesAgainst,
  getImmuneTypesAgainst,
  getInterestingMatchupPairs,
} from '../utils/typeChart'
import { shuffleWithSeed } from '../utils/seed'

export const QUESTIONS_PER_QUIZ = 2

const TRIVIA_LABEL = '포켓몬 관련 상식 퀴즈'

export const QUIZ_CATEGORIES = [
  { key: 'trivia', label: TRIVIA_LABEL, icon: '📚', desc: '타입 상성, 진화, 세대 등 포켓몬 상식 2문제' },
  { key: 'type', label: '타입 퀴즈', icon: '🎯', desc: '단일 타입 객관식 · 이중 타입 주관식 2문제' },
  { key: 'cry', label: '울음소리 퀴즈', icon: '🔊', desc: '울음소리로 포켓몬을 맞히는 2문제' },
  { key: 'lore', label: '설정 · 비하인드 퀴즈', icon: '📖', desc: '도감 설명과 설정을 맞히는 2문제' },
]

const TRIVIA_TYPES = [
  'typeMatchup',
  'typeWeakness',
  'typeImmune',
  'evolution',
  'generation',
  'weight',
  'height',
]
const LORE_TYPES = ['flavor', 'genus', 'color', 'category']

const MATCHUP_PAIRS = getInterestingMatchupPairs()

function randomSeed() {
  return Math.floor(Math.random() * 2147483646) + 1
}

function randomPokemonIds(count, exclude = []) {
  const ids = new Set(exclude)
  const result = []
  while (result.length < count) {
    const id = 1 + Math.floor(Math.random() * TOTAL_POKEMON)
    if (!ids.has(id)) {
      ids.add(id)
      result.push(id)
    }
  }
  return result
}

function getWrongPokemonIds(exclude, count, seed) {
  const ids = []
  let i = 0
  while (ids.length < count) {
    const id = 1 + ((seed + i * 37) % TOTAL_POKEMON)
    if (!exclude.includes(id) && !ids.includes(id)) ids.push(id)
    i++
  }
  return ids
}

function formatTypeLabel(typeKey) {
  return `${TYPE_EMOJI[typeKey] ?? ''} ${TYPE_KO[typeKey]}`
}

function formatTypeCombo(types) {
  return types.map(formatTypeLabel).join(' / ')
}

function typeComboId(types) {
  return types.join('/')
}

function triviaBase(extra = {}) {
  return {
    categoryKey: 'trivia',
    category: TRIVIA_LABEL,
    categoryIcon: '📚',
    ...extra,
  }
}

function buildTypeMatchupQuestion(seed) {
  const pair = MATCHUP_PAIRS[seed % MATCHUP_PAIRS.length]
  const correctKey = getEffectivenessKey(pair.mult)
  const allKeys = Object.keys(EFFECTIVENESS_OPTIONS)
  const wrongKeys = shuffleWithSeed(
    allKeys.filter((k) => k !== correctKey),
    seed,
  ).slice(0, 3)

  const options = shuffleWithSeed(
    [correctKey, ...wrongKeys].map((k) => EFFECTIVENESS_OPTIONS[k]),
    seed + 1,
  )

  const multLabel = EFFECTIVENESS_OPTIONS[correctKey].label

  return triviaBase({
    showImage: false,
    pokemon: null,
    question: `${TYPE_KO[pair.attack]} 타입 공격은 ${TYPE_KO[pair.defense]} 타입 포켓몬에게?`,
    hint: '힌트: 타입 상성표를 떠올려보세요!',
    options,
    correctId: correctKey,
    explanation: `${TYPE_KO[pair.attack]} → ${TYPE_KO[pair.defense]}는 ${multLabel}`,
    successText: () => `정답! ${multLabel}`,
  })
}

function buildPokemonWeaknessQuestion(pokemon, seed) {
  const effective = getSuperEffectiveTypesAgainst(pokemon.types)
  if (effective.length === 0) return null

  const correct = effective[seed % effective.length]
  const wrong = shuffleWithSeed(
    ALL_TYPE_KEYS.filter((t) => t !== correct),
    seed,
  ).slice(0, 3)

  const options = shuffleWithSeed(
    [correct, ...wrong].map((t) => ({ id: t, label: formatTypeLabel(t) })),
    seed + 1,
  )

  const typeText = pokemon.types.map((t) => TYPE_KO[t]).join('/')

  return triviaBase({
    showImage: true,
    pokemon,
    question: `${pokemon.name}(${typeText})에게 효과가 굉장히 좋은 공격 타입은?`,
    hint: `힌트: ${getGenerationLabel(getGeneration(pokemon.id))} · 타입 상성을 생각해보세요!`,
    options,
    correctId: correct,
    explanation: `${TYPE_KO[correct]} 타입 공격이 ${pokemon.name}에게 효과가 굉장히 좋아요!`,
    successText: () => `정답! ${TYPE_KO[correct]} 타입`,
  })
}

function buildPokemonImmuneQuestion(pokemon, seed) {
  const immune = getImmuneTypesAgainst(pokemon.types)
  if (immune.length === 0) return null

  const correct = immune[seed % immune.length]
  const wrong = shuffleWithSeed(
    ALL_TYPE_KEYS.filter((t) => t !== correct),
    seed,
  ).slice(0, 3)

  const options = shuffleWithSeed(
    [correct, ...wrong].map((t) => ({ id: t, label: formatTypeLabel(t) })),
    seed + 1,
  )

  const typeText = pokemon.types.map((t) => TYPE_KO[t]).join('/')

  return triviaBase({
    showImage: true,
    pokemon,
    question: `${pokemon.name}(${typeText})에게 효과가 없는 공격 타입은?`,
    hint: '힌트: 면역(0배) 타입을 맞혀보세요!',
    options,
    correctId: correct,
    explanation: `${TYPE_KO[correct]} 타입 공격은 ${pokemon.name}에게 효과가 없어요!`,
    successText: () => `정답! ${TYPE_KO[correct]} 타입`,
  })
}

function buildGenerationQuestion(pokemon, seed) {
  const gen = getGeneration(pokemon.id)
  const allGens = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const wrongGens = shuffleWithSeed(allGens.filter((g) => g !== gen), seed).slice(0, 3)

  const options = shuffleWithSeed(
    [gen, ...wrongGens].map((g) => ({ id: g, label: `${g}세대` })),
    seed + 1,
  )

  return triviaBase({
    showImage: true,
    pokemon,
    question: `${pokemon.name}은 몇 세대 포켓몬일까요?`,
    hint: `힌트: No.${String(pokemon.id).padStart(4, '0')} · ${pokemon.types.map((t) => TYPE_KO[t]).join('/')} 타입`,
    options,
    correctId: gen,
    explanation: `${pokemon.name}은 ${gen}세대 포켓몬이에요!`,
    successText: () => `정답! ${gen}세대`,
  })
}

async function buildEvolutionQuestion(pokemon, seed) {
  const enriched = await attachEvolutionTree(pokemon)
  const branchIds = getDirectEvolutions(enriched)
  if (branchIds.length === 0) return null

  const branchPokemon = await Promise.all(branchIds.map(fetchPokemonBasic))
  const correctIdx = seed % branchIds.length
  const correctId = branchIds[correctIdx]
  const correctPokemon = branchPokemon[correctIdx]

  const wrongIds = getWrongPokemonIds([pokemon.id, ...branchIds], 3, seed)
  const wrongPokemon = await Promise.all(wrongIds.map(fetchPokemonBasic))

  const options = shuffleWithSeed(
    [correctPokemon, ...wrongPokemon].map((p) => ({ id: p.id, label: p.name })),
    seed,
  )

  const branchNames = branchPokemon.map((p) => p.name).join(', ')
  const isBranching = branchIds.length > 1

  return triviaBase({
    showImage: true,
    pokemon,
    question: isBranching
      ? `다음 중 ${pokemon.name}에서 진화할 수 있는 포켓몬은?`
      : `${pokemon.name}가 진화하면 무엇이 될까요?`,
    hint: isBranching
      ? `힌트: ${pokemon.name}은(는) 여러 갈래로 진화해요!`
      : `힌트: ${pokemon.types.map((t) => TYPE_KO[t]).join('/')} 타입 · ${getGenerationLabel(getGeneration(pokemon.id))} 포켓몬`,
    options,
    correctId,
    explanation: isBranching
      ? `${pokemon.name}은(는) ${branchNames} 등으로 진화할 수 있어요!`
      : `${pokemon.name} → ${correctPokemon.name}으로 진화해요`,
    successText: () => `정답! ${correctPokemon.name}`,
  })
}

function buildNumericQuestion(pokemon, seed, field, unit) {
  const value = pokemon[field]
  const offsets = shuffleWithSeed([2.5, 5, 10, 15, 20], seed).slice(0, 3)
  const wrongValues = offsets.map((o, i) =>
    Math.max(0.1, +(value + o * (i % 2 === 0 ? 1 : -1)).toFixed(1)),
  )

  const uniqueValues = [...new Set([value, ...wrongValues])]
  while (uniqueValues.length < 4) {
    uniqueValues.push(+(value + uniqueValues.length * 3).toFixed(1))
  }

  const options = shuffleWithSeed(
    uniqueValues.slice(0, 4).map((v) => ({ id: v, label: `${v} ${unit}` })),
    seed + 2,
  )

  const label = field === 'weight' ? '몸무게' : '키'

  return triviaBase({
    showImage: true,
    pokemon,
    question: `${pokemon.name}의 ${label}는?`,
    hint: `힌트: ${pokemon.types.map((t) => TYPE_KO[t]).join('/')} 타입 · ${getGenerationLabel(getGeneration(pokemon.id))} 포켓몬`,
    options,
    correctId: value,
    explanation: `${pokemon.name}의 ${label}는 ${value}${unit}이에요!`,
    successText: () => `정답! ${value}${unit}`,
  })
}

async function buildTriviaQuestion(pokemon, seed) {
  const types = shuffleWithSeed(TRIVIA_TYPES, seed)

  for (const qType of types) {
    if (qType === 'typeMatchup') {
      return buildTypeMatchupQuestion(seed)
    }
    if (qType === 'typeWeakness') {
      const q = buildPokemonWeaknessQuestion(pokemon, seed)
      if (q) return q
    }
    if (qType === 'typeImmune') {
      const q = buildPokemonImmuneQuestion(pokemon, seed)
      if (q) return q
    }
    if (qType === 'evolution') {
      const q = await buildEvolutionQuestion(pokemon, seed)
      if (q) return q
    }
    if (qType === 'generation') {
      return buildGenerationQuestion(pokemon, seed)
    }
    if (qType === 'weight') {
      return buildNumericQuestion(pokemon, seed, 'weight', 'kg')
    }
    if (qType === 'height') {
      return buildNumericQuestion(pokemon, seed, 'height', 'm')
    }
  }

  return buildTypeMatchupQuestion(seed)
}

function buildSingleTypeQuestion(pokemon, seed) {
  const mainType = pokemon.types[0]
  const wrongTypes = shuffleWithSeed(
    ALL_TYPE_KEYS.filter((t) => t !== mainType),
    seed,
  ).slice(0, 3)

  const options = shuffleWithSeed(
    [mainType, ...wrongTypes].map((t) => ({
      id: t,
      label: formatTypeLabel(t),
    })),
    seed + 1,
  )

  return {
    categoryKey: 'type',
    category: '타입 퀴즈',
    categoryIcon: '🎯',
    answerMode: 'choice',
    showImage: true,
    pokemon,
    question: `${pokemon.name}의 타입은?`,
    hint: `힌트: No.${String(pokemon.id).padStart(4, '0')} · ${getGenerationLabel(getGeneration(pokemon.id))} 포켓몬`,
    options,
    correctId: mainType,
    explanation: `${pokemon.name}은(는) ${TYPE_KO[mainType]} 타입 포켓몬이에요!`,
    successText: () => `정답! ${TYPE_KO[mainType]} 타입`,
  }
}

function buildDualTypeQuestion(pokemon) {
  const correctId = typeComboId(pokemon.types)

  return {
    categoryKey: 'type',
    category: '타입 퀴즈',
    categoryIcon: '🎯',
    answerMode: 'text',
    showImage: true,
    pokemon,
    question: `${pokemon.name}의 타입 2가지를 입력하세요`,
    hint: `힌트: 한글 타입명 2개 · 슬래시(/) 또는 띄어쓰기로 구분 · ${getGenerationLabel(getGeneration(pokemon.id))}`,
    options: [],
    correctTypes: pokemon.types,
    correctId,
    explanation: `${pokemon.name}은(는) ${formatTypeCombo(pokemon.types)} 타입이에요!`,
    successText: () => `정답! ${formatTypeCombo(pokemon.types)}`,
  }
}

async function buildTypeQuestion(pokemon, seed) {
  if (pokemon.types.length >= 2) {
    return buildDualTypeQuestion(pokemon)
  }
  return buildSingleTypeQuestion(pokemon, seed)
}

async function buildCryQuestion(pokemon, seed) {
  const wrongIds = getWrongPokemonIds([pokemon.id], 3, seed)
  const wrongPokemon = await Promise.all(wrongIds.map(fetchPokemonBasic))

  const options = shuffleWithSeed(
    [pokemon, ...wrongPokemon].map((p) => ({ id: p.id, label: p.name })),
    seed,
  )

  return {
    categoryKey: 'cry',
    category: '울음소리 퀴즈',
    categoryIcon: '🔊',
    showImage: false,
    cry: pokemon.cry,
    pokemon,
    question: '이 울음소리는 어떤 포켓몬일까요?',
    hint: `힌트: ${getGenerationLabel(getGeneration(pokemon.id))} 포켓몬 · 소리를 듣고 맞혀보세요!`,
    options,
    correctId: pokemon.id,
    explanation: `이 소리는 ${pokemon.name}의 울음소리예요!`,
    successText: () => `정답! ${pokemon.name}`,
  }
}

async function buildFlavorLoreQuestion(pokemon, seed) {
  const text = pokemon.description || '설명 없음'
  const snippet = text.length > 70 ? `${text.slice(0, 70)}…` : text

  const wrongIds = getWrongPokemonIds([pokemon.id], 3, seed)
  const wrongPokemon = await Promise.all(wrongIds.map(fetchPokemonBasic))

  const options = shuffleWithSeed(
    [pokemon, ...wrongPokemon].map((p) => ({ id: p.id, label: p.name })),
    seed,
  )

  return {
    categoryKey: 'lore',
    category: '설정 · 비하인드 퀴즈',
    categoryIcon: '📖',
    loreType: 'flavor',
    showImage: false,
    pokemon,
    question: `다음 도감 설명은 어떤 포켓몬일까요?\n"${snippet}"`,
    hint: '힌트: 비하인드 스토리를 읽고 맞혀보세요!',
    options,
    correctId: pokemon.id,
    explanation: `이 설명은 ${pokemon.name}의 도감 텍스트예요!`,
    successText: () => `정답! ${pokemon.name}`,
  }
}

async function buildGenusLoreQuestion(pokemon, seed) {
  const wrongIds = getWrongPokemonIds([pokemon.id], 3, seed)
  const wrongPokemon = await Promise.all(wrongIds.map(fetchPokemonQuiz))

  const wrongGenera = [...new Set(
    wrongPokemon.map((p) => p.genus).filter((g) => g && g !== pokemon.genus),
  )].slice(0, 3)

  while (wrongGenera.length < 3) {
    wrongGenera.push(`포켓몬 #${wrongIds[wrongGenera.length] ?? seed}`)
  }

  const options = shuffleWithSeed(
    [pokemon.genus, ...wrongGenera.slice(0, 3)].map((g) => ({ id: g, label: g })),
    seed,
  )

  return {
    categoryKey: 'lore',
    category: '설정 · 비하인드 퀴즈',
    categoryIcon: '📖',
    loreType: 'genus',
    showImage: true,
    pokemon,
    question: `${pokemon.name}의 포켓몬 분류는?`,
    hint: `힌트: ${getGenerationLabel(getGeneration(pokemon.id))} 포켓몬의 설정을 맞혀보세요!`,
    options,
    correctId: pokemon.genus,
    explanation: `${pokemon.name}은(는) 「${pokemon.genus}」 분류예요!`,
    successText: () => `정답! ${pokemon.genus}`,
  }
}

function buildColorLoreQuestion(pokemon, seed) {
  const colorKey = pokemon.color ?? 'unknown'
  const correct = COLOR_KO[colorKey] ?? colorKey
  const allColors = Object.keys(COLOR_KO).filter((c) => c !== colorKey)
  const wrongColors = shuffleWithSeed(allColors, seed).slice(0, 3)

  const options = shuffleWithSeed(
    [colorKey, ...wrongColors].map((c) => ({ id: c, label: COLOR_KO[c] ?? c })),
    seed + 1,
  )

  return {
    categoryKey: 'lore',
    category: '설정 · 비하인드 퀴즈',
    categoryIcon: '📖',
    loreType: 'color',
    showImage: true,
    pokemon,
    question: `${pokemon.name}의 색상 분류는?`,
    hint: '힌트: 포켓몬 도감의 색상 설정이에요!',
    options,
    correctId: colorKey,
    explanation: `${pokemon.name}의 색상은 ${correct}이에요!`,
    successText: () => `정답! ${correct}`,
  }
}

function buildCategoryLoreQuestion(pokemon, seed) {
  let correct = '일반 포켓몬'
  if (pokemon.isMythical) correct = '환상의 포켓몬'
  else if (pokemon.isLegendary) correct = '전설의 포켓몬'

  const allCategories = ['일반 포켓몬', '전설의 포켓몬', '환상의 포켓몬']
  const wrong = allCategories.filter((c) => c !== correct)
  const options = shuffleWithSeed(
    [correct, ...wrong].map((c) => ({ id: c, label: c })),
    seed + 2,
  )

  return {
    categoryKey: 'lore',
    category: '설정 · 비하인드 퀴즈',
    categoryIcon: '📖',
    loreType: 'category',
    showImage: true,
    pokemon,
    question: `${pokemon.name}은 어떤 등급의 포켓몬일까요?`,
    hint: '힌트: 전설/환상 포켓몬 설정을 맞혀보세요!',
    options,
    correctId: correct,
    explanation: `${pokemon.name}은(는) ${correct}이에요!`,
    successText: () => `정답! ${correct}`,
  }
}

async function buildLoreQuestion(pokemon, seed) {
  const types = shuffleWithSeed(LORE_TYPES, seed)

  for (const qType of types) {
    if (qType === 'flavor' && pokemon.description) {
      return buildFlavorLoreQuestion(pokemon, seed)
    }
    if (qType === 'genus' && pokemon.genus) {
      return buildGenusLoreQuestion(pokemon, seed)
    }
    if (qType === 'color' && pokemon.color) {
      return buildColorLoreQuestion(pokemon, seed)
    }
    if (qType === 'category') {
      return buildCategoryLoreQuestion(pokemon, seed)
    }
  }

  return buildFlavorLoreQuestion(pokemon, seed)
}

const BUILDERS = {
  trivia: buildTriviaQuestion,
  type: buildTypeQuestion,
  cry: buildCryQuestion,
  lore: buildLoreQuestion,
}

export async function generateCategoryQuiz(categoryKey, count = QUESTIONS_PER_QUIZ) {
  const builder = BUILDERS[categoryKey]
  const pokemonIds = randomPokemonIds(count)

  const questions = await Promise.all(
    pokemonIds.map(async (id, i) => {
      const pokemon = await fetchPokemonQuiz(id)
      const seed = randomSeed() + i * 997
      return builder(pokemon, seed)
    }),
  )

  return questions.filter(Boolean)
}
