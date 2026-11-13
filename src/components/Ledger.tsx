import { fmtMoneyline } from '../model/market'
import { summarize, type LedgerEntry, type Record3 } from '../lib/ledger'
import { pct } from '../lib/view'

interface Props {
  ledger: LedgerEntry[]
  onLogAll: () => void
  onResult: (id: string, result: LedgerEntry['result']) => void
  onRemove: (id: string) => void
}

const READ_LABEL: Record<LedgerEntry['readings'], string> = { agree: 'agree', split: 'split', even: 'even', none: 'none' }

function Stat({ label, r }: { label: string; r: Record3 }) {
  return (
    <div className="tile">
      <div className="eyebrow">{label}</div>
      <div className="tile-big mono">{r.hits}–{r.misses}</div>
      <div className="tile-sub">{r.rate == null ? 'no graded picks' : `${pct(r.rate, 1)} hit rate`}</div>
    </div>
  )
}

export function Ledger({ ledger, onLogAll, onResult, onRemove }: Props) {
  const s = summarize(ledger)
  return (
    <section className="panel" aria-labelledby="ledger-h">
      <div className="panel-head">
        <h2 id="ledger-h">Pick ledger</h2>
        <button className="btn btn-primary" onClick={onLogAll}>Log all picks</button>
      </div>
      <div className="tiles">
        <Stat label="Record" r={s.all} />
        <Stat label="Oracle upsets" r={s.upsets} />
        <Stat label="Market-agreeing picks" r={s.market} />
      </div>
      {s.pending > 0 && <p className="note">{s.pending} pending {s.pending === 1 ? 'pick' : 'picks'}.</p>}
      {ledger.length === 0 ? (
        <p className="muted">No picks logged yet. Use “Log all picks” or add one from the fight reader.</p>
      ) : (
        <ul className="ledger">
          {ledger.map((x) => (
            <li key={x.id} className={`ledger-row ${x.result ?? ''}`}>
              <div className="ledger-main">
                <strong>{x.pick}</strong> <span className="muted">over {x.opponent}</span>
                <div className="sub mono">
                  {x.eventName} · {fmtMoneyline(x.ml)} · {pct(x.confidence)} · readings {READ_LABEL[x.readings]}
                  {x.upset && <> · <span className="neg">Oracle upset</span></>}
                </div>
              </div>
              <div className="ledger-btns">
                <button className={`btn btn-sm ${x.result === 'hit' ? 'btn-hit' : ''}`} aria-pressed={x.result === 'hit'}
                  onClick={() => onResult(x.id, x.result === 'hit' ? null : 'hit')}>Hit</button>
                <button className={`btn btn-sm ${x.result === 'miss' ? 'btn-miss' : ''}`} aria-pressed={x.result === 'miss'}
                  onClick={() => onResult(x.id, x.result === 'miss' ? null : 'miss')}>Miss</button>
                <button className="btn btn-sm btn-quiet" onClick={() => onRemove(x.id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
