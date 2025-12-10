class Jelly extends BasePlant {
    constructor(col, row) {
        super(col, row, 'jelly');
        this.hp = 500;
        this.maxHp = this.hp;
        this.shootInterval = 1000000; // practically never
    }

    update(dt){
        // reflect bullets that pass through this cell
        // iterate bullets and flip their horizontal velocity once
        const left = this.x + 10;
        const right = this.x + CELL - 10;
        const top = this.y + 10;
        const bottom = this.y + CELL - 10;
        for(let i=0;i<bullets.length;i++){
            const b = bullets[i];
            if(b._reflectedBy && b._reflectedBy === this) continue; // already handled by this plant
            // (b.reflected) continue; // already reflected by someone else
            // ignore large parabolic projectiles
            if(
                b.kind === 'watermelon' ||
                b.kind === 'bomb' ||
                b.kind === 'citron_plasma'
            ) continue;
            if(b.x >= left && b.x <= right && b.y >= top && b.y <= bottom){
                // reflect horizontally
                b.vx = -b.vx;
                // small upward nudge so it visibly arcs a bit
                b.vy = -b.vy;
                b.reflected = true;
                b._reflectedBy = this;
                
                // Disable homing so it doesn't turn back
                if(b.homing){
                    b.homing = false;
                    b.target = null;
                }

                spawnParticles(b.x, b.y, '#b3e5ff', 1, {style: 'spark'});
            }
        }

        // call base behavior for death handling
        super.update(dt);
    }

    drawVisuals(ctx){
        // draw using plant image if available, otherwise a simple shield icon
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
            return;
        }
        // fallback drawing
        ctx.fillStyle = '#8fb3ff';
        ctx.fillRect(this.x+12, this.y+12, CELL-24, CELL-24);
        ctx.fillStyle = '#fff';
        ctx.fillText('反', this.x+CELL/2-8, this.y+CELL/2+6);
    }
}
