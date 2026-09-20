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
  xp:         'images/opit.png',
  training:   'images/trenirovka.png',
  tasks:      'images/zadanie.png',
  plus:       'images/plus.png',
  cupNew:     'images/cup/cupnew.png',
  bliga:      'images/cup/bliga.png',
  cliga:      'images/cup/cliga.png',
  cupYam:     'images/cup/cupyam.png',
  cupFran:    'images/cup/cupfran.png',
  cupUsa:     'images/cup/cupusa.png',
  cupBel:     'images/cup/cupbel.png',
  chempEurop: 'images/cup/chempeurop.png',
  chempAmeriki: 'images/cup/chempameriki.png',
  chempAzii:  'images/cup/chempazii.png',
  chempEuroazii: 'images/cup/chempeuroazii.png',
  navManager: 'images/manager.png',
  navPlay:    'images/play.png',
  navTeam:    'images/comands.png',
  navTransfer:'images/transfer.png',
  navBank:    'images/bank.png',
  fon:        'images/fon.png'
};
/* per-tournament trophy images (falls back to emoji icon) */
const TROPHY_IMG = {
  novice:  IMG.cupNew,
  bigleague: IMG.bliga,
  championsleague: IMG.cliga,
  jamaica: IMG.cupYam,
  france:  IMG.cupFran,
  usa:     IMG.cupUsa,
  belarus: IMG.cupBel,
  europe:  IMG.chempEurop,
  america: IMG.chempAmeriki,
  asia:    IMG.chempAzii,
  eurasia: IMG.chempEuroazii
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
    const candidate = s.players.find(p => p.pos===code && !p.training && !usedIds.has(p.id));
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
    min:0, max:200,
    teamCount:4,
    teamNames:['FC Kingston','Red Lions','Blue Stars','Jamaica FC'],
    // teamCount 4 -> 2 раунда: Полуфинал, Финал
    rounds:[
      { coins:100, power:20, xp:25 },   // Полуфинал
      { coins:150, power:30, xp:50 }    // Финал
    ],
    cupWinCoins: 500
  },
  {
    id:'jamaica',
    title:'КУБОК ЯМАЙКИ',
    icon:'🥥',
    min:201, max:400,
    teamCount:8,
    teamNames:['Portmore FC','Trenchtown Lions','Spanish Town Utd','Montego Bay Stars','Ocho Rios FC','Negril Warriors','St. Ann Rangers','Kingston City'],
    // teamCount 8 -> 3 раунда: Четвертьфинал, Полуфинал, Финал
    rounds:[
      { coins:200, power:15, xp:50 },   // Четвертьфинал
      { coins:250, power:20, xp:75 },   // Полуфинал
      { coins:300, power:25, xp:100 }   // Финал
    ],
    cupWinCoins: 1500
  },
  {
    id:'france',
    title:'КУБОК ФРАНЦИИ',
    icon:'🥐',
    min:401, max:600,
    teamCount:16,
    teamNames:['Paris Étoile','Lyon Renard','Marseille Marée','Nice Soleil','Bordeaux Vigne','Toulouse Violette','Nantes Corsaire','Lille Nordique','Strasbourg Cigogne','Rennes Bretonne','Montpellier Garrigue','Reims Sacre','Le Havre Phare','Dijon Moutarde','Angers Loire','Grenoble Alpine'],
    // teamCount 16 -> 4 раунда: 1/8, 1/4, 1/2, Финал
    rounds:[
      { coins:300, power:10, xp:75 },    // 1/8 финала
      { coins:500, power:15, xp:100 },   // Четвертьфинал
      { coins:750, power:15, xp:125 },   // Полуфинал
      { coins:1500, power:20, xp:150 }   // Финал
    ],
    cupWinCoins: 3000
  },
  {
    id:'usa',
    title:'КУБОК США',
    icon:'🦅',
    min:601, max:800,
    teamCount:16,
    teamNames:['New York Liberty FC','LA Golden Wave','Chicago Windstorm','Houston Lonestar','Miami Sunrise','Dallas Eagles','Seattle Rainguard','Denver Peak','Boston Patriots FC','Atlanta Phoenix','Austin Riverside','Phoenix Sunhawk','Detroit Ironworks','Portland Timberline','San Diego Coast','Nashville Rebels'],
    rounds:[
      { coins:500, power:3, xp:100 },     // 1/8 финала
      { coins:750, power:5, xp:150 },     // Четвертьфинал
      { coins:1500, power:8, xp:200 },    // Полуфинал
      { coins:2500, power:10, xp:250 }    // Финал
    ],
    cupWinCoins: 5000
  },
  {
    id:'belarus',
    title:'КУБОК БЕЛАРУСИ',
    icon:'🐃',
    min:801, max:1100,
    teamCount:16,
    teamNames:['Minsk Zubr','Brest Krepost','Grodno Neman','Vitebsk Dvina','Gomel Sozh','Mogilev Dnepr','Baranovichi Sokol','Pinsk Boloto','Orsha Volna','Bobruisk Bober','Soligorsk Shakhter','Zhlobin Kovka','Polotsk Drakon','Lida Zubronok','Slutsk Poyas','Mozyr Poles'],
    rounds:[
      { coins:750, power:1, xp:200 },     // 1/8 финала
      { coins:1250, power:3, xp:250 },    // Четвертьфинал
      { coins:3000, power:5, xp:400 },    // Полуфинал
      { coins:5000, power:10, xp:800 }    // Финал
    ],
    cupWinCoins: 15000
  },
  {
    id:'europe',
    title:'ЧЕМПИОНАТ ЕВРОПЫ',
    icon:'⭐',
    type:'group',
    min:1101, max:2200,
    groupsCount:8,
    teamsPerGroup:10,
    teamNames:['Berlin Adler','Madrid Toro','Rome Lupetto','Amsterdam Wiel','Vienna Habsburg','Lisbon Farol','Warsaw Orzel','Athens Olymp','Zurich Alpen','Prague Lev','Stockholm Vind','Copenhagen Skov','Dublin Trefoil','Oslo Fjord','Brussels Waffle','Budapest Dunai','Bucharest Vulpe','Sofia Roza','Helsinki Suomi','Zagreb Vatra','Belgrade Orao','Edinburgh Thistle','Cardiff Ddraig','Krakow Smok','Naples Vesuvio','Turin Mole','Valencia Naranja','Seville Flamenco','Porto Douro','Hamburg Hafen'],
    // за победу в туре группы
    groupStageReward: { coins:750, power:1, xp:100 },
    // бонус за 1-е место в группе (выход в плей-офф)
    groupWinBonus: { coins:1250, power:3, xp:250 },
    // плей-офф на вылет (8 команд): Четвертьфинал, Полуфинал, Финал
    koRounds:[
      { coins:1750, power:5, xp:500 },    // Четвертьфинал
      { coins:3000, power:8, xp:800 },    // Полуфинал
      { coins:5000, power:10, xp:1500 }   // Финал
    ],
    cupWinCoins: 30000
  },
  {
    id:'america',
    title:'ЧЕМПИОНАТ АМЕРИКИ',
    icon:'🗽',
    type:'group',
    min:2201, max:3300,
    groupsCount:16,
    teamsPerGroup:10,
    teamNames:['New York Empire','LA Golden Wave','Chicago Windstorm','Toronto Maple FC','Mexico City Aztec','Sao Paulo Onça','Rio Carioca','Buenos Aires Pampa','Santiago Andes','Bogota Condor','Lima Inca','Montreal Nord','Miami Sunrise','Houston Lonestar','Vancouver Rain','Boston Patriots FC','Lima Andina','Quito Volcan','Caracas Llanero','Montevideo Charrua','Asuncion Guarani','La Paz Altura','Havana Habanero','San Juan Coqui','Panama Istmo','San Jose Tico','Kingston Reggae','Guadalajara Jalisco','Monterrey Acero','Brasilia Cerrado','Salvador Bahia','Cordoba Mediterranea'],
    groupStageReward: { coins:1000, power:1, xp:150 },
    groupWinBonus: { coins:1500, power:3, xp:350 },
    // плей-офф на вылет (16 команд): 1/8, Четвертьфинал, Полуфинал, Финал
    koRounds:[
      { coins:2500, power:5, xp:500 },    // 1/8 финала
      { coins:5000, power:8, xp:750 },    // Четвертьфинал
      { coins:7500, power:10, xp:1000 },  // Полуфинал
      { coins:10000, power:15, xp:1500 }  // Финал
    ],
    cupWinCoins: 40000
  },
  {
    id:'asia',
    title:'ЧЕМПИОНАТ АЗИИ',
    icon:'🏯',
    type:'group',
    min:3301, max:4400,
    groupsCount:32,
    teamsPerGroup:10,
    teamNames:['Tokyo Rising Sun','Seoul Dragon','Beijing Panda','Shanghai Jade','Bangkok Siam','Jakarta Garuda','Manila Sampaguita','Riyadh Falcon','Doha Pearl','Dubai Skyline','Tehran Simorgh','Baghdad Lion','Delhi Peacock','Mumbai Tiger','Karachi Star','Lahore Minar','Dhaka Bengal','Hanoi Lotus','Ho Chi Minh Rong','Kuala Lumpur Harimau','Singapore Merlion','Taipei Bamboo','Hong Kong Jade','Osaka Castle','Yokohama Bay','Busan Wave','Pyongyang Chollima','Ulaanbaatar Steppe','Almaty Snow','Tashkent Silk','Astana Steppe','Baku Flame','Yerevan Ararat','Tbilisi Mountain','Amman Petra','Beirut Cedar','Jerusalem Olive','Colombo Lion','Kathmandu Peak','Islamabad Margalla'],
    groupStageReward: { coins:1200, power:1, xp:200 },
    groupWinBonus: { coins:1750, power:3, xp:500 },
    // плей-офф на вылет (32 команды): 1/16, 1/8, Четвертьфинал, Полуфинал, Финал
    koRounds:[
      { coins:2500, power:5, xp:500 },    // 1/16 финала
      { coins:5000, power:8, xp:750 },    // 1/8 финала
      { coins:7500, power:10, xp:1000 },  // Четвертьфинал
      { coins:10000, power:15, xp:1500 }, // Полуфинал
      { coins:15000, power:20, xp:2500 }  // Финал
    ],
    cupWinCoins: 50000
  },
  {
    id:'eurasia',
    title:'ЧЕМПИОНАТ ЕВРАЗИИ',
    icon:'🌍',
    type:'group',
    min:4401, max:5500,
    groupsCount:64,
    teamsPerGroup:10,
    teamNames:['Moscow Bear','Istanbul Bosphorus','Ankara Anatolia','Novosibirsk Taiga','Yekaterinburg Ural','Vladivostok Pacific','Kyiv Dnipro','Minsk Zubr Elite','Warsaw Eagle Elite','Bucharest Carpathia','Athens Acropolis','Cairo Sphinx','Alexandria Nile','Casablanca Atlas','Tunis Carthage','Algiers Kasbah','Tripoli Oasis','Nicosia Cyprus','Valletta Malta','Reykjavik Geyser','Helsinki North','Riga Amber','Vilnius Hill','Tallinn Spire','Chisinau Vine','Sarajevo Bridge','Skopje Vardar','Podgorica Coast','Ljubljana Alps','Bratislava Castle','Vienna Ring','Zurich Peak','Geneva Lake','Brussels Grand','Luxembourg Fort','Monaco Riviera','Andorra Peak','San Marino Tower','Vatican Dome','Lisbon Coast','Madrid Central','Barcelona Sea','Milan Duomo','Naples Bay','Palermo Sun','Bern Alpine','Munich Beer','Frankfurt Bank','Hamburg Port','Copenhagen Spire','Stockholm Isle','Oslo Fjord Elite','Gothenburg Harbor','Krakow Dragon','Gdansk Amber','Wroclaw Bridge','Sofia Vitosha','Belgrade River','Zagreb Cathedral','Budapest Bath','Thessaloniki Bay','Rotterdam Port','Amsterdam Canal','Dublin Clover'],
    groupStageReward: { coins:1500, power:1, xp:250 },
    groupWinBonus: { coins:2000, power:3, xp:600 },
    // плей-офф на вылет (64 команды): 1/32, 1/16, 1/8, Четвертьфинал, Полуфинал, Финал
    koRounds:[
      { coins:3000, power:5, xp:600 },    // 1/32 финала
      { coins:5000, power:8, xp:800 },    // 1/16 финала
      { coins:7500, power:10, xp:1000 },  // 1/8 финала
      { coins:10000, power:12, xp:1500 }, // Четвертьфинал
      { coins:12500, power:15, xp:2000 }, // Полуфинал
      { coins:20000, power:25, xp:3000 }  // Финал
    ],
    cupWinCoins: 60000
  },
  {
    id:'bigleague',
    title:'БОЛЬШАЯ ЛИГА',
    icon:'💎',
    type:'group',
    scheduled:true,
    schedule:{ timezone:'Europe/Kyiv', times:[ {h:12,m:0}, {h:20,m:0} ] },
    min:100, max:5500,
    groupsCount:128,
    teamsPerGroup:10,
    teamNames:['Titan FC','Legion United','Crown Athletic','Empire City','Dominion FC','Sovereign United','Vanguard Elite','Apex Rovers','Pinnacle City','Summit United','Zenith Athletic','Meridian FC','Horizon United','Odyssey City','Genesis FC','Infinity United','Eclipse Athletic','Aurora City FC','Prestige United','Majestic Rovers','Regal Athletic','Supreme City','Elite Vanguard','Champion Forge','Victory United','Triumph City','Glory Athletic','Honor FC','Legacy United','Dynasty City','Fortune Rovers','Diamond United','Platinum City','Golden Vanguard','Silver Athletic','Bronze United FC','Ruby Rovers','Sapphire City','Emerald United','Opal Athletic','Crystal FC','Stellar United','Cosmic City FC','Nova Athletic','Comet Rovers','Meteor United','Galaxy City FC','Orbit Athletic','Quantum United','Phantom Rovers'],
    groupStageReward: { coins:2000, power:1, xp:300 },
    groupWinBonus: { coins:3000, power:3, xp:750 },
    // плей-офф на вылет (128 команд): 1/64, 1/32, 1/16, 1/8, Четвертьфинал, Полуфинал, Финал
    koRounds:[
      { coins:4000, power:5, xp:700 },    // 1/64 финала
      { coins:6000, power:8, xp:900 },    // 1/32 финала
      { coins:8000, power:10, xp:1100 },  // 1/16 финала
      { coins:12000, power:12, xp:1500 }, // 1/8 финала
      { coins:16000, power:15, xp:2000 }, // Четвертьфинал
      { coins:20000, power:18, xp:2500 }, // Полуфинал
      { coins:30000, power:25, xp:4000 }  // Финал
    ],
    cupWinCoins: 100000,
    // отдельный бонус чемпиону в бюджет (не в монеты)
    leagueChampionBudget: 500000
  },
  {
    id:'championsleague',
    title:'ЛИГА ЧЕМПИОНОВ',
    icon:'🏆',
    type:'group',
    scheduled:true,
    schedule:{ timezone:'Europe/Kyiv', times:[ {h:13,m:0}, {h:22,m:0} ] },
    min:100, max:5500,
    groupsCount:256,
    teamsPerGroup:10,
    teamNames:['Titan FC','Legion United','Crown Athletic','Empire City','Dominion FC','Sovereign United','Vanguard Elite','Apex Rovers','Pinnacle City','Summit United','Zenith Athletic','Meridian FC','Horizon United','Odyssey City','Genesis FC','Infinity United','Eclipse Athletic','Aurora City FC','Prestige United','Majestic Rovers','Regal Athletic','Supreme City','Elite Vanguard','Champion Forge','Victory United','Triumph City','Glory Athletic','Honor FC','Legacy United','Dynasty City','Fortune Rovers','Diamond United','Platinum City','Golden Vanguard','Silver Athletic','Bronze United FC','Ruby Rovers','Sapphire City','Emerald United','Opal Athletic','Crystal FC','Stellar United','Cosmic City FC','Nova Athletic','Comet Rovers','Meteor United','Galaxy City FC','Orbit Athletic','Quantum United','Phantom Rovers'],
    groupStageReward: { coins:3000, power:2, xp:450 },
    groupWinBonus: { coins:5000, power:5, xp:1200 },
    // плей-офф на вылет (256 команд): 1/128, 1/64, 1/32, 1/16, 1/8, Четвертьфинал, Полуфинал, Финал
    koRounds:[
      { coins:6000, power:8, xp:1000 },   // 1/128 финала
      { coins:9000, power:12, xp:1300 },  // 1/64 финала
      { coins:12000, power:15, xp:1700 }, // 1/32 финала
      { coins:16000, power:18, xp:2200 }, // 1/16 финала
      { coins:22000, power:22, xp:2800 }, // 1/8 финала
      { coins:28000, power:26, xp:3500 }, // Четвертьфинал
      { coins:36000, power:30, xp:4500 }, // Полуфинал
      { coins:50000, power:35, xp:6000 }  // Финал
    ],
    cupWinCoins: 180000,
    // отдельный бонус чемпиону в бюджет (не в монеты)
    leagueChampionBudget: 750000
  }
];
function tournamentById(id){ return TOURNAMENTS.find(t=>t.id===id); }

