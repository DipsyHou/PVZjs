class Spread extends BasePlant {
    constructor(col, row) {
        super(col, row, 'spread');
        this.shootInterval = 1000;
    }

    shoot() {
        const hasTargetAhead = zombies.some(z => z.x > this.x);
        if (!hasTargetAhead) return;

        const c = cellCenter(this.col, this.row);
        // fire 5 bullets evenly from -45 to 45 degrees
        const count = 5;
        const minDeg = -45, maxDeg = 45;
        const speed = 360; // px/sec
        for(let i=0;i<count;i++){
            const t = count === 1 ? 0.5 : i/(count-1); // 0..1
            const deg = minDeg + t*(maxDeg-minDeg);
            const rad = deg * Math.PI/180;
            const vx = Math.cos(rad) * speed;
            const vy = Math.sin(rad) * speed; // positive y is down
            bullets.push(new Bullet(c.x + 20, c.y, vx, vy, 20, 'pea'));
        }
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            ctx.fillStyle = '#c75b5b';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('S', this.x+CELL/2-6, this.y+CELL/2+6);
        }
    }
}
