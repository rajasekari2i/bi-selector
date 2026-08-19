import React from "react";
import { REVIEWED_ON } from "../data/tools.js";

export default function Leaderboard({ live, dead }) {
  return (
    <aside className="rail">
      <div className="railhead">
        <span>Live ranking</span>
        <span>Fit / 100</span>
      </div>

      {live.map((t, i) => (
        <div key={t.id} className="row" data-lead={i === 0 ? "1" : "0"}>
          <div className="rowtop">
            <span>{t.name}</span>
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
            <span className="strike">{t.name}</span>
            <span className="num">—</span>
          </div>
          <div className="bar">
            <div className="fill" style={{ width: "0%" }} />
          </div>
        </div>
      ))}

      <p className="foot">
        Ratings are fixed editorial judgements held in one table, last reviewed{" "}
        {REVIEWED_ON}. Your answers change how much each criterion counts, plus a
        stack-fit bonus. Confirm pricing and features with each vendor before you
        commit.
      </p>
    </aside>
  );
}
