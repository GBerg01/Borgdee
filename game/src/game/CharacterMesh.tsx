import { useRef, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CharacterBuild, BodyType, HeadShape, HatType, EyeType } from '../store/characterStore'
import { BODY_SCALES } from '../store/characterStore'
import { CAPSULE_RADIUS, CAPSULE_HEIGHT } from '../constants/physics'

// Base head radius (round sphere)
const HEAD_R = 0.38

interface CharacterMeshProps {
  build: CharacterBuild
  // If true, slowly rotates for preview display
  preview?: boolean
}

// Exposed via forwardRef so Player/Bot can scale for squash-stretch
const CharacterMesh = forwardRef<THREE.Group, CharacterMeshProps>(
  ({ build, preview = false }, ref) => {
    const innerRef = useRef<THREE.Group>(null!)
    const resolvedRef = (ref as React.RefObject<THREE.Group>) ?? innerRef

    useFrame((_, dt) => {
      if (preview && resolvedRef.current) {
        resolvedRef.current.rotation.y += dt * 0.8
      }
    })

    const bs = BODY_SCALES[build.bodyType]
    const { primary, secondary, accent } = build.palette

    // Compute head Y position relative to group center (capsule center)
    // Body top = CAPSULE_HEIGHT/2 * bodyScaleY (visual top of body)
    const bodyTopY = (CAPSULE_HEIGHT / 2) * bs.body[1]
    // Head center = bodyTop + HEAD_R scaled by headY
    const headCenterY = bodyTopY + HEAD_R * bs.head[1] + 0.04

    return (
      <group ref={resolvedRef}>
        {/* ── Body ── */}
        <group scale={bs.body}>
          <mesh castShadow>
            <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_HEIGHT - CAPSULE_RADIUS * 2, 4, 8]} />
            <meshStandardMaterial color={primary} roughness={0.45} metalness={0.05} />
          </mesh>
          {/* Arms */}
          <Arm side={-1} color={primary} bodyScaleX={bs.body[0]} />
          <Arm side={1}  color={primary} bodyScaleX={bs.body[0]} />
        </group>

        {/* ── Head ── */}
        <group position={[0, headCenterY, 0]} scale={bs.head}>
          <HeadShape shape={build.headShape} color={secondary} />
          <Eyes eyeType={build.eyeType} headShape={build.headShape} />
          <Hat hat={build.hat} accentColor={accent} headRadius={HEAD_R} />
        </group>
      </group>
    )
  }
)
CharacterMesh.displayName = 'CharacterMesh'
export default CharacterMesh

