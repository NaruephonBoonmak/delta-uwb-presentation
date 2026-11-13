/* ==========================================================================
   DELTA — MAIN PRESENTATION CONTROLLER, GSAP SEQUENCER & Q&A SYSTEM
   Supports 10 slides, including a four-category technical Q&A menu
   ========================================================================== */

(function () {
  const stage = document.querySelector(".deck-stage");
  function fitStage() {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    const x = (window.innerWidth - 1920 * scale) / 2;
    const y = (window.innerHeight - 1080 * scale) / 2;
    stage.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
  }
  fitStage();
  window.addEventListener("resize", fitStage);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  let currentSlide = 1;
  const totalSlides = document.querySelectorAll(".slide").length;
  const qaSlide = Number(document.querySelector(".qa-slide").dataset.slide);
  const slideRegion = document.querySelector(".slide-region");
  const bottomBar = document.querySelector(".bottom-bar");
  const btnPrev = document.getElementById("btn-prev-slide");
  const btnNext = document.getElementById("btn-next-slide");
  const qaOverlay = document.getElementById("qa-overlay");
  const btnQaClose = document.getElementById("btn-close-qa");
  let qaOpen = false;
  let qaTrigger = null;
  let lightboxOpen = false;
  let activeCadModelId = "agv_r20";
  let activeCadImageMode = "assembled"; // assembled | bom | alt

  const slideToPhase = {
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 2,
    6: 3,
    7: 4,
    8: 4,
    9: 4
  };

  /* ------------------------------------------------------------------------
     SLIDE NAVIGATION & GSAP ENTRANCE SEQUENCING
     ------------------------------------------------------------------------ */
  function goToSlide(targetIdx, forceReplay = false) {
    const idx = Math.max(1, Math.min(totalSlides, parseInt(targetIdx, 10)));
    if (idx === currentSlide && !forceReplay) return;
    currentSlide = idx;

    // Toggle slide active class
    document.querySelectorAll(".slide").forEach((el) => {
      const sNum = parseInt(el.getAttribute("data-slide"), 10);
      el.classList.toggle("active", sNum === currentSlide);
      el.inert = sNum !== currentSlide;
    });

    // Update Bottom Slide Dots & Counter
    document.querySelectorAll(".slide-dot").forEach((dot) => {
      const dNum = parseInt(dot.getAttribute("data-slide-dot"), 10);
      const active = dNum === currentSlide;
      dot.classList.toggle("active", active);
      if (active) dot.setAttribute("aria-current", "page");
      else dot.removeAttribute("aria-current");
    });
    btnPrev.disabled = currentSlide === 1;
    btnNext.disabled = currentSlide === totalSlides;

    const counterEl = document.getElementById("slide-counter-label");
    if (counterEl) {
      const currentPhase = slideToPhase[currentSlide];
      const slideNumber = String(currentSlide).padStart(2, "0");
      const phaseLabel = currentPhase ? `  •  PHASE 0${currentPhase}` : "";
      counterEl.textContent = `SLIDE ${slideNumber} / ${totalSlides}${phaseLabel}`;
    }

    // Run GSAP Entrance Animation on Active Slide Elements
    const activeSlideEl = document.querySelector(`.slide[data-slide="${currentSlide}"]`);
    if (activeSlideEl && typeof gsap !== "undefined" && !reducedMotion.matches) {
      const animItems = activeSlideEl.querySelectorAll(".gsap-reveal");
      gsap.killTweensOf(animItems);
      gsap.fromTo(
        animItems,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.52,
          stagger: 0.08,
          ease: "power2.out",
          overwrite: "auto"
        }
      );
    }

    window.DELTA_CANVASES.showStorySlide?.(currentSlide);
    if (currentSlide === qaSlide && !forceReplay) {
      document.getElementById("qa-slide-title").focus({ preventScroll: true });
    }

    // Slide-specific hooks
    if (currentSlide === 7) {
      setTimeout(() => {
        if (currentSlide !== 7) return;
        window.DELTA_CANVASES.initOrUpdateSlide6Chart();

      }, 120);
    }
  }

  function skipSlideAnimation() {
    window.DELTA_CANVASES.skipStoryMotion?.();
    const activeSlideEl = document.querySelector(`.slide[data-slide="${currentSlide}"]`);
    if (activeSlideEl && typeof gsap !== "undefined" && !reducedMotion.matches) {
      const animItems = activeSlideEl.querySelectorAll(".gsap-reveal");
      gsap.killTweensOf(animItems);
      gsap.set(animItems, { opacity: 1, y: 0 });
    }
  }


  /* ------------------------------------------------------------------------
     INTERACTIVE TECHNICAL Q&A DETAILS
     ------------------------------------------------------------------------ */
  function openQaOverlay(tabId, trigger) {
    qaTrigger = trigger;
    qaOpen = true;
    qaOverlay.inert = false;
    qaOverlay.setAttribute("aria-hidden", "false");
    qaOverlay.classList.add("open");
    slideRegion.inert = true;
    bottomBar.inert = true;
    document.getElementById("qa-return-label").textContent = currentSlide === qaSlide
      ? "Back to Q&A" : `Back to slide ${currentSlide}`;
    switchQaTab(tabId);
    btnQaClose.focus({ preventScroll: true });
  }

  function closeQaOverlay() {
    qaOpen = false;
    qaOverlay.inert = true;
    qaOverlay.setAttribute("aria-hidden", "true");
    qaOverlay.classList.remove("open");
    slideRegion.inert = false;
    bottomBar.inert = false;
    qaTrigger?.focus({ preventScroll: true });
    qaTrigger = null;
  }

  function switchQaTab(tabId) {
    document.querySelectorAll(".qa-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-qa-tab") === tabId);
    });
    document.querySelectorAll(".qa-pane").forEach((pane) => {
      pane.classList.toggle("active", pane.getAttribute("data-qa-pane") === tabId);
    });

    if (tabId === "cad") {
      setTimeout(() => {
        if (qaOpen && qaOverlay.querySelector('[data-qa-pane="cad"].active')) {
          window.DELTA_CANVASES.initThreeCadViewer();
        }
      }, 80);
    }
  }

  /* ------------------------------------------------------------------------
     POPULATE Q&A CATEGORY 1: 3D CAD, STUDIO RENDERS & EXPLODED BOM
     ------------------------------------------------------------------------ */
  function initQaCategory1Cad() {
    const selectorContainer = document.getElementById("qa-cad-selector-list");
    if (!selectorContainer) return;

    const models = window.DELTA_DATA.hardwareModels;
    selectorContainer.innerHTML = models
      .map(
        (m) => `
      <button class="cad-model-btn ${m.id === activeCadModelId ? "active" : ""}" data-cad-id="${m.id}">
        <span>${m.code}</span>
        <strong>${m.name}</strong>
      </button>
    `
      )
      .join("");

    selectorContainer.querySelectorAll(".cad-model-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectQaCadModel(btn.getAttribute("data-cad-id"));
      });
    });

    // Image view mode switcher (Assembled Render | Exploded BOM | Detail/Stand)
    document.querySelectorAll("[data-cad-img-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCadImageMode = btn.getAttribute("data-cad-img-mode");
        document.querySelectorAll("[data-cad-img-mode]").forEach((b) => {
          b.classList.toggle("active", b.getAttribute("data-cad-img-mode") === activeCadImageMode);
        });
        updateQaCadDetailsDOM();
      });
    });

    selectQaCadModel(activeCadModelId);
  }

  function selectQaCadModel(modelId) {
    activeCadModelId = modelId;
    document.querySelectorAll(".cad-model-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-cad-id") === modelId);
    });
    window.DELTA_CANVASES.selectCadModel(modelId);
    updateQaCadDetailsDOM();
  }

  function updateQaCadDetailsDOM() {
    const model = window.DELTA_DATA.hardwareModels.find((m) => m.id === activeCadModelId);
    if (!model) return;

    const titleEl = document.getElementById("qa-cad-title");
    const dimEl = document.getElementById("qa-cad-dims");
    const imgEl = document.getElementById("qa-cad-preview-img");
    const specsBody = document.getElementById("qa-cad-specs-tbody");
    const bomList = document.getElementById("qa-cad-bom-list");

    if (titleEl) titleEl.textContent = `${model.code} — ${model.name}`;
    if (dimEl) dimEl.textContent = model.dimensions;

    if (imgEl) {
      const src =
        activeCadImageMode === "bom" ? model.bomImg :
        activeCadImageMode === "alt" ? model.altImg :
        model.assembledImg;
      imgEl.src = src;
      imgEl.alt = model.name;
      imgEl.onclick = () => openLightbox(src, `${model.code} — ${model.name}`, true);
    }

    if (specsBody) {
      specsBody.innerHTML = model.specs
        .map(
          (row) => `
        <tr>
          <td class="mono" style="color:#94A3B8;width:38%;">${row[0]}</td>
          <td style="color:#F8FAFC;font-weight:600;">${row[1]}</td>
        </tr>
      `
        )
        .join("");
    }

    if (bomList) {
      bomList.innerHTML = model.bomHighlights
        .map((item) => `<li style="padding:4px 0;border-bottom:1px dashed rgba(148,163,184,0.14);font-size:12px;color:#CBD5E1;">${item}</li>`)
        .join("");
    }
  }

  /* ------------------------------------------------------------------------
     POPULATE Q&A CATEGORY 2: UWB CALIBRATION & 20 SVG PLATES
     ------------------------------------------------------------------------ */
  function initQaCategory2Calibration() {
    const tbody = document.getElementById("qa-uwb-anchors-tbody");
    const grid = document.getElementById("qa-svg-atlas-grid");
    const exp = window.DELTA_DATA.uwbExperiment;

    if (tbody) {
      tbody.innerHTML = exp.anchors
        .map(
          (a) => `
        <tr>
          <td class="mono" style="color:#00E5FF;font-weight:700;">${a.id} ${a.pos}</td>
          <td class="mono">${a.gainA.toFixed(4)}</td>
          <td class="mono">${a.offsetB_cm > 0 ? "+" : ""}${a.offsetB_cm.toFixed(2)} cm</td>
          <td class="mono">${a.heldoutPooledRawCm.toFixed(2)} cm</td>
          <td class="mono" style="color:#10B981;font-weight:700;">${a.heldoutPooledCalCm.toFixed(2)} cm</td>
          <td class="mono" style="color:${a.changePct < 0 ? "#10B981" : "#F59E0B"};font-weight:700;">
            ${a.changePct > 0 ? "+" : ""}${a.changePct.toFixed(2)}%
          </td>
          <td style="font-size:11.5px;color:#CBD5E1;">${a.note}</td>
        </tr>
      `
        )
        .join("");
    }

    if (grid) {
      grid.innerHTML = exp.svgPlates
        .map(
          (p) => `
        <div class="svg-plate-card" data-plate-src="${p.path}" data-plate-title="${p.code}: ${p.title} — ${p.desc}">
          <img src="${p.path}" alt="${p.title}" loading="lazy" />
          <div class="p-code">${p.code}</div>
          <div class="p-title">${p.title}</div>
          <div style="font-size:11px;color:#94A3B8;line-height:1.35;">${p.desc}</div>
        </div>
      `
        )
        .join("");

      grid.querySelectorAll(".svg-plate-card").forEach((card) => {
        card.addEventListener("click", () => {
          openLightbox(
            card.getAttribute("data-plate-src"),
            card.getAttribute("data-plate-title"),
            false
          );
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     POPULATE Q&A CATEGORY 3: ELECTRICAL CIRCUIT & INA226 WIRING
     ------------------------------------------------------------------------ */
  function initQaCategory3Wiring() {
    const gallery = document.getElementById("qa-wiring-gallery");
    const inaBody = document.getElementById("qa-ina226-tbody");
    const megaBody = document.getElementById("qa-mega-tbody");
    const wData = window.DELTA_DATA.wiringData;

    if (gallery) {
      gallery.innerHTML = wData.diagrams
        .map(
          (d) => `
        <div class="svg-plate-card" data-wiring-src="${d.svg}" data-wiring-title="${d.title} — ${d.subtitle}">
          <img src="${d.img}" alt="${d.title}" loading="lazy" style="background:#0B1220;height:155px;" />
          <div class="p-title" style="margin-top:4px;">${d.title}</div>
          <div style="font-size:11px;color:#94A3B8;line-height:1.35;">${d.subtitle}</div>
        </div>
      `
        )
        .join("");

      gallery.querySelectorAll(".svg-plate-card").forEach((card) => {
        card.addEventListener("click", () => {
          openLightbox(
            card.getAttribute("data-wiring-src"),
            card.getAttribute("data-wiring-title"),
            true
          );
        });
      });
    }

    if (inaBody) {
      inaBody.innerHTML = wData.pinTables.ina226
        .map(
          (r) => `
        <tr>
          <td class="mono" style="color:#00E5FF;font-weight:700;">${r[0]}</td>
          <td class="mono" style="color:#F8FAFC;">${r[1]}</td>
          <td style="color:#CBD5E1;">${r[2]}</td>
        </tr>
      `
        )
        .join("");
    }

    if (megaBody) {
      megaBody.innerHTML = wData.pinTables.agvMega
        .map(
          (r) => `
        <tr>
          <td class="mono" style="color:#10B981;font-weight:700;">${r[0]}</td>
          <td class="mono" style="color:#F8FAFC;">${r[1]}</td>
          <td style="color:#CBD5E1;">${r[2]}</td>
        </tr>
      `
        )
        .join("");
    }
  }

  /* ------------------------------------------------------------------------
     POPULATE Q&A CATEGORY 4: AI / IoT / SCADA / PLC INDUSTRIAL ROADMAP
     ------------------------------------------------------------------------ */
  function initQaCategory4Roadmap() {
    const tbody = document.getElementById("qa-roadmap-tbody");
    if (!tbody) return;

    tbody.innerHTML = window.DELTA_DATA.industrialRoadmap
      .map(
        (item) => `
      <tr>
        <td style="font-weight:700;color:#F8FAFC;">${item.capability}</td>
        <td style="color:#6EE7B7;">${item.tier1_prototype}</td>
        <td style="color:#67E8F9;">${item.tier2_demo}</td>
        <td style="color:#CBD5E1;">${item.tier3_future}</td>
      </tr>
    `
      )
      .join("");
  }

  /* ------------------------------------------------------------------------
     LIGHTBOX MODAL FOR HIGH-RES DIAGRAMS & SVG PLATES
     ------------------------------------------------------------------------ */
  function openLightbox(src, caption, darkBg = false) {
    const modal = document.getElementById("lightbox-modal");
    const imgWrap = document.getElementById("lightbox-img-wrap");
    const img = document.getElementById("lightbox-img");
    const cap = document.getElementById("lightbox-caption");
    if (!modal || !img) return;

    img.src = src;
    if (cap) cap.textContent = caption || "";
    if (imgWrap) imgWrap.classList.toggle("dark-bg", !!darkBg);
    lightboxOpen = true;
    modal.classList.add("open");
  }

  function closeLightbox() {
    const modal = document.getElementById("lightbox-modal");
    if (!modal) return;
    lightboxOpen = false;
    modal.classList.remove("open");
  }

  /* ------------------------------------------------------------------------
     FULLSCREEN TOGGLE
     ------------------------------------------------------------------------ */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  /* ------------------------------------------------------------------------
     INITIALIZE EVENT LISTENERS ON DOM READY
     ------------------------------------------------------------------------ */
  window.addEventListener("DOMContentLoaded", () => {
    // Start 60 FPS Canvas & WebGL Loop
    window.DELTA_CANVASES.start();

    // Initialize Q&A Panes
    initQaCategory1Cad();
    initQaCategory2Calibration();
    initQaCategory3Wiring();
    initQaCategory4Roadmap();

    // Render KaTeX formulas if loaded
    if (typeof renderMathInElement !== "undefined") {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ]
      });
    }

    // Bottom Slide Dots
    document.querySelectorAll(".slide-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const sIdx = parseInt(dot.getAttribute("data-slide-dot"), 10);
        if (qaOpen) closeQaOverlay();
        goToSlide(sIdx);
      });
    });

    // Tap the cover to advance on touch devices.
    document.querySelector(".cover-slide")?.addEventListener("click", () => goToSlide(2));

    btnPrev.addEventListener("click", () => goToSlide(currentSlide - 1));
    btnNext.addEventListener("click", () => goToSlide(currentSlide + 1));
    btnQaClose.addEventListener("click", closeQaOverlay);

    // Q&A Tab Buttons
    document.querySelectorAll(".qa-tab").forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => {
        switchQaTab(tabBtn.getAttribute("data-qa-tab"));
      });
    });

    // Quick-open Q&A buttons embedded inside slides
    document.querySelectorAll("[data-open-qa-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-open-qa-tab");
        openQaOverlay(tab, btn);
      });
    });

    // Slide 5 Demo Controls (4 States + Distance Slider + Auto-Cycle)
    document.querySelectorAll("[data-demo-state-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.DELTA_CANVASES.setDemoStateExplicit(btn.getAttribute("data-demo-state-btn"));
      });
    });

    const distSlider = document.getElementById("demo-distance-slider");
    if (distSlider) {
      distSlider.addEventListener("input", (e) => {
        window.DELTA_CANVASES.setDemoDistance(e.target.value);
      });
    }

    const btnAutoPlay = document.getElementById("btn-demo-autoplay");
    if (btnAutoPlay) {
      btnAutoPlay.addEventListener("click", () => {
        window.DELTA_CANVASES.toggleDemoAutoPlay();
      });
    }

    // Slide 6 Chart View Switcher
    document.querySelectorAll("[data-s6-chart-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-s6-chart-mode");
        document.querySelectorAll("[data-s6-chart-mode]").forEach((b) => {
          b.classList.toggle("active", b.getAttribute("data-s6-chart-mode") === mode);
        });
        window.DELTA_CANVASES.initOrUpdateSlide6Chart(mode);
      });
    });

    // Lightbox Close
    const lbModal = document.getElementById("lightbox-modal");
    if (lbModal) {
      lbModal.addEventListener("click", (e) => {
        if (e.target === lbModal || e.target.id === "btn-close-lightbox") {
          closeLightbox();
        }
      });
    }

    // Global Keyboard Navigation
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (lightboxOpen) {
          closeLightbox();
          return;
        }
        if (qaOpen) {
          closeQaOverlay();
          return;
        }
      }

      if (!lightboxOpen && e.key.toLowerCase() === "q") {
        e.preventDefault();
        if (qaOpen) closeQaOverlay();
        else goToSlide(qaSlide);
        return;
      }

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      if (qaOpen || lightboxOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " && e.target instanceof HTMLButtonElement) return;

      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goToSlide(currentSlide + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToSlide(currentSlide - 1);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        goToSlide(currentSlide, true);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        skipSlideAnimation();
      } else if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        goToSlide(e.key === "0" ? qaSlide : Number(e.key));
      }
    });

    // Trigger initial entrance animation on Slide 1
    goToSlide(1, true);
  });

  // Expose Lightbox helper globally for inline triggers
  window.openDeltaLightbox = openLightbox;
})();
