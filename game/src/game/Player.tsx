import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  RUN_SPEED, ACCEL, DECEL, AIR_CONTROL,
  JUMP_VELOCITY, GRAVITY_ASCENT, GRAVITY_DESCENT,
  COYOTE_TIME_MS, JUMP_BUFFER_MS,
  DIVE_HORIZONTAL, DIVE_DURATION_S, DIVE_RECOVERY_S, DIVE_COOLDOWN_S,
  FALL_Y, CAPSULE_RADIUS, CAPSULE_HEIGHT,
} from '../constants/physics'
import { useGameStore } from '../store/gameStore'
import { HEX_SIZE } from './HexGrid'
import {
  TILE_WARN_S, TILE_FLASH_S,
} from './Tile'

// ─── Input state ──────────────────────────────────────────────────────────────
const keys: Record<string, boolean> = {}

function onKeyDown(e: KeyboardEvent) {
  keys[e.code] = true
  // Prevent page scroll on space/arrows
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault()
}
function onKeyUp(e: KeyboardEvent) { keys[e.code] = false }

// ─── Types ────────────────────────────────────────────────────────────────────
type PlayerState = 'grounded' | 'airborne' | 'diving' | 'recovering'

// ─── Component ────────────────────────────────────────────────────────────────
interface PlayerProps {
  tileRefs: React.MutableRefObject<Map<string, THREE.Mesh>>
}

