import { useState, useEffect } from 'react'
import { PageHeader } from './Layout'
import PokemonImage from './PokemonImage'
import PokemonDetail from './PokemonDetail'
import { fetchPokemonBatch } from '../services/pokemonApi'
import {
  TYPE_KO,
  TOTAL_POKEMON,
  ALL_TYPE_KEYS,
  GENERATIONS,
  getTypeFilterLabel,
  getAllPokemonIds,
  getIdsForGeneration,
} from '../utils/pokemonMeta'

const META_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'caught', label: '획득만' },
]

function getDisplayIds(filter, genFilter, collected) {
  if (filter === 'caught') return collected
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
  const collected = userData.collectedPokemon

  const displayIds = getDisplayIds(filter, genFilter, collected)

  useEffect(() => {
    if (filter === 'caught' && collected.length === 0) {
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
  }, [filter, genFilter, userData.collectedPokemon])

  const filtered = displayIds.filter((id) => {
    const p = pokemonMap[id]
    if (!p) return filter !== 'caught'
    if (filter === 'caught') return true
    if (filter === 'all') return true
    return p.types.includes(filter)
  })

  const caught = collected.length
  const percent = ((caught / TOTAL_POKEMON) * 100).toFixed(1)

  return (
    <div className="encyclopedia-page">
      <PageHeader
        title="내 포켓몬 도감"
        subtitle="포켓몬을 클릭하면 상세 정보를 볼 수 있어요!"
      />

      <div className="encyclopedia-stats">
        <div><strong>{caught}</strong> 획득</div>
        <div><strong>{TOTAL_POKEMON}</strong> 전체</div>
        <div><strong>{percent}%</strong> 완성도</div>
        <div><strong>{userData.totalScore}</strong> 총 점수</div>
        <span className="remaining">{TOTAL_POKEMON - caught}마리 남았어요</span>
      </div>

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
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        {ALL_TYPE_KEYS.map((typeKey) => (
          <button
            key={typeKey}
            type="button"
            className={`filter-btn type-filter-btn type-filter-${typeKey} ${filter === typeKey ? 'active' : ''}`}
            onClick={() => setFilter(typeKey)}
          >
            {getTypeFilterLabel(typeKey)}
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

      {filter === 'caught' && caught === 0 && (
        <div className="empty-collection">
          <p>아직 획득한 포켓몬이 없어요.</p>
          <span>실루엣 퀴즈나 랜덤 퀴즈에서 정답을 맞혀 도감을 채워보세요!</span>
        </div>
      )}

      <div className="pokedex-grid">
        {filtered.map((id) => {
          const p = pokemonMap[id]
          const isCaught = collected.includes(id)
          if (!p) return <div key={id} className="pokedex-card loading-card" />
          return (
            <button
              key={id}
              type="button"
              className={`pokedex-card clickable ${isCaught ? 'caught' : 'locked'} type-${p.types[0]}`}
              onClick={() => setSelectedId(id)}
            >
              <PokemonImage
                id={id}
                src={p.sprite}
                alt={isCaught ? p.name : '실루엣'}
                className={`pokedex-sprite ${isCaught ? '' : 'silhouette-preview'}`}
              />
              <span className="pokedex-number">#{String(id).padStart(4, '0')}</span>
              <span className="pokedex-name">{isCaught ? p.name : '???'}</span>
              {isCaught && (
                <span className="pokedex-type">
                  {p.types.map((t) => TYPE_KO[t]).join('/')}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectedId !== null && (
        <PokemonDetail
          pokemonId={selectedId}
          isCaught={collected.includes(selectedId)}
          collectedPokemon={collected}
          onClose={() => setSelectedId(null)}
          onSelectPokemon={setSelectedId}
        />
      )}
    </div>
  )
}
