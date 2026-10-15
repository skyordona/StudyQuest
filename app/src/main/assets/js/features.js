/* ===================== FEATURES: guest login, settings, profile, uploads, lobby ===================== */
const AV_DEFAULT='assets/images/avatars/avatar-default.png';
if(!state.avatar) state.avatar=AV_DEFAULT;
if(!state.uploads) state.uploads=[];
for(const k of ['friends','requests','sent']) if(!state[k]) state[k]=[];
for(const k of ['chats','unread','outbox']) if(!state[k]) state[k]={};
if(state.mpDecks===undefined) state.mpDecks=null;
if(!state.firstSide) state.firstSide='term';
if(!state.battleSource) state.battleSource='uploads';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function genGuest(){const L='ABCDEFGHIJKLMNOPQRSTUVWXYZ',r=n=>Math.floor(Math.random()*n);return 'GUEST'+(10+r(90))+L[r(26)]+L[r(26)];}
function openModal(html,locked){closeModal();const o=document.createElement('div');o.className='modal-overlay';o.id='modal';o.innerHTML='<div class="modal-card">'+html+'</div>';if(!locked)o.addEventListener('click',e=>{if(e.target===o)closeModal();});document.body.appendChild(o);}
function closeModal(){const m=document.getElementById('modal');if(m)m.remove();}
function applyAvatar(){document.querySelectorAll('img.avatar').forEach(i=>{if(!i.closest('#screen-lobby')&&!i.closest('#screen-mp')&&!i.closest('#modal'))i.src=state.avatar;});}
const _go=window.go;
window.go=function(s){if(s!=='lobby'&&s!=='mp')leaveRoom();_go(s);applyAvatar();afterGo(s);};

/* ---- Guest login ---- */
function showLogin(){
  const name=state.guestSaved?state.name:genGuest();
  openModal(`<h2 class="gold-text" style="text-align:center">Welcome, Adventurer!</h2>
  <p class="muted" style="text-align:center;margin:6px 0 12px">Jump in instantly with a guest account.</p>
  <div class="guest-name" id="guestName">${esc(name)}</div>
  <button class="btn btn-blue btn-block" onclick="document.getElementById('guestName').textContent=genGuest()">🎲 Random name</button>
  <button class="btn btn-gold btn-block" style="margin-top:8px" onclick="loginGuest()">PLAY AS GUEST</button>`,true);
}
function loginGuest(){state.name=document.getElementById('guestName').textContent;state.guestSaved=true;if(!state.username)state.username=cleanUser(state.name)||('GUEST'+Math.floor(10+Math.random()*90)+'XX');saveGame();closeModal();go('home');startFriends();}

/* ---- Settings ---- */
function openSettings(){
  openModal(`<h2 class="gold-text">Settings</h2>
  <label class="fld">Display name<input id="setName" maxlength="14" value="${esc(state.name)}"></label>
  <div class="fld">Show first on flashcards<div class="tabs" id="sideTabs" style="margin:6px 0 0"><div class="tab${state.firstSide==='term'?' active':''}" data-v="term" onclick="setFirstSide('term')">Term</div><div class="tab${state.firstSide==='def'?' active':''}" data-v="def" onclick="setFirstSide('def')">Definition</div></div></div>
  <button class="btn btn-green btn-block" onclick="saveSettings()">Save</button>
  <button class="btn btn-blue btn-block" style="margin-top:8px" onclick="showLogin()">Switch guest name</button>
  <button class="btn btn-red btn-block" style="margin-top:8px" onclick="closeModal();resetGame()">Reset progress</button>
  <button class="btn btn-block btn-light" style="margin-top:8px" onclick="closeModal()">Close</button>`);
}
function setFirstSide(v){state.firstSide=v;saveGame();document.querySelectorAll('#sideTabs .tab').forEach(t=>t.classList.toggle('active',t.dataset.v===v));}
function saveSettings(){state.name=document.getElementById('setName').value.trim()||state.name;saveGame();closeModal();renderHome();renderProfile();}

/* ---- Profile edit ---- */
let tmpAv=null,avList=[];
function openEditProfile(){
  tmpAv=state.avatar;
  openModal(`<h2 class="gold-text">Edit Profile</h2>
  <label class="fld">Name<input id="epName" maxlength="14" value="${esc(state.name)}"></label>
  <div class="muted small" style="margin:8px 0 6px">Avatar</div><div class="av-grid" id="avGrid"></div>
  <label class="btn btn-purple btn-block" style="margin-top:10px;display:block;box-sizing:border-box;text-align:center">📷 Upload photo<input type="file" accept="image/*" hidden onchange="pickAvatarFile(this)"></label>
  <button class="btn btn-green btn-block" style="margin-top:8px" onclick="saveProfile()">Save</button>
  <button class="btn btn-block btn-light" style="margin-top:8px" onclick="closeModal()">Cancel</button>`);
  renderAvGrid();
}
function renderAvGrid(){
  avList=[AV_DEFAULT,...CHARACTERS.map(c=>c.img)];
  if(!avList.includes(tmpAv)) avList.push(tmpAv);
  document.getElementById('avGrid').innerHTML=avList.map((s,i)=>`<img class="avatar av-opt${s===tmpAv?' sel':''}" src="${s}" alt="" onclick="tmpAv=avList[${i}];renderAvGrid()">`).join('');
}
function pickAvatarFile(inp){
  const f=inp.files[0]; if(!f) return; const r=new FileReader();
  r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=128;const s=Math.min(im.width,im.height);c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,128,128);tmpAv=c.toDataURL('image/jpeg',.8);renderAvGrid();};im.src=r.result;};
  r.readAsDataURL(f);
}
function saveProfile(){state.name=document.getElementById('epName').value.trim()||state.name;state.avatar=tmpAv;saveGame();closeModal();renderProfile();renderHome();applyAvatar();}

