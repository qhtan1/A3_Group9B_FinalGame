let world;
let player;
let gameState = "TITLE";
let activeTarget = null;

// --- New Systems ---
let checklist;
let timerSystem;
let attentionSystem;

let bgImages = {};

// 嵌套对象，区分 Day 1 / Day 3 / Day 5 的图片
let uiImages = {
  day1: {},
  day3: {},
  day5: {},
};

let playerSprites = {
  down: [],
  up: [],
  left: [],
  right: [],
};

// Elderly sprites for Day 5 (loaded in preload)
let elderlySprites = {
  down: [],
  left: [],
  right: [],
};

// --- Loading progress ---
let _loadedCount = 0;
const _totalAssets = 46; // total loadImage() calls across all loops

function _onAssetLoad() {
  _loadedCount++;
  const pct = Math.min(100, (_loadedCount / _totalAssets) * 100);
  const fill = document.getElementById("loading-bar-fill");
  if (fill) fill.style.width = pct + "%";
}

// --- DEBUG OPTION ---
let showDebug = false;

// --- ADMIN / DEV MODE ---
// Toggle with backtick (`). When OFF, no dev controls are available.
let adminMode = false;

// Room and player position lookup per sequence step
const stepRoomMap = {
  0: "Bedroom", 1: "Bedroom", 2: "Bedroom",
  3: "Kitchen", 4: "Kitchen",
  5: "LivingRoom", 6: "LivingRoom", 7: "LivingRoom",
  8: "Outside", 9: "Outside", 10: "Outside",
};
const stepPlayerPos = {
  0: { x: 150, y: 130 }, 1: { x: 150, y: 130 }, 2: { x: 150, y: 130 },
  3: { x: 160, y: 160 },  4: { x: 160, y: 160 },
  5: { x: 155, y: 160 },  6: { x: 155, y: 160 },  7: { x: 155, y: 160 },
  8: { x: 160, y: 120 }, 9: { x: 160, y: 120 }, 10: { x: 160, y: 120 },
};

/**
 * Admin: jump to any sequence step within the current day
 */
function adminJumpToStep(step) {
  step = constrain(step, 0, 10);
  world.sequenceStep = step;
  world.currentRoom = stepRoomMap[step];
  player.x = stepPlayerPos[step].x;
  player.y = stepPlayerPos[step].y;
  gameState = "EXPLORE";
  isWaitingForObservationChoice = false;
  isDistorted = false;

  const modal = document.getElementById("observation-modal");
  if (modal) modal.classList.remove("show");

  document.getElementById("npc-name").innerText = "[ADMIN]";
  document.getElementById("dialogue-text").innerText =
    `Jumped to step ${step} — ${world.currentRoom} (Day ${world.currentDay})`;
}

/**
 * Admin: jump to a specific day, resets everything
 */
function adminJumpToDay(day) {
  world.resetForNextDay(day);
  player.x = 150;
  player.y = 130;
  gameState = "EXPLORE";
  checklist.reset();
  timerSystem.reset();
  attentionSystem.reset();
  isDistorted = false;
  isWaitingForObservationChoice = false;

  // Reset Day 5 flags
  day5MirrorDone          = false;
  player.useElderlySprite = false;
  player.wrongDirEnabled  = false;

  // Reset ending/family scene state
  familyScenePhase = 0;
  endingPhase      = 0;

  const modal = document.getElementById("observation-modal");
  if (modal) modal.classList.remove("show");

  if (day === 3 || day === 5) timerSystem.enableDistortion();

  checklist.minTasksRequired = (day === 3 || day === 5) ? 4 : 3;

  // Restore hidden panels for gameplay
  document.getElementById("checklist-panel").style.visibility = "visible";
  document.getElementById("npc-name").innerText    = "[ADMIN]";
  document.getElementById("dialogue-text").innerText =
    `Jumped to Day ${day} \u2014 start of day`;
  document.getElementById("day-display").innerText = "Day " + day;
}

// --- Day 3 特殊状态变量 ---
let isDistorted = false;
let isWaitingForObservationChoice = false;

// --- Game Over animation state ---
let gameOverAlpha = 0;
let gameOverScreenShown = false;

// --- Day-start popup debounce ---
let dayStartPopupTime = 0;

// ── Day 5 state ──────────────────────────────────────────────────────────────
let day5MirrorDone = false;   // becomes true after player looks in mirror Day 5

// Clarity pause mechanic (Day 3 / Day 5)
let clarityPauseActive = false; // true while waiting for player to rest
let clarityStillSince  = null;  // millis() when player last became still
let _clarityPausedAt   = null;  // set when game pauses mid-still-timer
let clarityRestoreMsg  = "";    // warning message shown after recovery

// Family scene (plays before the two endings)
let familyScenePhase     = 0;   // 0–7  (dialogue pairs then choice)
let familySceneStartTime = 0;

const FAMILY_HEARD = [
  "\u201cYou can\u2019t do anything right.\u201d",
  "\u201cYou don\u2019t remember us.\u201d",
  "\u201cYou\u2019re a burden.\u201d",
];
const FAMILY_SUBTITLE = [
  "\u201cWe\u2019re here.\u201d",
  "\u201cTake your time.\u201d",
  "\u201cIt\u2019s okay.\u201d",
];

// Ending state
let endingPhase     = 0;
let endingStartTime = 0;
const ENDING_B_FRAGMENTS = ["Bef\u2014", "For\u2014", "Forget", "\u2026"];

/**
 * Handle observation choice result
 * @param {string} answer - "wrong" or "normal"
 */
function handleObservationChoice(answer) {
  console.log(`handleObservationChoice called with answer: ${answer}`);

  const step = attentionSystem.getObservationStep();
  console.log(`Observation step: ${step}`);

  // Mark this observation as answered
  attentionSystem.markObservationAnswered(step);

  // Check if answer is correct
  const isCorrect = attentionSystem.isAnswerCorrect(step, answer);
  console.log(`Answer is correct: ${isCorrect}`);

  if (isCorrect) {
    // Correct answer - continue game normally
    document.getElementById("npc-name").innerText = "System";
    document.getElementById("dialogue-text").innerText =
      "Observation complete.";
  } else {
    // Wrong answer - decrease attention and reveal clarity panel
    document.getElementById("attention-panel").style.visibility = "visible";
    document.getElementById("npc-name").innerText = "System";
    document.getElementById("dialogue-text").innerText =
      "That doesn't seem right...";

    let levelChanged = attentionSystem.decrease(34);
    console.log(
      `Attention level changed: ${levelChanged}, new level: ${attentionSystem.getLevel()}`,
    );
    if (levelChanged) {
      let msg = attentionSystem.getWarningMessage(attentionSystem.getLevel());
      // Update music distortion immediately to match the dropped clarity level
      let segs = attentionSystem.getSegments();
      if (segs <= 1) {
        setMusicDistortionLevel(2); // 1 bar — heavy
      } else if (segs <= 2) {
        setMusicDistortionLevel(1); // 2 bars — moderate
      }
      // Clarity pause mechanic (Day 3 & Day 5)
      // No forced freeze: "Wait…" shows after popup closes; player stops
      // moving for 5 s to recover clarity.
      if (world.currentDay === 3 || world.currentDay === 5) {
        clarityPauseActive = true;
        clarityStillSince  = null;
        clarityRestoreMsg  = msg;
      } else {
        setTimeout(() => {
          document.getElementById("dialogue-text").innerText = msg;
        }, 500);
      }
    } else {
      // Level didn't change — still update music distortion for the raw decrease
      let segs = attentionSystem.getSegments();
      if (segs <= 1) {
        setMusicDistortionLevel(2);
      } else if (segs <= 2) {
        setMusicDistortionLevel(1);
      }
    }
  }

  attentionSystem.dismissObservationUI();
  isWaitingForObservationChoice = false;

  // Continue to next sequence step after a brief delay
  setTimeout(() => {
    processSequence();
  }, 1000);
}

// --- Hitboxes (Collision Bounds) ---
const roomObstacles = {
  Bedroom: [
    { x: 0, y: 0, w: 320, h: 75 },
    { x: 40, y: 55, w: 60, h: 65 },
    { x: 185, y: 55, w: 42, h: 35 },
    { x: 10, y: 55, w: 20, h: 30 },
    { x: 260, y: 55, w: 60, h: 40 },
  ],
  Kitchen: [
    { x: 0, y: 0, w: 320, h: 75 },

    { x: 0, y: 75, w: 28, h: 40 },
    // --- 岛台 ---
    { x: 0, y: 115, w: 130, h: 65 },
    // --- 桌子 ---
    { x: 190, y: 110, w: 40, h: 30 },
    // --- 大柜子下半部分 ---
    { x: 260, y: 55, w: 60, h: 40 },
    // --- 左边椅子 ---
    { x: 165, y: 110, w: 25, h: 40 },
    // --- 右边椅子 ---
    { x: 230, y: 110, w: 25, h: 40 },
  ],
  LivingRoom: [
    { x: 0, y: 0, w: 320, h: 75 },
    { x: 0, y: 55, w: 38, h: 140 },
    { x: 210, y: 55, w: 95, h: 35 },
    { x: 185, y: 115, w: 70, h: 30 },
    { x: 280, y: 55, w: 80, h: 120 },
  ],
  Outside: [{ x: 0, y: 0, w: 320, h: 60 }],
};

