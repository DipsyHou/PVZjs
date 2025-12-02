function Zombie(row, type) {
    type = type || 'normal';
    switch (type) {
        case 'normal': return new NormalZombie(row);
        case 'bucket': return new BucketheadZombie(row);
        case 'exploder': 
        case 'bomber_zombie': return new ExploderZombie(row);
        case 'football': return new FootballZombie(row);
        case 'football_forward': return new FootballForwardZombie(row);
        case 'gargantuar': return new GargantuarZombie(row);
        case 'fisher': return new FisherZombie(row);
        case 'priest': return new PriestZombie(row);
        default:
            console.warn(`Unknown zombie type: ${type}, defaulting to NormalZombie`);
            return new NormalZombie(row);
    }
}