export default function Player({ tileRefs }: PlayerProps) {
  const { camera } = useThree()
  const groupRef    = useRef<THREE.Group>(null!)
  const bodyRef     = useRef<THREE.Mesh>(null!)
  const headRef     = useRef<THREE.Mesh>(null!)

  // Physics state (mutable refs for perf — no re-renders per frame)
  const vel        = useRef(new THREE.Vector3())
  const onGround   = useRef(true)
  const pState     = useRef<PlayerState>('grounded')
  const facingAngle= useRef(0)            // radians, Y-axis rotation

  // Timers
  const coyoteTimer  = useRef(0)          // ms since left ground
  const jumpBuffer   = useRef(0)          // ms since jump pressed
  const diveTimer    = useRef(0)          // seconds into dive/recovery
  const diveCooldown = useRef(0)          // seconds remaining on cooldown

  // Tile stepping
  const { setTileState, tiles, setPhase } = useGameStore()

  // ─── Input listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // ─── Tile-step detection ─────────────────────────────────────────────────
  const stepTile = useCallback((tileId: string) => {
    const tile = tiles.get(tileId)
    if (!tile || tile.state !== 'intact') return

    setTileState(tileId, 'cracking')

    const warnEnd  = TILE_WARN_S  * 1000
    const flashEnd = warnEnd + TILE_FLASH_S * 1000

    setTimeout(() => setTileState(tileId, 'flashing'), warnEnd)
    setTimeout(() => setTileState(tileId, 'gone'),     flashEnd)
  }, [tiles, setTileState])

  // Find which tile the player is standing on (by XZ proximity)
  const lastTileId = useRef<string | null>(null)

  const findCurrentTile = useCallback(() => {
    if (!groupRef.current) return null
    const px = groupRef.current.position.x
    const pz = groupRef.current.position.z
    const STEP_RADIUS = HEX_SIZE * 0.85

    for (const [id, mesh] of tileRefs.current.entries()) {
      if (!mesh.visible) continue
      const dx = mesh.position.x - px
      const dz = mesh.position.z - pz
      if (Math.sqrt(dx * dx + dz * dz) < STEP_RADIUS) return id
    }
    return null
  }, [tileRefs])

  // ─── Ground check via downward raycast ────────────────────────────────────
  const raycaster = useRef(new THREE.Raycaster())

  const checkGround = useCallback(() => {
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
  }, [tileRefs])

  // ─── Main game loop ───────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)     // clamp to avoid tunnelling on lag
    const pos = groupRef.current?.position
    if (!pos) return

    const state = pState.current

    // ── Cooldown timers ──
    if (diveCooldown.current > 0) diveCooldown.current -= dt
    jumpBuffer.current = Math.max(0, jumpBuffer.current - dt * 1000)

    // ── Jump buffer: record when jump was pressed ──
    if (keys['Space']) {
      jumpBuffer.current = JUMP_BUFFER_MS
    }

    // ── State machine ─────────────────────────────────────────────────────
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

    // ── Ground check ──────────────────────────────────────────────────────
    const ground = checkGround()
    const wasOnGround = onGround.current
    onGround.current = ground.hit && vel.current.y <= 0.05

    if (onGround.current) {
      coyoteTimer.current = 0
      if (state === 'airborne') pState.current = 'grounded'
      // Snap to ground surface
      pos.y = ground.y + CAPSULE_HEIGHT / 2
      vel.current.y = 0
    } else {
      if (wasOnGround && state !== 'diving') coyoteTimer.current = COYOTE_TIME_MS
      coyoteTimer.current = Math.max(0, coyoteTimer.current - dt * 1000)
    }

    // ── Input direction (relative to camera) ─────────────────────────────
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

      // Project input to camera's horizontal plane
      const camDir = new THREE.Vector3()
      camera.getWorldDirection(camDir)
      camDir.y = 0
      camDir.normalize()
      const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0))

      const worldInput = new THREE.Vector3()
        .addScaledVector(camRight, inputDir.x)
        .addScaledVector(camDir,  -inputDir.z)
      worldInput.normalize()

      const speedMult = onGround.current ? 1 : AIR_CONTROL
      const targetVx = worldInput.x * RUN_SPEED * speedMult
      const targetVz = worldInput.z * RUN_SPEED * speedMult

      const lerpF = onGround.current ? ACCEL : ACCEL * AIR_CONTROL
      vel.current.x += (targetVx - vel.current.x) * lerpF * 60 * dt
      vel.current.z += (targetVz - vel.current.z) * lerpF * 60 * dt

      // Face movement direction
      facingAngle.current = Math.atan2(worldInput.x, worldInput.z)
    } else {
      // Decelerate
      const decelF = onGround.current ? DECEL : DECEL * 0.3
      vel.current.x += (0 - vel.current.x) * decelF * 60 * dt
      vel.current.z += (0 - vel.current.z) * decelF * 60 * dt
    }

    // ── Gravity ──────────────────────────────────────────────────────────
    if (!onGround.current) {
      const grav = vel.current.y > 0 ? GRAVITY_ASCENT : GRAVITY_DESCENT
      vel.current.y -= grav * dt
    }

    // ── Jump ─────────────────────────────────────────────────────────────
    const canJump = (onGround.current || coyoteTimer.current > 0) &&
                    state !== 'diving' && state !== 'recovering'

    if (canJump && jumpBuffer.current > 0) {
      vel.current.y = JUMP_VELOCITY
      onGround.current = false
      coyoteTimer.current = 0
      jumpBuffer.current = 0
      pState.current = 'airborne'
    }

    // ── Dive ─────────────────────────────────────────────────────────────
    const canDive = (keys['ShiftLeft'] || keys['ShiftRight']) &&
                    state !== 'diving' && state !== 'recovering' &&
                    diveCooldown.current <= 0

    if (canDive) {
      pState.current = 'diving'
      diveTimer.current = 0
      diveCooldown.current = DIVE_COOLDOWN_S

      // Launch in facing direction
      const diveDir = new THREE.Vector3(
        Math.sin(facingAngle.current),
        0.3,
        Math.cos(facingAngle.current)
      ).normalize()

      const diveSpeed = DIVE_HORIZONTAL / DIVE_DURATION_S
      vel.current.x = diveDir.x * diveSpeed
      vel.current.y = diveDir.y * diveSpeed * 0.5
      vel.current.z = diveDir.z * diveSpeed
    }

    // ── Integrate position ────────────────────────────────────────────────
    pos.x += vel.current.x * dt
    pos.y += vel.current.y * dt
    pos.z += vel.current.z * dt

    // ── Rotate character to face direction ────────────────────────────────
    groupRef.current.rotation.y = facingAngle.current

    // ── Squash/stretch animation ──────────────────────────────────────────
    if (bodyRef.current && headRef.current) {
      const speed = Math.sqrt(vel.current.x ** 2 + vel.current.z ** 2)
      const bob = Math.sin(performance.now() * 0.008) * (speed / RUN_SPEED) * 0.06

      if (state === 'diving') {
        bodyRef.current.scale.set(1.3, 0.7, 1.3)
        headRef.current.scale.set(1.2, 0.8, 1.2)
      } else if (!onGround.current && vel.current.y > 0) {
        bodyRef.current.scale.set(0.85, 1.2, 0.85)
        headRef.current.scale.set(0.9, 1.1, 0.9)
      } else if (!onGround.current && vel.current.y < -2) {
        bodyRef.current.scale.set(1.15, 0.85, 1.15)
        headRef.current.scale.set(1.1, 0.9, 1.1)
      } else {
        bodyRef.current.scale.set(1, 1 + bob, 1)
        headRef.current.scale.set(1, 1 - bob * 0.5, 1)
      }
    }

    // ── Tile step detection ───────────────────────────────────────────────
    if (onGround.current) {
      const tileId = findCurrentTile()
      if (tileId && tileId !== lastTileId.current) {
        lastTileId.current = tileId
        stepTile(tileId)
      }
    } else {
      lastTileId.current = null
    }

    // ── Fall / elimination ────────────────────────────────────────────────
    if (pos.y < FALL_Y) {
      setPhase('eliminated')
    }

    // ── Camera follow ─────────────────────────────────────────────────────
    const targetCamX = pos.x
    const targetCamZ = pos.z + 18
    const targetCamY = pos.y + 22
    camera.position.x += (targetCamX - camera.position.x) * 0.06
    camera.position.y += (targetCamY - camera.position.y) * 0.06
    camera.position.z += (targetCamZ - camera.position.z) * 0.06
    camera.lookAt(pos.x, pos.y + 1, pos.z)
  })

  return (
    <group ref={groupRef} position={[0, CAPSULE_HEIGHT / 2, 0]}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_HEIGHT - CAPSULE_RADIUS * 2, 4, 8]} />
        <meshStandardMaterial color="#ff6b35" roughness={0.5} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, CAPSULE_HEIGHT / 2 + 0.1, 0]} castShadow>
        <sphereGeometry args={[0.38, 12, 8]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.4} />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.15,  CAPSULE_HEIGHT / 2 + 0.22, 0.3]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-0.15, CAPSULE_HEIGHT / 2 + 0.22, 0.3]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  )
}
