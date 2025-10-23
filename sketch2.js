/*
 * Chance of Life Simulator
 *
 * This sketch simulates the "race" of sperm to an egg,
 * but focuses on the 1-in-a-million chance of "you" being born.
 * It continuously runs attempts with randomized environmental parameters
 * until the "blue" sperm (representing you) wins.
 *
 * It tracks and logs the parameters of each attempt to the console.
 *
 * Controls:
 * - The slider controls the 'Immune Strength' for the next attempt.
 * - Clicking the mouse after 'you' win resets the attempt counter.
 */

// --- State & Global Variables ---

// DOM Elements
let immuneSlider;
let immuneSliderLabel;

// Simulation State
let egg;
let sperm = [];
let winner = null;
let resultText = "";
let outcomeType = "";
let attempts = 0;
let autoRestartTimer = 0;
const RESTART_DELAY = 120; // 2-second pause on failure

// Environmental Parameters
let ENV_VIGOR;
let POPULATION_DIVERSITY;
let TARGET_SIZE;
let ENV_IMMUNE_STRENGTH;
let numSperm;


// --- Main p5.js Functions ---

function setup() {
  createCanvas(600, 600);

  // --- Create UI Elements (Slider) ---
  // This code only runs once to create the slider
  if (!immuneSlider) {
    immuneSliderLabel = createSpan('Immune Strength (0-100%): ');
    immuneSliderLabel.position(10, 10);
    immuneSliderLabel.style('color', 'white');
    immuneSliderLabel.style('font-family', 'sans-serif');

    // createSlider(min, max, default, step)
    immuneSlider = createSlider(0, 100, 30, 1);
    immuneSlider.position(immuneSliderLabel.x + immuneSliderLabel.width + 5, 10);
    immuneSlider.size(120);
  }

  // Start the first simulation attempt
  startNewAttempt();
}

/**
 * The main simulation loop.
 * It's a "state machine" that either updates the race or draws the end screen.
 */
function draw() {
  background(0, 0, 30);

  // 1. Draw the environment and UI
  drawEnvironment();
  drawUI();

  // 2. Check the simulation state
  if (winner) {
    // If we have a winner (or failure), draw the end screen
    drawEndScreen();
  } else {
    // Otherwise, keep the race running
    updateSimulation();
  }
}

// --- Simulation Logic Functions ---

/**
 * Resets all parameters and agents for a new attempt.
 */
function startNewAttempt() {
  attempts++;

  // 1. Set all environmental parameters for this new attempt
  ENV_VIGOR = random(2.0, 5.0);
  POPULATION_DIVERSITY = random(0.1, 2.0);
  TARGET_SIZE = random(20, 80);
  ENV_IMMUNE_STRENGTH = immuneSlider.value(); // Read from slider
  numSperm = floor(random(1, 501));

  // 2. Log these new conditions to the console
  console.log(`--- Attempt #${attempts} ---`);
  console.log(`  Parameters: Pop: ${numSperm}, Immunity: ${ENV_IMMUNE_STRENGTH}%, Vigor: ${nfs(ENV_VIGOR, 1, 1)}, Diversity: ${nfs(POPULATION_DIVERSITY, 1, 1)}, Target: ${floor(TARGET_SIZE)}`);

  // 3. Create the agents
  egg = new Egg();
  sperm = [];
  if (numSperm === 1) {
    sperm.push(new Sperm(true)); // The "you" sperm
  } else {
    for (let i = 0; i < numSperm - 1; i++) {
      sperm.push(new Sperm(false)); // "Other" sperm
    }
    sperm.push(new Sperm(true)); // The "you" sperm
  }

  // 4. Reset state variables
  winner = null;
  resultText = "";
  outcomeType = "";
  autoRestartTimer = 0;
  loop(); // Ensure the draw loop is running
}

/**
 * Runs one frame of the "race" logic.
 * Moves, draws, and checks all sperm.
 */
function updateSimulation() {
  let anyoneAliveAndOnScreen = false;

  for (let s of sperm) {
    s.move();
    s.display();

    // Check if anyone is still in the race
    if (s.isAlive && !s.isOffScreen) {
      anyoneAliveAndOnScreen = true;
    }

    // Check if this sperm won
    if (s.checkWin(egg)) {
      winner = s; // We have a winner!
      determineOutcome(winner);

      if (winner.isYou) {
        // Success!
        console.log(`  Result: SUCCESS! 'You' were born.`);
        console.log(`  Total Attempts: ${attempts}`);
        console.log('--------------------');
        loop(); // Keep looping for the success animation
      } else {
        // Failure
        console.log(`  Result: FAILED. A 'Red' sperm won.`);
        autoRestartTimer = RESTART_DELAY;
      }
      break; // Stop the loop
    }
  }

  // Check for a "population lost" fail state
  if (!winner && !anyoneAliveAndOnScreen) {
    winner = { isYou: false }; // Create a "fake" winner to trigger the fail screen
    resultText = "Population lost. No survivors.";
    outcomeType = 'failure_lost';
    autoRestartTimer = RESTART_DELAY;
    console.log(`  Result: FAILED. Population lost.`);
  }
}

