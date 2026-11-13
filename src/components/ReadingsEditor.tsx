import { useRef, useState } from 'react'
import { ANIMALS } from '../model/astrology'
import { completeReading, fromBirth } from '../model/predict'
import { parsePaste, type PasteResult, type ReadingPatch } from '../lib/paste'
import type { Fight, Fighter, ReadingEdit } from '../lib/view'

interface Props {
  fights: Fight[]
  onEdit: (key: string, reading: ReadingEdit) => void
  onReset: () => void
  hasEdits: boolean
}

function applyPatch(base: ReadingEdit, patch: ReadingPatch): ReadingEdit {
  return { ...base, ...patch }
}

function NumCell({ value, label, onChange, changed }: { value: number | null; label: string; onChange: (n: number | null) => void; changed: boolean }) {
  return (
    <td>
      <input
        className={`cell mono ${changed ? 'changed' : ''}`}
        type="number" min={1} max={33} inputMode="numeric"
        value={value ?? ''}
        aria-label={label}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </td>
  )
}

function Row({ f, onEdit }: { f: Fighter; onEdit: Props['onEdit'] }) {
  const r = f.reading
  const o = f.ownerReading
  const set = (patch: Partial<ReadingEdit>) => onEdit(f.key, { ...r, ...patch })
  const complete = !!completeReading(r)
  return (
    <tr>
      <td className="fighter-cell">
        {complete && <span className="dot" aria-label="Readings loaded" />}
        {f.name}
      </td>
      <td>
        <input
          className="cell mono date" type="date" value={r.birth ?? ''} aria-label={`${f.name} birth date`}
          onChange={(e) => {
            const iso = e.target.value
            const auto = iso ? fromBirth(iso) : null
            set(auto ? { birth: iso, ...auto } : { birth: iso || undefined })
          }}
        />
      </td>
      <NumCell value={r.bornDay} label={`${f.name} born day`} changed={r.bornDay !== o.bornDay} onChange={(n) => set({ bornDay: n })} />
      <NumCell value={r.lifePath} label={`${f.name} life path`} changed={r.lifePath !== o.lifePath} onChange={(n) => set({ lifePath: n })} />
      <NumCell value={r.pinnacle} label={`${f.name} pinnacle`} changed={r.pinnacle !== o.pinnacle} onChange={(n) => set({ pinnacle: n })} />
      <td>
        <select
          className={`cell ${r.animal !== o.animal ? 'changed' : ''}`} value={r.animal ?? ''} aria-label={`${f.name} animal`}
          onChange={(e) => set({ animal: e.target.value || null })}
        >
          <option value="">—</option>
          {ANIMALS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </td>
    </tr>
  )
}

export function toCopyText(fights: Fight[]): string {
  const lines = ['# Name, born day, life path, pinnacle, animal (paste back in to restore)']
  for (const f of fights) {
    for (const x of [f.a, f.b]) {
      const r = x.reading
      lines.push([x.name, r.bornDay ?? '', r.lifePath ?? '', r.pinnacle ?? '', r.animal ?? ''].join(', ') + (r.birth ? `  # born ${r.birth}` : ''))
    }
  }
  return lines.join('\n')
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function ReadingsEditor({ fights, onEdit, onReset, hasEdits }: Props) {
  const [paste, setPaste] = useState('')
  const [results, setResults] = useState<PasteResult[] | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const fighters = fights.flatMap((f) => [f.a, f.b])

  const apply = () => {
    // Strip trailing "# comment" so copied text round-trips.
    const text = paste.split('\n').map((l) => (l.trimStart().startsWith('#') ? l : l.replace(/\s+#.*$/, ''))).join('\n')
    const res = parsePaste(text, fighters.map((f) => ({ key: f.key, name: f.name })))
    const merged = new Map<string, ReadingEdit>()
    for (const r of res) {
      if (!r.ok) continue
      const f = fighters.find((x) => x.key === r.key)!
      merged.set(r.key, applyPatch(merged.get(r.key) ?? f.reading, r.patch))
    }
    merged.forEach((v, k) => onEdit(k, v))
    setResults(res)
  }

  const resetClick = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setConfirmReset(false), 4000)
      return
    }
    window.clearTimeout(timer.current)
    setConfirmReset(false)
    onReset()
  }

  return (
    <section className="panel" aria-labelledby="editor-h">
      <h2 id="editor-h">Readings editor</h2>
      <p className="explain">Every cell is editable. A birth date fills all four values; you can then override any of them. Gold cells differ from the owner’s readings.</p>
      <div className="table-wrap">
        <table className="editor">
          <thead>
            <tr>
              <th>Fighter</th><th>Birth date</th><th>Born day</th><th>Life path</th><th>Pinnacle</th><th>Animal</th>
            </tr>
          </thead>
          {fights.map((f) => (
            <tbody key={f.id} className="fight-group">
              <tr className="group-head"><th colSpan={6}>{f.order}. {f.a.name} vs {f.b.name}</th></tr>
              <Row f={f.a} onEdit={onEdit} />
              <Row f={f.b} onEdit={onEdit} />
            </tbody>
          ))}
        </table>
      </div>

      <div className="paste">
        <label htmlFor="paste-box" className="eyebrow">Paste readings</label>
        <textarea
          id="paste-box" rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} className="mono"
          placeholder={'Gane, 1990-04-12\nHarrison, born day 2, life path 9, pinnacle 11, Horse\nMedic, 7, 33, 11, Rooster'}
        />
        <div className="btn-row">
          <button className="btn btn-primary" disabled={!paste.trim()} onClick={apply}>Apply pasted lines</button>
          <button
            className="btn"
            onClick={async () => {
              const ok = await copyText(toCopyText(fights))
              setCopied(ok ? 'Copied all fighter data' : 'Copy failed — your browser blocked the clipboard')
              window.setTimeout(() => setCopied(null), 2500)
            }}
          >Copy all fighter data</button>
          <button className={`btn ${confirmReset ? 'btn-danger' : ''}`} disabled={!hasEdits && !confirmReset} onClick={resetClick}>
            {confirmReset ? 'Tap again to reset' : 'Reset to owner’s readings'}
          </button>
          {copied && <span className="muted" role="status">{copied}</span>}
        </div>
        {results && (
          <ul className="paste-results" role="status">
            {results.length === 0 && <li className="muted">No lines to read.</li>}
            {results.map((r, i) => (
              <li key={i} className={r.ok ? 'pos' : 'neg'}>
                {r.ok ? `✓ ${r.name}: ${Object.entries(r.patch).filter(([k]) => k !== 'birth').map(([k, v]) => `${k} ${v}`).join(', ')}` : `✗ ${r.line} — ${r.error}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
