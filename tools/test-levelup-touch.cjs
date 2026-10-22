// Hold the movement stick, pick a level-up card with another finger: the card
// is taken and movement continues without lifting the first finger.
const root=require('node:path').resolve(__dirname,'..');const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');const assert=require('node:assert/strict');
const path=require('path'),{pathToFileURL}=require('url');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
const page=await b.newPage({viewport:{width:844,height:390},hasTouch:true});const cdp=await page.context().newCDPSession(page);
let fingers={};const send=t=>cdp.send('Input.dispatchTouchEvent',{type:t,touchPoints:Object.entries(fingers).map(([id,[x,y]])=>({x,y,id:+id}))});
const down=async(id,x,y)=>{fingers[id]=[x,y];await send('touchStart');},mv=async(id,x,y)=>{fingers[id]=[x,y];await send('touchMove');},up=async id=>{const [x,y]=fingers[id];delete fingers[id];await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:+id}]});};
const ev=[];
await page.goto(pathToFileURL(path.join(root,'source/index.html')).href+'?offline');
await page.waitForFunction(()=>window.G&&G.DB&&window.__PSOnlineInstalled&&document.getElementById('boot').classList.contains('hidden'),{timeout:60000});
await page.evaluate(()=>document.getElementById('tap-start')?.click());await page.waitForFunction(()=>G.DB.save);
await page.evaluate(()=>{G.DB.save.partner=4;G.DB.save.owned[4]={at:1,from:'starter'};G.Flow.goMenu();document.body.classList.add('touch');
  for(const t of ['pointerdown','pointerup','pointercancel','lostpointercapture','touchcancel'])addEventListener(t,e=>(window.__ev=window.__ev||[]).push(t+':'+(e.pointerId||'')+':'+((e.target&&e.target.id)||e.target.className||e.target.tagName)),true);});
await page.evaluate(()=>document.querySelector('#scr-menu [data-go=play]').click());await page.waitForFunction(()=>G.Game.state==='playing');await page.waitForTimeout(1000);
const snap=async label=>{const s=await page.evaluate(()=>({state:G.Game.state,time:+G.Game.st.time.toFixed(2),x:Math.round(G.Game.player.x),vec:G.Touch.vector(),stick:!!G.AttackButton.sticks.move,lv:!document.getElementById('scr-levelup').classList.contains('hidden')}));console.log(label,JSON.stringify(s));return s;};
await down(1,200,250);await mv(1,240,250);await mv(1,280,250);await page.waitForTimeout(500);await snap('moving');
await page.evaluate(()=>G.Game.debugLevelUp());await page.waitForTimeout(300);await snap('cards shown');
await mv(1,285,250);await mv(1,290,252);await page.waitForTimeout(800);await snap('cards, finger still moving');
// second finger taps a card for real
const card=await page.evaluate(()=>{const c=[...document.querySelectorAll('#scr-levelup .card, #scr-levelup [data-i], #scr-levelup button')].find(e=>e.offsetParent);if(!c)return null;const r=c.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,c.className];});
console.log('card',card);await page.waitForTimeout(1200);
if(card){await down(2,card[0],card[1]);await page.waitForTimeout(80);await up(2);}
await page.waitForTimeout(1500);const picked=await snap('after picking');
await mv(1,300,250);await page.waitForTimeout(800);const moved=await snap('after picking + move');assert(!picked.lv&&picked.state==='playing','second finger picked the card');assert(picked.stick&&moved.x>picked.x+20,'movement continued without lifting the first finger');console.log('Level-up with multi-touch: PASS');
console.log('events',(await page.evaluate(()=>window.__ev||[])).join(' '));
await b.close();})().catch(e=>{console.error(e);process.exit(1);});
