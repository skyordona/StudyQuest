/* ===================== APP STATE ===================== */
let state = loadGame() || {
  name:'Dex', level:1, xp:0, xpNeeded:100, coins:0, gems:0, selectedChar:'warrior',
  stats:{answered:0,correct:0,battlesWon:0,battlesLost:0,cardsReviewed:0,decksCreated:0},
  achievements:{firstVictory:false,q100:false,perfectQuiz:false,studyStreak:false}
};

/* ===================== DATA ===================== */
const DECKS = [
  {id:'bio',name:'Biology Basics',color:'#2d7a3e',banner:'assets/images/banners/mage_banner.png',icon:'fa-dna',desc:'Core biology terms',cards:[
    {q:'What is a cell?',a:'The basic structural and functional unit of life.'},
    {q:'What is DNA?',a:'The molecule that carries genetic instructions.'},
    {q:'What is photosynthesis?',a:'The process plants use to convert light into energy.'}]},
  {id:'net',name:'Networking Fundamentals',color:'#2d5aa5',banner:'assets/images/banners/wizard_banner.png',icon:'fa-network-wired',desc:'Networking terms',cards:[
    {q:'What is an IP address?',a:'A unique numerical label assigned to a device on a network.'},
    {q:'What is a router?',a:'A device that forwards data packets between networks.'}]},
  {id:'sec',name:'Cybersecurity Terms',color:'#a52d3d',banner:'assets/images/banners/warrior_banner.png',icon:'fa-shield-halved',desc:'Security vocabulary',cards:[
    {q:'What is phishing?',a:'A social engineering attack that tricks users into revealing data.'},
    {q:'What is a firewall?',a:'A system that monitors and controls network traffic.'}]},
  {id:'prog',name:'Programming Concepts',color:'#6b3fa0',banner:'assets/images/banners/archer_banner.png',icon:'fa-code',desc:'Core programming ideas',cards:[
    {q:'What is HTML?',a:'The standard markup language used to create web pages.'},
    {q:'What is a variable?',a:'A named storage location for a value.'}]}
];
const QUIZ_QS = [
  {q:'What is the capital of France?',c:['London','Berlin','Paris','Madrid'],a:2},
  {q:'What does HTML stand for?',c:['Hyper Trainer Markup','HyperText Markup Language','High Text Machine Language','Hyperlink Markup Tool'],a:1},
  {q:'What is 7 x 8?',c:['54','56','58','64'],a:1},
  {q:'Which planet is known as the Red Planet?',c:['Venus','Mars','Jupiter','Saturn'],a:1},
  {q:'What is the chemical symbol for water?',c:['H2O','CO2','O2','NaCl'],a:0}
];
const CHARACTERS = [
  {id:'warrior',name:'Warrior',img:'assets/images/characters/warrior.png',card:'assets/images/characters/warrior_card.png',lv:1},
  {id:'mage',name:'Mage',img:'assets/images/characters/mage.png',card:'assets/images/characters/mage_card.png',lv:1},
  {id:'archer',name:'Archer',img:'assets/images/characters/archer.png',card:'assets/images/characters/archer_card.png',lv:1},
  {id:'wizard',name:'Wizard',img:'assets/images/characters/wizard.png',card:'assets/images/characters/wizard_card.png',lv:1}
];
const ROOMS = [
  {name:'Biology Battle',players:3,max:4},
  {name:'Networking Challenge',players:2,max:4},
  {name:'Programming Arena',players:4,max:4}
];

/* ===================== STORAGE ===================== */
function saveGame(){ try{ localStorage.setItem('studyquest_save', JSON.stringify(state)); }catch(e){ console.error(e); } }
function loadGame(){ try{ const d=localStorage.getItem('studyquest_save'); return d?JSON.parse(d):null; }catch(e){ return null; } }
function resetGame(){ if(confirm('Reset all progress?')){ localStorage.removeItem('studyquest_save'); location.reload(); } }

/* ===================== NAVIGATION ===================== */
function go(s){
  document.querySelectorAll('.screen').forEach(e=>e.classList.remove('active'));
  document.getElementById('screen-'+s).classList.add('active');
  document.querySelectorAll('.navitem').forEach(e=>e.classList.toggle('active', e.dataset.s===s));
  if(s==='home') renderHome();
  if(s==='flashcards') renderDecks();
  if(s==='quiz') startQuiz();
  if(s==='battle') renderCharSelect();
  if(s==='rooms') renderRooms();
  if(s==='profile') renderProfile();
}

