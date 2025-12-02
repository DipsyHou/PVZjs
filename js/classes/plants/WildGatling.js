class WildGatling extends BasePlant {
    constructor(col, row) {
        super(col, row, 'wild_gatling');
        this.shootInterval = 2000;
        this._wildBurstIndex = 0;
    }

    update(dt) {
        this.shootTimer += dt;

        const burstTimes = [150, 300, 450, 600];
        const hasTarget = zombies.some(z => z.row === this.row && z.x > this.x);
        
        while(this._wildBurstIndex < 4 && this.shootTimer >= burstTimes[this._wildBurstIndex]){
            if(hasTarget){
                const c = cellCenter(this.col,this.row);
                const angles = [-20, -10, 0, 10, 20];
                const speed = 360;
                
                const delayMs = this.shootTimer - burstTimes[this._wildBurstIndex];
                const offsetSec = delayMs / 1000;

                angles.forEach(angleDeg => {
                    const rad = angleDeg * Math.PI / 180;
                    const vx = Math.cos(rad) * speed;
                    const vy = Math.sin(rad) * speed;
                    
                    const startX = c.x + 20 + vx * offsetSec;
                    const startY = c.y + vy * offsetSec;
                    
                    bullets.push(new Bullet(startX, startY, vx, vy, 20, 'pea'));
                });
            }
            this._wildBurstIndex++;
        }

        if(this.shootTimer >= this.shootInterval){
            this.shootTimer = 0;
            this._wildBurstIndex = 0;
        }
    }
}
