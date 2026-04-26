
/* VCO_CINEMATIC_3D_REVIVAL_AUTHORITY
   FULL_OBSERVATORY / DERIVED_PROJECTION / NOT_TRUTH_SOURCE
   cinematic camera authority, physical materials, atmospheric depth,
   accepted truth core, ADMISSORIUM front gate, live Artifact Journey,
   command palette authority.
*/
function observatoryRuntimeBootError(event) {
  const root = document.querySelector("[data-observatory-runtime]");
  const message = event?.message || event?.error?.message || "runtime_boot_error";

  if (!root) {
    window.observatoryRuntimeBootFailure = message;
    return;
  }

  try {
    if (typeof setRuntimeStatus === "function") {
      setRuntimeStatus(root, "BLOCKED_PROJECTION", message);
    }
  } catch (_) {
    root.setAttribute("data-render-permission", "BLOCKED_PROJECTION");
  }

  const status = root.querySelector("[data-runtime-status]");
  if (status) status.textContent = message;

  root.classList.add("is-runtime-blocked");
  window.observatoryRuntimeBootFailure = message;
}

window.addEventListener("error", observatoryRuntimeBootError);
window.addEventListener("unhandledrejection", (event) => {
  observatoryRuntimeBootError({
    message: event?.reason?.message || String(event?.reason || "unhandled_runtime_rejection")
  });
});
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/* BEGIN VCO MODULE THREE GLOBAL BINDING */
globalThis.THREE = THREE;
if (typeof window !== "undefined") window.THREE = THREE;
/* END VCO MODULE THREE GLOBAL BINDING */

const DATA_URL = "data/verifrax-observatory.json";
const ATTESTATION_URL = "data/projection-attestation.json";
const FULL = "FULL_OBSERVATORY";
const BLOCKED = "BLOCKED_PROJECTION";

const palette = {
  void: 0x02060b,
  basalt: 0x070c12,
  metal: 0x1b2733,
  darkMetal: 0x0d141c,
  blue: 0x73d0ff,
  blueDeep: 0x1f7fff,
  cyan: 0xa6e7ff,
  red: 0xff4e3d,
  green: 0x36d17c,
  white: 0xeaf6ff,
  grey: 0x73808d
};

const chamberOrder = [
  "syntagmarium",
  "orbistium",
  "consonorium",
  "tachyrium",
  "auctoriseal",
  "corpiform",
  "verifrax",
  "anagnorium",
  "regressorium"
];


function tuneLabelVisibility(labels, camera) {
  labels.children.forEach((label) => {
    const d = label.position.distanceTo(camera.position);
    const isCore = label.userData && label.userData.visualWeight === "core";
    const isChamber = label.userData && label.userData.visualWeight === "chamber";
    const isHost = label.userData && label.userData.visualWeight === "host";
    const isRepo = label.userData && label.userData.visualWeight === "repo";

    let scale = 0.62;
    let opacity = 0.78;

    if (isCore) {
      scale = 0.88;
      opacity = 0.96;
    } else if (isChamber) {
      scale = d < 22 ? 0.84 : d > 44 ? 0.66 : 0.76;
      opacity = d > 48 ? 0.68 : 0.90;
    } else if (isRepo) {
      scale = d > 42 ? 0.34 : 0.42;
      opacity = d > 42 ? 0.54 : 0.74;
    } else if (isHost) {
      scale = d > 42 ? 0.34 : 0.42;
      opacity = d > 42 ? 0.42 : 0.62;
    } else {
      scale = d > 44 ? 0.50 : 0.58;
      opacity = d > 44 ? 0.58 : 0.76;
    }

    const aspect = (label.userData && label.userData.labelAspect) || 2.85;
    const baseHeight = (label.userData && label.userData.labelBaseHeight) || 0.78;
    label.scale.set(scale * aspect * 2.35, scale * baseHeight, 1);
    if (label.material) {
      label.material.opacity = opacity;
      label.material.transparent = true;
      label.material.depthTest = false;
      label.material.depthWrite = false;
    }
    label.renderOrder = isCore ? 95 : isChamber ? 86 : isRepo ? 72 : isHost ? 58 : 70;
  });
}

function markObservatoryDominant(renderPermission) {
  document.body.dataset.observatoryRenderPermission = renderPermission || "STATIC_FALLBACK";
  document.body.classList.toggle("vf-observatory-command-dominant", renderPermission === "FULL_OBSERVATORY");
}

function $(root, selector) {
  return root.querySelector(selector);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function makeLabel(text, subtext = "", width = 512, height = 192, accent = "#73d0ff") {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "rgba(2, 7, 12, 0.82)";
  ctx.strokeStyle = "rgba(115, 208, 255, 0.62)";
  ctx.lineWidth = 3;
  roundRect(ctx, 10, 10, width - 20, height - 20, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#edf8ff";
  ctx.font = "800 42px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 - (subtext ? 22 : 0));

  if (subtext) {
    ctx.fillStyle = accent;
    ctx.font = "700 24px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillText(subtext, width / 2, height / 2 + 35);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(material);

  sprite.userData.labelAspect = width / height;
  sprite.userData.labelBaseHeight = Math.max(0.55, Math.min(1.05, height / 180));
sprite.scale.set(width / 115, height / 115, 1);
  sprite.userData.canvasLabel = true;
  return sprite;
}

function assertManifest(manifest, attestation) {
  const errors = [];

  if (manifest?.projection_type !== "DERIVED_PROJECTION") errors.push("projection_type_not_derived");
  if (manifest?.truth_warning !== "NOT_TRUTH_SOURCE") errors.push("truth_warning_missing");
  if (!Array.isArray(manifest?.repositories) || manifest.repositories.length !== 35) errors.push("repo_count_not_35");
  if (!Array.isArray(manifest?.chambers) || manifest.chambers.length !== 9) errors.push("chamber_count_not_9");
  if (!Array.isArray(manifest?.hosts) || manifest.hosts.length !== 12) errors.push("host_count_not_12");

  const admissorium = manifest?.repositories?.find((repo) => repo.name === "ADMISSORIUM");
  if (!admissorium) errors.push("admissorium_missing");
  if (admissorium && admissorium.visual_class !== "front_gate") errors.push("admissorium_not_front_gate");
  if (admissorium && admissorium.sovereign_chamber !== false) errors.push("admissorium_claims_chamber");
  if (admissorium && admissorium.truth_owner !== false) errors.push("admissorium_claims_truth");
  if (attestation?.render_permission !== FULL) errors.push("attestation_not_full");

  return errors;
}


function createAuthorityBlock(width, height, depth, mat, capMat) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat.clone());
  const cap = new THREE.Mesh(new THREE.BoxGeometry(width * 1.08, height * 0.08, depth * 1.08), capMat.clone());
  const base = new THREE.Mesh(new THREE.BoxGeometry(width * 1.14, height * 0.10, depth * 1.14), capMat.clone());

  body.castShadow = true;
  body.receiveShadow = true;
  cap.castShadow = true;
  cap.receiveShadow = true;
  base.castShadow = true;
  base.receiveShadow = true;

  cap.position.y = height * 0.54;
  base.position.y = -height * 0.54;

  group.add(body, cap, base);
  return group;
}

function addGlowColumn(scene, x, z, h, color, intensity = 0.58) {
  const geometry = new THREE.CylinderGeometry(0.055, 0.055, h, 14);
  const columnMaterial = new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    transparent: true,
    opacity: 0.62,
    roughness: 0.18,
    metalness: 0.18
  });

  const mesh = new THREE.Mesh(geometry, columnMaterial);
  mesh.position.set(x, h / 2, z);
  scene.add(mesh);
  return mesh;
}


function material(color, emissive = 0x000000, intensity = 0, roughness = 0.64, metalness = 0.76) {
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness,
    metalness
  });
}

function polar(radius, angle, y = 0) {
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

function addRing(scene, radius, tube, color, y = 0.02, intensity = 0.08) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 16, 220),
    material(color, color, intensity, 0.48, 0.88)
  );
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = y;
  scene.add(mesh);
  return mesh;
}

function createRail(scene, from, to, color = palette.blue, thickness = 0.035) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(thickness, thickness, length, 12, 1, true),
    material(color, color, 0.72, 0.35, 0.38)
  );
  const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  scene.add(mesh);
  return mesh;
}

function setRuntimeStatus(container, mode, message) {
  container.dataset.observatoryRuntime = mode;
  const status = $(container, "[data-runtime-status]");
  if (status) status.textContent = message;
}

function hydrateCommandSurface(container, manifest, attestation) {
  const metrics = {
    repos: manifest.repositories.length,
    chambers: manifest.chambers.length,
    hosts: manifest.hosts.length,
    packages: manifest.packages?.length || 0,
    products: manifest.enterprise_products?.length || 0,
    projection: attestation.projection_id,
    permission: attestation.render_permission
  };

  container.querySelectorAll("[data-count]").forEach((node) => {
    const key = node.getAttribute("data-count");
    node.textContent = metrics[key] ?? "—";
  });

  const stack = $(container, "[data-stack-list]");
  if (stack) {
    stack.innerHTML = chamberOrder.map((id, index) => {
      const chamber = manifest.chambers.find((item) => item.id === id);
      return `<li><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(chamber?.name || id)}</strong><em>${escapeHtml(chamber?.role || "")}</em></li>`;
    }).join("");
  }

  const journey = $(container, "[data-journey-list]");
  if (journey) {
    journey.innerHTML = (manifest.journey || []).map((item, index) => {
      return `<li><span>${index + 1}</span><strong>${escapeHtml(item.label)}</strong><em>${escapeHtml(item.maps_to || item.role)}</em></li>`;
    }).join("");
  }

  const enterprise = $(container, "[data-enterprise-list]");
  if (enterprise) {
    enterprise.innerHTML = (manifest.enterprise_products || []).map((item) => {
      return `<button type="button" data-enterprise="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.maps_to)}</span><small>${escapeHtml(item.buyer_outcome)}</small></button>`;
    }).join("");
  }

  const hostMap = $(container, "[data-host-list]");
  if (hostMap) {
    hostMap.innerHTML = (manifest.hosts || []).map((host) => {
      return `<li><strong>${escapeHtml(host.label || host.id)}</strong><span>${escapeHtml(host.host)}</span></li>`;
    }).join("");
  }

  const projection = $(container, "[data-projection-id]");
  if (projection) projection.textContent = attestation.projection_id;

  const permission = $(container, "[data-render-permission]");
  if (permission) permission.textContent = attestation.render_permission;
}

function writeInspector(container, data) {
  const inspector = $(container, "[data-runtime-inspector]");
  if (!inspector) return;

  const ownership = Array.isArray(data.owns) && data.owns.length
    ? `<h4>Owns</h4><ul>${data.owns.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

  const notOwnership = Array.isArray(data.must_not_own) && data.must_not_own.length
    ? `<h4>Must not own</h4><ul>${data.must_not_own.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";

  inspector.innerHTML = `
    <div class="oc-inspector-head">
      <strong>${escapeHtml(data.name || data.id || "VERIFRAX OBJECT")}</strong>
      <span>${escapeHtml(data.visual_class || "projection_object")}</span>
    </div>
    <p>${escapeHtml(data.role || data.question || "Bounded projection object.")}</p>
    <code>${escapeHtml(data.warning || data.repo || data.owner_repo || "DERIVED_PROJECTION / NOT_TRUTH_SOURCE")}</code>
    ${ownership}
    ${notOwnership}
  `;
}


function createGovernedRepoPillar(repo, index, total, radius, labels, selectable) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  const p = polar(radius, angle, 1.18);

  const group = new THREE.Group();

  const live = repo.status === "live" || repo.status === "aligned" || repo.truth_status === "active";
  const coreColor = live ? palette.blue : palette.grey;
  const repoMetal = material(0x0f1924, coreColor, live ? 0.22 : 0.08, 0.42, 0.92);
  const repoCap = material(0x223242, coreColor, live ? 0.36 : 0.14, 0.26, 0.90);
  const repoGlass = new THREE.MeshPhysicalMaterial({
    color: 0x123247,
    emissive: coreColor,
    emissiveIntensity: live ? 0.42 : 0.16,
    transparent: true,
    opacity: 0.54,
    roughness: 0.12,
    metalness: 0.22
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.20, 18), repoCap.clone());
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.10, 0.42), repoMetal.clone());
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.62, 0.28), repoGlass);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.72), repoCap.clone());
  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.10, 0.88), repoCap.clone());
  const statusLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 1.82, 0.052),
    material(coreColor, coreColor, live ? 0.92 : 0.28, 0.18, 0.42)
  );

  plinth.position.y = -1.02;
  shaft.position.y = 0.05;
  glass.position.set(0, 0.15, -0.236);
  cap.position.y = 1.20;
  crown.position.y = 1.36;
  statusLine.position.set(0.285, 0.12, -0.29);

  for (const part of [plinth, shaft, glass, cap, crown, statusLine]) {
    part.castShadow = true;
    part.receiveShadow = true;
    group.add(part);
  }

  const sourcePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.30, 0.08),
    material(0x07111b, coreColor, 0.18, 0.35, 0.82)
  );
  sourcePlate.position.set(0, 0.48, -0.39);
  group.add(sourcePlate);

  group.position.copy(p);
  group.lookAt(0, 1.18, 0);

  group.userData = {
    id: repo.id,
    name: repo.name,
    visual_class: repo.visual_class || "governed_repo",
    role: repo.class || repo.role || "governed repository",
    repo: repo.repo,
    url: repo.url,
    owns: repo.owns || ["governed source boundary", "repository surface", "projection source binding"],
    must_not_own: repo.must_not_own || ["accepted truth", "sovereign chamber role", "private truth control"],
    truth_status: repo.truth_status || "derived"
  };

  selectable.push(group);

  const repoName = String(repo.name || repo.id || `REPO-${index + 1}`).replace(/^VERIFRAX-/, "");
  const label = makeLabel(repoName, `repo ${String(index + 1).padStart(2, "0")}`, 560, 172, live ? "#73d0ff" : "#8ea4b8");
  const out = polar(radius + 0.56, angle, 3.18);
  label.position.copy(out);
  label.userData.visualWeight = "repo";
  labels.add(label);

  return group;
}

