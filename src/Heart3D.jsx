import React, { useRef, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stage } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

function HeartModel({ heartRate }) {
  const modelRef = useRef()
  const [model, setModel] = useState(null)
  
  useEffect(() => {
    const loader = new GLTFLoader()
    loader.load(
      '/abnormal_canine_heart.glb',
      (gltf) => {
        console.log('Model loaded successfully', gltf)
        gltf.scene.scale.set(0.05, 0.05, 0.05)
        setModel(gltf.scene)
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%')
      },
      (error) => {
        console.error('Error loading model:', error)
      }
    )
  }, [])
  
  if (!model) return null
  
  return <primitive object={model} />
}

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#ff6b6b" wireframe />
    </mesh>
  )
}

export default function Heart3D({ heartRate = 72 }) {
  return (
    <div style={{ 
      width: '100%', 
      height: '400px', 
      borderRadius: '12px', 
      overflow: 'hidden',
      background: '#0a0a0a'
    }}>
      <Canvas 
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={<Loader />}>
          <Stage environment="city" intensity={0.5}>
            <HeartModel heartRate={heartRate} />
          </Stage>
        </Suspense>
      </Canvas>
    </div>
  )
}
