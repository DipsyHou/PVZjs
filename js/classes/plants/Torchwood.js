class Torchwood extends BasePlant {
    constructor(col, row) {
        super(col, row, 'torchwood');
        this.shootInterval = Infinity;
        this.hp = 800;
        this.maxHp = 800;
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            ctx.fillStyle = '#8b5b3c';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('T', this.x+CELL/2-6, this.y+CELL/2+6);
        }
    }
}
