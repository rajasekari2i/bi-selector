# BI / Reporting Tool Selection Advisor

Two-part web app:

1. **The approved decision path** — a faithful port of the signed-off decision
   guide (`BI_Reporting_Tool_Advisor_Professional.html`). Yes/no questions,
   deterministic, no scoring. This produces the recommendation of record.
2. **The project profile** — twelve weighted questions covering budget, data
   platform, scale, deployment, team skills and timeline. This ranks tools
   *inside* the boundary the guide already drew, and flags when a higher-scoring
   option sits outside it.

A live leaderboard on the right re-sorts all fourteen tools as you answer, with
a teal dot marking the ones on the approved decision path.

Where a profile question overlaps something the tree already established
(data platform, deployment, embedding), the answer is **pre-filled from the
decision path** and labelled as such. The user can override it — that only moves
the scorecard, never the guide's recommendation.

The guide decides. The scorecard argues.

## Run it

```bash
npm install
npm run dev     # or: npm start
```

Vite prints a local URL, usually http://localhost:5173.

Requires Node 18 or newer (`node -v` to check).

To build for production:

```bash
npm run build
npm run preview
```

## File map

```
src/
├── data/
│   ├── decisionTree.js   the approved guide, ported verbatim — do not "improve"
│   ├── criteria.js       the 14 scoring axes
│   ├── tools.js          0-5 rating matrix, 14 tools
│   └── questions.js      the 12 profile questions
├── lib/score.js          constraintsFromTree(), prefillFromTree(), score(), swingAnalysis()
└── components/
    ├── DecisionTree.jsx
    ├── QuestionCard.jsx
    ├── Leaderboard.jsx   live ranking sidebar
    └── Results.jsx
```

## How the two halves connect

`constraintsFromTree()` in `src/lib/score.js` turns the guide's answers into
scoring constraints:

| Guide answer | Effect on the scorecard |
|---|---|
| Commercial licensing not acceptable | Every commercial tool excluded |
| Commercial licensing acceptable | Superset and Metabase excluded |
| Self-managed / on-premises | Domo, Looker Studio, QuickSight, Looker excluded |
| Embedded | Looker Studio, Power BI Report Server, Cognos excluded; embedding weighted +4 |
| Multiple tenants | Governance +2, embedding +1 (+2 more for high isolation) |
| Advanced visuals a priority | Visual depth +3, self-service +2 |
| Ecosystem = Microsoft / Google / AWS | Pre-fills the "data platform" question, which carries the bonus |

Each tree outcome also carries `ids`, mapping its recommendation onto entries in
`tools.js`. That's what lets the results screen separate "on the approved path"
from "scored well but outside it", and raise a flag when they disagree.

## Tools covered

Power BI, Power BI Report Server, Tableau, Looker, Qlik Sense, ThoughtSpot,
Domo, Sisense, Zoho Analytics, Looker Studio, Amazon QuickSight, IBM Cognos,
Apache Superset, Metabase. Embedded editions are shown by name automatically
when the path is an embedded one.

## Testing

All 50 leaf outcomes of the decision tree have been walked exhaustively. Every
one maps to at least one scored tool, and none leaves the shortlist empty.
Re-run that check after editing `decisionTree.js` or the `ids` mappings.

Note: ecosystem bonuses are applied in `questions.js` only, never in
`constraintsFromTree()`. Adding them in both places would double-count.

## Before you publish

Pricing tiers and AI features move quickly across these vendors. Verify each
rating in `tools.js` against current vendor documentation and bump
`REVIEWED_ON`.
