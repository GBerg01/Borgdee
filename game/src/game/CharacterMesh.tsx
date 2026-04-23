import { useRef, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CharacterBuild, BodyType, HeadShape, HatType, EyeType } from '../store/characterStore'
import { BODY_SCALES } from '../store/characterStore'
import { CAPSULE_RADIUS, CAPSULE_HEIGHT } from '../constants/physics'

const HEAD_R = 0.38

interface CharacterMeshProps {
  build: CharacterBuild
  preview?: boolean   // enables auto-spin
}

// forwardRef lets Player/BotPlayer apply squash-stretch to the outer group
const CharacterMesh = forwardRef<THREE.Group, CharacterMeshProps>(
  ({ build, preview = false }, ref) => {
    // Separate spin group so squash-stretch ref and spin don't conflict
    const spinRef = useRef<THREE.Group>(null!)

    useFrame((_, dt) => {
      if (preview && spinRef.current) {
        spinRef.current.rotation.y += dt * 1.1
      }
    })

    const bs = BODY_SCALES[build.bodyType]
    const { primary, secondary, accent } = build.palette

    // Head Y: visual top of scaled body + scaled head radius
    const bodyTopY    = (CAPSULE_HEIGHT / 2) * bs.body[1]
    const headCenterY = bodyTopY + HEAD_R * bs.head[1] + 0.05

    return (
      // Outer group — Player/Bot apply squash-stretch scale here
      <group ref={ref}>
        {/* Spin group — only active in preview mode */}
        <group ref={spinRef}>

          {/* ── Body ── */}
          <group scale={bs.body}>
            <mesh castShadow>
              <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_HEIGHT - CAPSULE_RADIUS * 2, 4, 8]} />
              <meshStandardMaterial color={primary} roughness={0.45} metalness={0.05} />
            </mesh>
            <Arm side={-1} color={primary} bodyScaleX={bs.body[0]} />
            <Arm side={1}  color={primary} bodyScaleX={bs.body[0]} />
          </group>

          {/* ── Head ── */}
          <group position={[0, headCenterY, 0]} scale={bs.head}>
            <HeadShape shape={build.headShape} color={secondary} />
            <Eyes eyeType={build.eyeType} headShape={build.headShape} />
            <Hat hat={build.hat} accentColor={accent} />
          </group>

        </group>
      </group>
    )
  }
)
CharacterMesh.displayName = 'CharacterMesh'
export default CharacterMesh

// ─── Arm ──────────────────────────────────────────────────────────────────────
function Arm({ side, color, bodyScaleX }: { side: number; color: string; bodyScaleX: number }) {
  const x = side * (CAPSULE_RADIUS / bodyScaleX + 0.3)
  return (
    <mesh position={[x, 0.18, 0]} rotation={[0, 0, side * 0.6]} castShadow>
      <capsuleGeometry args={[0.11, 0.46, 3, 6]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  )
}

// ─── Head shapes ──────────────────────────────────────────────────────────────
function HeadShape({ shape, color }: { shape: HeadShape; color: string }) {
  const mat = <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
  if (shape === 'square') {
    return <mesh castShadow><boxGeometry args={[0.68, 0.68, 0.68]} />{mat}</mesh>
  }
  if (shape === 'oval') {
    return (
      <mesh scale={[0.82, 1.25, 0.82]} castShadow>
        <sphereGeometry args={[HEAD_R, 14, 10]} />{mat}
      </mesh>
    )
  }
  // round
  return <mesh castShadow><sphereGeometry args={[HEAD_R, 14, 10]} />{mat}</mesh>
}

// ─── Eyes ─────────────────────────────────────────────────────────────────────
function Eyes({ eyeType, headShape }: { eyeType: EyeType; headShape: HeadShape }) {
  const fwd = headShape === 'square' ? 0.36 : HEAD_R * 0.92
  const up  = headShape === 'square' ? 0.09 : 0.05
  const mat = <meshStandardMaterial color="#111111" />

  if (eyeType === 'dot') return (
    <>
      <mesh position={[ 0.13, up, fwd]}><sphereGeometry args={[0.055, 8, 8]} />{mat}</mesh>
      <mesh position={[-0.13, up, fwd]}><sphereGeometry args={[0.055, 8, 8]} />{mat}</mesh>
    </>
  )
  if (eyeType === 'wide') return (
    <>
      <mesh position={[ 0.17, up, fwd]}><sphereGeometry args={[0.115, 8, 8]} />{mat}</mesh>
      <mesh position={[-0.17, up, fwd]}><sphereGeometry args={[0.115, 8, 8]} />{mat}</mesh>
    </>
  )
  if (eyeType === 'angry') return (
    <>
      <mesh position={[ 0.15, up + 0.03, fwd]} rotation={[0, 0, -0.5]} scale={[0.6, 1, 0.6]}>
        <sphereGeometry args={[0.10, 8, 6]} />{mat}
      </mesh>
      <mesh position={[-0.15, up + 0.03, fwd]} rotation={[0, 0, 0.5]} scale={[0.6, 1, 0.6]}>
        <sphereGeometry args={[0.10, 8, 6]} />{mat}
      </mesh>
    </>
  )
  // round
  return (
    <>
      <mesh position={[ 0.15, up, fwd]}><sphereGeometry args={[0.08, 8, 8]} />{mat}</mesh>
      <mesh position={[-0.15, up, fwd]}><sphereGeometry args={[0.08, 8, 8]} />{mat}</mesh>
    </>
  )
}

// ─── Hats ─────────────────────────────────────────────────────────────────────
function Hat({ hat, accentColor }: { hat: HatType; accentColor: string }) {
  const topY = HEAD_R + 0.05
  const mat  = <meshStandardMaterial color={accentColor} roughness={0.4} />

  if (hat === 'none') return null

  if (hat === 'tophat') return (
    <group position={[0, topY, 0]}>
      <mesh><cylinderGeometry args={[0.55, 0.55, 0.07, 12]} />{mat}</mesh>
      <mesh position={[0, 0.27, 0]}><cylinderGeometry args={[0.28, 0.30, 0.46, 12]} />{mat}</mesh>
    </group>
  )

  if (hat === 'crown') return (
    <group position={[0, topY - 0.04, 0]}>
      <mesh><torusGeometry args={[0.30, 0.07, 8, 16]} />{mat}</mesh>
      {[0,1,2,3,4].map(i => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.30, 0.20, Math.sin(a) * 0.30]}>
            <coneGeometry args={[0.07, 0.28, 6]} />{mat}
          </mesh>
        )
      })}
    </group>
  )

  if (hat === 'antenna') return (
    <group position={[0, topY, 0]}>
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.04, 0.04, 0.44, 6]} />{mat}</mesh>
      <mesh position={[0, 0.50, 0]}><sphereGeometry args={[0.11, 8, 8]} />{mat}</mesh>
    </group>
  )

  if (hat === 'helmet') return (
    <group position={[0, topY * 0.4, 0]}>
      <mesh scale={[1.15, 0.9, 1.15]}>
        <sphereGeometry args={[HEAD_R + 0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        {mat}
      </mesh>
      <mesh position={[0, -0.02, HEAD_R * 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.46, 0.04, 0.14]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )

  return null
}
