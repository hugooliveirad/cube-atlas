import { readFile, writeFile, mkdir, mkdtemp, rm, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(join(root, 'index.html'), 'utf8');
const catalog = vm.runInNewContext(html.match(/const CATALOG = ([\s\S]*?);\s*const KEY/)[1]);
const booster = vm.runInNewContext('(' + html.match(/const PLAY_BOOSTER = ([\s\S]*?);\s*const slug/)[1] + ')');
const names = [...new Set([...catalog.flatMap(column => Object.values(column.groups).flatMap(list => list.split('|'))),...booster.suggestions.map(card => card.name)])];
const slug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const headers = { 'User-Agent': 'CubeAtlas/1.0 (github.com/hugooliveirad/cube-atlas)', Accept: 'application/json', 'Content-Type': 'application/json' };
const cards = [];
for (let i = 0; i < names.length; i += 75) {
  const response = await fetch('https://api.scryfall.com/cards/collection', {
    method: 'POST', headers, body: JSON.stringify({ identifiers: names.slice(i, i + 75).map(name => ({ name, set: 'fdn' })) })
  });
  if (!response.ok) throw new Error(`Scryfall: ${response.status}`);
  const data = await response.json();
  if (data.not_found.length) throw new Error(`Unknown cards: ${JSON.stringify(data.not_found)}`);
  cards.push(...data.data);
  await new Promise(resolve => setTimeout(resolve, 150));
}
await mkdir(join(root, 'assets/cards'), { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'cube-atlas-art-'));
const credits = [];
const previous = JSON.parse(await readFile(join(root, 'docs/art-credits.json'), 'utf8').catch(() => '[]'));
try {
  for (const card of cards) {
    const existing = previous.find(credit => credit.name === card.name);
    if (existing && await access(join(root, existing.file)).then(() => true, () => false)) {
      credits.push(existing);
      continue;
    }
    const url = (card.image_uris || card.card_faces?.[0]?.image_uris)?.art_crop;
    if (!url) throw new Error(`Missing art: ${card.name}`);
    const response = await fetch(url, { headers: { 'User-Agent': headers['User-Agent'], Accept: 'image/*' } });
    if (!response.ok) throw new Error(`Art for ${card.name}: ${response.status}`);
    const source = join(temp, 'source.jpg');
    await writeFile(source, Buffer.from(await response.arrayBuffer()));
    const file = `assets/cards/${slug(card.name)}.jpg`;
    execFileSync('sips', ['--resampleHeightWidthMax', '112', '--setProperty', 'format', 'jpeg', '--setProperty', 'formatOptions', '75', source, '--out', join(root, file)], { stdio: 'ignore' });
    credits.push({ name: card.name, artist: card.artist, source: card.scryfall_uri, image: url, file });
    process.stdout.write(`\rDownloaded ${credits.length}/${cards.length} thumbnails`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  await writeFile(join(root, 'docs/art-credits.json'), JSON.stringify(credits, null, 2) + '\n');
  for (const old of previous) {
    if (!names.includes(old.name)) await rm(join(root, old.file), { force: true });
  }
  console.log('\nAll card names verified with Scryfall.');
} finally {
  await rm(temp, { recursive: true, force: true });
}
