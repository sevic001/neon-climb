// ===== ENGINE SETUP =====
const { Engine, World, Bodies, Body, Constraint, Events, Render, Runner } = Matter;

const engine = Engine.create();
const world = engine.world;
world.gravity.y = 1;

const render = Render.create({
    element: document.body,
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

// =====================================================
// ===== VEHICLE BASE CONFIG ===========================
// =====================================================

const VEHICLES = {
    buggy: {
        mass: 40,
        wheelSize: 25,
        torque: 0.0008,
        suspensionStiffness: 0.4,
        suspensionDamping: 0.2,
        fuelCapacity: 100,
        fuelConsumption: 0.05,
        color: "#00ffcc"
    }
};

let selectedVehicle = "buggy";
let baseConfig = VEHICLES[selectedVehicle];

// =====================================================
// ===== UPGRADE SYSTEM ================================
// =====================================================

const DEFAULT_UPGRADES = {
    engine: 0,
    suspension: 0,
    fuel: 0
};

let upgrades = JSON.parse(localStorage.getItem("upgrades")) || DEFAULT_UPGRADES;

function saveUpgrades() {
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
}

function applyUpgrades(base) {

    return {
        ...base,
        torque: base.torque * (1 + upgrades.engine * 0.2),
        suspensionStiffness: base.suspensionStiffness * (1 + upgrades.suspension * 0.15),
        suspensionDamping: base.suspensionDamping * (1 + upgrades.suspension * 0.15),
        fuelCapacity: base.fuelCapacity * (1 + upgrades.fuel * 0.25)
    };
}

let config = applyUpgrades(baseConfig);
let fuel = config.fuelCapacity;
let gameOver = false;

// =====================================================
// ===== TERRAIN =======================================
// =====================================================

let lastX = 0;
let lastY = window.innerHeight - 100;

for (let i = 0; i < 200; i++) {
    const width = 200;
    const newY = lastY + (Math.random() - 0.5) * 150;

    const segment = Bodies.rectangle(
        lastX + width / 2,
        (lastY + newY) / 2,
        width,
        50,
        {
            isStatic: true,
            angle: Math.atan2(newY - lastY, width),
            render: { fillStyle: "#333" }
        }
    );

    World.add(world, segment);
    lastX += width;
    lastY = newY;
}

// =====================================================
// ===== VEHICLE CREATION ==============================
// =====================================================

function createVehicle(x, y) {

    const chassis = Bodies.rectangle(x, y, 120, 30, {
        density: config.mass / 1000,
        frictionAir: 0.03,
        render: { fillStyle: config.color }
    });

    const wheelA = Bodies.circle(x - 40, y + 30, config.wheelSize, {
        friction: 0.9
    });

    const wheelB = Bodies.circle(x + 40, y + 30, config.wheelSize, {
        friction: 0.9
    });

    const axelA = Constraint.create({
        bodyA: chassis,
        pointA: { x: -40, y: 15 },
        bodyB: wheelA,
        stiffness: config.suspensionStiffness,
        damping: config.suspensionDamping,
        length: 30
    });

    const axelB = Constraint.create({
        bodyA: chassis,
        pointA: { x: 40, y: 15 },
        bodyB: wheelB,
        stiffness: config.suspensionStiffness,
        damping: config.suspensionDamping,
        length: 30
    });

    World.add(world, [chassis, wheelA, wheelB, axelA, axelB]);

    return { chassis, wheelA, wheelB };
}

const vehicle = createVehicle(300, 200);

// =====================================================
// ===== ENGINE LOGIC ==================================
// =====================================================

function getTorque(speed) {
    const optimalSpeed = 10;
    if (speed < optimalSpeed) return config.torque;
    return config.torque * (optimalSpeed / speed);
}

let accelerating = false;

window.addEventListener("keydown", e => {
    if (e.code === "ArrowRight") accelerating = true;
});

window.addEventListener("keyup", e => {
    if (e.code === "ArrowRight") accelerating = false;
});

Events.on(engine, "beforeUpdate", () => {

    if (gameOver) return;

    if (accelerating && fuel > 0) {

        const speed = Math.abs(vehicle.wheelA.angularVelocity);
        const torque = getTorque(speed);

        Body.setAngularVelocity(vehicle.wheelA, vehicle.wheelA.angularVelocity + torque);
        Body.setAngularVelocity(vehicle.wheelB, vehicle.wheelB.angularVelocity + torque);

        fuel -= baseConfig.fuelConsumption;
    }

    if (Math.abs(vehicle.chassis.angle) > 1.6) gameOver = true;
    if (fuel <= 0) gameOver = true;

    render.bounds.min.x = vehicle.chassis.position.x - window.innerWidth / 2;
    render.bounds.max.x = vehicle.chassis.position.x + window.innerWidth / 2;

    Render.lookAt(render, {
        min: render.bounds.min,
        max: render.bounds.max
    });
});

// =====================================================
// ===== SIMPLE UPGRADE CONTROLS (TESTING) =============
// =====================================================

window.addEventListener("keypress", e => {

    if (e.key === "1") upgrades.engine++;
    if (e.key === "2") upgrades.suspension++;
    if (e.key === "3") upgrades.fuel++;

    saveUpgrades();
    location.reload();
});
