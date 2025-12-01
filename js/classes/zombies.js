function Zombie(row, type){
    this.row = row; this.x = canvas.width + 10; this.y = row*CELL;
    this.type = type || 'normal';
    this.hp = 200; this.speed = 20; // px/sec
    this.maxHp = this.hp;
    this.baseSpeed = this.speed;
    this.slowRemaining = 0; // ms
    this.slowFactor = 0.4; // multiplier while slowed
    this.stunRemaining = 0; // ms (butter effect)
    this.knockbackRemaining = 0; // ms
    this.knockbackSpeed = 0; // px/sec to the right
    this.width = CELL-12; this.height = CELL-12;
    this.targetPlant = null; // plant being attacked
    this.attackPower = 50; // damage per second
    // buckethead specific
    if(this.type === 'bucket'){
        this.bucketHp = 1000; // iron bucket HP
        this.bucketActive = true;
        this.speed = 20;
    }
    // exploder/bomber zombie: fast, medium HP, explodes on death or contact
    if(this.type === 'exploder' || this.type === 'bomber_zombie'){
        this.hp = 200;
        this.maxHp = this.hp;
        this.speed = 40;
        this.baseSpeed = this.speed;
        this._exploder = true;
    }
    // football zombie: high armor, fast speed
    if(this.type === 'football'){
        this.hp = 200;
        this.footballHelmHp = 1600;
        this.footballHelmActive = true;
        this.speed = 40;
        this.baseSpeed = this.speed;
    }
    // football forward (橄榄球前锋): stronger helmet (armor) + faster speed
    if(this.type === 'football_forward'){
        this.hp = 200; // body
        this.footballHelmHp = 2400; // armor
        this.footballHelmActive = true;
        this.speed = 45;
        this.baseSpeed = this.speed;
        this._forward = true; // enables shove behavior
    }
    // gargantuar zombie: high HP, instant kill smash
    if(this.type === 'gargantuar'){
        this.hp = 4500;
        this.maxHp = this.hp;
        this.speed = 15;
        this.baseSpeed = this.speed;
        this.smashTimer = 0;
    }
    // fisher zombie: pulls plants
    if(this.type === 'fisher'){
        this.hp = 400;
        this.maxHp = this.hp;
        this.speed = 20;
        this.baseSpeed = this.speed;
        this.hookCooldown = 0; 
        this.hookChargeTime = 0;
        this.isHooking = false;
    }
}

Zombie.prototype.takeDamage = function(amount){
    // if football helm active, absorb damage first
    if(this.footballHelmActive && this.footballHelmHp > 0){
        this.footballHelmHp -= amount;
        if(this.footballHelmHp <= 0){
            const overflow = -this.footballHelmHp;
            this.footballHelmHp = 0; this.footballHelmActive = false;
            this.hp -= overflow;
        }
        return;
    }

    // if bucket active, absorb damage first
    if(this.bucketActive && this.bucketHp > 0){
        this.bucketHp -= amount;
        if(this.bucketHp <= 0){
            // overflow damage applies to body
            const overflow = -this.bucketHp;
            this.bucketHp = 0; this.bucketActive = false;
            this.hp -= overflow;
        }
    } else {
        this.hp -= amount;
    }
    // if this is an exploder and died, explode immediately
    if((this._exploder) && this.hp <= 0){
        this.explode && this.explode();
    }
}

