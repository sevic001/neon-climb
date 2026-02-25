// ===== MONETISATION READY STRUCTURE =====

// --- STORAGE ---
let wallet = parseInt(localStorage.getItem("wallet")) || 0;
let removeAds = localStorage.getItem("removeAds") === "true";
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

function saveData() {
    localStorage.setItem("wallet", wallet);
    localStorage.setItem("removeAds", removeAds);
    localStorage.setItem("highScore", highScore);
}

// =====================================================
// ===== GAME OVER + RESTART SCREEN ====================
// =====================================================

function showGameOver(distance) {

    if (distance > highScore) {
        highScore = distance;
        saveData();
    }

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.9)";
    overlay.style.color = "white";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.fontSize = "20px";
    overlay.style.zIndex = 999;

    overlay.innerHTML = `
        <h2>Game Over</h2>
        <p>Distance: ${distance}</p>
        <p>High Score: ${highScore}</p>
        <p>Wallet: ${wallet}</p>
        <button id="restart">Restart</button>
        <button id="revive">Watch Ad to Revive</button>
        <button id="buyCoins">Buy 1000 Coins</button>
        <button id="removeAds">Remove Ads</button>
    `;

    document.body.appendChild(overlay);

    document.getElementById("restart").onclick = () => location.reload();

    document.getElementById("revive").onclick = () => {
        simulateRewardedAd(() => {
            overlay.remove();
            revivePlayer();
        });
    };

    document.getElementById("buyCoins").onclick = () => {
        wallet += 1000;
        saveData();
        alert("Coins Purchased (Simulation)");
        location.reload();
    };

    document.getElementById("removeAds").onclick = () => {
        removeAds = true;
        saveData();
        alert("Ads Removed (Simulation)");
        location.reload();
    };

    if (!removeAds) simulateInterstitialAd();
}

// =====================================================
// ===== AD SIMULATION (REPLACE WITH REAL SDK) =========
// =====================================================

function simulateRewardedAd(callback) {
    alert("Simulated Rewarded Ad Playing...");
    setTimeout(callback, 1500);
}

function simulateInterstitialAd() {
    alert("Simulated Interstitial Ad");
}

// =====================================================
// ===== REVIVE SYSTEM =================================
// =====================================================

function revivePlayer() {
    gameOver = false;
    fuel = config.fuelCapacity * 0.5;
}

// =====================================================
// ===== VEHICLE UNLOCK SYSTEM =========================
// =====================================================

const VEHICLE_UNLOCK_COST = 5000;
let unlockedMonster = localStorage.getItem("monsterUnlocked") === "true";

function unlockMonster() {

    if (!unlockedMonster && wallet >= VEHICLE_UNLOCK_COST) {
        wallet -= VEHICLE_UNLOCK_COST;
        unlockedMonster = true;
        localStorage.setItem("monsterUnlocked", "true");
        saveData();
        alert("Monster Vehicle Unlocked");
        location.reload();
    }
}
