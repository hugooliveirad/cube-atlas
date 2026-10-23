const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 await page.route('https://cards.scryfall.io/**',route=>route.fulfill({path:require('node:path').join(__dirname,'../assets/cards/felidar-cub.jpg'),contentType:'image/jpeg'}));
 await page.route('https://api.scryfall.com/**',route=>route.fulfill({path:require('node:path').join(__dirname,'../assets/cards/felidar-cub.jpg'),contentType:'image/jpeg'}));
 await page.goto(process.env.CUBE_URL || 'http://127.0.0.1:8766');
 await page.locator('#import-cube').click();await page.getByText('Or paste Cube Cobra CSV',{exact:true}).click();await page.locator('#cube-csv').fill('name,Type,Color,Rarity,board,Quantity\nLightning Bolt,Instant,R,common,mainboard,1');await page.locator('#cube-name').fill('Hover regression');await page.locator('#preview-cube').click();await page.locator('#save-cube').click();
 await page.locator('.art').first().hover();
 await page.locator('#card-preview').waitFor({state:'visible',timeout:3000});
 await page.waitForFunction(()=>document.querySelector('#card-preview img')?.alt.endsWith('— full card'));
 assert.match(await page.locator('#card-preview img').getAttribute('src'),/exact=Lightning%20Bolt.*version=normal/);
 await page.mouse.move(0,0);assert.equal(await page.locator('#card-preview').isVisible(),false);
 for(const cube of ['original','booster','hobbit']) {
 const options=await page.locator('#cube-select option').evaluateAll(ns=>ns.map(n=>n.value));
 const value=cube==='original'?options[0]:cube==='booster'?options[1]:cube;
 await page.selectOption('#cube-select',value);await page.locator('.art').first().hover();await page.locator('#card-preview').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('#card-preview img')?.alt.endsWith('— full card'));await page.keyboard.press('Escape');assert.equal(await page.locator('#card-preview').isVisible(),false);
 }
 await page.selectOption('#cube-select',{index:0});
 let release, requested;
 const gate = new Promise(resolve => release = resolve);
 const requestStarted = new Promise(resolve => requested = resolve);
 await page.route('https://cards.scryfall.io/normal/**',async route => {
   requested(); await gate; await route.fulfill({path:require('node:path').join(__dirname,'../assets/cards/felidar-cub.jpg'),contentType:'image/jpeg'});
 });
 await page.mouse.move(0,0);
 await page.locator('.art').nth(2).hover(); await requestStarted;
 assert.equal(await page.locator('#card-preview').isVisible(),true,'Slow image loads still open the preview');
 assert.equal(await page.locator('#card-preview img').getAttribute('src'),'assets/mtg-card-back.jpg');
 const response = page.waitForResponse(r => r.url().includes('/normal/'));
 await page.mouse.move(0,0); release(); await response;
 assert.equal(await page.locator('#card-preview').isVisible(),false,'A late image never reopens a dismissed preview');
 await page.unroute('https://cards.scryfall.io/normal/**');
 await page.locator('.card input').first().focus();
 await page.keyboard.press('Tab');
 await page.locator('#card-preview').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.querySelector('#card-preview img')?.alt.endsWith('— full card'));
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#card-preview').isVisible(),false);
 console.log('PASS: imported name lookup, all built-in cube hovers, loaded fronts, pointer leave and Escape');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
