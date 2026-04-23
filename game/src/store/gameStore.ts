import { create } from 'zustand'

export type TileState = 'intact' | 'cracking' | 'flashing' | 'gone'
export type GamePhase = 'playing' | 'eliminated' | 'won'
// Ensure types are treated as values for bundler compat
export const TILE_STATES = ['intact', 'cracking', 'flashing', 'gone'] as const

export interface TileData {
  id: string
  row: number
  col: number
  state: TileState
  stateAt: number   // timestamp when state last changed
}

interface GameStore {
  phase: GamePhase
  tiles: Map<string, TileData>
  score: number

  setPhase: (p: GamePhase) => void
  setTileState: (id: string, state: TileState) => void
  initTiles: (tiles: TileData[]) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  phase: 'playing',
  tiles: new Map(),
  score: 0,

  setPhase: (phase) => set({ phase }),

  setTileState: (id, state) =>
    set((s) => {
      const next = new Map(s.tiles)
      const tile = next.get(id)
      if (tile) next.set(id, { ...tile, state, stateAt: performance.now() })
      return { tiles: next }
    }),

  initTiles: (tiles) =>
    set(() => {
      const map = new Map<string, TileData>()
      tiles.forEach((t) => map.set(t.id, t))
      return { tiles: map, phase: 'playing' }
    }),

  resetGame: () =>
    set({ phase: 'playing', tiles: new Map(), score: 0 }),
}))
