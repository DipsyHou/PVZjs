function Plant(col,row,type){
    this.col = col; this.row = row;
    this.x = col*CELL; this.y = row*CELL;
    this.hp = 200; this.shootTimer = 0; this.shootInterval = 1000; // ms
    this.type = type || 'peashooter';
    this.maxHp = this.hp;
    this.pumpkin = null; // attached pumpkin instance
    // customize for types
    if(this.type === 'spread'){
        this.shootInterval = 1000;
    }
    if(this.type === 'torchwood'){
        this.shootInterval = Infinity;
        this.hp = this.maxHp = 800;
    }
    if(this.type === 'watermelon'){
        this.shootInterval = 3000;
    }
    if(this.type === 'sunflower'){
        // produces sun every 16 seconds
        this.shootInterval = 16000;
    }
    if(this.type === 'bomber'){
        // attacks three rows; fires every 4 seconds
        this.shootInterval = 4000;
    }
    if(this.type === 'trumpet'){
        // uses internal timer for a 3s continuous attraction here; normal shootInterval is unused
        this.shootInterval = Infinity;
        this._trumpetCooldown = 1000; // ms until next attraction window
        this._trumpetActive = false;
        this._trumpetActiveTime = 0; // ms within current attraction window
    }
    if(this.type === 'mimic'){
        this.hp = this.maxHp = 200;
        this._mimicTimer = 3000; // ms until transform
        this._mimicTarget = null; // will be set when placed
    }
    if(this.type === 'pine_shooter'){
        // 松针射手：每秒发射一枚穿透松针
        this.shootInterval = 1000;
        this.hp = this.maxHp = 200;
    }
    if(this.type === 'gold_bloom'){
        this.hp = this.maxHp = 50;
        this.shootInterval = Infinity;
        this._lifeTimer = 0; // counts up to 8000ms
    }
    if(this.type === 'spiky_pumpkin'){
        this.hp = this.maxHp = 4000;
        this.shootInterval = Infinity;
    }
    if(this.type === 'vine_trap'){
        this.hp = this.maxHp = 800;
        this.shootInterval = Infinity;
        this._lifeTimer = 0;
    }
    if(this.type === 'electrode_cherry'){
        this.hp = this.maxHp = 200;
        this.shootInterval = Infinity;
        this._paired = null; // reference to other electrode cherry
        this._beamColor = '#6affff';
        this._beamWidth = 4;
        this._damagePerSec = 90; // DPS when zombie is in beam
        this._beamPulse = 0; // for animation
    }
    if(this.type === 'jalapeno_pair'){
        this.hp = this.maxHp = 10000;
        this.shootInterval = Infinity;
        this._explodeTimer = 1000; // 1 second delay
    }
    if(this.type === 'reshaper' || this.type === 'time_machine'){
        // Floating-type plants: no HP, not placed into grid, and they disappear after 1s
        this.hp = 0;
        this.maxHp = 0;
        this.shootInterval = Infinity;
        this.floating = true;
        this._floatTimer = this.type === 'time_machine' ? 3000 : 1000; // time machine 3s, reshaper 1s
        this._maxFloatTimer = this._floatTimer; // store initial duration for animation
    }
    if(this.type === 'laser_shroom'){
        this.shootInterval = 400;
        this.hp = this.maxHp = 200;
    }
    if(this.type === 'windmill'){
        this.shootInterval = Infinity;
        this.hp = this.maxHp = 200;
    }
    if(this.type === 'wild_gatling'){
        this.shootInterval = 2000; // 整体攻击周期 2s
        this.hp = this.maxHp = 200;
        this._wildBurstIndex = 0;
    }
    if(this.type === 'ninja_nut'){
        this.hp = this.maxHp = 4000;
        this.shootInterval = Infinity;
        this._hasSpawnedExtras = false;
    }
    if(this.type === 'citron'){
        this.hp = this.maxHp = 200;
        this.shootInterval = Infinity; // Manual fire
        this.chargeTime = 0;
    }
    if(this.type === 'corn_homing'){
        this.hp = this.maxHp = 200;
        this.shootInterval = 1000;
    }
}

