class Mimic extends BasePlant {
    constructor(col, row) {
        super(col, row, 'mimic');
        this.hp = 200;
        this.maxHp = 200;
        this._mimicTimer = 3000; // ms until transform
        this._mimicTarget = null; // will be set when placed
    }

    update(dt) {
        super.update(dt);
        
        if(typeof this._mimicTimer === 'number'){
            this._mimicTimer -= dt;
            if(this._mimicTimer <= 0){
                const idx = plants.indexOf(this);
                if(!this._mimicTarget){
                    // Failed to transform (no target set?), revert/remove
                    if(grid[this.row][this.col] === this) {
                        if(this.pumpkin){
                            grid[this.row][this.col] = this.pumpkin;
                            plants.push(this.pumpkin);
                            this.pumpkin = null;
                        } else {
                            grid[this.row][this.col] = null;
                        }
                    }
                    if(idx >= 0) plants.splice(idx,1);
                    spawnParticles(this.x + CELL/2, this.y + CELL/2, '#999999', 8, {style: 'spark'});
                    return;
                }
                // determine target type
                const targetType = this._mimicTarget;

                // Prevent stacking pumpkins via mimic
                if(this.pumpkin && targetType === 'spiky_pumpkin'){
                    if(grid[this.row][this.col] === this) {
                        grid[this.row][this.col] = this.pumpkin;
                        plants.push(this.pumpkin);
                        this.pumpkin = null;
                    }
                    if(idx >= 0) plants.splice(idx,1);
                    spawnParticles(this.x + CELL/2, this.y + CELL/2, '#999999', 8, {style: 'spark'});
                    return;
                }

                // create new plant instance of that type in same cell
                // Use the global Plant factory function
                const newP = Plant(this.col, this.row, targetType);
                // preserve exact position
                newP.x = this.x; newP.y = this.y;
                
                // replace in plants array
                if(idx >= 0) plants[idx] = newP;

                if(newP.floating){
                    // Floating plants (like reshaper) should not be in the grid.
                    if(grid[this.row][this.col] === this){
                        if(this.pumpkin){
                            grid[this.row][this.col] = this.pumpkin;
                            plants.push(this.pumpkin);
                            this.pumpkin = null;
                        } else {
                            grid[this.row][this.col] = null;
                        }
                    }
                } else {
                    // Normal plants: transfer pumpkin and update grid
                    if(this.pumpkin){
                        newP.pumpkin = this.pumpkin;
                        this.pumpkin = null;
                    }
                    if(grid[this.row][this.col] === this) grid[this.row][this.col] = newP;
                }
                // visual flourish
                spawnParticles(this.x + CELL/2, this.y + CELL/2, '#ffd700', 120, {style: 'spark'});
            }
        }
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            ctx.fillStyle = '#9966cc';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('M', this.x+CELL/2-6, this.y+CELL/2+6);
        }

        // Countdown effect
        if(this._mimicTimer > 0){
            const c = cellCenter(this.col, this.row);
            const maxTime = 3000; 
            const ratio = this._mimicTimer / maxTime;
            
            ctx.save();
            ctx.translate(c.x, c.y);

            // Purple ring
            const r = CELL/2 - 5;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(140, 100, 170, 0.3)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            const startAngle = -Math.PI/2 + (Math.PI * 2 * (1 - ratio));
            const endAngle = -Math.PI/2 + Math.PI * 2;
            ctx.arc(0, 0, r, startAngle, endAngle, false);
            ctx.strokeStyle = '#ba68c8'; 
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.fillStyle = `rgba(186, 104, 200, 0.3)`;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.8, 0, Math.PI*2);
            ctx.fill();

            // Question mark
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha =  0.7 + 0.3 * Math.sin(Date.now() / 100);
            ctx.fillText('?', 0, 2 * Math.sin(Date.now() / 200));

            ctx.restore();
        }
    }
}
