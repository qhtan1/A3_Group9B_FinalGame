class Mirror {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.history = []; // Stores past positions for the delay
  }

  update(playerPos, delayFrames) {
    // Record current position
    this.history.push({ x: playerPos.x, y: playerPos.y });

    // Keep history only as long as the delay requires
    if (this.history.length > delayFrames + 1) {
      this.history.shift();
    }
  }

  display(isFinalDay) {
    fill(200, 220, 255, 150); // Glassy blue tint
    rect(this.x, this.y, this.w, this.h);

    // Get the delayed position (first item in history)
    let delayedPos = this.history[0];

    if (delayedPos) {
      push();
      translate(this.x + this.w / 2, this.y + this.h / 2);

      // If Final Day, character looks older or different [cite: 68]
      fill(isFinalDay ? "#808080" : "#B97A6A");
      ellipse(delayedPos.x - player.x, 0, 40, 40); // Simplified geometric face [cite: 115]
      pop();
    }
  }
}
