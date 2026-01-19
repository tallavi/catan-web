# Catan Core Library

TypeScript implementation of the Catan dice game logic, ported from the Python version in `catan-cli`.

## Overview

This core library provides all the game logic, types, storage, timers, and rendering utilities needed for the Catan web application. It operates entirely client-side using browser LocalStorage for persistence.

## Modules

### 📦 **types.ts**
Core type definitions and data structures:
- `CubesResult` - Represents dice rolls (yellow + red cubes)
- `EventsCubeResult` - Events die outcomes (GREEN, BLUE, YELLOW, PIRATES)
- `GameTurn` - Single turn data
- `GameSaveData` - Serializable game state
- `GameState` - Runtime game state
- `Duration` & `DurationStats` - Statistics types

### 🎮 **game-logic.ts**
Main game logic class (`GameLogic`):
- Turn progression with random or predetermined dice
- Pool management (36 cube combos, 36 events)
- Pirates track logic (1-8, resets)
- Pool replenishment when empty
- Turn validation and replay
- Statistics calculation
- Pause/resume functionality
- Auto-save to LocalStorage

### 💾 **storage.ts**
LocalStorage persistence (`GameStorage`):
- Save/load game state to browser storage
- JSON serialization/deserialization
- Type-safe operations
- `createNewGame()` static method

### ⏱️ **timer.ts**
Client-side duration tracking (`Timer`):
- Accurate time tracking with pause/resume
- Handles accumulated durations
- Format utilities (`formatTime`, `formatTimeDetailed`)

### 🎨 **renderer.ts**
Text rendering with color tags (`TextRenderer`):
- Parse color tags: `{red}text{/red}`, `{bold}text{/bold}`
- Convert to HTML/React elements
- Helper functions for formatting

## Usage Examples

### Creating a New Game

```typescript
import { GameStorage, GameLogic } from './core'

// Create save data
const saveData = GameStorage.createNewGame(
  ['Alice', 'Bob', 'Charlie'],  // Players
  [2, 12]                        // Blocked results (optional)
)

// Save to localStorage
const storage = new GameStorage('my-game')
storage.save(saveData)

// Initialize game logic
const game = new GameLogic('my-game')
```

### Playing Turns

```typescript
// Play a turn with random dice
game.nextTurn()

// Play a turn with predetermined dice
game.nextTurnWithPredeterminedCubes(3, 4)  // red=3, yellow=4

// Get free throw (practice, doesn't affect game)
const [cubes, eventsCube] = GameLogic.getFreeThrow()
console.log(`Rolled: ${cubes.total}, Event: ${eventsCube}`)
```

### Accessing Game State

```typescript
const state = game.state

console.log('Current turn:', state.currentTurnNumber)
console.log('Current player:', game.getCurrentPlayerName())
console.log('Pirates track:', state.piratesTrack)
console.log('Possible cubes remaining:', state.possibleCubesResults.length)
console.log('Possible events remaining:', state.possibleEventsCubeResults.length)

const lastTurn = game.getLastTurn()
if (lastTurn) {
  console.log('Last roll:', lastTurn.cubes.total)
  console.log('Last event:', lastTurn.eventsCube)
}
```

### Pause/Resume

```typescript
// Pause the game (stops timers)
game.pause()

// Resume the game (restarts timers)
game.resume()

// Check if game is in progress
if (game.isGameInProgress()) {
  console.log('Game is running')
}
```

### Statistics

```typescript
const stats = game.getDurationStats()

if (stats) {
  console.log('Game duration:', formatTime(stats.gameDuration))
  console.log('Current turn:', formatTime(stats.currentTurnDuration))
  
  console.log('Shortest turns:', stats.shortest)
  console.log('Longest turns:', stats.longest)
  console.log('Average per player:', stats.average)
}
```

### Text Rendering

```typescript
import { TextRenderer, ColorTags } from './core'

// Parse color tags
const text = '{red}Pirates{/red} on {bold}position 3{/bold}!'
const parts = TextRenderer.parse(text)

// Convert to HTML
const html = TextRenderer.toHtml(text)
// Output: <span class="text-red">Pirates</span> on <span class="text-bold">position 3</span>!

// Use helper functions
const formatted = ColorTags.bold('Turn #5') + ' - ' + ColorTags.red('PIRATES!')
```

### Timers

```typescript
import { Timer, formatTime } from './core'

const timer = new Timer()  // Start from 0

// Get current duration
console.log(formatTime(timer.getCurrentDuration()))

// Pause and resume
timer.pause()
// ... do something ...
timer.resume()

// Load saved duration
const savedTimer = new Timer(3600)  // Start from 1 hour
```

## Key Concepts

### Pool Management
- **Cubes Pool**: 36 combinations (6×6), filtered by blocked results
- **Events Pool**: 36 events (18 PIRATES, 6 GREEN, 6 BLUE, 6 YELLOW)
- Both pools automatically replenish when empty

### Pirates Track
- Starts at position 1
- Increments when PIRATES is rolled
- Resets to 1 when reaching 8

### Turn Validation
- Validates turn number and player index
- Ensures cubes/events exist in available pools
- Throws errors for invalid states

### Auto-Save
- Automatically saves every 10 seconds
- Call `game.timerTick()` in your render loop
- Manual save on every `nextTurn()` call

## TypeScript Support

All modules are fully typed with TypeScript for excellent IDE support:
- Type inference for all methods
- Comprehensive JSDoc comments
- Strict null checks
- Type-safe serialization

## Browser Compatibility

Requires:
- Modern browser with ES6+ support
- LocalStorage API
- Date.now() for timers

Tested on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Implementation Notes

### Differences from Python Version

1. **Storage**: Uses LocalStorage instead of file I/O
2. **Timers**: Client-side using Date.now() instead of time.time()
3. **Enums**: Uses const objects instead of Python enums (for TypeScript compatibility)
4. **No Backend**: Entirely client-side, no server required

### Auto-Save Behavior

The Python version auto-saves every 10 seconds via timer ticks. In the web version:
- Call `game.timerTick()` in your React useEffect or animation loop
- Or rely on auto-save during `nextTurn()` calls
- Manually call `game.pause()` before page unload for safety

## Testing

To test the core library:

```typescript
// Create a test game
const storage = new GameStorage('test-game')
storage.save(GameStorage.createNewGame(['Player 1', 'Player 2']))

// Play some turns
const game = new GameLogic('test-game')
game.nextTurn()
game.nextTurn()
game.nextTurn()

// Verify state
console.assert(game.state.currentTurnNumber === 3)
console.assert(game.state.gameSaveData?.gameTurns.length === 3)

// Clean up
storage.clear()
```

## Next Steps

This core library is ready for integration with React components. See the main TODO.md for the next phase: building UI components and hooks.
