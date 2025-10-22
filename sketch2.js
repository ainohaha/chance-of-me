// --- Global Variables ---
let sperm = [];
let numSperm = 50; // Keep it at 50 to see the blue one
let egg;
let winner = null;
let resultText = ""; // To store the outcome

let attempts = 0;          // Counts every simulation run
let autoRestartTimer = 0;  // Timer for automatic restart
const RESTART_DELAY = 90;  // Frames to wait before auto-restarting (1.5 seconds)

// --- The 'Egg' Object ---
class Egg {
  constructor() {
    this.pos = createVector(width / 2, 80);
    this.size = 50;
  }

  display() {
    noStroke();
    fill(255, 200, 150, 50);
    ellipse(this.pos.x, this.pos.y, this.size + 20);
    fill(255, 200, 150, 100);
    ellipse(this.pos.x, this.pos.y, this.size + 10);
    fill(255, 220, 200);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}

// --- The 'Sperm' Object ---
class Sperm {
  constructor(isYou) {
    this.pos = createVector(random(width), height - 20);
    this.vel = createVector(0, -random(2, 4));
    this.noiseOffset = random(1000); 
    
    this.isYou = isYou;
    this.color = isYou ? color(0, 150, 255) : color(255, 50, 50, 150);
    
    // NEW: For the tail
    this.history = []; // Array to store past positions
    this.tailLength = 10;
  }

  move() {
    // Wiggle
    let wiggle = map(noise(this.noiseOffset), 0, 1, -1, 1);
    this.pos.x += wiggle;
    
    // Move up
    this.pos.add(this.vel);
    
    // Update noise for next frame
    this.noiseOffset += 0.05;
    
    // --- NEW: Update Tail History ---
    this.history.push(this.pos.copy()); // Add current position to the history
    
    // Limit the tail length
    if (this.history.length > this.tailLength) {
      this.history.splice(0, 1); // Remove the oldest position
    }
  }

  display() {
    // --- NEW: Draw Animated Tail ---
    // Draw the tail first
    beginShape();
    noFill();
    stroke(this.color);
    strokeWeight(3);
    for (let pos of this.history) {
      vertex(pos.x, pos.y);
    }
    endShape();
    
    // Draw the head on top
    fill(this.color);
    noStroke();
    ellipse(this.pos.x, this.pos.y, 8, 8);
  }

  checkWin(target) {
    let d = dist(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
    if (d < target.size / 2) {
      return true;
    }
    return false;
  }
}

// --- p5.js Main Functions ---

function setup() {
  createCanvas(600, 600);
  
  egg = new Egg();
  
  // Clear old sperm
  sperm = [];
  
  // Create all the "other" red sperm
  for (let i = 0; i < numSperm - 1; i++) {
    sperm.push(new Sperm(false));
  }
  // Create the one "blue" sperm (you!)
  sperm.push(new Sperm(true));
  
  winner = null;
  resultText = "";
  autoRestartTimer = 0;
  
  attempts++; // Increment the attempt counter every time we setup
  
  loop(); // Ensure the draw loop is running
}

function draw() {
  background(0, 0, 30);
  
  egg.display();

  // If we don't have a winner yet, keep the race going
  if (!winner) {
    for (let s of sperm) {
      s.move();
      s.display();
      
      if (s.checkWin(egg)) {
        winner = s; // We have a winner!
        determineOutcome(winner); // Run the probability model
        
        if (!winner.isYou) {
          // 'You' did not win, set timer to auto-restart
          autoRestartTimer = RESTART_DELAY;
        } else {
          // 'You' WON! Stop the simulation.
          noLoop();
        }
        break; // Exit the loop
      }
    }
  } else {
    // --- A winner has been found ---
    
    // Keep drawing all sperm in their final position
    for (let s of sperm) {
      s.display();
    }
    
    // Highlight winner
    fill(255);
    stroke(255);
    ellipse(winner.pos.x, winner.pos.y, 12, 12);
    
    // Display the final result
    textAlign(CENTER, CENTER);
    
    if (winner.isYou) {
      // --- SUCCESS SCREEN ---
      fill(255);
      textSize(24);
      text(resultText, width / 2, height / 2 - 20);
      
      fill(0, 255, 0); // Green for success
      textSize(22);
      text(`It took ${attempts} attempts for 'YOU' to be born!`, width / 2, height / 2 + 30);
      
      fill(255);
      textSize(16);
      text("Click anywhere to reset and start over.", width / 2, height / 2 + 70);
      
    } else {
      // --- FAILURE (Auto-Restart) SCREEN ---
      autoRestartTimer--;
      if (autoRestartTimer <= 0) {
        setup(); // Restart the simulation
      }
      
      fill(255);
      textSize(24);
      text(resultText, width / 2, height / 2 - 20);
      
      fill(255, 100, 100); // Red for failure
      textSize(18);
      text(`Attempt ${attempts}: 'You' were not born.`, width / 2, height / 2 + 20);
      
      fill(255);
      textSize(16);
      text("Retrying automatically...", width / 2, height / 2 + 50);
    }
  }
}

// This function runs when the mouse is clicked
function mousePressed() {
  // Only allow reset if 'you' have won and the simulation is stopped
  if (winner && winner.isYou) {
    attempts = 0; // Reset counter
    setup();      // Re-run setup
  }
}

// --- Part 2: The Probabilistic Outcome Model ---
function determineOutcome(winningSperm) {
  let baseText = "";
  
  if (winningSperm.isYou) {
    baseText = "The 'YOU' sperm won! 🔵";
  } else {
    baseText = "Another sperm won. 🔴";
  }

  // Real-world odds (approximate)
  const oddsIdenticalTwins = 1 / 250;
  const oddsFraternalTwins = 1 / 80;
  const oddsTriplets = 1 / 8000; 

  let roll = random(1); 

  if (roll < oddsTriplets) {
    resultText = baseText + "\nAnd it's TRIPLETS! 👶👶👶";
  } else if (roll < oddsTriplets + oddsIdenticalTwins) {
    resultText = baseText + "\nAnd it's IDENTICAL TWINS! 👶👶";
  } else if (roll < oddsTriplets + oddsIdenticalTwins + oddsFraternalTwins) {
    resultText = baseText + "\nAnd it's FRATERNAL TWINS! 👶👶";
  } else {
    resultText = baseText + "\nIt's a SINGLE BABY! 👶";
  }
}
