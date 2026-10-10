const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.join(__dirname,'..');
const decks=JSON.parse(fs.readFileSync(path.join(root,'data/deck-proposals.json')));
const cards=JSON.parse(fs.readFileSync(path.join(root,'data/deck-cards.json')));
const reserves=JSON.parse(fs.readFileSync(path.join(root,'data/battlebox-reservations.json')));
const fixture={...reserves.booster};
assert.equal(decks.length,6);
for(const deck of decks){
 assert.equal(deck.cards.reduce((s,c)=>s+c.quantity,0),40);
 assert.equal(deck.cards.filter(c=>cards[c.name].type.includes('Land')).reduce((s,c)=>s+c.quantity,0),17);
 assert(deck.colors.length>=1&&deck.colors.length<=2);
 assert.equal(new Set(deck.cards.map(c=>c.name)).size,deck.cards.length);
 for(const card of deck.cards){assert(card.quantity>0&&Number.isInteger(card.quantity));assert(cards[card.name].colors.every(c=>deck.colors.includes(c)),`${card.name} matches deck colors`);fixture[card.name]=(fixture[card.name]||0)+card.quantity;}
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext({viewport:{width:1450,height:1050},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage(), errors=[];page.on('pageerror',error=>errors.push(error.message));
  const url=process.env.CUBE_URL||'http://127.0.0.1:8766/';
  await page.goto(url);
  await page.evaluate(counts=>{localStorage.setItem('cube-atlas.owned.v1',JSON.stringify({version:1,full:true,source:'test.csv',counts}));localStorage.setItem('cube-atlas.progress.v1',JSON.stringify({version:1,included:['white:ajani-s-pridemate:1']}));localStorage.setItem('cube-atlas.view.v1',JSON.stringify({roster:'booster'}));},fixture);
  await page.goto(new URL('decks.html',url).href);
  await page.locator('.deck').last().waitFor();
  assert.equal(await page.locator('.deck').count(),6);
  assert.match(await page.locator('#allocation').textContent(),/All six can be built together/);
  for(const deck of decks) await page.getByRole('button',{name:`Pick ${deck.title}`,exact:true}).click();
  assert.equal(await page.locator('#completion').textContent(),'0 / 6');
  assert.equal(await page.locator('.availability[data-missing="true"]').count(),0);
  const first=page.locator('.deck').first();await first.locator('summary').click();
  await first.locator('.copy').click();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());assert.equal(copied.split('\n').reduce((s,line)=>s+Number(line.split(' ')[0]),0),40);
  for(const deck of decks) await page.getByRole('checkbox',{name:`Complete ${deck.title}`,exact:true}).check();
  assert.equal(await page.locator('#completion').textContent(),'6 / 6');assert.match(await page.locator('#toast').textContent(),/All your picks/);
  assert.equal(await page.locator('.pick:disabled').count(),6);
  await page.reload();await page.locator('.deck').last().waitFor();assert.equal(await page.locator('#completion').textContent(),'6 / 6');assert.equal(await page.locator('#toast').isVisible(),false);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cube-atlas.progress.v1')).included.length),1,'Deck completion does not change battlebox progress');
  await page.getByRole('checkbox',{name:`Complete ${decks[0].title}`,exact:true}).uncheck();await page.getByRole('button',{name:`Pick ${decks[0].title}`,exact:true}).click();
  await page.locator('[data-filter="picked"]').click();assert.equal(await page.locator('.deck:visible').count(),5);
  await page.locator('[data-filter="all"]').click();
  const second=await context.newPage();await second.goto(page.url());await second.locator('.deck').last().waitFor();
  await page.getByRole('button',{name:`Pick ${decks[0].title}`,exact:true}).click();await second.waitForFunction(()=>document.querySelector('#completion').textContent==='5 / 6');await second.close();
  await page.getByRole('checkbox',{name:`Complete ${decks[0].title}`,exact:true}).check();
  await page.evaluate(()=>{const owned=JSON.parse(localStorage.getItem('cube-atlas.owned.v1'));owned.counts['Healer\'s Hawk']=1;localStorage.setItem('cube-atlas.owned.v1',JSON.stringify(owned));});
  await page.reload();await page.locator('.deck').last().waitFor();assert.match(await page.locator('#allocation').textContent(),/copies short/);
  assert.equal(await page.locator('.availability[data-missing="true"]').count(),2,'Shared shortages appear on both decks');
  await page.getByRole('checkbox',{name:`Complete ${decks[0].title}`,exact:true}).uncheck();assert.equal(await page.getByRole('checkbox',{name:`Complete ${decks[0].title}`,exact:true}).isDisabled(),true);
  await page.evaluate(()=>localStorage.setItem('cube-atlas.owned.v1',JSON.stringify({version:1,source:'old.csv',counts:{Plains:100}})));
  await page.reload();await page.locator('.deck').last().waitFor();assert.match(await page.locator('#collection-status').textContent(),/Older imports/);
  await page.evaluate(counts=>{localStorage.removeItem('cube-atlas.decks.v1');localStorage.setItem('cube-atlas.owned.v1',JSON.stringify({version:1,full:true,source:'test.csv',counts}));},fixture);
  await page.reload();await page.locator('.deck').last().waitFor();
  await page.locator('#roster').selectOption('original');assert.equal(await page.locator('#roster').inputValue(),'original');await page.reload();await page.locator('.deck').last().waitFor();assert.equal(await page.locator('#roster').inputValue(),'original');
  await page.locator('#roster').selectOption('booster');
  await page.route('https://cards.scryfall.io/normal/**',route=>route.fulfill({path:path.join(root,'assets/cards/felidar-cub.jpg'),contentType:'image/jpeg'}));
  await page.locator('.deck').first().locator('summary').click();const link=page.locator('.deck').first().getByRole('link',{name:"Healer's Hawk",exact:true});await link.scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await link.hover();await page.locator('#preview').waitFor({state:'visible'});assert.equal(await page.locator('#preview img').getAttribute('alt'),"Healer's Hawk — full card");await page.keyboard.press('Escape');assert.equal(await page.locator('#preview').isVisible(),false);
  await page.locator('.deck img').evaluateAll(images=>images.forEach(img=>img.loading='eager'));await page.waitForFunction(()=>[...document.querySelectorAll('.deck img')].every(img=>img.complete&&img.naturalWidth>0));
  for(const width of [390,780,1450]){await page.setViewportSize({width,height:1050});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`/tmp/cube-decks-${width}.png`,fullPage:true});}
  if(process.env.COLLECTION_CSV){
   await page.goto(url);await page.locator('#owned-file').setInputFiles(process.env.COLLECTION_CSV);await page.waitForFunction(()=>document.querySelector('#owned-file').value==='');
   const owned=await page.evaluate(()=>JSON.parse(localStorage.getItem('cube-atlas.owned.v1')).counts);
   for(const name of Object.keys(fixture)){const needed=fixture[name]-(reserves.booster[name]||0);assert(needed<=Math.max(0,(owned[name]||0)-(reserves.booster[name]||0)),`${name}: six decks fit after reserving full battlebox`);}
   await page.goto(new URL('decks.html',url).href);await page.locator('.deck').last().waitFor();assert.match(await page.locator('#allocation').textContent(),/All six/);console.log('Actual collection supports all six decks simultaneously after the Play Boosters battlebox.');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: 6 × 40 cards, colors, 17 lands each, shared allocations, completion/undo/persistence, cross-tab updates, roster changes, legacy import detection, copy, preview, responsive layouts, and battlebox progress isolation.');
 } finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
