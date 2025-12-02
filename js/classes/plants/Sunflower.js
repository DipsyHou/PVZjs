class Sunflower extends BasePlant {
    constructor(col, row) {
        super(col, row, 'sunflower');
        this.shootInterval = 16000;
    }

    shoot() {
        sun += 25;
        const sunCount = document.getElementById('sun-count');
        if(sunCount) sunCount.textContent = sun;
        
        // small particle effect
        const c = cellCenter(this.col, this.row);
        spawnParticles(c.x, c.y - 6, '#ffd400', 8, {style: 'spark'});
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        } else {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
            ctx.fillStyle = '#fff';
            ctx.fillText('☀', this.x+CELL/2-6, this.y+CELL/2+6);
        }

        // Growth/Glow effect
        const c = cellCenter(this.col, this.row);
        const progress = Math.max(0, Math.min(1, (this.shootTimer || 0) / (this.shootInterval || 16000)));
        ctx.save();
        ctx.translate(c.x, c.y);

        // Progress ring
        const r2 = CELL/2 - 10;
        ctx.beginPath();
        ctx.arc(0,0,r2, -Math.PI/2, -Math.PI/2 + (Math.PI*2*progress), false);
        ctx.strokeStyle = 'rgba(255, 200, 50, 0.9)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255,220,80,0.8)';
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}
