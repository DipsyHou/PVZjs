function Plant(col, row, type) {
    type = type || 'peashooter';
    switch (type) {
        case 'peashooter': return new Peashooter(col, row);
        case 'spread': return new Spread(col, row);
        case 'torchwood': return new Torchwood(col, row);
        case 'watermelon': return new Watermelon(col, row);
        case 'sunflower': return new Sunflower(col, row);
        case 'bomber': return new Bomber(col, row);
        case 'trumpet': return new Trumpet(col, row);
        case 'mimic': return new Mimic(col, row);
        case 'pine_shooter': return new PineShooter(col, row);
        case 'gold_bloom': return new GoldBloom(col, row);
        case 'spiky_pumpkin': return new SpikyPumpkin(col, row);
        case 'vine_trap': return new VineTrap(col, row);
        case 'electrode_cherry': return new ElectrodeCherry(col, row);
        case 'jalapeno_pair': return new JalapenoPair(col, row);
        case 'reshaper': return new Reshaper(col, row);
        case 'time_machine': return new TimeMachine(col, row);
        case 'laser_shroom': return new LaserShroom(col, row);
        case 'windmill': return new Windmill(col, row);
        case 'wild_gatling': return new WildGatling(col, row);
        case 'ninja_nut': return new NinjaNut(col, row);
        case 'citron': return new Citron(col, row);
        case 'corn_homing': return new CornHoming(col, row);
        case 'corn_gatling': return new CornGatling(col, row);
        case 'iced_coconut': return new IcedCoconut(col, row);
        case 'jelly': return new Jelly(col, row);
        default:  
            console.warn(`Unknown plant type: ${type}, defaulting to Peashooter`);
            return new Peashooter(col, row);
    }
}
