class Trumpet extends BasePlant {
    constructor(col, row) {
        super(col, row, 'trumpet');
        this.shootInterval = Infinity;
        this._trumpetCooldown = 1000; // ms until next attraction window
        this._trumpetActive = false;
        this._trumpetActiveTime = 0; // ms within current attraction window
        this._trumpetWaveTime = 0;
    }

    update(dt) {
        super.update(dt);
        
        const centerCol = this.col;
        const centerRow = this.row;
        const minCol = Math.max(0, centerCol - 1);
        const maxCol = Math.min(COLS-1, centerCol + 1);
        const minRow = Math.max(0, centerRow - 1);
        const maxRow = Math.min(ROWS-1, centerRow + 1);
        const targetY = centerRow * CELL + CELL/2;

        // Update cooldown and duration
        if(!this._trumpetActive){
            this._trumpetCooldown -= dt;
            if(this._trumpetCooldown <= 0){
                // Start new 3s attraction window
                this._trumpetActive = true;
                this._trumpetActiveTime = 0;
                this._trumpetWaveTime = 0;
            }
        }

        if(this._trumpetActive){
            this._trumpetActiveTime += dt;
            // Attraction logic
            for(const b of bullets){
                // Exclude lobbed projectiles
                if(b.kind === 'watermelon' || b.kind === 'bomb') continue;
                const col = Math.floor(b.x / CELL);
                const row = Math.floor(b.y / CELL);
                if(col >= minCol && col <= maxCol && row >= minRow && row <= maxRow){
                    const targetYLocal = targetY;
                    const lerpFactor = 0.1; 
                    b.y = b.y + (targetYLocal - b.y) * lerpFactor;
                    const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy) || 350;
                    b.vx = Math.abs(speed);
                    b.vy = 0;
                }
            }

            this._trumpetWaveTime = (this._trumpetWaveTime || 0) + dt;

            if(this._trumpetActiveTime >= 3000){
                this._trumpetActive = false;
                this._trumpetCooldown = 3000; 
            }
        }
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('L', this.x+CELL/2-6, this.y+CELL/2+6);
        }

        // Sound wave effect
        if(this._trumpetActive && this._trumpetWaveTime){
            const c = cellCenter(this.col, this.row);
            const t = this._trumpetWaveTime / 1000; // seconds
            const maxRadius = CELL * 1.5;
            const baseRadius = CELL * 0.5;
            const radius = baseRadius + (maxRadius - baseRadius) * Math.min(1, t / 3);
            ctx.save();
            ctx.strokeStyle = `rgba(236, 112, 255, 0.4)`;
            ctx.lineWidth = 3;
            // Draw arc
            ctx.beginPath();
            ctx.arc(c.x, c.y, radius, -Math.PI/4, Math.PI/4);
            ctx.stroke();
            // Inner arc
            ctx.beginPath();
            ctx.arc(c.x, c.y, radius * 0.7, -Math.PI/4, Math.PI/4);
            ctx.stroke();
            ctx.restore();
        }
    }
}
