# Before I Forget

**GBDA 302 — A3 Final Game (Group Project)**

🎮 **Play the game:** [https://qhtan1.github.io/A3_Group9B_MidTermGame/](https://qhtan1.github.io/A3_Group9B_MidTermGame/)

---

## Group Members (Group 9B)

| Name         | WatID   | Student # |
| ------------ | ------- | --------: |
| Kiki Tan     | qhtan   |  20878699 |
| Tracey Chen  | t44chen |  21057118 |
| Rini Lu      | r28lu   |  21091404 |
| Lynette Shen | l34shen |  21068630 |
| Annora Zhu   | y65zhu  |  21057605 |

---

## Description

_Before I Forget_ is a **narrative-driven top-down exploration game built in p5.js** that simulates the lived experience of **dementia and age-related cognitive decline** through systemic gameplay breakdown.

Players inhabit the morning routine of an elderly protagonist across **three non-linear time jumps: Day 1 → Day 3 → Day 5**. Rather than explaining cognitive decline through exposition, the game expresses it through **progressively destabilized mechanics**: distorted UI scenes, observation uncertainty, time pressure, shrinking collectible change, control misfires, memory confusion, and emotionally dissonant audio/subtitle storytelling.

The final experience culminates in a **family confrontation cutscene** and a **branching emotional ending choice**.

---

## Core Gameplay Systems

### 1) Routine Checklist + Clarity System

A persistent morning checklist structures the player’s routine while reinforcing repetition and memory.

**Routine tasks:**

1. Check alarm
2. Look at mirror
3. Brew tea
4. Talk to partner
5. Read news
6. Greet neighbor
7. Check door number

A **Clarity / Attention HUD** decreases when the player misreads environmental changes during observation prompts.

As clarity drops, the game introduces:

- stronger blur
- darker screen overlay
- audio distortion escalation
- forced stillness recovery moments
- risk of game over if clarity reaches zero

On **Day 3 and Day 5**, standing still for **5 seconds** restores one clarity segment.

---

### 2) Daily Distortion Escalation

The game escalates distortion across **Day 1 → Day 3 → Day 5**.

#### Day 1

- stable environment
- no memory distortions
- routine teaches intended sequence
- timer starts after alarm interaction

#### Day 3

Introduces uncertainty systems:

- observation prompts
- distorted environmental assumptions
- tea / mirror / newspaper uncertainty dialogue
- timer distortion enabled
- increasing blur and darkness from low clarity

#### Day 5

Introduces severe systemic breakdown:

- **elderly sprite swap after mirror interaction**
- **control misfires / wrong direction inputs**
- **heavier timer distortion**
- fragmented memory dialogue
- stronger emotional tension with NPCs
- final staircase transitions into the family scene instead of a normal day reset

---

### 3) Coin (Change) Collection Mechanic

A new goal-driven mechanic requires players to collect enough **change before leaving the building**.

Coins appear inside popup interactions and must be **clicked with the mouse**.

### Per-Day Coin Scaling

| Day   | Required | Coin Size | Placement Logic                   |
| ----- | -------: | --------: | --------------------------------- |
| Day 1 |        3 |     16 px | anywhere in popup                 |
| Day 3 |        4 |     12 px | constrained to corner zones       |
| Day 5 |        5 |      8 px | pushed tightly into frame corners |

The staircase remains **locked until the coin quota is met**.

This mechanic metaphorically represents the increasing difficulty of **holding onto small details and practical intentions**.

### Coin Dialogue Progression

**Day 1**

- “I might need this.”
- “Better bring some change.”
- “That should be enough.”
- Goal: “I can grab some groceries.”

**Day 3**

- “Did I already take one?”
- “Was this here before…?”
- “Why am I collecting these again?”
- “This should be enough… I hope.”
- Goal: “It feels important.”

**Day 5**

- “I need more.”
- “Still not enough.”
- “Why are there so many…?”
- “Did I already check here?”
- “I need them.”

---

## Sequence Flow

The routine is structurally sequence-based across rooms:

- **Bedroom:** alarm → mirror → bedroom door
- **Kitchen:** tea → kitchen door
- **Living Room:** partner → newspaper → main door
- **Outside:** neighbor → doorplate → staircase

Some interactions are **mandatory priority steps**, while others can be optionally skipped at the risk of missing narrative context.

### Order Punishment

The code now includes **order-death logic** for key memory tasks.

Interacting with these out of order triggers an immediate game over:

- mirror before alarm
- newspaper before partner
- doorplate before neighbor

This reinforces memory routine fragility through mechanics rather than narration.

---

## Family Scene + Endings

After completing Day 5, the staircase transitions into a **family cutscene**.

### Heard Audio vs Subtitle Dissonance

| Heard                          | Subtitle          |
| ------------------------------ | ----------------- |
| “You can’t do anything right.” | “We’re here.”     |
| “You don’t remember us.”       | “Take your time.” |
| “You’re a burden.”             | “It’s okay.”      |

This mismatch externalizes the protagonist’s emotional confusion and distorted perception.

### Final Choice

At the end of the scene:

- **1 = Hold the hand → Ending A (Acceptance)**
- **2 = Pull away → Ending B (Isolation)**

### Ending A — Acceptance

- screen stabilizes
- music distortion resets
- emotional closure

### Ending B — Isolation

- fragmented text ending
- persistent distortion
- overexposed collapse imagery

---

## Controls

### Core Controls

- **Enter / Any key** → start game
- **WASD / Arrow Keys** → movement
- **E** → interact
- **Space** → close popup / continue dialogue
- **1 / 2** → answer observation prompts
- **Mouse Left Click** → collect coins
- **M** → toggle music
- **ESC** → pause / resume

### Day 5 Special

Movement inputs may occasionally misfire due to cognitive distortion.

---

## Admin / Debug Features

The final code includes a hidden **admin mode for testing and presentation**.

### Toggle

- **` (backtick)** → toggle admin mode

### Debug Shortcuts

- **[** → previous sequence step
- **]** → next sequence step
- **1** → jump to Day 1
- **3** → jump to Day 3
- **5** → jump to Day 5
- **7** → jump to family scene
- **H** → trigger Ending A
- **B** → trigger Ending B

This was useful for **playtesting validation, QA, and in-class demo control**.

---

## Post-Playtest Iterations Reflected in Final Code

The codebase confirms several meaningful post-playtest improvements:

1. **Coin economy fully integrated into staircase exit logic**
   - leaving is impossible without enough change
   - per-day random popup distribution implemented

2. **Day 5 mirror race-condition fix preserved**
   - elderly sprite reliably swaps after mirror close

3. **Per-day newspaper assets now fully day-specific**
   - Day 1, Day 3, Day 5 unique visual files

4. **Family scene rebuilt into multi-phase cinematic state machine**
   - dedicated `FAMILY_SCENE`, `ENDING_A`, `ENDING_B` states

5. **Pause system added**
   - supports timer pause, alarm resume logic, clarity timer preservation

---

## Assets + AI Disclosure

### Original Team-Created Assets

Created and curated by the team using **Google Gemini image generation**, then manually selected and integrated:

- room backgrounds
- popup illustrations
- player sprite sheets
- elderly sprite sheets
- newspaper images
- ending visuals

### Team-Recorded Audio

Recorded in-house:

- partner dialogue
- neighbor dialogue
- ending voice lines

### External Assets

- Tunetank — _Cozy Lofi Music_
- royalty-free alarm + interaction SFX
- p5.js v1.x

### Generative AI Use

Used during development for:

- image asset generation
- early code scaffolding
- debugging support
- coin mechanic implementation
- audio event integration

All final implementation, pacing, narrative design, mechanic tuning, and asset selection decisions were **human-reviewed and intentionally authored by the team**.

---

## Design Intent

The final code successfully aligns mechanics with theme:

- routine repetition → memory dependence
- shrinking coins → fading detail retention
- forced stillness → mental refocusing
- subtitle/audio mismatch → emotional dissonance
- order punishment → fragile procedural memory
- control misfire → loss of bodily certainty

Together, these systems transform a simple morning routine into a **mechanically embodied empathy experience about dementia progression**.

---

## References

[0] ElevenLabs. n.d. Voice Library. ElevenLabs. https://elevenlabs.io/voice-library (elevenlabs.io)

[1] Tunetank. n.d. Cozy Lofi Music (Track 409359). Tunetank. https://tunetank.com/

[2] L. McCarthy and the Processing Foundation. 2024. p5.js (version 1.x) [JavaScript library]. https://p5js.org/

[3] World Health Organization. 2023. Dementia. World Health Organization. https://www.who.int/news-room/fact-sheets/detail/dementia

[4] KOTAKE CREATE. 2023. The Exit 8 [Video game]. KOTAKE CREATE.

[5] Kojima Productions. 2014. P.T. [Video game]. Konami.

[6] SadSquare Studio. 2020. Visage [Video game]. SadSquare Studio.
