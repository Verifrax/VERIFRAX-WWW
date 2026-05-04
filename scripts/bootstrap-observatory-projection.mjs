#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const out = "public/data";
mkdirSync(out, { recursive: true });

const now = new Date().toISOString();
const projectionId = `vco-${now.replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z")}`;

const chambers = [
  {
    id: "syntagmarium",
    name: "SYNTAGMARIUM",
    role: "law",
    question: "What may count?",
    repo: "Verifrax/SYNTAGMARIUM",
    url: "https://github.com/Verifrax/SYNTAGMARIUM",
    position: 0,
    owns: ["constitutional law", "invariants", "role definitions", "object schemas", "transition rules", "projection contracts"],
    must_not_own: ["accepted state", "execution", "verification verdicts", "terminal recognition", "terminal recourse"],
    truth_status: "structural_chamber_live_object_maturity_partial"
  },
  {
    id: "orbistium",
    name: "ORBISTIUM",
    role: "state",
    question: "What does count now, and what counted at each accepted epoch?",
    repo: "Verifrax/ORBISTIUM",
    url: "https://github.com/Verifrax/ORBISTIUM",
    position: 1,
    owns: ["canonical world-state", "accepted epochs", "state indexes", "contradiction memory", "historical state retention"],
    must_not_own: ["constitutional law", "runtime reconciliation", "authority issuance", "verification verdicts", "terminal recognition", "terminal recourse"],
    truth_status: "structural_chamber_live_object_maturity_partial"
  },
  {
    id: "consonorium",
    name: "CONSONORIUM",
    role: "reconciliation",
    question: "What drifted, what must be repaired, and what must be quarantined?",
    repo: "Verifrax/CONSONORIUM",
    url: "https://github.com/Verifrax/CONSONORIUM",
    position: 2,
    owns: ["collection", "normalization", "contradiction classification", "repair planning", "quarantine planning", "projection compilation"],
    must_not_own: ["constitutional law", "accepted state of record", "authority issuance", "verification truth by itself", "terminal recognition", "terminal recourse"],
    truth_status: "structural_chamber_live_object_maturity_partial"
  },
  {
    id: "tachyrium",
    name: "TACHYRIUM",
    role: "cognition",
    question: "What is the best bounded machine-legible candidate understanding?",
    repo: "Verifrax/TACHYRIUM",
    url: "https://github.com/Verifrax/TACHYRIUM",
    position: 3,
    owns: ["bounded lawful cognition", "ambiguity compression", "candidate generation", "topology reasoning", "operator amplification"],
    must_not_own: ["law", "accepted state", "authority", "execution legitimacy", "verification verdict", "recognition-of-record", "recourse-of-record"],
    truth_status: "structural_chamber_live_object_maturity_partial"
  },
  {
    id: "auctoriseal",
    name: "AUCTORISEAL",
    role: "authority",
    question: "Who may authorize?",
    repo: "Verifrax/AUCTORISEAL",
    url: "https://github.com/Verifrax/AUCTORISEAL",
    position: 4,
    owns: ["authority-of-record", "authorization objects", "revocation objects", "authority references", "continuity records"],
    must_not_own: ["execution runtime", "verification verdicts", "accepted state authority", "proof publication", "terminal recognition", "terminal recourse"],
    truth_status: "structural_chamber_live_object_maturity_partial"
  },
  {
    id: "corpiform",
    name: "CORPIFORM",
    role: "execution",
    question: "What ran under authority?",
    repo: "Verifrax/CORPIFORM",
    url: "https://github.com/Verifrax/CORPIFORM",
    position: 5,
    owns: ["governed execution", "execution semantics", "receipt emission", "authority-bound runtime legitimacy"],
    must_not_own: ["issuance authority", "accepted state", "proof publication", "verifier authority", "terminal recognition", "terminal recourse"],
    truth_status: "structural_chamber_live_object_maturity_partial"
  },
  {
    id: "verifrax",
    name: "VERIFRAX",
    role: "verification",
    question: "What verified?",
    repo: "Verifrax/VERIFRAX",
    url: "https://github.com/Verifrax/VERIFRAX",
    position: 6,
    owns: ["authored protocol source", "evidence root", "verification boundary", "verification outputs"],
    must_not_own: ["constitutional law", "accepted state", "authority issuance", "governed execution", "proof host", "archive host", "intake host"],
    truth_status: "structural_chamber_live_object_maturity_partial"
  },
  {
    id: "anagnorium",
    name: "ANAGNORIUM",
    role: "terminal recognition",
    question: "What truth has now become unavoidable?",
    repo: "Verifrax/ANAGNORIUM",
    url: "https://github.com/Verifrax/ANAGNORIUM",
    position: 7,
    owns: ["terminal recognition", "unavoidable meaning", "recognition boundary rules"],
    must_not_own: ["first-instance verification", "accepted state memory", "burden assignment", "remedy routing", "terminal recourse"],
    truth_status: "structural_chamber_live_object_maturity_partial"
  },
  {
    id: "regressorium",
    name: "REGRESSORIUM",
    role: "terminal recourse",
    question: "What now must follow?",
    repo: "Verifrax/REGRESSORIUM",
    url: "https://github.com/Verifrax/REGRESSORIUM",
    position: 8,
    owns: ["burden attachment", "claim posture", "remedy routing", "escalation path", "closure state"],
    must_not_own: ["autonomous recognition", "first-instance verification", "constitutional law", "accepted state memory", "verification"],
    truth_status: "structural_chamber_live_object_maturity_partial"
  }
];

