import * as THREE from 'three';
import { ShapeType } from '../types';

export const generateShapePositions = (type: ShapeType, count: number, radius: number = 10): Float32Array => {
  const positions = new Float32Array(count * 3);
  const tempVec = new THREE.Vector3();

  // Helper for Fractals
  const getTetrahedronPoint = (depth: number): THREE.Vector3 => {
     let pt = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
     ).normalize().multiplyScalar(radius);
     
     // Sierpinski / Koch Tetrahedron IFS approximation
     // 4 Vertices of a tetrahedron
     const v = [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(-1, -1, 1),
        new THREE.Vector3(-1, 1, -1),
        new THREE.Vector3(1, -1, -1)
     ];
     
     let current = pt.clone();
     for(let i=0; i<depth; i++) {
        const target = v[Math.floor(Math.random() * 4)];
        current.sub(target).multiplyScalar(0.5).add(target);
     }
     return current.multiplyScalar(radius * 0.8);
  }

  for (let i = 0; i < count; i++) {
    const t = i / count;
    
    // Default Fallback
    let x = (Math.random() - 0.5) * 2 * radius;
    let y = (Math.random() - 0.5) * 2 * radius;
    let z = (Math.random() - 0.5) * 2 * radius;

    switch (type) {
      case ShapeType.NEBULA: {
        const r = Math.random() * radius;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        tempVec.setFromSphericalCoords(r, phi, theta);
        
        // Swirl
        const armOffset = Math.sin(r * 0.5);
        const nx = tempVec.x * Math.cos(armOffset) - tempVec.z * Math.sin(armOffset);
        const nz = tempVec.x * Math.sin(armOffset) + tempVec.z * Math.cos(armOffset);
        tempVec.set(nx, tempVec.y * 0.3, nz);
        break;
      }

      case ShapeType.HEART: {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI; 
        const u = phi;
        const hx = 16 * Math.pow(Math.sin(u), 3);
        const hy = 13 * Math.cos(u) - 5 * Math.cos(2*u) - 2 * Math.cos(3*u) - Math.cos(4*u);
        const hz = (Math.random() - 0.5) * 6 * Math.sin(u); 
        tempVec.set(hx, hy, hz).multiplyScalar(0.4);
        break;
      }

      case ShapeType.FLOWER: {
        const u = t * Math.PI * 2 * 10;
        const r = Math.cos(5 * u) * radius;
        const y_val = Math.pow(Math.abs(r)/radius, 2) * 5 - 2;
        tempVec.set(r * Math.cos(u), y_val + (Math.random()-0.5), r * Math.sin(u));
        break;
      }

      case ShapeType.SATURN: {
        if (i < count * 0.4) {
          const r = radius * 0.6;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          tempVec.setFromSphericalCoords(r, phi, theta);
        } else {
          const angle = Math.random() * Math.PI * 2;
          const dist = radius * (1.2 + Math.random() * 0.8);
          const tilt = Math.PI / 6;
          tempVec.set(dist * Math.cos(angle), (Math.random()-0.5)*0.5, dist * Math.sin(angle));
          tempVec.applyAxisAngle(new THREE.Vector3(1,0,0), tilt);
        }
        break;
      }

      case ShapeType.CAKE: {
        // Refined Cake Model
        // Bottom Tier: r=1.0, y=[0, 0.4]
        // Top Tier: r=0.7, y=[0.4, 0.7]
        // Details: Sine wave piping, Candles
        
        const rand = Math.random();
        const bottomTierR = radius;
        const topTierR = radius * 0.65;
        const bottomH = radius * 0.5;
        const topH = radius * 0.4;
        
        if (i > count * 0.98) {
             // Flames (Center of candles)
             const candleCount = 6;
             const cIdx = Math.floor(Math.random() * candleCount);
             const angle = (cIdx / candleCount) * Math.PI * 2;
             const cr = topTierR * 0.6;
             const cy = bottomH + topH + radius * 0.15 + Math.random() * 0.2;
             tempVec.set(cr * Math.cos(angle), cy, cr * Math.sin(angle));
             // Jitter for flame effect
             tempVec.x += (Math.random()-0.5)*0.1;
             tempVec.z += (Math.random()-0.5)*0.1;
        } 
        else if (i > count * 0.95) {
             // Candles Body
             const candleCount = 6;
             const cIdx = Math.floor(Math.random() * candleCount);
             const angle = (cIdx / candleCount) * Math.PI * 2;
             const cr = topTierR * 0.6;
             const ch = Math.random() * radius * 0.15;
             tempVec.set(cr * Math.cos(angle), bottomH + topH + ch, cr * Math.sin(angle));
        }
        else if (i > count * 0.90) {
             // Piping / Decorations (Sine wave rings)
             const angle = Math.random() * Math.PI * 2;
             const isTop = Math.random() > 0.5;
             const rBase = isTop ? topTierR : bottomTierR;
             const yBase = isTop ? (bottomH + topH) : bottomH;
             const rOffset = 0.5 * Math.sin(angle * 20); // Wavy pattern
             tempVec.set((rBase + rOffset*0.2) * Math.cos(angle), yBase, (rBase + rOffset*0.2) * Math.sin(angle));
        }
        else if (i > count * 0.55) {
             // Top Tier
             const angle = Math.random() * Math.PI * 2;
             const r = Math.sqrt(Math.random()) * topTierR;
             const h = Math.random() * topH;
             tempVec.set(r * Math.cos(angle), bottomH + h, r * Math.sin(angle));
        } else {
             // Bottom Tier
             const angle = Math.random() * Math.PI * 2;
             const r = Math.sqrt(Math.random()) * bottomTierR;
             const h = Math.random() * bottomH;
             tempVec.set(r * Math.cos(angle), h, r * Math.sin(angle));
        }
        
        // Center the cake vertically
        tempVec.y -= radius * 0.5;
        break;
      }

      case ShapeType.FIREWORKS: {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.pow(Math.random(), 0.1) * radius * 1.5; 
        tempVec.setFromSphericalCoords(r, phi, theta);
        break;
      }

      case ShapeType.SPIRAL: {
        // Archimedean Spiral Galaxy
        // r = a + b * theta
        const loops = 4;
        const theta = t * Math.PI * 2 * loops;
        const r = (theta / (Math.PI * 2 * loops)) * radius * 1.5;
        // Add thickness and scatter
        const scatter = (Math.random() - 0.5) * (radius * 0.2);
        tempVec.set((r + scatter) * Math.cos(theta), (Math.random()-0.5) * radius * 0.1, (r+scatter) * Math.sin(theta));
        break;
      }

      case ShapeType.LEMNISCATE: {
        // Bernoulli Lemniscate (Mobius Strip feel)
        const tVal = t * Math.PI * 2;
        const scale = radius * 1.2;
        const sinT = Math.sin(tVal);
        const cosT = Math.cos(tVal);
        const div = 1 + sinT * sinT;
        
        // Base Curve
        const bx = (scale * cosT) / div;
        const by = (scale * cosT * sinT) / div;
        
        // Thickness (Twist)
        const thickness = (Math.random() - 0.5) * 2.0;
        tempVec.set(bx, by, thickness);
        
        // Rotate to be 3D nice
        tempVec.applyAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
        break;
      }

      case ShapeType.KOCH: {
         // 3D Fractal Cloud (Koch/Sierpinski Tetrahedron)
         const pt = getTetrahedronPoint(6);
         tempVec.copy(pt);
         break;
      }

      case ShapeType.ASTROID: {
         // Astroidal Ellipsoid
         // x^2/3 + y^2/3 + z^2/3 = a^2/3
         // x = R cos^3 u cos^3 v, y = R sin^3 u cos^3 v, z = R sin^3 v
         const u = Math.random() * Math.PI * 2;
         const v = (Math.random() - 0.5) * Math.PI;
         const r = radius * 1.2;
         
         const cosU = Math.cos(u); const sinU = Math.sin(u);
         const cosV = Math.cos(v); const sinV = Math.sin(v);
         
         tempVec.x = r * Math.pow(cosU, 3) * Math.pow(cosV, 3);
         tempVec.z = r * Math.pow(sinU, 3) * Math.pow(cosV, 3);
         tempVec.y = r * Math.pow(sinV, 3);
         break;
      }

      case ShapeType.BUTTERFLY: {
        // Temple H. Fay's Butterfly Curve
        // r = exp(cos t) - 2 cos(4t) - sin^5(t/12)
        const loops = 12; // Needed to close the cycle approx
        const tVal = t * Math.PI * 2 * loops; 
        const term = Math.exp(Math.cos(tVal)) - 2*Math.cos(4*tVal) - Math.pow(Math.sin(tVal/12), 5);
        
        const r = radius * 0.3 * term;
        tempVec.x = r * Math.sin(tVal);
        tempVec.y = r * Math.cos(tVal);
        // Add Z volume based on wing span
        tempVec.z = (Math.random() - 0.5) * Math.abs(r) * 0.5;
        break;
      }

      case ShapeType.CATENOID: {
        // Catenoid Surface
        // x = c cosh(v/c) cos u
        // y = c cosh(v/c) sin u
        // z = v
        const c = radius * 0.3;
        const u = Math.random() * Math.PI * 2;
        const v = (t - 0.5) * radius * 1.5; // Height range
        
        const r = c * Math.cosh(v/c);
        tempVec.x = r * Math.cos(u);
        tempVec.z = r * Math.sin(u);
        tempVec.y = v;
        break;
      }

      case ShapeType.ROSE: {
        // 3D Spherical Rose / Rhodonea
        // r = sin(k * theta)
        const k = 6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        // Modulate radius based on angles to create petals in 3D
        const rBase = Math.sin(k * theta) * Math.sin(k * phi);
        const r = radius * (0.5 + 0.5 * Math.abs(rBase));
        
        tempVec.setFromSphericalCoords(r, phi, theta);
        break;
      }

      default:
        tempVec.setFromSphericalCoords(radius, Math.random()*Math.PI, Math.random()*Math.PI*2);
    }

    positions[i * 3] = tempVec.x;
    positions[i * 3 + 1] = tempVec.y;
    positions[i * 3 + 2] = tempVec.z;
  }

  return positions;
};