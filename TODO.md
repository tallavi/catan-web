# Catan Web App Implementation Plan

## Overview
Create a web-based UI that mirrors the curses game interface using React + TypeScript, served from a simple static file setup (no backend needed).

## Stack
- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite
- **Development:** Hot Module Replacement
- **Deployment:** Static hosting (GitHub Pages, Netlify)
- **Storage:** LocalStorage (no backend required)

## Architecture

### Project Structure
```
catan-web/
├── src/
│   ├── core/
│   │   ├── game-logic.ts        # Port of logic/game_logic.py
│   │   ├── types.ts             # TypeScript interfaces from Python dataclasses
│   │   ├── storage.ts           # LocalStorage wrapper
│   │   ├── renderer.ts          # Text rendering with color tags
│   │   └── timer.ts             # Client-side timer logic
│   ├── components/
│   │   ├── GameView.tsx         # Main game container
│   │   ├── NormalView.tsx       # Main game state (mirrors NormalState)
│   │   ├── PauseView.tsx        # Pause menu (mirrors PauseState)
│   │   ├── FreeThrowView.tsx    # Practice throws
│   │   ├── CubeOptionsView.tsx  # Show possible cube combinations
│   │   ├── CubeStatistics.tsx   # Reusable cube stats table
│   │   ├── EventsStatistics.tsx # Reusable events stats table
│   │   ├── DurationStats.tsx    # Reusable stats display
│   │   ├── Timer.tsx            # Reusable timer component
│   │   └── ColoredText.tsx      # Parse {bold}, {red} tags
│   ├── hooks/
│   │   ├── useGameLogic.ts      # Custom hook for game state
│   │   ├── useTimer.ts          # Custom hook for timers
│   │   ├── useKeyboard.ts       # Custom hook for keyboard
│   │   └── useLocalStorage.ts   # Custom hook for persistence
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # Entry point
├── public/
├── docs/
│   ├── PORTING.md               # Python → TypeScript mapping
│   └── ARCHITECTURE.md          # Architecture decisions
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .nvmrc                       # Node version specification
```

## Key Design Decisions

### 1. State Management (React Hooks + Context)
**Why not Redux/Zustand?** Overkill for this game. React's built-in state management is sufficient:

```typescript
// Simple but effective
const [gameState, setGameState] = useState<GameState>(loadGame())
const [view, setView] = useState<'normal' | 'pause' | 'freeThrow'>('normal')
```

### 2. Component Architecture
- **Container/Presentational Pattern**: `GameView` manages state, child components are pure
- **Reusable Components**: Stats tables, timers can be used in multiple views
- **Custom Hooks**: Extract game logic, timers, keyboard handling

### 3. Text Rendering (Curses Compatibility)
- `ColoredText` component parses `{bold}`, `{red}`, `{yellow}` tags
- Converts to styled `<span>` elements
- Maintains monospace layout with CSS Grid
- Matches curses color scheme exactly

### 4. Client-Side Timers (No Backend)
- **Challenge**: Python has server-side timer ticks
- **Solution**: Client-side timers with pause/resume
- Start from API-provided durations, increment locally
- Pause when in pause state, resume when back to normal

### 5. LocalStorage Persistence
- **Why LocalStorage?** Simple, no backend, persists across sessions
- **Structure**: JSON with game state, timestamps, player data
- **Migration**: Can import from Python save files via copy-paste

## Implementation Phases

### Phase 1: Core Game Logic Port (Types + Logic)
**Goal:** Port Python game logic to TypeScript

#### 1.1 Create Type Definitions (`src/core/types.ts`)
- Port Python dataclasses to TypeScript interfaces
- Define enums for EventsCubeResult
- Create CubesResult class (with total getter)
- Define GameTurn, GameSaveData, GameState interfaces
- Add DurationStats and related types
- Define error types and free throw results

