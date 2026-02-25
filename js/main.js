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

// ===== GAME STATE =====
let terrainSegments = [];
let terrainX = 0;
let lastY = window.innerHeight - 200;

let carBody, wheelA, wheelB;
let motorSpeed = 0;
let gameOver = false;

let fuel = 100;
let maxFuel = 100;
let fuelPickups = [];

// ===== TERRAIN =====
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

  // randomly spawn fuel
  if (Math.random() < 0.25) {
    const fuelItem = Bodies.circle(
      terrainX + width / 2,
      nextY - 80,
      15,
      {
        isSensor: true,
        isStatic: true,
        render: { fillStyle: "#f1c40f" }
      }
    );
    Composite.add(world, fuelItem);
    fuelPickups.push(fuelItem);
  }

  terrainX += width;
  lastY = nextY;
}

for (let i = 0; i < 40; i++) {
  generateTerrainSegment();
}

// ===== VEHICLE =====
function createCar() {

  carBody = Bodies.rectangle(300, 300, 120, 30, {
    density: 0.003,
    frictionAir: 0.02
  });

  Body.setCentre(carBody, { x: 0, y: 15 }, true);

  wheelA = Bodies.circle(260, 330, 28, { friction: 1.5 });
  wheelB = Bodies.circle(340, 330, 28, { friction: 1.5 });

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

// ===== COLLISION (Fuel Pickup) =====
Events.on(engine, "collisionStart", (event) => {

  event.pairs.forEach(pair => {

    fuelPickups.forEach((fuelItem, index) => {

      if (
        pair.bodyA === fuelItem && pair.bodyB === carBody ||
        pair.bodyB === fuelItem && pair.bodyA === carBody
      ) {
        fuel = Math.min(maxFuel, fuel + 30);
        Composite.remove(world, fuelItem);
        fuelPickups.splice(index, 1);
      }

    });

  });

});

// ===== UPDATE LOOP =====
Events.on(engine, "beforeUpdate", () => {

  if (!carBody || gameOver) return;

  Body.setAngularVelocity(wheelA, motorSpeed);
  Body.setAngularVelocity(wheelB, motorSpeed);

  const airborne = Math.abs(carBody.position.y - wheelA.position.y) > 50;
  if (airborne) {
    Body.setAngularVelocity(
      carBody,
      carBody.angularVelocity + motorSpeed * 0.05
    );
  }

  // fuel drain
  fuel -= 0.05;
  if (fuel <= 0) {
    fuel = 0;
    gameOver = true;
    setTimeout(resetGame, 1500);
  }

  // camera follow
  render.bounds.min.x = carBody.position.x - window.innerWidth / 2;
  render.bounds.max.x = carBody.position.x + window.innerWidth / 2;
  render.bounds.min.y = 0;
  render.bounds.max.y = window.innerHeight;
  Render.lookAt(render, render.bounds);
});

// ===== TERRAIN MANAGEMENT =====
Events.on(engine, "afterUpdate", () => {

  if (!carBody || gameOver) return;

  if (terrainX < carBody.position.x + 2000) {
    generateTerrainSegment();
  }

  terrainSegments = terrainSegments.filter(segment => {
    if (segment.position.x < carBody.position.x - 2000) {
      Composite.remove(world, segment);
      return false;
    }
    return true;
  });

  if (Math.abs(carBody.angle) > Math.PI / 2) {
    gameOver = true;
    setTimeout(resetGame, 1500);
  }
});

// ===== FUEL BAR UI =====
const ctx = render.context;

Events.on(render, "afterRender", () => {

  ctx.fillStyle = "white";
  ctx.fillText("Fuel", 20, 30);

  ctx.fillStyle = "red";
  ctx.fillRect(70, 15, 200, 20);

  ctx.fillStyle = "lime";
  ctx.fillRect(70, 15, 200 * (fuel / maxFuel), 20);
});

// ===== RESET =====
function resetGame() {

  Composite.clear(world, false);

  terrainSegments = [];
  fuelPickups = [];
  terrainX = 0;
  lastY = window.innerHeight - 200;

  fuel = maxFuel;
  motorSpeed = 0;
  gameOver = false;

  for (let i = 0; i < 40; i++) {
    generateTerrainSegment();
  }

  createCar();
}
