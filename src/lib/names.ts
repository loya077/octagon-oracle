/** Lowercase and strip accents: "Uroš Medić" → "uros medic". */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function lastName(full: string): string {
  const parts = full.trim().split(/\s+/)
  return parts[parts.length - 1]
}
