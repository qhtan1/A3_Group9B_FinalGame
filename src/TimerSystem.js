class TimerSystem {
  constructor() {
    // Real-world duration: 180 seconds = 3 minutes
    // Game-time represented: 7:00 AM → 7:40 AM (40 game-minutes)
    this.totalSeconds    = 3 * 60;
    this.remainingSeconds = this.totalSeconds;
    this.isActive        = false;
    this.startTime       = 0;
    this.pausedTime      = 0;

    // Day 3 time distortion (random small jumps)
    this.isDistorted   = false;
    this.lastJumpTime  = 0;
    this.jumpInterval  = 15000; // Jump roughly every 15 seconds

    // Day 5 time distortion (specific displayed jump sequence)
    // Displayed sequence: 7:00 → 7:05 → 7:11 → 7:18 → 7:23 → normal countdown
    this.day5Mode = false;
  }

  /** Start the timer (called when player interacts with alarm clock) */
  start() {
    if (!this.isActive) {
      this.isActive  = true;
      this.startTime = millis();
      this.pausedTime = 0;
    }
  }

  /** Stop the timer */
  stop() {
    this.isActive = false;
  }

  /** Reset timer to full 3 minutes */
  reset() {
    this.remainingSeconds = this.totalSeconds;
    this.isActive   = false;
    this.startTime  = 0;
    this.pausedTime = 0;
    this.lastJumpTime = 0;
    this.isDistorted  = false;
    this.day5Mode     = false;
  }

  /** Enable Day 3 time distortion effect (random jumps) */
  enableDistortion() {
    this.isDistorted  = true;
    this.lastJumpTime = millis();
  }

  /** Disable time distortion */
  disableDistortion() {
    this.isDistorted = false;
  }

  /**
   * Enable Day 5 mode — clock shows the jump sequence:
   *   7:00 (0–4 s) → 7:05 (4–14 s) → 7:11 (14–26 s) → 7:18 (26–38 s)
   *   → 7:23 (38–50 s) → then normal countdown 7:23–7:40
   */
  enableDay5Mode() {
    this.day5Mode = true;
  }

  /** Update timer each frame */
  update() {
    if (!this.isActive) return;

    let elapsed = millis() - this.startTime - this.pausedTime;
    this.remainingSeconds = max(0, this.totalSeconds - elapsed / 1000);

    // Day 3: random small time jumps every ~15 seconds
    if (this.isDistorted && !this.day5Mode && this.remainingSeconds > 0) {
      let now = millis();
      if (now - this.lastJumpTime > this.jumpInterval) {
        let jumpAmount = random(3, 5);
        this.startTime -= jumpAmount * 1000;
        this.lastJumpTime = now;
      }
    }

    // Check if time is up
    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = 0;
      this.isActive = false;
    }

    this.updateHTMLDisplay();
  }

  /** @returns {boolean} */
  hasExpired() {
    return this.remainingSeconds <= 0;
  }

  /**
   * Get elapsed game-minutes (0–40).
   * For Day 5, this reflects the underlying real seconds (used for deadline enforcement).
   * @returns {number}
   */
  getGameMinutes() {
    let elapsed = this.totalSeconds - this.remainingSeconds;
    return min(40, floor(elapsed * 40 / this.totalSeconds));
  }

  /**
   * Get formatted clock string for display.
   * Day 5 overrides with the jump sequence; all other days use normal mapping.
   * @returns {string}
   */
  getFormattedTime() {
    if (this.day5Mode) {
      let elapsed = this.totalSeconds - this.remainingSeconds; // real seconds elapsed

      // Phase 0 — 7:00 (first 4 s — alarm was just checked)
      if (elapsed < 4)  return "7:00";
      // Phase 1 — jump to 7:05
      if (elapsed < 14) return "7:05";
      // Phase 2 — jump to 7:11
      if (elapsed < 26) return "7:11";
      // Phase 3 — jump to 7:18
      if (elapsed < 38) return "7:18";
      // Phase 4 — jump to 7:23
      if (elapsed < 50) return "7:23";

      // After 50 s: normal countdown from 7:23 to 7:40
      // Map the remaining seconds (totalSeconds - 50) to 17 game-minutes
      let postJumpElapsed  = elapsed - 50;
      let postJumpTotal    = this.totalSeconds - 50; // ≈ 130 s
      let postJumpProgress = min(1, postJumpElapsed / postJumpTotal);
      let minutes = min(40, floor(23 + postJumpProgress * 17));
      let minStr  = minutes < 10 ? "0" + minutes : "" + minutes;
      return "7:" + minStr;
    }

    // Normal mode (Day 1 / Day 3)
    let gm     = this.getGameMinutes();
    let minStr = gm < 10 ? "0" + gm : "" + gm;
    return "7:" + minStr;
  }

  /** @returns {number} */
  getSeconds() { return this.remainingSeconds; }

  /** @returns {boolean} */
  getIsActive() { return this.isActive; }

  /** Draw timer display — now handled via HTML/CSS */
  draw() {
    this.updateHTMLDisplay();
  }

  /** Update the HTML timer element and its warning colour */
  updateHTMLDisplay() {
    const timerDisplay = document.getElementById("timer-display");
    if (!timerDisplay) return;

    timerDisplay.textContent = this.getFormattedTime();

    // Derive displayed minutes from the formatted string for colour logic
    let displayedMinutes;
    if (this.day5Mode) {
      let parts = this.getFormattedTime().split(":");
      displayedMinutes = parseInt(parts[1]);
    } else {
      displayedMinutes = this.getGameMinutes();
    }

    if (displayedMinutes >= 37) {
      timerDisplay.style.color = "#f44336"; // Red  — 7:37+
    } else if (displayedMinutes >= 32) {
      timerDisplay.style.color = "#ff9800"; // Orange — 7:32+
    } else {
      timerDisplay.style.color = "#5a4a2f"; // Normal brown
    }
  }
}
