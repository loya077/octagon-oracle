# Octagon Oracle

**Live site:** https://loya077.github.io/octagon-oracle/

Octagon Oracle predicts UFC fight winners by blending the betting market with the owner's numerology and Chinese-astrology readings. It starts from the no-vig moneyline, then shifts each fight toward whoever the readings favor. A slider sets how far it shifts.

It runs entirely in the browser (Vite + React + TypeScript), with no backend. Your edits are saved in `localStorage`: readings, moneyline overrides, slider settings and the pick ledger.

## What's on the page

- **Settings**: readings influence (default 50, the "Oracle setting"; 0 = market only), astrology weight (25), numerology weight (75), master-number edge (100).
- **The Oracle's verdict**: every fight ranked by confidence, with market chance, call (Lock / Strong / Lean / Toss-up, or *Oracle upset*) and price.
- **Fight-night picks**: cards by segment with start times, win %, a confidence bar and whether the readings agree with the pick.
- **Fight reader**: a fight-by-fight breakdown of every readings row, editable moneylines, and "Add pick to ledger".
- **Readings editor**: edit any fighter's numbers; a birth date fills all four values. Paste lines such as `Gane, 1990-04-12`, `Harrison, born day 2, life path 9, pinnacle 11, Horse` or `Name, 3, 8, 22, Horse`. Names match on last name, and accents are ignored.
- **Pick ledger**: log picks, mark Hit/Miss, and see a running record with separate hit rates for Oracle upsets and market-agreeing picks.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173/octagon-oracle/
npm test         # Vitest: model, data and acceptance tests
npm run build    # production build in dist/
```

## Add a new event

Drop a JSON file into `src/data/events/` (for example `ufc-335.json`). It's picked up automatically via `import.meta.glob`, and an event switcher appears in the header once there's more than one. Copy `ufc-334.json` as a template:

```jsonc
{
  "id": "ufc-335",                     // unique; also namespaces saved edits
  "name": "UFC 335",
  "date": "2026-12-12",                // YYYY-MM-DD, drives the fight-date reading
  "venue": "T-Mobile Arena",
  "city": "Las Vegas, NV",
  "segments": [                        // card order; "key" is referenced by fights
    { "key": "main", "name": "Main card", "start": "10:00 PM ET" }
  ],
  "linesSource": "DraftKings, as of Dec 7, 2026",
  "asOf": "Card and lines as of Dec 7, 2026",
  "fights": [
    {
      "id": "ufc335-01", "order": 1, "segment": "main",
      "division": "Lightweight", "rounds": 5, "title": "Lightweight title",   // title optional
      "caveat": "Optional note shown on the card and in the reader",
      "a": { "name": "Fighter A", "record": "20-2", "ml": -150,
             "reading": { "bornDay": 3, "lifePath": 8, "pinnacle": 22, "animal": "Horse" } },
      "b": { "name": "Fighter B", "record": "18-4", "ml": 130,
             "reading": { "bornDay": null, "lifePath": null, "pinnacle": null, "animal": null } }
    }
  ]
}
```

Use `"ml": null` when there's no line. Leave any reading value `null` if you don't have it; that fighter then counts as having no reading.

## The model

All of the model lives in `src/model/` as pure functions with unit tests.

### Numerology (`numerology.ts`)
- **digitSum(n)**: the sum of all digits in a number or date string; non-digits are ignored.
- **reduce(n)**: repeat until done. If n is 11, 22 or 33, return n. If n is 20, return 11. If n < 10, return n. Otherwise set n = digitSum(n) and repeat. So 29 → 11, 38 → 11, 17 → 8.
- **isMaster(n)**: n is 11, 22 or 33.
- From a birth date `YYYY-MM-DD`:
  - born day = reduce(day of month)
  - life path = reduce(digitSum(date))
  - first pinnacle = reduce(reduce(month) + reduce(day))
  - animal = the Chinese zodiac of the lunar year of birth. A Lunar New Year table covers 1930–2040, and dates before LNY belong to the previous year.

**numRel(a, b)** is checked in this order:
1. Enemies, −3: (1,9), (2,9), (3,4), (4,5), (5,6), (7,8), (9,11), (9,22), in either order.
2. Soulmates, +4: 7 and 11.
3. Match, +3: a = b.
4. Friendly (master), +2: either number is 11, 22 or 33.
5. Friendly, +2: both are in the same group, {1,4,7}, {2,5,8} or {3,6,9}.
6. Otherwise neutral, 0.

### Zodiac (`astrology.ts`)
The animal order is Rat, Ox, Tiger, Cat, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig (index 0–11). "Rabbit" is accepted as Cat and "Sheep" as Goat. **animalRel(a, b)** is checked in this order:
1. Soulmates, +4: Rat–Ox.
2. Enemies, −3: indices 6 apart (Rat–Horse, Ox–Goat, Tiger–Monkey, Cat–Rooster, Dragon–Dog, Snake–Pig).
3. Trine, +3: different animals whose indices differ by a multiple of 4.
4. Same sign, 0. Anything else is neutral, 0.

### Fight-date context
Fight life path = reduce(digitSum(date)), fight day = reduce(day of month), and fight animal = the lunar year's animal. UFC 334 (2026-11-14) gives **life path 8, day 5, Horse**.

### Readings score (`predict.ts`)
- Slot weights: pinnacle ×3, life path ×2, born day ×1.
- Six pairing rows: each slot is checked against the fight life path and against the fight day, scoring numRel × slot weight.
- One master-numbers row: (+6 for a master pinnacle, +8 for a master life path, +6 for a master born day) × masterEdge/100, rounded to 0.1.
- One astrology row: animalRel(fighter animal, fight-year animal).
- num = the sum of the 7 numerology rows; astro = the astrology row; NUM_MAX = 48; AST_MAX = 4.
- **total = (wAstro/10) × (astro/AST_MAX) + (wNum/10) × (num/NUM_MAX) × 2**
- A fighter missing born day, life path, pinnacle or animal has no reading.

### Market baseline (`market.ts`)
- Implied chance: ml < 0 → −ml/(−ml+100); ml > 0 → 100/(ml+100).
- No-vig chance: pA = iA/(iA+iB). If either line is missing, pA = 0.5.

### Prediction
- oDiff = totalA − totalB. It's 0 unless both fighters have readings.
- pRead = sigmoid(oDiff/2.5), the readings' own lean.
- λ = influence/100 × 0.3.
- **p = sigmoid(logit(pMarket) + λ × oDiff)**, fighter A's win chance.
- The pick is A if p > 0.5 and B if p < 0.5. On an exact tie the readings lean decides (B if oDiff < 0), otherwise A.
- Confidence = max(p, 1 − p). Tiers: Lock ≥ 80%, Strong 65–79%, Lean 55–64%, Toss-up < 55%, using whole percentages.
- **Oracle upset**: the fight has a line and the pick differs from the pick at influence 0.

## Fine print

The card and lines are as of Nov 9–13, 2026, and late changes aren't reflected. There's no UFC backtest yet. In the owner's NFL version, readings influence 50 picked 59.2% vs 64.1% for strength ratings alone. Following the market can't beat the market, because favorites pay only enough to break even at their implied chance. This is entertainment, not betting advice.

## Deploy

`.github/workflows/deploy.yml` runs the tests, builds with `base` set to `/<repo-name>/`, and publishes `dist/` to GitHub Pages on every push to `main`. In the repo, go to **Settings → Pages → Source** and choose **GitHub Actions**.

## Layout

```
src/model/         numerology.ts, astrology.ts, market.ts, predict.ts, verdict.ts (+ *.test.ts)
src/data/events/   ufc-334.json  (one file per event)
src/components/    Verdict, FightCard, FightReader, ReadingsEditor, Ledger, Settings, HowItWorks
src/lib/           storage (localStorage), paste parser, ledger, view helpers
```
