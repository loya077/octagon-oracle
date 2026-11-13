import { DEFAULT_SETTINGS, type Settings as S } from '../model/predict'

interface Props {
  settings: S
  onChange: (s: S) => void
}

function explain(s: S): string {
  const lam = (s.influence / 100) * 0.3
  if (s.influence === 0) return 'Market only: every pick is the betting favorite, and the readings are shown but carry no weight.'
  const mix = s.wAstro + s.wNum === 0
    ? 'both reading weights are 0, so the readings score is flat'
    : `the readings score is ${s.wNum} numerology to ${s.wAstro} astrology`
  const master = s.masterEdge === 100 ? 'master numbers get their full bonus' : s.masterEdge === 0 ? 'master numbers get no bonus' : `master numbers get ${s.masterEdge}% of their bonus`
  const tag = s.influence === 50 ? 'Oracle setting: ' : ''
  return `${tag}each point of readings gap moves the market's log-odds by ${lam.toFixed(3)}; ${mix}; ${master}.`
}

export function Settings({ settings, onChange }: Props) {
  const slider = (key: keyof S, label: string, marks: Record<number, string> = {}) => {
    const v = settings[key]
    const mark = marks[v]
    return (
      <label className="slider">
        <span className="slider-head">
          <span>{label}</span>
          <span className="mono slider-val">
            {v}
            {mark && <em className="slider-mark"> · {mark}</em>}
          </span>
        </span>
        <input
          type="range" min={0} max={100} step={1} value={v}
          onChange={(e) => onChange({ ...settings, [key]: Number(e.target.value) })}
          aria-label={label}
        />
      </label>
    )
  }
  const isDefault = (Object.keys(DEFAULT_SETTINGS) as (keyof S)[]).every((k) => settings[k] === DEFAULT_SETTINGS[k])
  return (
    <section className="panel settings" aria-labelledby="settings-h">
      <div className="panel-head">
        <h2 id="settings-h">Settings</h2>
        <button className="btn btn-quiet" disabled={isDefault} onClick={() => onChange(DEFAULT_SETTINGS)}>Defaults</button>
      </div>
      <div className="slider-grid">
        {slider('influence', 'Readings influence', { 50: 'Oracle setting', 0: 'market only' })}
        {slider('wAstro', 'Astrology')}
        {slider('wNum', 'Numerology')}
        {slider('masterEdge', 'Master-number edge')}
      </div>
      <p className="explain">{explain(settings)}</p>
    </section>
  )
}
