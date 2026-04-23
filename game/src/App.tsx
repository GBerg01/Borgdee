import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import GameScene from './game/GameScene'
import HUD from './ui/HUD'

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [0, 22, 18], fov: 50, near: 0.1, far: 500 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={0.1}
            shadow-camera-far={100}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
          />
          <GameScene />
        </Suspense>
      </Canvas>
      <HUD />
    </div>
  )
}
