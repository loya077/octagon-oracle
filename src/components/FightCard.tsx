import { fmtMoneyline } from '../model/market'
import type { SegmentData } from '../data/events'
import { agreement, agreementLabel, fightTitle, pct, type Analysis, type Fighter } from '../lib/view'
import { completeReading } from '../model/predict'
import { TierPill } from './Verdict'

function Side({ f, p, picked }: { f: Fighter; p: number; picked: boolean }) {
  const loaded = !!completeReading(f.reading)
  return (
    <div className={`side ${picked ? 'picked' : ''}`}>
      <div className="side-name">
        {loaded && <span className="dot" title="Readings loaded" aria-label="Readings loaded" />}
        {f.name}
      </div>
      <div className="side-meta mono">
        <span>{f.record}</span>
        <span>{fmtMoneyline(f.ml)}</span>
        <span className="strong">{pct(p)}</span>
      </div>
    </div>
  )
}

export function FightCard({ an, onOpen }: { an: Analysis; onOpen: () => void }) {
  const { fight, pred } = an
  const ag = agreement(an)
  return (
    <button className="fight-card" onClick={onOpen} aria-label={`Open ${fight.a.name} vs ${fight.b.name} in the reader`}>
      <div className="fc-head">
        <span className="fc-div">{fightTitle(fight)} · {fight.rounds} rds</span>
        <TierPill an={an} />
      </div>
      <Side f={fight.a} p={pred.p} picked={pred.pick === 'A'} />
      <div className="vs">vs</div>
      <Side f={fight.b} p={1 - pred.p} picked={pred.pick === 'B'} />
      <div className="conf" aria-hidden="true">
        <div className="conf-fill" style={{ width: `${pred.confidence * 100}%` }} />
      </div>
      <div className="fc-foot">
        <span>Pick: <strong>{an.winner.name}</strong> {pct(pred.confidence)}</span>
        <span className={`pill pill-read pill-read-${ag}`}>{agreementLabel(an)}</span>
      </div>
      {fight.caveat && <div className="caveat">⚠ {fight.caveat}</div>}
    </button>
  )
}

export function FightNight({ segments, analyses, onOpen }: { segments: SegmentData[]; analyses: Analysis[]; onOpen: (id: string) => void }) {
  return (
    <section className="panel" aria-labelledby="fn-h">
      <h2 id="fn-h">Fight-night picks</h2>
      {segments.map((seg) => {
        const list = analyses.filter((a) => a.fight.segment === seg.key)
        if (!list.length) return null
        return (
          <div key={seg.key} className="segment">
            <h3>{seg.name} <span className="seg-time mono">{seg.start}</span></h3>
            <div className="card-grid">
              {list.map((an) => <FightCard key={an.fight.id} an={an} onOpen={() => onOpen(an.fight.id)} />)}
            </div>
          </div>
        )
      })}
    </section>
  )
}
