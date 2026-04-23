import type { TileData } from '../store/gameStore'
import { TILE_WARN_S, TILE_FLASH_S, TILE_DROP_S } from '../constants/physics'

export { TILE_WARN_S, TILE_FLASH_S, TILE_DROP_S }

// Flat-top hex geometry
// size = distance from center to corner
export const HEX_SIZE = 1.05
export const HEX_GAP = 0.08

// Flat-top hex: width = size*2, height = sqrt(3)*size
const W = (HEX_SIZE + HEX_GAP) * 2
const H = Math.sqrt(3) * (HEX_SIZE + HEX_GAP)

export function hexToWorld(row: number, col: number): [number, number] {
  // Offset grid (odd-row shifted)
  const x = col * W + (row % 2 === 1 ? W / 2 : 0)
  const z = row * (H * 0.75)
  return [x, z]
}

export function buildGrid(rows: number, cols: number): TileData[] {
  const tiles: TileData[] = []
  // Center the grid at origin
  const centerX = ((cols - 1) * W) / 2 + W / 4
  const centerZ = ((rows - 1) * (H * 0.75)) / 2

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [wx, wz] = hexToWorld(r, c)
      tiles.push({
        id: `${r}_${c}`,
        row: r,
        col: c,
        state: 'intact',
        stateAt: 0,
        // Attach world position for easy lookup
        ...(({ wx: wx - centerX, wz: wz - centerZ } as any)),
      })
    }
  }
  return tiles
}

// Reusable hex shape vertices for BufferGeometry (flat-top)
export function hexVertices(size: number): number[] {
  const pts: number[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i)
    pts.push(Math.cos(angle) * size, 0, Math.sin(angle) * size)
  }
  return pts
}
