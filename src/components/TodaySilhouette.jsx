import { useState, useEffect, useRef } from 'react'
import { PageHeader } from './Layout'
import PokemonImage from './PokemonImage'
import { fetchPokemonBasic } from '../services/pokemonApi'
import { silhouettePokemonId, shuffleWithSeed, hashString } from '../utils/seed'
import {
  TYPE_KO,
  TYPE_EMOJI,
  getGeneration,
  getGenerationLabel,
  normalizePokemonName,
  TOTAL_POKEMON,
} from '../utils/pokemonMeta'
import {
  getTodayKey,
  formatDateDisplay,
  getSilhouetteState,
  MAX_SILHOUETTE_PER_DAY,
} from '../utils/storage'

export default function TodaySilhouette({ userData, onComplete }) {
  const today = getTodayKey()
  const silhouetteState = getSilhouetteState(userData)
  const allDone = silhouetteState.attempts >= MAX_SILHOUETTE_PER_DAY

  const [attemptIndex, setAttemptIndex] = useState(silhouetteState.attempts)
  const [pokemon, setPokemon] = useState(null)
  const [options, setOptions] = useState([])
  const [mode, setMode] = useState('choice')
  const [selected, setSelected] = useState(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [loading, setLoading] = useState(!allDone)
  const [error, setError] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const [roundComplete, setRoundComplete] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const loadIdRef = useRef(0)

  useEffect(() => {
    if (allDone) {
      setLoading(false)
      return
    }

    const currentLoadId = ++loadIdRef.current
    let active = true

    async function loadRound() {
      setLoading(true)
      setError(null)
      setSelected(null)
      setTextAnswer('')
      setRevealed(false)
      setShowBurst(false)
      setRoundComplete(false)

      try {
        const pokemonId = silhouettePokemonId(today, attemptIndex)
        const main = await fetchPokemonBasic(pokemonId)

        const wrongIds = []
        const seed = hashString(`silhouette-options-${today}-${attemptIndex}`)
        let i = 0
        while (wrongIds.length < 3) {
          const id = 1 + ((seed + i * 41) % TOTAL_POKEMON)
          if (id !== pokemonId && !wrongIds.includes(id)) wrongIds.push(id)
          i++
        }

        const wrongPokemon = await Promise.all(wrongIds.map(fetchPokemonBasic))
        const opts = shuffleWithSeed(
          [main, ...wrongPokemon].map((p) => ({ id: p.id, label: p.name })),
          seed,
        )

        if (!active || currentLoadId !== loadIdRef.current) return

        setPokemon(main)
        setOptions(opts)
        setLoading(false)
      } catch (err) {
        if (!active || currentLoadId !== loadIdRef.current) return
        setError('포켓몬을 불러오지 못했어요. 네트워크를 확인해주세요.')
        setLoading(false)
      }
    }

    loadRound()
    return () => { active = false }
  }, [attemptIndex, allDone, today, reloadKey])

  const handleCorrect = () => {
    setRevealed(true)
    setShowBurst(true)
    setRoundComplete(true)
    onComplete(pokemon.id)
    setTimeout(() => setShowBurst(false), 1200)
  }

  const handleChoiceSelect = (optionId) => {
    if (selected !== null || !pokemon || roundComplete) return
    setSelected(optionId)
    if (optionId === pokemon.id) handleCorrect()
  }

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (!pokemon || selected !== null || roundComplete) return

    const normalized = normalizePokemonName(textAnswer)
    const correct =
      normalized === normalizePokemonName(pokemon.name) ||
      (pokemon.englishName && normalized === normalizePokemonName(pokemon.englishName))

    setSelected(correct ? pokemon.id : -1)
    if (correct) handleCorrect()
  }

  const handleNextRound = () => {
    setAttemptIndex((i) => i + 1)
  }

  const handleRetryLoad = () => {
    setReloadKey((k) => k + 1)
  }

  const isCorrect = selected === pokemon?.id
  const isWrong = selected !== null && !isCorrect
  const canPlayMore = roundComplete && silhouetteState.attempts < MAX_SILHOUETTE_PER_DAY

  if (allDone && !pokemon) {
    return (
      <div className="silhouette-page">
        <PageHeader
          title="오늘의 실루엣"
          subtitle="오늘의 실루엣 퀴즈를 모두 완료했어요!"
          badge={`📅 ${formatDateDisplay(today)}`}
        />
        <div className="quiz-result-card">
          <p className="quiz-result-msg">✅ 오늘 {MAX_SILHOUETTE_PER_DAY}번 모두 완료!</p>
          <p className="quiz-result-label">내일 새로운 포켓몬이 기다려요.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>오늘의 포켓몬을 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-loading">
        <p className="error-text">{error}</p>
        <button type="button" className="retry-btn" onClick={handleRetryLoad}>
          다시 불러오기
        </button>
      </div>
    )
  }

  return (
    <div className="silhouette-page">
      <PageHeader
        title="오늘의 실루엣"
        subtitle="검은 그림자만 보고 포켓몬을 맞혀보세요!"
        badge={`📅 ${formatDateDisplay(today)} · ${silhouetteState.attempts}/${MAX_SILHOUETTE_PER_DAY}`}
      />

      <div className="silhouette-grid">
        <div className="silhouette-card">
          <p className="silhouette-question">이 포켓몬은 누구일까요?</p>
          <div className={`silhouette-image-wrap ${revealed ? 'revealed-wrap' : ''}`}>
            {showBurst && <div className="reveal-burst" aria-hidden="true" />}
            {pokemon && (
              <PokemonImage
                id={pokemon.id}
                src={pokemon.sprite}
                alt="실루엣"
                className={`silhouette-img ${revealed ? 'revealed' : ''} ${showBurst ? 'burst' : ''}`}
              />
            )}
          </div>
          <div className="hint-tags">
            <span className="hint-tag">
              {TYPE_EMOJI[pokemon?.types?.[0]]} {TYPE_KO[pokemon?.types?.[0]]} 타입
            </span>
            <span className="hint-tag">
              🌱 {getGenerationLabel(getGeneration(pokemon?.id))}
            </span>
          </div>
        </div>

        <div className="silhouette-answer-section">
          {!roundComplete && (
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-btn ${mode === 'choice' ? 'active' : ''}`}
                onClick={() => { setMode('choice'); setSelected(null); setTextAnswer('') }}
              >
                객관식
              </button>
              <button
                type="button"
                className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
                onClick={() => { setMode('text'); setSelected(null); setTextAnswer('') }}
              >
                주관식
              </button>
            </div>
          )}

          {!roundComplete && mode === 'choice' && (
            <>
              <p className="answer-label">정답을 골라보세요</p>
              <div className="option-grid">
                {options.map((opt) => {
                  let className = 'option-btn'
                  if (selected !== null) {
                    if (opt.id === pokemon.id) className += ' correct'
                    else if (opt.id === selected) className += ' wrong'
                  }
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={className}
                      onClick={() => handleChoiceSelect(opt.id)}
                      disabled={selected !== null}
                    >
                      {opt.id === pokemon.id && isCorrect && '⚡ '}
                      {opt.label}
                      {opt.id === pokemon.id && isCorrect && ' ✓'}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {!roundComplete && mode === 'text' && (
            <>
              <p className="answer-label">포켓몬 이름을 입력하세요</p>
              <form className="text-answer-form" onSubmit={handleTextSubmit}>
                <input
                  type="text"
                  className="text-answer-input"
                  placeholder="예) 피카츄"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={selected !== null}
                />
                <button
                  type="submit"
                  className="text-answer-submit"
                  disabled={!textAnswer.trim() || selected !== null}
                >
                  정답 확인
                </button>
              </form>
            </>
          )}

          {isCorrect && pokemon && (
            <>
              <div className="result-card">
                <div className="result-icon">{TYPE_EMOJI[pokemon.types[0]]}</div>
                <div className="result-info">
                  <span className="result-number">No. {String(pokemon.id).padStart(4, '0')}</span>
                  <span className="result-name">{pokemon.name}</span>
                  <span className="type-badge">{TYPE_KO[pokemon.types[0]]}</span>
                </div>
                <span className="points-badge">+3 점수 획득!</span>
              </div>

              <div className="success-message">
                <p>🎉 {pokemon.name}가 도감에 등록되었습니다!</p>
                {canPlayMore ? (
                  <span>아직 오늘 {MAX_SILHOUETTE_PER_DAY - silhouetteState.attempts}번 더 도전할 수 있어요!</span>
                ) : (
                  <span>오늘의 실루엣을 모두 완료했어요!</span>
                )}
              </div>

              {canPlayMore && (
                <button type="button" className="next-btn" onClick={handleNextRound}>
                  다음 실루엣 도전 →
                </button>
              )}
            </>
          )}

          {isWrong && (
            <div className="fail-message">
              <p>아쉬워요! 힌트를 참고해 다시 도전해보세요.</p>
              <button
                type="button"
                className="retry-btn"
                onClick={() => { setSelected(null); setTextAnswer('') }}
              >
                다시 도전하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
