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

// ── renderer ────────────────────────────────────────────────────────────────
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x02030a, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.78;

// ── scene & camera ──────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02030a, 0.038);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 220);
camera.position.set(0, 0.4, 22);

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
  0.42, 0.75, 0.55
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
const PARTICLE_COUNT = 9000;

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

  sizes[i] = 0.45 + Math.pow(Math.random(), 2.4) * 1.2;
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

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      // perspective sizing — quieter overall, blooms a touch when fully formed
      float size = aSize * uPixel * (260.0 / -mv.z);
      size *= 0.45 + 0.65 * em;
      gl_PointSize = size;

      // intensity: dim while travelling, brighter only when formed.
      // This is the key fix for "too much light" during scroll.
      float flicker = 0.5 + 0.5 * sin(uTime * 1.4 + aSeed * 12.0 + p.x + p.y);
      vGlow = mix(0.18 + 0.10 * flicker, 0.70 + 0.20 * flicker, em);
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
      float core = smoothstep(0.5, 0.05, d);
      float halo = smoothstep(0.5, 0.22, d) * 0.25;
      float a = core * core * 0.75 + halo * 0.22;
      if (a < 0.01) discard;
      vec3 col = vColor * (0.55 + 0.55 * vGlow);
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

function sphericalTargets(radius, jitter = 0.18) {
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    const r = radius * (1 + (Math.random() - 0.5) * jitter);
    arr[i*3]     = r * Math.sin(p) * Math.cos(t);
    arr[i*3 + 1] = r * Math.sin(p) * Math.sin(t);
    arr[i*3 + 2] = r * Math.cos(p);
  }
  return arr;
}

function gridCityTargets() {
  // procedural skyline — vertical columns of varying height across a grid
  const pts = [];
  const cols = 22, rows = 22, spacing = 1.05;
  const halfC = (cols - 1) / 2, halfR = (rows - 1) / 2;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // organic density falloff
      const dx = (i - halfC) / halfC, dz = (j - halfR) / halfR;
      const fall = Math.exp(-(dx * dx + dz * dz) * 1.4);
      if (Math.random() > fall * 0.95) continue;

      const x = (i - halfC) * spacing;
      const z = (j - halfR) * spacing;
      const h = 0.6 + Math.pow(Math.random(), 1.8) * (4.5 * fall + 0.5);
      const steps = 4 + ((h * 3) | 0);
      for (let k = 0; k < steps; k++) {
        pts.push([
          x + (Math.random() - 0.5) * 0.05,
          -3.2 + (k / steps) * h,
          z + (Math.random() - 0.5) * 0.05,
        ]);
      }
    }
  }
  // a few horizontal "skybridge" arcs for visual rhythm
  for (let k = 0; k < 4; k++) {
    const y = -1 + Math.random() * 3;
    const r = 6 + Math.random() * 3;
    for (let a = 0; a < 240; a++) {
      const ang = (a / 240) * Math.PI * 2;
      pts.push([Math.cos(ang) * r, y, Math.sin(ang) * r]);
    }
  }

  const arr = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = pts[(Math.random() * pts.length) | 0];
    arr[i*3]     = p[0];
    arr[i*3 + 1] = p[1];
    arr[i*3 + 2] = p[2];
  }
  return arr;
}