// --- Interactable Items ---
const items = [
  {
    step: 0,
    room: "Bedroom",
    x: 113,
    y: 70,
    name: "Alarm Clock",
    type: "popup",
    hint: "Press 'E' to check alarm",
  },
  {
    step: 1,
    room: "Bedroom",
    x: 200,
    y: 64,
    name: "Mirror",
    type: "popup",
    hint: "Press 'E' to look at mirror",
  },
  {
    step: 2,
    room: "Bedroom",
    x: 160,
    y: 75,
    name: "Bedroom Door",
    type: "door",
    hint: "Press 'E' to open door",
  },
  {
    step: 3,
    room: "Kitchen",
    x: 46,
    y: 115,
    name: "Tea Canister",
    type: "popup",
    hint: "Press 'E' to brew tea",
  },
  {
    step: 4,
    room: "Kitchen",
    x: 160,
    y: 65,
    name: "Kitchen Door",
    type: "door",
    hint: "Press 'E' to open door",
  },
  {
    step: 5,
    room: "LivingRoom",
    x: 257,
    y: 95,
    name: "Partner",
    type: "popup",
    hint: "Press 'E' to talk to partner",
  },
  {
    step: 6,
    room: "LivingRoom",
    x: 195,
    y: 125,
    name: "Newspaper",
    type: "popup",
    hint: "Press 'E' to read news",
  },
  {
    step: 7,
    room: "LivingRoom",
    x: 155,
    y: 65,
    name: "Main Door",
    type: "door",
    hint: "Press 'E' to open door",
  },
  {
    step: 8,
    room: "Outside",
    x: 220,
    y: 50,
    name: "Neighbor",
    type: "popup",
    hint: "Press 'E' to greet neighbor",
  },
  {
    step: 9,
    room: "Outside",
    x: 155,
    y: 55,
    name: "Doorplate 204",
    type: "popup",
    hint: "Press 'E' to check door number",
  },
  {
    step: 10,
    room: "Outside",
    x: 90,
    y: 80,
    name: "Staircase",
    type: "exit",
    hint: "Press 'E' to leave the building",
  },
];

function preload() {
  bgImages.Bedroom   = loadImage("assets/bg_bedroom.png",    _onAssetLoad, _onAssetLoad);
  bgImages.Kitchen   = loadImage("assets/bg_kitchen.png",    _onAssetLoad, _onAssetLoad);
  bgImages.LivingRoom= loadImage("assets/bg_livingroom.png", _onAssetLoad, _onAssetLoad);
  bgImages.Outside   = loadImage("assets/bg_outside.jpg",    _onAssetLoad, _onAssetLoad);

  // --- Day 1 图片 ---
  uiImages.day1[0] = loadImage("assets/ui_clock.png",    _onAssetLoad, _onAssetLoad);
  uiImages.day1[1] = loadImage("assets/ui_mirror.png",   _onAssetLoad, _onAssetLoad);
  uiImages.day1[3] = loadImage("assets/ui_tea.png",      _onAssetLoad, _onAssetLoad);
  uiImages.day1[5] = loadImage("assets/ui_partner.png",  _onAssetLoad, _onAssetLoad);
  uiImages.day1[6] = loadImage("assets/ui_news.png",     _onAssetLoad, _onAssetLoad);
  uiImages.day1[8] = loadImage("assets/ui_neighbor.png", _onAssetLoad, _onAssetLoad);
  uiImages.day1[9] = loadImage("assets/ui_door204.png",  _onAssetLoad, _onAssetLoad);

  // --- Day 3 图片 ---
  uiImages.day3[0] = loadImage("assets/ui_clock_day3.png",   _onAssetLoad, _onAssetLoad);
  uiImages.day3[1] = loadImage("assets/ui_mirror_day3.png",  _onAssetLoad, _onAssetLoad);
  uiImages.day3[3] = loadImage("assets/ui_tea_day3.png",     _onAssetLoad, _onAssetLoad);
  uiImages.day3[5] = loadImage("assets/ui_partner.png",      _onAssetLoad, _onAssetLoad);
  uiImages.day3[6] = loadImage("assets/ui_news_day3.png",    _onAssetLoad, _onAssetLoad);
  uiImages.day3[8] = loadImage("assets/ui_neighbor.png",     _onAssetLoad, _onAssetLoad);
  uiImages.day3[9] = loadImage("assets/ui_door204_day3.png", _onAssetLoad, _onAssetLoad);

  // --- Day 5 图片 ---
  uiImages.day5[0] = loadImage("assets/ui_clock_day3.png",   _onAssetLoad, _onAssetLoad);
  uiImages.day5[1] = loadImage("assets/ui_mirror_day5.png",  _onAssetLoad, _onAssetLoad);
  uiImages.day5[3] = loadImage("assets/ui_tea_day3.png",     _onAssetLoad, _onAssetLoad);
  uiImages.day5[5] = loadImage("assets/ui_partner.png",      _onAssetLoad, _onAssetLoad);
  // day5[6] is drawn as messy text — no image needed
  uiImages.day5[8] = loadImage("assets/ui_neighbor.png",     _onAssetLoad, _onAssetLoad);
  uiImages.day5[9] = loadImage("assets/ui_door204_day3.png", _onAssetLoad, _onAssetLoad);

  // 🚨 注意这里的后缀全部改成了大写 .PNG 🚨
  for (let i = 1; i <= 3; i++) {
    playerSprites.down.push(loadImage(`assets/Front${i}.PNG`,  _onAssetLoad, _onAssetLoad));
    playerSprites.up.push(  loadImage(`assets/Back${i}.PNG`,   _onAssetLoad, _onAssetLoad));
    playerSprites.left.push(loadImage(`assets/Left${i}.PNG`,   _onAssetLoad, _onAssetLoad));
    playerSprites.right.push(loadImage(`assets/Right${i}.PNG`, _onAssetLoad, _onAssetLoad));
  }

  // Elderly sprites — Day 5 mirror swap
  for (let i = 1; i <= 3; i++) {
    elderlySprites.down.push( loadImage(`assets/OldFront${i}.jpg`, _onAssetLoad, _onAssetLoad));
    elderlySprites.left.push( loadImage(`assets/OldLeft${i}.jpg`,  _onAssetLoad, _onAssetLoad));
    elderlySprites.right.push(loadImage(`assets/OldRight${i}.jpg`, _onAssetLoad, _onAssetLoad));
  }
}

function setup() {
  let canvas = createCanvas(320, 180);
  canvas.parent("canvas-holder");
  noSmooth();

  // All assets are loaded — fade out loading screen
  const loadingScreen = document.getElementById("loading-screen");
  if (loadingScreen) {
    // Ensure bar shows 100% briefly before fading
    const fill = document.getElementById("loading-bar-fill");
    if (fill) fill.style.width = "100%";
    setTimeout(() => {
      loadingScreen.classList.add("hide");
      setTimeout(() => loadingScreen.style.display = "none", 750);
    }, 300);
  }

  world = new WorldLevel();
  player = new Player(150, 130, 20, 20);

  // Initialize new systems
  checklist = new ChecklistManager();
  timerSystem = new TimerSystem();
  attentionSystem = new AttentionSystem();

}