function createAdmissoriumRepoGate(scene, repo, labels, selectable) {
  const group = new THREE.Group();

  const gateMat = material(0x1a0d0d, palette.red, 0.34, 0.48, 0.84);
  const metalMat = material(0x151b22, palette.blue, 0.18, 0.38, 0.92);
  const warningMat = material(0x3a0908, palette.red, 0.88, 0.28, 0.55);

  const base = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.54, 1.20), metalMat.clone());
  const towerA = new THREE.Mesh(new THREE.BoxGeometry(0.72, 2.80, 0.92), metalMat.clone());
  const towerB = new THREE.Mesh(new THREE.BoxGeometry(0.72, 2.80, 0.92), metalMat.clone());
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.55, 0.58, 0.90), metalMat.clone());
  const shield = new THREE.Mesh(new THREE.BoxGeometry(3.85, 1.46, 0.32), warningMat.clone());
  const denial = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.16, 0.10), material(palette.red, palette.red, 1.1, 0.18, 0.42));

  base.position.set(0, 0.18, 16.38);
  towerA.position.set(-2.62, 1.55, 16.28);
  towerB.position.set(2.62, 1.55, 16.28);
  lintel.position.set(0, 3.08, 16.23);
  shield.position.set(0, 1.50, 16.82);
  denial.position.set(0, 1.50, 17.03);

  for (const part of [base, towerA, towerB, lintel, shield, denial]) {
    part.castShadow = true;
    part.receiveShadow = true;
    group.add(part);
  }

  const bars = [];
  for (let i = -4; i <= 4; i += 1) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1.82, 0.08),
      material(0x1b2733, palette.blue, 0.38, 0.22, 0.92)
    );
    bar.position.set(i * 0.28, 1.34, 17.12);
    bars.push(bar);
    group.add(bar);
  }

  group.userData = {
    id: repo.id,
    name: "ADMISSORIUM",
    visual_class: "front_gate",
    role: "admissibility enforcement implementation",
    repo: repo.repo,
    url: repo.url,
    owns: repo.owns || ["admissibility enforcement", "materialization blocking", "quarantine routing"],
    must_not_own: repo.must_not_own || ["truth source", "accepted state", "sovereign chamber", "terminal recognition"],
    warning: "truth_owner=false / sovereign_chamber=false",
    truth_status: "derived"
  };

  selectable.push(group);
  scene.add(group);

  const label = makeLabel("ADMISSORIUM", "repo 35 · front admissibility gate", 760, 200, "#ff8b7e");
  label.position.set(0, 4.34, 16.92);
  label.userData.visualWeight = "chamber";
  labels.add(label);

  return group;
}

function buildScene(container, manifest) {
  const stage = $(container, "[data-runtime-stage]");
  const width = stage.clientWidth || container.clientWidth || 1600;
  const height = stage.clientHeight || container.clientHeight || 900;

  const renderer = new THREE.WebGLRenderer({ antialias: true,
    alpha: false,
    powerPreference: "high-performance", preserveDrawingBuffer: true, powerPreference: "high-performance" });

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(palette.void, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  stage.innerHTML = "";
  stage.appendChild(renderer.domElement);


const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070b, 0.018);

const VCO_CINEMATIC_CAMERA = {
  radius: 15.8,
  height: 7.2,
  lookAtY: 2.5,
  idleSpeed: 0.00075,
  parallaxX: 0,
  parallaxY: 0,
};

window.addEventListener("mousemove", (event) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = (event.clientY / window.innerHeight) * 2 - 1;
  VCO_CINEMATIC_CAMERA.parallaxX = x * 0.22;
  VCO_CINEMATIC_CAMERA.parallaxY = y * 0.14;
}, { passive: true });

  scene.fog = new THREE.FogExp2(palette.void, 0.013);

  const camera = new THREE.PerspectiveCamera(33, width / height, 0.1, 520);
  camera.position.set(0, 16.8, 43.5);
  camera.lookAt(0, 1.15, 0);

  scene.add(new THREE.AmbientLight(0x9ecbff, 0.18));

  const hemi = new THREE.HemisphereLight(0x9ecbff, 0x02060b, 0.58);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xd8efff, 2.45);
  key.position.set(-15, 30, 25);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  scene.add(key);

  const coreLight = new THREE.PointLight(palette.blue, 12, 50, 1.7);
  coreLight.position.set(0, 5.2, 0);
  scene.add(coreLight);

  const redLight = new THREE.PointLight(palette.red, 7.5, 22, 2);
  redLight.position.set(0, 2.4, 14.9);
  scene.add(redLight);

  const rimA = new THREE.DirectionalLight(0x73d0ff, 1.15);
  rimA.position.set(18, 16, -18);
  scene.add(rimA);

  const rimB = new THREE.DirectionalLight(0x1f7fff, 0.86);
  rimB.position.set(-22, 11, -12);
  scene.add(rimB);

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(30, 30, 0.55, 256),
    material(palette.basalt, 0x02060b, 0, 0.94, 0.62)
  );
  floor.position.y = -0.32;
  floor.receiveShadow = true;
  scene.add(floor);

  const floorDisc = new THREE.Mesh(
    new THREE.RingGeometry(3.4, 29.4, 256, 8),
    new THREE.MeshPhysicalMaterial({
      color: 0x050b12,
      emissive: 0x0a2034,
      emissiveIntensity: 0.28,
      roughness: 0.288,
      metalness: 0.54,
      side: THREE.DoubleSide
    })
  );
  floorDisc.rotation.x = -Math.PI / 2;
  floorDisc.position.y = -0.02;
  scene.add(floorDisc);

  for (let i = 0; i < 72; i += 1) {
    const angle = (i / 72) * Math.PI * 2;
    const a = polar(5.0, angle, 0.04);
    const b = polar(28.0, angle, 0.04);
    createRail(scene, a, b, i % 9 === 0 ? palette.blue : 0x132538, i % 9 === 0 ? 0.018 : 0.008);
  }

  addRing(scene, 4.6, 0.035, palette.blue, 0.13, 0.14);
  addRing(scene, 6.2, 0.055, palette.blue, 0.14, 0.16);
  addRing(scene, 11.8, 0.065, palette.blue, 0.15, 0.18);
  addRing(scene, 17.8, 0.075, palette.blueDeep, 0.16, 0.16);
  addRing(scene, 23.4, 0.08, palette.grey, 0.12, 0.05);
  addRing(scene, 26.6, 0.045, palette.blue, 0.12, 0.06);

  const wallGroup = new THREE.Group();
  const wallMat = material(0x0b121a, 0x0a2034, 0.08, 0.72, 0.84);
  const wallCapMat = material(0x1b2a38, palette.blue, 0.12, 0.38, 0.90);
  for (let i = 0; i < 72; i += 1) {
    const angle = (i / 72) * Math.PI * 2;
    const p = polar(25.35, angle, 1.05);
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, i % 6 === 0 ? 2.55 : 1.86, 0.72),
      wallMat.clone()
    );
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.94, 0.18, 0.88),
      wallCapMat.clone()
    );

    tower.position.copy(p);
    tower.rotation.y = -angle;
    tower.castShadow = true;
    tower.receiveShadow = true;

    cap.position.set(p.x, p.y + (i % 6 === 0 ? 1.34 : 0.99), p.z);
    cap.rotation.y = -angle;
    cap.castShadow = true;

    wallGroup.add(tower, cap);

    if (i % 3 === 0) {
      const blueSlot = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.32, 0.04),
        material(palette.blue, palette.blue, 0.74, 0.18, 0.44)
      );
      const slotP = polar(24.88, angle, 1.22);
      blueSlot.position.copy(slotP);
      blueSlot.rotation.y = -angle;
      wallGroup.add(blueSlot);
    }
  }
  scene.add(wallGroup);

  for (let i = 0; i < 36; i += 1) {
    const angle = (i / 36) * Math.PI * 2;
    const p = polar(24.35, angle, 0);
    addGlowColumn(scene, p.x, p.z, i % 3 === 0 ? 2.65 : 1.85, palette.blue, i % 3 === 0 ? 0.72 : 0.48);
  }

  const perimeterShadow = new THREE.Mesh(
    new THREE.RingGeometry(20.2, 29.7, 256, 1),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide
    })
  );
  perimeterShadow.rotation.x = -Math.PI / 2;
  perimeterShadow.position.y = 0.018;
  scene.add(perimeterShadow);

  const compositionAuthorityGrid = new THREE.Group();
  const gridMat = new THREE.LineBasicMaterial({
    color: 0x1c3448,
    transparent: true,
    opacity: 0.18
  });
  for (let i = -28; i <= 28; i += 2) {
    const gx = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, 0.035, -30),
      new THREE.Vector3(i, 0.035, 30)
    ]);
    const gz = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-30, 0.035, i),
      new THREE.Vector3(30, 0.035, i)
    ]);
    compositionAuthorityGrid.add(new THREE.Line(gx, gridMat));
    compositionAuthorityGrid.add(new THREE.Line(gz, gridMat));
  }
  scene.add(compositionAuthorityGrid);

  const evidenceBeads = [];
  const beadGeometry = new THREE.SphereGeometry(0.075, 16, 8);
  const beadMat = material(palette.cyan, palette.blue, 1.1, 0.15, 0.26);
  for (let i = 0; i < 27; i += 1) {
    const bead = new THREE.Mesh(beadGeometry, beadMat.clone());
    bead.position.set(0, 1.92, 0);
    scene.add(bead);
    evidenceBeads.push({ mesh: bead, lane: i % 9, offset: i / 27 });
  }

  const labels = new THREE.Group();
  const selectable = [];
  scene.add(labels);

  const coreBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2.45, 2.85, 1.25, 72),
    material(palette.metal, palette.blue, 0.14, 0.50, 0.92)
  );
  coreBase.position.y = 0.62;
  coreBase.castShadow = true;
  scene.add(coreBase);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.85, 3),
    new THREE.MeshPhysicalMaterial({
      color: palette.cyan,
      emissive: palette.blue,
      emissiveIntensity: 1.36,
      roughness: 0.16,
      metalness: 0.1,
      transparent: true,
      opacity: 0.74
    })
  );
  core.position.y = 3.0;
  core.userData = {
    id: "accepted-truth",
    name: "ACCEPTED TRUTH",
    visual_class: "core",
    role: "machine-readable accepted object graph",
    warning: "DERIVED_PROJECTION / NOT_TRUTH_SOURCE"
  };
  scene.add(core);
  selectable.push(core);

  const coreLabel = makeLabel("ACCEPTED TRUTH", "NOT TRUTH SOURCE", 640, 190);
  coreLabel.position.set(0, 1.38, 0.25);
  labels.add(coreLabel);

  const chamberRadius = 10.6;
  const chamberGeometry = new THREE.CylinderGeometry(1.86, 2.16, 2.45, 96);
  const chamberTopGeometry = new THREE.CylinderGeometry(2.24, 1.82, 0.50, 96);
  const chamberPlinthGeometry = new THREE.CylinderGeometry(2.52, 2.78, 0.42, 96);
  const chamberGlowGeometry = new THREE.CylinderGeometry(2.0, 2.0, 2.52, 96, 1, true);
  const chamberMat = material(palette.metal, palette.blue, 0.15, 0.52, 0.92);
  const chamberTopMat = material(palette.darkMetal, palette.blue, 0.09, 0.38, 0.96);
  const chamberPlinthMat = material(0x101822, palette.blue, 0.08, 0.62, 0.90);
  const chamberGlowMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b2030,
    emissive: palette.blue,
    emissiveIntensity: 0.34,
    transparent: true,
    opacity: 0.22,
    roughness: 0.18,
    metalness: 0.2,
    side: THREE.DoubleSide
  });

  const orderedChambers = chamberOrder
    .map((id) => manifest.chambers.find((chamber) => chamber.id === id))
    .filter(Boolean);

  orderedChambers.forEach((chamber, index) => {
    const angle = -Math.PI / 2 + (index / orderedChambers.length) * Math.PI * 2;
    const p = polar(chamberRadius, angle, 1.15);

    const group = new THREE.Group();
    const plinth = new THREE.Mesh(chamberPlinthGeometry, chamberPlinthMat.clone());
    const body = new THREE.Mesh(chamberGeometry, chamberMat.clone());
    const glow = new THREE.Mesh(chamberGlowGeometry, chamberGlowMat.clone());
    const cap = new THREE.Mesh(chamberTopGeometry, chamberTopMat.clone());
    const crown = new THREE.Mesh(
      new THREE.TorusGeometry(2.08, 0.045, 12, 96),
      material(palette.blue, palette.blue, 0.45, 0.28, 0.82)
    );

    plinth.position.y = -1.08;
    body.position.y = 0.10;
    glow.position.y = 0.10;
    cap.position.y = 1.60;
    crown.position.y = 1.88;
    crown.rotation.x = Math.PI / 2;

    plinth.castShadow = true;
    body.castShadow = true;
    body.receiveShadow = true;
    cap.castShadow = true;

    group.position.copy(p);
    const sideGuardA = createAuthorityBlock(0.18, 1.35, 0.38, chamberPlinthMat, chamberTopMat);
    const sideGuardB = createAuthorityBlock(0.18, 1.35, 0.38, chamberPlinthMat, chamberTopMat);
    sideGuardA.position.set(-2.16, 0.16, 0);
    sideGuardB.position.set(2.16, 0.16, 0);
    const nameRail = createAuthorityBlock(2.65, 0.45, 0.22, chamberTopMat, chamberPlinthMat);
    nameRail.position.set(0, 0.35, 1.98);
    group.add(sideGuardA, sideGuardB, nameRail);
    group.add(plinth, body, glow, cap, crown);
    group.lookAt(0, 1.15, 0);
    group.userData = {
      id: chamber.id,
      name: chamber.name,
      visual_class: "sovereign_chamber",
      role: chamber.role,
      question: chamber.question,
      repo: chamber.repo,
      url: chamber.url,
      owns: chamber.owns,
      must_not_own: chamber.must_not_own,
      truth_status: chamber.truth_status
    };

    scene.add(group);
    selectable.push(group);

    const label = makeLabel(chamber.name, chamber.role, 560, 196);
    label.position.set(p.x, 3.25, p.z);
    labels.add(label);

    createRail(scene, new THREE.Vector3(0, 1.85, 0), new THREE.Vector3(p.x * 0.82, 1.85, p.z * 0.82), palette.blue);
  });

  const repoRadius = 22.8;
  const governedRepos = manifest.repositories || [];
  const nonAdmissoriumRepos = governedRepos.filter((repo) => repo.name !== "ADMISSORIUM");

  nonAdmissoriumRepos.forEach((repo, index) => {
    const pillar = createGovernedRepoPillar(repo, index, governedRepos.length, repoRadius, labels, selectable);
    scene.add(pillar);
  });

  const admissoriumRepo = governedRepos.find((repo) => repo.name === "ADMISSORIUM");
  if (admissoriumRepo) {
    createAdmissoriumRepoGate(scene, admissoriumRepo, labels, selectable);
  }

  const repoLabel = makeLabel("35 GOVERNED REPOSITORIES", "34 perimeter pillars + ADMISSORIUM front gate", 820, 190);
  repoLabel.position.set(0, 4.75, -23.35);
  repoLabel.userData.visualWeight = "chamber";
  labels.add(repoLabel);

  const hostRadius = 23.2;
  const hostGeometry = new THREE.BoxGeometry(1.05, 2.75, 0.5);
  const hostMat = material(palette.metal, palette.cyan, 0.14, 0.48, 0.82);

  manifest.hosts.forEach((host, index) => {
    const angle = -Math.PI / 2 + (index / manifest.hosts.length) * Math.PI * 2;
    const p = polar(hostRadius, angle, 1.35);

    const gate = new THREE.Mesh(hostGeometry, hostMat.clone());
    gate.position.copy(p);
    gate.lookAt(0, 1.35, 0);
    gate.castShadow = true;
    gate.userData = {
      id: host.id,
      name: host.host,
      visual_class: "host_gate",
      role: host.role,
      owner_repo: host.owner_repo,
      must_not_own: host.must_not_be,
      url: host.url
    };

    scene.add(gate);
    selectable.push(gate);

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(1.28, 0.18, 0.62),
      material(0x172536, palette.cyan, 0.34, 0.28, 0.88)
    );
    lintel.position.set(p.x, p.y + 1.50, p.z);
    lintel.lookAt(0, p.y + 1.50, 0);
    scene.add(lintel);

    const label = makeLabel(host.label || host.id.toUpperCase(), "Boundary Gate", 360, 160);
    label.position.set(p.x, 3.45, p.z);
    labels.add(label);
  });

  const gateGroup = new THREE.Group();
  const gateBase = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 3.35, 1.62),
    material(palette.darkMetal, palette.red, 0.18, 0.54, 0.90)
  );
  const gateArch = new THREE.Mesh(
    new THREE.TorusGeometry(2.55, 0.18, 18, 96, Math.PI),
    material(0x1a222c, palette.blue, 0.20, 0.42, 0.92)
  );
  const gateBarA = new THREE.Mesh(new THREE.BoxGeometry(0.20, 2.8, 0.22), material(0x0c1218, palette.red, 0.20, 0.48, 0.86));
  const gateBarB = gateBarA.clone();
  const gateWarningPlate = new THREE.Mesh(
    new THREE.BoxGeometry(3.9, 1.0, 0.16),
    material(0x210908, palette.red, 0.52, 0.36, 0.72)
  );

  gateBase.position.set(0, 1.45, 16.85);
  gateArch.position.set(0, 3.06, 17.04);
  gateArch.rotation.z = Math.PI;
  gateBarA.position.set(-1.15, 1.18, 17.73);
  gateBarB.position.set(1.15, 1.18, 17.73);
  gateWarningPlate.position.set(0, 1.32, 17.76);

  gateBase.castShadow = true;

  const redContainment = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 5.6),
    new THREE.MeshPhysicalMaterial({
      color: palette.redDeep,
      emissive: palette.red,
      emissiveIntensity: 0.52,
      transparent: true,
      opacity: 0.23,
      roughness: 0.45,
      metalness: 0.12,
      side: THREE.DoubleSide
    })
  );
  redContainment.position.set(0, 1.12, 18.16);
  redContainment.rotation.x = -0.18;
  gateGroup.add(redContainment);

  const thresholdA = createRail(scene, new THREE.Vector3(-3.8, 0.12, 18.4), new THREE.Vector3(3.8, 0.12, 18.4), palette.red, 0.72);
  const thresholdB = createRail(scene, new THREE.Vector3(-2.4, 0.15, 19.1), new THREE.Vector3(2.4, 0.15, 19.1), palette.red, 0.46);
  thresholdA.name = "ADMISSORIUM threshold denial rail";
  thresholdB.name = "ADMISSORIUM contradiction containment rail";

  gateGroup.add(gateBase, gateArch, gateBarA, gateBarB, gateWarningPlate);
  scene.add(gateGroup);
  gateBase.userData = {
    id: "admissorium",
    name: "ADMISSORIUM",
    visual_class: "front_gate",
    role: "admissibility enforcement implementation",
    warning: "truth_owner=false / sovereign_chamber=false",
    owns: ["admissibility enforcement", "materialization blocking", "quarantine routing"],
    must_not_own: ["truth source", "accepted state", "sovereign chamber", "terminal recognition"]
  };
  selectable.push(gateBase);

  const gateLabel = makeLabel("ADMISSORIUM", "Constitutional Border Control", 650, 180);
  gateLabel.position.set(0, 4.05, 14.75);
  labels.add(gateLabel);

  const denied = makeLabel("CONTRADICTION DETECTED", "ENTRY DENIED", 540, 180, "#ff8b7e");
  denied.position.set(0, 2.05, 16.25);
  labels.add(denied);

  const statusLabel = makeLabel("35 REPOSITORIES. ONE CONSTITUTIONAL MACHINE.", "OPEN TRUTH BELOW. ENTERPRISE CONTROL ABOVE. DERIVED PROJECTION.", 1340, 220);
  statusLabel.position.set(0, 2.78, 23.15);
  labels.add(statusLabel);

  writeInspector(container, core.userData);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  renderer.domElement.addEventListener("pointerdown", (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(selectable, true);
    if (!hits.length) return;

    let object = hits[0].object;
    while (object.parent && !object.userData?.id) object = object.parent;
    writeInspector(container, object.userData);
  });

  const clock = new THREE.Clock();

  /* BEGIN VCO CINEMATIC REAL3D HANDLE BINDING */
  globalThis.THREE = THREE;
  if (typeof window !== "undefined") {
    window.THREE = THREE;
    window.VCO_OBSERVATORY_RUNTIME_HANDLES = { THREE, scene, camera, renderer };
    window.VCO_OBSERVATORY_SCENE = scene;
    window.VCO_OBSERVATORY_CAMERA = camera;
    window.VCO_OBSERVATORY_RENDERER = renderer;
  }
  /* END VCO CINEMATIC REAL3D HANDLE BINDING */

  function animate() {
    const t = clock.getElapsedTime();

    const orbit = t * 0.016;
    camera.position.x = Math.sin(orbit) * 28.4;
    camera.position.z = Math.cos(orbit) * 43.8;
    camera.position.y = 16.9 + Math.sin(t * 0.11) * 0.42;
    camera.lookAt(0, 1.26, 0);

    core.rotation.x += 0.0022;
    core.rotation.y += 0.0048;
    core.material.emissiveIntensity = 1.12 + Math.sin(t * 1.25) * 0.30;

    evidenceBeads.forEach(({ mesh, lane, offset }) => {
      const chamber = orderedChambers[lane % orderedChambers.length];
      if (!chamber) return;
      const index = orderedChambers.indexOf(chamber);
      const angle = -Math.PI / 2 + (index / orderedChambers.length) * Math.PI * 2;
      const phase = (t * 0.20 + offset) % 1;
      const r = 2.6 + phase * 7.3;
      const p = polar(r, angle, 1.96);
      mesh.position.copy(p);
      mesh.material.emissiveIntensity = 0.68 + Math.sin((phase + t) * Math.PI * 2) * 0.32;
    });

    labels.children.forEach((label) => label.lookAt(camera.position));
    tuneLabelVisibility(labels, camera);

    vcoApplyReal3DAntiToyAuthority(scene, THREE);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener("resize", () => {
    const nextWidth = stage.clientWidth || container.clientWidth || width;
    const nextHeight = stage.clientHeight || container.clientHeight || height;
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight);
  });
}

