import { useState, useEffect, useRef } from 'react'
import { PageHeader } from './Layout'
import PokemonImage from './PokemonImage'
import { generateCategoryQuiz, QUIZ_CATEGORIES, QUESTIONS_PER_QUIZ } from '../services/quizGenerator'
import { checkDualTypeAnswer } from '../utils/typeChart'
import { getUniqueCaughtCount } from '../utils/storage'
import { CRY_URL } from '../utils/pokemonSprites'
import {
  loadQuizSession,
  startCategory,
  completeCategory,
  abandonActiveQuiz,
  isCategoryPlayable,
} from '../utils/quizSession'

function QuizHub({ session, onSelect }) {
  return (
    <div className="quiz-page">
      <PageHeader
        title="포켓몬 퀴즈"
        subtitle="카테고리를 선택해 랜덤 2문제에 도전하세요!"
      />

      <div className="quiz-session-notice">
        <p>⚠️ 퀴즈 도중 다른 화면으로 이동하면 이어서 풀 수 없어요.</p>
        <span>나갔다가 돌아오면 해당 퀴즈는 다시 도전할 수 없습니다.</span>
      </div>

      <div className="quiz-hub-grid">
        {QUIZ_CATEGORIES.map((cat) => {
          const status = session.categories[cat.key]
          const canPlay = status === 'idle'

          let statusLabel = '도전하기 →'
          let statusClass = 'status-pending'
          if (status === 'completed') {
            statusLabel = `✅ 완료 (${session.correctCount[cat.key]}/${QUESTIONS_PER_QUIZ} 정답)`
            statusClass = 'status-done'
          } else if (status === 'abandoned') {
            statusLabel = '🚫 다시 도전 불가'
            statusClass = 'status-blocked'
          }

          return (
            <button
              key={cat.key}
              type="button"
              className={`quiz-hub-card ${!canPlay ? 'disabled' : ''}`}
              onClick={() => canPlay && onSelect(cat.key)}
              disabled={!canPlay}
            >
              <div className={`challenge-icon quiz-icon category-${cat.key}`}>{cat.icon}</div>
              <h3>{cat.label}</h3>
              <p>{cat.desc}</p>
              <span className={statusClass}>{statusLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function QuizPlay({ categoryKey, onFinish, onAnswer }) {
  const category = QUIZ_CATEGORIES.find((c) => c.key === categoryKey)
  const finishedRef = useRef(false)

  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [textAnswer, setTextAnswer] = useState('')
  const audioRef = useRef(null)

  const WRONG_ANSWER = '__wrong__'

  useEffect(() => {
    startCategory(categoryKey)
    let cancelled = false

    generateCategoryQuiz(categoryKey, QUESTIONS_PER_QUIZ)
      .then((qs) => {
        if (cancelled) return
        if (!qs.length) throw new Error('empty')
        setQuestions(qs)
        setLoadError(null)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('퀴즈를 불러오지 못했어요. 네트워크를 확인해주세요.')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      if (!finishedRef.current) {
        abandonActiveQuiz()
      }
    }
  }, [categoryKey])

  const question = questions[currentIndex]
  const progress = ((currentIndex + (selected !== null ? 1 : 0)) / QUESTIONS_PER_QUIZ) * 100

  useEffect(() => {
    if (!question || question.categoryKey !== 'cry') return
    const audio = audioRef.current
    if (!audio) return
    audio.src = question.cry || CRY_URL(question.pokemon.id)
    audio.load()
  }, [question])

  const playCry = () => {
    const audio = audioRef.current
    if (!audio || !question) return
    if (!audio.src) {
      audio.src = question.cry || CRY_URL(question.pokemon.id)
    }
    audio.currentTime = 0
    audio.play().catch(() => {})
  }

  const handleSelect = (optionId) => {
    if (selected !== null || !question) return
    setSelected(optionId)
    const isCorrect = optionId === question.correctId
    if (isCorrect) setCorrectCount((c) => c + 1)
    if (question.pokemon) {
      onAnswer(isCorrect, question.pokemon.id, { canShiny: question.pokemon.canShiny })
    } else {
      onAnswer(isCorrect, null)
    }
  }

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (selected !== null || !question || question.answerMode !== 'text') return

    const isCorrect = checkDualTypeAnswer(textAnswer, question.correctTypes)
    setSelected(isCorrect ? question.correctId : WRONG_ANSWER)
    if (isCorrect) setCorrectCount((c) => c + 1)
    if (question.pokemon) {
      onAnswer(isCorrect, question.pokemon.id, { canShiny: question.pokemon.canShiny })
    } else {
      onAnswer(isCorrect, null)
    }
  }

  const handleNext = () => {
    setCurrentIndex((i) => i + 1)
    setSelected(null)
    setTextAnswer('')
  }

  const handleShowResult = () => {
    finishedRef.current = true
    completeCategory(categoryKey, correctCount)
    onFinish(correctCount)
  }

  if (loadError) {
    return (
      <div className="page-loading">
        <p className="error-text">{loadError}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>랜덤 퀴즈를 준비하는 중...</p>
      </div>
    )
  }

  if (!question) return null

  const isCorrect = selected === question.correctId
  const isLastQuestion = currentIndex === QUESTIONS_PER_QUIZ - 1
  const isCryQuiz = question.categoryKey === 'cry'
  const isTextAnswer = question.answerMode === 'text'
  const showImage = question.showImage !== false && question.pokemon

  return (
    <div className="quiz-page">
      <PageHeader
        title={category?.label}
        subtitle="랜덤 2문제 — 다른 화면으로 나가면 이어서 풀 수 없어요!"
        badge={`${currentIndex + 1} / ${QUESTIONS_PER_QUIZ} 문제`}
      />

      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="quiz-card">
        <span className={`quiz-category category-${question.categoryKey}`}>
          {question.categoryIcon} {question.category}
        </span>

        {isCryQuiz ? (
          <div className="quiz-cry-section">
            <button type="button" className="cry-play-btn" onClick={playCry}>
              <span className="cry-play-icon">🔊</span>
              <span>울음소리 듣기</span>
            </button>
            <audio ref={audioRef} preload="auto" crossOrigin="anonymous" />
            <p className="cry-hint-text">소리를 듣고 포켓몬을 맞혀보세요!</p>
          </div>
        ) : showImage ? (
          <div className="quiz-pokemon-img">
            <PokemonImage
              id={question.pokemon.id}
              src={question.pokemon.sprite}
              alt={question.pokemon.name}
            />
          </div>
        ) : null}

        <h3 className={`quiz-question ${question.loreType === 'flavor' ? 'lore-question' : ''}`}>
          {question.question}
        </h3>
        <p className="quiz-hint">{question.hint}</p>

        {isTextAnswer ? (
          <>
            <p className="answer-label">타입 2가지를 입력하세요</p>
            <form className="text-answer-form" onSubmit={handleTextSubmit}>
              <input
                type="text"
                className="text-answer-input"
                placeholder="예) 불꽃/비행"
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
        ) : (
          <div className="option-grid quiz-options">
            {question.options.map((opt) => {
              let className = 'option-btn'
              if (selected !== null) {
                if (opt.id === question.correctId) className += ' correct'
                else if (opt.id === selected) className += ' wrong'
              }
              return (
                <button
                  key={String(opt.id)}
                  type="button"
                  className={className}
                  onClick={() => handleSelect(opt.id)}
                  disabled={selected !== null}
                >
                  {opt.id === question.correctId && isCorrect && '⚡ '}
                  {opt.label}
                  {opt.id === question.correctId && selected !== null && ' ✓'}
                </button>
              )
            })}
          </div>
        )}

        {selected !== null && (
          <div className={`feedback-banner ${isCorrect ? 'success' : 'fail'}`}>
            <div className="feedback-text">
              <p className="feedback-title">
                {isCorrect ? `🎉 ${question.successText()}` : '😢 오답이에요'}
              </p>
              <p className="feedback-desc">{question.explanation}</p>
            </div>
            {isLastQuestion ? (
              <button type="button" className="next-btn" onClick={handleShowResult}>
                결과 보기 →
              </button>
            ) : (
              <button type="button" className="next-btn" onClick={handleNext}>
                다음 문제 →
              </button>
            )}
          </div>
        )}

        {isCryQuiz && selected === null && (
          <button type="button" className="cry-replay-btn" onClick={playCry}>
            🔁 다시 듣기
          </button>
        )}
      </div>
    </div>
  )
}

export default function QuizPage({ userData, onAnswer }) {
  const [session, setSession] = useState(loadQuizSession)
  const [activeCategory, setActiveCategory] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    return () => {
      if (activeCategory) {
        abandonActiveQuiz()
      }
    }
  }, [activeCategory])

  const refreshSession = () => setSession(loadQuizSession())

  const handleSelectCategory = (key) => {
    if (!isCategoryPlayable(key)) return
    setActiveCategory(key)
    setResult(null)
  }

  const handleFinish = (correctCount) => {
    refreshSession()
    setResult({ categoryKey: activeCategory, correctCount })
    setActiveCategory(null)
  }

  const handleBackToHub = () => {
    setResult(null)
    refreshSession()
  }

  if (result) {
    const cat = QUIZ_CATEGORIES.find((c) => c.key === result.categoryKey)
    return (
      <div className="quiz-page">
        <PageHeader title="퀴즈 완료!" subtitle={`${cat?.label} 결과`} />
        <div className="quiz-result-card">
          <p className="quiz-result-score">{result.correctCount} / {QUESTIONS_PER_QUIZ}</p>
          <p className="quiz-result-label">정답 개수</p>
          <p className="quiz-result-msg">
            {result.correctCount === QUESTIONS_PER_QUIZ
              ? '🎊 완벽해요! 포켓몬 박사가 되어가고 있어요!'
              : '수고했어요! 다른 카테고리도 도전해보세요.'}
          </p>
        </div>
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{userData.totalScore}</span>
            <span className="stat-label">총 점수</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{getUniqueCaughtCount(userData)}</span>
            <span className="stat-label">획득 포켓몬</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{userData.streak}일</span>
            <span className="stat-label">연속 출석</span>
          </div>
        </div>
        <button type="button" className="quiz-back-hub-btn" onClick={handleBackToHub}>
          퀴즈 선택으로 돌아가기 →
        </button>
      </div>
    )
  }

  if (activeCategory) {
    return (
      <QuizPlay
        categoryKey={activeCategory}
        onFinish={handleFinish}
        onAnswer={onAnswer}
      />
    )
  }

  return <QuizHub session={session} onSelect={handleSelectCategory} />
}
