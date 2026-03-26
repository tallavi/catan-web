# catan-web

A single-page application built with React that acts as a **fair dice** for the board game _Settlers of Catan_.

My family and I play Catan constantly, but we hate unfair dice. I built this to make the game less luck-based and more strategic: results are drawn from a predetermined, balanced set instead of random rolls. The game is still partly luck-based, since the _order_ in which those results appear remains random.

The project started as a Python CLI tool. I later decided to port it to a web app to improve my hands-on experience with this stack and to level up my AI-assisted development workflow.

**Use it now:** [catan.tallavi.dev](https://catan.tallavi.dev)

## Technologies

- **React** 19 + **TypeScript**
- **Vite** (build tool)
- **Material UI (MUI)** + **Emotion** (UI and styling)
- **Vitest** (testing)
- **ESLint** (linting)

## Roadmap

☑ **Player setup** — Set player names and playing order.  
☑ **Blocked results** — Exclude specific dice outcomes (e.g. 2 and/or 12) when they’re invalid for your game.  
☑ **Pause / resume** — Pause and resume the game without losing state.  
☑ **Free throws** — Roll the dice outside of normal turns (e.g. for testing or casual rolls).  
☑ **Timing & stats** — Track turn times, total game time, and statistics (longest/shortest/average turn duration).  
☑ **Predetermined results** — Set specific dice results in advance (e.g. for the Alchemist card in _Cities and Knights_).  
☑ **Cities and Knights** — Events cube randomization and pirate track status.  
☑ **Turn history** — View the history of previous turns.  
☑ **Import/export game** — Save game to and load game from a json file.

☐ **Settings**  
&nbsp;&nbsp;&nbsp;&nbsp;☐ Light/dark mode  
&nbsp;&nbsp;&nbsp;&nbsp;☐ Show/hide Cities and Knights–related elements  
☐ **Server-side with authentication**  
&nbsp;&nbsp;&nbsp;&nbsp;☐ Continue the same game from another device  
&nbsp;&nbsp;&nbsp;&nbsp;☐ History of your games  
☐ **More ideas?** — [Open an issue](https://github.com/tallavi/catan-web/issues) to suggest features.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build   # production build
npm run test    # run tests
```

## Frequently asked questions

**What if I want to undo a turn?**  
I deliberately avoided making undo easy. If you need to remove a turn, pause the game, then use your browser’s developer tools to edit the relevant data in local storage. After editing, refresh the page and the updated storage will be loaded. Do not unpause before refreshing, or the game will overwrite your manual changes.

## License

MIT — see [LICENSE](LICENSE) for details.
