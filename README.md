# Cube Atlas

A minimalist tracker for the 180-card Foundations Starter Collection cube in [the supplied decklist](docs/180FoundationsStarterCollection.txt), grouped by color and rarity to match [the reference image](docs/cube-reference.png).

Live site: https://hugobessa.com.br/cube-atlas/

Check off individual copies as you add them to the cube. Each rarity group, color column, and the full cube has its own completion celebration. Small card-art thumbnails ship with the site. Search and filter by color or inclusion status; completion always measures the full collection.

Hover over a thumbnail to see the full card floating beside your pointer. Keyboard focus on a card's checkbox also shows its preview; Escape dismisses it. Full card images load from Scryfall on demand. Color headings and their progress bars stay visible as you scroll through each column.

## Run

```sh
python3 -m http.server
```

Open http://localhost:8000. The battlebox app lives in `index.html`; `decks.html` is the companion deck planner. Both run without a bundler or runtime dependencies. GitHub Pages serves `main` from the repository root.

## Progress

Progress stays in this browser under `cube-atlas.progress.v1`. It does not sync between devices. Use **Back up progress** and **Restore backup** to transfer it. Each card has a stable ID; the reference's rarity groups are preserved regardless of a card's current printing. Reduced-motion preferences disable decorative animations.

The runtime catalog lives in `index.html`. Its column totals are 25 white, 25 blue, 25 black, 25 red, 25 green, 11 colorless, 21 multicolored, and 23 lands. The catalog check verifies every card against the supplied text file, in order.

## Ownership and buy lists

Use **Import collection CSV** with a Mythic Tools export. English names match across sets, languages, and finishes; repeated rows add their quantities. The full name-and-quantity collection is stored locally so the leftover-deck page can also use cards outside the battlebox. The stacked-card icon beside a name shows how many copies you own. Importing replaces the previous ownership snapshot and leaves every included checkbox unchanged.

Ownership stays in this browser under `cube-atlas.owned.v1`; the CSV and your collection are never uploaded. Keep the CSV to import on another device. **Back up progress** continues to back up included checkboxes only. Reimport a newer CSV to refresh ownership.

**Buy list** opens an alphabetized, quantity-based list for the full selected roster, regardless of filters or hidden suggestions. For each name, the amount to buy is `required − max(owned, included)`, floored at zero. Included copies may already be part of the imported collection, so those counts are not added together. Duplicate lands can require a second copy. Copy or download the resulting decklist; completion still depends only on included checkboxes.

## Play Booster alternative

The **Original list** tab preserves the supplied list. **Play Boosters** builds a separate 180-card Foundations roster from 70 eligible original cards and 110 suggested replacements. Each suggestion names the card it replaces; hover its row for the reasoning. Suggestions match roles where possible, but mana costs, rarity, and power can differ. This is a starting point for playtesting, not a tested balance claim.

The alternative preserves all original column counts: 25 in each single color, 11 colorless, 21 multicolored, and 23 lands. Each Temple is replaced with a second copy of the booster dual land in the same colors, with independent checkboxes labeled 1/2 and 2/2. Other cards remain singleton. Cards are grouped by their actual booster-printing rarity. In particular, Bushwhack is common in boosters even though the original reference groups it as uncommon.

**Show suggested cards** changes visibility only: hidden suggestions still count toward the 180-card target. Checkmarks for shared cards carry between tabs. Original-only cards and replacements remain independent, and progress, group milestones, and completion celebrations use the selected roster. Existing progress and version 1 backups remain compatible; backups now include checked cards from both rosters. Tab and visibility preferences use `cube-atlas.view.v1` separately from collection data.

Eligibility was checked against Scryfall's Foundations booster pool and [Wizards' product guide](https://magic.wizards.com/en/news/feature/collecting-foundations). [Verification metadata](docs/play-booster-verification.json) records the chosen printings and date. `PLAY_BOOSTER` in the HTML contains the retained cards and suggested changes; it does not alter the original catalog. No Special Guests or Collector-only treatments are required.

## Check or refresh art

```sh
node scripts/check.mjs
# Optional, on macOS with Node 22+ and sips:
node scripts/fetch-art.mjs
```

For browser checks, serve the app on port 8766, install Playwright locally (`npm install --no-save --package-lock=false playwright`), and run `node scripts/browser-check.cjs`. It uses installed Chrome by default. Override `CUBE_URL` or `BROWSER_CHANNEL` as needed. Tests use an isolated browser context and never change your saved collection.

Run `node scripts/ownership-check.cjs` for CSV import, ownership, and buy-list checks. Optional `COLLECTION_CSV` checks a local export without adding it to the repository.

The art script verifies exact names through Scryfall's collection API, downloads 112-pixel thumbnails, and records source URLs and artist credits in [docs/art-credits.json](docs/art-credits.json). It reads the catalog from the HTML; it does not maintain a second card list.

Card imagery is provided by [Scryfall](https://scryfall.com). Magic: The Gathering and its artwork belong to Wizards of the Coast and their respective artists. Cube Atlas is an independent fan project.

## Leftover decks

[Leftover decks](https://hugobessa.com.br/cube-atlas/decks.html) proposes six casual two-color decks, each with 23 nonland cards and 17 lands: white/black life gain, blue/red spells, black/green sacrifice, red/white tokens, green/blue ramp and landfall, and white/blue flyers. They were checked together against the supplied collection after reserving the complete Play Boosters battlebox. Card quantities, basics, mana costs, and text were checked using Scryfall; the shapes follow [Wizards’ Foundations deckbuilding guidance](https://magic.wizards.com/en/news/feature/foundations-prerelease-guide). Relative power still needs playtesting.

Pick favorites, inspect each strategy and mana curve, copy the 40-card lists, and check decks as completed once assembled. Choices and completion use `cube-atlas.decks.v1`, independently of battlebox checkmarks. Completion automatically picks a deck; uncheck completion before removing a pick. Completion is unavailable when known copies are short, but previously completed decks can always be unchecked. Updated imports can flag a shortage without silently discarding completion history.

Availability subtracts the full chosen battlebox roster and every other picked deck from the imported quantities. Checking more battlebox cards never changes that reservation. The page starts with the current battlebox roster, then remembers its own reservation selector. Imported basic lands are counted; an unlimited basic-land supply is not assumed. All collection data stays in the browser. Older ownership imports need one reimport to capture non-battlebox cards; the import keeps included checkboxes unchanged.

`data/deck-proposals.json` is the authored list of six decks, and `data/deck-cards.json` contains their Scryfall metadata. Local art uses existing battlebox thumbnails plus `assets/decks/`; `node scripts/fetch-deck-art.mjs` refreshes missing images on macOS with `sips`. `data/battlebox-reservations.json` is generated from the canonical rosters in `index.html`, not independently edited. After a roster change, run `node scripts/deck-reservations.mjs`; `--check` verifies it is current. Run `node scripts/decks-check.cjs` with the local server on port 8766 for deck math, allocations, persistence, previews, and browser interactions. `COLLECTION_CSV` optionally verifies that all six decks fit a local collection, without publishing it.
