import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const DATA_URL = "data/verifrax-observatory.json";
const ATTESTATION_URL = "data/projection-attestation.json";

const FULL = "FULL_OBSERVATORY";
const BLOCKED = "BLOCKED_PROJECTION";

const palette = {
  void: 0x02060b,
  basalt: 0x0b1118,
  metal: 0x1d2733,
  darkMetal: 0x101820,
  blue: 0x73d0ff,
  blueDeep: 0x1f7fff,
  cyan: 0xa6e7ff,
  red: 0xff4e3d,
  amber: 0xd3a84f,
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

function getContainer() {
  return document.getElementById("observatory-webgl-runtime");
}

function makeLabel(text, subtext = "", width = 512, height = 192) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(2, 7, 12, 0.78)";
  ctx.strokeStyle = "rgba(115, 208, 255, 0.64)";
  ctx.lineWidth = 3;
  roundRect(ctx, 10, 10, width - 20, height - 20, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ecf7ff";
  ctx.font = "700 42px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 - (subtext ? 22 : 0));

  if (subtext) {
    ctx.fillStyle = "#9ecce8";
    ctx.font = "500 25px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
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
  sprite.scale.set(width / 110, height / 110, 1);
  sprite.userData.canvasLabel = true;
  return sprite;
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

function assertManifest(manifest, attestation) {
  const errors = [];

  if (!manifest || typeof manifest !== "object") errors.push("manifest_missing");
  if (!attestation || typeof attestation !== "object") errors.push("attestation_missing");

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

function setSceneStatus(container, mode, message) {
  container.dataset.observatoryRuntime = mode;
  const status = container.querySelector("[data-runtime-status]");
  if (status) status.textContent = message;
}

function createMaterial(color, emissive = 0x000000, intensity = 0.0, roughness = 0.64, metalness = 0.75) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness,
    metalness
  });
}

function addRing(scene, radius, tube, color, y = 0.02) {
  const geometry = new THREE.TorusGeometry(radius, tube, 16, 192);
  const material = createMaterial(color, color, 0.08, 0.5, 0.8);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = y;
  scene.add(mesh);
  return mesh;
}

function polar(radius, angle, y = 0) {
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

function createRail(scene, from, to, color = palette.blue) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(0.035, 0.035, length, 12, 1, true);
  const material = createMaterial(color, color, 0.65, 0.35, 0.35);
  const mesh = new THREE.Mesh(geometry, material);
  const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  scene.add(mesh);
  return mesh;
}

function buildScene(container, manifest) {
  const width = container.clientWidth || 1400;
  const height = container.clientHeight || 760;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(palette.void, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const stage = container.querySelector("[data-runtime-stage]");
  stage.innerHTML = "";
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(palette.void, 0.024);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 300);
  camera.position.set(0, 25, 38);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0x9ecbff, 0.22);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xd8efff, 2.1);
  key.position.set(-12, 28, 22);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  scene.add(key);

  const coreLight = new THREE.PointLight(palette.blue, 12, 48, 1.7);
  coreLight.position.set(0, 5, 0);
  scene.add(coreLight);

  const redLight = new THREE.PointLight(palette.red, 5, 18, 2);
  redLight.position.set(0, 2.2, 14.5);
  scene.add(redLight);

  const floorGeometry = new THREE.CylinderGeometry(28, 28, 0.5, 192);
  const floorMaterial = createMaterial(palette.basalt, 0x02060b, 0.0, 0.88, 0.58);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.y = -0.28;
  floor.receiveShadow = true;
  scene.add(floor);

  addRing(scene, 6.2, 0.055, palette.blue, 0.12);
  addRing(scene, 11.6, 0.065, palette.blue, 0.13);
  addRing(scene, 17.6, 0.07, palette.blueDeep, 0.14);
  addRing(scene, 22.6, 0.08, palette.grey, 0.1);

  const chamberGroup = new THREE.Group();
  const repoGroup = new THREE.Group();
  const hostGroup = new THREE.Group();
  const labelsGroup = new THREE.Group();
  const selectable = [];
  scene.add(chamberGroup, repoGroup, hostGroup, labelsGroup);

  const coreBase = new THREE.Mesh(
    new THREE.CylinderGeometry(2.45, 2.8, 1.25, 64),
    createMaterial(palette.metal, palette.blue, 0.12, 0.52, 0.9)
  );
  coreBase.position.y = 0.62;
  coreBase.castShadow = true;
  scene.add(coreBase);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.85, 3),
    new THREE.MeshStandardMaterial({
      color: palette.cyan,
      emissive: palette.blue,
      emissiveIntensity: 1.35,
      roughness: 0.16,
      metalness: 0.1,
      transparent: true,
      opacity: 0.72
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

  const coreLabel = makeLabel("ACCEPTED TRUTH", "DERIVED PROJECTION");
  coreLabel.position.set(0, 1.38, 0.25);
  labelsGroup.add(coreLabel);

  const chamberRadius = 9.7;
  const chamberGeometry = new THREE.CylinderGeometry(1.75, 2.05, 2.25, 64);
  const chamberTopGeometry = new THREE.CylinderGeometry(2.1, 1.72, 0.44, 64);
  const chamberMaterial = createMaterial(palette.metal, palette.blue, 0.11, 0.58, 0.86);
  const chamberCapMaterial = createMaterial(palette.darkMetal, palette.blue, 0.06, 0.42, 0.94);

  const orderedChambers = chamberOrder
    .map((id) => manifest.chambers.find((chamber) => chamber.id === id))
    .filter(Boolean);

  orderedChambers.forEach((chamber, index) => {
    const angle = -Math.PI / 2 + (index / orderedChambers.length) * Math.PI * 2;
    const p = polar(chamberRadius, angle, 1.15);

    const body = new THREE.Mesh(chamberGeometry, chamberMaterial.clone());
    body.position.copy(p);
    body.castShadow = true;
    body.receiveShadow = true;

    const cap = new THREE.Mesh(chamberTopGeometry, chamberCapMaterial.clone());
    cap.position.set(p.x, p.y + 1.35, p.z);
    cap.castShadow = true;

    const group = new THREE.Group();
    group.add(body, cap);
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

    chamberGroup.add(group);
    selectable.push(group);

    const label = makeLabel(chamber.name, chamber.role, 560, 196);
    label.position.set(p.x, 3.25, p.z);
    labelsGroup.add(label);

    createRail(scene, new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(p.x * 0.8, 1.8, p.z * 0.8), palette.blue);
  });

  const repoRadius = 19.5;
  const repoGeometry = new THREE.BoxGeometry(0.65, 2.0, 0.65);
  const repoMaterial = createMaterial(palette.darkMetal, palette.blue, 0.22, 0.36, 0.9);
  const repoCount = manifest.repositories.length;
  const repoMesh = new THREE.InstancedMesh(repoGeometry, repoMaterial, repoCount);
  repoMesh.castShadow = true;
  repoMesh.receiveShadow = true;

  const repoDummy = new THREE.Object3D();
  manifest.repositories.forEach((repo, index) => {
    if (repo.name === "ADMISSORIUM") return;
    const angle = -Math.PI / 2 + (index / repoCount) * Math.PI * 2;
    const p = polar(repoRadius, angle, 1.0);
    repoDummy.position.copy(p);
    repoDummy.rotation.y = -angle;
    repoDummy.scale.set(1, repo.class === "sovereign-chamber" ? 1.25 : 1, 1);
    repoDummy.updateMatrix();
    repoMesh.setMatrixAt(index, repoDummy.matrix);
  });
  repoGroup.add(repoMesh);

  const repoLabel = makeLabel("35", "REPOSITORY PILLARS", 350, 160);
  repoLabel.position.set(0, 4.1, -19.6);
  labelsGroup.add(repoLabel);

  const hostRadius = 23.2;
  const hostGeometry = new THREE.BoxGeometry(1.0, 2.7, 0.48);
  const hostMaterial = createMaterial(palette.metal, palette.cyan, 0.12, 0.48, 0.82);

  manifest.hosts.forEach((host, index) => {
    const angle = -Math.PI / 2 + (index / manifest.hosts.length) * Math.PI * 2;
    const p = polar(hostRadius, angle, 1.35);
    const gate = new THREE.Mesh(hostGeometry, hostMaterial.clone());
    gate.position.copy(p);
    gate.lookAt(0, 1.35, 0);
    gate.castShadow = true;
    gate.userData = {
      id: host.id,
      name: host.host,
      visual_class: "host_gate",
      role: host.role,
      owner_repo: host.owner_repo,
      must_not_be: host.must_not_be,
      url: host.url
    };
    hostGroup.add(gate);
    selectable.push(gate);

    const label = makeLabel(host.label || host.id.toUpperCase(), "Boundary Gate", 360, 160);
    label.position.set(p.x, 3.45, p.z);
    labelsGroup.add(label);
  });

  const gateBase = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 3.2, 1.5),
    createMaterial(palette.darkMetal, palette.red, 0.14, 0.55, 0.88)
  );
  gateBase.position.set(0, 1.6, 14.35);
  gateBase.castShadow = true;
  gateBase.userData = {
    id: "admissorium",
    name: "ADMISSORIUM",
    visual_class: "front_gate",
    role: "admissibility enforcement implementation",
    warning: "truth_owner=false / sovereign_chamber=false"
  };
  scene.add(gateBase);
  selectable.push(gateBase);

  const gateLabel = makeLabel("ADMISSORIUM", "Constitutional Border Control", 640, 180);
  gateLabel.position.set(0, 4.05, 14.45);
  labelsGroup.add(gateLabel);

  const blockedLabel = makeLabel("CONTRADICTION DETECTED", "ENTRY DENIED", 540, 180);
  blockedLabel.position.set(0, 2.05, 16.0);
  labelsGroup.add(blockedLabel);

  const statusLabel = makeLabel("35 REPOSITORIES. ONE CONSTITUTIONAL MACHINE.", "OPEN TRUTH BELOW. ENTERPRISE CONTROL ABOVE.", 1200, 210);
  statusLabel.position.set(0, 2.6, 20.2);
  labelsGroup.add(statusLabel);

  const inspector = container.querySelector("[data-runtime-inspector]");
  function inspectObject(object) {
    const data = object.userData || {};
    if (!inspector) return;
    inspector.innerHTML = `
      <strong>${escapeHtml(data.name || data.id || "VERIFRAX OBJECT")}</strong>
      <span>${escapeHtml(data.visual_class || "projection_object")}</span>
      <p>${escapeHtml(data.role || data.question || "Bounded projection object.")}</p>
      <small>${escapeHtml(data.warning || data.repo || data.owner_repo || "DERIVED_PROJECTION / NOT_TRUTH_SOURCE")}</small>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  renderer.domElement.addEventListener("pointerdown", (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(selectable, true);
    if (hits.length) {
      let object = hits[0].object;
      while (object.parent && !object.userData?.id) object = object.parent;
      inspectObject(object);
    }
  });

  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    const orbit = t * 0.055;
    camera.position.x = Math.sin(orbit) * 31;
    camera.position.z = Math.cos(orbit) * 38;
    camera.position.y = 22 + Math.sin(t * 0.27) * 0.9;
    camera.lookAt(0, 1.1, 0);

    core.rotation.x += 0.003;
    core.rotation.y += 0.006;
    core.material.emissiveIntensity = 1.05 + Math.sin(t * 1.4) * 0.28;

    labelsGroup.children.forEach((label) => label.lookAt(camera.position));

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  const resize = () => {
    const nextWidth = container.clientWidth || width;
    const nextHeight = container.clientHeight || height;
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight);
  };

  window.addEventListener("resize", resize);

  inspectObject(core);

  return { scene, renderer, camera };
}

async function boot() {
  const container = getContainer();
  if (!container) return;

  setSceneStatus(container, "loading", "Loading signed projection data.");

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
      setSceneStatus(container, BLOCKED, `Blocked projection: ${errors.join(", ")}`);
      return;
    }

    setSceneStatus(container, FULL, "FULL_OBSERVATORY: real WebGL constitutional projection active.");
    buildScene(container, manifest);
  } catch (error) {
    setSceneStatus(container, BLOCKED, error instanceof Error ? error.message : String(error));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
