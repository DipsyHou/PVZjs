class IcedCoconut extends BasePlant {
    constructor(col, row) {
        super(col, row, 'iced_coconut');
        this.shootInterval = Infinity;
        this._rollingStarted = false;
        this.rollRemaining = 0;
        this.rollSpeed = 0;
        this.vx = 0;
        this.knocked = null;
    }

    update(dt) {
        super.update(dt);
        
        if(!this._rollingStarted){
            this._rollingStarted = true;
            const maxCells = Math.min(4, COLS - 1 - this.col);
            this.rollRemaining = maxCells * CELL;
            this.rollSpeed = 320;
            this.vx = this.rollSpeed;
            this.knocked = new Set();
            
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
        const dtSec = dt/1000;
        const move = this.vx * dtSec;
        this.x += move;
        this.rollRemaining -= move;

        for(const z of zombies){
            if(z.row !== this.row) continue;
            if(this.knocked && this.knocked.has(z)) continue; 
            const plantLeft = this.x + 8;
            const plantRight = plantLeft + (CELL - 16);
            const zLeft = z.x + 6;
            const zRight = z.x + z.width;
            if(plantRight > zLeft && plantLeft < zRight){
                const targetX = z.x + CELL;
                const duration = 500; 
                z.knockbackRemaining = Math.max(z.knockbackRemaining || 0, duration);
                z.knockbackSpeed = (CELL / (duration / 1000)); 
                z._knockbackTargetX = targetX;
                z.takeDamage(100);
                this.knocked.add(z);
            }
        }

        if(this.rollRemaining <= 0 || this.x >= (COLS-1) * CELL){
            const cx = this.x + CELL/2;
            const cy = this.y + CELL/2;
            const centerCol = Math.floor(cx / CELL);
            const centerRow = this.row;
            
            spawnParticles(cx, cy, '#aee7ff', 26);
            spawnParticles(cx, cy, '#4da3ff', 10);

            for(let i=0; i<20; i++){
                const angle = Math.random() * Math.PI * 2;
                const speed = 20 + Math.random() * 80;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                particles.push({
                    x: cx, 
                    y: cy, 
                    vx: vx, 
                    vy: vy, 
                    life: 400 + Math.random()*400, 
                    maxLife: 800, 
                    color: `rgba(174, 231, 255, 0.6)`, 
                    size: 10 + Math.random()*20,
                    gravity: -30 
                });
            }

            for(let k=zombies.length-1;k>=0;k--){
                const other = zombies[k];
                const col = Math.floor((other.x + other.width/2) / CELL);
                const row = Math.floor((other.y + other.height/2) / CELL);
                if(Math.abs(col - centerCol) <= 1 && Math.abs(row - centerRow) <= 1){
                    other.slowRemaining = Math.max(other.slowRemaining || 0, 10000);
                    other.slowFactor = 0.4;
                    other.takeDamage(300);
                }
            }
            const idx = plants.indexOf(this);
            if(idx >= 0) plants.splice(idx,1);
        }
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            ctx.fillStyle = '#7fd3ff';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('C', this.x+CELL/2-6, this.y+CELL/2+6);
        }
    }
}
