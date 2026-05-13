import { GizmoHelper, GizmoViewport, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import type { MetricId, PitchPointId, TurfIndices } from '../../types'
import { PoolDepthRulers3D } from './PoolDepthRulers3D'
import { PoolFloorMesh } from './PoolFloorMesh'
import { PoolPitchMarkings3D } from './PoolPitchMarkings3D'
import { TurfPoolMesh } from './TurfPoolMesh'

interface PoolSceneProps {
  indicesByPoint: Record<PitchPointId, TurfIndices>
  metric: MetricId
}

export function PoolScene({ indicesByPoint, metric }: PoolSceneProps) {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full touch-none"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <PerspectiveCamera makeDefault position={[0, 2.2, 2.4]} fov={50} />
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 2]} intensity={1.1} />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <Suspense fallback={null}>
        <PoolFloorMesh />
        <PoolPitchMarkings3D />
        <PoolDepthRulers3D indicesByPoint={indicesByPoint} metric={metric} />
        <TurfPoolMesh indicesByPoint={indicesByPoint} metric={metric} />
      </Suspense>
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport
          axisColors={['#f97316', '#22c55e', '#38bdf8']}
          labels={['X', 'Y', 'Z']}
          labelColor="#e2e8f0"
          hideNegativeAxes={false}
        />
      </GizmoHelper>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={1.4}
        maxDistance={6}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  )
}
