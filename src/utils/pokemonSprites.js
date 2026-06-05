const JSDELIVR_SPRITES = 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon'
const JSDELIVR_CRIES = 'https://cdn.jsdelivr.net/gh/PokeAPI/cries@main/cries/pokemon/latest'

/** raw.githubusercontent.com 차단 환경 → jsDelivr CDN */
export function rewriteMediaUrl(url) {
  if (!url) return null
  if (url.includes('raw.githubusercontent.com/PokeAPI/sprites'))
    return url.replace('https://raw.githubusercontent.com/PokeAPI/sprites/master/', 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/')
  if (url.includes('raw.githubusercontent.com/PokeAPI/cries'))
    return url.replace('https://raw.githubusercontent.com/PokeAPI/cries/main/', 'https://cdn.jsdelivr.net/gh/PokeAPI/cries@main/')
  return url
}

export function SPRITE_OFFICIAL(id) {
  return `${JSDELIVR_SPRITES}/other/official-artwork/${id}.png`
}

export function SPRITE_HOME(id) {
  return `${JSDELIVR_SPRITES}/other/home/${id}.png`
}

export function SPRITE_DEFAULT(id) {
  return `${JSDELIVR_SPRITES}/${id}.png`
}

export function SPRITE_POKEMON_COM(id) {
  return `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${String(id).padStart(3, '0')}.png`
}

export function SPRITE_FALLBACK(id) {
  return SPRITE_DEFAULT(id)
}

export function getSpriteCandidates(id, apiUrl) {
  const rewritten = rewriteMediaUrl(apiUrl)
  const list = [
    rewritten,
    SPRITE_OFFICIAL(id),
    SPRITE_HOME(id),
    SPRITE_DEFAULT(id),
    SPRITE_POKEMON_COM(id),
  ]
  return [...new Set(list.filter(Boolean))]
}

export function resolveSpriteUrl(pokemon, id) {
  const apiUrl =
    pokemon.sprites?.other?.['official-artwork']?.front_default
    || pokemon.sprites?.other?.home?.front_default
    || pokemon.sprites?.front_default

  return getSpriteCandidates(id, apiUrl)[0] || SPRITE_DEFAULT(id)
}

export function CRY_URL(id) {
  return `${JSDELIVR_CRIES}/${id}.ogg`
}

export function resolveCryUrl(pokemon, id) {
  const apiCry = pokemon.cries?.latest || pokemon.cries?.legacy
  return rewriteMediaUrl(apiCry) || CRY_URL(id)
}
