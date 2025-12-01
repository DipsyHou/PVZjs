function Bullet(x,y,vx,vy,damage, kind){
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.damage = damage; this.radius=6;
    this.kind = kind || 'generic';
    this.isFire = false; // whether transformed by torchwood
    this.pierce = false; // whether this bullet penetrates zombies
    this.hitSet = null;  // for piercing bullets: track which zombies have been hit
    // for parabolic projectiles we record their spawn and target positions for rendering
    this.startX = x;
    this.startY = y;
    this.targetX = null;
    this.targetY = null;
    this.totalTime = null; // total flight time in seconds
    this.elapsed = 0;      // elapsed time in seconds
    // locked target zombie for parabolic projectiles
    this.target = null;
    this.homing = false; // for corn homing shooter
}

Bullet.prototype.update = function(dt){
    const dtSec = dt/1000;
    this.elapsed += dtSec;

    // Homing logic
    if(this.homing && this.target && this.target.hp > 0){
        const tx = this.target.x + this.target.width/2;
        const ty = this.target.y + this.target.height/2;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist > 0){
            // Adjust velocity towards target
            const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
            const turnRate = 5 * dtSec; // Turn speed
            
            const currentAngle = Math.atan2(this.vy, this.vx);
            const targetAngle = Math.atan2(dy, dx);
            
            // Simple interpolation for angle
            let diff = targetAngle - currentAngle;
            while(diff < -Math.PI) diff += Math.PI*2;
            while(diff > Math.PI) diff -= Math.PI*2;
            
            const newAngle = currentAngle + Math.max(-turnRate, Math.min(turnRate, diff));
            
            this.vx = Math.cos(newAngle) * speed;
            this.vy = Math.sin(newAngle) * speed;
        }
    }

    // linear bullets (peas etc.) still use simple physics
    if(this.kind !== 'watermelon' && this.kind !== 'bomb'){
        this.x += this.vx * dtSec;
        this.y += this.vy * dtSec;
        return;
    }

    // for parabolic projectiles, we move purely by time along precomputed arc
    if(this.totalTime && this.targetX != null && this.targetY != null){
        const t = Math.min(this.elapsed, this.totalTime);
        const g = 1200; // must match launch calculation
        const vx0 = this.vx;
        const vy0 = this.vy;
        this.x = this.startX + vx0 * t;
        this.y = this.startY + vy0 * t + 0.5 * g * t * t;
        // 标记到达终点，但真正的移除和爆炸效果在全局 update 中处理（支持空爆）
        if(this.elapsed >= this.totalTime){
            this._expired = true;
        }
    } else {
        // fallback: simple Euler if metadata missing
        this.x += this.vx * dtSec;
        this.y += this.vy * dtSec;
    }
}

Bullet.prototype.draw = function(ctx){
    if(this.kind === 'watermelon'){
        ctx.fillStyle = '#2e8b57';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font='10px Arial'; ctx.fillText('W', this.x-6, this.y+4);
        return;
    }
    if(this.kind === 'bomb'){
        ctx.fillStyle = '#c0392b';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font='10px Arial'; ctx.fillText('X', this.x-5, this.y+4);
        return;
    }
    if(this.kind === 'citron_plasma'){
        ctx.fillStyle = this.knockback ? '#FF00FF' : '#00FFFF';
        if(this.radius >= 100) ctx.fillStyle = '#FF0066';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        return;
    }
    if(this.kind === 'needle'){
        // 松针：绘制为绿色细长针状（使用细矩形而不是圆点），受火焰增幅后变为橙红
        const len = 26;      // 针的长度
        const half = len/2;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.isFire ? '#ff6b00' : '#2e8b57';
        ctx.beginPath();
        ctx.roundRect(-half, -2, len, 4, 2);
        ctx.fill();
        ctx.restore();
        return;
    }
    if(this.kind === 'corn'){
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI*2); ctx.fill();
        return;
    }
    if(this.kind === 'popcorn'){
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); 
        // Draw a fluffy shape
        for(let i=0; i<5; i++){
            const angle = i * Math.PI * 2 / 5;
            const r = 8;
            ctx.arc(this.x + Math.cos(angle)*5, this.y + Math.sin(angle)*5, r, 0, Math.PI*2);
        }
        ctx.fill();
        return;
    }
    if(this.kind === 'butter'){
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(this.x-8, this.y-6, 16, 12);
        ctx.strokeStyle = '#FBC02D';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x-8, this.y-6, 16, 12);
        return;
    }
    
    // default
    ctx.fillStyle = this.isFire ? '#ff6b00' : '#33cc33';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
}
