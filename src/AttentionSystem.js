class AttentionSystem {
  constructor() {
    this.maxAttention = 100;
    this.currentAttention = 100;
    this.lastLevel = "High";

    // Visual feedback effect
    this.blurEffect = 0;
    this.blurFadeSpeed = 0.08;

    // Observation UI flag
    this._shouldShowObservationUI = false;
    this.observationStep = null;

    // Track which observation steps have been answered
    this.answeredObservationSteps = new Set();

    // Define correct answers for each observation step
    // 0: Clock - extra hand → "Something is wrong"
    // 1: Mirror - reflection looks unfamiliar → "Something is wrong"
    // 3: Tea tin - unchanged from Day 1 → "Looks normal"
    // 6: Newspaper - missing letters → "Something is wrong"
    // 9: Door sign - incomplete number → "Something is wrong"
    this.correctAnswers = {
      0: "wrong",  // Clock has an extra hand
      1: "wrong",  // Mirror reflection looks unfamiliar
      3: "normal", // Tea tin is unchanged — "something is wrong" is the wrong answer
      6: "wrong",  // Newspaper has missing letters
      9: "wrong",  // Door sign shows "20?" instead of 204
    };
  }

  /**
   * Get current attention level name
   * @returns {string} - "High", "Moderate", "Low", or "Very Low"
   */
  getLevel() {
    if (this.currentAttention >= 76) return "High";
    if (this.currentAttention >= 51) return "Moderate";
    if (this.currentAttention >= 26) return "Low";
    return "Very Low";
  }

  /**
   * Get current number of segments to display (1-3)
   * @returns {number}
   */
  getSegments() {
    let level = this.getLevel();
    if (level === "High") return 3;
    if (level === "Moderate") return 2;
    if (level === "Low") return 1;
    return 1; // Very Low still shows 1
  }

  /**
   * Get color for current level
   * @returns {string} - hex color code
   */
  getColor() {
    let level = this.getLevel();
    if (level === "High") return "#4CAF50"; // Green
    if (level === "Moderate") return "#FFC107"; // Yellow/Gold
    if (level === "Low") return "#FF9800"; // Orange
    return "#F44336"; // Red for Very Low
  }

  /**
   * Get description text for current level
   * @returns {string}
   */
  getDescription() {
    let level = this.getLevel();
    if (level === "High") return "You are very focused.";
    if (level === "Moderate") return "Your attention is okay.";
    if (level === "Low") return "It's getting harder to focus.";
    return "Focusing is difficult right now.";
  }

  /**
   * Get warning message when level decreases
   * @param {string} newLevel - The new attention level
   * @returns {string}
   */
  getWarningMessage(newLevel) {
    if (newLevel === "Moderate") {
      return "It's getting harder to hold on to things...";
    }
    if (newLevel === "Low") {
      return "Clarity is fading. Something feels wrong.";
    }
    if (newLevel === "Very Low") {
      return "Everything is slipping away...";
    }
    return "";
  }

  /**
   * Decrease attention (called from game events)
   * @param {number} amount - How much to decrease (default 15)
   * @returns {boolean} - True if level changed
   */
  decrease(amount = 15) {
    let oldLevel = this.getLevel();
    this.currentAttention = max(0, this.currentAttention - amount);
    let newLevel = this.getLevel();

    // Trigger blur effect on decrease
    this.blurEffect = 1;

    // Update HTML panel
    this.updateHTMLPanel();

    if (oldLevel !== newLevel) {
      return true; // Level changed
    }
    return false;
  }

  /**
   * Increase attention (for rest breaks)
   * @param {number} amount - How much to increase (default 25)
   */
  increase(amount = 25) {
    this.currentAttention = min(
      this.maxAttention,
      this.currentAttention + amount,
    );
    this.updateHTMLPanel();
  }

  /**
   * Reset attention to full
   */
  reset() {
    this.currentAttention = this.maxAttention;
    this.blurEffect = 0;
    this.lastLevel = "High";
    this.answeredObservationSteps.clear();
    this._shouldShowObservationUI = false;
    this.observationStep = null;
    this.updateHTMLPanel();
  }

  /**
   * Update blur effect fade
   */
  update() {
    if (this.blurEffect > 0) {
      this.blurEffect = max(0, this.blurEffect - this.blurFadeSpeed);
    }
  }

  /**
   * Get blur amount for visual feedback (0-1)
   * @returns {number}
   */
  getBlurAmount() {
    return this.blurEffect;
  }

  /**
   * Enable observation UI for a specific step
   * @param {number} step - The sequence step requiring observation
   * @returns {boolean} - True if observation was triggered, false if already answered
   */
  triggerObservationUI(step) {
    // Steps that require observation in Day 3
    const observationSteps = [0, 1, 3, 6, 9]; // Clock, Mirror, Tea tin, Newspaper, Door sign

    // Only trigger if this step hasn't been answered yet
    if (
      observationSteps.includes(step) &&
      !this.answeredObservationSteps.has(step)
    ) {
      this._shouldShowObservationUI = true;
      this.observationStep = step;
      return true;
    }
    return false;
  }

  /**
   * Mark an observation step as answered
   * @param {number} step - The sequence step that was answered
   */
  markObservationAnswered(step) {
    this.answeredObservationSteps.add(step);
  }

  /**
   * Dismiss observation UI
   */
  dismissObservationUI() {
    this._shouldShowObservationUI = false;
    this.observationStep = null;
  }

  /**
   * Check if observation UI should be shown
   * @returns {boolean}
   */
  isShowingObservationUI() {
    return this._shouldShowObservationUI;
  }

  /**
   * Get observation step
   * @returns {number|null}
   */
  getObservationStep() {
    return this.observationStep;
  }

  /**
   * Get the correct answer for an observation step
   * @param {number} step - The sequence step
   * @returns {string} - "wrong" or "normal"
   */
  getCorrectAnswer(step) {
    return this.correctAnswers[step] || "normal";
  }

  /**
   * Check if the player's answer is correct
   * @param {number} step - The sequence step
   * @param {string} answer - "wrong" or "normal"
   * @returns {boolean}
   */
  isAnswerCorrect(step, answer) {
    return this.correctAnswers[step] === answer;
  }

  /**
   * Draw attention level bar in top-right corner
   * NOTE: This is now handled by CSS in index.html and style.css
   * Keeping method for backwards compatibility
   */
  draw() {
    // P5.js drawing disabled - using HTML/CSS instead
    this.updateHTMLPanel();
  }

  /**
   * Update the HTML attention panel to reflect current state
   */
  updateHTMLPanel() {
    const segments = document.querySelectorAll(".attention-segment");
    const numSegments = this.getSegments();
    const level = this.getLevel();

    // Update segment visibility and coloring
    segments.forEach((segment, index) => {
      segment.classList.remove("active", "moderate", "low", "critical");

      if (index < numSegments) {
        segment.classList.add("active");
        if (level === "Moderate") segment.classList.add("moderate");
        else if (level === "Low") segment.classList.add("low");
        else if (level === "Very Low") segment.classList.add("critical");
      }
    });
  }
}
