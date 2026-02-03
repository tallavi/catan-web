import React, { useState, useEffect } from 'react'
import type { GameLogic } from '../../core'
import { IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { EditableRow } from './EditableRow'
import ActionBar from '../Common/ActionBar/ActionBar'
import type { Action } from '../Common/ActionBar/ActionBar.types'
import Modal from '../Common/Modal/Modal'

const MAX_NAME_LENGTH = 20

interface SetupViewProps {
  gameLogic: GameLogic
}

export const SetupView: React.FC<SetupViewProps> = ({ gameLogic }) => {
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
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)

  const validationErrors = new Set<string>()
  if (players.length === 0) {
    validationErrors.add('• There must be at least one player.')
  }
  const playerNames = new Set()
  for (const player of players) {
    const trimmed = player.trim()

    if (!trimmed) {
      validationErrors.add('• Player names must not be empty.')
      continue
    }
    if (playerNames.has(trimmed)) {
      validationErrors.add("• Player names must be unique ('" + trimmed + "').")
      continue
    }
    playerNames.add(trimmed)
  }
  if (blockedNumbers.length >= 11) {
    const allBlocked = new Set(blockedNumbers)
    let allPossibleBlocked = true
    for (let i = 2; i <= 12; i++) {
      if (!allBlocked.has(i)) {
        allPossibleBlocked = false
        break
      }
    }
    if (allPossibleBlocked) {
      validationErrors.add('• There must be at least one unblocked result.')
    }
  }

  useEffect(() => {
    gameLogic.setPlayers(players.map(p => p.trim()))
  }, [players, gameLogic])

  useEffect(() => {
    gameLogic.setBlockedResults(blockedNumbers)
  }, [blockedNumbers, gameLogic])

  const addPlayer = () => {
    const nameToAdd = newPlayerName.trim()
    if (nameToAdd) {
      setPlayers([...players, nameToAdd])
      setNewPlayerName('')
    }
  }

  const isPlayerNameValid = newPlayerName.trim() !== ''

  const isBlockedNumberValid = () => {
    const num = parseInt(newBlockedNumber, 10)
    return !isNaN(num) && num >= 2 && num <= 12 && !blockedNumbers.includes(num)
  }

  const removePlayer = (index: number) => {
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

  const actions: Action[] = [
    {
      label: 'Start',
      shortcutDisplay: 'Enter',
      keys: ['Enter'],
      action: () => setIsConfirming(true),
      disabled: validationErrors.size > 0,
    },
  ]

  const confirmActions: Action[] = [
    {
      label: 'Yes',
      shortcutDisplay: 'Y',
      keys: ['y'],
      action: () => {
        gameLogic.nextTurn()
        setIsConfirming(false)
      },
      isLongPress: true,
    },
    {
      label: 'No',
      shortcutDisplay: 'N or Esc',
      keys: ['n', 'Escape'],
      action: () => setIsConfirming(false),
    },
  ]

  return (
    <>
      <div className="view">
        <div className="view-title" style={{ fontSize: '1.2rem' }}>
          Game Setup
        </div>

        <div className="stats">
          <div className="duration-tables">
            <div className="card">
              <div className="table-title">Players</div>
              <table style={{ width: '100%', fontSize: '1.5rem' }}>
                <tbody style={{ borderTop: 'none' }}>
                  {players.map((player, index) => (
                    <EditableRow
                      key={index}
                      firstColumnContent={
                        <input
                          type="text"
                          maxLength={MAX_NAME_LENGTH}
                          value={player}
                          onChange={e =>
                            updatePlayerName(index, e.target.value)
                          }
                          style={{ fontSize: 'inherit', width: '100%' }}
                        />
                      }
                      showMoveUp={true}
                      onMoveUp={() => movePlayer(index, 'up')}
                      isMoveUpDisabled={index === 0}
                      showMoveDown={true}
                      onMoveDown={() => movePlayer(index, 'down')}
                      isMoveDownDisabled={index === players.length - 1}
                      showDelete={true}
                      onDelete={() => removePlayer(index)}
                      isDeleteDisabled={false}
                    />
                  ))}
                  <tr style={{ borderTop: '3px solid #ddd' }}>
                    <td style={{ paddingTop: '10px', width: '50%' }}>
                      <input
                        type="text"
                        maxLength={MAX_NAME_LENGTH}
                        value={newPlayerName}
                        onChange={e => setNewPlayerName(e.target.value)}
                        placeholder="Add player"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && isPlayerNameValid) {
                            addPlayer()
                          }
                        }}
                        style={{ fontSize: 'inherit', width: '100%' }}
                      />
                    </td>
                    <td
                      style={{
                        paddingTop: '10px',
                        textAlign: 'right',
                        width: '50%',
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={addPlayer}
                        tabIndex={-1}
                        disabled={!isPlayerNameValid}
                        style={{ outline: 'none' }}
                      >
                        <AddIcon
                          style={{
                            color: isPlayerNameValid ? 'green' : 'lightgray',
                          }}
                        />
                      </IconButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="table-title">Blocked Results</div>
              <table style={{ width: '100%', fontSize: '1.5rem' }}>
                <tbody style={{ borderTop: 'none' }}>
                  {blockedNumbers.map(num => (
                    <EditableRow
                      key={num}
                      firstColumnContent={num}
                      showDelete={true}
                      onDelete={() => removeBlockedNumber(num)}
                    />
                  ))}
                  <tr style={{ borderTop: '3px solid #ddd' }}>
                    <td style={{ paddingTop: '10px', width: '50%' }}>
                      <input
                        type="number"
                        value={newBlockedNumber}
                        onChange={e => setNewBlockedNumber(e.target.value)}
                        placeholder="Add blocked number (2-12)"
                        min="2"
                        max="12"
                        style={{
                          fontSize: 'inherit',
                          width: '100%',
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && isBlockedNumberValid()) {
                            addBlockedNumber()
                          }
                        }}
                      />
                    </td>
                    <td
                      style={{
                        paddingTop: '10px',
                        textAlign: 'right',
                        width: '50%',
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={addBlockedNumber}
                        tabIndex={-1}
                        disabled={!isBlockedNumberValid()}
                        style={{ outline: 'none' }}
                      >
                        <AddIcon
                          style={{
                            color: isBlockedNumberValid()
                              ? 'green'
                              : 'lightgray',
                          }}
                        />
                      </IconButton>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {validationErrors.size > 0 && (
            <div
              style={{ color: 'red', textAlign: 'center', marginTop: '1rem' }}
            >
              {Array.from(validationErrors).map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      {isConfirming && (
        <Modal>
          <div className="view-title" style={{ fontSize: '2.5rem' }}>
            Are you sure?
          </div>
        </Modal>
      )}
      <ActionBar actions={isConfirming ? confirmActions : actions} />
    </>
  )
}

export default SetupView