// --- Drawing & UI Functions ---

/**
 * Draws all static environment elements (the egg)
 * and updates the slider label.
 */
function drawEnvironment() {
  egg.display();
  immuneSliderLabel.html(`Immune Strength (${immuneSlider.value()}%): `);
}

/**
 * Draws the UI text overlay (top-right parameters).
 */
function drawUI() {
  fill(255);
  textSize(16);
  textAlign(RIGHT, TOP);

  let params = `Attempt: ${attempts}\n`;
  params += `Pop: ${numSperm}\n`;
  params += `Immunity: ${immuneSlider.value()}%\n`;
  params += `Vigor: ${nfs(ENV_VIGOR, 1, 1)}\n`;
  params += `Diversity: ${nfs(POPULATION_DIVERSITY, 1, 1)}\n`;
  params += `Target Size: ${floor(TARGET_SIZE)}`;
  text(params, width - 10, 10);
}

/**
 * Draws the end-of-race screen (Success or Failure).
 */
function drawEndScreen() {
  // Draw all sperm in their final positions
  for (let s of sperm) {
    s.display();
  }

  // Highlight the winner if it wasn't a total wipeout
  if (outcomeType !== 'failure_lost' && winner.pos) {
    fill(255);
    stroke(255);
    ellipse(winner.pos.x, winner.pos.y, 12, 12);
  }

  // Darken the background
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);

  if (winner.isYou) {
    // --- SUCCESS SCREEN ---
    fill(255);
    textSize(24);
    text(resultText, width / 2, height / 2 - 20);

    fill(0, 255, 0);
    textSize(22);
    text(`It took ${attempts} attempts for 'YOU' to be born!`, width / 2, height / 2 + 30);

    fill(255);
    textSize(16);
    text("Click anywhere to reset and start over.", width / 2, height / 2 + 150);

    // Show the visual animation for the outcome
    drawOutcomeAnimation();

  } else {
    // --- FAILURE (Auto-Restart) SCREEN ---
    autoRestartTimer--;
    if (autoRestartTimer <= 0) {
      startNewAttempt(); // Restart the simulation
    }

    fill(255);
    textSize(24);
    text(resultText, width / 2, height / 2 - 20);

    fill(255, 100, 100);
    textSize(18);

    if (outcomeType === 'failure_lost') {
      text(`Attempt ${attempts}: Population lost.`, width / 2, height / 2 + 20);
    } else {
      text(`Attempt ${attempts}: 'You' were not born.`, width / 2, height / 2 + 20);
    }

    fill(255);
    textSize(16);
    text("Retrying automatically...", width / 2, height / 2 + 50);
  }
}

/**
 * Draws the animated embryo(s) on the success screen.
 */
function drawOutcomeAnimation() {
  let animX = width / 2;
  let animY = height / 2 + 100;

  if (outcomeType === 'single') {
    fill(255, 220, 200); noStroke();
    ellipse(animX, animY, 30, 30);
  }
  else if (outcomeType === 'identical') {
    // Use sin() to create a simple "splitting" wobble
    let wobble = map(sin(frameCount * 0.05), -1, 1, 0, 15);
    fill(255, 220, 200); noStroke();
    ellipse(animX - wobble, animY, 30, 30);
    ellipse(animX + wobble, animY, 30, 30);
  }
  else if (outcomeType === 'fraternal') {
    fill(255, 220, 200); noStroke();
    ellipse(animX - 20, animY, 30, 30);
    ellipse(animX + 20, animY, 30, 30);
  }
  else if (outcomeType === 'triplets') {
    fill(255, 220, 200); noStroke();
    ellipse(animX - 30, animY, 30, 30);
    ellipse(animX, animY, 30, 30);
    ellipse(animX + 30, animY, 30, 30);
  }
}

/**
 * Rolls the dice to determine the birth outcome.
 * This is a simplified probabilistic model.
 */
function determineOutcome(winningSperm) {
  if (winningSperm.isYou) {
    baseText = "The 'YOU' sperm won! 🔵";
  } else {
    baseText = "Another sperm won. 🔴";
  }

  // Approximate real-world odds
  const oddsIdenticalTwins = 1 / 250;
  const oddsFraternalTwins = 1 / 80;
  const oddsTriplets = 1 / 8000;
  let roll = random(1);

  // Check from rarest to most common
  if (roll < oddsTriplets) {
    resultText = baseText + "\nAnd it's TRIPLETS! 👶👶👶";
    outcomeType = 'triplets';
  } else if (roll < oddsTriplets + oddsIdenticalTwins) {
    resultText = baseText + "\nAnd it's IDENTICAL TWINS! 👶👶";
    outcomeType = 'identical';
  } else if (roll < oddsTriplets + oddsIdenticalTwins + oddsFraternalTwins) {
    resultText = baseText + "\nAnd it's FRATERNAL TWINS! 👶👶";
    outcomeType = 'fraternal';
  } else {
    resultText = baseText + "\nIt's a SINGLE BABY! 👶";
    outcomeType = 'single';
  }
}

