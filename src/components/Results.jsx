import React from "react";
import { answerRows } from "../data/decisionTree.js";
import { displayName } from "../lib/score.js";

const PLACE = ["Best fit", "Runner-up", "Also consider"];

export default function Results({
  treeAnswers,
  treeResult,
  live,
  dead,
  divergence,
  swings,
  onEditTree,
  onEditProfile,
  onReset,
}) {
  const onPath = live.filter((t) => t.onPath);
  const offPath = live.filter((t) => !t.onPath);

  return (
    <div>
      {/* ---- 1. The approved decision guide's answer ---- */}
      <article className="podium primary-result">
        <div className="eyebrow">Approved decision guide · recommendation</div>
        <h3 className="pname big-name">{treeResult.tool}</h3>
        <p className="pnote">Alternative: {treeResult.alt}</p>
        <ul className="reasons">
          {treeResult.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <table className="summary">
          <tbody>
            {answerRows(treeAnswers).map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {/* ---- 2. Where the scorecard disagrees ---- */}
      {divergence && (
        <div className="card flag">
          <div className="eyebrow warnhead">Worth raising</div>
          <p className="pnote" style={{ margin: 0 }}>
            On your budget, scale and team answers,{" "}
            <strong>{divergence.scoreWinner.name}</strong> scores{" "}
            <strong>{divergence.scoreWinner.total}</strong> — higher than{" "}
            {divergence.bestOnPath ? (
              <>
                <strong>{divergence.bestOnPath.name}</strong> at{" "}
                <strong>{divergence.bestOnPath.total}</strong>, which is what the
                guide points to.
              </>
            ) : (
              "anything the guide points to."
            )}{" "}
            The guide doesn't ask about those factors, so this isn't a
            contradiction — it's a question to take to the POC.
          </p>
        </div>
      )}

      {/* ---- 3. Scorecard ranking ---- */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="eyebrow">Scorecard · on the approved path</div>
        {onPath.length === 0 && (
          <p className="pnote">
            No scored tool matches the guide's recommendation. Check the tool ID
            mapping in decisionTree.js.
          </p>
        )}
        {onPath.map((t, i) => (
          <ToolRow key={t.id} tool={t} place={PLACE[i]} tree={treeAnswers} />
        ))}
      </div>

      {offPath.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="eyebrow">
            Scored but outside the guide's recommendation
          </div>
          <p className="help">
            Still viable under your constraints. Use these to challenge the
            shortlist, not to replace it.
          </p>
          {offPath.slice(0, 4).map((t) => (
            <ToolRow key={t.id} tool={t} tree={treeAnswers} />
          ))}
        </div>
      )}

      {swings.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="eyebrow">What would change the scorecard</div>
          {swings.map((s, i) => (
            <p key={i} className="pnote" style={{ margin: "0 0 10px" }}>
              On “{s.question}”, answering <strong>{s.ifYouPicked}</strong> would
              put <strong>{s.newWinner}</strong> in first place.
            </p>
          ))}
        </div>
      )}

      {dead.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="eyebrow">Ruled out</div>
          {dead.map((t) => (
            <div key={t.id} className="rowtop">
              <span className="strike">{t.name}</span>
              <span className="num muted">{t.out}</span>
            </div>
          ))}
        </div>
      )}

      <div className="nav">
        <button className="btn ghost" onClick={onEditTree}>
          Redo decision path
        </button>
        <button className="btn ghost" onClick={onEditProfile}>
          Change profile answers
        </button>
        <button className="btn ghost" onClick={() => window.print()}>
          Save as PDF
        </button>
        <button className="btn" onClick={onReset}>
          Start over
        </button>
      </div>
    </div>
  );
}

function ToolRow({ tool, place, tree }) {
  return (
    <div className="toolrow">
      <div className="rowtop">
        <span>
          <strong>{displayName(tool, tree)}</strong>
          {place && <span className="place"> · {place}</span>}
        </span>
        <span className="num">{tool.total}</span>
      </div>
      <div className="bar">
        <div className="fill" style={{ width: `${tool.total}%` }} />
      </div>
      <p className="pnote small">{tool.note}</p>
      {tool.strengths.map((s) => (
        <span key={s} className="tag good">
          strong · {s}
        </span>
      ))}
      {tool.risks.map((s) => (
        <span key={s} className="tag warn">
          watch · {s}
        </span>
      ))}
      {tool.bonus > 0 && <span className="tag good">+{tool.bonus} ecosystem</span>}
    </div>
  );
}
