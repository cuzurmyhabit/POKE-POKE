import { useState, useEffect } from 'react'
import { PageHeader } from './Layout'
import PokemonImage from './PokemonImage'
import PokemonDetail from './PokemonDetail'
import TypeBadge from './TypeBadge'
import { fetchPokemonBatch } from '../services/pokemonApi'
import {
  TYPE_KO,
  TOTAL_POKEMON,
  ALL_TYPE_KEYS,
  GENERATIONS,
  getAllPokemonIds,
  getIdsForGeneration,
  normalizePokemonName,
} from '../utils/pokemonMeta'
import {
  hasNormalForm,
  hasShinyForm,
  getAllCaughtIds,
  getUniqueCaughtCount,
} from '../utils/storage'

function matchesSearch(id, pokemon, query, userData) {
  const q = query.trim()
  if (!q) return true

  const hasNormal = hasNormalForm(userData, id)
  const hasShiny = hasShinyForm(userData, id)
  if (!hasNormal && !hasShiny) return false

  const numOnly = q.replace(/^#/, '').match(/^\d+$/)
  if (numOnly) {
    return parseInt(numOnly[0], 10) === id
  }

  if (!pokemon) return false

  const normQ = normalizePokemonName(q)
  const name = normalizePokemonName(pokemon.name)
  const english = pokemon.englishName ? normalizePokemonName(pokemon.englishName) : ''

  return name.includes(normQ) || english.includes(normQ)
}

const META_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'caught', label: '획득만' },
  { key: 'shiny', label: '✨ 이로치' },
]

function getDisplayIds(filter, genFilter, userData) {
  if (filter === 'caught') return getAllCaughtIds(userData)
  if (filter === 'shiny') return userData.collectedShiny ?? []
  if (genFilter !== 'all') return getIdsForGeneration(Number(genFilter))
  return getAllPokemonIds()
}