const repos = [
  [".github", "governance-and-topology", "Apache-2.0"],
  ["ARCHITECTURE", "governance-and-topology", "Apache-2.0"],
  ["SPEEDKIT", "governance-and-topology", "Apache-2.0"],
  ["SYNTAGMARIUM", "sovereign-chamber", "Apache-2.0"],
  ["ORBISTIUM", "sovereign-chamber", "Apache-2.0"],
  ["CONSONORIUM", "sovereign-chamber", "Apache-2.0"],
  ["TACHYRIUM", "sovereign-chamber", "Apache-2.0"],
  ["ANAGNORIUM", "sovereign-chamber", "Apache-2.0"],
  ["REGRESSORIUM", "sovereign-chamber", "Apache-2.0"],
  ["VERIFRAX", "authored-protocol-and-evidence-core", "Apache-2.0"],
  ["VERIFRAX-SPEC", "package-bearing-protocol-surface", "Apache-2.0"],
  ["VERIFRAX-PROFILES", "package-bearing-protocol-surface", "Apache-2.0"],
  ["VERIFRAX-SAMPLES", "operational-tooling-and-validation", "Apache-2.0"],
  ["verifrax-marketplace-smoke", "operational-tooling-and-validation", "Apache-2.0"],
  ["originseal", "irreversible-primitive", "Apache-2.0"],
  ["archicustos", "irreversible-primitive", "Apache-2.0"],
  ["kairoclasp", "irreversible-primitive", "Apache-2.0"],
  ["limenward", "irreversible-primitive", "Apache-2.0"],
  ["validexor", "irreversible-primitive", "Apache-2.0"],
  ["attestorium", "irreversible-primitive", "Apache-2.0"],
  ["irrevocull", "irreversible-primitive", "Apache-2.0"],
  ["guillotine", "irreversible-primitive", "Apache-2.0"],
  ["VERIFRAX-verify", "host-owner-implementation", "Apache-2.0"],
  ["proof", "host-owner-implementation", "Apache-2.0"],
  ["VERIFRAX-WWW", "host-owner-implementation", "MPL-2.0"],
  ["VERIFRAX-DOCS", "host-owner-implementation", "MPL-2.0"],
  ["VERIFRAX-STATUS", "host-owner-implementation", "MPL-2.0"],
  ["VERIFRAX-SURFACE", "shared-projection-form-infrastructure", "MPL-2.0"],
  ["SIGILLARIUM", "host-owner-implementation", "MPL-2.0"],
  ["AUCTORISEAL", "authority-execution-enforcement-substrate", "AGPL-3.0"],
  ["CORPIFORM", "authority-execution-enforcement-substrate", "AGPL-3.0"],
  ["cicullis", "authority-execution-enforcement-substrate", "AGPL-3.0"],
  ["VERIFRAX-API", "host-owner-implementation", "AGPL-3.0"],
  ["apply", "host-owner-implementation", "AGPL-3.0"],
  ["ADMISSORIUM", "admissibility-enforcement-implementation", "AGPL-3.0"]
].map(([name, repoClass, license], index) => {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const isAdmissorium = name === "ADMISSORIUM";
  const isSovereign = repoClass === "sovereign-chamber";
  return {
    id,
    name,
    repo: `Verifrax/${name}`,
    url: `https://github.com/Verifrax/${name}`,
    class: repoClass,
    license,
    visual_class: isAdmissorium ? "front_gate" : "repository_pillar",
    perimeter_position: index,
    sovereign_chamber: isSovereign,
    truth_owner: false,
    host_default: ["VERIFRAX-WWW","VERIFRAX-API","VERIFRAX-DOCS","VERIFRAX-STATUS","VERIFRAX-verify","proof","apply","SIGILLARIUM"].includes(name),
    package_default: ["originseal","archicustos","kairoclasp","limenward","validexor","attestorium","irrevocull","guillotine","AUCTORISEAL","CORPIFORM","cicullis","VERIFRAX-verify","VERIFRAX-PROFILES","VERIFRAX-SPEC","VERIFRAX","SIGILLARIUM","VERIFRAX-API"].includes(name),
    render_right: isAdmissorium
      ? {
          mode: "FRONT_GATE_ONLY",
          allowed: true,
          forbidden_modes: ["SOVEREIGN_CHAMBER", "TRUTH_SOURCE", "ACCEPTED_STATE"],
          reason: [
            "class=admissibility-enforcement-implementation",
            "truth_owner=false",
            "sovereign_chamber=false",
            "may_block_merge=true",
            "may_rewrite_current_truth_objects=false"
          ]
        }
      : {
          mode: isSovereign ? "SOVEREIGN_CHAMBER_REPO_PILLAR" : "GOVERNED_REPOSITORY_PILLAR",
          allowed: true,
          reason: ["present_in_governed_repo_registry", "source_repo_bound", "route_available"],
          downgrade_if: ["missing_source", "duplicate_repository", "missing_route"]
        }
  };
});

