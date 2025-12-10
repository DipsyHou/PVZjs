const TERRAIN = {
    GRASS: 0,
    WATER: 1,
    DIRT: 2,
    HOLE: 3,
    OBSTACLE: 4 // 石墩子
};

let terrainGrid = Array.from({length: ROWS}, () => Array(COLS).fill(TERRAIN.GRASS));

function initTerrain(mapType) {
    // Reset to grass
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            terrainGrid[r][c] = TERRAIN.GRASS;
        }
    }

    if (mapType === 'park_1' || mapType === 'park_2' || mapType === 'park_3' || mapType === 'park_4') {
        // Generate random obstacles
        let targetCount = 5;
        if(mapType === 'park_2') targetCount = 15;
        if(mapType === 'park_3') targetCount = 25;
        if(mapType === 'park_4') targetCount = 45;
        
        let count = 0;
        while(count < targetCount) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);

            if (terrainGrid[r][c] === TERRAIN.GRASS) {
                terrainGrid[r][c] = TERRAIN.OBSTACLE;
                count++;
            }
        }
    }
}