function draw() {
  // --- Persistent clarity effects (scale 0–1, where 0 = no clarity left) ---
  let clarityRatio = attentionSystem.currentAttention / attentionSystem.maxAttention;
  let persistBlur   = map(clarityRatio, 1, 0, 0, 4);   // 0 → 4 px as clarity drops
  let tempBlur      = attentionSystem.getBlurAmount() * 3;
  let totalBlur     = persistBlur + tempBlur;

  // Apply combined blur BEFORE drawing game content
  if (totalBlur > 0) {
    drawingContext.filter = `blur(${totalBlur}px)`;
  }

  // Day 3/5 clarity ratio passed to player for glitch + speed effects
  let day3Clarity = (world.currentDay === 3 || world.currentDay === 5) ? clarityRatio : 1;

  if (gameState === "TITLE") {
    background(13);
    drawingContext.filter = "none";
    return;
  }

  // ── Day 5 terminal/cinematic states — draw then return early ────────────
  if (gameState === "FAMILY_SCENE") {
    drawingContext.filter = "none";
    drawFamilyScene();
    return;
  }
  if (gameState === "ENDING_A") {
    drawingContext.filter = "none";
    drawEndingA();
    return;
  }
  if (gameState === "ENDING_B") {
    drawingContext.filter = "none";
    drawEndingB();
    return;
  }

  if (gameState === "EXPLORE") {
    drawBackground();

    // Draw required markers BEFORE player so the player renders on top
    if (world.currentDay === 1 || world.currentDay === 5) {
      drawRequiredMarkers();
    }

    let obstacles = roomObstacles[world.currentRoom] || [];
    player.handleMovement(obstacles, width, height, day3Clarity);

    // Clarity pause: recover when player stands still for 5 s
    if (clarityPauseActive) {
      // Persistently show Wait message while clarity is not full
      document.getElementById("npc-name").innerText      = "System";
      document.getElementById("dialogue-text").innerText = "Wait… I need a second.";
      if (!player.isMoving) {
        if (clarityStillSince === null) clarityStillSince = millis();
        if (millis() - clarityStillSince >= 5000) {
          clarityStillSince = null; // reset for potential next tier
          attentionSystem.increase(34);
          let rSegs = attentionSystem.getSegments();
          if (rSegs >= 3) {
            // Fully recovered
            clarityPauseActive = false;
            setMusicDistortionLevel(0);
            document.getElementById("npc-name").innerText      = "System";
            document.getElementById("dialogue-text").innerText = clarityRestoreMsg;
          } else {
            // Partial recovery — keep showing Wait, player needs another 5 s
            if (rSegs >= 2) setMusicDistortionLevel(1);
            else            setMusicDistortionLevel(2);
          }
        }
      } else {
        clarityStillSince = null; // moving — reset still-timer
      }
    }

    // Walking sound: play while moving, pause when still
    var _walkSnd = document.getElementById("walking-sound");
    if (_walkSnd) {
      if (player.isMoving) {
        if (_walkSnd.paused) _walkSnd.play();
      } else {
        if (!_walkSnd.paused) { _walkSnd.pause(); _walkSnd.currentTime = 0; }
      }
    }

    checkInteractions();
    player.draw(day3Clarity);

    if (showDebug) drawDebugBoxes();
  } else if (gameState === "INTERACT") {
    drawBackground();
    player.draw(day3Clarity);
    drawUIPopup();
  } else if (gameState === "DAY_START") {
    drawBackground();
    player.draw(1);
    drawDayStartPopup();
  } else if (gameState === "PAUSED") {
    drawBackground();
    player.draw(day3Clarity);
  } else if (gameState === "TRANSITION") {
    background(0);
  } else if (gameState === "GAME_OVER") {
    // Draw shaking scene that collapses into black
    let shake = map(gameOverAlpha, 0, 255, 10, 0);
    push();
    translate(random(-shake, shake), random(-shake, shake));
    drawBackground();
    player.draw(day3Clarity);
    pop();

    // Gradually fade to black
    gameOverAlpha = min(255, gameOverAlpha + 2.5);
    fill(0, 0, 0, gameOverAlpha);
    noStroke();
    rect(0, 0, width, height);

    // Once fully black, show HTML overlay
    if (gameOverAlpha >= 255) {
      showGameOverScreen();
    }
    drawingContext.filter = "none";
    return; // skip UI overlays during collapse
  }

  // Reset blur so UI panels stay crisp
  drawingContext.filter = "none";

  // Persistent darkness overlay on the game canvas (beneath UI panels)
  let darkAlpha = map(clarityRatio, 1, 0, 0, 100);
  if (darkAlpha > 0) {
    fill(0, 0, 0, darkAlpha);
    noStroke();
    rect(0, 0, width, height);
  }

  // Update all systems
  timerSystem.update();
  attentionSystem.update();

  // Draw UI overlays (on top of game canvas)
  push();
  scale(width / 320, height / 180);

  // Draw timer (top-left)
  if (timerSystem.getIsActive()) {
    timerSystem.draw();
  }

  // Draw checklist (left side) - always visible
  checklist.draw();

  // Draw attention system (top-right)
  attentionSystem.draw();

  // Draw admin mode overlay
  if (adminMode) {
    drawAdminOverlay();
  }

  pop();

  // Check if 7:45 deadline passed — only fatal if player hasn't left the apartment
  if (timerSystem.hasExpired() && gameState !== "GAME_OVER") {
    if (world.sequenceStep < 8) {
      handleGameOver("time");
    }
  }

  // Check if attention is depleted
  if (attentionSystem.currentAttention <= 0 && gameState !== "GAME_OVER") {
    handleGameOver("attention");
  }
}

function drawBackground() {
  let img = bgImages[world.currentRoom];
  if (img) image(img, 0, 0, width, height);
  else background("#ECE7D1");
}

function checkInteractions() {
  let primaryTarget = items.find(
    (i) => i.step === world.sequenceStep && i.room === world.currentRoom,
  );

  // Steps that are navigation-required (cannot skip to a door/exit).
  // Alarm (step 0): must interact before leaving the bedroom — all days.
  // Mirror (step 1, Day 3 only): required so the door never overrides it.
  // Newspaper (step 6, Day 1 only): must read before leaving the living room.
  let stepIsRequired =
    world.sequenceStep === 0 ||
    (world.sequenceStep === 1 && world.currentDay === 3) ||
    (world.sequenceStep === 6 && world.currentDay === 1);

  // If the current step is an optional popup, also check whether the next
  // door/exit in this room is reachable so the player can skip it.
  if (primaryTarget && primaryTarget.type === "popup" && !stepIsRequired) {
    let nextDoor = items.find(
      (i) =>
        i.step > world.sequenceStep &&
        i.room === world.currentRoom &&
        (i.type === "door" || i.type === "exit"),
    );
    if (nextDoor) {
      let distPrimary = dist(player.x, player.y, primaryTarget.x, primaryTarget.y);
      let distDoor    = dist(player.x, player.y, nextDoor.x,      nextDoor.y);
      // Popup takes priority when the player is within its interaction range.
      // Only switch to the door when player is outside popup range AND closer to the door.
      if (distPrimary <= 45 || distDoor >= distPrimary) {
        activeTarget = primaryTarget;
      } else {
        activeTarget = nextDoor;
      }
    } else {
      activeTarget = primaryTarget;
    }
  } else {
    activeTarget = primaryTarget;
  }

  // Look-ahead popup: expose the next popup in sequence (same room) so the
  // player can trigger order-death by interacting out of sequence.
  // Only activates when the player is within range of the NEXT popup but
  // outside range of the current primary target.
  if (activeTarget === primaryTarget && primaryTarget && primaryTarget.type === "popup") {
    let nextPopup = items.find(
      (i) =>
        i.step === world.sequenceStep + 1 &&
        i.room === world.currentRoom &&
        i.type === "popup",
    );
    if (nextPopup) {
      let distCurrent = dist(player.x, player.y, primaryTarget.x, primaryTarget.y);
      let distNext    = dist(player.x, player.y, nextPopup.x,     nextPopup.y);
      if (distCurrent > 45 && distNext <= 45) {
        activeTarget = nextPopup;
      }
    }
  }

  if (activeTarget) {
    let distance = dist(player.x, player.y, activeTarget.x, activeTarget.y);

    if (distance < 45) {
      document.getElementById("dialogue-text").innerText = activeTarget.hint;
    } else if (!clarityPauseActive) {
      document.getElementById("dialogue-text").innerText =
        "Use WASD or Arrows to explore.";
    }
  }
}

/**
 * Draw floating "!" markers above required items on Day 1.
 * Alarm clock (step 0) in Bedroom, Newspaper (step 5) in LivingRoom.
 * Disappears once the item has been interacted with.
 */
function drawRequiredMarkers() {
  // Muted dusty-rose red — matches the game's warm nostalgic palette
  const markerColor = color(162, 82, 72);
  const bob = sin(millis() * 0.003) * 2; // gentle float ±2px

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(9);
  stroke(0);
  strokeWeight(2);
  fill(markerColor);

  // Newspaper — LivingRoom, only before it's been read (now step 6)
  if (world.currentRoom === "LivingRoom" && !checklist.isTaskComplete(6)) {
    text("!", 195, 112 + bob);
  }

  noStroke();
  textStyle(NORMAL);
  textAlign(LEFT, BASELINE);
}

function drawAdminOverlay() {
  // Red badge in bottom-right corner of the canvas
  let badgeX = 260;
  let badgeY = 165;

  fill(200, 30, 30, 220);
  noStroke();
  rect(badgeX, badgeY, 58, 13, 2);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(6);
  text("ADMIN  ` toggle", badgeX + 3, badgeY + 2);

  // Hint bar at bottom of canvas
  fill(0, 0, 0, 160);
  rect(0, 155, 260, 13);

  fill(255, 220, 100);
  textAlign(LEFT, TOP);
  textSize(6);
  text("[ prev step   ] next step   1 Day1   3 Day3   5 Day5", 4, 158);
}

