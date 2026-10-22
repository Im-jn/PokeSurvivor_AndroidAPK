const {chromium}=require('../../PokeSurvivor_ChineseWideMap/.research/node_modules/playwright');
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
  try{
    const cases=process.env.CUTOUT_CHECK ? [['cutout-left',{width:960,height:432},true,'96,0,0,0,2'],['cutout-right',{width:960,height:432},true,'0,0,96,0,2']] : [['desktop',{width:1440,height:900},false],['phone',{width:844,height:390},true]];
    for(const [name,viewport,touch,cutout] of cases){
      const context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,locale:'zh-CN',deviceScaleFactor:touch?2:1});
      if(cutout)await context.addInitScript(value=>{window.AndroidApp={getCutoutInsets:()=>value,exit(){}};},cutout);
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
      await page.goto(pathToFileURL(path.join(root,'source/index.html')).href);
      await page.waitForFunction(()=>window.G?.Game&&document.querySelector('#boot').classList.contains('hidden'));
      if(await page.locator('#tap-start').isVisible())await page.locator('#tap-start').click();
      await page.waitForTimeout(400);
      if(await page.locator('#scr-login').isVisible())await page.locator('#btn-guest').click();
      console.log(name,'initial',await page.locator('button:visible').evaluateAll(bs=>bs.map(b=>({id:b.id,text:b.textContent}))));
      // Use a fresh, isolated local guest save, never an existing player profile.
      for(let i=0;i<12&&await page.locator('#test-a button:visible').count();i++){await page.locator('#test-a button:visible').first().click();await page.waitForTimeout(50);}
      if(await page.locator('#res-ok').isVisible())await page.locator('#res-ok').click();
      await page.waitForTimeout(300);
      console.log(name,'menu',await page.locator('button:visible').evaluateAll(bs=>bs.map(b=>({id:b.id,text:b.textContent}))));
      await page.screenshot({path:path.join(root,`verification/${name}-menu.png`)});
      await page.locator('#btn-settings').click();
      await page.locator('#set-tabs [data-t=map]').click();
      assert.match(await page.locator('#set-body').innerText(),/战斗小地图/);
      await page.screenshot({path:path.join(root,`verification/${name}-settings.png`)});
      await page.locator('#set-close').click();
      await page.locator('#scr-menu [data-go=play]').click();
      await page.waitForFunction(()=>G.Game.state==='playing');await page.waitForTimeout(900);
      if(cutout){const box=await page.locator('#game').boundingBox();assert.equal(box.x,0);assert.equal(box.width,viewport.width);assert.equal(box.height,viewport.height);const actual=await page.evaluate(()=>G.Touch.safeArea());assert.equal(actual[name==='cutout-left'?'left':'right'],48);}
      const perf=await page.evaluate(()=>{const times=[];for(let i=0;i<5;i++){const at=performance.now();G.World.mapSample(-80,-80,160,160,true);times.push(Math.round(performance.now()-at));}return times;});
      console.log(name,'map sample 160×160 ms',perf);
      await page.screenshot({path:path.join(root,`verification/${name}-combat.png`)});
      // Real HUD pointer interaction: this must not start the movement joystick.
      if(touch)await page.touchscreen.tap(viewport.width-55-(name==='cutout-right'?48:0),105);else await page.keyboard.press('m');
      await page.waitForFunction(()=>G.MapUI.isOpen);
      assert.equal(await page.evaluate(()=>G.Game.state),'paused');
      assert.match(await page.locator('#map-title').innerText(),/资源地图/);
      assert.equal(await page.locator('#pswm,#ps-zh-toggle').count(),0);
      assert.match(await page.locator('#map-session').innerText(),/已暂停/);
      assert.equal(await page.locator('#map-filters canvas').count(),7);
      assert.equal(await page.locator('#map-legend canvas').count(),3);
      // The current official pause keeps decorative animations running. Verify
      // that movement, damage and the game clock stop while reading the map.
      const before=await page.evaluate(()=>({x:G.Game.player.x,y:G.Game.player.y,hp:G.Game.player.hp,time:G.Game.st.time}));
      await page.waitForTimeout(2000);
      assert.deepEqual(await page.evaluate(()=>({x:G.Game.player.x,y:G.Game.player.y,hp:G.Game.player.hp,time:G.Game.st.time})),before);
      await page.locator('#map-in').click();assert.equal(await page.evaluate(()=>G.Settings.get('mapRange')),77);
      await page.locator('#map-filters [data-resource=tree]').click();assert(await page.evaluate(()=>G.Settings.get('mapFilters').includes('tree')));
      const canvas=page.locator('#resource-map'),rect=await canvas.boundingBox();
      await page.mouse.move(rect.x+rect.width*.45,rect.y+rect.height*.45);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.65,rect.y+rect.height*.65,{steps:5});await page.mouse.up();
      await page.locator('#map-center').click();
      // Select a real loaded resource using its map projection.
      const hit=await page.evaluate(()=>{const pl=G.Game.player,n=G.Settings.get('mapRange'),x=Math.floor(pl.x/32-n/2),y=Math.floor(pl.y/32-n/2),s=G.World.mapSample(x,y,n,n,true),allowed=new Set(G.Settings.get('mapFilters')),p=s.props.find(p=>allowed.has(p.type));return p?{x:(p.tx+.5-x)/n,y:(p.ty+.5-y)/n}:null;});
      if(hit){const r=await canvas.boundingBox();await page.mouse.click(r.x+hit.x*r.width,r.y+hit.y*r.height);assert.match(await page.locator('#map-selection').innerText(),/\(-?\d+, -?\d+\)/);}
      await page.screenshot({path:path.join(root,`verification/${name}-map.png`)});
      const sizes=await page.locator('#scr-map .box').evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,scroll:el.scrollWidth,client:el.clientWidth}));
      assert(sizes.width<=viewport.width&&sizes.height<=viewport.height&&sizes.scroll<=sizes.client+1,JSON.stringify(sizes));
      await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>G.Game.state),'playing');
      await page.keyboard.press('Escape');await page.waitForFunction(()=>G.Game.state==='paused');
      await page.locator('#btn-pause-map').click();await page.locator('#map-close').click();
      assert.equal(await page.evaluate(()=>G.Game.state),'paused');assert(await page.locator('#scr-pause').isVisible());
      await page.locator('#btn-resume').click();assert.equal(await page.evaluate(()=>G.Game.state),'playing');
      await page.reload();await page.waitForFunction(()=>window.G?.MapUI&&document.querySelector('#boot').classList.contains('hidden'));
      assert.equal(await page.evaluate(()=>G.Settings.get('mapRange')),77);
      assert(await page.evaluate(()=>G.Settings.get('mapFilters').includes('tree')));
      // English and Spanish still work through the native language setting.
      await page.evaluate(()=>G.I18n.set('en'));await page.waitForFunction(()=>window.G?.I18n?.lang==='en');
      assert.equal(await page.evaluate(()=>G.T('Mapa de recursos')),'Resource map');
      await page.evaluate(()=>G.I18n.set('es'));await page.waitForFunction(()=>window.G?.I18n?.lang==='es');
      assert.equal(await page.evaluate(()=>G.T('Mapa de recursos')),'Mapa de recursos');
      assert.deepEqual(errors,[]);console.log(name,'PASS',sizes);
      await context.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