function visionTargets() {
  // multi-ring orbital system + dense central core
  const arr = new Float32Array(PARTICLE_COUNT * 3);
  const rings = [
    { r: 2.6, tilt: 0.0,  weight: 0.20 },
    { r: 3.6, tilt: 0.25, weight: 0.18 },
    { r: 4.8, tilt: -0.2, weight: 0.16 },
    { r: 6.2, tilt: 0.12, weight: 0.14 },
    { r: 7.8, tilt: -0.05, weight: 0.10 },
  ];
  const coreWeight = 0.22;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const rnd = Math.random();
    if (rnd < coreWeight) {
      // dense glowing core
      const r = 1.1 * Math.cbrt(Math.random());
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      arr[i*3]     = r * Math.sin(p) * Math.cos(t);
      arr[i*3 + 1] = r * Math.sin(p) * Math.sin(t);
      arr[i*3 + 2] = r * Math.cos(p);
    } else {
      // weighted ring sampling
      let acc = coreWeight, pick = rings[0];
      for (const ring of rings) {
        acc += ring.weight;
        if (rnd <= acc) { pick = ring; break; }
      }
      const a = Math.random() * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.12;
      const x = (pick.r + jitter) * Math.cos(a);
      const yLin = (pick.r + jitter) * Math.sin(a);
      arr[i*3]     = x;
      arr[i*3 + 1] = yLin * Math.cos(pick.tilt);
      arr[i*3 + 2] = yLin * Math.sin(pick.tilt);
    }
  }
  return arr;
}

// ── companion geometry per chapter ──────────────────────────────────────────

// CHAPTER II — neural core (sphere + orbital toruses)
const aiGroup = new THREE.Group();
const aiCore = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.1, 3),
  new THREE.MeshPhysicalMaterial({
    color: 0x0a141e, emissive: 0x2c7e98, emissiveIntensity: 0.45,
    metalness: 1.0, roughness: 0.22,
    clearcoat: 1.0, clearcoatRoughness: 0.06,
    transmission: 0.25, ior: 1.45, thickness: 1.2,
    transparent: true, opacity: 0.95,
  })
);
const aiWire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.85, 1),
  new THREE.MeshBasicMaterial({ color: 0x6ef0ff, wireframe: true, transparent: true, opacity: 0.20 })
);
const aiOuter = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.6, 0),
  new THREE.MeshBasicMaterial({ color: 0xb38bff, wireframe: true, transparent: true, opacity: 0.10 })
);
aiGroup.add(aiCore, aiWire, aiOuter);

for (let i = 0; i < 4; i++) {
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(2.5 + i * 0.55, 0.014, 14, 220),
    new THREE.MeshStandardMaterial({
      color: 0xdde8f4,
      emissive: i % 2 ? 0x6650a8 : 0x2c8eb0,
      emissiveIntensity: 0.45,
      metalness: 1.0,
      roughness: 0.18,
      transparent: true,
      opacity: 0.55,
    })
  );
  torus.rotation.x = Math.random() * Math.PI;
  torus.rotation.y = Math.random() * Math.PI;
  torus.rotation.z = Math.random() * Math.PI;
  torus.userData.spin = new THREE.Vector3(
    0.10 + Math.random() * 0.25,
    0.08 + Math.random() * 0.25,
    0.06 + Math.random() * 0.18,
  );
  aiGroup.add(torus);
}
aiGroup.visible = false;
scene.add(aiGroup);

// CHAPTER III — city grid columns (instanced glass)
const cityGroup = new THREE.Group();
{
  const cols = 16;
  const count = cols * cols;
  const geo = new THREE.BoxGeometry(0.05, 1, 0.05);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc8d6e6, emissive: 0x2a7a98, emissiveIntensity: 0.18,
    metalness: 1.0, roughness: 0.32, transparent: true, opacity: 0.38,
  });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const halfC = (cols - 1) / 2;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      const x = (i - halfC) * 1.1;
      const z = (j - halfC) * 1.1;
      const dx = (i - halfC) / halfC;
      const dz = (j - halfC) / halfC;
      const fall = Math.exp(-(dx * dx + dz * dz) * 1.2);
      const h = 0.4 + Math.pow(Math.random(), 1.4) * (5 * fall);
      dummy.position.set(x, -3.2 + h / 2, z);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i * cols + j, dummy.matrix);
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  cityGroup.add(inst);
}
cityGroup.visible = false;
scene.add(cityGroup);

