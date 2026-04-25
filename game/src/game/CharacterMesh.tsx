import { useRef, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type {
  CharacterBuild,
  HeadShape,
  HatType,
  EyeType,
  ArmType,
  LegType,
  FeetType,
  OutfitType,
  AccessoryType,
  TorsoType,
} from '../store/characterStore'
import { BODY_SCALES } from '../store/characterStore'
import { CAPSULE_RADIUS, CAPSULE_HEIGHT } from '../constants/physics'

const HEAD_R = 0.38

interface CharacterMeshProps {
  build: CharacterBuild
  preview?: boolean
}

const CharacterMesh = forwardRef<THREE.Group, CharacterMeshProps>(
  ({ build, preview = false }, ref) => {
    const spinRef = useRef<THREE.Group>(null!)

    useFrame((_, dt) => {
      if (preview && spinRef.current) spinRef.current.rotation.y += dt * 1.1
    })

    const bs = BODY_SCALES[build.bodyType]
    const { primary, secondary, accent } = build.palette

    const bodyTopY = (CAPSULE_HEIGHT / 2) * bs.body[1]
    const headCenterY = bodyTopY + HEAD_R * bs.head[1] + 0.05

    return (
      <group ref={ref}>
        <group ref={spinRef}>
          <group scale={bs.body}>
            <mesh castShadow>
              <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_HEIGHT - CAPSULE_RADIUS * 2, 4, 8]} />
              <meshStandardMaterial color={primary} roughness={0.45} metalness={0.05} />
            </mesh>

            <TorsoDecoration torso={build.torso} primary={primary} secondary={secondary} />
            <Outfit outfit={build.outfit} accent={accent} secondary={secondary} />
            <Accessory accessory={build.accessory} accent={accent} />
            <Legs legs={build.legs} feet={build.feet} primary={primary} accent={accent} />
            <Arms arms={build.arms} color={primary} bodyScaleX={bs.body[0]} />
          </group>

          <group position={[0, headCenterY, 0]} scale={bs.head}>
            <HeadShapeMesh shape={build.headShape} color={secondary} />
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

function Arms({ arms, color, bodyScaleX }: { arms: ArmType; color: string; bodyScaleX: number }) {
  const x = CAPSULE_RADIUS / bodyScaleX + 0.3
  if (arms === 'robot') {
    return (
      <>
        <mesh position={[x, 0.22, 0]} rotation={[0, 0, 0.35]} castShadow>
          <boxGeometry args={[0.2, 0.46, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.25} metalness={0.35} />
        </mesh>
        <mesh position={[-x, 0.22, 0]} rotation={[0, 0, -0.35]} castShadow>
          <boxGeometry args={[0.2, 0.46, 0.2]} />
          <meshStandardMaterial color={color} roughness={0.25} metalness={0.35} />
        </mesh>
      </>
    )
  }

  const radius = arms === 'noodle' ? 0.08 : arms === 'mitt' ? 0.1 : 0.13
  const height = arms === 'noodle' ? 0.62 : arms === 'mitt' ? 0.5 : 0.44

  return (
    <>
      <mesh position={[x, 0.18, 0]} rotation={[0, 0, 0.6]} castShadow>
        <capsuleGeometry args={[radius, height, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[-x, 0.18, 0]} rotation={[0, 0, -0.6]} castShadow>
        <capsuleGeometry args={[radius, height, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </>
  )
}

function Legs({ legs, feet, primary, accent }: { legs: LegType; feet: FeetType; primary: string; accent: string }) {
  const y = -CAPSULE_HEIGHT * 0.5 + 0.12
  const legGap = legs === 'peg' ? 0.11 : 0.17
  const legH = legs === 'spring' ? 0.38 : legs === 'stomp' ? 0.28 : 0.34
  const legR = legs === 'stomp' ? 0.11 : legs === 'peg' ? 0.08 : 0.09

  return (
    <>
      {[1, -1].map((dir) => (
        <group key={dir} position={[dir * legGap, y, 0]}>
          {legs === 'spring' ? (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusKnotGeometry args={[0.05, 0.015, 48, 6, 2, 3]} />
              <meshStandardMaterial color={primary} metalness={0.2} roughness={0.35} />
            </mesh>
          ) : legs === 'peg' ? (
            <mesh>
              <cylinderGeometry args={[legR, legR * 0.7, legH, 6]} />
              <meshStandardMaterial color={primary} roughness={0.5} />
            </mesh>
          ) : (
            <mesh>
              <capsuleGeometry args={[legR, legH, 4, 6]} />
              <meshStandardMaterial color={primary} roughness={0.48} />
            </mesh>
          )}

          <Feet feet={feet} color={accent} y={-legH * 0.45 - 0.08} />
        </group>
      ))}
    </>
  )
}

function Feet({ feet, color, y }: { feet: FeetType; color: string; y: number }) {
  if (feet === 'boots') {
    return (
      <mesh position={[0, y, 0.05]} castShadow>
        <boxGeometry args={[0.22, 0.16, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
    )
  }

  if (feet === 'flippers') {
    return (
      <mesh position={[0, y - 0.02, 0.12]} rotation={[0.15, 0, 0]} castShadow>
        <sphereGeometry args={[0.13, 12, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
    )
  }

  if (feet === 'hooves') {
    return (
      <mesh position={[0, y - 0.02, 0.04]} castShadow>
        <coneGeometry args={[0.1, 0.16, 6]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
    )
  }

  return (
    <mesh position={[0, y, 0.07]} castShadow>
      <capsuleGeometry args={[0.09, 0.18, 4, 6]} />
      <meshStandardMaterial color={color} roughness={0.45} />
    </mesh>
  )
}

function TorsoDecoration({ torso, primary, secondary }: { torso: TorsoType; primary: string; secondary: string }) {
  if (torso === 'barrel') {
    return (
      <mesh scale={[1.08, 0.84, 1.08]} castShadow>
        <sphereGeometry args={[0.48, 16, 10]} />
        <meshStandardMaterial color={secondary} roughness={0.45} />
      </mesh>
    )
  }

  if (torso === 'wedge') {
    return (
      <mesh position={[0, -0.02, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0.48, 0.25, 0.82, 4]} />
        <meshStandardMaterial color={secondary} roughness={0.45} />
      </mesh>
    )
  }

  if (torso === 'pear') {
    return (
      <group>
        <mesh position={[0, -0.05, 0]} scale={[1.1, 0.95, 1.1]} castShadow>
          <sphereGeometry args={[0.45, 14, 10]} />
          <meshStandardMaterial color={secondary} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.25, 0]} scale={[0.75, 0.6, 0.75]} castShadow>
          <sphereGeometry args={[0.45, 14, 10]} />
          <meshStandardMaterial color={primary} roughness={0.5} />
        </mesh>
      </group>
    )
  }

  return (
    <mesh scale={[0.9, 1.05, 0.9]} castShadow>
      <capsuleGeometry args={[0.42, 0.46, 4, 8]} />
      <meshStandardMaterial color={secondary} roughness={0.45} />
    </mesh>
  )
}

function Outfit({ outfit, accent, secondary }: { outfit: OutfitType; accent: string; secondary: string }) {
  if (outfit === 'none') return null

  if (outfit === 'wrestler') {
    return (
      <>
        <mesh position={[0, -0.08, 0]}>
          <torusGeometry args={[0.43, 0.06, 8, 18]} />
          <meshStandardMaterial color={accent} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <torusGeometry args={[0.36, 0.05, 8, 18]} />
          <meshStandardMaterial color={accent} roughness={0.4} />
        </mesh>
      </>
    )
  }

  if (outfit === 'plumber') {
    return (
      <>
        <mesh position={[0, -0.04, 0.41]}>
          <boxGeometry args={[0.5, 0.46, 0.05]} />
          <meshStandardMaterial color={accent} roughness={0.45} />
        </mesh>
        <mesh position={[0.12, 0.2, 0.41]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.1, 0.45, 0.04]} />
          <meshStandardMaterial color={accent} roughness={0.45} />
        </mesh>
        <mesh position={[-0.12, 0.2, 0.41]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.1, 0.45, 0.04]} />
          <meshStandardMaterial color={accent} roughness={0.45} />
        </mesh>
      </>
    )
  }

  if (outfit === 'alien') {
    return (
      <mesh position={[0, 0.08, 0]}>
        <torusKnotGeometry args={[0.38, 0.04, 80, 8, 2, 3]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} roughness={0.2} />
      </mesh>
    )
  }

  if (outfit === 'frog') {
    return (
      <mesh position={[0, 0.24, 0.37]} castShadow>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial color={secondary} roughness={0.35} />
      </mesh>
    )
  }

  return (
    <>
      <mesh position={[0, 0.14, 0.37]}>
        <sphereGeometry args={[0.15, 10, 8]} />
        <meshStandardMaterial color={accent} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.14, 0.37]}>
        <sphereGeometry args={[0.15, 10, 8]} />
        <meshStandardMaterial color={accent} roughness={0.35} />
      </mesh>
    </>
  )
}

function Accessory({ accessory, accent }: { accessory: AccessoryType; accent: string }) {
  if (accessory === 'none') return null

  if (accessory === 'cape') {
    return (
      <mesh position={[0, -0.02, -0.34]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.75, 0.78, 0.04]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
    )
  }

  if (accessory === 'fanny') {
    return (
      <mesh position={[0, -0.02, 0.44]}>
        <capsuleGeometry args={[0.11, 0.26, 4, 8]} />
        <meshStandardMaterial color={accent} roughness={0.45} />
      </mesh>
    )
  }

  if (accessory === 'floaty') {
    return (
      <mesh position={[0, 0.0, 0]}>
        <torusGeometry args={[0.54, 0.1, 12, 20]} />
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
    )
  }

  if (accessory === 'spikes') {
    return (
      <group position={[0, 0.18, 0]}>
        {[...Array(6)].map((_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42]}>
              <coneGeometry args={[0.06, 0.16, 6]} />
              <meshStandardMaterial color={accent} roughness={0.4} />
            </mesh>
          )
        })}
      </group>
    )
  }

  return (
    <group position={[0, 0.1, 0.44]}>
      <mesh position={[0, 0.08, 0]}>
        <coneGeometry args={[0.11, 0.24, 10]} />
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
      <mesh position={[0.12, 0.02, 0]} rotation={[0, 0, -0.3]}>
        <coneGeometry args={[0.11, 0.24, 10]} />
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
      <mesh position={[-0.12, 0.02, 0]} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.11, 0.24, 10]} />
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
    </group>
  )
}

