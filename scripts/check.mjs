import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(join(root, 'index.html'), 'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const catalog = vm.runInNewContext(html.match(/const CATALOG = ([\s\S]*?);\s*const KEY/)[1]);
const expected = [[3,13,7,2],[10,9,5,1],[8,12,4,1],[12,9,3,1],[10,8,6,1],[4,7],[1,10,8,2],[11,1,11]];
const names = [];
catalog.forEach((column, i) => {
  const groups = Object.values(column.groups).map(list => list.split('|'));
  assert.deepEqual(Array.from(groups, group => group.length), expected[i], `${column.name} rarity counts must match the reference`);
  names.push(...groups.flat());
});
assert.equal(names.length, 180);
assert.equal(new Set(names).size, 180);
const reference = (await readFile(join(root, 'docs/180FoundationsStarterCollection.txt'), 'utf8')).split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
assert.deepEqual(names, reference, 'Catalog must match the supplied decklist exactly, in order');
const booster = vm.runInNewContext('(' + html.match(/const PLAY_BOOSTER = ([\s\S]*?);\s*const slug/)[1] + ')');
const evidence = JSON.parse(await readFile(join(root, 'docs/play-booster-verification.json'), 'utf8'));
assert.deepEqual(new Set(Object.keys(booster.retained)),new Set(names.filter(name => evidence.cards.some(card => card.name === name && card.booster))), 'Retain every original card available in the booster pool');
const boosterNames = [...Object.keys(booster.retained),...booster.suggestions.map(card => card.name)];
assert.equal(boosterNames.length, 180);
assert.equal(new Set(boosterNames).size, 180, 'Play Booster roster is singleton');
assert.deepEqual(new Set(booster.suggestions.map(card => card.replaces)),new Set(names.filter(name => !Object.hasOwn(booster.retained,name))), 'Every excluded card has a replacement');
assert.equal(booster.suggestions.length, 110);
for(const name of boosterNames) {
  const verified = evidence.cards.find(card => card.name === name);
  assert(verified && verified.booster && verified.set === 'fdn', `${name} must be available in Foundations boosters`);
  assert(Number(verified.collectorNumber) <= 291, `${name} has a main-set printing, not only a Collector treatment`);
  const suggestion = booster.suggestions.find(card => card.name === name);
  assert.equal(suggestion?.rarity || booster.retained[name],verified.rarity, `${name} uses its booster printing rarity`);
  if(suggestion) { assert.equal(suggestion.color,verified.color); assert(suggestion.reason); assert(!names.includes(name)); }
}
names.push(...booster.suggestions.map(card => card.name));
for (const name of new Set(names)) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  await access(join(root, 'assets/cards', `${slug}.jpg`));
}
const credits = JSON.parse(await readFile(join(root, 'docs/art-credits.json'), 'utf8'));
assert.deepEqual(new Set(credits.map(card => card.name)), new Set(names), 'Scryfall verified every name');
console.log(`Valid JavaScript; original list unchanged; 180-card booster roster with 70 retained and 110 verified unique replacements; ${new Set(names).size} local thumbnails.`);
