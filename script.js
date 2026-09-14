/* ============================================================
   MFOOT — game logic
   Pure vanilla JS, everything persisted to localStorage.
   ============================================================ */

const SAVE_KEY = 'mfoot_save_v1';

/* ---------- asset paths ---------- */
const IMG = {
  coin:       'images/coin.png',
  cash:       'images/cash.png',
  sila:       'images/sila.png',
  lvl:        'images/lvl.png',
  cupYam:     'images/cup/cupyam.png',
  navManager: 'images/manager.png',
  navPlay:    'images/play.png',
  navTeam:    'images/comands.png',
  navTransfer:'images/transfer.png',
  navBank:    'images/bank.png',
  fon:        'images/fon.png'
};
/* per-tournament trophy images (falls back to emoji icon) */
const TROPHY_IMG = {
  jamaica: IMG.cupYam
};
function trophyIconHtml(tournament){
  const src = tournament && TROPHY_IMG[tournament.id];
  if(src) return `<img src="${src}" class="mgr-trophy-icon-img" alt="${tournament.title}">`;
  return `<span class="mgr-trophy-icon">${tournament ? tournament.icon : '🏆'}</span>`;
}
function tournamentIconHtml(t){
  const src = TROPHY_IMG[t.id];
  if(src) return `<img src="${src}" class="tournament-icon-img" alt="${t.title}">`;
  return `<span class="tournament-icon">${t.icon}</span>`;
}
function cupTrophyHtml(t, cls){
  const src = t && TROPHY_IMG[t.id];
  if(src) return `<img src="${src}" class="cup-trophy-img ${cls||''}" alt="${t.title}">`;
  return `<div class="cup-trophy ${cls||''}">${t ? t.icon : '🏆'}</div>`;
}

/* ---------- data pools ---------- */
const FIRST_NAMES = [
  'Ivan','Marco','Diego','Kwame','Andre','Leon','Sasha','Boris','Nikita','Tomas',
  'Carlos','Bruno','Milan','Femi','Jamal','Rico','Oleh','Denys','Pavlo','Yuri',
  'Kevin','Dario','Rafael','Emeka','Aaron','Miguel','Stefan','Hugo','Tyler','Kofi'
];
const LAST_NAMES = [
  'Melnyk','Silva','Rocha','Bailey','Kovac','Petrov','Nowak','Santos','Diallo','Grant',
  'Wilson','Costa','Ferrer','Osei','Marsh','Torres','Klymenko','Bondar','Lima','Reyes',
  'Brown','Adeyemi','Campbell','Novak','Duarte','Fisher','Ricci','Hall','Moreau','Souza'
];

const POSITIONS = [
  { code:'ВР',  css:'VR'   },
  { code:'ЗАЩ', css:'ZASH' },
  { code:'ПЗ',  css:'PZ'   },
  { code:'НАП', css:'NAP'  }
];
function posByCode(code){ return POSITIONS.find(p=>p.code===code); }

/* ---------- formations ---------- */
const FORMATIONS = {
  '4-4-2': {
    slots: [
      { pos:'ВР',  x:50, y:90 },
      { pos:'ЗАЩ', x:15, y:70 }, { pos:'ЗАЩ', x:38, y:72 }, { pos:'ЗАЩ', x:62, y:72 }, { pos:'ЗАЩ', x:85, y:70 },
      { pos:'ПЗ',  x:15, y:46 }, { pos:'ПЗ',  x:38, y:48 }, { pos:'ПЗ',  x:62, y:48 }, { pos:'ПЗ',  x:85, y:46 },
      { pos:'НАП', x:35, y:18 }, { pos:'НАП', x:65, y:18 }
    ]
  },
  '5-3-2': {
    slots: [
      { pos:'ВР',  x:50, y:90 },
      { pos:'ЗАЩ', x:10, y:70 }, { pos:'ЗАЩ', x:30, y:74 }, { pos:'ЗАЩ', x:50, y:76 }, { pos:'ЗАЩ', x:70, y:74 }, { pos:'ЗАЩ', x:90, y:70 },
      { pos:'ПЗ',  x:28, y:46 }, { pos:'ПЗ',  x:50, y:44 }, { pos:'ПЗ',  x:72, y:46 },
      { pos:'НАП', x:35, y:18 }, { pos:'НАП', x:65, y:18 }
    ]
  },
  '4-3-3': {
    slots: [
      { pos:'ВР',  x:50, y:90 },
      { pos:'ЗАЩ', x:15, y:70 }, { pos:'ЗАЩ', x:38, y:72 }, { pos:'ЗАЩ', x:62, y:72 }, { pos:'ЗАЩ', x:85, y:70 },
      { pos:'ПЗ',  x:28, y:47 }, { pos:'ПЗ',  x:50, y:44 }, { pos:'ПЗ',  x:72, y:47 },
      { pos:'НАП', x:15, y:18 }, { pos:'НАП', x:50, y:15 }, { pos:'НАП', x:85, y:18 }
    ]
  }
};
const FORMATION_IDS = Object.keys(FORMATIONS);
const DEFAULT_FORMATION = '4-4-2';

const FORMATION_COUNTERS = {
  '4-4-2': '5-3-2',
  '5-3-2': '4-3-3',
  '4-3-3': '4-4-2'
};
const FORMATION_COUNTER_BONUS = 1.10;

function formationMatchupMultiplier(formationA, formationB){
  if(formationA && formationB && FORMATION_COUNTERS[formationA] === formationB){
    return FORMATION_COUNTER_BONUS;
  }
  return 1;
}

function autoFillFormationSlots(s, formationId){
  const formation = FORMATIONS[formationId] || FORMATIONS[DEFAULT_FORMATION];
  const codes = formation.slots.map(sl=>sl.pos);
  const mainPlayers = s.players.filter(p=>p.status==='main');
  s.players.forEach(p=>{ if(p.status==='main') p.slot = null; });

  const usedIds = new Set();
  codes.forEach((code, idx)=>{
    const candidate = mainPlayers.find(p=> p.pos===code && !usedIds.has(p.id));
    if(candidate){
      candidate.slot = idx;
      usedIds.add(candidate.id);
    }
  });
  mainPlayers.forEach(p=>{
    if(!usedIds.has(p.id)){
      p.status = 'bench';
      p.slot = null;
    }
  });
}

function ensureLineupsInit(s){
  if(!s.lineups) s.lineups = {};
  FORMATION_IDS.forEach(id=>{
    if(!Array.isArray(s.lineups[id]) || s.lineups[id].length !== FORMATIONS[id].slots.length){
      s.lineups[id] = new Array(FORMATIONS[id].slots.length).fill(null);
    }
  });
}

function autoFillEmptyLineup(s, formationId){
  const lineup = s.lineups[formationId];
  if(lineup.some(id => id !== null)) return;
  const codes = FORMATIONS[formationId].slots.map(sl=>sl.pos);
  const usedIds = new Set();
  codes.forEach((code, idx)=>{
    const candidate = s.players.find(p => p.pos===code && !usedIds.has(p.id));
    if(candidate){
      lineup[idx] = candidate.id;
      usedIds.add(candidate.id);
    }
  });
}

function syncStatusFromLineup(s){
  ensureLineupsInit(s);
  autoFillEmptyLineup(s, s.formation);
  const lineup = s.lineups[s.formation];

  const validIds = new Set(s.players.map(p=>p.id));
  const seen = new Set();
  for(let i=0;i<lineup.length;i++){
    if(lineup[i] && (!validIds.has(lineup[i]) || seen.has(lineup[i]))){
      lineup[i] = null;
    } else if(lineup[i]){
      seen.add(lineup[i]);
    }
  }

  s.players.forEach(p=>{ p.status = 'bench'; p.slot = null; });
  lineup.forEach((playerId, idx)=>{
    if(!playerId) return;
    const p = s.players.find(pl=>pl.id===playerId);
    if(p){ p.status = 'main'; p.slot = idx; }
  });
}

