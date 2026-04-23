import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { buildGrid, hexToWorld, HEX_SIZE } from './HexGrid'
import Tile from './Tile'
import Player from './Player'
import type { TileState } from '../store/gameStore'
import { useGameStore } from '../store/gameStore'

const GRID_ROWS = 8
const GRID_COLS = 9

export default function GameScene() {
  const { initTiles, tiles, phase } = useGameStore()

  // Shared ref map: tileId → Three.js Mesh (for raycasting)
  const tileRefs = useRef<Map<string, THREE.Mesh>>(new Map())

  // Build grid once
  const gridDef = useMemo(() => buildGrid(GRID_ROWS, GRID_COLS), [])

  // Center offset calculation
  const { centerX, centerZ } = useMemo(() => {
    const W = (HEX_SIZE + 0.08) * 2
    const H = Math.sqrt(3) * (HEX_SIZE + 0.08)
    const cx = ((GRID_COLS - 1) * W) / 2 + (W / 4)
    const cz = ((GRID_ROWS - 1) * (H * 0.75)) / 2
    return { centerX: cx, centerZ: cz }
  }, [])

  useEffect(() => {
    initTiles(gridDef)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (tiles.size === 0) return null

  return (
    <>
      {/* Fog */}
      <fog attach="fog" args={['#0a0a0f', 40, 80]} />

      {/* Tile grid */}
      {gridDef.map(({ id, row, col }) => {
        const tileData = tiles.get(id)
        if (!tileData) return null

        const [wx, wz] = hexToWorld(row, col)
        const x = wx - centerX
        const z = wz - centerZ

        return (
          <TileWithRef
            key={id}
            id={id}
            x={x}
            z={z}
            state={tileData.state}
            stateAt={tileData.stateAt}
            tileRefs={tileRefs}
          />
        )
      })}

      {/* Player — only active while playing */}
      {phase === 'playing' && (
        <Player tileRefs={tileRefs} />
      )}

      {/* Ground plane (invisible, catches shadows) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
    </>
  )
}

// Wrapper to give each tile a ref slot in the shared map
interface TileWithRefProps {
  id: string
  x: number
  z: number
  state: TileState
  stateAt: number
  tileRefs: React.MutableRefObject<Map<string, THREE.Mesh>>
}

function TileWithRef({ id, x, z, state, stateAt, tileRefs }: TileWithRefProps) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useEffect(() => {
    if (meshRef.current) tileRefs.current.set(id, meshRef.current)
    return () => { tileRefs.current.delete(id) }
  }, [id, tileRefs])

  return (
    <group>
      {/* Invisible flat hit-surface for raycasting at y=0.14 (top of tile) */}
      <mesh
        ref={meshRef}
        position={[x, 0.14, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={state !== 'gone'}
      >
        <circleGeometry args={[HEX_SIZE * 0.9, 6]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Visual tile */}
      <Tile id={id} x={x} z={z} state={state} stateAt={stateAt} />
    </group>
  )
}
