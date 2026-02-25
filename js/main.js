// ===== ENGINE SETUP =====
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Constraint = Matter.Constraint;
const Events = Matter.Events;

const engine = Engine.create();
const world = engine.world;
world.gravity.y = 1;

// ===== RENDER =====
const render = Matter.Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: "#111"
    }
});
Matter.Render.run(render);
const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);

// ===== GROUND =====
const ground = Bodies.rectangle(0, window.innerHeight - 50, 50000, 100, {
    isStatic: true,
    render: { fillStyle: "#333" }
});
World.add(world, ground);

// ===== VEHICLE PARAMETERS =====
const vehicleConfig = {
    mass: 40,
    wheelFriction: 0.9,
    suspensionStiffness: 0.4,
    suspensionDamping: 0.2,
    suspensionLength: 30,
    maxFuel: 100,
    fuelConsumption: 0.05
};

let fuel = vehicleConfig.maxFuel;

// ===== CHASSIS =====
const chassis = Bodies.rectangle(300, 300, 120, 30, {
    density: vehicleConfig.mass / 1000,
    frictionAir: 0.03,
    render: { fillStyle: "#00ffcc" }
});

// ===== WHEELS =====
const wheelA = Bodies.circle(260, 330, 25, {
    friction: vehicleConfig.wheelFriction,
    restitution: 0.2,
    render: { fillStyle: "#fff" }
});

const wheelB = Bodies.circle(340, 330, 25, {
    friction: vehicleConfig.wheelFriction,
    restitution: 0.2,
    render: { fillStyle: "#fff" }
});

// ===== SUSPENSION =====
const axelA = Constraint.create({
    bodyA: chassis,
    pointA: { x: -40, y: 15 },
    bodyB: wheelA,
    stiffness: vehicleConfig.suspensionStiffness,
    damping: vehicleConfig.suspensionDamping,
    length: vehicleConfig.suspensionLength
});

const axelB = Constraint.create({
    bodyA: chassis,
    pointA: { x: 40, y: 15 },
    bodyB: wheelB,
    stiffness: vehicleConfig.suspensionStiffness,
    damping: vehicleConfig.suspensionDamping,
    length: vehicleConfig.suspensionLength
});

World.add(world, [chassis, wheelA, wheelB, axelA, axelB]);

// ===== ENGINE TORQUE CURVE =====
function getTorque(speed) {
    const maxTorque = 0.0008;
    const optimalSpeed = 10;

    if (speed < optimalSpeed) {
        return maxTorque;
    } else {
        return maxTorque * (optimalSpeed / speed);
    }
}

// ===== CONTROLS =====
let accelerating = false;

window.addEventListener("keydown", e => {
    if (e.code === "ArrowRight") accelerating = true;
});

window.addEventListener("keyup", e => {
    if (e.code === "ArrowRight") accelerating = false;
});

// ===== UPDATE LOOP =====
Events.on(engine, "beforeUpdate", () => {

    if (accelerating && fuel > 0) {

        const speed = Math.abs(wheelA.angularVelocity);
        const torque = getTorque(speed);

        Body.setAngularVelocity(wheelA, wheelA.angularVelocity + torque);
        Body.setAngularVelocity(wheelB, wheelB.angularVelocity + torque);

        fuel -= vehicleConfig.fuelConsumption;
    }

    // Prevent over-rotation (stability assist)
    if (Math.abs(chassis.angle) > 1.2) {
        Body.setAngularVelocity(chassis, 0);
    }
});
