class ChecklistManager {
  constructor() {
    // Map sequence steps to task names
    this.tasks = {
      0: "Check the alarm clock",
      1: "Look in the mirror",
      3: "Brew tea",
      5: "Talk to partner",
      6: "Read the newspaper",
      8: "Greet the neighbor",
      9: "Check the door number",
    };

    // Track which tasks are completed
    this.completedSteps = new Set();

    // Minimum tasks required before leaving
    this.minTasksRequired = 3;
  }

  /**
   * Mark a task as complete when player interacts with it
   * @param {number} step - The sequence step number
   */
  markTaskComplete(step) {
    if (this.tasks[step]) {
      this.completedSteps.add(step);
      this.updateHTMLPanel();
    }
  }

  /**
   * Check if player has met minimum requirement to leave
   * @returns {boolean} - True if enough tasks completed
   */
  canLeaveApartment() {
    return this.completedSteps.size >= this.minTasksRequired;
  }

  /**
   * Get count of completed tasks
   * @returns {number}
   */
  getCompletedCount() {
    return this.completedSteps.size;
  }

  /**
   * Get all task names with completion status
   * @returns {Array} - Array of {step, name, completed} objects
   */
  getAllTasks() {
    return Object.entries(this.tasks).map(([step, name]) => ({
      step: parseInt(step),
      name: name,
      completed: this.completedSteps.has(parseInt(step)),
    }));
  }

  /**
   * Check if a specific task is complete
   * @param {number} step - The sequence step number
   * @returns {boolean}
   */
  isTaskComplete(step) {
    return this.completedSteps.has(step);
  }

  /**
   * Update the HTML checklist panel to reflect current state
   */
  updateHTMLPanel() {
    const checkboxes = document.querySelectorAll(
      ".checklist-item input[type='checkbox']",
    );

    checkboxes.forEach((checkbox, index) => {
      const stepMap = [0, 1, 3, 5, 6, 8, 9]; // Map checkbox index to step number
      const step = stepMap[index];
      checkbox.checked = this.isTaskComplete(step);
    });
  }

  /**
   * Reset checklist for new day
   */
  reset() {
    this.completedSteps.clear();
    this.updateHTMLPanel();
  }

  /**
   * Draw the checklist panel on the left side
   * NOTE: This is now handled by CSS in index.html and style.css
   * Keeping method for backwards compatibility
   */
  draw() {
    // P5.js drawing disabled - using HTML/CSS instead
  }
}
