import { useState, useEffect } from 'react'
import './App.css'

// Simple hello world for experimentation
function App() {
  const [name, setName] = useState('World')
  const [clickCount, setClickCount] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleClick = () => {
    setClickCount(prev => prev + 1)
  }

  const handleReset = () => {
    setClickCount(0)
    setName('World')
  }

  return (
    <div className="app">
      <header>
        <h1>Hello, {name}! 👋</h1>
        <p>Welcome to your React + TypeScript + Vite setup</p>
      </header>

      <main>
        <div className="experiment-section">
          <h2>Experiment Section</h2>

          <div className="input-group">
            <label htmlFor="name-input">Change the greeting:</label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="button-group">
            <button onClick={handleClick}>
              Click me! (Count: {clickCount})
            </button>
            <button onClick={handleReset} className="reset-btn">
              Reset
            </button>
          </div>

          <div className="time-display">
            <p>Current time: {currentTime.toLocaleTimeString()}</p>
            <p>Live updates every second! ⏰</p>
          </div>
        </div>

        <div className="info-section">
          <h2>Development Features</h2>
          <ul>
            <li>🔄 Hot Module Replacement (HMR) - instant updates</li>
            <li>🎨 Auto-formatting with Prettier on save</li>
            <li>⚡ ESLint for code quality</li>
            <li>📝 TypeScript for type safety</li>
            <li>🚀 Vite for fast development server</li>
          </ul>

          <div className="code-hint">
            <p><strong>Try editing this file and watch the changes appear instantly!</strong></p>
            <code>src/App.tsx</code>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
