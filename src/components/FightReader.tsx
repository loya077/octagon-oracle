import { useEffect, useState } from 'react'
import { fmtMoneyline } from '../model/market'
import { lastName } from '../lib/names'
import { agreementLabel, fightTitle, pct, recordWinRate, signed, type Analysis, type Fighter } from '../lib/view'
import { TierPill } from './Verdict'

interface Props {
  analyses: Analysis[]
  selectedId: string
  onSelect: (id: string) => void
  onOdds: (fightId: string, side: 'a' | 'b', ml: number | null) => void
  onResetOdds: (fightId: string) => void
  onLog: (an: Analysis) => void
  logged: boolean
}

/** Parse "−225", "-225", "+185", "185"; empty → null; invalid → undefined. */
export function parseMoneyline(raw: string): number | null | undefined {
  const s = raw.trim().replace(/[−–—]/g, '-')
  if (!s) return null
  if (!/^[+-]?\d+$/.test(s)) return undefined
  const n = Number(s)
  if (Math.abs(n) < 100) return undefined
  return n
}

function MlInput({ fighter, onCommit }: { fighter: Fighter; onCommit: (ml: number | null) => void }) {
  const shown = fighter.ml == null ? '' : fmtMoneyline(fighter.ml)
  const [raw, setRaw] = useState(shown)
  useEffect(() => setRaw(shown), [shown])
  const parsed = parseMoneyline(raw)
  const commit = () => {
    if (parsed === undefined) setRaw(shown)
    else if (parsed !== fighter.ml) onCommit(parsed)
  }
  return (
    <label className="ml-input">
      <span>{lastName(fighter.name)}</span>
      <input
        className={`mono ${parsed === undefined ? 'invalid' : ''}`}
        value={raw}
        inputMode="text"
        placeholder="no line"
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
        aria-label={`${fighter.name} moneyline`}
      />
    </label>
  )
}

function PointsCell({ v }: { v: number | undefined }) {
  if (v === undefined) return <td className="num mono muted">—</td>
  const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'muted'
  return <td className={`num mono ${cls}`}>{signed(v)}</td>
}

export function FightReader({ analyses, selectedId, onSelect, onOdds, onResetOdds, onLog, logged }: Props) {
  const an = analyses.find((x) => x.fight.id === selectedId) ?? analyses[0]
  const { fight, pred } = an
  const { a, b } = fight
  const oddsEdited = a.ml !== a.baseMl || b.ml !== b.baseMl
  const ra = recordWinRate(a.record), rb = recordWinRate(b.record)
  const sA = pred.scoreA, sB = pred.scoreB
  const rowCount = (sA ?? sB)?.rows.length ?? 0
  const marketFav = !pred.hasLine ? null : pred.pMarket >= 0.5 ? a : b

  return (
    <section className="panel" id="reader" aria-labelledby="reader-h">
      <h2 id="reader-h">Fight reader</h2>
      <select className="fight-select" value={fight.id} onChange={(e) => onSelect(e.target.value)} aria-label="Choose a fight">
        {analyses.map((x) => (
          <option key={x.fight.id} value={x.fight.id}>
            {x.fight.order}. {x.fight.a.name} vs {x.fight.b.name} — {fightTitle(x.fight)}
          </option>
        ))}
      </select>

      <div className="reader-pick">
        <div>
          <div className="eyebrow">The pick</div>
          <div className="pick-name">{an.winner.name}</div>
        </div>
        <div className="pick-pct mono">{pct(pred.confidence)}</div>
        <TierPill an={an} />
      </div>

      <div className="split" role="img" aria-label={`${a.name} ${pct(pred.p)}, ${b.name} ${pct(1 - pred.p)}`}>
        <div className={`split-a ${pred.pick === 'A' ? 'won' : ''}`} style={{ width: `${pred.p * 100}%` }}>
          <span>{lastName(a.name)} {pct(pred.p)}</span>
        </div>
        <div className={`split-b ${pred.pick === 'B' ? 'won' : ''}`}>
          <span>{pct(1 - pred.p)} {lastName(b.name)}</span>
        </div>
      </div>

      <div className="tiles">
        <div className="tile">
          <div className="eyebrow">Market</div>
          {pred.hasLine ? (
            <>
              <div className="tile-big mono">{pct(Math.max(pred.pMarket, 1 - pred.pMarket))}</div>
              <div className="tile-sub">{marketFav!.name} favored · no-vig</div>
            </>
          ) : (
            <>
              <div className="tile-big mono">50%</div>
              <div className="tile-sub">No line — market treated as a coin flip</div>
            </>
          )}
        </div>
        <div className="tile">
          <div className="eyebrow">Records</div>
          <div className="tile-big mono">{a.record} · {b.record}</div>
          <div className="tile-sub">
            Win rate {ra == null ? '—' : pct(ra)} vs {rb == null ? '—' : pct(rb)} (shown, not used by the model)
          </div>
        </div>
        <div className="tile">
          <div className="eyebrow">Your readings</div>
          {pred.hasReadings ? (
            <>
              <div className="tile-big mono">{signed(sA!.total, 2)} · {signed(sB!.total, 2)}</div>
              <div className="tile-sub">{agreementLabel(an)} · readings alone: {lastName(pred.oDiff >= 0 ? a.name : b.name)} {pct(Math.max(pred.pRead, 1 - pred.pRead))}</div>
            </>
          ) : (
            <>
              <div className="tile-big mono">—</div>
              <div className="tile-sub">Readings need all four values for both fighters</div>
            </>
          )}
        </div>
      </div>

      <div className="odds-row">
        <MlInput fighter={a} onCommit={(ml) => onOdds(fight.id, 'a', ml)} />
        <MlInput fighter={b} onCommit={(ml) => onOdds(fight.id, 'b', ml)} />
        <button className="btn btn-quiet" disabled={!oddsEdited} onClick={() => onResetOdds(fight.id)}>
          Reset to {fmtMoneyline(a.baseMl)} / {fmtMoneyline(b.baseMl)}
        </button>
      </div>
      {fight.caveat && <p className="caveat">⚠ {fight.caveat}</p>}

      <div className="table-wrap">
        <table className="breakdown">
          <thead>
            <tr>
              <th>Reading</th>
              <th>{lastName(a.name)}</th>
              <th className="num">Pts</th>
              <th>{lastName(b.name)}</th>
              <th className="num">Pts</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, i) => {
              const rA = sA?.rows[i], rB = sB?.rows[i]
              const label = (rA ?? rB)!.label
              return (
                <tr key={label}>
                  <td className="muted">{label}</td>
                  <td>{rA?.note ?? '—'}</td>
                  <PointsCell v={rA?.points} />
                  <td>{rB?.note ?? '—'}</td>
                  <PointsCell v={rB?.points} />
                </tr>
              )
            })}
            {rowCount === 0 && (
              <tr><td colSpan={5} className="muted">No readings loaded for this fight.</td></tr>
            )}
          </tbody>
          {rowCount > 0 && (
            <tfoot>
              <tr><td>Numerology (of 48)</td><td /><PointsCell v={sA?.num} /><td /><PointsCell v={sB?.num} /></tr>
              <tr><td>Astrology (of 4)</td><td /><PointsCell v={sA?.astro} /><td /><PointsCell v={sB?.astro} /></tr>
              <tr className="strong"><td>Weighted total</td><td /><PointsCell v={sA?.total} /><td /><PointsCell v={sB?.total} /></tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="reader-actions">
        <button className="btn btn-primary" onClick={() => onLog(an)}>
          {logged ? 'Update pick in ledger' : 'Add pick to ledger'}
        </button>
      </div>
    </section>
  )
}
