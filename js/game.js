// plant card bar setup
function createPlantCards(){
    // plantSlotBar may be absent if selection moved to setup page
    if(!plantSlotBar) return;
    if(typeof PLANT_CONFIGS === 'undefined' || typeof plantImages === 'undefined') {
        console.error("PLANT_CONFIGS or plantImages missing");
        return;
    }
    // ensure deck is loaded
    if(selectedDeck === null && typeof loadSelectedDeck === 'function') loadSelectedDeck();
    const typesToShow = Array.isArray(selectedDeck) && selectedDeck.length ? selectedDeck : Object.keys(PLANT_CONFIGS);

    plantSlotBar.innerHTML = '';
    typesToShow.forEach(type => {
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
            canvas.style.cursor = `url('../assets/svg/shovel.svg') 25 25, auto`;
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

    // Check terrain constraints
    if (terrainGrid[row][col] === TERRAIN.OBSTACLE) {
        // Cannot interact with obstacle cells (cannot plant, cannot shovel, cannot place zombie)
        // Unless we add logic to remove obstacle with shovel? For now, "never disappear".
        return;
    }

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
        z.x = canvas.width - 20; // Spawn slightly closer to the screen edge
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
    for(let i = bullets.length - 1; i >= 0; i--){
        const b = bullets[i];
        if(!b.update(dt)){
            bullets.splice(i, 1);
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
    
    // Initialize terrain based on selected map
    const mapType = localStorage.getItem('pvz_selected_map') || 'level1';
    if(typeof initTerrain === 'function') initTerrain(mapType);

    if(typeof levelManager !== 'undefined') {
        levelManager.start();
    } else {
        sun=100000; document.getElementById('sun-count').textContent=sun;
    }
}

// start
// Initialize game
reset();

requestAnimationFrame(loop);
canvas.addEventListener('mousemove', (e)=>{
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
});
