class PineShooter extends BasePlant {
    constructor(col, row) {
        super(col, row, 'pine_shooter');
        this.shootInterval = 1000;
    }

    shoot() {
        const hasTargetAhead = zombies.some(z => z.row === this.row && z.x > this.x);
        if (!hasTargetAhead) return;

        const c = cellCenter(this.col, this.row);
        const speed = 720;
        const b = new Bullet(c.x + 20, c.y, speed, 0, 20, 'needle');
        b.radius = 4;
        b.pierce = true;
        bullets.push(b);
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            ctx.fillStyle = '#2e8b57';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('松', this.x+CELL/2-6, this.y+CELL/2+6);
        }
    }
}
