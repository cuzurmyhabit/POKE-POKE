import { useState, useEffect, useRef, useMemo } from 'react'
import PokemonImage from './PokemonImage'
import { fetchPokemon, countEvolutionNodes } from '../services/pokemonApi'
import TypeBadge from './TypeBadge'
import {
  getGeneration,
  getGenerationLabel,
  STAT_COLORS,
} from '../utils/pokemonMeta'

function EvolutionCard({ node, currentId, isCaught, onSelect }) {
  return (
    <button
      type="button"
      className={`detail-evo-item ${node.id === currentId ? 'current' : ''} ${!isCaught ? 'locked' : ''}`}
      onClick={() => onSelect?.(node.id)}
    >
      <PokemonImage
        id={node.id}
        src={null}
        alt={isCaught ? node.name : '???'}
        className={`detail-evo-sprite ${isCaught ? '' : 'silhouette-preview'}`}
      />
      <span>{isCaught ? node.name : '???'}</span>
    </button>
  )
}

function EvolutionNode({ node, currentId, isPokemonCaught, onSelectPokemon }) {
  if (!node) return null

  const hasBranches = node.children.length > 1

  return (
    <div className={`evo-tree-node ${hasBranches ? 'has-branches' : ''}`}>
      <EvolutionCard
        node={node}
        currentId={currentId}
        isCaught={isPokemonCaught(node.id)}
        onSelect={onSelectPokemon}
      />

      {node.children.length > 0 && (
        hasBranches ? (
          <div className="evo-tree-fork">
            <span className="detail-evo-arrow fork-arrow">→</span>
            <div className="evo-tree-branches">
              {node.children.map((child) => (
                <div key={child.id} className="evo-tree-branch">
                  <EvolutionNode
                    node={child}
                    currentId={currentId}
                    isPokemonCaught={isPokemonCaught}
                    onSelectPokemon={onSelectPokemon}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <span className="detail-evo-arrow">→</span>
            <EvolutionNode
              node={node.children[0]}
              currentId={currentId}
              isPokemonCaught={isPokemonCaught}
              onSelectPokemon={onSelectPokemon}
            />
          </>
        )
      )}
    </div>
  )
}

export default function PokemonDetail({
  pokemonId,
  collectedPokemon = [],
  collectedShiny = [],
  onClose,
  onSelectPokemon,
}) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewShiny, setViewShiny] = useState(false)
  const audioRef = useRef(null)

  const hasNormal = collectedPokemon.includes(pokemonId)
  const hasShiny = collectedShiny.includes(pokemonId)
  const hasAnyForm = hasNormal || hasShiny

  const collectedSet = useMemo(
    () => new Set([...collectedPokemon, ...collectedShiny]),
    [collectedPokemon, collectedShiny],
  )

  const isPokemonCaught = (id) => collectedSet.has(id)
  const viewingShiny = viewShiny && hasShiny
  const isFormCaught = viewingShiny ? hasShiny : hasNormal

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchPokemon(pokemonId).then((data) => {
      if (!cancelled) {
        setDetail(data)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [pokemonId])

  useEffect(() => {
    if (hasShiny && !hasNormal) setViewShiny(true)
    else setViewShiny(false)
  }, [pokemonId, hasNormal, hasShiny])

  useEffect(() => {
    if (!detail?.cry || !isFormCaught) return
    const audio = audioRef.current
    if (!audio) return
    audio.src = detail.cry
    audio.load()
  }, [detail?.cry, isFormCaught])

  const playCry = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    audio.play().catch(() => {})
  }

  const maxStat = detail?.stats?.length
    ? Math.max(...detail.stats.map((s) => s.value), 1)
    : 1

  const statTotal = detail?.stats?.reduce((sum, s) => sum + s.value, 0) ?? 0

  return (
    <div className="detail-overlay" onClick={onClose} role="presentation">
      <div
        className={`detail-modal type-${detail?.types?.[0] ?? 'normal'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button type="button" className="detail-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        {loading ? (
          <div className="detail-loading">
            <div className="spinner" />
            <p>상세 정보 불러오는 중...</p>
          </div>
        ) : detail && (
          <>
            <div className="detail-header">
              <div className={`detail-image-wrap ${isFormCaught ? '' : 'silhouette-wrap'} ${isFormCaught && viewingShiny ? 'shiny-detail-wrap' : ''}`}>
                <PokemonImage
                  id={detail.id}
                  src={isFormCaught && viewingShiny ? detail.shinySprite : detail.sprite}
                  alt={isFormCaught ? detail.name : '실루엣'}
                  shiny={isFormCaught && viewingShiny}
                  className={`detail-sprite ${isFormCaught ? '' : 'silhouette-preview'} ${isFormCaught && viewingShiny ? 'shiny-detail-sprite' : ''}`}
                />
              </div>
              <div className="detail-title-block">
                <span className="detail-number">No. {String(detail.id).padStart(4, '0')}</span>
                <h2 className="detail-name">
                  {isFormCaught ? detail.name : '???'}
                  {isFormCaught && viewingShiny && <span className="detail-shiny-badge"> ✨</span>}
                </h2>

                {hasAnyForm && detail.canShiny !== false && (
                  <div className="detail-form-toggle">
                    <button
                      type="button"
                      className={`detail-form-btn ${!viewShiny ? 'active' : ''} ${!hasNormal ? 'locked' : ''}`}
                      onClick={() => setViewShiny(false)}
                      disabled={!hasNormal}
                    >
                      일반
                    </button>
                    <button
                      type="button"
                      className={`detail-form-btn shiny ${viewShiny ? 'active' : ''} ${!hasShiny ? 'locked' : ''}`}
                      onClick={() => setViewShiny(true)}
                      disabled={!hasShiny}
                    >
                      ✨ 이로치
                    </button>
                  </div>
                )}

                {isFormCaught && detail.genus && (
                  <span className="detail-genus">{detail.genus}</span>
                )}
                {isFormCaught && (
                  <div className="detail-types">
                    {detail.types.map((t) => (
                      <TypeBadge key={t} typeKey={t} size="md" />
                    ))}
                  </div>
                )}
                {isFormCaught ? (
                  <button type="button" className="detail-cry-btn" onClick={playCry}>
                    🔊 울음소리 듣기
                  </button>
                ) : (
                  <span className="detail-locked-badge">
                    🔒 {viewShiny ? '이로치 미획득' : '미획득 · 실루엣'}
                  </span>
                )}
                <audio ref={audioRef} preload="auto" />
              </div>
            </div>

            {isFormCaught ? (
              <>
                <p className="detail-description">{detail.description}</p>

                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <span className="detail-info-label">키</span>
                    <span className="detail-info-value">{detail.height} m</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-label">몸무게</span>
                    <span className="detail-info-value">{detail.weight} kg</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-label">세대</span>
                    <span className="detail-info-value">{getGenerationLabel(getGeneration(detail.id))}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-label">영문명</span>
                    <span className="detail-info-value">{detail.englishName}</span>
                  </div>
                  <div className="detail-info-item detail-shiny-item">
                    <span className="detail-info-label">✨ 이로치 확률</span>
                    <span className={`detail-info-value ${detail.shinyInfo?.canShiny ? 'shiny-available' : 'shiny-unavailable'}`}>
                      {detail.shinyInfo?.oddsText ?? '-'}
                      {detail.shinyInfo?.canShiny && (
                        <span className="detail-shiny-percent"> ({detail.shinyInfo.percentText})</span>
                      )}
                    </span>
                  </div>
                </div>

                {detail.stats.length > 0 && (
                  <div className="detail-section">
                    <div className="detail-section-header">
                      <h3>종족값</h3>
                      <span className="detail-stat-total">총합 <strong>{statTotal}</strong></span>
                    </div>
                    <div className="detail-stats">
                      {detail.stats.map((stat) => (
                        <div key={stat.name} className="detail-stat-row">
                          <span
                            className="detail-stat-label"
                            style={{ color: STAT_COLORS[stat.name] }}
                          >
                            {stat.label}
                          </span>
                          <div className="detail-stat-bar-wrap">
                            <div
                              className="detail-stat-bar"
                              style={{
                                width: `${(stat.value / maxStat) * 100}%`,
                                background: STAT_COLORS[stat.name],
                              }}
                            />
                          </div>
                          <span
                            className="detail-stat-value"
                            style={{ color: STAT_COLORS[stat.name] }}
                          >
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="detail-locked-body">
                <p>아직 획득하지 못한 포켓몬이에요.</p>
                <span>실루엣 퀴즈나 랜덤 퀴즈에서 정답을 맞혀 도감에 등록하세요!</span>
                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <span className="detail-info-label">세대</span>
                    <span className="detail-info-value">{getGenerationLabel(getGeneration(detail.id))}</span>
                  </div>
                </div>
              </div>
            )}

            {detail.evolutionTree && countEvolutionNodes(detail.evolutionTree) > 1 && (
              <div className="detail-section">
                <h3>진화</h3>
                <div className="detail-evolution evo-tree-root">
                  <EvolutionNode
                    node={detail.evolutionTree}
                    currentId={detail.id}
                    isPokemonCaught={isPokemonCaught}
                    onSelectPokemon={onSelectPokemon}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
