import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: '홈', icon: '🏠', end: true },
  { path: '/silhouette', label: '오늘의 실루엣', icon: '🌙' },
  { path: '/quiz', label: '포켓몬 퀴즈', icon: '⚡' },
  { path: '/dogam', label: '내 포켓몬 도감', icon: '📖' },
]

import { getUniqueCaughtCount } from '../utils/storage'

export default function Layout({ userData, children }) {
  const collected = getUniqueCaughtCount(userData)
  const shinyCount = userData.collectedShiny?.length ?? 0

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <NavLink to="/" className="logo-link">
            <h1 className="logo">포케포케</h1>
          </NavLink>
          <p className="tagline">매일 새 포켓몬을 만나세요</p>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-stats">
          <p className="stats-label">총 점수</p>
          <p className="stats-score">{userData.totalScore}</p>
          <p className="stats-sub">{collected}마리 포켓몬 획득{shinyCount > 0 ? ` · ✨ ${shinyCount}` : ''}</p>
          {userData.streak > 0 && (
            <span className="streak-badge">🔥 {userData.streak}일 연속</span>
          )}
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  )
}

export function PageHeader({ title, subtitle, badge }) {
  return (
    <div className="page-header">
      <div>
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {badge && <span className="date-badge">{badge}</span>}
    </div>
  )
}