Zombie.prototype.update = function(dt){
    // update slow timer
    if(this.slowRemaining > 0){
        this.slowRemaining -= dt;
        if(this.slowRemaining <= 0){ this.slowRemaining = 0; }
    }
    // update stun timer
    if(this.stunRemaining > 0){
        this.stunRemaining -= dt;
        if(this.stunRemaining <= 0){ this.stunRemaining = 0; }
        // Stunned zombies cannot move or attack
        return;
    }
    // update knockback timer
    if(this.knockbackRemaining > 0){
        this.knockbackRemaining -= dt;
        if(this.knockbackRemaining <= 0){ this.knockbackRemaining = 0; }
        // If being knocked back, stop attacking!
        this.targetPlant = null;
        this.smashTimer = 0;
    }
    // if currently attacking a plant, apply damage instead of moving
    if(this.targetPlant){
        // validate target still exists in grid and alive
        if(this.targetPlant.hp <= 0 || grid[this.row][this.targetPlant.col] !== this.targetPlant){
            this.targetPlant = null; // target removed or changed
            this.smashTimer = 0;
        } else {
            let actualTarget = this.targetPlant;
            if(this.targetPlant.pumpkin && this.targetPlant.pumpkin.hp > 0){
                actualTarget = this.targetPlant.pumpkin;
            }

            if(this.type === 'gargantuar'){
                this.smashTimer += dt;
                if(this.smashTimer >= 1000){
                    actualTarget.hp = -9999; // Instant kill
                    this.smashTimer = 0;
                    // Visual effect
                    spawnParticles(actualTarget.x + CELL/2, actualTarget.y + CELL/2, '#ff0000', 20, {style: 'spark'});
                }
            } else {
                const dmg = this.attackPower * (dt/1000);
                actualTarget.hp -= dmg;
            }

            // Thorns reflection
            if(actualTarget.type === 'spiky_pumpkin'){
                this.takeDamage(10 * (dt/1000));
            }

            // if plant died, remove from grid and plants array
            if(actualTarget.hp <= 0){
                if(actualTarget === this.targetPlant.pumpkin){
                    this.targetPlant.pumpkin = null;
                    this.smashTimer = 0;
                } else {
                    const col = this.targetPlant.col;
                    grid[this.row][col] = null;
                    const idx = plants.indexOf(this.targetPlant);
                    if(idx >= 0) plants.splice(idx,1);
                    this.targetPlant = null;
                    this.smashTimer = 0;
                }
            }
            return; // attack this frame, do not move
        }
    }

    // check for plant collision in same row
    const zombieLeft = this.x + 6;
    const zombieRight = this.x + 6 + this.width;
    for(let c=0;c<COLS;c++){
        const p = grid[this.row][c];
        if(p){
            const plantLeft = c*CELL;
            const plantRight = plantLeft + CELL;
            // if overlapping/touching plant area -> start attacking (or special shove for forwards)
            if(zombieRight > plantLeft + 6 && zombieLeft < plantRight - 6){
                // if exploder type, explode on contact instead of attacking
                if(this._exploder){
                    this.explode && this.explode();
                    // mark hp=0 so removal will clean it up
                    this.hp = 0;
                    return;
                }
                if(this.knockbackRemaining > 0) continue;

                // football forward: try to shove the plant up or down one cell instead of attacking
                if(this.type === 'football_forward'){
                    const upR = this.row - 1;
                    const downR = this.row + 1;
                    const canUp = (upR >= 0 && !grid[upR][c]);
                    const canDown = (downR < ROWS && !grid[downR][c]);

                    if(canUp && !canDown){
                        // move plant up
                        grid[this.row][c] = null;
                        grid[upR][c] = p;
                        p.row = upR; p.y = upR * CELL;
                        if(p.pumpkin){ p.pumpkin.row = upR; p.pumpkin.y = upR * CELL; }
                        spawnParticles(p.x + CELL/2, p.y + CELL/2, '#ffffff', 10, {style: 'dust'});
                        return;
                    } else if(!canUp && canDown){
                        // move plant down
                        grid[this.row][c] = null;
                        grid[downR][c] = p;
                        p.row = downR; p.y = downR * CELL;
                        if(p.pumpkin){ p.pumpkin.row = downR; p.pumpkin.y = downR * CELL; }
                        spawnParticles(p.x + CELL/2, p.y + CELL/2, '#ffffff', 10, {style: 'dust'});
                        return;
                    } else if(canUp && canDown){
                        // both free -> random choice
                        const targetR = Math.random() < 0.5 ? upR : downR;
                        grid[this.row][c] = null;
                        grid[targetR][c] = p;
                        p.row = targetR; p.y = targetR * CELL;
                        if(p.pumpkin){ p.pumpkin.row = targetR; p.pumpkin.y = targetR * CELL; }
                        spawnParticles(p.x + CELL/2, p.y + CELL/2, '#ffffff', 10, {style: 'dust'});
                        
                        // Force other zombies attacking this plant to stop attacking
                        zombies.forEach(z => {
                            if(z.targetPlant === p){
                                z.targetPlant = null;
                            }
                        });
                        return;
                    } else {
                        // both occupied -> fallback to normal attack
                        this.targetPlant = p;
                        return;
                    }
                }

                this.targetPlant = p;
                return;
            }
        }
    }

    // Fisher zombie hook logic
    if(this.type === 'fisher'){
        if(this.hookCooldown > 0) this.hookCooldown -= dt;

        if(this.isHooking){
            this.hookChargeTime += dt;
            if(this.hookChargeTime >= 1000){
                // Execute hook
                if(this.hookTarget && this.hookTarget.hp > 0 && grid[this.row][this.hookTarget.col] === this.hookTarget){
                    const p = this.hookTarget;
                    const currentCol = p.col;
                    const newCol = currentCol + 1;
                    // Pull forward 1 grid (to the right)
                    if(newCol < COLS && !grid[this.row][newCol]){
                        grid[this.row][currentCol] = null;
                        grid[this.row][newCol] = p;
                        p.col = newCol;
                        p.x = newCol * CELL;
                        if(p.pumpkin){
                            p.pumpkin.col = newCol;
                            p.pumpkin.x = newCol * CELL;
                        }
                        spawnParticles(p.x + CELL/2, p.y + CELL/2, '#ffffff', 10, {style: 'ring'});

                        // Force other zombies attacking this plant to stop attacking
                        zombies.forEach(z => {
                            if(z.targetPlant === p){
                                z.targetPlant = null;
                            }
                        });
                    }
                }
                
                this.isHooking = false;
                this.hookTarget = null;
                this.hookCooldown = 5000;
                this.hookChargeTime = 0;
            }
            return; // Stop moving while hooking
        } else if(this.hookCooldown <= 0){
            // Check if there is a plant ahead to pull
            let bestCol = -1;
            for(let c=0; c<COLS; c++){
                if(grid[this.row][c] && c * CELL < this.x){
                    if(c > bestCol) bestCol = c;
                }
            }
            if(bestCol !== -1){
                this.hookTarget = grid[this.row][bestCol];
                this.isHooking = true;
                this.hookChargeTime = 0;
                return; // Stop moving to start hooking
            }
        }
    }

    // no target, move left using effective speed (consider slow and knockback)
    const dtSec = dt/1000;
    const effSpeed = this.baseSpeed * (this.slowRemaining > 0 ? (this.slowFactor || 0.4) : 1);
    // base forward movement
    this.x -= effSpeed * dtSec;
    // knockback pushes zombie to the right, interpolating towards targetX for a total of 1 cell
    if(this.knockbackRemaining > 0 && this.knockbackSpeed > 0){
        this.x += this.knockbackSpeed * dtSec;
        // clamp to not exceed planned knockback distance
        if(typeof this._knockbackTargetX === 'number' && this.x > this._knockbackTargetX){
            this.x = this._knockbackTargetX;
        }
    }
}