function HeadShapeMesh({ shape, color }: { shape: HeadShape; color: string }) {
  const mat = <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
  if (shape === 'square') return <mesh castShadow><boxGeometry args={[0.68, 0.68, 0.68]} />{mat}</mesh>
  if (shape === 'oval') return <mesh scale={[0.82, 1.25, 0.82]} castShadow><sphereGeometry args={[HEAD_R, 14, 10]} />{mat}</mesh>
  return <mesh castShadow><sphereGeometry args={[HEAD_R, 14, 10]} />{mat}</mesh>
}

function Eyes({ eyeType, headShape }: { eyeType: EyeType; headShape: HeadShape }) {
  const fwd = headShape === 'square' ? 0.36 : HEAD_R * 0.92
  const up = headShape === 'square' ? 0.09 : 0.05
  const mat = <meshStandardMaterial color="#111111" />

  if (eyeType === 'dot') return (
    <>
      <mesh position={[0.13, up, fwd]}><sphereGeometry args={[0.055, 8, 8]} />{mat}</mesh>
      <mesh position={[-0.13, up, fwd]}><sphereGeometry args={[0.055, 8, 8]} />{mat}</mesh>
    </>
  )
  if (eyeType === 'wide') return (
    <>
      <mesh position={[0.17, up, fwd]}><sphereGeometry args={[0.115, 8, 8]} />{mat}</mesh>
      <mesh position={[-0.17, up, fwd]}><sphereGeometry args={[0.115, 8, 8]} />{mat}</mesh>
    </>
  )
  if (eyeType === 'angry') return (
    <>
      <mesh position={[0.15, up + 0.03, fwd]} rotation={[0, 0, -0.5]} scale={[0.6, 1, 0.6]}>
        <sphereGeometry args={[0.1, 8, 6]} />{mat}
      </mesh>
      <mesh position={[-0.15, up + 0.03, fwd]} rotation={[0, 0, 0.5]} scale={[0.6, 1, 0.6]}>
        <sphereGeometry args={[0.1, 8, 6]} />{mat}
      </mesh>
    </>
  )
  return (
    <>
      <mesh position={[0.15, up, fwd]}><sphereGeometry args={[0.08, 8, 8]} />{mat}</mesh>
      <mesh position={[-0.15, up, fwd]}><sphereGeometry args={[0.08, 8, 8]} />{mat}</mesh>
    </>
  )
}

function Hat({ hat, accentColor }: { hat: HatType; accentColor: string }) {
  const topY = HEAD_R + 0.05
  const mat = <meshStandardMaterial color={accentColor} roughness={0.4} />

  if (hat === 'none') return null
  if (hat === 'tophat') return (
    <group position={[0, topY, 0]}>
      <mesh><cylinderGeometry args={[0.55, 0.55, 0.07, 12]} />{mat}</mesh>
      <mesh position={[0, 0.27, 0]}><cylinderGeometry args={[0.28, 0.3, 0.46, 12]} />{mat}</mesh>
    </group>
  )

  if (hat === 'crown') return (
    <group position={[0, topY - 0.04, 0]}>
      <mesh><torusGeometry args={[0.3, 0.07, 8, 16]} />{mat}</mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3]}>
            <coneGeometry args={[0.07, 0.28, 6]} />{mat}
          </mesh>
        )
      })}
    </group>
  )

  if (hat === 'antenna') return (
    <group position={[0, topY, 0]}>
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.04, 0.04, 0.44, 6]} />{mat}</mesh>
      <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.11, 8, 8]} />{mat}</mesh>
    </group>
  )

  return (
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
}
