import React, { useState, useEffect } from 'react'
import type { GameLogic } from '../core'

interface StartViewProps {
  gameLogic: GameLogic
}

export const StartView: React.FC<StartViewProps> = ({ gameLogic }) => {
  const [players, setPlayers] = useState<string[]>(() => {
    const initialPlayers = gameLogic.state.gameSaveData.players
    return initialPlayers.length > 0
      ? initialPlayers
      : ['Player 1', 'Player 2', 'Player 3']
  })
  const [blockedNumbers, setBlockedNumbers] = useState<number[]>(
    gameLogic.state.gameSaveData.blockedResults
  )
  const [newBlockedNumber, setNewBlockedNumber] = useState('')

  useEffect(() => {
    gameLogic.setPlayers(players)
  }, [players, gameLogic])

  useEffect(() => {
    gameLogic.setBlockedResults(blockedNumbers)
  }, [blockedNumbers, gameLogic])

  const addPlayer = () => {
    setPlayers([...players, `Player ${players.length + 1}`])
  }

  const removePlayer = (index: number) => {
    if (players.length <= 1) {
      return // Don't allow removing the last player
    }
    setPlayers(players.filter((_, i) => i !== index))
  }

  const updatePlayerName = (index: number, name: string) => {
    const newPlayers = [...players]
    newPlayers[index] = name
    setPlayers(newPlayers)
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
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={player}
                      onChange={e => updatePlayerName(index, e.target.value)}
                    />
                  </td>
                  <td>
                    <button onClick={() => movePlayer(index, 'up')}>↑</button>
                    <button onClick={() => movePlayer(index, 'down')}>↓</button>
                    <button onClick={() => removePlayer(index)}>Remove</button>
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
