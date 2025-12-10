class NinjaNut extends BasePlant {
    constructor(col, row) {
        super(col, row, 'ninja_nut');
        this.hp = 4000;
        this.maxHp = 4000;
        this.shootInterval = Infinity;
        this._hasSpawnedExtras = false;
    }

    update(dt) {
        super.update(dt);
        if(!this._hasSpawnedExtras){
            this._hasSpawnedExtras = true;
            const offsets = [
                [0, -1], [0, 1], [1, 0], [1, -1], [1, 1], [-1, 0], [-1, -1], [-1, 1]
            ];
            let spawnedCount = 0;
            for(const offset of offsets){
                if(spawnedCount >= 2) break;
                const targetCol = this.col + offset[0];
                const targetRow = this.row + offset[1];
                
                if(targetCol >= 0 && targetCol < COLS && targetRow >= 0 && targetRow < ROWS){
                    if(!grid[targetRow][targetCol] && terrainGrid[targetRow][targetCol] !== TERRAIN.OBSTACLE){
                        const p = Plant(targetCol, targetRow, 'ninja_nut');
                        p._hasSpawnedExtras = true;
                        plants.push(p);
                        grid[targetRow][targetCol] = p;
                        spawnedCount++;

                        spawnParticles(p.x + CELL/2, p.y + CELL/2, '#000000', 5);
                    }
                }
            }
        }
    }
}
