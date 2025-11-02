//Chance of Life Simulator//

This is a p5.js sketch that simulates the biological "race" for fertilization, modeled as an agent-based system. It visualizes the high-stakes, probabilistic nature of life by focusing on a single "blue" agent (representing "you") competing against a large, randomized population of "red" agents.

The simulation runs continuously, creating new attempts with randomized environmental parameters. It demonstrates how factors like population size, immune system strength, and agent "vigor" create a complex system where the odds of a specific agent succeeding are incredibly low.

The simulation only stops when the "blue" agent wins, logging the total number of attempts it took for "you" to be born.

Core Concepts Simulated

Natural System: Models the human fertilization process as a complex biological system.

Agent-Based Simulation: The system is composed of two types of agents:

Sperm: Active agents with individual properties (speed, viability, path) that compete.

Egg: A passive agent that acts as the target.

Environmental Forces: The environment exerts pressure on all agents. These parameters are randomized on every attempt:

Immune Strength: A global percentage (0-100%) that determines the chance for any agent to be non-viable ("culled") from the start.

Population: The total number of agents, randomized from 1 to 500.

Vigor: Affects the average speed and "wiggle" intensity of the entire population.

Diversity: Controls the range of speeds (high diversity = some super-fast, some very slow).

Target Size: The size of the Egg agent.

Probabilistic Outcomes: Even after a successful "win" by the blue sperm, a final probabilistic model runs to determine the birth outcome (Single, Identical Twins, Fraternal Twins, etc.), based on real-world odds.


//Features//

Continuous Attempts: The simulation automatically restarts after every failure (a "red" sperm wins or the population is lost), logging the results to the console.

Success State: The simulation only pauses when the "blue" (you) sperm wins, displaying the total number of attempts.

Dynamic Agents: Each Sperm agent uses Perlin noise (noise()) for organic, non-linear movement.

Agent State: Agents have multiple states: isAlive, isOffScreen, and isYou.

Vector-Based Physics: Agent position (pos) and velocity (vel) are handled using p5.Vector objects.

Interactive Control: The "Immune Strength" parameter can be set by the user via an HTML slider, allowing direct influence over one of the key environmental factors for all subsequent attempts.


//How to Run//

Open the index.html file in a browser, or run the chance_of_life.js sketch in a p5.js environment (like the p5.js Web Editor).

Adjust the "Immune Strength" slider in the top-left to your desired level (this value is read at the start of each new attempt).

Open the browser's console (Press F12) to see a detailed log of the parameters for each attempt and the final result.

Watch the simulation. It will run automatically until the blue sperm wins.

When the success screen appears, click the mouse to reset the attempt counter and start the entire process over.