/* ============================================================
   ЗАДАНИЯ (TASKS) — цепочки: забрал награду за текущий этап →
   тут же на его месте открылся следующий, посложнее
   ============================================================ */
const TASK_CHAINS = [
  {
    id:'level',
    icon:'🌟',
    tiers:[
      {
        title:'Достигните 5-го уровня менеджера',
        reward:{ coins:3000 },
        target:5,
        progress:(s)=> Math.min(s.level, 5),
        isComplete:(s)=> s.level >= 5
      },
      {
        title:'Достигните 10-го уровня менеджера',
        reward:{ coins:10000 },
        target:10,
        progress:(s)=> Math.min(s.level, 10),
        isComplete:(s)=> s.level >= 10
      }
    ]
  },
  {
    id:'cups',
    icon:'🏆',
    tiers:[
      {
        title:'Сыграйте Кубок новичков 1 раз',
        reward:{ coins:1000 },
        target:1,
        iconImg: ()=> TROPHY_IMG.novice,
        progress:(s)=> Math.min((s.taskStats?.cupPlays?.novice) || 0, 1),
        isComplete:(s)=> ((s.taskStats?.cupPlays?.novice) || 0) >= 1
      },
      {
        title:'Сыграйте Кубок Ямайки 1 раз',
        reward:{ coins:2000 },
        target:1,
        iconImg: ()=> TROPHY_IMG.jamaica,
        progress:(s)=> Math.min((s.taskStats?.cupPlays?.jamaica) || 0, 1),
        isComplete:(s)=> ((s.taskStats?.cupPlays?.jamaica) || 0) >= 1
      }
    ]
  },
  {
    id:'power1000',
    icon:'💪',
    tiers:[
      {
        title:'Достигните силы клуба 1100',
        reward:{ slots:1 },
        target:1100,
        progress:(s)=> Math.min(calcClubPower(s.players), 1100),
        isComplete:(s)=> calcClubPower(s.players) >= 1100
      },
      {
        title:'Достигните силы клуба 2200',
        reward:{ budget:50000 },
        target:2200,
        progress:(s)=> Math.min(calcClubPower(s.players), 2200),
        isComplete:(s)=> calcClubPower(s.players) >= 2200
      },
      {
        title:'Достигните силы клуба 3300',
        reward:{ budget:100000 },
        target:3300,
        progress:(s)=> Math.min(calcClubPower(s.players), 3300),
        isComplete:(s)=> calcClubPower(s.players) >= 3300
      },
      {
        title:'Достигните силы клуба 4400',
        reward:{ budget:250000 },
        target:4400,
        progress:(s)=> Math.min(calcClubPower(s.players), 4400),
        isComplete:(s)=> calcClubPower(s.players) >= 4400
      }
    ]
  }
];

function recordCupPlayed(cupId){
  if(!state.taskStats) state.taskStats = { cupPlays:{} };
  if(!state.taskStats.cupPlays) state.taskStats.cupPlays = {};
  state.taskStats.cupPlays[cupId] = (state.taskStats.cupPlays[cupId] || 0) + 1;
}

/* индекс текущего (ещё не забранного) этапа цепочки; null, если цепочка вся пройдена */
function currentChainTier(chain){
  if(!state.taskChainTier) state.taskChainTier = {};
  const idx = state.taskChainTier[chain.id] || 0;
  return { idx, tier: chain.tiers[idx] || null };
}

function hasClaimableTasks(){
  return TASK_CHAINS.some(chain=>{
    const { tier } = currentChainTier(chain);
    return tier && tier.isComplete(state);
  });
}

function taskRewardText(reward){
  const parts = [];
  if(reward.coins) parts.push(`+${fmt(reward.coins)} монет`);
  if(reward.budget) parts.push(`+${fmt(reward.budget)} евро`);
  if(reward.slots) parts.push(`+${reward.slots} слот для тренировок`);
  return parts.join(' · ');
}

function taskRewardHtml(reward){
  const parts = [];
  if(reward.coins) parts.push(`<img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${fmt(reward.coins)}`);
  if(reward.budget) parts.push(`<img src="${IMG.cash}" class="img-icon" alt="Бюджет"> +${fmt(reward.budget)}`);
  if(reward.slots) parts.push(`<img src="${IMG.training}" class="img-icon" alt="Слот тренировки"> +${reward.slots} слот`);
  return parts.join(' &nbsp;·&nbsp; ');
}

function claimTask(chainId){
  const chain = TASK_CHAINS.find(c=>c.id===chainId);
  if(!chain) return;
  const { idx, tier } = currentChainTier(chain);
  if(!tier || !tier.isComplete(state)) return;

  if(tier.reward.coins) state.coins += tier.reward.coins;
  if(tier.reward.budget) state.budget += tier.reward.budget;
  if(tier.reward.slots){
    const current = state.trainingSlotsMax || 3;
    state.trainingSlotsMax = Math.min(SLOT_UPGRADE_MAX, current + tier.reward.slots);
  }
  if(!state.taskChainTier) state.taskChainTier = {};
  state.taskChainTier[chainId] = idx + 1;

  save();
  refreshTopbar();
  renderTasksModal();
  updateTasksBadge();
  updateManagerNavBadge();
  showToast(`🎁 Награда получена: ${taskRewardText(tier.reward)}!`);
}

function taskRowHtml(chain){
  const { tier } = currentChainTier(chain);

  if(!tier){
    return `
      <div class="task-row claimed">
        <div class="task-icon">${chain.icon}</div>
        <div class="task-info">
          <div class="task-title">Все задания этой цепочки выполнены</div>
          <div class="task-status done">✅ Пройдено</div>
        </div>
      </div>`;
  }

  const complete = tier.isComplete(state);
  const progressVal = tier.progress(state);
  const pct = Math.min(100, Math.round((progressVal / tier.target) * 100));
  const iconSrc = typeof tier.iconImg === 'function' ? tier.iconImg() : null;
  const iconHtml = iconSrc ? `<img src="${iconSrc}" class="task-icon-img" alt="">` : chain.icon;

  let statusHtml;
  if(complete){
    statusHtml = `<button class="task-claim-btn" data-claim-task="${chain.id}">ЗАБРАТЬ НАГРАДУ</button>`;
  } else {
    statusHtml = `
      <div class="task-progress-row">
        <div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div>
        <div class="task-progress-text">${fmt(progressVal)} / ${fmt(tier.target)}</div>
      </div>`;
  }

  return `
    <div class="task-row ${complete ? 'complete' : ''}">
      <div class="task-icon">${iconHtml}</div>
      <div class="task-info">
        <div class="task-title">${tier.title}</div>
        <div class="task-reward">${taskRewardHtml(tier.reward)}</div>
        ${statusHtml}
      </div>
    </div>`;
}

function renderTasksModal(){
  let overlay = document.getElementById('tasks-modal-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'tasks-modal-overlay';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e=>{ if(e.target===overlay) closeTasksModal(); });
  }
  overlay.classList.remove('hidden');

  overlay.innerHTML = `
    <div class="modal-card tasks-modal-card">
      <button class="modal-close" id="tasks-modal-close">✕</button>
      <div class="tp-title">📋 Задания</div>
      <div class="tp-sub">Выполняйте задания и получайте награды — как только заберёте награду, откроется следующее задание</div>
      <div class="tasks-list">
        ${TASK_CHAINS.map(chain => taskRowHtml(chain)).join('')}
      </div>
    </div>`;

  overlay.querySelector('#tasks-modal-close').addEventListener('click', closeTasksModal);
  overlay.querySelectorAll('[data-claim-task]').forEach(btn=>{
    btn.addEventListener('click', ()=> claimTask(btn.dataset.claimTask));
  });
}

function openTasksModal(){
  renderTasksModal();
}

function closeTasksModal(){
  const overlay = document.getElementById('tasks-modal-overlay');
  if(overlay) overlay.remove();
}

function updateTasksBadge(){
  const btn = document.getElementById('btn-open-tasks');
  if(!btn) return;
  let badge = btn.querySelector('.task-badge');
  if(hasClaimableTasks()){
    if(!badge){
      badge = document.createElement('span');
      badge.className = 'task-badge';
      badge.textContent = '!';
      btn.appendChild(badge);
    }
  } else if(badge){
    badge.remove();
  }
}

