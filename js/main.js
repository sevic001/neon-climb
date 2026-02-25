const { Engine, Render, Runner, Bodies, Composite, Constraint, Body, Events } = Matter;

// Engine
const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 1;

// Renderer
const render = Render.create({
  element: document.body,
  canvas: document.getElementById("game"),
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "#111"
  }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// ===== TERRAIN SYSTEM =====

let terrainSegments = [];
let terrainX = 0;
let lastY = window.innerHeight - 200;

function generateTerrainSegment() {

  const width = 200;
  const heightVariation = (Math.random() - 0.5) * 150;
  const nextY = lastY + heightVariation;

  const angle = Math.atan2(nextY - lastY, width);

  const segment = Bodies.rectangle(
    terrainX + width / 2,
    (lastY + nextY) / 2,
    width,
    40,
    {
      isStatic: true,
      angle: angle,
      render: { fillStyle: "#2ecc71" }
    }
  );

  Composite.add(world, segment);
  terrainSegments.push(segment);

  terrainX += width;
  lastY = nextY;
}

// Generate initial terrain
for (let i = 0; i < 40; i++) {
  generateTerrainSegment();
}

// ===== VEHICLE =====

let carBody, wheelA, wheelB;

function createCar() {

  carBody = Bodies.rectangle(300, 300, 100, 30, {
    density: 0.002
  });

  wheelA = Bodies.circle(260, 330, 25, { friction: 1 });
  wheelB = Bodies.circle(340, 330, 25, { friction: 1 });

  const axelA = Constraint.create({
    bodyA: carBody,
    bodyB: wheelA,
    stiffness: 0.6,
    length: 30
  });

  const axelB = Constraint.create({
    bodyA: carBody,
    bodyB: wheelB,
    stiffness: 0.6,
    length: 30
  });

  Composite.add(world, [carBody, wheelA, wheelB, axelA, axelB]);
}

createCar();

// ===== CONTROLS =====

document.addEventListener("keydown", (e) => {
  if (!carBody) return;

  if (e.key === "ArrowRight") {
    Body.applyForce(wheelA, wheelA.position, { x: 0.02, y: 0 });
    Body.applyForce(wheelB, wheelB.position, { x: 0.02, y: 0 });
  }

  if (e.key === "ArrowLeft") {
    Body.applyForce(wheelA, wheelA.position, { x: -0.02, y: 0 });
    Body.applyForce(wheelB, wheelB.position, { x: -0.02, y: 0 });
  }
});

// ===== CAMERA FOLLOW =====

Events.on(engine, "beforeUpdate", () => {

  if (!carBody) return;

  render.bounds.min.x = carBody.position.x - window.innerWidth / 2;
  render.bounds.max.x = carBody.position.x + window.innerWidth / 2;

  render.bounds.min.y = 0;
  render.bounds.max.y = window.innerHeight;

  Render.lookAt(render, render.bounds);
});

// ===== TERRAIN EXTENSION & CLEANUP =====

Events.on(engine, "afterUpdate", () => {

  if (!carBody) return;

  // Generate more terrain ahead
  if (terrainX < carBody.position.x + 2000) {
    generateTerrainSegment();
  }

  // Remove old terrain behind
  terrainSegments = terrainSegments.filter(segment => {
    if (segment.position.x < carBody.position.x - 2000) {
      Composite.remove(world, segment);
      return false;
    }
    return true;
  });
});

// ===== FLIP DETECTION =====

let gameOver = false;

Events.on(engine, "afterUpdate", () => {
  if (!carBody || gameOver) return;

  if (Math.abs(carBody.angle) > Math.PI / 2) {
    gameOver = true;
    setTimeout(resetGame, 1500);
  }
});

// ===== RESET =====

function resetGame() {
  Composite.clear(world, false);
  terrainSegments = [];
  terrainX = 0;
  lastY = window.innerHeight - 200;

  for (let i = 0; i < 40; i++) {
    generateTerrainSegment();
  }

  gameOver = false;
  createCar();
}
