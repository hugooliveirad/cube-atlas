# Cube Atlas

A browser-based workbench for buying and organizing Magic cubes. Includes the Foundations **Original list**, Foundations **Play Boosters**, and [The Hobbit: Set Twobert](https://cubecobra.com/cube/list/270edd29-666f-4ca1-9661-f5ea7d204d92) (180 copies, 130 card names). Choose a cube, import your collection, then track each copy as you acquire it and put it in the cube.

Live site: https://hugobessa.com.br/cube-atlas/

The compact layout uses plain backgrounds, blue links, bordered color columns and sticky column headings. Search, color filters and checklist status only change visibility; totals always measure the selected cube. Hover card art or focus a checkbox to preview a card when an image is available. Reduced-motion preferences disable decorative animations.

## Import from Cube Cobra

1. Select **Import from Cube Cobra**. Paste the cube’s About/List URL or its ID and select **Get CSV link**.
2. Download the CSV from the supplied link, then upload or drop it into the file field. You can also paste Cube Cobra CSV directly; the URL is optional.
3. Name the cube and select **Preview import**. Check the mainboard count and sample cards, then select **Add cube**.

Cube Cobra’s CSV endpoint does not currently allow cross-origin browser fetches. The download-and-upload flow works on GitHub Pages without a server or third-party proxy. The CSV stays in your browser. Imports retain colors, rarities and duplicate quantities, ignore maybeboard/basic-land-supply rows, and start with independent checkmarks. Basic lands explicitly listed in the mainboard are included. Every import creates a separate cube, even if the source URL is the same. Use **Remove imported cube** to remove one; built-in cubes cannot be removed. Imported cards without custom image URLs use a placeholder.

`data/hobbit.json` is the bundled snapshot retrieved on October 22, 2026 from the linked Cube Cobra mainboard. All 130 card names and printing IDs were verified through Scryfall; image URLs and artist credits accompany the entries. Import a fresh CSV as a separate cube to track a later revision. The two Foundations rosters remain canonical in `index.html`.

## Run

```sh
python3 -m http.server
```

Open http://localhost:8000. The battlebox app lives in `index.html`; `decks.html` is the companion deck planner. Both run without a bundler or third-party runtime dependencies. Cube CSV parsing lives in `cube-library.js`, and the workbench styles live in `cube-atlas.css`. GitHub Pages serves `main` from the repository root.

## Buying, organizing and collection ownership

Use **Import collection CSV** with a Mythic Tools export. Quantities add across sets, languages, finishes and containers. English names are matched case-insensitively with normalized punctuation and adventure names (`Card // Adventure` matches `Card`). The full collection remains available to the leftover-deck planner. An import replaces the ownership snapshot and leaves checklist progress unchanged. No collection data is uploaded.

- **Buy cards** shows imported, acquired and already-organized copies as covered. Check a missing copy when you acquire it. The remaining buy list updates immediately. Imported and organized copies cannot be unchecked here; change the collection snapshot or organizing checklist instead.
- **Organize cards** checks each physical copy into the selected cube. Buying never automatically checks a card into the cube. The stacked-card indicator shows how many copies your CSV contains.
- **Buy list** copies or downloads `quantity English card name`, one line per name, suitable for LigaMagic. It covers the full cube even when search filters or suggested cards are hidden. It also works before importing a collection.

Buying tracks a coverage checkpoint: when you check a purchase, the already-covered copies of that name are retained with it. A newer CSV overlaps that checkpoint rather than adding those copies again. You can undo acquisition checkmarks where the collection and organized copies do not already cover them. If your collection later shrinks, historical buying/organizing marks remain until you undo them. Coverage is calculated independently for each cube; this is not an allocation system reserving inventory across every cube at once.

## Saved progress and backups

Progress stays in this browser and does not sync between devices. **Back up progress** saves a version 2 JSON file containing imported cubes plus buying and organizing checkmarks. **Restore backup** restores those together. Version 1 progress backups remain supported and change only organizing progress. The collection CSV is still separate: keep it and import it on another device.

Existing organizing progress keeps `cube-atlas.progress.v1` and its stable copy IDs. `cube-atlas.owned.v1` keeps the collection snapshot, `cube-atlas.view.v1` keeps view preferences, and `cube-atlas.library.v1` stores imported cubes and acquisition coverage. Updates synchronize between open tabs. Storage failures are reported; download a backup before closing a session that could not be saved.

Shared Foundations cards retain the existing shared checkmarks between Original list and Play Boosters. Original-only cards and replacements remain independent. Hobbit and imported cubes have their own copy IDs, so checking them does not change either Foundations variant. The original Foundations column totals remain 25 white, 25 blue, 25 black, 25 red, 25 green, 11 colorless, 21 multicolored, and 23 lands.

## Play Booster alternative

The **Original list** tab preserves the supplied list. **Play Boosters** builds a separate 180-card Foundations roster from 70 eligible original cards and 110 suggested replacements. Each suggestion names the card it replaces; hover its row for the reasoning. Suggestions match roles where possible, but mana costs, rarity, and power can differ. This is a starting point for playtesting, not a tested balance claim.

The alternative preserves all original column counts: 25 in each single color, 11 colorless, 21 multicolored, and 23 lands. Each Temple is replaced with a second copy of the booster dual land in the same colors, with independent checkboxes labeled 1/2 and 2/2. Other cards remain singleton. Cards are grouped by their actual booster-printing rarity. In particular, Bushwhack is common in boosters even though the original reference groups it as uncommon.

**Show suggested cards** changes visibility only: hidden suggestions still count toward the 180-card target. Checkmarks for shared cards carry between tabs. Original-only cards and replacements remain independent, and progress, group milestones, and completion celebrations use the selected roster. Existing progress and version 1 backups remain compatible; new backups include all cubes and both checklists. Tab and visibility preferences use `cube-atlas.view.v1` separately from collection data.

Eligibility was checked against Scryfall's Foundations booster pool and [Wizards' product guide](https://magic.wizards.com/en/news/feature/collecting-foundations). [Verification metadata](docs/play-booster-verification.json) records the chosen printings and date. `PLAY_BOOSTER` in the HTML contains the retained cards and suggested changes; it does not alter the original catalog. No Special Guests or Collector-only treatments are required.

## Check or refresh art

```sh
node scripts/check.mjs
# Optional, on macOS with Node 22+ and sips:
node scripts/fetch-art.mjs
```

For browser checks, serve the app on port 8766, install Playwright locally (`npm install --no-save --package-lock=false playwright`), and run `node scripts/browser-check.cjs`. It uses installed Chrome by default. Override `CUBE_URL` or `BROWSER_CHANNEL` as needed. Tests use an isolated browser context and never change your saved collection.

Run `node scripts/ownership-check.cjs` for CSV import, ownership, and buy-list checks. Run `node scripts/library-check.cjs` for Cube Cobra imports, duplicate quantities, adventure-name matching, buying/organizing overlap, cube isolation, complete backups, keyboard use and responsive borders. Optional `COLLECTION_CSV` checks a local export without adding it to the repository.

The art script verifies exact names through Scryfall's collection API, downloads 112-pixel thumbnails, and records source URLs and artist credits in [docs/art-credits.json](docs/art-credits.json). It reads the catalog from the HTML; it does not maintain a second card list.

Card imagery is provided by [Scryfall](https://scryfall.com). Magic: The Gathering and its artwork belong to Wizards of the Coast and their respective artists. Cube Atlas is an independent fan project.

## Leftover decks

[Leftover decks](https://hugobessa.com.br/cube-atlas/decks.html) proposes six casual two-color decks, each with 23 nonland cards and 17 lands: white/black life gain, blue/red spells, black/green sacrifice, red/white tokens, green/blue ramp and landfall, and white/blue flyers. They were checked together against the supplied collection after reserving the complete Play Boosters battlebox. Card quantities, basics, mana costs, and text were checked using Scryfall; the shapes follow [Wizards’ Foundations deckbuilding guidance](https://magic.wizards.com/en/news/feature/foundations-prerelease-guide). Relative power still needs playtesting.

Pick favorites, inspect each strategy and mana curve, copy the 40-card lists, and check decks as completed once assembled. Choices and completion use `cube-atlas.decks.v1`, independently of battlebox checkmarks. Completion automatically picks a deck; uncheck completion before removing a pick. Completion is unavailable when known copies are short, but previously completed decks can always be unchecked. Updated imports can flag a shortage without silently discarding completion history.

Availability subtracts the full chosen battlebox roster and every other picked deck from the imported quantities. Checking more battlebox cards never changes that reservation. The page starts with the current battlebox roster, then remembers its own reservation selector. Imported basic lands are counted; an unlimited basic-land supply is not assumed. All collection data stays in the browser. Older ownership imports need one reimport to capture non-battlebox cards; the import keeps included checkboxes unchanged.

`data/deck-proposals.json` is the authored list of six decks, and `data/deck-cards.json` contains their Scryfall metadata. Local art uses existing battlebox thumbnails plus `assets/decks/`; `node scripts/fetch-deck-art.mjs` refreshes missing images on macOS with `sips`. `data/battlebox-reservations.json` is generated from the canonical rosters in `index.html`, not independently edited. After a roster change, run `node scripts/deck-reservations.mjs`; `--check` verifies it is current. Run `node scripts/decks-check.cjs` with the local server on port 8766 for deck math, allocations, persistence, previews, and browser interactions. `COLLECTION_CSV` optionally verifies that all six decks fit a local collection, without publishing it.
