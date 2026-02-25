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

const ctx = render.context;

// ===== SAVE DATA =====
let save = JSON.parse(localStorage.getItem("hillSave")) || {
  coins: 0,
  bestDistance: 0,
  upgrades: {
    engine: 1,
    fuel: 1,
    grip: 1
  }
};

function saveGame() {
  localStorage.setItem("hillSave", JSON.stringify(save));
}

// ===== GAME STATE =====
let terrainSegments = [];
let terrainX = 0;
let lastY = window.innerHeight - 200;

let carBody, wheelA, wheelB;
let motorSpeed = 0;
let gameOver = false;

let fuel, maxFuel;
let fuelPickups = [];
let coinPickups = [];
let distance = 0;

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
      friction: 1
    }
  );

  Composite.add(world, segment);
  terrainSegments.push(segment);

  // Fuel spawn
  if (Math.random() < 0.2) {
    const fuelItem = Bodies.circle(terrainX + width / 2, nextY - 80, 15, {
      isSensor: true,
      isStatic: true,
      render: { fillStyle: "yellow" }
    });
    Composite.add(world, fuelItem);
    fuelPickups.push(fuelItem);
  }

  // Coin spawn
  if (Math.random() < 0.3) {
    const coin = Bodies.circle(terrainX + width / 2, nextY - 120, 10, {
      isSensor: true,
      isStatic: true,
      render: { fillStyle: "gold" }
    });
    Composite.add(world, coin);
    coinPickups.push(coin);
  }

  terrainX += width;
  lastY = nextY;
}

for (let i = 0; i < 40; i++) generateTerrainSegment();

// ===== VEHICLE =====
function createCar() {

  const enginePower = 0.15 * save.upgrades.engine;
  maxFuel = 100 * save.upgrades.fuel;
  fuel = maxFuel;

  carBody = Bodies.rectangle(300, 300, 120, 30, {
    density: 0.003,
    frictionAir: 0.02
  });

  Body.setCentre(carBody, { x: 0, y: 15 }, true);

  wheelA = Bodies.circle(260, 330, 28, {
    friction: 1.5 * save.upgrades.grip
  });

  wheelB = Bodies.circle(340, 330, 28, {
    friction: 1.5 * save.upgrades.grip
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

  return enginePower;
}

let enginePower = createCar();

// ===== CONTROLS =====
document.addEventListener("keydown", (e) => {
  if (gameOver) return;
  if (e.key === "ArrowRight") motorSpeed = enginePower;
  if (e.key === "ArrowLeft") motorSpeed = -enginePower;
});

document.addEventListener("keyup", () => motorSpeed = 0);

// ===== COLLISIONS =====
Events.on(engine, "collisionStart", (event) => {

  event.pairs.forEach(pair => {

    fuelPickups.forEach((item, i) => {
      if (pair.bodyA === item || pair.bodyB === item) {
        fuel = Math.min(maxFuel, fuel + 30);
        Composite.remove(world, item);
        fuelPickups.splice(i, 1);
      }
    });

    coinPickups.forEach((coin, i) => {
      if (pair.bodyA === coin || pair.bodyB === coin) {
        save.coins += 5;
        Composite.remove(world, coin);
        coinPickups.splice(i, 1);
      }
    });

  });

});

// ===== UPDATE LOOP =====
Events.on(engine, "beforeUpdate", () => {

  if (!carBody || gameOver) return;

  Body.setAngularVelocity(wheelA, motorSpeed);
  Body.setAngularVelocity(wheelB, motorSpeed);

  fuel -= 0.05;
  if (fuel <= 0) endGame();

  distance = Math.floor(carBody.position.x / 10);
});

// ===== CAMERA + TERRAIN =====
Events.on(engine, "afterUpdate", () => {

  if (!carBody || gameOver) return;

  if (terrainX < carBody.position.x + 2000)
    generateTerrainSegment();

  render.bounds.min.x = carBody.position.x - window.innerWidth / 2;
  render.bounds.max.x = carBody.position.x + window.innerWidth / 2;
  Render.lookAt(render, render.bounds);

  if (Math.abs(carBody.angle) > Math.PI / 2)
    endGame();
});

// ===== UI =====
Events.on(render, "afterRender", () => {

  ctx.fillStyle = "white";
  ctx.fillText("Fuel", 20, 30);
  ctx.fillRect(70, 15, 200 * (fuel / maxFuel), 15);

  ctx.fillText("Coins: " + save.coins, 20, 60);
  ctx.fillText("Distance: " + distance, 20, 90);
  ctx.fillText("Best: " + save.bestDistance, 20, 120);

  if (gameOver) {
    ctx.fillText("Press U to Upgrade", 20, 150);
  }
});

// ===== END GAME =====
function endGame() {
  gameOver = true;

  if (distance > save.bestDistance)
    save.bestDistance = distance;

  saveGame();
}

// ===== UPGRADE SYSTEM =====
document.addEventListener("keydown", (e) => {

  if (!gameOver) return;

  if (e.key === "u" || e.key === "U") {

    const cost = 100 * save.upgrades.engine;

    if (save.coins >= cost) {
      save.coins -= cost;
      save.upgrades.engine += 0.2;
      save.upgrades.fuel += 0.1;
      save.upgrades.grip += 0.1;
      saveGame();
      resetGame();
    }
  }
});

// ===== RESET =====
function resetGame() {

  Composite.clear(world, false);

  terrainSegments = [];
  fuelPickups = [];
  coinPickups = [];
  terrainX = 0;
  lastY = window.innerHeight - 200;

  for (let i = 0; i < 40; i++) generateTerrainSegment();

  gameOver = false;
  motorSpeed = 0;

  enginePower = createCar();
}
