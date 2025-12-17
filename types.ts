export enum ShapeType {
  NEBULA = 'Nebula',
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  CAKE = 'Birthday Cake',
  FIREWORKS = 'Fireworks',
  SPIRAL = 'Archimedean Spiral',
  LEMNISCATE = 'Bernoulli Lemniscate',
  KOCH = 'Koch Snowflake',
  ASTROID = 'Astroid',
  BUTTERFLY = 'Butterfly Curve',
  CATENOID = 'Catenoid',
  ROSE = 'Rose Curve',
}

export interface AudioData {
  bass: number;   // 0.0 - 1.0
  mid: number;    // 0.0 - 1.0
  treble: number; // 0.0 - 1.0
}

export interface ParticleConfig {
  count: number;
  size: number;
  speed: number;
  colorA: string; // Ink/Dark
  colorB: string; // Light/Paper
  colorC: string; // Accent/Gold
}