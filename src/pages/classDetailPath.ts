export function classDetailPath(classId: string, subject?: string) {
  const base = `/classes/${encodeURIComponent(classId)}`
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base
}
