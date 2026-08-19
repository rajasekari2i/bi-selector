import { CRITERIA, BASE_WEIGHT } from "../data/criteria.js";
import { TOOLS } from "../data/tools.js";
import { QUESTIONS } from "../data/questions.js";

/**
 * Turn a set of answers into weights, bonuses and knockouts.
 * answers: { [questionId]: optionId | optionId[] }
 */
function resolve(answers) {
  const weights = {};
  Object.keys(CRITERIA).forEach((k) => {
    weights[k] = BASE_WEIGHT;
  });

  const bonuses = {};
  const excluded = {};
  let keepOnly = null;

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

/**
 * Weighted sum, normalised to 0-100, plus flat stack-fit bonus.
 * Tools that were knocked out keep a score but are separated out.
 */
export function score(answers) {
  const { weights, bonuses, excluded, keepOnly } = resolve(answers);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const byWeight = Object.entries(weights).sort((a, b) => b[1] - a[1]);

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

  return {
    live: rows.filter((r) => !r.out).sort((a, b) => b.total - a.total),
    dead: rows.filter((r) => r.out),
    weights,
    topCriteria: byWeight.filter(([, w]) => w > BASE_WEIGHT).slice(0, 5),
  };
}

/**
 * Sensitivity check: which single answer, if changed, would most likely
 * change the winner? Useful for a "what would change this?" panel.
 */
export function swingAnalysis(answers) {
  const base = score(answers);
  const winner = base.live[0]?.id;
  if (!winner) return [];

  const swings = [];
  QUESTIONS.forEach((q) => {
    if (!answers[q.id]) return;
    q.options.forEach((opt) => {
      const alt = { ...answers, [q.id]: q.multi ? [opt.id] : opt.id };
      const next = score(alt);
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
