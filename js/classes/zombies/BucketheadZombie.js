class BucketheadZombie extends BaseZombie {
    constructor(row) {
        super(row, 'bucket');
        this.bucketHp = 1000; 
        this.maxBucketHp = this.bucketHp;
        this.bucketActive = true;
        this.speed = 20;
        this.baseSpeed = this.speed;
    }

    takeDamage(amount) {
        if(this.bucketActive && this.bucketHp > 0){
            this.bucketHp -= amount;
            if(this.bucketHp <= 0){
                const overflow = -this.bucketHp;
                this.bucketHp = 0; this.bucketActive = false;
                this.hp -= overflow;
            }
        } else {
            this.hp -= amount;
        }
        if (this.hp <= 0) this.onDeath();
    }

    drawHP(ctx) {
        super.drawHP(ctx);
        
        if(this.bucketActive && this.bucketHp > 0){
            const barW = this.width;
            const x = this.x;
            const y = this.y + 8; // Draw above normal HP
            
            const ratio = Math.max(0, Math.min(1, this.bucketHp / (this.maxBucketHp || 1)));
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x, y, barW, 6);
            
            ctx.fillStyle = '#aaa'; // Silver/Grey for bucket
            ctx.fillRect(x+1, y+1, Math.max(0, (barW-2)*ratio), 4);
        }
    }
}
