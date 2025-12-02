class TimeMachine extends BasePlant {
    constructor(col, row) {
        super(col, row, 'time_machine');
        this.hp = 0;
        this.maxHp = 0;
        this.shootInterval = Infinity;
        this.floating = true;
        this._floatTimer = 3000; 
        this._maxFloatTimer = 3000;
    }

    onFloatTimerEnd() {
        const r = this.row, c = this.col;
        const target = grid[r][c];
        
        if(target && target !== this){
            const resetTypes = [];
            if(target.pumpkin) resetTypes.push(target.pumpkin.type);
            resetTypes.push(target.type);
            for(const ty of resetTypes) plantCooldowns[ty] = 0;
            spawnParticles(this.x + CELL/2, this.y + CELL/2, '#9be7ff', 20, {style: 'spark'});
        }
        
        if(grid[this.row][this.col] === this) grid[this.row][this.col] = null;

        const idx = plants.indexOf(this);
        if(idx >= 0) plants.splice(idx,1);
    }

    drawVisuals(ctx) {
        if(this.floating && this._floatTimer > 0){
            const c = cellCenter(this.col, this.row);
            const ratio = this._floatTimer / this._maxFloatTimer;
            ctx.save();
            ctx.translate(c.x, c.y);
            
            // Draw the plant image if available
            const img = plantImages[this.type];
            if(img && img.complete && img.naturalWidth){
                ctx.save();
                ctx.globalAlpha = 0.7; // Slightly transparent
                ctx.drawImage(img, -CELL/2 + 8, -CELL/2 + 8, CELL-16, CELL-16);
                ctx.restore();
            }

            ctx.rotate((1 - ratio) * Math.PI * 4); 

            const r = CELL/2 - 10;

            // Background ring
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.2)';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Progress ring
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            const endAngle = -Math.PI/2 + (Math.PI * 2 * ratio);
            ctx.arc(0, 0, r, -Math.PI/2, endAngle, false);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Dot
            ctx.fillStyle = '#ffffff';
            const dotX = r * Math.cos(endAngle);
            const dotY = r * Math.sin(endAngle);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 5, 0, Math.PI*2);
            ctx.fill();

            ctx.restore();
        }
    }
}
