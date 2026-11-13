/**
 * Parse pasted readings. Accepted line shapes:
 *   Gane, 1990-04-12
 *   Harrison, born day 2, life path 9, pinnacle 11, Horse
 *   Name, 3, 8, 22, Horse          (born day, life path, pinnacle, animal)
 * Names match on last name (or full name), accents and case ignored.
 */
import { normalizeAnimal } from '../model/astrology'
import { fromBirth } from '../model/predict'
import { fold, lastName } from './names'

export interface PasteFighter {
  key: string
  name: string
}

export interface ReadingPatch {
  birth?: string
  bornDay?: number
  lifePath?: number
  pinnacle?: number
  animal?: string
}

export type PasteResult =
  | { ok: true; line: string; key: string; name: string; patch: ReadingPatch }
  | { ok: false; line: string; error: string }

export function matchFighter(token: string, fighters: PasteFighter[]): PasteFighter[] {
  const t = fold(token)
  if (!t) return []
  const full = fighters.filter((f) => fold(f.name) === t)
  if (full.length) return full
  const tLast = fold(lastName(token))
  return fighters.filter((f) => fold(lastName(f.name)) === tLast || fold(f.name) === tLast)
}

const DATE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/
const KEYS: Array<[RegExp, 'bornDay' | 'lifePath' | 'pinnacle']> = [
  [/^(born\s*day|birth\s*day|bd|day)\s*[:=]?\s*(\d+)$/i, 'bornDay'],
  [/^(life\s*path|lp|path)\s*[:=]?\s*(\d+)$/i, 'lifePath'],
  [/^(pinnacle|first\s*pinnacle|pin|p1)\s*[:=]?\s*(\d+)$/i, 'pinnacle'],
]

export function parseLine(line: string, fighters: PasteFighter[]): PasteResult | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null
  const parts = trimmed.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean)
  const [nameTok, ...rest] = parts
  const matches = matchFighter(nameTok ?? '', fighters)
  if (matches.length === 0) return { ok: false, line: trimmed, error: `No fighter matches “${nameTok}”` }
  if (matches.length > 1) return { ok: false, line: trimmed, error: `“${nameTok}” matches ${matches.map((m) => m.name).join(', ')}` }
  const f = matches[0]
  const patch: ReadingPatch = {}
  const positional: number[] = []
  for (const p of rest) {
    const dm = DATE_RE.exec(p)
    if (dm) {
      const iso = `${dm[1]}-${dm[2].padStart(2, '0')}-${dm[3].padStart(2, '0')}`
      const r = fromBirth(iso)
      if (!r) return { ok: false, line: trimmed, error: `Bad date “${p}”` }
      Object.assign(patch, { birth: iso, ...r })
      continue
    }
    const kw = KEYS.find(([re]) => re.test(p))
    if (kw) {
      patch[kw[1]] = Number(kw[0].exec(p)![2])
      continue
    }
    if (/^\d+$/.test(p)) {
      positional.push(Number(p))
      continue
    }
    const animal = normalizeAnimal(p.replace(/^(animal|zodiac)\s*[:=]?\s*/i, ''))
    if (animal) {
      patch.animal = animal
      continue
    }
    return { ok: false, line: trimmed, error: `Can’t read “${p}”` }
  }
  if (positional.length > 3) return { ok: false, line: trimmed, error: 'Too many numbers (expected born day, life path, pinnacle)' }
  const order = ['bornDay', 'lifePath', 'pinnacle'] as const
  positional.forEach((n, i) => (patch[order[i]] = n))
  if (Object.keys(patch).length === 0) return { ok: false, line: trimmed, error: 'Nothing to apply' }
  return { ok: true, line: trimmed, key: f.key, name: f.name, patch }
}

export function parsePaste(text: string, fighters: PasteFighter[]): PasteResult[] {
  return text.split(/\r?\n/).map((l) => parseLine(l, fighters)).filter((r): r is PasteResult => r !== null)
}
