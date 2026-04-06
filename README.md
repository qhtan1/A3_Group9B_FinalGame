# Before I Forget

**GBDA 302 — Midterm Game Project**

## Authors (Group 9B)

- Kiki Tan
- Tracey Chen
- Rini Lu
- Lynette Shen
- Annora Zhu

## Description

*Before I Forget* is a narrative-driven top-down exploration game built with p5.js. Players step into the daily routine of an elderly character experiencing the gradual onset of memory loss.

The game follows a repeating morning routine across three days — waking up, checking the mirror, making tea, reading the newspaper, talking to a partner, and greeting a neighbor. As days progress, familiar objects and interactions begin to distort: clock digits blur, tea labels become unreadable, newspaper headlines scramble, and the door number fades. By Day 5, the world has become deeply unreliable — time skips, movements misfire, and objects give wrong responses.

The game communicates cognitive decline through environmental storytelling and systemic distortion rather than explicit explanation, culminating in a branching ending that asks the player to make a final emotional choice.

🎮 **[Play the game here](https://qhtan1.github.io/A2_Group9B_MidTermGame/)**

---

## Gameplay Overview

The game spans **three playable days**, each sharing the same morning routine but diverging in clarity, reliability, and emotional tone.

| Day | Experience |
|-----|------------|
| **Day 1** | Everything is clear and familiar. The routine feels warm and grounded. |
| **Day 3** | Subtle distortions begin — scrambled labels, altered dialogue, fading details. |
| **Day 5** | Severe disorientation. Time skips, controls misfire, objects give wrong feedback. A time limit is introduced. Ends in a branching final scene with two possible endings. |

---

## Core Game Mechanics

### Routine-Based Progression
Players complete a sequence of seven morning tasks tracked by an on-screen **routine checklist**. The checklist creates familiarity so that later distortions feel disorienting and emotionally impactful.

### Environmental Distortion
In later days, the same environment contains subtle and then severe errors: scrambled text, incorrect object labels, unreliable dialogue, and altered interactions. These distortions simulate the confusion of cognitive decline.

### Clarity System
A **Clarity indicator** on the HUD reflects the player's current mental state. Clarity decreases as distortions increase. In Day 5, standing still for 3 seconds allows a brief moment of refocus — a dialogue prompt reads *"Wait… I need a second."* — and restores +1 Clarity.

### Timer System
A **clock timer** starts at 7:00 AM and tracks the player's progress through the morning. In Day 5, time no longer advances normally — it skips forward erratically (e.g. 7:05 → 7:11 → 7:18 → 7:23), reinforcing the loss of temporal grounding. The player must complete a minimum number of routine tasks before reaching the stairs, or the game ends early.

### Music Toggle
Background music can be toggled on and off using the ♪ button.

---

## Routine Checklist

The following tasks must be completed each morning, in order:

1. Check alarm
2. Look at mirror
3. Brew tea
4. Read news
5. Talk to partner
6. Check door number
7. Greet neighbor

---

## Day 5 — Distortion Details

Day 5 introduces compounding breakdowns across all game systems:

### Sprite Change
After looking in the mirror, the player character's sprite switches to an aged appearance, reflecting the character's distorted self-perception.

### Time Skipping
The clock no longer advances normally. Time jumps forward in irregular intervals, creating a sense of lost time and urgency.

### Control Misfires
Movement inputs occasionally produce the wrong direction — pressing W may move the character right; pressing A may move them up. This mechanic directly puts the player inside the character's disorientation.

### Wrong Object Feedback
Interacting with objects returns incorrect responses:
- Alarm clock → *"I should make tea."*
- Tea canister → *"Why am I here?"*

### Stair Gate (Time Limit)
A minimum number of routine tasks must be completed before the player can leave via the stairs. Attempting to leave too early triggers a **game over**.

---

## Endings

Before the ending, a short cutscene plays: a family member enters the room and speaks. What the player *hears* and what the *subtitles show* are different, with a 1–2 second delay between them.

| | Heard | Subtitles (delayed) |
|--|-------|---------------------|
| Line 1 | *"You can't do anything right."* | *"We're here."* |
| Line 2 | *"You don't remember us."* | *"Take your time."* |
| Line 3 | *"You're a burden."* | *"It's okay."* |

The player is then given a choice.

### Ending A — Acceptance
**Condition:** Choose to hold the hand.

The screen stabilizes. The character's appearance softens. Text fades in slowly:

> *Before I forget… Thank you for staying.*

### Ending B — Isolation
**Condition:** Choose to pull away.

The screen overexposes. The character blurs. Text fragments and disappears:

> *Bef— For— Forget*
>
> *…*

---

## Game World

### Bedroom
- Wake up
- Check the alarm clock
- Look in the mirror *(Day 5: triggers sprite change)*

### Kitchen
- Locate the tea canister
- Brew tea

### Living Room
- Read the newspaper
- Talk to your partner

### Outside (Hallway)
- Check the door plate
- Greet the neighbor
- *Day 5: Stairs require minimum routine completion before exit*

---

## Controls

| Key / Input | Action |
|-------------|--------|
| W / ↑ | Move up *(may misfire on Day 5)* |
| S / ↓ | Move down *(may misfire on Day 5)* |
| A / ← | Move left *(may misfire on Day 5)* |
| D / → | Move right *(may misfire on Day 5)* |
| E | Interact with objects marked with **!** |
| Space | Close popup / advance dialogue |
| Enter | Start game from title screen |
| ♪ (button) | Toggle background music |
| Stand still (3 sec) | *Day 5 only:* Brief refocus — Clarity +1 |

---

## Technical Implementation

- **Engine:** p5.js
- **Architecture:** Modular class-based design with separate files for Player, WorldLevel, and game systems
- **Level Data:** JSON-driven configuration defining dialogue, object labels, and distortion parameters per day
- **Sprite Animation:** 3-frame walking animation in four directions; Day 5 includes a mid-session sprite sheet swap
- **Collision Detection:** AABB (Axis-Aligned Bounding Box) system for obstacles and room boundaries
- **Room Transitions:** Sequential interaction events advance the player through the routine
- **Day Progression:** Completing each day's routine triggers a transition to the next, with escalating distortion parameters
- **Branching Endings:** Final scene uses a choice prompt to determine one of two outcome states with distinct visual and text effects

---

## Setup and Play Instructions

1. Open the game via the [GitHub Pages link](https://qhtan1.github.io/A2_Group9B_MidTermGame/).
2. Press **Start** or **Enter** on the title screen.
3. Use **WASD** or **Arrow Keys** to move.
4. Approach objects marked with **!** and press **E** to interact.
5. Press **Space** to close dialogue popups or advance text.
6. Complete all routine tasks to progress through each day.
7. On Day 5, complete enough tasks before reaching the stairs — or face an early ending.
8. Make your final choice to determine the ending.

---

## Iteration Notes

### Post-Playtest Changes (Midterm)

- **Added explicit gameplay systems.** Early prototypes focused purely on environmental storytelling. After playtesting, a routine checklist, timer, and Clarity indicator were introduced to give players clearer goals and feedback.
- **Improved spatial readability.** Room layouts were simplified so key objects (clock, mirror, tea canister, newspaper) are easier to locate.

### Post-Showcase Additions (Final)

- **Day 5 implemented** with compounding distortion across movement, time, objects, and visuals.
- **Two endings added** — Acceptance (Ending A) and Isolation (Ending B) — triggered by a final player choice.
- **Pre-ending cutscene** introduced featuring a mismatched audio/subtitle scene to reflect the character's perceptual disconnect.
- **Stair gate mechanic** adds consequence to incomplete routines on Day 5.
- **Sprite sheet swap** after mirror interaction on Day 5 visually marks the character's altered self-perception.
- **Clarity refocus mechanic** rewards stillness with a brief moment of mental clarity on Day 5.

### Planned Future Improvements

- Further research into dementia and cognitive decline to inspire additional grounded mechanics.
- Expanded environmental inconsistencies inspired by *The Exit 8*, *P.T.*, and *Visage (Chapter 2)*.
- Additional sound design and ambient effects to reinforce emotional tone.

---

## Assets

All pixel art backgrounds, character sprites, UI popup images, and interactive scene illustrations were created specifically for this project. Assets are organized in the `assets/` folder.

---

## GenAI Disclosure

Generative AI tools were used during development to assist with code debugging, gameplay logic exploration, and art asset generation.

All gameplay mechanics, narrative design, visual direction, and final implementation decisions were determined and reviewed by the team.

GenAI outputs were treated as development assistance rather than final solutions, and all generated material was modified or integrated through human decision-making.

---

## References

World Health Organization. 2023. *Dementia*. World Health Organization. https://www.who.int/news-room/fact-sheets/detail/dementia
