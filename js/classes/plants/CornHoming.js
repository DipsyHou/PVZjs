class CornHoming extends BasePlant {
    constructor(col, row) {
        super(col, row, 'corn_homing');
        this.shootInterval = 1000;
    }

    shoot() {
        const hasTargetAhead = zombies.length > 0;
        if (!hasTargetAhead) return;

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
            const c = cellCenter(this.col, this.row);
            const rand = Math.random();
            let kind = 'corn';
            let damage = 20;
            let stun = 0;
            let splash = false;
            
            if(rand < 0.75){
                kind = 'corn';
                damage = 20;
            } else {
                kind = 'butter';
                damage = 40;
                stun = 4000;
            }
            
            const b = new Bullet(c.x + 20, c.y, 360, 0, damage, kind);
            b.homing = true;
            b.target = target;
            b.stun = stun;
            b.splash = splash;
            bullets.push(b);
        }
    }
}