Zombie.prototype.draw = function(ctx){
    const img = zombieImages[this.type];
    if(img && img.complete && img.naturalWidth){
        ctx.drawImage(img, this.x+6, this.y+6, this.width, this.height);
        if(this.slowRemaining > 0){
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = '#0033cc';
            ctx.fillRect(this.x+6, this.y+6, this.width, this.height);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore();
        }
    } else {
        let bodyColor = '#6b6b6b';
        // if slowed, overlay a deep blue tint
        if(this.slowRemaining > 0){
            ctx.save();
            ctx.fillStyle = bodyColor;
            ctx.fillRect(this.x+6, this.y+6, this.width, this.height);
            ctx.fillStyle = 'rgba(0,0,80,0.4)';
            ctx.fillRect(this.x+6, this.y+6, this.width, this.height);
        } else {
            ctx.fillStyle = bodyColor;
            ctx.fillRect(this.x+6, this.y+6, this.width, this.height);
        }
    }

    // Gargantuar smash charge animation
    if(this.type === 'gargantuar' && this.smashTimer > 0){
        const progress = Math.min(1, this.smashTimer / 1000);
        
        // Draw Hammer raising
        ctx.save();
        // Pivot around the center-right of the zombie
        const pivotX = this.x + this.width * 0.7;
        const pivotY = this.y + this.height * 0.4;
        ctx.translate(pivotX, pivotY);
        
        // Rotate back as it charges (0 to -100 degrees)
        const angle = -Math.PI/1.5 * progress;
        ctx.rotate(angle);
        
        // Draw Hammer
        // Handle
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-4, -40, 8, 50); 
        // Head
        ctx.fillStyle = '#424242';
        ctx.fillRect(-15, -55, 30, 20);
        // Highlight on head
        ctx.fillStyle = '#757575';
        ctx.fillRect(-10, -50, 20, 10);
        
        ctx.restore();
    }

    // Fisher hook animation
    if(this.type === 'fisher' && this.isHooking && this.hookTarget){
        ctx.save();
        const progress = Math.min(1, this.hookChargeTime / 1000);
        
        // Zombie rod tip position (approximate)
        const startX = this.x + 10; 
        const startY = this.y + 20;

        // Target position
        const targetX = this.hookTarget.x + CELL/2;
        const targetY = this.hookTarget.y + CELL/2;

        // Interpolate hook position based on progress
        const currentHookX = startX + (targetX - startX) * progress;
        const currentHookY = startY + (targetY - startY) * progress;

        // Draw rod
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 20);
        ctx.lineTo(this.x - 10, this.y + 10); 
        ctx.stroke();
        
        const tipX = this.x - 10;
        const tipY = this.y + 10;

        // Draw line from rod tip to current hook position
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(currentHookX, currentHookY);
        ctx.stroke();
        
        // Draw hook
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(currentHookX, currentHookY, 4, 0, Math.PI*2);
        ctx.fill();
        
        ctx.restore();
    }

    // draw bucket overlay if present
