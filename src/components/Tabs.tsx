import { useState } from 'react'
import type { ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export function Tabs({ tabs, initial }: { tabs: TabItem[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id)
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0]

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-4">
        {tabs.map((tab) => {
          const isActive = tab.id === current?.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors -mb-px border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div>{current?.content}</div>
    </div>
  )
}
