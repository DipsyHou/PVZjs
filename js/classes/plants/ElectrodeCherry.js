class ElectrodeCherry extends BasePlant {
    constructor(col, row) {
        super(col, row, 'electrode_cherry');
        this.hp = 200;
        this.maxHp = 200;
        this.shootInterval = Infinity;
        this._paired = null; 
        this._beamColor = '#6affff';
        this._beamWidth = 4;
        this._damagePerSec = 90; 
        this._beamPulse = 0; 
    }

    update(dt) {
        super.update(dt);
        
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
            this._beamPulse = (this._beamPulse || 0) + dt/1000;
            const a = { x: this.x + CELL/2, y: this.y + CELL/2 };
            const b = { x: this._paired.x + CELL/2, y: this._paired.y + CELL/2 };
            const segDx = b.x - a.x, segDy = b.y - a.y;
            const segLen2 = segDx*segDx + segDy*segDy;

            for(const z of zombies){
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
                const hitRadius = 14; 
                if(dist <= hitRadius){
                    const dmg = this._damagePerSec * (dt/1000);
                    z.takeDamage(dmg);
                    spawnParticles(projX, projY, this._beamColor, 1, {style: 'spark'});
                }
            }
        }
    }

    drawVisuals(ctx) {
        const img = plantImages[this.type];
        if(img && img.complete && img.naturalWidth){
            ctx.drawImage(img, this.x+8, this.y+8, CELL-16, CELL-16);
        }

        if(this._paired){
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
    }
}
