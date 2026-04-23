import { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import GameScene from './game/GameScene'
import HUD from './ui/HUD'
import StartScreen from './ui/StartScreen'
import CharacterBuilder from './ui/CharacterBuilder'
import { useGameStore } from './store/gameStore'

type AppPhase = 'start' | 'builder' | 'game'

// ─── Game wrapper (resets store on mount) ─────────────────────────────────────
function Game({ onRestart, onEditCharacter }: { onRestart: () => void; onEditCharacter: () => void }) {
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
      <HUD onRestart={onRestart} onEditCharacter={onEditCharacter} />
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [appPhase, setAppPhase] = useState<AppPhase>('start')
  // Use a key to force-remount the game scene for a clean restart
  const [gameKey, setGameKey] = useState(0)
  const resetGame = useGameStore((s) => s.resetGame)

  const goToGame = useCallback(() => {
    setAppPhase('game')
  }, [])

  const goToBuilder = useCallback(() => {
    setAppPhase('builder')
  }, [])

  const handleRestart = useCallback(() => {
    resetGame()
    setGameKey(k => k + 1)
    setAppPhase('game')
  }, [resetGame])

  const handleEditCharacter = useCallback(() => {
    setAppPhase('builder')
  }, [])

  if (appPhase === 'start') {
    return <StartScreen onPlay={goToBuilder} />
  }

  if (appPhase === 'builder') {
    return <CharacterBuilder onPlay={goToGame} onBack={() => setAppPhase('start')} />
  }

  return (
    <Game
      key={gameKey}
      onRestart={handleRestart}
      onEditCharacter={handleEditCharacter}
    />
  )
}
