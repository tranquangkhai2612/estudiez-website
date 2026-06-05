import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

interface BaseProps {
  label: string
  name: string
  error?: string
  hint?: string
}

type FieldProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> & {
    as?: 'input'
  }

type SelectProps = BaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'> & {
    as: 'select'
    children: ReactNode
  }

type TextareaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> & {
    as: 'textarea'
  }

type AllProps = FieldProps | SelectProps | TextareaProps

const baseInput =
  'mt-1 block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

export function FormField(props: AllProps) {
  const { label, name, error, hint } = props
  const ringClass = error ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300'
  const id = `field-${name}`
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const className = `${baseInput} ${ringClass}`

  let control: ReactNode

  if (props.as === 'select') {
    const { label: _l, name: _n, error: _e, hint: _h, as: _a, children, ...rest } = props
    void _l; void _n; void _e; void _h; void _a
    control = (
      <select
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={className}
        {...rest}
      >
        {children}
      </select>
    )
  } else if (props.as === 'textarea') {
    const { label: _l, name: _n, error: _e, hint: _h, as: _a, ...rest } = props
    void _l; void _n; void _e; void _h; void _a
    control = (
      <textarea
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={className}
        {...rest}
      />
    )
  } else {
    const { label: _l, name: _n, error: _e, hint: _h, as: _a, ...rest } = props
    void _l; void _n; void _e; void _h; void _a
    control = (
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={className}
        {...rest}
      />
    )
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {control}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
