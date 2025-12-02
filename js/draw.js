function draw(){
    // background
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // draw grid
    for(let r=0;r<ROWS;r++){
        for(let c=0;c<COLS;c++){
            ctx.strokeStyle = '#2b6f9e'; ctx.lineWidth=2;
            ctx.strokeRect(c*CELL, r*CELL, CELL, CELL);
        }
    }

    // draw plants: non-floating first, floating on top
    for(const p of plants){
        if(!p.floating){
            p.draw(ctx);
        }
    }
    // draw HP bars for non-floating plants
    for(const p of plants){
        if(!p.floating && typeof p.drawHP === 'function') p.drawHP(ctx);
    }
    // draw floating plants last so they appear above
    for(const p of plants){
        if(p.floating){
            p.draw(ctx);
        }
    }

    // draw bullets
    for(const b of bullets) b.draw(ctx);

    // draw zombies
    for(const z of zombies) {
        z.draw(ctx);
        if(typeof z.drawHP === 'function') z.drawHP(ctx);
    }

    // draw particles (on top)
    for(const p of particles){
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color || '#ffb36b';
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}
