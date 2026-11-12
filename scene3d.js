/* ==========================================================================
   DELTA — CINEMATIC 3D ENGINE (Three.js r128 + GSAP)
   - Uses the REAL project print-part STL files (embedded in stl_bundle.js)
   - Slide 3 hero: camera fly-through, exploded assembly, component highlight,
     UWB radio-wave propagation, distance-based safety-zone animation
   - Q&A Category 1: interactive CAD viewer with part chips + explode slider
   NOTE: part placement is for visualization (stacked by bounding box).
   Conveyor rail and wheels are schematic primitives and labelled as such.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof THREE === "undefined" || !window.DELTA_STL) {
    console.warn("[DELTA 3D] Three.js or STL bundle missing — 3D scenes disabled.");
    return;
  }

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  /* ---------------- STL cache: z-up mm -> y-up, centered XZ, bottom at y=0 -------------- */
  const geoCache = {};
  function b64ToBuf(b64) {
    const bin = atob(b64);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }
  function getGeo(key) {
    if (geoCache[key]) return geoCache[key];
    const g = new THREE.STLLoader().parse(b64ToBuf(window.DELTA_STL[key]));
    g.computeBoundingBox();
    const bb = g.boundingBox;
    g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -bb.min.z);
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    g.computeBoundingBox();
    const size = new THREE.Vector3();
    g.boundingBox.getSize(size);
    return (geoCache[key] = { geo: g, size });
  }

  /* ---------------- Labels (sprites) ---------------- */
  function makeLabel(text, color, {width = 512, fontSize = 40} = {}) {
    const c = document.createElement("canvas");
    c.width = width; c.height = 112;
    const x = c.getContext("2d");
    x.fillStyle = "rgba(6,10,18,0.86)";
    x.strokeStyle = color || "#00E5FF";
    x.lineWidth = 3;
    x.beginPath(); x.rect(4, 4, width - 8, 104); x.fill(); x.stroke();
    x.fillStyle = "#F8FAFC";
    x.font = `700 ${fontSize}px 'JetBrains Mono', monospace`;
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(text, width / 2, 58);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0 });
    const s = new THREE.Sprite(mat);
    s.scale.set(260, 57, 1);
    s.renderOrder = 10;
    return s;
  }

  /* ---------------- Stage (renderer + orbit rig) ---------------- */
  function Stage(container, opts) {
    opts = opts || {};
    this.container = container;
    this.parts = [];
    this.exposure = 1;
    this.ex = 0;
    this.autoSpin = false;
    this.userMoved = false;
    this.w = 0; this.h = 0;
    this.rig = { az: 0.55, el: 0.42, dist: 1650, tx: 0, ty: 60, tz: 20 };

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab;";
    container.style.position = "relative";
    container.insertBefore(r.domElement, container.firstChild);

    const sc = (this.scene = new THREE.Scene());
    sc.background = new THREE.Color(0x050911);
    if (opts.fog) sc.fog = new THREE.FogExp2(0x050911, 0.00042);
    this.camera = new THREE.PerspectiveCamera(36, 1, 5, 9000);

    sc.add(new THREE.AmbientLight(0xffffff, 0.42));
    sc.add(new THREE.HemisphereLight(0x9ecbff, 0x0a0f1a, 0.65));
    const dl = new THREE.DirectionalLight(0xffffff, 0.95);
    dl.position.set(700, 1100, 600);
    dl.castShadow = true;
    dl.shadow.mapSize.set(2048, 2048);
    const sh = dl.shadow.camera;
    sh.left = -900; sh.right = 900; sh.top = 900; sh.bottom = -900; sh.near = 100; sh.far = 3000;
    sc.add(dl);
    const rim = new THREE.PointLight(0x00e5ff, 0.7, 2600);
    rim.position.set(-700, 300, -600);
    sc.add(rim);

    this.applyRig();

    const el = r.domElement;
    let drag = false, px = 0, py = 0;
    el.addEventListener("pointerdown", (e) => {
      drag = true; px = e.clientX; py = e.clientY;
      el.style.cursor = "grabbing";
      this.autoSpin = false;
      if (this.onUserMove) this.onUserMove();
      gsap.killTweensOf(this.rig);
    });
    window.addEventListener("pointerup", () => { drag = false; el.style.cursor = "grab"; });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      this.rig.az -= (e.clientX - px) * 0.007;
      this.rig.el = Math.max(0.04, Math.min(1.5, this.rig.el + (e.clientY - py) * 0.006));
      px = e.clientX; py = e.clientY;
      this.applyRig();
    });
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (this.onUserMove) this.onUserMove();
      gsap.killTweensOf(this.rig);
      this.rig.dist = Math.max(120, Math.min(4200, this.rig.dist * (1 + e.deltaY * 0.0012)));
      this.applyRig();
    }, { passive: false });
  }

  Stage.prototype.applyRig = function () {
    const R = this.rig, c = this.camera;
    c.position.set(
      R.tx + R.dist * Math.cos(R.el) * Math.sin(R.az),
      R.ty + R.dist * Math.sin(R.el),
      R.tz + R.dist * Math.cos(R.el) * Math.cos(R.az)
    );
    c.lookAt(R.tx, R.ty, R.tz);
  };

  Stage.prototype.render = function () {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return false;
    if (w !== this.w || h !== this.h) {
      this.w = w; this.h = h;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
    if (this.autoSpin) { this.rig.az += 0.004; this.applyRig(); }
    this.renderer.toneMappingExposure = this.exposure;
    this.renderer.render(this.scene, this.camera);
    return true;
  };

  Stage.prototype.applyExplode = function () {
    this.parts.forEach((p) => {
      p.mesh.position.set(
        p.base.x + p.ex.x * this.ex,
        p.base.y + p.ex.y * this.ex,
        p.base.z + p.ex.z * this.ex
      );
    });
  };

  Stage.prototype.setFocus = function (list, dur) {
    dur = dur === undefined ? 0.7 : dur;
    this.parts.forEach((p) => {
      const on = !list || list.indexOf(p) >= 0;
      p.mats.forEach((m) => {
        m.transparent = true;
        gsap.to(m, { opacity: on ? 1 : 0.12, duration: dur, overwrite: true,
          onComplete: () => { if (on && !list) m.transparent = false; } });
        if (m.emissive) {
          gsap.to(m, { emissiveIntensity: (list && on) ? 0.35 : 0, duration: dur });
        }
      });
    });
  };

  Stage.prototype.clearParts = function () {
    this.parts.forEach((p) => {
      p.mesh.parent && p.mesh.parent.remove(p.mesh);
      p.mats.forEach((m) => m.dispose());
    });
    this.parts = [];
  };

  /* ---------------- Part helpers ---------------- */
  function newMat(color) {
    const m = new THREE.MeshStandardMaterial({ color, metalness: 0.28, roughness: 0.48 });
    m.emissive = new THREE.Color(0x00e5ff);
    m.emissiveIntensity = 0;
    return m;
  }
  function addStl(stage, group, tag, key, color, pos, ex, label) {
    const g = getGeo(key);
    const mat = newMat(color);
    const mesh = new THREE.Mesh(g.geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.position.copy(pos);
    group.add(mesh);
    const p = { mesh, mats: [mat], base: pos.clone(), ex: ex.clone(), tag, label, size: g.size };
    stage.parts.push(p);
    return p;
  }
  function addCustom(stage, group, tag, mesh, mats, pos, ex, label) {
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.position.copy(pos);
    group.add(mesh);
    const p = { mesh, mats, base: pos.clone(), ex: ex.clone(), tag, label, size: V3(0, 0, 0) };
    stage.parts.push(p);
    return p;
  }

  /* ---------------- Assembly builders (local coords, floor at y=0) ---------------- */
  function spokeTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "#1e293b"; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = "#e2e8f0"; x.lineWidth = 10;
    for (let i = 0; i < 4; i++) {
      x.beginPath(); x.moveTo(64, 64);
      x.lineTo(64 + 58 * Math.cos(i * Math.PI / 2), 64 + 58 * Math.sin(i * Math.PI / 2));
      x.stroke();
    }
    x.beginPath(); x.arc(64, 64, 14, 0, 6.3); x.fillStyle = "#00e5ff"; x.fill();
    return new THREE.CanvasTexture(c);
  }

  function buildAGV(stage, group) {
    const stand = addStl(stage, group, "agv", "s01", 0x475569, V3(0, 0, 0), V3(0, -0.01, 0), "S01 Free-Wheel Display Stand");
    const chassis = addStl(stage, group, "agv", "agv_n01", 0x1d4ed8, V3(0, 70, 0), V3(0, 70, 0), "N01 Chassis 120×160 mm");
    const cw = chassis.size.x;
    [["agv_n03", -1], ["agv_n04", 1]].forEach(([k, s]) => {
      const sz = getGeo(k).size;
      addStl(stage, group, "agv", k, 0x0ea5e9,
        V3(s * (cw / 2 - sz.x / 2), 70 - sz.y, 0), V3(s * 50, 25, 0), "N03/N04 Dual-TT Motor Cradle");
    });
    // Schematic drive wheels (R = 32.5 mm assumed from standard TT wheel; labelled schematic)
    const tex = spokeTexture();
    [-1, 1].forEach((s) => {
      const geo = new THREE.CylinderGeometry(32.5, 32.5, 22, 36);
      geo.rotateZ(Math.PI / 2);
      const mats = [
        newMat(0x111827),
        (function () { const m = newMat(0xffffff); m.map = tex; return m; })(),
        (function () { const m = newMat(0xffffff); m.map = tex; return m; })()
      ];
      const mesh = new THREE.Mesh(geo, mats);
      const p = addCustom(stage, group, "agv", mesh, mats, V3(s * 75.5, 17.5 + 32.5, 0), V3(s * 80, 10, 0), "Drive wheel (schematic)");
      p.isWheel = true;
      stage.wheels = stage.wheels || [];
      stage.wheels.push(mesh);
    });
    const a = addStl(stage, group, "agv", "agv_p01a", 0x00b8d4, V3(0, 75, 14), V3(0, 150, 0), "P01A Lower UWB Enclosure");
    addStl(stage, group, "agv", "agv_p01b", 0x10b981, V3(0, 75 + a.size.y, 14), V3(0, 270, 0), "P01B Upper Radio Tower");
  }

  function buildBelt(stage, group) {
    const back = addStl(stage, group, "belt", "belt_p06", 0x475569, V3(0, 0, 0), V3(0, 0, 0), "P06 Closed-Loop Backplate");
    const hous = addStl(stage, group, "belt", "belt_p01", 0x1d4ed8, V3(0, back.size.y, 0), V3(0, 70, 0), "P01 Belt Housing");
    addStl(stage, group, "belt", "belt_p02", 0x00e5ff, V3(0, back.size.y + hous.size.y, 0), V3(0, 150, 0), "P02 Front Cover (OLED)");
  }

  function buildAnchor(stage, group, tagName, [base, lid] = [0x1d4ed8, 0x00e5ff]) {
    const b = addStl(stage, group, tagName || "anchor", "anchor_p01", base, V3(0, 0, 0), V3(0, 0, 0), "P01 Anchor Base");
    addStl(stage, group, tagName || "anchor", "anchor_p02", lid, V3(0, b.size.y, 0), V3(0, 110, 0), "P02 Vented Lid");
  }

  function buildRelay(stage, group) {
    const b = addStl(stage, group, "conv", "relay_base", 0x1e3a8a, V3(0, 0, 0), V3(0, 0, 0), "R01 Relay Enclosure Base");
    addStl(stage, group, "conv", "relay_lid", 0x00e5ff, V3(0, b.size.y, 0), V3(0, 110, 0), "R01 Relay Enclosure Lid");
  }

  function beltTexture() {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 64;
    const x = c.getContext("2d");
    x.fillStyle = "#0f172a"; x.fillRect(0, 0, 256, 64);
    x.fillStyle = "#38bdf8";
    for (let i = 0; i < 8; i++) x.fillRect(i * 32 + 4, 6, 8, 52);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping; t.repeat.set(6, 1);
    return t;
  }

  function buildConveyor(stage, group) {
    // Schematic 450 mm rail (3 × 150 mm sections); brackets are the real KW11 STL parts.
    const frameMat = newMat(0x1e293b);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(450, 30, 80), frameMat);
    addCustom(stage, group, "conv", frame, [frameMat], V3(0, 15, 0), V3(0, 0, 0), "Conveyor rail 450 mm (schematic)");
    const bt = beltTexture();
    stage.beltTex = bt;
    const topMat = newMat(0xffffff); topMat.map = bt;
    const top = new THREE.Mesh(new THREE.BoxGeometry(446, 4, 62), topMat);
    addCustom(stage, group, "conv", top, [topMat], V3(0, 32, 0), V3(0, 40, 0), "Conveyor belt surface");
    [-1, 1].forEach((s) => {
      const rm = newMat(0x64748b);
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 70, 24), rm);
      roller.rotation.x = Math.PI / 2;
      addCustom(stage, group, "conv", roller, [rm], V3(s * 220, 26, 0), V3(s * 60, 0, 0), "End roller (schematic)");
    });
    [["conv_p01", -1], ["conv_p02", 1]].forEach(([k, s]) => {
      addStl(stage, group, "conv", k, 0xf59e0b, V3(s * 150, 30, 50), V3(0, 20, 70), k === "conv_p01" ? "KW11 Base Bracket P01" : "KW11 Carrier P02");
    });
  }

  function makeFloor(stage, w, d) {
    const fm = new THREE.MeshStandardMaterial({ color: 0x0b1424, metalness: 0.4, roughness: 0.75 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 16, d), fm);
    floor.position.y = -8; floor.receiveShadow = true;
    stage.scene.add(floor);
    const grid = new THREE.GridHelper(Math.max(w, d), Math.round(Math.max(w, d) / 50), 0x00e5ff, 0x1e3a5f);
    grid.position.y = 0.4;
    grid.material.transparent = true; grid.material.opacity = 0.32;
    stage.scene.add(grid);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(floor.geometry), new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.55 }));
    edges.position.copy(floor.position);
    stage.scene.add(edges);
  }

  function camTween(stage, kf, dur, ease) {
    return Object.assign({}, kf, { duration: dur, ease: ease || "power2.inOut", onUpdate: () => stage.applyRig() });
  }
  function setRig(stage, kf) { Object.assign(stage.rig, kf); stage.applyRig(); }

  /* ======================================================================
     Q&A CAD VIEWER (Category 1)
     ====================================================================== */
  const qa = { stage: null, id: "agv_r20", wire: false, chips: null, active: null, group: null };

  function buildQaModel() {
    const s = qa.stage; if (!s) return;
    s.setFocus(null, 0);
    s.clearParts();
    s.wheels = [];
    if (qa.group) s.scene.remove(qa.group);
    const g = (qa.group = new THREE.Group());
    s.scene.add(g);
    switch (qa.id) {
      case "belt_r18a": buildBelt(s, g); break;
      case "anchor_r05": buildAnchor(s, g, "anchor"); break;
      case "conveyor_450": buildConveyor(s, g); break;
      case "relay_r01": buildRelay(s, g); break;
      case "booth_layout": {
        const a = new THREE.Group(); a.position.set(-300, 0, -20); g.add(a); buildAGV(s, a);
        const b = new THREE.Group(); b.position.set(0, 0, 150); g.add(b); buildBelt(s, b);
        const c = new THREE.Group(); c.position.set(200, 0, -90); g.add(c); buildConveyor(s, c);
        const r = new THREE.Group(); r.position.set(330, 0, 150); g.add(r); buildRelay(s, r);
        [[-500, -280], [500, -280], [500, 280], [-500, 280]].forEach(([x, z]) => {
          const an = new THREE.Group(); an.position.set(x, 0, z); g.add(an); buildAnchor(s, an, "anchor");
        });
        break;
      }
      default: buildAGV(s, g); // agv_r20 & stand_s01
    }
    s.parts.forEach((p) => p.mats.forEach((m) => { m.wireframe = qa.wire; }));
    s.applyExplode();
    const box = new THREE.Box3().setFromObject(g);
    const size = new THREE.Vector3(), ctr = new THREE.Vector3();
    box.getSize(size); box.getCenter(ctr);
    const maxDim = Math.max(size.x, size.y, size.z);
    Object.assign(s.rig, { az: 0.6, el: 0.35, dist: maxDim * 2.2, tx: ctr.x, ty: ctr.y, tz: ctr.z });
    s.applyRig();
    buildChips();
    if (qa.id === "stand_s01") highlightPart(s.parts[0]);
  }

  function buildChips() {
    const s = qa.stage;
    if (!qa.chips) {
      qa.chips = document.createElement("div");
      qa.chips.style.cssText = "position:absolute;left:8px;right:8px;bottom:8px;display:flex;flex-wrap:wrap;gap:5px;z-index:3;max-height:84px;overflow:auto;";
      s.container.appendChild(qa.chips);
    }
    qa.chips.innerHTML = "";
    qa.active = null;
    const seen = {};
    s.parts.forEach((p) => {
      if (!p.label || seen[p.label]) return;
      seen[p.label] = true;
      const b = document.createElement("button");
      b.className = "stage-btn";
      b.style.cssText = "font-size:10.5px;padding:3px 8px;";
      b.textContent = p.label;
      b.addEventListener("click", () => highlightPart(p, b));
      qa.chips.appendChild(b);
    });
  }

  function highlightPart(p, btn) {
    const s = qa.stage;
    if (qa.active === p.label) { qa.active = null; s.setFocus(null); qa.chips.querySelectorAll("button").forEach((b) => b.classList.remove("active")); return; }
    qa.active = p.label;
    s.setFocus(s.parts.filter((x) => x.label === p.label));
    qa.chips.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.textContent === p.label));
  }

  /* ---------------- Public API patch (replaces old procedural viewer) ---------------- */
  const C = window.DELTA_CANVASES || (window.DELTA_CANVASES = {});
  C.initThreeCadViewer = function () {
    const container = document.getElementById("qa-three-stage");
    if (!container) return;
    if (!qa.stage) {
      container.innerHTML = "";
      qa.stage = new Stage(container, {});
      makeFloor(qa.stage, 1300, 800);
      qa.stage.autoSpin = true;
    }
    buildQaModel();
  };
  C.selectCadModel = function (id) { qa.id = id; if (qa.stage) buildQaModel(); };
  C.updateThreeExplode = function (v) { if (qa.stage) { qa.stage.ex = parseFloat(v) || 0; qa.stage.applyExplode(); } };
  C.toggleThreeWireframe = function () {
    qa.wire = !qa.wire;
    if (qa.stage) qa.stage.parts.forEach((p) => p.mats.forEach((m) => { m.wireframe = qa.wire; }));
  };
  C.toggleThreeAutoRotate = function () { if (qa.stage) qa.stage.autoSpin = !qa.stage.autoSpin; };


  // One renderer and one factory set across the narrative slides.
  const story = {
    stage: null, slide: 0, elapsed: 0, factory: null, sensing: null, booth: null,
    failed: false, tween: null
  };
  const sensingPlay = document.querySelector("[data-sensing-play]");
  const smooth = THREE.MathUtils.smoothstep;
  const darkFloor = new THREE.Color(0x101b2b);
  const darkWall = new THREE.Color(0x111c28);
  const lerp = THREE.MathUtils.lerp;
  const cyan = 0x32ddff, red = 0xff4856;
  const storyViews = {
    opening: { az: 0.26, el: 0.72, dist: 1490, tx: 220, ty: 42, tz: -72 },
    future: { az: 0.19, el: 0.70, dist: 1810, tx: 750, ty: 36, tz: -85 },
    controlRoom: { az: 0.09, el: 0.51, dist: 1090, tx: 1185, ty: 74, tz: -192 },
    compare: { az: 0.08, el: 1.10, dist: 1660, tx: 0, ty: 90, tz: 0 },
    booth: { az: 0.07, el: 0.68, dist: 1210, tx: 0, ty: 56, tz: 0 },
    closing: { az: -0.42, el: 0.64, dist: 2480, tx: 0, ty: 40, tz: 0 }
  };

  function modelBox(parent, size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function modelCylinder(parent, r1, r2, height, position, material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, height, 20), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function meshGroup(parent, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    parent.add(group);
    return group;
  }

  function lightMaterial(color, opacity = 1) {
    return new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1, depthWrite: opacity === 1, toneMapped: false });
  }

  function storyLine(parent, a, b, color, opacity = 1) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([a, b]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false })
    );
    parent.add(line);
    return line;
  }

  function setStoryStatus(element, message, state = "info") {
    if (element.textContent !== message) element.textContent = message;
    if (element.dataset.state !== state) element.dataset.state = state;
  }

  function moveLine(line, a, b) {
    const p = line.geometry.attributes.position;
    p.setXYZ(0, a.x, a.y, a.z);
    p.setXYZ(1, b.x, b.y, b.z);
    p.needsUpdate = true;
    line.frustumCulled = false;
  }

  function floorRing(parent, x, z, radius, color, width = 3) {
    const material = lightMaterial(color, 0.65);
    material.side = THREE.DoubleSide;
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius - width, radius, 64), material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 1.5, z);
    parent.add(ring);
    return ring;
  }

  function makeWorker(parent, vestColor = 0xf8a445) {
    const root = meshGroup(parent, 0, 0, 0);
    const vest = newMat(vestColor), uniform = newMat(0x3f6580);
    const skin = newMat(0xd6a484), helmet = newMat(0xffca46), boot = newMat(0x24313b);
    modelBox(root, [54, 62, 29], [0, 110, 0], vest);
    modelBox(root, [55, 6, 30], [0, 97, 0], newMat(0xf4e8c6));
    modelCylinder(root, 15, 14, 24, [0, 153, 0], skin);
    modelCylinder(root, 17, 18, 10, [0, 170, 0], helmet);
    modelCylinder(root, 20, 20, 3, [0, 165, 0], helmet);
    const limbs = [-1, 1].map(side => {
      const leg = meshGroup(root, side * 14, 79, 0);
      modelBox(leg, [18, 69, 22], [0, -34, 0], uniform);
      modelBox(leg, [20, 11, 32], [0, -73, 6], boot);
      const arm = meshGroup(root, side * 34, 130, 0);
      modelBox(arm, [13, 49, 15], [0, -23, 0], uniform);
      modelBox(arm, [13, 11, 14], [0, -51, 0], skin);
      return { leg, arm };
    });
    return { root, limbs };
  }

  function walkWorker(worker, x, z, angle, step) {
    worker.root.position.set(x, Math.abs(step) * 2.5, z);
    worker.root.rotation.y = angle;
    worker.limbs.forEach(({leg, arm}, i) => {
      leg.rotation.x = step * (i ? 1 : -1);
      arm.rotation.x = -leg.rotation.x * 0.68;
    });
  }

  function makeFactoryAGV(parent, color) {
    const root = meshGroup(parent, 0, 0, 0);
    const shell = newMat(color), tire = newMat(0x111b26), trim = newMat(0x698293);
    modelBox(root, [124, 36, 174], [0, 28, 0], shell);
    modelBox(root, [95, 17, 126], [0, 52, -5], trim);
    modelBox(root, [70, 3, 4], [0, 41, 88], lightMaterial(0xc4ebff));
    for (const side of [-1, 1]) {
      for (const z of [-53, 54]) {
        modelCylinder(root, 22, 22, 17, [side * 62, 22, z], tire).rotation.z = Math.PI / 2;
        modelCylinder(root, 9, 9, 18, [side * 63, 22, z], trim).rotation.z = Math.PI / 2;
      }
    }
    return root;
  }

  function makeRack(parent, x, z) {
    const frame = newMat(0x48617a), shelf = newMat(0x253647), carton = newMat(0xbb8a55);
    const rack = meshGroup(parent, x, 0, z);
    for (const dx of [-151, 151]) {
      for (const dz of [-57, 57]) modelBox(rack, [9, 232, 9], [dx, 116, dz], frame);
    }
    for (const y of [34, 102, 170]) {
      modelBox(rack, [306, 8, 115], [0, y, 0], shelf);
      for (let i = -1; i <= 1; i++) {
        modelBox(rack, [79, 46, 75], [i * 92, y + 26, 2], carton);
        modelBox(rack, [15, 46.5, 75.5], [i * 92, y + 26, 2], newMat(0x946941));
      }
    }
    return rack;
  }

  function makeRobot(parent, x, z) {
    const root = meshGroup(parent, x, 0, z);
    const frame = newMat(0x596d83), paint = newMat(0xe0a44c), joint = newMat(0x2b3948);
    modelBox(root, [103, 34, 102], [0, 17, 0], frame);
    modelCylinder(root, 32, 40, 24, [0, 46, 0], joint);
    const turn = meshGroup(root, 0, 55, 0);
    const arm = meshGroup(turn, 0, 0, 0);
    modelBox(arm, [27, 83, 29], [0, 44, 0], paint);
    modelCylinder(arm, 16, 16, 34, [0, 81, 0], joint).rotation.z = Math.PI / 2;
    const elbow = meshGroup(arm, 0, 81, 0);
    elbow.rotation.x = Math.PI / 3;
    modelBox(elbow, [20, 69, 24], [0, 31, 0], paint);
    modelBox(elbow, [42, 12, 19], [0, 68, 0], joint);
    return { root, turn, arm, elbow };
  }


  function makeControlDisplay(parent, x, y, z, width, height, label) {
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 384;
    screenCanvas.height = 192;
    const ctx = screenCanvas.getContext("2d");
    const texture = new THREE.CanvasTexture(screenCanvas);
    const material = lightMaterial(0xffffff);
    material.map = texture;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    screen.position.set(x, y, z);
    parent.add(screen);
    let last = "";
    return (status, color) => {
      if (last === status) return;
      last = status;
      ctx.fillStyle = "#101e2c";
      ctx.fillRect(0, 0, 384, 192);
      ctx.fillStyle = "#193448";
      ctx.fillRect(0, 0, 384, 46);
      ctx.font = "bold 24px Consolas";
      ctx.fillStyle = "#d0e6f5";
      ctx.fillText(label, 17, 31);
      ctx.fillStyle = color;
      ctx.font = "bold 29px Consolas";
      ctx.fillText(status, 16, 91);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = "#2c4b61";
        ctx.fillRect(18 + i * 71, 119, 54, 38);
        ctx.fillStyle = color;
        ctx.fillRect(24 + i * 71, 130, 14 + i * 4, 4);
      }
      texture.needsUpdate = true;
    };
  }

  function makeControlRoom(parent, fieldOutput) {
    const root = meshGroup(parent, 0,0,0);
    const floor = newMat(0x3a5060), wall = newMat(0x536b7f);
    const frame = newMat(0x263c4f), shell = newMat(0x566b7c), rail = newMat(0x93afbd);
    const wood = newMat(0x688294);
    const floorLines = lightMaterial(0x506a7c);
    modelBox(root, [660,34,388], [1355,-17,-305], floor);
    modelBox(root, [660,236,22], [1355,118,-491], wall);
    modelBox(root, [20,236,285], [1675,118,-356], wall);
    modelBox(root, [650,11,8], [1355,227,-477], rail);
    modelBox(root, [13,45,302], [1035,22.5,-339], frame);
    for (const x of [1100,1225,1350,1475,1600]) modelBox(root,[1.5,1,375],[x,0.6,-305],floorLines);
    for (const z of [-435,-335,-235,-135]) modelBox(root,[647,1,1.5],[1355,0.6,z],floorLines);
    const roomLabel = makeLabel("CONTROL ROOM","#9de8ff",{width:384,fontSize:49});
    roomLabel.material.opacity = 1;
    roomLabel.scale.set(300,87,1);
    roomLabel.position.set(1355,258,-478);
    root.add(roomLabel);

    // Each connection ends on the front panel or display of a specific 3D device.
    const nodes = [V3(1160,109,-296), V3(1267,113,-287), V3(1429,128,-275), V3(1570,128,-313)];
    const indicators = nodes.map(node => modelCylinder(root, 6,6,7,[node.x,node.y-10,node.z+3],lightMaterial(0x5c788c)));
    const desk = (x, width) => {
      modelBox(root,[width,10,76],[x,75,-314],wood);
      for (const dx of [-width/2+8,width/2-8]) {
        modelBox(root,[7,73,66],[x+dx,36.5,-315],frame);
      }
    };
    const monitor = (x, width, label) => {
      modelBox(root,[22,22,19],[x,94,-321],frame);
      modelBox(root,[width,55,11],[x,127,-320],frame);
      return makeControlDisplay(root,x,127,-314,width-7,48,label);
    };

    desk(1115,124);
    const aiDisplay = monitor(1102,75,"AI / MCP");
    modelBox(root,[24,57,37],[1160,107,-316],frame);
    for (const y of [96,105,114]) modelBox(root,[16,2,1],[1160,y,-296],rail);
    modelBox(root,[48,3,16],[1103,82,-286],frame);
    modelBox(root,[8,3,11],[1137,82,-285],shell);

    modelBox(root,[94,150,59],[1267,75,-323],frame);
    for (const y of [38,62,87,112,136]) {
      modelBox(root,[82,18,4],[1267,y,-291],shell);
      for (const x of [1241,1251,1261,1271]) modelBox(root,[6,5,2],[x,y,-288],frame);
      modelBox(root,[10,4,2],[1296,y,-288],lightMaterial(0x7dabbf));
    }
    const gatewayDisplay = makeControlDisplay(root,1267,174,-289,89,44,"GATEWAY");

    modelBox(root,[103,162,61],[1421,81,-324],shell);
    modelBox(root,[91,118,4],[1421,90,-291],frame);
    modelBox(root,[79,6,4],[1421,116,-287],rail);
    for (const x of [1391,1410,1429,1448]) {
      modelBox(root,[17,49,9],[x,113,-282],wood);
      for (const y of [98,105,121,128]) modelBox(root,[10,3,2],[x,y,-276],frame);
    }
    const plcDisplay = makeControlDisplay(root,1421,174,-285,95,44,"PLC");

    desk(1570,135);
    const scadaDisplay = monitor(1570,116,"SCADA");
    modelBox(root,[67,3,17],[1570,82,-284],frame);
    modelBox(root,[12,3,12],[1616,82,-284],shell);
    const displays = [aiDisplay,gatewayDisplay,plcDisplay,scadaDisplay];
    const equipment = displays.map((display,i) => ({display, lamp:indicators[i]}));

    const edges = nodes.map(point => storyLine(root,point,point,0x6be9ff,0.82));
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(10,16,12),lightMaterial(0xa6faff));
    root.add(pulse);
    const stationLink = storyLine(root,nodes[2],fieldOutput,0x55eda5,0.84);
    const stationBeacon = modelCylinder(root,10,10,17,fieldOutput.toArray(),lightMaterial(0x55eda5));
    const focusLight = new THREE.PointLight(0x6be9ff, 0, 170);
    root.add(focusLight);
    root.visible = false;
    return {root,nodes,equipment,edges,pulse,stationLink,stationBeacon,focusLight};
  }

  function makeFactory(parent) {
    const root = meshGroup(parent, 0, 0, 0);
    const ground = newMat(0x33465a), column = newMat(0x536777), wall = newMat(0x263745);
    modelBox(root, [2050, 38, 1160], [0, -19, 0], ground);
    modelBox(root, [2010, 400, 30], [0, 200, -575], wall);
    modelBox(root, [32, 400, 1140], [-1010, 200, -15], wall);
    for (const x of [-960, -510, -60, 390, 840]) {
      modelBox(root, [28, 410, 41], [x, 205, -545], column);
      const span = x < 840 ? 338 : 129;
      modelBox(root, [span, 99, 8], [x + span / 2 + 16, 288, -553], lightMaterial(0x54788b));
      for (const fraction of [0.25,0.5,0.75]) modelBox(root, [5, 100, 12], [x + span * fraction + 16, 288, -548], wall);
    }
    const seam = lightMaterial(0x42586e);
    for (let x = -750; x < 1000; x += 250) modelBox(root, [2, 1, 1110], [x, 0.3, 0], seam);
    for (let z = -400; z < 510; z += 200) modelBox(root, [1990, 1, 2], [0, 0.3, z], seam);
    const stripe = lightMaterial(0xd5ad57);
    for (const z of [-70, 272]) modelBox(root, [1750, 1, 5], [30, 1, z], stripe);
    for (let x = -800; x < 920; x += 120) modelBox(root, [66, 1, 4], [x, 1, 101], lightMaterial(0xaec0ca));
    const crossing = lightMaterial(0x8194a4);
    for (let z = -42; z < 253; z += 31) modelBox(root, [113, 1.2, 13], [-40, 1, z], crossing);
    makeRack(root, -705, -420);
    makeRack(root, -340, -420);
    const conveyor = meshGroup(root, 415, 42, -265);
    const hardware = { parts: [] };
    buildConveyor(hardware, conveyor);
    conveyor.scale.set(1.45, 1.45, 1.45);
    for (const x of [-198, 198]) for (const z of [-43, 43]) {
      modelBox(root, [14, 42, 13], [415 + x, 21, -265 + z], column);
    }
    const pallets = [0, 1, 2].map(() => modelBox(root, [78, 47, 60], [0, 111, -265], newMat(0xb8844b)));
    const robots = [makeRobot(root, 242, -410), makeRobot(root, 590, -402)];
    const agv = makeFactoryAGV(root, 0x3f9ed5);
    const agv2 = makeFactoryAGV(root, 0x3286c8);
    const worker = makeWorker(root, 0xf06032);
    const cabinet = meshGroup(root, 746, 0, -273);
    modelBox(cabinet, [81, 130, 59], [0,65,0], newMat(0x627482));
    modelBox(cabinet, [50, 36, 2], [0,96,30], newMat(0x142737));
    modelCylinder(cabinet, 9, 9, 12, [0,137,0], lightMaterial(0x6dc89e));
    const network = meshGroup(root, 0, 0, 0);
    const anchors = [[-868, -475], [868, -475], [868, 480], [-868, 480]].map(([x,z]) => {
      modelCylinder(network, 4, 7, 108, [x, 54, z], column);
      const dot = modelBox(network, [35, 14, 31], [x, 112, z], lightMaterial(cyan));
      floorRing(network, x, z, 45, cyan);
      return dot.position.clone();
    });
    const hub = V3(746, 145, -273);
    const links = anchors.map(point => storyLine(network, point, hub, cyan, 0.6));
    links.push(storyLine(network, hub, V3(0, 65, 0), cyan, 0.7));
    links.push(storyLine(network, hub, V3(0, 65, 0), cyan, 0.7));
    const packets = links.map(() => modelCylinder(network, 4, 4, 8, [0,0,0], lightMaterial(0x9df5ff)));
    const lane = storyLine(network, V3(-850, 3, 101), V3(875, 3, 101), cyan, 0.8);
    const scenarios = meshGroup(root, 0, 0, 0);
    const automatic = meshGroup(scenarios, 0, 0, 0);
    const guide = lightMaterial(0x56e8ff);
    const laneZ = 101, dockX = 560, dockZ = -125;
    modelBox(automatic, [1730, 1, 7], [77, 2, laneZ], guide);
    const guideBranch = modelBox(automatic, [7, 1, laneZ - dockZ], [dockX, 2, (laneZ + dockZ) / 2], guide);
    const dockPaint = lightMaterial(0x56e8ff, 0.58);
    for (const x of [dockX - 76, dockX + 76]) modelBox(automatic,[4,1,143],[x,1.6,dockZ],dockPaint);
    const cobot = makeRobot(scenarios, 680, -183);
    const cobotLabel = makeLabel("COBOT", "#6de9ff");
    cobotLabel.material.opacity = 1;
    cobotLabel.scale.set(119,26,1);
    cobotLabel.position.set(716,204,-168);
    scenarios.add(cobotLabel);
    const cargo = meshGroup(automatic, 0,0,0);
    modelBox(cargo, [53,41,52], [0,0,0], newMat(0xe3a04d));
    modelBox(cargo, [13,1,52], [0,21,0], newMat(0xf9e5bc));
    const service = meshGroup(scenarios, 0, 0, 0);
    const serviceRail = meshGroup(service, 0, 0, 0);
    const pathPaint = lightMaterial(0x54cbaa, 0.31), railPaint = newMat(0xf7b94d);
    modelBox(service, [217,1,65], [850,1.6,-180], pathPaint);
    for (const x of [745,815,885,955]) {
      modelBox(serviceRail, [8,83,8], [x,41,-141], railPaint);
    }
    for (const y of [45,77]) modelBox(serviceRail, [215,7,7], [850,y,-141], railPaint);
    const serviceRing = floorRing(service, 759, -180, 37, 0xffb245, 5);
    const panel = newMat(0x4b6175);
    modelBox(service, [17,113,37], [727,56.5,-180], panel);
    modelBox(service, [2,22,25], [736,91,-180], lightMaterial(0xe6a741));
    const accessLabel = makeLabel("SERVICE ACCESS", "#6ce6c0");
    accessLabel.material.opacity = 1;
    accessLabel.scale.set(200,44,1);
    accessLabel.position.set(867,112,-182);
    service.add(accessLabel);

    const loading = meshGroup(scenarios, 0, 0, 0);
    const loadingBay = { x: 894, z: -265 };
    modelBox(loading, [1730, 1, 7], [77, 2, laneZ], guide);
    const bayPaint = lightMaterial(0xffbd65, 0.86), rollerPaint = newMat(0x647b94);
    for (const x of [788,965]) modelBox(loading, [5,1,157], [x,1.6,-265], bayPaint);
    for (const z of [-343,-187]) modelBox(loading, [181,1,5], [876,1.6,z], bayPaint);
    const loadingLabel = makeLabel("LOADING ZONE", "#7de8ff");
    loadingLabel.material.opacity = 1;
    loadingLabel.scale.set(205,45,1);
    loadingLabel.position.set(870,26,-120);
    loading.add(loadingLabel);
    modelBox(loading, [83,12,103], [777,63,-265], rollerPaint);
    for (const x of [743,758,773,788,803,818]) {
      const roller = modelCylinder(loading, 7,7,94,[x,76,-265],rollerPaint);
      roller.rotation.x = Math.PI / 2;
    }
    const parcel = meshGroup(loading, 408,0,-265);
    const carton = newMat(0xe99a41), tape = newMat(0xf7e4bd);
    modelBox(parcel, [66,49,59], [0,113,0], carton);
    modelBox(parcel, [12,1,59], [0,138,0], tape);
    modelBox(parcel, [1,10,32], [33.5,117,0], tape);
    const handoff = floorRing(loading, 790, -265, 63, 0xffb245, 6);
    const tracking = meshGroup(root, 0, 0, 0);
    const trackedDock = floorRing(tracking, dockX, dockZ, 89, cyan, 5);
    const virtualWaypoints = meshGroup(tracking, 0,0,0);
    for (let z = -115; z <= 93; z += 26) {
      modelCylinder(virtualWaypoints, 7, 7, 2, [dockX,2,z], lightMaterial(0x71e9ae));
    }
    const trackedTags = [
      {mount: meshGroup(agv, -38,62,-36), label: "TAG AGV", color: cyan, outline: "#32ddff", lift: 100},
      {mount: meshGroup(worker.root, -25,85,9), label: "TAG Belt", color: 0x76edb3, outline: "#76edb3", lift: 133}
    ].map(tag => {
      modelBox(tag.mount, [28, 13, 22], [0,0,0], newMat(0x172c40));
      modelBox(tag.mount, [21, 3, 17], [0,8,0], lightMaterial(tag.color));
      const caption = makeLabel(tag.label, tag.outline, {width: 310, fontSize: 64});
      caption.material.opacity = 1;
      caption.scale.set(192, 69, 1);
      tracking.add(caption);
      return {...tag, caption, point: V3(0,0,0),
        leader: storyLine(tracking,V3(0,0,0),V3(0,0,0),tag.color,0.85),
        ranges: anchors.map(point => storyLine(tracking,point,V3(0,0,0),tag.color,0.44))};
    });
    const future = makeControlRoom(root, V3(595,124,-254));
    tracking.visible = false;
    scenarios.visible = false;
    network.visible = false;
    return { root, ground, wall, agv, agv2, worker, network, anchors, hub, links, packets, lane, pallets, robots,
      scenarios, automatic, guideBranch, cobot, cobotLabel, cargo, laneZ, dockX, dockZ, service, serviceRail, serviceRing, accessLabel,
      loading, loadingBay, loadingLabel, parcel, handoff,
      tracking, trackedTags, trackedDock, virtualWaypoints, future, belt: hardware.beltTex };
  }

  function makeSensing(parent) {
    const root = meshGroup(parent, 0, 0, 0);
    modelBox(root, [920, 26, 820], [0,-13,0], newMat(0x324858));
    const boundary = lightMaterial(0x536c81);
    for (const x of [-420,420]) modelBox(root, [3,1,730], [x,1,0], boundary);
    for (const z of [-365,365]) modelBox(root, [840,1,3], [0,1,z], boundary);
    const rack = makeRack(root, 0, 0);
    rack.rotation.y = Math.PI / 2;
    const agv = makeFactoryAGV(root, 0x5b93ba);
    agv.scale.setScalar(0.72);
    const route = new THREE.CatmullRomCurve3([
      V3(-212, 0, 216), V3(-212, 0, 0), V3(-212, 0, -232),
      V3(-286, 0, -282), V3(-347, 0, -205), V3(-347, 0, 0),
      V3(-347, 0, 205), V3(-281, 0, 275)
    ], true);
    const routeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(route.getPoints(120).map(p => p.setY(2))),
      new THREE.LineDashedMaterial({color: 0x9ab8ce, dashSize: 12, gapSize: 9, transparent: true, opacity: 0.66})
    );
    routeLine.computeLineDistances();
    root.add(routeLine);

    const worker = makeWorker(root);
    walkWorker(worker, 220, -123, -0.38, 0);
    worker.root.scale.setScalar(0.87);
    const optical = meshGroup(root, 0, 0, 0);
    const amber = 0xffcb73;
    const scanner = meshGroup(agv, 0, 65, 33);
    modelCylinder(scanner, 19, 19, 10, [0, 0, 0], newMat(0x172c40));
    modelCylinder(scanner, 14, 14, 3, [0, 6, 0], lightMaterial(amber));
    const sensorPoint = meshGroup(scanner, 0, 2, 0);
    const roomBox = new THREE.Box3(V3(-419, 0, -364), V3(419, 260, 364));
    const rackBox = new THREE.Box3(V3(-62, 0, -156), V3(62, 232, 156));
    const workerBox = new THREE.Box3(V3(204, 0, -135), V3(236, 140, -111));
    const rays = Array.from({length: 72}, () => storyLine(optical, V3(0,0,0), V3(0,0,0), amber));
    const sight = storyLine(optical, V3(0,0,0), V3(0,0,0), red, 0.95);
    const sweep = storyLine(optical, V3(0,0,0), V3(0,0,0), amber, 1);
    const hitPoint = modelCylinder(optical, 5, 5, 4, [0,0,0], lightMaterial(amber));
    const workerRing = floorRing(optical, 220, -123, 33, red, 4);
    const shadow = new THREE.Mesh(new THREE.BufferGeometry(), lightMaterial(red, 0.23));
    shadow.material.side = THREE.DoubleSide;
    const shadowEdges = Array.from({length: 145}, () => ({hit: V3(0,0,0), edge: V3(0,0,0), blocked: false}));
    shadow.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(144 * 18), 3).setUsage(THREE.DynamicDrawUsage));
    shadow.frustumCulled = false;
    optical.add(shadow);

    const radio = meshGroup(root, 0, 0, 0);
    const green = 0x76edb3;
    const agvTag = meshGroup(agv, -13, 65, -29);
    const beltTag = meshGroup(worker.root, 24, 84, 12);
    const tags = [
      {mount: agvTag, caption: "TAG AGV", color: cyan, outline: "#32ddff", lift: 61},
      {mount: beltTag, caption: "TAG Belt", color: green, outline: "#76edb3", lift: 88}
    ];
    tags.forEach(tag => {
      modelBox(tag.mount, [23, 10, 19], [0,0,0], newMat(0x172c40));
      modelBox(tag.mount, [17, 2, 13], [0,6,0], lightMaterial(tag.color));
      tag.point = V3(0,0,0);
      tag.label = makeLabel(tag.caption, tag.outline, {width: 310, fontSize: 64});
      tag.label.material.opacity = 1;
      tag.label.scale.set(144, 52, 1);
      radio.add(tag.label);
      tag.leader = storyLine(radio, tag.point, tag.point, tag.color, 0.76);
      tag.links = [];
    });

    const column = newMat(0x41566b), enclosure = newMat(0x294057);
    const anchors = [[-420,-365], [420,-365], [420,365], [-420,365]].map(([x,z], i) => {
      const dx = Math.sign(x), dz = Math.sign(z);
      // Wall/ceiling corners shown as a cutaway so all four mounts are visible.
      modelBox(radio, [17, 270, 17], [x,135,z], column);
      modelBox(radio, [92, 15, 16], [x - dx * 43,266,z], column);
      modelBox(radio, [16, 15, 92], [x,266,z - dz * 43], column);
      const bracket = meshGroup(radio, x, 235, z);
      bracket.rotation.y = Math.atan2(-dx, -dz);
      modelBox(bracket, [32, 32, 7], [0,0,2], column);
      modelBox(bracket, [14, 12, 28], [0,0,15], column);
      modelBox(bracket, [37, 26, 20], [0,0,34], enclosure);
      modelBox(bracket, [23, 13, 2], [0,0,45], lightMaterial(cyan));
      const point = V3(x - dx * 32, 235, z - dz * 32);
      const label = makeLabel(`A${i + 1}`, "#32ddff", {width: 146, fontSize: 64});
      label.material.opacity = 1;
      label.scale.set(58, 44, 1);
      label.position.set(x - dx * 24, 295, z - dz * 25);
      radio.add(label);
      tags.forEach(tag => {
        const line = storyLine(radio, point, point, tag.color, 0.5);
        const pulse = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 8), lightMaterial(tag.color));
        radio.add(pulse);
        tag.links.push({line, pulse});
      });
      return point;
    });
    return {root, optical, radio, agv, route, scanner, sensorPoint, roomBox, rackBox, workerBox,
      rays, sweep, sight, hitPoint, workerRing, shadow, shadowEdges, tags, anchors, amber,
      source: V3(0,0,0), endpoint: V3(0,0,0), scanRay: new THREE.Ray(), rackHit: V3(0,0,0),
      workerHit: V3(0,0,0), person: V3(220,0,-123), labelEnd: V3(0,0,0), paused: reduceMotion};
  }

  function makeTableAnchor(parent, parts, name, x, z, standMaterial, jointMaterial) {
    const stand = meshGroup(parent, 0, 0, 0);
    const beam = (from, to, width, depth) => {
      const axis = to.clone().sub(from);
      const center = from.clone().lerp(to, 0.5);
      const bar = modelBox(stand, [width, axis.length(), depth], center.toArray(), standMaterial);
      bar.quaternion.setFromUnitVectors(V3(0,1,0), axis.normalize());
    };
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI * 2 / 3;
      const footX = 56 * Math.sin(angle), footZ = 56 * Math.cos(angle);
      beam(V3(0,16,0), V3(footX, 8, footZ), 13, 7);
      modelBox(stand, [13, 4, 9], [footX,2,footZ], standMaterial).rotation.y = angle;
    }
    modelCylinder(stand, 12, 15, 21, [0,13,0], jointMaterial);
    const joints = [V3(0,25,0), V3(0,73,-10), V3(0,123,3), V3(0,166,-9)];
    joints.slice(1).forEach((point, i) => {
      beam(joints[i], point, 12, 9);
      const hinge = modelCylinder(stand, 10, 10, 22, point.toArray(), jointMaterial);
      hinge.rotation.z = Math.PI / 2;
    });

    const housing = meshGroup(stand, 0, 0, 0);
    buildAnchor(parts, housing, name, [0x7f8895, 0x9ba4af]);
    housing.rotation.x = Math.PI / 2;
    const bounds = new THREE.Box3().setFromObject(housing);
    const size = bounds.getSize(V3(0,0,0));
    const centerY = 187, centerZ = 16;
    housing.position.set(0, centerY, centerZ).sub(bounds.getCenter(V3(0,0,0)));
    const back = centerZ - size.z / 2;
    const top = centerY + size.y / 2;
    modelBox(stand, [24, size.y + 8, 8], [0,centerY,back - 4], standMaterial);
    modelBox(stand, [30, 7, size.z + 8], [0,top + 3,centerZ - 3], jointMaterial);
    modelCylinder(stand, 7, 7, 7, [0,top + 11,centerZ], jointMaterial);
    const antenna = meshGroup(stand, 0, centerY + size.y * 0.18, centerZ + size.z / 2 + 3);
    const led = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), lightMaterial(cyan));
    antenna.add(led);

    stand.position.set(x, 0, z);
    stand.rotation.y = Math.atan2(-x, -z);
    const label = makeLabel(name, "#55ddf8", {width: 145, fontSize: 68});
    label.material.opacity = 1;
    label.scale.set(54, 42, 1);
    label.position.set(x, top + 42, z);
    parent.add(label);
    return {stand, antenna, point: V3(0,0,0), led};
  }

  function makeBooth(parent) {
    const root = meshGroup(parent, 0, 0, 0);
    const desk = newMat(0xbda68a), legs = newMat(0x51687a);
    modelBox(root, [1040, 30, 500], [0,-15,0], desk);
    for (const x of [-465,465]) for (const z of [-207,207]) {
      modelBox(root, [24, 122, 24], [x,-88,z], legs);
    }
    const agv = meshGroup(root, -285,0,0);
    const conveyor = meshGroup(root, 35,0,0);
    const parts = {parts: []};
    buildAGV(parts, agv);
    buildConveyor(parts, conveyor);
    buildRelay(parts, meshGroup(root, 325,0,0));
    parts.beltTex.repeat.x = 2;

    const treadMark = lightMaterial(cyan);
    for (const wheel of parts.wheels) {
      // Bright marks across both treads stay visible from the audience's angle.
      for (const angle of [0, 1.75, 3.7]) {
        const mark = modelBox(wheel, [20, 2.4, 6], [0, 32.3 * Math.cos(angle), 32.3 * Math.sin(angle)], treadMark);
        mark.rotation.x = angle;
      }
    }

    const belt = meshGroup(conveyor, 0, 34, 0);
    const tagBody = meshGroup(belt, 0, 0, 0);
    buildBelt(parts, tagBody);
    const size = new THREE.Box3().setFromObject(tagBody).getSize(V3(0,0,0));
    const width = Math.min(size.x, size.z), length = Math.max(size.x, size.z);
    if (size.z > size.x) tagBody.rotation.y = Math.PI / 2;
    tagBody.scale.setScalar(Math.min(1, 59 / width, 86 / length));

    const ring = floorRing(root, agv.position.x, agv.position.z, 117, cyan);
    const agvPoint = V3(agv.position.x, 121, agv.position.z);
    const beltPoint = V3(0,0,0);
    const signal = storyLine(root, agvPoint, beltPoint, cyan, 0.9);
    const beacon = modelCylinder(agv, 10, 10, 8, [34,106,57], lightMaterial(red));
    const beltSignal = meshGroup(belt, 0, size.y * tagBody.scale.y, 0);
    for (const [name,x,y,z] of [["TAG AGV",agv.position.x,201,0], ["CONVEYOR",conveyor.position.x,34,108]]) {
      const label = makeLabel(name, "#b7e9ff", {width: 330, fontSize: 61});
      label.material.opacity = 1;
      label.scale.set(151, 51, 1);
      label.position.set(x,y,z);
      root.add(label);
    }
    const tag = makeLabel("TAG Belt", "#76edb3", {width: 320, fontSize: 63});
    tag.material.opacity = 1;
    tag.scale.set(148,52,1);
    tag.position.set(0,103,0);
    belt.add(tag);

    const standMaterial = newMat(0x777f8a), jointMaterial = newMat(0x565e6c);
    // In the booth plan, the judge faces A1 and A2 at the front edge.
    const corners = [[-447,183], [447,183], [447,-183], [-447,-183]];
    const anchors = corners.map(([x,z], i) => {
      const anchor = makeTableAnchor(root, parts, `A${i + 1}`, x, z, standMaterial, jointMaterial);
      anchor.antenna.getWorldPosition(anchor.point);
      anchor.links = [[agvPoint, cyan], [beltPoint, 0x76edb3]].map(([point, color]) => {
        const line = storyLine(root, anchor.point, point, color, 0.15);
        const pulse = new THREE.Mesh(new THREE.SphereGeometry(6.5, 12, 8), lightMaterial(color));
        root.add(pulse);
        return {point, line, pulse};
      });
      return anchor;
    });
    return {root, belt, parts, ring, signal, beacon, agvPoint, beltPoint, beltSignal, treadMark, anchors};
  }

  function buildStory(container) {
    const stage = new Stage(container, {});
    stage.scene.background.set(0x0e1724);
    stage.renderer.shadowMap.enabled = false;
    for (const light of stage.scene.children) {
      if (light.isAmbientLight || light.isHemisphereLight) light.intensity *= 0.67;
      if (light.isPointLight) light.intensity *= 0.45;
    }
    stage.renderer.domElement.style.cursor = "default";
    stage.renderer.domElement.style.pointerEvents = "none";
    story.factory = makeFactory(stage.scene);
    story.sensing = makeSensing(stage.scene);
    story.booth = makeBooth(stage.scene);
    story.stage = stage;
  }

  function showStorySlide(slide) {
    const container = document.querySelector('[data-story-view="' + slide + '"]');
    story.tween?.kill();
    story.slide = slide;
    if (!container || story.failed) return;
    try {
      if (!story.stage) buildStory(container);
    } catch (error) {
      story.failed = true;
      document.querySelectorAll("[data-story-view]").forEach(frame => frame.classList.add("no-webgl"));
      console.warn("DELTA 3D could not initialize:", error.message);
      return;
    }
    const stage = story.stage;
    stage.container = container;
    container.prepend(stage.renderer.domElement);
    story.factory.root.visible = slide <= 4 || slide >= 8;
    story.sensing.root.visible = slide === 5;
    story.booth.root.visible = slide === 6;
    story.elapsed = 0;
    const f = story.factory;
    // In the combined scene the rail shields the Cobot service area and leaves the loading aisle open.
    f.serviceRail.position.set(slide === 8 ? -160 : 0, 0, slide === 8 ? 26 : 0);
    f.accessLabel.position.x = slide === 8 ? 752 : 867;
    f.loadingLabel.position.set(slide === 8 ? 1240 : 870, 26, slide === 8 ? -265 : -120);
    f.scenarios.visible = slide <= 4 || slide >= 8;
    f.tracking.visible = slide >= 8;
    f.future.root.visible = slide === 9;
    f.trackedTags.forEach(tag => { tag.mount.visible = slide >= 8; });
    f.guideBranch.visible = true;
    f.cobot.root.visible = f.cobotLabel.visible = slide <= 3 || slide >= 8;
    stage.exposure = 0.93;

    if (slide <= 4) {
      const opening = story.factory;
      opening.automatic.visible = slide <= 3;
      opening.service.visible = slide === 3;
      opening.serviceRing.material.color.setHex(red);
      opening.loading.visible = slide === 4;
      story.openingStatus = container.querySelector("[data-opening-status]");
      story.elapsed = reduceMotion ? (slide <= 3 ? 6 : 5) : 0;
      story.stationTravel = 0;
      setRig(stage, storyViews.opening);
    } else if (slide === 8) {
      f.automatic.visible = false;
      f.service.visible = f.loading.visible = true;
      f.serviceRing.material.color.setHex(red);
      story.currentStatus = container.querySelector("[data-current-status]");
      story.elapsed = reduceMotion ? 2.25 : 0;
      setRig(stage, storyViews.opening);
    } else if (slide === 9) {
      f.automatic.visible = true;
      f.service.visible = f.loading.visible = false;
      f.guideBranch.visible = false;
      story.futureStatus = container.querySelector("[data-future-status]");
      story.futureSteps = [...container.closest(".slide").querySelectorAll("[data-future-step]")];
      story.futureStep = null;
      story.elapsed = reduceMotion ? 13 : 0;
      setRig(stage, reduceMotion ? storyViews.controlRoom : storyViews.future);
      if (!reduceMotion) {
        story.tween = gsap.to(stage.rig, {...camTween(stage, storyViews.controlRoom, 1.8), delay: 2.15});
      }
    } else {
      setRig(stage, storyViews[slide === 5 ? "compare" : "booth"]);
      if (slide === 5) {
        story.sensing.status = container.querySelector("[data-sensing-status]");
        setSensingPaused(reduceMotion);
      }
    }
  }

  function aimCobot(cobot, grip) {
    const dx = grip.x - cobot.root.position.x, dz = grip.z - cobot.root.position.z;
    const rise = grip.y - 55, run = Math.hypot(dx, dz);
    const reach = Math.min(148.9, Math.hypot(run, rise));
    const angle = (cosine) => Math.acos(THREE.MathUtils.clamp(cosine, -1, 1));
    cobot.turn.rotation.y = Math.atan2(dx, dz);
    cobot.arm.rotation.x = Math.atan2(run, rise) - angle((81**2 + reach**2 - 68**2) / (2 * 81 * reach));
    cobot.elbow.rotation.x = Math.PI - angle((81**2 + 68**2 - reach**2) / (2 * 81 * 68));
  }

  function updateAutomaticPickup(dt, t = story.elapsed, continuousBelt = false) {
    const f = story.factory;
    const x = f.dockX, z = f.dockZ, lane = f.laneZ;
    f.agv2.visible = f.network.visible = false;
    f.ground.color.copy(darkFloor);
    f.wall.color.copy(darkWall);
    story.stage.exposure = 0.88;
    f.agv.position.set(
      lerp(-775,x,smooth(t,0,2.6)) + (923 - x) * smooth(t,9.2,10.7),
      0,
      t < 7.15 ? lerp(lane,z,smooth(t,2.95,4.1)) : lerp(z,lane,smooth(t,7.55,8.9))
    );
    f.agv.rotation.y = lerp(Math.PI / 2, Math.PI, smooth(t,2.6,2.95)) - (Math.PI / 2) * smooth(t,8.9,9.2);
    const pickup = V3(641, 134, -265), drop = V3(x, 102, z);
    const transfer = smooth(t, 4.65, 6.38);
    const hand = V3(
      lerp(pickup.x, drop.x, transfer),
      lerp(pickup.y, drop.y, transfer) + 21 * Math.sin(Math.PI * transfer),
      lerp(pickup.z, drop.z, transfer)
    );
    if (t < 4.65) hand.y += 22 * (1 - smooth(t,3.8,4.65));
    if (t > 6.38) hand.y += 26 * smooth(t,6.38,6.95);
    aimCobot(f.cobot, hand);
    if (t < 4.65) f.cargo.position.set(lerp(295,641,smooth(t,0.2,4.35)), 113,-265);
    else if (t <= 6.38) f.cargo.position.copy(hand).add(V3(0,-21,0));
    else f.cargo.position.copy(f.agv.position).add(V3(0,81,0));
    if (continuousBelt || t < 4.35) f.belt.offset.x -= dt * 0.46;
    f.pallets.forEach(box => { box.visible = false; });
    f.robots.forEach((robot, i) => {
      robot.turn.rotation.y = 0.45 * Math.sin(t * 1.3 + i);
      robot.arm.rotation.x = -0.38 + 0.24 * Math.cos(t * 1.2 + i);
    });
    if (t < 4.1) return "AGV วิ่งตามเส้นนำทาง";
    if (t < 4.65) return "AGV เข้าเทียบ Cobot";
    if (t < 6.38) return "Cobot ส่งกล่องให้ AGV";
    return t < 7.55 ? "กล่องวางบน AGV แล้ว" : "AGV ขนกล่องไปต่อ";
  }

  function updateOpening(dt) {
    const f = story.factory, t = story.elapsed;
    if (story.slide <= 3) {
      const pickupStatus = updateAutomaticPickup(dt);
      const service = story.slide === 3;
      f.worker.root.visible = service;
      let status = pickupStatus;
      let state = "info";
      if (service) {
        const walking = smooth(t, 0.3, 3.3);
        const inspecting = smooth(t, 3.3, 4.2);
        walkWorker(f.worker, lerp(930,760,walking), -180, -Math.PI / 2,
          Math.sin(t * 8) * 0.41 * (1 - smooth(t,2.8,3.3)));
        f.worker.limbs[1].arm.rotation.x -= 1.03 * inspecting;
        f.serviceRing.visible = t >= 3.3;
        status = t >= 3.3 ? "Cobot ยังทำงานขณะช่างเข้าซ่อม" : "ช่างเดินเข้าหา Cobot";
        state = t >= 3.3 ? "danger" : "warn";
      }
      setStoryStatus(story.openingStatus, status, state);
      return;
    }

    const atHandoff = t >= 3.6;
    f.worker.root.visible = false;
    f.agv.position.set(lerp(-560, 870, smooth(t, 0.25, 3.6)), 0, f.laneZ);
    f.agv.rotation.y = Math.PI / 2;
    f.agv2.visible = false;
    f.ground.color.copy(darkFloor);
    f.wall.color.copy(darkWall);
    story.stage.exposure = 0.85;

    f.network.visible = false;
    f.handoff.visible = atHandoff;
    const advance = smooth(t,0.1,3.6);
    f.parcel.position.x = lerp(440,788,advance);
    f.parcel.position.y = -10 * smooth(advance,0.77,0.99);
    if (!atHandoff) {
      story.stationTravel += dt;
      f.belt.offset.x -= dt * 0.44;
    }
    f.pallets.forEach((box, i) => {
      box.visible = i < 2;
      box.position.x = 180 + i * 137;
    });
    f.robots.forEach((robot, i) => {
      robot.turn.rotation.y = 0.49 * Math.sin(story.stationTravel * 1.25 + i);
      robot.arm.rotation.x = -0.33 + 0.23 * Math.cos(story.stationTravel * 1.4 + i);
    });

    setStoryStatus(story.openingStatus, atHandoff ? "AGV เข้าไม่ถึงจุดรับของ" : "กล่องกำลังมาถึงจุดรับ",
      atHandoff ? "warn" : "info");
  }

  function renderTrackedTags(service, showDock, showRoute, atLoadingBay = false) {
    const f = story.factory;
    const targetX = atLoadingBay ? f.loadingBay.x : f.dockX;
    const targetZ = atLoadingBay ? f.loadingBay.z : f.dockZ;
    f.trackedDock.visible = showDock;
    f.trackedDock.position.set(targetX,1.5,targetZ);
    f.virtualWaypoints.visible = showRoute;
    f.virtualWaypoints.position.set(targetX - f.dockX,0,atLoadingBay ? -60 : 0);
    f.virtualWaypoints.scale.z = atLoadingBay ? 1.65 : 1;
    // Keep the four anchor models, but use the tracked tags as the range endpoints.
    f.network.visible = true;
    f.lane.visible = false;
    f.links.forEach(line => { line.visible = false; });
    f.packets.forEach(packet => { packet.visible = false; });
    f.trackedTags.forEach((tag, index) => {
      const visible = index === 0 || service;
      tag.mount.visible = tag.caption.visible = tag.leader.visible = visible;
      tag.ranges.forEach(line => { line.visible = visible; });
      if (!visible) return;
      tag.mount.getWorldPosition(tag.point);
      tag.caption.position.copy(tag.point).add(V3(0,tag.lift,0));
      moveLine(tag.leader, tag.point, tag.caption.position);
      const scan = story.elapsed / 1.2 + index * 0.45;
      const activeAnchor = Math.floor(scan) % f.anchors.length;
      tag.ranges.forEach((line,i) => {
        moveLine(line, f.anchors[i], tag.point);
        line.material.opacity = !reduceMotion && i === activeAnchor ? 0.64 : 0.26;
      });
      const packet = f.packets[index];
      packet.visible = !reduceMotion;
      packet.material.color.setHex(tag.color);
      const phase = scan % 1;
      packet.position.lerpVectors(f.anchors[activeAnchor], tag.point, 1 - Math.abs(2 * phase - 1));
    });
  }

  function updateLocationPickup(dt, t) {
    const f = story.factory;
    const bay = f.loadingBay;
    f.worker.root.visible = f.agv2.visible = false;
    f.ground.color.copy(darkFloor);
    f.wall.color.copy(darkWall);
    story.stage.exposure = 0.85;
    f.agv.position.set(lerp(-560,bay.x,smooth(t,0.25,2.75)),0,lerp(f.laneZ,bay.z,smooth(t,3.05,5.1)));
    f.agv.rotation.y = lerp(Math.PI / 2,Math.PI,smooth(t,2.75,3.05));
    const handoff = smooth(t,5.2,6.38);
    f.parcel.position.x = lerp(440,788,smooth(t,0.1,3.6)) + (bay.x - 788) * handoff;
    f.parcel.position.y = -10 * smooth(t,2.75,3.6) - 16 * handoff;
    f.handoff.visible = false;
    if (t < 3.6) f.belt.offset.x -= dt * 0.44;
    f.pallets.forEach((box,i) => {
      box.visible = i < 2;
      box.position.x = 180 + i * 137;
    });
    f.robots.forEach((robot,i) => {
      robot.turn.rotation.y = 0.49 * Math.sin(t * 1.25 + i);
      robot.arm.rotation.x = -0.33 + 0.23 * Math.cos(t * 1.4 + i);
    });
  }

  function updateCurrentScenario(dt) {
    const f = story.factory, t = story.elapsed;
    const entry = 2.25, leave = 4.25, clear = 6.55, restart = 7.1;
    const stopped = t >= entry && t < restart;
    const machineTime = t < entry ? t : stopped ? entry : t - (restart - entry);
    updateLocationPickup(stopped ? 0 : dt, machineTime);
    // The AGV, carton and arm share the same clock before and after the simulated stop.
    const armTravel = 0.5 + 0.5 * Math.sin(machineTime * 1.55);
    aimCobot(f.cobot, V3(lerp(608,656,armTravel), 140 + 22 * armTravel, -265));

    const walkingIn = smooth(t, 0, entry);
    const walkingOut = smooth(t, leave, clear);
    const workerX = lerp(930,760,walkingIn) + 170 * walkingOut;
    const walking = (t < entry || (t >= leave && t < clear)) && !reduceMotion;
    f.worker.root.visible = t < clear;
    walkWorker(f.worker, workerX, -180, t < leave ? -Math.PI / 2 : Math.PI / 2,
      walking ? Math.sin(t * 8) * 0.41 : 0);
    f.serviceRing.visible = stopped && t < clear;
    renderTrackedTags(t < clear, true, t >= restart, true);

    if (t < entry) setStoryStatus(story.currentStatus, "UWB อ่านพิกัดช่าง");
    else if (t < clear) setStoryStatus(story.currentStatus, "ช่างเข้าโซน · เครื่องหยุดจำลอง", "danger");
    else if (t < restart) setStoryStatus(story.currentStatus, "พ้นโซน · รอยืนยันเริ่มงาน", "warn");
    else if (machineTime < 6.38) setStoryStatus(story.currentStatus, "AGV เข้าจุดรับตามพิกัด");
    else setStoryStatus(story.currentStatus, "AGV รับกล่องสำเร็จ", "recovery");
  }

  function updateFutureScenario(dt) {
    const f = story.factory, t = story.elapsed, flow = f.future;
    const docked = 4.1, ready = 8.45;
    const waiting = t >= docked && t < ready;
    const motion = t < docked ? t : waiting ? docked : t - (ready - docked);
    updateAutomaticPickup(waiting ? 0 : dt, motion);
    f.worker.root.visible = false;
    renderTrackedTags(false, true, t >= 2.6);

    const timing = [docked, 5.45, 6.95, ready, 9.85];
    const nextStep = timing.findIndex(boundary => t < boundary);
    const activeStep = nextStep === -1 ? flow.equipment.length : nextStep - 1;
    const points = [f.trackedTags[0].point, ...flow.nodes];
    flow.edges.forEach((edge, i) => {
      edge.visible = i <= activeStep;
      edge.material.opacity = i === activeStep ? 0.94 : 0.32;
      if (edge.visible) moveLine(edge,points[i],points[i+1]);
    });
    flow.pulse.visible = activeStep >= 0 && activeStep < flow.equipment.length;
    if (flow.pulse.visible) {
      const progress = smooth(t,timing[activeStep],timing[activeStep+1]);
      flow.pulse.position.lerpVectors(points[activeStep],points[activeStep+1],progress);
      flow.focusLight.position.copy(flow.nodes[activeStep]);
      flow.focusLight.position.y += 27;
      flow.focusLight.position.z += 32;
      flow.focusLight.intensity = 0.85 + progress * 0.45;
    } else {
      flow.focusLight.intensity = 0;
    }
    flow.stationLink.visible = flow.stationBeacon.visible = t >= ready;
    const activeLabels = ["REQUEST", "FORWARD", "CHECKING", "READY"];
    const completedLabels = ["REQUESTED", "FORWARDED", "PERMITTED", "LOGGED"];
    flow.equipment.forEach(({display,lamp},i) => {
      const active = i === activeStep;
      const done = i < activeStep;
      const readyScreen = i === 3 && active;
      const color = active && !readyScreen ? "#8cecff" : (done || readyScreen) ? "#68e6a8" : "#8ea6b7";
      const received = active && t >= lerp(timing[activeStep],timing[activeStep + 1],0.78);
      display(received ? (readyScreen ? "READY / LOG" : activeLabels[i])
        : active ? "RECEIVING" : done ? completedLabels[i] : "STANDBY",color);
      lamp.material.color.set(color);
    });
    if (story.futureStep === activeStep) return;
    story.futureStep = activeStep;
    const message = [
      "AGV กำลังเข้าจุดรับของ",
      "AI/MCP ส่งคำขอเมื่อถึงจุดโหลด",
      "Gateway ส่งผ่าน MQTT / REST API",
      "PLC รับคำขอ · ตรวจ Interlock",
      "PLC พร้อม · ส่งสถานะให้ SCADA",
      "SCADA บันทึกสถานะ"
    ][activeStep + 1];
    setStoryStatus(story.futureStatus, message, activeStep >= 3 ? "recovery" : "info");
    story.futureSteps.forEach((node,i) => {
      node.classList.toggle("flow-active", i === activeStep);
      node.classList.toggle("flow-done", i < activeStep);
      if (i === activeStep) node.setAttribute("aria-current","step");
      else node.removeAttribute("aria-current");
    });
  }

  function castSensingRay(s, angle) {
    s.scanRay.direction.set(Math.cos(angle), 0, Math.sin(angle));
    const rack = s.scanRay.intersectBox(s.rackBox, s.rackHit);
    const worker = s.scanRay.intersectBox(s.workerBox, s.workerHit);
    if (worker && (!rack || worker.distanceToSquared(s.source) < rack.distanceToSquared(s.source))) return worker;
    if (rack) return rack;
    return s.scanRay.intersectBox(s.roomBox, s.endpoint);
  }

  function updateSensingShadow(s) {
    const edges = s.shadowEdges;
    const segments = edges.length - 1;
    edges.forEach((edge, i) => {
      const angle = i * Math.PI * 2 / segments;
      s.scanRay.direction.set(Math.cos(angle), 0, Math.sin(angle));
      edge.blocked = !!s.scanRay.intersectBox(s.rackBox, edge.hit);
      if (edge.blocked) s.scanRay.intersectBox(s.roomBox, edge.edge);
    });
    const positions = s.shadow.geometry.attributes.position;
    let index = 0;
    for (let i = 0; i < segments; i++) {
      const a = edges[i], b = edges[i + 1];
      if (!a.blocked || !b.blocked) continue;
      for (const p of [a.hit, a.edge, b.edge, a.hit, b.edge, b.hit]) positions.setXYZ(index++, p.x, 2.2, p.z);
    }
    positions.needsUpdate = true;
    s.shadow.geometry.setDrawRange(0, index);
  }

  function setSensingPaused(paused) {
    story.sensing.paused = paused;
    sensingPlay.textContent = paused ? "▶ Play scan" : "Ⅱ Pause scan";
  }

  function updateSensing() {
    const s = story.sensing, t = story.elapsed;
    const routePhase = (t / 12) % 1;
    s.agv.position.copy(s.route.getPointAt(routePhase));
    const heading = s.route.getTangentAt(routePhase);
    s.agv.rotation.y = Math.atan2(heading.x, heading.z);
    s.sensorPoint.getWorldPosition(s.source);
    s.scanRay.origin.copy(s.source);
    const sweepAngle = t * 3.3;
    const angleStep = Math.PI * 2 / s.rays.length;
    s.rays.forEach((ray, i) => {
      const angle = i * angleStep;
      const hit = castSensingRay(s, angle);
      moveLine(ray, s.source, hit);
      ray.material.color.setHex(hit === s.rackHit ? 0xec7868 : s.amber);
      ray.material.opacity = 0.16 + 0.56 * Math.pow(Math.max(0, Math.cos(angle - sweepAngle)), 8);
    });
    const sweepEnd = castSensingRay(s, sweepAngle);
    moveLine(s.sweep, s.source, sweepEnd);
    s.hitPoint.position.copy(sweepEnd);
    s.hitPoint.visible = sweepEnd !== s.endpoint;

    const personAngle = Math.atan2(s.person.z - s.source.z, s.person.x - s.source.x);
    const sightEnd = castSensingRay(s, personAngle);
    const visible = sightEnd === s.workerHit;
    moveLine(s.sight, s.source, sightEnd);
    s.sight.material.color.setHex(visible ? s.amber : red);
    s.workerRing.material.color.setHex(visible ? s.amber : red);
    setStoryStatus(s.status, visible ? "LiDAR ตรวจพบคน" : "ชั้นวางบัง LiDAR", visible ? "info" : "warn");
    updateSensingShadow(s);

    s.tags.forEach((tag, tagIndex) => {
      tag.mount.getWorldPosition(tag.point);
      tag.label.position.copy(tag.point);
      tag.label.position.y += tag.lift;
      s.labelEnd.copy(tag.label.position);
      s.labelEnd.y -= 16;
      moveLine(tag.leader, tag.point, s.labelEnd);
      tag.links.forEach(({line, pulse}, i) => {
        const anchor = s.anchors[i];
        moveLine(line, anchor, tag.point);
        const phase = (t * 0.95 + i * 0.22 + tagIndex * 0.36) % 1;
        pulse.position.lerpVectors(anchor, tag.point, 1 - Math.abs(2 * phase - 1));
        line.material.opacity = 0.29 + 0.33 * Math.sin(phase * Math.PI) ** 2;
      });
    });
  }

  function renderComparison() {
    const { stage, sensing } = story;
    const r = stage.renderer, c = stage.camera;
    const w = stage.container.clientWidth, h = stage.container.clientHeight;
    if (!w || !h) return;
    if (stage.w !== w || stage.h !== h) {
      stage.w = w;
      stage.h = h;
      r.setSize(w, h, false);
    }
    r.toneMappingExposure = stage.exposure;
    c.aspect = Math.floor(w / 2) / h;
    c.updateProjectionMatrix();
    r.setScissorTest(true);
    updateSensing();
    for (let side = 0; side < 2; side++) {
      const x = Math.floor(side * w / 2), width = Math.floor((side + 1) * w / 2) - x;
      r.setViewport(x, 0, width, h);
      r.setScissor(x, 0, width, h);
      sensing.optical.visible = side === 0;
      sensing.radio.visible = side === 1;
      sensing.scanner.visible = side === 0;
      sensing.tags.forEach(tag => { tag.mount.visible = side === 1; });
      r.render(stage.scene, c);
    }
    r.setScissorTest(false);
    r.setViewport(0, 0, w, h);
    c.aspect = w / h;
    c.updateProjectionMatrix();
  }

  function updateBooth(dt) {
    const b = story.booth;
    const {travel, state, pwm} = window.DELTA_CANVASES.getDemoSnapshot();
    const stopped = state === "DANGER";
    const color = stopped ? red : state === "WARNING" ? 0xffbb4b : 0x42dfaa;
    b.belt.position.x = lerp(-176, 176, travel);
    for (const wheel of b.parts.wheels) wheel.rotation.x -= dt * 7.2 * pwm / 100;
    if (!stopped) b.parts.beltTex.offset.x = (b.parts.beltTex.offset.x + dt * 0.31) % 1;
    b.beltSignal.getWorldPosition(b.beltPoint);
    moveLine(b.signal, b.agvPoint, b.beltPoint);
    const cycle = (story.elapsed / 1.65) % b.anchors.length;
    const activeAnchor = Math.floor(cycle);
    b.anchors.forEach((anchor, i) => {
      const active = !reduceMotion && i === activeAnchor;
      anchor.led.scale.setScalar(active ? 1.65 : 1);
      anchor.links.forEach(({point, line, pulse}, tagIndex) => {
        moveLine(line, anchor.point, point);
        const phase = (cycle - activeAnchor - tagIndex * 0.13) / 0.87;
        const exchanging = active && phase >= 0 && phase <= 1;
        line.material.opacity = exchanging ? 0.76 : reduceMotion ? 0.28 : 0.15;
        pulse.visible = exchanging;
        if (exchanging) pulse.position.lerpVectors(point, anchor.point, 1 - Math.abs(2 * phase - 1));
      });
    });
    b.treadMark.color.setHex(color);
    b.signal.material.color.setHex(color);
    b.ring.material.color.setHex(color);
    b.ring.material.opacity = stopped ? 0.72 + Math.sin(story.elapsed * 7) * 0.22 : 0.76;
    b.beacon.visible = stopped && (reduceMotion || Math.sin(story.elapsed * 7) > -0.25);
  }

  function renderStory(dt) {
    if (!story.stage || story.slide === 7 || story.slide < 2 || story.slide > 9) return;
    if (story.slide === 5) {
      if (!story.sensing.paused) story.elapsed += dt;
      renderComparison();
      return;
    }
    const step = reduceMotion ? 0 : dt;
    story.elapsed += step;
    if (story.slide === 6) updateBooth(step);
    else if (story.slide <= 4) updateOpening(step);
    else if (story.slide === 8) updateCurrentScenario(step);
    else updateFutureScenario(step);
    story.stage.render();
  }

  document.querySelectorAll("[data-story-replay]").forEach(button => {
    button.addEventListener("click", () => showStorySlide(Number(button.dataset.storyReplay)));
  });
  sensingPlay.addEventListener("click", () => {
    if (story.slide === 5 && story.stage) setSensingPaused(!story.sensing.paused);
  });
  C.showStorySlide = showStorySlide;
  C.skipStoryMotion = function () {
    if (story.slide >= 2 && story.slide <= 4 && story.stage) {
      story.tween?.kill();
      story.elapsed = story.slide === 2 ? 10.7 : 6;
    } else if (story.slide === 5 && story.stage) {
      story.elapsed = 4.2;
      setSensingPaused(true);
    } else if ((story.slide === 8 || story.slide === 9) && story.stage) {
      story.elapsed = story.slide === 8 ? 12 : 10;
    }
  };


  /* ---------------- Main loop ---------------- */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const qaOpen = document.getElementById("qa-overlay") && document.getElementById("qa-overlay").classList.contains("open");

    if (story.tween?.isActive() || story.tween?.paused()) story.tween.paused(qaOpen);
    if (!qaOpen) renderStory(dt);
    if (qa.stage && qaOpen) qa.stage.render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();