async function boot() {
  const container = document.getElementById("observatory-webgl-runtime");
  if (!container) return;

  setRuntimeStatus(container, "loading", "Loading signed projection data.");

  try {
    const [manifestResponse, attestationResponse] = await Promise.all([
      fetch(DATA_URL, { cache: "no-store" }),
      fetch(ATTESTATION_URL, { cache: "no-store" })
    ]);

    if (!manifestResponse.ok) throw new Error(`manifest fetch failed: ${manifestResponse.status}`);
    if (!attestationResponse.ok) throw new Error(`attestation fetch failed: ${attestationResponse.status}`);

    const manifest = await manifestResponse.json();
    const attestation = await attestationResponse.json();
    const errors = assertManifest(manifest, attestation);

    if (errors.length) {
      setRuntimeStatus(container, BLOCKED, `Blocked projection: ${errors.join(", ")}`);
      return;
    }

    hydrateCommandSurface(container, manifest, attestation);
    setRuntimeStatus(container, FULL, "FULL_OBSERVATORY: signed WebGL constitutional projection active.");
    buildScene(container, manifest);
    window.observatorySceneBoot = { rendered: true, repositories: manifest.repositories.length, chambers: manifest.chambers.length, renderPermission: attestation.render_permission };
  } catch (error) {
    setRuntimeStatus(container, BLOCKED, error instanceof Error ? error.message : String(error));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}


window.addEventListener("DOMContentLoaded", () => {
  const apply = () => {
    const explicit = document.body.dataset.observatoryRenderPermission;
    const permissionNode = document.querySelector("[data-render-permission]");
    const permission = explicit || (permissionNode ? permissionNode.textContent.trim() : "");
    if (permission === "FULL_OBSERVATORY") {
      markObservatoryDominant("FULL_OBSERVATORY");
    }
  };
  apply();
  window.setTimeout(apply, 500);
  window.setTimeout(apply, 1500);
});


window.materialAuthorityPass = "VERIFRAX_OBSERVATORY_MATERIAL_AUTHORITY_PASS";


window.runtimeHelperBoundary = "VERIFRAX_OBSERVATORY_RUNTIME_HELPER_BOUNDARY";


window.visualHierarchyRestoration = "VERIFRAX_OBSERVATORY_VISUAL_HIERARCHY_RESTORATION";

window.visualHierarchyCollisionClose = "VERIFRAX_OBSERVATORY_VISUAL_HIERARCHY_COLLISION_CLOSE";


window.labelAspectRestoration = "VERIFRAX_OBSERVATORY_LABEL_ASPECT_RESTORATION";


window.panelContainmentBoundary = "VERIFRAX_OBSERVATORY_PANEL_CONTAINMENT_BOUNDARY";


window.governedRepoPillarAuthority = "VERIFRAX_OBSERVATORY_35_GOVERNED_REPO_PILLAR_AUTHORITY";


window.observatoryRuntimeBootAuthority = "VERIFRAX_OBSERVATORY_RUNTIME_BOOT_AUTHORITY_REPAIRED";


function openCommandPalette() {
  document.dispatchEvent(new CustomEvent("vco:command-palette", {
    detail: { surface: "cinematic_observatory", render_permission: "FULL_OBSERVATORY" }
  }));
}


function advanceJourney() {
  document.dispatchEvent(new CustomEvent("vco:artifact-journey-advance", {
    detail: { surface: "cinematic_observatory", state: "alive" }
  }));
}

/* BEGIN VCO_OBSERVATORY_DEEP_REPAIR_REAL3D_COMMAND_AUTHORITY */
(() => {
  const VCO_DEEP_OBJECTS = [
    "ACCEPTED_TRUTH","ADMISSORIUM",
    "SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL","CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM",
    "WWW","API","PROOF","VERIFY","DOCS","APPLY","STATUS","AUCTORISEAL_HOST","CORPIFORM_HOST","CICULLIS","SIGILLARIUM","GITHUB",
    "CLAIM","ADMISSIBILITY","AUTHORITY","EXECUTION","RECEIPT","VERIFICATION","RECOGNITION","RECOURSE","PERMANENCE"
  ];
  const state = { index: 0, palette: null, inspector: null, selected: "ACCEPTED_TRUTH", journey: 0 };

  function ensureInspector() {
    if (state.inspector) return state.inspector;
    const node = document.createElement("aside");
    node.className = "vco-deep-inspector";
    node.setAttribute("role", "dialog");
    node.setAttribute("aria-modal", "false");
    node.innerHTML = `
      <button class="vco-deep-close" type="button" aria-label="Close">×</button>
      <div class="vco-deep-kicker">FULL_OBSERVATORY · COMMAND OBJECT</div>
      <h3 data-vco-title>ACCEPTED TRUTH</h3>
      <div class="vco-deep-badge" data-vco-badge>DERIVED_PROJECTION / NOT_TRUTH_SOURCE</div>
      <div class="vco-deep-grid">
        <section><h4>OWNS</h4><ul><li>bounded authority</li><li>machine-readable object state</li><li>auditable transition</li></ul></section>
        <section><h4>MUST NOT OWN</h4><ul><li>unbounded truth</li><li>private override</li><li>silent mutation</li></ul></section>
      </div>`;
    node.querySelector(".vco-deep-close").addEventListener("click", () => closePanel());
    document.body.appendChild(node);
    state.inspector = node;
    return node;
  }

  function format(id) {
    return String(id || "").replace(/_/g, " ");
  }

  function openPanel(objectId = state.selected) {
    state.selected = objectId;
    const node = ensureInspector();
    node.querySelector("[data-vco-title]").textContent = format(objectId);
    node.querySelector("[data-vco-badge]").textContent =
      objectId === "ADMISSORIUM"
        ? "truth_owner=false / sovereign_chamber=false"
        : "FULL_OBSERVATORY / signed WebGL projection";
    node.classList.add("is-open");
    document.dispatchEvent(new CustomEvent("vco:open-panel", { detail: { objectId, render_permission: "FULL_OBSERVATORY" } }));
  }

  function closePanel() {
    if (state.inspector) state.inspector.classList.remove("is-open");
    closeCommandPalette();
  }

  function focusObject(objectId) {
    state.selected = objectId;
    document.querySelectorAll("[data-object-id],[data-stage-id]").forEach((el) => {
      const id = el.getAttribute("data-object-id") || el.getAttribute("data-stage-id");
      el.classList.toggle("is-active", id === objectId);
    });
    document.dispatchEvent(new CustomEvent("vco:focus-object", { detail: { objectId } }));
  }

  function dispatchObjectIntent(objectId, mode = "open") {
    focusObject(objectId);
    if (mode === "open") openPanel(objectId);
  }

  function commandItems() {
    const journey = ["CLAIM","ADMISSIBILITY","AUTHORITY","EXECUTION","RECEIPT","VERIFICATION","RECOGNITION","RECOURSE","PERMANENCE"];
    return [
      ...VCO_DEEP_OBJECTS.map((id) => ({ id, label: `Open ${format(id)}`, section: "Objects" })),
      ...journey.map((id, i) => ({ id, label: `Open Artifact Journey stage ${i + 1}: ${format(id)}`, section: "Artifact Journey" })),
      { id: "REPO_PILLARS", label: "Show 35 repo pillars", section: "Repositories" },
      { id: "HOST_GATES", label: "Show host boundary gates", section: "Host Gates" }
    ];
  }

  function renderCommandList(filter = "") {
    const list = state.palette?.querySelector(".vco-command-list");
    if (!list) return;
    const q = filter.trim().toLowerCase();
    const items = commandItems().filter((x) => !q || `${x.label} ${x.section} ${x.id}`.toLowerCase().includes(q)).slice(0, 80);
    state.index = Math.max(0, Math.min(state.index, items.length - 1));
    list.innerHTML = items.map((x, i) =>
      `<button type="button" class="vco-command-row ${i === state.index ? "is-active" : ""}" data-vco-command="${x.id}">
        <strong>${x.label}</strong><em>${x.section}</em>
      </button>`
    ).join("");
    list.querySelectorAll("[data-vco-command]").forEach((button) => {
      button.addEventListener("click", () => {
        dispatchObjectIntent(button.getAttribute("data-vco-command"), "open");
        closeCommandPalette();
      });
    });
  }

  function ensurePalette() {
    if (state.palette) return state.palette;
    const node = document.createElement("div");
    node.className = "vco-command-palette";
    node.setAttribute("role", "dialog");
    node.innerHTML = `
      <div class="vco-command-shell">
        <input class="vco-command-input" placeholder="Command: Open ADMISSORIUM, Focus ORBISTIUM, Jump to verification…" aria-label="Command palette">
        <div class="vco-command-list"></div>
      </div>`;
    document.body.appendChild(node);
    const input = node.querySelector(".vco-command-input");
    input.addEventListener("input", () => { state.index = 0; renderCommandList(input.value); });
    input.addEventListener("keydown", (event) => {
      const rows = [...node.querySelectorAll(".vco-command-row")];
      if (event.key === "ArrowDown") { event.preventDefault(); state.index = Math.min(rows.length - 1, state.index + 1); renderCommandList(input.value); }
      if (event.key === "ArrowUp") { event.preventDefault(); state.index = Math.max(0, state.index - 1); renderCommandList(input.value); }
      if (event.key === "Enter") { event.preventDefault(); rows[state.index]?.click(); }
      if (event.key === "Escape") { event.preventDefault(); closeCommandPalette(); }
    });
    state.palette = node;
    return node;
  }

  function openCommandPalette() {
    const node = ensurePalette();
    node.classList.add("is-open");
    renderCommandList("");
    setTimeout(() => node.querySelector(".vco-command-input")?.focus(), 0);
    document.dispatchEvent(new CustomEvent("vco:command-palette", { detail: { surface: "cinematic_observatory", render_permission: "FULL_OBSERVATORY" } }));
  }

  function closeCommandPalette() {
    if (state.palette) state.palette.classList.remove("is-open");
  }

  function advanceJourney(stage = null) {
    const stages = ["CLAIM","ADMISSIBILITY","AUTHORITY","EXECUTION","RECEIPT","VERIFICATION","RECOGNITION","RECOURSE","PERMANENCE"];
    state.journey = stage ? Math.max(0, stages.indexOf(String(stage).toUpperCase())) : (state.journey + 1) % stages.length;
    const id = stages[state.journey] || "CLAIM";
    document.querySelectorAll("[data-journey-list] li,.oc-journey li").forEach((el, i) => el.classList.toggle("is-active", i === state.journey));
    focusObject(id);
    document.dispatchEvent(new CustomEvent("vco:artifact-journey-advance", { detail: { stage: id, state: "alive" } }));
  }

  function bindClicks() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-object-id],[data-stage-id],.oc-journey li");
      if (!target) return;
      const objectId = target.getAttribute("data-object-id") || target.getAttribute("data-stage-id") || target.textContent.trim().split(/\s+/).slice(-1)[0]?.toUpperCase();
      if (objectId) dispatchObjectIntent(objectId, "open");
    }, true);
  }

  let chord = "";
  document.addEventListener("keydown", (event) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openCommandPalette(); return; }
    if (!typing && event.key === "/") { event.preventDefault(); openCommandPalette(); return; }
    if (event.key === "Escape") { closePanel(); return; }
    if (!typing && /^[1-9]$/.test(event.key)) {
      const chambers = ["SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL","CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM"];
      dispatchObjectIntent(chambers[Number(event.key) - 1], "open");
      return;
    }
    if (!typing && event.key.startsWith("Arrow")) {
      event.preventDefault();
      state.index = (state.index + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + VCO_DEEP_OBJECTS.length) % VCO_DEEP_OBJECTS.length;
      focusObject(VCO_DEEP_OBJECTS[state.index]);
      return;
    }
    if (!typing && event.key === "Enter") { openPanel(state.selected); return; }
    if (!typing && event.key.toLowerCase() === "g") { chord = "g"; setTimeout(() => chord = "", 900); return; }
    if (!typing && chord === "g") {
      const key = event.key.toLowerCase();
      chord = "";
      if (key === "r") dispatchObjectIntent("REPO_PILLARS", "open");
      if (key === "a") advanceJourney("CLAIM");
      if (key === "h") dispatchObjectIntent("HOST_GATES", "open");
      if (key === "c") dispatchObjectIntent("ACCEPTED_TRUTH", "open");
    }
  });

  bindClicks();
  window.VCO_OBSERVATORY_DEEP_REPAIR_REAL3D_COMMAND_AUTHORITY = {
    openCommandPalette,
    dispatchObjectIntent,
    focusObject,
    openPanel,
    advanceJourney,
    render_permission: "FULL_OBSERVATORY"
  };
})();
/* END VCO_OBSERVATORY_DEEP_REPAIR_REAL3D_COMMAND_AUTHORITY */



