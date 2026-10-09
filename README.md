# Cube Atlas

A minimalist tracker for the 180-card Foundations Starter Collection cube in [the supplied decklist](docs/180FoundationsStarterCollection.txt), grouped by color and rarity to match [the reference image](docs/cube-reference.png).

Live site: https://hugobessa.com.br/cube-atlas/

Check off individual copies as you add them to the cube. Each rarity group, color column, and the full cube has its own completion celebration. Small card-art thumbnails ship with the site. Search and filter by color or inclusion status; completion always measures the full collection.

## Run

```sh
python3 -m http.server
```

Open http://localhost:8000. The app lives in one `index.html`, without a build step or runtime dependencies. GitHub Pages serves `main` from the repository root.

## Progress

Progress stays in this browser under `cube-atlas.progress.v1`. It does not sync between devices. Use **Back up progress** and **Restore backup** to transfer it. Each card has a stable ID; the reference's rarity groups are preserved regardless of a card's current printing. Reduced-motion preferences disable decorative animations.

The runtime catalog lives in `index.html`. Its column totals are 25 white, 25 blue, 25 black, 25 red, 25 green, 11 colorless, 21 multicolored, and 23 lands. The catalog check verifies every card against the supplied text file, in order.

## Check or refresh art

```sh
node scripts/check.mjs
# Optional, on macOS with Node 22+ and sips:
node scripts/fetch-art.mjs
```

For browser checks, serve the app on port 8766, install Playwright locally (`npm install --no-save --package-lock=false playwright`), and run `node scripts/browser-check.cjs`. It uses installed Chrome by default. Override `CUBE_URL` or `BROWSER_CHANNEL` as needed. Tests use an isolated browser context and never change your saved collection.

The art script verifies exact names through Scryfall's collection API, downloads 112-pixel thumbnails, and records source URLs and artist credits in [docs/art-credits.json](docs/art-credits.json). It reads the catalog from the HTML; it does not maintain a second card list.

Card imagery is provided by [Scryfall](https://scryfall.com). Magic: The Gathering and its artwork belong to Wizards of the Coast and their respective artists. Cube Atlas is an independent fan project.
