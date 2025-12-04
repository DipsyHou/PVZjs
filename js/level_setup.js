// Render plant list
const container = document.getElementById('plants-choose');
const rawDeck = localStorage.getItem('pvz_selected_deck');
const savedDeck = rawDeck ? JSON.parse(rawDeck) : null;
const selectedDeck = Array.isArray(savedDeck) ? savedDeck.slice() : Object.keys(PLANT_CONFIGS);

Object.keys(PLANT_CONFIGS).forEach(type => {
  const el = document.createElement('div');
  el.className = 'plant-item';
  el.dataset.type = type;

  const img = document.createElement('img');
  if (plantImages && plantImages[type]) img.src = plantImages[type].src;
  img.style.width = '48px'; img.style.height = '48px'; img.style.objectFit='contain';
  el.appendChild(img);

  const label = document.createElement('div'); label.textContent = PLANT_CONFIGS[type].name; label.style.fontSize='12px'; label.style.marginTop='6px';
  el.appendChild(label);

  function refresh(){
    if(selectedDeck.includes(type)) el.classList.add('selected'); else el.classList.remove('selected');
  }
  refresh();

  el.addEventListener('click', ()=>{
    const idx = selectedDeck.indexOf(type);
    if(idx >= 0) selectedDeck.splice(idx,1);
    else selectedDeck.push(type);
    refresh();
  });

  container.appendChild(el);
});

// maps
let selectedMap = localStorage.getItem('pvz_selected_map') || 'level1';
document.querySelectorAll('#maps .map-item').forEach(el => {
  if(el.dataset.map === selectedMap) el.classList.add('selected');
  el.addEventListener('click', ()=>{
    document.querySelectorAll('#maps .map-item').forEach(x=>x.classList.remove('selected'));
    el.classList.add('selected');
    selectedMap = el.dataset.map;
  });
});

// modes
let selectedMode = localStorage.getItem('pvz_selected_mode') || 'normal';
document.querySelectorAll('#modes .mode-item').forEach(el => {
  if(el.dataset.mode === selectedMode) el.classList.add('selected');
  el.addEventListener('click', ()=>{
    document.querySelectorAll('#modes .mode-item').forEach(x=>x.classList.remove('selected'));
    el.classList.add('selected');
    selectedMode = el.dataset.mode;
  });
});

document.getElementById('start-btn').addEventListener('click', ()=>{
  // save deck/map/mode
  localStorage.setItem('pvz_selected_deck', JSON.stringify(selectedDeck));
  localStorage.setItem('pvz_selected_map', selectedMap);
  localStorage.setItem('pvz_selected_mode', selectedMode);
  // go to game page
  location.href = 'pvz_demo.html';
});