function keyPressed() {
  // ESC toggles pause from any pauseable state
  if (keyCode === 27) {
    if (gameState === "PAUSED") {
      resumeGame();
    } else if (gameState === "EXPLORE" || gameState === "INTERACT" || gameState === "DAY_START") {
      pauseGame();
    }
    return;
  }

  // Any key resumes when paused
  if (gameState === "PAUSED") {
    resumeGame();
    return;
  }

  // Title screen — any key starts the game
  if (gameState === "TITLE") {
    startGame();
    return;
  }

  // ── Ending screens — any key restarts from Day 1 ─────────────────────────
  if (gameState === "ENDING_A" && endingPhase >= 3) {
    world.currentDay = 1;
    restartGame();
    return;
  }
  if (gameState === "ENDING_B" && endingPhase >= 5) {
    world.currentDay = 1;
    restartGame();
    return;
  }

  // ── Family scene — choice inputs ─────────────────────────────────────────
  if (gameState === "FAMILY_SCENE" && familyScenePhase >= 7) {
    if (keyCode === 49) { startEndingA(); return; } // 1 = hold hand → Ending A
    if (keyCode === 50) { startEndingB(); return; } // 2 = pull away → Ending B
    return; // ignore other keys during choice
  }
  // Block all other input during non-choice family scene phases
  if (gameState === "FAMILY_SCENE") return;

  // Day-start routine popup — Space to dismiss (debounced so same keypress that
  // opens the game can't immediately close it)
  if (gameState === "DAY_START" && keyCode === 32) {
    if (millis() - dayStartPopupTime > 300) {
      gameState = "EXPLORE";
      document.getElementById("checklist-panel").style.visibility = "visible";
      document.getElementById("npc-name").innerText = "System";
      document.getElementById("dialogue-text").innerText =
        "Use WASD or Arrows to explore.";
      // Start looping alarm — stops when player interacts with alarm clock
      var _alarmPlay = document.getElementById("alarm-sound");
      _alarmPlay.volume = 1.0;
      _alarmPlay.play();
    }
    return;
  }

  // --- ADMIN TOGGLE: backtick (`) ---
  if (keyCode === 192) {
    adminMode = !adminMode;
    document.getElementById("npc-name").innerText = "[ADMIN]";
    document.getElementById("dialogue-text").innerText =
      adminMode
        ? "Admin mode ON — [ prev step, ] next step, 1=Day1, 3=Day3, 5=Day5"
        : "Admin mode OFF";
    return;
  }

  // --- ADMIN CONTROLS (only when admin mode is active) ---
  if (adminMode) {
    // [ = go back one step
    if (keyCode === 219) {
      adminJumpToStep(world.sequenceStep - 1);
      return;
    }
    // ] = go forward one step
    if (keyCode === 221) {
      adminJumpToStep(world.sequenceStep + 1);
      return;
    }
    // 1 = jump to Day 1
    if (keyCode === 49 && gameState !== "INTERACT") {
      adminJumpToDay(1);
      return;
    }
    // 3 = jump to Day 3
    if (keyCode === 51 && gameState !== "INTERACT") {
      adminJumpToDay(3);
      return;
    }
    // 5 = jump to Day 5
    if (keyCode === 53 && gameState !== "INTERACT") {
      adminJumpToDay(5);
      return;
    }
  }

  // Handle game over restart — any key
  if (gameState === "GAME_OVER") {
    restartGame();
    return;
  }

  if (keyCode === 69 && gameState === "EXPLORE" && activeTarget) {
    if (dist(player.x, player.y, activeTarget.x, activeTarget.y) < 45) {
      if (activeTarget.type === "popup") {
        // Order-death: interacting out of sequence causes instant death.
        //   Mirror (step 1) before alarm (step 0)
        //   Newspaper (step 6) before partner (step 5)
        //   Doorplate (step 9) before neighbor (step 8)
        if (activeTarget.step === 1 && !checklist.isTaskComplete(0)) {
          handleGameOver("order"); return;
        }
        if (activeTarget.step === 6 && !checklist.isTaskComplete(5)) {
          handleGameOver("order"); return;
        }
        if (activeTarget.step === 9 && !checklist.isTaskComplete(8)) {
          handleGameOver("order"); return;
        }

        gameState = "INTERACT";

        // Start timer on first interaction (alarm clock) and stop alarm sound
        if (world.sequenceStep === 0) {
          timerSystem.start();
          document.getElementById("timer-panel").style.visibility = "visible";
          const alarmEl = document.getElementById("alarm-sound");
          alarmEl.pause();
          alarmEl.currentTime = 0;
        }

        // Mark task as complete
        checklist.markTaskComplete(world.sequenceStep);

        // Check if this step requires observation (Day 3 AND Day 5 both use this system)
        if ((world.currentDay === 3 || world.currentDay === 5) && attentionSystem.triggerObservationUI(world.sequenceStep)) {
          isWaitingForObservationChoice = true;
        }
        // Play tea brewing sound at 2x gain via Web Audio API
        if (world.sequenceStep === 3) {
          var teaSound = document.getElementById("tea-sound");
          if (teaSound) {
            teaSound.currentTime = 0;
            try {
              var teaCtx = new (window.AudioContext || window.webkitAudioContext)();
              var teaSrc = teaCtx.createMediaElementSource(teaSound);
              var teaGain = teaCtx.createGain();
              teaGain.gain.value = 3.0;
              teaSrc.connect(teaGain);
              teaGain.connect(teaCtx.destination);
            } catch(e) {
              teaSound.volume = 1.0; // fallback
            }
            teaSound.play();
          }
        }


        // Play newspaper rustling sound for first 2 seconds
        if (world.sequenceStep === 6) {
          var npSound = document.getElementById("newspaper-sound");
          if (npSound) {
            npSound.volume = 1.0;
            npSound.currentTime = 0;
            npSound.play();
            setTimeout(function() { npSound.pause(); npSound.currentTime = 0; }, 2000);
          }
        }

        updateDialogueForStep(world.sequenceStep);
      } else {
        // If player skipped an optional popup and went straight to a door/exit,
        // silently advance the sequence to match the target's step first.
        while (world.sequenceStep < activeTarget.step) {
          world.advanceSequence();
        }
        processSequence();
      }
    }
  }

  if (gameState === "INTERACT") {
    // Observation choice for Day 3 (steps 0, 1, 3, 5, 8)
    if (isWaitingForObservationChoice) {
      if (keyCode === 49) {
        handleObservationChoice("wrong");
      } else if (keyCode === 50) {
        handleObservationChoice("normal");
      }
      return;
    }

    // Normal space key to close
    if (keyCode === 32) {
      processSequence();
    }
  }

  // M key toggles music from any game state
  if (keyCode === 77) {
    toggleMusic();
  }
}

function drawUIPopup() {
  let dayKey = "day" + world.currentDay;
  let img = uiImages[dayKey][world.sequenceStep];

  // Day 5 newspaper (step 6) uses hand-drawn messy text instead of an image
  if (world.currentDay === 5 && world.sequenceStep === 6) {
    drawDay5Letter();
    fill(0, 0, 0, 150);
    rect(0, height - 20, width, 20);
    fill("#ECE7D1");
    textAlign(CENTER, CENTER);
    textSize(8);
    text("[ PRESS SPACE TO CLOSE ]", width / 2, height - 10);
    return;
  }

  push();

  // 茶罐抖动效果保持
  if (isDistorted) {
    translate(random(-4, 4), random(-4, 4));
    tint(255, random(180, 255));
  }

  if (img) image(img, 0, 0, width, height); // 完美全图覆盖
  pop();

  fill(0, 0, 0, 150);
  rect(0, height - 20, width, 20);
  fill("#ECE7D1");
  textAlign(CENTER, CENTER);
  textSize(8);

  if (isWaitingForObservationChoice) {
    text("[ 1: Something is wrong   |   2: Looks normal ]", width / 2, height - 10);
  } else {
    text("[ PRESS SPACE TO CLOSE ]", width / 2, height - 10);
  }
}

