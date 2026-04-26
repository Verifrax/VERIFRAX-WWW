#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { createHash, generateKeyPairSync, sign, verify, createPrivateKey, createPublicKey } from "node:crypto";

const paths = {
  manifest: "public/data/verifrax-observatory.json",
  receipt: "public/data/projection-receipt.json",
  ledger: "public/data/projection-ledger.json",
  attestation: "public/data/projection-attestation.json",
  publicKey: "public/data/projection-public-key.json"
};

const keyId = process.env.VERIFRAX_PROJECTION_PUBLIC_KEY_ID || "verifrax-www-projection-key-001";
const keyDir = process.env.VERIFRAX_PROJECTION_KEY_DIR || join(homedir(), ".verifrax", "projection-keys");
const privateKeyPath = join(keyDir, `${keyId}.ed25519.pkcs8.pem`);
const publicKeyPath = join(keyDir, `${keyId}.ed25519.spki.pem`);

function fail(message) {
  console.error(`[OBSERVATORY_ATTESTATION_FAIL] ${message}`);
  process.exit(1);
}

function readRequired(path) {
  if (!existsSync(path)) fail(`missing required projection input: ${path}`);
  return readFileSync(path);
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

function assertNoPlaceholder(value, path = "root") {
  if (typeof value === "string") {
    if (value.includes("...") || value === "base64..." || value === "sha256:..." || value.trim() === "") {
      fail(`placeholder value blocked at ${path}`);
    }
    return;
  }
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoPlaceholder(item, `${path}[${index}]`));
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) assertNoPlaceholder(child, `${path}.${key}`);
  }
}

function ensureProjectionKey() {
  mkdirSync(keyDir, { recursive: true });

  if (!existsSync(privateKeyPath) || !existsSync(publicKeyPath)) {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    writeFileSync(privateKeyPath, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
    writeFileSync(publicKeyPath, publicKey.export({ type: "spki", format: "pem" }), { mode: 0o644 });
    chmodSync(privateKeyPath, 0o600);
  }

  return {
    privatePem: readFileSync(privateKeyPath, "utf8"),
    publicPem: readFileSync(publicKeyPath, "utf8")
  };
}

const manifestBytes = readRequired(paths.manifest);
const receiptBytes = readRequired(paths.receipt);
const ledgerBytes = readRequired(paths.ledger);

const manifest = JSON.parse(manifestBytes.toString("utf8"));
const receipt = JSON.parse(receiptBytes.toString("utf8"));
const ledger = JSON.parse(ledgerBytes.toString("utf8"));

const projectionId =
  receipt.projection_id ||
  ledger.latest_projection_id ||
  manifest.projection_id ||
  fail("projection_id missing from receipt, ledger, and manifest");

const ledgerEntry = Array.isArray(ledger.entries)
  ? ledger.entries.find((entry) => entry.projection_id === projectionId)
  : null;

if (!ledgerEntry) fail(`ledger entry not found for projection_id: ${projectionId}`);

const sourceHashes =
  ledgerEntry.source_hashes ||
  receipt.source_hashes ||
  manifest.source_hashes ||
  fail("source_hashes missing from ledger entry / receipt / manifest");

const assetHashes =
  ledgerEntry.asset_hashes ||
  receipt.asset_hashes ||
  manifest.asset_hashes ||
  {};

const renderPermission =
  receipt.render_permission ||
  ledgerEntry.render_permission ||
  ledgerEntry.verdict ||
  fail("render_permission missing from receipt / ledger entry");

const truthWarning = receipt.truth_warning || manifest.truth_warning || "NOT_TRUTH_SOURCE";
const projectionType = receipt.projection_type || manifest.projection_type || "DERIVED_PROJECTION";

if (projectionType !== "DERIVED_PROJECTION") fail(`projection_type must be DERIVED_PROJECTION, got ${projectionType}`);
if (truthWarning !== "NOT_TRUTH_SOURCE") fail(`truth_warning must be NOT_TRUTH_SOURCE, got ${truthWarning}`);

const { privatePem, publicPem } = ensureProjectionKey();

const unsigned = {
  attestation_type: "VERIFRAX_OBSERVATORY_PROJECTION_ATTESTATION",
  schema_version: "1.0.0",
  projection_id: projectionId,
  projection_type: projectionType,
  truth_warning: truthWarning,
  subject: {
    manifest: paths.manifest,
    manifest_sha256: sha256Bytes(manifestBytes),
    receipt: paths.receipt,
    receipt_sha256: sha256Bytes(receiptBytes),
    ledger: paths.ledger,
    ledger_sha256: sha256Bytes(ledgerBytes),
    ledger_entry_sha256: sha256Canonical(ledgerEntry)
  },
  source_hashes: sourceHashes,
  asset_hashes: assetHashes,
  render_permission: renderPermission,
  signed_by: "VERIFRAX-WWW projection release key",
  signature_algorithm: "ed25519",
  public_key_id: keyId
};

assertNoPlaceholder(unsigned);

const payload = Buffer.from(canonical(unsigned), "utf8");
const privateKey = createPrivateKey(privatePem);
const publicKey = createPublicKey(publicPem);
const signature = sign(null, payload, privateKey).toString("base64");

if (!verify(null, payload, publicKey, Buffer.from(signature, "base64"))) fail("local signature verification failed");

writeFileSync(paths.attestation, `${JSON.stringify({
  ...unsigned,
  signed_payload_sha256: sha256Bytes(payload),
  signature
}, null, 2)}\n`);

writeFileSync(paths.publicKey, `${JSON.stringify({
  key_type: "ed25519-public-key",
  key_id: keyId,
  owner: "VERIFRAX-WWW projection release key",
  public_key_pem: publicPem,
  private_key_policy: "NOT_IN_REPOSITORY",
  verification_scope: "VERIFRAX_OBSERVATORY_PROJECTION_ATTESTATION"
}, null, 2)}\n`);

console.log("OBSERVATORY PROJECTION ATTESTATION");
console.log(`projection_id          ${projectionId}`);
console.log(`render_permission      ${renderPermission}`);
console.log("signature              PASS");
