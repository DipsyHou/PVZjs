class Reshaper extends BasePlant {
    constructor(col, row) {
        super(col, row, 'reshaper');
        this.hp = 0;
        this.maxHp = 0;
        this.shootInterval = Infinity;
        this.floating = true;
        this._floatTimer = 1000; 
        this._maxFloatTimer = 1000;
    }

    onFloatTimerEnd() {
        const r = this.row, c = this.col;
        const target = grid[r][c];
        // remove plants in the cell, refund their costs and reset their cooldowns
        let refund = 0;
        const resetTypes = [];
        
        if(target && target !== this){
            // attached pumpkin
            if(target.pumpkin){
                const pk = target.pumpkin;
                const pkCost = PLANT_CONFIGS[pk.type].cost || PLANT_COST;
                refund += pkCost;
                resetTypes.push(pk.type);
                const pki = plants.indexOf(pk);
                if(pki >= 0) plants.splice(pki,1);
            }
            const tCost = PLANT_CONFIGS[target.type].cost || PLANT_COST;
            refund += tCost;
            resetTypes.push(target.type);
            
            grid[r][c] = null;
            const ti = plants.indexOf(target);
            if(ti >= 0) plants.splice(ti,1);
        }
        if(refund > 0){
            sun += refund;
            const sunCount = document.getElementById('sun-count');
            if(sunCount) sunCount.textContent = sun;
        }
        for(const ty of resetTypes) plantCooldowns[ty] = 0;
        spawnParticles(this.x + CELL/2, this.y + CELL/2, '#ffd700', 30, {style: 'spark'});

        // Safety: ensure we are not in the grid
        if(grid[this.row][this.col] === this) grid[this.row][this.col] = null;

        // remove this floating plant instance
        const idx = plants.indexOf(this);
        if(idx >= 0) plants.splice(idx,1);
    }
}
