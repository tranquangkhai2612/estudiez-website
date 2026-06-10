import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'

const CATEGORY_STYLE: Record<string, string> = {
  Announcement: 'bg-indigo-100 text-indigo-700',
  Event: 'bg-emerald-100 text-emerald-700',
  Notice: 'bg-amber-100 text-amber-700',
}

const QUICK_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/feedback', label: 'Feedback', icon: '💬' },
  { to: '/contact', label: 'Contact', icon: '📞' },
]

export function HomePage() {
  const { currentUser } = useAuth()
  const { news, helplines } = useData()

  const latestNews = [...news].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Compact hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap shadow">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">eStudiez</p>
          <h1 className="text-2xl font-extrabold mt-0.5">Track. Teach. Together.</h1>
          <p className="text-sm text-indigo-100 mt-1">High-school study progress for students, teachers &amp; parents.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {currentUser ? (
            <Link to="/dashboard" className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-md font-semibold text-sm">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-md font-semibold text-sm">
                Sign In
              </Link>
              <Link to="/register" className="border border-white/60 hover:bg-white/10 px-4 py-2 rounded-md font-semibold text-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* News feed — 2/3 width */}
        <section className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            📰 Latest News
          </h2>
          {latestNews.length === 0 ? (
            <p className="text-sm text-slate-400">No news yet.</p>
          ) : (
            latestNews.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${CATEGORY_STYLE[item.category] ?? 'bg-slate-100 text-slate-600'}`}>
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400">{item.date}</span>
                      <span className="text-xs text-slate-400">· {item.author}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Sidebar — 1/3 width */}
        <aside className="space-y-5">
          {/* Quick links */}
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-2">⚡ Quick Links</h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 rounded-xl py-3 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors shadow-sm"
                >
                  <span className="text-xl">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Helplines */}
          {helplines.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-2">📞 Helplines</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {helplines.map((h, i) => (
                  <div
                    key={h.phone}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-slate-100' : ''}`}
                  >
                    <span className="text-slate-600">{h.label}</span>
                    <a href={`tel:${h.phone}`} className="font-semibold text-indigo-600 hover:underline">
                      {h.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's date */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide">Today</p>
            <p className="text-lg font-bold text-indigo-700 mt-0.5">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