/* ---------- tournament tiers ---------- */
const TOURNAMENTS = [
  {
    id:'novice',
    title:'КУБОК НОВИЧКОВ',
    icon:'🏆',
    min:0, max:300,
    teamCount:4,
    teamNames:['FC Kingston','Red Lions','Blue Stars','Jamaica FC'],
    stageRewardCoins: 150,
    stageRewardPower: 5,
    cupWinCoins: 500,
    xpPerWin: 25
  },
  {
    id:'jamaica',
    title:'КУБОК ЯМАЙКИ',
    icon:'🥥',
    min:301, max:600,
    teamCount:8,
    teamNames:['Portmore FC','Trenchtown Lions','Spanish Town Utd','Montego Bay Stars','Ocho Rios FC','Negril Warriors','St. Ann Rangers','Kingston City'],
    stageRewardCoins: 250,
    stageRewardPower: 10,
    cupWinCoins: 1000,
    xpPerWin: 50
  },
  {
    id:'champions',
    title:'КУБОК ЧЕМПИОНОВ',
    icon:'👑',
    min:601, max:1000,
    teamCount:16,
    teamNames:['Real Madronia','AC Northport','Bayern Steelworks','Inter Halcyon','Atletico Vermont','Juventude FC','Borussia Ironfield','Paris Star','Milan Elite','Barcelona Nova','Lyon Olympique','Dortmund Black','Roma Imperiale','Ajax Capital','Sporting CP','Benfica Luz'],
    stageRewardCoins: 400,
    stageRewardPower: 15,
    cupWinCoins: 2000,
    xpPerWin: 100
  },
  {
    id:'legends',
    title:'КУБОК ЛЕГЕНД',
    icon:'🌟',
    min:1001, max:1500,
    teamCount:16,
    teamNames:['Olympus United','Valhalla FC','Camelot Rangers','Atlantis Sporting','Excalibur City','Avalon Athletic','Titan\'s Forge','Phoenix Ascend','Dragonspire FC','Ironcrown United','Thunderhall Rovers','Mythic Wanderers','Stormbreak City','Ravenwood FC','Frostpeak United','Goldenshield Athletic'],
    stageRewardCoins: 600,
    stageRewardPower: 20,
    cupWinCoins: 3000,
    xpPerWin: 150
  },
  {
    id:'heroes',
    title:'КУБОК ГЕРОЕВ',
    icon:'⚡',
    min:1501, max:2000,
    teamCount:16,
    teamNames:['Vanguard City','Iron Legion','Nova Guardians','Steel Phoenix FC','Falcon Strike','Crimson Blade United','Silver Vanguard','Nightwatch Rovers','Shadow Sentinels','Solar Knights','Rapid Strikers','Valor United','Wolfpack Athletic','Skyward FC','Aegis City','Hunter\'s Pride'],
    stageRewardCoins: 800,
    stageRewardPower: 25,
    cupWinCoins: 4000,
    xpPerWin: 200
  },
  {
    id:'titans',
    title:'КУБОК ТИТАНОВ',
    icon:'🔥',
    min:2001, max:2500,
    teamCount:32,
    teamNames:['Colossus United','Atlas Rovers','Kronos City','Titanfall FC','Bedrock Athletic','Ironclad Giants','Molten Core FC','Gigant United','Stonehammer City','Behemoth Rovers','Magma Strikers','Ridgeline United','Volcanic Athletic','Granite City FC','Thundergiant Rovers','Colossal Vanguard','Obsidian United','Earthshaker FC','Tremor City','Boulder Athletic','Pyroclast Rovers','Cinderforge United','Basalt City FC','Quakeline Athletic','Ashborne Rovers','Infernal Titans','Steelcore United','Forgefire City','Cratermakers FC','Rockslide Athletic','Emberfall Rovers','Magmawave United'],
    stageRewardCoins: 1000,
    stageRewardPower: 30,
    cupWinCoins: 5000,
    xpPerWin: 250
  },
  {
    id:'immortals',
    title:'КУБОК БЕССМЕРТНЫХ',
    icon:'💫',
    min:2501, max:3000,
    teamCount:32,
    teamNames:['Eternal City','Undying FC','Everlast Rovers','Timeless United','Infinity Athletic','Nova Eternal','Starforged City','Celestine Rovers','Neverending FC','Eonwatch United','Astral Immortals','Perpetua City','Radiant Legacy FC','Sempiterna Rovers','Vireo Eternal United','Lumina Athletic','Starlight Immortals','Comet City FC','Everglow Rovers','Zenith United','Halo Eternal Athletic','Solstice City FC','Wandering Stars','Nebula Rovers','Aurora Immortal United','Stardust Athletic','Meteor City FC','Cosmic Legacy Rovers','Galaxy Watch United','Twilight Eternal FC','Orbit Immortals','Constellation City'],
    stageRewardCoins: 1200,
    stageRewardPower: 35,
    cupWinCoins: 6000,
    xpPerWin: 300
  },
  {
    id:'gods',
    title:'КУБОК БОГОВ',
    icon:'⚜️',
    min:3001, max:4000,
    teamCount:32,
    teamNames:['Zeus United','Apollo City FC','Ares Rovers','Poseidon Athletic','Hermes United','Athena Guardians','Hades City FC','Odin\'s Chosen','Thor Athletic','Loki Rovers','Freya United','Ra\'s Ascension','Anubis City FC','Osiris Rovers','Indra United','Amaterasu FC','Jupiter Athletic','Mars City Rovers','Neptune United','Vulcan FC','Divine Sovereigns','Pantheon City','Olympian United','Celestial Throne FC','Godspeed Rovers','Almighty Athletic','Skyfather United','Immortal Throne FC','Deity Rovers','Sacred Ember United','Divinity City FC','Ascendant Gods'],
    stageRewardCoins: 1500,
    stageRewardPower: 40,
    cupWinCoins: 8000,
    xpPerWin: 350
  },
  {
    id:'universe',
    title:'КУБОК ВСЕЛЕННОЙ',
    icon:'🌌',
    min:4001, max:5000,
    teamCount:64,
    teamNames:['Galactic United','Nebula City FC','Andromeda Rovers','Quasar Athletic','Cosmos United','Interstellar FC','Nova Sphere City','Voidwalker Rovers','Blackhole United','Solaris FC','Pulsar City Athletic','Lightyear Rovers','Multiverse United','Astro City FC','Meteorite Rovers','Wormhole Athletic','Orbiter United','Star Cluster FC','Infinity Void City','Dark Matter Rovers','Celestial Reach United','Big Bang FC','Cosmic Drift City','Gravity Well Rovers','Photon United','Stargate Athletic','Event Horizon FC','Supernova City','Parallax Rovers','Dimension United','Zero Point FC','Singularity City','Astral Plane Rovers','Nova Genesis United','Hyperspace FC','Planetfall City','Orbital Drift Rovers','Cosmic Forge United','Stellar Wind FC','Galaxy Edge City','Quantum Leap Rovers','Vortex United','Skybound Cosmos FC','Ethereal City','Meridian Rovers','Celestara United','Novaburst FC','Ionosphere City','Solar Flare Rovers','Zenith Cosmos United','Aether Drift FC','Cosmic Pulse City','Umbra Rovers','Radiant Void United','Astro Nexus FC','Chronos City','Infinite Horizon Rovers','Starborn United','Nova Drift FC','Cosmic Ember City','Lightspeed Rovers','Galactic Pulse United','Void Ember FC','Celestial Drift City'],
    stageRewardCoins: 2000,
    stageRewardPower: 50,
    cupWinCoins: 10000,
    xpPerWin: 400
  },
  {
    id:'absolute',
    title:'КУБОК АБСОЛЮТА',
    icon:'👾',
    min:5001, max:7000,
    teamCount:64,
    teamNames:['Absolute United','Ultimatum FC','Apex Prime City','Omega Rovers','Infinity Zero United','Paradox FC','Anomaly City','Rift Rovers','Singular Prime United','Overdrive FC','Absolute Zero City','Vector Rovers','Prime United FC','Zenith Absolute City','Ultra Prime Rovers','Endgame United','Alpha Omega FC','Final Form City','Beyond Limits Rovers','Transcendent United','Hyper Prime FC','Glitch City','Byte Rovers','Neon Circuit United','Cyber Prime FC','Digital Abyss City','Matrix Rovers','Synth United','Overclock FC','Nano Prime City','Quantum Absolute Rovers','Void Prime United','Corrupted Signal FC','Firewall City','Static Rovers','Binary United','Circuit Board FC','Data Stream City','Encrypted Rovers','Terminal United','Reboot FC','Mainframe City','Protocol Rovers','Neural Link United','Override FC','Kernel Panic City','Backdoor Rovers','Malware United','Root Access FC','Ghost Protocol City','Zero Day Rovers','Deep Web United','Sandbox FC','Firmware City','Payload Rovers','Exploit United','Cache Prime FC','Buffer Overflow City','Stack Trace Rovers','Null Pointer United','Segfault FC','Recursion City','Infinite Loop Rovers','Runtime Prime United'],
    stageRewardCoins: 3000,
    stageRewardPower: 60,
    cupWinCoins: 15000,
    xpPerWin: 500
  }
];
function tournamentById(id){ return TOURNAMENTS.find(t=>t.id===id); }

/* ---------- state ---------- */
let state = null;
let currentCupId = null;
let cupTimer = { intervalId:null, secondsLeft:0, running:false };
let trainingTimers = {};
let trainingUpdateInterval = null;
let transferTimerInterval = null;

/* ---------- utils ---------- */
function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[rnd(0,arr.length-1)]; }
function uid(){ return 'p'+Math.random().toString(36).slice(2,9); }
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = rnd(0,i);
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

/* ============================================================
   LEVEL SYSTEM
   ============================================================ */
function getXpForLevel(level) {
  if (level <= 1) return 0;
  return 50 * Math.pow(2, level - 2);
}

function getMaxLevel() {
  return 50;
}

function getLevelProgress(xp) {
  let level = 1;
  let xpForNextLevel = 50;
  let xpInCurrentLevel = 0;
  let totalXpNeeded = 0;

  while (true) {
    const needed = getXpForLevel(level + 1);
    if (level >= getMaxLevel()) break;
    if (xp < needed) {
      xpInCurrentLevel = xp - getXpForLevel(level);
      xpForNextLevel = needed - getXpForLevel(level);
      totalXpNeeded = needed;
      break;
    }
    level++;
    if (level >= getMaxLevel()) {
      xpInCurrentLevel = xp - getXpForLevel(level);
      xpForNextLevel = 1;
      totalXpNeeded = xp;
      break;
    }
  }

  if (level >= getMaxLevel()) {
    return { level: getMaxLevel(), xpInCurrentLevel: 0, xpForNextLevel: 1, totalXpNeeded: xp, isMaxLevel: true };
  }

  return { level, xpInCurrentLevel, xpForNextLevel, totalXpNeeded, isMaxLevel: false };
}

function addXp(amount) {
  if (!state.xp) state.xp = 0;
  state.xp += amount;

  const currentLevel = getLevelProgress(state.xp).level;
  if (currentLevel > state.level) {
    state.level = currentLevel;
    showToast(`🎉 УРОВЕНЬ ПОВЫШЕН! Теперь уровень ${state.level}!`);
  }
  save();
}

/* ============================================================
   SQUAD GENERATION
   ============================================================ */
function randomPlayerName(usedNames){
  let name;
  let guard = 0;
  do{
    name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    guard++;
  }while(usedNames.has(name) && guard < 50);
  usedNames.add(name);
  return name;
}

function generateSquad(){
  const usedNames = new Set();
  function randomName(){ return randomPlayerName(usedNames); }

  const mainSpec = ['ВР','ЗАЩ','ЗАЩ','ЗАЩ','ЗАЩ','ПЗ','ПЗ','ПЗ','ПЗ','НАП','НАП'];
  const benchSpec = ['ВР','ЗАЩ','ПЗ','НАП'];

  const players = [];
  mainSpec.forEach(code=>{
    players.push({
      id: uid(), name: randomName(), pos: code,
      power: rnd(10, 20),
      status: 'main',
      slot: null,
      training: false,
      trainingEndTime: null
    });
  });
  benchSpec.forEach(code=>{
    players.push({
      id: uid(), name: randomName(), pos: code,
      power: rnd(8, 15),
      status: 'bench',
      slot: null,
      training: false,
      trainingEndTime: null
    });
  });
  return players;
}

function calcClubPower(players){
  return players.filter(p=>p.status==='main').reduce((sum,p)=>sum+p.power,0);
}

/* ============================================================
   PERSISTENCE
   ============================================================ */
function newGameState(teamName){
  const players = generateSquad();
  const cups = {};
  TOURNAMENTS.forEach(t=> cups[t.id] = null);
  const s = {
    teamName,
    players,
    coins: 7500,
    budget: 0,
    trophies: [],
    stats: { wins:0, draws:0, losses:0, matchesPlayed:0 },
    cups,
    trainingSlots: [],
    trainingSlotsMax: 3,
    level: 1,
    xp: 0,
    transferMarket: { players: [], generatedAt: 0 },
    formation: DEFAULT_FORMATION,
    lineups: {}
  };
  ensureLineupsInit(s);
  autoFillEmptyLineup(s, s.formation);
  syncStatusFromLineup(s);
  return s;
}

