# Medicine / AED Educational Trainer — active implementation plan

Date: 2026-09-24
Branch: `medicine-aed`
Repository: `Youteach-org/Classroom-Online-Games`

## Goal

Build one near-final classroom AED trainer around an ESP32-S3, with spoken prompts, a small status display, physical controls, inert training pads, optional educational single-lead ECG acquisition, and mandatory BLE telemetry into the Classroom Online Games Teacher Monitor.

The first unit should be close enough to the final hardware that later work is refinement rather than rebuilding from scratch.

## Fixed architecture

### Physical trainer
- ESP32-S3 DevKitC-1 N16R8 or equivalent ESP32-S3 board with BLE.
- 0.96-inch SSD1306 128x64 I2C OLED, non-touch.
- MAX98357A I2S amplifier.
- Reuse an existing small radio speaker if it is 4 ohm or 8 ohm and suitable for the amplifier.
- Physical POWER control.
- Large physical yellow momentary SHOCK button.
- Inert reusable training pads.
- Battery / power-bank operation for classroom use.
- No high-voltage subsystem and no therapeutic electrical output.

### Educational ECG
- AD8232 single-lead ECG front end with 3-lead cable and disposable snap electrodes.
- Used only for educational waveform acquisition, heart-rate / R-R display and lead-off state.
- ECG data must never automatically decide or enable the simulated shock recommendation.
- When ECG electrodes are attached to a person, operate from battery and use BLE; do not keep a mains-powered computer connected by USB.

### Teacher Monitor
BLE is mandatory in the first near-final prototype.

The Classroom Online Games Teacher Monitor is the canonical instructor view. It must show, per trainer/team:
- online/offline
- battery state
- current AED training state
- training-pad connection state
- ECG lead-off/contact state
- educational ECG waveform
- heart rate
- R-R trend
- selected training scenario
- analyze event
- simulated shock-advised / no-shock-advised state
- SHOCK button event
- CPR / reassessment state
- timestamped event timeline

### Student-facing display
The 0.96-inch OLED is output only. It shows short prompts such as:
- COLOQUE PARCHES
- ANALIZANDO
- NO TOQUE
- PRESIONE SHOCK
- INICIE RCP

Optional small icons/status:
- BLE
- battery
- pads connected

No touch interface is required.

## Purchasing rule

Prototype purchases are sourced from Mercado Libre México only, using listings that are currently available when the purchase is made.

## Purchase order

### Buy first
1. ESP32-S3 DevKitC-1 N16R8 or confirmed equivalent with BLE.
2. Confirmed 0.96-inch SSD1306 128x64 I2C OLED.
3. MAX98357A I2S amplifier.
4. AD8232 ECG kit with 3-lead cable and snap electrodes.
5. Large yellow momentary SHOCK pushbutton.
6. Simple POWER switch/button.
7. Breadboard or perfboard.
8. Jumper wire / hookup wire / headers / JST or other low-voltage connectors.
9. Heat-shrink, screws and standoffs as needed.

### Reuse if already available
- small radio speaker, after checking impedance/rating
- USB-C data cable
- 5 V USB power bank

### Buy after bench validation
- final ABS enclosure
- inert reusable AED training pads and durable pad cable/connectors
- spare ECG electrodes
- final front-panel labels
- any battery gauge hardware if the selected power solution does not expose battery level cleanly

### Do not buy
- touch display
- large TFT
- high-voltage transformer
- capacitor bank
- defibrillator charging/discharge components
- therapeutic electrodes
- separate microSD module for the first prototype

Initial spoken prompts can be stored in ESP32-S3 flash. Add external storage only if the final audio set requires it.

## Implementation order

### Phase 1 — bench core
Goal: prove the basic electronics before building the case.

Connect and test:
- ESP32-S3
- 0.96-inch OLED
- MAX98357A
- reused speaker
- POWER control
- SHOCK button

Pass criteria:
- firmware boots reliably
- OLED shows short messages
- speaker reproduces clear stored voice prompts
- SHOCK button is detected reliably
- BLE advertising works

### Phase 2 — AED training state machine
Implement:
1. OFF
2. STARTUP / SELF_TEST
3. APPLY_PADS
4. READY_TO_ANALYZE
5. ANALYZING
6. SHOCK_ADVISED or NO_SHOCK_ADVISED
7. STAND_CLEAR
8. SIMULATED_SHOCK
9. CPR
10. REASSESS

Rules:
- instructor-selected/scripted scenario determines shockable vs non-shockable training outcome
- SHOCK input is accepted only in the simulated shock-advised state
- simulated shock produces only sound/light/display/software events

### Phase 3 — audio and OLED behavior
For each state:
- play the corresponding Spanish voice prompt
- show a short OLED message
- publish the state through BLE
- record a timestamped event

First prompt set:
- power on
- call for help
- attach pads
- check pads
- do not touch / analyzing
- shock advised
- stand clear
- press shock
- simulated shock delivered
- no shock advised
- begin CPR
- continue CPR
- reassess
- training complete

Final wording is reviewed against the course protocol before classroom release.

### Phase 4 — educational ECG channel
Integrate AD8232:
- analog ECG sampling
- lead-off detection
- simple signal filtering suitable for visualization
- R-peak detection for educational heart-rate / R-R display
- BLE packetization for Teacher Monitor

The physical trainer may show only a compact heart-rate/status indication. The waveform belongs in Teacher Monitor.

### Phase 5 — BLE protocol
Create a custom BLE GATT service with characteristics for:
- device/status
- training state/events
- ECG sample packets
- instructor configuration/scenario

Minimum telemetry:
- trainer ID
- team/session ID
- battery
- pad state
- ECG lead state
- training state
- heart rate
- R-R
- scenario
- events

### Phase 6 — Teacher Monitor integration
Inside Classroom Online Games:
- discover/pair trainer
- show one card per connected trainer/team
- live state badge
- ECG strip
- heart rate / R-R
- pad/electrode status
- battery/BLE status
- event timeline
- instructor scenario control
- session reset

Teacher Monitor remains the detailed interface; no separate ECG-only page is required.

### Phase 7 — pads and enclosure
After the bench unit works:
- build inert reusable AED pads
- add durable low-voltage connectors
- mount ESP32, OLED, speaker and buttons
- cut protected OLED window
- add speaker grille
- add strain relief
- label POWER / SHOCK / TRAINING ONLY
- fit battery/power bank securely

Do not freeze enclosure dimensions until the bench layout is physically proven.

### Phase 8 — integrated classroom test
Validate:
- prompt audibility
- OLED readability
- BLE reliability
- Teacher Monitor live updates
- ECG visualization quality
- lead-off behavior
- button durability
- pad cable durability
- state-machine correctness
- simulated shock lockout
- CPR/reassessment loop
- recovery after disconnect/reconnect

## Definition of done for prototype V1

V1 is ready when:
- physical trainer completes the complete AED teaching sequence
- audio prompts work from local storage
- OLED messages track the state
- inert pads can be connected and used in the exercise
- SHOCK is entirely simulated
- AD8232 can provide educational ECG/heart-rate telemetry
- BLE sends live state and ECG telemetry
- Teacher Monitor displays the trainer in real time
- device runs from battery for real-person ECG demonstrations
- no therapeutic/high-voltage circuit exists
- branch remains unmerged until explicit user acceptance

## Current immediate next action

Purchase/collect the Phase 1 components, verify the reused speaker rating, then build the ESP32-S3 + OLED + MAX98357A + speaker bench stack before cutting or buying the final enclosure.
