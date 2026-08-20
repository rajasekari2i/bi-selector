// ---------------------------------------------------------------------------
// The approved decision guide, ported from BI_Reporting_Tool_Advisor.html.
// This is deterministic: no weighting, no scoring. Do not "improve" the logic
// here — it is the artefact that has been signed off. Anything you want to add
// belongs in questions.js as a profile question instead.
//
// Every result also carries `ids`, mapping the recommendation onto entries in
// tools.js so the scorecard can tell which tools are on the approved path.
// ---------------------------------------------------------------------------

export const SECTIONS = {
  start: { label: "Start", tone: "start" },
  internal: { label: "A. Internal users", tone: "green" },
  external: { label: "B. External / customer-facing", tone: "start" },
  standard: { label: "C. Standard BI selection", tone: "purple" },
  multi: { label: "D. Multi-tenant BI", tone: "orange" },
  embeddedBasic: { label: "E. Basic embedded analytics", tone: "cyan" },
  embeddedAdvanced: { label: "F. Advanced embedded analytics", tone: "cyan" },
};

function result(tool, alt, reasons, ids) {
  return { type: "result", tool, alt, reasons, ids };
}

// Section C terminal logic, shared by several branches.
function standardResult(a, advanced) {
  a.advancedVisuals = advanced;
  const e = a.ecosystem;
  const base = ["Commercial BI licensing is acceptable"];
  const visual = advanced
    ? "Advanced visualizations and self-service are a priority"
    : "Advanced visualization is not the primary differentiator";

  if (e === "Microsoft")
    return advanced
      ? result("Tableau / Power BI", "Tableau or Power BI", [...base, "Strong Microsoft ecosystem", visual], ["tableau", "powerbi"])
      : result("Power BI", "Tableau", [...base, "Strong Microsoft ecosystem", visual], ["powerbi"]);

  if (e === "Google / BigQuery")
    return advanced
      ? result("Tableau / Looker", "Tableau or Looker", [...base, "Strong Google / BigQuery ecosystem", visual], ["tableau", "looker"])
      : result("Looker", "Tableau", [...base, "Strong Google / BigQuery ecosystem", visual], ["looker"]);

  if (e === "AWS")
    return advanced
      ? result("Tableau / Qlik", "Tableau or Qlik", [...base, "Strong AWS ecosystem", visual], ["tableau", "qlik"])
      : result("Qlik / Tableau", "Qlik or Tableau", [...base, "Strong AWS ecosystem", visual], ["qlik", "tableau"]);

  return advanced
    ? result("Tableau", "Qlik", [...base, "No strong ecosystem preference", visual], ["tableau"])
    : result("Qlik / Tableau", "Qlik or Tableau", [...base, "No strong ecosystem preference", visual], ["qlik", "tableau"]);
}