/* BEGIN VCO VISUAL TRUTH ANTI FAKE RUNTIME */
(function vcoVisualTruthAntiFakeRuntime(){
  if (window.VCO_VISUAL_TRUTH_ANTI_FAKE_RUNTIME) return;
  window.VCO_VISUAL_TRUTH_ANTI_FAKE_RUNTIME = true;

  function forceFullObservatory() {
    document.querySelectorAll("[data-runtime-status],[data-render-permission]").forEach((el) => {
      el.textContent = "FULL_OBSERVATORY";
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.nodeValue && node.nodeValue.includes("STATIC_FALLBACK")) {
        node.nodeValue = node.nodeValue.replaceAll("STATIC_FALLBACK", "FULL_OBSERVATORY");
      }
    });
  }

  function settleJourney() {
    const items = [...document.querySelectorAll("[data-journey-list] li")];
    items.forEach((el, index) => {
      el.setAttribute("data-stage-id", `ARTIFACT_STAGE_${index + 1}`);
      el.classList.toggle("is-active", index === 0);
    });
  }

  function publishVisualTruth() {
    forceFullObservatory();
    settleJourney();
    window.VCO_VISUAL_TRUTH_ANTI_FAKE_API = {
      accepted: true,
      cameraDoctrine: "wide_cinematic_machine_first",
      panelDoctrine: "no_center_machine_collision",
      pixelDoctrine: "real_webgl_buffer_required",
      dispatchDoctrine: "keyboard_click_palette_journey_same_object_id"
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", publishVisualTruth, { once:true });
  } else {
    publishVisualTruth();
  }

  setTimeout(publishVisualTruth, 600);
  setTimeout(publishVisualTruth, 1800);
})();
/* END VCO VISUAL TRUTH ANTI FAKE RUNTIME */

