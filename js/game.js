// plant card bar setup
function createPlantCards(){
    if(!plantSlotBar) return;
    if(typeof PLANT_CONFIGS === 'undefined' || typeof plantImages === 'undefined') {
        console.error("PLANT_CONFIGS or plantImages missing");
        return;
    }
    plantSlotBar.innerHTML = '';
    Object.keys(PLANT_CONFIGS).forEach(type => {
        const cfg = PLANT_CONFIGS[type];
        if(!plantImages[type]) {
            console.warn("Missing image for plant type:", type);
            return;
        }
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.dataset.type = type;
        if(type === selectedPlantType) card.classList.add('selected');
        // 图标区域
        const iconImg = document.createElement('img');
        iconImg.src = plantImages[type].src;
        iconImg.className = 'plant-card-icon';
        card.appendChild(iconImg);


        const nameEl = document.createElement('div');
        nameEl.className = 'name';
        nameEl.textContent = cfg.name;
        const costEl = document.createElement('div');
        costEl.className = 'cost';
        costEl.textContent = PLANT_CONFIGS[type].cost || PLANT_COST;
        const mask = document.createElement('div');
        mask.className = 'cooldown-mask';
        const cdText = document.createElement('div');
        cdText.className = 'cooldown-text';
        cdText.textContent = '';
        card.appendChild(nameEl);
        card.appendChild(costEl);
        card.appendChild(mask);
        card.appendChild(cdText);
        card.addEventListener('click', () => {
            selectedPlantType = type;
            document.querySelectorAll('.plant-card').forEach(el => el.classList.remove('selected'));
            card.classList.add('selected');
        });
        plantSlotBar.appendChild(card);
    });
}

createPlantCards();

// Add event listeners for UI buttons
if(placeBtn){
    placeBtn.addEventListener('click', ()=>{
        placeZombieMode = !placeZombieMode;
        placeBtn.style.background = placeZombieMode ? '#f88' : '';
        placeBtn.textContent = placeZombieMode ? 'Placing Zombies...' : 'Place Zombie';
        // exit shovel mode
        shovelMode = false;
        if(shovelBtn) {
            shovelBtn.style.outline = '';
            shovelBtn.style.background = '';
        }
        canvas.style.cursor = placeZombieMode ? 'crosshair' : 'default';
    });
}

if(shovelBtn){
    shovelBtn.addEventListener('click', ()=>{
        shovelMode = !shovelMode;
        if(shovelMode){
            shovelBtn.style.outline = '2px solid yellow';
            shovelBtn.style.background = 'rgba(255,255,0,0.3)';
            canvas.style.cursor = `url('assets/svg/shovel.svg') 25 25, auto`;
            // exit zombie mode
            placeZombieMode = false;
            if(placeBtn){
                placeBtn.style.background = '';
                placeBtn.textContent = 'Place Zombie';
            }
        } else {
            shovelBtn.style.outline = '';
            shovelBtn.style.background = '';
            canvas.style.cursor = 'default';
        }
    });
}

function getSelectedZombieType(){
    const sel = document.getElementById('zombie-type');
    return sel ? sel.value : 'normal';
}

