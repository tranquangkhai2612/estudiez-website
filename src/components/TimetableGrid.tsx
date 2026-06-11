import { useMemo, useState } from 'react'
import { useData } from '../hooks/useData'
import type { DayOfWeek, TimetableSlot } from '../types'

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_OFFSET: Record<DayOfWeek, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 }

const PERIOD_TIME: Record<number, string> = {
  1: '07:00', 2: '07:50', 3: '08:40', 4: '09:35',
  5: '10:25', 6: '13:00', 7: '13:50', 8: '14:40', 9: '15:30', 10: '16:20',
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface TimetableGridProps {
  classId: string
  /** Filter to a training system; omit to show all. */
  system?: TimetableSlot['system']
}

export function TimetableGrid({ classId, system }: TimetableGridProps) {
  const { timetable } = useData()
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const today = localDateStr(new Date())

  const slots = useMemo(
    () =>
      timetable.filter(
        (slot) => slot.classId === classId && (system ? slot.system === system : true),
      ),
    [timetable, classId, system],
  )

  const periods = useMemo(() => {
    const set = new Set<number>(slots.map((slot) => slot.period))
    return Array.from(set).sort((a, b) => a - b)
  }, [slots])

  const dateForDay = (day: DayOfWeek): string => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + DAY_OFFSET[day])
    return localDateStr(d)
  }

  const shiftWeek = (n: number) =>
    setWeekStart((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + n * 7); return nd })

  const isCurrentWeek = localDateStr(getMonday(new Date())) === localDateStr(weekStart)

  // Dropdown: 8 weeks back → 8 weeks forward
  const weekOptions = useMemo(() => {
    const base = getMonday(new Date())
    return Array.from({ length: 17 }, (_, i) => {
      const mon = new Date(base)
      mon.setDate(mon.getDate() + (i - 8) * 7)
      const sat = new Date(mon); sat.setDate(sat.getDate() + 5)
      const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      return { value: localDateStr(mon), label: `${fmt(mon)} – ${fmt(sat)}` }
    })
  }, [])

  if (slots.length === 0) {
    return <p className="text-sm text-slate-500">No timetable available for this class.</p>
  }

  const lookup = (day: DayOfWeek, period: number) =>
    slots.find((slot) => slot.day === day && slot.period === period)

  return (
    <div className="space-y-3">
      {/* Week navigator */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => shiftWeek(-1)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 border border-slate-200"
        >←</button>
        <select
          value={localDateStr(weekStart)}
          onChange={(e) => setWeekStart(new Date(e.target.value + 'T00:00:00'))}
          className="flex-1 rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 bg-white"
        >
          {weekOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {!isCurrentWeek && (
          <button
            onClick={() => setWeekStart(getMonday(new Date()))}
            className="text-xs text-indigo-600 hover:underline px-2 shrink-0"
          >Today</button>
        )}
        <button
          onClick={() => shiftWeek(1)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 border border-slate-200"
        >→</button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 px-3 border-b border-slate-200 text-xs">Period</th>
              {DAYS.map((day) => {
                const date = dateForDay(day)
                const isToday = date === today
                return (
                  <th
                    key={day}
                    className={`py-2 px-3 border-b border-slate-200 text-center ${isToday ? 'bg-indigo-50' : ''}`}
                  >
                    <span className={`block text-xs font-semibold ${isToday ? 'text-indigo-700' : 'text-slate-600'}`}>{day}</span>
                    <span className={`block text-xs ${isToday ? 'text-indigo-500' : 'text-slate-400'}`}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period} className="align-top">
                <td className="py-2 px-3 border-b border-slate-100">
                  <span className="font-semibold text-slate-700 block">P{period}</span>
                  {PERIOD_TIME[period] && (
                    <span className="text-xs text-slate-400">{PERIOD_TIME[period]}</span>
                  )}
                </td>
                {DAYS.map((day) => {
                  const slot = lookup(day, period)
                  const isToday = dateForDay(day) === today
                  return (
                    <td key={day} className={`py-2 px-3 border-b border-slate-100 ${isToday ? 'bg-indigo-50/40' : ''}`}>
                      {slot ? (
                        <div className={`rounded-md px-2 py-1 ${
                          slot.system === 'revision'
                            ? 'bg-amber-50 border border-amber-200'
                            : 'bg-indigo-50 border border-indigo-100'
                        }`}>
                          <p className="font-semibold text-slate-800">{slot.subject}</p>
                          <p className="text-xs text-slate-500">{slot.teacher} · {slot.room}</p>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
