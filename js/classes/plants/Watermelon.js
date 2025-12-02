class Watermelon extends BasePlant {
    constructor(col, row) {
        super(col, row, 'watermelon');
        this.shootInterval = 3000;
    }

    shoot() {
        // find nearest zombie on same row to the right
        let target = null;
        let bestDist = Infinity;
        for(const z of zombies){
            if(z.row === this.row && z.x > this.x){
                const d = z.x - this.x;
                if(d < bestDist){ bestDist = d; target = z; }
            }
        }
        if(!target) return;

        let windmillBoost = 1;
        for(let cIdx = 0; cIdx < this.col; cIdx++){
            const p = grid[this.row][cIdx];
            if(p && p.type === 'windmill'){
                windmillBoost = 1.5;
                break; 
            }
        }

        const c = cellCenter(this.col, this.row);
        const startX = c.x + 20;
        const startY = c.y;
        const targetX = target.x + target.width/2;
        const targetY = target.y + target.height/2;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const g = 1200; // gravity px/s^2
        
        // choose time to impact based on distance (clamp)
        let t = Math.max(0.4, Math.min(1.2, Math.abs(dx) / 400));
        const vx = dx / t;
        const vy = (dy - 0.5 * g * t * t) / t;
        
        const wm = new Bullet(startX, startY, vx, vy, 80 * windmillBoost, 'watermelon');
        wm.startX = startX; wm.startY = startY;
        wm.targetX = targetX; wm.targetY = targetY;
        wm.totalTime = t;
        wm.radius = 14;
        wm.target = target;
        wm.originRow = this.row;
        wm.splash = 40 * windmillBoost;
        bullets.push(wm);
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            ctx.fillStyle = '#3aa0b8';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('W', this.x+CELL/2-6, this.y+CELL/2+6);
        }
    }
}