function save(){
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
function load(){
  const raw = localStorage.getItem(SAVE_KEY);
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ return null; }
}

function migrateState(s){
  if(!Array.isArray(s.trophies)) s.trophies = [];
  if(!s.stats) s.stats = { wins:0, draws:0, losses:0, matchesPlayed:0 };
  if(!s.cups){
    s.cups = {};
    TOURNAMENTS.forEach(t=> s.cups[t.id] = null);
  } else {
    if(s.cup !== undefined){
      if(!s.cups.novice) s.cups.novice = s.cup;
      delete s.cup;
    }
    TOURNAMENTS.forEach(t=>{ if(!(t.id in s.cups)) s.cups[t.id] = null; });
  }
  if(!s.trainingSlots) s.trainingSlots = [];
  if(!s.trainingSlotsMax) s.trainingSlotsMax = 3;
  s.players.forEach(p => {
    if(p.training === undefined) p.training = false;
    if(p.trainingEndTime === undefined) p.trainingEndTime = null;
  });
  if(s.level === undefined) s.level = 1;
  if(s.xp === undefined) s.xp = 0;
  if(!s.transferMarket) s.transferMarket = { players: [], generatedAt: 0 };
  if(!s.formation || !FORMATIONS[s.formation]) s.formation = DEFAULT_FORMATION;
  s.players.forEach(p => { if(p.slot === undefined) p.slot = null; });

  if(!s.lineups){
    s.lineups = {};
    FORMATION_IDS.forEach(id => { s.lineups[id] = new Array(FORMATIONS[id].slots.length).fill(null); });
    autoFillFormationSlots(s, s.formation);
    s.players.forEach(p=>{
      if(p.status === 'main' && Number.isInteger(p.slot)){
        s.lineups[s.formation][p.slot] = p.id;
      }
    });
  }
  ensureLineupsInit(s);
  syncStatusFromLineup(s);
  return s;
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', ()=>{
  const existing = load();
  if(existing){
    state = migrateState(existing);
    showApp();
  } else {
    showRegister();
  }
  bindGlobalEvents();
});

function showRegister(){
  document.getElementById('screen-register').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}
function showApp(){
  document.getElementById('screen-register').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  refreshTopbar();
  navigate('manager');
  restoreTrainingTimers();
}

/* ============================================================
   GLOBAL EVENT BINDING
   ============================================================ */
function bindGlobalEvents(){
  document.getElementById('btn-confirm-register').addEventListener('click', onRegisterConfirm);
  document.getElementById('team-name-input').addEventListener('keydown', e=>{
    if(e.key === 'Enter') onRegisterConfirm();
  });

  document.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click', ()=> navigate(el.dataset.nav));
  });

  document.getElementById('btn-reset-game').addEventListener('click', onResetGame);

  document.getElementById('player-modal-close').addEventListener('click', closePlayerModal);
  document.getElementById('player-modal').addEventListener('click', e=>{
    if(e.target.id === 'player-modal') closePlayerModal();
  });

  document.getElementById('btn-cup-back').addEventListener('click', ()=> navigate('play'));
  document.getElementById('btn-cup-start').addEventListener('click', onCupStart);
  document.getElementById('btn-play-now').addEventListener('click', onPlayNow);
  document.getElementById('btn-leave-cup').addEventListener('click', onLeaveCup);

  document.querySelectorAll('.coin-buy-btn[data-coins]').forEach(btn=>{
    btn.addEventListener('click', ()=> onBuyCoins(btn));
  });
  document.querySelectorAll('.euro-buy-btn[data-euro]').forEach(btn=>{
    btn.addEventListener('click', ()=> onBuyEuro(btn));
  });

  bindTopbarScroll();
}

/* ============================================================
   TOPBAR SCROLL — сжатие при скролле вниз
   ============================================================ */
let topbarScrollBound = false;

function bindTopbarScroll(){
  if(topbarScrollBound) return;
  topbarScrollBound = true;

  const topbar = document.getElementById('topbar');
  if(!topbar) return;

  let ticking = false;
  const COMPACT_AT = 40;

  function onScroll(){
    const y = window.scrollY || window.pageYOffset || 0;
    if(y > COMPACT_AT && !topbar.classList.contains('compact')){
      topbar.classList.add('compact');
    } else if(y <= COMPACT_AT && topbar.classList.contains('compact')){
      topbar.classList.remove('compact');
    }
    ticking = false;
  }

  window.addEventListener('scroll', ()=>{
    if(!ticking){
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
}

/* ============================================================
   BANK — FREE COIN PURCHASE
   ============================================================ */
function onBuyCoins(btn){
  const amount = parseInt(btn.dataset.coins, 10);
  if(!amount) return;

  state.coins += amount;
  save();
  refreshTopbar();

  showToast(`+${amount.toLocaleString('ru-RU')} монет зачислено!`);

  btn.classList.add('coin-buy-pop');
  setTimeout(()=> btn.classList.remove('coin-buy-pop'), 350);
}

/* ============================================================
   BANK — FREE EURO / BUDGET PURCHASE
   ============================================================ */
function onBuyEuro(btn){
  const amount = parseInt(btn.dataset.euro, 10);
  if(!amount) return;

  state.budget += amount;
  save();
  refreshTopbar();

  showToast(`+${amount.toLocaleString('ru-RU')} бюджета зачислено!`);

  btn.classList.add('coin-buy-pop');
  setTimeout(()=> btn.classList.remove('coin-buy-pop'), 350);
}

function onRegisterConfirm(){
  const input = document.getElementById('team-name-input');
  let name = input.value.trim();
  if(!name){ input.focus(); input.style.borderColor = 'var(--red)'; return; }
  state = newGameState(name);
  save();
  showApp();
}

function onResetGame(){
  if(!confirm('Точно сбросить весь прогресс игры?')) return;
  localStorage.removeItem(SAVE_KEY);
  stopCupTimer();
  clearAllTrainingTimers();
  state = null;
  document.getElementById('team-name-input').value = '';
  showRegister();
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigate(name, cupId){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));

  const map = { manager:'view-manager', play:'view-play', team:'view-team', transfer:'view-transfer', bank:'view-bank', cup:'view-cup' };
  const viewEl = document.getElementById(map[name]);
  if(viewEl) viewEl.classList.add('active');

  const navKey = (name === 'cup') ? 'play' : name;
  if(navKey){
    const btn = document.querySelector(`.nav-btn[data-nav="${navKey}"]`);
    if(btn) btn.classList.add('active');
  }

  if(name === 'team') renderTeam();
  if(name === 'play') renderTournaments();
  if(name === 'transfer') renderTransferMarket();
  if(name === 'cup'){
    if(cupId) currentCupId = cupId;
    renderCupScreen();
  }
  if(name === 'manager') renderManager();
}

/* ============================================================
   TOPBAR
   ============================================================ */
function refreshTopbar(){
  const power = calcClubPower(state.players);
  document.getElementById('stat-coins').textContent = state.coins.toLocaleString('ru-RU');
  document.getElementById('stat-budget').textContent = state.budget.toLocaleString('ru-RU');
  document.getElementById('stat-power').textContent = power;
  document.getElementById('topbar-level').textContent = state.level;
}

/* ============================================================
   TEAM VIEW
   ============================================================ */
function renderTeam(){
  renderFormationSelector();
  renderPitch();

  const bench = state.players.filter(p=>p.status==='bench');
  document.getElementById('squad-bench').innerHTML = bench.length
    ? bench.map(p => playerCardHtml(p, false)).join('')
    : `<div class="stub-card"><div class="stub-icon">🪑</div><p>Нет запасных игроков</p></div>`;

  document.querySelectorAll('#squad-bench .player-card').forEach(card=>{
    card.addEventListener('click', ()=> openPlayerModal(card.dataset.id));
  });

  document.getElementById('team-slots-card').innerHTML = trainingSlotUpgradeHtml();
  const slotBtn = document.getElementById('btn-buy-slot');
  if(slotBtn){
    slotBtn.addEventListener('click', onBuySlotUpgrade);
  }
}

function renderFormationSelector(){
  const el = document.getElementById('formation-select');
  if(!el) return;
  el.innerHTML = FORMATION_IDS.map(id => `
    <button class="formation-btn ${state.formation===id ? 'active':''}" data-formation="${id}">${id}</button>
  `).join('');

  el.querySelectorAll('.formation-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.formation;
      if(id === state.formation) return;
      applyFormation(id);
      renderTeam();
      showToast(`⚽ Схема изменена на ${id}`);
    });
  });
}

function shortPlayerName(name){
  const parts = name.split(' ');
  if(parts.length < 2) return name;
  return `${parts[0][0]}. ${parts[1]}`;
}

function renderPitch(){
  const pitchEl = document.getElementById('pitch');
  if(!pitchEl) return;
  const formation = FORMATIONS[state.formation] || FORMATIONS[DEFAULT_FORMATION];

  pitchEl.innerHTML = formation.slots.map((slot, idx)=>{
    const pos = posByCode(slot.pos);
    const occupant = state.players.find(p => p.status==='main' && p.slot===idx);
    if(occupant){
      return `
      <div class="pitch-slot filled" style="left:${slot.x}%; top:${slot.y}%;" data-slot="${idx}" data-player="${occupant.id}">
        <span class="pitch-slot-pos ${pos.css}">${slot.pos}</span>
        <span class="pitch-slot-name">${shortPlayerName(occupant.name)}</span>
        <span class="pitch-slot-power">${occupant.power}</span>
      </div>`;
    }
    return `
      <div class="pitch-slot empty" style="left:${slot.x}%; top:${slot.y}%;" data-slot="${idx}">
        <span class="pitch-slot-plus">+</span>
        <span class="pitch-slot-pos ${pos.css}">${slot.pos}</span>
      </div>`;
  }).join('');

  pitchEl.querySelectorAll('.pitch-slot').forEach(el=>{
    el.addEventListener('click', ()=>{
      const idx = parseInt(el.dataset.slot, 10);
      if(el.classList.contains('filled')){
        openPlayerModal(el.dataset.player);
      } else {
        openSlotPicker(idx);
      }
    });
  });
}

function applyFormation(formationId){
  if(!FORMATIONS[formationId]) return;
  state.formation = formationId;
  syncStatusFromLineup(state);
  save();
  refreshTopbar();
}