if(this.bucketActive){
        ctx.fillStyle = '#7f6b3b';
        // draw a small bucket on top of the zombie
        ctx.fillRect(this.x+6, this.y+2, this.width, 10);
        // bucket HP text
        ctx.fillStyle = '#fff'; ctx.font='10px Arial';
        ctx.fillText('B:'+Math.max(0,Math.floor(this.bucketHp)), this.x+8, this.y+10);
    }
    // draw football helm overlay if present
    if(this.footballHelmActive){
        // draw a red helmet on top
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(this.x+6, this.y+2, this.width, 12);
        // helm HP text
        ctx.fillStyle = '#fff'; ctx.font='10px Arial';
        ctx.fillText('H:'+Math.max(0,Math.floor(this.footballHelmHp)), this.x+8, this.y+10);
    }

    if(this.slowRemaining > 0){
        ctx.restore();
    }


    // 绘制僵尸头顶血条
    const barW = CELL - 16;
    const x = this.x + 8;

    if(this.type === 'bucket'){
        const bucketMax = 1000;
        const bucketRatio = Math.max(0, Math.min(1, (this.bucketHp || 0) / bucketMax));
        const bucketY = this.y + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, bucketY, barW, HP_BAR_HEIGHT);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x+1, bucketY+1, Math.max(0, (barW-2) * bucketRatio), HP_BAR_HEIGHT-2);
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText(Math.max(0, Math.floor(this.bucketHp || 0)), x + barW/2 - 8, bucketY + HP_BAR_HEIGHT - 1);

        const bodyRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
        const bodyY = bucketY + HP_BAR_HEIGHT + 1;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, bodyY, barW, HP_BAR_HEIGHT);
        ctx.fillStyle = '#e5534b';
        ctx.fillRect(x+1, bodyY+1, Math.max(0, (barW-2) * bodyRatio), HP_BAR_HEIGHT-2);
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText(Math.max(0, Math.floor(this.hp)), x + barW/2 - 8, bodyY + HP_BAR_HEIGHT - 1);
    } else if(this.type === 'football' || this.type === 'football_forward'){
        const helmMax = (this.type === 'football_forward') ? 2400 : 1600;
        const helmRatio = Math.max(0, Math.min(1, (this.footballHelmHp || 0) / helmMax));
        const helmY = this.y + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, helmY, barW, HP_BAR_HEIGHT);
        ctx.fillStyle = '#d32f2f'; // red for football helm
        ctx.fillRect(x+1, helmY+1, Math.max(0, (barW-2) * helmRatio), HP_BAR_HEIGHT-2);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(Math.max(0, Math.floor(this.footballHelmHp || 0)), x + barW/2 - 8, helmY + HP_BAR_HEIGHT - 1);

        const bodyRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
        const bodyY = helmY + HP_BAR_HEIGHT + 1;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, bodyY, barW, HP_BAR_HEIGHT);
        ctx.fillStyle = '#e5534b';
        ctx.fillRect(x+1, bodyY+1, Math.max(0, (barW-2) * bodyRatio), HP_BAR_HEIGHT-2);
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText(Math.max(0, Math.floor(this.hp)), x + barW/2 - 8, bodyY + HP_BAR_HEIGHT - 1);
    } else {
        const bodyRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
        const y = this.y + 2;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x, y, barW, HP_BAR_HEIGHT);
        ctx.fillStyle = '#e5534b';
        ctx.fillRect(x+1, y+1, Math.max(0, (barW-2) * bodyRatio), HP_BAR_HEIGHT-2);
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText(Math.max(0, Math.floor(this.hp)), x + barW/2 - 8, y + HP_BAR_HEIGHT - 1);
    }

    // draw stun effect (butter)
    if(this.stunRemaining > 0){
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y);
        ctx.fillStyle = 'rgba(255, 235, 59, 0.9)'; // Yellow butter
        ctx.fillRect(-12, -15, 24, 18);
        ctx.strokeStyle = '#FBC02D';
        ctx.lineWidth = 2;
        ctx.strokeRect(-12, -15, 24, 18);
        ctx.restore();
    }
}