Plant.prototype.update = function(dt){
    if(this.type === 'citron'){
        this.chargeTime += dt;
        // Cap charge time at 16s for logic consistency (though manualFire caps it too)
        if(this.chargeTime > 20000) this.chargeTime = 20000;
    }

    if(this.type === 'ninja_nut' && !this._hasSpawnedExtras){
        this._hasSpawnedExtras = true;
        // Priority: (0,1)>(0,-1)>(1,0)>(1,1)>(1,-1)>(-1,0)>(-1,1)>(-1,-1)
        // Assuming (col_offset, row_offset)
        const offsets = [
            [0, -1], [0, 1], [1, 0], [1, -1], [1, 1], [-1, 0], [-1, -1], [-1, 1]
        ];
        let spawnedCount = 0;
        for(const offset of offsets){
            if(spawnedCount >= 2) break;
            const targetCol = this.col + offset[0];
            const targetRow = this.row + offset[1];
            
            if(targetCol >= 0 && targetCol < COLS && targetRow >= 0 && targetRow < ROWS){
                if(!grid[targetRow][targetCol]){
                    const p = new Plant(targetCol, targetRow, 'ninja_nut');
                    p._hasSpawnedExtras = true;
                    plants.push(p);
                    grid[targetRow][targetCol] = p;
                    spawnedCount++;

                    spawnParticles(p.x + CELL/2, p.y + CELL/2, '#000000', 5);
                }
            }
        }
    }

    if(this.pumpkin){
        if(this.pumpkin.hp <= 0){
            this.pumpkin = null;
        }
    }
    // Floating-type plants behavior: they act after a short timer then vanish
    if(this.floating){
        if(typeof this._floatTimer === 'number'){
            this._floatTimer -= dt;
            if(this._floatTimer <= 0){
                // perform effect depending on type
                const r = this.row, c = this.col;
                const target = grid[r][c];
                if(this.type === 'reshaper'){
                    // remove plants in the cell, refund their costs and reset their cooldowns
                    let refund = 0;
                    const resetTypes = [];
                    // Ensure we don't target ourselves if we somehow ended up in the grid (e.g. via Mimic)
                    if(target && target !== this){
                        // attached pumpkin
                        if(target.pumpkin){
                            const pk = target.pumpkin;
                            const pkCost = PLANT_CONFIGS[pk.type].cost || PLANT_COST;
                            refund += pkCost;
                            resetTypes.push(pk.type);
                            // if pumpkin somehow is in plants list, remove it
                            const pki = plants.indexOf(pk);
                            if(pki >= 0) plants.splice(pki,1);
                        }
                        const tCost = PLANT_CONFIGS[target.type].cost || PLANT_COST;
                        refund += tCost;
                        resetTypes.push(target.type);
                        // remove main plant from grid and plants array
                        grid[r][c] = null;
                        const ti = plants.indexOf(target);
                        if(ti >= 0) plants.splice(ti,1);
                    }
                    if(refund > 0){
                        sun += refund;
                        document.getElementById('sun-count').textContent = sun;
                    }
                    for(const ty of resetTypes) plantCooldowns[ty] = 0;
                    spawnParticles(this.x + CELL/2, this.y + CELL/2, '#ffd700', 30, {style: 'spark'});
                } else if(this.type === 'time_machine'){
                    // refresh cooldowns of plants in the cell
                    if(target && target !== this){
                        const resetTypes = [];
                        if(target.pumpkin) resetTypes.push(target.pumpkin.type);
                        resetTypes.push(target.type);
                        for(const ty of resetTypes) plantCooldowns[ty] = 0;
                        spawnParticles(this.x + CELL/2, this.y + CELL/2, '#9be7ff', 20, {style: 'spark'});
                    }
                }
                // Safety: ensure we are not in the grid (floating plants shouldn't be there)
                if(grid[this.row][this.col] === this) grid[this.row][this.col] = null;

                // remove this floating plant instance
                const idx = plants.indexOf(this);
                if(idx >= 0) plants.splice(idx,1);
            }
        }
        return; // floating plants do not perform other behavior
    }
    // mimic transformation: after timer expires, replace this plant with the target plant
    if(this.type === 'mimic'){
        if(typeof this._mimicTimer === 'number'){
            this._mimicTimer -= dt;
            if(this._mimicTimer <= 0){
                const idx = plants.indexOf(this);
                if(!this._mimicTarget){
                    if(grid[this.row][this.col] === this) {
                        if(this.pumpkin){
                            grid[this.row][this.col] = this.pumpkin;
                            plants.push(this.pumpkin);
                            this.pumpkin = null;
                        } else {
                            grid[this.row][this.col] = null;
                        }
                    }
                    if(idx >= 0) plants.splice(idx,1);
                    spawnParticles(this.x + CELL/2, this.y + CELL/2, '#999999', 8, {style: 'spark'});
                    return;
                }
                // determine target type
                const targetType = this._mimicTarget;

                // Prevent stacking pumpkins via mimic
                if(this.pumpkin && targetType === 'spiky_pumpkin'){
                    if(grid[this.row][this.col] === this) {
                        grid[this.row][this.col] = this.pumpkin;
                        plants.push(this.pumpkin);
                        this.pumpkin = null;
                    }
                    if(idx >= 0) plants.splice(idx,1);
                    spawnParticles(this.x + CELL/2, this.y + CELL/2, '#999999', 8, {style: 'spark'});
                    return;
                }

                // create new plant instance of that type in same cell
                const newP = new Plant(this.col, this.row, targetType);
                // preserve exact position
                newP.x = this.x; newP.y = this.y;
                
                // replace in plants array
                if(idx >= 0) plants[idx] = newP;

                if(newP.floating){
                    // Floating plants (like reshaper) should not be in the grid.
                    // If mimic was in the grid, remove it.
                    if(grid[this.row][this.col] === this){
                        if(this.pumpkin){
                            // If mimic had a pumpkin, the pumpkin stays and becomes the main plant
                            grid[this.row][this.col] = this.pumpkin;
                            plants.push(this.pumpkin);
                            this.pumpkin = null;
                        } else {
                            grid[this.row][this.col] = null;
                        }
                    }
                    // newP is already in plants array, so it will update/draw.
                } else {
                    // Normal plants: transfer pumpkin and update grid
                    if(this.pumpkin){
                        newP.pumpkin = this.pumpkin;
                        this.pumpkin = null;
                    }
                    if(grid[this.row][this.col] === this) grid[this.row][this.col] = newP;
                }
                // visual flourish
                spawnParticles(this.x + CELL/2, this.y + CELL/2, '#ffd700', 120, {style: 'spark'});
                return; // stop further update for old mimic
            }
        }
    }
    // special behavior: iced coconut starts rolling immediately when placed
    if(this.type === 'iced_coconut'){
        if(!this._rollingStarted){
            this._rollingStarted = true;
            // roll up to 4 cells or until right edge
            const maxCells = Math.min(4, COLS - 1 - this.col);
            this.rollRemaining = maxCells * CELL;
            this.rollSpeed = 320;
            this.vx = this.rollSpeed;
            this.knocked = new Set();
            // free initial grid cell so other plants can be placed
            if(grid[this.row][this.col] === this) {
                if(this.pumpkin){
                    grid[this.row][this.col] = this.pumpkin;
                    plants.push(this.pumpkin);
                    this.pumpkin = null;
                } else {
                    grid[this.row][this.col] = null;
                }
            }
        }
        const dtSec = dt/1000;
        const move = this.vx * dtSec;
        this.x += move;
        this.rollRemaining -= move;

        // handle collisions with zombies in same row
        for(const z of zombies){
            if(z.row !== this.row) continue;
            if(this.knocked && this.knocked.has(z)) continue; // avoid multiple knockbacks to same zombie
            // plant bounding box
            const plantLeft = this.x + 8;
            const plantRight = plantLeft + (CELL - 16);
            const zLeft = z.x + 6;
            const zRight = z.x + z.width;
            if(plantRight > zLeft && plantLeft < zRight){
                // knockback target zombie exactly 1 cell to the right
                const targetX = z.x + CELL;
                // 计算一段时间内平滑移动到 targetX，这里取 0.25s
                const duration = 500; // ms
                z.knockbackRemaining = Math.max(z.knockbackRemaining || 0, duration);
                // knockbackSpeed 让总位移接近 1 格
                z.knockbackSpeed = (CELL / (duration / 1000)); // px/sec
                z._knockbackTargetX = targetX;
                // 伤害
                z.takeDamage(100);
                this.knocked.add(z);
            }
        }

        // check end of roll: traveled required distance or reached rightmost playable column
        if(this.rollRemaining <= 0 || this.x >= (COLS-1) * CELL){
            // explode: apply slow to 3x3 area centered on current cell, with extra icy burst effect
            const cx = this.x + CELL/2;
            const cy = this.y + CELL/2;
            const centerCol = Math.floor(cx / CELL);
            const centerRow = this.row;
            // main icy particles
            spawnParticles(cx, cy, '#aee7ff', 26);
            // a secondary ring of slightly darker blue
            spawnParticles(cx, cy, '#4da3ff', 10);

            // Blue smoke explosion effect
            for(let i=0; i<20; i++){
                const angle = Math.random() * Math.PI * 2;
                const speed = 20 + Math.random() * 80;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                particles.push({
                    x: cx, 
                    y: cy, 
                    vx: vx, 
                    vy: vy, 
                    life: 400 + Math.random()*400, 
                    maxLife: 800, 
                    color: `rgba(174, 231, 255, 0.6)`, 
                    size: 10 + Math.random()*20,
                    gravity: -30 // float up slightly
                });
            }

            for(let k=zombies.length-1;k>=0;k--){
                const other = zombies[k];
                const col = Math.floor((other.x + other.width/2) / CELL);
                const row = Math.floor((other.y + other.height/2) / CELL);
                if(Math.abs(col - centerCol) <= 1 && Math.abs(row - centerRow) <= 1){
                    other.slowRemaining = Math.max(other.slowRemaining || 0, 10000);
                    other.slowFactor = 0.4;
                    other.takeDamage(300);
                }
            }
            // remove this plant
            const idx = plants.indexOf(this);
            if(idx >= 0) plants.splice(idx,1);
        }
        return;
    }
    // special behavior: trumpet (喇叭花)
    // - Attraction is a 3s continuous window, then cooldown (2s) before next window.
    // - Only affects non-parabolic bullets (ignores 'watermelon' and 'bomb').
    if(this.type === 'trumpet'){
        const centerCol = this.col;
        const centerRow = this.row;
        const minCol = Math.max(0, centerCol - 1);
        const maxCol = Math.min(COLS-1, centerCol + 1);
        const minRow = Math.max(0, centerRow - 1);
        const maxRow = Math.min(ROWS-1, centerRow + 1);
        const targetY = centerRow * CELL + CELL/2;

        // 更新冷却与持续时间（单位 ms）
        if(!this._trumpetActive){
            this._trumpetCooldown -= dt;
            if(this._trumpetCooldown <= 0){
                // 开启新的 3s 吸附窗口，同时重置音波时间，从近处重新扩散
                this._trumpetActive = true;
                this._trumpetActiveTime = 0;
                this._trumpetWaveTime = 0;
            }
        }

        if(this._trumpetActive){
            this._trumpetActiveTime += dt;
            // 吸附逻辑：持续 3 秒，每帧都对范围内子弹生效
            for(const b of bullets){
                // 1) 排除投掷类子弹（西瓜和炸弹）
                if(b.kind === 'watermelon' || b.kind === 'bomb') continue;
                const col = Math.floor(b.x / CELL);
                const row = Math.floor(b.y / CELL);
                if(col >= minCol && col <= maxCol && row >= minRow && row <= maxRow){
                    // 轻微插值到喇叭花所在行，避免瞬移太突兀
                    const targetYLocal = targetY;
                    const lerpFactor = 0.1; // 25% 逐渐拉近
                    b.y = b.y + (targetYLocal - b.y) * lerpFactor;
                    const speed = Math.sqrt(b.vx*b.vx + b.vy*b.vy) || 350;
                    b.vx = Math.abs(speed);
                    b.vy = 0;
                }
            }

            // 喇叭花音波特效：在 3s 窗口内持续绘制向外扩散的音波环（记录时间用于 draw）
            this._trumpetWaveTime = (this._trumpetWaveTime || 0) + dt;

            if(this._trumpetActiveTime >= 3000){
                this._trumpetActive = false;
                this._trumpetCooldown = 3000; // 3s 冷却后再开启下一次 3s 吸附
            }
        }
        return;
    }

    // Laser Shroom logic
    if(this.type === 'laser_shroom'){
        this.shootTimer += dt;
        if(this.shootTimer >= this.shootInterval){
            // Check if any zombie is in 5x5 range (radius 2)
            const hasTarget = zombies.some(z => {
                const zCol = Math.floor((z.x + z.width/2) / CELL);
                const zRow = Math.floor((z.y + z.height/2) / CELL);
                return Math.abs(zCol - this.col) <= 2 && Math.abs(zRow - this.row) <= 2;
            });

            if(hasTarget){
                this.shootTimer = 0;
                
                // Define the 8 directions and their relative offsets for 2 cells length
                // (dx, dy) for each step. We check 2 steps in each direction.
                const directions = [
                    [1, 0],   // Right
                    [1, 1],   // Down-Right
                    [0, 1],   // Down
                    [-1, 1],  // Down-Left
                    [-1, 0],  // Left
                    [-1, -1], // Up-Left
                    [0, -1],  // Up
                    [1, -1]   // Up-Right
                ];

                // Collect all affected cells (including self)
                const affectedCells = new Set();
                // Add self
                affectedCells.add(`${this.col},${this.row}`);

                directions.forEach(dir => {
                    for(let i=1; i<=2; i++){
                        const c = this.col + dir[0] * i;
                        const r = this.row + dir[1] * i;
                        if(c >= 0 && c < COLS && r >= 0 && r < ROWS){
                            affectedCells.add(`${c},${r}`);
                        }
                    }
                });

                // Visual effect: Laser beams
                this.laserActiveTime = 200; // Show laser for 150ms

                // Apply damage to zombies in affected cells
                zombies.forEach(z => {
                    const zCol = Math.floor((z.x + z.width/2) / CELL);
                    const zRow = Math.floor((z.y + z.height/2) / CELL);
                    if(affectedCells.has(`${zCol},${zRow}`)){
                        z.takeDamage(20);
                    }
                });
            } else {
                this.shootTimer = this.shootInterval; // Keep charged
            }
        }
        
        if(this.laserActiveTime > 0){
            this.laserActiveTime -= dt;
        }
        return;
    }

    // special behavior: gold_bloom (黄金蓓蕾)
    if(this.type === 'gold_bloom'){
        this._lifeTimer += dt;
        if(this._lifeTimer >= 8000){
            // Produce 500 sun
            sun += 500;
            document.getElementById('sun-count').textContent = sun;
            
            // Visual effects
            const cx = this.x + CELL/2;
            const cy = this.y + CELL/2;
            spawnParticles(cx, cy, '#ffd700', 30, {style: 'spark'}); // Gold particles
            
            // Remove self
            const idx = plants.indexOf(this);
            if(idx >= 0) plants.splice(idx, 1);
            if(grid[this.row][this.col] === this) {
                if(this.pumpkin){
                    grid[this.row][this.col] = this.pumpkin;
                    plants.push(this.pumpkin);
                    this.pumpkin = null;
                } else {
                    grid[this.row][this.col] = null;
                }
            }
        }
        return;
    }
    // Vine Trap logic
    if(this.type === 'vine_trap'){
        this._lifeTimer += dt;
        if(this._lifeTimer >= 15000){
            // Expire
            const idx = plants.indexOf(this);
            if(idx >= 0) plants.splice(idx, 1);
            if(grid[this.row][this.col] === this) {
                if(this.pumpkin){
                    grid[this.row][this.col] = this.pumpkin;
                    plants.push(this.pumpkin);
                    this.pumpkin = null;
                } else {
                    grid[this.row][this.col] = null;
                }
            }
            return;
        }

        // Apply slow to zombies in 3x3 area
        const centerCol = this.col;
        const centerRow = this.row;
        for(const z of zombies){
            const zCol = Math.floor((z.x + z.width/2) / CELL);
            const zRow = Math.floor((z.y + z.height/2) / CELL);
            if(Math.abs(zCol - centerCol) <= 1 && Math.abs(zRow - centerRow) <= 1){
                z.slowRemaining = Math.max(z.slowRemaining || 0, 200); // Apply short slow constantly
                z.slowFactor = 0.5; // 50% slow
            }
        }
        return;
    }

    // Electrode Cherry: link with another cherry to form damaging electric beam
    if(this.type === 'electrode_cherry'){
        // ensure life / pairing
        if(!this._paired){
            // find nearest unpaired electrode cherry
            let best = null; let bestDist = Infinity;
            for(const p of plants){
                if(p === this) continue;
                if(p.type !== 'electrode_cherry') continue;
                if(p._paired) continue;
                const dx = p.x - this.x; const dy = p.y - this.y;
                const d = Math.sqrt(dx*dx + dy*dy);
                if(d < bestDist){ bestDist = d; best = p; }
            }
            if(best){
                this._paired = best;
                best._paired = this;
            }
        } else {
            // if partner died or removed, unlink
            if(plants.indexOf(this._paired) < 0 || this._paired.hp <= 0){
                this._paired = null;
            }
        }

        // Damage application along the segment
        if(this._paired){
            // beam pulse for animation
            this._beamPulse = (this._beamPulse || 0) + dt/1000;
            // compute segment endpoints
            const a = { x: this.x + CELL/2, y: this.y + CELL/2 };
            const b = { x: this._paired.x + CELL/2, y: this._paired.y + CELL/2 };
            const segDx = b.x - a.x, segDy = b.y - a.y;
            const segLen2 = segDx*segDx + segDy*segDy;

            for(const z of zombies){
                // point to segment distance
                const px = z.x + z.width/2, py = z.y + z.height/2;
                let t = 0;
                if(segLen2 > 0){
                    t = ((px - a.x) * segDx + (py - a.y) * segDy) / segLen2;
                    t = Math.max(0, Math.min(1, t));
                }
                const projX = a.x + segDx * t;
                const projY = a.y + segDy * t;
                const ddx = px - projX, ddy = py - projY;
                const dist = Math.sqrt(ddx*ddx + ddy*ddy);
                const hitRadius = 14; // px tolerance for beam
                if(dist <= hitRadius){
                    // apply continuous damage scaled by dt
                    const dmg = this._damagePerSec * (dt/1000);
                    z.takeDamage(dmg);
                    // tiny green spark
                    spawnParticles(projX, projY, this._beamColor, 1, {style: 'spark'});
                }
            }
        }
        return;
    }

    // special behavior: jalapeno_pair (火爆双椒)
    if(this.type === 'jalapeno_pair'){
        this._explodeTimer -= dt;
        if(this._explodeTimer <= 0){
            // Explode!
            const damage = 1800;
            const centerCol = this.col;
            const centerRow = this.row;

            // Visuals: Fire along the row
            for(let c=0; c<COLS; c++){
                const cx = c*CELL + CELL/2;
                const cy = centerRow*CELL + CELL/2;
                spawnParticles(cx, cy, '#ff4500', 10);
                spawnParticles(cx, cy, '#ff8c00', 5);
            }
            // Visuals: Fire along the column
            for(let r=0; r<ROWS; r++){
                const cx = centerCol*CELL + CELL/2;
                const cy = r*CELL + CELL/2;
                spawnParticles(cx, cy, '#ff4500', 10);
                spawnParticles(cx, cy, '#ff8c00', 5);
            }

            // Damage zombies in row OR column
            for(let k=zombies.length-1; k>=0; k--){
                const z = zombies[k];
                const zCol = Math.floor((z.x + z.width/2) / CELL);
                
                if(z.row === centerRow || zCol === centerCol){
                    z.takeDamage(damage);
                    // Extra visual hit
                    spawnParticles(z.x + z.width/2, z.y + z.height/2, '#fff', 5);
                }
            }

            // Remove self
            const idx = plants.indexOf(this);
            if(idx >= 0) plants.splice(idx, 1);
            if(grid[this.row][this.col] === this) {
                if(this.pumpkin){
                    grid[this.row][this.col] = this.pumpkin;
                    plants.push(this.pumpkin);
                    this.pumpkin = null;
                } else {
                    grid[this.row][this.col] = null;
                }
            }
        }
        return;
    }
    this.shootTimer += dt;

    // 狂野机枪豌豆：0, 0.1, 0.2, 0.3s 连发
    if(this.type === 'wild_gatling'){
        const burstTimes = [50, 200, 350, 500];
        // 简单检测是否有目标
        const hasTarget = zombies.some(z => z.row === this.row && z.x > this.x);
        
        while(this._wildBurstIndex < 4 && this.shootTimer >= burstTimes[this._wildBurstIndex]){
            if(hasTarget){
                const c = cellCenter(this.col,this.row);
                const angles = [-20, -10, 0, 10, 20];
                const speed = 360;
                
                // 计算时间差带来的位置偏移，防止后台挂起后重叠
                // delayMs 是子弹本该发射的时间距离现在的毫秒数
                const delayMs = this.shootTimer - burstTimes[this._wildBurstIndex];
                const offsetSec = delayMs / 1000;

                angles.forEach(angleDeg => {
                    const rad = angleDeg * Math.PI / 180;
                    const vx = Math.cos(rad) * speed;
                    const vy = Math.sin(rad) * speed;
                    
                    // 初始位置加上偏移量
                    const startX = c.x + 20 + vx * offsetSec;
                    const startY = c.y + vy * offsetSec;
                    
                    bullets.push(new Bullet(startX, startY, vx, vy, 20, 'pea'));
                });
            }
            this._wildBurstIndex++;
        }
    }

    if(this.shootTimer >= this.shootInterval){
        this.shootTimer = 0;
        if(this.type === 'wild_gatling'){
            this._wildBurstIndex = 0;
            return;
        }
        // sunflower produces sun instead of shooting
        if(this.type === 'sunflower'){
            sun += 25;
            document.getElementById('sun-count').textContent = sun;
            // small particle effect
            const c = cellCenter(this.col, this.row);
            spawnParticles(c.x, c.y - 6, '#ffd400', 8, {style: 'spark'});
            return;
        }

        // determine if we should shoot:
        let hasTargetAhead = false;
        if(this.type === 'spread'){
            hasTargetAhead = zombies.some(z => z.x > this.x);
        }
        else if(this.type === 'bomber'){
            hasTargetAhead = zombies.some(z => Math.abs(z.row - this.row) <= 1 && z.x > this.x);
        }
        else if(this.type === 'corn_homing'){
            hasTargetAhead = zombies.length > 0;
        }
        else {
            hasTargetAhead = zombies.some(z => z.row === this.row && z.x > this.x);
        }
        if(!hasTargetAhead) return;

        let windmillBoost = 1;
        if(this.type === 'bomber' || this.type === 'watermelon'){
            for(let cIdx = 0; cIdx < this.col; cIdx++){
                const p = grid[this.row][cIdx];
                if(p && p.type === 'windmill'){
                    windmillBoost = 1.5;
                    break; 
                }
            }
        }

        const c = cellCenter(this.col,this.row);

        if(this.type === 'peashooter'){
            // single forward bullet
            bullets.push(new Bullet(c.x + 20, c.y, 360, 0, 20, 'pea'));
        }else if(this.type === 'pine_shooter'){
            const speed = 720;
            const b = new Bullet(c.x + 20, c.y, speed, 0, 20, 'needle');
            b.radius = 4;
            b.pierce = true;
            bullets.push(b);
        }else if(this.type === 'corn_homing'){
            // Find leftmost zombie
            let target = null;
            let minX = Infinity;
            for(const z of zombies){
                if(z.x < minX){
                    minX = z.x;
                    target = z;
                }
            }
            
            if(target){
                // Determine bullet type
                const rand = Math.random();
                let kind = 'corn';
                let damage = 20;
                let stun = false;
                let splash = false;
                
                if(rand < 0.75){
                    // Corn Kernel (75%)
                    kind = 'corn';
                    damage = 20;
                } else {
                    // Butter (25%)
                    kind = 'butter';
                    damage = 40;
                    stun = true;
                }
                
                // Initial velocity: Up and slightly random X
                const b = new Bullet(c.x + 20, c.y, 360, 0, damage, kind);
                b.homing = true;
                b.target = target;
                b.stun = stun;
                b.splash = splash;
                bullets.push(b);
            }
        }else if(this.type === 'bomber'){
            // For each of three rows (row-1, row, row+1), throw up to 2 bombs at nearest zombies on that row
            const rows = [this.row-1, this.row, this.row+1];
            const g = 1200;
            for(const rr of rows){
                if(rr < 0 || rr >= ROWS) continue;
                // collect zombies on this row to the right of the plant
                const candidates = zombies.filter(z => z.row === rr && z.x > this.x);
                if(candidates.length === 0) continue;
                // sort by distance
                candidates.sort((a,b)=> (a.x - this.x) - (b.x - this.x));
                // take up to 2 targets
                for(let k=0;k<Math.min(2,candidates.length);k++){
                    const target = candidates[k];
                    const startX = c.x + 20;
                    const startY = c.y;
                    const targetX = target.x + target.width/2;
                    const targetY = target.y + target.height/2;
                    const dx = targetX - startX;
                    const dy = targetY - startY;
                    let t = Math.max(0.35, Math.min(1.0, Math.abs(dx) / 450));
                    const vx = dx / t;
                    const vy = (dy - 0.5 * g * t * t) / t;
                    const bm = new Bullet(startX, startY, vx, vy, 100 * windmillBoost, 'bomb');
                    bm.startX = startX; bm.startY = startY;
                    bm.targetX = targetX; bm.targetY = targetY;
                    bm.totalTime = t;
                    bm.radius = 16;
                    bm.target = target;
                    // originRow for bombs should be the intended target row so they only hit that row
                    bm.originRow = target.row;
                    bm.splash = 200 * windmillBoost; // 3x3 area 200 damage
                    bullets.push(bm);
                }
            }
        }else if(this.type === 'spread'){
            // fire 5 bullets evenly from -45 to 45 degrees
            const count = 5;
            const minDeg = -45, maxDeg = 45;
            const speed = 360; // px/sec
            for(let i=0;i<count;i++){
                const t = count === 1 ? 0.5 : i/(count-1); // 0..1
                const deg = minDeg + t*(maxDeg-minDeg);
                const rad = deg * Math.PI/180;
                const vx = Math.cos(rad) * speed;
                const vy = Math.sin(rad) * speed; // positive y is down
                bullets.push(new Bullet(c.x + 20, c.y, vx, vy, 15, 'pea'));
            }
        }else if(this.type === 'watermelon'){
            // find nearest zombie on same row to the right
            let target = null;
            let bestDist = Infinity;
            for(const z of zombies){
                if(z.row === this.row && z.x > this.x){
                    const d = z.x - this.x;
                    if(d < bestDist){ bestDist = d; target = z; }
                }
            }
            if(!target) return;
            if(!target) return;
            const startX = c.x + 20;
            const startY = c.y;
            const targetX = target.x + target.width/2;
            const targetY = target.y + target.height/2;
            const dx = targetX - startX;
            const dy = targetY - startY;
            const g = 1200; // gravity px/s^2
            // choose time to impact based on distance (clamp)
            let t = Math.max(0.4, Math.min(1.2, Math.abs(dx) / 400));
            const vx = dx / t;
            const vy = (dy - 0.5 * g * t * t) / t;
            const wm = new Bullet(startX, startY, vx, vy, 80 * windmillBoost, 'watermelon');
            wm.startX = startX; wm.startY = startY;
            wm.targetX = targetX; wm.targetY = targetY;
            wm.totalTime = t;
            wm.radius = 14;
            wm.target = target;
            wm.originRow = this.row;
            wm.splash = 40 * windmillBoost;
            bullets.push(wm);
        }
    }
}

