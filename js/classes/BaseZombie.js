class BaseZombie {
    constructor(row, type) {
        this.row = row; 
        this.x = canvas.width + 10; 
        this.y = row*CELL;
        this.type = type || 'normal';
        this.hp = 200; 
        this.speed = 20; // px/sec
        this.maxHp = this.hp;
        this.baseSpeed = this.speed;
        this.slowRemaining = 0; // ms
        this.slowFactor = 0.4; // multiplier while slowed
        this.stunRemaining = 0; // ms (butter effect)
        this.knockbackRemaining = 0; // ms
        this.knockbackSpeed = 0; // px/sec to the right
        this.width = CELL-12; 
        this.height = CELL-12;
        this.targetPlant = null; // plant being attacked
        this.attackPower = 50; // damage per second
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.onDeath();
        }
    }

    onDeath() {
        // Override if needed
    }

    update(dt) {
        // update slow timer
        if(this.slowRemaining > 0){
            this.slowRemaining -= dt;
            if(this.slowRemaining <= 0){ this.slowRemaining = 0; }
        }
        // update stun timer
        if(this.stunRemaining > 0){
            this.stunRemaining -= dt;
            if(this.stunRemaining <= 0){ this.stunRemaining = 0; }
        }
        // update knockback timer
        if(this.knockbackRemaining > 0){
            this.knockbackRemaining -= dt;
            if(this.knockbackRemaining <= 0){ 
                this.knockbackRemaining = 0; 
                this.knockbackSpeed = 0;
            }
        }

        // determine effective speed
        let currentSpeed = this.baseSpeed;
        if(this.slowRemaining > 0) currentSpeed *= this.slowFactor;
        if(this.stunRemaining > 0) currentSpeed = 0;

        // movement logic
        if(this.knockbackRemaining > 0){
            // being knocked back (move right)
            const move = this.knockbackSpeed * (dt/1000);
            this.x += move;
            // if we have a specific target X for knockback, clamp? 
            // (The original code set _knockbackTargetX but didn't seem to use it for clamping in update, 
            // just calculated speed based on it. We'll stick to speed.)
        } else {
            // normal movement (move left)
            // if attacking, speed is 0
            if(this.targetPlant){
                // check if target plant is still there and alive
                if(this.targetPlant.hp <= 0 || !plants.includes(this.targetPlant)){
                    this.targetPlant = null;
                } else {
                    // attack logic
                    const dmg = this.attackPower * (dt/1000);
                    let actualTarget = this.targetPlant;
                    if(this.targetPlant.pumpkin && this.targetPlant.pumpkin.hp > 0){
                        actualTarget = this.targetPlant.pumpkin;
                    }
                    
                    actualTarget.hp -= dmg;

                    // Thorns reflection
                    if(actualTarget.type === 'spiky_pumpkin'){
                        this.takeDamage(20 * (dt/1000));
                    }

                    currentSpeed = 0;
                }
            }
            
            const move = currentSpeed * (dt/1000);
            this.x -= move;
        }

        // collision detection with plants
        // (Only if not already attacking and not being knocked back)
        if(!this.targetPlant && this.knockbackRemaining <= 0){
            // find plant in current cell
            // simple collision box
            const zLeft = this.x + 20; 
            const zRight = this.x + this.width - 20;
            
            // iterate plants in same row
            // We need to access the global 'plants' array
            for(const p of plants){
                if(p.row !== this.row) continue;
                // plant box
                const pLeft = p.x + 10; 
                const pRight = p.x + CELL - 10;
                
                // if overlap
                if(zLeft < pRight && zRight > pLeft){
                    // collision!
                    // if plant is spiky_pumpkin, it might hurt zombie? (Not in original code, spiky just has high HP)
                    // if plant is floating, ignore? (Floating plants usually have hp=0 or are not in grid, but let's check)
                    if(p.floating) continue; 
                    
                    this.targetPlant = p;
                    break; 
                }
            }
        }
    }

    draw(ctx) {
        const img = zombieImages[this.type];
        
        ctx.save();
        if(this.slowRemaining > 0){
            // Apply blue-ish filter for slow effect
            ctx.filter = 'sepia(1) hue-rotate(200deg) saturate(4) brightness(0.7)';
        }

        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x, this.y+6, this.width, this.height);
        } else {
            // fallback
            ctx.fillStyle = '#555';
            ctx.fillRect(this.x, this.y+6, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.fillText('Z', this.x+this.width/2-5, this.y+this.height/2);
        }
        ctx.restore();

        // draw status effects
        if(this.stunRemaining > 0){
            // butter on head
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x + this.width/2 - 10, this.y, 20, 20);
        }
    }

    drawHP(ctx) {
        const barW = this.width;
        const x = this.x;
        const y = this.y; 
        
        const ratio = Math.max(0, Math.min(1, this.hp / (this.maxHp || 1)));
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, barW, 6);
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x+1, y+1, Math.max(0, (barW-2)*ratio), 4);
    }
}
