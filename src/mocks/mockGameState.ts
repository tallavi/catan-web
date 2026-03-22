import {
  GameState,
  CubesResult,
  EventsCubeResult,
  GameSaveData,
} from '../core'

// Static mock game save data for development and static UI views
export const mockGameSaveData = new GameSaveData(
  ['Babushka & Pimpa', 'Bob', 'Carol'],
  // Example of blocked totals (these totals will be removed from initial cube pool)
  [7],
  [
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
  ]
)

// Create and initialize a GameState instance seeded with the mock data (clone: tryFrom mutates save)
const mockTryFrom = GameState.tryFromGameSaveData(
  new GameSaveData(
    [...mockGameSaveData.players],
    [...mockGameSaveData.blockedResults],
    mockGameSaveData.gameTurns.map(t => ({
      ...t,
      cubes: new CubesResult(
        t.cubes.yellowCube,
        t.cubes.redCube,
        t.cubes.predetermined
      ),
    }))
  )
)
if (!mockTryFrom.ok) {
  throw new Error(mockTryFrom.errors.join(', '))
}
export const mockGameState = mockTryFrom.state

export default mockGameState
