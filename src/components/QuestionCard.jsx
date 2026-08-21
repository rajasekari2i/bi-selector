import React from "react";

export default function QuestionCard({
  question,
  picked,
  total,
  index,
  answers,
  questions,
  prefilled,
  onChoose,
  onBack,
  onNext,
  onRestart,
}) {
  const isOn = (id) =>
    Array.isArray(picked) ? picked.includes(id) : picked === id;

  const hasPick = Array.isArray(picked) ? picked.length > 0 : Boolean(picked);
  const isLast = index === total - 1;

  return (
    <div className="card">
      <div className="eyebrow">{question.eyebrow}</div>
      <h2 className="q">{question.text}</h2>
      {question.help && <p className="help">{question.help}</p>}
      {question.multi && <p className="help">Select all that apply.</p>}
      {prefilled && (
        <p className="prefill-note">
          Pre-filled from your decision path — change it if it isn't right.
        </p>
      )}

      <div role={question.multi ? "group" : "radiogroup"}>
        {question.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="opt"
            data-on={isOn(o.id) ? "1" : "0"}
            aria-pressed={isOn(o.id)}
            onClick={() => onChoose(o.id)}
          >
            <span className="tick" aria-hidden="true" />
            <span>{o.label}</span>
          </button>
        ))}
      </div>

      <div className="nav">
        <button className="btn ghost" disabled={index === 0} onClick={onBack}>
          Back
        </button>
        <button
          className="btn"
          disabled={question.multi && !hasPick}
          onClick={onNext}
        >
          {isLast ? "See results" : "Next"}
        </button>
        <button className="btn ghost" onClick={onNext}>
          Skip
        </button>
        <button className="btn ghost" onClick={onRestart}>
          Restart
        </button>
      </div>

      <div className="ticks" aria-hidden="true">
        {questions.map((qq, i) => (
          <div
            key={qq.id}
            className="tickbar"
            data-s={i === index ? "now" : answers[qq.id] ? "done" : ""}
          />
        ))}
      </div>
    </div>
  );
}
