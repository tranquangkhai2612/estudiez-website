import type { ReactNode } from 'react'

interface CardProps {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function Card({ title, description, children, actions, className }: CardProps) {
  return (
    <section
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {description ? (
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  )
}