/* ---- Upload study material ---- */
function parseCards(text,fname){
  text=text.replace(/\r/g,'').trim(); const out=[];
  if(/\.json$/i.test(fname)||/^[\[{]/.test(text)){try{let j=JSON.parse(text);if(!Array.isArray(j))j=j.cards||[];j.forEach(c=>{const q=c.q||c.question||c.front,a=c.a||c.answer||c.back;if(q&&a)out.push({q:String(q),a:String(a)});});if(out.length)return out;}catch(e){}}
  const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);
  const isQ=l=>/^Q[:.)]/i.test(l),isA=l=>/^A[:.)]/i.test(l);
  if(lines.some(isQ)&&lines.filter(isQ).length===lines.filter(isA).length){
    for(let i=0;i<lines.length-1;i++) if(isQ(lines[i])&&isA(lines[i+1])) out.push({q:lines[i].replace(/^Q[:.)]\s*/i,''),a:lines[i+1].replace(/^A[:.)]\s*/i,'')});
    if(out.length) return out;
  }
  const seps=['\t','|','::',';',',',' - ',':'];
  lines.forEach(l=>{
    l=l.replace(/^(\d+[.)]|[-*•])\s+/,'');
    const qa=l.match(/^Q[:.)]\s*(.+?)\s+A[:.)]\s*(.+)$/i); if(qa){out.push({q:qa[1],a:qa[2]});return;}
    for(const s of seps){const k=l.indexOf(s);if(k>0&&k<l.length-s.length){out.push({q:l.slice(0,k).trim().replace(/^"|"$/g,''),a:l.slice(k+s.length).trim().replace(/^"|"$/g,'')});return;}}
  });
  if(!out.length&&lines.length>=2&&lines.length%2===0) for(let i=0;i<lines.length;i+=2) out.push({q:lines[i],a:lines[i+1]});
  return out.filter(c=>c.q&&c.a);
}
function openUpload(){
  openModal(`<h2 class="gold-text">Upload study material</h2>
  <p class="muted small" style="margin:6px 0">Files: .txt .csv .md .json. One card per line, like <em>question | answer</em> (comma, tab, "term: definition" or Q:/A: pairs also work).</p>
  <input type="file" id="upFile" accept=".txt,.csv,.tsv,.md,.json" multiple>
  <label class="fld">...or paste text<textarea id="upText" rows="5" placeholder="What is RAM? | Temporary working memory"></textarea></label>
  <label class="fld">Deck name<input id="upName" maxlength="30" placeholder="My deck"></label>
  <div id="upMsg" class="small" style="margin:6px 0;color:#e86a6a"></div>
  <button class="btn btn-green btn-block" onclick="doUpload()">Add deck</button>
  <button class="btn btn-block btn-light" style="margin-top:8px" onclick="closeModal()">Cancel</button>`);
}
async function doUpload(){
  const nm=document.getElementById('upName').value.trim(),txt=document.getElementById('upText').value,srcs=[];
  for(const f of document.getElementById('upFile').files) srcs.push({name:f.name.replace(/\.[^.]+$/,''),text:await f.text(),f:f.name});
  if(txt.trim()) srcs.push({name:nm||'Pasted notes',text:txt,f:''});
  let added=0;
  srcs.forEach(s=>{const cards=parseCards(s.text,s.f);if(cards.length){state.uploads.push({id:'up'+Date.now()+added,name:(srcs.length===1&&nm)||s.name,cards});added++;}});
  if(!added){document.getElementById('upMsg').textContent='No cards found. Use one "question | answer" per line.';return;}
  state.stats.decksCreated+=added;saveGame();closeModal();deckTab='uploaded';go('flashcards');
}
function delUpload(id){if(confirm('Delete this uploaded deck?')){state.uploads=state.uploads.filter(u=>u.id!==id);saveGame();renderDecks();}}

/* ---- Decks (built-in + uploaded) ---- */
let deckTab='all',deckFilter='';
const BANNERS=DECKS.map(d=>d.banner);
function allDecks(){return DECKS.map(d=>({...d,kind:'builtin'})).concat(state.uploads.map((u,i)=>({id:u.id,name:u.name,banner:BANNERS[i%BANNERS.length],desc:'Uploaded',cards:u.cards.filter(c=>c.q.trim()&&c.a.trim()),kind:'uploaded'})));}
function setTab(t){deckTab=t;renderDecks();}
function renderDecks(filter){
  if(filter!==undefined) deckFilter=filter;
  document.querySelectorAll('#screen-flashcards .tab').forEach(t=>t.classList.toggle('active',t.dataset.t===deckTab));
  const list=document.getElementById('deckList');list.innerHTML='';
  const ds=allDecks().filter(d=>(deckTab==='all'||d.kind===deckTab)&&d.name.toLowerCase().includes(deckFilter.toLowerCase()));
  if(!ds.length) list.innerHTML='<div class="panel muted">No decks here yet. Tap the upload icon (top right) to add your own study files.</div>';
  ds.forEach(d=>{
    const el=document.createElement('div');el.className='deck';el.onclick=()=>openReview(d.id);
    el.innerHTML=`<img class="deck-banner" src="${d.banner}" alt=""><div class="deck-info"><div>${esc(d.name)}</div><small>${esc(d.desc)} &middot; ${d.cards.length} cards</small></div>`+
      (d.kind==='uploaded'?`<button class="btn btn-blue" style="padding:2px 9px" onclick="event.stopPropagation();openEditor('${d.id}')">✎</button> <button class="btn btn-red" style="padding:2px 9px" onclick="event.stopPropagation();delUpload('${d.id}')">✕</button>`:`<img class="icon-img sm" src="assets/images/icons/star.png" alt="">`);
    list.appendChild(el);
  });
}

/* ---- Battle: randomized questions from uploads ---- */
function makeMC(cards){
  cards=cards.filter(c=>c.q&&c.a); const own=[...new Set(cards.map(c=>c.a))],bi=[...new Set(allDecks().flatMap(d=>d.cards.map(c=>c.a)))];
  return shuffle(cards.map(c=>{
    const d=[...shuffle(own.filter(x=>x!==c.a)),...shuffle(bi.filter(x=>x!==c.a&&!own.includes(x)))].slice(0,3);
    const ch=shuffle([c.a,...d]);return {q:c.q,c:ch,a:ch.indexOf(c.a)};
  }));
}
function buildUploadQs(){return makeMC(state.uploads.flatMap(u=>u.cards));}
function builtinQs(){return shuffle([...QUIZ_QS,...makeMC(DECKS.flatMap(d=>d.cards))]);}
function battleQs(){const up=buildUploadQs(),src=state.uploads.length?state.battleSource:'default';
  if(src==='uploads') return up; if(src==='mixed') return shuffle([...up,...builtinQs()]); return builtinQs();}
function renderSource(){
  let el=document.getElementById('battleSource');
  if(!el){el=document.createElement('div');el.id='battleSource';el.className='panel';const b=document.getElementById('battleSelect');b.insertBefore(el,b.querySelector('button'));}
  if(!state.uploads.length){el.innerHTML='<small class="muted">Questions: built-in quiz. Upload study files in Flashcards to battle with your own questions.</small>';return;}
  const n=state.uploads.reduce((a,u)=>a+u.cards.length,0);
  el.innerHTML=`<strong class="gold-text">Question source</strong><div class="tabs" style="margin-bottom:4px">${[['uploads','My uploads'],['mixed','Mixed'],['default','Built-in']].map(([k,l])=>`<div class="tab${state.battleSource===k?' active':''}" onclick="state.battleSource='${k}';saveGame();renderSource()">${l}</div>`).join('')}</div><small class="muted">${n} uploaded cards, shuffled every battle</small>`;
}
const _rcs=window.renderCharSelect;
window.renderCharSelect=function(){_rcs();renderSource();};
function startBattle(){
  document.getElementById('battleSelect').classList.add('hidden');
  document.getElementById('battleArena').classList.remove('hidden');
  const char=CHARACTERS.find(c=>c.id===state.selectedChar);
  document.getElementById('battlePlayerChar').src=char.img;
  document.getElementById('battlePlayerChar').alt=char.name;
  battleState={playerHp:100,enemyHp:100,qs:battleQs(),idx:0};
  renderBattleQuestion();
}
function answerBattle(i,correctIdx){
  document.querySelectorAll('#battleChoices .choice').forEach(b=>b.disabled=true);
  const dmg=15;
  const result=document.getElementById('battleResult');result.classList.remove('hidden');
  if(i===correctIdx){battleState.enemyHp=Math.max(0,battleState.enemyHp-20);result.innerHTML='<strong style="color:#6fe08a">PLAYER ATTACKS!</strong> Enemy loses 20 HP';}
  else{battleState.playerHp=Math.max(0,battleState.playerHp-dmg);result.innerHTML=`<strong style="color:#e86a6a">ENEMY ATTACKS!</strong> You lose ${dmg} HP`;}
  battleState.idx++;setTimeout(renderBattleQuestion,1100);
}

