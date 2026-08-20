import React, { useMemo, useState } from "react";
import { TREE } from "./data/decisionTree.js";
import { QUESTIONS } from "./data/questions.js";
import {
  score,
  swingAnalysis,
  constraintsFromTree,
  prefillFromTree,
} from "./lib/score.js";
import DecisionTree from "./components/DecisionTree.jsx";
import QuestionCard from "./components/QuestionCard.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Results from "./components/Results.jsx";

const STORAGE_KEY = "bi-selector-state";

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — not worth interrupting the user for */
  }
}

const FRESH = {
  phase: "tree",
  nodeId: "q1",
  treeAnswers: {},
  treeStack: [],
  treeResult: null,
  profile: {},
  step: 0,
};

export default function App() {
  const [s, setS] = useState(() => load() || FRESH);

  const set = (patch) => {
    const next = { ...s, ...patch };
    setS(next);
    save(next);
  };

  const constraints = useMemo(
    () => constraintsFromTree(s.treeAnswers, s.treeResult),
    [s.treeAnswers, s.treeResult]
  );

  const scored = useMemo(
    () => score(s.profile, constraints),
    [s.profile, constraints]
  );

  const swings = useMemo(
    () => (s.phase === "results" ? swingAnalysis(s.profile, constraints) : []),
    [s.phase, s.profile, constraints]
  );

  /* ---------------- decision tree ---------------- */
  const chooseBranch = (verdict) => {
    const draft = { ...s.treeAnswers };
    const next = TREE[s.nodeId][verdict](draft);
    const stack = [
      ...s.treeStack,
      { nodeId: s.nodeId, snapshot: s.treeAnswers },
    ];

    if (typeof next === "object" && next.type === "result") {
      set({
        treeAnswers: draft,
        treeStack: stack,
        treeResult: next,
        phase: "profile",
        step: 0,
        // seed the overlapping questions so the user confirms, not re-answers
        profile: { ...prefillFromTree(draft), ...s.profile },
      });
    } else {
      set({ treeAnswers: draft, treeStack: stack, nodeId: next });
    }
  };

  const treeBack = () => {
    if (!s.treeStack.length) return;
    const prev = s.treeStack[s.treeStack.length - 1];
    set({
      nodeId: prev.nodeId,
      treeAnswers: prev.snapshot,
      treeStack: s.treeStack.slice(0, -1),
      treeResult: null,
    });
  };

  /* ---------------- profile questions ---------------- */
  const question = QUESTIONS[s.step];

  const advance = () => {
    if (s.step === QUESTIONS.length - 1) set({ phase: "results" });
    else set({ step: s.step + 1 });
  };

  const chooseOption = (optId) => {
    if (question.multi) {
      const current = s.profile[question.id] || [];
      set({
        profile: {
          ...s.profile,
          [question.id]: current.includes(optId)
            ? current.filter((x) => x !== optId)
            : [...current, optId],
        },
      });
      return;
    }
    const next = { ...s, profile: { ...s.profile, [question.id]: optId } };
    setS(next);
    save(next);
    window.setTimeout(() => {
      setS((cur) => {
        const moved =
          cur.step === QUESTIONS.length - 1
            ? { ...cur, phase: "results" }
            : { ...cur, step: cur.step + 1 };
        save(moved);
        return moved;
      });
    }, 160);
  };

  const reset = () => {
    setS(FRESH);
    save(FRESH);
  };

  /* ---------------- render ---------------- */
  const phaseLabel = {
    tree: "Part 1 · Approved decision path",
    profile: "Part 2 · Project profile",
    results: "Complete",
  }[s.phase];

  return (
    <div className="root">
      <div className="wrap">
        <header className="head">
          <div>
            <h1 className="title">BI tool selection advisor</h1>
            <p className="sub">
              The approved decision guide chooses the platform. A weighted
              scorecard then tests that choice against budget, scale and team
              constraints the guide doesn't ask about.
            </p>
          </div>
          <span className="count">{phaseLabel}</span>
        </header>

        <div className="grid">
          <main>
          {s.phase === "tree" && (
            <DecisionTree
              nodeId={s.nodeId}
              treeAnswers={s.treeAnswers}
              depth={s.treeStack.length}
              onChoose={chooseBranch}
              onBack={treeBack}
              onRestart={reset}
            />
          )}

          {s.phase === "profile" && (
            <>
              <div className="banner">
                Decision path complete — the guide points to{" "}
                <strong>{s.treeResult.tool}</strong>. These{" "}
                {QUESTIONS.length} questions check it against your budget, scale
                and team.
              </div>
              <QuestionCard
                prefilled={
                  question.prefilled && Boolean(s.profile[question.id])
                }
                question={question}
                picked={s.profile[question.id]}
                index={s.step}
                total={QUESTIONS.length}
                answers={s.profile}
                questions={QUESTIONS}
                onChoose={chooseOption}
                onBack={() => set({ step: s.step - 1 })}
                onNext={advance}
              />
            </>
          )}

          {s.phase === "results" && (
            <Results
              treeAnswers={s.treeAnswers}
              treeResult={s.treeResult}
              live={scored.live}
              dead={scored.dead}
              divergence={scored.divergence}
              swings={swings}
              onEditTree={() =>
                set({ phase: "tree", nodeId: "q1", treeAnswers: {}, treeStack: [], treeResult: null })
              }
              onEditProfile={() => set({ phase: "profile", step: 0 })}
              onReset={reset}
            />
          )}
          </main>

          <Leaderboard
            live={scored.live}
            dead={scored.dead}
            treeAnswers={s.treeAnswers}
            treeResult={s.treeResult}
          />
        </div>
      </div>
    </div>
  );
}
