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
     2. UWB CALIBRATION ASSESSMENT (SLIDE 7 & Q&A CATEGORY 2)
     Source: supplied technical report, engineering review 12 Nov 2026
     ------------------------------------------------------------------------ */
  uwbCalibrationAssessment: {
    source: "assets/uwb_report/Delta_RTLS_UWB_Calibration_Constant_vs_Linear_Position_Assessment_EN_2026-11-12.pdf",
    date: "2026-11-12",
    anchors: [
      { id: "A1", offsetCm: 0.00, rawRmseCm: 10.90, constantRmseCm: 10.90, linearRmseCm: 8.94, constantCvRmseCm: 10.72, linearCvRmseCm: 13.71 },
      { id: "A2", offsetCm: 18.28, rawRmseCm: 19.17, constantRmseCm: 5.88, linearRmseCm: 5.87, constantCvRmseCm: 6.85, linearCvRmseCm: 8.39 },
      { id: "A3", offsetCm: 28.97, rawRmseCm: 30.76, constantRmseCm: 9.94, linearRmseCm: 9.18, constantCvRmseCm: 11.60, linearCvRmseCm: 11.20 },
      { id: "A4", offsetCm: 17.87, rawRmseCm: 18.44, constantRmseCm: 4.53, linearRmseCm: 3.86, constantCvRmseCm: 5.43, linearCvRmseCm: 5.45 }
    ],
    overall: { rawRmseCm: 21.14, constantRmseCm: 8.36, linearRmseCm: 7.40, reductionPct: 60.4, constantCvRmseCm: 9.13, linearCvRmseCm: 10.30 },
    positioning: {
      synchronizedCycles: 2441,
      metrics: [
        { label: "Median", rawCm: 14.94, constantCm: 8.36, linearCm: 7.84, targetCm: 30 },
        { label: "P95", rawCm: 26.67, constantCm: 22.65, linearCm: 22.98, targetCm: 50 }
      ]
    }
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