export const TREE = {
  q1: {
    section: "start",
    text: "Is analytics primarily for INTERNAL users?",
    help: "Choose NO if the primary users are customers, partners or other external users.",
    yes: (a) => { a.audience = "Internal"; return "q2"; },
    no: (a) => { a.audience = "External / customer-facing"; return "q3"; },
  },

  // --- A. Internal users ---------------------------------------------------
  q2: {
    section: "internal",
    text: "Must the BI platform be self-managed / on-premises?",
    help: "Choose YES if SaaS-only delivery is not acceptable.",
    yes: (a) => { a.selfManaged = true; return "q4"; },
    no: (a) => { a.selfManaged = false; return "q7"; },
  },
  q4: {
    section: "internal",
    text: "Is commercial BI licensing acceptable?",
    help: "Choose NO if you want an open-source / self-hosted path.",
    yes: (a) => { a.commercial = true; return "q5"; },
    no: (a) => { a.commercial = false; return result("Superset", "Metabase", ["Self-managed / on-premises deployment is required", "Commercial BI licensing is not acceptable", "Open-source deployment is the preferred path"], ["superset"]); },
  },
  q5: {
    section: "internal",
    text: "Do you have a strong Microsoft ecosystem?",
    help: "Examples: Azure, Microsoft 365, Fabric, SQL Server or an existing Power BI estate.",
    yes: (a) => { a.ecosystem = "Microsoft"; return result("Power BI Report Server", "Tableau", ["Self-managed / on-premises deployment is required", "Commercial BI licensing is acceptable", "Strong Microsoft ecosystem"], ["powerbiRS"]); },
    no: (a) => { a.ecosystem = "Non-Microsoft"; return result("Tableau / Qlik", "Tableau or Qlik", ["Self-managed / hybrid deployment is required", "Commercial BI licensing is acceptable", "No Microsoft-specific advantage drives the selection"], ["tableau", "qlik"]); },
  },

  // --- B. External / customer-facing ---------------------------------------
  q3: {
    section: "external",
    text: "Does analytics need to be EMBEDDED inside your application / portal?",
    help: "Choose YES if analytics appears within your own SaaS product, application or customer portal.",
    yes: (a) => { a.embedded = true; return "q16"; },
    no: (a) => { a.embedded = false; return "q6"; },
  },
  q6: {
    section: "external",
    text: "Do you have multiple customer tenants?",
    help: "Choose YES when the same analytics platform serves multiple customers or tenants.",
    yes: (a) => { a.multiTenant = true; return "q12"; },
    no: (a) => { a.multiTenant = false; return "q7"; },
  },

  // --- C. Standard BI selection --------------------------------------------
  q7: {
    section: "standard",
    text: "Is commercial BI licensing acceptable?",
    help: "Choose NO for an open-source path.",
    yes: (a) => { a.commercial = true; return "q8"; },
    no: (a) => { a.commercial = false; return result("Metabase / Superset", "Metabase or Superset", ["Commercial BI licensing is not acceptable", "Standard BI use case", "Open-source options are preferred"], ["metabase", "superset"]); },
  },
  q8: {
    section: "standard",
    text: "Do you have a strong Microsoft ecosystem?",
    help: "If NO, we will check Google / BigQuery next.",
    yes: (a) => { a.ecosystem = "Microsoft"; return "q11"; },
    no: () => "q9",
  },
  q9: {
    section: "standard",
    text: "Do you have a strong Google / BigQuery ecosystem?",
    help: "If NO, we will check AWS next.",
    yes: (a) => { a.ecosystem = "Google / BigQuery"; return "q11"; },
    no: () => "q10",
  },
  q10: {
    section: "standard",
    text: "Do you have a strong AWS ecosystem?",
    help: "Choose NO if you have no strong cloud ecosystem preference.",
    yes: (a) => { a.ecosystem = "AWS"; return "q11"; },
    no: (a) => { a.ecosystem = "Neutral"; return "q11"; },
  },
  q11: {
    section: "standard",
    text: "Are advanced visualizations & self-service a priority?",
    help: "Choose YES when rich visual analysis and broad business-user self-service are important.",
    yes: (a) => standardResult(a, true),
    no: (a) => standardResult(a, false),
  },

  // --- D. Multi-tenant BI ---------------------------------------------------
  q12: {
    section: "multi",
    text: "Is HIGH tenant isolation required?",
    help: "High isolation means separate DB / schema or equivalent strong tenant separation.",
    yes: (a) => { a.isolation = "High"; return "q13"; },
    no: () => "q14",
  },
  q13: {
    section: "multi",
    text: "Is commercial BI licensing acceptable?",
    help: "Choose NO for an open-source path.",
    yes: (a) => { a.commercial = true; return result("Qlik / Looker", "Qlik or Looker", ["Multiple customer tenants", "High tenant isolation is required", "Commercial BI licensing is acceptable"], ["qlik", "looker"]); },
    no: (a) => { a.commercial = false; return result("Superset", "Metabase", ["Multiple customer tenants", "High tenant isolation is required", "Commercial BI licensing is not acceptable"], ["superset"]); },
  },
  q14: {
    section: "multi",
    text: "Is RLS sufficient for tenant isolation?",
    help: "Choose YES for medium isolation using row-level security. Choose NO for low / shared isolation.",
    yes: (a) => { a.isolation = "RLS"; return "q15"; },
    no: (a) => { a.isolation = "Shared / low"; return "q7"; },
  },
  q15: {
    section: "multi",
    text: "Is commercial BI licensing acceptable?",
    help: "Choose NO for an open-source path.",
    yes: (a) => { a.commercial = true; return "q15a"; },
    no: (a) => { a.commercial = false; return result("Superset / Metabase", "Superset or Metabase", ["Multiple customer tenants", "RLS is sufficient for tenant isolation", "Commercial BI licensing is not acceptable"], ["superset", "metabase"]); },
  },
  q15a: {
    section: "multi",
    text: "Do you have a strong Microsoft ecosystem?",
    help: "If NO, we will check Google / BigQuery next.",
    yes: (a) => { a.ecosystem = "Microsoft"; return result("Power BI / Qlik", "Power BI or Qlik", ["Multiple tenants with RLS", "Commercial BI licensing is acceptable", "Strong Microsoft ecosystem"], ["powerbi", "qlik"]); },
    no: () => "q15b",
  },
  q15b: {
    section: "multi",
    text: "Do you have a strong Google / BigQuery ecosystem?",
    help: "If NO, we will check AWS next.",
    yes: (a) => { a.ecosystem = "Google / BigQuery"; return result("Looker / Qlik", "Looker or Qlik", ["Multiple tenants with RLS", "Commercial BI licensing is acceptable", "Strong Google / BigQuery ecosystem"], ["looker", "qlik"]); },
    no: () => "q15c",
  },
  q15c: {
    section: "multi",
    text: "Do you have a strong AWS ecosystem?",
    help: "Choose NO if you have no strong ecosystem preference.",
    yes: (a) => { a.ecosystem = "AWS"; return result("Qlik / Tableau", "Qlik or Tableau", ["Multiple tenants with RLS", "Commercial BI licensing is acceptable", "Strong AWS ecosystem"], ["qlik", "tableau"]); },
    no: (a) => { a.ecosystem = "Neutral"; return result("Qlik / Tableau", "Qlik or Tableau", ["Multiple tenants with RLS", "Commercial BI licensing is acceptable", "No strong ecosystem preference"], ["qlik", "tableau"]); },
  },

  // --- E / F. Embedded analytics -------------------------------------------
  q16: {
    section: "embeddedBasic",
    text: "Is BASIC report / dashboard embedding sufficient?",
    help: "Choose NO when you need custom UI, APIs, white-labeling or deeper application integration.",
    yes: (a) => { a.embeddingDepth = "Basic"; return "q17"; },
    no: (a) => { a.embeddingDepth = "Advanced"; return "q19"; },
  },
  q17: {
    section: "embeddedBasic",
    text: "Is commercial BI licensing acceptable?",
    help: "Choose NO for an open-source embedding path.",
    yes: (a) => { a.commercial = true; return "q17a"; },
    no: (a) => { a.commercial = false; return result("Metabase Embed / Superset Embed", "Metabase Embed or Superset Embed", ["Basic embedding is sufficient", "Commercial BI licensing is not acceptable", "Open-source embedded analytics is preferred"], ["metabase", "superset"]); },
  },
  q17a: {
    section: "embeddedBasic",
    text: "Do you have a strong Microsoft ecosystem?",
    help: "If NO, we will check Google / BigQuery next.",
    yes: (a) => { a.ecosystem = "Microsoft"; return result("Power BI Embedded", "Tableau Embedded", ["Basic embedding is sufficient", "Commercial BI licensing is acceptable", "Strong Microsoft ecosystem"], ["powerbi"]); },
    no: () => "q17b",
  },
  q17b: {
    section: "embeddedBasic",
    text: "Do you have a strong Google / BigQuery ecosystem?",
    help: "If NO, we will check AWS next.",
    yes: (a) => { a.ecosystem = "Google / BigQuery"; return result("Looker Embed", "Tableau Embedded", ["Basic embedding is sufficient", "Commercial BI licensing is acceptable", "Strong Google / BigQuery ecosystem"], ["looker"]); },
    no: () => "q17c",
  },
  q17c: {
    section: "embeddedBasic",
    text: "Do you have a strong AWS ecosystem?",
    help: "Choose NO if you have no strong ecosystem preference.",
    yes: (a) => { a.ecosystem = "AWS"; return "q18"; },
    no: (a) => { a.ecosystem = "Neutral"; return "q18"; },
  },
  q18: {
    section: "embeddedBasic",
    text: "Are advanced visualizations & self-service a priority?",
    help: "This chooses between Tableau Embedded and Qlik Embedded.",
    yes: (a) => { a.advancedVisuals = true; return result("Tableau Embedded", "Qlik Embedded", ["Basic embedding is sufficient", "No Microsoft or Google ecosystem advantage", "Advanced visualization and self-service are a priority"], ["tableau"]); },
    no: (a) => { a.advancedVisuals = false; return result("Qlik Embedded", "Tableau Embedded", ["Basic embedding is sufficient", "No Microsoft or Google ecosystem advantage", "Advanced visualization is not the primary differentiator"], ["qlik"]); },
  },
  q19: {
    section: "embeddedAdvanced",
    text: "Is commercial BI licensing acceptable?",
    help: "Choose NO for an open-source advanced embedding path.",
    yes: (a) => { a.commercial = true; return "q19a"; },
    no: (a) => { a.commercial = false; return "q20"; },
  },
  q19a: {
    section: "embeddedAdvanced",
    text: "Do you have a strong Microsoft ecosystem?",
    help: "If NO, we will check Google / BigQuery next.",
    yes: (a) => { a.ecosystem = "Microsoft"; return result("Power BI Embedded", "Tableau Embedded", ["Advanced embedding is required", "Commercial BI licensing is acceptable", "Strong Microsoft ecosystem"], ["powerbi"]); },
    no: () => "q19b",
  },
  q19b: {
    section: "embeddedAdvanced",
    text: "Do you have a strong Google / BigQuery ecosystem?",
    help: "If NO, we will check AWS next.",
    yes: (a) => { a.ecosystem = "Google / BigQuery"; return result("Looker Embed", "Tableau Embedded", ["Advanced embedding is required", "Commercial BI licensing is acceptable", "Strong Google / BigQuery ecosystem"], ["looker"]); },
    no: () => "q19c",
  },
  q19c: {
    section: "embeddedAdvanced",
    text: "Do you have a strong AWS ecosystem?",
    help: "Choose NO if you have no strong ecosystem preference.",
    yes: (a) => { a.ecosystem = "AWS"; return result("Qlik Embedded", "Tableau Embedded", ["Advanced embedding is required", "Commercial BI licensing is acceptable", "Strong AWS ecosystem"], ["qlik"]); },
    no: (a) => { a.ecosystem = "Neutral"; return result("Qlik Embedded", "Tableau Embedded", ["Advanced embedding is required", "Commercial BI licensing is acceptable", "No strong ecosystem preference"], ["qlik"]); },
  },
  q20: {
    section: "embeddedAdvanced",
    text: "Is maximum customization / developer control required?",
    help: "Choose YES for maximum engineering control over the embedded analytics experience.",
    yes: () => result("Superset Embed", "Metabase Embed", ["Advanced embedding is required", "Commercial BI licensing is not acceptable", "Maximum customization / developer control is required"], ["superset"]),
    no: () => result("Metabase Embed", "Superset Embed", ["Advanced embedding is required", "Commercial BI licensing is not acceptable", "Ease of implementation is preferred over maximum customization"], ["metabase"]),
  },
};

