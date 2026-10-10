import {readFile,writeFile,mkdir,access,unlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url), metadata=JSON.parse(await readFile(new URL('data/deck-cards.json',root),'utf8'));
const heroes=new Set(['Elenda, Saint of Dusk','Balmor, Battlemage Captain','Wardens of the Cycle','Heroic Reinforcements','Tatyova, Benthic Druid','Empyrean Eagle']);
const slug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
await mkdir(new URL('assets/decks/',root),{recursive:true});
for(const [name,card] of Object.entries(metadata)) {
  const existing=`assets/cards/${slug(name)}.jpg`;
  try {await access(new URL(existing,root));card.thumbnail=existing;} catch {card.thumbnail=`assets/decks/${slug(name)}.jpg`;}
  if(heroes.has(name)) card.hero=`assets/decks/hero-${slug(name)}.jpg`;
  for(const [target,size] of [[card.thumbnail,112],...(card.hero?[[card.hero,640]]:[])]) {
    try {await access(new URL(target,root));continue;} catch {}
    const response=await fetch(card.art,{headers:{'User-Agent':'CubeAtlas/1.0'}});if(!response.ok)throw new Error(`${name}: ${response.status}`);
    const temp=new URL(target+'.tmp.jpg',root);await writeFile(temp,Buffer.from(await response.arrayBuffer()));
    execFileSync('sips',['-Z',String(size),temp.pathname,'--out',new URL(target,root).pathname],{stdio:'ignore'});await unlink(temp);
  }
}
await writeFile(new URL('data/deck-cards.json',root),JSON.stringify(metadata,null,2)+'\n');
console.log('Local deck thumbnails and six banner images ready.');
