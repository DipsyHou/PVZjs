// Render plant list
const container = document.getElementById('plants-choose');
const countEl = document.getElementById('deck-count');
const MAX_DECK_SIZE = 10;

const rawDeck = localStorage.getItem('pvz_selected_deck');
const savedDeck = rawDeck ? JSON.parse(rawDeck) : null;
// Default to first 10 if no save, or if save is invalid
let selectedDeck = Array.isArray(savedDeck) ? savedDeck.slice() : Object.keys(PLANT_CONFIGS).slice(0, MAX_DECK_SIZE);

// Filter out invalid plants (e.g. renamed or removed)
selectedDeck = selectedDeck.filter(type => PLANT_CONFIGS[type]);

function updateCount(){
  countEl.textContent = `(${selectedDeck.length}/${MAX_DECK_SIZE})`;
  countEl.style.color = selectedDeck.length > MAX_DECK_SIZE ? 'red' : '#666';
}

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
    updateCount();
  }
  refresh();

  el.addEventListener('click', ()=>{
    const idx = selectedDeck.indexOf(type);
    if(idx >= 0) {
      selectedDeck.splice(idx,1);
    } else {
      if(selectedDeck.length >= MAX_DECK_SIZE){
        alert(`最多只能携带 ${MAX_DECK_SIZE} 个植物！`);
        return;
      }
      selectedDeck.push(type);
    }
    // Refresh all to update selection visuals if needed, but here we just need to update this one and count
    // Actually we need to update this element's class.
    // But since we have a closure 'refresh' for each element, we can just call it.
    // Wait, 'refresh' is defined inside the loop and uses 'el'.
    // But we also need to update the count which is global.
    // The 'refresh' function inside the loop calls 'updateCount' which is fine, but it's called for every element during init.
    // During click, we only need to call it for this element.
    refresh();
  });

  container.appendChild(el);
});
// Initial count update (will be called many times by loop, but that's ok or we can call once after)
updateCount();

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