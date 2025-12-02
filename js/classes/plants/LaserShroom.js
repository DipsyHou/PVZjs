class LaserShroom extends BasePlant {
    constructor(col, row) {
        super(col, row, 'laser_shroom');
        this.shootInterval = 400;
        this.laserActiveTime = 0;
    }

    update(dt) {
        super.update(dt);
        if(this.laserActiveTime > 0){
            this.laserActiveTime -= dt;
        }
    }

    shoot() {
        // Check if any zombie is in 5x5 range (radius 2)
        const hasTarget = zombies.some(z => {
            const zCol = Math.floor((z.x + z.width/2) / CELL);
            const zRow = Math.floor((z.y + z.height/2) / CELL);
            return Math.abs(zCol - this.col) <= 2 && Math.abs(zRow - this.row) <= 2;
        });

        if(hasTarget){
            const directions = [
                [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]
            ];

            const affectedCells = new Set();
            affectedCells.add(`${this.col},${this.row}`);

            directions.forEach(dir => {
                for(let i=1; i<=2; i++){
                    const c = this.col + dir[0] * i;
                    const r = this.row + dir[1] * i;
                    if(c >= 0 && c < COLS && r >= 0 && r < ROWS){
                        affectedCells.add(`${c},${r}`);
                    }
                }
            });

            this.laserActiveTime = 200; 

            zombies.forEach(z => {
                const zCol = Math.floor((z.x + z.width/2) / CELL);
                const zRow = Math.floor((z.y + z.height/2) / CELL);
                if(affectedCells.has(`${zCol},${zRow}`)){
                    z.takeDamage(20);
                }
            });
        } else {
            this.shootTimer = this.shootInterval; // Keep charged
        }
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        }

        if(this.laserActiveTime > 0){
            const c = cellCenter(this.col, this.row);
            const directions = [
                [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]
            ];
            
            ctx.save();
            ctx.strokeStyle = `rgba(204, 0, 255, ${(this.laserActiveTime / 150) * 0.3})`; 
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#cc00ff';

            directions.forEach(dir => {
                const len = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1]);
                const dx = dir[0] / len;
                const dy = dir[1] / len;
                
                const endX = c.x + dx * CELL * 2.5; 
                const endY = c.y + dy * CELL * 2.5;
                
                ctx.beginPath();
                ctx.moveTo(c.x, c.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            });
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 10, 0, Math.PI*2);
            ctx.fill();

            ctx.restore();
        }
    }
}
