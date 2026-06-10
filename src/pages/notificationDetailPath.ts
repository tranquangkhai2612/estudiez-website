export function notificationDetailPath(id: number) {
  return `/notifications/${encodeURIComponent(String(id))}`
}
