// --- Evolutionary Parameters ---
let genePool = {
  avgSpeed: 3.0,
  avgAgility: 1.5
};
let MUTATION_RATE = 0.3; // How much genes can change
let numSperm = 200;
let numEggs = 5; // More eggs = faster evolution

// --- Global Variables ---
let sperm = [];
let eggs = []; 
let winners = []; 
let generationCounter = 0;
let raceOver = false;

// --- The 'Egg' Object ---
class Egg {
  constructor(xPos) { 
    this.pos = createVector(xPos, 80);
    this.size = 35; 
    this.isFertilized = false; 
    this.winner = null; 
  }
  display() {
    noStroke();
    if (this.isFertilized) {
      fill(255, 255, 100, 100);
      ellipse(this.pos.x, this.pos.y, this.size + 10);
      fill(255, 255, 200);
    } else {
      fill(255, 200, 150, 50);
      ellipse(this.pos.x, this.pos.y, this.size + 20);
      fill(255, 220, 200);
    }
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}

// --- The 'Sperm' Object (now with genes) ---
class Sperm {
  constructor() {
    this.pos = createVector(random(width), height - 20);
    
    // --- NEW: Inherit from Gene Pool + Mutate ---
    let speedMutation = random(-MUTATION_RATE, MUTATION_RATE);
    let agilityMutation = random(-MUTATION_RATE, MUTATION_RATE);
    
    this.gene_speed = genePool.avgSpeed + speedMutation;
    this.gene_agility = genePool.avgAgility + agilityMutation;
    
    // Make sure genes don't go negative
    if (this.gene_speed < 0.5) this.gene_speed = 0.5;
    if (this.gene_agility < 0.1) this.gene_agility = 0.1;

    this.vel = createVector(0, -this.gene_speed); 
    this.noiseOffset = random(1000); 
    
    // Color is based on speed (dim red = slow, bright red = fast)
    let r = map(this.gene_speed, 1, 6, 100, 255, true);
    this.color = color(r, 50, 50, 150);
    
    this.history = []; 
    this.tailLength = 7; 
    this.isOffScreen = false;
    this.hasWon = false; 
  }

  move() {
    if (this.isOffScreen || this.hasWon) return; 
    
    // Wiggle is now based on its agility gene
    let wiggle = map(noise(this.noiseOffset), 0, 1, -this.gene_agility, this.gene_agility);
    
    this.pos.x += wiggle;
    this.pos.add(this.vel);
    this.noiseOffset += 0.1;
    
    if (this.pos.y < -20 || this.pos.x < -20 || this.pos.x > width + 20) {
      this.isOffScreen = true;
    }
    
    this.history.push(this.pos.copy()); 
    if (this.history.length > this.tailLength) {
      this.history.splice(0, 1); 
    }
  }

  display() {
    if (!this.isOffScreen) {
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
  }

  checkWin(eggArray) {
    if (this.hasWon || this.isOffScreen) return; 

    for (let e of eggArray) {
      if (!e.isFertilized) {
        let d = dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y);
        if (d < e.size / 2) {
          e.isFertilized = true; 
          e.winner = this;      // Store this sperm as the winner
          this.hasWon = true;   
          winners.push(this);   
          break; 
        }
      }
    }
  }
}

// --- Main p5.js Functions ---

function setup() {
  createCanvas(600, 600);
  // Start the first generation
  createNextGeneration(true);
}

// NEW: This is the core of the evolution
function createNextGeneration(isFirstGeneration = false) {
  
  if (isFirstGeneration) {
    genePool = { avgSpeed: 3.0, avgAgility: 1.5 };
    generationCounter = 1;
  } else {
    // --- 1. Calculate the new gene pool from winners ---
    if (winners.length > 0) {
      let totalSpeed = 0;
      let totalAgility = 0;
      for (let w of winners) {
        totalSpeed += w.gene_speed;
        totalAgility += w.gene_agility;
      }
      
      // Get the average
      genePool.avgSpeed = totalSpeed / winners.length;
      genePool.avgAgility = totalAgility / winners.length;
      
    } else {
      // If no one won (population wipeout), the genes were bad. Reset.
      genePool = { avgSpeed: 3.0, avgAgility: 1.5 };
    }
    generationCounter++;
  }

  // --- 2. Reset the environment ---
  eggs = [];
  let eggSpacing = width / (numEggs + 1);
  for (let i = 1; i <= numEggs; i++) {
    eggs.push(new Egg(i * eggSpacing));
  }
  
  // --- 3. Spawn the new generation ---
  sperm = [];
  winners = [];
  for (let i = 0; i < numSperm; i++) {
    sperm.push(new Sperm()); // New sperm will inherit from the new genePool
  }
  
  raceOver = false;
  loop(); // Start the race
}

function draw() {
  background(0, 0, 30);
  
  // Draw eggs
  for (let e of eggs) {
    e.display();
  }

  if (!raceOver) {
    let anyoneAlive = false; 
    
    for (let s of sperm) {
      s.move();
      s.display();

      if (!s.isOffScreen) {
        anyoneAlive = true; 
        if (!s.hasWon) {
          s.checkWin(eggs); 
        }
      }
    }
    
    // Check for end conditions
    if (winners.length === eggs.length || !anyoneAlive) {
      raceOver = true; // Stop the race
      noLoop(); // Pause p5
    }
    
  } else {
    // --- The race is over, show results ---
    
    // Keep drawing sperm
    for (let s of sperm) {
      s.display(); 
    }
    
    // Darken background
    fill(0, 0, 0, 150); 
    noStroke();
    rect(0, 0, width, height);
    
    // Display stats
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(24);
    text(`Generation ${generationCounter} Finished`, width / 2, height / 2 - 80);
    
    fill(0, 255, 0);
    textSize(20);
    text(`Success Rate: ${winners.length} / ${numEggs} eggs`, width / 2, height / 2 - 40);
    
    fill(255);
    textSize(18);
    text(`Avg. Winner Speed: ${nfs(genePool.avgSpeed, 1, 2)}`, width / 2, height / 2 + 0);
    text(`Avg. Winner Agility: ${nfs(genePool.avgAgility, 1, 2)}`, width / 2, height / 2 + 30);

    textSize(16);
    text("Click to start the next generation.", width / 2, height / 2 + 80);
  }
  
  // Display stats in corner
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP); 
  text(`Generation: ${generationCounter}`, 10, 10);
  text(`Avg Speed: ${nfs(genePool.avgSpeed, 1, 2)}`, 10, 30);
  text(`Avg Agility: ${nfs(genePool.avgAgility, 1, 2)}`, 10, 50);
}

function mousePressed() {
  if (raceOver) {
    // If the race is over, clicking starts the next generation
    createNextGeneration();
  }
}