/* ===================== GAMIFICATION ===================== */
function addXp(n){
  state.xp += n;
  while(state.xp >= state.xpNeeded){
    state.xp -= state.xpNeeded;
    state.level++;
    state.xpNeeded = Math.round(state.xpNeeded * 1.25);
    showLevelUp();
  }
  saveGame();
}
function addCoins(n){ state.coins += n; saveGame(); }
function showLevelUp(){
  const o=document.createElement('div'); o.className='level-up-overlay';
  o.innerHTML = `<div class="level-up-card"><h2>LEVEL UP!</h2><p style="margin-top:8px">You reached Level ${state.level}</p></div>`;
  document.body.appendChild(o);
  setTimeout(()=>o.remove(), 1600);
}

/* ===================== HOME ===================== */
function renderHome(){
  document.getElementById('homeName').textContent = state.name;
  document.getElementById('homeLevel').textContent = state.level;
  document.getElementById('homeXpBar').style.width = (state.xp/state.xpNeeded*100)+'%';
  document.getElementById('homeXpText').textContent = `${state.xp} / ${state.xpNeeded} XP`;
}

/* ===================== FLASHCARDS ===================== */
function renderDecks(filter=''){
  const list = document.getElementById('deckList'); list.innerHTML='';
  DECKS.filter(d=>d.name.toLowerCase().includes(filter.toLowerCase())).forEach(d=>{
    const el = document.createElement('div'); el.className='deck'; el.onclick=()=>openReview(d.id);
    el.innerHTML = `<img class="deck-banner" src="${d.banner}" alt="">
      <div class="deck-info"><div>${d.name}</div><small>${d.desc} &middot; ${d.cards.length} cards</small></div>
      <img class="icon-img sm" src="assets/images/icons/star.png" alt="Favorite">`;
    list.appendChild(el);
  });
}
function filterDecks(v){ renderDecks(v); }

let reviewState = null;
function openReview(deckId){
  const deck = DECKS.find(d=>d.id===deckId);
  reviewState = {deck, idx:0};
  document.getElementById('reviewDeckName').textContent = deck.name;
  go('review'); renderReviewCard();
}
function renderReviewCard(){
  const {deck, idx} = reviewState;
  const card = deck.cards[idx % deck.cards.length];
  document.getElementById('reviewText').textContent = card.q;
  document.getElementById('reviewProgress').textContent = `Card ${idx+1} / ${deck.cards.length}`;
  document.getElementById('reviewBar').style.width = (idx/deck.cards.length*100)+'%';
  document.getElementById('reviewControls').classList.remove('hidden');
  document.getElementById('reviewRatings').classList.add('hidden');
}
function showAnswer(){
  const {deck, idx} = reviewState;
  const card = deck.cards[idx % deck.cards.length];
  document.getElementById('reviewText').textContent = card.a;
  document.getElementById('reviewControls').classList.add('hidden');
  document.getElementById('reviewRatings').classList.remove('hidden');
}
function rateCard(rating){
  state.stats.cardsReviewed++;
  const xpMap = {dontknow:2, hard:4, good:8, easy:10};
  addXp(xpMap[rating]||5);
  reviewState.idx++;
  if(reviewState.idx >= reviewState.deck.cards.length){
    document.getElementById('reviewText').textContent = 'Deck complete!';
    document.getElementById('reviewProgress').textContent = '';
    document.getElementById('reviewBar').style.width='100%';
    document.getElementById('reviewRatings').classList.add('hidden');
    document.getElementById('reviewControls').innerHTML = `<button class="btn btn-gold btn-block" onclick="go('flashcards')">DONE</button>`;
  } else {
    renderReviewCard();
  }
}