canvas.addEventListener('click', (e)=>{
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left; const my = e.clientY - r.top;
    const {col,row} = worldToCell(mx,my);
    if(col<0||col>=COLS||row<0||row>=ROWS) return;

    if(placeZombieMode){
        // place zombie at clicked grid cell if empty (do not place on occupied)
        if(grid[row][col]) return; // occupied by plant
        const z = new Zombie(row, getSelectedZombieType());
        // align zombie inside clicked cell
        z.x = col * CELL;
        zombies.push(z);
        return;
    }

    // shovel mode: remove plant or top pumpkin in this cell
    if(shovelMode){
        const target = grid[row][col];
        if(target){
            const relY = my % CELL;
            const isBottom = relY > CELL / 2;

            if(target.pumpkin){
                if(isBottom){
                    // Remove pumpkin
                    const pk = target.pumpkin;
                    // attached pumpkin is not in plants array, but check just in case
                    const idx = plants.indexOf(pk);
                    if(idx >= 0) plants.splice(idx,1);
                    target.pumpkin = null;
                } else {
                    // Remove inner plant, keep pumpkin
                    const pumpkin = target.pumpkin;
                    target.pumpkin = null;
                    
                    // Remove target from plants
                    const idx = plants.indexOf(target);
                    if(idx >= 0) plants.splice(idx,1);
                    
                    // Pumpkin becomes the main plant
                    grid[row][col] = pumpkin;
                    // Add pumpkin to plants list (it was attached, so not in list)
                    plants.push(pumpkin);
                }
            } else {
                // Only one thing here, remove it
                grid[row][col] = null;
                const idx = plants.indexOf(target);
                if(idx >= 0) plants.splice(idx,1);
            }
        }
        // Auto-exit shovel mode (even if clicked empty cell)
        shovelMode = false;
        if(shovelBtn){
            shovelBtn.style.outline = '';
            shovelBtn.style.background = '';
        }
        canvas.style.cursor = 'default';
        return;
    }

    // otherwise place plant via card selection
    const type = selectedPlantType || 'peashooter';
    
    // Safety check for Plant class
    if(typeof Plant === 'undefined'){
        console.error("Plant class not defined");
        return;
    }

    const existing = grid[row][col];
    let isPumpkinPlanting = false;
    let isInsidePumpkinPlanting = false;
    const isFloatingType = (type === 'reshaper' || type === 'time_machine');

    // Floating types can be planted onto any cell (they do NOT occupy grid)
    if(existing && !isFloatingType){
        if(type === 'spiky_pumpkin' && !existing.pumpkin && existing.type !== 'spiky_pumpkin'){
            isPumpkinPlanting = true;
        } else if(type !== 'spiky_pumpkin' && existing.type === 'spiky_pumpkin' && !existing.pumpkin){
            isInsidePumpkinPlanting = true;
        } else {
            // Occupied (non-floating)
            if(existing.type === 'citron'){
                if(typeof existing.manualFire === 'function') existing.manualFire();
            }
            return; 
        }
    }

    const cost = PLANT_CONFIGS[type].cost || PLANT_COST;
    // card cooldown check
    const cdCfg = PLANT_CONFIGS[type];
    const remainingCd = plantCooldowns[type] || 0;
    if(remainingCd > 0) return;
    if(sun < cost) return;
    sun -= cost; document.getElementById('sun-count').textContent = sun;
    const prevLast = lastPlantedType;
    const p = new Plant(col,row,type);
    // if planting a mimic, remember which plant it should copy (the last planted before this one)
    if(type === 'mimic'){
        p._mimicTarget = prevLast;
        // mimic should not become the lastPlantedType
    } else {
        // update last planted type for future mimics
        lastPlantedType = type;
    }

    if(isPumpkinPlanting){
        existing.pumpkin = p;
    } else if(isInsidePumpkinPlanting){
        p.pumpkin = existing;
        const idx = plants.indexOf(existing);
        if(idx >= 0) plants.splice(idx,1);
        plants.push(p);
        grid[row][col] = p;
    } else if(p.floating){
        // floating plants do not occupy the grid cell and cannot be attacked
        plants.push(p);
    } else {
        grid[row][col] = p; plants.push(p);
    }

    // start cooldown for this card
    if(cdCfg && cdCfg.cooldown){
        plantCooldowns[type] = cdCfg.cooldown;
    }
});
document.getElementById('reset').addEventListener('click', ()=>reset());

