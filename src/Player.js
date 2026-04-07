class Player {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.speed = 1.5;

    this.direction = "down";
    this.isMoving = false;
    this.animFrame = 0;

    // Day 5: Elderly sprite — uses a warm sepia tint on the existing sprites
    this.useElderlySprite = false;

    // Clarity pause mechanic (Day 3 / Day 5)
    this.frozen = false;

    // Day 5: Wrong direction mechanic
    this.wrongDirEnabled  = false;
    this._wrongDirTimer   = 0;
    this._wrongDirActive  = false;
    this._wrongDirDuration = 0;
    this._wrongDirType    = ''; // 'W_to_R'  (W→right) | 'A_to_U' (A→up)
  }

  // clarityRatio: 1 = full clarity, 0 = no clarity (Day 3 only)
  draw(clarityRatio) {
    if (clarityRatio === undefined) clarityRatio = 1;

    if (this.isMoving) {
      if (frameCount % 10 === 0) {
        this.animFrame = (this.animFrame + 1) % 3;
      }
    } else {
      this.animFrame = 0;
    }

    // Pick sprite set: elderly sprites when mirror has been seen on Day 5
    var currentImg = null;
    if (this.useElderlySprite && typeof elderlySprites !== "undefined") {
      var elderlyDir = elderlySprites[this.direction];
      if (elderlyDir) {
        var candidate = elderlyDir[this.animFrame];
        // Only use if actually loaded (width > 0); otherwise fall through to player sprites
        if (candidate && candidate.width > 0) currentImg = candidate;
      }
    }
    if (!currentImg && typeof playerSprites !== "undefined" && playerSprites[this.direction]) {
      currentImg = playerSprites[this.direction][this.animFrame];
    }

    if (currentImg) {
      var drawW = 30;
      var drawH = 50;
      var drawX = this.x + this.w / 2 - drawW / 2;
      var drawY = this.y + this.h - drawH + 4;

      // Glitch effect (Day 3 when clarity is reduced)
      var glitchStrength = map(clarityRatio, 1, 0, 0, 8);
      var jitterChance   = map(clarityRatio, 1, 0, 0, 0.5);
      var doJitter       = clarityRatio < 1 && random() < jitterChance;

      push();

      if (doJitter) {
        drawX += random(-glitchStrength, glitchStrength);
        drawY += random(-glitchStrength * 0.5, glitchStrength * 0.5);
        // Red ghost offset
        tint(255, 60, 60, 120);
        image(currentImg, drawX + glitchStrength * 0.8, drawY, drawW, drawH);
        noTint();
      }


      // Occasional flicker at low clarity
      var flickerChance = map(clarityRatio, 0.7, 0, 0, 0.15);
      var doFlicker = clarityRatio < 0.7 && random() < flickerChance;
      if (!doFlicker) {
        image(currentImg, drawX, drawY, drawW, drawH);
      }
      pop();
    } else {
      fill("#B97A6A");
      noStroke();
      ellipseMode(CORNER);
      ellipse(this.x, this.y, this.w, this.h);
    }

    if (typeof showDebug !== "undefined" && showDebug) {
      fill(0, 0, 255, 100);
      rect(this.x, this.y, this.w, this.h);
    }
  }

  // clarityRatio: 1 = full speed, lower = slower (Day 3 only)
  handleMovement(obstacles, canvasWidth, canvasHeight, clarityRatio) {
    if (clarityRatio === undefined) clarityRatio = 1;

    // Speed drops to 40% minimum as clarity fades
    var currentSpeed = this.speed * max(0.4, clarityRatio);

    var nextX = this.x;
    var nextY = this.y;
    this.isMoving = false;

    // Clarity pause: block all movement while frozen
    if (this.frozen) return;

    // ── Day 5: Wrong-direction glitch ─────────────────────────────────────
    if (this.wrongDirEnabled) {
      this._wrongDirTimer++;
      // Re-roll every ~240 frames (~4 s at 60 fps); 22% chance of glitch burst
      if (this._wrongDirTimer % 240 === 0 && random() < 0.22) {
        this._wrongDirActive   = true;
        this._wrongDirDuration = 50;                              // ~0.8 s
        this._wrongDirType     = random() < 0.5 ? 'W_to_R' : 'A_to_U';
      }
      if (this._wrongDirActive) {
        this._wrongDirDuration--;
        if (this._wrongDirDuration <= 0) this._wrongDirActive = false;
      }
    }

    // Determine intended directions from keys
    let wantUp    = (keyIsDown(87) || keyIsDown(UP_ARROW));
    let wantDown  = (keyIsDown(83) || keyIsDown(DOWN_ARROW));
    let wantLeft  = (keyIsDown(65) || keyIsDown(LEFT_ARROW));
    let wantRight = (keyIsDown(68) || keyIsDown(RIGHT_ARROW));

    // Apply wrong direction override when glitch is active
    if (this.wrongDirEnabled && this._wrongDirActive) {
      if (this._wrongDirType === 'W_to_R' && wantUp) {
        wantUp    = false;
        wantRight = true;
      } else if (this._wrongDirType === 'A_to_U' && wantLeft) {
        wantLeft = false;
        wantUp   = true;
      }
    }

    // Apply movement from effective directions
    if (wantUp) {
      nextY -= currentSpeed;
      this.direction = "up";
      this.isMoving  = true;
    } else if (wantDown) {
      nextY += currentSpeed;
      this.direction = "down";
      this.isMoving  = true;
    }

    if (wantLeft) {
      nextX -= currentSpeed;
      this.direction = "left";
      this.isMoving  = true;
    } else if (wantRight) {
      nextX += currentSpeed;
      this.direction = "right";
      this.isMoving  = true;
    }

    nextX = constrain(nextX, 0, canvasWidth - this.w);
    nextY = constrain(nextY, 0, canvasHeight - this.h);

    var canMoveX = true;
    var canMoveY = true;

    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      if (this.checkCollision(nextX, this.y, this.w, this.h, obs.x, obs.y, obs.w, obs.h))
        canMoveX = false;
      if (this.checkCollision(this.x, nextY, this.w, this.h, obs.x, obs.y, obs.w, obs.h))
        canMoveY = false;
    }

    if (canMoveX) this.x = nextX;
    if (canMoveY) this.y = nextY;
  }

  checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }
}
