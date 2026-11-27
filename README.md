[![make.fun · news-image-20261127](https://make.fun/badge/news-image-20261127.svg)](https://make.fun/bounty/news-image-20261127?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)
[![rank](https://make.fun/badge/news-image-20261127/suchonamehzabin8-maker/news-image-20261127/rank.svg)](https://make.fun/bounty/news-image-20261127/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)
[![reward](https://make.fun/badge/news-image-20261127/suchonamehzabin8-maker/news-image-20261127/reward.svg)](https://make.fun/bounty/news-image-20261127?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261127)

# The World Today — Friday, 27 November 2026

A one-page newspaper front page summing up the world news of Friday
27 November 2026, drawn pixel by pixel by `main.ts` (Node 22, standard
library only) into a deterministic 1024×1024 PNG.

Lead story: President Donald Trump said he told Vladimir Putin to pull
back Russia's military aggression across Europe. Also on the page: the
Thanksgiving storm that cut power to 724,000 on the US East Coast, the
Houthi claim of a strike on Saudi Arabia's largest refinery (Brent crude
near $97), Spain's Pablo Hernandez de Cos chosen as the next ECB
president, and President Zelensky's warning of a new Russian mass
strike — plus a ticker of the day's other news.

Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Running it twice writes byte-identical `entry.png`.
