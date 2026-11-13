/* ==========================================================================
   DELTA — VERIFIED PROJECT DATA & ASSET REGISTRY
   All specifications, dimensions, circuit maps, and UWB experimental results
   are strictly sourced from verified project files & uwb.pipatintegration.com
   ========================================================================== */

window.DELTA_DATA = {
  meta: {
    project: "DELTA — UWB Smart Factory Safety & Automation",
    subtitle: "From Hybrid Factory Safety to Dark Factory Intelligence",
    team: "MECHECI404",
    booth: "Booth #15",
    event: "DELTA CUP 2026 Regional Final — KMUTT",
    wordmark: "assets/uwb_report/uwb-report/MECHECI404 Tech Wordmark.png"
  },

  /* ------------------------------------------------------------------------
     1. HARDWARE & CAD SUBSYSTEMS (FOR SLIDE 3 & Q&A CATEGORY 1)
     ------------------------------------------------------------------------ */
  hardwareModels: [
    {
      id: "agv_r20",
      code: "01_AGV_R20",
      name: "AGV Node (Single UWB Tag + Dual-Shaft TT Drive)",
      role: "Stationary Demo Vehicle on Free-Wheel Stand S01",
      dimensions: "Chassis: 120 × 160 × 5 mm (~173 mm width w/ wheels) | UWB Tower: 95 × 94 × 73.4 mm",
      assembledImg: "assets/cad_assembled/output/Three_Models_Assembled_R20/transparent/03_AGV_Assembled_transparent.png",
      bomImg: "assets/bom_r19/output/Poster_BOM_R19/transparent/03_AGV_transparent.png",
      altImg: "assets/package/05_AGV_Display_Stand_S01/Images/AGV_R20_Dual_TT_On_S01.png",
      stlFiles: [
        { label: "Chassis Base (N01 120×160mm)", path: "assets/package/01_AGV_R20/Print/Chassis/N01_Chassis_120x160_QTY1.stl", color: 0x00e5ff, offset: [0, 0, 0] },
        { label: "Lower Enclosure Base (P01A)", path: "assets/package/01_AGV_R20/Print/Enclosure_Split/STL/P01A_Lower_Base_Rear_Posts_Braced__PRINT.stl", color: 0x3b82f6, offset: [0, 0, 14] },
        { label: "Upper Radio Tower (P01B)", path: "assets/package/01_AGV_R20/Print/Enclosure_Split/STL/P01B_Upper_Tower__PRINT.stl", color: 0x10b981, offset: [0, 0, 48] }
      ],
      specs: [
        ["UWB Node", "Single Tag — Makerfabs ESP32 UWB Pro w/ 1.3\" OLED"],
        ["Demo Operation", "Stationary on Stand S01 (Wheels rotate freely in air)"],
        ["Drive Motors", "2× TT Dual-Shaft DC Gear Motors (70 × 36.6 mm) + L298N"],
        ["Motor Cradles", "N03 Left / N04 Right continuous 4 mm frame (M3×25)"],
        ["Power Split", "1S LiPo (68×54×10 mm) for UWB + 4×AA Pack for Motors/MEGA"],
        ["Power Telemetry", "INA226 (M0903, R100 = 0.1 Ω) + J5019 USB-C Charger"],
        ["Safety Output", "Wheel PWM Speed Control + MH-FMD Acoustic Buzzer"],
        ["Thermal Design", "Dual Aluminum Heatsinks + Thermal Pads (ESP32 & DW1000)"]
      ],
      bomHighlights: [
        "1. Lower Circuit Cover (with MH-FMD Buzzer acoustic vents)",
        "2. Upper Radio Tower Cover (elevated UWB antenna chamber)",
        "3. Makerfabs ESP32 UWB Pro + 1.3\" OLED Display (Single Tag)",
        "4. 4-Point Vertical UWB Cradle (antenna clearance window)",
        "5. Dual Aluminum Heatsinks + 2× Thermal Pads (ESP32 & UWB)",
        "6. Internal Power Tray (P12) & LiPo Edge Guide (P11)",
        "7. J5019 USB-C Charger + INA226 Current/Voltage Sensor",
        "8. 2× Fuses & 2× Slide Switches (isolated UWB & Motor rails)"
      ]
    },
    {
      id: "belt_r18a",
      code: "02_Belt_R18_A",
      name: "Wearable UWB Safety Belt Tag (Option A)",
      role: "Mobile Operator Tag Moving Toward / Away from Machine Zone",
      dimensions: "Housing: 82 × 74 × 38.4 mm (54.4 mm w/ Closed Belt Loops P06)",
      assembledImg: "assets/cad_assembled/output/Three_Models_Assembled_R20/transparent/01_BELT_Assembled_transparent.png",
      bomImg: "assets/bom_r19/output/Poster_BOM_R19/transparent/01_BELT_transparent.png",
      altImg: "assets/bom_r19/output/Poster_BOM_R19/transparent/04_BELT_MODULES_DETAIL_transparent.png",
      stlFiles: [
        { label: "Belt Housing (P01 Captive Nuts)", path: "assets/package/02_Belt_R18_A/Print/STL/P01_Housing_A_Captive_Nuts__PRINT.stl", color: 0x00e5ff, offset: [0, 0, 0] },
        { label: "Front Cover (P02 OLED Window)", path: "assets/package/02_Belt_R18_A/Print/STL/P02_Front_Cover__PRINT.stl", color: 0x3b82f6, offset: [0, 0, 42] },
        { label: "Closed Belt Loop Backplate (P06)", path: "assets/package/02_Belt_R18_A/Print/STL/P06_Closed_Belt_Loop_Backplate__PRINT.stl", color: 0x10b981, offset: [0, 0, -18] }
      ],
      specs: [
        ["UWB Core", "ESP32 + DW1000 UWB mounted vertically (outward antenna)"],
        ["Display", "0.96\" OLED SSD1315 (128×64 px, active 21.74 × 10.86 mm)"],
        ["Operator Alerts", "MH-FMD Buzzer (GPIO25) + Vibration Motor Module (GPIO26)"],
        ["Power & Sensor", "1S LiPo (68×54×10 mm) + J5019 USB-C + INA226 (I2C 0x40)"],
        ["Internal Tray", "P03 Insulating Module Tray Flush V2 + P04 USB-Trimmed Cradle"],
        ["Belt Mount", "P06 Closed-Loop Backplate (2× 44×6 mm slots for ≤40 mm belt)"],
        ["Cooling", "2× Aluminum Heatsinks + Thermal Pads through 11 side vents"]
      ],
      bomHighlights: [
        "1. Front Cover P02 with OLED viewport & buzzer acoustic holes",
        "2. 0.96\" OLED SSD1315 (128×64) retained by P05 Front Retainer",
        "3. Vertical ESP32 + DW1000 UWB Board in P04 Slot Cradle",
        "4. Dual Heatsinks + Thermal Pads aligned with side louver vents",
        "5. P03 Insulating Module Tray separating electronics from LiPo",
        "6. J5019 USB-C Charger + INA226 High-Side Power Monitor",
        "7. MH-FMD Active Buzzer + Haptic Vibration Motor Module",
        "8. P06 Closed-Loop Belt Backplate (4× M3×6 + Captive M3 Nuts)"
      ]
    },
    {
      id: "anchor_r05",
      code: "03_Anchor_R05",
      name: "Fixed UWB Reference Anchor (Clean Lid USB)",
      role: "4-Corner Spatial Reference Infrastructure (Anchors A1–A4)",
      dimensions: "Enclosure: 94 × 68 × 26 mm | Panel DC Jack: Ø8.1 mm (5.5 × 2.1 mm)",
      assembledImg: "assets/cad_assembled/output/Three_Models_Assembled_R20/transparent/02_ANCHOR_Assembled_transparent.png",
      bomImg: "assets/bom_r19/output/Poster_BOM_R19/transparent/02_ANCHOR_transparent.png",
      altImg: "assets/package/03_Anchor_R05/Images/Anchor_R05_BOM_v2_transparent.png",
      stlFiles: [
        { label: "Anchor Base (P01 Clean USB)", path: "assets/package/03_Anchor_R05/Print/P01_Base.stl", color: 0x00e5ff, offset: [0, 0, 0] },
        { label: "Anchor Vented Lid (P02 R05)", path: "assets/package/03_Anchor_R05/Print/P02_Lid.stl", color: 0x3b82f6, offset: [0, 0, 28] }
      ],
      specs: [
        ["UWB Transceiver", "Makerfabs ESP32 UWB DW1000 (Standard Anchor Node)"],
        ["Deployment", "4 Fixed Corner Anchors (A1–A4) at Z = 1.00 m height"],
        ["Ranging Protocol", "DS-TWR (Double-Sided Two-Way Ranging) time-of-flight"],
        ["Thermal Management", "Dual Aluminum Heatsinks (P03 ESP32 + P06 UWB) + Thermal Pads"],
        ["Power Input", "External 5V DC Barrel Jack (Switchcraft 721A ref, 5.5×2.1 mm)"],
        ["Service Port", "Single Micro-USB cutout (8.2 × 3.4 mm, R0.4 corners) on base"]
      ],
      bomHighlights: [
        "1. P02 Clean Vented Lid (dual heatsink cutouts, flush top surface)",
        "2. Makerfabs ESP32 + DW1000 UWB Reference Board",
        "3. P03 ESP32 Heatsink + P04 Thermal Pad",
        "4. P06 DW1000 UWB Heatsink + P07 Thermal Pad",
        "5. P01 Base with 4× PCB standoffs & Micro-USB service window",
        "6. Panel-Mount 5V DC Barrel Jack + Nut/Washer + 2P Right-Angle Header"
      ]
    },
    {
      id: "stand_s01",
      code: "05_AGV_Display_Stand_S01",
      name: "Free-Wheel AGV Display Stand (S01)",
      role: "Elevates AGV R20 Drive Wheels 17.5 mm Above Table for Live Demo",
      dimensions: "160 × 190 × 78 mm (70 mm support shelf height + 8 mm anti-slip lip)",
      assembledImg: "assets/package/05_AGV_Display_Stand_S01/Images/AGV_On_Stand_Baseline.png",
      bomImg: "assets/package/05_AGV_Display_Stand_S01/Images/Stand_Clearance_Baseline.png",
      altImg: "assets/package/05_AGV_Display_Stand_S01/Images/Stand_Only.png",
      stlFiles: [
        { label: "Free-Wheel Display Stand (S01)", path: "assets/package/05_AGV_Display_Stand_S01/Print/S01_R20_Free_Wheel_Display_Stand__PRINT.stl", color: 0x00e5ff, offset: [0, 0, 0] }
      ],
      specs: [
        ["Engineering Purpose", "Allows AGV wheels to spin at full/reduced/zero speed while vehicle remains stationary"],
        ["Support Points", "4 Chassis contact pads at X = 12/108 mm, Y = 16/140 mm"],
        ["Wheel Clearance", "Drive wheels & rear caster suspended 17.5 mm above table surface"],
        ["Center Cutout", "Open center frame clears under-chassis L298N driver & 4×AA holder"],
        ["Retention", "0.5 mm perimeter lip + 2× Velcro/nylon strap channels (Y = 16 & 140 mm)"]
      ],
      bomHighlights: [
        "1. Rigid 4-pillar bridged PETG frame (160 × 190 × 78 mm)",
        "2. 4× Upper chassis support shoulders with anti-slip retaining walls",
        "3. Integrated strap routing slots for secure stationary booth demonstration"
      ]
    },
    {
      id: "conveyor_450",
      code: "04_Conveyor_450mm",
      name: "Modular Industrial Conveyor (450 mm Rail) & KW11 Mounts",
      role: "Synchronized Machine Load Controlled via Safety Relay Interlock",
      dimensions: "Rail Length: 450 mm (150 + 150 + 150 mm segments) | Footprint: 550 × 170 mm",
      assembledImg: "assets/package/04_Conveyor_450mm/Images/Conveyor_450_Rails_Aligned.png",
      bomImg: "assets/package/04_Conveyor_450mm/Images/KW11_Bolted_Mount_Preview.png",
      altImg: "assets/package/04_Conveyor_450mm/Images/Conveyor_Source_CAD.png",
      stlFiles: [
        { label: "KW11 Drilled Base Bracket (P01)", path: "assets/package/04_Conveyor_450mm/Print/Mini_944530/P01_Vertical_M3_Drilled_Base_QTY2.stl", color: 0x00e5ff, offset: [-25, 0, 0] },
        { label: "KW11 Vertical Switch Carrier (P02)", path: "assets/package/04_Conveyor_450mm/Print/Mini_944530/P02_KW11_Vertical_Carrier_QTY2.stl", color: 0xf59e0b, offset: [25, 0, 0] }
      ],
      specs: [
        ["Conveyor Structure", "3-section modular rail (Head 150 mm + Mid 150 mm + Tail 150 mm = 450 mm)"],
        ["Limit Switch Mounts", "P01 Vertical M3 Drilled Base + P02 KW11-3Z Carrier at Head & Tail"],
        ["Fastening", "2× Countersunk M3×12 (DIN 965, Ø5.6 mm head) flush with inner belt wall"],
        ["Safety Integration", "Driven via 4-Channel Relay R01 — automatically halts on DANGER zone entry"]
      ],
      bomHighlights: [
        "1. 450 mm aligned conveyor frame with modular chain links",
        "2. P01 Vertical M3 Drilled Base (hole centers 36 & 52 mm from rail end)",
        "3. P02 KW11-3Z Vertical Limit Switch Carrier (head & tail positions)"
      ]
    },
    {
      id: "relay_r01",
      code: "06_Relay_Control_R01",
      name: "4-Channel Relay Control Enclosure (R01)",
      role: "Hardware Power Interlock for Conveyor & Industrial Machinery",
      dimensions: "External: 110 × 90 × 55 mm (3 mm walls/base/lid) | Board: ~70 × 50 mm",
      assembledImg: "assets/package/06_Relay_Control_R01/Images/Relay_R01_Assembled.png",
      bomImg: "assets/package/08_Booth_Layout/Images/Booth_1800x600_Conveyor_450mm.png",
      altImg: "assets/system/Presentation/Booth_1800x600_Layout_20261111.png",
      stlFiles: [
        { label: "Relay Enclosure Base (R01)", path: "assets/package/06_Relay_Control_R01/Print/Base.stl", color: 0x00e5ff, offset: [0, 0, 0] },
        { label: "Relay Enclosure Lid (R01)", path: "assets/package/06_Relay_Control_R01/Print/Lid.stl", color: 0x3b82f6, offset: [0, 0, 58] }
      ],
      specs: [
        ["Relay Module", "5V 4-Channel Relay Board (SONGLE SRD-05VDC-SL-C)"],
        ["Panel Controls", "Round 4-Pin Rocker Switch (Ø20.2 mm port) + 5.5×2.1 mm DC Jack (Ø8.1 mm)"],
        ["Cable Routing", "Ø12 mm strain-relief cable gland port on top lid (X = +29, Y = -28 mm)"],
        ["Standoffs", "4× M3 internal bosses (62 × 44 mm centers, 7 mm height) + Fit Coupon STL"]
      ],
      bomHighlights: [
        "1. R01 Printed Base with 4× internal M3 relay board standoffs",
        "2. R01 Printed Lid with aligned Switch (X=-30), DC Jack (X=0), and Cable Gland (X=+29)",
        "3. Fit_Coupon.stl verification test plate for panel switch & barrel jack tolerances"
      ]
    },
    {
      id: "booth_layout",
      code: "08_Booth_Layout",
      name: "Competition Booth Demonstration Layout (1800 × 600 mm)",
      role: "Integrated Spatial Safety & Machine Control Testbed (Booth #15)",
      dimensions: "Table: 1800 × 600 × 750 mm | Monitor: 550 × 215 mm | Conveyor Zone: 550 × 170 mm",
      assembledImg: "assets/package/08_Booth_Layout/Images/Booth_1800x600_Conveyor_450mm.png",
      bomImg: "assets/system/Presentation/Booth_1800x600_Layout_20261111.png",
      altImg: "assets/prototype/Reviews/clip_review_20261028/dashboard_contact_sheet.png",
      stlFiles: [
        { label: "AGV Stand S01", path: "assets/package/05_AGV_Display_Stand_S01/Print/S01_R20_Free_Wheel_Display_Stand__PRINT.stl", color: 0x00e5ff, offset: [-90, 0, 0] },
        { label: "Relay Box R01", path: "assets/package/06_Relay_Control_R01/Print/Base.stl", color: 0x10b981, offset: [90, 0, 0] }
      ],
      specs: [
        ["Left Zone", "Stationary AGV R20 (Single Tag) on Free-Wheel Stand S01"],
        ["Center Zone", "Real-Time 2D (X,Y) Telemetry Monitor (550×215 mm) & Control Laptop"],
        ["Right Zone", "450 mm Modular Conveyor + Relay Control Box R01"],
        ["4 Corners", "Fixed UWB Reference Anchors A1–A4 defining the safety coordinate frame"],
        ["Mobile Input", "Presenter moves Wearable Belt Tag R18A toward/away from AGV & Conveyor"]
      ],
      bomHighlights: [
        "1. Complete live demonstration layout designed specifically for 1800 × 600 mm booth table",
        "2. Synchronized visual feedback: physical wheel speed + conveyor movement + live telemetry dashboard"
      ]
    }
  ],

  /* ------------------------------------------------------------------------
     2. UWB CALIBRATION & EXPERIMENTAL RESULTS (SLIDE 6 & Q&A CATEGORY 2)
     Source: https://uwb.pipatintegration.com/ & assets/uwb_report/
     ------------------------------------------------------------------------ */
  uwbExperiment: {
    totalParsedRanges: 50748,
    selectedRawRanges: 33854,
    eligibleRanges: 33669,
    xySnapshots: 3492,
    gridSize: "2.00 × 2.00 m (Z = 1.00 m)",
    pointsCount: "9 Spatial Points (P1–P9) + P1_REPEAT",
    formulaLatex: "y = a \\cdot u + b \\quad \\Longrightarrow \\quad u_{\\text{corrected}} = \\frac{y - b}{a}",
    overallPooled: {
      rawRmseCm: 17.71,
      calRmseCm: 16.15,
      deltaCm: -1.56,
      reductionPct: -8.85,
      singleSampleRawCm: 18.02,
      singleSampleCalCm: 16.48
    },
    centerP9: {"rawRmseCm": 13.75101557590549, "calRmseCm": 12.39493702383219, "reductionPct": -9.861661086686702},
    anchors: [
  {
    "id": "A1",
    "pos": "(0, 0) m",
    "gainA": 1.0176147544824876,
    "offsetB_cm": 1.760829259051544,
    "heldoutPooledRawCm": 16.248007170403575,
    "heldoutPooledCalCm": 12.362197441848851,
    "changePct": -23.915608159214063,
    "note": "Held-out RMSE decreased at this anchor."
  },
  {
    "id": "A2",
    "pos": "(2, 0) m",
    "gainA": 1.0264896725890005,
    "offsetB_cm": -5.506032557142726,
    "heldoutPooledRawCm": 27.33743399755123,
    "heldoutPooledCalCm": 28.00258251297706,
    "changePct": 2.433105153488113,
    "note": "Held-out RMSE increased. Inspect both P9 and P1_REPEAT."
  },
  {
    "id": "A3",
    "pos": "(0, 2) m",
    "gainA": 1.0332456106199481,
    "offsetB_cm": -10.195170700763235,
    "heldoutPooledRawCm": 11.68439394333127,
    "heldoutPooledCalCm": 9.843051734552686,
    "changePct": -15.758987737909225,
    "note": "Pooled improvement, although P9 worsened."
  },
  {
    "id": "A4",
    "pos": "(2, 2) m",
    "gainA": 0.9379472187964698,
    "offsetB_cm": -0.3568555683679975,
    "heldoutPooledRawCm": 10.360714750594122,
    "heldoutPooledCalCm": 2.9894044629110903,
    "changePct": -71.14673519276586,
    "note": "Largest held-out RMSE reduction."
  }
],
    spatialGridPoints: [
  {
    "id": "P1",
    "x": 0.5,
    "y": 0.5,
    "radialRmseCm": 5.56,
    "n": 349
  },
  {
    "id": "P2",
    "x": 1.0,
    "y": 0.5,
    "radialRmseCm": 14.33,
    "n": 348
  },
  {
    "id": "P3",
    "x": 1.5,
    "y": 0.5,
    "radialRmseCm": 10.79,
    "n": 348
  },
  {
    "id": "P4",
    "x": 1.5,
    "y": 1.0,
    "radialRmseCm": 8.29,
    "n": 349
  },
  {
    "id": "P5",
    "x": 1.5,
    "y": 1.5,
    "radialRmseCm": 11.18,
    "n": 352
  },
  {
    "id": "P6",
    "x": 1.0,
    "y": 1.5,
    "radialRmseCm": 12.94,
    "n": 351
  },
  {
    "id": "P7",
    "x": 0.5,
    "y": 1.5,
    "radialRmseCm": 21.28,
    "n": 347
  },
  {
    "id": "P8",
    "x": 0.5,
    "y": 1.0,
    "radialRmseCm": 19.48,
    "n": 348
  },
  {
    "id": "P9",
    "x": 1.0,
    "y": 1.0,
    "radialRmseCm": 18.58,
    "n": 350
  }
],
    svgPlates: [
      { code: "Plate 01", title: "Workspace & Testbed Overview", path: "assets/uwb_report/uwb-report/assets/figures/01_overview.svg", desc: "2.00×2.00 m test grid, Anchors A1–A4, and P1–P9 layout" },
      { code: "Plate 02", title: "Linear Transfer Characteristic", path: "assets/uwb_report/uwb-report/assets/figures/02_transfer_characteristic.svg", desc: "Measured vs. true range regression y = a·u + b across A1–A4" },
      { code: "Plate 03", title: "Spatial Error Heatmaps (P1–P9)", path: "assets/uwb_report/uwb-report/assets/figures/03_error_heatmaps.svg", desc: "Before vs. after calibration bias & RMSE across all point-anchor cells" },
      { code: "Plate 04", title: "Raw Range Error Distributions", path: "assets/uwb_report/uwb-report/assets/figures/04_raw_distributions.svg", desc: "Violin & histogram distributions showing sub-cm jitter vs. static bias" },
      { code: "Plate 05", title: "Held-Out Error CDF (P9 & P1_REPEAT)", path: "assets/uwb_report/uwb-report/assets/figures/05_heldout_error_cdf.svg", desc: "Cumulative distribution of absolute range error on held-out captures" },
      { code: "Plate 06", title: "Accuracy Threshold Profiles", path: "assets/uwb_report/uwb-report/assets/figures/06_threshold_profiles.svg", desc: "Percentage of samples meeting strict error thresholds (5, 10, 15, 20 cm)" },
      { code: "Plate 07", title: "MSE Decomposition (Bias² vs Variance)", path: "assets/uwb_report/uwb-report/assets/figures/07_mse_decomposition.svg", desc: "Decomposes MSE into squared bias and within-capture variance" },
      { code: "Plate 08", title: "Anchor A1 Time-Series Stability", path: "assets/uwb_report/uwb-report/assets/figures/08_time_a1.svg", desc: "Continuous range trace for Anchor A1 across P1–P9 captures" },
      { code: "Plate 09", title: "Anchor A2 Time-Series Stability", path: "assets/uwb_report/uwb-report/assets/figures/09_time_a2.svg", desc: "Continuous range trace for Anchor A2 showing multipath cells P2/P5" },
      { code: "Plate 10", title: "Anchor A3 Time-Series Stability", path: "assets/uwb_report/uwb-report/assets/figures/10_time_a3.svg", desc: "Continuous range trace for Anchor A3 before and after gain correction" },
      { code: "Plate 11", title: "Anchor A4 Time-Series Stability", path: "assets/uwb_report/uwb-report/assets/figures/11_time_a4.svg", desc: "Continuous range traces for Anchor A4 across captures" },
      { code: "Plate 12", title: "Windowed Temporal Stability", path: "assets/uwb_report/uwb-report/assets/figures/12_temporal_stability.svg", desc: "Within-capture rolling mean drift vs. sample standard deviation" },
      { code: "Plate 13", title: "Sample Autocorrelation Analysis", path: "assets/uwb_report/uwb-report/assets/figures/13_autocorrelation.svg", desc: "Lag correlation analysis for independent effective sample sizing" },
      { code: "Plate 14", title: "Channel Availability & Packet Yield", path: "assets/uwb_report/uwb-report/assets/figures/14_availability.svg", desc: "Valid ranging rate across anchors (33,669 eligible of 33,854 selected)" },
      { code: "Plate 15", title: "RX Power Diagnostics (dBm)", path: "assets/uwb_report/uwb-report/assets/figures/15_rx_power_diagnostics.svg", desc: "Received signal power vs. range residual correlation" },
      { code: "Plate 16", title: "Return Repeatability (P1 vs P1_REPEAT)", path: "assets/uwb_report/uwb-report/assets/figures/16_return_repeatability.svg", desc: "Mean range changes between captures, with different boot sessions" },
      { code: "Plate 17", title: "Tag Boot & Session Timeline", path: "assets/uwb_report/uwb-report/assets/figures/17_boot_history.svg", desc: "Chronological capture timeline and firmware session tracking" },
      { code: "Plate 18", title: "Full 50,748-Sample Capture Inventory", path: "assets/uwb_report/uwb-report/assets/figures/18_capture_inventory.svg", desc: "Audit of all 16 capture files (10 selected and 6 excluded captures)" },
      { code: "Plate 19", title: "2D (X,Y) Multilateration Point Clouds", path: "assets/uwb_report/uwb-report/assets/figures/19_xy_clouds.svg", desc: "3,492 solved 2D (X,Y) position clouds vs. ground-truth grid P1–P9" },
      { code: "Plate 20", title: "2D (X,Y) Spatial Error Summary", path: "assets/uwb_report/uwb-report/assets/figures/20_xy_error_summary.svg", desc: "Archived pre-correction XY offsets and per-point radial RMSE" }
    ]
  },

  wiringData: {
    diagrams: [
      {
        title: "AGV R20 · Rev D",
        subtitle: "L298N wiring as reported · Motor operation unverified",
        svg: "assets/wiring/AGV_ESP32_Schematic.svg?v=rev-d"
      },
      {
        title: "Wearable Belt Tag · R13",
        subtitle: "INA226 battery monitoring · ESP32 UWB Basic · OLED, buzzer and vibration",
        svg: "assets/wiring/agv_belt_wiring_ina226_r09/output/AGV_Belt_INA226_R09/02_BELT_No_Extra_Board_R09.svg?v=r13"
      }
    ]
  }
};
