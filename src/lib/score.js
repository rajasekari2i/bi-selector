import { CRITERIA, BASE_WEIGHT } from "../data/criteria.js";
import { TOOLS } from "../data/tools.js";
import { QUESTIONS } from "../data/questions.js";

/* ------------------------------------------------------------------ */
/* Constraints derived from the approved decision tree                 */
/* ------------------------------------------------------------------ */
/**
 * The tree answers questions the profile questionnaire deliberately doesn't
 * repeat. Translate them into hard exclusions, ecosystem bonuses and weight
 * boosts so the scorecard ranks inside the boundary the tree already drew.
 */
export function constraintsFromTree(t = {}, treeResult = null) {
  const excluded = {};
  const bonuses = {};
  const boost = {};

  const add = (k, v) => {
    boost[k] = (boost[k] || 0) + v;
  };
  const kill = (ids, reason) =>
    ids.forEach((id) => {
      if (!excluded[id]) excluded[id] = reason;
    });

  // Licensing is the tree's sharpest fork, so honour it literally.
  if (t.commercial === false) {
    kill(
      TOOLS.filter((x) => !x.openSource).map((x) => x.id),
      "Commercial licensing not acceptable"
    );
    add("cost", 3);
  }
  if (t.commercial === true) {
    kill(
      TOOLS.filter((x) => x.openSource).map((x) => x.id),
      "Open-source path not taken"
    );
  }

  // Self-managed / on-premises rules out the vendor-hosted-only platforms.
  if (t.selfManaged === true) {
    kill(
      ["domo", "lookerstudio", "quicksight", "looker"],
      "Self-managed / on-premises required"
    );
    add("deployFlex", 4);
  }

  // Embedding inside your own product.
  if (t.embedded === true) {
    kill(["lookerstudio", "powerbiRS", "cognos"], "Not an embedding platform");
    add("embedding", 4);
    if (t.embeddingDepth === "Advanced") add("embedding", 2);
  }

  // Serving many customer tenants raises the governance and isolation bar.
  if (t.multiTenant === true) {
    add("governance", 2);
    add("embedding", 1);
    if (t.isolation === "High") add("governance", 2);
  }

  if (t.advancedVisuals === true) {
    add("vizDepth", 3);
    add("selfService", 2);
  }

  // NOTE: ecosystem bonuses are NOT applied here. The tree's ecosystem answer
  // pre-fills the "stack" profile question instead, and that question carries
  // the bonuses. Applying them in both places would double-count.

  return { excluded, bonuses, boost, onPath: treeResult?.ids || [] };
}

/* ------------------------------------------------------------------ */
/* Weight resolution                                                   */
/* ------------------------------------------------------------------ */
function resolve(answers, constraints) {
  const weights = {};
  Object.keys(CRITERIA).forEach((k) => {
    weights[k] = BASE_WEIGHT;
  });

  const bonuses = { ...(constraints.bonuses || {}) };
  const excluded = { ...(constraints.excluded || {}) };
  let keepOnly = null;

  Object.entries(constraints.boost || {}).forEach(([k, v]) => {
    if (weights[k] !== undefined) weights[k] += v;
  });

  QUESTIONS.forEach((q) => {
    const picked = answers[q.id];
    if (!picked) return;
    const ids = Array.isArray(picked) ? picked : [picked];

    ids.forEach((id) => {
      const opt = q.options.find((o) => o.id === id);
      if (!opt) return;

      Object.entries(opt.w || {}).forEach(([k, v]) => {
        weights[k] += v;
      });
      Object.entries(opt.bonus || {}).forEach(([toolId, v]) => {
        bonuses[toolId] = (bonuses[toolId] || 0) + v;
      });
      (opt.exclude || []).forEach((toolId) => {
        if (!excluded[toolId]) excluded[toolId] = opt.label;
      });
      if (opt.keepOnly) keepOnly = opt.keepOnly;
    });
  });

  return { weights, bonuses, excluded, keepOnly };
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */
export function score(answers, constraints = {}) {
  const { weights, bonuses, excluded, keepOnly } = resolve(answers, constraints);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const byWeight = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  const onPath = constraints.onPath || [];

  const rows = TOOLS.map((tool) => {
    const raw = Object.entries(weights).reduce(
      (sum, [k, w]) => sum + w * (tool.r[k] ?? 0),
      0
    );
    const fit = (raw / (totalWeight * 5)) * 100;
    const bonus = bonuses[tool.id] || 0;

    const out =
      excluded[tool.id] ||
      (keepOnly && !keepOnly.includes(tool.id) ? "Budget set to free" : null);

    return {
      ...tool,
      total: Math.min(100, Math.round(fit + bonus)),
      bonus,
      out,
      onPath: onPath.includes(tool.id),
      strengths: byWeight
        .filter(([k, w]) => w >= 3 && tool.r[k] >= 4)
        .slice(0, 3)
        .map(([k]) => CRITERIA[k]),
      risks: byWeight
        .filter(([k, w]) => w >= 3 && tool.r[k] <= 2)
        .slice(0, 2)
        .map(([k]) => CRITERIA[k]),
    };
  });

  const live = rows.filter((r) => !r.out).sort((a, b) => b.total - a.total);

  return {
    live,
    dead: rows.filter((r) => r.out),
    weights,
    topCriteria: byWeight.filter(([, w]) => w > BASE_WEIGHT).slice(0, 5),
    // The interesting case: the scorecard's winner is not on the approved path.
    divergence:
      onPath.length && live[0] && !live[0].onPath
        ? { scoreWinner: live[0], bestOnPath: live.find((r) => r.onPath) || null }
        : null,
  };
}

/* ------------------------------------------------------------------ */
/* Sensitivity: which single profile answer would flip the ranking?    */
/* ------------------------------------------------------------------ */
export function swingAnalysis(answers, constraints = {}) {
  const base = score(answers, constraints);
  const winner = base.live[0]?.id;
  if (!winner) return [];

  const swings = [];
  QUESTIONS.forEach((q) => {
    if (!answers[q.id]) return;
    q.options.forEach((opt) => {
      if (opt.id === answers[q.id]) return;
      const alt = { ...answers, [q.id]: q.multi ? [opt.id] : opt.id };
      const next = score(alt, constraints);
      if (next.live[0] && next.live[0].id !== winner) {
        swings.push({
          question: q.text,
          ifYouPicked: opt.label,
          newWinner: next.live[0].name,
        });
      }
    });
  });
  return swings.slice(0, 4);
}

/**
 * Seed the overlapping profile questions from the decision path so the user
 * confirms rather than re-answers. Returns only the keys it can infer.
 */
export function prefillFromTree(t = {}) {
  const pre = {};

  const stack = {
    Microsoft: ["ms"],
    "Google / BigQuery": ["gcp"],
    AWS: ["aws"],
  }[t.ecosystem];
  if (stack) pre.stack = stack;
  if (t.selfManaged === true) pre.stack = [...(pre.stack || []), "onprem"];

  if (t.selfManaged === true) pre.deploy = "onprem";
  else if (t.selfManaged === false) pre.deploy = "saasok";

  if (t.embedded === true) pre.job = "embed";

  return pre;
}

/** Display name, respecting the embedded editions the tree recommends. */
export function displayName(tool, treeAnswers = {}) {
  return treeAnswers.embedded && tool.embedName ? tool.embedName : tool.name;
}
