class CornGatling extends BasePlant {
    constructor(col, row) {
        super(col, row, 'corn_gatling');
        this.hp = 200;
        this.baseInterval = 2000;
        this.minInterval = 400;
        this.shootInterval = this.baseInterval;
    }

    update(dt) {
        // Check for targets in the row to adjust attack speed
        const hasTargetAhead = zombies.some(z => z.row === this.row && z.x > this.x);
        
        if (hasTargetAhead) {
            // Accelerate: reduce interval
            if (this.shootInterval > this.minInterval) {
                this.shootInterval -= dt * 0.2;
                if (this.shootInterval < this.minInterval) {
                    this.shootInterval = this.minInterval;
                }
            }
        } else {
            // Decelerate: increase interval slowly
            if (this.shootInterval < this.baseInterval) {
                this.shootInterval += dt * 0.8;
                if (this.shootInterval > this.baseInterval) {
                    this.shootInterval = this.baseInterval;
                }
            }
        }

        super.update(dt);
    }

    drawHP(ctx) {
        super.drawHP(ctx);
        
        // Draw attack speed bar below HP bar
        const progress = (this.baseInterval - this.shootInterval) / (this.baseInterval - this.minInterval);
        const barW = CELL - 16;
        const x = this.x + 8;
        let y = this.y + 4; 
        // HP bar is at y, height HP_BAR_HEIGHT(8)
        const speedBarY = y + HP_BAR_HEIGHT + 2;
        const barH = 6;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, speedBarY, barW, barH);
            
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x + 1, speedBarY + 1, (barW - 2) * progress, barH - 2);
    }

    shoot() {
        const hasTargetAhead = zombies.some(z => z.row === this.row && z.x > this.x);
        if (!hasTargetAhead) return;

        const c = cellCenter(this.col, this.row);
        
        bullets.push(new Bullet(c.x + 20, c.y, 400, 0, 20, 'corn'));
    }
}
