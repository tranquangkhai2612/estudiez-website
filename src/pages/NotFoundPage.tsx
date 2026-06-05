import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="text-center py-16">
      <p className="text-sm uppercase tracking-widest text-indigo-600 font-semibold">
        404
      </p>
      <h1 className="text-3xl font-bold text-slate-900 mt-2">Page not found</h1>
      <p className="text-slate-500 mt-2">The page you are looking for doesn't exist.</p>
      <Link
        to="/"
        className="inline-block mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
      >
        Back to Home
      </Link>
    </div>
  )
}
