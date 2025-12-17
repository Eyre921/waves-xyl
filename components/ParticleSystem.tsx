import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateShapePositions } from '../utils/math';
import { ShapeType, AudioData } from '../types';

// Custom Shader Material for Ink/Galaxy effect
const InkParticleShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color('#FFFFFF') }, // Starlight White
    uColorB: { value: new THREE.Color('#A5C9CA') }, // Glacial Blue
    uColorC: { value: new THREE.Color('#F2E8C4') }, // Champagne Gold
    uPixelRatio: { value: 1 },
    uSize: { value: 12.0 }, 
    uBass: { value: 0 },
    uTreble: { value: 0 },
    uSensitivity: { value: 1.0 },
    uHandFactor: { value: 1.0 }, 
    uAudioLevel: { value: 0 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uSize;
    uniform float uPixelRatio;
    uniform float uBass;
    uniform float uTreble;
    uniform float uSensitivity; 
    uniform float uHandFactor;
    uniform float uAudioLevel;
    
    attribute float aScale;
    attribute vec3 aRandomness;
    
    varying vec3 vRandom;
    varying float vAlpha;

    void main() {
      vRandom = aRandomness;
      vec3 pos = position;
      
      // -- HAND GESTURE CONTROL --
      float contraction = smoothstep(0.0, 1.0, uHandFactor);
      float shapeScale = 0.1 + 1.8 * contraction; // Larger expansion
      
      pos *= shapeScale;
      
      // Twist effect
      if (uHandFactor < 0.9) {
          float dist = length(pos.xy);
          float twistStrength = 4.0 * (1.0 - uHandFactor);
          float angle = twistStrength * (1.0 - smoothstep(0.0, 15.0, dist));
          float s = sin(angle);
          float c = cos(angle);
          float nx = pos.x * c - pos.y * s;
          float ny = pos.x * s + pos.y * c;
          pos.x = nx;
          pos.y = ny;
          pos.z += (1.0 - uHandFactor) * sin(dist * 0.5 - uTime * 2.0) * 2.0;
      }
      
      // -- PRECISE BEAT DETECTION LOGIC --
      
      // 1. Idle State (Breathing)
      // Very slow, organic movement when no music
      float idleSpeed = uTime * 0.1;
      float idleAmp = 0.2;
      pos.x += sin(idleSpeed + pos.y * 0.2) * idleAmp;
      pos.y += cos(idleSpeed + pos.x * 0.2) * idleAmp;
      pos.z += sin(idleSpeed * 0.8 + pos.z * 0.2) * idleAmp;

      // 2. Active State (Explosive Beat)
      // uAudioLevel is pre-processed non-linear bass from JS
      if (uAudioLevel > 0.01) {
          // Normal expansion (Explosion)
          vec3 normal = normalize(pos);
          float explosion = uAudioLevel * 5.0 * uSensitivity;
          pos += normal * explosion * aScale;
          
          // High freq vibration
          float vibration = sin(uTime * 20.0 + pos.x) * uAudioLevel * 0.5;
          pos += vibration;
      }
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = uSize * aScale * uPixelRatio * (1.0 + uAudioLevel * 1.5);
      gl_PointSize *= (20.0 / -mvPosition.z); // Increased perspective factor
      
      // Pass data to fragment
      vAlpha = 0.6 + uTreble * 0.4; 
    }
  `,
  fragmentShader: `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform float uBass;
    uniform float uSensitivity;
    uniform float uTime;

    varying vec3 vRandom;
    varying float vAlpha;

    vec3 hueShift(vec3 color, float hue) {
        const vec3 k = vec3(0.57735, 0.57735, 0.57735);
        float cosAngle = cos(hue);
        return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
    }

    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      if (d > 0.5) discard;

      // Soft glow edge
      float strength = pow(1.0 - d * 2.0, 2.5); // Sharp core, soft edge
      
      vec3 variedA = hueShift(uColorA, vRandom.x * 0.1); 
      vec3 variedB = hueShift(uColorB, vRandom.y * 0.1); 

      vec3 finalColor = mix(variedA, variedB, strength);
      
      vec3 variedC = hueShift(uColorC, vRandom.z * 0.2); 
      float flash = smoothstep(0.4, 0.6, strength) * uBass * 2.0 * uSensitivity;
      
      finalColor = mix(finalColor, variedC, flash);

      gl_FragColor = vec4(finalColor, vAlpha * strength);
    }
  `
};

interface ParticleSystemProps {
  count: number;
  currentShape: ShapeType;
  audioData: AudioData;
  handFactor: number;
  colors: { a: string; b: string; c: string };
  size: number;        
  sensitivity: number; 
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ 
  count, 
  currentShape, 
  audioData, 
  handFactor,
  colors,
  size,
  sensitivity
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const [currentPositions, setCurrentPositions] = useState<Float32Array>(() => generateShapePositions(ShapeType.NEBULA, count));
  const [targetPositions, setTargetPositions] = useState<Float32Array>(() => generateShapePositions(currentShape, count));
  
  // Smooth audio level for transition
  const smoothedBassRef = useRef(0);

  const randomAttributes = useMemo(() => {
    const scales = new Float32Array(count);
    const randomness = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      scales[i] = 0.5 + Math.random() * 0.5;
      randomness[i * 3] = Math.random();     
      randomness[i * 3 + 1] = Math.random(); 
      randomness[i * 3 + 2] = Math.random(); 
    }
    return { scales, randomness };
  }, [count]);

  useEffect(() => {
    setTargetPositions(generateShapePositions(currentShape, count));
  }, [currentShape, count]);

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    const morphSpeed = 0.03 + (audioData.treble * 0.05);

    // Morph Logic
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const tx = targetPositions[ix];
      const ty = targetPositions[iy];
      const tz = targetPositions[iz];

      positions[ix] += (tx - positions[ix]) * morphSpeed;
      positions[iy] += (ty - positions[iy]) * morphSpeed;
      positions[iz] += (tz - positions[iz]) * morphSpeed;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // -- Audio Signal Processing --
    // Noise Gate: Ignore weak signals
    let rawBass = audioData.bass;
    if (rawBass < 0.2) rawBass = 0;
    
    // Non-linear response (Exponential) for "Pop" effect
    const popBass = Math.pow(rawBass, 3.0); 

    // Smoothing (Lerp) to prevent jagged jumps
    smoothedBassRef.current += (popBass - smoothedBassRef.current) * 0.3;

    // Update Uniforms
    materialRef.current.uniforms.uColorA.value.setStyle(colors.a);
    materialRef.current.uniforms.uColorB.value.setStyle(colors.b);
    materialRef.current.uniforms.uColorC.value.setStyle(colors.c);
    
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uBass.value = audioData.bass;
    materialRef.current.uniforms.uTreble.value = audioData.treble;
    materialRef.current.uniforms.uSize.value = size; 
    materialRef.current.uniforms.uSensitivity.value = sensitivity;
    materialRef.current.uniforms.uHandFactor.value = handFactor; 
    
    // Pass the processed "Pop" level to shader
    materialRef.current.uniforms.uAudioLevel.value = smoothedBassRef.current;
    
    pointsRef.current.rotation.y = time * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={currentPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={count}
          array={randomAttributes.scales}
          itemSize={1}
        />
         <bufferAttribute
          attach="attributes-aRandomness"
          count={count}
          array={randomAttributes.randomness}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        attach="material"
        args={[InkParticleShader]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleSystem;