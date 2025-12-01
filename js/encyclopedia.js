// 简易图鉴渲染脚本
(function(){
  const plants = [
    { id: 'peashooter', name: '豌豆射手', color: '#2e8b57', cost: 100, hp: 200, cd: 7, desc: '发射单发豌豆' },
    { id: 'spread', name: '豆荚射手', color: '#c75b5b', cost: 225, hp: 200, cd: 7, desc: '向前散射5发豌豆' },
    { id: 'torchwood', name: '火炬树桩', color: '#8b5b3c', cost: 175, hp: 800, cd: 7, desc: '将通过的子弹点燃，造成更高伤害，也可以用来制作爆米花' },
    { id: 'watermelon', name: '西瓜投手', color: '#3aa0b8', cost: 300, hp: 200, cd: 7, desc: '投掷西瓜，命中时造成伤害和3*3范围的溅射' },
    { id: 'sunflower', name: '向日葵', color: '#f1c40f', cost: 50, hp: 200, cd: 7, desc: '生产阳光' },
    { id: 'bomber', name: '石榴轰炸机', color: '#000000', cost: 200, hp: 200, cd: 7, desc: '向本行及邻行投掷至多6颗石榴炸弹' },
    { id: 'coconut', name: '冰镇椰子', color: '#aee7ff', cost: 175, hp: 200, cd: 30, desc: '击退并伤害碰到的敌人，向前方滚动至多4格后爆炸，造成3*3范围的群体减速与伤害' },
    { id: 'trumpet', name: '喇叭花', color: '#ff69b4', cost: 50, hp: 200, cd: 30, desc: '聚集附近的豌豆子弹' },
    { id: 'pine_shooter', name: '松针射手', color: '#2e8b57', cost: 150, hp: 200, cd: 7, desc: '发射可穿透僵尸，且可被点燃的松针' },
    { id: 'gold_bloom', name: '黄金蓓蕾', color: '#ffd700', cost: 150, hp: 50, cd: 50, desc: '种下一段时间后产出大量阳光，随后消失' },
    { id: 'spiky_pumpkin', name: '尖刺南瓜', color: '#ff7518', cost: 150, hp: 4000, cd: 30, desc: '可以种在其他植物上提供保护，对啃咬它的僵尸造成反伤' },
    { id: 'jalapeno_pair', name: '火爆双椒', color: '#d32f2f', cost: 225, hp: 10000, cd: 30, desc: '种下后对整行和整列的僵尸造成毁灭性伤害' },
    { id: 'mimic', name: '模仿茄子', color: '#9966cc', cost: 325, hp: 200, cd: 30, desc: '变身成上一个被种植的植物' },
    { id: 'reshaper', name: '分解菌落', color: '#4CAF50', cost: 50, hp: 0, cd: 30, desc: '悬浮植物。分解本格植物，返还阳光并重置其冷却' },
    { id: 'time_machine', name: '时光机', color: '#2196F3', cost: 125, hp: 0, cd: 50, desc: '悬浮植物。重置本格植物的冷却时间' },
    { id: 'laser_shroom', name: '激光菇', color: '#800080', cost: 300, hp: 200, cd: 15, desc: '向周围8个方向快速发射激光，对范围内的所有敌人造成伤害' },
    { id: 'windmill', name: '风车草', color: '#87CEEB', cost: 250, hp: 200, cd: 30, desc: '为右侧的投掷类植物提供风力辅助，提升其伤害' },
    { id: 'vine_trap', name: '藤蔓陷阱', color: '#2E8B57', cost: 225, hp: 800, cd: 30, desc: '持续减速周围3*3范围内的敌人，15秒后消失' },
    { id: 'electrode_cherry', name: '电极樱桃', color: '#ff4d4d', cost: 175, hp: 200, cd: 15, desc: '两株电极樱桃之间会产生电流，穿过电流的僵尸会持续受到伤害' },
    { id: 'wild_gatling', name: '狂野机枪豌豆', color: '#006400', cost: 450, hp: 200, cd: 30, desc: '向前方5个方向扫射，每个方向发射4颗豌豆' },
    { id: 'ninja_nut', name: '忍者坚果', color: '#8B4513', cost: 100, hp: 4000, cd: 30, desc: '种下后会在周围召唤两个相同的坚果' },
    { id: 'citron', name: '充能柚子', color: '#FFA500', cost: 200, hp: 200, cd: 7, desc: '鼠标点击发射能量球。能量球的大小，伤害，穿透性都会随蓄力时间增加而增加' },
    { id: 'corn_homing', name: '玉米追踪射手', color: '#FFEB3B', cost: 375, hp: 200, cd: 7, desc: '发射追踪玉米粒，小概率发射能够定身僵尸的黄油块' }
  ]; 
  const zombies = [
    { id: 'normal', name: '普通僵尸', color: '#6b6b6b', hp: 200, speed: 20, desc: '普通的僵尸' },
    { id: 'bucket', name: '铁桶僵尸', color: '#6b6b6b', bucketColor: '#7f6b3b', hp: 1200, bucketHp: 1000, speed: 20, desc: '头上的铁桶能吸收5倍于自身血量的伤害' },
    { id: 'exploder', name: '爆破僵尸', color: '#b33', hp: 200, speed: 40, desc: '被杀死或触碰到植物会立即自爆，伤害3×3范围内的植物' },
    { id: 'football', name: '橄榄球僵尸', color: '#5D4037', hp: 1800, speed: 40, desc: '移动速度快，装备的护具能吸收8倍于自身血量的伤害' },
    { id: 'football_forward', name: '橄榄球前锋僵尸', color: '#5D4037', hp: 3400, speed: 45, desc: '速度极快，装备更强的护具，会将前方的植物推开，无法推动时才进行攻击' },
    { id: 'fisher', name: '渔夫僵尸', color: '#6b6b6b', hp: 400, speed: 20, desc: '使用钩锁将远处的植物拉向自己' },
    { id: 'gargantuar', name: '巨人僵尸', color: '#6b6b6b', hp: 4500, speed: 15, desc: '体型巨大，生命值极高，会砸扁阻拦的植物' }
  ];

  const listPlant = document.getElementById('plants-list');
  const listZombie = document.getElementById('zombies-list');
  const template = document.getElementById('card-template');

  function makeCard(data, isPlant){
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.card');
    const icon = node.querySelector('.icon');
    const title = node.querySelector('.card-title');
    const meta = node.querySelector('.meta');
    const desc = node.querySelector('.desc');

    title.textContent = data.name;
    desc.textContent = data.desc;

    if(isPlant){
      icon.style.background = 'transparent';
      icon.textContent = '';
      const img = document.createElement('img');
      if(data.id === 'peashooter') img.src = 'assets/png/peashooter.png';
      else if(data.id === 'sunflower') img.src = 'assets/png/sunflower.png';
      else if(data.id === 'spread') img.src = 'assets/png/peasecod.png';
      else if(data.id === 'torchwood') img.src = 'assets/png/torchwood.png';
      else if(data.id === 'watermelon') img.src = 'assets/png/watermelon.png';
      else if(data.id === 'mimic') img.src = 'assets/png/mimic.png';
      else if(data.id === 'bomber') img.src = 'assets/svg/bomber.svg';
      else if(data.id === 'coconut') img.src = 'assets/png/iced-coconut.png';
      else if(data.id === 'trumpet') img.src = 'assets/svg/trumpet.svg';
      else if(data.id === 'pine_shooter') img.src = 'assets/svg/pine-shooter.svg';
      else if(data.id === 'gold_bloom') img.src = 'assets/png/gold-blooms.png';
      else if(data.id === 'spiky_pumpkin') img.src = 'assets/svg/spiky-pumpkin.svg';
      else if(data.id === 'jalapeno_pair') img.src = 'assets/svg/jalapeno-pair.svg';
      else if(data.id === 'reshaper') img.src = 'assets/svg/reshaper.svg';
      else if(data.id === 'time_machine') img.src = 'assets/svg/time-machine.svg';
      else if(data.id === 'laser_shroom') img.src = 'assets/svg/laser-shroom.svg';
      else if(data.id === 'windmill') img.src = 'assets/svg/windmill.svg';
      else if(data.id === 'electrode_cherry') img.src = 'assets/svg/electrode-cherry.svg';
      else if(data.id === 'vine_trap') img.src = 'assets/svg/vine-trap.svg';
      else if(data.id === 'wild_gatling') img.src = 'assets/png/wild-gatling.png';
      else if(data.id === 'ninja_nut') img.src = 'assets/png/ninja-nut.png';
      else if(data.id === 'citron') img.src = 'assets/png/citron.png';
      else if(data.id === 'corn_homing') img.src = 'assets/svg/corn-homing.svg';
      else img.src = 'assets/png/peashooter.png';
      img.className = 'ency-icon-img';
      icon.appendChild(img);
      const cost = document.createElement('span'); cost.className='small-badge'; cost.textContent = '花费: ' + (data.cost || '-');
      const hp = document.createElement('span'); hp.className='small-badge'; hp.textContent = '生命: ' + (data.hp || '-');
      const cd = document.createElement('span'); cd.className='small-badge'; cd.textContent = '冷却: ' + (data.cd ? data.cd + 's' : '-');
      meta.appendChild(cost); meta.appendChild(hp); meta.appendChild(cd);
    } else {

      icon.style.background = 'transparent';
      icon.textContent = '';
      const img = document.createElement('img');
      if(data.id === 'normal') img.src = 'assets/png/zombie.png';
      else if(data.id === 'bucket') img.src = 'assets/png/bucket-zombie.png';
      else if(data.id === 'exploder') img.src = 'assets/svg/exploder-zombie.svg';
      else if(data.id === 'football') img.src = 'assets/png/rugby-zombie.png';
      else if(data.id === 'football_forward') img.src = 'assets/png/football-forward.png';
      else if(data.id === 'fisher') img.src = 'assets/svg/fisher-zombie.svg';
      else if(data.id === 'gargantuar') img.src = 'assets/png/gargantuar.png';
      img.className = 'ency-icon-img';
      icon.appendChild(img);

      const hp = document.createElement('span'); hp.className='small-badge'; hp.textContent = '生命: ' + (data.hp || '-');
      const sp = document.createElement('span'); sp.className='small-badge'; sp.textContent = '速度: ' + (data.speed || '-');
      meta.appendChild(hp); meta.appendChild(sp);
    }

    return node;
  }

  // render
  for(const p of plants){ listPlant.appendChild(makeCard(p, true)); }
  for(const z of zombies){ listZombie.appendChild(makeCard(z, false)); }
})();
