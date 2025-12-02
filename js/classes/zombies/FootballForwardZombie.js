class FootballForwardZombie extends BaseZombie {
    constructor(row) {
        super(row, 'football_forward');
        this.hp = 200; 
        this.footballHelmHp = 2400; 
        this.maxFootballHelmHp = this.footballHelmHp;
        this.footballHelmActive = true;
        this.speed = 45;
        this.baseSpeed = this.speed;
        this._forward = true; 
    }

    update(dt) {
        // Try to shove before normal update (which would attack)
        if(this.targetPlant){
            const p = this.targetPlant;
            const c = p.col;
            const upR = this.row - 1;
            const downR = this.row + 1;
            const canUp = (upR >= 0 && !grid[upR][c]);
            const canDown = (downR < ROWS && !grid[downR][c]);

            let targetR = -1;

            if(canUp && !canDown){
                targetR = upR;
            } else if(!canUp && canDown){
                targetR = downR;
            } else if(canUp && canDown){
                targetR = Math.random() < 0.5 ? upR : downR;
            }

            if(targetR !== -1){
                // Move plant
                grid[this.row][c] = null;
                grid[targetR][c] = p;
                p.row = targetR; 
                p.y = targetR * CELL;
                if(p.pumpkin){
                    p.pumpkin.row = targetR;
                    p.pumpkin.y = targetR * CELL;
                }

                spawnParticles(p.x + CELL/2, p.y + CELL/2, '#ffffff', 10, {style: 'dust'});
                
                // Stop attacking locally
                this.targetPlant = null;
                
                // Force other zombies attacking this plant to stop
                for(const z of zombies){
                    if(z.targetPlant === p){
                        z.targetPlant = null;
                    }
                }
            }
        }

        super.update(dt);
    }

    takeDamage(amount) {
        if(this.footballHelmActive && this.footballHelmHp > 0){
            this.footballHelmHp -= amount;
            if(this.footballHelmHp <= 0){
                const overflow = -this.footballHelmHp;
                this.footballHelmHp = 0; this.footballHelmActive = false;
                this.hp -= overflow;
            }
            return;
        }
        this.hp -= amount;
        if (this.hp <= 0) this.onDeath();
    }

    drawHP(ctx) {
        super.drawHP(ctx);
        
        if(this.footballHelmActive && this.footballHelmHp > 0){
            const barW = this.width;
            const x = this.x;
            const y = this.y + 8; 
            
            const ratio = Math.max(0, Math.min(1, this.footballHelmHp / (this.maxFootballHelmHp || 1)));
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x, y, barW, 6);
            
            ctx.fillStyle = '#aaa'; // Darker Red for forward helmet
            ctx.fillRect(x+1, y+1, Math.max(0, (barW-2)*ratio), 4);
        }
    }
}