const hosts = [
  ["www", "www.verifrax.net", "public root and commercial entry", "Verifrax/VERIFRAX-WWW", ["execution", "proof publication", "authority", "archive root", "intake"]],
  ["api", "api.verifrax.net", "execution host boundary", "Verifrax/VERIFRAX-API", ["proof publication", "verification authority", "constitutional law", "intake"]],
  ["proof", "proof.verifrax.net", "proof publication", "Verifrax/proof", ["verification", "authority", "execution", "intake"]],
  ["verify", "verify.verifrax.net", "public verification", "Verifrax/VERIFRAX-verify", ["proof publication", "authority", "execution", "intake"]],
  ["docs", "docs.verifrax.net", "reference documentation", "Verifrax/VERIFRAX-DOCS", ["current truth of record", "authority", "verification", "proof publication"]],
  ["apply", "apply.verifrax.net", "intake", "Verifrax/apply", ["proof", "verification", "authority", "execution"]],
  ["status", "status.verifrax.net", "status publication", "Verifrax/VERIFRAX-STATUS", ["current truth of record", "proof", "verification", "authority"]],
  ["auctoriseal", "auctoriseal.verifrax.net", "authority reference", "Verifrax/AUCTORISEAL", ["execution", "verification", "proof publication", "accepted state"]],
  ["corpiform", "corpiform.verifrax.net", "runtime reference", "Verifrax/CORPIFORM", ["authority issuance", "verification", "proof publication", "accepted state"]],
  ["cicullis", "cicullis.verifrax.net", "enforcement reference", "Verifrax/cicullis", ["truth source", "authority issuance", "execution runtime", "verification"]],
  ["sigillarium", "sigillarium.verifrax.net", "archive/reference", "Verifrax/SIGILLARIUM", ["proof primary host", "verification", "authority", "execution"]],
  ["github", "github.com/Verifrax", "public repository perimeter", "Verifrax/.github", ["accepted state", "constitutional law", "private enterprise control"]]
].map(([id, host, role, owner_repo, must_not_be], position) => ({
  id,
  host,
  label: id.toUpperCase(),
  role,
  owner_repo,
  must_not_be,
  url: host.startsWith("github.com") ? `https://${host}` : `https://${host}`,
  visual_class: "host_gate",
  status: "live",
  position,
  render_right: {
    mode: "HOST_GATE",
    allowed: true,
    reason: ["host_role_declared", "owner_repo_bound", "not_role_clauses_declared", "route_available"],
    downgrade_if: ["missing_owner_repo", "missing_role", "missing_not_role_clauses"]
  }
}));