/**
 * Resets the attempt counter if the user clicks on the success screen.
 */
function mousePressed() {
  // Check if the simulation is paused on the success screen
  if (winner && winner.isYou) {
    console.log("--- RESETTING SIMULATION ---");
    attempts = 0; // Reset counter
    startNewAttempt(); // Start over
  }
}


// --- Agent Classes ---

/**
 * The Egg class (the target).
 * A simple, passive agent.
 */
class Egg {
  constructor() {
    this.pos = createVector(width / 2, 80);
    this.size = TARGET_SIZE; // Uses the global parameter
  }

  /**
   * Draws the egg with a simple glow effect.
   */
  display() {
    noStroke();
    // Outer glow
    fill(255, 200, 150, 50);
    ellipse(this.pos.x, this.pos.y, this.size + 20);
    // Inner glow
    fill(255, 200, 150, 100);
    ellipse(this.pos.x, this.pos.y, this.size + 10);
    // Core
    fill(255, 220, 200);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}

/**
 * The Sperm class (the agent).
 * Represents one of the millions of competitors.
 */
class Sperm {
  constructor(isYou) {
    this.pos = createVector(random(width), height - 20);

    // 1. Set Speed (Velocity)
    // Speed is based on the global Vigor and Diversity parameters
    let minSpeed = ENV_VIGOR - POPULATION_DIVERSITY;
    let maxSpeed = ENV_VIGOR + POPULATION_DIVERSITY;
    if (minSpeed < 0.5) minSpeed = 0.5; // Prevent moving backwards
    this.vel = createVector(0, -random(minSpeed, maxSpeed));

    // 2. Set State
    this.isYou = isYou;
    this.isAlive = true;
    this.isOffScreen = false;
    this.color = isYou ? color(0, 150, 255) : color(255, 50, 50, 150);

    // 3. Set visual properties
    this.history = []; // Stores past positions for the tail
    this.tailLength = 7;
    // Used by Perlin noise to create a unique, organic wiggle
    this.noiseOffset = random(1000);

    // 4. Check against immune system
    if (random(100) < ENV_IMMUNE_STRENGTH) {
      this.isAlive = false;
      this.color = color(100); // Culled sperm are gray
    }
  }

  /**
   * Updates the sperm's position.
   */
  move() {
    // Dead, off-screen, or winning sperm don't move
    if (!this.isAlive || this.isOffScreen) return;

    // 1. Calculate wiggle
    // Perlin noise creates a smooth, random "organic" movement
    let wiggleAmount = map(ENV_VIGOR, 2, 5, 1, 4, true);
    let wiggleSpeed = map(ENV_VIGOR, 2, 5, 0.08, 0.15, true);
    let wiggle = map(noise(this.noiseOffset), 0, 1, -wiggleAmount, wiggleAmount);

    // 2. Apply forces
    this.pos.x += wiggle;
    this.pos.add(this.vel); // Apply main velocity
    this.noiseOffset += wiggleSpeed; // Increment noise for next frame

    // 3. Check boundaries
    if (this.pos.y < -20 || this.pos.x < -20 || this.pos.x > width + 20) {
      this.isOffScreen = true;
    }

    // 4. Update tail history
    this.history.push(this.pos.copy());
    if (this.history.length > this.tailLength) {
      this.history.splice(0, 1); // Remove the oldest point
    }
  }

  /**
   * Draws the sperm (head and tail).
   */
  display() {
    // Don't draw if it's fully off-screen
    if (this.isOffScreen) return;
    
    // Draw the tail first, but only if alive
    if (this.isAlive) {
      beginShape();
      noFill();
      stroke(this.color);
      strokeWeight(3);
      for (let i = 0; i < this.history.length; i++) {
        let pos = this.history[i];
        
        // Map 'i' to amplitude, so the tip (i=0) wiggles most
        // and the base (i=length-1) wiggles least.
        let amplitude = map(i, 0, this.history.length - 1, 6, 0);
        
        // Use sin() for a fast, flicking visual-only wiggle
        let visualWiggle = sin(frameCount * 0.6 + i * 0.5) * amplitude;
        
        vertex(pos.x + visualWiggle, pos.y);
      }
      endShape();
    }

    // Draw the head (a simple ellipse)
    fill(this.color);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 8, 8);
  }

  /**
   * Checks if this sperm has successfully fertilized the target.
   */
  checkWin(target) {
    // Can't win if dead or off-screen
    if (!this.isAlive || this.isOffScreen) return false;

    // Standard distance check
    let d = dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
    if (d < target.size / 2) {
      return true;
    }
    return false;
  }
}
