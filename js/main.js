const { Engine, Render, Runner, Bodies, Composite, Constraint, Body, Events } = Matter;

// ===== ENGINE =====

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 1;

// ===== RENDER =====

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
  const heightVariation = (Math.random() - 0.5) * 120;
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
      friction: 1,
      render: { fillStyle: "#2ecc71" }
    }
  );

  Composite.add(world, segment);
  terrainSegments.push(segment);

  terrainX += width;
  lastY = nextY;
}

// initial terrain
for (let i = 0; i < 40; i++) {
  generateTerrainSegment();
}

// ===== VEHICLE SYSTEM =====

let carBody, wheelA, wheelB;
let motorSpeed = 0;
let gameOver = false;

function createCar() {

  carBody = Bodies.rectangle(300, 300, 120, 30, {
    density: 0.003,
    friction: 0.6,
    frictionAir: 0.02
  });

  // lower centre of mass
  Body.setCentre(carBody, { x: 0, y: 15 }, true);

  wheelA = Bodies.circle(260, 330, 28, {
    friction: 1.5,
    density: 0.002
  });

  wheelB = Bodies.circle(340, 330, 28, {
    friction: 1.5,
    density: 0.002
  });

  const axelA = Constraint.create({
    bodyA: carBody,
    bodyB: wheelA,
    stiffness: 0.4,
    damping: 0.2,
    length: 35
  });

  const axelB = Constraint.create({
    bodyA: carBody,
    bodyB: wheelB,
    stiffness: 0.4,
    damping: 0.2,
    length: 35
  });

  Composite.add(world, [carBody, wheelA, wheelB, axelA, axelB]);
}

createCar();

// ===== CONTROLS =====

document.addEventListener("keydown", (e) => {
  if (gameOver) return;

  if (e.key === "ArrowRight") motorSpeed = 0.15;
  if (e.key === "ArrowLeft") motorSpeed = -0.15;
});

document.addEventListener("keyup", () => {
  motorSpeed = 0;
});

// ===== ENGINE UPDATE LOOP =====

Events.on(engine, "beforeUpdate", () => {

  if (!carBody || gameOver) return;

  // Motor torque
  Body.setAngularVelocity(wheelA, motorSpeed);
  Body.setAngularVelocity(wheelB, motorSpeed);

  // Air control
  const airborne = Math.abs(carBody.position.y - wheelA.position.y) > 50;
  if (airborne) {
    Body.setAngularVelocity(
      carBody,
      carBody.angularVelocity + motorSpeed * 0.05
    );
  }

  // Camera follow
  render.bounds.min.x = carBody.position.x - window.innerWidth / 2;
  render.bounds.max.x = carBody.position.x + window.innerWidth / 2;
  render.bounds.min.y = 0;
  render.bounds.max.y = window.innerHeight;
  Render.lookAt(render, render.bounds);
});

// ===== TERRAIN MANAGEMENT =====

Events.on(engine, "afterUpdate", () => {

  if (!carBody || gameOver) return;

  // extend terrain
  if (terrainX < carBody.position.x + 2000) {
    generateTerrainSegment();
  }

  // cleanup old terrain
  terrainSegments = terrainSegments.filter(segment => {
    if (segment.position.x < carBody.position.x - 2000) {
      Composite.remove(world, segment);
      return false;
    }
    return true;
  });

  // flip detection
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
  motorSpeed = 0;
  createCar();
}