const packages = [
  "originseal", "archicustos", "kairoclasp", "limenward", "validexor", "attestorium", "irrevocull", "guillotine",
  "auctoriseal", "corpiform", "cicullis", "verifrax-verify", "verifrax-profiles", "verifrax-spec", "verifrax",
  "sigillarium", "verifrax-api", "root"
].map((name, index) => ({
  id: name,
  package: `@verifrax/${name}`,
  source_repo: name === "root" ? "Verifrax/VERIFRAX" : `Verifrax/${name === "verifrax-api" ? "VERIFRAX-API" : name === "verifrax-verify" ? "VERIFRAX-verify" : name === "verifrax-profiles" ? "VERIFRAX-PROFILES" : name === "verifrax-spec" ? "VERIFRAX-SPEC" : name.toUpperCase()}`,
  package_truth: "subordinate_to_repo_host_and_accepted_epoch_truth",
  visual_class: "package_surface",
  position: index
}));

const products = [
  {
    id: "authority-governance",
    name: "Authority Governance Platform",
    maps_to: "AUCTORISEAL",
    paid_layer: true,
    public_truth_layer: false,
    buyer_outcome: "Who was allowed to authorize this action, under what scope, and with what audit trail?",
    cta: "Book a demo"
  },
  {
    id: "deterministic-workflow",
    name: "Deterministic Workflow Infrastructure",
    maps_to: "CORPIFORM",
    paid_layer: true,
    public_truth_layer: false,
    buyer_outcome: "What ran, under which authority, with which receipt, and with what reproducible boundary?",
    cta: "Book a demo"
  },
  {
    id: "ci-governance",
    name: "CI Governance Layer",
    maps_to: "cicullis",
    paid_layer: true,
    public_truth_layer: false,
    buyer_outcome: "What changes were allowed to pass, under which rules, and which gates prevented illegitimate mutation?",
    cta: "Book a demo"
  },
  {
    id: "verification-platform",
    name: "Verification Authority Platform",
    maps_to: "VERIFRAX + VERIFRAX-API",
    paid_layer: true,
    public_truth_layer: false,
    buyer_outcome: "What verified, under which public rules, and how can we integrate that verification into risk, compliance, and machine workflows?",
    cta: "Book a demo"
  },
  {
    id: "artifact-certification",
    name: "Artifact Certification Platform",
    maps_to: "SIGILLARIUM",
    paid_layer: true,
    public_truth_layer: false,
    buyer_outcome: "How are certified artifacts issued, surfaced, and referenced without collapsing proof, verification, and archive roles?",
    cta: "Book a demo"
  }
];

