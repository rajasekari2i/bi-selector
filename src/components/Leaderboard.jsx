import React from "react";
import { REVIEWED_ON } from "../data/tools.js";
import { displayName } from "../lib/score.js";

export default function Leaderboard({ live, dead, treeAnswers, treeResult }) {
  return (
    <aside className="rail">
      <div className="railhead">
        <span>Live ranking</span>
        <span>Fit / 100</span>
      </div>

      {treeResult && (
        <div className="railpath">
          Approved path points to <strong>{treeResult.tool}</strong>
        </div>
      )}

      {live.map((t, i) => (
        <div
          key={t.id}
          className="row"
          data-lead={i === 0 ? "1" : "0"}
          data-onpath={t.onPath ? "1" : "0"}
        >
          <div className="rowtop">
            <span>
              {displayName(t, treeAnswers)}
              {t.onPath && <span className="pathdot" title="On approved path" />}
            </span>
            <span className="num">{t.total}</span>
          </div>
          <div className="bar">
            <div className="fill" style={{ width: `${t.total}%` }} />
          </div>
        </div>
      ))}

      {dead.map((t) => (
        <div key={t.id} className="row" data-out="1">
          <div className="rowtop">
            <span className="strike">{displayName(t, treeAnswers)}</span>
            <span className="num muted" title={t.out}>
              —
            </span>
          </div>
          <div className="bar">
            <div className="fill" style={{ width: "0%" }} />
          </div>
        </div>
      ))}

      <p className="foot">
        <span className="pathdot inline" /> marks a tool on the approved decision
        path. Ratings are fixed editorial judgements in one table, last reviewed{" "}
        {REVIEWED_ON}; your answers change only how much each criterion counts.
        Confirm pricing and features with each vendor before you commit.
      </p>
    </aside>
  );
}
