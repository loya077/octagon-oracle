import { useMemo, useState } from 'react'
import { EVENTS, getEvent } from './data/events'
import { DEFAULT_SETTINGS, fightContext, type Settings as S } from './model/predict'
import { buildVerdict } from './model/verdict'
import { usePersistentState } from './lib/storage'
import { agreement, type Analysis, type Fight, type ReadingEdit } from './lib/view'
import { entryFor, upsert, type LedgerEntry } from './lib/ledger'
import { Settings } from './components/Settings'
import { Verdict } from './components/Verdict'
import { FightNight } from './components/FightCard'
import { FightReader } from './components/FightReader'
import { ReadingsEditor } from './components/ReadingsEditor'
import { Ledger } from './components/Ledger'
import { HowItWorks } from './components/HowItWorks'

type OddsOverrides = Record<string, { a?: number | null; b?: number | null }>

const clamp = (n: unknown, d: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : d)

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default function App() {
  const [eventId, setEventId] = usePersistentState('event', EVENTS[0].id)
  const event = getEvent(eventId)
  const [rawSettings, setSettings] = usePersistentState<S>('settings', DEFAULT_SETTINGS)
  const settings: S = {
    influence: clamp(rawSettings?.influence, DEFAULT_SETTINGS.influence),
    wAstro: clamp(rawSettings?.wAstro, DEFAULT_SETTINGS.wAstro),
    wNum: clamp(rawSettings?.wNum, DEFAULT_SETTINGS.wNum),
    masterEdge: clamp(rawSettings?.masterEdge, DEFAULT_SETTINGS.masterEdge),
  }
  const [readingEdits, setReadingEdits] = usePersistentState<Record<string, ReadingEdit>>(`readings:${event.id}`, {})
  const [odds, setOdds] = usePersistentState<OddsOverrides>(`odds:${event.id}`, {})
  const [ledger, setLedger] = usePersistentState<LedgerEntry[]>('ledger', [])
  const [readerId, setReaderId] = useState<string>(event.fights[0].id)

  const fights: Fight[] = useMemo(
    () =>
      event.fights.map((f) => {
        const o = odds[f.id] ?? {}
        const side = (s: 'a' | 'b') => {
          const d = f[s]
          const key = `${f.id}:${s.toUpperCase()}`
          const edit = readingEdits[key]
          return {
            key, name: d.name, record: d.record,
            baseMl: d.ml,
            ml: s in o ? (o[s] ?? null) : d.ml,
            ownerReading: d.reading,
            reading: edit ?? { ...d.reading },
            edited: !!edit,
          }
        }
        return { ...f, a: side('a'), b: side('b') }
      }),
    [event, odds, readingEdits],
  )

  const verdict: Analysis[] = useMemo(() => buildVerdict(fights, event.date, settings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fights, event.date, settings.influence, settings.wAstro, settings.wNum, settings.masterEdge])
  const byCard = useMemo(() => [...verdict].sort((x, y) => x.fight.order - y.fight.order), [verdict])
  const ctx = fightContext(event.date)
  const selectedId = fights.some((f) => f.id === readerId) ? readerId : fights[0].id

  const openFight = (id: string) => {
    setReaderId(id)
    document.getElementById('reader')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const log = (an: Analysis) => setLedger((l) => upsert(l, entryFor(an, event.id, event.name, agreement(an))))
  const logAll = () => setLedger((l) => byCard.reduce((acc, an) => upsert(acc, entryFor(an, event.id, event.name, agreement(an))), l))

  return (
    <div className="page">
      <header className="masthead">
        <div className="eyebrow">Fight almanac · market × numerology × zodiac</div>
        <h1>Octagon Oracle</h1>
        <div className="event-line">
          {EVENTS.length > 1 ? (
            <select className="event-select" value={event.id} onChange={(e) => setEventId(e.target.value)} aria-label="Choose event">
              {EVENTS.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          ) : (
            <strong>{event.name}</strong>
          )}
          <span>{formatDate(event.date)}</span>
          <span>{event.venue}, {event.city}</span>
        </div>
        <div className="ctx mono">
          Fight date reads life path <b>{ctx.lifePath}</b> · day <b>{ctx.day}</b> · year of the <b>{ctx.animal}</b>
        </div>
      </header>

      <main>
        <Settings settings={settings} onChange={setSettings} />
        <Verdict rows={verdict} onOpen={openFight} />
        <FightNight segments={event.segments} analyses={byCard} onOpen={openFight} />
        <FightReader
          analyses={byCard}
          selectedId={selectedId}
          onSelect={setReaderId}
          onOdds={(fid, s, ml) => setOdds((o) => ({ ...o, [fid]: { ...o[fid], [s]: ml } }))}
          onResetOdds={(fid) => setOdds((o) => { const n = { ...o }; delete n[fid]; return n })}
          onLog={log}
          logged={ledger.some((x) => x.id === `${event.id}:${selectedId}`)}
        />
        <ReadingsEditor
          fights={fights}
          onEdit={(key, r) => setReadingEdits((e) => ({ ...e, [key]: r }))}
          onReset={() => setReadingEdits({})}
          hasEdits={Object.keys(readingEdits).length > 0}
        />
        <Ledger
          ledger={ledger}
          onLogAll={logAll}
          onResult={(id, result) => setLedger((l) => l.map((x) => (x.id === id ? { ...x, result } : x)))}
          onRemove={(id) => setLedger((l) => l.filter((x) => x.id !== id))}
        />
        <HowItWorks />
        <footer className="fine-print">
          <h2>Fine print</h2>
          <p>{event.asOf ?? 'Card and lines as published'}; lines are {event.linesSource}. Late changes — replacements, scratches, line moves — aren’t reflected unless you edit them in the reader.</p>
          <p>There is no UFC backtest yet. In the owner’s NFL version, readings influence 50 picked 59.2% of games versus 64.1% for strength ratings alone.</p>
          <p>Following the market can’t beat the market: favorites pay only enough to break even at their implied chance. This is entertainment, not betting advice.</p>
        </footer>
      </main>
    </div>
  )
}