function drawDay5Letter() {
  // Parchment background
  fill(245, 238, 210);
  noStroke();
  rect(0, 0, width, height);

  // Faint ruled lines
  stroke(190, 178, 150, 55);
  strokeWeight(0.4);
  for (let y = 36; y < height - 20; y += 13) {
    line(10, y, width - 10, y);
  }
  noStroke();

  // Newspaper masthead
  fill(55, 40, 25);
  textAlign(CENTER, TOP);
  textSize(9);
  text("THE MORNING HERALD", width / 2, 11);
  stroke(55, 40, 25);
  strokeWeight(0.5);
  line(10, 24, width - 10, 24);
  noStroke();

  // Article body text
  const lines = [
    "Spring arrives in the city.",
    "Local gardens are blooming",
    "across all neighborhoods.",
    "Annual flower festival",
    "returns this weekend with",
    "familiar faces and old",
    "traditions. Residents gather",
    "as they always have done.",
  ];

  textAlign(LEFT, TOP);
  textSize(7);

  let startY = 31;
  let lineHeight = 13;
  let t = millis() * 0.0009; // slow animated wobble

  for (let li = 0; li < lines.length; li++) {
    let lineStr = lines[li];
    let cx = 14;
    let baseY = startY + li * lineHeight;

    for (let ci = 0; ci < lineStr.length; ci++) {
      let ch = lineStr[ci];

      // Consistent per-character distortion via hash-like offset
      let h1 = (li * 31 + ci * 17 + 7) % 100;
      let h2 = (li * 13 + ci * 29 + 3) % 100;
      let h3 = (li * 7  + ci * 11 + 19) % 100;

      let baseDx    = (h1 / 100 - 0.5) * 4.5;
      let baseDy    = (h2 / 100 - 0.5) * 3.5;
      let baseAngle = (h3 / 100 - 0.5) * 0.65;

      // Slow per-character wobble
      let wx = sin(t * 1.4 + li * 0.8 + ci * 0.45) * 0.7;
      let wy = cos(t * 1.1 + ci * 0.55 + li * 0.3) * 0.5;
      let wa = sin(t + ci * 0.22 + li * 0.6) * 0.04;

      let colVar = h1 % 35;

      push();
      translate(cx + baseDx + wx, baseY + baseDy + wy);
      rotate(baseAngle + wa);
      fill(45 + colVar, 28 + colVar * 0.4, 12);
      text(ch, 0, 0);
      pop();

      // Advance x by a slightly jittered character width
      let jitter = (h2 % 10) * 0.08 - 0.3;
      cx += textWidth(ch) + jitter;
    }
  }
}

function drawDayStartPopup() {
  // Dark overlay behind the card
  fill(0, 0, 0, 160);
  noStroke();
  rect(0, 0, width, height);

  // --- Card dimensions: centred in canvas ---
  let cw = 130, ch = 155;
  let cx = (width - cw) / 2;
  let cy = (height - ch) / 2 - 2;

  // Paper content area (no header — hint moves to bottom bar)
  fill(236, 231, 209);
  stroke(138, 118, 80);
  strokeWeight(1);
  rect(cx, cy, cw, ch);

  // "ROUTINE" title
  noStroke();
  fill(138, 118, 80);
  textAlign(LEFT, TOP);
  textSize(7);
  text("ROUTINE", cx + 8, cy + 7);

  // Separator under title
  stroke(138, 118, 80);
  strokeWeight(0.5);
  line(cx + 5, cy + 18, cx + cw - 5, cy + 18);

  // Task list
  const tasks = [
    "Check alarm",
    "Look at mirror",
    "Brew tea",
    "Talk to partner",
    "Read news",
    "Greet neighbor",
    "Check door number",
  ];

  for (let i = 0; i < tasks.length; i++) {
    let ty = cy + 23 + i * 15;

    // Checkbox outline
    stroke(138, 118, 80);
    strokeWeight(0.5);
    fill(236, 231, 209);
    rect(cx + 8, ty, 7, 7);

    // Task name
    noStroke();
    fill(100, 85, 60);
    textAlign(LEFT, TOP);
    textSize(6.5);
    text(tasks[i], cx + 20, ty + 0.5);
  }

  // --- Bottom hint bar (matches other popups) ---
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, height - 20, width, 20);
  fill("#ECE7D1");
  textAlign(CENTER, CENTER);
  textSize(8);
  text("[ PRESS SPACE TO CLOSE ]", width / 2, height - 10);
}

function processSequence() {
  gameState = "TRANSITION";

  if (world.sequenceStep === 10) {
    if (!checklist.canLeaveApartment()) {
      // Not enough tasks done — game over
      handleGameOver("routine");
      return;
    }

    if (world.currentDay === 5) {
      // Day 5 ending: trigger family scene instead of day transition
      document.getElementById("npc-name").innerText = "System";
      document.getElementById("dialogue-text").innerText = "\u2026";
      setTimeout(() => startFamilyScene(), 1800);
      return;
    }

    document.getElementById("npc-name").innerText = "System";
    document.getElementById("dialogue-text").innerText = "Walking away...";
    setTimeout(() => advanceDayToNext(), 2000);
    return;
  }

  world.advanceSequence();

  // Day 5: mirror (step 1) cannot be interacted with — auto-skip it
  if (world.sequenceStep === 1 && world.currentDay === 5) {
    world.advanceSequence();
  }

  if (world.sequenceStep === 3) {
    world.changeRoom("Kitchen");
    player.x = 160;
    player.y = 160;
  } else if (world.sequenceStep === 5) {
    world.changeRoom("LivingRoom");
    player.x = 155;
    player.y = 160;
  } else if (world.sequenceStep === 8) {
    world.changeRoom("Outside");
    player.x = 160;
    player.y = 120;
    timerSystem.stop(); // made it outside in time
  }

  setTimeout(() => {
    gameState = "EXPLORE";

    if ((world.currentDay === 3 || world.currentDay === 5) && world.sequenceStep === 4) {
      document.getElementById("npc-name").innerText = "Partner";
      document.getElementById("dialogue-text").innerText = "You've always had this one.";
    } else if (!clarityPauseActive) {
      document.getElementById("npc-name").innerText = "System";
      document.getElementById("dialogue-text").innerText =
        "Use WASD or Arrows to explore.";
    }
  }, 500);
}

function updateDialogueForStep(step) {
  let uiText = document.getElementById("dialogue-text");
  let npcName = document.getElementById("npc-name");

  if (world.currentDay === 1) {
    if (step === 0) {
      npcName.innerText = "System";
      uiText.innerText = "7:00 AM\u2026 I should get ready.";
    }
    if (step === 1) {
      npcName.innerText = "System";
      uiText.innerText = "It's me.";
    }
    if (step === 3) {
      npcName.innerText = "System";
      uiText.innerText = "A familiar tea canister.";
    }
    if (step === 5) {
      npcName.innerText = "Partner";
      uiText.innerText = "How are you feeling today?";
    }
    if (step === 6) {
      npcName.innerText = "System";
      uiText.innerText = "Today\u2019s paper\u2026 Oh\u2026 eggs are on sale today. I should leave before 7:40.";
    }
    if (step === 8) {
      npcName.innerText = "Neighbor";
      uiText.innerText = "Good morning.";
    }
    if (step === 9) {
      npcName.innerText = "System";
      uiText.innerText = "Apartment 204.";
    }
  } else if (world.currentDay === 3) {
    if (step === 0) {
      npcName.innerText = "System";
      uiText.innerText = "7:00\u2026 I need to leave before 7:40\u2026 I think.";
    }
    if (step === 1) {
      npcName.innerText = "System";
      uiText.innerText = "I don't recognize... No, it's me. Who else?";
    }
    if (step === 3) {
      npcName.innerText = "System";
      uiText.innerText = "The tea tin... it looks the same as always.";
    }
    if (step === 5) {
      npcName.innerText = "Partner";
      uiText.innerText = "Is there anything in the news?";
    }
    if (step === 6) {
      npcName.innerText = "System";
      uiText.innerText = "The letters look\u2026 different. Or maybe it\u2019s just me.";
    }
    if (step === 8) {
      npcName.innerText = "Neighbor";
      uiText.innerText = "Your apartment has always been 204.";
    }
    if (step === 9) {
      npcName.innerText = "System";
      uiText.innerText = "Apartment... 20?";
    }

  } else if (world.currentDay === 5) {
    // ── Day 5 — same mechanics as Day 3; mirror triggers sprite swap ──────
    if (step === 0) {
      npcName.innerText = "System";
      uiText.innerText  = "7:00\u2026 before 7:40\u2026 need to go\u2026";
    }
    if (step === 3) {
      npcName.innerText = "System";
      uiText.innerText  = "The tea tin... it looks the same as always.";
    }
    if (step === 5) {
      npcName.innerText = "Partner";
      uiText.innerText  = "Is there anything in the news?";
    }
    if (step === 6) {
      npcName.innerText = "System";
      uiText.innerText  = "The letters look\u2026 different. Or maybe it\u2019s just me.";
    }
    if (step === 8) {
      npcName.innerText = "Neighbor";
      uiText.innerText  = "Your apartment has always been 204.";
    }
    if (step === 9) {
      npcName.innerText = "System";
      uiText.innerText  = "Apartment... 20?";
    }
  }
}

function advanceDayToNext() {
  // Stop alarm sound in case player left before interacting with it
  const _ad = document.getElementById("alarm-sound");
  _ad.pause(); _ad.currentTime = 0;

  if (world.currentDay === 1) {
    // Day 1 → Day 3
    _transitionToDay(3);
  } else if (world.currentDay === 3) {
    // Day 3 → Day 5
    _transitionToDay(5);
  }
}

