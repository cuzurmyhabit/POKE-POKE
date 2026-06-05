import { useState, useEffect, useRef, useMemo } from 'react'
import PokemonImage from './PokemonImage'
import { fetchPokemon } from '../services/pokemonApi'
import {
  TYPE_KO,
  TYPE_EMOJI,
  TYPE_COLORS,
  getGeneration,
  getGenerationLabel,
  STAT_COLORS,
} from '../utils/pokemonMeta'

export default function PokemonDetail({
  pokemonId,
  isCaught,
  collectedPokemon = [],
  onClose,
  onSelectPokemon,
}) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef(null)
  const collectedSet = useMemo(() => new Set(collectedPokemon), [collectedPokemon])

  const isPokemonCaught = (id) => collectedSet.has(id)

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
    if (!detail?.cry || !isCaught) return
    const audio = audioRef.current
    if (!audio) return
    audio.src = detail.cry
    audio.load()
  }, [detail?.cry, isCaught])

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
              <div className={`detail-image-wrap ${isCaught ? '' : 'silhouette-wrap'}`}>
                <PokemonImage
                  id={detail.id}
                  src={detail.sprite}
                  alt={isCaught ? detail.name : '실루엣'}
                  className={`detail-sprite ${isCaught ? '' : 'silhouette-preview'}`}
                />
              </div>
              <div className="detail-title-block">
                <span className="detail-number">No. {String(detail.id).padStart(4, '0')}</span>
                <h2 className="detail-name">{isCaught ? detail.name : '???'}</h2>
                {isCaught && detail.genus && (
                  <span className="detail-genus">{detail.genus}</span>
                )}
                {isCaught && (
                  <div className="detail-types">
                    {detail.types.map((t) => (
                      <span
                        key={t}
                        className="detail-type-badge"
                        style={{ background: TYPE_COLORS[t] }}
                      >
                        {TYPE_EMOJI[t]} {TYPE_KO[t]}
                      </span>
                    ))}
                  </div>
                )}
                {isCaught ? (
                  <button type="button" className="detail-cry-btn" onClick={playCry}>
                    🔊 울음소리 듣기
                  </button>
                ) : (
                  <span className="detail-locked-badge">🔒 미획득 · 실루엣</span>
                )}
                <audio ref={audioRef} preload="auto" />
              </div>
            </div>

            {isCaught ? (
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

            {detail.evolutionLine.length > 1 && (
              <div className="detail-section">
                <h3>진화</h3>
                <div className="detail-evolution">
                  {detail.evolutionLine.map((evo, i) => {
                    const evoCaught = isPokemonCaught(evo.id)
                    return (
                      <span key={evo.id} className="detail-evo-chain">
                        <button
                          type="button"
                          className={`detail-evo-item ${evo.id === detail.id ? 'current' : ''} ${!evoCaught ? 'locked' : ''}`}
                          onClick={() => onSelectPokemon?.(evo.id)}
                        >
                          <PokemonImage
                            id={evo.id}
                            src={null}
                            alt={evoCaught ? evo.name : '???'}
                            className={`detail-evo-sprite ${evoCaught ? '' : 'silhouette-preview'}`}
                          />
                          <span>{evoCaught ? evo.name : '???'}</span>
                        </button>
                        {i < detail.evolutionLine.length - 1 && (
                          <span className="detail-evo-arrow">→</span>
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
