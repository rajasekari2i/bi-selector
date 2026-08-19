// The axes every tool is rated on. Add or remove one here and the whole
// scoring model adapts — just remember to add a rating for it in tools.js.
export const CRITERIA = {
  cost: "Value for money",
  easeOfUse: "Ease of use",
  vizDepth: "Visual analytics depth",
  governance: "Governance & semantic layer",
  scale: "Performance at scale",
  embedding: "Embedding in your product",
  nlqAi: "Natural language & AI",
  selfService: "Free-form exploration",
  deployFlex: "Deployment flexibility",
  pixelPerfect: "Operational & paginated reporting",
  collab: "Collaboration & sharing",
  ecosystem: "Ecosystem, connectors & hiring pool",
  realtime: "Refresh speed",
  timeToValue: "Time to first dashboard",
};

// Every criterion starts here so nothing can fall to zero influence.
export const BASE_WEIGHT = 1;
