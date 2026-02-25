const { Engine, Render, Runner, Bodies, Composite, Constraint, Body } = Matter;

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

// Ground
const ground = Bodies.rectangle(
  window.innerWidth / 2,
  window.innerHeight - 50,
  window.innerWidth,
  100,
  { isStatic: true }
);

Composite.add(world, ground);

// ===== VEHICLE =====

// Car body
const carBody = Bodies.rectangle(300, 300, 100, 30, {
  density: 0.002
});

// Wheels
const wheelA = Bodies.circle(260, 330, 25, {
  friction: 1,
  restitution: 0.2
});

const wheelB = Bodies.circle(340, 330, 25, {
  friction: 1,
  restitution: 0.2
});

// Suspension constraints
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

// ===== CONTROLS =====

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    Body.applyForce(wheelA, wheelA.position, { x: 0.02, y: 0 });
    Body.applyForce(wheelB, wheelB.position, { x: 0.02, y: 0 });
  }

  if (e.key === "ArrowLeft") {
    Body.applyForce(wheelA, wheelA.position, { x: -0.02, y: 0 });
    Body.applyForce(wheelB, wheelB.position, { x: -0.02, y: 0 });
  }
});
