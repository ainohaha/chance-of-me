// --- Global Variables ---
let sperm = [];
let numSperm = 50; 
let egg;
let winner = null;
let resultText = ""; 
let outcomeType = ""; // NEW: To track the *type* of birth for animation

let attempts = 0;          
let autoRestartTimer = 0;  
const RESTART_DELAY = 90;  

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
    this.vel = createVector(0, -random(2.5, 4.5)); 
    this.noiseOffset = random(1000); 
    this.isYou = isYou;
    this.color = isYou ? color(0, 150, 255) : color(255, 50, 50, 150);
    this.history = []; 
    this.tailLength = 7; 
  }

  move() {
    let wiggle = map(noise(this.noiseOffset), 0, 1, -2, 2);
    this.pos.x += wiggle;
    this.pos.add(this.vel);
    this.noiseOffset += 0.1;
    
    this.history.push(this.pos.copy()); 
    if (this.history.length > this.tailLength) {
      this.history.splice(0, 1); 
    }
  }

  display() {
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
  sperm = [];
  for (let i = 0; i < numSperm - 1; i++) {
    sperm.push(new Sperm(false));
  }
  sperm.push(new Sperm(true));
  
  winner = null;
  resultText = "";
  outcomeType = ""; // NEW: Reset the outcome type
  autoRestartTimer = 0;
  attempts++; 
  loop(); 
}

function draw() {
  background(0, 0, 30);
  egg.display();

  if (!winner) {
    for (let s of sperm) {
      s.move();
      s.display();
      
      if (s.checkWin(egg)) {
        winner = s; 
        determineOutcome(winner); // This will set resultText AND outcomeType
        
        if (!winner.isYou) {
          autoRestartTimer = RESTART_DELAY;
        } else {
          loop(); // NEW: Keep the loop running for the animation
        }
        break; 
      }
    }
  } else {
    // --- A winner has been found ---
    
    // Keep drawing all sperm
    for (let s of sperm) {
      s.display();
    }
    
    // Highlight winner
    fill(255);
    stroke(255);
    ellipse(winner.pos.x, winner.pos.y, 12, 12);
    
    // Darken the background
    fill(0, 0, 0, 150); 
    noStroke();
    rect(0, 0, width, height);
    
    // Display the final result
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
      text("Click anywhere to reset and start over.", width / 2, height / 2 + 150); // Moved text down
      
      // --- NEW: VISUAL ANIMATION ---
      // This runs only on the 'YOU' win screen
      
      // Base position for the animation
      let animX = width / 2;
      let animY = height / 2 + 100;
      
      if (outcomeType === 'single') {
        fill(255, 220, 200);
        noStroke();
        ellipse(animX, animY, 30, 30); // Draw one embryo
      } 
      else if (outcomeType === 'identical') {
        // Draw the splitting animation
        // sin(frameCount * 0.05) makes it wobble slowly
        let wobble = map(sin(frameCount * 0.05), -1, 1, 0, 15); // 0 to 15 pixels
        
        fill(255, 220, 200);
        noStroke();
        ellipse(animX - wobble, animY, 30, 30); // Left cell
        ellipse(animX + wobble, animY, 30, 30); // Right cell
      }
      else if (outcomeType === 'fraternal') {
        // Draw two *separate* embryos
        fill(255, 220, 200);
        noStroke();
        ellipse(animX - 20, animY, 30, 30); // Embryo 1
        ellipse(animX + 20, animY, 30, 30); // Embryo 2
      }
      else if (outcomeType === 'triplets') {
         // Draw three *separate* embryos
        fill(255, 220, 200);
        noStroke();
        ellipse(animX - 30, animY, 30, 30); 
        ellipse(animX, animY, 30, 30); 
        ellipse(animX + 30, animY, 30, 30);
      }

    } else {
      // --- FAILURE (Auto-Restart) SCREEN ---
      autoRestartTimer--;
      if (autoRestartTimer <= 0) {
        setup(); // Restart the simulation
      }
      
      fill(255); 
      textSize(24);
      text(resultText, width / 2, height / 2 - 20);
      
      fill(255, 100, 100); 
      textSize(18);
      text(`Attempt ${attempts}: 'You' were not born.`, width / 2, height / 2 + 20);
      
      fill(255);
      textSize(16);
      text("Retrying automatically...", width / 2, height / 2 + 50);
    }
  }
  
  // --- Draw attempt counter in top right corner ---
  fill(255);
  textSize(16);
  textAlign(RIGHT, TOP); 
  text("Attempts: " + attempts, width - 10, 10);
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
    outcomeType = 'triplets'; // NEW
  } else if (roll < oddsTriplets + oddsIdenticalTwins) {
    resultText = baseText + "\nAnd it's IDENTICAL TWINS! 👶👶";
    outcomeType = 'identical'; // NEW
  } else if (roll < oddsTriplets + oddsIdenticalTwins + oddsFraternalTwins) {
    resultText = baseText + "\nAnd it's FRATERNAL TWINS! 👶👶";
    outcomeType = 'fraternal'; // NEW
  } else {
    resultText = baseText + "\nIt's a SINGLE BABY! 👶";
    outcomeType = 'single'; // NEW
  }
}
