import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import {
  POOL_METRIC_DEPTH_AMPLITUDE,
  POOL_PLANE_H,
  POOL_PLANE_SEGMENTS_X,
  POOL_PLANE_SEGMENTS_Y,
  POOL_PLANE_W,
  POOL_WATER_SURFACE_BASE,
} from '../../config/turfConstants'
import {
  POOL_TEXTURE_ROUGH_DISPLACE,
  poolHeatColor,
} from '../../config/poolTheme'
import { interpolateMetricAt, minMaxNormalize } from '../../lib/analysis/interpolate'
import type { MetricId, PitchPointId, TurfIndices } from '../../types'
import { PITCH_POINT_ORDER } from '../../types'

interface TurfPoolMeshProps {
  indicesByPoint: Record<PitchPointId, TurfIndices>
  metric: MetricId
}

export function TurfPoolMesh({ indicesByPoint, metric }: TurfPoolMeshProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      POOL_PLANE_W,
      POOL_PLANE_H,
      POOL_PLANE_SEGMENTS_X,
      POOL_PLANE_SEGMENTS_Y,
    )
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)

    const byPoint = PITCH_POINT_ORDER.reduce(
      (acc, id) => {
        acc[id] = indicesByPoint[id][metric]
        return acc
      },
      {} as Record<PitchPointId, number>,
    )
    const vals = PITCH_POINT_ORDER.map((id) => byPoint[id])
    const minV = Math.min(...vals)
    const maxV = Math.max(...vals)
    const isTexture = metric === 'textureQuality'

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i)
      const ly = pos.getY(i)
      const u = lx / POOL_PLANE_W + 0.5
      // PlaneGeometry: +ly is world "up" on the plane; interpolate uses image UV (v=0 top, v=1 bottom).
      const v = 1 - (ly / POOL_PLANE_H + 0.5)
      const raw = interpolateMetricAt(u, v, byPoint)
      const norm = minMaxNormalize(raw, minV, maxV)
      const c = poolHeatColor(norm)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b

      let z =
        POOL_WATER_SURFACE_BASE + norm * POOL_METRIC_DEPTH_AMPLITUDE
      if (isTexture) {
        const rough = 1 - norm
        z +=
          Math.sin(lx * 38) *
          Math.cos(ly * 38) *
          rough *
          POOL_TEXTURE_ROUGH_DISPLACE
      }
      pos.setZ(i, z)
    }
    pos.needsUpdate = true
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [indicesByPoint, metric])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.48}
        roughness={0.26}
        metalness={0.1}
        depthWrite={false}
        toneMapped
      />
    </mesh>
  )
}
