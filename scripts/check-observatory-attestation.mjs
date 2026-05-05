#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { createHash, verify, createPublicKey } from "node:crypto";

const paths = {
  manifest: "data/verifrax-observatory.json",
  receipt: "data/projection-receipt.json",
  ledger: "data/projection-ledger.json",
  attestation: "data/projection-attestation.json",
  publicKey: "data/projection-public-key.json"
};

function fail(message) {
  console.error(`[OBSERVATORY_PROJECTION_CHECK_FAIL] ${message}`);
  process.exit(1);
}

function readBytes(path) {
  if (!existsSync(path)) fail(`missing file: ${path}`);
  return readFileSync(path);
}

function readJson(path) {
  return JSON.parse(readBytes(path).toString("utf8"));
}

function sha256Bytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256Canonical(value) {
  return sha256Bytes(Buffer.from(canonical(value), "utf8"));
}

function check(name, condition, detail = "") {
  if (!condition) fail(`${name}${detail ? `: ${detail}` : ""}`);
  console.log(`${name.padEnd(30)} PASS`);
}

const manifestBytes = readBytes(paths.manifest);
const receiptBytes = readBytes(paths.receipt);
const ledgerBytes = readBytes(paths.ledger);

const receipt = JSON.parse(receiptBytes.toString("utf8"));
const ledger = JSON.parse(ledgerBytes.toString("utf8"));
const attestation = readJson(paths.attestation);
const publicKeyDoc = readJson(paths.publicKey);

check("attestation_type", attestation.attestation_type === "VERIFRAX_OBSERVATORY_PROJECTION_ATTESTATION");
check("schema_version", attestation.schema_version === "1.0.0");
check("projection_type", attestation.projection_type === "DERIVED_PROJECTION");
check("truth_warning", attestation.truth_warning === "NOT_TRUTH_SOURCE");

const projectionId = attestation.projection_id;
const ledgerEntry = Array.isArray(ledger.entries)
  ? ledger.entries.find((entry) => entry.projection_id === projectionId)
  : null;

check("ledger_entry_present", Boolean(ledgerEntry));
check("manifest_hash", attestation.subject.manifest_sha256 === sha256Bytes(manifestBytes));
check("receipt_hash", attestation.subject.receipt_sha256 === sha256Bytes(receiptBytes));
check("ledger_hash", attestation.subject.ledger_sha256 === sha256Bytes(ledgerBytes));
check("ledger_entry_hash", attestation.subject.ledger_entry_sha256 === sha256Canonical(ledgerEntry));
check("receipt_projection_id", !receipt.projection_id || receipt.projection_id === projectionId);

const unsigned = { ...attestation };
delete unsigned.signed_payload_sha256;
delete unsigned.signature;

const payload = Buffer.from(canonical(unsigned), "utf8");
check("signed_payload_hash", attestation.signed_payload_sha256 === sha256Bytes(payload));

const publicKey = createPublicKey(publicKeyDoc.public_key_pem);
check("projection_attestation", verify(null, payload, publicKey, Buffer.from(attestation.signature, "base64")));

console.log("");
console.log("OBSERVATORY PROJECTION CHECK");
console.log("projection_attestation       PASS");
console.log(`render_permission            ${attestation.render_permission}`);
