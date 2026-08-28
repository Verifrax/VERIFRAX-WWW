import fs from "node:fs";
import crypto from "node:crypto";

const expected = [
  "SYNTAGMARIUM_V010",
  "ORBISTIUM_V010",
  "CONSONORIUM_V010",
  "TACHYRIUM_V010",
  "AUCTORISEAL_V010",
  "CORPIFORM_V010",
  "VERIFRAX_V010",
  "ANAGNORIUM_V010",
  "REGRESSORIUM_V010"
];

const NO_NEXT = "NO_NEXT_ACTION_VERIFRAX_SYSTEM_COMPLETE";

function read(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function bytes(path) {
  return fs.readFileSync(path);
}

function sha256(path) {
  return crypto
    .createHash("sha256")
    .update(bytes(path))
    .digest("hex");
}

const failures = [];

function assert(name, condition) {
  if (!condition) failures.push(name);
}

function mapBySubsystem(entries = []) {
  return Object.fromEntries(
    entries.map((entry) => [entry.subsystem, entry])
  );
}

function exactSet(entries) {
  return [...new Set(entries)].sort();
}

function sameSet(a, b) {
  return JSON.stringify(exactSet(a)) === JSON.stringify(exactSet(b));
}

function closureIdentity(entry) {
  return [
    entry.public_control_closure_repository
      ?? entry.source_repository,
    entry.public_control_closure_sha,
  ].join("@");
}

const manifest = read("data/system-completion-integrity.json");
const completion = read("data/system-completion-closure.json");
const board = read("data/global-status-board.json");
const registry = read("data/subsystem-closure-registry.json");
const root = read("system-control.json");
const rootData = read("data/verifrax-system-control.json");

assert(
  "root_control_copies_not_byte_identical",
  bytes("system-control.json").equals(
    bytes("data/verifrax-system-control.json")
  )
);

assert(
  "completion_data_system_copies_not_identical",
  bytes("data/system-completion-closure.json").equals(
    bytes("system/system-completion-closure.json")
  )
);

assert(
  "completion_alias_data_copy_not_identical",
  bytes("data/system-completion-closure.json").equals(
    bytes("data/verifrax-system-completion-closure.json")
  )
);

assert(
  "completion_alias_system_copy_not_identical",
  bytes("data/system-completion-closure.json").equals(
    bytes("system/verifrax-system-completion-closure.json")
  )
);

assert(
  "integrity_data_system_copies_not_identical",
  bytes("data/system-completion-integrity.json").equals(
    bytes("system/system-completion-integrity.json")
  )
);

assert(
  "board_data_system_copies_not_identical",
  bytes("data/global-status-board.json").equals(
    bytes("system/global-status-board.json")
  )
);

assert(
  "registry_data_system_copies_not_identical",
  bytes("data/subsystem-closure-registry.json").equals(
    bytes("system/subsystem-closure-registry.json")
  )
);

const manifestClosures = manifest.sovereign_closures ?? [];
const completionClosures = completion.subsystem_results ?? [];
const boardClosures = board.registered_public_control_closures ?? [];
const registryClosures = registry.registered_public_control_closures ?? [];

for (const [name, entries] of [
  ["manifest", manifestClosures],
  ["completion", completionClosures],
  ["board", boardClosures],
  ["registry", registryClosures],
]) {
  assert(`${name}_closure_count_not_9`, entries.length === 9);

  assert(
    `${name}_subsystem_set_mismatch`,
    sameSet(entries.map((x) => x.subsystem), expected)
  );

  const identities = entries.map(closureIdentity);

  assert(
    `${name}_closure_identity_not_unique`,
    new Set(identities).size === 9
  );

  for (const entry of entries) {
    const base = entry.subsystem.replace(/_V0\d+$/, "");

    assert(
      `${name}_${entry.subsystem}_state_mismatch`,
      String(entry.state ?? "").includes(base)
      && String(entry.state ?? "").includes("CLOSURE")
    );

    assert(
      `${name}_${entry.subsystem}_not_closed`,
      entry.closed === true
      || String(entry.closure_result ?? "").includes("CLOSED")
    );

    assert(
      `${name}_${entry.subsystem}_repository_scope_missing`,
      Boolean(
        entry.public_control_closure_repository
        ?? entry.source_repository
      )
    );

    assert(
      `${name}_${entry.subsystem}_closure_sha_missing`,
      /^[0-9a-f]{40}$/.test(
        String(entry.public_control_closure_sha ?? "")
      )
    );

    assert(
      `${name}_${entry.subsystem}_object_sha256_missing`,
      /^[0-9a-f]{64}$/.test(
        String(entry.closure_object_sha256 ?? "")
      )
    );

    assert(
      `${name}_${entry.subsystem}_signature_not_verified`,
      entry.closure_commit_signature_verified === true
    );
  }
}

const manifestMap = mapBySubsystem(manifestClosures);

for (const [name, entries] of [
  ["completion", completionClosures],
  ["board", boardClosures],
  ["registry", registryClosures],
]) {
  const current = mapBySubsystem(entries);

  for (const subsystem of expected) {
    const a = manifestMap[subsystem];
    const b = current[subsystem];

    assert(`${name}_${subsystem}_missing`, Boolean(b));

    if (!a || !b) continue;

    assert(
      `${name}_${subsystem}_closure_sha_drift`,
      a.public_control_closure_sha
        === b.public_control_closure_sha
    );

    assert(
      `${name}_${subsystem}_repository_drift`,
      (a.source_repository
        ?? a.public_control_closure_repository)
        ===
      (b.source_repository
        ?? b.public_control_closure_repository)
    );
  }
}

assert(
  "manifest_system_complete_not_true",
  manifest.system_complete === true
);

assert(
  "manifest_count_not_9",
  manifest.required_sovereign_subsystem_count === 9
  && manifest.closed_sovereign_subsystem_count === 9
);

assert(
  "manifest_external_replay_authority_violation",
  manifest.invariants
    ?.system_completion_authority_not_issued_by_external_replay
    === true
);

assert(
  "completion_system_complete_not_true",
  completion.system_complete === true
  && completion.verifrax_system_complete === true
);

assert(
  "completion_gate_not_pass",
  completion.gate_result === "PASS"
  && completion.gate_pass === true
);

assert(
  "completion_blockers_present",
  Array.isArray(completion.blockers)
  && completion.blockers.length === 0
);

assert(
  "completion_next_action_not_terminal",
  completion.next_valid_action === NO_NEXT
);

for (const [name, object] of [
  ["board", board],
  ["registry", registry],
  ["root", root],
  ["root_data", rootData],
]) {
  assert(
    `${name}_system_complete_not_true`,
    object.system_complete === true
  );
}

assert(
  "board_closed_subsystems_mismatch",
  sameSet(board.closed_subsystems ?? [], expected)
);

assert(
  "registry_registered_closed_subsystems_mismatch",
  sameSet(
    registry.registered_closed_subsystems
      ?? expected,
    expected
  )
);

assert(
  "root_board_closed_subsystems_mismatch",
  sameSet(
    root.global_status_board_closed_subsystems ?? [],
    expected
  )
);

assert(
  "root_registry_closed_subsystems_mismatch",
  sameSet(
    root.subsystem_closure_registry_registered_closed_subsystems
      ?? [],
    expected
  )
);

assert(
  "root_forbids_authorized_completion",
  !(root.forbidden_claims ?? [])
    .includes("VERIFRAX_SYSTEM_COMPLETE")
);

assert(
  "root_does_not_allow_authorized_completion",
  (root.allowed_claims ?? [])
    .includes("VERIFRAX_SYSTEM_COMPLETE")
);

assert(
  "root_gate_decision_not_pass",
  root.system_completion_gate_evaluation_decision === "PASS"
);

assert(
  "root_gate_blocker_present",
  root.system_completion_gate_evaluation_blocker == null
);

assert(
  "root_queue_decision_not_complete",
  root.subsystem_closure_queue_decision === "COMPLETE"
);

assert(
  "root_queue_blocker_present",
  root.subsystem_closure_queue_blocker == null
);

assert(
  "root_next_action_not_terminal",
  root.next_valid_action === NO_NEXT
  && root.subsystem_closure_queue_next_valid_action === NO_NEXT
);

assert(
  "root_required_next_level_not_empty",
  Array.isArray(root.required_next_level)
  && root.required_next_level.length === 0
);

assert(
  "root_current_state_missing_or_bad",
  root.current_state?.system_complete === true
  && root.current_state?.completion_gate_result === "PASS"
  && root.current_state?.required_sovereign_subsystem_count === 9
  && root.current_state?.closed_sovereign_subsystem_count === 9
);

const support = manifest.support_closures ?? [];

assert(
  "admissorium_support_boundary_missing",
  support.some(
    (x) =>
      x.subsystem === "ADMISSORIUM_V020"
      && x.excluded_from_sovereign_completion_count === true
  )
);

assert(
  "support_closure_leaked_into_sovereign_set",
  !manifestClosures.some(
    (x) => x.subsystem === "ADMISSORIUM_V020"
  )
);

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        state: "VERIFRAX_SYSTEM_COMPLETION_INTEGRITY_FAIL",
        failures,
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log("VERIFRAX_SYSTEM_COMPLETION_INTEGRITY_GREEN=true");
console.log(
  JSON.stringify(
    {
      required_sovereign_subsystems: 9,
      closed_sovereign_subsystems: 9,
      unique_scoped_closure_commits: 9,
      integrity_manifest_sha256:
        sha256("data/system-completion-integrity.json"),
      completion_sha256:
        sha256("data/system-completion-closure.json"),
      root_control_sha256:
        sha256("system-control.json"),
    }
  )
);
