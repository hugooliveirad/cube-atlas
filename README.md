# Cube Atlas

A minimalist tracker for the 180-card Foundations Starter Collection cube in [the supplied decklist](docs/180FoundationsStarterCollection.txt), grouped by color and rarity to match [the reference image](docs/cube-reference.png).

Live site: https://hugobessa.com.br/cube-atlas/

Check off individual copies as you add them to the cube. Each rarity group, color column, and the full cube has its own completion celebration. Small card-art thumbnails ship with the site. Search and filter by color or inclusion status; completion always measures the full collection.

Hover over a thumbnail to see the full card floating beside your pointer. Keyboard focus on a card's checkbox also shows its preview; Escape dismisses it. Full card images load from Scryfall on demand. Color headings and their progress bars stay visible as you scroll through each column.

## Run

```sh
python3 -m http.server
```

Open http://localhost:8000. The app lives in one `index.html`, without a build step or runtime dependencies. GitHub Pages serves `main` from the repository root.

## Progress

Progress stays in this browser under `cube-atlas.progress.v1`. It does not sync between devices. Use **Back up progress** and **Restore backup** to transfer it. Each card has a stable ID; the reference's rarity groups are preserved regardless of a card's current printing. Reduced-motion preferences disable decorative animations.

The runtime catalog lives in `index.html`. Its column totals are 25 white, 25 blue, 25 black, 25 red, 25 green, 11 colorless, 21 multicolored, and 23 lands. The catalog check verifies every card against the supplied text file, in order.

## Play Booster alternative

The **Original list** tab preserves the supplied list. **Play Boosters** builds a separate 180-card Foundations roster from 70 eligible original cards and 110 suggested replacements. Each suggestion names the card it replaces; hover its row for the reasoning. Suggestions match roles where possible, but mana costs, rarity, and power can differ. This is a starting point for playtesting, not a tested balance claim.

The alternative remains singleton. Foundations boosters have fewer distinct nonbasic lands than the original list, so nine land slots become additional spells. Cards are grouped by their actual booster-printing rarity. In particular, Bushwhack is common in boosters even though the original reference groups it as uncommon.

**Show suggested cards** changes visibility only: hidden suggestions still count toward the 180-card target. Checkmarks for shared cards carry between tabs. Original-only cards and replacements remain independent, and progress, group milestones, and completion celebrations use the selected roster. Existing progress and version 1 backups remain compatible; backups now include checked cards from both rosters. Tab and visibility preferences use `cube-atlas.view.v1` separately from collection data.

Eligibility was checked against Scryfall's Foundations booster pool and [Wizards' product guide](https://magic.wizards.com/en/news/feature/collecting-foundations). [Verification metadata](docs/play-booster-verification.json) records the chosen printings and date. `PLAY_BOOSTER` in the HTML contains the retained cards and suggested changes; it does not alter the original catalog. No Special Guests or Collector-only treatments are required.

## Check or refresh art

```sh
node scripts/check.mjs
# Optional, on macOS with Node 22+ and sips:
node scripts/fetch-art.mjs
```

For browser checks, serve the app on port 8766, install Playwright locally (`npm install --no-save --package-lock=false playwright`), and run `node scripts/browser-check.cjs`. It uses installed Chrome by default. Override `CUBE_URL` or `BROWSER_CHANNEL` as needed. Tests use an isolated browser context and never change your saved collection.

The art script verifies exact names through Scryfall's collection API, downloads 112-pixel thumbnails, and records source URLs and artist credits in [docs/art-credits.json](docs/art-credits.json). It reads the catalog from the HTML; it does not maintain a second card list.

Card imagery is provided by [Scryfall](https://scryfall.com). Magic: The Gathering and its artwork belong to Wizards of the Coast and their respective artists. Cube Atlas is an independent fan project.