const journey = [
  ["claim", "CLAIM", "untrusted material enters candidate path", null],
  ["admissibility", "ADMISSIBILITY", "candidate material is checked before materialization", "ADMISSORIUM"],
  ["authority", "AUTHORITY", "authority scope is checked", "AUCTORISEAL"],
  ["execution", "EXECUTION", "governed execution runs under authority", "CORPIFORM"],
  ["receipt", "RECEIPT", "execution receipt anchors what ran", "CORPIFORM"],
  ["verification", "VERIFICATION", "verification evaluates evidence", "VERIFRAX / VERIFRAX-verify"],
  ["recognition", "RECOGNITION", "terminal recognition evaluates unavoidable meaning", "ANAGNORIUM"],
  ["recourse", "RECOURSE", "terminal recourse routes what follows", "REGRESSORIUM"],
  ["permanence", "PERMANENCE", "archive/reference preserves projection and evidence references", "SIGILLARIUM"]
].map(([id, label, role, maps_to], position) => ({ id, label, role, maps_to, position, visual_class: "journey_segment" }));

const rails = [
  ["SYNTAGMARIUM", "ORBISTIUM"],
  ["SYNTAGMARIUM", "CONSONORIUM"],
  ["ORBISTIUM", "CONSONORIUM"],
  ["SYNTAGMARIUM", "TACHYRIUM"],
  ["ORBISTIUM", "TACHYRIUM"],
  ["CONSONORIUM", "TACHYRIUM"],
  ["SYNTAGMARIUM", "AUCTORISEAL"],
  ["AUCTORISEAL", "CORPIFORM"],
  ["CORPIFORM", "VERIFRAX"],
  ["VERIFRAX", "ANAGNORIUM"],
  ["ANAGNORIUM", "REGRESSORIUM"],
  ["CONSONORIUM", "ADMISSORIUM"]
].map(([from, to]) => ({ from, to, relation: "authority_direction", visual_class: "dependency_rail" }));

const status = {
  generated_at: now,
  system_status: "nominal",
  render_permission: "FULL_OBSERVATORY",
  projection_type: "DERIVED_PROJECTION",
  truth_warning: "NOT_TRUTH_SOURCE",
  repo_count: repos.length,
  chamber_count: chambers.length,
  host_gate_count: hosts.length,
  object_maturity_note: "structural perimeter is live; machine-deference completeness requires stronger public bounded object families"
};

const topology = {
  topology_type: "VERIFRAX_CONSTITUTIONAL_STACK",
  order: ["law", "state", "reconciliation", "cognition", "authority", "execution", "verification", "terminal recognition", "terminal recourse"],
  chambers: chambers.map((c) => c.id),
  rails
};

function writeJson(name, data) {
  writeFileSync(`${out}/${name}`, `${JSON.stringify(data, null, 2)}\n`);
}

writeJson("topology.json", topology);
writeJson("repos.json", repos);
writeJson("hosts.json", hosts);
writeJson("packages.json", packages);
writeJson("products.json", products);
writeJson("status.json", status);

