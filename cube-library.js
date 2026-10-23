(function(root) {
  'use strict';
  const normalizeName = name => name.normalize('NFKC').split('//')[0].trim().replace(/[’‘]/g,"'").replace(/\s+/g,' ').toLowerCase();
  function parseCSV(text) {
    const rows = []; let row = [], field = '', quoted = false;
    text = text.replace(/^\uFEFF/,'');
    for(let i = 0; i < text.length; i++) {
      const ch = text[i];
      if(ch === '"') {
        if(quoted && text[i + 1] === '"') { field += '"'; i++; }
        else quoted = !quoted;
      } else if(!quoted && (ch === ',' || ch === '\n' || ch === '\r')) {
        row.push(field); field = '';
        if(ch !== ',') { if(row.some(value => value.trim())) rows.push(row); row = []; if(ch === '\r' && text[i + 1] === '\n') i++; }
      } else field += ch;
    }
    if(quoted) throw new Error('The CSV has an unfinished quoted field. Export it again.');
    row.push(field); if(row.some(value => value.trim())) rows.push(row);
    return rows;
  }
  function cubeSource(input) {
    let id = input.trim();
    if(/^https?:/i.test(id)) {
      const url = new URL(id);
      if(!['cubecobra.com','www.cubecobra.com'].includes(url.hostname)) throw new Error('Use a Cube Cobra URL or cube ID.');
      const match = url.pathname.match(/^\/cube\/(?:about|list|overview|blog|playtest)\/([^/]+)\/?$/);
      if(!match) throw new Error('Use the cube’s About or List URL.');
      id = match[1];
    }
    if(!/^[a-zA-Z0-9_-]{1,200}$/.test(id)) throw new Error('Use a Cube Cobra URL or cube ID.');
    return {url:`https://cubecobra.com/cube/list/${id}`,download:`https://cubecobra.com/cube/download/csv/${id}`};
  }
  const safeImage = value => {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
  };
  function parseCubeCSV(text) {
    const rows = parseCSV(text), headers = (rows.shift() || []).map(h => h.trim().toLowerCase());
    if(!['name','type','color','rarity'].every(h => headers.includes(h))) throw new Error('Choose Cube Cobra’s CSV export (name, Type, Color and Rarity columns). Collection CSVs belong in Import collection CSV.');
    const get = (row,key) => (row[headers.indexOf(key)] || '').trim();
    const grouped = new Map(); let total = 0;
    for(const [index,row] of rows.entries()) {
      const board = get(row,'board').toLowerCase();
      if((board && board !== 'mainboard') || get(row,'maybeboard').toLowerCase() === 'true') continue;
      const name = get(row,'name').split('//')[0].trim(), rawQuantity = get(row,'quantity') || get(row,'count') || '1';
      if(!name || name.length > 200 || !/^\d+$/.test(rawQuantity) || !Number.isSafeInteger(+rawQuantity) || +rawQuantity < 1) throw new Error(`Check the name and quantity on CSV row ${index + 2}.`);
      total += +rawQuantity;
      if(total > 5000) throw new Error('Import up to 5,000 mainboard copies at a time.');
      const key = normalizeName(name), previous = grouped.get(key);
      if(previous) { previous.quantity += +rawQuantity; continue; }
      const colors = [...new Set(get(row,'color').toUpperCase().replace(/[^WUBRG]/g,''))];
      const color = /\bland\b/i.test(get(row,'type')) ? 'lands' : colors.length > 1 ? 'multicolored' : ({W:'white',U:'blue',B:'black',R:'red',G:'green'}[colors[0]] || 'colorless');
      const rarity = {common:'Common',uncommon:'Uncommon',rare:'Rare',mythic:'Mythic','mythic rare':'Mythic'}[get(row,'rarity').toLowerCase()] || 'Other';
      grouped.set(key,{name,quantity:+rawQuantity,color,rarity,image:safeImage(get(row,'image url'))});
    }
    if(!total) throw new Error('The CSV has no mainboard cards. Nothing was imported.');
    return [...grouped.values()];
  }
  function validateCube(cube) {
    if(!cube || typeof cube.id !== 'string' || !/^(?:hobbit|import-[a-zA-Z0-9-]+)$/.test(cube.id) || typeof cube.name !== 'string' || !cube.name.trim() || cube.name.length > 120 || !Array.isArray(cube.cards) || !cube.cards.length) throw new Error('Invalid saved cube.');
    let total = 0; const names = new Set();
    for(const card of cube.cards) {
      if(!card || typeof card.name !== 'string' || !card.name.trim() || card.name.length > 200 || !Number.isSafeInteger(card.quantity) || card.quantity < 1 || !['white','blue','black','red','green','colorless','multicolored','lands'].includes(card.color) || !['Common','Uncommon','Rare','Mythic','Other'].includes(card.rarity) || names.has(normalizeName(card.name))) throw new Error('Invalid saved cube card.');
      names.add(normalizeName(card.name)); total += card.quantity;
    }
    if(total > 5000) throw new Error('A cube exceeds 5,000 copies.');
    return {...cube,source:cube.source ? cubeSource(cube.source).url : '',cards:cube.cards.map(card => ({...card,image:safeImage(card.image),art:safeImage(card.art)}))};
  }
  function makeCards(cube) {
    return cube.cards.flatMap(card => Array.from({length:card.quantity},(_,i) => ({...card,id:`${cube.id}:${encodeURIComponent(normalizeName(card.name))}:${i+1}`,copy:i+1,copies:card.quantity}))).sort((a,b) => a.name.localeCompare(b.name,'en') || a.copy-b.copy);
  }
  const api = {normalizeName,parseCSV,cubeSource,parseCubeCSV,validateCube,makeCards};
  if(typeof module !== 'undefined') module.exports = api;
  else root.CubeLibrary = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
