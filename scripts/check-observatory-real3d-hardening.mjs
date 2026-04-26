#!/usr/bin/env node
import fs from "node:fs";

const js = fs.readFileSync("assets/observatory-webgl-runtime.js", "utf8");
const css = fs.readFileSync("assets/surface.css", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const page404 = fs.readFileSync("404.html", "utf8");

function must(name, ok) {
  if (!ok) {
    console.error(`[OBSERVATORY_REAL3D_HARDENING_FAIL] ${name}`);
    process.exit(1);
  }
  console.log(`${name} PASS`);
}

must("real3d_runtime_marker", js.includes("VCO REAL3D ANTI TOY RUNTIME AUTHORITY"));
must("real3d_api_marker", js.includes("VCO_REAL3D_ANTI_TOY_RUNTIME_API"));
must("real3d_material_texture", js.includes("vcoMakeBrushedAuthorityTexture"));
must("real3d_scene_material_apply", js.includes("vcoApplyReal3DAntiToyAuthority"));
must("real3d_camera_fov", js.includes("PerspectiveCamera(33"));
must("real3d_shadow_depth", js.includes("shadowMap.enabled"));
must("real3d_fog_depth", js.includes("FogExp2"));
must("ctrlk_palette", js.includes("ctrlKey") && js.includes("metaKey") && js.includes("openCommandPalette"));
must("keyboard_dispatch", js.includes("ArrowRight") && js.includes("ArrowLeft") && js.includes("dispatchObjectIntent"));
must("artifact_journey_alive", js.includes("advanceJourney"));
must("viewport_css_marker", css.includes("VCO REAL3D VIEWPORT HARDENING"));
must("viewport_containment", css.includes("height:100svh") && css.includes("overflow:hidden"));
must("panel_containment", css.includes(".oc-bottom") && css.includes(".oc-right"));
must("double_https_repaired", !index.includes("https://https://") && !page404.includes("https://https://"));
must("render_permission_full", index.includes("FULL_OBSERVATORY") && page404.includes("FULL_OBSERVATORY"));
