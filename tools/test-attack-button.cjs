// Dual-stick touch controls with real multi-touch (CDP touch events).
const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:false}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const cdp=await page.context().newCDPSession(page);
  let fingers={};
  const send=async type=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:Object.entries(fingers).map(([id,[x,y]])=>({x,y,id:+id}))});
  const down=async(id,x,y)=>{fingers[id]=[x,y];await send('touchStart');};
  const moveTo=async(id,x,y)=>{fingers[id]=[x,y];await send('touchMove');};
  // CDP touchEnd releases exactly the listed fingers.
  const up=async id=>{const [x,y]=fingers[id];delete fingers[id];await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:+id}]});};
  await page.goto(pathToFileURL(path.resolve('source/index.html')).href+'?offline');
  await page.waitForFunction(()=>window.G&&G.DB&&window.__PSOnlineInstalled&&document.getElementById('boot').classList.contains('hidden'),{timeout:60000});
  await page.evaluate(()=>document.getElementById('tap-start')?.click());
  await page.waitForFunction(()=>G.DB.save);
  await page.evaluate(()=>{G.DB.save.partner=4;G.DB.save.owned[4]={at:1,from:'starter'};G.Flow.goMenu();document.body.classList.add('touch');});
  await page.evaluate(()=>document.querySelector('#scr-menu [data-go=play]').click());
  await page.waitForFunction(()=>G.Game.state==='playing');
  await page.evaluate(()=>{const p=G.Game.player;for(const id of ['ember','scratch','tackle','growl'])try{if(G.Moves.BY_ID[id]&&!p.hasMove(id))p.addMove(id);}catch(_){}
    window.__casts=0;const cast=G.Player.prototype.cast;G.Player.prototype.cast=function(){if(this===G.Game.player)window.__casts++;return cast.apply(this,arguments);};
    G.AttackButton.setPlacement('float');});
  await page.waitForTimeout(5000); // first enemies
  const casts=async ms=>{await page.evaluate(()=>window.__casts=0);await page.waitForTimeout(ms);return page.evaluate(()=>window.__casts);};
  const idle=await casts(2500); // moves fire by themselves
  // Finger 1 moves (left half), finger 2 attacks and aims left (right half).
  await down(1,200,250);await moveTo(1,240,250);await moveTo(1,280,250);
  const vec=await page.evaluate(()=>G.Touch.vector());
  await down(2,650,200);await moveTo(2,620,200);await moveTo(2,590,200);
  const held=await casts(2500);
  const aim=await page.evaluate(()=>({aim:G.Game.player.aim,manual:G.Game.player.manualAim,sticks:!!(G.AttackButton.sticks.move&&G.AttackButton.sticks.attack)}));
  // Finger 3 taps a move slot while both sticks are held.
  const slots=await page.evaluate(()=>G.AttackButton.buttons);
  const before=await page.evaluate(()=>G.Game.player.active);
  const slot=slots.find(b=>b.y>250&&b.w<80&&b.x>300)||slots[0];
  const other=slots.filter(b=>b.y>250&&b.w<80).find(b=>Math.abs(b.x-slot.x)>10)||slot;
  await down(3,other.x+other.w/2,other.y+other.h/2);await up(3);await page.waitForTimeout(300);
  const after=await page.evaluate(()=>G.Game.player.active);
  await up(2);
  // Level-up cards while finger 1 still holds the stick: movement must resume.
  await page.evaluate(()=>G.Game.debugLevelUp());await page.waitForTimeout(400);
  const lvOpen=await page.evaluate(()=>!document.getElementById('scr-levelup').classList.contains('hidden'));
  await page.evaluate(()=>{const c=document.querySelector('#scr-levelup .card, #scr-levelup button');c&&c.click();});
  await page.waitForTimeout(1200);
  await page.evaluate(()=>{const c=document.querySelector('#scr-levelup:not(.hidden) .card, #scr-levelup:not(.hidden) button');c&&c.click();});
  await page.waitForFunction(()=>G.Game.state==='playing',{timeout:8000});
  const vecAfterLevel=await page.evaluate(()=>G.Touch.vector());
  await up(1);
  // Fixed placement: right half away from the stick moves instead.
  await page.evaluate(()=>G.AttackButton.setPlacement('fixed',[0.84,0.64]));
  await down(5,520,120);await moveTo(5,560,120);
  const fixedRoles=await page.evaluate(()=>({move:!!G.AttackButton.sticks.move,attack:!!G.AttackButton.sticks.attack}));
  await up(5);
  await page.screenshot({path:'verification/attack-button.png'});
  // Area move with no enemy anywhere: holding the stick still fires it.
  await page.evaluate(()=>{G.AttackButton.setPlacement('float');const p=G.Game.player;const id=Object.values(G.Moves.BY_ID).find(m=>m.kind==='meteor').id;if(!p.hasMove(id))p.addMove(id);p.setActive(p.slots.findIndex(g=>g.some(m=>m.id===id)));G.EnemyMgr.clear();window.__metId=id;});
  await page.evaluate(()=>{const p=G.Game.player;window.__met=0;const cast=G.Player.prototype.cast;G.Player.prototype.cast=function(m){if(this===p&&m.id===window.__metId)window.__met++;return cast.apply(this,arguments);};setInterval(()=>G.EnemyMgr.clear(),50);});
  await down(6,650,220);await page.waitForTimeout(3000);await up(6);
  const meteor=await page.evaluate(()=>({casts:window.__met,enemies:G.EnemyMgr.all().length}));
  await page.screenshot({path:'verification/attack-idle-button.png'});
  // Layout editor row and draggable attack stick.
  await page.keyboard.press('Escape');await page.evaluate(()=>G.LayoutUI.open());await page.waitForTimeout(300);
  let lay=await page.evaluate(()=>({row:!!document.getElementById('ps-lay-atk'),chips:[...document.querySelectorAll('#ps-lay-atk [data-m]')].map(b=>b.textContent+(b.classList.contains('on')?'*':'')),thing:!document.querySelector('.ps-lay-atk').classList.contains('hidden')}));
  await page.screenshot({path:'verification/attack-layout.png'});
  await page.evaluate(()=>document.querySelector('#ps-lay-atk [data-m=fixed]').click());
  lay.fixedShows=await page.evaluate(()=>!document.querySelector('.ps-lay-atk').classList.contains('hidden'));
  await page.evaluate(()=>document.querySelector('#ps-lay-atk [data-m=float]').click());
  await page.evaluate(()=>document.getElementById('lay-save').click());
  const saved=await page.evaluate(()=>G.AttackButton.placement);
  console.log({meteor,idle,vec,held,aim,before,after,lvOpen,vecAfterLevel,fixedRoles,lay,saved,errors});
  assert(idle>0,'moves fire by themselves without the stick');
  assert.equal(await page.locator('#ps-attack-mode').count(),0,'no auto/manual switch any more');
  assert(vec[0]>0.5&&Math.abs(vec[1])<0.2,'left-half finger moves');
  assert(held>0&&aim.sticks,'right-half finger attacks while moving');
  assert(Math.abs(Math.abs(aim.aim)-Math.PI)<0.25,'dragging the attack stick aims');
  assert.equal(aim.manual,false,'no mouse crosshair is drawn for touch aiming');
  assert.notEqual(after,before,'a third finger switches the move');
  assert(lvOpen,'level-up opened');
  assert(vecAfterLevel[0]>0.5,'held movement continues after the level-up cards');
  assert(fixedRoles.move&&!fixedRoles.attack,'fixed attack stick leaves the rest of the screen to movement');
  assert(lay.row&&lay.fixedShows&&lay.chips.length===2,'layout editor has the attack stick');
  assert.equal(saved,'float');
  assert(meteor.casts>0,'area move fires without any enemy');
  assert.deepEqual(errors,[]);
  console.log('Dual-stick multi-touch controls: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
