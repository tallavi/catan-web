import React, { useState } from 'react'
import type { GameLogic } from '../core'

interface StartViewProps {
  gameLogic: GameLogic
}

interface Player {
  id: number
  name: string
}

export const StartView: React.FC<StartViewProps> = ({ gameLogic }) => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2' },
    { id: 3, name: 'Player 3' },
    { id: 4, name: 'Player 4' },
  ])
  const [blockedNumbers, setBlockedNumbers] = useState<number[]>([])
  const [newBlockedNumber, setNewBlockedNumber] = useState('')

  const addPlayer = () => {
    const newId =
      players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 1
    setPlayers([...players, { id: newId, name: `Player ${newId}` }])
  }

  const removePlayer = (id: number) => {
    setPlayers(players.filter(p => p.id !== id))
  }

  const updatePlayerName = (id: number, name: string) => {
    setPlayers(players.map(p => (p.id === id ? { ...p, name } : p)))
  }

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === players.length - 1)
    ) {
      return
    }
    const newPlayers = [...players]
    const playerToMove = newPlayers[index]
    newPlayers.splice(index, 1)
    newPlayers.splice(index + (direction === 'down' ? 1 : -1), 0, playerToMove)
    setPlayers(newPlayers)
  }

  const addBlockedNumber = () => {
    const num = parseInt(newBlockedNumber, 10)
    if (!isNaN(num) && num >= 2 && num <= 12 && !blockedNumbers.includes(num)) {
      setBlockedNumbers([...blockedNumbers, num].sort((a, b) => a - b))
      setNewBlockedNumber('')
    }
  }

  const removeBlockedNumber = (num: number) => {
    setBlockedNumbers(blockedNumbers.filter(n => n !== num))
  }

  return (
    <div className="view">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
        }}
      >
        <div style={{ width: '45%' }}>
          <h2>Players</h2>
          <table style={{ width: '100%' }}>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.id}>
                  <td>
                    <input
                      type="text"
                      value={player.name}
                      onChange={e =>
                        updatePlayerName(player.id, e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button onClick={() => movePlayer(index, 'up')}>↑</button>
                    <button onClick={() => movePlayer(index, 'down')}>↓</button>
                    <button onClick={() => removePlayer(player.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addPlayer}>Add Player</button>
        </div>

        <div style={{ width: '45%' }}>
          <h2>Blocked Results</h2>
          <div>
            <input
              type="number"
              value={newBlockedNumber}
              onChange={e => setNewBlockedNumber(e.target.value)}
              min="2"
              max="12"
            />
            <button onClick={addBlockedNumber}>Add</button>
          </div>
          <table style={{ width: '100%' }}>
            <tbody>
              {blockedNumbers.map(num => (
                <tr key={num}>
                  <td>{num}</td>
                  <td>
                    <button onClick={() => removeBlockedNumber(num)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="action-bar">
        <button className="primary" onClick={() => gameLogic.nextTurn()}>
          Start <span className="kbd">Enter</span>
        </button>
      </div>
    </div>
  )
}

export default StartView
