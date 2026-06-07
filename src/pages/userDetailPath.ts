export function userDetailPath(email: string) {
  return `/users/${encodeURIComponent(email)}`
}
