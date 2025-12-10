const LEVEL_1_CONFIG = {
    initialSun: 2000,
    waves: [
        { time: 10000, zombies: ['normal'] },
    ]
};

class LevelManager {
    constructor(config) {
        this.config = config;
        this.waveIndex = 0;
        this.timer = 0;
        this.finished = false;
    }

    start() {
        sun = this.config.initialSun;
        const sunEl = document.getElementById('sun-count');
        if(sunEl) sunEl.textContent = sun;
        
        this.timer = 0;
        this.waveIndex = 0;
        this.finished = false;
        this.lastSpawnedEndlessWave = 0; // Reset endless wave counter
        console.log("Level started! Initial sun:", sun);
    }

    update(dt) {
        // Check if endless mode is enabled
        const isEndless = localStorage.getItem('pvz_selected_mode') === 'endless';
        
        this.timer += dt;

        if (this.waveIndex < this.config.waves.length) {
            const nextWave = this.config.waves[this.waveIndex];
            if (this.timer >= nextWave.time) {
                this.spawnWave(nextWave.zombies);
                this.waveIndex++;
            }
        } else if (isEndless) {
            // Endless mode: spawn a random wave every 15 seconds
            // Base time is the time of the last configured wave
            const lastWaveTime = this.config.waves.length > 0 ? this.config.waves[this.config.waves.length - 1].time : 0;
            const endlessTime = this.timer - lastWaveTime;
            
            // Calculate which endless wave number we are on (1-based)
            // First endless wave at 15s after last wave
            const endlessWaveInterval = 15000; 
            const currentEndlessWave = Math.floor(endlessTime / endlessWaveInterval);
            
            // We use a property to track if we already spawned this endless wave
            if (!this.lastSpawnedEndlessWave) this.lastSpawnedEndlessWave = 0;

            if (currentEndlessWave > this.lastSpawnedEndlessWave) {
                this.lastSpawnedEndlessWave = currentEndlessWave;
                this.spawnEndlessWave(currentEndlessWave);
            }
        }
    }

    spawnEndlessWave(difficultyLevel) {
        console.log(`Spawning Endless Wave ${difficultyLevel}`);
        const zombies = [];
        
        // Base count increases with difficulty
        const count = 1 + difficultyLevel * 2;
        
        // Probability of stronger zombies increases
        
        for(let i=0; i<count; i++) {
            const r = Math.random();
            let type = 'normal';

            if (difficultyLevel >= 20) {
                if (r < 0.1) type = 'football_forward';
                else if (r < 0.2) type = 'fisher';
                else if (r < 0.3) type = 'gargantuar';
                else if (r < 0.5) type = 'football';
                else if (r < 0.6) type = 'exploder';
                else if (r < 0.7) type = 'priest';
                else type = 'bucket';
            } else if (difficultyLevel >= 15) {
                if (r < 0.05) type = 'football_forward';
                else if (r < 0.1) type = 'fisher';
                else if (r < 0.15) type = 'gargantuar';
                else if (r < 0.25) type = 'football';
                else if (r < 0.4) type = 'exploder';
                else if (r < 0.6) type = 'bucket';
                else if (r < 0.7) type = 'priest';
                else type = 'normal';
            } else if (difficultyLevel >= 10) {
                if (r < 0.1) type = 'football';
                else if (r < 0.3) type = 'exploder';
                else if (r < 0.4) type = 'bucket';
                else type = 'normal';
            } else if (difficultyLevel >= 5) {
                if (r < 0.3) type = 'exploder';
                else if (r < 0.4) type = 'bucket';
                else type = 'normal';
            } else {
                type = 'normal';
            }
            
            zombies.push(type);
        }
        
        this.spawnWave(zombies);
    }

    spawnWave(zombieTypes) {
        // Check if spawnZombie is defined (it's in game.js)
        if (typeof spawnZombie !== 'function') {
            console.error("spawnZombie function not found!");
            return;
        }

        console.log("Wave incoming:", zombieTypes);
        zombieTypes.forEach((type, index) => {
            // Delay each zombie in the wave slightly
            setTimeout(() => {
                spawnZombie(null, type);
            }, index * 1000 + Math.random() * 500);
        });
    }
}

// Read selected map/mode from setup page
const _selectedMap = localStorage.getItem('pvz_selected_map') || 'level1';
const _selectedMode = localStorage.getItem('pvz_selected_mode') || 'normal';

let chosenConfig = LEVEL_1_CONFIG;
if(_selectedMap === 'endless'){
    // a minimal endless config
    chosenConfig = { initialSun: 2000, waves: [{}] };
}

const levelManager = new LevelManager(chosenConfig);
levelManager.difficulty = _selectedMode;
