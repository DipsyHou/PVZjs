class GargantuarZombie extends BaseZombie {
    constructor(row) {
        super(row, 'gargantuar');
        this.hp = 4500;
        this.maxHp = this.hp;
        this.speed = 15;
        this.baseSpeed = this.speed;
        this.smashTimer = 0;
        this.attackPower = 0; // Gargantuar smashes instead of biting
    }

    update(dt) {
        super.update(dt);
        
        if(this.targetPlant){
            this.smashTimer += dt;
            if(this.smashTimer >= 1000){
                // Smash!
                spawnParticles(this.targetPlant.x + CELL/2, this.targetPlant.y + CELL/2, '#ff0000', 20, {style: 'spark'});
                
                // Deal massive damage to pumpkin or plant
                if(this.targetPlant.pumpkin && this.targetPlant.pumpkin.hp > 0){
                    this.targetPlant.pumpkin.hp = -9999;
                } else {
                    this.targetPlant.hp = -9999;
                }
                
                this.smashTimer = 0;
            }
        } else {
            this.smashTimer = 0;
        }
    }

    draw(ctx) {
        super.draw(ctx);
        
        if(this.targetPlant){
            // Draw Hammer (simple vector graphic)
            ctx.save();
            // Pivot around the zombie's "hand" area
            const pivotX = this.x + this.width * 0.7;
            const pivotY = this.y + this.height * 0.4;
            
            let angle = -Math.PI / 2;
            
            const p = this.smashTimer / 1000;
            angle = -Math.PI/2 - (Math.PI/2 * p);
            
            ctx.translate(pivotX, pivotY);
            ctx.rotate(angle);
            
            // Handle
            ctx.fillStyle = '#654321';
            ctx.fillRect(0, -4, 50, 8);
            
            // Head
            ctx.fillStyle = '#444';
            ctx.fillRect(50, -15, 25, 30);
            
            ctx.restore();
        }
    }
}