export default function Encyclopedia({ userData }) {
  const [filter, setFilter] = useState('all')
  const [genFilter, setGenFilter] = useState('all')
  const [pokemonMap, setPokemonMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const displayIds = getDisplayIds(filter, genFilter, userData)

  useEffect(() => {
    if (filter === 'caught' && getAllCaughtIds(userData).length === 0) {
      setPokemonMap({})
      return
    }
    if (filter === 'shiny' && (userData.collectedShiny?.length ?? 0) === 0) {
      setPokemonMap({})
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadProgress(0)

    fetchPokemonBatch(displayIds, (map, loaded, total) => {
      if (!cancelled) {
        setPokemonMap(map)
        setLoadProgress(Math.round((loaded / total) * 100))
      }
    }).then(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [filter, genFilter, userData.collectedPokemon, userData.collectedShiny])

  const typeFiltered = displayIds.filter((id) => {
    const p = pokemonMap[id]
    if (filter === 'shiny') return true
    if (!p) return filter !== 'caught'
    if (filter === 'caught') return true
    if (filter === 'all') return true
    return p.types.includes(filter)
  })

  const filtered = typeFiltered.filter((id) =>
    matchesSearch(id, pokemonMap[id], searchQuery, userData),
  )

  const caught = getUniqueCaughtCount(userData)
  const shinyCount = userData.collectedShiny?.length ?? 0
  const percent = ((caught / TOTAL_POKEMON) * 100).toFixed(1)

  return (
    <div className="encyclopedia-page">
      <PageHeader
        title="내 포켓몬 도감"
        subtitle="포켓몬을 클릭하면 상세 정보를 볼 수 있어요!"
      />

      <div className="encyclopedia-stats">
        <div><strong>{caught}</strong> 획득</div>
        <div><strong>{shinyCount}</strong> ✨ 이로치</div>
        <div><strong>{percent}%</strong> 완성도</div>
        <div><strong>{userData.totalScore}</strong> 총 점수</div>
        <span className="remaining">{TOTAL_POKEMON - caught}마리 남았어요</span>
      </div>

      <div className="encyclopedia-search">
        <span className="encyclopedia-search-icon" aria-hidden>🔍</span>
        <input
          type="search"
          className="encyclopedia-search-input"
          placeholder="획득한 포켓몬만 검색 (예: 피카츄, 25)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="encyclopedia-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {searchQuery.trim() && (
        <p className="encyclopedia-search-result">
          검색 결과 <strong>{filtered.length}</strong>마리
        </p>
      )}

      <div className="filter-bar gen-filter-bar">
        <button
          type="button"
          className={`filter-btn ${genFilter === 'all' ? 'active' : ''}`}
          onClick={() => setGenFilter('all')}
        >
          전 세대
        </button>
        {GENERATIONS.map((g) => (
          <button
            key={g.gen}
            type="button"
            className={`filter-btn ${genFilter === String(g.gen) ? 'active' : ''}`}
            onClick={() => setGenFilter(String(g.gen))}
          >
            {g.gen}세대
          </button>
        ))}
      </div>

      <div className="filter-bar">
        {META_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`filter-btn ${filter === f.key ? 'active' : ''} ${f.key === 'shiny' ? 'filter-btn-shiny' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        {filter !== 'shiny' && ALL_TYPE_KEYS.map((typeKey) => (
          <button
            key={typeKey}
            type="button"
            className={`filter-btn type-filter-btn type-filter-${typeKey} ${filter === typeKey ? 'active' : ''}`}
            onClick={() => setFilter(typeKey)}
          >
            {TYPE_KO[typeKey]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="encyclopedia-loading">
          <div className="collection-progress-bar">
            <div className="collection-progress-fill" style={{ width: `${loadProgress}%` }} />
          </div>
          <span>포켓몬 불러오는 중... {loadProgress}%</span>
        </div>
      )}

      {filter === 'caught' && caught === 0 && !searchQuery.trim() && (
        <div className="empty-collection">
          <p>아직 획득한 포켓몬이 없어요.</p>
          <span>실루엣 퀴즈나 랜덤 퀴즈에서 정답을 맞혀 도감을 채워보세요!</span>
        </div>
      )}

      {filter === 'shiny' && shinyCount === 0 && !searchQuery.trim() && (
        <div className="empty-collection">
          <p>아직 이로치를 획득하지 못했어요.</p>
          <span>퀴즈나 실루엣에서 이로치가 나오면 도감에 등록됩니다!</span>
        </div>
      )}

      {searchQuery.trim() && filtered.length === 0 && !loading && (
        <div className="empty-collection">
          <p>검색 결과가 없어요.</p>
          <span>획득한 포켓몬만 검색됩니다. 다른 이름이나 번호로 다시 시도해보세요.</span>
        </div>
      )}

      <div className="pokedex-grid">
        {filtered.map((id) => {
          const p = pokemonMap[id]
          const hasNormal = hasNormalForm(userData, id)
          const hasShinyCaught = hasShinyForm(userData, id)
          const isCaught = hasNormal || hasShinyCaught
          const showShinyOnCard = filter === 'shiny' && hasShinyCaught

          if (!p) return <div key={id} className="pokedex-card loading-card" />

          return (
            <button
              key={id}
              type="button"
              className={`pokedex-card clickable ${isCaught ? 'caught' : 'locked'} ${showShinyOnCard ? 'shiny-card' : ''} type-${p.types[0]}`}
              onClick={() => setSelectedId(id)}
            >
              {hasShinyCaught && filter !== 'shiny' && (
                <span className="pokedex-mini-shiny" title="이로치 획득">✨</span>
              )}
              <div className="pokedex-sprite-wrap">
                <PokemonImage
                  id={id}
                  src={showShinyOnCard ? p.shinySprite : p.sprite}
                  alt={isCaught ? p.name : '실루엣'}
                  shiny={showShinyOnCard}
                  className={`pokedex-sprite ${isCaught ? '' : 'silhouette-preview'}`}
                />
              </div>
              <span className="pokedex-number">#{String(id).padStart(4, '0')}</span>
              <span className="pokedex-name">{isCaught ? p.name : '???'}</span>
              {isCaught && (
                <div className="pokedex-types">
                  {p.types.map((t) => (
                    <TypeBadge key={t} typeKey={t} size="sm" />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedId !== null && (
        <PokemonDetail
          pokemonId={selectedId}
          collectedPokemon={userData.collectedPokemon}
          collectedShiny={userData.collectedShiny}
          onClose={() => setSelectedId(null)}
          onSelectPokemon={setSelectedId}
        />
      )}
    </div>
  )
}
