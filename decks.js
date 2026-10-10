'use strict';
(async () => {
  const $ = id => document.getElementById(id);
  const KEY = 'cube-atlas.decks.v1', OWNED_KEY = 'cube-atlas.owned.v1';
  const normalize = name => name.normalize('NFKC').trim().replace(/[’‘]/g,"'").replace(/\s+/g,' ').toLowerCase();
  let decks, metadata, reservations, ownership, saved = {version:1,roster:'booster',picked:[],completed:[]};
  let filter = 'all', timer, previewRequest = 0;
  const nodes = new Map();
  function error(message) { $('error').textContent = message; $('error').hidden = !message; }
  try {
    [decks,metadata,reservations] = await Promise.all(['data/deck-proposals.json','data/deck-cards.json','data/battlebox-reservations.json'].map(async url => {
      const response = await fetch(url); if(!response.ok) throw new Error('Deck files could not be loaded. Reload to try again.'); return response.json();
    }));
  } catch(e) { error(e.message); $('collection-status').textContent = 'Decks unavailable.'; return; }
  function readSaved() {
    const raw = localStorage.getItem(KEY);
    if(!raw) return;
    const data = JSON.parse(raw), ids = new Set(decks.map(deck => deck.id));
    if(data.version !== 1 || !reservations[data.roster] || !Array.isArray(data.picked) || !Array.isArray(data.completed) || [...data.picked,...data.completed].some(id => !ids.has(id))) throw new Error('Saved deck choices could not be read. Existing data has been left untouched.');
    saved = {...data,picked:[...new Set([...data.picked,...data.completed])],completed:[...new Set(data.completed)]};
  }
  let saveBlocked = false;
  try {
    const preferences = JSON.parse(localStorage.getItem('cube-atlas.view.v1') || '{}');
    if(reservations[preferences.roster]) saved.roster = preferences.roster;
    readSaved();
  } catch(e) { saveBlocked = true; error(e.message); }
  function readOwnership() {
    ownership = null;
    try {
      const raw = JSON.parse(localStorage.getItem(OWNED_KEY) || 'null');
      if(!raw) return;
      if(raw.version !== 1 || !raw.counts || typeof raw.counts !== 'object' || Array.isArray(raw.counts) || Object.values(raw.counts).some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error('Invalid collection');
      ownership = {...raw,counts:new Map(Object.entries(raw.counts).map(([name,n]) => [normalize(name),n]))};
    } catch { error('Your collection could not be read. Import it again from the battlebox page.'); }
  }
  function save() {
    if(saveBlocked) return;
    try { localStorage.setItem(KEY,JSON.stringify(saved)); }
    catch { error('These deck choices are saved for this session only. Browser storage is unavailable.'); }
  }
  const ready = () => !!ownership?.full;
  function available(name) { return Math.max(0,(ownership?.counts.get(normalize(name)) || 0) - (reservations[saved.roster][name] || 0)); }
  function allocations(exclude) {
    const counts = new Map();
    for(const deck of decks) if(deck.id !== exclude && saved.picked.includes(deck.id)) for(const card of deck.cards) counts.set(card.name,(counts.get(card.name) || 0)+card.quantity);
    return counts;
  }
  function shortages(deck) {
    const others = allocations(deck.id);
    return deck.cards.map(card => ({name:card.name,quantity:Math.max(0,card.quantity - Math.max(0,available(card.name) - (others.get(card.name) || 0)))})).filter(card => card.quantity);
  }
  function hidePreview() { previewRequest++; $('preview').hidden = true; }
  function position(x,y) {
    const width = Math.min(250,innerWidth-24,(innerHeight-24)*488/680), height=width*680/488;
    $('preview').style.width = `${width}px`;
    $('preview').style.left = `${Math.max(12,Math.min(x+18+width < innerWidth ? x+18 : x-width-18,innerWidth-width-12))}px`;
    $('preview').style.top = `${Math.max(12,Math.min(y-25,innerHeight-height-12))}px`;
  }
  function preview(name,x,y) {
    hidePreview(); const request = previewRequest, image = new Image();
    image.alt = `${name} — full card`;
    image.onload = () => { if(request !== previewRequest) return; $('preview').replaceChildren(image); position(x,y); $('preview').hidden = false; };
    image.src = metadata[name].image;
  }
  function message(text) { clearTimeout(timer); $('toast').textContent = text; $('toast').hidden = false; timer = setTimeout(() => $('toast').hidden = true,4500); }
  function celebrate(deck) {
    message(saved.completed.length === saved.picked.length ? 'All your picks are ready. Time to play!' : `${deck.title} is ready to play.`);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for(let i=0;i<22;i++) {
      const star=document.createElement('span'); star.className='sparkle'; star.textContent=i%2 ? '✧' : '·';
      star.style.left=`${20+Math.random()*60}%`; star.style.top='65%'; $('sparkles').append(star);
      const animation=star.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${(Math.random()-.5)*250}px,${-100-Math.random()*250}px) rotate(${Math.random()*180}deg)`,opacity:0}],{duration:900+Math.random()*700,easing:'ease-out'});
      animation.onfinish=()=>star.remove();
    }
  }
  const colors={W:'White',U:'Blue',B:'Black',R:'Red',G:'Green'};
  const heroes=['Elenda, Saint of Dusk','Balmor, Battlemage Captain','Wardens of the Cycle','Heroic Reinforcements','Tatyova, Benthic Druid','Empyrean Eagle'];
  for(const [index,deck] of decks.entries()) {
    const node=document.createElement('article'); node.className='deck'; node.dataset.id=deck.id;
    const creatures=deck.cards.filter(c=>metadata[c.name].type.includes('Creature')).reduce((sum,c)=>sum+c.quantity,0);
    const landCount=deck.cards.filter(c=>metadata[c.name].type.includes('Land')).reduce((sum,c)=>sum+c.quantity,0);
    node.innerHTML=`<div class="deck-top"><img alt="" loading="lazy"><span class="color-label"></span></div><div class="body"><p class="theme"></p><h2></h2><p class="summary"></p><div class="stats"><span>40 cards</span><span>${creatures} creatures</span><span>${40-creatures-landCount} other spells</span><span>${landCount} lands</span></div><div class="actions"><button class="pick" type="button" aria-pressed="false">♡ Pick this deck</button><label class="done"><input type="checkbox">Completed</label></div><p class="availability"></p><details><summary>Explore deck & card list</summary><p class="plan"></p><p class="watch"></p><div class="curve" role="img"></div><p class="curve-caption">Mana value · nonland cards (6+ grouped)</p><div class="list-head"><span>Qty · card · copies available</span><button class="copy" type="button">Copy decklist</button></div><div class="card-list"></div></details></div>`;
    node.querySelector('.deck-top img').src=metadata[heroes[index]].hero;
    node.querySelector('.color-label').textContent=deck.colors.map(c=>colors[c]).join(' + ');
    for(const key of ['theme','summary','plan','watch']) node.querySelector(`.${key}`).textContent=deck[key];
    node.querySelector('h2').textContent=deck.title;
    node.querySelector('h2').id=`title-${deck.id}`; node.setAttribute('aria-labelledby',`title-${deck.id}`);
    const pick=node.querySelector('.pick'), done=node.querySelector('.done input');
    pick.setAttribute('aria-label',`Pick ${deck.title}`); done.setAttribute('aria-label',`Complete ${deck.title}`);
    pick.addEventListener('click',()=>{saved.picked=saved.picked.includes(deck.id) ? saved.picked.filter(id=>id!==deck.id) : [...saved.picked,deck.id]; save(); update();});
    done.addEventListener('change',()=>{
      if(done.checked) { if(!saved.picked.includes(deck.id)) saved.picked.push(deck.id); saved.completed.push(deck.id); }
      else saved.completed=saved.completed.filter(id=>id!==deck.id);
      save(); update(); if(done.checked) celebrate(deck);
    });
    node.querySelector('.copy').addEventListener('click',async()=>{
      const text=deck.cards.map(c=>`${c.quantity} ${c.name}`).join('\n');
      try {await navigator.clipboard.writeText(text);message(`${deck.title} copied.`);}
      catch {const blob=URL.createObjectURL(new Blob([text+'\n'],{type:'text/plain'}));const a=document.createElement('a');a.href=blob;a.download=`${deck.id}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(blob),1000);message('Clipboard unavailable. Decklist downloaded.');}
    });
    const curve=Array(6).fill(0);
    for(const c of deck.cards) if(!metadata[c.name].type.includes('Land')) curve[Math.max(0,Math.min(5,metadata[c.name].cmc-1))]+=c.quantity;
    node.querySelector('.curve').setAttribute('aria-label',curve.map((n,i)=>`${i===5?'6 or more':i+1} mana: ${n} cards`).join(', '));
    curve.forEach((n,i)=>{const bar=document.createElement('div');bar.className='curve-column';bar.innerHTML=`<span>${n}</span><div class="curve-bar" style="height:${n/Math.max(...curve)*30}px"></div><span>${i===5?'6+':i+1}</span>`;node.querySelector('.curve').append(bar);});
    for(const category of ['Creatures','Other spells','Lands']) {
      const subset=deck.cards.filter(c=>{const type=metadata[c.name].type;return category==='Lands'?type.includes('Land'):category==='Creatures'?type.includes('Creature'):!type.includes('Land')&&!type.includes('Creature');}).sort((a,b)=>metadata[a.name].cmc-metadata[b.name].cmc || a.name.localeCompare(b.name,'en'));
      const heading=document.createElement('h3');heading.className='section-label';heading.textContent=category;node.querySelector('.card-list').append(heading);
      for(const card of subset) {
        const row=document.createElement('div');row.className='card-row';row.dataset.name=card.name;
        const quantity=document.createElement('span');quantity.className='quantity';quantity.textContent=card.quantity;
        const img=document.createElement('img');img.src=metadata[card.name].thumbnail;img.alt='';img.loading='lazy';img.addEventListener('error',()=>img.style.visibility='hidden');
        const link=document.createElement('a');link.href=metadata[card.name].source;link.target='_blank';link.rel='noreferrer';link.textContent=card.name;
        const stock=document.createElement('span');stock.className='stock';
        row.append(quantity,img,link,stock);node.querySelector('.card-list').append(row);
        for(const target of [img,link]) {
          target.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')preview(card.name,e.clientX,e.clientY);});
          target.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')position(e.clientX,e.clientY);});
          target.addEventListener('pointerleave',hidePreview);
        }
        link.addEventListener('focus',()=>{if(link.matches(':focus-visible')){const b=link.getBoundingClientRect();preview(card.name,b.right,b.top);}});
        link.addEventListener('blur',hidePreview);
      }
    }
    nodes.set(deck.id,node);$('decks').append(node);
  }
  function update() {
    hidePreview();$('roster').value=saved.roster;
    $('collection-status').textContent=ready()?`Using ${ownership.source}. Ownership and battlebox checkmarks stay separate from deck completion.`:'Import your full Mythic Tools collection on the battlebox page to check remaining copies. Older imports need to be refreshed.';
    $('picked-count').textContent=saved.picked.length;$('completed-count').textContent=saved.completed.length;
    $('completion').textContent=`${saved.completed.length} / ${saved.picked.length}`;
    $('progress').max=Math.max(1,saved.picked.length);$('progress').value=saved.completed.length;
    const used=allocations(), gaps=[...used].filter(([name,n])=>n>available(name));
    const allNeed=new Map(); for(const deck of decks) for(const card of deck.cards) allNeed.set(card.name,(allNeed.get(card.name)||0)+card.quantity);
    const allFit=[...allNeed].every(([name,n])=>n<=available(name));
    $('allocation').textContent=!ready()?'Choose favorites now; availability awaits your full import.':gaps.length?`${gaps.reduce((sum,[name,n])=>sum+n-available(name),0)} copies short across your picks. See card lists.`:allFit?'All six can be built together from your remaining copies.':saved.picked.length?'Your picks fit the remaining collection.':'Pick decks to check shared copies.';
    let visible=0;
    for(const deck of decks) {
      const node=nodes.get(deck.id), picked=saved.picked.includes(deck.id), completed=saved.completed.includes(deck.id), missing=shortages(deck), others=allocations(deck.id);
      node.hidden=filter==='picked'?!picked:filter==='completed'?!completed:false;if(!node.hidden)visible++;
      node.dataset.picked=picked;node.dataset.completed=completed;
      const pick=node.querySelector('.pick'), done=node.querySelector('.done input');
      pick.setAttribute('aria-pressed',String(picked));pick.textContent=picked?'♥ Picked':'♡ Pick this deck';pick.disabled=completed || saveBlocked;pick.title=completed?'Uncheck Completed before removing this pick.':'';
      done.checked=completed;done.disabled=saveBlocked || (!completed && (!ready() || missing.length>0));
      const status=node.querySelector('.availability');status.dataset.missing=ready()&&missing.length>0;
      status.textContent=!ready()?'Import the full collection to confirm availability.':missing.length?`Need ${missing.reduce((s,c)=>s+c.quantity,0)} more copies: ${missing.map(c=>`${c.quantity} ${c.name}`).join(', ')}.`:completed?'Assembled and ready to play.':'All 40 copies available after the battlebox and other picks.';
      for(const row of node.querySelectorAll('.card-row')) {
        const name=row.dataset.name,n=Math.max(0,available(name)-(others.get(name)||0)), needed=deck.cards.find(c=>c.name===name).quantity;
        const stock=row.querySelector('.stock');stock.textContent=ready()?`${n} left`:'—';stock.dataset.missing=ready()&&n<needed;
        stock.title=ready()?`${ownership.counts.get(normalize(name))||0} owned − ${reservations[saved.roster][name]||0} reserved for battlebox − ${others.get(name)||0} for other picked decks`:'Full collection import required';
      }
    }
    $('empty').hidden=visible>0;
  }
  $('roster').addEventListener('change',e=>{saved.roster=e.target.value;save();update();});
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();}));
  window.addEventListener('storage',e=>{if(e.key===OWNED_KEY||e.key===null)readOwnership();if(e.key===KEY||e.key===null){try{saved={version:1,roster:saved.roster,picked:[],completed:[]};readSaved();saveBlocked=false;}catch(err){saveBlocked=true;error(err.message);}}update();});
  window.addEventListener('scroll',hidePreview,true);window.addEventListener('resize',hidePreview);window.addEventListener('blur',hidePreview);document.addEventListener('keydown',e=>{if(e.key==='Escape')hidePreview();});
  readOwnership();update();
})().catch(error=>{document.getElementById('error').hidden=false;document.getElementById('error').textContent='The deck page could not load. Please reload.';console.error(error);});
