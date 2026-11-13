/** Loads every event JSON in ./events. Drop a new file in to add a card. */
import type { Reading } from '../model/predict'

export interface FighterData {
  name: string
  record: string
  ml: number | null
  reading: Reading
}

export interface FightData {
  id: string
  order: number
  segment: string
  division: string
  rounds: number
  title?: string
  caveat?: string
  a: FighterData
  b: FighterData
}

export interface SegmentData {
  key: string
  name: string
  start: string
}

export interface EventData {
  id: string
  name: string
  date: string
  weekday?: string
  venue: string
  city: string
  timezone?: string
  segments: SegmentData[]
  linesSource: string
  asOf?: string
  fights: FightData[]
}

const modules = import.meta.glob<EventData>('./events/*.json', { eager: true, import: 'default' })

/** All events, newest first. */
export const EVENTS: EventData[] = Object.values(modules)
  .map((e) => ({ ...e, fights: [...e.fights].sort((x, y) => x.order - y.order) }))
  .sort((x, y) => y.date.localeCompare(x.date))

export function getEvent(id: string | null | undefined): EventData {
  return EVENTS.find((e) => e.id === id) ?? EVENTS[0]
}