function hasAvailableSlotForPos(posCode){
  const formation = FORMATIONS[state.formation] || FORMATIONS[DEFAULT_FORMATION];
  const usedSlots = new Set(state.players.filter(p=>p.status==='main').map(p=>p.slot));
  return formation.slots.some((slot, idx) => slot.pos === posCode && !usedSlots.has(idx));
}

function firstAvailableSlotForPos(posCode){
  const formation = FORMATIONS[state.formation] || FORMATIONS[DEFAULT_FORMATION];
  const usedSlots = new Set(state.players.filter(p=>p.status==='main').map(p=>p.slot));
  let found = -1;
  formation.slots.forEach((slot, idx)=>{
    if(found === -1 && slot.pos === posCode && !usedSlots.has(idx)) found = idx;
  });
  return found;
}

function openSlotPicker(slotIdx){
  const formation = FORMATIONS[state.formation] || FORMATIONS[DEFAULT_FORMATION];
  const slot = formation.slots[slotIdx];
  if(!slot) return;
  const pos = posByCode(slot.pos);
  const eligible = state.players.filter(p => p.status==='bench' && p.pos===slot.pos);

  document.getElementById('player-modal-body').innerHTML = `
    <div class="pm-name">Выбор игрока</div>
    <div class="pm-pos">Позиция: ${posLabel(slot.pos)}</div>
    ${eligible.length ? `
      <div class="slot-picker-list">
        ${eligible.map(p => `
          <div class="slot-picker-row" data-id="${p.id}">
            <span class="player-pos ${pos.css}">${p.pos}</span>
            <span class="slot-picker-name">${p.name}</span>
            <span class="slot-picker-power">${p.power}</span>
          </div>`).join('')}
      </div>`
      : `<div class="stub-card"><div class="stub-icon">🚫</div><p>Нет запасных игроков на позицию «${posLabel(slot.pos)}»</p></div>`}
  `;
  document.getElementById('player-modal').classList.remove('hidden');

  document.querySelectorAll('.slot-picker-row').forEach(row=>{
    row.addEventListener('click', ()=>{
      assignPlayerToSlot(row.dataset.id, slotIdx);
      closePlayerModal();
      renderTeam();
    });
  });
}

function assignPlayerToSlot(playerId, slotIdx){
  const formation = FORMATIONS[state.formation] || FORMATIONS[DEFAULT_FORMATION];
  const slot = formation.slots[slotIdx];
  const p = state.players.find(pl => pl.id === playerId);
  if(!p || !slot || p.pos !== slot.pos) return false;

  ensureLineupsInit(state);
  const lineup = state.lineups[state.formation];
  for(let i=0;i<lineup.length;i++){ if(lineup[i]===playerId) lineup[i] = null; }
  lineup[slotIdx] = playerId;

  syncStatusFromLineup(state);
  save();
  refreshTopbar();
  showToast(`🔺 ${p.name} вышел на поле!`);
  return true;
}

/* ============================================================
   TRAINING SLOT UPGRADES
   ============================================================ */
const SLOT_UPGRADE_COSTS = { 4: 500000, 5: 1000000 };
const SLOT_UPGRADE_MAX = 5;

function trainingSlotUpgradeHtml(){
  const current = state.trainingSlotsMax || 3;

  if(current >= SLOT_UPGRADE_MAX){
    return `
      <div class="slots-card">
        <div class="slots-card-head">
          <span class="slots-card-icon">⏱️</span>
          <div>
            <div class="slots-card-title">Слоты тренировок</div>
            <div class="slots-card-sub">Максимум достигнут — ${current}/${SLOT_UPGRADE_MAX}</div>
          </div>
        </div>
      </div>`;
  }

  const nextMax = current + 1;
  const cost = SLOT_UPGRADE_COSTS[nextMax];
  const affordable = state.budget >= cost;

  return `
    <div class="slots-card">
      <div class="slots-card-head">
        <span class="slots-card-icon">⏱️</span>
        <div>
          <div class="slots-card-title">Слоты тренировок</div>
          <div class="slots-card-sub">Сейчас доступно: ${current}/${SLOT_UPGRADE_MAX} одновременных тренировок</div>
        </div>
      </div>
      <button id="btn-buy-slot" class="btn-primary btn-big" ${affordable ? '' : 'disabled style="opacity:.5;cursor:not-allowed;"'}>
        ⏫ Увеличить до ${nextMax} — <img src="${IMG.cash}" class="img-icon" alt="€"> ${cost.toLocaleString('ru-RU')}
      </button>
    </div>`;
}

function onBuySlotUpgrade(){
  const current = state.trainingSlotsMax || 3;
  const nextMax = current + 1;
  const cost = SLOT_UPGRADE_COSTS[nextMax];
  if(!cost) return;

  if(state.budget < cost){
    showToast('Недостаточно бюджета для улучшения!');
    return;
  }

  state.budget -= cost;
  state.trainingSlotsMax = nextMax;
  save();
  refreshTopbar();
  renderTeam();
  showToast(`⏱️ Слоты тренировок увеличены до ${nextMax}!`);
}

/* ============================================================
   TRANSFER MARKET
   ============================================================ */
const TRANSFER_MARKET_SIZE = 12;
const TRANSFER_REFRESH_MS = 60 * 60 * 1000;
const TRANSFER_MIN_POWER = 30;
const TRANSFER_MAX_POWER = 1000;

function transferPlayerPrice(power){
  return Math.round(power / 10) * 1000;
}

function sellPlayerPrice(power){
  return Math.max(300, Math.round(transferPlayerPrice(power) * 0.5 / 100) * 100);
}

function generateTransferPlayer(usedNames){
  const posCode = pick(POSITIONS).code;
  const power = rnd(TRANSFER_MIN_POWER, TRANSFER_MAX_POWER);
  return {
    id: uid(),
    name: randomPlayerName(usedNames),
    pos: posCode,
    power,
    price: transferPlayerPrice(power)
  };
}

function generateTransferMarket(){
  const usedNames = new Set();
  const players = [];
  for(let i = 0; i < TRANSFER_MARKET_SIZE; i++){
    players.push(generateTransferPlayer(usedNames));
  }
  players.sort((a,b) => a.power - b.power);
  state.transferMarket = { players, generatedAt: Date.now() };
  save();
}

function ensureTransferMarket(){
  const market = state.transferMarket;
  if(!market || !market.players || !market.players.length || (Date.now() - (market.generatedAt || 0)) >= TRANSFER_REFRESH_MS){
    generateTransferMarket();
  }
}

function transferPlayerCardHtml(p){
  const pos = posByCode(p.pos);
  const pct = clamp(Math.round((p.power/1000)*100), 4, 100);
  const affordable = state.coins >= p.price;
  return `
  <div class="transfer-card">
    <span class="player-pos ${pos.css}">${pos.code}</span>
    <span class="player-name">${p.name}</span>
    <div class="power-bar"><div class="power-bar-fill" style="width:${pct}%"></div></div>
    <div class="player-power-row">
      <span style="font-size:11px;color:var(--text-mute)">Сила</span>
      <span class="player-power">${p.power}</span>
    </div>
    <button class="btn-primary transfer-buy-btn" data-id="${p.id}" ${affordable ? '' : 'disabled style="opacity:.5;cursor:not-allowed;"'}>
      <img src="${IMG.coin}" class="img-icon" alt="Монеты"> ${p.price.toLocaleString('ru-RU')}
    </button>
  </div>`;
}

function renderTransferMarket(){
  ensureTransferMarket();

  const list = document.getElementById('transfer-list');
  const players = state.transferMarket.players;
  list.innerHTML = players.length
    ? players.map(p => transferPlayerCardHtml(p)).join('')
    : `<div class="stub-card"><div class="stub-icon">🔁</div><p>Рынок пуст. Загляните позже.</p></div>`;

  list.querySelectorAll('.transfer-buy-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      onBuyTransferPlayer(btn.dataset.id, btn);
    });
  });

  updateTransferTimer();
  if(transferTimerInterval){
    clearInterval(transferTimerInterval);
    transferTimerInterval = null;
  }
  transferTimerInterval = setInterval(()=>{
    const view = document.getElementById('view-transfer');
    if(!view || !view.classList.contains('active')){
      clearInterval(transferTimerInterval);
      transferTimerInterval = null;
      return;
    }
    updateTransferTimer();
  }, 1000);
}

