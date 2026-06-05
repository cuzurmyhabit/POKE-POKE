import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from './Layout'
import { formatDateLong, getTodayKey, getSilhouetteState, MAX_SILHOUETTE_PER_DAY } from '../utils/storage'
import { fetchPokemonBasic } from '../services/pokemonApi'
import PokemonImage from './PokemonImage'
import { TYPE_KO, TOTAL_POKEMON } from '../utils/pokemonMeta'

const PREVIEW_SLOTS = 8

export default function Home({ userData }) {
  const navigate = useNavigate()
  const today = getTodayKey()
  const silhouetteState = getSilhouetteState(userData)
  const silhouetteDone = silhouetteState.attempts >= MAX_SILHOUETTE_PER_DAY
  const collected = userData.collectedPokemon
  const caught = collected.length
  const percent = ((caught / TOTAL_POKEMON) * 100).toFixed(1)

  const [pokemonMap, setPokemonMap] = useState({})

  useEffect(() => {
    const previewIds = Array.from({ length: PREVIEW_SLOTS }, (_, i) => i + 1)
    Promise.all(previewIds.map(fetchPokemonBasic)).then((list) => {
      const map = {}
      list.forEach((p) => { map[p.id] = p })
      setPokemonMap(map)
    })
  }, [])

  useEffect(() => {
    if (collected.length === 0) return
    Promise.all(collected.map(fetchPokemonBasic)).then((list) => {
      setPokemonMap((prev) => {
        const map = { ...prev }
        list.forEach((p) => { map[p.id] = p })
        return map
      })
    })
  }, [collected])

  const previewCards = Array.from({ length: PREVIEW_SLOTS }, (_, i) => {
    const id = i + 1
    const isCaught = collected.includes(id)
    const p = pokemonMap[id]
    return { id, isCaught, pokemon: p }
  })

  return (
    <div className="home-page">
      <PageHeader
        title="오늘의 도전"
        subtitle="퀴즈를 풀고 포켓몬을 도감에 추가하세요!"
        badge={`📅 ${formatDateLong(today)}`}
      />

      <div className="challenge-cards">
        <button
          type="button"
          className="challenge-card"
          onClick={() => navigate('/silhouette')}
        >
          <div className="challenge-icon silhouette-icon">🌙</div>
          <h3>오늘의 실루엣</h3>
          <p>
            포켓몬의 검은 그림자만 보고 누구인지 맞혀보세요.
            매일 새로운 포켓몬이 등장합니다!
          </p>
          {silhouetteDone ? (
            <span className="status-done">✅ 오늘 완료!</span>
          ) : (
            <span className="status-progress">
              📜 {silhouetteState.attempts} / {MAX_SILHOUETTE_PER_DAY} 완료
            </span>
          )}
        </button>

        <button
          type="button"
          className="challenge-card"
          onClick={() => navigate('/quiz')}
        >
          <div className="challenge-icon quiz-icon">⚡</div>
          <h3>포켓몬 퀴즈</h3>
          <p>
            상식·상성, 타입, 울음소리, 설정 — 카테고리별 랜덤 2문제!
            원하는 퀴즈를 골라 도전하세요.
          </p>
          <span className="status-pending">퀴즈 선택하기 →</span>
        </button>
      </div>

      <section className="home-pokedex-section">
        <div className="home-pokedex-header">
          <div>
            <h3>내 포켓몬 도감</h3>
            <p>정답을 맞힌 포켓몬이 컬러로 활성화됩니다</p>
          </div>
          <button type="button" className="link-btn" onClick={() => navigate('/dogam')}>
            전체 보기 →
          </button>
        </div>

        <div className="home-pokedex-grid">
          {previewCards.map(({ id, isCaught, pokemon }) => (
            <div
              key={id}
              className={`pokedex-card mini ${isCaught ? 'caught' : 'locked'} ${pokemon ? `type-${pokemon.types[0]}` : ''}`}
            >
              {isCaught && pokemon ? (
                <PokemonImage id={id} src={pokemon.sprite} alt={pokemon.name} className="pokedex-sprite" />
              ) : (
                <span className="pokedex-unknown">?</span>
              )}
              <span className="pokedex-number">#{String(id).padStart(3, '0')}</span>
              <span className="pokedex-name">{isCaught && pokemon ? pokemon.name : '???'}</span>
            </div>
          ))}
        </div>

        <div className="collection-progress">
          <div className="collection-progress-info">
            <span>{caught}마리 획득 · {TOTAL_POKEMON}마리 전체</span>
            <span>{percent}%</span>
          </div>
          <div className="collection-progress-bar">
            <div className="collection-progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>
    </div>
  )
}