/* ============================================================
   BIG LEAGUE — SCHEDULING (Europe/Kyiv, дважды в день)
   ============================================================ */
function getTZOffsetMinutes(date, timeZone){
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12:false,
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  });
  const parts = dtf.formatToParts(date).reduce((acc,p)=>{ if(p.type!=='literal') acc[p.type]=p.value; return acc; },{});
  const hour = parts.hour === '24' ? 0 : Number(parts.hour);
  const asUTC = Date.UTC(Number(parts.year), Number(parts.month)-1, Number(parts.day), hour, Number(parts.minute), Number(parts.second));
  return Math.round((asUTC - date.getTime()) / 60000);
}

/* состояние регистрации для конкретного турнира по расписанию (Большая Лига,
   Лига чемпионов и т.д.) — у каждого турнира своя запись */
function leagueReg(t){
  if(!state.leagueRegistrations) state.leagueRegistrations = {};
  if(!state.leagueRegistrations[t.id]) state.leagueRegistrations[t.id] = { sessionId:null, range:null, notifiedSessionId:null };
  return state.leagueRegistrations[t.id];
}

// возвращает {prev, next} — последний прошедший и ближайший будущий старт лиги
function getLeagueSessions(t, from = new Date()){
  const tz = t.schedule.timezone;
  const offsetMin = getTZOffsetMinutes(from, tz);
  const localMs = from.getTime() + offsetMin*60000;
  const local = new Date(localMs);
  const y = local.getUTCFullYear(), mo = local.getUTCMonth(), d = local.getUTCDate();

  function wallToReal(wallMs){
    const approxRealMs = wallMs - offsetMin*60000;
    const offset2 = getTZOffsetMinutes(new Date(approxRealMs), tz);
    return wallMs - offset2*60000;
  }

  const wallCandidates = [];
  for(let dayOffset=-1; dayOffset<=1; dayOffset++){
    t.schedule.times.forEach(({h,m})=>{
      wallCandidates.push(Date.UTC(y, mo, d+dayOffset, h, m, 0));
    });
  }
  wallCandidates.sort((a,b)=>a-b);

  let prev = null, next = null;
  for(const wallMs of wallCandidates){
    const realMs = wallToReal(wallMs);
    if(realMs <= from.getTime()) prev = realMs;
    else if(next === null) next = realMs;
  }
  return { prev: prev !== null ? new Date(prev) : null, next: new Date(next) };
}

function leagueSessionId(date){
  return date.toISOString();
}

/* ---------- round-robin group helper ---------- */
function roundRobinRounds(n){
  // circle method, n must be even. Returns array of rounds, each an array of [idxA, idxB] pairs.
  const ids = Array.from({length:n}, (_,i)=>i);
  const rounds = [];
  for(let r=0; r<n-1; r++){
    const pairs = [];
    for(let i=0; i<n/2; i++){
      pairs.push([ids[i], ids[n-1-i]]);
    }
    rounds.push(pairs);
    ids.splice(1, 0, ids.pop());
  }
  return rounds;
}

function computeGroupTable(cup, teams){
  const stats = {};
  teams.forEach(tm => stats[tm.id] = { team:tm, played:0, wins:0, draws:0, losses:0, gf:0, ga:0, pts:0 });
  cup.matches
    .filter(m => m.round <= cup.groupRoundsCount && m.played && m.teamA && m.teamB)
    .forEach(m => {
      const a = m.teamA, b = m.teamB;
      if(!stats[a.id] || !stats[b.id]) return;
      stats[a.id].played++; stats[b.id].played++;
      stats[a.id].gf += m.scoreA; stats[a.id].ga += m.scoreB;
      stats[b.id].gf += m.scoreB; stats[b.id].ga += m.scoreA;
      if(m.draw || !m.winner){
        stats[a.id].draws++; stats[a.id].pts += 1;
        stats[b.id].draws++; stats[b.id].pts += 1;
      }
      else if(m.winner.id === a.id){ stats[a.id].wins++; stats[a.id].pts += 3; stats[b.id].losses++; }
      else { stats[b.id].wins++; stats[b.id].pts += 3; stats[a.id].losses++; }
    });
  return Object.values(stats).sort((x,y)=>{
    if(y.pts !== x.pts) return y.pts - x.pts;
    const gdX = x.gf - x.ga, gdY = y.gf - y.ga;
    if(gdY !== gdX) return gdY - gdX;
    return y.gf - x.gf;
  });
}

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
/* формат чисел с разделителем тысяч: 1250 -> 1 250 */
function fmt(n){ return Number(n || 0).toLocaleString('ru-RU'); }

/* Большая Лига: диапазон силы подбирается под силу клуба, шаг 1100.
   100–1100, 1101–2200, 2201–3300 ... и так далее (без верхнего предела). */
function bigLeagueRangeForPower(power){
  const step = 1100;
  const tier = Math.max(1, Math.ceil(power / step));
  const min = tier === 1 ? 100 : (tier - 1) * step + 1;
  const max = tier * step;
  return { min, max };
}
/* фактический диапазон силы для турнира: у Большой Лиги он динамический,
   у остальных — фиксированный (t.min/t.max) */
function tournamentRange(t, power){
  return t.scheduled ? bigLeagueRangeForPower(power) : { min: t.min, max: t.max };
}

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
    lineups: {},
    leagueRegistrations: {},
    taskStats: { cupPlays: {} },
    taskChainTier: {}
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
  if(!s.taskStats) s.taskStats = { cupPlays: {} };
  if(!s.taskStats.cupPlays) s.taskStats.cupPlays = {};
  if(!s.taskChainTier) s.taskChainTier = {};
  /* миграция со старой плоской системы заданий (claimedTasks) на цепочки */
  if(Array.isArray(s.claimedTasks)){
    if(s.claimedTasks.includes('level5') && !s.taskChainTier.level) s.taskChainTier.level = 1;
    if(s.claimedTasks.includes('novice_cup_1') && !s.taskChainTier.cups) s.taskChainTier.cups = 1;
    if(s.claimedTasks.includes('power1000') && !s.taskChainTier.power1000) s.taskChainTier.power1000 = 1;
    delete s.claimedTasks;
  }

  /* регистрация в лигах по расписанию — теперь отдельно на каждый турнир
     (раньше был один общий набор полей, действовавший только на Большую Лигу) */
  if(!s.leagueRegistrations) s.leagueRegistrations = {};
  if(s.leagueRegisteredSessionId !== undefined){
    if(s.leagueRegisteredSessionId){
      s.leagueRegistrations['bigleague'] = {
        sessionId: s.leagueRegisteredSessionId,
        range: s.leagueRegisteredRange || null,
        notifiedSessionId: s.leagueNotifiedSessionId || null
      };
    }
    delete s.leagueRegisteredSessionId;
    delete s.leagueRegisteredRange;
    delete s.leagueNotifiedSessionId;
  }
  TOURNAMENTS.filter(t => t.scheduled).forEach(t=>{
    if(!s.leagueRegistrations[t.id]) s.leagueRegistrations[t.id] = { sessionId:null, range:null, notifiedSessionId:null };
  });
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
  startLeagueNotificationPoll();
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

  document.querySelectorAll('.team-tab-btn[data-team-tab]').forEach(el=>{
    el.addEventListener('click', ()=> switchTeamTab(el.dataset.teamTab));
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
  showConfirm('Весь прогресс будет удалён без возможности восстановления.', ()=>{
    localStorage.removeItem(SAVE_KEY);
    stopCupTimer();
    clearAllTrainingTimers();
    state = null;
    document.getElementById('team-name-input').value = '';
    showRegister();
  }, { icon:'🗑️', title:'Сбросить игру?', yesText:'Сбросить' });
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigate(name, cupId){
  window.scrollTo(0, 0);
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
  document.getElementById('stat-power').textContent = fmt(power);
  document.getElementById('topbar-level').textContent = state.level;
  if(typeof checkLeagueRegistrationEligibility === 'function') checkLeagueRegistrationEligibility();
  updateManagerNavBadge();
}

function updateManagerNavBadge(){
  const btn = document.querySelector('.nav-btn[data-nav="manager"]');
  if(!btn) return;
  let badge = btn.querySelector('.task-badge');
  if(typeof hasClaimableTasks === 'function' && hasClaimableTasks()){
    if(!badge){
      badge = document.createElement('span');
      badge.className = 'task-badge nav-task-badge';
      badge.textContent = '!';
      btn.appendChild(badge);
    }
  } else if(badge){
    badge.remove();
  }
}

/* ============================================================
   TEAM VIEW
   ============================================================ */
let teamActiveTab = 'roster';

function switchTeamTab(tab){
  teamActiveTab = tab;
  document.querySelectorAll('.team-tab-btn[data-team-tab]').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.teamTab === tab);
  });
  document.querySelectorAll('.team-tab-panel').forEach(panel=>{
    panel.classList.toggle('active', panel.id === `team-tab-${tab}`);
  });
}

