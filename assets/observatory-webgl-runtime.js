import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

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

function material(color, emissive = 0x000000, intensity = 0, roughness = 0.64, metalness = 0.76) {
  return new THREE.MeshStandardMaterial({
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

function buildScene(container, manifest) {
  const stage = $(container, "[data-runtime-stage]");
  const width = stage.clientWidth || container.clientWidth || 1600;
  const height = stage.clientHeight || container.clientHeight || 900;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });

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
  scene.fog = new THREE.FogExp2(palette.void, 0.018);

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 360);
  camera.position.set(0, 18.5, 34);
  camera.lookAt(0, 1.2, 0);

  scene.add(new THREE.AmbientLight(0x9ecbff, 0.13));

  const hemi = new THREE.HemisphereLight(0x9ecbff, 0x02060b, 0.46);
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
    new THREE.MeshStandardMaterial({
      color: 0x050b12,
      emissive: 0x0a2034,
      emissiveIntensity: 0.18,
      roughness: 0.86,
      metalness: 0.42,
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
    new THREE.MeshStandardMaterial({
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

  const chamberRadius = 9.8;
  const chamberGeometry = new THREE.CylinderGeometry(1.86, 2.16, 2.45, 96);
  const chamberTopGeometry = new THREE.CylinderGeometry(2.24, 1.82, 0.50, 96);
  const chamberPlinthGeometry = new THREE.CylinderGeometry(2.52, 2.78, 0.42, 96);
  const chamberGlowGeometry = new THREE.CylinderGeometry(2.0, 2.0, 2.52, 96, 1, true);
  const chamberMat = material(palette.metal, palette.blue, 0.15, 0.52, 0.92);
  const chamberTopMat = material(palette.darkMetal, palette.blue, 0.09, 0.38, 0.96);
  const chamberPlinthMat = material(0x101822, palette.blue, 0.08, 0.62, 0.90);
  const chamberGlowMat = new THREE.MeshStandardMaterial({
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

  const repoRadius = 19.6;
  const repoGeometry = new THREE.BoxGeometry(0.58, 2.28, 0.58);
  const repoCapGeometry = new THREE.BoxGeometry(0.74, 0.16, 0.74);
  const repoMat = material(palette.darkMetal, palette.blue, 0.28, 0.32, 0.92);
  const repoCapMat = material(0x182636, palette.cyan, 0.38, 0.26, 0.88);
  const repoMesh = new THREE.InstancedMesh(repoGeometry, repoMat, manifest.repositories.length);
  const repoCapMesh = new THREE.InstancedMesh(repoCapGeometry, repoCapMat, manifest.repositories.length);
  repoMesh.castShadow = true;
  repoMesh.receiveShadow = true;
  repoCapMesh.castShadow = true;

  const dummy = new THREE.Object3D();
  const capDummy = new THREE.Object3D();
  manifest.repositories.forEach((repo, index) => {
    if (repo.name === "ADMISSORIUM") return;
    const angle = -Math.PI / 2 + (index / manifest.repositories.length) * Math.PI * 2;
    const p = polar(repoRadius, angle, 1.12);
    dummy.position.copy(p);
    dummy.rotation.y = -angle;
    dummy.scale.set(1, repo.class === "sovereign-chamber" ? 1.28 : 1, 1);
    dummy.updateMatrix();
    repoMesh.setMatrixAt(index, dummy.matrix);

    capDummy.position.set(p.x, p.y + 1.23 * dummy.scale.y, p.z);
    capDummy.rotation.y = -angle;
    capDummy.scale.copy(dummy.scale);
    capDummy.updateMatrix();
    repoCapMesh.setMatrixAt(index, capDummy.matrix);
  });
  scene.add(repoMesh);
  scene.add(repoCapMesh);

  const repoLabel = makeLabel("35", "GOVERNED REPOSITORY PERIMETER", 520, 170);
  repoLabel.position.set(0, 4.55, -20.35);
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

  gateBase.position.set(0, 1.6, 14.55);
  gateArch.position.set(0, 3.22, 14.74);
  gateArch.rotation.z = Math.PI;
  gateBarA.position.set(-1.15, 1.28, 15.43);
  gateBarB.position.set(1.15, 1.28, 15.43);
  gateWarningPlate.position.set(0, 1.42, 15.46);

  gateBase.castShadow = true;
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
  statusLabel.position.set(0, 2.82, 20.65);
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

  function animate() {
    const t = clock.getElapsedTime();

    const orbit = t * 0.028;
    camera.position.x = Math.sin(orbit) * 25.5;
    camera.position.z = Math.cos(orbit) * 34.0;
    camera.position.y = 17.6 + Math.sin(t * 0.16) * 0.55;
    camera.lookAt(0, 1.65, 0);

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
