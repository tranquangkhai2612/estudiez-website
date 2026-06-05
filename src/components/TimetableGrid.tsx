import { useMemo } from 'react'
import { useData } from '../hooks/useData'
import type { DayOfWeek, TimetableSlot } from '../types'

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface TimetableGridProps {
  classId: string
  /** Filter to a training system; omit to show all. */
  system?: TimetableSlot['system']
}

export function TimetableGrid({ classId, system }: TimetableGridProps) {
  const { timetable } = useData()

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

  if (slots.length === 0) {
    return <p className="text-sm text-slate-500">No timetable available for this class.</p>
  }

  const lookup = (day: DayOfWeek, period: number) =>
    slots.find((slot) => slot.day === day && slot.period === period)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2 px-3 border-b border-slate-200">Period</th>
            {DAYS.map((day) => (
              <th key={day} className="py-2 px-3 border-b border-slate-200">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period} className="align-top">
              <td className="py-2 px-3 border-b border-slate-100 font-semibold text-slate-700">
                P{period}
              </td>
              {DAYS.map((day) => {
                const slot = lookup(day, period)
                return (
                  <td key={day} className="py-2 px-3 border-b border-slate-100">
                    {slot ? (
                      <div
                        className={`rounded-md px-2 py-1 ${
                          slot.system === 'revision'
                            ? 'bg-amber-50 border border-amber-200'
                            : 'bg-indigo-50 border border-indigo-100'
                        }`}
                      >
                        <p className="font-semibold text-slate-800">{slot.subject}</p>
                        <p className="text-xs text-slate-500">
                          {slot.teacher} · {slot.room}
                        </p>
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
  )
}
