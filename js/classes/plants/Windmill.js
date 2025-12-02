class Windmill extends BasePlant {
    constructor(col, row) {
        super(col, row, 'windmill');
        this.shootInterval = Infinity;
    }
    // Passive plant, logic handled by others
}
