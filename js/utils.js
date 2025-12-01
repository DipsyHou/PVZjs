function worldToCell(x,y){
    return {col: Math.floor(x/CELL), row: Math.floor(y/CELL)};
}

function cellCenter(col,row){
    return {x: col*CELL + CELL/2, y: row*CELL + CELL/2};
}

// Spawn particles. Default behavior is a smoke-like effect: larger, slower, with an upward bias
// color: string (e.g. '#aee7ff' or 'rgba(...)'), count: number, opts: optional {gravity:number, style:'smoke'|'spark'}
function spawnParticles(x, y, color, count, opts){
    const style = (opts && opts.style) ? opts.style : 'smoke';
    for(let i=0;i<count;i++){
        const angle = Math.random() * Math.PI * 2;
        let vx, vy, life, size, gravity;
        
        if(style === 'spark'){
            // Old spark/debris style
            const speed = 60 + Math.random()*240;
            vx = Math.cos(angle)*speed;
            vy = Math.sin(angle)*speed - 120; // slight upward
            life = 600;
            size = 2 + Math.random()*4;
            gravity = 1200;
        } else {
            // Smoke style (default)
            const speed = 10 + Math.random() * 80;
            vx = Math.cos(angle) * speed * (0.5 + Math.random() * 0.8);
            vy = Math.sin(angle) * speed * 0.3 - (10 + Math.random() * 40);
            life = 300 + Math.random() * 500;
            size = 6 + Math.random() * 24;
            gravity = (opts && typeof opts.gravity === 'number') ? opts.gravity : (-10 - Math.random() * 60);
        }

        const col = color || 'rgba(200,200,200,0.6)';
        // slight jitter in spawn position
        const px = x + (Math.random() - 0.5) * 12;
        const py = y + (Math.random() - 0.5) * 8;
        particles.push({x: px, y: py, vx: vx, vy: vy, life: life, maxLife: life, color: col, size: size, gravity: gravity});
    }
}
