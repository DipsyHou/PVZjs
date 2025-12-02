class SpikyPumpkin extends BasePlant {
    constructor(col, row) {
        super(col, row, 'spiky_pumpkin');
        this.hp = 4000;
        this.maxHp = 4000;
        this.shootInterval = Infinity;
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            // Flatten and move down to avoid blocking the plant inside
            ctx.drawImage(img, this.x+8, this.y+32, CELL-16, 40);
        } else {
            // Fallback
            ctx.fillStyle = '#2e8b57';
            ctx.fillRect(this.x+8, this.y+32, CELL-16, 40);
        }
    }
}
