/* ==========================================================================
   DELTA — INTERACTIVE 2D/3D SIMULATION & SCIENTIFIC VISUALIZATION ENGINES
   1. Slide 1: Hybrid Factory Proximity Hazard Simulation
   2. Slide 2: Hybrid -> Connected -> Dark Factory Scene Morph
   3. Slide 4: LiDAR/SLAM Blind Spots vs. UWB Shared Positioning (DS-TWR)
   4. Slide 5: Live Booth Demo Twin (Stationary AGV on S01 + Conveyor + Belt)
   5. Slide 7: ECharts Constant vs. Linear Calibration Assessment
   6. Q&A Cat 1: Three.js Interactive 3D CAD & Exploded Assembly Viewer
   ========================================================================== */

window.DELTA_CANVASES = (function () {
  let animFrameId = null;
  let previousFrame = performance.now();

  const demoStates = {
    SAFE: {distance: 170, style: "safe", caption: "AGV and conveyor run normally"},
    WARNING: {distance: 95, style: "warn", caption: "Tag approaches · AGV slows down"},
    DANGER: {distance: 42, style: "danger", caption: "AGV and conveyor stop · Buzzer sounds"},
    RECOVERY: {distance: 160, style: "recovery", caption: "Zone clear · AGV and conveyor restart"}
  };
  const demoLimits = {min: 15, danger: 60, warning: 120, max: 200};
  let demoDistanceCm = 165;
  let demoState = "SAFE";
  let demoAutoPhase = "idle";
  let demoHoldSeconds = 0;
  let demoAudio = null;
  let demoTone = null;

  // Slide 7 ECharts instance (legacy API name retained for the controller)
  let s6Chart = null;
  let s6ViewMode = "anchors"; // anchors | cross-position | position

  // Three.js Q&A Viewer state
  let threeScene = null;
  let threeCamera = null;
  let threeRenderer = null;
  let threeGroup = null;
  let threeWireframe = false;
  let threeExplode = 0;
  let threeAutoRotate = true;
  let currentCadId = "agv_r20";

  function evaluateDemoState(distCm) {
    const withdrawing = distCm >= demoDistanceCm;
    demoDistanceCm = distCm;
    if (distCm < demoLimits.danger) {
      demoState = "DANGER";
    } else if (demoState === "DANGER" || (demoState === "RECOVERY" && (withdrawing || distCm > demoLimits.warning))) {
      demoState = "RECOVERY";
    } else if (distCm <= demoLimits.warning) {
      demoState = "WARNING";
    } else {
      demoState = "SAFE";
    }
    updateDemoTelemetry();
  }

  function setDemoAutoPhase(phase) {
    demoAutoPhase = phase;
    const autoBtn = document.getElementById("btn-demo-autoplay");
    if (autoBtn) {
      const active = phase !== "idle";
      autoBtn.classList.toggle("active", active);
      autoBtn.setAttribute("aria-pressed", active);
      autoBtn.textContent = active ? "■ Stop" : "▶ Auto";
    }
  }

  function setDemoStateExplicit(targetState) {
    if (!Object.hasOwn(demoStates, targetState)) return;
    armDemoAudio();
    setDemoAutoPhase("idle");
    demoDistanceCm = demoStates[targetState].distance;
    demoState = targetState;
    updateDemoTelemetry();
  }

  function getWheelSpeedPct() {
    if (demoState === "DANGER") return 0;
    if (demoState === "WARNING") {
      const ratio = (demoDistanceCm - demoLimits.danger) / (demoLimits.warning - demoLimits.danger);
      return Math.round(30 + ratio * 70);
    }
    return 100; // SAFE or RECOVERY
  }

  function updateDemoTelemetry() {
    const distEl = document.getElementById("tel-distance");
    const stateEl = document.getElementById("tel-state-badge");
    const caption = document.getElementById("tel-demo-caption");
    const statusEl = document.querySelector("[data-demo-status]");
    const wheelEl = document.getElementById("tel-wheel-pwm");
    const convEl = document.getElementById("tel-conveyor");
    const buzzerEl = document.getElementById("tel-buzzer");
    const slider = document.getElementById("demo-distance-slider");

    const pwmPct = getWheelSpeedPct();
    if (distEl) distEl.textContent = `${Math.round(demoDistanceCm)} cm`;
    if (slider) slider.value = Math.round(demoDistanceCm);
    if (wheelEl) {
      wheelEl.textContent = `${pwmPct}%`;
      wheelEl.style.color = pwmPct === 0 ? "#B91C1C" : demoState === "WARNING" ? "#956000" : "#08745A";
    }
    if (convEl) {
      const running = demoState !== "DANGER";
      convEl.textContent = running ? "RUNNING" : "STOPPED";
      convEl.style.color = running ? "#08745A" : "#B91C1C";
    }
    if (buzzerEl) {
      const active = demoState === "DANGER";
      buzzerEl.textContent = active ? "ALARM" : "OFF";
      buzzerEl.style.color = active ? "#B91C1C" : "#52697E";
    }
    if (stateEl && stateEl.textContent !== demoState) {
      stateEl.textContent = demoState;
    }
    const {style, caption: stateCaption} = demoStates[demoState];
    if (statusEl && statusEl.dataset.state !== style) statusEl.dataset.state = style;
    if (caption) {
      const message = demoAutoPhase === "withdraw" && demoState === "RECOVERY"
        ? "Tag moves away · System resumes" : stateCaption;
      if (caption.textContent !== message) caption.textContent = message;
    }

    // Highlight active state button
    document.querySelectorAll("[data-demo-state-btn]").forEach((btn) => {
      const selected = btn.dataset.demoStateBtn === demoState;
      btn.classList.toggle("active", selected);
      btn.setAttribute("aria-pressed", selected);
    });
  }

  function advanceDemo(dt) {
    if (demoAutoPhase === "approach") {
      const distance = demoDistanceCm - 30 * dt;
      evaluateDemoState(distance < demoLimits.danger ? Math.floor(distance) : distance);
      if (demoState === "DANGER") {
        demoHoldSeconds = 1.8;
        setDemoAutoPhase("hold");
      }
    } else if (demoAutoPhase === "hold") {
      demoHoldSeconds -= dt;
      if (demoHoldSeconds <= 0) setDemoAutoPhase("withdraw");
    } else if (demoAutoPhase === "withdraw") {
      const end = demoStates.RECOVERY.distance;
      evaluateDemoState(Math.min(end, demoDistanceCm + 32 * dt));
      if (demoDistanceCm === end) {
        setDemoAutoPhase("idle");
        updateDemoTelemetry();
      }
    }
  }

  function armDemoAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      demoAudio ||= new AudioContext();
      if (demoAudio.state === "suspended") demoAudio.resume().catch(() => {});
    } catch {
      // The visual alarm remains available when Web Audio is unavailable.
    }
  }

  function updateDemoBuzzer(active) {
    if (!active) {
      if (demoTone) {
        demoTone.osc.stop();
        demoTone.osc.disconnect();
        demoTone.gain.disconnect();
        demoTone = null;
      }
      return;
    }
    if (!demoAudio || demoAudio.state !== "running") return;
    const now = demoAudio.currentTime;
    if (!demoTone) {
      const osc = demoAudio.createOscillator(), gain = demoAudio.createGain();
      osc.type = "triangle";
      osc.frequency.value = 1040;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(demoAudio.destination);
      osc.start();
      demoTone = {osc, gain, nextBeep: now};
    }
    if (now >= demoTone.nextBeep) {
      const volume = demoTone.gain.gain;
      volume.setValueAtTime(0, now);
      volume.linearRampToValueAtTime(0.095, now + 0.02);
      volume.setValueAtTime(0.095, now + 0.15);
      volume.linearRampToValueAtTime(0, now + 0.19);
      demoTone.nextBeep = now + 0.42;
    }
  }

  function initOrUpdateSlide6Chart(mode) {
    if (mode) s6ViewMode = mode;
    const container = document.getElementById("chart-slide6-main");
    if (!container || typeof echarts === "undefined") return;
    if (!s6Chart) s6Chart = echarts.init(container, null, { renderer: "canvas" });

    const assessment = window.DELTA_DATA.uwbCalibrationAssessment;
    const ranging = [...assessment.anchors, { id: "Overall", ...assessment.overall }];
    const views = {
      anchors: {
        status: "Range RMSE · Per-position medians",
        context: "Fixed offsets (cm): " + assessment.anchors.map(a => `${a.id} +${a.offsetCm.toFixed(2)}`).join(" · "),
        categories: ranging.map(a => a.id),
        axis: "Range RMSE (cm)",
        series: [
          { name: "Raw", values: ranging.map(a => a.rawRmseCm), color: "#64748B" },
          { name: "Fixed constant", values: ranging.map(a => a.constantRmseCm), color: "#00E5FF" },
          { name: "Linear (in-sample)", values: ranging.map(a => a.linearRmseCm), color: "#F2B66D" }
        ]
      },
      "cross-position": {
        status: "Leave-one-position-out · Re-fitted models",
        context: "Each fold re-fits the model · Same calibration dataset, not independent field validation",
        categories: ranging.map(a => a.id),
        axis: "CV RMSE (cm)",
        series: [
          { name: "Re-fitted constant", values: ranging.map(a => a.constantCvRmseCm), color: "#00E5FF" },
          { name: "Re-fitted linear", values: ranging.map(a => a.linearCvRmseCm), color: "#F2B66D" }
        ]
      },
      position: {
        status: `Offline 2D multilateration · ${assessment.positioning.synchronizedCycles.toLocaleString("en-US")} cycles`,
        context: "Median ≤30 cm · P95 ≤50 cm · Dashed bars show proposal limits",
        categories: assessment.positioning.metrics.map(m => m.label),
        axis: "Position error (cm)",
        series: [
          { name: "Raw", values: assessment.positioning.metrics.map(m => m.rawCm), color: "#64748B" },
          { name: "Fixed constant", values: assessment.positioning.metrics.map(m => m.constantCm), color: "#00E5FF" },
          { name: "Linear", values: assessment.positioning.metrics.map(m => m.linearCm), color: "#F2B66D" },
          { name: "Proposal limit", values: assessment.positioning.metrics.map(m => m.targetCm), color: "#ADC0D2", target: true }
        ]
      }
    };
    const view = views[s6ViewMode];
    document.querySelector("[data-calibration-status]").textContent = view.status;
    document.querySelector("[data-calibration-context]").textContent = view.context;
    container.setAttribute("aria-label", `${view.status}. ${view.categories.map((category, i) =>
      `${category}: ${view.series.map(series => `${series.name} ${series.values[i].toFixed(2)} cm`).join(", ")}`
    ).join(". ")}`);

    s6Chart.setOption({
      backgroundColor: "transparent",
      animation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: value => `${Number(value).toFixed(2)} cm`,
        backgroundColor: "rgba(6, 10, 18, 0.94)",
        borderColor: "#00E5FF",
        textStyle: { color: "#F8FAFC", fontFamily: "Consolas", fontSize: 14 }
      },
      legend: {
        data: view.series.map(series => series.name),
        itemWidth: 16,
        itemHeight: 8,
        itemGap: 22,
        textStyle: { color: "#CBD5E1", fontFamily: "Segoe UI", fontSize: 14 },
        top: 4
      },
      grid: { left: 56, right: 24, top: 58, bottom: 36 },
      xAxis: {
        type: "category",
        data: view.categories,
        axisLabel: { color: "#CBD5E1", fontFamily: "Consolas", fontSize: 14, interval: 0 },
        axisLine: { lineStyle: { color: "rgba(148,163,184,0.3)" } }
      },
      yAxis: {
        type: "value",
        name: view.axis,
        minInterval: 5,
        nameTextStyle: { color: "#94A3B8", fontFamily: "Consolas" },
        axisLabel: { color: "#94A3B8", fontFamily: "Consolas" },
        splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } }
      },
      series: view.series.map(series => ({
        name: series.name,
        type: "bar",
        data: series.values,
        barGap: "18%",
        barMaxWidth: s6ViewMode === "position" ? 62 : 42,
        itemStyle: {
          color: series.target ? "transparent" : series.color,
          borderRadius: [4, 4, 0, 0],
          ...(series.target ? { borderColor: series.color, borderWidth: 1.5, borderType: "dashed" } : {})
        },
        label: {
          show: true,
          position: "top",
          color: series.target || series.name === "Raw" ? "#ADC0D2" : series.color,
          fontFamily: "Consolas",
          fontSize: 12,
          fontWeight: series.color === "#00E5FF" ? "bold" : "normal",
          formatter: p => series.target ? `≤${p.value}` : p.value.toFixed(2)
        }
      }))
    }, true);
    s6Chart.resize();
  }

  /* ------------------------------------------------------------------------
     Q&A CATEGORY 1: THREE.JS 3D CAD & EXPLODED ASSEMBLY VIEWER
     ------------------------------------------------------------------------ */
  function initThreeCadViewer() {
    const container = document.getElementById("qa-three-stage");
    if (!container || typeof THREE === "undefined") return;

    if (!threeRenderer) {
      const rect = container.getBoundingClientRect();
      const w = Math.max(rect.width, 320);
      const h = Math.max(rect.height, 260);

      threeScene = new THREE.Scene();
      threeCamera = new THREE.PerspectiveCamera(42, w / h, 1, 2000);
      threeCamera.position.set(190, 145, 210);
      threeCamera.lookAt(0, 15, 0);

      threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      threeRenderer.setSize(w, h);
      threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.innerHTML = "";
      container.appendChild(threeRenderer.domElement);

      const ambLight = new THREE.AmbientLight(0xffffff, 0.75);
      threeScene.add(ambLight);

      const dirLight1 = new THREE.DirectionalLight(0x00e5ff, 0.9);
      dirLight1.position.set(150, 250, 180);
      threeScene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x3b82f6, 0.6);
      dirLight2.position.set(-150, -100, -140);
      threeScene.add(dirLight2);

      const grid = new THREE.GridHelper(260, 14, 0x00e5ff, 0x1e293b);
      grid.position.y = -35;
      threeScene.add(grid);

      threeGroup = new THREE.Group();
      threeScene.add(threeGroup);

      // Mouse drag rotation
      let isDragging = false;
      let prevX = 0;
      let prevY = 0;
      threeRenderer.domElement.addEventListener("mousedown", (e) => {
        isDragging = true;
        threeAutoRotate = false;
        prevX = e.clientX;
        prevY = e.clientY;
      });
      window.addEventListener("mouseup", () => { isDragging = false; });
      window.addEventListener("mousemove", (e) => {
        if (!isDragging || !threeGroup) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        threeGroup.rotation.y += dx * 0.01;
        threeGroup.rotation.x = Math.max(-1.1, Math.min(1.1, threeGroup.rotation.x + dy * 0.01));
        prevX = e.clientX;
        prevY = e.clientY;
      });
    }

    buildProceduralCadAssembly(currentCadId);
  }

  function buildProceduralCadAssembly(modelId) {
    currentCadId = modelId;
    if (!threeGroup) return;
    while (threeGroup.children.length > 0) {
      threeGroup.remove(threeGroup.children[0]);
    }

    const matCyan = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.35, roughness: 0.35, wireframe: threeWireframe });
    const matBlue = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.45, roughness: 0.3, wireframe: threeWireframe });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4, wireframe: threeWireframe });
    const matGreen = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.3, roughness: 0.4, wireframe: threeWireframe });
    const matAmber = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.3, roughness: 0.4, wireframe: threeWireframe });

    const addPart = (geo, mat, basePos, explodeVec) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.basePos = basePos;
      mesh.userData.explodeVec = explodeVec;
      mesh.position.set(
        basePos[0] + explodeVec[0] * threeExplode,
        basePos[1] + explodeVec[1] * threeExplode,
        basePos[2] + explodeVec[2] * threeExplode
      );
      threeGroup.add(mesh);
    };

    if (modelId === "agv_r20" || modelId === "stand_s01") {
      // S01 Free-Wheel Display Stand (160 x 78 x 190 scaled)
      addPart(new THREE.BoxGeometry(96, 18, 110), matDark, [0, -24, 0], [0, -35, 0]);
      // N01 Chassis Base (120 x 5 x 160)
      addPart(new THREE.BoxGeometry(105, 6, 135), matBlue, [0, -6, 0], [0, 0, 0]);
      // Left & Right Dual-Shaft TT Motors + Wheels (elevated on S01)
      const wheelGeo = new THREE.CylinderGeometry(24, 24, 12, 28);
      wheelGeo.rotateZ(Math.PI / 2);
      addPart(wheelGeo, matAmber, [-60, -8, -22], [-45, 0, 0]);
      addPart(wheelGeo, matAmber, [60, -8, -22], [45, 0, 0]);
      // P01A Lower Enclosure Base
      addPart(new THREE.BoxGeometry(78, 30, 78), matCyan, [0, 14, -10], [0, 26, 0]);
      // P01B Upper UWB Radio Tower + OLED
      addPart(new THREE.BoxGeometry(64, 34, 52), matGreen, [0, 46, -10], [0, 62, 0]);
    } else if (modelId === "belt_r18a") {
      // P06 Closed Loop Belt Backplate
      addPart(new THREE.BoxGeometry(92, 58, 10), matDark, [0, 0, -26], [0, 0, -45]);
      // P01 Housing (82 x 74 x 38.4)
      addPart(new THREE.BoxGeometry(82, 74, 32), matBlue, [0, 0, 0], [0, 0, 0]);
      // P03 Insulating Tray + LiPo + INA226 + UWB Board
      addPart(new THREE.BoxGeometry(70, 62, 12), matGreen, [0, 0, 12], [0, 25, 22]);
      // P02 Front Cover + SSD1315 OLED Retainer
      addPart(new THREE.BoxGeometry(82, 74, 8), matCyan, [0, 0, 24], [0, 0, 52]);
    } else if (modelId === "anchor_r05") {
      // P01 Base (94 x 68 x 16)
      addPart(new THREE.BoxGeometry(94, 18, 68), matBlue, [0, -8, 0], [0, -30, 0]);
      // ESP32 UWB DW1000 PCB
      addPart(new THREE.BoxGeometry(82, 4, 54), matGreen, [0, 4, 0], [0, 0, 0]);
      // Dual Aluminum Heatsinks (ESP32 + UWB)
      addPart(new THREE.BoxGeometry(22, 12, 22), matAmber, [-18, 14, 0], [-15, 25, 0]);
      addPart(new THREE.BoxGeometry(20, 12, 20), matAmber, [18, 14, 0], [15, 25, 0]);
      // P02 Clean Vented Lid
      addPart(new THREE.BoxGeometry(94, 8, 68), matCyan, [0, 22, 0], [0, 48, 0]);
    } else {
      // Conveyor 450mm + Relay R01
      addPart(new THREE.BoxGeometry(165, 22, 46), matBlue, [-20, 0, 0], [-20, 0, 0]);
      addPart(new THREE.BoxGeometry(18, 28, 52), matAmber, [-92, 6, 0], [-45, 25, 0]);
      addPart(new THREE.BoxGeometry(18, 28, 52), matAmber, [52, 6, 0], [25, 25, 0]);
      addPart(new THREE.BoxGeometry(55, 32, 45), matCyan, [85, 4, 0], [50, 30, 0]);
    }

    // Attempt to load actual binary STL in background if browser allows fetch
    const modelMeta = window.DELTA_DATA.hardwareModels.find((m) => m.id === modelId);
    if (modelMeta && modelMeta.stlFiles && modelMeta.stlFiles.length > 0 && typeof THREE.STLLoader !== "undefined") {
      const loader = new THREE.STLLoader();
      modelMeta.stlFiles.forEach((stlDef, idx) => {
        loader.load(
          stlDef.path,
          (geometry) => {
            if (currentCadId !== modelId) return;
            if (idx === 0) {
              while (threeGroup.children.length > 0) threeGroup.remove(threeGroup.children[0]);
            }
            geometry.computeVertexNormals();
            geometry.center();
            const mat = new THREE.MeshStandardMaterial({
              color: stlDef.color || 0x00e5ff,
              metalness: 0.35,
              roughness: 0.35,
              wireframe: threeWireframe
            });
            const mesh = new THREE.Mesh(geometry, mat);
            mesh.rotation.x = -Math.PI / 2;
            const base = stlDef.offset || [0, 0, 0];
            const expVec = [base[0] * 0.6, (idx - 0.5) * 38, base[2] * 0.4];
            mesh.userData.basePos = [base[0], base[2], base[1]];
            mesh.userData.explodeVec = expVec;
            mesh.position.set(
              mesh.userData.basePos[0] + expVec[0] * threeExplode,
              mesh.userData.basePos[1] + expVec[1] * threeExplode,
              mesh.userData.basePos[2] + expVec[2] * threeExplode
            );
            threeGroup.add(mesh);
          },
          undefined,
          () => {
            // Keep procedural CAD assembly when opened via local file:// protocol
          }
        );
      });
    }
  }

  function updateThreeExplode(val) {
    threeExplode = parseFloat(val) || 0;
    if (!threeGroup) return;
    threeGroup.children.forEach((mesh) => {
      const b = mesh.userData.basePos || [0, 0, 0];
      const e = mesh.userData.explodeVec || [0, 0, 0];
      mesh.position.set(
        b[0] + e[0] * threeExplode,
        b[1] + e[1] * threeExplode,
        b[2] + e[2] * threeExplode
      );
    });
  }

  function toggleThreeWireframe() {
    threeWireframe = !threeWireframe;
    if (!threeGroup) return;
    threeGroup.children.forEach((mesh) => {
      if (mesh.material) mesh.material.wireframe = threeWireframe;
    });
  }

  /* ------------------------------------------------------------------------
     MAIN ANIMATION LOOP (60 FPS TARGET)
     ------------------------------------------------------------------------ */
  function tick(now) {
    const dt = Math.min(0.05, (now - previousFrame) / 1000);
    previousFrame = now;
    const demoVisible = !document.hidden && document.querySelector('.slide.active[data-slide="6"]') &&
        !document.querySelector("#qa-overlay.open");
    if (demoVisible) advanceDemo(dt);
    updateDemoBuzzer(demoVisible && demoState === "DANGER");

    // Render Q&A Three.js if Q&A overlay is open
    const qaModal = document.getElementById("qa-overlay");
    if (qaModal && qaModal.classList.contains("open") && threeRenderer && threeScene && threeCamera) {
      if (threeAutoRotate && threeGroup) {
        threeGroup.rotation.y += 0.008;
      }
      threeRenderer.render(threeScene, threeCamera);
    }

    animFrameId = requestAnimationFrame(tick);
  }

  function start() {
    if (!animFrameId) {
      updateDemoTelemetry();
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) updateDemoBuzzer(false);
      });
      animFrameId = requestAnimationFrame(tick);
    }
  }

  return {
    start,
    getDemoSnapshot: () => {
      const {min, danger, max} = demoLimits;
      const travel = demoDistanceCm < danger
        ? 0.08 * (demoDistanceCm - min) / (danger - min)
        : 0.08 + 0.92 * (demoDistanceCm - danger) / (max - danger);
      return {distance: demoDistanceCm, travel, state: demoState, pwm: getWheelSpeedPct()};
    },
    setDemoDistance: function (cm) {
      const distance = parseFloat(cm);
      if (!Number.isFinite(distance)) return;
      armDemoAudio();
      setDemoAutoPhase("idle");
      evaluateDemoState(Math.max(demoLimits.min, Math.min(demoLimits.max, distance)));
    },
    setDemoStateExplicit,
    toggleDemoAutoPlay: function () {
      armDemoAudio();
      if (demoAutoPhase !== "idle") {
        setDemoAutoPhase("idle");
        updateDemoTelemetry();
        return;
      }
      demoState = "SAFE";
      demoDistanceCm = demoStates.SAFE.distance;
      setDemoAutoPhase("approach");
      updateDemoTelemetry();
    },
    initOrUpdateSlide6Chart,
    initThreeCadViewer,
    selectCadModel: function (id) { buildProceduralCadAssembly(id); },
    updateThreeExplode,
    toggleThreeWireframe,
    toggleThreeAutoRotate: function () { threeAutoRotate = !threeAutoRotate; }
  };
})();