// explosion behavior for exploder zombies
Zombie.prototype.explode = function(){
    if(this._exploded) return; // only once
    this._exploded = true;
    // center position
    const cx = this.x + this.width/2;
    const cy = this.y + this.height/2;
    // create visual particles
    spawnParticles(cx, cy, '#ff6b6b', 20);
    // damage plants in 3x3 area (centered on this zombie cell)
    const centerCol = Math.floor(cx / CELL);
    const centerRow = Math.floor(cy / CELL);
    for(let r = centerRow - 1; r <= centerRow + 1; r++){
        if(r < 0 || r >= ROWS) continue;
        for(let c = centerCol -1; c <= centerCol + 1; c++){
            if(c < 0 || c >= COLS) continue;
                const p = grid[r][c];
                if(p){
                    // Prioritize pumpkin damage
                    if(p.pumpkin && p.pumpkin.hp > 0){
                        p.pumpkin.hp -= 400;
                        if(p.pumpkin.hp <= 0){
                            p.pumpkin = null;
                        }
                    } else {
                        p.hp -= 400;
                        if(p.hp <= 0){
                            grid[r][c] = null;
                            const pi = plants.indexOf(p);
                            if(pi >= 0) plants.splice(pi,1);
                        }
                    }
                }
        }
    }
}
