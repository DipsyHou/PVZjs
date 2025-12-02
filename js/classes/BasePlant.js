class BasePlant {
    constructor(col, row, type) {
        this.col = col;
        this.row = row;
        this.x = col * CELL;
        this.y = row * CELL;
        this.hp = 200;
        this.maxHp = this.hp;
        this.shootTimer = 0;
        this.shootInterval = 1000; // ms
        this.type = type;
        this.pumpkin = null; // attached pumpkin instance
        this.floating = false;
    }

    update(dt) {
        // check pumpkin death
        if(this.pumpkin && this.pumpkin.hp <= 0){
            this.pumpkin = null;
        }

        // check plant death
        if(!this.floating && this.hp <= 0){
            if(grid[this.row][this.col] === this){
                grid[this.row][this.col] = null;
            }
            const idx = plants.indexOf(this);
            if(idx >= 0) plants.splice(idx, 1);
            return; // dead, no more updates
        }
        
        // Floating-type plants behavior: they act after a short timer then vanish
        if(this.floating){
            if(typeof this._floatTimer === 'number'){
                this._floatTimer -= dt;
                if(this._floatTimer <= 0){
                    this.onFloatTimerEnd();
                }
            }
            return; // floating plants do not perform other behavior
        }

        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.shoot();
        }
    }

    onFloatTimerEnd() {
        // Override in subclasses
    }

    shoot() {
        // Override in subclasses
    }

    draw(ctx) {
        let shouldHighlight = false;
        if (typeof shovelMode !== 'undefined' && shovelMode) {
            const {col, row} = worldToCell(mouseX, mouseY);
            if (this.col === col && this.row === row) {
                const relY = mouseY % CELL;
                const isBottom = relY > CELL / 2;
                const mainPlant = grid[this.row][this.col];
                if (mainPlant === this) {
                    if (this.pumpkin) {
                        if (!isBottom) shouldHighlight = true;
                    } else {
                        shouldHighlight = true;
                    }
                } else if (mainPlant && mainPlant.pumpkin === this) {
                    if (isBottom) shouldHighlight = true;
                }
            }
        }
        if(shouldHighlight){
            ctx.save();
            ctx.filter = 'brightness(1.5)';
        }

        this.drawVisuals(ctx);

        if(shouldHighlight){
            ctx.restore();
        }

        if(this.pumpkin){
            this.pumpkin.draw(ctx);
        }
    }

    drawVisuals(ctx) {
        // Default drawing logic
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        }
        else {
            // Fallback
            ctx.fillStyle = '#2e8b57';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('P', this.x+CELL/2-6, this.y+CELL/2+6);
        }
    }

    drawHP(ctx) {
        const barW = CELL - 16;
        const x = this.x + 8;
        
        // Determine Y position: default top, but pumpkin at bottom
        let y = this.y + 4; 
        if(this.type === 'spiky_pumpkin'){
            y = this.y + CELL - 12;
        }
    
        const ratio = Math.max(0, Math.min(1, this.hp / (this.maxHp || 1)));
        // background
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, y, barW, HP_BAR_HEIGHT);
        // health
        ctx.fillStyle = '#39d353';
        ctx.fillRect(x+1, y+1, Math.max(0, (barW-2) * ratio), HP_BAR_HEIGHT-2);
        // text
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText(Math.max(0, Math.floor(this.hp)), x + barW/2 - 8, y + HP_BAR_HEIGHT - 1);
    
        // Also draw pumpkin HP if attached
        if(this.pumpkin){
            this.pumpkin.drawHP(ctx);
        }
    }

    manualFire() {
        // Override in subclasses
    }
}
