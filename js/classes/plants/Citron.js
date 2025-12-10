class Citron extends BasePlant {
    constructor(col, row) {
        super(col, row, 'citron');
        this.shootInterval = Infinity;
        this.chargeTime = 0;
    }

    update(dt) {
        super.update(dt);
        this.chargeTime += dt;
        if(this.chargeTime > 20000) this.chargeTime = 20000;
    }

    drawHP(ctx) {
        super.drawHP(ctx);
        
        const barW = CELL - 16;
        const x = this.x + 8;
        let y = this.y + 4; 
        if(this.type === 'spiky_pumpkin'){
            y = this.y + CELL - 12;
        }
        const chargeY = y + HP_BAR_HEIGHT + 2;
        const barH = 6;
        const cRatio = this.chargeTime / 20000;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, chargeY, barW, barH);

        let color = '#00FFFF';
        if(this.chargeTime >= 20000) color = '#FF0066';
        else if(this.chargeTime >= 10000) color = '#FF00FF';

        ctx.fillStyle = color;
        ctx.fillRect(x+1, chargeY+1, Math.max(0, (barW-2) * cRatio), barH-2);
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(x + barW/2 - 1, chargeY, 2, barH);
    }

    manualFire() {
        if(this.chargeTime < 1000) return;

        const c = cellCenter(this.col, this.row);
        const effectiveCharge = Math.min(this.chargeTime, 20000);
        
        let bulletLevel = Math.floor(effectiveCharge / 1000);
        let pierceCount = Math.floor(effectiveCharge / 3000);
        let knockback = false;
        let radius = 5 + Math.min(30, effectiveCharge / 500);
        let damage = bulletLevel * 20;
        let isHuge = false;

        if(effectiveCharge >= 10000){
            knockback = true;
        }

        if(effectiveCharge >= 20000){
            pierceCount = 9999;
            isHuge = true;
            radius = 100;
        }

        const b = new Bullet(c.x + 20, c.y, 600, 0, damage, 'citron_plasma');
        b.radius = radius;
        b.pierce = pierceCount;
        if(knockback){
            b.knockbackDist = 80;
            b.knockbackDuration = 300;
        }
        
        this.chargeTime = 0;
        bullets.push(b);
    }
}
