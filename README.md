# BI Tool Selector

A twelve-question web app that scores eleven business intelligence platforms
against your situation and explains its reasoning.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

The output in `dist/` is fully static — deploy it to Netlify, Vercel, GitHub
Pages, S3, or any web server.

## How the scoring works

Three layers, kept deliberately separate:

1. **Fixed ratings** — `src/data/tools.js` rates every tool 0–5 on each
   criterion. These are editorial judgements and never change based on who is
   answering.
2. **Dynamic weights** — `src/data/questions.js` maps each answer to criteria
   weights. Every criterion starts at weight 1 so nothing drops to zero
   influence.
3. **Knockouts and bonuses** — some answers disqualify a tool outright
   (`exclude`, `keepOnly`), and data-platform answers apply flat point bonuses
   (`bonus`) because stack fit is a jump rather than a gradient.

Final score: `Σ(weight × rating) / (Σweights × 5) × 100`, plus bonus, capped
at 100.

`src/lib/score.js` also exposes `swingAnalysis()`, which reports which single
answer change would most likely produce a different winner.

## Editing it

- **Change a rating** → `src/data/tools.js`, and bump `REVIEWED_ON`.
- **Add or reword a question** → `src/data/questions.js`. No other file needs
  to change.
- **Add a criterion** → add it to `src/data/criteria.js` *and* give every tool
  a rating for it in `src/data/tools.js`.

## Before you publish

Pricing tiers and AI features across these vendors move quickly. Verify each
rating against current vendor documentation, and consider adding a source link
per rating so users can check your reasoning.