#### 1.2 Implement Game Logic (`src/core/game-logic.ts`)
- Port `GameLogic` class from Python
- Key methods:
  - `initPossibleCubesResults()` - Generate 36 possible cube combos
  - `initPossibleEventsCubeResults()` - Generate 36 events (18 Pirates, 6×3 colors)
  - `nextTurn()` - Core game progression
  - `nextTurnWithPredeterminedCubes()` - Manual cube input
  - `getFreeThrow()` - Practice throws
  - `pause()` / `resume()` - Timer control
  - `getDurationStats()` - Statistics calculation
- Handle pirates track logic (1-8, reset at 8)
- Pool replenishment when empty
- Turn validation and replay

#### 1.3 Create Storage Layer (`src/core/storage.ts`)
- `GameStorage` class with LocalStorage wrapper
- Methods: `save()`, `load()`, `clear()`, `createNewGame()`
- Error handling for JSON parsing
- Type-safe operations

#### 1.4 Add Timer Logic (`src/core/timer.ts`)
- `Timer` class for client-side duration tracking
- Constructor accepts initial seconds
- Methods: `getCurrentDuration()`, `pause()`, `resume()`, `reset()`
- Handle paused state properly
- `formatTime()` utility function

#### 1.5 Create Text Renderer (`src/core/renderer.ts`)
- `TextRenderer` class for parsing color tags
- Parse `{bold}`, `{red}`, `{yellow}`, `{green}`, `{blue}` tags
- Use regex and stack-based approach (like curses)
- Return HTML strings safe for `innerHTML`
- Handle nested tags properly

### Phase 2: React Components & Hooks
**Goal:** Build UI components mirroring curses states

#### 2.1 Create Custom Hooks
- `useGameLogic()` - Wraps GameLogic class in React
- `useTimer()` - Manages Timer instances with useEffect
- `useKeyboard()` - Keyboard event handling
- `useLocalStorage()` - React integration with storage

#### 2.2 Build Core Components
- `ColoredText` - Render formatted text with colors
- `Timer` - Display and manage timers
- `CubeStatistics` - Table showing cube result probabilities
- `EventsStatistics` - Table showing events result probabilities
- `DurationStats` - Display player turn durations

#### 2.3 Create View Components
- `NormalView` - Main game interface (cubes + events tables, turn info)
- `PauseView` - Pause menu with statistics
- `FreeThrowView` - Practice throw display
- `CubeOptionsView` - Show remaining possible cubes

#### 2.4 Create Main Container (`GameView`)
- State management for current view
- Keyboard event delegation
- Game state persistence
- View transitions

### Phase 3: Integration & Polish
**Goal:** Connect everything and add finishing touches

#### 3.1 Update App.tsx
- Replace hello world with GameView
- Add game initialization logic
- Handle new game / load game flows

#### 3.2 Add Error Handling
- Try-catch around game operations
- User-friendly error messages
- Recovery options

#### 3.3 Add Game Controls
- New Game button
- Load/Save game
- Settings (blocked results, etc.)
- Clear storage option

#### 3.4 Responsive Design
- Mobile-friendly layout
- Touch controls for mobile
- Keyboard shortcuts help

### Phase 4: Testing & Deployment
**Goal:** Ensure quality and deploy

#### 4.1 Unit Tests
- Test game logic port (cube generation, turn progression)
- Test storage operations
- Test timer calculations
- Component testing with React Testing Library

#### 4.2 Integration Testing
- End-to-end game flow
- State persistence across reloads
- Timer accuracy
- Keyboard controls

#### 4.3 Deployment Setup
- GitHub Pages configuration
- Build optimization
- Static asset handling

## Technical Implementation Details

### Game Logic Porting Strategy

#### Python → TypeScript Mapping
```typescript
// Python dataclass
@dataclass
class CubesResult:
    yellow_cube: int
    red_cube: int
    predetermined: Optional[bool] = None
    
    @property
    def total(self) -> int:
        return self.yellow_cube + self.red_cube

// TypeScript class
export class CubesResult {
  constructor(
    public yellowCube: number,
    public redCube: number,
    public predetermined?: boolean
  ) {}

  get total(): number {
    return this.yellowCube + this.redCube
  }

  equals(other: CubesResult): boolean {
    return (
      this.yellowCube === other.yellowCube &&
      this.redCube === other.redCube &&
      this.total === other.total &&
      this.predetermined === other.predetermined
    )
  }
}
```