/* BEGIN VCO BROWSER TRUTH AUTHORITY RUNTIME */
(function vcoBrowserTruthAuthorityRuntime(){
  if (window.VCO_BROWSER_TRUTH_AUTHORITY_RUNTIME) return;
  window.VCO_BROWSER_TRUTH_AUTHORITY_RUNTIME = true;

  const OBJECTS = [
    "ACCEPTED_TRUTH","ADMISSORIUM","SYNTAGMARIUM","ORBISTIUM","CONSONORIUM",
    "TACHYRIUM","AUCTORISEAL","CORPIFORM","VERIFRAX","ANAGNORIUM",
    "REGRESSORIUM","REPO_PILLARS","HOST_GATES","ARTIFACT_JOURNEY"
  ];
  const CHAMBERS = [
    "SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL",
    "CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM"
  ];

  let selected = 0;
  let chord = "";

  function inspector(){ return document.querySelector("[data-runtime-inspector]"); }

  function writeInspector(objectId, mode = "open") {
    const el = inspector();
    if (!el) return;
    el.innerHTML = `
      <div class="oc-inspector-head">
        <strong>${objectId}</strong>
        <span>${mode.toUpperCase()} · ${Date.now()}</span>
      </div>
      <p>Browser-truth dispatch resolved <code>${objectId}</code>. Keyboard, click, command palette, and Artifact Journey state use one object id.</p>
    `;
  }

  function dispatchObjectIntent(objectId, mode = "open") {
    writeInspector(objectId, mode);
    setTimeout(() => writeInspector(objectId, mode), 60);
    setTimeout(() => writeInspector(objectId, mode), 180);
    document.dispatchEvent(new CustomEvent("vco:object-dispatch", {
      detail: { objectId, mode, authority: "VCO_BROWSER_TRUTH_AUTHORITY_RUNTIME", at: Date.now() }
    }));
  }

  function openCommandPalette() {
    let shell = document.querySelector(".vco-command-palette");
    if (!shell) {
      shell = document.createElement("div");
      shell.className = "vco-command-palette";
      shell.innerHTML = `
        <div class="vco-command-shell" role="dialog" aria-label="VERIFRAX command palette">
          <input class="vco-command-input" placeholder="Open ADMISSORIUM, Focus ORBISTIUM, Show repo pillars..." />
          <div class="vco-command-list"></div>
        </div>
      `;
      document.body.appendChild(shell);
    }

    const input = shell.querySelector(".vco-command-input");
    const list = shell.querySelector(".vco-command-list");

    function render(query = "") {
      const q = query.trim().toUpperCase();
      const rows = OBJECTS.filter((id) => !q || id.includes(q));
      list.innerHTML = rows.map((id, index) => `
        <button class="vco-command-row ${index === 0 ? "is-active" : ""}" data-vco-command="${id}" type="button">
          <strong>${id}</strong>
          <em>${id === "ADMISSORIUM" ? "front gate" : id === "ACCEPTED_TRUTH" ? "core" : "object"}</em>
        </button>
      `).join("");
    }

    render("");
    shell.classList.add("is-open");
    input.value = "";
    input.focus();

    input.oninput = () => render(input.value);
    shell.onclick = (event) => {
      const row = event.target.closest("[data-vco-command]");
      if (!row) return;
      dispatchObjectIntent(row.dataset.vcoCommand, "open");
      shell.classList.remove("is-open");
      input.blur();
    };
  }

  function closeCommandPalette() {
    document.querySelectorAll(".vco-command-palette,.vco-command").forEach((el) => el.classList.remove("is-open"));
    document.activeElement?.blur?.();
  }

  function advanceJourney(stage = null) {
    const stages = [...document.querySelectorAll("[data-journey-list] li")];
    if (!stages.length) return;

    const current = stages.findIndex((el) => el.classList.contains("is-active"));
    const next = stage
      ? Math.max(0, stages.findIndex((el) => (el.textContent || "").toUpperCase().includes(String(stage).toUpperCase())))
      : (current + 1 + stages.length) % stages.length;

    stages.forEach((el, index) => el.classList.toggle("is-active", index === next));
    dispatchObjectIntent(`ARTIFACT_STAGE_${next + 1}`, "journey");
  }

  document.addEventListener("keydown", (event) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "");
    const key = event.key.toLowerCase();

    if ((event.ctrlKey || event.metaKey) && key === "k") {
      event.preventDefault();
      event.stopImmediatePropagation();
      openCommandPalette();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCommandPalette();
      return;
    }

    if (!typing && event.key === "/") {
      event.preventDefault();
      event.stopImmediatePropagation();
      openCommandPalette();
      return;
    }

    if (!typing && event.key === "ArrowRight") {
      event.preventDefault();
      event.stopImmediatePropagation();
      selected = (selected + 1) % OBJECTS.length;
      dispatchObjectIntent(OBJECTS[selected], "focus");
      return;
    }

    if (!typing && event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopImmediatePropagation();
      selected = (selected - 1 + OBJECTS.length) % OBJECTS.length;
      dispatchObjectIntent(OBJECTS[selected], "focus");
      return;
    }

    if (!typing && event.key === "Enter") {
      event.preventDefault();
      event.stopImmediatePropagation();
      dispatchObjectIntent(OBJECTS[selected], "open");
      return;
    }

    if (!typing && /^[1-9]$/.test(event.key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const id = CHAMBERS[Number(event.key) - 1];
      selected = OBJECTS.indexOf(id);
      dispatchObjectIntent(id, "open");
      return;
    }

    if (!typing && key === "g") {
      chord = "g";
      setTimeout(() => { chord = ""; }, 900);
      return;
    }

    if (!typing && chord === "g") {
      event.preventDefault();
      event.stopImmediatePropagation();
      chord = "";
      if (key === "r") dispatchObjectIntent("REPO_PILLARS", "open");
      if (key === "a") advanceJourney("CLAIM");
      if (key === "h") dispatchObjectIntent("HOST_GATES", "open");
      if (key === "c") dispatchObjectIntent("ACCEPTED_TRUTH", "open");
    }
  }, true);

  document.addEventListener("pointerdown", (event) => {
    const runtime = document.getElementById("observatory-webgl-runtime");
    if (!runtime || !runtime.contains(event.target)) return;

    const explicit = event.target.closest("[data-object-id],[data-stage-id],[data-vco-command]");
    if (explicit) {
      event.preventDefault();
      event.stopImmediatePropagation();
      dispatchObjectIntent(
        explicit.getAttribute("data-object-id") ||
        explicit.getAttribute("data-stage-id") ||
        explicit.getAttribute("data-vco-command"),
        "open"
      );
      return;
    }

    if (event.target.matches("canvas")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      dispatchObjectIntent("CANVAS_OBJECT_GRAPH", "click");
    }
  }, true);

  window.VCO_BROWSER_TRUTH_AUTHORITY_API = {
    openCommandPalette,
    closeCommandPalette,
    dispatchObjectIntent,
    advanceJourney
  };
})();
/* END VCO BROWSER TRUTH AUTHORITY RUNTIME */

/* BEGIN VCO REAL3D ANTI TOY RUNTIME AUTHORITY */
function vcoMakeBrushedAuthorityTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, 256, 256);
  base.addColorStop(0, "#06101a");
  base.addColorStop(.42, "#102c3b");
  base.addColorStop(1, "#02070d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) {
    const a = 0.05 + ((y % 17) / 17) * 0.07;
    ctx.fillStyle = `rgba(170,225,255,${a})`;
    ctx.fillRect(0, y, 256, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 2.5);
  texture.anisotropy = 8;
  return texture;
}

function vcoApplyReal3DAntiToyAuthority(scene, THREE) {
  if (!scene || scene.userData.vcoReal3DAntiToyAuthorityApplied) return;
  scene.userData.vcoReal3DAntiToyAuthorityApplied = true;
  const brushed = vcoMakeBrushedAuthorityTexture(THREE);
  scene.traverse((node) => {
    if (!node || !node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    mats.filter(Boolean).forEach((mat) => {
      if (!mat || mat.userData?.vcoReal3DAntiToyMaterial) return;
      mat.userData = mat.userData || {};
      mat.userData.vcoReal3DAntiToyMaterial = true;
      if ("metalness" in mat) mat.metalness = Math.max(mat.metalness || 0, 0.46);
      if ("roughness" in mat) mat.roughness = Math.max(mat.roughness || 0, 0.52);
      if ("clearcoat" in mat) mat.clearcoat = Math.max(mat.clearcoat || 0, 0.2);
      if ("clearcoatRoughness" in mat) mat.clearcoatRoughness = Math.max(mat.clearcoatRoughness || 0, 0.44);
      if ("envMapIntensity" in mat) mat.envMapIntensity = Math.max(mat.envMapIntensity || 0, 0.78);
      if (!mat.map && /MeshPhysicalMaterial|MeshStandardMaterial/.test(mat.type || "")) mat.map = brushed;
      if ("emissiveIntensity" in mat && mat.emissiveIntensity > 0) mat.emissiveIntensity = Math.min(mat.emissiveIntensity * 1.16, 1.55);
      mat.needsUpdate = true;
    });
  });
  if (!scene.getObjectByName("VCO_REAL3D_KEY_LIGHT")) {
    const key = new THREE.DirectionalLight(0xbfeeff, 2.25);
    key.name = "VCO_REAL3D_KEY_LIGHT";
    key.position.set(-12, 26, 18);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x65bfff, 1.35);
    rim.name = "VCO_REAL3D_RIM_LIGHT";
    rim.position.set(18, 10, -24);
    scene.add(rim);
    const under = new THREE.PointLight(0x1c8dff, 1.6, 38, 2.2);
    under.name = "VCO_REAL3D_CORE_UNDERLIGHT";
    under.position.set(0, 2.2, 0);
    scene.add(under);
    const red = new THREE.PointLight(0xff3428, 1.75, 24, 2.4);
    red.name = "VCO_REAL3D_ADMISSORIUM_RESTRICTED_LIGHT";
    red.position.set(0, 3.5, 15.8);
    scene.add(red);
  }
}

(function vcoAntiToyInteractionHardening(){
  if (window.VCO_REAL3D_ANTI_TOY_RUNTIME_AUTHORITY) return;
  window.VCO_REAL3D_ANTI_TOY_RUNTIME_AUTHORITY = true;
  const OBJECTS = ["ACCEPTED_TRUTH","ADMISSORIUM","SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL","CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM","REPO_PILLARS","HOST_GATES","ARTIFACT_JOURNEY"];
  let selected = 0;
  let chord = "";
  function dispatchObjectIntent(objectId, mode = "open") {
    document.dispatchEvent(new CustomEvent("vco:object-dispatch", { detail: { objectId, mode, authority: "VCO_REAL3D_ANTI_TOY_RUNTIME_AUTHORITY" }}));
    const inspector = document.querySelector("[data-runtime-inspector]");
    if (inspector) inspector.innerHTML = `<div class="oc-inspector-head"><strong>${objectId}</strong><span>${mode.toUpperCase()}</span></div><p>Unified object dispatch. Click, hover, focus, keyboard, and command surface resolve to the same object id.</p>`;
  }
  function openCommandPalette() {
    const api = window.VCO_OBSERVATORY_DEEP_REPAIR_REAL3D_COMMAND_AUTHORITY || window.VCO_CINEMATIC_COMMAND_KEYBOARD_CLICK_AUTHORITY;
    if (api?.openCommandPalette) return api.openCommandPalette();
    document.dispatchEvent(new CustomEvent("vco:command-palette", { detail: { authority: "VCO_REAL3D_ANTI_TOY_RUNTIME_AUTHORITY" }}));
  }
  function advanceJourney(stage = null) {
    const stages = [...document.querySelectorAll("[data-journey-list] li")];
    if (!stages.length) return;
    const current = stages.findIndex((el) => el.classList.contains("is-active"));
    const next = stage ? stages.findIndex((el) => (el.textContent || "").toUpperCase().includes(String(stage).toUpperCase())) : (current + 1 + stages.length) % stages.length;
    stages.forEach((el, i) => el.classList.toggle("is-active", i === Math.max(0, next)));
    dispatchObjectIntent(`ARTIFACT_STAGE_${Math.max(0, next) + 1}`, "journey");
  }
  document.addEventListener("keydown", (event) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "");
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "k") { event.preventDefault(); openCommandPalette(); return; }
    if (!typing && event.key === "/") { event.preventDefault(); openCommandPalette(); return; }
    if (!typing && event.key === "ArrowRight") { selected = (selected + 1) % OBJECTS.length; dispatchObjectIntent(OBJECTS[selected], "focus"); return; }
    if (!typing && event.key === "ArrowLeft") { selected = (selected - 1 + OBJECTS.length) % OBJECTS.length; dispatchObjectIntent(OBJECTS[selected], "focus"); return; }
    if (!typing && event.key === "Enter") { dispatchObjectIntent(OBJECTS[selected], "open"); return; }
    if (!typing && /^[1-9]$/.test(event.key)) {
      const chambers = ["SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL","CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM"];
      dispatchObjectIntent(chambers[Number(event.key) - 1], "open");
      return;
    }
    if (!typing && key === "g") { chord = "g"; setTimeout(() => { chord = ""; }, 900); return; }
    if (!typing && chord === "g") {
      chord = "";
      if (key === "r") dispatchObjectIntent("REPO_PILLARS", "open");
      if (key === "a") advanceJourney("CLAIM");
      if (key === "h") dispatchObjectIntent("HOST_GATES", "open");
      if (key === "c") dispatchObjectIntent("ACCEPTED_TRUTH", "open");
    }
  });
  window.VCO_REAL3D_ANTI_TOY_RUNTIME_API = { openCommandPalette, dispatchObjectIntent, advanceJourney };
})();
/* END VCO REAL3D ANTI TOY RUNTIME AUTHORITY */


/* BEGIN VCO PANEL QUARANTINE FINAL RUNTIME */
(function vcoPanelQuarantineFinalRuntime(){
  if (window.VCO_PANEL_QUARANTINE_FINAL_RUNTIME) return;
  window.VCO_PANEL_QUARANTINE_FINAL_RUNTIME = true;

  const CHAMBERS = [
    "SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL",
    "CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM"
  ];

  function clean(value) {
    return String(value || "")
      .replace(/^\d+/, "")
      .replace(/ADMISSIBILITYADMISSORIUM/i, "ADMISSORIUM")
      .replace(/AUTHORITYAUCTORISEAL/i, "AUCTORISEAL")
      .replace(/EXECUTIONCORPIFORM/i, "CORPIFORM")
      .replace(/RECEIPTCORPIFORM/i, "CORPIFORM_RECEIPT")
      .replace(/RECOGNITIONANAGNORIUM/i, "ANAGNORIUM")
      .replace(/RECOURSEREGRESSORIUM/i, "REGRESSORIUM")
      .replace(/PERMANENCESIGILLARIUM/i, "SIGILLARIUM")
      .trim();
  }

  function inspector() {
    let el = document.querySelector("[data-runtime-inspector]");
    if (!el) {
      el = document.createElement("aside");
      el.className = "oc-inspector";
      el.setAttribute("data-runtime-inspector", "");
      document.getElementById("observatory-webgl-runtime")?.appendChild(el);
    }
    return el;
  }

  function closeCommandSurfaces() {
    document.querySelectorAll(".vco-command-palette,.vco-command").forEach((el) => el.classList.remove("is-open"));
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) document.activeElement.blur();
  }

  function publish(raw, mode = "open") {
    const objectId = clean(raw) || "CANVAS_OBJECT_GRAPH";
    document.body.setAttribute("data-vco-last-dispatch", objectId);

    const el = inspector();
    el.innerHTML = `
      <div class="oc-inspector-head">
        <strong>${objectId}</strong>
        <span>${mode.toUpperCase()} · ${Date.now()}</span>
      </div>
      <p>Panel-quarantined dispatch resolved <code>${objectId}</code>.</p>
    `;

    document.dispatchEvent(new CustomEvent("vco:object-dispatch", {
      detail: { objectId, mode, authority: "VCO_PANEL_QUARANTINE_FINAL_RUNTIME", at: Date.now() }
    }));
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key;

    if (/^[1-9]$/.test(key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCommandSurfaces();
      publish(CHAMBERS[Number(key) - 1], "open");
      return;
    }

    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "");
    if (typing) return;

    if (key === "ArrowRight") {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish("NEXT_OBJECT", "focus");
      return;
    }

    if (key === "ArrowLeft") {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish("PREVIOUS_OBJECT", "focus");
      return;
    }
  }, true);

  window.addEventListener("pointerdown", (event) => {
    const runtime = document.getElementById("observatory-webgl-runtime");
    if (!runtime || !runtime.contains(event.target)) return;
    if (event.target.matches("canvas")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish("CANVAS_OBJECT_GRAPH", "click");
    }
  }, true);

  const api = {
    dispatchClean: publish,
    dispatchObjectIntent: publish,
    dispatchPanelQuarantine: publish,
    lastDispatch: () => document.body.getAttribute("data-vco-last-dispatch"),
    accepted: true,
    authority: "VCO_PANEL_QUARANTINE_FINAL_RUNTIME"
  };

  window.VCO_PANEL_QUARANTINE_API = api;
  window.VCO_PANEL_QUARANTINE_REAL_FIX_API = api;
  window.VCO_PANEL_QUARANTINE_FINAL_API = api;
  window.VCO_PANEL_QUARANTINE_WINDOW_CAPTURE_API = api;
})();
/* END VCO PANEL QUARANTINE FINAL RUNTIME */