function playerListRowHtml(p){
  const pos = posByCode(p.pos);
  let statusText;
  if(p.training){
    let timeLeft = '';
    if(p.trainingEndTime){
      const remaining = Math.max(0, Math.floor((p.trainingEndTime - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      timeLeft = ` — осталось ${mins}:${secs.toString().padStart(2,'0')}`;
    }
    statusText = `⏳ На тренировке${timeLeft}`;
  } else {
    statusText = `${posLabel(p.pos)} · Сила ${fmt(p.power)}`;
  }

  return `
    <div class="tournament-card player-row ${p.training ? 'training' : ''}" data-id="${p.id}">
      <span class="player-pos player-row-icon ${pos.css}">${pos.code}</span>
      <div class="tournament-info">
        <div class="tournament-name">${p.name}</div>
        <div class="tournament-status">${statusText}</div>
      </div>
      <div class="tournament-arrow">›</div>
    </div>`;
}

function renderTeam(){
  switchTeamTab(teamActiveTab);

  renderFormationSelector();
  renderPitch();

  const main = state.players.filter(p=>p.status==='main');
  const bench = state.players.filter(p=>p.status==='bench');

  document.getElementById('roster-main').innerHTML = main.length
    ? main.map(playerListRowHtml).join('')
    : `<div class="stub-card"><div class="stub-icon">🧍</div><p>Основной состав пуст</p></div>`;

  document.getElementById('roster-bench').innerHTML = bench.length
    ? bench.map(playerListRowHtml).join('')
    : `<div class="stub-card"><div class="stub-icon">🪑</div><p>Нет запасных игроков</p></div>`;

  document.querySelectorAll('#roster-main .player-row, #roster-bench .player-row').forEach(row=>{
    row.addEventListener('click', ()=> openPlayerModal(row.dataset.id));
  });

  renderTrainingSlotsPanel();
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
  const eligible = state.players.filter(p => p.status==='bench' && p.pos===slot.pos && !p.training);

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
  if(p.training){
    showToast('❌ Нельзя поставить в основу тренирующегося игрока');
    return false;
  }

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
const SLOT_UPGRADE_COSTS = { 4: 500000, 5: 1000000, 6: 2500000 };
const SLOT_UPGRADE_MAX = 6;

/* тренировка: только запасные игроки, 30 минут, стоимость = сила × 10, прирост 8–25 силы */
const TRAINING_DURATION_MS = 30 * 60 * 1000;
function trainingCostForPower(power){ return power * 10; }
function trainingPowerGain(){ return rnd(8, 25); }

function trainingSlotUpgradeCtaHtml(current){
  if(current >= SLOT_UPGRADE_MAX) return '';
  const nextMax = current + 1;
  const cost = SLOT_UPGRADE_COSTS[nextMax];
  const affordable = state.budget >= cost;
  return `
    <button id="btn-buy-slot" class="ts-upgrade-btn" ${affordable ? '' : 'disabled style="opacity:.5;cursor:not-allowed;"'}>
      ⏫ Открыть слот №${nextMax} — <img src="${IMG.cash}" class="img-icon" alt="€"> ${fmt(cost)}
    </button>`;
}

function trainingSlotOccupiedHtml(p){
  const pos = posByCode(p.pos);
  return `
    <div class="training-slot occupied">
      <span class="player-pos ${pos.css}">${pos.code}</span>
      <div class="ts-name">${p.name}</div>
      <div class="ts-power">Сила ${fmt(p.power)}</div>
      <div class="ts-timer" data-training-timer="${p.id}">⏳ --:--</div>
      <button class="ts-cancel-btn" data-player-id="${p.id}">✕ Снять</button>
    </div>`;
}

function trainingSlotEmptyHtml(){
  return `
    <div class="training-slot empty">
      <div class="ts-empty-icon"><img src="${IMG.plus}" class="ts-empty-icon-img" alt="+"></div>
      <div class="ts-empty-label">Пустой слот</div>
      <button class="ts-add-btn">Добавить игрока</button>
    </div>`;
}

function renderTrainingSlotsPanel(){
  const container = document.getElementById('team-slots-card');
  if(!container) return;

  const maxSlots = state.trainingSlotsMax || 3;
  const occupied = state.trainingSlots
    .map(id => state.players.find(p=>p.id===id))
    .filter(Boolean);
  const emptyCount = Math.max(0, maxSlots - occupied.length);

  const slotsHtml = occupied.map(trainingSlotOccupiedHtml).join('')
    + Array.from({length: emptyCount}).map(trainingSlotEmptyHtml).join('');

  container.innerHTML = `
    <div class="slots-card">
      <div class="slots-card-head">
        <span class="slots-card-icon"><img src="${IMG.training}" class="slots-card-icon-img" alt="Тренировка"></span>
        <div>
          <div class="slots-card-title">Слоты тренировок</div>
          <div class="slots-card-sub">Занято ${occupied.length}/${maxSlots} · только запасные · 30 мин · +8…+25 силы</div>
        </div>
      </div>
      <div class="training-slots-grid">${slotsHtml}</div>
      ${trainingSlotUpgradeCtaHtml(maxSlots)}
    </div>`;

  container.querySelectorAll('.ts-add-btn').forEach(btn=>{
    btn.addEventListener('click', openTrainingPicker);
  });
  container.querySelectorAll('.ts-cancel-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> onCancelTraining(btn.dataset.playerId));
  });
  const slotBtn = document.getElementById('btn-buy-slot');
  if(slotBtn) slotBtn.addEventListener('click', onBuySlotUpgrade);

  startTrainingSlotsTimer();
}

let trainingSlotsInterval = null;
function startTrainingSlotsTimer(){
  if(trainingSlotsInterval){ clearInterval(trainingSlotsInterval); trainingSlotsInterval = null; }
  updateTrainingSlotsTimers();
  trainingSlotsInterval = setInterval(()=>{
    const view = document.getElementById('view-team');
    if(!view || !view.classList.contains('active')){
      clearInterval(trainingSlotsInterval);
      trainingSlotsInterval = null;
      return;
    }
    updateTrainingSlotsTimers();
  }, 1000);
}

function updateTrainingSlotsTimers(){
  document.querySelectorAll('[data-training-timer]').forEach(el=>{
    const id = el.dataset.trainingTimer;
    const p = state.players.find(pl=>pl.id===id);
    if(!p || !p.training || !p.trainingEndTime) return;
    const remaining = Math.max(0, Math.floor((p.trainingEndTime - Date.now()) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    el.textContent = `⏳ ${mins}:${secs.toString().padStart(2,'0')}`;
  });
}

/* окно выбора запасного игрока для отправки на тренировку */
function openTrainingPicker(){
  const maxSlots = state.trainingSlotsMax || 3;
  if(state.trainingSlots.length >= maxSlots){
    showToast(`Все слоты тренировок заняты (${state.trainingSlots.length}/${maxSlots})`);
    return;
  }
  const eligible = state.players
    .filter(p => p.status === 'bench' && !p.training)
    .sort((a,b) => POSITIONS.findIndex(pos=>pos.code===a.pos) - POSITIONS.findIndex(pos=>pos.code===b.pos));
  if(!eligible.length){
    showToast('Нет свободных запасных игроков для тренировки');
    return;
  }

  const old = document.getElementById('training-picker-overlay');
  if(old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'training-picker-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card training-picker-card">
      <button class="modal-close" id="training-picker-close">✕</button>
      <div class="tp-title"><img src="${IMG.training}" class="tp-title-icon" alt="Тренировка"> Кого отправить на тренировку?</div>
      <div class="tp-sub">Только запасные · 30 минут · +8…+25 силы · деньги списываются сразу</div>
      <div class="tp-list">
        ${eligible.map(p=>{
          const pos = posByCode(p.pos);
          const cost = trainingCostForPower(p.power);
          const affordable = state.coins >= cost;
          return `
            <button class="tp-row ${affordable ? '' : 'disabled'}" data-player-id="${p.id}" ${affordable ? '' : 'disabled'}>
              <span class="player-pos ${pos.css}">${pos.code}</span>
              <span class="tp-row-name">${p.name}</span>
              <span class="tp-row-power">Сила ${fmt(p.power)}</span>
              <span class="tp-row-cost"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> ${fmt(cost)}</span>
            </button>`;
        }).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = ()=> overlay.remove();
  overlay.querySelector('#training-picker-close').addEventListener('click', close);
  overlay.addEventListener('click', e=>{ if(e.target===overlay) close(); });
  overlay.querySelectorAll('.tp-row').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.playerId;
      close();
      startTraining(id);
    });
  });
}

function closeTrainingPicker(){
  const overlay = document.getElementById('training-picker-overlay');
  if(overlay) overlay.remove();
}

function onCancelTraining(playerId){
  const p = state.players.find(pl=>pl.id===playerId);
  if(!p || !p.training) return;
  showConfirm(`Снять <b>${p.name}</b> с тренировки? Потраченные монеты не вернутся, сила не увеличится.`, ()=>{
    if(trainingTimers[playerId]){
      clearTimeout(trainingTimers[playerId]);
      delete trainingTimers[playerId];
    }
    p.training = false;
    p.trainingEndTime = null;
    const idx = state.trainingSlots.indexOf(playerId);
    if(idx !== -1) state.trainingSlots.splice(idx, 1);
    save();
    refreshTopbar();
    renderTeam();
    showToast(`${p.name} снят с тренировки`);
  }, { icon:'🚫', title:'Снять с тренировки?', yesText:'Снять' });
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
  renderTrainingSlotsPanel();
  showToast(`⏱️ Открыт новый слот тренировок! (${nextMax}/${SLOT_UPGRADE_MAX})`);
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

let transferActiveFilter = 'all';

function transferPlayerRowHtml(p){
  const pos = posByCode(p.pos);
  const affordable = state.coins >= p.price;
  return `
  <div class="tournament-card transfer-row" data-id="${p.id}">
    <span class="player-pos player-row-icon ${pos.css}">${pos.code}</span>
    <div class="tournament-info">
      <div class="tournament-name">${p.name}</div>
      <div class="tournament-status">${posLabel(p.pos)} · Сила ${fmt(p.power)}</div>
    </div>
    <button class="transfer-row-buy" data-buy-id="${p.id}" ${affordable ? '' : 'disabled style="opacity:.5;cursor:not-allowed;"'}>
      <img src="${IMG.coin}" class="img-icon" alt="Монеты"> ${fmt(p.price)}
    </button>
  </div>`;
}

function transferFilterHtml(){
  const filters = [
    { code:'all', label:'ВСЕ' },
    ...POSITIONS.map(pos => ({ code: pos.code, label: pos.code }))
  ];
  return filters.map(f => `
    <button class="transfer-filter-btn ${transferActiveFilter === f.code ? 'active' : ''}" data-filter="${f.code}">${f.label}</button>
  `).join('');
}

function renderTransferMarket(){
  ensureTransferMarket();

  const filterEl = document.getElementById('transfer-filter');
  filterEl.innerHTML = transferFilterHtml();
  filterEl.querySelectorAll('.transfer-filter-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      transferActiveFilter = btn.dataset.filter;
      renderTransferMarket();
    });
  });

  const list = document.getElementById('transfer-list');
  const players = state.transferMarket.players.filter(p =>
    transferActiveFilter === 'all' || p.pos === transferActiveFilter
  );
  list.innerHTML = players.length
    ? players.map(transferPlayerRowHtml).join('')
    : `<div class="stub-card"><div class="stub-icon">🔁</div><p>${state.transferMarket.players.length ? 'Нет игроков по этому фильтру' : 'Рынок пуст. Загляните позже.'}</p></div>`;

  list.querySelectorAll('.transfer-row').forEach(row=>{
    row.addEventListener('click', ()=> openTransferPlayerModal(row.dataset.id));
  });
  list.querySelectorAll('.transfer-row-buy').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      onBuyTransferPlayer(btn.dataset.buyId, btn);
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
  closePlayerModal();
  renderTransferMarket();
}

function openTransferPlayerModal(id){
  const market = state.transferMarket;
  const p = market.players.find(pl => pl.id === id);
  if(!p) return;

  const pos = posByCode(p.pos);
  const affordable = state.coins >= p.price;

  document.getElementById('player-modal-body').innerHTML = `
    <span class="player-pos ${pos.css}">${pos.code}</span>
    <div class="pm-name">${p.name}</div>
    <div class="pm-pos">${posLabel(p.pos)}</div>
    <div class="pm-power-label">СИЛА ИГРОКА</div>
    <div class="pm-power-value">${fmt(p.power)}</div>
    <div class="pm-status">Свободный агент — доступен на трансфере</div>
    <button id="btn-buy-transfer-player" class="btn-primary btn-big" style="margin-top:14px;" ${affordable ? '' : 'disabled style="opacity:.5;cursor:not-allowed;"'}>
      <img src="${IMG.coin}" class="img-icon" alt="Монеты"> Купить за ${fmt(p.price)}
    </button>
  `;
  document.getElementById('player-modal').classList.remove('hidden');

  const buyBtn = document.getElementById('btn-buy-transfer-player');
  if(buyBtn){
    buyBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      onBuyTransferPlayer(p.id);
    });
  }
}