#### Timer Implementation (Client-side)
```typescript
export class Timer {
  private startTime: number
  private pausedAt: number | null = null
  private totalPausedTime: number = 0
  private accumulatedDuration: number = 0

  constructor(initialSeconds: number) {
    this.accumulatedDuration = initialSeconds
    this.startTime = Date.now()
  }

  getCurrentDuration(): number {
    if (this.pausedAt !== null) {
      // Paused - return duration at pause time
      return this.accumulatedDuration
    }
    // Running - add elapsed time since start/resume
    const elapsed = (Date.now() - this.startTime - this.totalPausedTime) / 1000
    return this.accumulatedDuration + elapsed
  }

  pause(): void {
    if (this.pausedAt === null) {
      this.accumulatedDuration = this.getCurrentDuration()
      this.pausedAt = Date.now()
    }
  }

  resume(): void {
    if (this.pausedAt !== null) {
      this.totalPausedTime += Date.now() - this.pausedAt
      this.pausedAt = null
    }
  }
}
```

### Component Architecture

#### NormalView Component
```typescript
interface NormalViewProps {
  gameState: GameState
  gameTimer: Timer
  turnTimer: Timer
  onPlayTurn: () => void
  onPause: () => void
  onQuit: () => void
}

export function NormalView({
  gameState,
  gameTimer,
  turnTimer,
  onPlayTurn,
  onPause,
  onQuit
}: NormalViewProps) {
  // Real-time timer updates with useEffect
  const [gameDuration, setGameDuration] = useState(0)
  const [turnDuration, setTurnDuration] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setGameDuration(gameTimer.getCurrentDuration())
      setTurnDuration(turnTimer.getCurrentDuration())
    }, 100) // Update 10x per second

    return () => clearInterval(interval)
  }, [gameTimer, turnTimer])

  return (
    <div className="normal-view">
      {/* Left column: Cube statistics */}
      <CubeStatistics possibleResults={gameState.possibleCubesResults} />

      {/* Right column: Events statistics */}
      <EventsStatistics possibleResults={gameState.possibleEventsCubeResults} />

      {/* Turn information */}
      <div className="turn-info">
        <ColoredText text={`Turn #${gameState.currentTurnNumber}, {bold}${currentPlayer}{/bold} to play!`} />
        <ColoredText text={`Total: {bold}${lastTurn?.cubes.total}{/bold}`} />
        <ColoredText text={`{red}Red cube: {bold}${lastTurn?.cubes.redCube}{/bold}{/red}`} />
        <ColoredText text={`Events cube: ${formatEventColor(lastTurn?.eventsCube)}${lastTurn?.eventsCube.name}{/color}`} />
        <ColoredText text={`Pirates track: ${gameState.piratesTrack}`} />
        <ColoredText text={`Turn duration: ${formatTime(turnDuration)} / ${formatTime(gameDuration)}`} />
      </div>

      {/* Instructions */}
      <div className="instructions">
        <p><ENTER> - next turn</p>
        <p><SPACE> - pause (and more options)</p>
        <p>q - quit</p>
      </div>
    </div>
  )
}
```

### Keyboard Handling
```typescript
// Custom hook for keyboard events
export function useKeyboard(onKey: (key: string) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for game keys
      if (['Enter', ' ', 'Escape', '1', '2', '3', 'q'].includes(e.key)) {
        e.preventDefault()
        onKey(e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onKey])
}

// Usage in GameView
export function GameView() {
  const [view, setView] = useState<GameView>('normal')

  useKeyboard((key) => {
    switch (view) {
      case 'normal':
        if (key === 'Enter') playTurn()
        if (key === ' ') setView('pause')
        if (key === 'q') handleQuit()
        break
      case 'pause':
        if (key === ' ') setView('normal')
        if (key === '1') setView('freeThrow')
        // ... other keys
        break
      // ... other views
    }
  })

  return (
    <>
      {view === 'normal' && <NormalView {...normalProps} />}
      {view === 'pause' && <PauseView {...pauseProps} />}
      {/* ... other views */}
    </>
  )
}
```

### Text Rendering with Color Tags
```typescript
interface ColoredTextProps {
  text: string
  className?: string
}