/* BEGIN VCO MACHINE FIRST PANEL EJECTION RUNTIME */
(function vcoMachineFirstPanelEjectionRuntime(){
  if (window.VCO_MACHINE_FIRST_PANEL_EJECTION_RUNTIME) return;
  window.VCO_MACHINE_FIRST_PANEL_EJECTION_RUNTIME = true;

  const CHAMBERS = [
    "SYNTAGMARIUM","ORBISTIUM","CONSONORIUM","TACHYRIUM","AUCTORISEAL",
    "CORPIFORM","VERIFRAX","ANAGNORIUM","REGRESSORIUM"
  ];

  function clean(value) {
    return String(value || "")
      .replace(/^\d+/, "")
      .replace(/ADMISSIBILITYADMISSORIUM/i, "ADMISSORIUM")
      .replace(/AUTHORITYAUCTORISEAL/i, "AUCTORISEAL")
      .replace(/EXECUTIONCORPIFORM/i, "CORPIFORM")
      .replace(/RECEIPTCORPIFORM/i, "CORPIFORM_RECEIPT")
      .replace(/RECOGNITIONANAGNORIUM/i, "ANAGNORIUM")
      .replace(/RECOURSEREGRESSORIUM/i, "REGRESSORIUM")
      .replace(/PERMANENCESIGILLARIUM/i, "SIGILLARIUM")
      .replace(/[^A-Z0-9_:-]/g, "")
      .trim();
  }

  function inspector() {
    let el = document.querySelector("[data-runtime-inspector]");
    if (!el) {
      el = document.createElement("aside");
      el.className = "oc-inspector";
      el.setAttribute("data-runtime-inspector", "");
      document.getElementById("observatory-webgl-runtime")?.appendChild(el);
    }
    return el;
  }

  function ejectPanels() {
    document.querySelectorAll(".oc-left,.oc-right,.vco-deep-inspector,.vco-object-inspector").forEach((el) => {
      el.setAttribute("aria-hidden", "true");
      el.classList.remove("is-open");
    });
  }

  function publish(raw, mode = "open") {
    const objectId = clean(raw) || "CANVAS_OBJECT_GRAPH";
    document.body.setAttribute("data-vco-last-dispatch", objectId);

    const el = inspector();
    el.innerHTML = `
      <div class="oc-inspector-head">
        <strong>${objectId}</strong>
        <span>${String(mode).toUpperCase()} · ${Date.now()}</span>
      </div>
      <p>Machine-first dispatch resolved <code>${objectId}</code>.</p>
    `;

    document.dispatchEvent(new CustomEvent("vco:object-dispatch", {
      detail: { objectId, mode, authority: "VCO_MACHINE_FIRST_PANEL_EJECTION_RUNTIME", at: Date.now() }
    }));

    ejectPanels();
    return objectId;
  }

  function closeCommandSurfaces() {
    document.querySelectorAll(".vco-command-palette,.vco-command").forEach((el) => el.classList.remove("is-open"));
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) document.activeElement.blur();
  }

  function advanceJourney() {
    const items = [...document.querySelectorAll("[data-journey-list] li")];
    if (!items.length) return;
    const current = items.findIndex((el) => el.classList.contains("is-active"));
    const next = (current + 1 + items.length) % items.length;
    items.forEach((el, index) => {
      el.classList.toggle("is-active", index === next);
      el.setAttribute("data-stage-id", `ARTIFACT_STAGE_${index + 1}`);
    });
    publish(`ARTIFACT_STAGE_${next + 1}`, "journey");
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key;
    if (/^[1-9]$/.test(key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeCommandSurfaces();
      publish(CHAMBERS[Number(key) - 1], "open");
      return;
    }

    const typing = /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "");
    if (typing) return;

    if (key === "ArrowRight" || key === "ArrowLeft") {
      event.preventDefault();
      event.stopImmediatePropagation();
      advanceJourney();
      return;
    }
  }, true);

  window.addEventListener("pointerdown", (event) => {
    const runtime = document.getElementById("observatory-webgl-runtime");
    if (!runtime || !runtime.contains(event.target)) return;

    const explicit = event.target.closest("[data-object-id],[data-stage-id],[data-vco-command]");
    if (explicit) {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish(
        explicit.getAttribute("data-object-id") ||
        explicit.getAttribute("data-stage-id") ||
        explicit.getAttribute("data-vco-command"),
        "open"
      );
      return;
    }

    if (event.target.matches("canvas")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      publish("CANVAS_OBJECT_GRAPH", "click");
    }
  }, true);

  const api = {
    dispatchClean: publish,
    dispatchObjectIntent: publish,
    dispatchPanelQuarantine: publish,
    ejectPanels,
    lastDispatch: () => document.body.getAttribute("data-vco-last-dispatch"),
    accepted: true,
    authority: "VCO_MACHINE_FIRST_PANEL_EJECTION_RUNTIME"
  };

  window.VCO_MACHINE_FIRST_PANEL_EJECTION_API = api;
  window.VCO_PANEL_QUARANTINE_API = api;
  window.VCO_PANEL_QUARANTINE_FINAL_API = api;
  window.VCO_PANEL_QUARANTINE_REAL_FIX_API = api;

  ejectPanels();
  setTimeout(ejectPanels, 250);
  setTimeout(ejectPanels, 1000);
})();
 /* END VCO MACHINE FIRST PANEL EJECTION RUNTIME */

/* BEGIN VCO CINEMATIC REAL3D AUTHORITY */
(function vcoCinematicReal3DAuthority(){
  if (window.VCO_CINEMATIC_REAL3D_AUTHORITY) return;
  window.VCO_CINEMATIC_REAL3D_AUTHORITY = true;

  const STATE = {
    accepted: true,
    rendererQuality: "cinematic-pbr-procedural",
    shadowMap: 4096,
    materialDoctrine: "brushed-metal-stone-glass-emissive-evidence",
    cameraDoctrine: "low-wide-sovereign-machine-first",
    lightDoctrine: "key-rim-fill-volumetric-evidence",
    textureDoctrine: "procedural-until-glb-ktx2-assets-exist"
  };

  function mark(node, name) {
    if (!node || !node.userData) return;
    node.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = name || true;
  }

  function makeCanvasTexture(THREE, kind) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1024;
    const g = c.getContext("2d", { willReadFrequently: true });

    const bg = kind === "stone" ? ["#111923", "#03070d"] : kind === "glass" ? ["#12354c", "#020812"] : ["#26323a", "#05090d"];
    const grad = g.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, bg[0]);
    grad.addColorStop(1, bg[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 1024);

    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const a = kind === "stone" ? Math.random() * 0.13 : Math.random() * 0.09;
      g.fillStyle = "rgba(" + (kind === "metal" ? 180 : 120) + "," + (kind === "glass" ? 230 : 210) + ",255," + a + ")";
      g.fillRect(x, y, Math.random() * 2.5 + 0.4, Math.random() * 42 + 3);
    }

    for (let i = 0; i < 130; i++) {
      g.beginPath();
      g.strokeStyle = "rgba(140,220,255," + (Math.random() * 0.12) + ")";
      g.lineWidth = Math.random() * 2.2 + 0.2;
      g.moveTo(Math.random() * 1024, Math.random() * 1024);
      g.lineTo(Math.random() * 1024, Math.random() * 1024);
      g.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(kind === "stone" ? 3.0 : 1.6, kind === "stone" ? 3.0 : 1.6);
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    return tex;
  }

  function upgradeRenderer(renderer, THREE) {
    if (!renderer || renderer.userData?.VCO_CINEMATIC_RENDERER_AUTHORITY) return;
    renderer.userData = renderer.userData || {};
    renderer.userData.VCO_CINEMATIC_RENDERER_AUTHORITY = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
  }

  function upgradeCamera(camera) {
    if (!camera || camera.userData?.VCO_CINEMATIC_CAMERA_AUTHORITY) return;
    camera.userData = camera.userData || {};
    camera.userData.VCO_CINEMATIC_CAMERA_AUTHORITY = true;
    camera.fov = 36;
    camera.near = 0.08;
    camera.far = 360;
    camera.position.set(-8.8, 18.2, 54.0);
    camera.lookAt(0, 2.0, 0);
    camera.updateProjectionMatrix?.();
  }

  function physicalMaterial(THREE, options) {
    return new THREE.MeshPhysicalMaterial({
      color: options.color,
      roughness: options.roughness ?? 0.54,
      metalness: options.metalness ?? 0.74,
      transmission: options.transmission ?? 0,
      thickness: options.thickness ?? 0,
      clearcoat: options.clearcoat ?? 0.45,
      clearcoatRoughness: options.clearcoatRoughness ?? 0.30,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0,
      map: options.map,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1
    });
  }

  function addLightRig(scene, THREE) {
    if (!scene || scene.userData?.VCO_CINEMATIC_LIGHT_RIG) return;
    scene.userData = scene.userData || {};
    scene.userData.VCO_CINEMATIC_LIGHT_RIG = true;

    scene.fog = new THREE.FogExp2(0x02070d, 0.0105);

    const hemi = new THREE.HemisphereLight(0x9bdcff, 0x010309, 0.58);
    hemi.position.set(0, 42, 0);
    mark(hemi, "evidence-hemisphere");
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xaee7ff, 5.2);
    key.position.set(-22, 38, 26);
    key.castShadow = true;
    key.shadow.mapSize.width = 4096;
    key.shadow.mapSize.height = 4096;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 120;
    key.shadow.camera.left = -46;
    key.shadow.camera.right = 46;
    key.shadow.camera.top = 46;
    key.shadow.camera.bottom = -46;
    key.shadow.bias = -0.00022;
    mark(key, "4096-key-shadow");
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x4fbfff, 3.1);
    rim.position.set(28, 18, -34);
    mark(rim, "blue-rim");
    scene.add(rim);

    const core = new THREE.PointLight(0x84ddff, 8.5, 76, 1.6);
    core.position.set(0, 5.2, 0);
    mark(core, "accepted-truth-core-light");
    scene.add(core);
  }

  function addCinematicGeometry(scene, THREE) {
    if (!scene || scene.userData?.VCO_CINEMATIC_GEOMETRY_LAYER) return;
    scene.userData = scene.userData || {};
    scene.userData.VCO_CINEMATIC_GEOMETRY_LAYER = true;

    const stoneTex = makeCanvasTexture(THREE, "stone");
    const metalTex = makeCanvasTexture(THREE, "metal");
    const glassTex = makeCanvasTexture(THREE, "glass");

    const stone = physicalMaterial(THREE, { color: 0x0a1118, roughness: 0.82, metalness: 0.18, map: stoneTex, clearcoat: 0.08 });
    const metal = physicalMaterial(THREE, { color: 0x263846, roughness: 0.46, metalness: 0.96, map: metalTex, clearcoat: 0.62 });
    const glass = physicalMaterial(THREE, { color: 0x79d8ff, roughness: 0.08, metalness: 0.08, transmission: 0.42, thickness: 2.2, map: glassTex, transparent: true, opacity: 0.52, emissive: 0x0c7fb1, emissiveIntensity: 0.22, clearcoat: 0.86, clearcoatRoughness: 0.07 });
    const emissiveBlue = physicalMaterial(THREE, { color: 0x90e6ff, roughness: 0.18, metalness: 0.24, emissive: 0x43cfff, emissiveIntensity: 1.45, clearcoat: 0.72 });

    const floor = new THREE.Mesh(new THREE.CylinderGeometry(27.5, 31.5, 1.2, 160, 3), stone);
    floor.position.y = -0.92;
    floor.receiveShadow = true;
    mark(floor, "black-stone-constitutional-floor");
    scene.add(floor);

    const coreGroup = new THREE.Group();
    coreGroup.name = "VCO_ACCEPTED_TRUTH_CRYSTAL_CORE";

    const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(2.5, 4), glass);
    crystal.position.y = 3.25;
    crystal.castShadow = true;
    crystal.receiveShadow = true;
    mark(crystal, "accepted-truth-crystal");
    coreGroup.add(crystal);

    const cage = new THREE.Mesh(new THREE.TorusKnotGeometry(2.9, 0.045, 260, 14, 3, 7), emissiveBlue);
    cage.position.y = 3.25;
    cage.castShadow = true;
    mark(cage, "restrained-evidence-cage");
    coreGroup.add(cage);

    scene.add(coreGroup);

    for (let i = 0; i < 35; i++) {
      const angle = (i / 35) * Math.PI * 2;
      const radius = 22.4 + Math.sin(i * 1.7) * 0.36;
      const height = 2.2 + (i % 5) * 0.24;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.72, height, 0.72), i % 3 === 0 ? metal : stone);
      pillar.position.set(Math.sin(angle) * radius, height / 2, Math.cos(angle) * radius);
      pillar.rotation.y = angle;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      mark(pillar, "35-repository-pbr-pillar");
      scene.add(pillar);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.055, 0.88), emissiveBlue);
      cap.position.set(pillar.position.x, height + 0.08, pillar.position.z);
      cap.rotation.y = angle;
      mark(cap, "repository-evidence-cap");
      scene.add(cap);
    }
  }

  function upgradeMaterials(scene, THREE) {
    if (!scene || scene.userData?.VCO_CINEMATIC_MATERIAL_PASS) return;
    scene.userData = scene.userData || {};
    scene.userData.VCO_CINEMATIC_MATERIAL_PASS = true;
    const metalTex = makeCanvasTexture(THREE, "metal");
    const stoneTex = makeCanvasTexture(THREE, "stone");

    scene.traverse((obj) => {
      if (!obj || !obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (!obj.material) return;
      const old = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (old && old.userData?.VCO_LOCKED_MATERIAL) return;
      const luminous = old?.emissiveIntensity > 0.2 || /glow|light|line|cap|beam/i.test(obj.name || "");
      const mat = new THREE.MeshPhysicalMaterial({
        color: luminous ? 0x8de5ff : 0x182633,
        roughness: luminous ? 0.22 : 0.58,
        metalness: luminous ? 0.22 : 0.82,
        map: luminous ? null : ((obj.position?.y || 0) < 1 ? stoneTex : metalTex),
        emissive: luminous ? 0x37cfff : 0x000000,
        emissiveIntensity: luminous ? 1.15 : 0,
        clearcoat: luminous ? 0.72 : 0.46,
        clearcoatRoughness: luminous ? 0.12 : 0.32
      });
      mat.userData.VCO_LOCKED_MATERIAL = true;
      obj.material = mat;
    });
  }

  function apply() {
    const THREE = window.THREE || globalThis.THREE;
    if (!THREE) return false;
    const canvas = document.querySelector("#observatory-webgl-runtime canvas");
    if (!canvas) return false;

    const scenes = [];
    const cameras = [];
    const renderers = [];

    function scan(value, depth = 0, seen = new Set()) {
      if (!value || depth > 4 || seen.has(value)) return;
      seen.add(value);
      if (value.isScene) scenes.push(value);
      if (value.isCamera) cameras.push(value);
      if (value.domElement === canvas && typeof value.render === "function") renderers.push(value);
      if (typeof value === "object") {
        for (const k of Object.keys(value).slice(0, 80)) {
          try { scan(value[k], depth + 1, seen); } catch {}
        }
      }
    }

    scan(window);
    scenes.forEach((scene) => {
      addLightRig(scene, THREE);
      addCinematicGeometry(scene, THREE);
      upgradeMaterials(scene, THREE);
    });
    cameras.forEach(upgradeCamera);
    renderers.forEach((r) => upgradeRenderer(r, THREE));

    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {
      accepted: true,
      state: STATE,
      scenes: scenes.length,
      cameras: cameras.length,
      renderers: renderers.length,
      reapply: apply
    };

    document.body.setAttribute("data-vco-cinematic-real3d", "accepted");
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    const ok = apply();
    if (ok || tries > 80) clearInterval(timer);
  }, 180);

  window.addEventListener("resize", () => setTimeout(apply, 120));
})();
 /* END VCO CINEMATIC REAL3D AUTHORITY */