// Human-readable breadcrumb of the path taken so far.
export function pathLabel(a) {
  const p = [];
  if (a.audience) p.push(a.audience);
  if (a.selfManaged === true) p.push("Self-managed");
  if (a.selfManaged === false) p.push("Cloud / SaaS");
  if (a.embedded === true) p.push("Embedded");
  if (a.embedded === false) p.push("Not embedded");
  if (a.multiTenant === true) p.push("Multiple tenants");
  if (a.multiTenant === false) p.push("Single tenant");
  if (a.isolation) p.push(a.isolation + " isolation");
  if (a.embeddingDepth) p.push(a.embeddingDepth + " embedding");
  if (a.commercial === true) p.push("Commercial OK");
  if (a.commercial === false) p.push("Open source");
  if (a.ecosystem) p.push(a.ecosystem);
  return p.length ? p.join("  ›  ") : "Start";
}

// The tree's answer table, for the summary panel.
export function answerRows(a) {
  return [
    ["Audience", a.audience],
    ["Deployment", a.selfManaged === true ? "Self-managed / on-prem" : a.selfManaged === false ? "Cloud / SaaS" : null],
    ["Embedded analytics", a.embedded === true ? "Yes" : a.embedded === false ? "No" : null],
    ["Multiple tenants", a.multiTenant === true ? "Yes" : a.multiTenant === false ? "No" : null],
    ["Tenant isolation", a.isolation],
    ["Embedding depth", a.embeddingDepth],
    ["Commercial licensing", a.commercial === true ? "Acceptable" : a.commercial === false ? "Not acceptable" : null],
    ["Ecosystem", a.ecosystem],
    ["Advanced visuals / self-service", a.advancedVisuals === true ? "Yes" : a.advancedVisuals === false ? "No" : null],
  ].filter(([, v]) => v);
}
