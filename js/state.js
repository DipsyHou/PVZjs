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
let selectedPlantType = 'peashooter';
const plantSlotBar = document.getElementById('plant-slot-bar');
const plantCooldowns = {}; // type -> remaining ms

// shovel tool
let shovelMode = false;
const shovelBtn = document.getElementById('shovel-btn');

// Input: place plant on click or place zombie when in placement mode
let placeZombieMode = false;
const placeBtn = document.getElementById('place-zombie');