/* ---- Real multiplayer rooms (peer-to-peer via PeerJS) ---- */
let mp=null;
if(!state.mpCount) state.mpCount=10;
function loadPeer(){return new Promise((res,rej)=>{if(window.Peer)return res();const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';s.onload=res;s.onerror=()=>rej(new Error('offline'));document.head.appendChild(s);});}
const avTok=src=>{if(src===AV_DEFAULT)return 'd';const i=CHARACTERS.findIndex(c=>c.img===src);return i>=0?'c'+i:src;};
function cleanAv(t){t=String(t||'');if(t==='d')return 'd';if(/^c\d$/.test(t)&&+t[1]<CHARACTERS.length)return t;if(t.length<60000&&/^data:image\/(jpeg|png);base64,[A-Za-z0-9+\/=]+$/.test(t))return t;return 'd';}
const avSrc=t=>{t=cleanAv(t);return t==='d'?AV_DEFAULT:/^c\d$/.test(t)?CHARACTERS[+t[1]].img:t;};
const cleanName=s=>String(s||'Player').replace(/[<>]/g,'').trim().slice(0,14)||'Player';
const num=v=>Math.max(0,Math.min(999999,+v||0));
const cleanProg=p=>({n:num(p&&p.n),c:num(p&&p.c),w:num(p&&p.w),hp:num(p&&p.hp),done:!!(p&&p.done),ko:!!(p&&p.ko),t:num(p&&p.t),left:!!(p&&p.left)});
function note(msg){openModal(`<p style="margin-bottom:12px">${esc(msg)}</p><button class="btn btn-block btn-light" onclick="closeModal()">OK</button>`);}
function leaveRoom(){if(!mp)return;const m=mp;mp=null;try{m.peer&&m.peer.destroy();}catch(e){}}
function hostBroadcast(msg){Object.values(mp.conns).forEach(c=>{try{if(c.open)c.send(msg);}catch(e){}});}
const randCode=()=>Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');

/* rooms screen */
function renderRooms(){
  document.getElementById('roomList').innerHTML=`<div class="panel"><strong>Join a friend's room</strong><div class="muted small" style="margin:4px 0 8px">Type the room code shown in your host's lobby.</div>
  <input id="joinCode" maxlength="8" placeholder="ROOM CODE" style="display:block;width:100%;box-sizing:border-box;padding:10px;border-radius:6px;border:1px solid var(--bronze);background:#0d1424;color:var(--text);font:inherit;font-size:20px;letter-spacing:4px;text-align:center;text-transform:uppercase">
  <button class="btn btn-blue btn-block" style="margin-top:8px" onclick="joinRoomCode()">JOIN ROOM</button></div>
  <div class="panel muted small">Everyone needs an internet connection. The host creates a room and shares the code; the host must keep the app open until the game ends.</div>`;
}
function createRoom(){
  openModal(`<h2 class="gold-text">Create Room</h2>
  <label class="fld">Room name<input id="rmName" maxlength="24" value="${esc(state.name)}'s Room"></label>
  <label class="fld">Max players<select id="rmMax">${[2,3,4,5,6,8].map(n=>`<option${n===4?' selected':''}>${n}</option>`).join('')}</select></label>
  <button class="btn btn-green btn-block" onclick="doCreateRoom()">Create</button>
  <button class="btn btn-block btn-light" style="margin-top:8px" onclick="closeModal()">Cancel</button>`);
}
async function doCreateRoom(){
  const name=document.getElementById('rmName').value.trim()||'My Room',max=+document.getElementById('rmMax').value;
  leaveRoom();openModal('<p style="text-align:center">Creating room...</p>',true);
  try{await loadPeer();}catch(e){closeModal();note('Could not load the multiplayer library. Check your internet connection.');return;}
  startHost(name,max,0);
}
function startHost(name,max,attempt){
  const code=randCode(),peer=new Peer('sqroom-'+code);
  peer.on('open',()=>{
    closeModal();
    mp={role:'host',peer,code,name,max,phase:'lobby',meId:'host',conns:{},chat:[],players:[{id:'host',name:cleanName(state.name),av:avTok(state.avatar),ready:true}]};
    peer.on('connection',hostConn);go('lobby');renderLobby();
  });
  peer.on('error',e=>{
    if(e.type==='unavailable-id'&&attempt<3&&!mp){try{peer.destroy();}catch(x){}startHost(name,max,attempt+1);return;}
    if(!mp){closeModal();try{peer.destroy();}catch(x){}note('Could not create the room ('+e.type+'). Check your internet connection.');}
  });
}
function hostConn(conn){
  conn.on('data',m=>hostMsg(conn,m));
  conn.on('close',()=>hostDrop(conn.peer));
  conn.on('error',()=>hostDrop(conn.peer));
}
function hostMsg(conn,m){
  if(!mp||mp.role!=='host'||!m||typeof m!=='object')return;
  const id=conn.peer,p=mp.players.find(x=>x.id===id);
  if(m.t==='join'){
    if(p)return;
    if(mp.phase!=='lobby'){conn.send({t:'deny',why:'This battle has already started.'});return;}
    if(mp.players.length>=mp.max){conn.send({t:'deny',why:'This room is full.'});return;}
    mp.conns[id]=conn;mp.players.push({id,name:cleanName(m.name),av:cleanAv(m.av),ready:false});hostSync();
  }else if(m.t==='ready'&&p&&mp.phase==='lobby'){p.ready=!!m.v;hostSync();}
  else if(m.t==='prog'&&p&&mp.phase==='play'){p.prog=cleanProg(m.p);hostBoard();}
  else if(m.t==='say'&&p){hostChat(p.id,p.name,m.text);}
}
function hostDrop(id){
  if(!mp||mp.role!=='host')return;
  const i=mp.players.findIndex(p=>p.id===id);if(i<0)return;
  delete mp.conns[id];
  if(mp.phase==='lobby'){mp.players.splice(i,1);hostSync();}
  else{const p=mp.players[i];p.prog={...(p.prog||cleanProg()),done:true,left:true};hostBoard();}
}
function hostSync(){
  hostBroadcast({t:'lobby',name:mp.name,max:mp.max,code:mp.code,phase:mp.phase,count:state.mpCount,decks:mpDeckNames(),players:mp.players.map(p=>({id:p.id,name:p.name,av:p.av,ready:p.ready}))});
  renderLobby();
}
function hostBoard(){hostBroadcast({t:'board',players:mp.players.map(p=>({id:p.id,prog:p.prog}))});renderMp();}
function hostStart(){
  if(!mp||mp.role!=='host'||mp.players.length<2||!mp.players.every(p=>p.ready))return;
  const cards=allDecks().filter(d=>mpSel().includes(d.id)).flatMap(d=>d.cards);
  if(!cards.length){note('Pick at least one flashcard deck first.');return;}
  const qs=makeMC(cards).slice(0,state.mpCount||10);
  mp.phase='play';mp.qs=qs;mp.players.forEach(p=>p.prog=cleanProg());
  hostBroadcast({t:'start',qs});mpBegin();
}
function hostReset(){
  if(!mp||mp.role!=='host')return;
  mp.phase='lobby';mp.players.forEach(p=>{p.ready=p.id==='host';delete p.prog;});hostSync();go('lobby');renderLobby();
}

/* joining */
async function joinRoomCode(c){
  const code=(c||document.getElementById('joinCode').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(code.length<4){note('Enter the room code from your host.');return;}
  leaveRoom();openModal('<p style="text-align:center">Joining room...</p>',true);
  try{await loadPeer();}catch(e){closeModal();note('Could not load the multiplayer library. Check your internet connection.');return;}
  const peer=new Peer();let joined=false,failed=false;
  const fail=msg=>{if(joined||failed)return;failed=true;clearTimeout(timer);closeModal();try{peer.destroy();}catch(e){}note(msg);};
  const timer=setTimeout(()=>fail('Could not reach the room. Check the code and your internet connection.'),12000);
  peer.on('error',e=>fail(e.type==='peer-unavailable'?'Room not found. Check the code.':'Connection error ('+e.type+').'));
  peer.on('open',myId=>{
    const conn=peer.connect('sqroom-'+code,{reliable:true});
    conn.on('open',()=>conn.send({t:'join',name:cleanName(state.name),av:avTok(state.avatar)}));
    conn.on('data',m=>{
      if(!m||typeof m!=='object'||failed)return;
      if(m.t==='deny'){fail(String(m.why||'Could not join.'));return;}
      if(m.t==='lobby'&&!joined){joined=true;clearTimeout(timer);closeModal();mp={role:'client',peer,conn,code,meId:myId,phase:'lobby',name:'',max:0,players:[],chat:[]};clientMsg(m);go('lobby');renderLobby();return;}
      if(joined)clientMsg(m);
    });
    conn.on('close',()=>{if(mp&&mp.conn===conn){leaveRoom();go('rooms');note('The host closed the room.');}});
  });
}
function clientMsg(m){
  if(!mp||mp.role!=='client')return;
  if(m.t==='lobby'){
    mp.name=String(m.name||'Room').slice(0,24);mp.max=num(m.max);mp.code=String(m.code||mp.code);mp.count=num(m.count);mp.decks=(Array.isArray(m.decks)?m.decks:[]).slice(0,30).map(s=>String(s).slice(0,40));
    mp.players=(Array.isArray(m.players)?m.players:[]).slice(0,10).map(p=>({id:String(p.id),name:cleanName(p.name),av:cleanAv(p.av),ready:!!p.ready}));
    const back=m.phase==='lobby'&&mp.phase!=='lobby';mp.phase=m.phase==='lobby'?'lobby':mp.phase;
    if(back)go('lobby');
    renderLobby();
  }else if(m.t==='start'&&Array.isArray(m.qs)){
    mp.qs=m.qs.slice(0,30).map(x=>({q:String(x.q).slice(0,300),c:(Array.isArray(x.c)?x.c:[]).slice(0,4).map(s=>String(s).slice(0,300)),a:num(x.a)}));
    mp.players.forEach(p=>p.prog=cleanProg());mpBegin();
  }else if(m.t==='chat'){pushRoomChat(String(m.id),cleanName(m.name),String(m.text||'').slice(0,200));
  }else if(m.t==='board'&&Array.isArray(m.players)){
    m.players.forEach(b=>{const p=mp.players.find(x=>x.id===String(b.id));if(p&&b.prog&&p.id!==mp.meId)p.prog=cleanProg(b.prog);});
    renderMp();
  }
}

/* lobby */
function renderLobby(){
  if(!mp||mp.phase!=='lobby')return; const L=mp,host=L.role==='host',me=L.players.find(p=>p.id===L.meId)||{};
  const ready=L.players.length>=2&&L.players.every(p=>p.ready);
  const rows=L.players.map(p=>`<div class="room"><div style="display:flex;align-items:center;gap:10px"><img class="avatar" src="${avSrc(p.av)}" alt=""><div>${esc(p.name)}${p.id===L.meId?' (you)':''}${p.id==='host'?' <span class="gold-text small">HOST</span>':''}</div></div><span class="small" style="color:${p.ready?'#6fe08a':'#9aa'}">${p.ready?'READY':'waiting...'}</span></div>`).join('');
  const empty=Array.from({length:Math.max(0,L.max-L.players.length)},()=>'<div class="room" style="opacity:.5"><div>Waiting for player...</div></div>').join('');
  const picks=allDecks().map(d=>`<label class="pick" style="padding:8px;margin-bottom:6px"><input type="checkbox" ${mpSel().includes(d.id)?'checked':''} onchange="toggleMpDeck('${d.id}',this.checked)"><span>${esc(d.name)}<small class="muted"> &middot; ${d.cards.length} cards</small></span></label>`).join('');
  const online=state.friends.filter(x=>isOnline(x.u));
  const invites=online.length?`<div class="small muted" style="margin-top:8px">Invite online friends</div>${online.map(x=>`<button class="btn btn-blue" style="margin:4px 4px 0 0;padding:4px 10px" onclick="inviteFriend('${x.u}')">+ ${esc(x.name)}</button>`).join('')}`:'';
  const settings=host?`<div class="panel"><strong class="gold-text">Choose flashcards for this battle</strong><div style="margin-top:8px">${picks}</div>
    <label class="fld" style="margin:8px 0 0">Questions per battle<select onchange="state.mpCount=+this.value;saveGame();hostSync()">${[5,10,15,20].map(n=>`<option${state.mpCount===n?' selected':''}>${n}</option>`).join('')}</select></label>${invites}</div>`
    :`<div class="panel small"><strong class="gold-text">Flashcards:</strong> ${esc((L.decks||[]).join(', ')||'chosen by host')}<br><strong class="gold-text">Questions:</strong> ${L.count||10}</div>`;
  const act=host?`<button class="btn btn-red btn-block" ${ready?'':'disabled'} onclick="hostStart()">${ready?'START BATTLE':'WAITING FOR PLAYERS TO READY UP'}</button>`
    :`<button class="btn ${me.ready?'btn-blue':'btn-green'} btn-block" onclick="mp.conn.send({t:'ready',v:${!me.ready}})">${me.ready?'READY (tap to cancel)':'READY'}</button><div class="muted small" style="text-align:center;margin-top:6px">Waiting for the host to start...</div>`;
  document.getElementById('screen-lobby').innerHTML=`<div class="topbar"><div class="iconbtn" onclick="go('rooms')"><img class="icon-img" src="assets/images/icons/back.png" alt="Back"></div><h2>${esc(L.name)}</h2><span class="muted small">${L.players.length}/${L.max}</span></div>
  <div class="panel" style="text-align:center"><div class="muted small">Room code - share it with your friends</div><div class="guest-name" style="margin:6px 0">${esc(L.code)}</div><button class="btn btn-light" onclick="try{navigator.clipboard.writeText('${esc(L.code)}')}catch(e){}">Copy code</button></div>
  <h3 class="gold-text section-title">PLAYERS</h3>${rows}${empty}${settings}<div style="margin:12px 0">${act}</div>`;
}

/* multiplayer battle: same questions for everyone, ranked by score */
function mpBegin(){
  mp.phase='play';mp.rewarded=false;
  mp.my={idx:0,hp:100,c:0,w:0,done:false,ko:false,t0:Date.now(),t:0,locked:false};
  go('mp');renderMp();
}
function mpAnswer(i){
  const m=mp&&mp.my;if(!m||m.locked||m.done)return;
  m.locked=true;const q=mp.qs[m.idx];
  if(i===q.a)m.c++;else{m.w++;m.hp=Math.max(0,m.hp-15);}
  document.querySelectorAll('#mpChoices .choice').forEach((b,k)=>{b.disabled=true;if(k===q.a)b.classList.add('correct');else if(k===i)b.classList.add('wrong');});
  setTimeout(()=>{
    if(!mp||mp.my!==m)return;
    m.idx++;m.locked=false;
    if(m.hp<=0||m.idx>=mp.qs.length){m.done=true;m.ko=m.hp<=0;m.t=Date.now()-m.t0;}
    const p={n:m.idx,c:m.c,w:m.w,hp:m.hp,done:m.done,ko:m.ko,t:m.t};
    mp.players.find(x=>x.id===mp.meId).prog=cleanProg(p);
    if(mp.role==='host')hostBoard();else{try{mp.conn.send({t:'prog',p});}catch(e){}renderMp();}
  },900);
}
function mpQuit(){if(confirm('Leave this battle?')){leaveRoom();go('rooms');}}
function mpRanked(){
  const sc=p=>{const r=p.prog||{};return {p,dealt:(r.c||0)*20,taken:(r.w||0)*15,score:(r.c||0)*20-(r.w||0)*15};};
  const tm=r=>r.p.prog&&r.p.prog.done?r.p.prog.t:1e12;
  return mp.players.map(sc).sort((a,b)=>b.score-a.score||tm(a)-tm(b));
}
function renderMp(){
  if(!mp||mp.phase!=='play'||!mp.my)return;
  const m=mp.my,N=mp.qs.length,ranked=mpRanked(),allDone=mp.players.every(p=>p.prog&&p.prog.done),medal=['🥇','🥈','🥉'];
  const board=ranked.map((r,i)=>{const pr=r.p.prog||{};
    return `<div class="room"><div style="display:flex;align-items:center;gap:10px"><b class="gold-text" style="min-width:30px;text-align:center">${allDone?(medal[i]||i+1):i+1}</b><img class="avatar" src="${avSrc(r.p.av)}" alt=""><div>${esc(r.p.name)}${r.p.id===mp.meId?' (you)':''}<div class="muted small">${pr.left?'left the game':pr.done?(pr.ko?'knocked out':'finished'):'Q '+Math.min((pr.n||0)+1,N)+'/'+N} &middot; ✔${pr.c||0} ✖${pr.w||0}</div>${pr.done?`<div class="small">${r.dealt} dealt - ${r.taken} damage taken</div>`:''}</div></div><strong class="gold-text" style="font-size:20px">${r.score}</strong></div>`;}).join('');
  const el=document.getElementById('screen-mp');
  if(!m.done){
    const q=mp.qs[m.idx];
    el.innerHTML=`<div class="topbar"><div class="iconbtn" onclick="mpQuit()"><img class="icon-img" src="assets/images/icons/back.png" alt="Leave"></div><h2>${esc(mp.name)}</h2><span class="muted">Q ${m.idx+1}/${N}</span></div>
    <div class="panel row-between hud-strip"><span class="stat-chip">HP ${m.hp}/100</span><span class="stat-chip">Score ${m.c*20-m.w*15}</span></div>
    <div class="bar" style="margin-bottom:6px"><div class="bar-fill" style="width:${m.hp}%;background:#e04a4a"></div></div>
    <div class="parchment quiz-q">${esc(q.q)}</div>
    <div id="mpChoices">${q.c.map((c,i)=>`<button class="choice" onclick="mpAnswer(${i})">${esc(c)}</button>`).join('')}</div>
    <h3 class="gold-text section-title">LIVE RANKING</h3>${board}`;
  }else{
    el.innerHTML=`<div class="topbar"><div style="width:32px"></div><h2>${allDone?'FINAL RANKING':'Waiting for others...'}</h2><div style="width:32px"></div></div>
    <p class="muted small" style="text-align:center;margin:0 0 10px">Final score = damage dealt - damage taken${allDone?'':' (ranking updates live)'}</p>${board}
    <div style="margin-top:12px">${allDone&&mp.role==='host'?'<button class="btn btn-green btn-block" onclick="hostReset()">PLAY AGAIN</button>':''}${allDone&&mp.role!=='host'?'<div class="muted small" style="text-align:center;margin-bottom:8px">Waiting for the host to start another round...</div>':''}
    <button class="btn btn-block btn-light" style="margin-top:8px" onclick="leaveRoom();go('rooms')">Leave room</button></div>`;
    if(allDone&&!mp.rewarded){mp.rewarded=true;const rank=ranked.findIndex(r=>r.p.id===mp.meId);if(rank===0)state.stats.battlesWon++;else state.stats.battlesLost++;saveGame();addXp(rank===0?30:15);}
  }
}

/* ---- More built-in cards (10 per deck) ---- */
const MORE={
bio:[['What is mitochondria?','The organelle that produces most of the cell\'s energy (ATP).'],['What is a chloroplast?','The organelle in plant cells where photosynthesis takes place.'],['What is osmosis?','The movement of water across a membrane from low to high solute concentration.'],['What is an enzyme?','A protein that speeds up chemical reactions in living things.'],['What is mitosis?','Cell division that produces two identical daughter cells.'],['What is an ecosystem?','A community of living things interacting with their environment.'],['What is natural selection?','The process where organisms better suited to their environment survive and reproduce more.']],
net:[['What is a switch?','A device that connects devices on a LAN and forwards data using MAC addresses.'],['What is DNS?','A system that translates domain names into IP addresses.'],['What is DHCP?','A protocol that automatically assigns IP addresses to devices.'],['What is a MAC address?','A unique hardware identifier assigned to a network interface.'],['What is a LAN?','A network covering a small area such as a home, school or office.'],['What is bandwidth?','The maximum amount of data that can be transferred over a connection in a given time.'],['What is TCP?','A protocol that delivers data reliably and in order between devices.'],['What is a subnet mask?','A value that divides an IP address into network and host portions.']],
sec:[['What is malware?','Malicious software designed to damage, disrupt or gain access to systems.'],['What is ransomware?','Malware that encrypts a victim\'s files and demands payment to unlock them.'],['What is encryption?','Converting data into unreadable code so only authorized parties can read it.'],['What is two-factor authentication?','A login method requiring two different proofs of identity.'],['What is a VPN?','A service that creates an encrypted tunnel for your internet traffic.'],['What is a brute-force attack?','Repeatedly trying many passwords or keys until the correct one is found.'],['What is a security patch?','An update that fixes a vulnerability in software.'],['What is a DDoS attack?','Flooding a target with traffic from many sources to make it unavailable.']],
prog:[['What is a function?','A reusable block of code that performs a specific task.'],['What is a loop?','A structure that repeats code until a condition is met.'],['What is an array?','An ordered collection of values stored under one name.'],['What is a conditional statement?','Code that runs only when a condition is true (e.g. if/else).'],['What is an algorithm?','A step-by-step procedure for solving a problem.'],['What is a bug?','An error or flaw in a program that causes incorrect behavior.'],['What is an API?','A set of rules that lets different software programs communicate.'],['What is CSS?','The language used to style and lay out web pages.']]};
DECKS.forEach(d=>{if(MORE[d.id]&&d.cards.length<10)MORE[d.id].forEach(([q,a])=>d.cards.push({q,a}));});

/* ---- Flashcard viewer: flip anytime + Next ---- */
let rv=null;
function openReview(id){
  const deck=allDecks().find(d=>d.id===id); if(!deck)return;
  if(!deck.cards.length){alert('This deck has no cards yet. Edit it to add some.');return;}
  rv={deck,idx:0,flipped:state.firstSide==='def',seen:{}}; go('review'); renderViewer();
}
function renderViewer(){
  const {deck,idx,flipped}=rv,n=deck.cards.length,c=deck.cards[idx];
  document.getElementById('screen-review').innerHTML=`
  <div class="topbar"><div class="iconbtn" onclick="go('flashcards')"><img class="icon-img" src="assets/images/icons/back.png" alt="Back"></div><h2>${esc(deck.name)}</h2><span class="muted">${idx+1} / ${n}</span></div>
  <div class="bar xp" style="margin-bottom:12px"><div class="bar-fill" style="width:${(idx+1)/n*100}%"></div></div>
  <div class="parchment fc-card${flipped?' is-answer':''}" onclick="flipCard()"><small class="fc-label">${flipped?'DEFINITION':'TERM'}</small><div class="fc-text">${esc(flipped?c.a:c.q)}</div><small class="fc-hint">Tap the card to flip</small></div>
  <div class="fc-btns"><button class="btn btn-blue" ${idx?'':'disabled'} onclick="stepCard(-1)">Back</button><button class="btn btn-purple" onclick="flipCard()">Flip</button><button class="btn btn-gold" onclick="stepCard(1)">${idx===n-1?'Finish':'Next'}</button></div>
  ${deck.kind==='uploaded'?`<button class="btn btn-block btn-light" style="margin-top:12px" onclick="openEditor('${deck.id}')">✎ Edit this deck</button>`:''}`;
}
function flipCard(){rv.flipped=!rv.flipped;renderViewer();}
function stepCard(d){
  if(d>0&&!rv.seen[rv.idx]){rv.seen[rv.idx]=1;state.stats.cardsReviewed++;addXp(5);}
  if(d>0&&rv.idx===rv.deck.cards.length-1){saveGame();go('flashcards');return;}
  rv.idx+=d;rv.flipped=state.firstSide==='def';renderViewer();
}

/* ---- Deck editor page ---- */
let edId=null;
const edDeck=()=>state.uploads.find(u=>u.id===edId);
function openEditor(id){edId=id;go('edit');renderEditor();}
function renderEditor(){
  const u=edDeck(); if(!u){go('flashcards');return;}
  document.getElementById('screen-edit').innerHTML=`<div class="topbar"><div class="iconbtn" onclick="go('flashcards')"><img class="icon-img" src="assets/images/icons/back.png" alt="Back"></div><h2>Edit deck</h2><span class="muted">${u.cards.length} cards</span></div>
  <label class="fld">Deck name<input maxlength="30" value="${esc(u.name)}" oninput="edDeck().name=this.value;saveGame()"></label>
  <div class="ed-list">${u.cards.map((c,i)=>`<div class="ed-row"><div class="ed-n">${i+1}<button class="btn btn-red" onclick="edDel(${i})">✕</button></div><div class="ed-fields"><textarea rows="2" placeholder="Question / term" oninput="edSet(${i},'q',this.value)">${esc(c.q)}</textarea><textarea rows="2" placeholder="Answer / definition" oninput="edSet(${i},'a',this.value)">${esc(c.a)}</textarea></div></div>`).join('')}</div>
  <button class="btn btn-blue btn-block" onclick="edAdd()">+ Add card</button>
  <button class="btn btn-green btn-block" style="margin-top:8px" onclick="edDone()">Save &amp; close</button>`;
}
function edSet(i,k,v){edDeck().cards[i][k]=v;saveGame();}
function edDel(i){if(edDeck().cards.length<=1){alert('A deck needs at least one card.');return;}edDeck().cards.splice(i,1);saveGame();renderEditor();}
function edAdd(){edDeck().cards.push({q:'',a:''});saveGame();renderEditor();const t=document.querySelectorAll('#screen-edit textarea');if(t.length)t[t.length-2].focus();}
function edDone(){const u=edDeck();u.cards=u.cards.filter(c=>c.q.trim()&&c.a.trim());if(!u.cards.length)u.cards=[{q:'New term',a:'Definition'}];saveGame();go('flashcards');}

/* ---- Quiz: choose which decks to review ---- */
if(state.quizDecks===undefined) state.quizDecks=null;
function quizSel(){const ids=allDecks().map(d=>d.id);return (state.quizDecks||ids).filter(i=>ids.includes(i));}
function startQuiz(){
  quizState=null;
  document.getElementById('quizProgress').textContent='';
  document.getElementById('quizResult').classList.add('hidden');
  document.getElementById('quizQuestion').textContent='Choose flashcards to review';
  const sel=quizSel();
  document.getElementById('quizChoices').innerHTML=allDecks().map(d=>`<label class="pick"><input type="checkbox" ${sel.includes(d.id)?'checked':''} onchange="toggleQuizDeck('${d.id}',this.checked)"><span>${esc(d.name)}<small class="muted"> &middot; ${d.cards.length} cards${d.kind==='uploaded'?' &middot; uploaded':''}</small></span></label>`).join('')+`<div id="quizPickMsg" class="small" style="color:#e86a6a;margin:6px 0"></div><button class="btn btn-gold btn-block" onclick="beginQuiz()">START QUIZ</button>`;
}
function toggleQuizDeck(id,on){let s=quizSel();s=on?[...new Set([...s,id])]:s.filter(x=>x!==id);state.quizDecks=s;saveGame();}
function beginQuiz(){
  const cards=allDecks().filter(d=>quizSel().includes(d.id)).flatMap(d=>d.cards);
  if(!cards.length){document.getElementById('quizPickMsg').textContent='Select at least one deck.';return;}
  quizState={qs:makeMC(cards).slice(0,10),idx:0,hp:100,xp:0,correctCount:0};
  renderQuizQuestion();
}

/* ---- Online battle: deck picker + room chat ---- */
function mpSel(){const ids=allDecks().map(d=>d.id);return (state.mpDecks||ids).filter(i=>ids.includes(i));}
function mpDeckNames(){return allDecks().filter(d=>mpSel().includes(d.id)).map(d=>d.name);}
function toggleMpDeck(id,on){let s=mpSel();s=on?[...new Set([...s,id])]:s.filter(x=>x!==id);state.mpDecks=s;saveGame();hostSync();}
function ensureRoomChat(){
  let el=document.getElementById('roomChat');
  if(!el){el=document.createElement('div');el.id='roomChat';el.className='room-chat hidden';
    el.innerHTML='<div id="roomChatLog" class="rc-log"></div><div class="rc-in"><input id="roomChatIn" maxlength="200" placeholder="Chat with the room..." onkeydown="if(event.key===\'Enter\')sendRoomChat()"><button class="btn btn-green" onclick="sendRoomChat()">Send</button></div>';
    document.body.appendChild(el);}
  return el;
}
function renderRoomChatLog(){
  const log=document.getElementById('roomChatLog');if(!log||!mp)return;
  log.innerHTML=(mp.chat||[]).slice(-40).map(c=>`<div class="rc-msg${c.id===mp.meId?' me':''}"><b>${esc(c.name)}:</b> ${esc(c.text)}</div>`).join('')||'<div class="muted small">No messages yet. Say hi!</div>';
  log.scrollTop=log.scrollHeight;
}
function pushRoomChat(id,name,text){if(!mp)return;mp.chat.push({id,name,text});if(mp.chat.length>60)mp.chat.shift();renderRoomChatLog();}
function hostChat(id,name,text){text=String(text||'').trim().slice(0,200);if(!text||!mp)return;pushRoomChat(id,name,text);hostBroadcast({t:'chat',id,name,text});}
function sendRoomChat(){
  const inp=document.getElementById('roomChatIn'),text=inp.value.trim();if(!text||!mp)return;inp.value='';
  if(mp.role==='host')hostChat('host',cleanName(state.name),text);else{try{mp.conn.send({t:'say',text});}catch(e){}}
}
function afterGo(s){
  const inRoom=!!mp&&(s==='lobby'||s==='mp');
  ensureRoomChat().classList.toggle('hidden',!inRoom);
  document.body.classList.toggle('in-room',inRoom);
  document.body.classList.toggle('no-nav',s==='chat');
  if(inRoom)renderRoomChatLog();
  if(s==='friends')renderFriends();
  if(s==='home')updateBadge();
}

/* ---- Friends: add by username, chat (peer-to-peer) ---- */
let fp=null,fconns={},fstatus='offline',addWait=null,chatWith=null,fTimer=null;
const cleanUser=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,14);
const fu=c=>String(c.peer).replace('sqfriend-','');
const isOnline=u=>!!(fconns[u]&&fconns[u].open);
function stopFriends(){clearInterval(fTimer);Object.values(fconns).forEach(c=>{try{c.close();}catch(e){}});fconns={};if(fp){const p=fp;fp=null;try{p.destroy();}catch(e){}}}
async function startFriends(attempt){
  attempt=attempt||0;if(!state.username)return;stopFriends();fstatus='connecting';renderFriends();
  try{await loadPeer();}catch(e){fstatus='error';renderFriends();return;}
  const peer=new Peer('sqfriend-'+state.username);fp=peer;
  peer.on('open',()=>{if(fp!==peer)return;fstatus='online';state.friends.forEach(x=>connectFriend(x.u));clearInterval(fTimer);fTimer=setInterval(()=>state.friends.forEach(x=>{if(!isOnline(x.u))connectFriend(x.u);}),25000);renderFriends();});
  peer.on('connection',setupFConn);
  peer.on('disconnected',()=>{if(fp===peer){try{peer.reconnect();}catch(e){}}});
  peer.on('error',e=>{
    if(fp!==peer)return;
    if(e.type==='peer-unavailable'){const m=String(e.message||'');if(addWait&&(!m||m.includes('sqfriend-'+addWait.u)))addWait.fail();return;}
    if(e.type==='unavailable-id'){
      if(attempt<3){fstatus='connecting';setTimeout(()=>{if(fp===peer)startFriends(attempt+1);},4000);}else fstatus='taken';
    }else if(fstatus!=='online')fstatus='error';
    renderFriends();
  });
}
function connectFriend(u){
  if(!fp||fstatus!=='online')return null;
  const old=fconns[u];if(old&&old.open)return old;
  const c=fp.connect('sqfriend-'+u,{reliable:true});setupFConn(c);return c;
}
function setupFConn(c){
  c.on('open',()=>{const u=fu(c);fconns[u]=c;c.send({t:'hello',name:cleanName(state.name),av:avTok(state.avatar)});flushOutbox(u);renderFriends();});
  c.on('data',m=>friendMsg(c,m));
  const gone=()=>{const u=fu(c);if(fconns[u]===c){delete fconns[u];renderFriends();}};
  c.on('close',gone);c.on('error',gone);
}
function sendTo(u,msg,queue){
  const c=fconns[u];
  if(c&&c.open){try{c.send(msg);return true;}catch(e){}}
  if(queue){(state.outbox[u]=state.outbox[u]||[]).push(msg);saveGame();connectFriend(u);}
  return false;
}
function flushOutbox(u){
  const q=state.outbox[u];if(!q||!q.length)return;delete state.outbox[u];
  q.forEach(m=>{try{fconns[u].send(m);}catch(e){}if(m.t==='chat'){const h=state.chats[u]||[];const e=h.find(x=>x.ts===m.ts&&x.p);if(e)delete e.p;}});
  saveGame();if(chatWith===u)renderChatLog();
}
function findFriend(u){return state.friends.find(x=>x.u===u);}
function addFriend(u,name,av){
  if(!findFriend(u)){state.friends.push({u,name:cleanName(name),av:cleanAv(av)});}
  state.sent=state.sent.filter(x=>x!==u);state.requests=state.requests.filter(x=>x.u!==u);
  saveGame();connectFriend(u);renderFriends();updateBadge();
}
function friendMsg(c,m){
  if(!m||typeof m!=='object')return;
  const u=fu(c),f=findFriend(u);
  if(m.t==='hello'){if(f){f.name=cleanName(m.name);f.av=cleanAv(m.av);saveGame();}renderFriends();}
  else if(m.t==='freq'){
    if(f){c.send({t:'facc',name:cleanName(state.name),av:avTok(state.avatar)});return;}
    if(state.sent.includes(u)){addFriend(u,m.name,m.av);c.send({t:'facc',name:cleanName(state.name),av:avTok(state.avatar)});return;}
    if(!state.requests.find(r=>r.u===u)){state.requests.push({u,name:cleanName(m.name),av:cleanAv(m.av)});saveGame();}
    renderFriends();updateBadge();
  }
  else if(m.t==='facc'&&(f||state.sent.includes(u))){if(addWait&&addWait.u===u){clearTimeout(addWait.timer);addWait=null;}addFriend(u,m.name,m.av);}
  else if(m.t==='chat'&&f){pushChat(u,'them',String(m.text||'').slice(0,500),Number(m.ts)||Date.now());}
  else if(m.t==='invite'&&f){
    const code=String(m.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);if(code.length<4)return;
    openModal(`<h2 class="gold-text">Battle invite</h2><p style="margin:10px 0">${esc(f.name)} invited you to <b>${esc(String(m.room||'a room').slice(0,24))}</b>.</p><button class="btn btn-green btn-block" onclick="closeModal();go('rooms');joinRoomCode('${code}')">JOIN</button><button class="btn btn-block btn-light" style="margin-top:8px" onclick="closeModal()">Not now</button>`);
  }
}
function inviteFriend(u){if(!mp||mp.role!=='host')return;if(sendTo(u,{t:'invite',code:mp.code,room:mp.name}))note('Invite sent.');else note('That friend is offline.');}
function unreadTotal(){return Object.values(state.unread).reduce((a,b)=>a+b,0)+state.requests.length;}
function updateBadge(){const b=document.getElementById('homeFriendBadge'),n=unreadTotal();if(b){b.textContent=n;b.classList.toggle('hidden',!n);}}
const STATUS_TXT={online:'Online',connecting:'Connecting...',taken:'Username already in use online - change it',error:'Offline - check your internet',offline:'Offline'};
function renderFriends(){
  updateBadge();
  const el=document.getElementById('screen-friends');if(!el||!el.classList.contains('active'))return;
  const keep=(document.getElementById('addUser')||{}).value||'';
  const dot=fstatus==='online'?'#6fe08a':fstatus==='connecting'?'#e8c75a':'#e86a6a';
  const reqs=state.requests.map(r=>`<div class="room"><div style="display:flex;align-items:center;gap:10px"><img class="avatar" src="${avSrc(r.av)}" alt=""><div>${esc(r.name)}<div class="muted small">@${esc(r.u)} wants to be friends</div></div></div><div><button class="btn btn-green" style="padding:4px 10px" onclick="acceptReq('${r.u}')">Accept</button> <button class="btn btn-red" style="padding:4px 10px" onclick="declineReq('${r.u}')">✕</button></div></div>`).join('');
  const list=state.friends.map(x=>{const on=isOnline(x.u),n=state.unread[x.u]||0;
    return `<div class="room" onclick="openChat('${x.u}')" style="cursor:pointer"><div style="display:flex;align-items:center;gap:10px"><img class="avatar" src="${avSrc(x.av)}" alt=""><div>${esc(x.name)}<div class="muted small"><span style="color:${on?'#6fe08a':'#9aa'}">●</span> @${esc(x.u)} &middot; ${on?'online':'offline'}</div></div></div>${n?`<span class="badge">${n}</span>`:'<span class="muted">💬</span>'}</div>`;}).join('');
  el.innerHTML=`<div class="topbar"><div class="iconbtn" onclick="go('home')"><img class="icon-img" src="assets/images/icons/back.png" alt="Back"></div><h2>Friends</h2><div style="width:32px"></div></div>
  <div class="panel"><div class="muted small">Your username</div><div class="row-between"><strong class="gold-text" style="font-size:20px">@${esc(state.username||'-')}</strong><button class="btn btn-light" style="padding:4px 10px" onclick="changeUsername()">Change</button></div>
  <div class="small" style="margin-top:4px"><span style="color:${dot}">●</span> ${STATUS_TXT[fstatus]||''}</div></div>
  <div class="panel"><strong>Add a friend</strong><div class="muted small" style="margin:4px 0 8px">Type their username. They must have the app open to receive your request.</div>
  <div style="display:flex;gap:8px"><input id="addUser" maxlength="14" placeholder="USERNAME" style="flex:1;min-width:0;padding:10px;border-radius:6px;border:1px solid var(--bronze);background:#0d1424;color:var(--text);font:inherit;text-transform:uppercase" onkeydown="if(event.key==='Enter')addFriendUI()"><button class="btn btn-green" onclick="addFriendUI()">Add</button></div></div>
  ${reqs?`<h3 class="gold-text section-title">REQUESTS</h3>${reqs}`:''}
  <h3 class="gold-text section-title">FRIENDS (${state.friends.length})</h3>${list||'<div class="panel muted">No friends yet. Add someone by their username!</div>'}`;
  const ai=document.getElementById('addUser');if(ai&&keep)ai.value=keep;
}
function changeUsername(){
  openModal(`<h2 class="gold-text">Change username</h2><p class="muted small" style="margin:6px 0">Letters and numbers only (3-14). Friends will need to add your new username again.</p><label class="fld">Username<input id="newUser" maxlength="14" value="${esc(state.username||'')}" style="text-transform:uppercase"></label><div id="nuMsg" class="small" style="color:#e86a6a"></div><button class="btn btn-green btn-block" onclick="saveUsername()">Save</button><button class="btn btn-block btn-light" style="margin-top:8px" onclick="closeModal()">Cancel</button>`);
}
function saveUsername(){const u=cleanUser(document.getElementById('newUser').value);if(u.length<3){document.getElementById('nuMsg').textContent='Use at least 3 letters or numbers.';return;}state.username=u;saveGame();closeModal();startFriends();}
function addFriendUI(){
  const u=cleanUser(document.getElementById('addUser').value);
  if(u.length<3){note('Enter a username.');return;}
  if(u===state.username){note('That is your own username.');return;}
  if(findFriend(u)){note('You are already friends.');return;}
  if(fstatus!=='online'){note('You are not connected yet. Wait until the status says Online.');return;}
  if(addWait){clearTimeout(addWait.timer);}
  const fail=()=>{if(!addWait||addWait.u!==u)return;clearTimeout(addWait.timer);addWait=null;state.sent=state.sent.filter(x=>x!==u);note('Could not find @'+u+'. Check the username - they must be online with the app open.');};
  addWait={u,fail,timer:setTimeout(fail,10000)};
  const c=connectFriend(u);if(!c){fail();return;}
  const send=()=>{c.send({t:'freq',name:cleanName(state.name),av:avTok(state.avatar)});if(!state.sent.includes(u))state.sent.push(u);saveGame();if(addWait&&addWait.u===u){clearTimeout(addWait.timer);addWait=null;}note('Friend request sent to @'+u+'. You will be friends once they accept.');};
  if(c.open)send();else c.on('open',send);
  document.getElementById('addUser').value='';
}
function acceptReq(u){const r=state.requests.find(x=>x.u===u);if(!r)return;addFriend(u,r.name,r.av);connectFriend(u);sendTo(u,{t:'facc',name:cleanName(state.name),av:avTok(state.avatar)},true);}
function declineReq(u){state.requests=state.requests.filter(x=>x.u!==u);saveGame();renderFriends();updateBadge();}

/* ---- Friend chat ---- */
function openChat(u){chatWith=u;state.unread[u]=0;saveGame();go('chat');renderChat();}
function renderChat(){
  const f=findFriend(chatWith);if(!f){go('friends');return;}
  document.getElementById('screen-chat').innerHTML=`<div class="topbar"><div class="iconbtn" onclick="chatWith=null;go('friends')"><img class="icon-img" src="assets/images/icons/back.png" alt="Back"></div><h2>${esc(f.name)}</h2><div class="iconbtn" onclick="removeFriend('${f.u}')" title="Remove friend">✕</div></div>
  <div class="muted small" style="margin-bottom:6px"><span style="color:${isOnline(f.u)?'#6fe08a':'#9aa'}">●</span> @${esc(f.u)} &middot; ${isOnline(f.u)?'online':'offline - messages are sent when you are both online'}</div>
  <div id="chatLog" class="chat-log"></div>
  <div class="chat-input"><input id="chatIn" maxlength="500" placeholder="Message..." onkeydown="if(event.key==='Enter')sendChat()"><button class="btn btn-green" onclick="sendChat()">Send</button></div>`;
  renderChatLog();
}
function renderChatLog(){
  const log=document.getElementById('chatLog');if(!log||!chatWith)return;
  const h=state.chats[chatWith]||[];
  log.innerHTML=h.map(m=>`<div class="bubble ${m.from==='me'?'me':'them'}">${esc(m.text)}${m.p?'<div class="small" style="opacity:.6">waiting to send...</div>':''}</div>`).join('')||'<div class="muted small" style="text-align:center;margin-top:20px">No messages yet. Say hi!</div>';
  log.scrollTop=log.scrollHeight;
}
function pushChat(u,from,text,ts,pending){
  const h=state.chats[u]=state.chats[u]||[];h.push(pending?{from,text,ts,p:1}:{from,text,ts});if(h.length>200)h.splice(0,h.length-200);
  const open=chatWith===u&&document.getElementById('screen-chat').classList.contains('active');
  if(from==='them'&&!open)state.unread[u]=(state.unread[u]||0)+1;
  saveGame();if(open)renderChatLog();updateBadge();renderFriends();
}
function sendChat(){
  const inp=document.getElementById('chatIn'),text=inp.value.trim();if(!text||!chatWith)return;inp.value='';
  const ts=Date.now(),msg={t:'chat',text,ts},ok=sendTo(chatWith,msg,true);
  pushChat(chatWith,'me',text,ts,!ok);
}
function removeFriend(u){if(!confirm('Remove this friend? Their chat history will be deleted.'))return;state.friends=state.friends.filter(x=>x.u!==u);delete state.chats[u];delete state.unread[u];delete state.outbox[u];saveGame();chatWith=null;go('friends');}

/* ---- Start ---- */
applyAvatar();
showLogin();
updateBadge();