// ─── Arm ──────────────────────────────────────────────────────────────────────
function Arm({ side, color, bodyScaleX }: { side: number; color: string; bodyScaleX: number }) {
  // Arms float out from the sides slightly above center
  const x = side * (CAPSULE_RADIUS / bodyScaleX + 0.28)
  return (
    <mesh position={[x, 0.18, 0]} rotation={[0, 0, side * 0.55]} castShadow>
      <capsuleGeometry args={[0.11, 0.45, 3, 6]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  )
}

// ─── Head shapes ──────────────────────────────────────────────────────────────
function HeadShape({ shape, color }: { shape: HeadShape; color: string }) {
  const mat = <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
  if (shape === 'round') {
    return <mesh castShadow><sphereGeometry args={[HEAD_R, 14, 10]} />{mat}</mesh>
  }
  if (shape === 'square') {
    return (
      <mesh castShadow>
        <boxGeometry args={[0.68, 0.68, 0.68]} />
        {mat}
      </mesh>
    )
  }
  // oval
  return (
    <mesh scale={[0.82, 1.25, 0.82]} castShadow>
      <sphereGeometry args={[HEAD_R, 14, 10]} />
      {mat}
    </mesh>
  )
}

// ─── Eyes ─────────────────────────────────────────────────────────────────────
function Eyes({ eyeType, headShape }: { eyeType: EyeType; headShape: HeadShape }) {
  const fwd = headShape === 'square' ? 0.35 : HEAD_R * 0.92
  const up   = headShape === 'square' ? 0.10 : 0.06
  const mat  = <meshStandardMaterial color="#111111" />

  if (eyeType === 'dot') {
    return (
      <>
        <mesh position={[ 0.14, up, fwd]}><sphereGeometry args={[0.055, 8, 8]} />{mat}</mesh>
        <mesh position={[-0.14, up, fwd]}><sphereGeometry args={[0.055, 8, 8]} />{mat}</mesh>
      </>
    )
  }
  if (eyeType === 'wide') {
    return (
      <>
        <mesh position={[ 0.16, up, fwd]}><sphereGeometry args={[0.11, 8, 8]} />{mat}</mesh>
        <mesh position={[-0.16, up, fwd]}><sphereGeometry args={[0.11, 8, 8]} />{mat}</mesh>
      </>
    )
  }
  if (eyeType === 'angry') {
    // Angled ellipsoids
    return (
      <>
        <mesh position={[ 0.16, up + 0.03, fwd]} rotation={[0, 0, -0.5]} scale={[0.6, 1, 0.6]}>
          <sphereGeometry args={[0.10, 8, 6]} />{mat}
        </mesh>
        <mesh position={[-0.16, up + 0.03, fwd]} rotation={[0, 0, 0.5]} scale={[0.6, 1, 0.6]}>
          <sphereGeometry args={[0.10, 8, 6]} />{mat}
        </mesh>
      </>
    )
  }
  // round (default)
  return (
    <>
      <mesh position={[ 0.15, up, fwd]}><sphereGeometry args={[0.08, 8, 8]} />{mat}</mesh>
      <mesh position={[-0.15, up, fwd]}><sphereGeometry args={[0.08, 8, 8]} />{mat}</mesh>
    </>
  )
}

// ─── Hats ─────────────────────────────────────────────────────────────────────
function Hat({ hat, accentColor, headRadius }: { hat: HatType; accentColor: string; headRadius: number }) {
  const topY = headRadius + 0.04
  const mat  = <meshStandardMaterial color={accentColor} roughness={0.4} />

  if (hat === 'none') return null

  if (hat === 'tophat') {
    return (
      <group position={[0, topY, 0]}>
        {/* Brim */}
        <mesh><cylinderGeometry args={[0.55, 0.55, 0.06, 12]} />{mat}</mesh>
        {/* Crown */}
        <mesh position={[0, 0.26, 0]}><cylinderGeometry args={[0.28, 0.30, 0.46, 12]} />{mat}</mesh>
      </group>
    )
  }

  if (hat === 'crown') {
    return (
      <group position={[0, topY - 0.05, 0]}>
        {/* Base ring */}
        <mesh><torusGeometry args={[0.30, 0.07, 8, 16]} />{mat}</mesh>
        {/* 5 spikes */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.30, 0.20, Math.sin(angle) * 0.30]}
              rotation={[0, 0, 0]}
            >
              <coneGeometry args={[0.07, 0.28, 6]} />
              {mat}
            </mesh>
          )
        })}
      </group>
    )
  }

  if (hat === 'antenna') {
    return (
      <group position={[0, topY, 0]}>
        <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.04, 0.04, 0.44, 6]} />{mat}</mesh>
        <mesh position={[0, 0.50, 0]}><sphereGeometry args={[0.10, 8, 8]} />{mat}</mesh>
      </group>
    )
  }

  if (hat === 'helmet') {
    return (
      <group position={[0, topY * 0.4, 0]}>
        <mesh scale={[1.15, 0.9, 1.15]}>
          <sphereGeometry args={[headRadius + 0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          {mat}
        </mesh>
        {/* Visor strip */}
        <mesh position={[0, -0.02, headRadius * 0.88]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.45, 0.04, 0.12]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    )
  }

  return null
}