/**
 * Internal helper: fade out, show day message, then load the new day.
 * @param {number} nextDay - 3 or 5
 */
function _transitionToDay(nextDay) {
  document.body.style.backgroundColor = "black";
  document.getElementById("npc-name").innerText    = "System";
  document.getElementById("dialogue-text").innerText =
    nextDay === 3 ? "Resting\u2026 The days blur together."
                  : "Time slips away\u2026";

  setTimeout(() => {
    document.getElementById("dialogue-text").innerText = "Waking up\u2026";

    setTimeout(() => {
      document.getElementById("dialogue-text").innerText = "Day " + nextDay + ".";

      setTimeout(() => {
        document.body.style.backgroundColor = "";
        world.resetForNextDay(nextDay);
        player.x = 150;
        player.y = 130;

        // Reset player flags (Day 5 sprite swap resets each attempt)
        player.useElderlySprite  = false;
        player.wrongDirEnabled   = false;
        day5MirrorDone           = false;

        // Reset all systems — Day 3 and Day 5 share the same mechanics
        checklist.reset();
        checklist.minTasksRequired = (nextDay === 3 || nextDay === 5) ? 4 : 3;

        timerSystem.reset();
        if (nextDay === 3 || nextDay === 5) {
          console.log("✓ DAY " + nextDay + " STARTED — Enabling timer distortion");
          timerSystem.enableDistortion();
        }

        attentionSystem.reset();
        isDistorted = false;
        isWaitingForObservationChoice = false;
        setMusicDistortionLevel(0);

        document.getElementById("day-display").innerText = "Day " + nextDay;
        document.getElementById("checklist-panel").style.visibility = "hidden";
        document.getElementById("attention-panel").style.visibility = "hidden";
        document.getElementById("timer-panel").style.visibility     = "hidden";
        document.getElementById("npc-name").innerText    = "System";
        document.getElementById("dialogue-text").innerText =
          "Note to self: don\u2019t forget\u2026 finish routine before leaving.";
        dayStartPopupTime = millis();
        gameState = "DAY_START";
      }, 1500);
    }, 2000);
  }, 2500);
}

/**
 * Handle game over conditions (time expiration or attention depleted)
 * @param {string} reason - "time" or "attention"
 */
function handleGameOver(_reason) {
  if (gameState === "GAME_OVER") return;
  gameState = "GAME_OVER";
  gameOverAlpha = 0;
  gameOverScreenShown = false;
  player.velocityX = 0;
  player.velocityY = 0;
  isWaitingForObservationChoice = false;
  attentionSystem.dismissObservationUI();
  setMusicDistortionLevel(3); // game-over collapse effect
}

/**
 * Show the HTML game-over overlay once the canvas has faded to black
 */
function showGameOverScreen() {
  if (gameOverScreenShown) return;
  gameOverScreenShown = true;
  document.getElementById("game-over-screen").classList.add("show");
  document.getElementById("checklist-panel").style.visibility = "hidden";
  document.getElementById("attention-panel").style.visibility = "hidden";
  document.getElementById("timer-panel").style.visibility     = "hidden";
}

/**
 * Start game from title screen (called by Start button and Enter key)
 */
function startGame() {
  const titleScreen = document.getElementById("title-screen");
  titleScreen.classList.remove("show");
  titleScreen.classList.add("hide");
  // Blur any focused element so the Start button can't re-trigger via Space/Enter
  if (document.activeElement) document.activeElement.blur();
  document.getElementById("checklist-panel").style.visibility = "hidden";
  document.getElementById("attention-panel").style.visibility = "hidden";
  document.getElementById("npc-name").innerText = "System";
  document.getElementById("dialogue-text").innerText =
    "Note to self: don\u2019t forget\u2026 finish routine before leaving.";
  dayStartPopupTime = millis();
  clarityPauseActive = false; clarityStillSince = null;
  gameState = "DAY_START";
}

/**
 * Restart the game from the day the player died on (called by the Restart button and R key)
 */
function restartGame() {
  let retryDay = world.currentDay; // resume on the day player died

  gameOverAlpha = 0;
  gameOverScreenShown = false;
  document.getElementById("game-over-screen").classList.remove("show");
  if (document.activeElement) document.activeElement.blur();
  document.getElementById("checklist-panel").style.visibility = "hidden";
  document.getElementById("attention-panel").style.visibility = "hidden";
  document.getElementById("timer-panel").style.visibility = "hidden";

  world.resetForNextDay(retryDay);
  player.x = 150;
  player.y = 130;

  // Reset Day 5 flags
  day5MirrorDone          = false;
  player.useElderlySprite = false;
  player.wrongDirEnabled  = (retryDay === 5);
  familyScenePhase        = 0;
  endingPhase             = 0;

  checklist.reset();
  checklist.minTasksRequired =
    retryDay === 3 ? 4 :
    retryDay === 5 ? 5 : 3;

  timerSystem.reset();
  if (retryDay === 3) timerSystem.enableDistortion();
  if (retryDay === 5) timerSystem.enableDay5Mode();

  attentionSystem.reset();
  setMusicDistortionLevel(0); // reset audio distortion on restart
  const _alarmEl = document.getElementById("alarm-sound");
  _alarmEl.pause(); _alarmEl.currentTime = 0; // stop alarm on restart
  isDistorted = false;
  isWaitingForObservationChoice = false;

  document.getElementById("day-display").innerText = "Day " + retryDay;
  document.getElementById("npc-name").innerText = "System";
  document.getElementById("dialogue-text").innerText =
    "Note to self: don\u2019t forget\u2026 finish routine before leaving.";
  dayStartPopupTime = millis();
  clarityPauseActive = false; clarityStillSince = null;
  gameState = "DAY_START";
}

// --- Pause ---
let _stateBeforePause       = "EXPLORE";
let _pausedAlarmWasPlaying = false;

function pauseGame() {
  _stateBeforePause = gameState;
  gameState = "PAUSED";
  timerSystem.pause();
  if (clarityStillSince !== null) _clarityPausedAt = millis();
  // Pause alarm if it is currently ringing
  var _alarm = document.getElementById("alarm-sound");
  _pausedAlarmWasPlaying = _alarm && !_alarm.paused;
  if (_pausedAlarmWasPlaying) _alarm.pause();
  // Stop walking sound
  var _walk = document.getElementById("walking-sound");
  if (_walk && !_walk.paused) { _walk.pause(); _walk.currentTime = 0; }
  document.getElementById("pause-screen").classList.add("show");
  if (document.activeElement) document.activeElement.blur();
}

function resumeGame() {
  gameState = _stateBeforePause;
  timerSystem.resume();
  if (_clarityPausedAt !== null && clarityStillSince !== null) {
    clarityStillSince += millis() - _clarityPausedAt;
  }
  _clarityPausedAt = null;
  // Resume alarm if it was playing before pause
  if (_pausedAlarmWasPlaying) {
    var _alarm = document.getElementById("alarm-sound");
    if (_alarm) _alarm.play();
  }
  _pausedAlarmWasPlaying = false;
  document.getElementById("pause-screen").classList.remove("show");
  if (document.activeElement) document.activeElement.blur();
}

// --- Music Control ---
let musicPlaying = false;

function toggleMusic() {
  const music = document.getElementById("bg-music");
  const btn = document.getElementById("music-btn");
  if (musicPlaying) {
    music.pause();
    btn.textContent = "♪";
    btn.classList.add("muted");
    musicPlaying = false;
  } else {
    music.volume = 0.3;
    music.play();
    initMusicDistortion(); // set up Web Audio chain on first play
    btn.textContent = "♫";
    btn.classList.remove("muted");
    musicPlaying = true;
  }
}

// --- Music Distortion (Web Audio API) ---
let audioCtx        = null;
let musicFilter     = null;   // BiquadFilter  — lowpass
let musicDelay      = null;   // DelayNode     — echo tail
let musicGainNode   = null;   // GainNode      — master (modulated by LFO)
let musicLFO        = null;   // OscillatorNode — tremolo source
let musicLFOGain    = null;   // GainNode      — tremolo depth
let currentMusicDistortionLevel = 0;

/**
 * Build the Web Audio processing chain the first time music plays.
 * Source → LowpassFilter → Delay → Gain(LFO) → destination
 */
