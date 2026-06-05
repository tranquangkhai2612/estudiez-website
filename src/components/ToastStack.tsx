import { useToast } from '../hooks/useToast'

const toneStyles: Record<string, string> = {
  success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  error: 'bg-rose-50 border-rose-300 text-rose-800',
  info: 'bg-sky-50 border-sky-300 text-sky-800',
}

export function ToastStack() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`border rounded-lg shadow-md px-4 py-3 flex items-start gap-3 ${
            toneStyles[toast.tone]
          }`}
        >
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="text-current/80 hover:text-current text-sm font-bold"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