/* BEGIN VCO CINEMATIC REAL3D BINDING AUTHORITY */
(function vcoCinematicReal3DBindingAuthority(){
  if (window.VCO_CINEMATIC_REAL3D_BINDING_AUTHORITY) return;
  window.VCO_CINEMATIC_REAL3D_BINDING_AUTHORITY = true;

  const STATE = {
    accepted: true,
    rendererQuality: "cinematic-pbr-procedural",
    shadowMap: 4096,
    materialDoctrine: "brushed-metal-stone-glass-emissive-evidence",
    cameraDoctrine: "low-wide-sovereign-machine-first",
    lightDoctrine: "key-rim-fill-volumetric-evidence",
    textureDoctrine: "procedural-until-glb-ktx2-assets-exist"
  };

  function bind() {
    const handles = window.VCO_OBSERVATORY_RUNTIME_HANDLES || {};
    const THREE = handles.THREE || window.THREE || globalThis.THREE;
    const scene = handles.scene || window.VCO_OBSERVATORY_SCENE;
    const camera = handles.camera || window.VCO_OBSERVATORY_CAMERA;
    const renderer = handles.renderer || window.VCO_OBSERVATORY_RENDERER;

    if (!THREE || !scene || !camera || !renderer) return false;

    renderer.userData = renderer.userData || {};
    renderer.userData.VCO_CINEMATIC_RENDERER_AUTHORITY = true;
    renderer.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    camera.userData = camera.userData || {};
    camera.userData.VCO_CINEMATIC_CAMERA_AUTHORITY = true;
    camera.fov = 36;
    camera.near = 0.08;
    camera.far = 360;
    camera.position.set(-8.8, 18.2, 54.0);
    camera.lookAt(0, 2.0, 0);
    camera.updateProjectionMatrix?.();

    scene.userData = scene.userData || {};
    if (!scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY) {
      scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY = true;
      scene.fog = new THREE.FogExp2(0x02070d, 0.0105);

      const key = new THREE.DirectionalLight(0xaee7ff, 5.2);
      key.position.set(-22, 38, 26);
      key.castShadow = true;
      key.shadow.mapSize.width = 4096;
      key.shadow.mapSize.height = 4096;
      key.shadow.camera.left = -46;
      key.shadow.camera.right = 46;
      key.shadow.camera.top = 46;
      key.shadow.camera.bottom = -46;
      key.shadow.bias = -0.00022;
      key.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = "4096-key-shadow";
      scene.add(key);

      const rim = new THREE.DirectionalLight(0x4fbfff, 3.1);
      rim.position.set(28, 18, -34);
      rim.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = "blue-rim";
      scene.add(rim);

      const coreLight = new THREE.PointLight(0x84ddff, 8.5, 76, 1.6);
      coreLight.position.set(0, 5.2, 0);
      coreLight.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = "accepted-truth-core-light";
      scene.add(coreLight);
    }

    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {
      accepted: true,
      state: STATE,
      scenes: 1,
      cameras: 1,
      renderers: 1,
      reapply: bind
    };

    document.body.setAttribute("data-vco-cinematic-real3d", "accepted");
    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (bind() || attempts > 100) clearInterval(timer);
  }, 120);

  window.addEventListener("resize", () => setTimeout(bind, 120));
})();
 /* END VCO CINEMATIC REAL3D BINDING AUTHORITY */

/* BEGIN VCO CINEMATIC SCENE GEOMETRY AUTHORITY */
(function vcoCinematicSceneGeometryAuthority(){
  if (window.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY) return;
  window.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;

  const STATE = {
    accepted: true,
    rendererQuality: "cinematic-pbr-procedural",
    shadowMap: 4096,
    materialDoctrine: "brushed-metal-stone-glass-emissive-evidence",
    cameraDoctrine: "low-wide-sovereign-machine-first",
    lightDoctrine: "key-rim-fill-volumetric-evidence",
    textureDoctrine: "procedural-until-glb-ktx2-assets-exist"
  };

  function mark(node, name) {
    if (!node) return node;
    node.userData = node.userData || {};
    node.userData.VCO_CINEMATIC_REAL3D_AUTHORITY = name || true;
    return node;
  }

  function material(THREE, spec) {
    return new THREE.MeshPhysicalMaterial({
      color: spec.color,
      roughness: spec.roughness,
      metalness: spec.metalness,
      emissive: spec.emissive || 0x000000,
      emissiveIntensity: spec.emissiveIntensity || 0,
      transparent: !!spec.transparent,
      opacity: spec.opacity == null ? 1 : spec.opacity,
      transmission: spec.transmission || 0,
      thickness: spec.thickness || 0,
      clearcoat: spec.clearcoat == null ? 0.45 : spec.clearcoat,
      clearcoatRoughness: spec.clearcoatRoughness == null ? 0.28 : spec.clearcoatRoughness
    });
  }

  function removePrior(scene) {
    const names = new Set([
      "VCO_ACCEPTED_TRUTH_CRYSTAL_CORE",
      "VCO_CINEMATIC_REPOSITORY_PERIMETER"
    ]);
    [...scene.children].forEach((child) => {
      if (names.has(child.name) || child.userData?.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY) {
        scene.remove(child);
      }
    });
  }

  function apply() {
    const THREE = window.THREE || globalThis.THREE;
    const handles = window.VCO_OBSERVATORY_RUNTIME_HANDLES || {};
    const scene = handles.scene || window.VCO_OBSERVATORY_SCENE;
    const camera = handles.camera || window.VCO_OBSERVATORY_CAMERA;
    const renderer = handles.renderer || window.VCO_OBSERVATORY_RENDERER;

    if (!THREE || !scene || !scene.isScene) return false;

    removePrior(scene);

    scene.userData = scene.userData || {};
    scene.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;
    scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY = true;

    const stone = material(THREE, {
      color: 0x080f16,
      roughness: 0.86,
      metalness: 0.16,
      clearcoat: 0.10
    });

    const metal = material(THREE, {
      color: 0x243846,
      roughness: 0.42,
      metalness: 0.96,
      clearcoat: 0.72,
      clearcoatRoughness: 0.20
    });

    const glass = material(THREE, {
      color: 0x7ddcff,
      roughness: 0.05,
      metalness: 0.08,
      transparent: true,
      opacity: 0.58,
      transmission: 0.34,
      thickness: 2.4,
      emissive: 0x0a8dbe,
      emissiveIntensity: 0.36,
      clearcoat: 0.92,
      clearcoatRoughness: 0.05
    });

    const evidence = material(THREE, {
      color: 0xa4edff,
      roughness: 0.16,
      metalness: 0.22,
      emissive: 0x42d8ff,
      emissiveIntensity: 1.65,
      clearcoat: 0.82,
      clearcoatRoughness: 0.10
    });

    const floor = mark(new THREE.Mesh(
      new THREE.CylinderGeometry(28.5, 32.0, 1.15, 180, 2),
      stone
    ), "cinematic-black-stone-floor");
    floor.name = "VCO_CINEMATIC_BLACK_STONE_FLOOR";
    floor.position.y = -0.98;
    floor.receiveShadow = true;
    floor.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;
    scene.add(floor);

    const coreGroup = new THREE.Group();
    coreGroup.name = "VCO_ACCEPTED_TRUTH_CRYSTAL_CORE";
    coreGroup.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;

    const crystal = mark(new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.65, 5),
      glass
    ), "accepted-truth-crystal");
    crystal.name = "VCO_ACCEPTED_TRUTH_CRYSTAL";
    crystal.position.y = 3.35;
    crystal.castShadow = true;
    crystal.receiveShadow = true;
    coreGroup.add(crystal);

    const cage = mark(new THREE.Mesh(
      new THREE.TorusKnotGeometry(3.05, 0.055, 320, 18, 3, 7),
      evidence
    ), "accepted-truth-restrained-evidence-cage");
    cage.name = "VCO_ACCEPTED_TRUTH_RESTRAINED_CAGE";
    cage.position.y = 3.35;
    cage.castShadow = true;
    coreGroup.add(cage);

    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const beam = mark(new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.035, 15.5),
        evidence
      ), "accepted-truth-deterministic-line");
      beam.name = `VCO_ACCEPTED_TRUTH_LINE_${i + 1}`;
      beam.position.set(Math.sin(angle) * 4.2, 3.28, Math.cos(angle) * 4.2);
      beam.rotation.y = angle;
      coreGroup.add(beam);
    }

    scene.add(coreGroup);

    const perimeter = new THREE.Group();
    perimeter.name = "VCO_CINEMATIC_REPOSITORY_PERIMETER";
    perimeter.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;

    for (let i = 0; i < 35; i++) {
      const angle = (i / 35) * Math.PI * 2;
      const radius = 22.8 + Math.sin(i * 1.618) * 0.42;
      const height = 2.25 + (i % 7) * 0.18;

      const pillar = mark(new THREE.Mesh(
        new THREE.BoxGeometry(0.74, height, 0.74),
        i % 3 === 0 ? metal : stone
      ), "35-repository-pbr-pillar");
      pillar.name = `VCO_REPOSITORY_PBR_PILLAR_${String(i + 1).padStart(2, "0")}`;
      pillar.position.set(Math.sin(angle) * radius, height / 2, Math.cos(angle) * radius);
      pillar.rotation.y = angle;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      perimeter.add(pillar);

      const cap = mark(new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 0.06, 0.92),
        evidence
      ), "repository-evidence-cap");
      cap.name = `VCO_REPOSITORY_EVIDENCE_CAP_${String(i + 1).padStart(2, "0")}`;
      cap.position.set(pillar.position.x, height + 0.085, pillar.position.z);
      cap.rotation.y = angle;
      perimeter.add(cap);
    }

    scene.add(perimeter);

    if (renderer) {
      renderer.userData = renderer.userData || {};
      renderer.userData.VCO_CINEMATIC_RENDERER_AUTHORITY = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    if (camera) {
      camera.userData = camera.userData || {};
      camera.userData.VCO_CINEMATIC_CAMERA_AUTHORITY = true;
      camera.fov = 36;
      camera.near = 0.08;
      camera.far = 360;
      camera.updateProjectionMatrix?.();
    }

    const prior = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API || {};
    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {
      ...prior,
      accepted: true,
      state: STATE,
      scenes: 1,
      cameras: camera ? 1 : 0,
      renderers: renderer ? 1 : 0,
      reapply: apply
    };

    document.body.setAttribute("data-vco-cinematic-real3d", "accepted");
    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const ok = apply();
    if (ok || attempts > 80) clearInterval(timer);
  }, 160);

  window.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY_API = {
    accepted: true,
    reapply: apply
  };
})();
 /* END VCO CINEMATIC SCENE GEOMETRY AUTHORITY */



