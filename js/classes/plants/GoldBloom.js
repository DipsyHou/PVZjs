class GoldBloom extends BasePlant {
    constructor(col, row) {
        super(col, row, 'gold_bloom');
        this.hp = 50;
        this.maxHp = 50;
        this.shootInterval = Infinity;
        this._lifeTimer = 0; // counts up to 8000ms
    }

    update(dt) {
        super.update(dt);
        this._lifeTimer += dt;
        if(this._lifeTimer >= 8000){
            // Produce 500 sun
            sun += 500;
            const sunCount = document.getElementById('sun-count');
            if(sunCount) sunCount.textContent = sun;
            
            // Visual effects
            const cx = this.x + CELL/2;
            const cy = this.y + CELL/2;
            spawnParticles(cx, cy, '#ffd700', 30, {style: 'spark'}); // Gold particles
            
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

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            // Fallback handled by BasePlant, but we have custom effects
        }

        if(this._lifeTimer < 8000){
            const c = cellCenter(this.col, this.row);
            const progress = this._lifeTimer / 8000;
            
            ctx.save();
            ctx.translate(c.x, c.y);
            
            // Glow
            const glowSize = (CELL/2) * (0.5 + 0.5 * progress);
            const gradient = ctx.createRadialGradient(0, 0, glowSize * 0.2, 0, 0, glowSize);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${0.2 + 0.3 * progress})`);
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI*2);
            ctx.fill();

            // Progress bar
            const r = CELL/2 - 8;
            ctx.beginPath();
            ctx.arc(0, 0, r, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress), false);
            ctx.strokeStyle = 'rgba(255, 223, 0, 0.8)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.restore();
        }
    }
}