function spawnZombie(row, type){
    // if row omitted -> random spawn from right outside screen
    if(typeof row === 'undefined' || row === null){
        row = Math.floor(Math.random()*ROWS);
        const z = new Zombie(row, type || 'normal');
        zombies.push(z);
        return;
    }
    // clamp row
    row = Math.max(0, Math.min(ROWS-1, row));
    const z = new Zombie(row, type || 'normal');
    // place at the rightmost cell (inside the grid) so it appears on that row at rightmost column
    z.x = (COLS-1) * CELL;
    zombies.push(z);
}

let last = performance.now();
function loop(now){
    const dt = now - last; last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
}

function update(dt){
    // update level manager (spawns zombies)
    if(typeof levelManager !== 'undefined') {
        levelManager.update(dt);
    }

    // update plants
    for(const p of plants) p.update(dt);

    // update plant card cooldowns & UI
    if(plantSlotBar){
        const cards = plantSlotBar.querySelectorAll('.plant-card');
        for(const card of cards){
            const type = card.dataset.type;
            const cfg = PLANT_CONFIGS[type];
            if(!cfg) continue;
            let remain = plantCooldowns[type] || 0;
            if(remain > 0){
                remain = Math.max(0, remain - dt);
                plantCooldowns[type] = remain;
            }
            const mask = card.querySelector('.cooldown-mask');
            const cdText = card.querySelector('.cooldown-text');
            if(remain > 0){
                const ratio = cfg.cooldown > 0 ? remain / cfg.cooldown : 0;
                if(mask) mask.style.height = (ratio * 100) + '%';
                if(cdText) cdText.textContent = (remain/1000).toFixed(1);
                card.style.opacity = 0.6;
            } else {
                if(mask) mask.style.height = '0%';
                if(cdText) cdText.textContent = '';
                card.style.opacity = 1;
            }
        }
    }

    // update bullets
    for(const b of bullets) b.update(dt);

    // bullet interactions with torchwood: convert peas / needles to fire bullets when passing through torchwood cell
    for(const b of bullets){
        // only affect straight bullets (pea, needle) that are not already fire
        if((b.kind === 'pea' || b.kind === 'needle' || b.kind === 'corn') && !b.isFire){
            const col = Math.floor(b.x / CELL);
            const row = Math.floor(b.y / CELL);
            if(row >=0 && row < ROWS && col >=0 && col < COLS){
                const p = grid[row][col];
                if(p && p.type === 'torchwood'){
                    // convert bullet
                    b.isFire = true;
                    if(b.kind === 'corn'){
                        b.kind = 'popcorn';
                        b.damage = 40;
                        b.splash = true;
                    } else {
                        b.damage = Math.round(b.damage * 2);
                    }
                }
            }
        }
    }

    // update zombies
    for(const z of zombies) z.update(dt);

    // update particles
    for(let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        const g = (typeof p.gravity === 'number') ? p.gravity : 1200; // gravity
        p.vy += g * (dt/1000);
        p.x += p.vx * (dt/1000);
        p.y += p.vy * (dt/1000);
        p.life -= dt;
        if(p.life <= 0) particles.splice(i,1);
    }

    function explodeWatermelonAt(x, y, splashDamage){
        spawnParticles(x, y, '#ffb36b', 18, {style: 'spark'});
        const centerCol = Math.floor(x / CELL);
        const centerRow = Math.floor(y / CELL);
        for(let k=zombies.length-1;k>=0;k--){
            const other = zombies[k];
            const col = Math.floor((other.x + other.width/2) / CELL);
            const row = Math.floor((other.y + other.height/2) / CELL);
            if(Math.abs(col - centerCol) <= 1 && Math.abs(row - centerRow) <= 1){
                other.takeDamage(splashDamage || 0);
            }
        }
    }

    // collisions: bullets -> zombies
    for(let i=bullets.length-1;i>=0;i--){
        const b = bullets[i];
        // 空爆
        if((b.kind === 'watermelon' || b.kind === 'bomb') && b._expired){
            if(b.kind === 'watermelon'){
                explodeWatermelonAt(b.x, b.y, b.splash || 0);
            }
            bullets.splice(i,1);
            continue;
        }
        let hitIndex = -1;
        for(let j=0;j<zombies.length;j++){
            const z = zombies[j];
            // 穿透子弹：同一子弹对同一僵尸只结算一次伤害
            if(b.pierce && b.hitSet && b.hitSet.has(z)) continue;
            if(b.kind === 'watermelon' || b.kind === 'bomb'){
                // For parabolic projectiles, only ever hit their locked target
                if(!b.target) continue; // no target -> cannot hit anything
                if(z !== b.target) continue;
                const zx = z.x + z.width/2; const zy = z.y + z.height/2;
                const dx = b.x - zx; const dy = b.y - zy;
                const dist2 = dx*dx + dy*dy;
                const thresh = (z.width/2 + b.radius) * (z.width/2 + b.radius);
                if(dist2 <= thresh){ hitIndex = j; break; }
            } else {
                // Linear collision check
                // Use bullet radius for Y-axis overlap to support large bullets hitting adjacent rows
                // Zombie Y range: [z.y, z.y + CELL] (approx)
                // Bullet Y range: [b.y - b.radius, b.y + b.radius]
                const zTop = z.y;
                const zBottom = z.y + CELL;
                const bTop = b.y - b.radius;
                const bBottom = b.y + b.radius;
                
                // Check Y overlap
                if(bBottom > zTop && bTop < zBottom){
                    // Check X overlap
                    if(b.x + b.radius > z.x + 6 && b.x - b.radius < z.x + z.width){
                        hitIndex = j; break;
                    }
                }
            }
        }
        if(hitIndex >= 0){
            const z = zombies[hitIndex];
            if(b.kind === 'watermelon'){
                const zx = z.x + z.width/2;
                const zy = z.y + z.height/2;
                z.takeDamage(b.damage);
                explodeWatermelonAt(zx, zy, b.splash || 0);
            } else if(b.kind === 'popcorn'){
                const zx = z.x + z.width/2;
                const zy = z.y + z.height/2;
                explodeWatermelonAt(zx, zy, b.damage);
            } else {
                z.takeDamage(b.damage);
            }
            
            if(b.stun){
                z.stunRemaining = 4000; // 4s stun
            }

            // Knockback effect (independent of pierce)
            if(b.knockback){
                // Apply knockback state to zombie
                z.knockbackRemaining = 500; // 0.5s knockback duration
                z.knockbackSpeed = 200; // Speed to push back
                z._knockbackTargetX = z.x + 100; // Target X position
                z.targetPlant = null; // Stop attacking
                z.smashTimer = 0;
            }

            // 穿透子弹：不移除子弹，但同一颗子弹对同一只僵尸只生效一次
            if(b.pierce){
                if(!b.hitSet){
                    b.hitSet = new Set();
                }
                b.hitSet.add(z);
                
                // Limited pierce logic
                if(typeof b.maxPierce === 'number' && b.hitSet.size > b.maxPierce){
                    bullets.splice(i,1);
                }
            } else {
                bullets.splice(i,1);
            }
        } else if(b.x > canvas.width + 50){
            bullets.splice(i,1);
        }
    }

    // remove dead zombies
    for(let i=zombies.length-1;i>=0;i--){
        const z = zombies[i];
        if(z.hp <= 0){
            zombies.splice(i,1);
        }else if(z.x < -50){
            // reach left -> game over simple handling: remove
            zombies.splice(i,1);
        }
    }
}

function reset(){
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) grid[r][c]=null;
    plants.length=0; zombies.length=0; bullets.length=0; 
    if(typeof levelManager !== 'undefined') {
        levelManager.start();
    } else {
        sun=100000; document.getElementById('sun-count').textContent=sun;
    }
}

// start
// Initialize level
if(typeof levelManager !== 'undefined') {
    levelManager.start();
} else {
    document.getElementById('sun-count').textContent = sun;
}

requestAnimationFrame(loop);
canvas.addEventListener('mousemove', (e)=>{
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
});