// CHAPTER IV — orbital rings of vision
const visionGroup = new THREE.Group();
for (let i = 0; i < 7; i++) {
  const r = 2.4 + i * 0.55;
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.011, 14, 260),
    new THREE.MeshStandardMaterial({
      color: 0xdde8f4,
      emissive: i % 2 ? 0x5c4a96 : 0x2c8eb0,
      emissiveIntensity: 0.55,
      metalness: 1.0,
      roughness: 0.12,
      transparent: true,
      opacity: 0.42,
    })
  );
  torus.rotation.x = Math.PI / 2 + (i - 3) * 0.05;
  torus.rotation.z = i * 0.22;
  torus.userData.spin = 0.06 + i * 0.025;
  visionGroup.add(torus);
}
{
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0xb8e6f0 })
  );
  core.userData.isCore = true;
  visionGroup.add(core);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x6ef0ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending })
  );
  visionGroup.add(halo);
}
visionGroup.visible = false;
scene.add(visionGroup);

// ── camera anchor poses per chapter ─────────────────────────────────────────
const camPaths = [
  { pos: new THREE.Vector3(0,  0.4, 22), look: new THREE.Vector3(0,  0.0, 0) }, // I  Genesis
  { pos: new THREE.Vector3(3.2, 1.2, 9), look: new THREE.Vector3(0,  0.0, 0) }, // II Intelligence
  { pos: new THREE.Vector3(0,  9,   18), look: new THREE.Vector3(0, -1.5, 0) }, // III Innovation
  { pos: new THREE.Vector3(6.5, 1.4, 11), look: new THREE.Vector3(0, 0.0, 0) }, // IV  Vision
  { pos: new THREE.Vector3(0,  0.0, 22), look: new THREE.Vector3(0, 0.0, 0) },  // V   Legacy
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

  // Chapter I — the first name emerging from chaos
  TARGETS[0] = pointsToTargets(
    sampleText('SAMIR', {
      fontSize: 360, fontWeight: 800, letterSpacing: '0.04em',
      density: 3, width: 2200, height: 500, scale: 0.0090,
    })
  );
  TARGETS[1] = sphericalTargets(1.95, 0.22);
  TARGETS[2] = gridCityTargets();
  TARGETS[3] = visionTargets();
  // Chapter V — the full signature in light, stacked so it can never clip
  TARGETS[4] = stackedTextTargets([
    {
      text: 'SAMIR',
      y: 1.10,
      opts: {
        fontSize: 320, fontWeight: 800, letterSpacing: '0.04em',
        density: 3, width: 2200, height: 440, scale: 0.0078, depth: 0.22,
      },
    },
    {
      text: 'HASAN',
      y: -1.10,
      opts: {
        fontSize: 320, fontWeight: 800, letterSpacing: '0.04em',
        density: 3, width: 2200, height: 440, scale: 0.0078, depth: 0.22,
      },
    },
  ]);
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
function updateScroll() {
  const storyHeight = 5 * window.innerHeight;
  scrollProgress = Math.min(1, Math.max(0, window.scrollY / storyHeight));
  // toggle a class once we've scrolled past the cinematic story so the canvas
  // dims behind the readable content (and the cinematic UI gets out of the way)
  const pastStory = window.scrollY > storyHeight - window.innerHeight * 0.15;
  document.body.classList.toggle('past-story', pastStory);
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

function frame() {
  requestAnimationFrame(frame);

  const dt = Math.min(0.05, clock.getDelta());
  const t  = clock.getElapsedTime();

  particleMat.uniforms.uTime.value = t;

  // smooth mouse → world-space pointer (z = 0 plane)
  mouse3.set(mouse.x * 9, mouse.y * 5, 0);
  mouseSmooth.lerp(mouse3, 0.06);
  particleMat.uniforms.uMouse.value.copy(mouseSmooth);

  if (TARGETS[0]) {
    // inertial smoothing — the single biggest improvement to scroll feel.
    // Camera & formations now lerp toward an eased progress instead of
    // tracking the wheel directly, which was producing the "snap" feeling.
    scrollSmooth += (scrollProgress - scrollSmooth) * 0.085;
    const { idx, local } = getSectionState(scrollSmooth);

    // section change — swap target buffer when uMix is near 0 (dissolved)
    if (idx !== activeIdx) {
      activeIdx = idx;
      setTargetBuffer(TARGETS[idx]);
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      aiGroup.visible     = (idx === 1);
      cityGroup.visible   = (idx === 2);
      visionGroup.visible = (idx === 3);

      // per-section accent color & bloom feel — kept conservative everywhere
      const accents = [0x6ef0ff, 0x6ef0ff, 0xb38bff, 0xdfe7ef, 0x6ef0ff];
      particleMat.uniforms.uAccent.value.setHex(accents[idx]);
      bloom.strength = idx === 4 ? 0.55 : 0.42;
    }

    // mix curve: form FAST, hold LONG, dissolve LATE.
    // This is what gives each chapter a clear, readable 3D moment.
    //   0.00→0.18 : assemble
    //   0.18→0.85 : hold formed (the meaning)
    //   0.85→1.00 : dissolve (only the chapter V stays formed)
    let mixTarget;
    if (idx === 4) {
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

    // chapter IV: slow orbital motion around the vision rings
    if (idx === 3) {
      const phase = t * 0.09 + local * 0.4;
      const orbit = 11;
      tmpPos.x = Math.cos(phase) * orbit + mouse.x * 0.4;
      tmpPos.z = Math.sin(phase) * orbit;
      tmpPos.y = 1.2 + mouse.y * 0.4;
      tmpLook.set(0, 0, 0);
    }
    // chapter V: slow, deliberate push-in from a wide framing so the
    // stacked "LUMINAR / TECHNOLOGY" reveals cleanly without clipping.
    if (idx === 4) {
      const eased = smoothstep(0, 1, local);
      tmpPos.x = mouse.x * 0.35;
      tmpPos.y = mouse.y * 0.25;
      tmpPos.z = 23.5 - eased * 4.5;     // 23.5 → 19.0
      tmpLook.set(0, 0, 0);
    }

    camera.position.lerp(tmpPos, 0.045);
    camera.lookAt(tmpLook);

    // animate companion meshes
    if (aiGroup.visible) {
      aiGroup.rotation.y += dt * 0.18;
      aiCore.rotation.x  += dt * 0.45;
      aiCore.rotation.y  += dt * 0.35;
      aiWire.rotation.x  -= dt * 0.25;
      aiWire.rotation.y  -= dt * 0.30;
      aiOuter.rotation.x += dt * 0.10;
      aiOuter.rotation.z += dt * 0.08;
      aiGroup.children.forEach((c) => {
        if (c.userData.spin instanceof THREE.Vector3) {
          c.rotation.x += c.userData.spin.x * dt;
          c.rotation.y += c.userData.spin.y * dt;
          c.rotation.z += c.userData.spin.z * dt;
        }
      });
      // breathing scale tied to mix
      const breathe = 0.92 + 0.08 * Math.sin(t * 1.6);
      const s = breathe * (0.6 + 0.4 * particleMat.uniforms.uMix.value);
      aiGroup.scale.setScalar(s);
    }

    if (cityGroup.visible) {
      cityGroup.rotation.y += dt * 0.05;
      const s = 0.6 + 0.4 * particleMat.uniforms.uMix.value;
      cityGroup.scale.setScalar(s);
    }

    if (visionGroup.visible) {
      visionGroup.children.forEach((c) => {
        if (typeof c.userData.spin === 'number') {
          c.rotation.z += c.userData.spin * dt;
          c.rotation.x += c.userData.spin * dt * 0.3;
        }
        if (c.userData.isCore) {
          const pulse = 1.0 + 0.12 * Math.sin(t * 2.2);
          c.scale.setScalar(pulse);
        }
      });
      visionGroup.rotation.y += dt * 0.04;
      const s = 0.7 + 0.3 * particleMat.uniforms.uMix.value;
      visionGroup.scale.setScalar(s);
    }

    // gentle particle field rotation gives sense of life everywhere
    particles.rotation.y += dt * 0.012;
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