export function ColoredText({ text, className }: ColoredTextProps) {
  // Parse color tags and convert to JSX
  const parts = parseColorTags(text)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>
        } else {
          return (
            <span key={i} className={`color-${part.color}`}>
              {part.content}
            </span>
          )
        }
      })}
    </span>
  )
}

function parseColorTags(text: string): ColorPart[] {
  // Regex parsing similar to curses implementation
  // Return array of text/color parts
}
```

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
```typescript
// Test game logic
describe('GameLogic', () => {
  test('calculates cube total correctly', () => {
    const cubes = new CubesResult(3, 4)
    expect(cubes.total).toBe(7)
  })

  test('generates correct number of possible cubes', () => {
    const gameLogic = new GameLogic()
    expect(gameLogic.gameState.possibleCubesResults).toHaveLength(36) // 6×6 = 36
  })

  test('pirates track increments correctly', () => {
    // Test pirates track logic
  })
})

// Test components
describe('NormalView', () => {
  test('displays turn information', () => {
    const gameState = createMockGameState()
    render(<NormalView gameState={gameState} />)

    expect(screen.getByText('Turn #1')).toBeInTheDocument()
    expect(screen.getByText('Alice to play!')).toBeInTheDocument()
  })

  test('calls onPlayTurn when Enter pressed', () => {
    const onPlayTurn = jest.fn()
    render(<NormalView onPlayTurn={onPlayTurn} />)

    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onPlayTurn).toHaveBeenCalled()
  })
})
```

### Integration Tests (Manual)
- Play through complete game
- Verify state persistence
- Test all keyboard shortcuts
- Check timer accuracy
- Validate statistics calculations

## Deployment & Distribution

### GitHub Pages Deployment
```bash
# Install gh-pages package
npm install --save-dev gh-pages

# Add deploy script to package.json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "deploy": "gh-pages -d dist"
  }
}

# Deploy
npm run build
npm run deploy
```

### Netlify Deployment
- Connect GitHub repo
- Set build command: `npm run build`
- Publish directory: `dist`
- Auto-deploy on push

### Local Distribution
- Run `npm run build`
- Zip the `dist/` folder
- Share as standalone web app

## Benefits of This Approach

✅ **Zero Backend** - Runs entirely in browser  
✅ **Offline Capable** - No internet required after load  
✅ **Type Safe** - Full TypeScript coverage  
✅ **Modern React** - Latest patterns and hooks  
✅ **Testable** - Unit and integration tests  
✅ **Deploy Anywhere** - Static hosting options  
✅ **Mobile Friendly** - Responsive design  
✅ **Maintainable** - Clean component architecture  

## Success Criteria

- ✅ Exact behavior match with curses version
- ✅ All keyboard shortcuts work
- ✅ Timers accurate to within 1 second
- ✅ State persists across browser sessions
- ✅ Responsive on mobile devices
- ✅ No runtime errors in normal usage
- ✅ Fast loading (< 2 seconds)
- ✅ Passes all planned tests

## Open Questions & Decisions

1. **Component Library?** Use Material-UI, Chakra, or custom components?
2. **State Management?** Stick with useState or add Zustand?
3. **Testing Framework?** Jest (default) or Vitest?
4. **Color Scheme?** Match terminal colors or modern web palette?
5. **PWA Features?** Add service worker for offline, install prompt?

## Next Steps

1. **Experiment with hello world app** - Get comfortable with React/TypeScript/Vite
2. **Review this plan** - Ask questions, suggest changes
3. **Start Phase 1** - Port core game logic
4. **Iterate** - Build incrementally, test frequently
5. **Deploy** - Share with others when ready

This plan provides a solid foundation while remaining flexible for changes based on your experience during implementation.
