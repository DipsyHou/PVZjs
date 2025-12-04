const ROWS = 9;
const COLS = 14;
const CELL = 80;
const HP_BAR_HEIGHT = 8;


const PLANT_COST = 100;

// plant card configs including display name, cost, and cooldown (ms)
const PLANT_CONFIGS = {
    peashooter: { name: '豌豆', cost: 100, cooldown: 7000 },
    sunflower: { name: '向日葵', cost: 50, cooldown: 7000 },
    bomber: { name: '石榴', cost: 200, cooldown: 7000 },
    spread: { name: '豆荚', cost: 225, cooldown: 7000 },
    torchwood: { name: '火炬', cost: 175, cooldown: 7000 },
    watermelon: { name: '西瓜', cost: 300, cooldown: 7000 },
    iced_coconut: { name: '冰椰', cost: 175, cooldown: 30000 },
    trumpet: { name: '喇叭花', cost: 50, cooldown: 30000 },
    pine_shooter: { name: '松针射手', cost: 150, cooldown: 7000 },
    gold_bloom: { name: '黄金蓓蕾', cost: 150, cooldown: 50000 },
    spiky_pumpkin: { name: '尖刺南瓜', cost: 150, cooldown: 30000 },
    jalapeno_pair: { name: '火爆双椒', cost: 225, cooldown: 30000 },
    mimic: { name: '模仿者', cost: 325, cooldown: 30000 },
    reshaper: { name: '分解菌落', cost: 50, cooldown: 30000 },
    time_machine: { name: '时光机', cost: 125, cooldown: 50000 },
    laser_shroom: { name: '激光菇', cost: 300, cooldown: 15000 },
    windmill: { name: '风车草', cost: 250, cooldown: 30000 },
    vine_trap: { name: '藤蔓陷阱', cost: 225, cooldown: 30000 },
    electrode_cherry: { name: '电极樱桃', cost: 175, cooldown: 15000 },
    wild_gatling: { name: '狂野机枪豌豆', cost: 450, cooldown: 30000 },
    ninja_nut: { name: '忍者坚果', cost: 100, cooldown: 30000 },
    citron: { name: '充能柚子', cost: 200, cooldown: 7000 },
    corn_homing: { name: '玉米追踪射手', cost: 375, cooldown: 7000 },
    corn_gatling: { name: '玉米机枪', cost: 275, cooldown: 7000 },
    jelly: { name: '果冻', cost: 125, cooldown: 7000 },
};

