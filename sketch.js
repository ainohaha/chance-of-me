// --- Global Variables ---
let sperm = [];
let numSperm = 2000; // Let's simulate 2000 particles
let egg;
let winner = null;
let resultText = ""; // To store the outcome

// --- The 'Egg' Object ---
class Egg {
  constructor() {
    this.pos = createVector(width / 2, 80);
    this.size = 50;
  }

  display() {
    // Draw a glowing-ish egg
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
    // Start at a random position at the bottom
    this.pos = createVector(random(width), height - 20);
    
    // Give it a base upward velocity
    this.vel = createVector(0, -random(2, 4));
    
    // For the side-to-side "wiggling" motion
    this.noiseOffset = random(1000); 
    
    this.isYou = isYou;
    this.color = isYou ? color(0, 150, 255) : color(255, 50, 50, 150);
  }

  move() {
    // Use Perlin noise to create a smooth, random wiggle
    let wiggle = map(noise(this.noiseOffset), 0, 1, -1, 1);
    this.pos.x += wiggle;
    
    // Move up
    this.pos.add(this.vel);
    
    // Increment noise offset for next frame's wiggle
    this.noiseOffset += 0.05;
  }

  display() {
    stroke(this.color);
    fill(this.color);
    // Draw a simple shape: a head (ellipse) and a tail (line)
    ellipse(this.pos.x, this.pos.y, 8, 8);
    line(this.pos.x, this.pos.y + 4, this.pos.x - this.vel.x * 3, this.pos.y + 15);
  }

  // Check if this sperm has reached the egg
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
  
  // Create the egg
  egg = new Egg();
  
  // Clear any old sperm
  sperm = [];
  
  // Create all the "other" red sperm
  for (let i = 0; i < numSperm - 1; i++) {
    sperm.push(new Sperm(false));
  }
  
  // Create the one "blue" sperm (you!)
  sperm.push(new Sperm(true));
  
  // Reset winner and result
  winner = null;
  resultText = "";
}

function draw() {
  background(0, 0, 30); // Dark blue background
  
  // Draw the egg
  egg.display();

  // If we don't have a winner yet, keep the race going
  if (!winner) {
    for (let s of sperm) {
      s.move();
      s.display();
      
      // Check if this sperm won
      if (s.checkWin(egg)) {
        winner = s; // We have a winner!
        determineOutcome(winner); // Run the probability model
        noLoop(); // Stop the simulation
        break; // Exit the loop
      }
    }
  } else {
    // --- If a winner has been found ---
    
    // Keep drawing all sperm in their final position
    for (let s of sperm) {
      s.display();
    }
    
    // Draw the winning sperm in bright white
    fill(255);
    stroke(255);
    ellipse(winner.pos.x, winner.pos.y, 12, 12);
    
    // Display the final result
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(24);
    text(resultText, width / 2, height / 2);
    
    textSize(16);
    text("Click anywhere to run the simulation again.", width / 2, height / 2 + 40);
  }
}

// This function runs when the mouse is clicked
function mousePressed() {
  // If the simulation is over, clicking will restart it
  if (winner) {
    setup(); // Re-run setup
    loop();  // Start the draw loop again
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
  const oddsTriplets = 1 / 8000; // (and rarer)

  let roll = random(1); // Get a random number between 0.0 and 1.0

  if (roll < oddsTriplets) {
    // This is the rarest event, so we check it first
    resultText = baseText + "\nAnd it's TRIPLETS! 👶👶👶";
  } else if (roll < oddsTriplets + oddsIdenticalTwins) {
    // The *one* fertilized egg split
    resultText = baseText + "\nAnd it's IDENTICAL TWINS! 👶👶";
  } else if (roll < oddsTriplets + oddsIdenticalTwins + oddsFraternalTwins) {
    // *Two* separate eggs were fertilized
    // (In our simulation, this means the winner + another random one)
    resultText = baseText + "\nAnd it's FRATERNAL TWINS! 👶👶";
  } else {
    // The most common outcome
    resultText = baseText + "\nIt's a SINGLE BABY! 👶";
  }
}