function initMusicDistortion() {
  if (audioCtx) return; // already initialised
  const music = document.getElementById("bg-music");
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const source  = audioCtx.createMediaElementSource(music);

    // Low-pass filter (cuts high-frequency brightness)
    musicFilter = audioCtx.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 20000; // fully open to start

    // Delay (subtle echo at heavy distortion)
    musicDelay = audioCtx.createDelay(1.0);
    musicDelay.delayTime.value = 0;

    // Master gain (also the tremolo target)
    musicGainNode = audioCtx.createGain();
    musicGainNode.gain.value = 1.0;

    // LFO → LFOGain → musicGainNode.gain  (tremolo)
    musicLFO = audioCtx.createOscillator();
    musicLFO.type = "sine";
    musicLFO.frequency.value = 0.2;
    musicLFO.start();

    musicLFOGain = audioCtx.createGain();
    musicLFOGain.gain.value = 0; // depth = 0 → no tremolo at start

    musicLFO.connect(musicLFOGain);
    musicLFOGain.connect(musicGainNode.gain);

    // Signal chain
    source.connect(musicFilter);
    musicFilter.connect(musicDelay);
    musicDelay.connect(musicGainNode);
    musicGainNode.connect(audioCtx.destination);

  } catch (e) {
    console.warn("Web Audio API unavailable:", e);
    audioCtx = null;
  }
}

/**
 * Smoothly transition to a distortion level.
 * level 0 — normal    (3 clarity bars)
 * level 1 — moderate  (2 clarity bars): slight slow-down, gentle muffle + tremolo
 * level 2 — heavy     (1 clarity bar):  noticeable slow-down, strong muffle + echo + tremolo
 * level 3 — game over: extreme slow-down, near-total muffle, long echo, fast heavy tremolo
 */
