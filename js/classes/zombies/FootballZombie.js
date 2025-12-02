class FootballZombie extends BaseZombie {
    constructor(row) {
        super(row, 'football');
        this.hp = 200;
        this.footballHelmHp = 1600;
        this.maxFootballHelmHp = this.footballHelmHp;
        this.footballHelmActive = true;
        this.speed = 40;
        this.baseSpeed = this.speed;
    }

    takeDamage(amount) {
        if(this.footballHelmActive && this.footballHelmHp > 0){
            this.footballHelmHp -= amount;
            if(this.footballHelmHp <= 0){
                const overflow = -this.footballHelmHp;
                this.footballHelmHp = 0; this.footballHelmActive = false;
                this.hp -= overflow;
            }
            return;
        }
        this.hp -= amount;
        if (this.hp <= 0) this.onDeath();
    }

    drawHP(ctx) {
        super.drawHP(ctx);
        
        if(this.footballHelmActive && this.footballHelmHp > 0){
            const barW = this.width;
            const x = this.x;
            const y = this.y + 8; 
            
            const ratio = Math.max(0, Math.min(1, this.footballHelmHp / (this.maxFootballHelmHp || 1)));
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x, y, barW, 6);
            
            ctx.fillStyle = '#aaa'; // Red for football helmet
            ctx.fillRect(x+1, y+1, Math.max(0, (barW-2)*ratio), 4);
        }
    }
}
