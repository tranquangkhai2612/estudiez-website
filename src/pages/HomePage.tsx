import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface SiteLink {
  to: string
  label: string
  description: string
}

const SITEMAP: { heading: string; links: SiteLink[] }[] = [
  {
    heading: 'Get Started',
    links: [
      { to: '/register', label: 'Register', description: 'Demo signup (real accounts are issued by the school)' },
      { to: '/login', label: 'Login', description: 'Access your role-based dashboard' },
    ],
  },
  {
    heading: 'Your Workspace',
    links: [
      { to: '/dashboard', label: 'Dashboard', description: 'Timetable, marks, attendance, resources, chat' },
      { to: '/profile', label: 'Profile', description: 'Update personal details and password' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { to: '/feedback', label: 'Feedback', description: 'Send petitions and suggestions to the school' },
      { to: '/contact', label: 'Contact Us', description: 'Reach the school / developer team' },
    ],
  },
]

const FEATURES: { title: string; description: string }[] = [
  { title: 'Academic Progress', description: 'Marks, attendance, class & weekly timetables.' },
  { title: 'Study Resources', description: 'Subject images, videos, and PDF documents.' },
  { title: 'Revision Classes', description: 'Out-of-hours extra classes you can enroll in.' },
  { title: 'News & Notifications', description: 'School news plus class/student/parent alerts.' },
  { title: 'Class Chat Groups', description: 'Student–teacher and parent–teacher group chats.' },
  { title: 'AI Learning Paths', description: 'Teacher evaluations turned into study suggestions.' },
]

export function HomePage() {
  const { currentUser } = useAuth()

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-8 shadow-lg">
        <p className="uppercase tracking-widest text-xs font-semibold text-indigo-100">
          High School Study-Progress Hub
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold mt-2">
          Track. Teach. Together.
        </h1>
        <p className="mt-3 max-w-2xl text-indigo-50">
          eStudiez gives the board of management, subject teachers, students, and parents one
          place to follow marks and attendance, share study resources, manage revision classes,
          read school news, and chat by class.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {currentUser ? (
            <Link
              to="/dashboard"
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-md font-semibold"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-md font-semibold"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="border border-white/60 hover:bg-white/10 px-4 py-2 rounded-md font-semibold"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RoleCard
          title="Admin"
          description="Manage teachers and students, and post school-wide news."
        />
        <RoleCard
          title="Teachers"
          description="Take attendance, update marks, share resources, run revision classes, chat with classes."
        />
        <RoleCard
          title="Students"
          description="See timetable & marks, download resources, get an AI learning path, join class chat."
        />
        <RoleCard
          title="Parents"
          description="Follow your child's timetable, marks, attendance, news, and join the parent chat."
        />
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-3">Core Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-3">Sitemap</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {SITEMAP.map((group) => (
            <div
              key={group.heading}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{group.heading}</h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      {link.label}
                    </Link>
                    <p className="text-xs text-slate-500">{link.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function RoleCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-lg text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
    </div>
  )
}
