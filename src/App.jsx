import React, { useMemo, useState } from "react";
import { QUESTIONS } from "./data/questions.js";
import { score, swingAnalysis } from "./lib/score.js";
import QuestionCard from "./components/QuestionCard.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Results from "./components/Results.jsx";

const STORAGE_KEY = "bi-selector-answers";

function loadAnswers() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAnswers(answers) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    /* storage unavailable — not worth interrupting the user for */
  }
}

export default function App() {
  const [answers, setAnswers] = useState(loadAnswers);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const { live, dead } = useMemo(() => score(answers), [answers]);
  const swings = useMemo(
    () => (done ? swingAnalysis(answers) : []),
    [answers, done]
  );

  const question = QUESTIONS[step];
  const picked = answers[question.id];

  const update = (next) => {
    setAnswers(next);
    saveAnswers(next);
  };

  const advance = () => {
    if (step === QUESTIONS.length - 1) setDone(true);
    else setStep(step + 1);
  };

  const choose = (optId) => {
    if (question.multi) {
      const current = answers[question.id] || [];
      update({
        ...answers,
        [question.id]: current.includes(optId)
          ? current.filter((x) => x !== optId)
          : [...current, optId],
      });
      return;
    }
    update({ ...answers, [question.id]: optId });
    // brief pause so the selection is visible before moving on
    window.setTimeout(advance, 160);
  };

  const reset = () => {
    update({});
    setStep(0);
    setDone(false);
  };

  return (
    <div className="root">
      <div className="wrap">
        <header className="head">
          <div>
            <h1 className="title">Which BI tool fits?</h1>
            <p className="sub">
              Twelve questions, eleven platforms, one scorecard. Your answers
              change the weighting, not the ratings — so you can always see why a
              tool won.
            </p>
          </div>
          <span className="count">
            {done ? "COMPLETE" : `Q${step + 1} / ${QUESTIONS.length}`}
          </span>
        </header>

        <div className="grid">
          <main>
            {done ? (
              <Results
                live={live}
                dead={dead}
                swings={swings}
                onEdit={() => {
                  setDone(false);
                  setStep(0);
                }}
                onReset={reset}
              />
            ) : (
              <QuestionCard
                question={question}
                picked={picked}
                index={step}
                total={QUESTIONS.length}
                answers={answers}
                questions={QUESTIONS}
                onChoose={choose}
                onBack={() => setStep(step - 1)}
                onNext={advance}
              />
            )}
          </main>

          <Leaderboard live={live} dead={dead} />
        </div>
      </div>
    </div>
  );
}
