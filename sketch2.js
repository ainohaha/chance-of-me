// --- Global Variables ---
// NEW: These are now just declarations. They get set in setup().
let ENV_VIGOR; 
let POPULATION_DIVERSITY;
let TARGET_SIZE;
let ENV_IMMUNE_STRENGTH;

let sperm = [];
let numSperm; 
let egg;
let winner = null;
let resultText = ""; 
let outcomeType = ""; 

let attempts = 0;          
let autoRestartTimer = 0;  
const RESTART_DELAY = 90;  

// --- The 'Egg' Object ---
class Egg {
  constructor() {
    this.pos = createVector(width / 2, 80);
    this.size = TARGET_SIZE; // Uses the new global
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
    
    let minSpeed = ENV_VIGOR - POPULATION_DIVERSITY;
    let maxSpeed = ENV_VIGOR + POPULATION_DIVERSITY;
    if (minSpeed < 0.5) minSpeed = 0.5; 
    this.vel = createVector(0, -random(minSpeed, maxSpeed)); 
    
    this.noiseOffset = random(1000); 
    this.isYou = isYou;
    this.color = isYou ? color(0, 150, 255) : color(255, 50, 50, 150);
    this.history = []; 
    this.tailLength = 7; 
    
    // NEW: Off-screen check
    this.isOffScreen = false;
    
    this.isAlive = true;
    if (random(100) < ENV_IMMUNE_STRENGTH) {
      this.isAlive = false;
      this.color = color(100); 
    }
  }

  move() {
    // NEW: Don't move if dead OR off-screen
    if (!this.isAlive || this.isOffScreen) return; 
    
    let wiggleAmount = map(ENV_VIGOR, 2, 5, 1, 4, true); 
    let wiggleSpeed = map(ENV_VIGOR, 2, 5, 0.08, 0.15, true);
    let wiggle = map(noise(this.noiseOffset), 0, 1, -wiggleAmount, wiggleAmount);
    
    this.pos.x += wiggle;
    this.pos.add(this.vel);
    this.noiseOffset += wiggleSpeed;
    
    // NEW: Check if this agent is off-screen
    // Give a buffer so it's fully gone
    if (this.pos.y < -20 || this.pos.x < -20 || this.pos.x > width + 20) {
      this.isOffScreen = true;
    }
    
    this.history.push(this.pos.copy()); 
    if (this.history.length > this.tailLength) {
      this.history.splice(0, 1); 
    }
  }

  display() {
    if (this.isAlive && !this.isOffScreen) {
      beginShape();
      noFill();
      stroke(this.color);
      strokeWeight(3);
      for (let i = 0; i < this.history.length; i++) {
        let pos = this.history[i];
        let amplitude = map(i, 0, this.history.length - 1, 6, 0);
        let visualWiggle = sin(frameCount * 0.6 + i * 0.5) * amplitude;
        vertex(pos.x + visualWiggle, pos.y);
      }
      endShape();
    }
    
    // Only draw the head if it's on screen
    if (!this.isOffScreen) {
      fill(this.color);
      noStroke();
      ellipse(this.pos.x, this.pos.y, 8, 8);
    }
  }

  checkWin(target) {
    // Can't win if dead or off-screen
    if (!this.isAlive || this.isOffScreen) return false; 
    
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
  
  // NEW: All parameters are randomized on every run
  ENV_VIGOR = random(2.0, 5.0);
  POPULATION_DIVERSITY = random(0.1, 2.0);
  TARGET_SIZE = random(20, 80);
  ENV_IMMUNE_STRENGTH = random(0, 80); // 0% to 80% cull rate
  
  egg = new Egg(); 
  
  numSperm = floor(random(1, 501)); 
  
  sperm = [];
  if (numSperm === 1) {
     sperm.push(new Sperm(true));
  } else {
    for (let i = 0; i < numSperm - 1; i++) {
      sperm.push(new Sperm(false)); 
    }
    sperm.push(new Sperm(true)); 
  }
  
  winner = null;
  resultText = "";
  outcomeType = ""; 
  autoRestartTimer = 0;
  attempts++; 
  loop(); 
}

function draw() {
  background(0, 0, 30);
  egg.display();

  if (!winner) {
    // NEW: This checks for any sperm that can *still* win
    let anyoneAliveAndOnScreen = false; 
    
    for (let s of sperm) {
      s.move();
      s.display();

      if (s.isAlive && !s.isOffScreen) {
        anyoneAliveAndOnScreen = true; 
      }
      
      if (s.checkWin(egg)) { 
        winner = s; 
        determineOutcome(winner); 
        
        if (!winner.isYou) {
          autoRestartTimer = RESTART_DELAY;
        } else {
          loop(); 
        }
        break; 
      }
    }
    
    // NEW: This is the combined fail state
    // If no one won AND no one is left on screen, it's a failure
    if (!winner && !anyoneAliveAndOnScreen) {
      winner = { isYou: false }; // "Fake" winner to trigger fail state
      resultText = "Population lost. No survivors.";
      outcomeType = 'failure_lost'; // Custom failure type
      autoRestartTimer = RESTART_DELAY;
    }
    
  } else {
    // --- A winner has been found ---
    
    for (let s of sperm) {
      s.display(); 
    }
    
    if (outcomeType !== 'failure_lost') {
      fill(255);
      stroke(255);
      ellipse(winner.pos.x, winner.pos.y, 12, 12);
    }
    
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
      
      // --- VISUAL ANIMATION ---
      let animX = width / 2;
      let animY = height / 2 + 100;
      
      if (outcomeType === 'single') {
        fill(255, 220, 200); noStroke();
        ellipse(animX, animY, 30, 30); 
      } 
      else if (outcomeType === 'identical') {
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

    } else {
      // --- FAILURE (Auto-Restart) SCREEN ---
      autoRestartTimer--;
      if (autoRestartTimer <= 0) {
        setup(); 
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
  
  // --- Draw attempt counter and parameters ---
  fill(255);
  textSize(16);
  textAlign(RIGHT, TOP); 
  // NEW: Displaying all the randomized parameters
  let params = `Attempt: ${attempts}\n`;
  params += `Pop: ${numSperm}\n`;
  params += `Immunity: ${floor(ENV_IMMUNE_STRENGTH)}%\n`;
  params += `Vigor: ${nfs(ENV_VIGOR, 1, 1)}\n`; // nfs = format number to 1 decimal
  params += `Diversity: ${nfs(POPULATION_DIVERSITY, 1, 1)}\n`;
  params += `Target Size: ${floor(TARGET_SIZE)}`;
  text(params, width - 10, 10);
}

// This function runs when the mouse is clicked
function mousePressed() {
  if (winner && winner.isYou) {
    attempts = 0; 
    setup();      
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

  const oddsIdenticalTwins = 1 / 250;
  const oddsFraternalTwins = 1 / 80;
  const oddsTriplets = 1 / 8000; 
  let roll = random(1); 

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
