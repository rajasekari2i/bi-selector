// Profile questions. These run AFTER the approved decision tree.
//
// Questions marked `prefilled: true` overlap with something the tree already
// established, so App.jsx pre-selects an answer from the tree's path. The user
// can still change it — the tree's recommendation is unaffected either way,
// only the scorecard moves.
//
// Each option can do three things:
//   w        -> adds weight to criteria (the normal case)
//   bonus    -> flat points to specific tools (stack fit, which is a jump not a gradient)
//   exclude  -> disqualifies tools outright, with the option label as the reason
//   keepOnly -> disqualifies everything except the listed tools
export const QUESTIONS = [
  {
    id: "users",
    eyebrow: "Audience",
    text: "Who opens the tool on a normal Tuesday?",
    help: "Answer for the majority, not the loudest voice.",
    options: [
      { id: "readers", label: "Business users reading dashboards", w: { easeOfUse: 3, collab: 2, timeToValue: 2 } },
      { id: "analysts", label: "Analysts building their own views", w: { selfService: 3, vizDepth: 2, easeOfUse: 1 } },
      { id: "engineers", label: "A data team that owns the models", w: { governance: 3, scale: 2 } },
      { id: "mixed", label: "A mix of all three", w: { easeOfUse: 2, selfService: 2, governance: 1 } },
    ],
  },
  {
    id: "seats",
    eyebrow: "Scale of rollout",
    text: "How many people will have access in year one?",
    options: [
      { id: "s1", label: "Under 25", w: { cost: 2, timeToValue: 2, easeOfUse: 1 } },
      { id: "s2", label: "25 – 200", w: { cost: 2, governance: 1, ecosystem: 1 } },
      { id: "s3", label: "200 – 2,000", w: { governance: 2, scale: 2, ecosystem: 2 } },
      { id: "s4", label: "More than 2,000", w: { governance: 3, scale: 3, ecosystem: 2, pixelPerfect: 1 } },
    ],
  },
  {
    id: "budget",
    eyebrow: "Budget",
    text: "What can you spend per user, per month?",
    help: "This leaves only the free and open-source options, so pick it only if it is a hard limit.",
    options: [
      { id: "free", label: "Nothing — free or self-hosted open source only", w: { cost: 4 }, keepOnly: ["lookerstudio", "superset", "metabase"] },
      { id: "low", label: "Under $20", w: { cost: 4 } },
      { id: "mid", label: "$20 – $60", w: { cost: 2 } },
      { id: "high", label: "Above $60, or budget isn't the constraint", w: { vizDepth: 1 } },
    ],
  },
  {
    id: "stack",
    eyebrow: "Data platform",
    multi: true,
    prefilled: true,
    text: "Where does most of your data actually live?",
    help: "Pick every source that matters. This is the strongest single signal in the scorecard.",
    options: [
      { id: "ms", label: "Azure, SQL Server or Microsoft 365", w: { deployFlex: 1 }, bonus: { powerbi: 8, powerbiRS: 6 } },
      { id: "aws", label: "AWS — Redshift, S3, Athena", w: {}, bonus: { quicksight: 8, qlik: 3 } },
      { id: "gcp", label: "Google Cloud or BigQuery", w: {}, bonus: { looker: 8, lookerstudio: 6 } },
      { id: "lakehouse", label: "Snowflake or Databricks", w: { scale: 1 }, bonus: { looker: 5, tableau: 4, thoughtspot: 4, sisense: 4 } },
      { id: "onprem", label: "On-premise databases", w: { deployFlex: 2 }, bonus: { qlik: 5, cognos: 5, powerbi: 4, superset: 3, metabase: 3 } },
      { id: "saas", label: "Spreadsheets and SaaS apps", w: { timeToValue: 2, easeOfUse: 1 }, bonus: { zoho: 6, domo: 5, lookerstudio: 4, metabase: 3 } },
    ],
  },
  {
    id: "job",
    eyebrow: "Primary job",
    text: "What is the tool mainly for?",
    options: [
      { id: "exec", label: "Executive dashboards and KPI reporting", w: { vizDepth: 2, collab: 2, governance: 1 } },
      { id: "explore", label: "Ad-hoc exploration and analysis", w: { selfService: 3, vizDepth: 2 } },
      { id: "govern", label: "Consistent metrics across many teams", w: { governance: 3, scale: 2 } },
      { id: "embed", label: "Analytics embedded in our own product", w: { embedding: 4 }, exclude: ["lookerstudio"] },
      { id: "ops", label: "Operational and regulatory reporting", w: { pixelPerfect: 4, governance: 2 } },
      { id: "marketing", label: "Marketing and campaign reporting", w: { cost: 2, timeToValue: 2, easeOfUse: 2 } },
    ],
  },
  {
    id: "volume",
    eyebrow: "Data volume",
    text: "How much data sits behind the busiest dashboard?",
    options: [
      { id: "v1", label: "Under a million rows", w: { cost: 2, timeToValue: 1 } },
      { id: "v2", label: "1 million – 100 million", w: { scale: 1 } },
      { id: "v3", label: "100 million – 1 billion", w: { scale: 3 } },
      { id: "v4", label: "Billions — warehouse scale", w: { scale: 4, governance: 1 } },
    ],
  },
  {
    id: "deploy",
    eyebrow: "Deployment",
    prefilled: true,
    text: "Where is the software allowed to run?",
    options: [
      { id: "saasok", label: "Vendor-hosted cloud is fine", w: {} },
      { id: "vpc", label: "Cloud, but we want a private option", w: { deployFlex: 2 } },
      { id: "onprem", label: "On-premise or our own tenancy only", w: { deployFlex: 4 }, exclude: ["domo", "lookerstudio", "quicksight"] },
    ],
  },
  {
    id: "truth",
    eyebrow: "Governance",
    text: "How much does one agreed definition of each metric matter?",
    options: [
      { id: "critical", label: "Critical — revenue must mean one thing", w: { governance: 4 } },
      { id: "helpful", label: "Helpful, but not worth slowing down for", w: { governance: 2 } },
      { id: "speed", label: "Not a concern right now", w: { timeToValue: 2, easeOfUse: 1 } },
    ],
  },
  {
    id: "nlq",
    eyebrow: "AI & search",
    text: "Should people be able to ask questions in plain language?",
    options: [
      { id: "core", label: "Yes — that's the point of the project", w: { nlqAi: 4, easeOfUse: 2 } },
      { id: "nice", label: "Nice to have", w: { nlqAi: 1 } },
      { id: "no", label: "Not needed", w: {} },
    ],
  },
  {
    id: "skills",
    eyebrow: "In-house skills",
    text: "Who will run and maintain this after launch?",
    options: [
      { id: "eng", label: "Dedicated data or BI engineers", w: { governance: 2, scale: 1 } },
      { id: "analyst", label: "One or two analysts, part-time", w: { easeOfUse: 1, timeToValue: 1 } },
      { id: "none", label: "Nobody technical", w: { easeOfUse: 3, timeToValue: 3, cost: 1 } },
    ],
  },
  {
    id: "freshness",
    eyebrow: "Refresh",
    text: "How fresh does the data need to be?",
    options: [
      { id: "daily", label: "Daily or weekly is fine", w: {} },
      { id: "hourly", label: "Hourly", w: { realtime: 1 } },
      { id: "live", label: "Near real-time or streaming", w: { realtime: 3, scale: 1 } },
    ],
  },
  {
    id: "timeline",
    eyebrow: "Timeline",
    text: "When do you need something people actually use?",
    options: [
      { id: "weeks", label: "Within a few weeks", w: { timeToValue: 3, easeOfUse: 1 } },
      { id: "quarter", label: "Within a quarter", w: { timeToValue: 1 } },
      { id: "later", label: "Six months or more — build it properly", w: { governance: 2, scale: 1 } },
    ],
  },
];
