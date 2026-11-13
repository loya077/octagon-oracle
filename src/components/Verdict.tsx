import { fmtMoneyline } from '../model/market'
import { lastName } from '../lib/names'
import { callLabel, fightTitle, pct, type Analysis } from '../lib/view'

interface Props {
  rows: Analysis[]
  onOpen: (fightId: string) => void
}

export function TierPill({ an }: { an: Analysis }) {
  if (an.pred.upset) return <span className="pill pill-upset">Oracle upset</span>
  return <span className={`pill pill-${an.pred.tier.toLowerCase().replace(/[^a-z]/g, '')}`}>{callLabel(an)}</span>
}

export function Verdict({ rows, onOpen }: Props) {
  const lined = rows.filter((r) => r.pred.hasLine)
  const upsets = lined.filter((r) => r.pred.upset).length
  const favorites = lined.length - upsets
  const noLine = rows.length - lined.length
  return (
    <section className="panel" aria-labelledby="verdict-h">
      <h2 id="verdict-h">The Oracle’s verdict</h2>
      <div className="table-wrap">
        <table className="verdict">
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Winner</th>
              <th>Over</th>
              <th className="num">Win</th>
              <th className="num">Market</th>
              <th>Call</th>
              <th className="num">ML</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const mkt = r.pred.pick === 'A' ? r.pred.pMarket : 1 - r.pred.pMarket
              return (
                <tr key={r.fight.id} onClick={() => onOpen(r.fight.id)} className="clickable" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onOpen(r.fight.id)}>
                  <td className="num mono muted">{i + 1}</td>
                  <td>
                    <strong>{r.winner.name}</strong>
                    <div className="sub">{fightTitle(r.fight)}</div>
                  </td>
                  <td>{lastName(r.loser.name)}</td>
                  <td className="num mono strong">{pct(r.pred.confidence)}</td>
                  <td className="num mono muted">{r.pred.hasLine ? pct(mkt) : '—'}</td>
                  <td><TierPill an={r} /></td>
                  <td className="num mono">{fmtMoneyline(r.winner.ml)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="note">
        {favorites} {favorites === 1 ? 'pick follows' : 'picks follow'} the betting favorite, {upsets} {upsets === 1 ? 'is an' : 'are'} Oracle {upsets === 1 ? 'upset' : 'upsets'}
        {noLine > 0 && <>, and {noLine} {noLine === 1 ? 'fight has' : 'fights have'} no line</>}.
      </p>
    </section>
  )
}
