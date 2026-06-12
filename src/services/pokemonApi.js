import { TOTAL_POKEMON, getShinyRateInfo } from '../utils/pokemonMeta'
import { resolveSpriteUrl, resolveCryUrl, resolveShinySpriteUrl, SPRITE_OFFICIAL, CRY_URL } from '../utils/pokemonSprites'

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

async function fetchJson(url, retries = 2) {
  if (cache.has(url)) return cache.get(url)

  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      cache.set(url, data)
      return data
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      }
    }
  }
  throw lastError
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

export function getPokemonShinySprite(pokemon, id) {
  return resolveShinySpriteUrl(pokemon, id)
}

export function getPokemonCanShiny(pokemon) {
  return Boolean(
    pokemon.sprites?.front_shiny
    || pokemon.sprites?.other?.['official-artwork']?.front_shiny,
  )
}

export function getPokemonCry(pokemon, id) {
  return resolveCryUrl(pokemon, id)
}

function fallbackPokemon(id) {
  return {
    id,
    name: `포켓몬 #${id}`,
    englishName: '',
    sprite: SPRITE_OFFICIAL(id),
    shinySprite: resolveShinySpriteUrl({}, id),
    canShiny: true,
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
    shinySprite: getPokemonShinySprite(pokemon, id),
    canShiny: getPokemonCanShiny(pokemon),
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

function parseEvolutionNode(node) {
  const id = Number(node.species.url.match(/\/(\d+)\//)[1])
  return {
    id,
    name: '',
    children: (node.evolves_to ?? []).map(parseEvolutionNode),
  }
}

async function enrichEvolutionTree(node) {
  try {
    const species = await fetchJson(`${BASE}/pokemon-species/${node.id}`)
    node.name = getKoreanName(species)
  } catch {
    node.name = `#${node.id}`
  }
  await Promise.all(node.children.map(enrichEvolutionTree))
  return node
}

async function buildEvolutionTree(chain) {
  if (!chain?.chain) return null
  const root = parseEvolutionNode(chain.chain)
  await enrichEvolutionTree(root)
  return root
}

export function findEvolutionNode(tree, id) {
  if (!tree) return null
  if (tree.id === id) return tree
  for (const child of tree.children) {
    const found = findEvolutionNode(child, id)
    if (found) return found
  }
  return null
}

export function countEvolutionNodes(tree) {
  if (!tree) return 0
  return 1 + tree.children.reduce((sum, child) => sum + countEvolutionNodes(child), 0)
}

export function getDirectEvolutions(pokemon) {
  const node = findEvolutionNode(pokemon.evolutionTree, pokemon.id)
  return node?.children.map((child) => child.id) ?? []
}

export function getNextEvolution(pokemon) {
  const direct = getDirectEvolutions(pokemon)
  return direct.length === 1 ? direct[0] : null
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

    const evolutionTree = await buildEvolutionTree(evolutionChain)

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
      evolutionTree,
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
      evolutionTree: null,
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

export async function fetchPokemonQuiz(id) {
  try {
    const [pokemon, species] = await Promise.all([
      fetchJson(`${BASE}/pokemon/${id}`),
      fetchJson(`${BASE}/pokemon-species/${id}`),
    ])
    return {
      ...mapPokemon(pokemon, species),
      weight: pokemon.weight / 10,
      height: pokemon.height / 10,
      description: getKoreanFlavorText(species),
      genus: getKoreanGenus(species),
      color: species.color?.name ?? 'unknown',
      isLegendary: species.is_legendary ?? false,
      isMythical: species.is_mythical ?? false,
      evolutionTree: null,
      evolutionChain: null,
    }
  } catch {
    return {
      ...fallbackPokemon(id),
      weight: 0,
      height: 0,
      description: '정보를 불러올 수 없습니다.',
      genus: '',
      color: 'unknown',
      isLegendary: false,
      isMythical: false,
      evolutionTree: null,
      evolutionChain: null,
    }
  }
}

export async function attachEvolutionTree(pokemon) {
  if (pokemon.evolutionTree) return pokemon

  try {
    const species = await fetchJson(`${BASE}/pokemon-species/${pokemon.id}`)
    const chainUrl = species.evolution_chain?.url
    if (!chainUrl) return { ...pokemon, evolutionTree: null, evolutionChain: null }

    const evolutionChain = await fetchJson(chainUrl)
    const evolutionTree = await buildEvolutionTree(evolutionChain)
    return { ...pokemon, evolutionTree, evolutionChain }
  } catch {
    return { ...pokemon, evolutionTree: null, evolutionChain: null }
  }
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
