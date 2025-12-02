class Bomber extends BasePlant {
    constructor(col, row) {
        super(col, row, 'bomber');
        this.shootInterval = 4000;
    }

    shoot() {
        const hasTargetAhead = zombies.some(z => Math.abs(z.row - this.row) <= 1 && z.x > this.x);
        if (!hasTargetAhead) return;

        let windmillBoost = 1;
        for(let cIdx = 0; cIdx < this.col; cIdx++){
            const p = grid[this.row][cIdx];
            if(p && p.type === 'windmill'){
                windmillBoost = 1.5;
                break; 
            }
        }

        const c = cellCenter(this.col, this.row);
        const rows = [this.row-1, this.row, this.row+1];
        const g = 1200;
        
        for(const rr of rows){
            if(rr < 0 || rr >= ROWS) continue;
            // collect zombies on this row to the right of the plant
            const candidates = zombies.filter(z => z.row === rr && z.x > this.x);
            if(candidates.length === 0) continue;
            // sort by distance
            candidates.sort((a,b)=> (a.x - this.x) - (b.x - this.x));
            // take up to 2 targets
            for(let k=0;k<Math.min(2,candidates.length);k++){
                const target = candidates[k];
                const startX = c.x + 20;
                const startY = c.y;
                const targetX = target.x + target.width/2;
                const targetY = target.y + target.height/2;
                const dx = targetX - startX;
                const dy = targetY - startY;
                let t = Math.max(0.35, Math.min(1.0, Math.abs(dx) / 450));
                const vx = dx / t;
                const vy = (dy - 0.5 * g * t * t) / t;
                const bm = new Bullet(startX, startY, vx, vy, 100 * windmillBoost, 'bomb');
                bm.startX = startX; bm.startY = startY;
                bm.targetX = targetX; bm.targetY = targetY;
                bm.totalTime = t;
                bm.radius = 16;
                bm.target = target;
                // originRow for bombs should be the intended target row so they only hit that row
                bm.originRow = target.row;
                bm.splash = 200 * windmillBoost; // 3x3 area 200 damage
                bullets.push(bm);
            }
        }
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('B', this.x+CELL/2-6, this.y+CELL/2+6);
        }
    }
}
