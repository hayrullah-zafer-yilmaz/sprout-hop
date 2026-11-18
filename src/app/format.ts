export function formatScore(value: number): string {
  return String(value).padStart(6, '0')
}
