import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import CharacterMesh from './CharacterMesh'
import { useCharacterStore } from '../store/characterStore'
import { useGameStore } from '../store/gameStore'
import {
  RUN_SPEED, ACCEL, DECEL, AIR_CONTROL,
  JUMP_VELOCITY, GRAVITY_ASCENT, GRAVITY_DESCENT,
  COYOTE_TIME_MS, JUMP_BUFFER_MS,
  DIVE_HORIZONTAL, DIVE_DURATION_S, DIVE_RECOVERY_S, DIVE_COOLDOWN_S,
  FALL_Y, CAPSULE_HEIGHT,
  TILE_WARN_S, TILE_FLASH_S,
} from '../constants/physics'
import { HEX_SIZE } from './HexGrid'

// ─── Input state ──────────────────────────────────────────────────────────────
const keys: Record<string, boolean> = {}
function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault()
}
function onKeyUp(e: KeyboardEvent) { keys[e.code] = false }

type PlayerState = 'grounded' | 'airborne' | 'diving' | 'recovering'

interface PlayerProps {
  tileRefs: React.MutableRefObject<Map<string, THREE.Mesh>>
}

export default function Player({ tileRefs }: PlayerProps) {
  const { camera } = useThree()
  const groupRef    = useRef<THREE.Group>(null!)  // physics / position group
  const meshRef     = useRef<THREE.Group>(null!)  // visual group (squash/stretch)

  const build = useCharacterStore((s) => s.build)
  const { setTileState, tiles, phase, setPhase, eliminateSurvivor } = useGameStore()

  // Physics refs
  const vel         = useRef(new THREE.Vector3())
  const onGround    = useRef(true)
  const pState      = useRef<PlayerState>('grounded')
  const facingAngle = useRef(0)
  const coyoteTimer = useRef(0)
  const jumpBuffer  = useRef(0)
  const diveTimer   = useRef(0)
  const diveCooldown= useRef(0)
  const lastTileId  = useRef<string | null>(null)
  const eliminated  = useRef(false)

  const raycaster = useRef(new THREE.Raycaster())

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // ── Tile step ──────────────────────────────────────────────────────────────
  function stepTile(tileId: string) {
    const tile = tiles.get(tileId)
    if (!tile || tile.state !== 'intact') return
    setTileState(tileId, 'cracking')
    setTimeout(() => setTileState(tileId, 'flashing'), TILE_WARN_S * 1000)
    setTimeout(() => setTileState(tileId, 'gone'), (TILE_WARN_S + TILE_FLASH_S) * 1000)
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

    // Freeze movement during countdown
    if (phase === 'countdown') {
      // Gentle idle bob
      if (meshRef.current) {
        meshRef.current.scale.y = 1 + Math.sin(performance.now() * 0.003) * 0.04
      }
      return
    }

    const dt = Math.min(delta, 0.05)
    const pos = groupRef.current.position
    const state = pState.current

    // Cooldowns
    if (diveCooldown.current > 0) diveCooldown.current -= dt
    jumpBuffer.current = Math.max(0, jumpBuffer.current - dt * 1000)

    // Jump buffer
    if (keys['Space']) jumpBuffer.current = JUMP_BUFFER_MS

    // State machine
    if (state === 'diving') {
      diveTimer.current += dt
      if (diveTimer.current >= DIVE_DURATION_S) {
        pState.current = 'recovering'
        diveTimer.current = 0
      }
    } else if (state === 'recovering') {
      diveTimer.current += dt
      if (diveTimer.current >= DIVE_RECOVERY_S) {
        pState.current = onGround.current ? 'grounded' : 'airborne'
        diveTimer.current = 0
      }
    }

    // Ground check
    const ground = checkGround()
    const wasOnGround = onGround.current
    onGround.current = ground.hit && vel.current.y <= 0.05
    if (onGround.current) {
      coyoteTimer.current = 0
      if (state === 'airborne') pState.current = 'grounded'
      pos.y = ground.y + CAPSULE_HEIGHT / 2
      vel.current.y = 0
    } else {
      if (wasOnGround && state !== 'diving') coyoteTimer.current = COYOTE_TIME_MS
      coyoteTimer.current = Math.max(0, coyoteTimer.current - dt * 1000)
    }

    // Input direction
    const isControllable = state === 'grounded' || state === 'airborne'
    const inputDir = new THREE.Vector3()
    if (isControllable) {
      if (keys['KeyW'] || keys['ArrowUp'])    inputDir.z -= 1
      if (keys['KeyS'] || keys['ArrowDown'])  inputDir.z += 1
      if (keys['KeyA'] || keys['ArrowLeft'])  inputDir.x -= 1
      if (keys['KeyD'] || keys['ArrowRight']) inputDir.x += 1
    }

    if (inputDir.lengthSq() > 0) {
      inputDir.normalize()
      const camDir = new THREE.Vector3()
      camera.getWorldDirection(camDir)
      camDir.y = 0; camDir.normalize()
      const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0))
      const worldInput = new THREE.Vector3()
        .addScaledVector(camRight, inputDir.x)
        .addScaledVector(camDir, -inputDir.z)
      worldInput.normalize()

      const speedMult = onGround.current ? 1 : AIR_CONTROL
      const lerpF     = onGround.current ? ACCEL : ACCEL * AIR_CONTROL
      vel.current.x += (worldInput.x * RUN_SPEED * speedMult - vel.current.x) * lerpF * 60 * dt
      vel.current.z += (worldInput.z * RUN_SPEED * speedMult - vel.current.z) * lerpF * 60 * dt
      facingAngle.current = Math.atan2(worldInput.x, worldInput.z)
    } else {
      const decelF = onGround.current ? DECEL : DECEL * 0.3
      vel.current.x += (0 - vel.current.x) * decelF * 60 * dt
      vel.current.z += (0 - vel.current.z) * decelF * 60 * dt
    }

    // Gravity
    if (!onGround.current) {
      const grav = vel.current.y > 0 ? GRAVITY_ASCENT : GRAVITY_DESCENT
      vel.current.y -= grav * dt
    }

    // Jump
    const canJump = (onGround.current || coyoteTimer.current > 0) &&
                    state !== 'diving' && state !== 'recovering'
    if (canJump && jumpBuffer.current > 0) {
      vel.current.y = JUMP_VELOCITY
      onGround.current = false
      coyoteTimer.current = 0
      jumpBuffer.current = 0
      pState.current = 'airborne'
    }

    // Dive
    const canDive = (keys['ShiftLeft'] || keys['ShiftRight']) &&
                    state !== 'diving' && state !== 'recovering' &&
                    diveCooldown.current <= 0
    if (canDive) {
      pState.current = 'diving'
      diveTimer.current = 0
      diveCooldown.current = DIVE_COOLDOWN_S
      const diveDir = new THREE.Vector3(
        Math.sin(facingAngle.current), 0.3, Math.cos(facingAngle.current)
      ).normalize()
      const diveSpeed = DIVE_HORIZONTAL / DIVE_DURATION_S
      vel.current.x = diveDir.x * diveSpeed
      vel.current.y = diveDir.y * diveSpeed * 0.5
      vel.current.z = diveDir.z * diveSpeed
    }

    // Integrate
    pos.x += vel.current.x * dt
    pos.y += vel.current.y * dt
    pos.z += vel.current.z * dt

    // Rotate to face direction
    groupRef.current.rotation.y = facingAngle.current

    // Squash/stretch on visual group
    if (meshRef.current) {
      const speed = Math.sqrt(vel.current.x ** 2 + vel.current.z ** 2)
      const bob = Math.sin(performance.now() * 0.008) * (speed / RUN_SPEED) * 0.06
      if (state === 'diving') {
        meshRef.current.scale.set(1.3, 0.7, 1.3)
      } else if (!onGround.current && vel.current.y > 0) {
        meshRef.current.scale.set(0.85, 1.2, 0.85)
      } else if (!onGround.current && vel.current.y < -2) {
        meshRef.current.scale.set(1.15, 0.85, 1.15)
      } else {
        meshRef.current.scale.set(1, 1 + bob, 1)
      }
    }

    // Tile step
    if (onGround.current) {
      const tileId = findCurrentTile()
      if (tileId && tileId !== lastTileId.current) {
        lastTileId.current = tileId
        stepTile(tileId)
      }
    } else {
      lastTileId.current = null
    }

    // Fall elimination
    if (pos.y < FALL_Y && !eliminated.current) {
      eliminated.current = true
      eliminateSurvivor()
      setPhase('eliminated')
    }

    // Camera follow
    camera.position.x += (pos.x - camera.position.x) * 0.06
    camera.position.y += (pos.y + 22 - camera.position.y) * 0.06
    camera.position.z += (pos.z + 18 - camera.position.z) * 0.06
    camera.lookAt(pos.x, pos.y + 1, pos.z)
  })

  return (
    <group ref={groupRef} position={[0, CAPSULE_HEIGHT / 2, 0]}>
      <CharacterMesh ref={meshRef} build={build} />
    </group>
  )
}
