class PriestZombie extends BaseZombie {
    constructor(row) {
        super(row, 'priest');
        this.hp = 200;
        this.maxHp = 200;
        this.speed = 20;
        this.baseSpeed = 20;
        this.healTarget = null;
        this.healRate = 50; // hp per second
        this.linkCooldown = 0;
    }

    update(dt) {
        // If stunned, stop healing logic
        if(this.stunRemaining > 0){
            super.update(dt);
            this.healTarget = null;
            return;
        }

        // Handle cooldown
        if (this.linkCooldown > 0) {
            this.linkCooldown -= dt;
            this.healTarget = null;
        }

        // If we have a target, check if it's still valid
        if (this.healTarget) {
            const z = this.healTarget;
            const max = z.maxHp || 200;
            // Invalid if dead, full hp, or removed from game
            if (z.hp <= 0 || z.hp >= max || !zombies.includes(z)) {
                this.healTarget = null;
                this.linkCooldown = 1000; // 1s cooldown after break
            }
        }

        // If no target and no cooldown, find nearest injured zombie
        if (!this.healTarget && this.linkCooldown <= 0) {
            let nearest = null;
            let minDistSq = Infinity;
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            for (const z of zombies) {
                if (z === this || z.hp <= 0) continue;
                // Check if injured
                const max = z.maxHp || 200;
                if (z.hp >= max) continue;

                const zcx = z.x + z.width / 2;
                const zcy = z.y + z.height / 2;
                const distSq = (cx - zcx) ** 2 + (cy - zcy) ** 2;

                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    nearest = z;
                }
            }
            this.healTarget = nearest;
        }

        // Apply state based on healing status
        if (this.healTarget) {
            this.baseSpeed = 0;
            this.targetPlant = null; // Stop eating
        } else {
            this.baseSpeed = this.speed; // Restore speed
        }

        // Call base update (movement, collision, etc.)
        super.update(dt);

        // Apply healing effect
        if (this.healTarget) {
            const amount = this.healRate * (dt / 1000);
            const max = this.healTarget.maxHp || 200;
            this.healTarget.hp = Math.min(max, this.healTarget.hp + amount);
        }
    }

    draw(ctx) {
        super.draw(ctx);
        if (this.healTarget && this.healTarget.hp > 0) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const tcx = this.healTarget.x + this.healTarget.width / 2;
            const tcy = this.healTarget.y + this.healTarget.height / 2;

            ctx.save();
            // Glow effect
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            
            // Flowing dashed line
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.setLineDash([15, 0]); 
            // Animate offset to look like energy flowing towards target
            ctx.lineDashOffset = -performance.now() / 20;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(tcx, tcy);
            ctx.stroke();

            // Energy particle moving along the line
            const time = performance.now() / 500;
            const t = time % 1; // 0 to 1
            const px = cx + (tcx - cx) * t;
            const py = cy + (tcy - cy) * t;
            
            ctx.fillStyle = '#FFF';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#FFF';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI*2);
            ctx.fill();

            ctx.restore();
        }
    }
}
