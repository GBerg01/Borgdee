import { create } from 'zustand'

export type TileState = 'intact' | 'cracking' | 'flashing' | 'gone'
export type GamePhase = 'countdown' | 'playing' | 'eliminated' | 'won'

export interface TileData {
  id: string
  row: number
  col: number
  state: TileState
  stateAt: number
}

export const TILE_STATES = ['intact', 'cracking', 'flashing', 'gone'] as const

interface GameStore {
  phase: GamePhase
  countdown: number          // 3 → 2 → 1 → 0 (go)
  tiles: Map<string, TileData>
  aliveCount: number         // includes player + bots

  setPhase: (p: GamePhase) => void
  setCountdown: (n: number) => void
  setTileState: (id: string, state: TileState) => void
  initTiles: (tiles: TileData[]) => void
  eliminateSurvivor: () => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  phase: 'countdown',
  countdown: 3,
  tiles: new Map(),
  aliveCount: 8,

  setPhase: (phase) => set({ phase }),
  setCountdown: (countdown) => set({ countdown }),

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
      return { tiles: map, phase: 'countdown', countdown: 3, aliveCount: 8 }
    }),

  eliminateSurvivor: () =>
    set((s) => {
      const next = s.aliveCount - 1
      // If only 1 left after elimination and player is still alive, player won
      return { aliveCount: next }
    }),

  resetGame: () =>
    set({ phase: 'countdown', tiles: new Map(), aliveCount: 8, countdown: 3 }),
}))
