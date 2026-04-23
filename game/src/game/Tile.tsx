import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { TileState } from '../store/gameStore'
import { HEX_SIZE } from './HexGrid'
import { TILE_WARN_S, TILE_FLASH_S, TILE_DROP_S } from '../constants/physics'

export { TILE_WARN_S, TILE_FLASH_S, TILE_DROP_S }

const TOTAL_DESTROY_S = TILE_WARN_S + TILE_FLASH_S + TILE_DROP_S

// Shared hex geometry (flat-top, extruded)
const hexShape = (() => {
  const shape = new THREE.Shape()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i)
    const x = Math.cos(angle) * (HEX_SIZE - 0.02)
    const y = Math.sin(angle) * (HEX_SIZE - 0.02)
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
})()

const extrudeSettings: THREE.ExtrudeGeometryParameters = {
  depth: 0.28,
  bevelEnabled: true,
  bevelSize: 0.06,
  bevelThickness: 0.06,
  bevelSegments: 2,
}

const sharedGeo = new THREE.ExtrudeGeometry(hexShape, extrudeSettings)
// Rotate so the flat face is on top (XZ plane)
sharedGeo.rotateX(-Math.PI / 2)

// Colour palette per state
const COLOR_INTACT  = new THREE.Color('#5b9bd5')
const COLOR_CRACK   = new THREE.Color('#e8c547')
const COLOR_FLASH   = new THREE.Color('#e85a1b')
const COLOR_GONE    = new THREE.Color('#111111')

interface TileProps {
  id: string
  x: number
  z: number
  state: TileState
  stateAt: number
}

export default function Tile({ x, z, state, stateAt }: TileProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const matRef  = useRef<THREE.MeshStandardMaterial>(null!)

  const initialY = 0

  useFrame(() => {
    const mesh = meshRef.current
    const mat  = matRef.current
    if (!mesh || !mat) return

    const elapsed = (performance.now() - stateAt) / 1000

    if (state === 'intact') {
      mesh.position.y = initialY
      mat.color.copy(COLOR_INTACT)
      mesh.visible = true
      mat.opacity = 1
      mat.transparent = false
    } else if (state === 'cracking') {
      // Wobble
      mesh.position.y = initialY + Math.sin(elapsed * 30) * 0.03
      mat.color.copy(COLOR_CRACK)
    } else if (state === 'flashing') {
      // Fast flash between crack and flash colors
      const t = (Math.sin(elapsed * 25) + 1) / 2
      mat.color.lerpColors(COLOR_CRACK, COLOR_FLASH, t)
      mesh.position.y = initialY + Math.sin(elapsed * 40) * 0.05
    } else if (state === 'gone') {
      // Drop animation
      const dropElapsed = elapsed
      if (dropElapsed < TILE_DROP_S) {
        const t = dropElapsed / TILE_DROP_S
        mesh.position.y = initialY - t * t * 8
        mat.opacity = 1 - t
        mat.transparent = true
        mesh.visible = true
      } else {
        mesh.visible = false
      }
    }
  })

  const color = useMemo(() => {
    if (state === 'intact')   return COLOR_INTACT
    if (state === 'cracking') return COLOR_CRACK
    if (state === 'flashing') return COLOR_FLASH
    return COLOR_GONE
  }, [state])

  return (
    <mesh
      ref={meshRef}
      geometry={sharedGeo}
      position={[x, initialY, z]}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial
        ref={matRef}
        color={color}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  )
}

export { TOTAL_DESTROY_S }
