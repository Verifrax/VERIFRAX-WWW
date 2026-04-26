(() => {
  "use strict";

  const REQUIRED = {
    manifest: "data/verifrax-observatory.json",
    receipt: "data/projection-receipt.json",
    ledger: "data/projection-ledger.json",
    attestation: "data/projection-attestation.json",
    publicKey: "data/projection-public-key.json"
  };

  const FULL = "FULL_OBSERVATORY";
  const SAFE = "SAFE_PROJECTION";
  const BLOCKED = "BLOCKED_PROJECTION";
  const STATIC = "STATIC_FALLBACK";

  const state = {
    mode: STATIC,
    projectionId: "unloaded",
    checks: [],
    errors: []
  };

  function canonical(value) {
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function pemToBytes(pem) {
    return base64ToBytes(
      pem
        .replace(/-----BEGIN PUBLIC KEY-----/g, "")
        .replace(/-----END PUBLIC KEY-----/g, "")
        .replace(/\s+/g, "")
    );
  }

  async function sha256Bytes(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return `sha256:${bytesToHex(new Uint8Array(digest))}`;
  }

  async function sha256Text(text) {
    return sha256Bytes(new TextEncoder().encode(text));
  }

  async function fetchBytes(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`fetch failed for ${path}: ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }

  async function loadJson(path) {
    const bytes = await fetchBytes(path);
    const text = new TextDecoder().decode(bytes);
    return { bytes, text, json: JSON.parse(text) };
  }

  function pass(name, detail) {
    state.checks.push({ name, status: "PASS", detail: detail || "" });
  }

  function fail(name, detail) {
    state.checks.push({ name, status: "FAIL", detail: detail || "" });
    state.errors.push(`${name}${detail ? `: ${detail}` : ""}`);
  }

  function check(name, condition, detail) {
    if (condition) pass(name, detail);
    else fail(name, detail);
    return Boolean(condition);
  }

  async function verifyEd25519(publicKeyPem, signatureBase64, payloadBytes) {
    if (!window.crypto || !crypto.subtle) return false;

    const publicKeyBytes = pemToBytes(publicKeyPem);
    const signatureBytes = base64ToBytes(signatureBase64);

    try {
      const key = await crypto.subtle.importKey("spki", publicKeyBytes, { name: "Ed25519" }, false, ["verify"]);
      return await crypto.subtle.verify({ name: "Ed25519" }, key, signatureBytes, payloadBytes);
    } catch (_) {
      try {
        const key = await crypto.subtle.importKey("spki", publicKeyBytes, "Ed25519", false, ["verify"]);
        return await crypto.subtle.verify("Ed25519", key, signatureBytes, payloadBytes);
      } catch {
        return false;
      }
    }
  }

  function setMode(mode) {
    state.mode = mode;
    document.documentElement.dataset.observatoryRenderPermission = mode;
    document.body.dataset.observatoryRenderPermission = mode;
    document.body.classList.remove("vf-observatory-full", "vf-observatory-safe", "vf-observatory-blocked", "vf-observatory-static");

    if (mode === FULL) document.body.classList.add("vf-observatory-full");
    else if (mode === BLOCKED) document.body.classList.add("vf-observatory-blocked");
    else if (mode === SAFE) document.body.classList.add("vf-observatory-safe");
    else document.body.classList.add("vf-observatory-static");
  }

  function renderPanel() {
    const panel = document.getElementById("observatory-render-gate");
    if (!panel) return;

    const failed = state.checks.filter((item) => item.status === "FAIL");

    panel.innerHTML = `
      <div class="observatory-gate-head">
        <div>
          <span class="observatory-gate-kicker">VERIFRAX CONSTITUTIONAL OBSERVATORY</span>
          <strong>Render permission: ${state.mode}</strong>
        </div>
        <button class="observatory-gate-toggle" type="button" aria-expanded="false">Verify projection</button>
      </div>
      <div class="observatory-gate-strip">
        <span>PROJECTION: ${state.projectionId}</span>
        <span>WARNING: DERIVED_PROJECTION / NOT_TRUTH_SOURCE</span>
        <span>FAILED: ${failed.length}</span>
      </div>
      <div class="observatory-gate-detail" hidden>
        <p>Full Observatory mode is permitted only when the manifest, receipt, ledger, ledger entry, public key, and signed attestation verify in the browser.</p>
        <dl>
          ${state.checks.map((item) => `
            <div class="observatory-gate-check ${item.status === "PASS" ? "is-pass" : "is-fail"}">
              <dt>${item.name}</dt>
              <dd>${item.status}${item.detail ? ` — ${item.detail}` : ""}</dd>
            </div>
          `).join("")}
        </dl>
      </div>
    `;

    const button = panel.querySelector(".observatory-gate-toggle");
    const detail = panel.querySelector(".observatory-gate-detail");

    if (button && detail) {
      button.addEventListener("click", () => {
        const open = detail.hasAttribute("hidden");
        detail.toggleAttribute("hidden", !open);
        button.setAttribute("aria-expanded", String(open));
      });
    }
  }

  async function evaluate() {
    try {
      const [manifestDoc, receiptDoc, ledgerDoc, attestationDoc, publicKeyDoc] = await Promise.all([
        loadJson(REQUIRED.manifest),
        loadJson(REQUIRED.receipt),
        loadJson(REQUIRED.ledger),
        loadJson(REQUIRED.attestation),
        loadJson(REQUIRED.publicKey)
      ]);

      const manifest = manifestDoc.json;
      const receipt = receiptDoc.json;
      const ledger = ledgerDoc.json;
      const attestation = attestationDoc.json;
      const publicKey = publicKeyDoc.json;

      state.projectionId = attestation.projection_id || receipt.projection_id || manifest.projection_id || "missing";

      check("attestation_type", attestation.attestation_type === "VERIFRAX_OBSERVATORY_PROJECTION_ATTESTATION");
      check("schema_version", attestation.schema_version === "1.0.0");
      check("projection_type", attestation.projection_type === "DERIVED_PROJECTION");
      check("truth_warning", attestation.truth_warning === "NOT_TRUTH_SOURCE");
      check("public_key_scope", publicKey.verification_scope === "VERIFRAX_OBSERVATORY_PROJECTION_ATTESTATION");
      check("public_key_policy", publicKey.private_key_policy === "NOT_IN_REPOSITORY");

      const manifestHash = await sha256Bytes(manifestDoc.bytes);
      const receiptHash = await sha256Bytes(receiptDoc.bytes);
      const ledgerHash = await sha256Bytes(ledgerDoc.bytes);

      check("manifest_hash", attestation.subject?.manifest_sha256 === manifestHash);
      check("receipt_hash", attestation.subject?.receipt_sha256 === receiptHash);
      check("ledger_hash", attestation.subject?.ledger_sha256 === ledgerHash);

      const ledgerEntry = Array.isArray(ledger.entries)
        ? ledger.entries.find((entry) => entry.projection_id === attestation.projection_id)
        : null;

      check("ledger_entry_present", Boolean(ledgerEntry));

      if (ledgerEntry) {
        const ledgerEntryHash = await sha256Text(canonical(ledgerEntry));
        check("ledger_entry_hash", attestation.subject?.ledger_entry_sha256 === ledgerEntryHash);
      }

      check("projection_id_alignment", receipt.projection_id === attestation.projection_id && ledger.latest_projection_id === attestation.projection_id);
      check("repo_count", manifest.repositories?.length === 35 && receipt.object_counts?.governed_repositories === 35);
      check("chamber_count", manifest.chambers?.length === 9 && receipt.object_counts?.sovereign_chambers === 9);
      check("host_count", manifest.hosts?.length === 12 && receipt.object_counts?.host_gates === 12);

      const admissorium = Array.isArray(manifest.repositories)
        ? manifest.repositories.find((repo) => repo.name === "ADMISSORIUM")
        : null;

      check(
        "admissorium_front_gate",
        Boolean(admissorium) &&
          admissorium.visual_class === "front_gate" &&
          admissorium.sovereign_chamber === false &&
          admissorium.truth_owner === false
      );

      check("receipt_render_permission", receipt.render_permission === FULL);
      check("attestation_render_permission", attestation.render_permission === FULL);

      const unsigned = { ...attestation };
      delete unsigned.signed_payload_sha256;
      delete unsigned.signature;

      const payloadBytes = new TextEncoder().encode(canonical(unsigned));
      const payloadHash = await sha256Bytes(payloadBytes);
      check("signed_payload_hash", attestation.signed_payload_sha256 === payloadHash);

      const signatureOk = await verifyEd25519(publicKey.public_key_pem, attestation.signature, payloadBytes);
      check("ed25519_signature", signatureOk, signatureOk ? "" : "browser verification unsupported or signature invalid");

      const anyFail = state.checks.some((item) => item.status === "FAIL");

      if (!anyFail && attestation.render_permission === FULL) setMode(FULL);
      else if (!signatureOk) setMode(SAFE);
      else setMode(BLOCKED);
    } catch (error) {
      fail("render_gate_exception", error instanceof Error ? error.message : String(error));
      setMode(BLOCKED);
    }

    renderPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", evaluate, { once: true });
  } else {
    evaluate();
  }
})();