/* ===================== QUIZ ===================== */
let quizState = null;
function startQuiz(){
  quizState = {qs: shuffle([...QUIZ_QS]).slice(0,5), idx:0, hp:100, xp:0, correctCount:0};
  renderQuizQuestion();
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function renderQuizQuestion(){
  const {qs, idx} = quizState;
  document.getElementById('quizResult').classList.add('hidden');
  if(idx >= qs.length){
    document.getElementById('quizQuestion').textContent = 'Quiz Complete!';
    document.getElementById('quizChoices').innerHTML = `<button class="btn btn-gold btn-block" onclick="go('home')">BACK HOME</button>`;
    document.getElementById('quizProgress').textContent='';
    if(quizState.correctCount === qs.length) state.achievements.perfectQuiz = true;
    saveGame();
    return;
  }
  const q = qs[idx];
  document.getElementById('quizProgress').textContent = `Question ${idx+1}/${qs.length}`;
  document.getElementById('quizQuestion').textContent = q.q;
  document.getElementById('quizHp').textContent = quizState.hp;
  document.getElementById('quizXpTotal').textContent = quizState.xp;
  const cc = document.getElementById('quizChoices'); cc.innerHTML='';
  q.c.forEach((choice,i)=>{
    const b=document.createElement('button'); b.className='choice'; b.textContent=choice;
    b.onclick=()=>answerQuiz(i);
    cc.appendChild(b);
  });
}
function answerQuiz(i){
  const {qs, idx} = quizState; const q = qs[idx];
  const buttons = document.querySelectorAll('#quizChoices .choice');
  buttons.forEach(b=>b.disabled=true);
  state.stats.answered++;
  const result = document.getElementById('quizResult'); result.classList.remove('hidden');
  if(i===q.a){
    buttons[i].classList.add('correct');
    quizState.xp += 10; addXp(10); addCoins(5); quizState.correctCount++;
    state.stats.correct++;
    result.innerHTML = `<strong style="color:#6fe08a">CORRECT!</strong><div class="reward-line">+10 XP &nbsp; +5 <img class="icon-img sm" src="assets/images/icons/coin.png" alt="Coins"></div>`;
  } else {
    buttons[i].classList.add('wrong'); buttons[q.a].classList.add('correct');
    quizState.hp -= 15;
    result.innerHTML = `<strong style="color:#e86a6a">WRONG!</strong><div>Correct answer: ${q.c[q.a]}</div>`;
  }
  saveGame();
  setTimeout(()=>{ quizState.idx++; renderQuizQuestion(); }, 1200);
}

/* ===================== BATTLE ===================== */
function renderCharSelect(){
  const grid = document.getElementById('charGrid'); grid.innerHTML='';
  document.getElementById('battleSelect').classList.remove('hidden');
  document.getElementById('battleArena').classList.add('hidden');
  CHARACTERS.forEach(c=>{
    const sel = state.selectedChar===c.id;
    const el = document.createElement('div'); el.className='panel char-select-card'+(sel?' selected':'');
    el.onclick=()=>{ state.selectedChar=c.id; saveGame(); renderCharSelect(); };
    el.innerHTML = `<img class="char-card-art" src="${c.card}" alt="${c.name}">
      <div>${c.name}</div><small>Lv. ${c.lv}</small>${sel?'<div class="gold-text">Selected</div>':''}`;
    grid.appendChild(el);
  });
}
let battleState = null;
function startBattle(){
  document.getElementById('battleSelect').classList.add('hidden');
  document.getElementById('battleArena').classList.remove('hidden');
  const char = CHARACTERS.find(c=>c.id===state.selectedChar);
  document.getElementById('battlePlayerChar').src = char.img;
  document.getElementById('battlePlayerChar').alt = char.name;
  battleState = {playerHp:100, enemyHp:100, qs:shuffle([...QUIZ_QS]), idx:0};
  renderBattleQuestion();
}
function renderBattleQuestion(){
  document.getElementById('battleResult').classList.add('hidden');
  document.getElementById('playerHpBar').style.width = battleState.playerHp+'%';
  document.getElementById('enemyHpBar').style.width = battleState.enemyHp+'%';
  if(battleState.playerHp<=0 || battleState.enemyHp<=0){
    const won = battleState.enemyHp<=0;
    document.getElementById('battleQuestion').textContent = won ? 'VICTORY!' : 'DEFEATED';
    document.getElementById('battleChoices').innerHTML = won
      ? `<div style="text-align:center;margin-bottom:10px">+100 XP &nbsp; +25 <img class="icon-img sm" src="assets/images/icons/coin.png" alt="Coins"></div><button class="btn btn-gold btn-block" onclick="go('home')">CONTINUE</button>`
      : `<button class="btn btn-red btn-block" onclick="startBattle()">TRY AGAIN</button>`;
    if(won){ addXp(100); addCoins(25); state.stats.battlesWon++; state.achievements.firstVictory = true; }
    else { state.stats.battlesLost++; }
    saveGame();
    return;
  }
  const q = battleState.qs[battleState.idx % battleState.qs.length];
  document.getElementById('battleQuestion').textContent = q.q;
  const cc = document.getElementById('battleChoices'); cc.innerHTML='';
  q.c.forEach((choice,i)=>{
    const b=document.createElement('button'); b.className='choice'; b.textContent=choice;
    b.onclick=()=>answerBattle(i,q.a);
    cc.appendChild(b);
  });
}
function answerBattle(i,correctIdx){
  document.querySelectorAll('#battleChoices .choice').forEach(b=>b.disabled=true);
  const result = document.getElementById('battleResult'); result.classList.remove('hidden');
  if(i===correctIdx){
    battleState.enemyHp = Math.max(0, battleState.enemyHp-20);
    result.innerHTML = `<strong style="color:#6fe08a">PLAYER ATTACKS!</strong> Enemy loses 20 HP`;
  } else {
    battleState.playerHp = Math.max(0, battleState.playerHp-15);
    result.innerHTML = `<strong style="color:#e86a6a">ENEMY ATTACKS!</strong> You lose 15 HP`;
  }
  battleState.idx++;
  setTimeout(renderBattleQuestion, 1100);
}

/* ===================== ROOMS ===================== */
function renderRooms(){
  const list = document.getElementById('roomList'); list.innerHTML='';
  ROOMS.forEach(r=>{
    const full = r.players>=r.max;
    const el=document.createElement('div'); el.className='room';
    el.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><img class="icon-img" src="assets/images/icons/door.png" alt=""> <div>${r.name}<div class="muted small">${r.players}/${r.max} players</div></div></div>
      <button class="btn ${full?'btn-red':'btn-blue'}" ${full?'disabled':''} onclick="joinRoom('${r.name}')">${full?'FULL':'JOIN'}</button>`;
    list.appendChild(el);
  });
}
function createRoom(){ alert('Demo room created! (local only — no backend)'); state.stats.decksCreated++; saveGame(); }
function joinRoom(name){ alert('Joining "'+name+'" — demo lobby (local only)'); }

/* ===================== PROFILE ===================== */
function renderProfile(){
  document.getElementById('profName').textContent = state.name;
  document.getElementById('profLevel').textContent = state.level;
  document.getElementById('profXpBar').style.width = (state.xp/state.xpNeeded*100)+'%';
  document.getElementById('profCoins').textContent = state.coins;
  document.getElementById('profGems').textContent = state.gems;
  const s = state.stats;
  const acc = s.answered ? Math.round(s.correct/s.answered*100) : 0;
  document.getElementById('statsPanel').innerHTML = `
    <div class="row-between"><span>Questions Answered</span><strong>${s.answered}</strong></div>
    <div class="row-between"><span>Correct Answers</span><strong>${s.correct}</strong></div>
    <div class="row-between"><span>Accuracy</span><strong>${acc}%</strong></div>
    <div class="row-between"><span>Battles Won</span><strong>${s.battlesWon}</strong></div>
    <div class="row-between"><span>Battles Lost</span><strong>${s.battlesLost}</strong></div>
    <div class="row-between"><span>Cards Reviewed</span><strong>${s.cardsReviewed}</strong></div>
    <div class="row-between"><span>Decks Created</span><strong>${s.decksCreated}</strong></div>`;
  const ach = state.achievements;
  const items = [
    ['First Victory', ach.firstVictory, 'fa-trophy'],
    ['100 Questions', ach.q100 || s.answered>=100, 'fa-list-check'],
    ['Perfect Quiz', ach.perfectQuiz, 'fa-star'],
    ['Study Streak', ach.studyStreak, 'fa-fire']
  ];
  document.getElementById('achList').innerHTML = items.map(([n,on,ic])=>
    `<div class="row-between" style="padding:4px 0;opacity:${on?1:0.4}"><span><i class="fa-solid ${ic} gold-text"></i> ${n}</span>${on?'<i class="fa-solid fa-check" style="color:#6fe08a"></i>':''}</div>`
  ).join('');
}

/* ===================== SETTINGS ===================== */
function openSettings(){
  if(confirm('Reset Progress? This cannot be undone.')) resetGame();
}

/* ===================== INIT ===================== */
renderHome();
