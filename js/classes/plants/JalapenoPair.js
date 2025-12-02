class JalapenoPair extends BasePlant {
    constructor(col, row) {
        super(col, row, 'jalapeno_pair');
        this.hp = 10000;
        this.maxHp = 10000;
        this.shootInterval = Infinity;
        this._explodeTimer = 1000; // 1 second delay
    }

    update(dt) {
        super.update(dt);
        this._explodeTimer -= dt;
        if(this._explodeTimer <= 0){
            // Explode!
            const damage = 1800;
            const centerCol = this.col;
            const centerRow = this.row;

            // Visuals: Fire along the row
            for(let c=0; c<COLS; c++){
                const cx = c*CELL + CELL/2;
                const cy = centerRow*CELL + CELL/2;
                spawnParticles(cx, cy, '#ff4500', 10);
                spawnParticles(cx, cy, '#ff8c00', 5);
            }
            // Visuals: Fire along the column
            for(let r=0; r<ROWS; r++){
                const cx = centerCol*CELL + CELL/2;
                const cy = r*CELL + CELL/2;
                spawnParticles(cx, cy, '#ff4500', 10);
                spawnParticles(cx, cy, '#ff8c00', 5);
            }

            // Damage zombies in row OR column
            for(let k=zombies.length-1; k>=0; k--){
                const z = zombies[k];
                const zCol = Math.floor((z.x + z.width/2) / CELL);
                
                if(z.row === centerRow || zCol === centerCol){
                    z.takeDamage(damage);
                    spawnParticles(z.x + z.width/2, z.y + z.height/2, '#fff', 5);
                }
            }

            // Remove self
            const idx = plants.indexOf(this);
            if(idx >= 0) plants.splice(idx, 1);
            if(grid[this.row][this.col] === this) {
                if(this.pumpkin){
                    grid[this.row][this.col] = this.pumpkin;
                    plants.push(this.pumpkin);
                    this.pumpkin = null;
                } else {
                    grid[this.row][this.col] = null;
                }
            }
        }
    }
}