Plant.prototype.draw = function(ctx){
    let shouldHighlight = false;
    if (shovelMode) {
        const {col, row} = worldToCell(mouseX, mouseY);
        if (this.col === col && this.row === row) {
            const relY = mouseY % CELL;
            const isBottom = relY > CELL / 2;
            const mainPlant = grid[this.row][this.col];
            if (mainPlant === this) {
                if (this.pumpkin) {
                    if (!isBottom) shouldHighlight = true;
                } else {
                    shouldHighlight = true;
                }
            } else if (mainPlant && mainPlant.pumpkin === this) {
                if (isBottom) shouldHighlight = true;
            }
        }
    }
    if(shouldHighlight){
        ctx.save();
        ctx.filter = 'brightness(1.5)';
    }

    // 如果有对应的静态图片资源，优先使用图片绘制
    const img = plantImages[this.type];
    if(img && img.complete && img.naturalWidth){
        if(this.type === 'spiky_pumpkin'){
            // Flatten and move down to avoid blocking the plant inside
            // CELL=80. Draw at y+32 with height 40 (squashed)
            ctx.drawImage(img, this.x+8, this.y+32, CELL-16, 40);
        } else {
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        }
    }
    else {
        // 回退到原来的色块+字母样式
        let color = '#2e8b57';
        let label = 'P';
        if(this.type === 'spread'){ color = '#c75b5b'; label = 'S'; }
        else if(this.type === 'torchwood'){ color = '#8b5b3c'; label = 'T'; }
        else if(this.type === 'watermelon'){ color = '#3aa0b8'; label = 'W'; }
        else if(this.type === 'sunflower'){ color = '#f1c40f'; label = '☀'; }
        else if(this.type === 'bomber'){ color = '#000000'; label = 'B'; }
        else if(this.type === 'iced_coconut'){ color = '#7fd3ff'; label = 'C'; }
        else if(this.type === 'trumpet'){ color = '#f39c12'; label = 'L'; }
        else if(this.type === 'pine_shooter'){ color = '#2e8b57'; label = '松'; }
        else if(this.type === 'mimic'){ color = '#9966cc'; label = 'M'; }
        ctx.fillStyle = color;
        ctx.fillRect(this.x+8, this.y+8, CELL-16, CELL-16);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, this.x+CELL/2-6, this.y+CELL/2+6);
    }

    // 喇叭花的音波特效：根据 _trumpetWaveTime 画向外扩散的同心弧形
    if(this.type === 'trumpet' && this._trumpetActive && this._trumpetWaveTime){
        const c = cellCenter(this.col, this.row);
        const t = this._trumpetWaveTime / 1000; // 秒
        const maxRadius = CELL * 1.5;
        const baseRadius = CELL * 0.5;
        const radius = baseRadius + (maxRadius - baseRadius) * Math.min(1, t / 3);
        ctx.save();
        ctx.strokeStyle = `rgba(236, 112, 255, 0.4)`;
        ctx.lineWidth = 3;
        // 画一个右侧张开的“音波”弧形
        ctx.beginPath();
        ctx.arc(c.x, c.y, radius, -Math.PI/4, Math.PI/4);
        ctx.stroke();
        // 内侧再画一圈小一点的弧形
        ctx.beginPath();
        ctx.arc(c.x, c.y, radius * 0.7, -Math.PI/4, Math.PI/4);
        ctx.stroke();
        ctx.restore();
    }

    // 黄金蓓蕾特效
    if(this.type === 'gold_bloom' && this._lifeTimer < 8000){
        const c = cellCenter(this.col, this.row);
        const progress = this._lifeTimer / 8000;
        
        ctx.save();
        ctx.translate(c.x, c.y);
        
        // 底部光晕
        const glowSize = (CELL/2) * (0.5 + 0.5 * progress);
        const gradient = ctx.createRadialGradient(0, 0, glowSize * 0.2, 0, 0, glowSize);
        gradient.addColorStop(0, `rgba(255, 215, 0, ${0.2 + 0.3 * progress})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI*2);
        ctx.fill();

        // 充能进度条
        const r = CELL/2 - 8;
        ctx.beginPath();
        ctx.arc(0, 0, r, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress), false);
        ctx.strokeStyle = 'rgba(255, 223, 0, 0.8)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.restore();
    }

    // 向日葵生长/发光特效（类似黄金蓓蕾，但为循环进度）
    if(this.type === 'sunflower'){
        const c = cellCenter(this.col, this.row);
        const progress = Math.max(0, Math.min(1, (this.shootTimer || 0) / (this.shootInterval || 16000)));
        ctx.save();
        ctx.translate(c.x, c.y);

        // 进度环
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

    // 藤蔓陷阱范围特效
    if(this.type === 'vine_trap'){
        ctx.save();
        const centerC = cellCenter(this.col, this.row);
        
        ctx.strokeStyle = 'rgba(34, 139, 34, 0.5)';
        ctx.lineCap = 'round';
        
        // 绘制从中心向周围8格延伸的藤蔓
        for(let r = this.row - 1; r <= this.row + 1; r++){
            for(let c = this.col - 1; c <= this.col + 1; c++){
                if(r === this.row && c === this.col) continue; // 跳过中心
                if(r < 0 || r >= ROWS || c < 0 || c >= COLS) continue; // 边界检查
                
                const baseTargetC = cellCenter(c, r);

                // 绘制多条交织的藤蔓以增加密集感
                for(let i=0; i<1; i++){
                    // 为每一条藤蔓计算独立的终点偏移
                    // 静态分散 + 动态摆动
                    const spreadX = ((c * r * (i+1) * 13) % 40) - 20; 
                    const spreadY = ((c * r * (i+1) * 17) % 40) - 20;
                    
                    const endSwayX = Math.sin(this._lifeTimer / (800 + i*100) + c * 123 + i) * 15;
                    const endSwayY = Math.cos(this._lifeTimer / (900 + i*100) + r * 456 + i) * 15;
                    
                    const targetX = baseTargetC.x + spreadX + endSwayX;
                    const targetY = baseTargetC.y + spreadY + endSwayY;

                    const dx = targetX - centerC.x;
                    const dy = targetY - centerC.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist <= 0) continue;

                    const nx = -dy / dist;
                    const ny = dx / dist;
                    const midX = (centerC.x + targetX) / 2;
                    const midY = (centerC.y + targetY) / 2;

                    ctx.beginPath();
                    ctx.moveTo(centerC.x, centerC.y);
                    
                    // 每条藤蔓有不同的摆动频率和偏移
                    const sway = Math.sin(this._lifeTimer / (400 + i*200) + (c * r) + i) * (15 + i*5);
                    const offset = (i - 1) * 10; // 曲线控制点的偏移

                    ctx.quadraticCurveTo(
                        midX + nx * (sway + offset), 
                        midY + ny * (sway + offset), 
                        targetX, 
                        targetY
                    );
                    ctx.lineWidth = 3 - i*0.5;
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    }

    // Electrode Cherry drawing: draw beam between paired cherries
    if(this.type === 'electrode_cherry' && this._paired){
        ctx.save();
        const a = cellCenter(this.col, this.row);
        const b = cellCenter(this._paired.col, this._paired.row);
        const pulse = (this._beamPulse || 0);

        // Outer glow
        ctx.strokeStyle = this._beamColor;
        ctx.globalAlpha = 0.5 + 0.25 * Math.sin(pulse * 6);
        ctx.lineWidth = this._beamWidth + 2;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

        // Inner bright core
        ctx.strokeStyle = '#e6ffff';
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = Math.max(1, this._beamWidth - 1);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

        // Sparks along beam
        for(let i=0;i<6;i++){
            const t = (i/5 + (pulse % 1) * 0.2) % 1;
            const sx = a.x + (b.x - a.x) * t;
            const sy = a.y + (b.y - a.y) * t;
            ctx.fillStyle = this._beamColor;
            ctx.beginPath(); ctx.arc(sx + Math.sin(pulse*10+i)*2, sy + Math.cos(pulse*11+i)*2, 1.5, 0, Math.PI*2); ctx.fill();
        }

        // little electrode nodes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    }

    // Laser Shroom laser beam drawing
    if(this.type === 'laser_shroom' && this.laserActiveTime > 0){
        const c = cellCenter(this.col, this.row);
        const directions = [
            [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]
        ];
        
        ctx.save();
        ctx.strokeStyle = `rgba(204, 0, 255, ${(this.laserActiveTime / 150) * 0.3})`; // Fade out, lower opacity
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#cc00ff';

        directions.forEach(dir => {
            // Normalize direction for unified length
            const len = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1]);
            const dx = dir[0] / len;
            const dy = dir[1] / len;
            
            const endX = c.x + dx * CELL * 2.5; 
            const endY = c.y + dy * CELL * 2.5;
            
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        });
        
        // Core flash
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 10, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }

    // 时光机倒计时动画
    if(this.type === 'time_machine' && this.floating && this._floatTimer > 0){
        const c = cellCenter(this.col, this.row);
        const ratio = this._floatTimer / this._maxFloatTimer;
        ctx.save();
        ctx.translate(c.x, c.y);
        
        // 旋转效果
        ctx.rotate((1 - ratio) * Math.PI * 4); // 2 full spins over duration

        const r = CELL/2 - 10;

        // 绘制背景圆环
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.2)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // 绘制进度圆环
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        // 逆时针消失
        const endAngle = -Math.PI/2 + (Math.PI * 2 * ratio);
        ctx.arc(0, 0, r, -Math.PI/2, endAngle, false);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 绘制头部光点
        ctx.fillStyle = '#ffffff';
        const dotX = r * Math.cos(endAngle);
        const dotY = r * Math.sin(endAngle);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 5, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }

    // 模仿者变身倒计时特效
    if(this.type === 'mimic' && this._mimicTimer > 0){
        const c = cellCenter(this.col, this.row);
        const maxTime = 3000; 
        const ratio = this._mimicTimer / maxTime;
        
        ctx.save();
        ctx.translate(c.x, c.y);

        // 绘制紫色进度环
        const r = CELL/2 - 5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(140, 100, 170, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        // 顺时针倒计时：起点随时间顺时针移动，终点固定在顶部
        const startAngle = -Math.PI/2 + (Math.PI * 2 * (1 - ratio));
        const endAngle = -Math.PI/2 + Math.PI * 2;
        ctx.arc(0, 0, r, startAngle, endAngle, false);
        ctx.strokeStyle = '#ba68c8'; // lighter purple
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 内部脉冲
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 150);
        ctx.fillStyle = `rgba(186, 104, 200, ${0.3 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.8, 0, Math.PI*2);
        ctx.fill();

        // 问号浮动效果
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 100);
        ctx.fillText('?', 0, -5 + 2 * Math.sin(Date.now() / 200));

        ctx.restore();
    }

    if(shouldHighlight){
        ctx.restore();
    }

    if(this.pumpkin){
        this.pumpkin.draw(ctx);
    }
}

