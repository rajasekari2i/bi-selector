import React from "react";
import { TREE, SECTIONS, pathLabel } from "../data/decisionTree.js";

export default function DecisionTree({
  nodeId,
  treeAnswers,
  depth,
  onChoose,
  onBack,
  onRestart,
}) {
  const node = TREE[nodeId];
  const section = SECTIONS[node.section];

  return (
    <div className="card">
      <div className="tagrow">
        <span className={`sectiontag tone-${section.tone}`}>
          {section.label}
        </span>
        <span className="count">Step {depth + 1}</span>
      </div>

      <h2 className="q">{node.text}</h2>
      <p className="help">{node.help}</p>

      <div className="nav">
        <button className="btn yes" onClick={() => onChoose("yes")}>
          Yes
        </button>
        <button className="btn no" onClick={() => onChoose("no")}>
          No
        </button>
      </div>

      <div className="pathbox">
        <div className="pathlabel">Current path</div>
        <div className="pathval">{pathLabel(treeAnswers)}</div>
      </div>

      <div className="nav">
        <button className="btn ghost" disabled={depth === 0} onClick={onBack}>
          Back
        </button>
        <button className="btn ghost" onClick={onRestart}>
          Restart
        </button>
      </div>
    </div>
  );
}