function updateTransferTimer(){
  const timerEl = document.getElementById('transfer-timer');
  if(!timerEl) return;

  const generatedAt = state.transferMarket.generatedAt || Date.now();
  const remaining = Math.max(0, (generatedAt + TRANSFER_REFRESH_MS) - Date.now());

  if(remaining <= 0){
    generateTransferMarket();
    renderTransferMarket();
    return;
  }

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  timerEl.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

function onBuyTransferPlayer(playerId, btnEl){
  const market = state.transferMarket;
  const idx = market.players.findIndex(p => p.id === playerId);
  if(idx === -1) return;
  const p = market.players[idx];

  if(state.coins < p.price){
    showToast('Недостаточно монет для покупки!');
    return;
  }

  state.coins -= p.price;
  state.players.push({
    id: uid(),
    name: p.name,
    pos: p.pos,
    power: p.power,
    status: 'bench',
    slot: null,
    training: false,
    trainingEndTime: null
  });
  market.players.splice(idx, 1);
  save();
  refreshTopbar();

  if(btnEl){
    btnEl.classList.add('coin-buy-pop');
    setTimeout(()=> btnEl.classList.remove('coin-buy-pop'), 350);
  }

  showToast(`✅ ${p.name} куплен и добавлен в запас!`);
  renderTransferMarket();
}

function playerCardHtml(p, isMain){
  const pos = posByCode(p.pos);
  const pct = clamp(Math.round((p.power/60)*100), 4, 100);
  const isTraining = p.training;

  return `
  <div class="player-card ${isTraining ? 'training' : ''}" data-id="${p.id}">
    ${p.status==='bench' ? '<span class="bench-tag">ЗАП</span>' : ''}
    ${isTraining ? '<span class="training-badge">⏳ ТРЕНИРОВКА</span>' : ''}
    <span class="player-pos ${pos.css}">${pos.code}</span>
    <span class="player-name">${p.name}</span>
    <div class="power-bar"><div class="power-bar-fill" style="width:${pct}%"></div></div>
    <div class="player-power-row">
      <span style="font-size:11px;color:var(--text-mute)">Сила</span>
      <span class="player-power">${p.power}</span>
    </div>
  </div>`;
}

function openPlayerModal(id){
  const p = state.players.find(pl=>pl.id===id);
  if(!p) return;
  const pos = posByCode(p.pos);
  const isTraining = p.training;
  const trainingSlots = state.trainingSlots.length;
  const maxSlots = state.trainingSlotsMax || 3;

  let trainingButton = '';
  let timeDisplay = '';

  if(isTraining) {
    let timeLeft = '0:00';
    if(p.trainingEndTime) {
      const remaining = Math.max(0, Math.floor((p.trainingEndTime - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      timeLeft = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    timeDisplay = `<div style="color:var(--gold);font-weight:700;margin-top:8px;font-size:18px;">⏳ Осталось: ${timeLeft}</div>`;
    trainingButton = `<button class="btn-secondary" disabled style="opacity:0.5;cursor:not-allowed;">⏳ Тренировка идёт...</button>`;
  } else if(trainingSlots >= maxSlots) {
    trainingButton = `<button class="btn-secondary" disabled style="opacity:0.5;cursor:not-allowed;">❌ Все слоты заняты (${trainingSlots}/${maxSlots})</button>`;
  } else if(state.coins < 1000) {
    trainingButton = `<button class="btn-secondary" disabled style="opacity:0.5;cursor:not-allowed;">💰 Недостаточно монет (нужно 1000)</button>`;
  } else {
    trainingButton = `<button id="btn-train-player" class="btn-primary" style="margin-top:12px;">💪 ТРЕНИРОВАТЬ (1000 <img src="${IMG.coin}" class="img-icon" alt="Монеты">)</button>`;
  }

  let swapButton = '';
  if(p.status === 'main'){
    swapButton = `<button id="btn-swap-status" class="btn-secondary btn-big" style="margin-top:10px;">🔻 Отправить в запас</button>`;
  } else {
    const canPlace = hasAvailableSlotForPos(p.pos);
    swapButton = canPlace
      ? `<button id="btn-swap-status" class="btn-primary btn-big" style="margin-top:10px;">🔺 В основной состав</button>`
      : `<button class="btn-secondary btn-big" disabled style="margin-top:10px;opacity:0.5;cursor:not-allowed;">❌ Нет места на позиции «${posLabel(p.pos)}» в схеме ${state.formation}</button>`;
  }

  let sellButton = '';
  if(p.status === 'bench'){
    const price = sellPlayerPrice(p.power);
    sellButton = `<button id="btn-sell-player" class="btn-danger btn-big" style="margin-top:10px;">💰 Продать за ${price.toLocaleString('ru-RU')} <img src="${IMG.coin}" class="img-icon" alt="Монеты"></button>`;
  }

  document.getElementById('player-modal-body').innerHTML = `
    <span class="player-pos ${pos.css}">${pos.code}</span>
    <div class="pm-name">${p.name}</div>
    <div class="pm-pos">${posLabel(p.pos)}</div>
    <div class="pm-power-label">СИЛА ИГРОКА</div>
    <div class="pm-power-value">${p.power}</div>
    <div class="pm-status">Статус: ${p.status==='main' ? 'Основной состав' : 'Запасной'}</div>
    ${timeDisplay}
    <div style="margin-top:8px;font-size:11px;color:var(--text-mute);">
      Слоты тренировок: ${trainingSlots}/${maxSlots}
    </div>
    ${trainingButton}
    ${swapButton}
    ${sellButton}
  `;
  document.getElementById('player-modal').classList.remove('hidden');

  if(isTraining && p.trainingEndTime) {
    startTrainingTimeUpdate(id);
  }

  const btn = document.getElementById('btn-train-player');
  if(btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      startTraining(id);
    });
  }

  const swapBtn = document.getElementById('btn-swap-status');
  if(swapBtn){
    swapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSquadStatus(id);
    });
  }

  const sellBtn = document.getElementById('btn-sell-player');
  if(sellBtn){
    sellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSellPlayer(id);
    });
  }
}

function onSellPlayer(playerId){
  const p = state.players.find(pl=>pl.id===playerId);
  if(!p) return;
  if(p.status !== 'bench'){
    showToast('❌ Нельзя продать игрока из основного состава — сначала отправьте в запас');
    return;
  }
  const price = sellPlayerPrice(p.power);
  if(!confirm(`Продать ${p.name} за ${price.toLocaleString('ru-RU')} монет? Это действие нельзя отменить.`)){
    return;
  }

  if(state.lineups){
    Object.keys(state.lineups).forEach(fid=>{
      const lineup = state.lineups[fid];
      for(let i=0;i<lineup.length;i++){ if(lineup[i]===playerId) lineup[i] = null; }
    });
  }
  state.players = state.players.filter(pl=>pl.id!==playerId);
  state.coins += price;

  save();
  refreshTopbar();
  closePlayerModal();
  renderTeam();
  showToast(`💰 ${p.name} продан за ${price.toLocaleString('ru-RU')} монет`);
}

const MAIN_SQUAD_SIZE = 11;

function toggleSquadStatus(playerId){
  const p = state.players.find(pl=>pl.id===playerId);
  if(!p) return;

  ensureLineupsInit(state);
  const lineup = state.lineups[state.formation];

  if(p.status === 'main'){
    for(let i=0;i<lineup.length;i++){ if(lineup[i]===playerId) lineup[i] = null; }
    syncStatusFromLineup(state);
    save();
    refreshTopbar();
    renderTeam();
    openPlayerModal(playerId);
    showToast(`🔻 ${p.name} отправлен в запас`);
  } else {
    const targetSlot = firstAvailableSlotForPos(p.pos);
    if(targetSlot === -1){
      showToast(`❌ Нет места на позиции «${posLabel(p.pos)}» в схеме ${state.formation}`);
      return;
    }
    lineup[targetSlot] = playerId;
    syncStatusFromLineup(state);
    save();
    refreshTopbar();
    renderTeam();
    openPlayerModal(playerId);
    showToast(`🔺 ${p.name} в основном составе!`);
  }
}

