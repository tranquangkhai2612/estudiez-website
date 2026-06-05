export function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Contact Us</h1>
      <p className="text-sm text-slate-500 mt-1">
        For support, partnership, or general questions, get in touch with the developer.
      </p>

      <dl className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-50 rounded-lg p-4">
          <dt className="text-slate-500 font-semibold uppercase text-xs">Email</dt>
          <dd className="mt-1">
            <a
              href="mailto:support@estudiez.app"
              className="text-indigo-600 font-semibold hover:underline"
            >
              support@estudiez.app
            </a>
          </dd>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <dt className="text-slate-500 font-semibold uppercase text-xs">Office Hours</dt>
          <dd className="mt-1 text-slate-700">Mon - Fri, 9:00 - 17:00</dd>
        </div>
      </dl>

      <p className="mt-5 text-xs text-slate-500">
        We typically respond within 1 business day.
      </p>
    </div>
  )
}
