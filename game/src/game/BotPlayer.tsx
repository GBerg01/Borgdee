import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CharacterMesh from './CharacterMesh'
import type { CharacterBuild } from '../store/characterStore'
import { useGameStore } from '../store/gameStore'
import {
  RUN_SPEED, ACCEL, DECEL, AIR_CONTROL,
  JUMP_VELOCITY, GRAVITY_ASCENT, GRAVITY_DESCENT,
  FALL_Y, CAPSULE_HEIGHT, CAPSULE_RADIUS,
  TILE_WARN_S, TILE_FLASH_S,
} from '../constants/physics'
import { HEX_SIZE } from './HexGrid'

const BOT_SPEED = RUN_SPEED * 0.62    // bots are slightly slower than the player

interface BotPlayerProps {
  id: string
  startPos: [number, number, number]
  build: CharacterBuild
  tileRefs: React.MutableRefObject<Map<string, THREE.Mesh>>
  onEliminated: (id: string) => void
}

export default function BotPlayer({ id, startPos, build, tileRefs, onEliminated }: BotPlayerProps) {
  const groupRef   = useRef<THREE.Group>(null!)
  const meshRef    = useRef<THREE.Group>(null!)

  // Physics state
  const vel        = useRef(new THREE.Vector3())
  const onGround   = useRef(true)
  const facingAngle= useRef(Math.random() * Math.PI * 2)
  const alive      = useRef(true)

  // AI state
  const aiTimer    = useRef(Math.random() * 1.5)   // time until next direction change
  const aiDir      = useRef(new THREE.Vector3(
    Math.sin(facingAngle.current), 0, Math.cos(facingAngle.current)
  ))
  const jumpTimer  = useRef(Math.random() * 3 + 1) // time until next jump

  const { setTileState, tiles, phase, eliminateSurvivor } = useGameStore()
  const lastTileId = useRef<string | null>(null)
  const eliminated = useRef(false)

  // Raycaster for ground check
  const raycaster = useRef(new THREE.Raycaster())

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...startPos)
    }
  }, [startPos])

  // ── Tile step detection ───────────────────────────────────────────────────
  function stepTile(tileId: string) {
    const tile = tiles.get(tileId)
    if (!tile || tile.state !== 'intact') return
    setTileState(tileId, 'cracking')
    setTimeout(() => setTileState(tileId, 'flashing'), TILE_WARN_S * 1000)
    setTimeout(() => setTileState(tileId, 'gone'),     (TILE_WARN_S + TILE_FLASH_S) * 1000)
  }

  function findCurrentTile(): string | null {
    if (!groupRef.current) return null
    const px = groupRef.current.position.x
    const pz = groupRef.current.position.z
    const STEP_R = HEX_SIZE * 0.85
    for (const [tid, mesh] of tileRefs.current.entries()) {
      if (!mesh.visible) continue
      const dx = mesh.position.x - px
      const dz = mesh.position.z - pz
      if (Math.sqrt(dx * dx + dz * dz) < STEP_R) return tid
    }
    return null
  }

  function checkGround(): { hit: boolean; y: number } {
    if (!groupRef.current) return { hit: false, y: 0 }
    const origin = groupRef.current.position.clone()
    origin.y += 0.1
    raycaster.current.set(origin, new THREE.Vector3(0, -1, 0))
    raycaster.current.near = 0
    raycaster.current.far  = CAPSULE_HEIGHT / 2 + 0.35
    const meshes = Array.from(tileRefs.current.values()).filter(m => m.visible)
    const hits = raycaster.current.intersectObjects(meshes, false)
    if (hits.length > 0) return { hit: true, y: hits[0].point.y }
    return { hit: false, y: 0 }
  }

  useFrame((_, delta) => {
    if (eliminated.current || !groupRef.current) return
    if (phase === 'countdown') return

    const dt  = Math.min(delta, 0.05)
    const pos = groupRef.current.position

    // ── AI: pick new direction periodically ─────────────────────────────
    aiTimer.current -= dt
    if (aiTimer.current <= 0) {
      // Pick a random angle, biased toward center if near edge
      const distFromCenter = Math.sqrt(pos.x ** 2 + pos.z ** 2)
      let angle: number
      if (distFromCenter > 5) {
        // Bias toward center
        const toCenter = Math.atan2(-pos.x, -pos.z)
        angle = toCenter + (Math.random() - 0.5) * Math.PI * 0.8
      } else {
        angle = Math.random() * Math.PI * 2
      }
      aiDir.current.set(Math.sin(angle), 0, Math.cos(angle))
      facingAngle.current = angle
      aiTimer.current = 1.2 + Math.random() * 1.8
    }

    // ── AI: jump occasionally ────────────────────────────────────────────
    jumpTimer.current -= dt
    if (jumpTimer.current <= 0 && onGround.current) {
      vel.current.y = JUMP_VELOCITY * 0.85
      onGround.current = false
      jumpTimer.current = 2.5 + Math.random() * 3.5
    }

    // ── Ground check ─────────────────────────────────────────────────────
    const ground = checkGround()
    const wasOnGround = onGround.current
    onGround.current = ground.hit && vel.current.y <= 0.05
    if (onGround.current) {
      pos.y = ground.y + CAPSULE_HEIGHT / 2
      vel.current.y = 0
    }

    // ── Movement ─────────────────────────────────────────────────────────
    const speedMult = onGround.current ? 1 : AIR_CONTROL
    const targetVx  = aiDir.current.x * BOT_SPEED * speedMult
    const targetVz  = aiDir.current.z * BOT_SPEED * speedMult
    const lerpF     = onGround.current ? ACCEL : ACCEL * 0.5
    vel.current.x  += (targetVx - vel.current.x) * lerpF * 60 * dt
    vel.current.z  += (targetVz - vel.current.z) * lerpF * 60 * dt

    // ── Gravity ───────────────────────────────────────────────────────────
    if (!onGround.current) {
      const grav = vel.current.y > 0 ? GRAVITY_ASCENT : GRAVITY_DESCENT
      vel.current.y -= grav * dt
    }

    // ── Integrate ─────────────────────────────────────────────────────────
    pos.x += vel.current.x * dt
    pos.y += vel.current.y * dt
    pos.z += vel.current.z * dt

    // ── Rotate ───────────────────────────────────────────────────────────
    groupRef.current.rotation.y = facingAngle.current

    // ── Squash/stretch ────────────────────────────────────────────────────
    if (meshRef.current) {
      if (!onGround.current && vel.current.y > 0) {
        meshRef.current.scale.set(0.88, 1.18, 0.88)
      } else if (!onGround.current && vel.current.y < -2) {
        meshRef.current.scale.set(1.14, 0.88, 1.14)
      } else {
        const speed = Math.sqrt(vel.current.x ** 2 + vel.current.z ** 2)
        const bob = Math.sin(performance.now() * 0.008 + parseInt(id.replace('bot', ''))) * (speed / BOT_SPEED) * 0.05
        meshRef.current.scale.set(1, 1 + bob, 1)
      }
    }

    // ── Tile stepping ─────────────────────────────────────────────────────
    if (onGround.current) {
      const tileId = findCurrentTile()
      if (tileId && tileId !== lastTileId.current) {
        lastTileId.current = tileId
        stepTile(tileId)
      }
    } else {
      lastTileId.current = null
    }

    // ── Fall elimination ──────────────────────────────────────────────────
    if (pos.y < FALL_Y && !eliminated.current) {
      eliminated.current = true
      eliminateSurvivor()
      onEliminated(id)
    }
  })

  if (!alive.current) return null

  return (
    <group ref={groupRef} position={startPos}>
      <CharacterMesh ref={meshRef} build={build} />
      {/* Name tag */}
      {/* (skipped for perf — can add later with Text from drei) */}
    </group>
  )
}
