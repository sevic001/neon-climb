const { Engine, Render, Runner, Bodies, Composite } = Matter;

// Create engine
const engine = Engine.create();
const world = engine.world;

// Create renderer
const render = Render.create({
  element: document.body,
  engine: engine,
  canvas: document.getElementById("game"),
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "#111"
  }
});

// Run engine
Render.run(render);
Runner.run(Runner.create(), engine);

// Basic flat ground
const ground = Bodies.rectangle(
  window.innerWidth / 2,
  window.innerHeight - 50,
  window.innerWidth,
  100,
  { isStatic: true }
);

Composite.add(world, ground);
