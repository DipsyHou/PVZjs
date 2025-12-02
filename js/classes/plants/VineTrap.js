class VineTrap extends BasePlant {
    constructor(col, row) {
        super(col, row, 'vine_trap');
        this.hp = 800;
        this.maxHp = 800;
        this.shootInterval = Infinity;
        this._lifeTimer = 0;
    }

    update(dt) {
        super.update(dt);
        this._lifeTimer += dt;
        if(this._lifeTimer >= 15000){
            // Expire
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
            return;
        }

        // Apply slow to zombies in 3x3 area
        const centerCol = this.col;
        const centerRow = this.row;
        for(const z of zombies){
            const zCol = Math.floor((z.x + z.width/2) / CELL);
            const zRow = Math.floor((z.y + z.height/2) / CELL);
            if(Math.abs(zCol - centerCol) <= 1 && Math.abs(zRow - centerRow) <= 1){
                z.slowRemaining = Math.max(z.slowRemaining || 0, 200); // Apply short slow constantly
                z.slowFactor = 0.5; // 50% slow
            }
        }
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        }

        // Vines drawing
        ctx.save();
        const centerC = cellCenter(this.col, this.row);
        
        ctx.strokeStyle = 'rgba(34, 139, 34, 0.5)';
        ctx.lineCap = 'round';
        
        for(let r = this.row - 1; r <= this.row + 1; r++){
            for(let c = this.col - 1; c <= this.col + 1; c++){
                if(r === this.row && c === this.col) continue; 
                if(r < 0 || r >= ROWS || c < 0 || c >= COLS) continue; 
                
                const baseTargetC = cellCenter(c, r);

                for(let i=0; i<1; i++){
                    const spreadX = ((c * r * (i+1) * 13) % 40) - 20; 
                    const spreadY = ((c * r * (i+1) * 17) % 40) - 20;
                    
                    const endSwayX = Math.sin(this._lifeTimer / (800 + i*100) + c * 123 + i) * 15;
                    const endSwayY = Math.cos(this._lifeTimer / (900 + i*100) + r * 456 + i) * 15;
                    
                    const targetX = baseTargetC.x + spreadX + endSwayX;
                    const targetY = baseTargetC.y + spreadY + endSwayY;

                    const dx = targetX - centerC.x;
                    const dy = targetY - centerC.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist <= 0) continue;

                    const nx = -dy / dist;
                    const ny = dx / dist;
                    const midX = (centerC.x + targetX) / 2;
                    const midY = (centerC.y + targetY) / 2;

                    ctx.beginPath();
                    ctx.moveTo(centerC.x, centerC.y);
                    
                    const sway = Math.sin(this._lifeTimer / (400 + i*200) + (c * r) + i) * (15 + i*5);
                    const offset = (i - 1) * 10; 

                    ctx.quadraticCurveTo(
                        midX + nx * (sway + offset), 
                        midY + ny * (sway + offset), 
                        targetX, 
                        targetY
                    );
                    ctx.lineWidth = 3 - i*0.5;
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    }
}
