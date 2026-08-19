import React from "react";

const PLACE = ["Best fit", "Runner-up", "Also consider"];

export default function Results({ live, dead, swings, onEdit, onReset }) {
  return (
    <div>
      {live.slice(0, 3).map((t, i) => (
        <article key={t.id} className="podium">
          <span className="big">{t.total}</span>
          <div className="eyebrow">
            {PLACE[i]} · {t.vendor}
          </div>
          <h3 className="pname">{t.name}</h3>
          <p className="pnote">{t.note}</p>

          {t.strengths.map((s) => (
            <span key={s} className="tag good">
              strong · {s}
            </span>
          ))}
          {t.risks.map((s) => (
            <span key={s} className="tag warn">
              watch · {s}
            </span>
          ))}
          {t.bonus > 0 && <span className="tag good">+{t.bonus} stack fit</span>}

          {t.site && (
            <p className="pnote" style={{ marginBottom: 0 }}>
              <a href={t.site} target="_blank" rel="noreferrer">
                Check current pricing →
              </a>
            </p>
          )}
        </article>
      ))}

      {swings.length > 0 && (
        <div className="card" style={{ marginTop: 6 }}>
          <div className="eyebrow">What would change this</div>
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
        <button className="btn ghost" onClick={onEdit}>
          Change answers
        </button>
        <button className="btn" onClick={onReset}>
          Start over
        </button>
        <button className="btn ghost" onClick={() => window.print()}>
          Save as PDF
        </button>
      </div>
    </div>
  );
}
