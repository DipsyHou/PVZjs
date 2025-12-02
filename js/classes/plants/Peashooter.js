class Peashooter extends BasePlant {
    constructor(col, row) {
        super(col, row, 'peashooter');
        this.shootInterval = 1000;
    }

    shoot() {
        const hasTargetAhead = zombies.some(z => z.row === this.row && z.x > this.x);
        if (!hasTargetAhead) return;

        const c = cellCenter(this.col, this.row);
        bullets.push(new Bullet(c.x + 20, c.y, 360, 0, 20, 'pea'));
    }
}
