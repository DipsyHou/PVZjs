const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

let mouseX = 0, mouseY = 0;

// Game state
let sun = 100000;
const grid = Array.from({length: ROWS}, () => Array(COLS).fill(null));

const plants = [];
const zombies = [];
const bullets = [];
const particles = [];

let lastPlantedType = null;

// plant card bar setup
// selected plant type is chosen from deck UI; keep default for fallback
let selectedPlantType = 'peashooter';
// plantSlotBar removed from main UI; keep null if not present
const plantSlotBar = document.getElementById('plant-slot-bar');
const plantCooldowns = {}; // type -> remaining ms

// Deck state (loaded from level setup)
let selectedDeck = null; // null -> not loaded yet; otherwise array of plant keys

function loadSelectedDeck(){
	try{
		const raw = localStorage.getItem('pvz_selected_deck');
		if(raw){
			const arr = JSON.parse(raw);
			if(Array.isArray(arr)){
				selectedDeck = arr;
				return;
			}
		}
	}catch(e){ console.warn('Failed to load selected deck', e); }
	// fallback: include all
	selectedDeck = Object.keys(PLANT_CONFIGS || {});
}

function saveSelectedDeck(){
	try{ localStorage.setItem('pvz_selected_deck', JSON.stringify(selectedDeck)); }catch(e){ console.warn('Failed to save deck', e); }
}

// shovel tool
let shovelMode = false;
const shovelBtn = document.getElementById('shovel-btn');

// Input: place plant on click or place zombie when in placement mode
let placeZombieMode = false;
const placeBtn = document.getElementById('place-zombie');