function startTrainingTimeUpdate(playerId) {
  if(trainingUpdateInterval) {
    clearInterval(trainingUpdateInterval);
    trainingUpdateInterval = null;
  }

  trainingUpdateInterval = setInterval(() => {
    const modal = document.getElementById('player-modal');
    if(modal.classList.contains('hidden')) {
      clearInterval(trainingUpdateInterval);
      trainingUpdateInterval = null;
      return;
    }

    const p = state.players.find(pl => pl.id === playerId);
    if(!p || !p.training || !p.trainingEndTime) {
      clearInterval(trainingUpdateInterval);
      trainingUpdateInterval = null;
      return;
    }

    const remaining = Math.max(0, Math.floor((p.trainingEndTime - Date.now()) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const timeDisplay = modal.querySelector('.pm-power-value')?.parentElement?.querySelector('[style*="color:var(--gold)"]');
    if(timeDisplay) {
      timeDisplay.textContent = `⏳ Осталось: ${timeStr}`;
    }

    if(remaining <= 0) {
      clearInterval(trainingUpdateInterval);
      trainingUpdateInterval = null;
      finishTraining(playerId);
      closePlayerModal();
      renderTeam();
    }
  }, 1000);
}

function startTraining(playerId){
  const p = state.players.find(pl=>pl.id===playerId);
  if(!p) return;

  if(p.training) {
    showToast('Игрок уже тренируется');
    return;
  }

  const maxSlots = state.trainingSlotsMax || 3;
  if(state.trainingSlots.length >= maxSlots) {
    showToast(`Все слоты тренировок заняты (${maxSlots}/${maxSlots})`);
    return;
  }

  if(state.coins < 1000) {
    showToast('Недостаточно монет! Нужно 1000');
    return;
  }

  state.coins -= 1000;
  p.training = true;
  const endTime = Date.now() + 60000;
  p.trainingEndTime = endTime;
  state.trainingSlots.push(playerId);
  save();
  refreshTopbar();
  closePlayerModal();
  renderTeam();

  showToast(`⏳ Тренировка ${p.name} началась! (1 мин.)`);

  const timerId = setTimeout(() => {
    finishTraining(playerId);
  }, 60000);

  trainingTimers[playerId] = timerId;
}

function finishTraining(playerId){
  const p = state.players.find(pl=>pl.id===playerId);
  if(!p) return;

  if(!p.training) return;

  const powerGain = 10;
  p.power += powerGain;
  p.training = false;
  p.trainingEndTime = null;

  const index = state.trainingSlots.indexOf(playerId);
  if(index !== -1) {
    state.trainingSlots.splice(index, 1);
  }

  delete trainingTimers[playerId];

  if(trainingUpdateInterval) {
    clearInterval(trainingUpdateInterval);
    trainingUpdateInterval = null;
  }

  save();
  refreshTopbar();
  renderTeam();

  showToast(`✅ ${p.name} завершил тренировку! +${powerGain} силы (теперь ${p.power})`);
}

function restoreTrainingTimers(){
  const now = Date.now();
  state.trainingSlots.forEach(playerId => {
    const p = state.players.find(pl=>pl.id===playerId);
    if(p && p.training && p.trainingEndTime) {
      const remaining = p.trainingEndTime - now;
      if(remaining > 0) {
        const timerId = setTimeout(() => {
          finishTraining(playerId);
        }, remaining);
        trainingTimers[playerId] = timerId;
      } else {
        finishTraining(playerId);
      }
    }
  });
}

function clearAllTrainingTimers(){
  Object.keys(trainingTimers).forEach(key => {
    clearTimeout(trainingTimers[key]);
    delete trainingTimers[key];
  });
  if(trainingUpdateInterval) {
    clearInterval(trainingUpdateInterval);
    trainingUpdateInterval = null;
  }
}

function closePlayerModal(){
  document.getElementById('player-modal').classList.add('hidden');
  if(trainingUpdateInterval) {
    clearInterval(trainingUpdateInterval);
    trainingUpdateInterval = null;
  }
}

function posLabel(code){
  return { 'ВР':'Вратарь', 'ЗАЩ':'Защитник', 'ПЗ':'Полузащитник', 'НАП':'Нападающий' }[code] || code;
}

/* ============================================================
   LEAVE CUP
   ============================================================ */
function onLeaveCup() {
  const t = tournamentById(currentCupId);
  if (!t) return;

  if (!confirm(`Вы уверены, что хотите покинуть "${t.title}"? Весь прогресс в этом турнире будет потерян.`)) {
    return;
  }

  stopCupTimer();

  state.cups[currentCupId] = null;
  save();

  navigate('play');
  showToast(`Вы покинули "${t.title}"`);
}

/* ============================================================
   MANAGER SCREEN
   ============================================================ */
function renderManager(){
  refreshTopbar();
  const power = calcClubPower(state.players);
  const heroPowerEl = document.getElementById('hero-power');
  if(heroPowerEl) heroPowerEl.textContent = power;
  const s = state.stats;

  const progress = getLevelProgress(state.xp);
  const level = progress.level;
  const xpInCurrentLevel = progress.xpInCurrentLevel;
  const xpForNextLevel = progress.xpForNextLevel;
  const isMaxLevel = progress.isMaxLevel;

  const xpPercent = isMaxLevel ? 100 : Math.min(100, Math.round((xpInCurrentLevel / xpForNextLevel) * 100));

  const trophiesCount = {};
  state.trophies.forEach(t => {
    const key = t.name;
    if (!trophiesCount[key]) {
      const matchedTournament = TOURNAMENTS.find(x => x.title === t.name);
      trophiesCount[key] = { count: 0, tournament: matchedTournament || null };
    }
    trophiesCount[key].count++;
  });

  const trophiesHtml = Object.keys(trophiesCount).length
    ? Object.keys(trophiesCount).map(name => {
        const data = trophiesCount[name];
        const countText = data.count > 1 ? `×${data.count}` : '';
        return `
          <div class="mgr-trophy-item">
            ${trophyIconHtml(data.tournament)}
            <span class="mgr-trophy-name">${name}</span>
            <span class="mgr-trophy-count">${countText}</span>
          </div>`;
      }).join('')
    : `<div class="mgr-empty">Пока нет завоёванных кубков</div>`;

  const xpToNext = isMaxLevel ? 0 : getXpForLevel(level + 1) - state.xp;

  document.getElementById('manager-body').innerHTML = `
    <div class="mgr-card">
      <div class="mgr-club-row">
        <span class="mgr-club-name">${state.teamName}</span>
        <span class="mgr-power-pill">СИЛА ${power}</span>
      </div>

      <div style="margin: 12px 0; background: var(--surface-3); padding: 12px; border-radius: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; color: var(--text-dim); letter-spacing: 1px;">УРОВЕНЬ</div>
            <div style="font-family: var(--ff-display); font-size: 28px; color: var(--gold);">
              ${level} ${isMaxLevel ? '👑' : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: var(--text-dim);">ОПЫТ</div>
            <div style="font-family: var(--ff-display); font-size: 18px; color: var(--text);">
              ${isMaxLevel ? 'MAX' : `${state.xp} / ${getXpForLevel(level + 1)}`}
            </div>
          </div>
        </div>
        ${!isMaxLevel ? `
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-mute);">
            <span>${xpInCurrentLevel} XP</span>
            <span>До ${level + 1} уровня: ${xpToNext} XP</span>
          </div>
          <div style="height: 6px; background: var(--surface); border-radius: 4px; overflow: hidden; margin-top: 2px;">
            <div style="height: 100%; width: ${xpPercent}%; background: linear-gradient(90deg, var(--green-dark), var(--gold)); border-radius: 4px; transition: width 0.3s;"></div>
          </div>
        </div>
        ` : `
        <div style="margin-top: 8px; text-align: center; color: var(--gold); font-weight: 700; font-size: 14px;">
          🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ ДОСТИГНУТ!
        </div>
        `}
      </div>

      <div class="mgr-finance-row">
        <div class="mgr-finance-chip"><div class="val"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> ${state.coins.toLocaleString('ru-RU')}</div><div class="lbl">МОНЕТЫ</div></div>
        <div class="mgr-finance-chip"><div class="val"><img src="${IMG.cash}" class="img-icon" alt="Бюджет"> ${state.budget.toLocaleString('ru-RU')}</div><div class="lbl">БЮДЖЕТ</div></div>
      </div>
      <div class="mgr-stats-grid">
        <div class="mgr-stat wins"><div class="mgr-stat-value">${s.wins}</div><div class="mgr-stat-label">ПОБЕДЫ</div></div>
        <div class="mgr-stat draws"><div class="mgr-stat-value">${s.draws}</div><div class="mgr-stat-label">НИЧЬИ</div></div>
        <div class="mgr-stat losses"><div class="mgr-stat-value">${s.losses}</div><div class="mgr-stat-label">ПОРАЖЕНИЯ</div></div>
        <div class="mgr-stat total"><div class="mgr-stat-value">${s.matchesPlayed}</div><div class="mgr-stat-label">ВСЕГО МАТЧЕЙ</div></div>
        <div class="mgr-stat xp"><div class="mgr-stat-value">${state.xp.toLocaleString('ru-RU')}</div><div class="mgr-stat-label">ВСЕГО ОПЫТА</div></div>
      </div>
    </div>
    <h3 class="squad-heading">КУБКИ</h3>
    <div class="mgr-trophy-list">${trophiesHtml}</div>
  `;
}

/* ============================================================
   TOURNAMENTS LIST
   ============================================================ */
function renderTournaments(){
  const power = calcClubPower(state.players);
  const mainCount = state.players.filter(p=>p.status==='main').length;
  const squadFull = mainCount >= MAIN_SQUAD_SIZE;
  const list = document.getElementById('tournament-list');

  list.innerHTML = TOURNAMENTS.map(t=>{
    const cup = state.cups[t.id];
    const inProgress = !!(cup && !cup.finished);
    const eligible = power >= t.min && power <= t.max;
    let statusText;
    if(inProgress) statusText = 'Турнир в процессе';
    else if(!squadFull) statusText = `Соберите состав (${mainCount}/${MAIN_SQUAD_SIZE})`;
    else if(eligible) statusText = `Сила клуба ${t.min}–${t.max}`;
    else statusText = `Нужна сила клуба ${t.min}–${t.max}`;

    return `
      <div class="tournament-card" data-cup="${t.id}">
        ${tournamentIconHtml(t)}
        <div class="tournament-info">
          <div class="tournament-name">${t.title}</div>
          <div class="tournament-status">${statusText}</div>
        </div>
        <div class="tournament-arrow">›</div>
      </div>`;
  }).join('');

  list.querySelectorAll('[data-cup]').forEach(card=>{
    card.addEventListener('click', ()=> navigate('cup', card.dataset.cup));
  });
}

/* ============================================================
   CUP SCREEN — SETUP
   ============================================================ */
function renderCupScreen(){
  const t = tournamentById(currentCupId);
  if(!t) return;
  document.getElementById('cup-title').textContent = t.title;

  const trophyEl = document.getElementById('cup-intro-trophy');
  if(trophyEl){
    const src = TROPHY_IMG[t.id];
    if(src){
      if(trophyEl.tagName !== 'IMG'){
        trophyEl.outerHTML = `<img id="cup-intro-trophy" src="${src}" class="cup-trophy-img" alt="${t.title}">`;
      } else {
        trophyEl.src = src;
      }
    } else {
      if(trophyEl.tagName !== 'DIV'){
        trophyEl.outerHTML = `<div id="cup-intro-trophy" class="cup-trophy">${t.icon}</div>`;
      } else {
        trophyEl.textContent = t.icon;
      }
    }
  }

  renderCupRewardsList(t);

  const power = calcClubPower(state.players);
  const mainCount = state.players.filter(p=>p.status==='main').length;
  const squadFull = mainCount >= MAIN_SQUAD_SIZE;
  const eligible = power >= t.min && power <= t.max;
  const introEl = document.getElementById('cup-intro');
  const bracketWrap = document.getElementById('cup-bracket-wrap');
  const eligEl = document.getElementById('cup-eligibility');
  const startBtn = document.getElementById('btn-cup-start');
  const cup = state.cups[t.id];

  if(cup && !cup.finished){
    syncPlayerCupTeam(cup);
    introEl.classList.add('hidden');
    bracketWrap.classList.remove('hidden');
    renderBracket();
    ensureCupFlowRunning();
    return;
  }

  bracketWrap.classList.add('hidden');
  introEl.classList.remove('hidden');
  stopCupTimer();

  if(!squadFull){
    eligEl.classList.add('bad');
    eligEl.textContent = `Соберите полный основной состав (${mainCount}/${MAIN_SQUAD_SIZE}), чтобы играть в турнирах.`;
    startBtn.classList.add('hidden');
  } else if(eligible){
    eligEl.classList.remove('bad');
    eligEl.textContent = `Сила клуба: ${power}. Ваша команда подходит для участия.`;
    startBtn.classList.remove('hidden');
  } else if(power < t.min){
    eligEl.classList.add('bad');
    eligEl.textContent = `Ваша команда слишком слабая для этого турнира. Нужна сила от ${t.min}.`;
    startBtn.classList.add('hidden');
  } else {
    eligEl.classList.add('bad');
    eligEl.textContent = 'Ваша команда слишком сильная для этого турнира.';
    startBtn.classList.add('hidden');
  }
}

function onCupStart(){
  const mainCount = state.players.filter(p=>p.status==='main').length;
  if(mainCount < MAIN_SQUAD_SIZE){
    showToast(`❌ Соберите полный состав (${mainCount}/${MAIN_SQUAD_SIZE}), чтобы играть в турнире`);
    return;
  }
  initCup(currentCupId);
  document.getElementById('cup-intro').classList.add('hidden');
  document.getElementById('cup-bracket-wrap').classList.remove('hidden');
  renderBracket();
  ensureCupFlowRunning();
}

function renderCupRewardsList(t){
  const el = document.getElementById('cup-rewards');
  if(!el) return;

  const totalRounds = Math.max(1, Math.round(Math.log2(t.teamCount)));
  const roundTitles = buildRoundTitles(t.teamCount);

  const rows = [];
  for(let round = 1; round <= totalRounds; round++){
    const isFinal = round === totalRounds;
    rows.push(`
      <div class="cup-reward-row ${isFinal ? 'final' : ''}">
        <span class="cup-reward-stage">${isFinal ? '🏆 ' : ''}${roundTitles[round] || `РАУНД ${round}`}</span>
        <span class="cup-reward-values">
          <span class="cup-reward-chip coins"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${t.stageRewardCoins.toLocaleString('ru-RU')}</span>
          <span class="cup-reward-chip power"><img src="${IMG.sila}" class="img-icon" alt="Сила"> +${t.stageRewardPower}</span>
          <span class="cup-reward-chip xp">⭐ +${t.xpPerWin} XP</span>
          ${isFinal ? `<span class="cup-reward-chip trophy"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${t.cupWinCoins.toLocaleString('ru-RU')}</span>` : ''}
        </span>
      </div>`);
  }

  el.innerHTML = `
    <div class="cup-rewards-title">ПРИЗОВЫЕ ЗА ЭТАПЫ</div>
    <div class="cup-rewards-list">${rows.join('')}</div>
  `;
}

function initCup(cupId){
  const t = tournamentById(cupId);
  const power = calcClubPower(state.players);
  const playerTeam = { id:'you', name: state.teamName, power, isPlayer:true, formation: state.formation };

  const botTeams = [];
  const names = shuffle([...t.teamNames]);
  const teamCount = t.teamCount - 1;

  for (let i = 0; i < teamCount; i++) {
    const name = names[i % names.length];
    const botPower = rnd(t.min, t.max);
    botTeams.push({
      id: uid(),
      name: name,
      power: botPower,
      isPlayer: false,
      formation: pick(FORMATION_IDS)
    });
  }

  const teams = shuffle([playerTeam, ...botTeams]);
  const matches = buildBracket(teams);

  state.cups[cupId] = {
    teams,
    matches,
    nextIndex: 0,
    finished:false,
    won:false,
    currentRound: 1,
    roundMatches: getRoundMatches(matches, 1)
  };
  save();
}

function buildBracket(teams) {
  const matches = [];
  let matchIdx = 0;
  const teamCount = teams.length;

  for (let i = 0; i < teamCount; i += 2) {
    matches.push({
      round: 1,
      a: { type: 'direct', idx: i },
      b: { type: 'direct', idx: i + 1 },
      played: false,
      teamA: null,
      teamB: null,
      scoreA: 0,
      scoreB: 0,
      winner: null,
      matchIdx: matchIdx++
    });
  }

  let round = 2;
  let prevRoundMatches = matches.filter(m => m.round === round - 1);

  while (prevRoundMatches.length > 1) {
    const roundMatches = [];
    for (let i = 0; i < prevRoundMatches.length; i += 2) {
      roundMatches.push({
        round: round,
        a: { type: 'winner', m: prevRoundMatches[i].matchIdx },
        b: { type: 'winner', m: prevRoundMatches[i + 1]?.matchIdx || prevRoundMatches[i].matchIdx },
        played: false,
        teamA: null,
        teamB: null,
        scoreA: 0,
        scoreB: 0,
        winner: null,
        matchIdx: matchIdx++
      });
    }
    matches.push(...roundMatches);
    prevRoundMatches = roundMatches;
    round++;
  }

  return matches;
}

function getRoundMatches(matches, round) {
  return matches.filter(m => m.round === round);
}

/* ============================================================
   CUP FLOW / TIMER
   ============================================================ */
function ensureCupFlowRunning(){
  if(cupTimer.running) return;
  const cup = state.cups[currentCupId];
  if(!cup || cup.finished) return;
  scheduleNextMatch();
}

function stopCupTimer(){
  if(cupTimer.intervalId) {
    clearInterval(cupTimer.intervalId);
    cupTimer.intervalId = null;
  }
  cupTimer.running = false;
  const el = document.getElementById('cup-countdown');
  if(el) el.textContent = '';
}

function scheduleNextMatch(){
  const cup = state.cups[currentCupId];
  if(!cup || cup.finished) return;
  if(cup.nextIndex >= cup.matches.length){
    finishCup();
    return;
  }

  if(cupTimer.intervalId) {
    clearInterval(cupTimer.intervalId);
    cupTimer.intervalId = null;
  }

  cupTimer.running = true;
  cupTimer.secondsLeft = 30;
  updateCountdownDisplay();

  cupTimer.intervalId = setInterval(()=>{
    cupTimer.secondsLeft--;
    updateCountdownDisplay();
    if(cupTimer.secondsLeft <= 0){
      clearInterval(cupTimer.intervalId);
      cupTimer.intervalId = null;
      cupTimer.running = false;
      playNextMatch();
    }
  }, 1000);
}

function updateCountdownDisplay(){
  const el = document.getElementById('cup-countdown');
  if(!el) return;
  if(cupTimer.secondsLeft > 0){
    el.textContent = `Следующий матч через: ${cupTimer.secondsLeft}`;
  } else {
    el.textContent = 'МАТЧ НАЧАЛСЯ!';
  }
}

function onPlayNow(){
  const cup = state.cups[currentCupId];
  if(!cup || cup.finished) return;

  if(cupTimer.intervalId) {
    clearInterval(cupTimer.intervalId);
    cupTimer.intervalId = null;
  }
  cupTimer.running = false;

  playCurrentRound();
}

function playCurrentRound() {
  const cup = state.cups[currentCupId];
  if(!cup || cup.finished) return;
  syncPlayerCupTeam(cup);

  const currentMatch = cup.matches[cup.nextIndex];
  if(!currentMatch) {
    finishCup();
    return;
  }

  const currentRound = currentMatch.round;
  const roundMatches = cup.matches.filter(m => m.round === currentRound && !m.played);

  if(roundMatches.length === 0) {
    scheduleNextMatch();
    return;
  }

  let matchIndex = 0;
  let tournamentEnded = false;

  function playNextRoundMatch() {
    if(tournamentEnded) return;

    if(matchIndex >= roundMatches.length) {
      renderBracket();
      save();

      if(cup.nextIndex >= cup.matches.length) {
        finishCup();
      } else {
        scheduleNextMatch();
      }
      return;
    }

    const match = roundMatches[matchIndex];
    const actualMatch = cup.matches.find(m => m.matchIdx === match.matchIdx);
    if(!actualMatch) {
      matchIndex++;
      playNextRoundMatch();
      return;
    }

    if(!actualMatch.teamA) actualMatch.teamA = resolveTeam(actualMatch.a, cup);
    if(!actualMatch.teamB) actualMatch.teamB = resolveTeam(actualMatch.b, cup);

    const result = simulateMatch(actualMatch.teamA.power, actualMatch.teamB.power, actualMatch.teamA.formation, actualMatch.teamB.formation);
    actualMatch.scoreA = result.scoreA;
    actualMatch.scoreB = result.scoreB;
    actualMatch.winner = result.aWon ? actualMatch.teamA : actualMatch.teamB;
    actualMatch.played = true;
    cup.nextIndex++;

    const playerInvolved = actualMatch.teamA.isPlayer || actualMatch.teamB.isPlayer;
    const playerWon = playerInvolved && actualMatch.winner.isPlayer;

    if(playerInvolved){
      state.stats.matchesPlayed++;
      if(playerWon) state.stats.wins++; else state.stats.losses++;
    }

    if(playerInvolved) {
      renderBracket();
      save();

      if(!playerWon) {
        tournamentEnded = true;
        cup.finished = true;
        cup.won = false;
        save();
        showMatchModal(actualMatch, false, () => {
          document.getElementById('match-modal').classList.add('hidden');
          renderCupScreen();
        });
      } else {
        showMatchModal(actualMatch, true, () => {
          matchIndex++;
          playNextRoundMatch();
        });
      }
    } else {
      showToast(`${actualMatch.teamA.name} ${actualMatch.scoreA}:${actualMatch.scoreB} ${actualMatch.teamB.name}`);
      renderBracket();
      save();
      matchIndex++;
      setTimeout(playNextRoundMatch, 500);
    }
  }

  playNextRoundMatch();
}

function resolveTeam(ref, cup){
  if(ref.type === 'direct') return cup.teams[ref.idx];
  const m = cup.matches.find(m => m.matchIdx === ref.m);
  return m ? m.winner : null;
}

function simulateMatch(powerA, powerB, formationA, formationB){
  const effA = powerA * formationMatchupMultiplier(formationA, formationB);
  const effB = powerB * formationMatchupMultiplier(formationB, formationA);

  let aWins;
  if(effA !== effB){
    aWins = effA > effB;
  } else if(powerA !== powerB){
    aWins = powerA > powerB;
  } else {
    aWins = Math.random() < 0.5;
  }

  const winnerGoals = 1 + rnd(0,3);
  const loserGoals = rnd(0, Math.max(0, winnerGoals-1));
  return aWins
    ? { scoreA: winnerGoals, scoreB: loserGoals, aWon:true }
    : { scoreA: loserGoals, scoreB: winnerGoals, aWon:false };
}

function syncPlayerCupTeam(cup){
  if(!cup) return;
  const you = cup.teams.find(t => t.isPlayer);
  if(you){
    you.power = calcClubPower(state.players);
    you.formation = state.formation;
  }
}

function playNextMatch(){
  const cup = state.cups[currentCupId];
  syncPlayerCupTeam(cup);
  const i = cup.nextIndex;
  const match = cup.matches[i];
  match.teamA = resolveTeam(match.a, cup);
  match.teamB = resolveTeam(match.b, cup);

  const result = simulateMatch(match.teamA.power, match.teamB.power, match.teamA.formation, match.teamB.formation);
  match.scoreA = result.scoreA;
  match.scoreB = result.scoreB;
  match.winner = result.aWon ? match.teamA : match.teamB;
  match.played = true;
  cup.nextIndex++;

  const playerInvolved = match.teamA.isPlayer || match.teamB.isPlayer;
  const playerWon = playerInvolved && match.winner.isPlayer;

  if(playerInvolved){
    state.stats.matchesPlayed++;
    if(playerWon) state.stats.wins++; else state.stats.losses++;
  }

  renderBracket();
  save();

  if(playerInvolved){
    showMatchModal(match, playerWon, () => continueAfterMatch(playerWon));
  } else {
    showToast(`${match.teamA.name} ${match.scoreA}:${match.scoreB} ${match.teamB.name}`);
    setTimeout(continueAfterMatch, 900, true);
  }
}

function continueAfterMatch(keepGoing){
  const cup = state.cups[currentCupId];
  if(!keepGoing){
    cup.finished = true;
    cup.won = false;
    save();
    renderCupScreen();
    return;
  }
  if(cup.nextIndex >= cup.matches.length){
    finishCup();
  } else {
    scheduleNextMatch();
  }
}

function finishCup(){
  const t = tournamentById(currentCupId);
  const cup = state.cups[currentCupId];
  const finalMatch = cup.matches[cup.matches.length-1];
  const playerWonFinal = finalMatch.winner && finalMatch.winner.isPlayer;
  cup.finished = true;
  cup.won = !!playerWonFinal;
  if(playerWonFinal){
    const cupWinCoins = t.cupWinCoins;
    state.coins += cupWinCoins;
    state.trophies.push({ name:t.title, icon:t.icon, date: Date.now() });
    save();
    showTrophyModal(t, cupWinCoins);
  } else {
    save();
    renderCupScreen();
  }
}

/* ============================================================
   REWARDS
   ============================================================ */
function rewardRandomPlayer(powerIncrease){
  const mainPlayers = state.players.filter(p => p.status === 'main');
  const p = pick(mainPlayers);
  const before = p.power;
  p.power += powerIncrease;
  save();
  return { player:p, before, after:p.power };
}

/* ============================================================
   BRACKET RENDER
   ============================================================ */
function buildRoundTitles(teamCount){
  const totalRounds = Math.round(Math.log2(teamCount));
  const namesFromFinal = ['ФИНАЛ', 'ПОЛУФИНАЛ', 'ЧЕТВЕРТЬФИНАЛ', '1/8 ФИНАЛА', '1/16 ФИНАЛА', '1/32 ФИНАЛА', '1/64 ФИНАЛА'];
  const titles = {};
  for(let round = 1; round <= totalRounds; round++){
    const fromEnd = totalRounds - round;
    titles[round] = namesFromFinal[fromEnd] || `РАУНД ${round}`;
  }
  return titles;
}

function renderBracket(){
  const cup = state.cups[currentCupId];
  if(!cup) return;

  const rounds = {};
  cup.matches.forEach(m => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  const teamCount = cup.teams.length;
  const roundTitles = buildRoundTitles(teamCount);

  document.getElementById('bracket').innerHTML = Object.keys(rounds).sort((a,b) => a - b).map(round => `
    <div class="bracket-round">
      <div class="bracket-round-title">${roundTitles[round] || `РАУНД ${round}`}</div>
      <div class="bracket-matches">
        ${rounds[round].map(m => bracketMatchHtml(m, cup)).join('')}
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.bm-team').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const teamName = el.dataset.team;
      if(!teamName) return;

      const cup = state.cups[currentCupId];
      if(!cup) return;

      const team = cup.teams.find(t => t.name === teamName);
      if(team && !team.isPlayer) {
        openBotModal(team);
      }
    });
    el.style.cursor = 'pointer';
  });

  const showControls = !cup.finished;
  const countdownEl = document.getElementById('cup-countdown');
  const playBtn = document.getElementById('btn-play-now');
  const leaveBtn = document.getElementById('btn-leave-cup');

  if(countdownEl) countdownEl.style.display = showControls ? '' : 'none';
  if(playBtn) playBtn.style.display = showControls ? '' : 'none';
  if(leaveBtn) leaveBtn.style.display = showControls ? '' : 'none';
}

function bracketMatchHtml(m, cup){
  const teamA = m.teamA || previewTeam(m.a, cup);
  const teamB = m.teamB || previewTeam(m.b, cup);
  const nameA = teamA ? teamA.name : '?';
  const nameB = teamB ? teamB.name : '?';
  const isYouA = teamA && teamA.isPlayer;
  const isYouB = teamB && teamB.isPlayer;

  let cls = 'bracket-match';
  if(!m.played) cls += ' pending';

  const scoreHtml = m.played ? `${m.scoreA} : ${m.scoreB}` : '—:—';
  const winA = m.played && m.winner && teamA && m.winner.id === teamA.id;
  const winB = m.played && m.winner && teamB && m.winner.id === teamB.id;

  return `
    <div class="${cls}">
      <span class="bm-team ${winA?'win':''} ${isYouA?'you':''}" data-team="${nameA}" data-isplayer="${isYouA}">
        ${isYouA ? '<span class="bm-you-tag">ТЫ</span> ' : ''}
        ${nameA}
        <span class="bm-power">${teamA ? teamA.power : ''}</span>
      </span>
      <span class="bm-score">${scoreHtml}</span>
      <span class="bm-team ${winB?'win':''} ${isYouB?'you':''}" data-team="${nameB}" data-isplayer="${isYouB}" style="text-align:right; justify-content:flex-end">
        <span class="bm-power">${teamB ? teamB.power : ''}</span>
        ${nameB}
        ${isYouB ? ' <span class="bm-you-tag">ТЫ</span>' : ''}
      </span>
    </div>`;
}

function previewTeam(ref, cup){
  if(ref.type === 'direct') return cup.teams[ref.idx];
  const m = cup.matches.find(m => m.matchIdx === ref.m);
  return m && m.played ? m.winner : null;
}

/* ============================================================
   BOT MODAL
   ============================================================ */
function openBotModal(team) {
  closePlayerModal();

  setTimeout(() => {
    const botFormation = team.formation || DEFAULT_FORMATION;
    const beatsYou = FORMATION_COUNTERS[botFormation] === state.formation;
    const youBeatBot = FORMATION_COUNTERS[state.formation] === botFormation;
    let matchupNote = '';
    if(beatsYou){
      matchupNote = `<div style="margin-top:10px; color:var(--red); font-weight:700; font-size:12.5px;">⚡ Схема бота (${botFormation}) имеет преимущество против вашей (${state.formation})</div>`;
    } else if(youBeatBot){
      matchupNote = `<div style="margin-top:10px; color:var(--green); font-weight:700; font-size:12.5px;">⚡ Ваша схема (${state.formation}) имеет преимущество против схемы бота (${botFormation})</div>`;
    }

    document.getElementById('player-modal-body').innerHTML = `
      <div style="text-align:center; margin-top: 8px;">
        <div style="font-size: 42px; margin-bottom: 10px;">🤖</div>
        <div style="font-family: var(--ff-display); font-size: 22px; color: var(--text);">${team.name}</div>
        <div style="color: var(--text-dim); font-size: 14px; margin-top: 4px;">🤖 Команда бота</div>

        <div style="margin-top: 20px; background: var(--surface-3); padding: 16px; border-radius: 10px;">
          <div style="font-size: 11px; color: var(--text-dim); letter-spacing: 1px;">СИЛА КОМАНДЫ</div>
          <div style="font-family: var(--ff-display); font-size: 42px; color: var(--green); margin: 4px 0;">
            ${team.power}
          </div>
        </div>

        <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="background: var(--surface-3); padding: 10px; border-radius: 8px;">
            <div style="font-size: 10px; color: var(--text-dim);">СТАТУС</div>
            <div style="font-weight: 700; font-size: 14px; color: var(--text);">БОТ</div>
          </div>
          <div style="background: var(--surface-3); padding: 10px; border-radius: 8px;">
            <div style="font-size: 10px; color: var(--text-dim);">СХЕМА</div>
            <div style="font-weight: 700; font-size: 14px; color: var(--text);">${botFormation}</div>
          </div>
        </div>
        ${matchupNote}

        <button id="btn-close-bot-modal" class="btn-primary" style="margin-top: 16px; width: 100%;">ЗАКРЫТЬ</button>
      </div>
    `;

    document.getElementById('player-modal').classList.remove('hidden');

    document.getElementById('btn-close-bot-modal').addEventListener('click', (e) => {
      e.stopPropagation();
      closePlayerModal();
    });
  }, 50);
}

/* ============================================================
   MATCH RESULT MODAL
   ============================================================ */
function showMatchModal(match, playerWon, onClose){
  const you = match.teamA.isPlayer ? match.teamA : match.teamB;
  const opp = match.teamA.isPlayer ? match.teamB : match.teamA;
  const yourScore = match.teamA.isPlayer ? match.scoreA : match.scoreB;
  const oppScore = match.teamA.isPlayer ? match.scoreB : match.scoreA;

  const t = tournamentById(currentCupId);
  const cup = state.cups[currentCupId];
  const isFinal = match.round === Math.max(...cup.matches.map(m => m.round));

  let rewardHtml = '';
  let xpEarned = 0;

  if(playerWon){
    const powerIncrease = t.stageRewardPower;
    const r = rewardRandomPlayer(powerIncrease);

    const stageCoins = t.stageRewardCoins;
    state.coins += stageCoins;

    xpEarned = t.xpPerWin;
    addXp(xpEarned);

    save();

    rewardHtml = `
      <div class="mm-reward">
        <div>Ваш игрок: <span class="mm-reward-player">${r.player.name}</span></div>
        <div class="mm-power-change">${r.before} → <span class="mm-power-plus">${r.after}</span></div>
        <div style="color:var(--gold); font-weight:800; display:flex; align-items:center; justify-content:center; gap:5px; flex-wrap:wrap;">
          <span><img src="${IMG.sila}" class="img-icon" alt="Сила"> +${powerIncrease} силы</span>
          <span><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${stageCoins}</span>
          <span>⭐ +${xpEarned} XP</span>
        </div>
      </div>`;
    refreshTopbar();
  }

  const loseMessage = !playerWon ? `
    <div style="color:var(--red); font-size:14px; font-weight:700; margin-top:10px;">
      ❌ Турнир завершён. Попробуйте снова!
    </div>
  ` : '';

  document.getElementById('match-modal-body').innerHTML = `
    <div class="mm-teams"><span>${you.name}</span><span style="color:var(--text-mute)">vs</span><span>${opp.name}</span></div>
    <div class="mm-score">${yourScore} : ${oppScore}</div>
    <div class="mm-result ${playerWon?'win':'lose'}">${playerWon ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}</div>
    ${rewardHtml}
    ${loseMessage}
    <button id="mm-continue-btn" class="btn-primary btn-big mm-continue">${playerWon && !isFinal ? 'ПРОДОЛЖИТЬ' : 'ОК'}</button>
  `;
  document.getElementById('match-modal').classList.remove('hidden');
  document.getElementById('mm-continue-btn').addEventListener('click', ()=>{
    document.getElementById('match-modal').classList.add('hidden');
    if(!playerWon) {
      renderCupScreen();
    } else if(isFinal && playerWon){
      finishCup();
    } else {
      onClose();
    }
  }, { once:true });
}

function showTrophyModal(t, coinReward){
  refreshTopbar();
  const trophySrc = TROPHY_IMG[t.id];
  const trophyHtml = trophySrc
    ? `<img src="${trophySrc}" class="cup-trophy-img" alt="${t.title}">`
    : `<div class="cup-trophy">${t.icon}</div>`;

  document.getElementById('match-modal-body').innerHTML = `
    <div class="mm-trophy-box">
      ${trophyHtml}
      <div class="mm-result win">${t.title} ЗАВОЁВАН!</div>
      <div class="mm-coin-reward"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${coinReward.toLocaleString('ru-RU')}</div>
      <div style="color:var(--gold); font-weight:800; margin-top:6px;">⭐ +${t.xpPerWin} XP за финал</div>
    </div>
    <button id="mm-trophy-ok" class="btn-primary btn-big mm-continue">ОТЛИЧНО!</button>
  `;
  document.getElementById('match-modal').classList.remove('hidden');
  document.getElementById('mm-trophy-ok').addEventListener('click', ()=>{
    document.getElementById('match-modal').classList.add('hidden');
    renderCupScreen();
  }, { once:true });
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(text){
  let container = document.getElementById('toast-container');
  if(!container){
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = text;
  container.appendChild(t);
  setTimeout(()=> t.remove(), 2500);
}