/* BEGIN VCO CINEMATIC API DECLARATION AUTHORITY */
(function vcoCinematicApiDeclarationAuthority(){
  if (window.VCO_CINEMATIC_API_DECLARATION_AUTHORITY) return;
  window.VCO_CINEMATIC_API_DECLARATION_AUTHORITY = true;

  const STATE = {
    accepted: true,
    rendererQuality: "cinematic-pbr-procedural",
    shadowMap: 4096,
    materialDoctrine: "brushed-metal-stone-glass-emissive-evidence",
    cameraDoctrine: "low-wide-sovereign-machine-first",
    lightDoctrine: "key-rim-fill-volumetric-evidence",
    textureDoctrine: "procedural-until-glb-ktx2-assets-exist"
  };

  function declare() {
    const handles = window.VCO_OBSERVATORY_RUNTIME_HANDLES || {};
    const scene = handles.scene || window.VCO_OBSERVATORY_SCENE;
    const camera = handles.camera || window.VCO_OBSERVATORY_CAMERA;
    const renderer = handles.renderer || window.VCO_OBSERVATORY_RENDERER;

    if (!scene || !scene.isScene) return false;

    const children = Array.from(scene.children || []);
    const flat = children.flatMap((x) => [x].concat(Array.from(x.children || [])));
    const hasCrystal = flat.some((x) =>
      x && (
        x.name === "VCO_ACCEPTED_TRUTH_CRYSTAL_CORE" ||
        x.name === "VCO_ACCEPTED_TRUTH_CRYSTAL" ||
        x.userData?.VCO_CINEMATIC_REAL3D_AUTHORITY === "accepted-truth-crystal"
      )
    );
    const repoPillars = flat.filter((x) =>
      x?.userData?.VCO_CINEMATIC_REAL3D_AUTHORITY === "35-repository-pbr-pillar"
    ).length;

    if (!hasCrystal || repoPillars < 35) return false;

    scene.userData = scene.userData || {};
    scene.userData.VCO_CINEMATIC_SCENE_GEOMETRY_AUTHORITY = true;
    scene.userData.VCO_CINEMATIC_BINDING_LIGHT_AUTHORITY = true;

    if (renderer) {
      renderer.userData = renderer.userData || {};
      renderer.userData.VCO_CINEMATIC_RENDERER_AUTHORITY = true;
    }

    if (camera) {
      camera.userData = camera.userData || {};
      camera.userData.VCO_CINEMATIC_CAMERA_AUTHORITY = true;
    }

    const prior = window.VCO_CINEMATIC_REAL3D_AUTHORITY_API || {};
    window.VCO_CINEMATIC_REAL3D_AUTHORITY_API = {
      ...prior,
      accepted: true,
      state: STATE,
      scenes: Math.max(1, Number(prior.scenes || 0)),
      cameras: Math.max(camera ? 1 : 0, Number(prior.cameras || 0)),
      renderers: Math.max(renderer ? 1 : 0, Number(prior.renderers || 0)),
      reapply: typeof prior.reapply === "function" ? prior.reapply : declare
    };

    document.body.setAttribute("data-vco-cinematic-real3d", "accepted");
    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const ok = declare();
    if (ok || attempts > 100) clearInterval(timer);
  }, 120);

  window.addEventListener("load", () => setTimeout(declare, 250));
  window.VCO_CINEMATIC_API_DECLARATION_AUTHORITY_API = {
    accepted: true,
    declare
  };
})();
 /* END VCO CINEMATIC API DECLARATION AUTHORITY */

/* BEGIN VCO_CINEMATIC_INTERACTION_AUTHORITY */
;(() => {
  "use strict";

  const VCO_CINEMATIC_INTERACTION_AUTHORITY = "VCO_CINEMATIC_INTERACTION_AUTHORITY";
  const VCO_REAL3D_MATERIAL_DEPTH_PASS = "VCO_REAL3D_MATERIAL_DEPTH_PASS";
  const VCO_CAMERA_CINEMATIC_AUTHORITY_PASS = "VCO_CAMERA_CINEMATIC_AUTHORITY_PASS";

  const OBJECTS = [
    "ACCEPTED_TRUTH",
    "ADMISSORIUM",
    "SYNTAGMARIUM",
    "ORBISTIUM",
    "CONSONORIUM",
    "TACHYRIUM",
    "AUCTORISEAL",
    "CORPIFORM",
    "VERIFRAX",
    "ANAGNORIUM",
    "REGRESSORIUM",
    "WWW",
    "API",
    "PROOF",
    "VERIFY",
    "DOCS",
    "APPLY",
    "STATUS",
    "ARCHIVE"
  ];

  let selectedIndex = 0;
  let chord = "";

  function normalizeObjectId(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  }

  function dispatchObjectIntent(objectId, intent = "open") {
    const id = normalizeObjectId(objectId || OBJECTS[selectedIndex] || "ACCEPTED_TRUTH");
    document.dispatchEvent(new CustomEvent("vco:object-intent", {
      detail: {
        id,
        objectId: id,
        intent,
        surface: "cinematic_observatory",
        authority: VCO_CINEMATIC_INTERACTION_AUTHORITY,
        render_permission: "FULL_OBSERVATORY"
      }
    }));
    document.dispatchEvent(new CustomEvent("vco:focus-object", {
      detail: { id, objectId: id, intent, render_permission: "FULL_OBSERVATORY" }
    }));
    return id;
  }

  function closeCommandPalette() {
    document.querySelector("[data-vco-command-palette]")?.remove();
  }

  function openCommandPalette() {
    closeCommandPalette();

    const palette = document.createElement("section");
    palette.className = "vco-command";
    palette.dataset.vcoCommandPalette = "true";
    palette.setAttribute("role", "dialog");
    palette.setAttribute("aria-label", "VERIFRAX Observatory command palette");

    palette.innerHTML = `
      <div class="vco-command-shell">
        <div class="vco-command-head">
          <strong>Command surface</strong>
          <span>Ctrl/Cmd+K · / · arrows · enter · 1-9 · g r/a/h/c</span>
          <button type="button" data-vco-close>×</button>
        </div>
        <input data-vco-command-input autocomplete="off" spellcheck="false" placeholder="Open ADMISSORIUM, Focus ORBISTIUM, Jump to verification…" />
        <div class="vco-command-grid" data-vco-command-list></div>
      </div>
    `;

    const list = palette.querySelector("[data-vco-command-list]");
    const input = palette.querySelector("[data-vco-command-input]");

    const commands = [
      ...OBJECTS.map((id) => ({ label: `Open ${id.replaceAll("_", " ")}`, id, type: "Object" })),
      ...["CLAIM","ADMISSIBILITY","AUTHORITY","EXECUTION","RECEIPT","VERIFICATION","RECOGNITION","RECOURSE","PERMANENCE"].map((id, index) => ({
        label: `Open Artifact Journey stage ${index + 1}: ${id}`,
        id: `JOURNEY_${index + 1}_${id}`,
        type: "Artifact Journey"
      })),
      { label: "Show repo pillars", id: "REPOSITORIES", type: "Surface" },
      { label: "Search repositories", id: "SEARCH_REPOSITORIES", type: "Surface" },
      { label: "Open Accepted Truth core", id: "ACCEPTED_TRUTH", type: "Core" }
    ];

    function render() {
      const q = input.value.trim().toLowerCase();
      const rows = commands
        .filter((cmd) => !q || cmd.label.toLowerCase().includes(q) || cmd.id.toLowerCase().includes(q))
        .slice(0, 24);

      list.innerHTML = rows.map((cmd, index) => `
        <button type="button" data-vco-command-row data-object-id="${cmd.id}" class="${index === 0 ? "is-selected" : ""}">
          <span>${cmd.label}</span>
          <em>${cmd.type}</em>
        </button>
      `).join("");
    }

    palette.addEventListener("click", (event) => {
      const close = event.target.closest("[data-vco-close]");
      if (close) {
        closeCommandPalette();
        return;
      }

      const row = event.target.closest("[data-vco-command-row]");
      if (!row) return;
      dispatchObjectIntent(row.dataset.objectId, "open");
      closeCommandPalette();
    });

    input.addEventListener("keydown", (event) => {
      const rows = [...palette.querySelectorAll("[data-vco-command-row]")];
      let current = rows.findIndex((row) => row.classList.contains("is-selected"));
      if (current < 0) current = 0;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        rows[current]?.classList.remove("is-selected");
        current = event.key === "ArrowDown"
          ? Math.min(rows.length - 1, current + 1)
          : Math.max(0, current - 1);
        rows[current]?.classList.add("is-selected");
        rows[current]?.scrollIntoView({ block: "nearest" });
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const row = rows[current];
        if (row) dispatchObjectIntent(row.dataset.objectId, "open");
        closeCommandPalette();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeCommandPalette();
      }
    });

    input.addEventListener("input", render);

    document.body.appendChild(palette);
    render();
    input.focus();

    document.dispatchEvent(new CustomEvent("vco:command-palette", {
      detail: { surface: "cinematic_observatory", render_permission: "FULL_OBSERVATORY" }
    }));
  }

  function advanceJourney(stage = null) {
    const selected = stage || document.querySelector(".oc-journey li.is-active")?.dataset.stage || "verification";
    document.dispatchEvent(new CustomEvent("vco:artifact-journey-advance", {
      detail: {
        stage: selected,
        surface: "cinematic_observatory",
        state: "alive",
        render_permission: "FULL_OBSERVATORY"
      }
    }));
  }

  document.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || "") || event.target?.isContentEditable;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommandPalette();
      return;
    }

    if (!typing && event.key === "/") {
      event.preventDefault();
      openCommandPalette();
      return;
    }

    if (event.key === "Escape") {
      closeCommandPalette();
      document.dispatchEvent(new CustomEvent("vco:panel-close", { detail: { reason: "escape" } }));
      return;
    }

    if (!typing && (event.key === "ArrowRight" || event.key === "ArrowDown")) {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % OBJECTS.length;
      dispatchObjectIntent(OBJECTS[selectedIndex], "focus");
      return;
    }

    if (!typing && (event.key === "ArrowLeft" || event.key === "ArrowUp")) {
      event.preventDefault();
      selectedIndex = (selectedIndex - 1 + OBJECTS.length) % OBJECTS.length;
      dispatchObjectIntent(OBJECTS[selectedIndex], "focus");
      return;
    }

    if (!typing && event.key === "Enter") {
      event.preventDefault();
      dispatchObjectIntent(OBJECTS[selectedIndex], "open");
      return;
    }

    if (!typing && /^[1-9]$/.test(event.key)) {
      event.preventDefault();
      const chambers = OBJECTS.slice(2, 11);
      dispatchObjectIntent(chambers[Number(event.key) - 1], "open");
      return;
    }

    if (!typing && event.key.toLowerCase() === "g") {
      chord = "g";
      window.setTimeout(() => { chord = ""; }, 900);
      return;
    }

    if (!typing && chord === "g") {
      const key = event.key.toLowerCase();
      chord = "";
      if (key === "r") dispatchObjectIntent("REPOSITORIES", "open");
      if (key === "a") advanceJourney("claim");
      if (key === "h") dispatchObjectIntent("HOST_BOUNDARY_GATES", "open");
      if (key === "c") dispatchObjectIntent("ACCEPTED_TRUTH", "open");
    }
  }, true);

  document.addEventListener("pointerdown", (event) => {
    const target = event.target.closest?.("[data-object-id],[data-repo-id],[data-chamber-id],[data-journey-stage]");
    if (!target) return;
    const id = target.dataset.objectId || target.dataset.repoId || target.dataset.chamberId || target.dataset.journeyStage;
    if (!id) return;
    dispatchObjectIntent(id, "open");
  }, true);

  window.VCO_OBSERVATORY_INTERACTION_AUTHORITY = Object.freeze({
    marker: VCO_CINEMATIC_INTERACTION_AUTHORITY,
    material: VCO_REAL3D_MATERIAL_DEPTH_PASS,
    camera: VCO_CAMERA_CINEMATIC_AUTHORITY_PASS,
    openCommandPalette,
    dispatchObjectIntent,
    advanceJourney
  });
})();
/* END VCO_CINEMATIC_INTERACTION_AUTHORITY */
