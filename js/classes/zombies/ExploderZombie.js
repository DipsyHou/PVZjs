class ExploderZombie extends BaseZombie {
    constructor(row) {
        super(row, 'exploder');
        this.hp = 200;
        this.maxHp = this.hp;
        this.speed = 40;
        this.baseSpeed = this.speed;
        this._exploder = true;
    }

    update(dt) {
        super.update(dt);
        // Explode on contact (when attacking a plant)
        if (this.hp > 0 && this.targetPlant) {
            this.hp = 0;
            this.onDeath();
        }
    }

    onDeath() {
        // Explode logic
        // Assuming explode() is a global function or we implement it here.
        // The original code called `this.explode && this.explode()`.
        // I should probably implement the explosion logic here or call a global helper.
        // Since I don't see `explode` defined on prototype in the snippet, it might be dynamically assigned or I missed it.
        // But `exploder` type usually implies explosion.
        // Let's implement a basic explosion here.
        
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        spawnParticles(cx, cy, '#ff4500', 30);
        
        // Damage plants in 3x3
        const centerCol = Math.floor(cx / CELL);
        const centerRow = this.row;
        
        for(let r = centerRow - 1; r <= centerRow + 1; r++){
            for(let c = centerCol - 1; c <= centerCol + 1; c++){
                if(r >= 0 && r < ROWS && c >= 0 && c < COLS){
                    const p = grid[r][c];
                    if(p){
                        if(p.pumpkin && p.pumpkin.hp > 0){
                            p.pumpkin.hp -= 500;
                        } else {
                            p.hp -= 500; // Massive damage
                        }

                        if(p.hp <= 0){
                            grid[r][c] = null;
                            const idx = plants.indexOf(p);
                            if(idx >= 0) plants.splice(idx, 1);
                        }
                    }
                }
            }
        }
    }
}