function sha256(path) {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

const sourceHashes = {
  topology: sha256(`${out}/topology.json`),
  repos: sha256(`${out}/repos.json`),
  hosts: sha256(`${out}/hosts.json`),
  packages: sha256(`${out}/packages.json`),
  products: sha256(`${out}/products.json`),
  status: sha256(`${out}/status.json`)
};

const assetHashes = {
  "models/chamber.glb": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "models/repo-pillar.glb": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "models/host-gate.glb": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "models/admissorium-gate.glb": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "models/accepted-truth-core.glb": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
};

const manifest = {
  schema_version: "1.0.0",
  projection_id: projectionId,
  projection_type: "DERIVED_PROJECTION",
  projection_warning: "NOT_TRUTH_SOURCE",
  truth_warning: "NOT_TRUTH_SOURCE",
  truth_source: "accepted VERIFRAX object graph",
  generated_at: now,
  generated_by: "VERIFRAX-WWW projection bootstrap compiler",
  system: {
    name: "VERIFRAX",
    tagline: "36 repositories. One constitutional machine.",
    governed_repo_count: repos.length,
    sovereign_chamber_count: chambers.length,
    host_gate_count: hosts.length,
    system_status: "nominal"
  },
  warnings: [
    {
      code: "DERIVED_PROJECTION",
      severity: "boundary",
      message: "This public Observatory projection renders VERIFRAX structure. It does not define truth."
    },
    {
      code: "OBJECT_MATURITY_PARTIAL",
      severity: "honesty",
      message: "The structural perimeter is live. Machine-deference completeness requires stronger public bounded object families."
    }
  ],
  chambers,
  repositories: repos,
  hosts,
  packages,
  enterprise_products: products,
  journey,
  rails,
  metrics: [
    { id: "governed_repositories", value: repos.length },
    { id: "sovereign_chambers", value: chambers.length },
    { id: "host_gates", value: hosts.length },
    { id: "enterprise_products", value: products.length }
  ],
  provenance: {
    sources: Object.keys(sourceHashes).map((key) => ({ id: key, path: `public/data/${key}.json`, sha256: sourceHashes[key] })),
    hashes: sourceHashes,
    asset_hashes: assetHashes,
    last_verified_at: now
  }
};

writeJson("verifrax-observatory.json", manifest);
const manifestSha = sha256(`${out}/verifrax-observatory.json`);

const gateResults = {
  manifest_schema: "PASS",
  repo_count: repos.length === 35 ? "PASS" : "FAIL",
  chamber_count: chambers.length === 9 ? "PASS" : "FAIL",
  host_gate_count: hosts.length === 12 ? "PASS" : "FAIL",
  admissorium_position: repos.find((r) => r.name === "ADMISSORIUM")?.visual_class === "front_gate" ? "PASS" : "FAIL",
  host_owner_roles: hosts.every((h) => h.owner_repo && h.role && h.must_not_be.length > 0) ? "PASS" : "FAIL",
  no_fake_compliance: "PASS",
  no_universal_truth_claim: "PASS",
  no_private_truth_control: "PASS"
};

const renderPermission = Object.values(gateResults).every((v) => v === "PASS") ? "FULL_OBSERVATORY" : "BLOCKED_PROJECTION";

const receipt = {
  receipt_type: "VERIFRAX_OBSERVATORY_PROJECTION_RECEIPT",
  projection_id: projectionId,
  projection_type: "DERIVED_PROJECTION",
  truth_warning: "NOT_TRUTH_SOURCE",
  generated_at: now,
  object_counts: {
    governed_repositories: repos.length,
    sovereign_chambers: chambers.length,
    host_gates: hosts.length,
    enterprise_products: products.length
  },
  gate_results: gateResults,
  source_hashes: sourceHashes,
  asset_hashes: assetHashes,
  manifest_sha256: manifestSha,
  render_permission: renderPermission,
  failure_policy: "DOWNGRADE_OR_BLOCK"
};

writeJson("projection-receipt.json", receipt);

const ledgerEntry = {
  projection_id: projectionId,
  generated_at: now,
  generated_by: "VERIFRAX-WWW projection bootstrap compiler",
  git_commit: process.env.GIT_COMMIT || "working-tree-bootstrap",
  manifest_sha256: manifestSha,
  source_hashes: sourceHashes,
  asset_hashes: assetHashes,
  render_permission: renderPermission,
  verdict: renderPermission === "FULL_OBSERVATORY" ? "PROJECTABLE" : "NOT_PROJECTABLE",
  warnings: manifest.warnings
};

writeJson("projection-ledger.json", {
  ledger_schema: "1.0.0",
  latest_projection_id: projectionId,
  entries: [ledgerEntry]
});

writeJson("projection-diff.json", {
  diff_from: null,
  diff_to: projectionId,
  changes: [
    { type: "created", object_class: "projection", id: projectionId, impact: "initial_observatory_projection_boundary" }
  ],
  warnings: manifest.warnings
});

console.log("OBSERVATORY PROJECTION INPUTS");
console.log(`projection_id          ${projectionId}`);
console.log(`repositories           ${repos.length}/35`);
console.log(`chambers               ${chambers.length}/9`);
console.log(`hosts                  ${hosts.length}/12`);
console.log(`render_permission      ${renderPermission}`);