// draw plant HP bar above plant
Plant.prototype.drawHP = function(ctx){
    const barW = CELL - 16;
    const x = this.x + 8;
    
    // Determine Y position: default top, but pumpkin at bottom
    let y = this.y + 4; 
    if(this.type === 'spiky_pumpkin'){
        y = this.y + CELL - 12;
    }

    const ratio = Math.max(0, Math.min(1, this.hp / (this.maxHp || 1)));
    // background
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x, y, barW, HP_BAR_HEIGHT);
    // health
    ctx.fillStyle = '#39d353';
    ctx.fillRect(x+1, y+1, Math.max(0, (barW-2) * ratio), HP_BAR_HEIGHT-2);
    // text
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText(Math.max(0, Math.floor(this.hp)), x + barW/2 - 8, y + HP_BAR_HEIGHT - 1);

    // 柚子充能条 (放在血条下方)
    if(this.type === 'citron'){
        const chargeY = y + HP_BAR_HEIGHT + 2;
        const barH = 6;
        const cRatio = this.chargeTime / 20000;
        
        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, chargeY, barW, barH);

        // 颜色
        let color = '#00FFFF';
        if(this.chargeTime >= 20000) color = '#FF0066';
        else if(this.chargeTime >= 10000) color = '#FF00FF';

        // 进度
        ctx.fillStyle = color;
        ctx.fillRect(x+1, chargeY+1, Math.max(0, (barW-2) * cRatio), barH-2);
        
        // 8s 刻度
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(x + barW/2 - 1, chargeY, 2, barH);
    }

    // Also draw pumpkin HP if attached
    if(this.pumpkin){
        this.pumpkin.drawHP(ctx);
    }
}

// Add manualFire method to Plant prototype for Citron interaction.
Plant.prototype.manualFire = function(){
    if(this.type === 'citron'){
        // Minimum 1s charge
        if(this.chargeTime < 1000) return;

        const c = cellCenter(this.col, this.row);
        // Cap charge at 16s
        const effectiveCharge = Math.min(this.chargeTime, 20000);
        
        let bulletLevel = Math.floor(effectiveCharge / 1000);
        let pierceCount = Math.floor(effectiveCharge / 3000);
        let knockback = false;
        let radius = 5 + Math.min(30, effectiveCharge / 500);
        let damage = bulletLevel * 20;
        let isHuge = false;

        // 8s: Full row pierce + Knockback
        if(effectiveCharge >= 10000){
            knockback = true;
        }

        // 16s: Huge bullet (hits adjacent rows)
        if(effectiveCharge >= 20000){
            pierceCount = 9999;
            isHuge = true;
            radius = 100;
        }

        const b = new Bullet(c.x + 20, c.y, 600, 0, damage, 'citron_plasma');
        b.radius = radius;
        b.pierce = true; 
        b.maxPierce = pierceCount;
        b.knockback = knockback;
        
        this.chargeTime = 0;
        bullets.push(b);
    }
}
