export function HowItWorks() {
  return (
    <section className="panel">
      <details>
        <summary><h2>How it works</h2></summary>
        <div className="rules">
          <h3>Numerology</h3>
          <ul>
            <li><b>Digit sum</b> adds every digit in a number or date; anything else is ignored.</li>
            <li><b>Reduce</b> repeats until done: 11, 22 and 33 stay as they are; 20 becomes 11; anything under 10 stays; otherwise take the digit sum and go again. So 29 → 11, 38 → 11, 17 → 8.</li>
            <li><b>Master numbers</b> are 11, 22 and 33.</li>
            <li>From a birth date: <b>born day</b> = reduce(day of month); <b>life path</b> = reduce(digit sum of the whole date); <b>first pinnacle</b> = reduce(reduce(month) + reduce(day)); <b>animal</b> = the Chinese zodiac of the lunar year (a date before Lunar New Year belongs to the previous year).</li>
          </ul>
          <h3>Number relationships (checked in this order)</h3>
          <ol>
            <li><b>Enemies, −3</b>: 1–9, 2–9, 3–4, 4–5, 5–6, 7–8, 9–11, 9–22.</li>
            <li><b>Soulmates, +4</b>: 7 and 11.</li>
            <li><b>Match, +3</b>: the same number.</li>
            <li><b>Friendly (master), +2</b>: either number is 11, 22 or 33.</li>
            <li><b>Friendly, +2</b>: same group — 1/4/7, 2/5/8 or 3/6/9.</li>
            <li>Otherwise <b>neutral, 0</b>.</li>
          </ol>
          <h3>Zodiac relationships (checked in this order)</h3>
          <ol>
            <li><b>Soulmates, +4</b>: Rat and Ox.</li>
            <li><b>Enemies, −3</b>: six signs apart — Rat–Horse, Ox–Goat, Tiger–Monkey, Cat–Rooster, Dragon–Dog, Snake–Pig.</li>
            <li><b>Trine, +3</b>: Rat–Dragon–Monkey, Ox–Snake–Rooster, Tiger–Horse–Dog, Cat–Goat–Pig.</li>
            <li><b>Same sign, +4</b>: the fighter’s animal matches the year’s animal.</li>
            <li>Anything else: <b>0</b>. Rabbit counts as Cat, Sheep as Goat.</li>
          </ol>
          <h3>Fight date</h3>
          <p>The fight date gets its own life path, day number and year animal. UFC 334 on 2026-11-14 is life path 8, day 5, year of the Horse.</p>
          <h3>Readings score</h3>
          <ul>
            <li>Each of a fighter’s life path and born day is checked against the fight’s life path and the fight’s day, worth the relationship points × the slot weight (life path ×2, born day ×1).</li>
            <li>The <b>pinnacle</b> (×3) counts only as an advantage: +9 when it exactly matches the fight’s life path and +9 when it exactly matches the fight’s day. Any other pinnacle relationship scores 0.</li>
            <li>A <b>master numbers</b> row: +8 for a master life path, +6 for a master born day, scaled by the master-number edge slider and rounded to 0.1. A master pinnacle gets no edge.</li>
            <li>One <b>astrology</b> row: the fighter’s animal against the fight year’s animal.</li>
            <li>Total = (astrology weight ÷ 10) × (astrology ÷ 4) + (numerology weight ÷ 10) × (numerology ÷ 48) × 2.</li>
            <li>A fighter missing any of the four values has no reading.</li>
          </ul>
          <h3>Market and prediction</h3>
          <ul>
            <li>Each moneyline becomes an implied chance (−225 → 225/325; +185 → 100/285). The bookmaker’s cut is removed by dividing A’s chance by the sum of both. With no line, the market is 50/50.</li>
            <li>The readings gap is A’s total minus B’s, or 0 unless both have readings. On their own the readings lean sigmoid(gap ÷ 2.5).</li>
            <li>Fighter A’s chance = sigmoid(logit(market) + λ × gap), where λ = influence ÷ 100 × 0.3.</li>
            <li>The pick is whoever is over 50%. On an exact tie the readings decide (B if the gap is negative), otherwise A.</li>
            <li>Confidence is the pick’s chance. <b>Lock</b> ≥ 80%, <b>Strong</b> 65–79%, <b>Lean</b> 55–64%, <b>Toss-up</b> under 55%.</li>
            <li>An <b>Oracle upset</b> is a fight with a line where the pick differs from the pick at influence 0 — the readings overturned the betting favorite.</li>
          </ul>
        </div>
      </details>
    </section>
  )
}
