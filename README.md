[![make.fun badge](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/mroisxyz/spot-the-gap/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/mroisxyz/spot-the-gap/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

# Spot the Gap

An original spot-the-difference game for the [make.fun best spot the difference game bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451).

Three hand-built picture puzzles — **Lantern Canal**, **Orchard Station** and **Tide Pools** — each drawn twice from a seeded procedural scene. Seven changes hide in each copy: a colour, a missing object, a moved detail, a different count. Find them by clicking the right-hand picture; found spots ring on both panels while the remaining counter ticks down. A clock adds pressure, wrong clicks are counted, and two hints per scene will point at one still-hidden spot.

The pictures are pure canvas geometry: gradients, layers and a deterministic grain. No images, fonts, sounds, libraries or network requests. Mouse and keyboard both play: arrows move the crosshair, Enter/Space marks it, `H` hints, `N` changes scene, `R` restarts.

For a screenshot-ready state, combine `?scene=1|2|3`, `?demo=play` (three differences already found) and `?hint=1` (one hint glowing), e.g. `?scene=2&demo=play&hint=1`.

## Run it

```
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. To build the hand-in locally:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

Made for [make.fun](https://make.fun/?ref=jhbwqchj&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451).
