// ────────────────────────────────────────────────────────────────────────────
//  LUMINAR TECHNOLOGY — cinematic 3D portfolio
//  A single, scroll-driven WebGL universe in five chapters.
//  Genesis → Intelligence → Innovation → Vision → Legacy.
// ────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader }      from 'three/addons/shaders/FXAAShader.js';

// ── reset scroll on every refresh so the story always plays from Chapter I ─
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));
window.addEventListener('load', () => window.scrollTo(0, 0));

// ── renderer ────────────────────────────────────────────────────────────────
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
// CAP AT 1.5 — biggest single perf win on retina. The composer chain
// (bloom + FXAA) becomes dramatically cheaper without a visible drop.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x02030a, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.74;     // -0.04 to compensate for bigger meshes

// ── scene & camera ──────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02030a, 0.033);   // slight lift — bigger objects stay legible

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 240);
camera.position.set(0, 0.4, 28);

// ── lighting (calm, restrained — bloom does the rest) ──────────────────────
const ambient = new THREE.AmbientLight(0x1a2230, 0.35);
scene.add(ambient);

const keyLight = new THREE.PointLight(0x6ef0ff, 1.3, 70);
keyLight.position.set(8, 6, 10);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0xb38bff, 0.9, 60);
rimLight.position.set(-10, -4, 6);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.12);
fillLight.position.set(0, 8, 14);
scene.add(fillLight);

// ── postprocessing — gentle bloom on highlights only ───────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.26, 0.35, 0.65
);
composer.addPass(bloom);

const fxaa = new ShaderPass(FXAAShader);
fxaa.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaa);