function setMusicDistortionLevel(level) {
  if (level === currentMusicDistortionLevel) return;
  currentMusicDistortionLevel = level;

  // Initialise lazily in case music was turned on before distortion was needed
  if (!audioCtx) initMusicDistortion();
  if (!audioCtx)  return; // Web Audio not available

  const music = document.getElementById("bg-music");
  const now   = audioCtx.currentTime;
  const ramp  = 2.0; // seconds for smooth transition

  if (level === 0) {
    // ── Normal ──────────────────────────────────────────────
    music.playbackRate = 1.0;
    musicFilter.frequency.linearRampToValueAtTime(20000, now + ramp);
    musicDelay.delayTime.linearRampToValueAtTime(0,     now + ramp);
    musicLFOGain.gain.linearRampToValueAtTime(0,        now + ramp);
    musicLFO.frequency.linearRampToValueAtTime(0.2,     now + ramp);

  } else if (level === 1) {
    // ── 2 bars: subtle ──────────────────────────────────────
    // Slightly slower (pitch drops a little, time feels heavier)
    music.playbackRate = 0.93;
    // Light muffle — takes the edge off high frequencies
    musicFilter.frequency.linearRampToValueAtTime(1800, now + ramp);
    // No delay yet
    musicDelay.delayTime.linearRampToValueAtTime(0,     now + ramp);
    // Very gentle, slow tremolo (barely noticeable breathing)
    musicLFOGain.gain.linearRampToValueAtTime(0.05,     now + ramp);
    musicLFO.frequency.linearRampToValueAtTime(0.2,     now + ramp);

  } else if (level === 2) {
    // ── 1 bar: heavy ────────────────────────────────────────
    // Noticeably slower — like a tape recorder running low on power
    music.playbackRate = 0.80;
    // Strong muffle — sounds like music heard through a wall
    musicFilter.frequency.linearRampToValueAtTime(500,  now + ramp);
    // Echo tail — sense of disorientation / time slipping
    musicDelay.delayTime.linearRampToValueAtTime(0.15,  now + ramp);
    // Pronounced, faster tremolo — audible instability
    musicLFOGain.gain.linearRampToValueAtTime(0.18,     now + ramp);
    musicLFO.frequency.linearRampToValueAtTime(0.6,     now + ramp);

  } else if (level === 3) {
    // ── Game Over: collapse ──────────────────────────────────
    // Fast ramp — the world falls apart quickly
    const goRamp = 1.2;
    // Dragged to near-halt — time stops
    music.playbackRate = 0.55;
    // Almost fully muffled — like sound underwater
    musicFilter.frequency.linearRampToValueAtTime(200,  now + goRamp);
    // Long echo — the last moment stretches out
    musicDelay.delayTime.linearRampToValueAtTime(0.35,  now + goRamp);
    // Heavy, erratic tremolo — complete loss of stability
    musicLFOGain.gain.linearRampToValueAtTime(0.35,     now + goRamp);
    musicLFO.frequency.linearRampToValueAtTime(1.2,     now + goRamp);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DAY 5 — FAMILY SCENE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kick off the family-scene state (called after staircase on Day 5).
 */
function startFamilyScene() {
  familyScenePhase     = 0;
  familySceneStartTime = millis();
  gameState            = "FAMILY_SCENE";

  // Hide all HUD panels so the cinematic is clean
  document.getElementById("checklist-panel").style.visibility = "hidden";
  document.getElementById("attention-panel").style.visibility = "hidden";
  document.getElementById("timer-panel").style.visibility     = "hidden";
  document.getElementById("npc-name").innerText              = "";
  document.getElementById("dialogue-text").innerText         = "";
}

/**
 * Draw family scene each frame while gameState === "FAMILY_SCENE".
 * Phases:
 *   0 — initial fade-in pause
 *   1,3,5 — "heard" line (what the protagonist hears, distorted)
 *   2,4,6 — subtitle line (what was actually said)
 *   7 — choice (hold hand / pull away)
 */
function drawFamilyScene() {
  // Dark bedroom backdrop
  if (bgImages["Bedroom"]) image(bgImages["Bedroom"], 0, 0, width, height);
  fill(0, 0, 0, 210);
  noStroke();
  rect(0, 0, width, height);

  let now     = millis();
  let elapsed = now - familySceneStartTime;

  switch (familyScenePhase) {
    case 0: // Initial pause — dark screen
      if (elapsed > 900) { familyScenePhase = 1; familySceneStartTime = now; }
      break;

    case 1: // Heard — line 1
      _drawHeardText(FAMILY_HEARD[0], 1);
      if (elapsed > 2600) { familyScenePhase = 2; familySceneStartTime = now; }
      break;

    case 2: // Subtitle — line 1
      _drawHeardText(FAMILY_HEARD[0], 0.25);
      _drawSubtitleText(FAMILY_SUBTITLE[0]);
      if (elapsed > 2200) { familyScenePhase = 3; familySceneStartTime = now; }
      break;

    case 3: // Heard — line 2
      _drawHeardText(FAMILY_HEARD[1], 1);
      if (elapsed > 2600) { familyScenePhase = 4; familySceneStartTime = now; }
      break;

    case 4: // Subtitle — line 2
      _drawHeardText(FAMILY_HEARD[1], 0.25);
      _drawSubtitleText(FAMILY_SUBTITLE[1]);
      if (elapsed > 2200) { familyScenePhase = 5; familySceneStartTime = now; }
      break;

    case 5: // Heard — line 3
      _drawHeardText(FAMILY_HEARD[2], 1);
      if (elapsed > 2600) { familyScenePhase = 6; familySceneStartTime = now; }
      break;

    case 6: // Subtitle — line 3
      _drawHeardText(FAMILY_HEARD[2], 0.25);
      _drawSubtitleText(FAMILY_SUBTITLE[2]);
      if (elapsed > 2200) { familyScenePhase = 7; familySceneStartTime = now; }
      break;

    case 7: // Choice
      _drawFamilyChoice();
      break;
  }
}

function _drawHeardText(txt, alphaFactor) {
  let a = floor(255 * alphaFactor);
  noStroke();
  fill(236, 231, 209, a);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(8.5);
  text(txt, width / 2, height / 2 - 18);
}

function _drawSubtitleText(txt) {
  // Subtitle bar at bottom — grey, bracketed, smaller
  noStroke();
  fill(0, 0, 0, 170);
  rect(18, height - 36, width - 36, 22, 2);
  fill(175, 175, 158);
  textAlign(CENTER, CENTER);
  textSize(7);
  text("[ " + txt + " ]", width / 2, height - 25);
}

function _drawFamilyChoice() {
  noStroke();
  fill(236, 231, 209, 210);
  textAlign(CENTER, CENTER);
  textSize(8);
  text("A hand reaches toward you.", width / 2, height / 2 - 28);

  // Button: Hold hand
  fill(138, 118, 80, 220);
  rect(28, height / 2 - 8, 118, 24, 3);
  fill(236, 231, 209);
  textSize(7);
  text("[ 1 ]  Hold their hand", 87, height / 2 + 4);

  // Button: Pull away
  fill(80, 65, 50, 220);
  rect(174, height / 2 - 8, 118, 24, 3);
  fill(236, 231, 209);
  text("[ 2 ]  Pull away", 233, height / 2 + 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDING A — Acceptance
// ─────────────────────────────────────────────────────────────────────────────

function startEndingA() {
  endingPhase     = 0;
  endingStartTime = millis();
  gameState       = "ENDING_A";
  setMusicDistortionLevel(0); // music clears / stabilises
}

/**
 * Draw Ending A:
 *   Phase 0 — screen fades from dark to warm (3 s)
 *   Phase 1 — "Before I forget…" fades in
 *   Phase 2 — "Thank you for staying." fades in
 *   Phase 3 — persistent; any key restarts
 */
/**
 * Ending A — Acceptance
 * Phase 0: fade from dark to warm bedroom (3 s)
 * Phase 1: "Before I forget…" fades in slowly
 * Phase 2: "Thank you for staying." fades in slowly
 * Phase 3: both lines persist, hint shown
 *
 * Dark semi-transparent overlay sits behind the text so it
 * reads clearly against the background.
 */
function drawEndingA() {
  let now     = millis();
  let elapsed = now - endingStartTime;

  // Warm bedroom background
  if (bgImages["Bedroom"]) image(bgImages["Bedroom"], 0, 0, width, height);

  // Very subtle golden warmth tint
  noStroke();
  fill(255, 220, 150, 18);
  rect(0, 0, width, height);

  // ── Phase 0: fade darkness out ───────────────────────────────────────────
  if (endingPhase === 0) {
    let darkAlpha = max(0, 210 - (elapsed / 3000) * 210);
    fill(0, 0, 0, darkAlpha);
    rect(0, 0, width, height);
    if (elapsed > 3000) { endingPhase = 1; endingStartTime = now; }
    return;
  }

  // ── Phases 1-3: text appears ─────────────────────────────────────────────
  let line1Alpha = 0;
  let line2Alpha = 0;

  if (endingPhase === 1) {
    line1Alpha = min(255, (elapsed / 2800) * 255);
    if (elapsed > 3500) { endingPhase = 2; endingStartTime = now; }
  }
  if (endingPhase === 2) {
    line1Alpha = 255;
    line2Alpha = min(255, (elapsed / 2800) * 255);
    if (elapsed > 3500) { endingPhase = 3; }
  }
  if (endingPhase === 3) {
    line1Alpha = 255;
    line2Alpha = 255;
  }

  // ── Dark reading overlay (fades in with the first line) ──────────────────
  // Full-width semi-transparent band behind the text so it's always legible
  if (line1Alpha > 0) {
    let overlayAlpha = map(line1Alpha, 0, 255, 0, 170);
    noStroke();
    fill(0, 0, 0, overlayAlpha);
    rect(0, height / 2 - 38, width, 80);

    // Soft edge lines at top and bottom of band
    let edgeAlpha = map(line1Alpha, 0, 255, 0, 60);
    fill(0, 0, 0, edgeAlpha);
    rect(0, height / 2 - 48, width, 10);
    rect(0, height / 2 + 42, width, 10);
  }

  // ── Text ─────────────────────────────────────────────────────────────────
  noStroke();
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);

  // Line 1 — slightly larger, warm cream
  fill(236, 225, 200, line1Alpha);
  textSize(10);
  text("Before I forget\u2026", width / 2, height / 2 - 14);

  // Line 2 — same style, a little smaller
  fill(220, 208, 182, line2Alpha);
  textSize(9);
  text("Thank you for staying.", width / 2, height / 2 + 12);

  // Hint (only when fully settled)
  if (endingPhase >= 3) {
    fill(180, 165, 130, 130);
    textSize(6);
    text("[ Press any key to play again ]", width / 2, height - 13);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDING B — Isolation
// ─────────────────────────────────────────────────────────────────────────────

function startEndingB() {
  endingPhase     = 0;
  endingStartTime = millis();
  gameState       = "ENDING_B";
  // Put player back in bedroom so the collapse shot makes sense
  player.x = 148;
  player.y = 105;
  setMusicDistortionLevel(3); // world collapses
}

/**
 * Ending B — Isolation / Collapse
 *
 * Phase 0  (2 s)  — first shudder: mild shake, overexposure floods in
 * Phase 1-4       — each text fragment appears with escalating shake + RGB split,
 *                   then dissolves before the next one arrives
 * Phase 5         — "…" barely holds, maximum shake, player silhouette dissolves
 *
 * Visual tools used:
 *   • Screen shake  — translate(random offset) around the whole scene
 *   • RGB chromatic aberration — bedroom drawn 3× with R/B tint offsets
 *   • Oscillating white flash  — sin-wave overexposure that pulses faster as we go
 *   • Player drawn at near-zero clarity — maximum sprite glitch / flicker
 *   • Text itself jitters on its own axis (extra translate inside text draw)
 */
function drawEndingB() {
  let now     = millis();
  let elapsed = now - endingStartTime;

  // ── Shake intensity grows with each phase ────────────────────────────────
  let shakeAmt = endingPhase === 0
    ? map(elapsed, 0, 2000, 0.5, 3)
    : min(10, 2.5 + endingPhase * 1.8);

  let sx = random(-shakeAmt,       shakeAmt);
  let sy = random(-shakeAmt * 0.6, shakeAmt * 0.6);

  // ── Draw bedroom — with RGB chromatic aberration from phase 1 onward ─────
  if (bgImages["Bedroom"]) {
    if (endingPhase >= 1) {
      let split = 2 + endingPhase * 1.2;
      // Red channel — shift right
      tint(255, 80, 80, 130);
      image(bgImages["Bedroom"], sx + split, sy,        width, height);
      // Blue channel — shift left
      tint(80, 80, 255, 130);
      image(bgImages["Bedroom"], sx - split, sy + 1.5,  width, height);
      noTint();
    }
    // Base image on top
    image(bgImages["Bedroom"], sx, sy, width, height);
  }

  // ── Draw player with maximum glitch (clarity ≈ 0) ────────────────────────
  if (endingPhase >= 1) {
    let playerClarity = max(0, 0.08 - endingPhase * 0.015); // approaches 0
    push();
    translate(sx * 1.6, sy * 1.6);   // player shakes harder than background
    player.draw(playerClarity);
    pop();
  }

  // ── Oscillating white overexposure ───────────────────────────────────────
  // Pulses faster and brighter as phases advance
  let pulseSpeed  = 0.003 + endingPhase * 0.0025;
  let pulseDepth  = endingPhase === 0 ? 0 : 35 + endingPhase * 10;
  let baseWhite   = endingPhase === 0
    ? min(180, (elapsed / 2000) * 180)
    : 140 + endingPhase * 12;
  let whiteAlpha  = min(255, baseWhite + sin(now * pulseSpeed * TWO_PI) * pulseDepth
                              + random(-8, 8));
  noStroke();
  fill(255, 255, 255, whiteAlpha);
  rect(0, 0, width, height);

  // ── Phase 0: initial flooding — no text yet ───────────────────────────────
  if (endingPhase === 0) {
    if (elapsed > 2000) { endingPhase = 1; endingStartTime = now; }
    return;
  }

  // ── Phases 1-4: text fragments ───────────────────────────────────────────
  if (endingPhase >= 1 && endingPhase <= 4) {
    let fragIdx = endingPhase - 1;
    let t       = elapsed / 1600;             // 0 → 1 over 1.6 s

    // Fade in then dissolve (last fragment "Forget" stays a bit longer)
    let fragAlpha;
    let holdDuration = fragIdx === 2 ? 2000 : 1600; // "Forget" lingers longer

    if (t < 0.4) {
      fragAlpha = map(t, 0, 0.4, 0, 255);    // appear
    } else if (fragIdx < 3 && t > 0.75) {
      fragAlpha = map(t, 0.75, 1, 255, 0);   // dissolve (not "…")
    } else {
      fragAlpha = 255;
    }
    fragAlpha = constrain(fragAlpha, 0, 255);

    // Text own jitter (independent of screen shake)
    let tx = random(-(endingPhase), endingPhase);
    let ty = random(-(endingPhase * 0.5), endingPhase * 0.5);

    push();
    translate(tx, ty);
    noStroke();
    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    // Size grows as things fall apart
    textSize(13 + endingPhase * 0.8);
    fill(45, 30, 15, fragAlpha);
    text(ENDING_B_FRAGMENTS[fragIdx], width / 2, height / 2);
    pop();

    if (elapsed > holdDuration) { endingPhase++; endingStartTime = now; }
    return;
  }

  // ── Phase 5: "…" barely holds — maximum collapse ─────────────────────────
  push();
  translate(random(-9, 9), random(-5, 5));
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(14);
  // Alpha flickers erratically
  fill(45, 30, 15, 120 + random(-50, 50));
  text("\u2026", width / 2, height / 2);
  pop();

  // Hint — faint, shaking
  push();
  translate(random(-3, 3), random(-2, 2));
  fill(45, 30, 15, 70);
  textSize(6);
  textAlign(CENTER, CENTER);
  text("[ Press any key to play again ]", width / 2, height - 13);
  pop();
}

// --- DEBUG DRAW ---
function drawDebugBoxes() {
  fill(255, 0, 0, 100);
  let obs = roomObstacles[world.currentRoom] || [];
  for (let o of obs) {
    rect(o.x, o.y, o.w, o.h);
  }
}
