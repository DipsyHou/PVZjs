function Bullet(x,y,vx,vy,damage, kind){
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.damage = damage; this.radius=6;
    this.kind = kind || 'generic';
    this.isFire = false; // whether transformed by torchwood
    
    // Collision properties
    this.pierce = 0;     // 0: no pierce (die on first hit), N: pierce N zombies
    this.hitSet = null;  // track hit zombies

    // Status effects
    this.stun = 0;             // stun duration in ms
    this.knockbackDist = 0;    // knockback distance in pixels
    this.knockbackDuration = 0;// knockback duration in ms
    this.slowDuration = 0;     // slow duration in ms
    this.slowFactor = 1.0;     // speed multiplier (e.g. 0.5 for 50% slow)

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

    // Interaction with Torchwood
    // only affect straight bullets (pea, needle) that are not already fire
    if((this.kind === 'pea' || this.kind === 'needle' || this.kind === 'corn') && !this.isFire){
        const col = Math.floor(this.x / CELL);
        const row = Math.floor(this.y / CELL);
        if(row >=0 && row < ROWS && col >=0 && col < COLS){
            const p = grid[row][col];
            if(p && p.type === 'torchwood'){
                // convert bullet
                this.isFire = true;
                if(this.kind === 'corn'){
                    this.kind = 'popcorn';
                    this.damage = 40;
                    this.splash = true;
                } else {
                    this.damage = Math.round(this.damage * 2);
                }
            }
        }
    }
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
    } else if(this.totalTime && this.targetX != null && this.targetY != null){
        // for parabolic projectiles, we move purely by time along precomputed arc
        const t = Math.min(this.elapsed, this.totalTime);
        const g = 1200; // must match launch calculation
        const vx0 = this.vx;
        const vy0 = this.vy;
        this.x = this.startX + vx0 * t;
        this.y = this.startY + vy0 * t + 0.5 * g * t * t;
        // 标记到达终点
        if(this.elapsed >= this.totalTime){
            this._expired = true;
        }
    } else {
        // fallback: simple Euler if metadata missing
        this.x += this.vx * dtSec;
        this.y += this.vy * dtSec;
    }

    return this.checkCollisions();
}

Bullet.prototype.explode = function(x, y, splashDamage, radius){
    radius = (typeof radius === 'number') ? radius : CELL;
    spawnParticles(x, y, '#ffb36b', 18, {style: 'spark'});
    
    const radiusSq = radius * radius;

    for(let k=zombies.length-1;k>=0;k--){
        const other = zombies[k];
        const zx = other.x + other.width/2;
        const zy = other.y + other.height/2;
        const dx = zx - x;
        const dy = zy - y;
        
        if(dx*dx + dy*dy <= radiusSq){
            other.takeDamage(splashDamage || 0);
        }
    }
}

Bullet.prototype.checkCollisions = function(){
    // 空爆 / 到达终点
    if(this._expired){
        if(this.kind === 'watermelon'){
            this.explode(this.x, this.y, this.splash, 1.5 * CELL);
        }
        else if(this.kind === 'bomb'){
            this.explode(this.x, this.y, this.splash, 1.5 * CELL);
        }
        return false;
    }

    let hitIndex = -1;
    for(let j=0;j<zombies.length;j++){
        const z = zombies[j];
        // 穿透子弹：同一子弹对同一僵尸只结算一次伤害
        if(this.hitSet && this.hitSet.has(z)) continue;
        
        if(this.kind === 'watermelon' || this.kind === 'bomb'){
            // For parabolic projectiles, only ever hit their locked target
            if(!this.target) continue; // no target -> cannot hit anything
            if(z !== this.target) continue;
            const zx = z.x + z.width/2; const zy = z.y + z.height/2;
            const dx = this.x - zx; const dy = this.y - zy;
            const dist2 = dx*dx + dy*dy;
            const thresh = (z.width/2 + this.radius) * (z.width/2 + this.radius);
            if(dist2 <= thresh){ hitIndex = j; break; }
        } else {
            // Linear collision check
            const zTop = z.y;
            const zBottom = z.y + CELL;
            const bTop = this.y - this.radius;
            const bBottom = this.y + this.radius;
            
            // Check Y overlap
            if(bBottom > zTop && bTop < zBottom){
                // Check X overlap
                if(this.x + this.radius > z.x + 0 && this.x - this.radius < z.x + z.width){
                    hitIndex = j; break;
                }
            }
        }
    }

    if(hitIndex >= 0){
        const z = zombies[hitIndex];
        if(this.kind === 'watermelon'){
            const zx = z.x + z.width/2;
            const zy = z.y + z.height/2;
            z.takeDamage(this.damage);
            this.explode(zx, zy, this.splash, 1.5 * CELL);
        } else if(this.kind === 'bomb'){
            const zx = z.x + z.width/2;
            const zy = z.y + z.height/2;
            z.takeDamage(this.damage);
            this.explode(zx, zy, this.splash, 1.5 * CELL);
        } else if(this.kind === 'popcorn'){
            const zx = z.x + z.width/2;
            const zy = z.y + z.height/2;
            this.explode(zx, zy, this.damage, 0.75 * CELL); // range 0 = single cell
        } else {
            z.takeDamage(this.damage);
        }
        
        // Stun effect
        if(this.stun > 0){
            z.stunRemaining = Math.max(z.stunRemaining || 0, this.stun);
        }

        // Knockback effect
        if(this.knockbackDist > 0 && this.knockbackDuration > 0){
            z.knockbackRemaining = this.knockbackDuration;
            z.knockbackSpeed = this.knockbackDist / (this.knockbackDuration / 1000);
            z._knockbackTargetX = z.x + this.knockbackDist;
            z.targetPlant = null; 
            z.smashTimer = 0;
        }

        // Slow effect
        if(this.slowDuration > 0){
            z.slowRemaining = Math.max(z.slowRemaining || 0, this.slowDuration);
            // Use the stronger slow (lower factor)
            z.slowFactor = Math.min(z.slowFactor !== undefined ? z.slowFactor : 1.0, this.slowFactor);
        }

        // Pierce logic
        if(!this.hitSet) this.hitSet = new Set();
        this.hitSet.add(z);

        if(this.pierce > 0){
            this.pierce--;
            return true; // alive
        } else {
            return false; // dead
        }
    } else if(this.x > canvas.width + 50 || this.y > canvas.height + 50){
        return false; // dead
    }

    return true; // alive
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
        ctx.fillStyle = this.knockbackDuration ? '#FF00FF' : '#00FFFF';
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