// ── starfield (deep background) ─────────────────────────────────────────────
{
  const starCount = 1400;
  const arr = new Float32Array(starCount * 3);
  const col = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 80 + Math.random() * 40;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    arr[i*3]   = r * Math.sin(p) * Math.cos(t);
    arr[i*3+1] = r * Math.sin(p) * Math.sin(t);
    arr[i*3+2] = r * Math.cos(p);
    const c = new THREE.Color().setHSL(0.58 + Math.random() * 0.08, 0.5, 0.65 + Math.random() * 0.2);
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({
    size: 0.22, vertexColors: true, transparent: true, opacity: 0.32,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  scene.add(new THREE.Points(g, m));
}

// ── main particle system ────────────────────────────────────────────────────
// Trimmed 7000 → 4500. With the meshes now doing the visual heavy lifting
// (wireframe globe, refractive crystal, pyramid scaffolding, etc.) the
// particle layer is deliberately THIN — accent, not centerpiece. The
// underlying 3D shapes can finally breathe and read clearly.
const PARTICLE_COUNT = 4500;

const positions = new Float32Array(PARTICLE_COUNT * 3); // chaos "home" — never mutated
const targetsA  = new Float32Array(PARTICLE_COUNT * 3); // ping-pong target buffer
const colors    = new Float32Array(PARTICLE_COUNT * 3);
const sizes     = new Float32Array(PARTICLE_COUNT);
const seeds     = new Float32Array(PARTICLE_COUNT); // per-particle randomness

for (let i = 0; i < PARTICLE_COUNT; i++) {
  // distribute in a thick spherical shell — "primordial chaos"
  const r = 14 + Math.pow(Math.random(), 0.5) * 26;
  const t = Math.random() * Math.PI * 2;
  const p = Math.acos(2 * Math.random() - 1);
  positions[i*3]     = r * Math.sin(p) * Math.cos(t);
  positions[i*3 + 1] = r * Math.sin(p) * Math.sin(t);
  positions[i*3 + 2] = r * Math.cos(p);

  targetsA[i*3]     = positions[i*3];
  targetsA[i*3 + 1] = positions[i*3 + 1];
  targetsA[i*3 + 2] = positions[i*3 + 2];

  // cyan→violet→white gradient
  const hue = 0.5 + Math.random() * 0.2; // 0.5 cyan .. 0.7 violet
  const sat = 0.55 + Math.random() * 0.35;
  const lig = 0.5  + Math.random() * 0.4;
  const c = new THREE.Color().setHSL(hue, sat, lig);
  colors[i*3]     = c.r;
  colors[i*3 + 1] = c.g;
  colors[i*3 + 2] = c.b;

  sizes[i] = 0.36 + Math.pow(Math.random(), 2.8) * 0.85;
  seeds[i] = Math.random();
}

const pGeom = new THREE.BufferGeometry();
pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
pGeom.setAttribute('aTarget',  new THREE.BufferAttribute(targetsA, 3));
pGeom.setAttribute('aColor',   new THREE.BufferAttribute(colors,   3));
pGeom.setAttribute('aSize',    new THREE.BufferAttribute(sizes,    1));
pGeom.setAttribute('aSeed',    new THREE.BufferAttribute(seeds,    1));

const particleMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime:        { value: 0 },
    uMix:         { value: 0 },          // 0 = chaos, 1 = formation
    uPixel:       { value: renderer.getPixelRatio() },
    uMouse:       { value: new THREE.Vector3() },
    uAccent:      { value: new THREE.Color(0x6ef0ff) },
    uShatter:     { value: 0 },          // 0 = intact, 1 = scattered outward
    uShake:       { value: 0 },          // 0..1 high-frequency jitter
  },
  vertexShader: /* glsl */`
    attribute vec3  aTarget;
    attribute vec3  aColor;
    attribute float aSize;
    attribute float aSeed;
    uniform float uTime;
    uniform float uMix;
    uniform float uPixel;
    uniform vec3  uMouse;
    uniform vec3  uAccent;
    uniform float uShatter;
    uniform float uShake;
    varying vec3  vColor;
    varying float vGlow;

    // smooth easing for organic interpolation
    float easeInOut(float t) {
      return t * t * (3.0 - 2.0 * t);
    }

    void main() {
      float em = easeInOut(clamp(uMix, 0.0, 1.0));

      // S-curve travel path: slight orbital arc as particles converge
      float arc = sin(em * 3.14159) * (1.0 - abs(em - 0.5) * 2.0);
      vec3 mid  = (position + aTarget) * 0.5
                + normalize(cross(aTarget - position, vec3(0.0, 1.0, 0.1))) * arc * 1.2 * aSeed;
      vec3 a = mix(position, mid, em * 2.0);
      vec3 b = mix(mid, aTarget, max(0.0, em * 2.0 - 1.0));
      vec3 p = mix(a, b, smoothstep(0.0, 1.0, em));

      // gentle ambient drift — alive but never chaotic
      float t = uTime * 0.35;
      p += 0.14 * vec3(
        sin(t + position.y * 0.45 + aSeed * 6.28),
        cos(t * 0.7 + position.x * 0.35 + aSeed * 6.28),
        sin(t * 0.9 + position.z * 0.25 + aSeed * 6.28)
      );

      // mouse-driven repulsion field — localized "consciousness"
      vec3 d = p - uMouse;
      float dist = length(d) + 0.001;
      float force = exp(-dist * 0.38) * 1.6;
      p += normalize(d) * force;

      // shatter: agitation breaks the formation apart outward
      vec3 outward = normalize(p + vec3(0.0001));
      vec3 randDir = vec3(
        sin(aSeed * 41.0 + 1.7),
        cos(aSeed * 31.7 + 2.3),
        sin(aSeed * 23.1 + 3.1)
      );
      vec3 shatterDir = normalize(outward + randDir * 0.65);
      float scatterAmt = uShatter * (3.2 + aSeed * 4.5);
      p += shatterDir * scatterAmt;

      // shake: high-frequency jitter as the form reels back together
      float shakeAmt = uShake * 0.55;
      p += shakeAmt * vec3(
        sin(uTime * 38.0 + aSeed * 91.0),
        cos(uTime * 41.0 + aSeed * 73.0),
        sin(uTime * 35.0 + aSeed * 57.0)
      );

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      // perspective sizing — small while travelling so chaos stays calm,
      // BUT particles grow to 1.55x when fully formed so text/shapes resolve
      // crisply (especially the stacked SAMIR / HASAN legacy reveal).
      float size = aSize * uPixel * (235.0 / -mv.z);
      size *= 0.42 + 0.65 * em;       // was 0.40 + 1.15 — much less peak swell
      gl_PointSize = size;

      // intensity: dim while travelling, much brighter when formed so
      // particle letters read against the dark sky.
      float flicker = 0.5 + 0.5 * sin(uTime * 1.4 + aSeed * 12.0 + p.x + p.y);
      // Formed glow ceiling lowered ~50% so particles never outshine the
      // mesh shape underneath them. They support it, they don't compete.
      vGlow = mix(0.14 + 0.08 * flicker, 0.52 + 0.14 * flicker, em);
      // shatter dims the field; shake sparks it briefly with red-shifted heat
      vGlow *= (1.0 - uShatter * 0.55);
      vGlow += uShake * 0.35 * flicker;
      vColor = mix(aColor * 0.55, mix(aColor, uAccent, 0.15), em);
    }
  `,
  fragmentShader: /* glsl */`
    varying vec3  vColor;
    varying float vGlow;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      // tighter core, lighter halo — keeps individual sparks readable
      float core = smoothstep(0.5, 0.10, d);
      float halo = smoothstep(0.5, 0.32, d) * 0.14;
      float a = core * core * 0.90 + halo * 0.10;
      if (a < 0.01) discard;
      vec3 col = vColor * (0.40 + 0.45 * vGlow);    // overall tone -25%
      gl_FragColor = vec4(col, a);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const particles = new THREE.Points(pGeom, particleMat);
scene.add(particles);

// ── target generators ───────────────────────────────────────────────────────

function sampleText(text, opts = {}) {
  const {
    fontWeight = 800,
    fontSize   = 280,
    fontFamily = '"Inter", system-ui, sans-serif',
    letterSpacing = '0.04em',
    density = 4,
    width   = 2400,
    height  = 420,
    scale   = 0.0065,
    depth   = 0.35,
  } = opts;

  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = letterSpacing;
  ctx.fillText(text, width / 2, height / 2);

  const data = ctx.getImageData(0, 0, width, height).data;
  const points = [];
  for (let y = 0; y < height; y += density) {
    for (let x = 0; x < width; x += density) {
      const idx = (y * width + x) * 4;
      if (data[idx] > 140) {
        points.push([
          (x - width / 2)  * scale,
         -(y - height / 2) * scale,
          (Math.random() - 0.5) * depth,
        ]);
      }
    }
  }
  return points;
}

function pointsToTargets(points, jitter = 0.035) {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  if (!points.length) return arr;
  // shuffle the source points so dense regions don't form streaks
  const src = points.slice();
  for (let i = src.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [src[i], src[j]] = [src[j], src[i]];
  }
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = src[i % src.length];
    arr[i*3]     = p[0] + (Math.random() - 0.5) * jitter;
    arr[i*3 + 1] = p[1] + (Math.random() - 0.5) * jitter;
    arr[i*3 + 2] = p[2] + (Math.random() - 0.5) * jitter;
  }
  return arr;
}

// combine multiple text lines (stacked vertically) into one target buffer
function stackedTextTargets(lines) {
  const all = [];
  for (const line of lines) {
    const pts = sampleText(line.text, line.opts);
    for (const p of pts) {
      all.push([p[0] + (line.x || 0), p[1] + line.y, p[2]]);
    }
  }
  return pointsToTargets(all, 0.03);
}

// Chapter V — "The Legacy Emblem".
// Particles trace the 12 edges of an elongated octahedron — a classic
// cut-gem silhouette — plus a sparse dusting on the faces so it reads as
// a solid diamond rather than a hollow wireframe.
function diamondTargets() {
  const r = 1.85, yScale = 1.32;     // +19% — diamond now sized like the IV globe
  const v = [
    [0,  r * yScale, 0],   // top apex
    [0, -r * yScale, 0],   // bottom apex (culet)
    [ r,  0, 0],           // right girdle
    [-r,  0, 0],           // left girdle
    [0,   0,  r],          // front girdle
    [0,   0, -r],          // back girdle
  ];
  const edges = [
    [0,2], [0,3], [0,4], [0,5],
    [1,2], [1,3], [1,4], [1,5],
    [2,4], [4,3], [3,5], [5,2],
  ];

  const pts = [];

  // crisp outline along every edge — this is the silhouette the eye reads first
  const samples = 520;
  for (const [a, b] of edges) {
    const va = v[a], vb = v[b];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      pts.push([
        va[0] + (vb[0] - va[0]) * t + (Math.random() - 0.5) * 0.04,
        va[1] + (vb[1] - va[1]) * t + (Math.random() - 0.5) * 0.04,
        va[2] + (vb[2] - va[2]) * t + (Math.random() - 0.5) * 0.04,
      ]);
    }
  }

  // sparse facet dusting — particles drift across each face for depth/volume
  const facePoints = 1400;
  for (let i = 0; i < facePoints; i++) {
    const sx = Math.random() - 0.5;
    const sy = Math.random() - 0.5;
    const sz = Math.random() - 0.5;
    const len = Math.abs(sx) + Math.abs(sy) + Math.abs(sz);
    if (len < 1e-4) continue;
    pts.push([
      (sx / len) * r,
      (sy / len) * r * yScale,
      (sz / len) * r,
    ]);
  }
  return pointsToTargets(pts);
}

function torusKnotTargets() {
  // Clarity, before scale — particles trace the (5,3) torus knot: one clean
  // equation, one continuous strand. Signal. No noise.
  const P = 5, Q = 3, R = 1.70, r = 0.62;     // +13% to match the IV globe
  const curvePts = [], volumePts = [];

  // Dense samples along the curve itself — the silhouette the eye reads
  const N = 2600;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const x = (R + r * Math.cos(Q * t)) * Math.cos(P * t);
    const y = (R + r * Math.cos(Q * t)) * Math.sin(P * t);
    const z = r * Math.sin(Q * t);
    curvePts.push([x, y, z]);
  }

  // Sparse tube-volume scatter — slight depth so it reads as a strand, not a wire
  for (let i = 0; i < 500; i++) {
    const t = Math.random() * Math.PI * 2;
    const x = (R + r * Math.cos(Q * t)) * Math.cos(P * t);
    const y = (R + r * Math.cos(Q * t)) * Math.sin(P * t);
    const z = r * Math.sin(Q * t);
    const scatter = 0.14;
    volumePts.push([
      x + (Math.random() - 0.5) * scatter,
      y + (Math.random() - 0.5) * scatter,
      z + (Math.random() - 0.5) * scatter,
    ]);
  }

  const buckets = [
    { src: curvePts,  weight: 0.84, jitter: 0.016 },
    { src: volumePts, weight: 0.16, jitter: 0.030 },
  ];

  const arr = new Float32Array(PARTICLE_COUNT * 3);
  let cursor = 0;
  for (let b = 0; b < buckets.length; b++) {
    const { src, weight, jitter: j } = buckets[b];
    if (!src.length) continue;
    const n = b === buckets.length - 1
      ? PARTICLE_COUNT - cursor
      : Math.floor(PARTICLE_COUNT * weight);
    for (let i = 0; i < n && cursor < PARTICLE_COUNT; i++, cursor++) {
      const p = src[(Math.random() * src.length) | 0];
      arr[cursor*3]     = p[0] + (Math.random() - 0.5) * j;
      arr[cursor*3 + 1] = p[1] + (Math.random() - 0.5) * j;
      arr[cursor*3 + 2] = p[2] + (Math.random() - 0.5) * j;
    }
  }
  return arr;
}

function PYRAMID_DIMENSIONS() {
  // Great-Pyramid-ish proportions: slender, premium, never squat.
  // Final parity pass — sized so the silhouette feels comparable to the
  // Vision globe and Legacy crystal of the other chapters.
  return { baseY: -2.80, peakY: 4.20, halfBase: 2.85 };
}

function pyramidTargets() {
  // Architecture of ambition — a four-sided pyramid weighted heavily on its
  // silhouette (edges + apex) so the form reads as a crisp, monumental
  // architectural statement rather than a dusty triangular cloud.
  const { baseY, peakY, halfBase } = PYRAMID_DIMENSIONS();

  const corners = [
    [ halfBase, baseY,  halfBase],
    [-halfBase, baseY,  halfBase],
    [-halfBase, baseY, -halfBase],
    [ halfBase, baseY, -halfBase],
  ];
  const peak = [0, peakY, 0];

  // weighted buckets — silhouette-first composition
  const facePts = [];
  const edgePts = [];
  const tierPts = [];
  const apexPts = [];
  const plinthPts = [];

  // 4 triangular faces — sparser, only enough to suggest mass behind the edges
  for (let face = 0; face < 4; face++) {
    const a = corners[face], b = corners[(face + 1) % 4], c = peak;
    for (let i = 0; i < 360; i++) {
      let u = Math.random(), v = Math.random();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const w = 1 - u - v;
      // bias slightly toward the base so the form tapers visually
      const bias = Math.pow(w, 0.6);
      const wb = bias, ub = u * (1 - wb) / (u + v + 0.0001), vb = v * (1 - wb) / (u + v + 0.0001);
      facePts.push([
        a[0]*ub + b[0]*vb + c[0]*wb,
        a[1]*ub + b[1]*vb + c[1]*wb,
        a[2]*ub + b[2]*vb + c[2]*wb,
      ]);
    }
  }

  // base perimeter — dense and dead-straight (the foundation must read sharp)
  for (let edge = 0; edge < 4; edge++) {
    const a = corners[edge], b = corners[(edge + 1) % 4];
    for (let i = 0; i < 420; i++) {
      const t = i / 420;
      edgePts.push([
        a[0] + (b[0] - a[0]) * t,
        baseY,
        a[2] + (b[2] - a[2]) * t,
      ]);
    }
  }

  // four ascending edges — density increases toward the apex so the spires
  // converge into a luminous point rather than a blunt tip
  for (let edge = 0; edge < 4; edge++) {
    const a = corners[edge];
    for (let i = 0; i < 520; i++) {
      // bias t toward 1 (more samples near the peak)
      const t = 1.0 - Math.pow(Math.random(), 1.6);
      edgePts.push([
        a[0] + (peak[0] - a[0]) * t,
        a[1] + (peak[1] - a[1]) * t,
        a[2] + (peak[2] - a[2]) * t,
      ]);
    }
  }

  // three architectural tier rings — premium horizontal banding
  const tiers = [0.28, 0.55, 0.78];
  for (const tFrac of tiers) {
    const y = baseY + (peakY - baseY) * tFrac;
    const r = halfBase * (1 - tFrac);
    const samples = 240;
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      // square ring (matches the pyramid's plan), not a circle
      const side = (t * 4) | 0;
      const u = (t * 4) - side;
      let x, z;
      switch (side) {
        case 0: x =  r;            z =  r - 2*r*u; break;
        case 1: x =  r - 2*r*u;    z = -r;         break;
        case 2: x = -r;            z = -r + 2*r*u; break;
        default: x = -r + 2*r*u;   z =  r;         break;
      }
      tierPts.push([x, y, z]);
    }
  }

  // foundation plinth — a thin luminous ring just outside the base
  {
    const r = halfBase + 0.35;
    const samples = 360;
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const side = (t * 4) | 0;
      const u = (t * 4) - side;
      let x, z;
      switch (side) {
        case 0: x =  r;            z =  r - 2*r*u; break;
        case 1: x =  r - 2*r*u;    z = -r;         break;
        case 2: x = -r;            z = -r + 2*r*u; break;
        default: x = -r + 2*r*u;   z =  r;         break;
      }
      plinthPts.push([x, baseY - 0.04, z]);
    }
  }

  // apex beacon — small, dense, jewel-like
  for (let i = 0; i < 280; i++) {
    const r = 0.14 * Math.cbrt(Math.random());
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    apexPts.push([
      peak[0] + r * Math.sin(p) * Math.cos(t),
      peak[1] + r * Math.sin(p) * Math.sin(t),
      peak[2] + r * Math.cos(p),
    ]);
  }

  // allocate per-bucket counts so the silhouette dominates
  const buckets = [
    { src: edgePts,   weight: 0.46 }, // edges = silhouette
    { src: facePts,   weight: 0.22 }, // sparse fill
    { src: tierPts,   weight: 0.14 }, // tier rings
    { src: plinthPts, weight: 0.08 }, // foundation
    { src: apexPts,   weight: 0.10 }, // beacon
  ];

  // jitter scales per bucket — edges/plinth nearly clean, faces softer
  const jitter = [0.018, 0.06, 0.022, 0.018, 0.025];

  const arr = new Float32Array(PARTICLE_COUNT * 3);
  let cursor = 0;
  for (let b = 0; b < buckets.length; b++) {
    const { src, weight } = buckets[b];
    if (!src.length) continue;
    const n = b === buckets.length - 1
      ? PARTICLE_COUNT - cursor
      : Math.floor(PARTICLE_COUNT * weight);
    const j = jitter[b];
    for (let i = 0; i < n && cursor < PARTICLE_COUNT; i++, cursor++) {
      const p = src[(Math.random() * src.length) | 0];
      arr[cursor*3]     = p[0] + (Math.random() - 0.5) * j;
      arr[cursor*3 + 1] = p[1] + (Math.random() - 0.5) * j;
      arr[cursor*3 + 2] = p[2] + (Math.random() - 0.5) * j;
    }
  }
  return arr;
}

function visionTargets() {
  // Chapter IV — "A horizon worth orbiting".
  // Particles distribute across a luminous WIREFRAME GLOBE plus a single
  // tilted orbital ring. The world he sees + the orbit around it.
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  const GLOBE_R = 1.55;             // +7% — kept close to the chapter that's "fine"
  const RING_R  = 2.18;
  const RING_TILT = 0.42;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const rnd = Math.random();

    if (rnd < 0.78) {
      // 78% — spread across the globe's surface (latitude bias for "world" feel)
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      const r = GLOBE_R * (1 + (Math.random() - 0.5) * 0.025);
      arr[i*3]     = r * Math.sin(p) * Math.cos(t);
      arr[i*3 + 1] = r * Math.sin(p) * Math.sin(t);
      arr[i*3 + 2] = r * Math.cos(p);
    } else if (rnd < 0.92) {
      // 14% — tilted equatorial orbit ring
      const a = Math.random() * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.05;
      const x = (RING_R + jitter) * Math.cos(a);
      const y = (RING_R + jitter) * Math.sin(a);
      arr[i*3]     = x;
      arr[i*3 + 1] = y * Math.sin(RING_TILT);
      arr[i*3 + 2] = y * Math.cos(RING_TILT);
    } else {
      // 8% — bright pupil core
      const r = 0.18 * Math.cbrt(Math.random());
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      arr[i*3]     = r * Math.sin(p) * Math.cos(t);
      arr[i*3 + 1] = r * Math.sin(p) * Math.sin(t);
      arr[i*3 + 2] = r * Math.cos(p);
    }
  }
  return arr;
}

// ── companion geometry per chapter ──────────────────────────────────────────

// CHAPTER II — Luminous (5,3) Torus Knot: signal traced by a single continuous curve.
// "Clarity, before scale. Signal over noise." — one equation, infinite complexity.
// Five winds around the axis, three around the tube: the knot of pure thought.
const aiGroup = new THREE.Group();
{
  // Main knot tube — slim, metallic, glowing from within
  const knotMesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.70, 0.056, 400, 10, 5, 3),
    new THREE.MeshPhysicalMaterial({
      color: 0x040e1a, emissive: 0x1e7498, emissiveIntensity: 0.90,
      metalness: 1.0, roughness: 0.05,
      clearcoat: 1.0, clearcoatRoughness: 0.02,
      transparent: true, opacity: 0.94,
    })
  );
  aiGroup.add(knotMesh);
  aiGroup.userData.knotMesh = knotMesh;

  // Wider, additive glow halo — makes the tube luminous under bloom
  const knotGlow = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.70, 0.096, 400, 8, 5, 3),
    new THREE.MeshBasicMaterial({
      color: 0x6ef0ff, transparent: true, opacity: 0.13,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  aiGroup.add(knotGlow);
  aiGroup.userData.knotGlow = knotGlow;

  // 15 signal nodes distributed along the curve — signal propagating
  const NK_P = 5, NK_Q = 3, NK_R = 1.70, NK_r = 0.62;
  for (let i = 0; i < 15; i++) {
    const t = (i / 15) * Math.PI * 2;
    const nx = (NK_R + NK_r * Math.cos(NK_Q * t)) * Math.cos(NK_P * t);
    const ny = (NK_R + NK_r * Math.cos(NK_Q * t)) * Math.sin(NK_P * t);
    const nz = NK_r * Math.sin(NK_Q * t);
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.058, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending })
    );
    node.position.set(nx, ny, nz);
    node.userData.isKnotNode = true;
    node.userData.nodePhase = i * (Math.PI * 2 / 15);
    aiGroup.add(node);
  }

  // Subtle central core — the consciousness at the knot's heart
  const mindCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xa0eeff, blending: THREE.AdditiveBlending })
  );
  mindCore.userData.isCore = true;
  aiGroup.add(mindCore);

  const mindHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0x6ef0ff, transparent: true, opacity: 0.11,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  aiGroup.add(mindHalo);
}
aiGroup.visible = false;
scene.add(aiGroup);

// CHAPTER I — Stella Octangula: two interlocked tetrahedra at the origin of form.
// "From a single point of light" — duality converging into the first perfect solid.
// Tet-1 (cyan) rotates forward; Tet-2 (violet) counter-rotates. Eight apex jewels
// pulse like nascent stars. SAMIR assembles in particle-light in front of it.
const seedGroup = new THREE.Group();
{
  const R = 3.0;                        // vertex distance from centre
  const s = R / Math.sqrt(3);           // half-diagonal of the enclosing cube

  // Two tetrahedra using complementary corners of a cube of side 2s
  const tet1V = [
    new THREE.Vector3( s,  s,  s),
    new THREE.Vector3(-s, -s,  s),
    new THREE.Vector3(-s,  s, -s),
    new THREE.Vector3( s, -s, -s),
  ];
  const tet2V = [
    new THREE.Vector3(-s, -s, -s),
    new THREE.Vector3( s,  s, -s),
    new THREE.Vector3( s, -s,  s),
    new THREE.Vector3(-s,  s,  s),
  ];
  const EP = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];

  function tetEdgeGeo(v) {
    const arr = [];
    for (const [a, b] of EP)
      arr.push(v[a].x, v[a].y, v[a].z,  v[b].x, v[b].y, v[b].z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return g;
  }

  function buildTet(verts, glowColor) {
    const grp = new THREE.Group();

    // crisp inner edge — the silhouette the eye reads first
    grp.add(new THREE.LineSegments(
      tetEdgeGeo(verts),
      new THREE.LineBasicMaterial({ color: 0xddf2ff, transparent: true, opacity: 0.88 })
    ));

    // wider, low-opacity glow halo — fakes a lit beam under bloom
    const haloEdge = new THREE.LineSegments(
      tetEdgeGeo(verts),
      new THREE.LineBasicMaterial({
        color: glowColor, transparent: true, opacity: 0.30,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    haloEdge.scale.setScalar(1.020);
    grp.add(haloEdge);

    // apex jewel + halo at each vertex — staggered heartbeat across all 8 nodes
    for (let i = 0; i < verts.length; i++) {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, opacity: 1.0,
          blending: THREE.AdditiveBlending,
        })
      );
      node.position.copy(verts[i]);
      node.userData.isApexNode = true;
      node.userData.apexPhase = i * 1.08 + (glowColor === 0x6ef0ff ? 0 : 0.55);
      grp.add(node);

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 12, 12),
        new THREE.MeshBasicMaterial({
          color: glowColor, transparent: true, opacity: 0.20,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      halo.position.copy(verts[i]);
      halo.userData.isApexHalo = true;
      halo.userData.apexPhase = i * 1.08 + (glowColor === 0x6ef0ff ? 0 : 0.55);
      grp.add(halo);
    }
    return grp;
  }

  const tet1 = buildTet(tet1V, 0x6ef0ff);   // cyan  — the first idea
  const tet2 = buildTet(tet2V, 0xb38bff);   // violet — the decision to begin
  seedGroup.add(tet1, tet2);
  seedGroup.userData.tet1 = tet1;
  seedGroup.userData.tet2 = tet2;

  // Central singularity — the single point of light before all else
  const coreGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending })
  );
  coreGlow.userData.isCore = true;
  seedGroup.add(coreGlow);

  const coreHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.56, 20, 20),
    new THREE.MeshBasicMaterial({
      color: 0x6ef0ff, transparent: true, opacity: 0.24,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  coreHalo.userData.isCoreHalo = true;
  seedGroup.add(coreHalo);

  // Equatorial ring — the horizon that unifies both tetrahedra at their midplane
  const eqRing = new THREE.Mesh(
    new THREE.TorusGeometry(R * 0.80, 0.013, 12, 220),
    new THREE.MeshBasicMaterial({
      color: 0x6ef0ff, transparent: true, opacity: 0.40,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  eqRing.rotation.x = 0.52;
  eqRing.rotation.z = 0.22;
  seedGroup.add(eqRing);

  // Ghost bounding icosphere — whisper of the sphere enclosing the form
  seedGroup.add(new THREE.Mesh(
    new THREE.IcosahedronGeometry(R * 0.75, 1),
    new THREE.MeshBasicMaterial({
      color: 0x6ef0ff, wireframe: true,
      transparent: true, opacity: 0.052,
    })
  ));
}
seedGroup.visible = false;
scene.add(seedGroup);

// CHAPTER III — premium pyramid scaffold (sharp edges, layered beacon, plinth)
const cityGroup = new THREE.Group();
{
  const { baseY, peakY, halfBase } = PYRAMID_DIMENSIONS();
  const corners = [
    new THREE.Vector3( halfBase, baseY,  halfBase),
    new THREE.Vector3(-halfBase, baseY,  halfBase),
    new THREE.Vector3(-halfBase, baseY, -halfBase),
    new THREE.Vector3( halfBase, baseY, -halfBase),
  ];
  const peak = new THREE.Vector3(0, peakY, 0);

  // crisp inner edges
  const edgeVerts = [];
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4];
    edgeVerts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    edgeVerts.push(a.x, a.y, a.z, peak.x, peak.y, peak.z);
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeVerts, 3));
  const edges = new THREE.LineSegments(
    edgeGeo,
    new THREE.LineBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.78 })
  );
  cityGroup.add(edges);

  // wider, low-opacity halo line slightly offset — fakes a thick beam
  const haloEdges = new THREE.LineSegments(
    edgeGeo.clone(),
    new THREE.LineBasicMaterial({
      color: 0x6ef0ff, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  haloEdges.scale.setScalar(1.012);
  cityGroup.add(haloEdges);

  // faces — barely-there glass tint, just enough to occlude background stars
  const faceGeo = new THREE.BufferGeometry();
  const faceVerts = [];
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4];
    faceVerts.push(a.x, a.y, a.z, b.x, b.y, b.z, peak.x, peak.y, peak.z);
  }
  faceGeo.setAttribute('position', new THREE.Float32BufferAttribute(faceVerts, 3));
  faceGeo.computeVertexNormals();
  const faces = new THREE.Mesh(
    faceGeo,
    new THREE.MeshBasicMaterial({
      color: 0x1e5670, transparent: true, opacity: 0.05,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  cityGroup.add(faces);

  // foundation plinth — square luminous ring grounding the form
  const plinthR = halfBase + 0.35;
  const plinthVerts = [
    [ plinthR, baseY - 0.04,  plinthR],
    [-plinthR, baseY - 0.04,  plinthR],
    [-plinthR, baseY - 0.04, -plinthR],
    [ plinthR, baseY - 0.04, -plinthR],
    [ plinthR, baseY - 0.04,  plinthR],
  ];
  const plinthGeo = new THREE.BufferGeometry();
  plinthGeo.setAttribute('position', new THREE.Float32BufferAttribute(plinthVerts.flat(), 3));
  const plinth = new THREE.Line(
    plinthGeo,
    new THREE.LineBasicMaterial({
      color: 0x6ef0ff, transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  cityGroup.add(plinth);

  // layered apex beacon — core, halo, and outer bloom
  const apexCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  apexCore.position.copy(peak);
  apexCore.userData.isApex = true;
  cityGroup.add(apexCore);

  const apexHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0x6ef0ff, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  apexHalo.position.copy(peak);
  apexHalo.userData.isApexHalo = true;
  cityGroup.add(apexHalo);

  const apexBloom = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0xb38bff, transparent: true, opacity: 0.07,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  apexBloom.position.copy(peak);
  cityGroup.add(apexBloom);
}
cityGroup.visible = false;
scene.add(cityGroup);

// CHAPTER IV — "Vision" Globe.
// A single luminous wireframe world with a tilted orbital ring sweeping
// through it. Far more readable than the old multi-ring sphere of blur.
const visionGroup = new THREE.Group();
const VIS_GLOBE_R = 1.55;
const VIS_RING_R  = 2.18;
const VIS_RING_TILT = 0.42;

// 1. translucent glass interior — gives the globe a body behind the wires
const visionFill = new THREE.Mesh(
  new THREE.SphereGeometry(VIS_GLOBE_R * 0.985, 64, 64),
  new THREE.MeshPhysicalMaterial({
    color: 0x0a1624,
    metalness: 0.2,
    roughness: 0.35,
    transmission: 0.55,
    ior: 1.45,
    thickness: 0.6,
    transparent: true,
    opacity: 0.72,
    emissive: 0x1c5e7a,
    emissiveIntensity: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  })
);
visionGroup.add(visionFill);

// 2. wireframe shell — the latitude/longitude "globe" lines.
// Low segment counts (24, 14) are deliberate: they produce visible polygons
// that read as world map gridlines instead of a smooth sphere.
const visionWire = new THREE.Mesh(
  new THREE.SphereGeometry(VIS_GLOBE_R, 24, 14),
  new THREE.MeshBasicMaterial({
    color: 0x6ef0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.42,
  })
);
visionGroup.add(visionWire);

// 3. the pupil — a tiny bright core; the "eye" at the center
const visionPupil = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);
visionPupil.userData.isPupil = true;
visionGroup.add(visionPupil);
const visionPupilHalo = new THREE.Mesh(
  new THREE.SphereGeometry(0.32, 24, 24),
  new THREE.MeshBasicMaterial({
    color: 0x6ef0ff,
    transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
visionPupilHalo.userData.isPupilHalo = true;
visionGroup.add(visionPupilHalo);

// 4. the orbital ring — one elegant band, tilted, sweeping AROUND the globe
const visionRing = new THREE.Mesh(
  new THREE.TorusGeometry(VIS_RING_R, 0.012, 16, 280),
  new THREE.MeshStandardMaterial({
    color: 0xdde8f4,
    emissive: 0x6ef0ff,
    emissiveIntensity: 0.5,
    metalness: 1.0,
    roughness: 0.12,
    transparent: true,
    opacity: 0.7,
  })
);
visionRing.rotation.x = Math.PI / 2 - VIS_RING_TILT;
visionRing.userData.isOrbit = true;
visionGroup.add(visionRing);

// 5. a second, fainter ring on a different tilt for parallax depth
const visionRingB = new THREE.Mesh(
  new THREE.TorusGeometry(VIS_RING_R * 1.18, 0.008, 14, 260),
  new THREE.MeshStandardMaterial({
    color: 0xdde8f4,
    emissive: 0x5c4a96,
    emissiveIntensity: 0.35,
    metalness: 1.0,
    roughness: 0.18,
    transparent: true,
    opacity: 0.32,
  })
);
visionRingB.rotation.x = Math.PI / 2 + VIS_RING_TILT * 0.6;
visionRingB.rotation.z = 0.4;
visionRingB.userData.isOrbitB = true;
visionGroup.add(visionRingB);

// 6. atmospheric outer halo — gives the globe its "presence"
const visionAtmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(VIS_GLOBE_R * 1.35, 32, 32),
  new THREE.MeshBasicMaterial({
    color: 0x6ef0ff,
    transparent: true, opacity: 0.05,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
visionAtmosphere.userData.isAtmos = true;
visionGroup.add(visionAtmosphere);

visionGroup.visible = false;
scene.add(visionGroup);

// ── Chapter V — Legacy crystal (refractive gem inside the particle silhouette)
const legacyGroup = new THREE.Group();
const legacyCrystal = new THREE.Mesh(
  new THREE.OctahedronGeometry(1.70, 0),
  new THREE.MeshPhysicalMaterial({
    color: 0xeaf6ff,
    metalness: 0.0,
    roughness: 0.04,
    transmission: 0.96,
    ior: 2.4,                      // close to a real diamond
    thickness: 1.6,
    clearcoat: 1.0,
    clearcoatRoughness: 0.0,
    transparent: true,
    opacity: 0.95,
    emissive: 0x6ef0ff,
    emissiveIntensity: 0.12,
  })
);
legacyCrystal.scale.set(1.0, 1.32, 1.0);   // elongated like a cut gem
legacyGroup.add(legacyCrystal);

// faint wire overlay so the silhouette is unmistakable even through fog
const legacyWire = new THREE.Mesh(
  new THREE.OctahedronGeometry(1.73, 0),
  new THREE.MeshBasicMaterial({
    color: 0x6ef0ff, wireframe: true,
    transparent: true, opacity: 0.32,
  })
);
legacyWire.scale.set(1.0, 1.32, 1.0);
legacyGroup.add(legacyWire);

// concentric halo rings — a soft Saturn-like ring system around the gem
for (let i = 0; i < 3; i++) {
  const r = 2.48 + i * 0.47;          // +19% to match the bigger crystal
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.008, 10, 240),
    new THREE.MeshStandardMaterial({
      color: 0xdde8f4,
      emissive: i % 2 ? 0x6650a8 : 0x2c8eb0,
      emissiveIntensity: 0.55,
      metalness: 1.0,
      roughness: 0.10,
      transparent: true,
      opacity: 0.45,
    })
  );
  ring.rotation.x = Math.PI / 2 + (i - 1) * 0.18;
  ring.rotation.z = i * 0.55;
  ring.userData.spin = 0.05 + i * 0.022;
  legacyGroup.add(ring);
}
legacyGroup.visible = false;
scene.add(legacyGroup);

// ── camera anchor poses per chapter ─────────────────────────────────────────
// Final parity-pass anchors — every chapter's hero object lands at roughly
// the same screen coverage so the experience reads as one consistent universe.
const camPaths = [
  { pos: new THREE.Vector3(0,   0.4, 24), look: new THREE.Vector3(0,  0.0, 0) }, // I  Origin
  { pos: new THREE.Vector3(2.4, 0.9, 11), look: new THREE.Vector3(0,  0.0, 0) }, // II Mind
  { pos: new THREE.Vector3(0,   1.1, 17), look: new THREE.Vector3(0,  0.6, 0) }, // III Build
  { pos: new THREE.Vector3(6.5, 1.4, 13), look: new THREE.Vector3(0,  0.0, 0) }, // IV Vision
  { pos: new THREE.Vector3(0,   0.4, 14), look: new THREE.Vector3(0,  0.0, 0) }, // V  Legacy (Crystal)
];

// ── targets, populated after fonts load (so canvas sampling renders Inter) ──
const TARGETS = {
  0: null, 1: null, 2: null, 3: null, 4: null,
};

async function buildTargets() {
  // fonts: wait for the bold weights we need
  try {
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('800 280px "Inter"'),
        document.fonts.load('700 240px "Inter"'),
        document.fonts.ready,
      ]);
    }
  } catch (_) { /* fallback to system font is fine */ }

  // Chapter I — the first name emerging from chaos (sized for wide framing)
  TARGETS[0] = pointsToTargets(
    sampleText('SAMIR', {
      fontSize: 360, fontWeight: 800, letterSpacing: '0.04em',
      density: 3, width: 2200, height: 500, scale: 0.0107,   // +19% bump for parity
    })
  );
  TARGETS[1] = torusKnotTargets();
  TARGETS[2] = pyramidTargets();
  TARGETS[3] = visionTargets();
  // Chapter V — the Legacy Emblem (a crystalline diamond) replaces the
  // stacked SAMIR / HASAN text. The name already lives in the brand mark,
  // the portrait caption and the footer; here we leave a symbol instead.
  TARGETS[4] = diamondTargets();
  // Contact (post-story) — a giant '@' becomes the meaningful 3D signal
  TARGETS[5] = pointsToTargets(
    sampleText('@', {
      fontSize: 620, fontWeight: 500, letterSpacing: '0em',
      density: 3, width: 900, height: 900, scale: 0.0116, depth: 0.30,  // +18% bump
    })
  );
  // initial section
  setTargetBuffer(TARGETS[0]);
}

function setTargetBuffer(arr) {
  pGeom.attributes.aTarget.array.set(arr);
  pGeom.attributes.aTarget.needsUpdate = true;
}

// ── interaction state ───────────────────────────────────────────────────────
const mouse = new THREE.Vector2();
const mouse3 = new THREE.Vector3();
const mouseSmooth = new THREE.Vector3();
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// touch fallback
window.addEventListener('touchmove', (e) => {
  if (!e.touches[0]) return;
  mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
}, { passive: true });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  fxaa.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
});

// ── scroll & section state ─────────────────────────────────────────────────
// Chapters span the FIRST 5 viewport heights — anything below that is the
// CEO portfolio content (Founder / Ventures / Milestones / Contact).
let scrollProgress = 0;
let contactLocal = 0;
let inContact = false;
const contactEl = document.getElementById('contact');
function updateScroll() {
  const storyHeight = 5 * window.innerHeight;
  scrollProgress = Math.min(1, Math.max(0, window.scrollY / storyHeight));
  // toggle a class once we've scrolled past the cinematic story so the canvas
  // dims behind the readable content (and the cinematic UI gets out of the way)
  const pastStory = window.scrollY > storyHeight - window.innerHeight * 0.15;
  document.body.classList.toggle('past-story', pastStory);

  // contact section presence — drives the @ particle formation
  if (contactEl) {
    const rect = contactEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height + vh;
    contactLocal = Math.max(0, Math.min(1, (vh - rect.top) / total));
    inContact = rect.top < vh * 0.75 && rect.bottom > vh * 0.25;
  }
}
window.addEventListener('scroll', updateScroll, { passive: true });
updateScroll();

// stamp current year into the footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

function getSectionState(p) {
  const f = p * 5;
  const idx = Math.min(4, Math.floor(f));
  const local = Math.min(1, f - idx);
  return { idx, local };
}

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const dots = [...document.querySelectorAll('.dot')];
const chapters = [...document.querySelectorAll('.chapter')];
dots.forEach((d, i) => {
  d.addEventListener('click', () => {
    chapters[i].scrollIntoView({ behavior: 'smooth' });
  });
});

// ── render loop ─────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let activeIdx = -1;
let scrollSmooth = 0;          // inertially smoothed scroll progress
const tmpPos  = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

// ── shatter state machine ───────────────────────────────────────────────────
// Rapid mouse motion accumulates "agitation"; once it crosses a threshold the
// formation breaks apart, shakes, and snaps back together. One-shot cycle so
// the effect feels like a deliberate event, not constant noise.
const lastMouse = new THREE.Vector2(mouse.x, mouse.y);
let mouseAgitation = 0;
let shatterPhase = -1;   // -1 idle, else 0..1 progress through cycle
let shatterTime = 0;
const SHATTER_CYCLE = 2.4;
const AGITATION_TRIGGER = 1.15;

function frame() {
  requestAnimationFrame(frame);

  const dt = Math.min(0.05, clock.getDelta());
  const t  = clock.getElapsedTime();

  particleMat.uniforms.uTime.value = t;

  // smooth mouse → world-space pointer (z = 0 plane)
  mouse3.set(mouse.x * 9, mouse.y * 5, 0);
  mouseSmooth.lerp(mouse3, 0.06);
  particleMat.uniforms.uMouse.value.copy(mouseSmooth);

  // shatter trigger — accumulate "agitation" from fast mouse motion
  const mdx = mouse.x - lastMouse.x;
  const mdy = mouse.y - lastMouse.y;
  const mvel = Math.sqrt(mdx*mdx + mdy*mdy) / Math.max(dt, 0.001);
  lastMouse.set(mouse.x, mouse.y);
  mouseAgitation = mouseAgitation * 0.93 + mvel * dt * 0.5;
  if (shatterPhase < 0 && mouseAgitation > AGITATION_TRIGGER) {
    shatterPhase = 0;
    shatterTime = 0;
    mouseAgitation = 0;
  }
  if (shatterPhase >= 0) {
    shatterTime += dt;
    const ph = Math.min(1, shatterTime / SHATTER_CYCLE);
    // break apart 0..0.25, hold 0.25..0.50, reform 0.50..1.0
    particleMat.uniforms.uShatter.value =
      smoothstep(0, 0.22, ph) * (1 - smoothstep(0.52, 0.98, ph));
    // shake peaks during the reformation (0.45..0.85)
    particleMat.uniforms.uShake.value =
      smoothstep(0.42, 0.58, ph) * (1 - smoothstep(0.62, 0.92, ph));
    if (ph >= 1) {
      shatterPhase = -1;
      particleMat.uniforms.uShatter.value = 0;
      particleMat.uniforms.uShake.value = 0;
    }
  }

  if (TARGETS[0]) {
    // inertial smoothing — the single biggest improvement to scroll feel.
    // Camera & formations now lerp toward an eased progress instead of
    // tracking the wheel directly, which was producing the "snap" feeling.
    scrollSmooth += (scrollProgress - scrollSmooth) * 0.085;
    let { idx, local } = getSectionState(scrollSmooth);

    // Contact section override — once the user is inside the contact section
    // we promote it to a "Chapter VI" with its own @-symbol formation, so the
    // 3D scene actually means something instead of drifting noise.
    if (inContact) {
      idx = 5;
      local = contactLocal;
    }

    // section change — swap target buffer when uMix is near 0 (dissolved)
    if (idx !== activeIdx) {
      activeIdx = idx;
      setTargetBuffer(TARGETS[idx]);
      if (idx <= 4) dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      seedGroup.visible   = (idx === 0);
      aiGroup.visible     = (idx === 1);
      cityGroup.visible   = (idx === 2);
      visionGroup.visible = (idx === 3);
      legacyGroup.visible = (idx === 4);

      // per-section accent color & bloom feel — kept conservative everywhere
      const accents = [0x6ef0ff, 0x6ef0ff, 0xb38bff, 0xdfe7ef, 0x6ef0ff, 0x6ef0ff];
      particleMat.uniforms.uAccent.value.setHex(accents[idx]);
      bloom.strength = idx === 4 ? 0.36 : 0.24;
    }

    // mix curve: form FAST, hold LONG, dissolve LATE.
    let mixTarget;
    if (idx === 5) {
      // contact: assemble the @, hold it almost all the way through the
      // section, dissolve gently at the very bottom.
      mixTarget = smoothstep(0.05, 0.32, local) * (1.0 - smoothstep(0.88, 1.0, local));
    } else if (idx === 4) {
      // legacy: gradual, deliberate assembly over the first half — the eye
      // can follow individual letters resolving — then locked in for the rest.
      mixTarget = smoothstep(0.0, 0.55, local);
    } else {
      mixTarget = smoothstep(0.0, 0.20, local) * (1.0 - smoothstep(0.82, 1.0, local));
    }
    const cur = particleMat.uniforms.uMix.value;
    // softer easing so the mix never jolts even on a fast wheel flick
    particleMat.uniforms.uMix.value = cur + (mixTarget - cur) * 0.055;

    // camera path — global lerp across 5 anchors (uses smoothed progress)
    const cf = scrollSmooth * 4;
    const ci = Math.min(3, Math.floor(cf));
    const cl = smoothstep(0, 1, Math.min(1, cf - ci));
    const camA = camPaths[ci];
    const camB = camPaths[ci + 1];
    tmpPos.lerpVectors(camA.pos, camB.pos, cl);
    tmpLook.lerpVectors(camA.look, camB.look, cl);

    // mouse parallax
    tmpPos.x += mouse.x * 0.7;
    tmpPos.y += mouse.y * 0.45;

    // chapter IV: a very slow, intimate orbit around the Vision Globe.
    // Distance 5.5 puts the globe (r=1.45) + outer ring (r=2.4) together
    // at roughly 80% of the viewport width — strong, hero-sized presence.
    if (idx === 3) {
      const phase = t * 0.045 + local * 0.25;
      const orbit = 5.9;          // +0.4 to keep coverage steady with bigger globe
      tmpPos.x = Math.cos(phase) * orbit + mouse.x * 0.3;
      tmpPos.z = Math.sin(phase) * orbit;
      tmpPos.y = 0.5 + mouse.y * 0.3;
      tmpLook.set(0, 0, 0);
    }
    // chapter V: slow, intimate framing on the Legacy Crystal — gem-sized,
    // gem-paced. A very gentle drift so its facets catch new highlights as
    // the user lingers, ending closer than it began (push-in reveal).
    if (idx === 4) {
      const eased = smoothstep(0, 1, local);
      const phase = t * 0.06 + local * 0.35;
      tmpPos.x = Math.sin(phase) * 0.8 + mouse.x * 0.35;
      tmpPos.y = 0.45 + mouse.y * 0.25;
      tmpPos.z = 15 - eased * 2.0;       // 15 → 13 (closer reveal)
      tmpLook.set(0, 0, 0);
    }
    // contact: hold a clean, wide framing on the @ so the form sits in front of it
    if (idx === 5) {
      tmpPos.x = mouse.x * 0.5;
      tmpPos.y = mouse.y * 0.35;
      tmpPos.z = 24;
      tmpLook.set(0, 0, 0);
    }

    camera.position.lerp(tmpPos, 0.045);
    camera.lookAt(tmpLook);

    // animate companion meshes
    if (seedGroup.visible) {
      // Whole group: slow mouse-responsive tilt + gentle vertical drift
      seedGroup.rotation.y  = mouse.x * 0.06 + Math.sin(t * 0.055) * 0.10;
      seedGroup.rotation.x  = mouse.y * 0.04 + Math.sin(t * 0.040) * 0.06;
      seedGroup.position.y  = Math.sin(t * 0.28) * 0.10;

      // The two tetrahedra counter-rotate — tension of duality in motion
      const { tet1, tet2 } = seedGroup.userData;
      if (tet1) { tet1.rotation.y += dt * 0.24; tet1.rotation.x += dt * 0.10; }
      if (tet2) { tet2.rotation.y -= dt * 0.20; tet2.rotation.x -= dt * 0.08; }

      // Apex pulse + core heartbeat — traverse hits all descendants
      seedGroup.traverse((c) => {
        if (c.userData.isApexNode || c.userData.isApexHalo) {
          const ph = c.userData.apexPhase || 0;
          c.scale.setScalar(0.84 + 0.16 * Math.sin(t * 2.0 + ph));
        }
        if (c.userData.isCore)     c.scale.setScalar(1.0 + 0.30 * Math.sin(t * 1.8));
        if (c.userData.isCoreHalo) c.scale.setScalar(1.0 + 0.42 * Math.sin(t * 1.4 + 0.6));
      });

      // Fade edges and rings as SAMIR resolves — the symbol retreats for the name
      const fade = 1.0 - particleMat.uniforms.uMix.value * 0.45;
      seedGroup.traverse((c) => {
        if (c.userData.isCore || c.userData.isCoreHalo) return;
        if (!c.material || c.material.opacity === undefined) return;
        const base = c.userData.baseOpacity ?? (c.userData.baseOpacity = c.material.opacity);
        c.material.opacity = base * fade;
      });
    }
    if (aiGroup.visible) {
      const { knotMesh, knotGlow } = aiGroup.userData;
      // Slow yaw — reveals every twist of the knot's path
      aiGroup.rotation.y += dt * 0.11;
      aiGroup.rotation.x  = Math.sin(t * 0.22) * 0.14;
      // Knot and glow counter-rotate on z — creates a shimmer along the curve
      if (knotMesh) knotMesh.rotation.z += dt * 0.07;
      if (knotGlow) knotGlow.rotation.z -= dt * 0.04;
      // Signal nodes pulse in sequence — propagating wave of light
      aiGroup.children.forEach((c) => {
        if (c.userData.isKnotNode) {
          const ph = c.userData.nodePhase || 0;
          c.scale.setScalar(0.65 + 0.35 * Math.sin(t * 3.8 + ph));
        }
        if (c.userData.isCore) c.scale.setScalar(1.0 + 0.22 * Math.sin(t * 2.0));
      });
      const breathe = 0.92 + 0.08 * Math.sin(t * 1.4);
      const s = breathe * (0.6 + 0.4 * particleMat.uniforms.uMix.value);
      aiGroup.scale.setScalar(s);
    }

    if (cityGroup.visible) {
      cityGroup.rotation.y += dt * 0.028;
      const s = 0.62 + 0.38 * particleMat.uniforms.uMix.value;
      cityGroup.scale.setScalar(s);
      const pulse = 1.0 + 0.22 * Math.sin(t * 1.8);
      cityGroup.children.forEach((c) => {
        if (c.userData.isApex)     c.scale.setScalar(pulse);
        if (c.userData.isApexHalo) c.scale.setScalar(1.0 + 0.35 * Math.sin(t * 1.4));
      });
    }

    if (visionGroup.visible) {
      // The globe shell spins slowly on its axis — like Earth seen from space.
      // The fill counter-rotates a touch so the wireframe lines visibly drift
      // over a darker interior (gives the world depth, not flatness).
      visionWire.rotation.y += dt * 0.10;
      visionFill.rotation.y -= dt * 0.04;

      // Orbital rings sweep around the globe on their own axes.
      visionRing.rotation.z  += dt * 0.18;
      visionRingB.rotation.z -= dt * 0.11;
      visionRingB.rotation.x  = Math.PI / 2 + VIS_RING_TILT * 0.6 + Math.sin(t * 0.3) * 0.04;

      // Pupil pulses — the eye is alive.
      const pupilPulse = 1.0 + 0.18 * Math.sin(t * 1.9);
      visionPupil.scale.setScalar(pupilPulse);
      visionPupilHalo.scale.setScalar(1.0 + 0.35 * Math.sin(t * 1.4 + 0.6));

      // Atmosphere breathes very gently.
      visionAtmosphere.scale.setScalar(1.0 + 0.04 * Math.sin(t * 0.7));

      // Whole assembly tilts a hair with mix-driven scale-in.
      visionGroup.rotation.y += dt * 0.025;
      const s = 0.72 + 0.28 * particleMat.uniforms.uMix.value;
      visionGroup.scale.setScalar(s);
    }

    if (legacyGroup.visible) {
      // Crystal slowly tumbles so its facets keep catching new highlights —
      // this is what gives the gem its life. Wireframe counter-rotates so
      // the silhouette never reads as a single static line.
      legacyCrystal.rotation.y += dt * 0.18;
      legacyCrystal.rotation.x  = Math.sin(t * 0.35) * 0.12;
      legacyWire.rotation.y    -= dt * 0.10;
      legacyWire.rotation.x     = Math.sin(t * 0.22) * 0.08;

      // halo rings drift on independent axes
      legacyGroup.children.forEach((c) => {
        if (typeof c.userData.spin === 'number') {
          c.rotation.z += c.userData.spin * dt;
          c.rotation.x += c.userData.spin * dt * 0.35;
        }
      });

      // breathing scale tied to formation, so the gem grows INTO existence
      // as the particles converge on its silhouette.
      const breathe = 0.95 + 0.05 * Math.sin(t * 1.0);
      const s = breathe * (0.55 + 0.50 * particleMat.uniforms.uMix.value);
      legacyGroup.scale.setScalar(s);
    }

    // Particle field stays at rotation 0 so any text-shape target ("SAMIR"
    // in chapter I, "@" in the contact section) always reads forwards.
    // The vertex shader's per-particle sin/cos drift already provides
    // ambient motion — we don't need a global Y rotation to look alive.
    particles.rotation.y = 0;
  }

  composer.render();
}

// ── boot ────────────────────────────────────────────────────────────────────
buildTargets().then(() => {
  // dismiss loader once the universe is ready
  const loader = document.getElementById('loader');
  setTimeout(() => loader && loader.classList.add('gone'), 600);
});

frame();

// ── ambient audio toggle ────────────────────────────────────────────────────
(() => {
  const btn = document.getElementById('audio-toggle');
  if (!btn) return;

  let ctx = null;
  let master = null;
  let melodyBus = null;
  let nodes = [];
  let melodyTimer = null;
  let isOn = false;
  const FADE_IN = 1.8;
  const FADE_OUT = 0.9;
  const TARGET_GAIN = 0.09;

  // A minor pentatonic — always sounds pleasant. Hz values across two octaves.
  // sequence of [freq, beats] pairs; rests use freq=0
  const N = {
    A4: 440.00, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
    A5: 880.00, E4: 329.63, G4: 392.00, C6: 1046.50,
  };
  // 8-bar loop, slow and sparse — feels like a music-box drifting overhead
  const MOTIFS = [
    [ [N.A4, 2], [N.E5, 2], [N.C5, 2], [N.D5, 2] ],
    [ [N.G4, 2], [N.A4, 2], [N.C5, 2], [N.E5, 4] ],
    [ [N.E5, 1], [N.D5, 1], [N.C5, 2], [N.A4, 4] ],
    [ [0,    2], [N.G5, 2], [N.E5, 2], [N.A5, 2] ],
  ];
  const BEAT = 0.55; // seconds — ~110 bpm-ish, but notes ring much longer

  const playNote = (when, freq, beats) => {
    if (!ctx || !freq) return;
    const dur = beats * BEAT;
    const release = Math.min(2.4, dur + 1.4);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    osc2.detune.value = 6;

    const mix2 = ctx.createGain();
    mix2.gain.value = 0.18; // upper octave shimmer, quiet

    const g = ctx.createGain();
    g.gain.value = 0;

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 2400;
    filt.Q.value = 0.4;

    osc1.connect(g);
    osc2.connect(mix2);
    mix2.connect(g);
    g.connect(filt);
    filt.connect(melodyBus);

    // soft attack / long release — bell-ish
    const peak = 0.28;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0005, when + release);

    osc1.start(when);
    osc2.start(when);
    const stopAt = when + release + 0.05;
    osc1.stop(stopAt);
    osc2.stop(stopAt);

    osc1.onended = () => {
      try { osc1.disconnect(); osc2.disconnect(); mix2.disconnect(); g.disconnect(); filt.disconnect(); } catch (e) {}
    };
  };

  const scheduleMelody = () => {
    if (!ctx) return;
    let cursor = ctx.currentTime + 0.4;
    let bar = 0;
    const scheduleAhead = () => {
      if (!ctx) return;
      const horizon = ctx.currentTime + 4;
      while (cursor < horizon) {
        const motif = MOTIFS[bar % MOTIFS.length];
        for (const [f, b] of motif) {
          playNote(cursor, f, b);
          cursor += b * BEAT;
        }
        // small breath between motifs
        cursor += BEAT * 2;
        bar++;
      }
    };
    scheduleAhead();
    melodyTimer = setInterval(scheduleAhead, 2000);
  };

  const start = async () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    if (ctx.state === 'suspended') await ctx.resume();

    master = ctx.createGain();
    master.gain.value = 0;

    const softFilter = ctx.createBiquadFilter();
    softFilter.type = 'lowpass';
    softFilter.frequency.value = 1200;
    softFilter.Q.value = 0.5;
    master.connect(softFilter);
    softFilter.connect(ctx.destination);

    // separate bus for the melody so it can be a touch brighter than the pad
    melodyBus = ctx.createGain();
    melodyBus.gain.value = 0.55;
    melodyBus.connect(master);
    nodes.push(melodyBus);

    // a warm low chord — root, fifth, octave, third — open & calm
    const voices = [
      { f: 55,    type: 'sine',     g: 0.32 },
      { f: 82.4,  type: 'sine',     g: 0.22 },
      { f: 110,   type: 'triangle', g: 0.16 },
      { f: 164.8, type: 'sine',     g: 0.10 },
      { f: 220,   type: 'sine',     g: 0.06 },
    ];

    voices.forEach((v, i) => {
      const osc = ctx.createOscillator();
      osc.type = v.type;
      osc.frequency.value = v.f;
      osc.detune.value = (i - 2) * 4;

      const g = ctx.createGain();
      g.gain.value = v.g;

      osc.connect(g);
      g.connect(master);
      osc.start();
      nodes.push(osc, g);

      // slow LFO per voice gives the chord a breathing motion
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.045 + i * 0.022;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = v.g * 0.45;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();
      nodes.push(lfo, lfoGain);
    });

    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(TARGET_GAIN, now + FADE_IN);
    nodes.push(softFilter, master);

    scheduleMelody();
  };

  const stop = () => {
    if (!ctx) return;
    if (melodyTimer) { clearInterval(melodyTimer); melodyTimer = null; }
    const localCtx = ctx;
    const localNodes = nodes;
    const localMaster = master;
    ctx = null; master = null; melodyBus = null; nodes = [];

    const now = localCtx.currentTime;
    localMaster.gain.cancelScheduledValues(now);
    localMaster.gain.setValueAtTime(localMaster.gain.value, now);
    localMaster.gain.linearRampToValueAtTime(0, now + FADE_OUT);

    setTimeout(() => {
      localNodes.forEach(n => {
        try { n.stop && n.stop(); } catch (e) {}
        try { n.disconnect(); } catch (e) {}
      });
      try { localCtx.close(); } catch (e) {}
    }, (FADE_OUT + 0.1) * 1000);
  };

  btn.addEventListener('click', () => {
    isOn = !isOn;
    btn.setAttribute('aria-pressed', String(isOn));
    if (isOn) start(); else stop();
  });
})();

// ── contact form: submit (mailto) + 3D tilt + transmit confirmation ─────────
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // 3D tilt — the form panel pitches gently with the cursor
  const wrap = form.closest('.contact-form-wrap');
  const stage = form.closest('.contact-stage');
  if (stage && wrap) {
    let tx = 0, ty = 0, sx = 0, sy = 0;
    let raf = 0;
    const apply = () => {
      sx += (tx - sx) * 0.08;
      sy += (ty - sy) * 0.08;
      wrap.style.setProperty('--tilt-x', `${sx.toFixed(3)}deg`);
      wrap.style.setProperty('--tilt-y', `${sy.toFixed(3)}deg`);
      if (Math.abs(tx - sx) > 0.02 || Math.abs(ty - sy) > 0.02) {
        raf = requestAnimationFrame(apply);
      } else {
        raf = 0;
      }
    };
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - 0.5;
      const ny = (e.clientY - r.top)  / r.height - 0.5;
      tx = -ny * 5.5;
      ty =  nx * 7.0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    stage.addEventListener('pointerleave', () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  // submit — open default mail client with a prefilled draft
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name    = (fd.get('name')    || '').toString().trim();
    const email   = (fd.get('email')   || '').toString().trim();
    const subject = (fd.get('subject') || 'Portfolio enquiry').toString().trim();
    const message = (fd.get('message') || '').toString().trim();
    if (!name || !email || !message) {
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 600);
      return;
    }
    const body = encodeURIComponent(
      `${message}\n\n— ${name}\n${email}`
    );
    const subj = encodeURIComponent(`[Portfolio] ${subject}`);
    window.location.href = `mailto:samir@luminartechnology.com?subject=${subj}&body=${body}`;

    form.classList.add('sent');
    setTimeout(() => {
      form.classList.remove('sent');
      form.reset();
    }, 5200);
  });
})();

// ── scroll-triggered reveal of content sections ─────────────────────────────
(() => {
  const targets = document.querySelectorAll(
    '.content section, .stat, .venture-card, .timeline li, .direct-link'
  );
  if (!targets.length || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => io.observe(el));
})();

// ── inline smooth scroll (wheel + touchpad) ─────────────────────────────────
// Lightweight Lenis-style smoother. Wheel events are intercepted and the
// real scroll position is eased toward the target via rAF, removing the
// jittery "stutter" feel from large per-frame scroll deltas combined with
// the 3D rendering load. Native scrollbar drag, keyboard arrows, and touch
// continue to work — they just take over the smoother on the way in.
(() => {
  // honour reduced-motion users — they'd rather have instant scroll
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // do not run on touch-first devices — native momentum scroll is better there
  if (matchMedia('(hover: none)').matches) return;

  const LERP = 0.10;            // 0 = no movement, 1 = no easing
  const SETTLE_EPSILON = 0.4;

  let target  = window.scrollY;
  let current = window.scrollY;
  let raf = 0;
  let animating = false;

  const maxY = () => Math.max(0,
    document.documentElement.scrollHeight - window.innerHeight);

  const tick = () => {
    const diff = target - current;
    if (Math.abs(diff) < SETTLE_EPSILON) {
      current = target;
      window.scrollTo(0, current);
      raf = 0;
      animating = false;
      return;
    }
    current += diff * LERP;
    window.scrollTo(0, current);
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener('wheel', (e) => {
    // never intercept browser zoom or horizontal-dominant scrolls
    if (e.ctrlKey) return;
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    e.preventDefault();

    // normalise line-mode wheels (legacy mice) to pixels
    const pxDelta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    target = Math.max(0, Math.min(maxY(), target + pxDelta));

    animating = true;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: false });

  // sync when something else moves the page (scrollbar drag, keys, anchor jumps)
  window.addEventListener('scroll', () => {
    if (!animating) {
      target  = window.scrollY;
      current = window.scrollY;
      return;
    }
    // big drift while animating = user grabbed the scrollbar / pressed a key
    if (Math.abs(window.scrollY - current) > 60) {
      cancelAnimationFrame(raf);
      raf = 0;
      animating = false;
      target  = window.scrollY;
      current = window.scrollY;
    }
  }, { passive: true });

  // keep target sane after window resize (max scroll can change)
  window.addEventListener('resize', () => {
    target  = Math.min(target,  maxY());
    current = Math.min(current, maxY());
  });
})();
