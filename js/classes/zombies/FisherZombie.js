class FisherZombie extends BaseZombie {
    constructor(row) {
        super(row, 'fisher');
        this.hp = 200;
        this.maxHp = this.hp;
        this.speed = 20;
        this.baseSpeed = this.speed;
        this.hookCooldown = 0; 
        this.hookChargeTime = 0;
        this.isHooking = false;
        this.hookTarget = null;
    }

    update(dt) {
        // If stunned, skip hook logic entirely (cooldown pauses, action pauses)
        if(this.stunRemaining > 0){
            super.update(dt);
            return;
        }

        // Hook logic
        if(this.hookCooldown > 0) this.hookCooldown -= dt;

        if(this.isHooking){
            this.baseSpeed = 0; // Stop moving while hooking
            this.hookChargeTime += dt;
            
            // Visual cue for hooking? (Maybe handled in draw, but we don't have custom draw yet)
            
            if(this.hookChargeTime >= 1000){
                // Execute hook
                if(this.hookTarget && this.hookTarget.hp > 0 && grid[this.row][this.hookTarget.col] === this.hookTarget){
                    const p = this.hookTarget;
                    const currentCol = p.col;
                    const newCol = currentCol + 1;
                    
                    // Pull forward 1 grid (to the right)
                    // Check if destination is valid (inside grid and empty)
                    if(newCol < COLS && !grid[this.row][newCol]){
                        grid[this.row][currentCol] = null;
                        grid[this.row][newCol] = p;
                        p.col = newCol;
                        p.x = newCol * CELL;
                        if(p.pumpkin){
                            p.pumpkin.col = newCol;
                            p.pumpkin.x = newCol * CELL;
                        }
                        spawnParticles(p.x + CELL/2, p.y + CELL/2, '#ffffff', 10, {style: 'ring'});

                        // Force other zombies attacking this plant to stop attacking
                        for(const z of zombies){
                            if(z.targetPlant === p){
                                z.targetPlant = null;
                            }
                        }
                    }
                }
                
                // Reset hook state
                this.isHooking = false;
                this.hookTarget = null;
                this.hookCooldown = 5000;
                this.hookChargeTime = 0;
                this.baseSpeed = this.speed; // Restore speed
            }
        } else {
            // Not hooking, check if we should start
            if(this.hookCooldown <= 0 && !this.targetPlant){
                // Look for plant ahead
                let bestCol = -1;
                // Scan from left (0) to zombie position
                const zombieCol = Math.floor(this.x / CELL);
                
                for(let c=0; c < zombieCol; c++){
                    if(grid[this.row][c]){
                        // Found a plant
                        // We want the rightmost plant that is to the left of the zombie
                        if(c > bestCol) bestCol = c;
                    }
                }
                
                if(bestCol !== -1){
                    this.hookTarget = grid[this.row][bestCol];
                    this.isHooking = true;
                    this.hookChargeTime = 0;
                    this.baseSpeed = 0;
                }
            }
            
            if(!this.isHooking) this.baseSpeed = this.speed;
        }

        super.update(dt);
    }

    draw(ctx) {
        super.draw(ctx);
        // Draw fishing line if hooking
        if(this.isHooking && this.hookTarget){
            const startX = this.x + 10;
            const startY = this.y + 20;
            const targetX = this.hookTarget.x + CELL/2;
            const targetY = this.hookTarget.y + CELL/2;
            
            // Animate line flying out
            // Fly out in 0.6s, hold for 0.4s
            let progress = this.hookChargeTime / 600;
            if(progress > 1) progress = 1;
            
            const endX = startX + (targetX - startX) * progress;
            const endY = startY + (targetY - startY) * progress;
            
            ctx.save();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Draw hook at end
            ctx.fillStyle = '#aaaaaa';
            ctx.beginPath();
            ctx.arc(endX, endY, 5, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }
    }
}