function openPlayerModal(id){
  const p = state.players.find(pl=>pl.id===id);
  if(!p) return;
  const pos = posByCode(p.pos);
  const isTraining = p.training;

  let timeDisplay = '';
  if(isTraining) {
    let timeLeft = '0:00';
    if(p.trainingEndTime) {
      const remaining = Math.max(0, Math.floor((p.trainingEndTime - Date.now()) / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      timeLeft = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    timeDisplay = `<div style="color:var(--gold);font-weight:700;margin-top:8px;font-size:18px;">⏳ На тренировке — осталось ${timeLeft}</div>`;
  } else if(p.status === 'bench') {
    timeDisplay = `<div style="color:var(--text-mute);font-size:12px;margin-top:8px;">Отправить на тренировку можно в «Команде», в слотах тренировок.</div>`;
  }

  let swapButton = '';
  if(p.status === 'main'){
    swapButton = `<button id="btn-swap-status" class="btn-secondary btn-big" style="margin-top:10px;">🔻 Отправить в запас</button>`;
  } else if(isTraining){
    swapButton = `<button class="btn-secondary btn-big" disabled style="margin-top:10px;opacity:0.5;cursor:not-allowed;">⏳ Снимите с тренировки, чтобы поставить в основу</button>`;
  } else {
    const canPlace = hasAvailableSlotForPos(p.pos);
    swapButton = canPlace
      ? `<button id="btn-swap-status" class="btn-primary btn-big" style="margin-top:10px;">🔺 В основной состав</button>`
      : `<button class="btn-secondary btn-big" disabled style="margin-top:10px;opacity:0.5;cursor:not-allowed;">❌ Нет места на позиции «${posLabel(p.pos)}» в схеме ${state.formation}</button>`;
  }

  let sellButton = '';
  if(p.status === 'bench'){
    if(isTraining){
      sellButton = `<button class="btn-danger btn-big" disabled style="margin-top:10px;opacity:0.5;cursor:not-allowed;">⏳ Нельзя продать во время тренировки</button>`;
    } else {
      const price = sellPlayerPrice(p.power);
      sellButton = `<button id="btn-sell-player" class="btn-danger btn-big" style="margin-top:10px;">💰 Продать за ${fmt(price)} <img src="${IMG.coin}" class="img-icon" alt="Монеты"></button>`;
    }
  }

  document.getElementById('player-modal-body').innerHTML = `
    <span class="player-pos ${pos.css}">${pos.code}</span>
    <div class="pm-name">${p.name}</div>
    <div class="pm-pos">${posLabel(p.pos)}</div>
    <div class="pm-power-label">СИЛА ИГРОКА</div>
    <div class="pm-power-value">${fmt(p.power)}</div>
    <div class="pm-status">Статус: ${p.status==='main' ? 'Основной состав' : 'Запасной'}</div>
    ${timeDisplay}
    ${swapButton}
    ${sellButton}
  `;
  document.getElementById('player-modal').classList.remove('hidden');

  if(isTraining && p.trainingEndTime) {
    startTrainingTimeUpdate(id);
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
  if(p.training){
    showToast('❌ Нельзя продать игрока во время тренировки — сначала снимите его со слота');
    return;
  }
  const price = sellPlayerPrice(p.power);
  showConfirm(`Продать <b>${p.name}</b> за ${fmt(price)} монет? Это действие нельзя отменить.`, ()=>{
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
    showToast(`💰 ${p.name} продан за ${fmt(price)} монет`);
  }, { icon:'💰', title:'Продать игрока?', yesText:'Продать' });
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
    if(p.training){
      showToast('❌ Нельзя поставить в основу тренирующегося игрока — сначала снимите с тренировки');
      return;
    }
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

  if(p.status !== 'bench') {
    showToast('❌ Тренировать можно только запасных игроков');
    return;
  }

  const maxSlots = state.trainingSlotsMax || 3;
  if(state.trainingSlots.length >= maxSlots) {
    showToast(`Все слоты тренировок заняты (${state.trainingSlots.length}/${maxSlots})`);
    return;
  }

  const cost = trainingCostForPower(p.power);
  if(state.coins < cost) {
    showToast(`Недостаточно монет! Нужно ${fmt(cost)}`);
    return;
  }

  state.coins -= cost;
  p.training = true;
  const endTime = Date.now() + TRAINING_DURATION_MS;
  p.trainingEndTime = endTime;
  state.trainingSlots.push(playerId);

  /* снимаем игрока со всех схем расстановки, чтобы он не мог
     «выскочить» в основу при переключении на другую схему */
  ensureLineupsInit(state);
  Object.keys(state.lineups).forEach(fid=>{
    const lineup = state.lineups[fid];
    for(let i=0;i<lineup.length;i++){ if(lineup[i]===playerId) lineup[i] = null; }
  });
  syncStatusFromLineup(state);

  save();
  refreshTopbar();
  renderTeam();

  showToast(`⏳ Тренировка ${p.name} началась! (30 мин, −${fmt(cost)} монет)`);

  const timerId = setTimeout(() => {
    finishTraining(playerId);
  }, TRAINING_DURATION_MS);

  trainingTimers[playerId] = timerId;
}

function finishTraining(playerId){
  const p = state.players.find(pl=>pl.id===playerId);
  if(!p) return;

  if(!p.training) return;

  const powerGain = trainingPowerGain();
  p.power += powerGain;
  p.training = false;
  p.trainingEndTime = null;

  const index = state.trainingSlots.indexOf(playerId);
  if(index !== -1) {
    state.trainingSlots.splice(index, 1);
  }

  delete trainingTimers[playerId];

  save();
  refreshTopbar();
  renderTeam();

  showToast(`✅ ${p.name} завершил тренировку! +${powerGain} силы (теперь ${fmt(p.power)})`);
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

  showConfirm(`Весь прогресс в турнире «${t.title}» будет потерян.`, ()=>{
    stopCupTimer();
    state.cups[currentCupId] = null;
    save();
    navigate('play');
    showToast(`Вы покинули «${t.title}»`);
  }, { icon:'🚪', title:'Покинуть турнир?', yesText:'Покинуть' });
}

/* ============================================================
   MANAGER SCREEN
   ============================================================ */
function renderManager(){
  refreshTopbar();
  const power = calcClubPower(state.players);
  const heroPowerEl = document.getElementById('hero-power');
  if(heroPowerEl) heroPowerEl.textContent = fmt(power);
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
        const countText = `×${data.count}`;
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
        <span class="mgr-power-pill">СИЛА ${fmt(power)}</span>
      </div>

      <div style="margin: 12px 0; background: rgb(0 0 0 / 37%); border: 1px solid var(--line); padding: 12px; border-radius: 10px;">
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
              ${isMaxLevel ? 'MAX' : `${fmt(state.xp)} / ${fmt(getXpForLevel(level + 1))}`}
            </div>
          </div>
        </div>
        ${!isMaxLevel ? `
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-mute);">
            <span>${fmt(xpInCurrentLevel)} XP</span>
            <span>До ${level + 1} уровня: ${fmt(xpToNext)} XP</span>
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

      <div class="mgr-stats-grid">
        <div class="mgr-stat wins"><div class="mgr-stat-value">${s.wins}</div><div class="mgr-stat-label">ПОБЕДЫ</div></div>
        <div class="mgr-stat draws"><div class="mgr-stat-value">${s.draws}</div><div class="mgr-stat-label">НИЧЬИ</div></div>
        <div class="mgr-stat losses"><div class="mgr-stat-value">${s.losses}</div><div class="mgr-stat-label">ПОРАЖЕНИЯ</div></div>
        <div class="mgr-stat total"><div class="mgr-stat-value">${s.matchesPlayed}</div><div class="mgr-stat-label">ВСЕГО МАТЧЕЙ</div></div>
        <div class="mgr-stat xp"><div class="mgr-stat-value">${state.xp.toLocaleString('ru-RU')}</div><div class="mgr-stat-label">ВСЕГО ОПЫТА</div></div>
      </div>
    </div>
    <button id="btn-open-tasks" class="btn-tasks">
      <span class="btn-tasks-icon"><img src="${IMG.tasks}" class="btn-tasks-icon-img" alt="Задания"></span>
      <span class="btn-tasks-text">
        <span class="btn-tasks-title">Задания</span>
        <span class="btn-tasks-sub">Выполняйте и получайте награды</span>
      </span>
      <span class="btn-tasks-arrow">›</span>
    </button>
    <h3 class="squad-heading">ЗАЛ СЛАВЫ</h3>
    <div class="mgr-trophy-list">${trophiesHtml}</div>
  `;

  document.getElementById('btn-open-tasks').addEventListener('click', openTasksModal);
  updateTasksBadge();
}

/* ============================================================
   TOURNAMENTS LIST
   ============================================================ */
function leagueListStatusText(t, opts){
  const { inProgress, squadFull, mainCount, eligible, range } = opts;
  if(inProgress) return 'Идёт групповой этап / плей-офф';
  if(!squadFull) return `Соберите состав (${mainCount}/${MAIN_SQUAD_SIZE})`;
  if(!eligible) return `Нужна сила клуба ${fmt(range.min)}–${fmt(range.max)}`;
  const { next } = getLeagueSessions(t);
  const remaining = Math.max(0, next.getTime() - Date.now());
  const hh = String(Math.floor(remaining / 3600000)).padStart(2,'0');
  const mm = String(Math.floor((remaining % 3600000) / 60000)).padStart(2,'0');
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2,'0');
  const registered = leagueReg(t).sessionId === leagueSessionId(next);
  return `${registered ? '✅ Регистрация ' : ''}Старт через ${hh}:${mm}:${ss}`;
}

let leagueListInterval = null;

function stopLeagueListTimer(){
  if(leagueListInterval){ clearInterval(leagueListInterval); leagueListInterval = null; }
}

function startLeagueListTimer(){
  stopLeagueListTimer();
  if(!TOURNAMENTS.some(x => x.scheduled)) return;
  leagueListInterval = setInterval(()=>{
    const view = document.getElementById('view-play');
    if(!view || !view.classList.contains('active')){
      stopLeagueListTimer();
      return;
    }
    checkLeagueRegistrationEligibility();
    TOURNAMENTS.filter(x => x.scheduled).forEach(t=>{
      const statusEl = document.querySelector(`.tournament-card[data-cup="${t.id}"] .tournament-status`);
      if(!statusEl) return;
      const power = calcClubPower(state.players);
      const mainCount = state.players.filter(p=>p.status==='main').length;
      const squadFull = mainCount >= MAIN_SQUAD_SIZE;
      const range = tournamentRange(t, power);
      const eligible = power >= range.min && power <= range.max;
      const cup = state.cups[t.id];
      const inProgress = !!(cup && !cup.finished);
      statusEl.textContent = leagueListStatusText(t, { inProgress, squadFull, mainCount, eligible, range });
    });
  }, 1000);
}

function renderTournaments(){
  checkLeagueRegistrationEligibility();
  const power = calcClubPower(state.players);
  const mainCount = state.players.filter(p=>p.status==='main').length;
  const squadFull = mainCount >= MAIN_SQUAD_SIZE;
  const list = document.getElementById('tournament-list');

  list.innerHTML = TOURNAMENTS.map(t=>{
    const cup = state.cups[t.id];
    const inProgress = !!(cup && !cup.finished);
    const range = tournamentRange(t, power);
    const eligible = power >= range.min && power <= range.max;
    let statusText;
    if(t.scheduled) statusText = leagueListStatusText(t, { inProgress, squadFull, mainCount, eligible, range });
    else if(inProgress) statusText = 'Турнир в процессе';
    else if(!squadFull) statusText = `Соберите состав (${mainCount}/${MAIN_SQUAD_SIZE})`;
    else if(eligible) statusText = `Сила клуба ${fmt(range.min)}–${fmt(range.max)}`;
    else statusText = `Нужна сила клуба ${fmt(range.min)}–${fmt(range.max)}`;

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

  startLeagueListTimer();
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
  const range = tournamentRange(t, power);
  const eligible = power >= range.min && power <= range.max;
  const introEl = document.getElementById('cup-intro');
  const bracketWrap = document.getElementById('cup-bracket-wrap');
  const eligEl = document.getElementById('cup-eligibility');
  const startBtn = document.getElementById('btn-cup-start');
  const cup = state.cups[t.id];

  if(cup && !cup.finished){
    syncPlayerCupTeam(cup);
    introEl.classList.add('hidden');
    bracketWrap.classList.remove('hidden');
    stopLeagueCountdown();
    hideLeagueCancelBtn();
    renderBracket();
    ensureCupFlowRunning();
    return;
  }

  bracketWrap.classList.add('hidden');
  introEl.classList.remove('hidden');
  stopCupTimer();

  if(t.scheduled){
    renderLeagueIntro(t, { power, mainCount, squadFull, eligible, range });
    return;
  }
  stopLeagueCountdown();
  hideLeagueCancelBtn();
  startBtn.textContent = 'ИГРАТЬ';
  startBtn.disabled = false;
  startBtn.classList.remove('btn-disabled-soft');

  if(!squadFull){
    eligEl.classList.add('bad');
    eligEl.textContent = `Соберите полный основной состав (${mainCount}/${MAIN_SQUAD_SIZE}), чтобы играть в турнирах.`;
    startBtn.classList.add('hidden');
  } else if(eligible){
    eligEl.classList.remove('bad');
    eligEl.textContent = `Сила клуба: ${fmt(power)}. Ваша команда подходит для участия.`;
    startBtn.classList.remove('hidden');
  } else if(power < range.min){
    eligEl.classList.add('bad');
    eligEl.textContent = `Ваша команда слишком слабая для этого турнира. Нужна сила от ${fmt(range.min)}.`;
    startBtn.classList.add('hidden');
  } else {
    eligEl.classList.add('bad');
    eligEl.textContent = 'Ваша команда слишком сильная для этого турнира.';
    startBtn.classList.add('hidden');
  }
}

/* ============================================================
   BIG LEAGUE — INTRO SCREEN (регистрация + таймер)
   ============================================================ */
let leagueCountdownInterval = null;

function stopLeagueCountdown(){
  if(leagueCountdownInterval){ clearInterval(leagueCountdownInterval); leagueCountdownInterval = null; }
}

function renderLeagueIntro(t, ctx){
  const eligEl = document.getElementById('cup-eligibility');
  const startBtn = document.getElementById('btn-cup-start');

  if(!ctx.squadFull){
    eligEl.classList.add('bad');
    eligEl.textContent = `Соберите полный основной состав (${ctx.mainCount}/${MAIN_SQUAD_SIZE}), чтобы играть в турнирах.`;
    startBtn.classList.add('hidden');
    hideLeagueCancelBtn();
    stopLeagueCountdown();
    return;
  }
  if(!ctx.eligible){
    eligEl.classList.add('bad');
    eligEl.textContent = ctx.power < ctx.range.min
      ? `Ваша команда слишком слабая для турнира «${t.title}». Нужна сила от ${fmt(ctx.range.min)}.`
      : `Ваша команда слишком сильная для своего диапазона в «${t.title}» (${fmt(ctx.range.min)}–${fmt(ctx.range.max)}).`;
    startBtn.classList.add('hidden');
    hideLeagueCancelBtn();
    stopLeagueCountdown();
    return;
  }

  eligEl.classList.remove('bad');
  startBtn.classList.remove('hidden');
  startBtn.classList.remove('btn-disabled-soft');
  startBtn.disabled = false;

  updateLeagueCountdown(t);
  stopLeagueCountdown();
  leagueCountdownInterval = setInterval(()=>{
    const view = document.getElementById('view-cup');
    if(!view || !view.classList.contains('active') || currentCupId !== t.id){
      stopLeagueCountdown();
      return;
    }
    updateLeagueCountdown(t);
  }, 1000);
}

function getLeagueCancelBtn(){
  let btn = document.getElementById('btn-league-cancel');
  if(!btn){
    const startBtn = document.getElementById('btn-cup-start');
    btn = document.createElement('button');
    btn.id = 'btn-league-cancel';
    btn.className = 'btn-reset';
    btn.textContent = '❌ Отменить регистрацию';
    startBtn.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', onLeagueCancelRegistration);
  }
  return btn;
}

function hideLeagueCancelBtn(){
  const btn = document.getElementById('btn-league-cancel');
  if(btn) btn.classList.add('hidden');
}

function scheduleTimesLabel(t){
  return t.schedule.times.map(x => `${String(x.h).padStart(2,'0')}:${String(x.m).padStart(2,'0')}`).join(' и ');
}

function updateLeagueCountdown(t){
  const cup = state.cups[t.id];
  if(cup && !cup.finished) return; // сессия уже идёт — обычный экран кубка

  const eligEl = document.getElementById('cup-eligibility');
  const startBtn = document.getElementById('btn-cup-start');
  const { prev, next } = getLeagueSessions(t);
  const graceMs = 30 * 60 * 1000; // 30 минут на вход после старта
  const reg = leagueReg(t);

  if(prev && reg.sessionId === leagueSessionId(prev)){
    const elapsed = Date.now() - prev.getTime();
    if(elapsed <= graceMs){
      reg.sessionId = null;
      startLeagueSession(t, prev);
      return;
    } else {
      reg.sessionId = null;
      save();
      showToast(`⌛ Вы не успели зайти к старту «${t.title}». Регистрация на новый старт открыта.`);
    }
  }

  checkLeagueRegistrationEligibility();

  const remaining = Math.max(0, next.getTime() - Date.now());
  const totalSec = Math.floor(remaining / 1000);  const hh = String(Math.floor(totalSec / 3600)).padStart(2,'0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2,'0');
  const ss = String(totalSec % 60).padStart(2,'0');
  const registered = reg.sessionId === leagueSessionId(next);

  const power = calcClubPower(state.players);
  const range = registered && reg.range ? reg.range : bigLeagueRangeForPower(power);
  const rangeLine = `<br><span style="font-size:12px;color:var(--text-dim)">Диапазон силы клуба ${registered ? '(закреплён при регистрации)' : 'для вашей текущей силы'}: ${fmt(range.min)}–${fmt(range.max)}. Ваша сила: ${fmt(power)}.</span>`;

  eligEl.innerHTML = (registered
    ? `✅ Вы зарегистрированы! До старта «${t.title}»: <b>${hh}:${mm}:${ss}</b>`
    : `До старта «${t.title}»: <b>${hh}:${mm}:${ss}</b><br><span style="font-size:12px;color:var(--text-dim)">Старты каждый день в ${scheduleTimesLabel(t)} по Киеву. Зарегистрируйтесь заранее — кубки и другие турниры при этом остаются доступны.</span>`
  ) + rangeLine;

  startBtn.textContent = registered ? 'ВЫ ЗАРЕГИСТРИРОВАНЫ ✅' : 'ЗАРЕГИСТРИРОВАТЬСЯ';
  startBtn.disabled = registered;
  startBtn.classList.toggle('btn-disabled-soft', registered);

  const cancelBtn = getLeagueCancelBtn();
  cancelBtn.classList.toggle('hidden', !registered);
}

/* авто-отмена регистрации, если сила клуба вышла за диапазон, закреплённый
   при регистрации. Проверяется для КАЖДОГО турнира по расписанию отдельно.
   Если сессия уже стартовала — сила не проверяется, играем как есть. */
function checkLeagueRegistrationEligibility(){
  let anyCancelled = false;
  TOURNAMENTS.filter(x => x.scheduled).forEach(t=>{
    const reg = leagueReg(t);
    if(!reg.sessionId) return;

    const cup = state.cups[t.id];
    if(cup && !cup.finished) return; // сессия уже идёт

    const { next } = getLeagueSessions(t);
    if(reg.sessionId !== leagueSessionId(next)) return; // регистрация на уже стартовавшую сессию

    const power = calcClubPower(state.players);
    const range = reg.range || bigLeagueRangeForPower(power);
    if(power >= range.min && power <= range.max) return;

    reg.sessionId = null;
    reg.range = null;
    reg.notifiedSessionId = null;
    save();
    showToast(`❌ Регистрация в «${t.title}» отменена: сила клуба ${fmt(power)} вышла из диапазона ${fmt(range.min)}–${fmt(range.max)}.`);
    anyCancelled = true;
  });
  return anyCancelled;
}

function onLeagueCancelRegistration(){
  const t = tournamentById(currentCupId);
  if(!t) return;
  const reg = leagueReg(t);
  reg.sessionId = null;
  reg.range = null;
  reg.notifiedSessionId = null;
  save();
  if(t.scheduled) updateLeagueCountdown(t);
  showToast(`Регистрация в «${t.title}» отменена.`);
}

function onLeagueRegister(){
  const t = tournamentById(currentCupId);
  const reg = leagueReg(t);
  if(reg.sessionId){
    showToast(`Вы уже зарегистрированы на ближайший старт «${t.title}».`);
    return;
  }
  const power = calcClubPower(state.players);
  const range = bigLeagueRangeForPower(power);
  const { next } = getLeagueSessions(t);
  reg.sessionId = leagueSessionId(next);
  reg.range = range;
  reg.notifiedSessionId = null;
  save();
  updateLeagueCountdown(t);
  showToast(`✅ Вы зарегистрированы на ближайший старт «${t.title}»! Диапазон: ${fmt(range.min)}–${fmt(range.max)}.`);
}

function startLeagueSession(t, sessionStartDate){
  initEuroCup(t.id);
  const cup = state.cups[t.id];
  cup.sessionId = leagueSessionId(sessionStartDate);
  save();
  stopLeagueCountdown();
  hideLeagueCancelBtn();
  if(currentCupId === t.id){
    document.getElementById('cup-intro').classList.add('hidden');
    document.getElementById('cup-bracket-wrap').classList.remove('hidden');
    renderBracket();
    ensureCupFlowRunning();
  }
}

// лёгкий фоновый опрос — уведомляет, если игрок не на экране лиги в момент старта
function checkLeagueNotification(){
  checkLeagueRegistrationEligibility();
  TOURNAMENTS.filter(x => x.scheduled).forEach(t=>{
    const reg = leagueReg(t);
    if(!reg.sessionId) return;
    const cup = state.cups[t.id];
    if(cup && !cup.finished) return;

    const { prev } = getLeagueSessions(t);
    if(!prev) return;
    const sid = leagueSessionId(prev);
    if(reg.sessionId !== sid) return;

    const graceMs = 30 * 60 * 1000;
    const elapsed = Date.now() - prev.getTime();

    if(elapsed >= 0 && elapsed <= graceMs){
      if(reg.notifiedSessionId !== sid){
        reg.notifiedSessionId = sid;
        save();
        showToast(`🏆 «${t.title}» началась! Откройте «Играть» → «${t.title}», чтобы сыграть.`);
      }
    } else if(elapsed > graceMs){
      reg.sessionId = null;
      save();
    }
  });
}

function startLeagueNotificationPoll(){
  checkLeagueNotification();
  setInterval(checkLeagueNotification, 30000);
}

function onCupStart(){
  const t = tournamentById(currentCupId);
  if(t.scheduled){
    onLeagueRegister();
    return;
  }
  const mainCount = state.players.filter(p=>p.status==='main').length;
  if(mainCount < MAIN_SQUAD_SIZE){
    showToast(`❌ Соберите полный состав (${mainCount}/${MAIN_SQUAD_SIZE}), чтобы играть в турнире`);
    return;
  }
  if(t.type === 'group') initEuroCup(currentCupId); else initCup(currentCupId);
  document.getElementById('cup-intro').classList.add('hidden');
  document.getElementById('cup-bracket-wrap').classList.remove('hidden');
  renderBracket();
  ensureCupFlowRunning();
}

function renderCupRewardsList(t){
  const el = document.getElementById('cup-rewards');
  if(!el) return;

  if(t.type === 'group'){
    const rows = [];
    rows.push(`
      <div class="cup-reward-row">
        <span class="cup-reward-stage">ГРУППОВОЙ ЭТАП (за победу в туре)</span>
        <span class="cup-reward-values">
          <span class="cup-reward-chip coins"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${t.groupStageReward.coins.toLocaleString('ru-RU')}</span>
          <span class="cup-reward-chip power"><img src="${IMG.sila}" class="img-icon" alt="Сила"> +${t.groupStageReward.power}</span>
          <span class="cup-reward-chip xp"><img src="${IMG.xp}" class="img-icon" alt="Опыт"> +${fmt(t.groupStageReward.xp)} XP</span>
        </span>
      </div>`);
    rows.push(`
      <div class="cup-reward-row">
        <span class="cup-reward-stage">🥇 1-Е МЕСТО В ГРУППЕ</span>
        <span class="cup-reward-values">
          <span class="cup-reward-chip coins"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${t.groupWinBonus.coins.toLocaleString('ru-RU')}</span>
          <span class="cup-reward-chip power"><img src="${IMG.sila}" class="img-icon" alt="Сила"> +${t.groupWinBonus.power}</span>
          <span class="cup-reward-chip xp"><img src="${IMG.xp}" class="img-icon" alt="Опыт"> +${fmt(t.groupWinBonus.xp)} XP</span>
        </span>
      </div>`);
    const koTitlesMap = buildRoundTitles(t.groupsCount);
    const koTitles = [];
    for(let i=1; i<=t.koRounds.length; i++) koTitles.push(koTitlesMap[i] || `РАУНД ${i}`);
    koTitles.forEach((title, i)=>{
      const isFinal = i === koTitles.length - 1;
      const r = t.koRounds[i];
      rows.push(`
        <div class="cup-reward-row ${isFinal ? 'final' : ''}">
          <span class="cup-reward-stage">${isFinal ? '🏆 ' : ''}${title}</span>
          <span class="cup-reward-values">
            <span class="cup-reward-chip coins"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${r.coins.toLocaleString('ru-RU')}</span>
            <span class="cup-reward-chip power"><img src="${IMG.sila}" class="img-icon" alt="Сила"> +${r.power}</span>
            <span class="cup-reward-chip xp"><img src="${IMG.xp}" class="img-icon" alt="Опыт"> +${fmt(r.xp)} XP</span>
            ${isFinal ? `<span class="cup-reward-chip trophy"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${t.cupWinCoins.toLocaleString('ru-RU')}</span>` : ''}
            ${isFinal && t.leagueChampionBudget ? `<span class="cup-reward-chip trophy"><img src="${IMG.cash}" class="img-icon" alt="Бюджет"> +${t.leagueChampionBudget.toLocaleString('ru-RU')}</span>` : ''}
          </span>
        </div>`);
    });
    el.innerHTML = `
      <div class="cup-rewards-title">ПРИЗОВЫЕ ЗА ЭТАПЫ</div>
      <div class="cup-rewards-list">${rows.join('')}</div>
    `;
    return;
  }

  const totalRounds = t.rounds.length;
  const roundTitles = buildRoundTitles(t.teamCount);

  const rows = [];
  for(let round = 1; round <= totalRounds; round++){
    const isFinal = round === totalRounds;
    const r = t.rounds[round-1];
    rows.push(`
      <div class="cup-reward-row ${isFinal ? 'final' : ''}">
        <span class="cup-reward-stage">${isFinal ? '🏆 ' : ''}${roundTitles[round] || `РАУНД ${round}`}</span>
        <span class="cup-reward-values">
          <span class="cup-reward-chip coins"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${r.coins.toLocaleString('ru-RU')}</span>
          <span class="cup-reward-chip power"><img src="${IMG.sila}" class="img-icon" alt="Сила"> +${r.power}</span>
          <span class="cup-reward-chip xp"><img src="${IMG.xp}" class="img-icon" alt="Опыт"> +${fmt(r.xp)} XP</span>
          ${isFinal ? `<span class="cup-reward-chip trophy"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${t.cupWinCoins.toLocaleString('ru-RU')}</span>` : ''}
        </span>
      </div>`);
  }

  el.innerHTML = `
    <div class="cup-rewards-title">ПРИЗОВЫЕ ЗА ЭТАПЫ</div>
    <div class="cup-rewards-list">${rows.join('')}</div>
  `;
}

function initEuroCup(cupId){
  const t = tournamentById(cupId);
  const power = calcClubPower(state.players);
  const range = t.scheduled ? (leagueReg(t).range || bigLeagueRangeForPower(power)) : { min: t.min, max: t.max };
  const playerTeam = { id:'you', name: state.teamName, power, isPlayer:true, formation: state.formation };

  const names = shuffle([...t.teamNames]);
  const groupOpponents = [];
  for(let i=0; i<t.teamsPerGroup-1; i++){
    groupOpponents.push({
      id: uid(),
      name: names[i % names.length],
      power: rnd(range.min, range.max),
      isPlayer: false,
      formation: pick(FORMATION_IDS)
    });
  }

  const teams = shuffle([playerTeam, ...groupOpponents]);
  const groupRounds = roundRobinRounds(teams.length);

  const matches = [];
  let matchIdx = 0;
  groupRounds.forEach((pairs, rIdx)=>{
    pairs.forEach(([ai, bi])=>{
      matches.push({
        round: rIdx + 1,
        a: { type:'direct', idx: ai },
        b: { type:'direct', idx: bi },
        played:false, teamA:null, teamB:null, scoreA:0, scoreB:0, winner:null,
        matchIdx: matchIdx++
      });
    });
  });

  state.cups[cupId] = {
    type:'group',
    stage:'groups',
    teams,
    matches,
    nextIndex:0,
    finished:false,
    won:false,
    groupRoundsCount: groupRounds.length,
    currentRound:1,
    powerRange: range
  };
  save();
}

function buildBracketFromIndices(indices, startRound, startMatchIdx){
  const matches = [];
  let matchIdx = startMatchIdx;
  for(let i=0; i<indices.length; i+=2){
    matches.push({
      round: startRound,
      a: { type:'direct', idx: indices[i] },
      b: { type:'direct', idx: indices[i+1] },
      played:false, teamA:null, teamB:null, scoreA:0, scoreB:0, winner:null,
      matchIdx: matchIdx++
    });
  }

  let round = startRound + 1;
  let prevRoundMatches = matches.filter(m => m.round === round - 1);
  while(prevRoundMatches.length > 1){
    const roundMatches = [];
    for(let i=0; i<prevRoundMatches.length; i+=2){
      roundMatches.push({
        round: round,
        a: { type:'winner', m: prevRoundMatches[i].matchIdx },
        b: { type:'winner', m: prevRoundMatches[i+1]?.matchIdx || prevRoundMatches[i].matchIdx },
        played:false, teamA:null, teamB:null, scoreA:0, scoreB:0, winner:null,
        matchIdx: matchIdx++
      });
    }
    matches.push(...roundMatches);
    prevRoundMatches = roundMatches;
    round++;
  }
  return matches;
}

function simulateGroupWinner(t, range){
  const names = shuffle([...t.teamNames]);
  const teams = [];
  for(let i=0; i<t.teamsPerGroup; i++){
    teams.push({ id: uid(), name: names[i % names.length], power: rnd(range.min, range.max), isPlayer:false, formation: pick(FORMATION_IDS) });
  }
  const rounds = roundRobinRounds(teams.length);
  const stats = {};
  teams.forEach(tm => stats[tm.id] = { team:tm, pts:0, gf:0, ga:0 });
  rounds.forEach(pairs=>{
    pairs.forEach(([ai, bi])=>{
      const A = teams[ai], B = teams[bi];
      const r = simulateMatch(A.power, B.power, A.formation, B.formation, true);
      stats[A.id].gf += r.scoreA; stats[A.id].ga += r.scoreB;
      stats[B.id].gf += r.scoreB; stats[B.id].ga += r.scoreA;
      if(r.draw){ stats[A.id].pts += 1; stats[B.id].pts += 1; }
      else if(r.aWon) stats[A.id].pts += 3;
      else stats[B.id].pts += 3;
    });
  });
  const sorted = Object.values(stats).sort((x,y)=> y.pts - x.pts || ((y.gf-y.ga)-(x.gf-x.ga)) || (y.gf-x.gf));
  return sorted[0].team;
}

function advanceGroupStage(t, cup){
  const table = computeGroupTable(cup, cup.teams);
  cup.groupStanding = table.findIndex(row => row.team.isPlayer) + 1;
  const winner = table[0].team;

  if(!winner.isPlayer){
    cup.finished = true;
    cup.won = false;
    cup.stage = 'eliminated';
    recordCupPlayed(t.id);
    save();
    renderCupScreen();
    return;
  }

  state.coins += t.groupWinBonus.coins;
  const bonus = rewardRandomPlayer(t.groupWinBonus.power);
  addXp(t.groupWinBonus.xp);
  save();
  refreshTopbar();
  showToast(`🎉 Вы вышли из группы (1-е место)! +${t.groupWinBonus.coins.toLocaleString('ru-RU')} монет, +${t.groupWinBonus.power} силы, +${fmt(t.groupWinBonus.xp)} XP (${bonus.player.name})`);

  const range = cup.powerRange || { min: t.min, max: t.max };
  const otherWinners = [];
  for(let g=0; g<t.groupsCount-1; g++){
    otherWinners.push(simulateGroupWinner(t, range));
  }

  const playerIdx = cup.teams.findIndex(tm => tm.isPlayer);
  const koStartIdx = cup.teams.length;
  cup.teams.push(...otherWinners);

  const koIndices = shuffle([playerIdx, ...otherWinners.map((_, i)=> koStartIdx + i)]);
  const koMatches = buildBracketFromIndices(koIndices, cup.groupRoundsCount + 1, cup.matches.length);
  cup.matches.push(...koMatches);
  cup.stage = 'knockout';
  save();

  renderBracket();
  ensureCupFlowRunning();
}

function getMatchRewards(t, match, cup){
  if(t.type === 'group'){
    if(cup.groupRoundsCount && match.round <= cup.groupRoundsCount){
      return t.groupStageReward;
    }
    const koIdx = match.round - cup.groupRoundsCount - 1; // 0-based: 0=ЧФ,1=ПФ,2=Финал
    return t.koRounds[koIdx] || t.koRounds[t.koRounds.length-1];
  }
  return t.rounds[match.round-1] || t.rounds[t.rounds.length-1];
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
  const t = tournamentById(currentCupId);
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

    const result = simulateMatch(
      actualMatch.teamA.power, actualMatch.teamB.power,
      actualMatch.teamA.formation, actualMatch.teamB.formation,
      drawsAllowed(t, cup, actualMatch.round)
    );
    actualMatch.scoreA = result.scoreA;
    actualMatch.scoreB = result.scoreB;
    actualMatch.draw = !!result.draw;
    actualMatch.winner = result.draw ? null : (result.aWon ? actualMatch.teamA : actualMatch.teamB);
    actualMatch.played = true;
    cup.nextIndex++;

    const playerInvolved = actualMatch.teamA.isPlayer || actualMatch.teamB.isPlayer;
    const playerWon = playerInvolved && !!actualMatch.winner && actualMatch.winner.isPlayer;

    if(playerInvolved){
      state.stats.matchesPlayed++;
      if(actualMatch.draw) state.stats.draws++;
      else if(playerWon) state.stats.wins++;
      else state.stats.losses++;
    }

    if(playerInvolved) {
      renderBracket();
      save();

      const isGroupStage = t.type === 'group' && cup.stage === 'groups';

      if(!playerWon && !actualMatch.draw && !isGroupStage) {
        tournamentEnded = true;
        cup.finished = true;
        cup.won = false;
        recordCupPlayed(t.id);
        save();
        showMatchModal(actualMatch, false, () => {
          document.getElementById('match-modal').classList.add('hidden');
          renderCupScreen();
        });
      } else {
        showMatchModal(actualMatch, playerWon, () => {
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

/* порог ничьей: разница эффективной силы не больше 1% */
const DRAW_THRESHOLD = 0.01;

/* ничьи разрешены только в групповом этапе чемпионатов и Большой Лиги */
function drawsAllowed(t, cup, round){
  if(!t || t.type !== 'group') return false;
  if(!cup) return false;
  return round <= cup.groupRoundsCount;
}

function simulateMatch(powerA, powerB, formationA, formationB, allowDraw){
  const effA = powerA * formationMatchupMultiplier(formationA, formationB);
  const effB = powerB * formationMatchupMultiplier(formationB, formationA);

  // ничья: эффективная сила (уже с учётом схемы) равна или отличается не больше чем на 1%
  if(allowDraw){
    const maxEff = Math.max(effA, effB) || 1;
    if(Math.abs(effA - effB) / maxEff <= DRAW_THRESHOLD){
      const goals = rnd(0, 3);
      return { scoreA: goals, scoreB: goals, aWon:false, draw:true };
    }
  }

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
    ? { scoreA: winnerGoals, scoreB: loserGoals, aWon:true, draw:false }
    : { scoreA: loserGoals, scoreB: winnerGoals, aWon:false, draw:false };
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

  const result = simulateMatch(
    match.teamA.power, match.teamB.power,
    match.teamA.formation, match.teamB.formation,
    drawsAllowed(tournamentById(currentCupId), cup, match.round)
  );
  match.scoreA = result.scoreA;
  match.scoreB = result.scoreB;
  match.draw = !!result.draw;
  match.winner = result.draw ? null : (result.aWon ? match.teamA : match.teamB);
  match.played = true;
  cup.nextIndex++;

  const playerInvolved = match.teamA.isPlayer || match.teamB.isPlayer;
  const playerWon = playerInvolved && !!match.winner && match.winner.isPlayer;

  if(playerInvolved){
    state.stats.matchesPlayed++;
    if(match.draw) state.stats.draws++;
    else if(playerWon) state.stats.wins++;
    else state.stats.losses++;
  }

  renderBracket();
  save();

  if(playerInvolved){
    showMatchModal(match, playerWon, () => continueAfterMatch(playerWon || match.draw));
  } else {
    showToast(`${match.teamA.name} ${match.scoreA}:${match.scoreB} ${match.teamB.name}`);
    setTimeout(continueAfterMatch, 900, true);
  }
}

function continueAfterMatch(keepGoing){
  const t = tournamentById(currentCupId);
  const cup = state.cups[currentCupId];
  const isGroupStage = t.type === 'group' && cup.stage === 'groups';

  if(!keepGoing && !isGroupStage){
    cup.finished = true;
    cup.won = false;
    recordCupPlayed(t.id);
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

  if(t.type === 'group' && cup.stage === 'groups'){
    advanceGroupStage(t, cup);
    return;
  }

  const finalMatch = cup.matches[cup.matches.length-1];
  const playerWonFinal = finalMatch.winner && finalMatch.winner.isPlayer;
  cup.finished = true;
  cup.won = !!playerWonFinal;
  recordCupPlayed(t.id);
  if(playerWonFinal){
    const cupWinCoins = t.cupWinCoins;
    state.coins += cupWinCoins;
    let budgetReward = 0;
    if(t.leagueChampionBudget){
      budgetReward = t.leagueChampionBudget;
      state.budget += budgetReward;
    }
    state.trophies.push({ name:t.title, icon:t.icon, date: Date.now() });
    save();
    showTrophyModal(t, cupWinCoins, budgetReward);
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
  const namesFromFinal = ['ФИНАЛ', 'ПОЛУФИНАЛ', 'ЧЕТВЕРТЬФИНАЛ', '1/8 ФИНАЛА', '1/16 ФИНАЛА', '1/32 ФИНАЛА', '1/64 ФИНАЛА', '1/128 ФИНАЛА'];
  const titles = {};
  for(let round = 1; round <= totalRounds; round++){
    const fromEnd = totalRounds - round;
    titles[round] = namesFromFinal[fromEnd] || `РАУНД ${round}`;
  }
  return titles;
}

function euroRoundTitle(round, cup, t){
  if(round <= cup.groupRoundsCount) return `ТУР ${round}`;
  const koRound = round - cup.groupRoundsCount;
  const koTitlesMap = buildRoundTitles(t.groupsCount);
  return koTitlesMap[koRound] || `РАУНД ${round}`;
}

function renderGroupTableHtml(cup){
  const groupTeams = cup.teams.slice(0, cup.groupRoundsCount + 1);
  const table = computeGroupTable(cup, groupTeams);
  const rows = table.map((row, i) => `
    <div class="group-table-row ${row.team.isPlayer ? 'you' : ''} ${i===0 ? 'leader' : ''}">
      <span class="gt-pos">${i+1}</span>
      <span class="gt-name">${row.team.isPlayer ? '<span class="bm-you-tag">ТЫ</span> ' : ''}${row.team.name}</span>
      <span class="gt-p">${row.played}</span>
      <span class="gt-w">${row.wins}</span>
      <span class="gt-d">${row.draws}</span>
      <span class="gt-l">${row.losses}</span>
      <span class="gt-gf">${row.gf}:${row.ga}</span>
      <span class="gt-pts">${row.pts}</span>
    </div>`).join('');
  return `
    <div class="group-table-wrap">
      <div class="group-table-title">ТАБЛИЦА ГРУППЫ · выходит только 1-е место</div>
      <div class="group-table-head">
        <span>#</span><span>Команда</span><span>И</span><span>В</span><span>Н</span><span>П</span><span>Мячи</span><span>О</span>
      </div>
      <div class="group-table-body">${rows}</div>
    </div>`;
}

/* какой этап сейчас актуален (ближайший несыгранный) */
function cupCurrentRound(cup){
  if(!cup.matches.length) return 1;
  if(cup.nextIndex < cup.matches.length) return cup.matches[cup.nextIndex].round;
  return cup.matches[cup.matches.length - 1].round;
}

/* просматриваемый этап в лигах/чемпионатах (переключается кнопками) */
let bracketViewRound = null;
let bracketViewKey = '';

/* пагинация пар внутри этапа: если пар больше 10 — качелька «страница X из Y» */
const MATCHES_PAGE_SIZE = 10;
let bracketPageIndex = {};

function matchesPageHtml(key, matches, cup){
  const totalPages = Math.max(1, Math.ceil(matches.length / MATCHES_PAGE_SIZE));
  let page = bracketPageIndex[key] || 0;
  if(page > totalPages - 1) page = totalPages - 1;
  if(page < 0) page = 0;
  bracketPageIndex[key] = page;

  const pageMatches = matches.slice(page * MATCHES_PAGE_SIZE, (page + 1) * MATCHES_PAGE_SIZE);
  const matchesHtml = pageMatches.map(m => bracketMatchHtml(m, cup)).join('');

  let pagerHtml = '';
  if(totalPages > 1){
    const from = page * MATCHES_PAGE_SIZE + 1;
    const to = Math.min((page + 1) * MATCHES_PAGE_SIZE, matches.length);
    pagerHtml = `
      <div class="matches-pager" data-pager-key="${key}">
        <button class="pager-btn pager-prev" ${page <= 0 ? 'disabled' : ''}>‹</button>
        <span class="pager-info">Пары ${from}–${to} из ${matches.length} · стр. ${page + 1}/${totalPages}</span>
        <button class="pager-btn pager-next" ${page >= totalPages - 1 ? 'disabled' : ''}>›</button>
      </div>`;
  }
  return `<div class="bracket-matches">${matchesHtml}</div>${pagerHtml}`;
}

function renderBracket(){
  const cup = state.cups[currentCupId];
  if(!cup) return;
  const t = tournamentById(currentCupId);

  const isGroupType = t.type === 'group';
  const teamCount = cup.teams.length;
  const roundTitles = isGroupType ? null : buildRoundTitles(teamCount);

  const actualRound = cupCurrentRound(cup);
  const rounds = [...new Set(cup.matches.map(m => m.round))].sort((a,b)=>a-b);
  if(!rounds.length) rounds.push(1);

  const totalStages = isGroupType
    ? cup.groupRoundsCount + t.koRounds.length
    : Math.round(Math.log2(teamCount));

  const titleFor = (round) => isGroupType
    ? euroRoundTitle(round, cup, t)
    : (roundTitles[round] || `РАУНД ${round}`);

  let html = '';

  if(isGroupType){
    // ЛИГА / ЧЕМПИОНАТЫ — по одному этапу + кнопки «назад / вперёд»
    const key = currentCupId + '#' + actualRound;
    if(bracketViewKey !== key){        // новый турнир или этап сменился — возвращаемся к актуальному
      bracketViewKey = key;
      bracketViewRound = actualRound;
    }
    if(!rounds.includes(bracketViewRound)) bracketViewRound = actualRound;

    const displayRound = bracketViewRound;
    const idx = rounds.indexOf(displayRound);
    const isGroupRound = displayRound <= cup.groupRoundsCount;
    const groupTableHtml = (cup.stage === 'groups' && isGroupRound) ? renderGroupTableHtml(cup) : '';
    const roundMatches = cup.matches.filter(m => m.round === displayRound);
    const pagerKey = currentCupId + '#g#' + displayRound;

    html = groupTableHtml + `
      <div class="bracket-round ${displayRound === actualRound ? 'current' : ''}">
        <div class="stage-nav">
          <button class="stage-nav-btn" id="btn-stage-prev" ${idx <= 0 ? 'disabled' : ''}>‹</button>
          <div class="stage-nav-info">
            <div class="bracket-stage-progress">Этап ${displayRound} из ${totalStages}${displayRound === actualRound ? ' · текущий' : ''}</div>
            <div class="bracket-round-title">${titleFor(displayRound)}</div>
          </div>
          <button class="stage-nav-btn" id="btn-stage-next" ${idx >= rounds.length - 1 ? 'disabled' : ''}>›</button>
        </div>
        ${displayRound !== actualRound ? '<button class="stage-nav-current" id="btn-stage-current">↺ К текущему этапу</button>' : ''}
        ${matchesPageHtml(pagerKey, roundMatches, cup)}
      </div>`;
  } else {
    // КУБКИ — сразу вся сетка, все этапы
    html = rounds.map(round => {
      const roundMatches = cup.matches.filter(m => m.round === round);
      const isCurrent = round === actualRound && !cup.finished;
      const pagerKey = currentCupId + '#k#' + round;
      return `
      <div class="bracket-round ${isCurrent ? 'current' : ''}">
        <div class="bracket-round-title">${titleFor(round)}</div>
        ${matchesPageHtml(pagerKey, roundMatches, cup)}
      </div>`;
    }).join('');
  }

  document.getElementById('bracket').innerHTML = html;

  document.querySelectorAll('.matches-pager').forEach(el => {
    const key = el.dataset.pagerKey;
    const prev = el.querySelector('.pager-prev');
    const next = el.querySelector('.pager-next');
    if(prev) prev.addEventListener('click', ()=>{
      bracketPageIndex[key] = (bracketPageIndex[key] || 0) - 1;
      renderBracket();
    });
    if(next) next.addEventListener('click', ()=>{
      bracketPageIndex[key] = (bracketPageIndex[key] || 0) + 1;
      renderBracket();
    });
  });

  const prevBtn = document.getElementById('btn-stage-prev');
  const nextBtn = document.getElementById('btn-stage-next');
  const curBtn  = document.getElementById('btn-stage-current');
  if(prevBtn) prevBtn.addEventListener('click', ()=>{
    const i = rounds.indexOf(bracketViewRound);
    if(i > 0){ bracketViewRound = rounds[i-1]; renderBracket(); }
  });
  if(nextBtn) nextBtn.addEventListener('click', ()=>{
    const i = rounds.indexOf(bracketViewRound);
    if(i >= 0 && i < rounds.length-1){ bracketViewRound = rounds[i+1]; renderBracket(); }
  });
  if(curBtn) curBtn.addEventListener('click', ()=>{
    bracketViewRound = actualRound; renderBracket();
  });

  document.querySelectorAll('.bm-team').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const teamId = el.dataset.teamid;
      if(!teamId) return;

      const cup = state.cups[currentCupId];
      if(!cup) return;

      const team = cup.teams.find(t => t.id === teamId);
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
  if(m.played && m.draw) cls += ' draw';

  const scoreHtml = m.played ? `${m.scoreA} : ${m.scoreB}` : '—:—';
  const winA = m.played && m.winner && teamA && m.winner.id === teamA.id;
  const winB = m.played && m.winner && teamB && m.winner.id === teamB.id;

  return `
    <div class="${cls}">
      <span class="bm-team ${winA?'win':''} ${isYouA?'you':''}" data-teamid="${teamA ? teamA.id : ''}" data-isplayer="${isYouA}">
        ${isYouA ? '<span class="bm-you-tag">ТЫ</span> ' : ''}
        ${nameA}
        <span class="bm-power">${teamA ? fmt(teamA.power) : ''}</span>
      </span>
      <span class="bm-score">${scoreHtml}</span>
      <span class="bm-team ${winB?'win':''} ${isYouB?'you':''}" data-teamid="${teamB ? teamB.id : ''}" data-isplayer="${isYouB}" style="text-align:right; justify-content:flex-end">
        <span class="bm-power">${teamB ? fmt(teamB.power) : ''}</span>
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
            ${fmt(team.power)}
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
  const isGroupStage = t.type === 'group' && cup.stage === 'groups';
  // during the group stage, "final" status is decided once every group match has
  // been played (handled by finishCup/advanceGroupStage), not per-match by round.
  const isFinal = !isGroupStage && match.round === Math.max(...cup.matches.map(m => m.round));

  const isDraw = !!match.draw;

  let rewardHtml = '';
  let xpEarned = 0;

  if(playerWon){
    const rewards = getMatchRewards(t, match, cup);
    const powerIncrease = rewards.power;
    const r = rewardRandomPlayer(powerIncrease);

    const stageCoins = rewards.coins;
    state.coins += stageCoins;

    xpEarned = rewards.xp;
    addXp(xpEarned);

    save();

    rewardHtml = `
      <div class="mm-reward">
        <div>Ваш игрок: <span class="mm-reward-player">${r.player.name}</span></div>
        <div class="mm-power-change">${fmt(r.before)} → <span class="mm-power-plus">${fmt(r.after)}</span></div>
        <div style="color:var(--gold); font-weight:800; display:flex; align-items:center; justify-content:center; gap:5px; flex-wrap:wrap;">
          <span><img src="${IMG.sila}" class="img-icon" alt="Сила"> +${powerIncrease} силы</span>
          <span><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${fmt(stageCoins)}</span>
          <span><img src="${IMG.xp}" class="img-icon" alt="Опыт"> +${fmt(xpEarned)} XP</span>
        </div>
      </div>`;
    refreshTopbar();
  }

  const loseMessage = isDraw ? `
    <div style="color:var(--gold); font-size:13px; font-weight:700; margin-top:10px;">
      🤝 Ничья — силы команд отличаются не больше чем на 1%. +1 очко в таблицу.
    </div>
  ` : (!playerWon && !isGroupStage) ? `
    <div style="color:var(--red); font-size:14px; font-weight:700; margin-top:10px;">
      ❌ Турнир завершён. Попробуйте снова!
    </div>
  ` : (!playerWon && isGroupStage ? `
    <div style="color:var(--text-dim); font-size:13px; margin-top:10px;">
      Матч не решает всё — впереди ещё игры группового этапа.
    </div>
  ` : '');

  const resultClass = isDraw ? 'draw' : (playerWon ? 'win' : 'lose');
  const resultText = isDraw ? 'НИЧЬЯ' : (playerWon ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ');
  const keepGoing = playerWon || isDraw || isGroupStage;

  document.getElementById('match-modal-body').innerHTML = `
    <div class="mm-teams"><span>${you.name}</span><span style="color:var(--text-mute)">vs</span><span>${opp.name}</span></div>
    <div class="mm-score">${yourScore} : ${oppScore}</div>
    <div class="mm-result ${resultClass}">${resultText}</div>
    ${rewardHtml}
    ${loseMessage}
    <button id="mm-continue-btn" class="btn-primary btn-big mm-continue">${keepGoing && !isFinal ? 'ПРОДОЛЖИТЬ' : 'ОК'}</button>
  `;
  document.getElementById('match-modal').classList.remove('hidden');
  document.getElementById('mm-continue-btn').addEventListener('click', ()=>{
    document.getElementById('match-modal').classList.add('hidden');
    if(!playerWon && !isDraw && !isGroupStage) {
      renderCupScreen();
    } else if(isFinal){
      finishCup();
    } else {
      onClose();
    }
  }, { once:true });
}

function showTrophyModal(t, coinReward, budgetReward){
  refreshTopbar();
  const trophySrc = TROPHY_IMG[t.id];
  const trophyHtml = trophySrc
    ? `<img src="${trophySrc}" class="cup-trophy-img" alt="${t.title}">`
    : `<div class="cup-trophy">${t.icon}</div>`;

  const budgetHtml = budgetReward
    ? `<div class="mm-coin-reward" style="margin-top:4px;"><img src="${IMG.cash}" class="img-icon" alt="Бюджет"> +${budgetReward.toLocaleString('ru-RU')}</div>`
    : '';

  document.getElementById('match-modal-body').innerHTML = `
    <div class="mm-trophy-box">
      ${trophyHtml}
      <div class="mm-result win">${t.title} ЗАВОЁВАН!</div>
      <div class="mm-coin-reward"><img src="${IMG.coin}" class="img-icon" alt="Монеты"> +${coinReward.toLocaleString('ru-RU')}</div>
      ${budgetHtml}
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
/* собственное окно подтверждения вместо системного confirm() */
function showConfirm(text, onYes, opts){
  const o = opts || {};
  const old = document.getElementById('confirm-overlay');
  if(old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'confirm-overlay';
  overlay.className = 'modal-overlay confirm-overlay';
  overlay.innerHTML = `
    <div class="modal-card confirm-card">
      <div class="confirm-icon">${o.icon || '⚠️'}</div>
      <div class="confirm-title">${o.title || 'Подтвердите действие'}</div>
      <div class="confirm-text">${text}</div>
      <div class="confirm-actions">
        <button class="confirm-btn confirm-no">${o.noText || 'Отмена'}</button>
        <button class="confirm-btn confirm-yes ${o.danger === false ? '' : 'danger'}">${o.yesText || 'Да'}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const close = ()=> overlay.remove();
  overlay.querySelector('.confirm-no').addEventListener('click', close);
  overlay.querySelector('.confirm-yes').addEventListener('click', ()=>{
    close();
    if(typeof onYes === 'function') onYes();
  });
  overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
}

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