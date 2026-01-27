import { GameState, CubesResult, EventsCubeResult } from '../core'
import type { GameSaveData } from '../core'

// Static mock game save data for development and static UI views
export const mockGameSaveData: GameSaveData = {
  players: ['Babushka & Pimpa', 'Bob', 'Carol'],
  // Example of blocked totals (these totals will be removed from initial cube pool)
  blockedResults: [7],
  gameTurns: [
    {
      turnNumber: 1,
      playerIndex: 0,
      cubes: new CubesResult(2, 3), // total 5
      eventsCube: EventsCubeResult.GREEN,
      turnDuration: 12,
    },
    // {
    //   turnNumber: 2,
    //   playerIndex: 1,
    //   cubes: new CubesResult(6, 6), // total 12
    //   eventsCube: EventsCubeResult.PIRATES,
    //   turnDuration: 20,
    // },
    // {
    //   turnNumber: 3,
    //   playerIndex: 2,
    //   cubes: new CubesResult(1, 1), // total 2
    //   eventsCube: EventsCubeResult.BLUE,
    //   turnDuration: 8,
    // },
    // {
    //   turnNumber: 4,
    //   playerIndex: 0,
    //   // Predetermined - simulate a manual correction/input which bypasses pool validation
    //   cubes: new CubesResult(6, 6, true),
    //   eventsCube: EventsCubeResult.PIRATES,
    //   turnDuration: 25,
    // },
    // {
    //   turnNumber: 5,
    //   playerIndex: 1,
    //   cubes: new CubesResult(3, 2), // total 5
    //   eventsCube: EventsCubeResult.GREEN,
    //   turnDuration: 10,
    // },
    // {
    //   turnNumber: 6,
    //   playerIndex: 2,
    //   cubes: new CubesResult(6, 5), // total 11
    //   eventsCube: EventsCubeResult.GREEN,
    //   turnDuration: 10,
    // },
    // {
    //   turnNumber: 7,
    //   playerIndex: 0,
    //   cubes: new CubesResult(5, 6), // total 11
    //   eventsCube: EventsCubeResult.GREEN,
    //   turnDuration: 10,
    // },
  ],
}

// Create and initialize a GameState instance seeded with the mock data
export const mockGameState = new GameState(mockGameSaveData)

export default mockGameState
