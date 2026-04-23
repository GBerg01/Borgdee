import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import { buildGrid, hexToWorld, HEX_SIZE } from './HexGrid'
import Tile from './Tile'
import Player from './Player'
import BotPlayer from './BotPlayer'
import { useGameStore } from '../store/gameStore'
import type { TileState } from '../store/gameStore'
import { randomBuild } from '../store/characterStore'
import type { CharacterBuild } from '../store/characterStore'

const GRID_ROWS = 8
const GRID_COLS = 9
const BOT_COUNT = 7

// Fixed hex layout metrics
const HEX_W = (HEX_SIZE + 0.08) * 2
const HEX_H = Math.sqrt(3) * (HEX_SIZE + 0.08)
const CENTER_X = ((GRID_COLS - 1) * HEX_W) / 2 + HEX_W / 4
const CENTER_Z = ((GRID_ROWS - 1) * (HEX_H * 0.75)) / 2

function worldPos(row: number, col: number): [number, number] {
  const [wx, wz] = hexToWorld(row, col)
  return [wx - CENTER_X, wz - CENTER_Z]
}

// Generate spread-out spawn positions (player at center, bots around)
function buildSpawnPositions(count: number): [number, number, number][] {
  const grid = buildGrid(GRID_ROWS, GRID_COLS)
  // Pick well-distributed tiles as spawn points
  const candidates = grid.filter(({ row, col }) => {
    // Avoid very edge tiles
    return row > 0 && row < GRID_ROWS - 1 && col > 0 && col < GRID_COLS - 1
  })
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(({ row, col }) => {
    const [x, z] = worldPos(row, col)
    return [x, 1.2, z]
  })
}

export default function GameScene() {
  const { initTiles, tiles, phase, setPhase, setCountdown, aliveCount } = useGameStore()

  const tileRefs = useRef<Map<string, THREE.Mesh>>(new Map())
  const gridDef  = useMemo(() => buildGrid(GRID_ROWS, GRID_COLS), [])

  // Bot state
  const [botBuilds]    = useState<CharacterBuild[]>(() => Array.from({ length: BOT_COUNT }, randomBuild))
  const [aliveBots, setAliveBots] = useState<Set<string>>(
    () => new Set(Array.from({ length: BOT_COUNT }, (_, i) => `bot${i}`))
  )
  const spawns = useMemo(() => buildSpawnPositions(BOT_COUNT + 1), [])
  const playerSpawn = spawns[0]
  const botSpawns   = spawns.slice(1)

  // ── Init tiles on mount ────────────────────────────────────────────────────
  useEffect(() => {
    initTiles(gridDef)
  }, []) // eslint-disable-line

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return
    setCountdown(3)
    const t3 = setTimeout(() => setCountdown(2), 1000)
    const t2 = setTimeout(() => setCountdown(1), 2000)
    const t1 = setTimeout(() => { setCountdown(0); setPhase('playing') }, 3000)
    return () => { clearTimeout(t3); clearTimeout(t2); clearTimeout(t1) }
  }, [phase]) // eslint-disable-line

  // ── Win detection: if only 1 alive and it's the player ───────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    // aliveCount = player (1) + bots — player wins when all bots gone
    if (aliveBots.size === 0) {
      setPhase('won')
    }
  }, [aliveBots.size, phase]) // eslint-disable-line

  const handleBotEliminated = useCallback((id: string) => {
    setAliveBots(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  if (tiles.size === 0) return null

  return (
    <>
      <fog attach="fog" args={['#0a0a0f', 45, 90]} />

      {/* Tile grid */}
      {gridDef.map(({ id, row, col }) => {
        const tileData = tiles.get(id)
        if (!tileData) return null
        const [x, z] = worldPos(row, col)
        return (
          <TileWithRef
            key={id}
            id={id} x={x} z={z}
            state={tileData.state}
            stateAt={tileData.stateAt}
            tileRefs={tileRefs}
          />
        )
      })}

      {/* Player */}
      {phase !== 'eliminated' && (
        <Player tileRefs={tileRefs} key="player" />
      )}

      {/* Eliminated player ragdoll placeholder */}
      {/* (visual only — handled in HUD) */}

      {/* Bots */}
      {botBuilds.map((build, i) => {
        const id = `bot${i}`
        if (!aliveBots.has(id)) return null
        return (
          <BotPlayer
            key={id}
            id={id}
            startPos={botSpawns[i] ?? [0, 1.2, 0]}
            build={build}
            tileRefs={tileRefs}
            onEliminated={handleBotEliminated}
          />
        )
      })}

      {/* Shadow catcher */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial opacity={0.15} />
      </mesh>
    </>
  )
}

// ─── Tile with ref slot ───────────────────────────────────────────────────────
interface TileWithRefProps {
  id: string; x: number; z: number
  state: TileState; stateAt: number
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
      <mesh
        ref={meshRef}
        position={[x, 0.14, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={state !== 'gone'}
      >
        <circleGeometry args={[HEX_SIZE * 0.9, 6]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>
      <Tile id={id} x={x} z={z} state={state} stateAt={stateAt} />
    </group>
  )
}
