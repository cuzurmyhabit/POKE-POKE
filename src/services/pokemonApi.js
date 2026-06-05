import { TOTAL_POKEMON, getShinyRateInfo } from '../utils/pokemonMeta'
import { resolveSpriteUrl, resolveCryUrl, SPRITE_DEFAULT, CRY_URL } from '../utils/pokemonSprites'

const BASE = 'https://pokeapi.co/api/v2'

const cache = new Map()

const STAT_KO = {
  hp: 'HP',
  attack: '공격',
  defense: '방어',
  'special-attack': '특수공격',
  'special-defense': '특수방어',
  speed: '스피드',
}

async function fetchJson(url) {
  if (cache.has(url)) return cache.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  cache.set(url, data)
  return data
}

export function getKoreanName(species) {
  const ko = species.names?.find((n) => n.language.name === 'ko')
  return ko?.name ?? species.name
}

function getKoreanFlavorText(species) {
  const koEntries = species.flavor_text_entries?.filter((e) => e.language.name === 'ko') ?? []
  const text = koEntries.length > 0
    ? koEntries[koEntries.length - 1].flavor_text
    : species.flavor_text_entries?.find((e) => e.language.name === 'en')?.flavor_text
  return text?.replace(/\f/g, ' ').replace(/\n/g, ' ') ?? '아직 발견되지 않은 포켓몬입니다.'
}

function getKoreanGenus(species) {
  return species.genera?.find((g) => g.language.name === 'ko')?.genus ?? ''
}

export function getPokemonSprite(pokemon, id) {
  return resolveSpriteUrl(pokemon, id)
}

export function getPokemonCry(pokemon, id) {
  return resolveCryUrl(pokemon, id)
}

function fallbackPokemon(id) {
  return {
    id,
    name: `포켓몬 #${id}`,
    englishName: '',
    sprite: SPRITE_DEFAULT(id),
    cry: CRY_URL(id),
    types: ['normal'],
  }
}

function mapPokemon(pokemon, species, extra = {}) {
  const id = pokemon.id
  return {
    id,
    name: getKoreanName(species),
    englishName: pokemon.name,
    sprite: getPokemonSprite(pokemon, id),
    cry: getPokemonCry(pokemon, id),
    types: pokemon.types.map((t) => t.type.name),
    ...extra,
  }
}

function mapStats(pokemon) {
  return pokemon.stats.map((s) => ({
    name: s.stat.name,
    label: STAT_KO[s.stat.name] ?? s.stat.name,
    value: s.base_stat,
  }))
}

function getEvolutionLine(chain) {
  const line = []
  function walk(node) {
    line.push(Number(node.species.url.match(/\/(\d+)\//)[1]))
    node.evolves_to.forEach(walk)
  }
  walk(chain.chain)
  return line
}

async function getEvolutionNames(chain) {
  if (!chain) return []
  const ids = getEvolutionLine(chain)
  const names = await Promise.all(
    ids.map(async (id) => {
      try {
        const species = await fetchJson(`${BASE}/pokemon-species/${id}`)
        return { id, name: getKoreanName(species) }
      } catch {
        return { id, name: `#${id}` }
      }
    }),
  )
  return names
}

export async function fetchPokemon(id) {
  try {
    const [pokemon, species] = await Promise.all([
      fetchJson(`${BASE}/pokemon/${id}`),
      fetchJson(`${BASE}/pokemon-species/${id}`),
    ])

    let evolutionChain = null
    try {
      const evolutionChainUrl = species.evolution_chain?.url
      if (evolutionChainUrl) {
        evolutionChain = await fetchJson(evolutionChainUrl)
      }
    } catch {
      evolutionChain = null
    }

    const evolutionLine = await getEvolutionNames(evolutionChain)

    const hasShinySprite = Boolean(
      pokemon.sprites?.front_shiny
      || pokemon.sprites?.other?.['official-artwork']?.front_shiny,
    )

    return {
      ...mapPokemon(pokemon, species),
      weight: pokemon.weight / 10,
      height: pokemon.height / 10,
      stats: mapStats(pokemon),
      description: getKoreanFlavorText(species),
      genus: getKoreanGenus(species),
      color: species.color?.name ?? 'unknown',
      isLegendary: species.is_legendary ?? false,
      isMythical: species.is_mythical ?? false,
      shinyInfo: getShinyRateInfo(hasShinySprite),
      evolutionLine,
      species,
      evolutionChain,
    }
  } catch {
    return {
      ...fallbackPokemon(id),
      weight: 0,
      height: 0,
      stats: [],
      description: '정보를 불러올 수 없습니다.',
      genus: '',
      shinyInfo: getShinyRateInfo(false),
      evolutionLine: [],
      species: null,
      evolutionChain: null,
    }
  }
}

export async function fetchPokemonBasic(id) {
  try {
    const [pokemon, species] = await Promise.all([
      fetchJson(`${BASE}/pokemon/${id}`),
      fetchJson(`${BASE}/pokemon-species/${id}`),
    ])
    return mapPokemon(pokemon, species)
  } catch {
    return fallbackPokemon(id)
  }
}

export function getNextEvolution(pokemon) {
  if (!pokemon.evolutionChain) return null
  const line = getEvolutionLine(pokemon.evolutionChain)
  const idx = line.indexOf(pokemon.id)
  if (idx === -1 || idx >= line.length - 1) return null
  return line[idx + 1]
}

export async function fetchPokemonBatch(ids, onBatch) {
  const BATCH_SIZE = 20
  const map = {}

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map((id) => fetchPokemonBasic(id)))
    results.forEach((p) => { map[p.id] = p })
    onBatch?.({ ...map }, Math.min(i + BATCH_SIZE, ids.length), ids.length)
    await new Promise((r) => setTimeout(r, 100))
  }

  return map
}

export async function fetchRandomPokemonIds(count, exclude = [], pool = TOTAL_POKEMON) {
  const ids = new Set(exclude)
  const result = []
  while (result.length < count) {
    const id = 1 + Math.floor(Math.random() * pool)
    if (!ids.has(id)) {
      ids.add(id)
      result.push(id)
    }
  }
  return result
}
