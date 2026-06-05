import { useState } from 'react'
import { FormField } from '../components/FormField'
import { useToast } from '../hooks/useToast'

interface FeedbackForm {
  name: string
  email: string
  message: string
}

type Errors = Partial<Record<keyof FeedbackForm, string>>

export function FeedbackPage() {
  const { push } = useToast()
  const [form, setForm] = useState<FeedbackForm>({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Errors>({})

  const validate = (): Errors => {
    const next: Errors = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      next.email = 'Enter a valid email.'
    if (form.message.trim().length < 10)
      next.message = 'Message must be at least 10 characters.'
    return next
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    push('success', 'Thanks! Your feedback has been sent.')
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Feedback</h1>
      <p className="text-sm text-slate-500 mt-1">
        Tell us what's working and what we can improve.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <FormField
          label="Name"
          name="name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          error={errors.name}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          error={errors.email}
        />
        <FormField
          as="textarea"
          label="Message"
          name="message"
          rows={5}
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          error={errors.message}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  )
}
