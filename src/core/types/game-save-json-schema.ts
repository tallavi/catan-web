import * as v from 'valibot'

export const eventsCubeLabelSchema = v.picklist([
  'GREEN',
  'BLUE',
  'YELLOW',
  'PIRATES',
])

export const gameTurnJsonSchema = v.object({
  turnNumber: v.number(),
  playerIndex: v.number(),
  yellowCube: v.number(),
  redCube: v.number(),
  predetermined: v.optional(v.boolean()),
  eventsCube: eventsCubeLabelSchema,
  turnDuration: v.number(),
})

export const gameSaveJsonSchema = v.object({
  players: v.array(v.string()),
  blockedResults: v.array(v.number()),
  gameTurns: v.array(gameTurnJsonSchema),
})

export type EventsCubeLabel = v.InferOutput<typeof eventsCubeLabelSchema>
export type GameSaveJson = v.InferOutput<typeof gameSaveJsonSchema>
