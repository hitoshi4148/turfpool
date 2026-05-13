import { POOL_PLANE_H, POOL_PLANE_W } from '../../config/turfConstants'

/** Flat pool bottom (pitch markings sit on this plane). */
export function PoolFloorMesh() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[POOL_PLANE_W, POOL_PLANE_H]} />
      <meshStandardMaterial
        color="#0c1f14"
        roughness={0.92}
        metalness={0.04}
      />
    </mesh>
  )
}
