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
  let lightboxTrigger = null;

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
      const active = btn.dataset.qaTab === tabId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".qa-pane").forEach((pane) => {
      pane.classList.toggle("active", pane.getAttribute("data-qa-pane") === tabId);
    });

    qaOverlay.querySelector(".qa-body").scrollTop = 0;
    if (tabId === "cad") {
      setTimeout(() => {
        if (qaOpen && qaOverlay.querySelector('[data-qa-pane="cad"].active')) {
          window.DELTA_CANVASES.initThreeCadViewer();
        }
      }, 80);
    }
  }

  function initQaCadViewer() {
    const modelSelect = document.getElementById("qa-cad-model");
    const explode = document.getElementById("qa-cad-explode");
    const wireframe = document.getElementById("qa-cad-wireframe");
    const spin = document.getElementById("qa-cad-spin");
    const viewer = window.DELTA_CANVASES;
    const names = {
      agv_r20: "AGV R20",
      belt_r18a: "Wearable Belt R18A",
      anchor_r05: "Anchor R05",
      stand_s01: "AGV Display Stand S01",
      conveyor_450: "Conveyor 450 mm",
      relay_r01: "Relay Enclosure R01",
      booth_layout: "Booth Layout"
    };

    window.DELTA_DATA.hardwareModels.forEach((model) => {
      modelSelect.add(new Option(names[model.id] || model.name, model.id));
    });
    modelSelect.addEventListener("change", () => viewer.selectCadModel(modelSelect.value));
    explode.addEventListener("input", () => viewer.updateThreeExplode(explode.value));
    wireframe.addEventListener("click", () => {
      const active = viewer.toggleThreeWireframe();
      wireframe.setAttribute("aria-pressed", String(active ?? wireframe.getAttribute("aria-pressed") !== "true"));
    });
    spin.addEventListener("click", () => {
      const active = viewer.toggleThreeAutoRotate();
      spin.setAttribute("aria-pressed", String(active ?? spin.getAttribute("aria-pressed") !== "true"));
    });
  }

  function initQaCategory2Calibration() {
    const tbody = document.getElementById("qa-uwb-anchors-tbody");
    const grid = document.getElementById("qa-svg-atlas-grid");
    const exp = window.DELTA_DATA.uwbExperiment;

    if (tbody) {
      tbody.innerHTML = exp.anchors
        .map(
          (a) => `
        <tr>
          <td class="mono qa-value">${a.id} ${a.pos}</td>
          <td class="mono">${a.gainA.toFixed(4)}</td>
          <td class="mono">${a.offsetB_cm > 0 ? "+" : ""}${a.offsetB_cm.toFixed(2)} cm</td>
          <td class="mono">${a.heldoutPooledRawCm.toFixed(2)} cm</td>
          <td class="mono qa-value-good">${a.heldoutPooledCalCm.toFixed(2)} cm</td>
          <td class="mono ${a.changePct < 0 ? "qa-value-good" : "qa-value-warn"}">
            ${a.changePct > 0 ? "+" : ""}${a.changePct.toFixed(2)}%
          </td>
          <td class="qa-figure-description">${a.note}</td>
        </tr>
      `
        )
        .join("");
    }

    if (grid) {
      grid.innerHTML = exp.svgPlates
        .map(
          (p) => `
        <button type="button" class="svg-plate-card" data-plate-src="${p.path}" data-plate-title="${p.code}: ${p.title} — ${p.desc}">
          <img src="${p.path}" alt="${p.title}" loading="lazy" />
          <span class="p-code">${p.code}</span>
          <span class="p-title">${p.title}</span>
          <span class="qa-figure-description">${p.desc}</span>
        </button>
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

  function initQaSchematics() {
    const gallery = document.getElementById("qa-wiring-gallery");
    window.DELTA_DATA.wiringData.diagrams.forEach(({ title, subtitle, svg }) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "qa-wiring-card";
      const image = new Image();
      image.src = svg;
      image.alt = "";
      image.loading = "lazy";
      const label = document.createElement("strong");
      label.textContent = title;
      const description = document.createElement("span");
      description.textContent = subtitle;
      card.append(image, label, description);
      card.addEventListener("click", () => openLightbox(svg, title));
      gallery.appendChild(card);
    });
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
    lightboxTrigger = document.activeElement;
    lightboxOpen = true;
    modal.inert = false;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    modal.querySelector("#btn-close-lightbox").focus({ preventScroll: true });
  }

  function closeLightbox() {
    const modal = document.getElementById("lightbox-modal");
    if (!modal) return;
    lightboxOpen = false;
    lightboxTrigger?.focus({ preventScroll: true });
    lightboxTrigger = null;
    modal.inert = true;
    modal.setAttribute("aria-hidden", "true");
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
    initQaCadViewer();
    initQaCategory2Calibration();
    initQaSchematics();

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
        if (e.target === lbModal || e.target.closest("#btn-close-lightbox")) {
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
