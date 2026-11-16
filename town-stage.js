// Startup Ladder: Pebblewick as the stage behind the cards.
// Forked from forest-mockup/js/town.js (same world builder and day/night lighting) with walking, tags and the
// PC removed. Instead the camera flies between named shots (SHOTS below) whenever game.js shows a card with a
// `stage`. The layout (town-layout.js) and the models come from server.js's /town/ route (bundled ./town or ../forest-mockup).
//
// API (window.TownStage):  goTo({ shot, day, hour }, { instant })   setFocus({ x, y, w, h })   ready   current()
// Events on window:        townstage:progress (detail 0..1)   townstage:ready   townstage:error (detail message)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TOWN_BASE = './town/'; // served by server.js
const params = new URLSearchParams(location.search);
const emit = (name, detail) => window.dispatchEvent(new CustomEvent('townstage:' + name, { detail }));
const API = { ready: false, error: null, goTo() {}, setFocus() {}, current: () => null };
window.TownStage = API;

if (params.get('nostage') === '1') {
  API.error = 'disabled';
  queueMicrotask(() => emit('error', 'disabled'));
} else {
  boot().catch((err) => {
    console.warn('[town-stage] 3D town unavailable:', err);
    API.error = String(err && err.message ? err.message : err);
    emit('error', API.error);
  });
}

async function boot() {
  const { TOWN, CATEGORIES, ROADS, RINGS, POND, BUILDINGS, HOME, PROPS, LAMPS, FENCES } = await import(TOWN_BASE + 'js/town-layout.js');

  // ───────────────────────────────────────────────────────── utilities
  const V3 = THREE.Vector3;
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(7);
  const rr = (a, b) => a + (b - a) * rand();
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  function hash2(x, z) { const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return h - Math.floor(h); }
  function vnoise(x, z) {
    const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
    const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
  }
  function fbm(x, z) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, z * f); f *= 2; a *= 0.5; } return s; }
  class Grid {
    constructor(cell) { this.cell = cell; this.map = new Map(); this.stamp = 0; }
    insert(o, minX, minZ, maxX, maxZ) {
      const c = this.cell;
      for (let ix = Math.floor(minX / c); ix <= Math.floor(maxX / c); ix++)
        for (let iz = Math.floor(minZ / c); iz <= Math.floor(maxZ / c); iz++) {
          const k = ix * 4096 + iz; let a = this.map.get(k); if (!a) this.map.set(k, (a = [])); a.push(o);
        }
    }
    query(x, z, r, fn) {
      const c = this.cell, s = ++this.stamp;
      for (let ix = Math.floor((x - r) / c); ix <= Math.floor((x + r) / c); ix++)
        for (let iz = Math.floor((z - r) / c); iz <= Math.floor((z + r) / c); iz++) {
          const a = this.map.get(ix * 4096 + iz); if (!a) continue;
          for (const o of a) { if (o._s === s) continue; o._s = s; if (fn(o) === false) return false; }
        }
      return true;
    }
  }

  // ───────────────────────────────────────────────────────── ground
  const B = TOWN.bounds;
  function outsideDist(x, z) {
    const dx = Math.max(B.minX - x, x - B.maxX), dz = Math.max(B.minZ - z, z - B.maxZ);
    return dx > 0 && dz > 0 ? Math.hypot(dx, dz) : Math.max(dx, dz);
  }
  const pondDist = (x, z) => Math.hypot(x - POND.x, z - POND.z);
  function heightAt(x, z) {
    const o = outsideDist(x, z);
    let h = 0;
    if (o > 0) {
      const k = smooth(0, 26, o);
      h = k * (8 + 7 * fbm(x * 0.04 + 3, z * 0.04 - 2)) + smooth(26, 80, o) * 12 + k * fbm(x * 0.13, z * 0.13) * 0.8;
    }
    const pd = pondDist(x, z);
    if (pd < POND.r + 1.5) h = lerp(h, -1.2, smooth(POND.r + 1.2, POND.r - 1.6, pd));
    return h;
  }
  const FIELD = PROPS.find((p) => p.type === 'field');
  const inField = (x, z) => FIELD && Math.abs(x - FIELD.x) < FIELD.w / 2 && Math.abs(z - FIELD.z) < FIELD.d / 2;

  // ───────────────────────────────────────────────────────── renderer / scene
  const canvas = document.getElementById('town');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const small = Math.min(innerWidth, innerHeight) < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#cde7f4', 120, 320);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1000);

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#3d97e3') }, horizon: { value: new THREE.Color('#cde7f4') }, bottom: { value: new THREE.Color('#e6efe9') } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vDir;
      void main(){ float y = vDir.y;
        vec3 c = y > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 0.55, y), 0.75)) : mix(horizon, bottom, smoothstep(0.0, -0.25, y));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), skyMat);
  sky.renderOrder = -1;
  scene.add(sky);
  const stars = (() => {
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, y = 0.06 + Math.random() * 0.94, r = Math.sqrt(1 - y * y);
      pos.set([Math.cos(a) * r * 540, y * 540, Math.sin(a) * r * 540], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    p.visible = false;
    scene.add(p);
    return p;
  })();

  const hemi = new THREE.HemisphereLight('#d4e9ff', '#6b8a4a', 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3df', 2.7);
  const sunDir = new V3(0.45, 0.8, 0.4).normalize();
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 360;
  scene.add(sun, sun.target);

  // nothing collides on a stage; the builders below still call these
  const addBox = () => ({ on: true });
  const addCircle = () => ({ on: true });

  // 1 m occupancy grid so trees/grass stay off roads, buildings and props
  const OCC_HALF = 160, OCC_N = OCC_HALF * 2, occ = new Uint8Array(OCC_N * OCC_N);
  function occMark(minX, minZ, maxX, maxZ) {
    const x0 = Math.max(0, Math.floor(minX + OCC_HALF)), x1 = Math.min(OCC_N - 1, Math.floor(maxX + OCC_HALF));
    const z0 = Math.max(0, Math.floor(minZ + OCC_HALF)), z1 = Math.min(OCC_N - 1, Math.floor(maxZ + OCC_HALF));
    for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) occ[iz * OCC_N + ix] = 1;
  }
  function occFree(x, z, m = 0) {
    const x0 = Math.max(0, Math.floor(x - m + OCC_HALF)), x1 = Math.min(OCC_N - 1, Math.floor(x + m + OCC_HALF));
    const z0 = Math.max(0, Math.floor(z - m + OCC_HALF)), z1 = Math.min(OCC_N - 1, Math.floor(z + m + OCC_HALF));
    for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) if (occ[iz * OCC_N + ix]) return false;
    return true;
  }

  // ───────────────────────────────────────────────────────── geometry batching
  const vcMat = (extra = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88, ...extra });
  const staticMat = vcMat();
  const decalMat = vcMat({ roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  function gableGeo() {
    const A = [-0.5, -0.5, -0.5], Bv = [0.5, -0.5, -0.5], C = [0.5, -0.5, 0.5], D = [-0.5, -0.5, 0.5], E = [-0.5, 0.5, 0], F = [0.5, 0.5, 0];
    const tris = [A, F, Bv, A, E, F, D, C, F, D, F, E, A, D, E, Bv, F, C, A, Bv, C, A, C, D];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
    g.computeVertexNormals();
    return g;
  }
  const G = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
    cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
    cyl12: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
    cone6: new THREE.ConeGeometry(0.5, 1, 6),
    cone8: new THREE.ConeGeometry(0.5, 1, 8),
    pyramid: new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1).rotateY(Math.PI / 4),
    ico: new THREE.IcosahedronGeometry(0.5, 0),
    gable: gableGeo(),
  };
  G.box.userData.topFace = [12, 18];
  const _mA = new THREE.Matrix4(), _mB = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new V3(), _s = new V3();
  const _c1 = new THREE.Color(), _c2 = new THREE.Color();
  class Batch {
    constructor() { this.parts = []; this.base = new THREE.Matrix4(); }
    at(x = 0, y = 0, z = 0, ry = 0) { this.base.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(0, ry, 0)), _s.set(1, 1, 1)); return this; }
    add(geo, color, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
      _mA.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
      _mB.multiplyMatrices(this.base, _mA);
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      g.clearGroups();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      g.applyMatrix4(_mB);
      const [side, top] = Array.isArray(color) ? color : [color, null];
      const tf = top && geo.userData.topFace;
      _c1.set(side); if (tf) _c2.set(top);
      const n = g.attributes.position.count, arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) (tf && i >= tf[0] && i < tf[1] ? _c2 : _c1).toArray(arr, i * 3);
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      this.parts.push(g);
      return this;
    }
    box(w, h, d, x, y0, z, color, ry = 0) { return this.add(G.box, color, x, y0 + h / 2, z, w, h, d, 0, ry, 0); }
    mesh(material = staticMat, shadows = true) {
      const m = new THREE.Mesh(mergeGeometries(this.parts, false), material);
      this.parts = [];
      m.castShadow = m.receiveShadow = shadows;
      return m;
    }
  }

  // things that go see-through when they block the shot (or get cut away for interior shots)
  const faders = [];
  function makeFader(meshes, extra = {}) {
    const mats = [...new Set(meshes.map((m) => m.material))];
    mats.forEach((m) => { m.transparent = true; });
    const f = { meshes, mats, op: 1, target: 1, shadow: true, ...extra };
    faders.push(f);
    return f;
  }
  function updateFaders(dt) {
    const k = 1 - Math.exp(-dt * 8);
    for (const f of faders) {
      if (f.op === f.target) continue;
      f.op = Math.abs(f.target - f.op) < 0.004 ? f.target : lerp(f.op, f.target, k);
      for (const m of f.mats) { m.opacity = f.op; m.depthWrite = f.op > 0.97; }
      for (const m of f.meshes) { m.visible = f.op > 0.02; m.castShadow = f.shadow && f.op > 0.5; }
    }
  }

  // ───────────────────────────────────────────────────────── asset loading
  const MODEL_NAMES = [
    ...['1_A', '1_B', '1_C', '2_A', '2_B', '2_C', '2_D', '3_A', '3_B', '3_C', '4_A', '4_B', '4_C'].map((s) => 'Tree_' + s),
    ...['1_B', '1_C', '1_D', '2_A', '2_B', '2_C', '3_A', '3_B', '4_A', '4_B', '4_C'].map((s) => 'Bush_' + s),
    ...['1_A', '1_B', '1_C', '1_D', '2_A', '2_B', '2_C'].map((s) => 'Grass_' + s),
    ...['1_A', '1_B', '1_C', '1_D', '1_E', '2_A', '2_B', '2_C', '3_A', '3_B', '3_C', '3_D'].map((s) => 'Rock_' + s),
  ];
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, done, total) => emit('progress', (done / total) * 0.85);
  const gltfLoader = new GLTFLoader(manager).setPath(TOWN_BASE + 'assets/models/');
  const GEO = {};
  let atlas;
  const kaykitDone = Promise.all(MODEL_NAMES.map(async (name) => {
    const gltf = await gltfLoader.loadAsync(`${name}_Color1.gltf`);
    let mesh; gltf.scene.traverse((o) => { if (o.isMesh) mesh = o; });
    GEO[name] = mesh.geometry;
    atlas ??= mesh.material.map;
  }));
  // The room model references a texture that isn't in the archive; every part gets a flat colour instead.
  const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
  const fbxManager = new THREE.LoadingManager();
  fbxManager.setURLModifier((url) => (/\.(png|jpe?g|tga|bmp|dds)$/i.test(url) ? PIXEL : url));
  const roomUrl = TOWN_BASE + HOME.room.url.replace(/^\.\//, '');
  const [roomModel] = await Promise.all([new FBXLoader(fbxManager).loadAsync(roomUrl), kaykitDone]);
  emit('progress', 0.9);
  await new Promise((r) => setTimeout(r, 0));

  // ───────────────────────────────────────────────────────── terrain
  const WORLD = 320, SEG = 160;
  const GC = Object.fromEntries(Object.entries({
    g1: '#76ae49', g2: '#5f9a40', g3: '#8bc159', dark: '#4a8238', rock: '#9ea79d', sand: '#dcc890', mud: '#5c7f5e', soil: '#8a6a48',
  }).map(([k, v]) => [k, new THREE.Color(v)]));
  function groundColor(out, x, z, ny) {
    const n = fbm(x * 0.07 + 3, z * 0.07 - 9) * 0.5 + 0.5;
    out.copy(GC.g2).lerp(GC.g1, smooth(0.3, 0.55, n)).lerp(GC.g3, smooth(0.62, 0.85, n));
    out.lerp(GC.dark, smooth(2, 30, outsideDist(x, z)) * 0.5);
    out.lerp(GC.rock, smooth(0.86, 0.72, ny));
    const pd = pondDist(x, z);
    out.lerp(GC.sand, smooth(POND.r + 1.8, POND.r + 0.7, pd));
    out.lerp(GC.mud, smooth(POND.r + 0.1, POND.r - 1.0, pd));
    if (inField(x, z)) out.lerp(GC.soil, 0.8);
    out.offsetHSL(0, 0, (hash2(x * 3.1, z * 1.7) - 0.5) * 0.05);
    return out;
  }
  {
    let geo = new THREE.PlaneGeometry(WORLD, WORLD, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, cell = WORLD / SEG, edge = WORLD / 2 - 0.01;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), z = pos.getZ(i);
      if (Math.abs(x) < edge && Math.abs(z) < edge) {
        x += (hash2(x * 1.3, z * 0.7) - 0.5) * cell * 0.7;
        z += (hash2(x * 0.9, z * 1.9) - 0.5) * cell * 0.7;
      }
      pos.setXYZ(i, x, heightAt(x, z), z);
    }
    geo = geo.toNonIndexed();
    geo.computeVertexNormals();
    const p = geo.attributes.position, n = geo.attributes.normal, colors = new Float32Array(p.count * 3), col = new THREE.Color();
    for (let i = 0; i < p.count; i += 3) {
      groundColor(col, (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3, n.getY(i));
      for (let k = 0; k < 3; k++) col.toArray(colors, (i + k) * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
    terrain.receiveShadow = true;
    scene.add(terrain);
  }

  // ───────────────────────────────────────────────────────── roads
  {
    const SURF = {
      cobble: { a: '#d2c6b0', b: '#bcae96', grout: '#9d927f', tile: 1.0 },
      dirt: { a: '#d2ab79', b: '#c39a68', tile: 1.25 },
      stone: { a: '#c3beb3', b: '#a9a397', grout: '#8a857b', tile: 0.7 },
    };
    const P = [], C = [], col = new THREE.Color();
    const quad = (pts, y, c) => {
      let [a, b, cc, d] = pts;
      if ((b[1] - a[1]) * (cc[0] - a[0]) - (b[0] - a[0]) * (cc[1] - a[1]) < 0) [b, d] = [d, b];
      for (const v of [a, b, cc, a, cc, d]) { P.push(v[0], y, v[1]); C.push(c.r, c.g, c.b); }
    };
    const covered = (x, z, upto) => ROADS.slice(0, upto).some(({ rect: [a, b, c, d] }) => x > a && x < c && z > b && z < d);
    ROADS.forEach((rd, i) => {
      const s = SURF[rd.surface], [x0, z0, x1, z1] = rd.rect;
      if (s.grout) quad([[x0, z0], [x0, z1], [x1, z1], [x1, z0]], 0.012, col.set(s.grout));
      const nx = Math.max(1, Math.round((x1 - x0) / s.tile)), nz = Math.max(1, Math.round((z1 - z0) / s.tile));
      const tx = (x1 - x0) / nx, tz = (z1 - z0) / nz, gap = s.grout ? 0.05 : 0;
      for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) {
        const ax = x0 + ix * tx, az = z0 + iz * tz, cx = ax + tx / 2, cz = az + tz / 2;
        if (covered(cx, cz, i)) continue;
        col.set(s.a).lerp(_c1.set(s.b), hash2(cx * 1.7, cz * 2.3)).offsetHSL(0, 0, (hash2(cz, cx) - 0.5) * 0.04);
        quad([[ax + gap, az + gap], [ax + gap, az + tz - gap], [ax + tx - gap, az + tz - gap], [ax + tx - gap, az + gap]], 0.02, col);
      }
      occMark(x0 - 0.6, z0 - 0.6, x1 + 0.6, z1 + 0.6);
    });
    for (const ring of RINGS) {
      const s = SURF[ring.surface], N = 64;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
        const pt = (r, a) => [ring.x + Math.cos(a) * r, ring.z + Math.sin(a) * r];
        col.set(s.a).lerp(_c1.set(s.b), hash2(i * 1.3, 7));
        quad([pt(ring.r0, a0), pt(ring.r1, a0), pt(ring.r1, a1), pt(ring.r0, a1)], 0.025, col);
      }
      for (let x = -ring.r1 - 1; x <= ring.r1 + 1; x++) for (let z = -ring.r1 - 1; z <= ring.r1 + 1; z++) {
        const d = Math.hypot(x, z); if (d > ring.r0 - 0.8 && d < ring.r1 + 0.8) occMark(ring.x + x, ring.z + z, ring.x + x, ring.z + z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    geo.computeVertexNormals();
    const roads = new THREE.Mesh(geo, decalMat);
    roads.receiveShadow = true;
    scene.add(roads);
  }

  // ───────────────────────────────────────────────────────── pond
  const water = (() => {
    const g = new THREE.CircleGeometry(POND.r + 0.6, 32).rotateX(-Math.PI / 2).toNonIndexed();
    const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#46b4d6', transparent: true, opacity: 0.82, roughness: 0.12, flatShading: true }));
    mesh.position.set(POND.x, -0.12, POND.z);
    mesh.receiveShadow = true;
    mesh.userData.base = Float32Array.from(g.attributes.position.array);
    scene.add(mesh);
    occMark(POND.x - POND.r - 1, POND.z - POND.r - 1, POND.x + POND.r + 1, POND.z + POND.r + 1);
    return mesh;
  })();
  function animateWater(t) {
    const a = water.geometry.attributes.position, b = water.userData.base;
    for (let i = 0; i < a.count; i++) a.array[i * 3 + 1] = Math.sin(t * 1.4 + b[i * 3] * 0.9 + b[i * 3 + 2] * 0.3) * 0.04 + Math.cos(t * 1.1 + b[i * 3 + 2] * 1.2) * 0.03;
    a.needsUpdate = true;
    water.geometry.computeVertexNormals();
  }

  // ───────────────────────────────────────────────────────── buildings
  const FACING_RY = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 };
  const toWorld = (x, z, ry, lx, lz) => [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
  const buildings = [];
  const windowMats = [];
  function buildBuilding(def) {
    const cat = CATEGORIES[def.cat], ry = FACING_RY[def.facing];
    const { w, d, h } = def;
    const roofH = def.roof === 'hip' ? Math.min(w, d) * 0.32 : Math.min(d * 0.42, 3.4);
    const shell = new Batch().at(def.x, 0, def.z, ry), glass = new Batch().at(def.x, 0, def.z, ry);
    shell.box(w + 0.3, 0.3, d + 0.3, 0, 0, 0, '#a7a196');
    shell.box(w, h, d, 0, 0, 0, cat.wall);
    shell.box(w + 0.24, 0.2, d + 0.24, 0, h - 0.04, 0, '#8d8378');
    shell.add(def.roof === 'hip' ? G.pyramid : G.gable, cat.roof, 0, h + 0.16 + roofH / 2, 0, w + 0.9, roofH, d + 0.9);
    const fz = d / 2;
    shell.box(1.56, 2.55, 0.1, 0, 0.25, fz + 0.02, '#5a4030');
    shell.box(1.2, 2.3, 0.14, 0, 0.27, fz + 0.04, '#7b5537');
    shell.box(2.2, 0.16, 0.9, 0, 0, fz + 0.45, '#b9b2a5');
    shell.box(2.8, 0.62, 0.12, 0, Math.min(h - 0.95, 3.4), fz + 0.08, cat.accent);
    const floors = Math.max(1, Math.round(h / 3.2)), floorH = h / floors, winW = 1.1, winH = Math.min(1.25, floorH * 0.38);
    const faceWindows = (span, off, alongX, sign, door) => {
      const cols = Math.max(1, Math.floor((span - 1) / 2.8));
      for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
        const t = ((c + 0.5) / cols - 0.5) * span;
        if (door && f === 0 && Math.abs(t) < 1.7) continue;
        const y0 = f * floorH + floorH * 0.5 - winH / 2 + 0.25;
        if (alongX) {
          shell.box(winW + 0.24, winH + 0.24, 0.08, t, y0 - 0.12, off + sign * 0.03, '#f3efe6');
          glass.box(winW, winH, 0.08, t, y0, off + sign * 0.06, '#35506b');
        } else {
          shell.box(0.08, winH + 0.24, winW + 0.24, off + sign * 0.03, y0 - 0.12, t, '#f3efe6');
          glass.box(0.08, winH, winW, off + sign * 0.06, y0, t, '#35506b');
        }
      }
    };
    faceWindows(w, d / 2, true, 1, true); faceWindows(w, -d / 2, true, -1, false);
    faceWindows(d, w / 2, false, 1, false); faceWindows(d, -w / 2, false, -1, false);
    if (def.awning) {
      const aw = w - 0.8, n = Math.max(3, Math.round(aw / 0.7)), sw = aw / n;
      for (let i = 0; i < n; i++) shell.add(G.box, i % 2 ? '#f6f1e7' : def.awning, -aw / 2 + sw * (i + 0.5), 2.84, fz + 0.66, sw, 0.07, 1.4, 0.42, 0, 0);
    }
    if (def.chimney) shell.box(0.75, roofH * 0.75 + 1.0, 0.75, w * 0.27, h + roofH * 0.25, -d * 0.16, '#9a7f6e');
    let extraH = 0;
    if (def.tower) {
      extraH = 9.6;
      shell.box(4.2, 6.2, 4.2, 0, h, -0.6, cat.wall);
      shell.box(4.5, 0.25, 4.5, 0, h + 6.2, -0.6, '#8d8378');
      shell.add(G.pyramid, cat.roof, 0, h + 6.45 + 1.6, -0.6, 5.0, 3.2, 5.0);
      shell.add(G.cyl12, '#f6f1e2', 0, h + 4.2, 1.55, 2.3, 0.1, 2.3, Math.PI / 2, 0, 0);
      shell.box(0.12, 0.75, 0.05, 0, h + 4.2, 1.62, '#2d2a3a');
      shell.add(G.box, '#2d2a3a', 0.25, h + 4.2, 1.62, 0.6, 0.1, 0.05);
    }
    const glassMat = vcMat({ roughness: 0.25, metalness: 0.15, emissive: new THREE.Color('#ffc46b'), emissiveIntensity: 0 });
    windowMats.push(glassMat);
    const m1 = shell.mesh(vcMat()), m2 = glass.mesh(glassMat);
    scene.add(m1, m2);
    const side = def.facing === 'E' || def.facing === 'W';
    const hx = (side ? d : w) / 2, hz = (side ? w : d) / 2;
    const aabb = { minX: def.x - hx - 0.2, maxX: def.x + hx + 0.2, minZ: def.z - hz - 0.2, maxZ: def.z + hz + 0.2, maxY: h + roofH + extraH + 0.4 };
    occMark(def.x - hx - 1.8, def.z - hz - 1.8, def.x + hx + 1.8, def.z + hz + 1.8);
    const [dx, dz] = toWorld(def.x, def.z, ry, 0, fz + 1.4);
    occMark(dx - 1.6, dz - 1.6, dx + 1.6, dz + 1.6);
    buildings.push({ def, aabb, fader: makeFader([m1, m2]) });
  }
  BUILDINGS.forEach(buildBuilding);

  // ───────────────────────────────────────────────────────── your house (cut away for interior shots)
  const HX = HOME.x, HZ = HOME.z, FY = HOME.floorY, WH = HOME.wallH;
  const home = {
    walls: [], roof: null, roomFader: null,
    aabb: { minX: HX - HOME.halfW - 0.4, maxX: HX + HOME.halfW + 0.4, minZ: HZ - HOME.halfD - 0.4, maxZ: HZ + HOME.halfD + 0.4, maxY: WH + 3.2 },
  };
  {
    const homeCat = CATEGORIES.home;
    const fb = new Batch().at(HX, 0, HZ);
    fb.box(HOME.halfW * 2 + 0.7, 0.1, HOME.halfD * 2 + 0.7, 0, 0, 0, '#a7a196');
    fb.box(2.0, 0.12, 0.8, 0, 0, HOME.halfD + 0.65, '#b9b2a5');
    for (const room of HOME.rooms) {
      if (room.model) continue;
      const [x0, z0, x1, z1] = room.rect;
      const n = Math.round((z1 - z0) / 0.3);
      for (let i = 0; i < n; i++) fb.box(x1 - x0, FY, (z1 - z0) / n, (x0 + x1) / 2, 0, z0 + (i + 0.5) * ((z1 - z0) / n), room.floor[i % 2]);
    }
    scene.add(fb.mesh());

    for (const wd of HOME.walls) {
      const axis = wd.a[1] === wd.b[1] ? 'x' : 'z';
      const t = wd.t, c = axis === 'x' ? wd.a[1] : wd.a[0];
      const ext = wd.ext ? t : 0;
      const lo = Math.min(axis === 'x' ? wd.a[0] : wd.a[1], axis === 'x' ? wd.b[0] : wd.b[1]) - ext;
      const hi = Math.max(axis === 'x' ? wd.a[0] : wd.a[1], axis === 'x' ? wd.b[0] : wd.b[1]) + ext;
      const color = [wd.ext ? homeCat.wall : '#efe8dc', '#7a6656'];
      const b = new Batch().at(HX, 0, HZ);
      const piece = (s, e, y0, y1, col = color, thick = t) => {
        if (e - s < 0.005 || y1 - y0 < 0.005) return;
        if (axis === 'x') b.box(e - s, y1 - y0, thick, (s + e) / 2, y0, c, col);
        else b.box(thick, y1 - y0, e - s, c, y0, (s + e) / 2, col);
      };
      let cur = lo;
      for (const o of [...wd.openings].sort((p, q) => p.at - q.at)) {
        const s = o.at - o.w / 2, e = o.at + o.w / 2, bottom = o.kind === 'window' ? o.sill : 0, top = bottom + o.h;
        piece(cur, s, 0, WH);
        piece(s, e, 0, bottom);
        piece(s, e, top, WH);
        if (o.kind === 'window') {
          piece(s, e, bottom, top, '#a9d3e6', t * 0.3);
          piece(s - 0.08, e + 0.08, bottom - 0.06, bottom, '#f6f2ea', t + 0.1);
        } else {
          piece(s - 0.08, s, 0, top + 0.08, '#8b6b4e', t + 0.06);
          piece(e, e + 0.08, 0, top + 0.08, '#8b6b4e', t + 0.06);
          piece(s - 0.08, e + 0.08, top, top + 0.08, '#8b6b4e', t + 0.06);
        }
        cur = e;
      }
      piece(cur, hi, 0, WH);
      const mesh = b.mesh(vcMat({ roughness: 0.9 }));
      scene.add(mesh);
      home.walls.push(makeFader([mesh], {
        id: wd.id, axis, c: (axis === 'x' ? HZ : HX) + c, lo: (axis === 'x' ? HX : HZ) + lo, hi: (axis === 'x' ? HX : HZ) + hi,
      }));
    }

    // doors stay shut on a stage
    for (const dd of HOME.doors) {
      const along = dd.axis === 'x';
      const len = dd.w - 0.04, mat = new THREE.MeshStandardMaterial({ color: '#8a5b3a', flatShading: true, roughness: 0.8, transparent: true });
      const leaf = new THREE.Mesh(along ? new THREE.BoxGeometry(len, dd.h - 0.03, 0.06) : new THREE.BoxGeometry(0.06, dd.h - 0.03, len), mat);
      leaf.position.set(HX + dd.x, FY + (dd.h - 0.03) / 2, HZ + dd.z);
      leaf.castShadow = leaf.receiveShadow = true;
      scene.add(leaf);
      const wall = home.walls.find((w) => w.axis === dd.axis && Math.abs(w.c - (along ? HZ + dd.z : HX + dd.x)) < 0.05);
      if (wall) { wall.meshes.push(leaf); wall.mats.push(mat); }
    }

    const rb = new Batch().at(HX, 0, HZ);
    const rw = HOME.halfW * 2 + 0.5, rd = HOME.halfD * 2 + 0.5, roofH = 2.6;
    rb.box(rw + 0.24, 0.2, rd + 0.24, 0, WH - 0.04, 0, '#8d8378');
    rb.add(G.gable, homeCat.roof, 0, WH + 0.16 + roofH / 2, 0, rw + 0.9, roofH, rd + 0.9);
    rb.box(0.75, 2.6, 0.75, 2.4, WH + 0.6, -1.2, '#9a7f6e');
    const roof = rb.mesh(vcMat());
    scene.add(roof);
    home.roof = makeFader([roof]);

    const ROOM_COLORS = [
      [/base/i, '#efe6d6'], [/parquet1/i, '#b98257'], [/parquet2/i, '#9b6a45'], [/carpet/i, '#c96f5f'],
      [/sofa/i, '#4f7fb0'], [/chair/i, '#3a3d44'], [/little_table/i, '#7a4f33'], [/table/i, '#a8754d'], [/shelves/i, '#8a5a3c'],
      [/monitor|keyboard|mouse|vinyl_players/i, '#2c2f36'], [/vinyls/i, '#1e1e22'], [/flower/i, '#4f9a4f'], [/vial/i, '#9fd3e8'],
      [/clock|paper/i, '#f2efe8'], [/picture|photoframe/i, '#d8b26a'], [/box_/i, '#c9a06a'], [/pens|stand/i, '#e0b04a'], [/decoration/i, '#e07a5f'],
      [/magazines/i, ['#d9c7a3', '#c4d6e0', '#e8b4a0']], [/books/i, ['#d9534f', '#3f7fd9', '#f2b84b', '#2e9e7a', '#8e6cc9', '#e8e2d0']],
    ];
    const roomMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    const roomMeshes = [];
    roomModel.traverse((o) => {
      if (!o.isMesh) return;
      const entry = ROOM_COLORS.find(([re]) => re.test(o.name));
      const val = entry ? entry[1] : '#cfc8bb';
      _c1.set(Array.isArray(val) ? val[Math.floor(hash2(o.name.length, o.name.charCodeAt(o.name.length - 1)) * val.length)] : val);
      const n = o.geometry.attributes.position.count, arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) _c1.toArray(arr, i * 3);
      o.geometry.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      o.material = roomMat;
      o.castShadow = o.receiveShadow = true;
      roomMeshes.push(o);
    });
    roomModel.scale.setScalar(HOME.room.scale);
    roomModel.position.set(HX + HOME.room.x, 0, HZ + HOME.room.z);
    scene.add(roomModel);
    roomModel.updateMatrixWorld(true);
    home.roomFader = makeFader(roomMeshes);

    // the computer screen glows (brighter at night)
    const monitor = roomMeshes.find((o) => /monitor/i.test(o.name)), chair = roomMeshes.find((o) => /chair/i.test(o.name));
    if (monitor && chair) {
      const mb = new THREE.Box3().setFromObject(monitor), mc = mb.getCenter(new V3()), ms = mb.getSize(new V3());
      const cc = new THREE.Box3().setFromObject(chair).getCenter(new V3());
      const face = Math.sign(cc.z - mc.z) || -1;
      const screenMat = new THREE.MeshStandardMaterial({ color: '#0e1824', emissive: new THREE.Color('#7cc4ff'), emissiveIntensity: 0.3, roughness: 0.4, transparent: true });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(ms.x * 0.86, ms.y * 0.5), screenMat);
      screen.position.set(mc.x, mb.min.y + ms.y * 0.66, face < 0 ? mb.min.z - 0.006 : mb.max.z + 0.006);
      screen.rotation.y = face < 0 ? Math.PI : 0;
      scene.add(screen);
      home.roomFader.meshes.push(screen); home.roomFader.mats.push(screenMat);
      home.screenMat = screenMat;
      home.desk = mc.clone();
    }

    home.lights = [
      [new THREE.PointLight('#ffd9a0', 0, 9, 1.4), HX + HOME.room.x, 3.3, HZ + HOME.room.z, 12],
      [new THREE.PointLight('#ffd9a0', 0, 8, 1.4), HX, 3.1, HZ + 2.5, 7],
    ].map(([l, x, y, z, max]) => { l.position.set(x, y, z); scene.add(l); return { l, max }; });

    occMark(home.aabb.minX - 0.6, home.aabb.minZ - 0.6, home.aabb.maxX + 0.6, home.aabb.maxZ + 0.6);
  }

  // ───────────────────────────────────────────────────────── props, lamps, fences
  const SB = new Batch();
  const GB = new Batch();
  const glowMat = vcMat({ roughness: 0.5, emissive: new THREE.Color('#ffcf7a'), emissiveIntensity: 0 });
  const WOOD = '#9c6b45', WOOD_D = '#6e4a31', STONE = '#b9b4aa', METAL = '#4a4d55', WHITE = '#f3efe6';
  const treeQueue = [];
  const docks = [];
  let windmillBlades = null;
  function footBox(p, w, d) {
    const swap = Math.abs(Math.sin(p.rot || 0)) > 0.5, hw = (swap ? d : w) / 2, hd = (swap ? w : d) / 2;
    return [p.x - hw, p.z - hd, p.x + hw, p.z + hd];
  }
  function solidProp(p, w, d) { const [a, b, c, e] = footBox(p, w, d); occMark(a - 0.8, b - 0.8, c + 0.8, e + 0.8); }
  function ringProp(p, r) { occMark(p.x - r - 0.8, p.z - r - 0.8, p.x + r + 0.8, p.z + r + 0.8); }

  function buildProp(p) {
    const b = SB.at(p.x, 0, p.z, p.rot || 0);
    switch (p.type) {
      case 'fountain':
        b.add(G.cyl12, STONE, 0, 0.3, 0, 5.2, 0.6, 5.2);
        b.add(G.cyl12, '#6fbcdc', 0, 0.58, 0, 4.7, 0.06, 4.7);
        b.add(G.cyl8, STONE, 0, 1.1, 0, 0.6, 1.6, 0.6);
        b.add(G.cyl12, STONE, 0, 1.95, 0, 1.8, 0.3, 1.8);
        b.add(G.cone8, '#9fd8ee', 0, 2.35, 0, 0.35, 0.5, 0.35);
        ringProp(p, 2.75); break;
      case 'board':
        b.box(0.14, 2.3, 0.14, -0.95, 0, 0, WOOD_D).box(0.14, 2.3, 0.14, 0.95, 0, 0, WOOD_D);
        b.box(2.2, 1.3, 0.1, 0, 1.0, 0, WOOD);
        b.box(0.5, 0.6, 0.02, -0.55, 1.4, 0.06, WHITE).box(0.45, 0.45, 0.02, 0.1, 1.55, 0.06, '#fff3c4').box(0.5, 0.55, 0.02, 0.65, 1.2, 0.06, '#d9ecff');
        b.add(G.gable, '#7a5a3c', 0, 2.48, 0, 2.6, 0.36, 0.6);
        solidProp(p, 2.4, 0.4); break;
      case 'stall':
        b.box(3.0, 0.9, 1.4, 0, 0, 0, WOOD);
        for (const [sx, sz] of [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]]) b.add(G.cyl6, WOOD_D, sx, 1.2, sz, 0.1, 2.4, 0.1);
        b.add(G.gable, p.color, 0, 2.65, 0, 3.4, 0.5, 2.0);
        for (let i = 0; i < 7; i++) b.add(G.ico, ['#e85d5d', '#f2b84b', '#7dbb4f', '#e8e2d0'][i % 4], -1.2 + i * 0.4, 1.02, rr(-0.3, 0.3), 0.26, 0.24, 0.26);
        solidProp(p, 3.0, 1.5); break;
      case 'bench':
        b.box(1.8, 0.08, 0.5, 0, 0.42, 0, WOOD).box(1.8, 0.45, 0.08, 0, 0.55, -0.22, WOOD);
        for (const sx of [-0.75, 0.75]) b.box(0.08, 0.42, 0.45, sx, 0, 0, METAL);
        solidProp(p, 1.8, 0.55); break;
      case 'planter':
        b.box(2.2, 0.55, 2.2, 0, 0, 0, [STONE, '#6b4f36']);
        treeQueue.push(['Tree_1_A', p.x, p.z, 0.85, 0.55]);
        solidProp(p, 2.2, 2.2); break;
      case 'flagpole':
        b.add(G.cyl6, '#d8d8d8', 0, 3.75, 0, 0.14, 7.5, 0.14);
        b.box(1.5, 0.95, 0.04, 0.78, 6.4, 0, p.color);
        ringProp(p, 0.2); break;
      case 'mailbox':
        b.box(0.12, 1.0, 0.12, 0, 0, 0, WOOD_D).box(0.34, 0.32, 0.55, 0, 1.0, 0, '#d9534f').box(0.04, 0.26, 0.08, 0.19, 1.15, -0.1, '#ffd166');
        ringProp(p, 0.28); break;
      case 'crates':
        b.box(0.9, 0.9, 0.9, -0.45, 0, 0, '#b08a5a').box(0.8, 0.8, 0.8, 0.5, 0, 0.1, '#a67f50', 0.3).box(0.7, 0.7, 0.7, -0.4, 0.9, 0.05, '#b8925f', -0.2);
        solidProp(p, 2.0, 1.1); break;
      case 'barrels':
        for (const [sx, sz] of [[-0.45, 0], [0.45, 0.1], [0, -0.6]]) {
          b.add(G.cyl12, '#8a5a3c', sx, 0.5, sz, 0.8, 1.0, 0.8);
          b.add(G.cyl12, METAL, sx, 0.25, sz, 0.84, 0.06, 0.84).add(G.cyl12, METAL, sx, 0.78, sz, 0.84, 0.06, 0.84);
        }
        ringProp(p, 1.0); break;
      case 'cart':
        b.box(2.0, 0.45, 1.1, 0, 0.55, 0, WOOD);
        for (const [sx, sz] of [[-0.55, 0.62], [0.55, 0.62], [-0.55, -0.62], [0.55, -0.62]]) b.add(G.cyl12, WOOD_D, sx, 0.45, sz, 0.9, 0.1, 0.9, Math.PI / 2, 0, 0);
        b.box(0.9, 0.08, 0.08, 1.4, 0.75, 0.35, WOOD_D).box(0.9, 0.08, 0.08, 1.4, 0.75, -0.35, WOOD_D);
        for (let i = 0; i < 5; i++) b.add(G.ico, '#d9a35b', -0.7 + i * 0.35, 1.1, rr(-0.25, 0.25), 0.4, 0.22, 0.24);
        solidProp(p, 2.6, 1.4); break;
      case 'pots':
        for (let i = 0; i < 4; i++) {
          b.add(G.cyl8, '#c9724b', -0.9 + i * 0.6, 0.22, 0, 0.5, 0.45, 0.5);
          b.add(G.ico, ['#ef8fb5', '#ffd84d', '#c7a6ff', '#ff7a59'][i], -0.9 + i * 0.6, 0.62, 0, 0.5, 0.45, 0.5);
        }
        solidProp(p, 2.3, 0.6); break;
      case 'forge':
        b.box(2.2, 1.0, 2.0, 0, 0, 0, '#8f8a82').box(1.6, 0.06, 1.4, 0, 1.0, 0, '#ff7a2e');
        for (const [sx, sz] of [[-0.95, -0.85], [0.95, -0.85], [-0.95, 0.85], [0.95, 0.85]]) b.box(0.12, 1.6, 0.12, sx, 1.0, sz, METAL);
        b.add(G.pyramid, METAL, 0, 3.1, 0, 2.2, 1.0, 2.0);
        b.box(0.5, 1.6, 0.5, 0, 3.4, 0, METAL);
        solidProp(p, 2.2, 2.0); break;
      case 'anvil':
        b.box(0.5, 0.6, 0.5, 0, 0, 0, WOOD_D).box(0.9, 0.25, 0.35, 0, 0.6, 0, METAL);
        ringProp(p, 0.5); break;
      case 'field': {
        for (let z = -p.d / 2 + 0.6; z < p.d / 2 - 0.3; z += 1.2) {
          b.box(p.w - 0.8, 0.16, 0.55, 0, 0, z, '#6f523a');
          for (let x = -p.w / 2 + 0.8; x < p.w / 2 - 0.6; x += 0.85) b.add(G.cone6, pick(['#7dbb4f', '#6aa944', '#8cc65a']), x + rr(-0.1, 0.1), 0.45, z, 0.45, rr(0.45, 0.7), 0.45);
        }
        occMark(p.x - p.w / 2, p.z - p.d / 2, p.x + p.w / 2, p.z + p.d / 2); break;
      }
      case 'scarecrow':
        b.box(0.12, 2.2, 0.12, 0, 0, 0, WOOD_D).box(1.6, 0.1, 0.1, 0, 1.6, 0, WOOD_D).box(0.6, 0.7, 0.3, 0, 1.15, 0, '#5b8fd1');
        b.add(G.ico, '#e3c56b', 0, 2.1, 0, 0.45, 0.45, 0.45).add(G.cone8, '#9c7a55', 0, 2.5, 0, 0.7, 0.45, 0.7);
        ringProp(p, 0.35); break;
      case 'windmill': {
        b.add(new THREE.CylinderGeometry(2.0, 2.8, 9, 8), '#e9e1d2', 0, 4.5, 0);
        b.add(G.cone8, '#b45f48', 0, 10.4, 0, 4.8, 2.8, 4.8);
        b.box(1.1, 2.0, 0.2, 0, 0, 2.65, '#7b5537');
        const bl = new Batch();
        bl.add(G.cyl8, WOOD_D, 0, 0, 0, 0.5, 0.6, 0.5, Math.PI / 2, 0, 0);
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2;
          bl.add(G.box, '#f1ebdd', Math.sin(a) * 2.6, Math.cos(a) * 2.6, 0.3, 0.9, 4.4, 0.06, 0, 0, -a);
          bl.add(G.box, WOOD_D, Math.sin(a) * 2.4, Math.cos(a) * 2.4, 0.25, 0.12, 4.8, 0.1, 0, 0, -a);
        }
        windmillBlades = bl.mesh();
        windmillBlades.position.set(p.x, 8.2, p.z + 2.6);
        scene.add(windmillBlades);
        ringProp(p, 2.9); break;
      }
      case 'hay':
        for (const [sx, sz] of [[-0.8, 0], [0.8, 0.2], [0, 1.4]]) b.add(G.cyl12, '#e3c56b', sx, 0.7, sz, 1.4, 1.3, 1.4, 0, 0, Math.PI / 2);
        ringProp(p, 1.8); break;
      case 'hives':
        for (const sx of [-1.2, 0, 1.2]) b.box(0.7, 0.8, 0.6, sx, 0, 0, '#f2d16b').box(0.86, 0.1, 0.76, sx, 0.8, 0, WHITE);
        solidProp(p, 3.2, 0.8); break;
      case 'dock':
        b.box(p.w, 0.12, p.d, 0, 0.3, 0, [WOOD, '#b0835a']);
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(G.cyl6, WOOD_D, sx * (p.w / 2 - 0.1), -0.3, sz * (p.d / 2 - 0.15), 0.18, 1.3, 0.18);
        docks.push([p.x - p.w / 2, p.z - p.d / 2, p.x + p.w / 2, p.z + p.d / 2]);
        occMark(p.x - p.w / 2 - 0.5, p.z - p.d / 2 - 0.5, p.x + p.w / 2 + 0.5, p.z + p.d / 2 + 0.5); break;
      case 'gazebo':
        b.add(G.cyl8, WHITE, 0, 0.06, 0, 6.2, 0.12, 6.2);
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
          b.add(G.cyl6, WHITE, Math.cos(a) * 2.8, 1.45, Math.sin(a) * 2.8, 0.2, 2.8, 0.2);
        }
        b.add(G.cone8, '#b45f48', 0, 4.0, 0, 7.4, 2.4, 7.4);
        occMark(p.x - 4, p.z - 4, p.x + 4, p.z + 4); break;
      case 'playground':
        b.box(1.3, 0.1, 1.3, -2, 1.5, 0, '#e86b5a');
        for (const [sx, sz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) b.box(0.1, 1.5, 0.1, -2 + sx, 0, sz, METAL);
        b.add(G.box, '#f2b84b', -2, 0.8, 1.75, 0.8, 0.06, 2.4, -0.68, 0, 0);
        for (const sz of [-0.9, 0.9]) {
          b.add(G.box, '#3f7fd9', 1.6, 1.1, sz, 0.1, 2.4, 0.1, 0, 0, 0.32).add(G.box, '#3f7fd9', 3.2, 1.1, sz, 0.1, 2.4, 0.1, 0, 0, -0.32);
        }
        b.add(G.cyl6, '#3f7fd9', 2.4, 2.2, 0, 0.1, 2.0, 0.1, Math.PI / 2, 0, 0);
        for (const sz of [-0.45, 0.45]) b.box(0.03, 1.5, 0.03, 2.4, 0.6, sz, METAL).box(0.5, 0.06, 0.3, 2.4, 0.56, sz, WOOD_D);
        occMark(p.x - 3.5, p.z - 2.5, p.x + 4.5, p.z + 3.5); break;
      case 'rails':
        b.box(150, 0.1, 0.1, 0, 0.1, -0.55, METAL).box(150, 0.1, 0.1, 0, 0.1, 0.55, METAL);
        for (let x = -74; x <= 74; x += 1.1) b.box(0.25, 0.1, 1.7, x, 0, 0, WOOD_D);
        break;
      case 'signpost':
        b.box(0.14, 2.4, 0.14, 0, 0, 0, WOOD_D).box(1.6, 0.34, 0.08, 0.6, 1.85, 0, '#c9a06a').box(1.4, 0.3, 0.08, -0.5, 1.4, 0, '#c9a06a');
        ringProp(p, 0.22); break;
    }
  }
  PROPS.forEach(buildProp);

  for (const [x, z] of LAMPS) {
    SB.at(x, 0, z).add(G.cyl6, '#3d3f45', 0, 1.7, 0, 0.14, 3.4, 0.14).add(G.pyramid, '#3d3f45', 0, 3.95, 0, 0.6, 0.3, 0.6);
    GB.at(x, 0, z).box(0.4, 0.5, 0.4, 0, 3.3, 0, '#fff1c9');
    occMark(x - 0.6, z - 0.6, x + 0.6, z + 0.6);
  }
  for (const [x1, z1, x2, z2] of FENCES) {
    const len = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(len / 1.8)), alongX = z1 === z2;
    const col = '#efe9de';
    for (let i = 0; i <= n; i++) SB.at().box(0.12, 1.0, 0.12, lerp(x1, x2, i / n), 0, lerp(z1, z2, i / n), col);
    for (const y of [0.45, 0.8]) SB.at().add(G.box, col, (x1 + x2) / 2, y, (z1 + z2) / 2, alongX ? len : 0.05, 0.09, alongX ? 0.05 : len);
  }
  scene.add(SB.mesh(), GB.mesh(glowMat));
  const lampLights = Array.from({ length: 4 }, () => { const l = new THREE.PointLight('#ffcf8a', 0, 18, 1.6); scene.add(l); return l; });

  // ───────────────────────────────────────────────────────── nature (KayKit, instanced)
  const uTime = { value: 0 };
  function makeMat(tex, sway) {
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0 });
    if (sway > 0) {
      const uSway = { value: sway };
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = uTime;
        sh.uniforms.uSway = uSway;
        sh.vertexShader = 'uniform float uTime;\nuniform float uSway;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
          #else
            vec2 ip = vec2(0.0);
          #endif
          float ph = dot(ip, vec2(0.37, 0.23));
          float hh = max(position.y, 0.0);
          float bend = uSway * hh * hh;
          transformed.x += (sin(uTime * 1.4 + ph) + 0.35 * sin(uTime * 3.3 + ph * 1.7)) * bend;
          transformed.z += cos(uTime * 1.1 + ph * 1.3) * bend * 0.6;`);
      };
    }
    return m;
  }
  const MAT = { tree: makeMat(atlas, 0.0017), bush: makeMat(atlas, 0.012), grass: makeMat(atlas, 0.09), rock: makeMat(atlas, 0) };
  MAT.grass.side = THREE.DoubleSide;
  MAT.rock.color.setRGB(1.3, 1.3, 1.27);
  const matFor = (n) => (n.startsWith('Tree') ? MAT.tree : n.startsWith('Bush') ? MAT.bush : n.startsWith('Grass') ? MAT.grass : MAT.rock);

  const placements = new Map();
  const treeGrid = new Grid(4);
  function addInstance(name, x, z, s = 1, _colR = 0, ry = rand() * Math.PI * 2) {
    const key = outsideDist(x, z) > 14 ? name + '|far' : name;
    if (!placements.has(key)) placements.set(key, []);
    placements.get(key).push({ x, y: heightAt(x, z) - 0.04 * s, z, ry, s });
  }
  function treeSpot(x, z, r) { return treeGrid.query(x, z, r + 3, (o) => Math.hypot(o.x - x, o.z - z) >= r + o.r); }
  function addTree(name, x, z, s, colR = 0.35) {
    addInstance(name, x, z, s, colR);
    const o = { x, z, r: 1.4 * s }; treeGrid.insert(o, x, z, x, z);
    occMark(x - 1, z - 1, x + 1, z + 1);
  }
  const LEAFY = ['Tree_1_A', 'Tree_1_B', 'Tree_1_C', 'Tree_3_A', 'Tree_3_B', 'Tree_2_A', 'Tree_2_B'];
  const PINES = ['Tree_4_A', 'Tree_4_B', 'Tree_4_C', 'Tree_2_C'];
  const HILL_LEAFY = ['Tree_1_A', 'Tree_1_B', 'Tree_2_A', 'Tree_2_B', 'Tree_3_A'];
  const HILL_PINES = ['Tree_4_A', 'Tree_4_B', 'Tree_2_C'];

  for (const [name, x, z, s, sink] of treeQueue) { addInstance(name, x, z, s, 0); placements.get(name).at(-1).y += sink; }
  for (let ix = 0; ix < 5; ix++) for (let iz = 0; iz < 5; iz++) addTree(pick(['Tree_1_A', 'Tree_1_B', 'Tree_3_A']), 16 + ix * 6 + rr(-0.4, 0.4), -44 + iz * 5 + rr(-0.4, 0.4), rr(0.75, 0.92));
  for (let i = 0, n = 0; i < 300 && n < 16; i++) {
    const a = rand() * Math.PI * 2, r = rr(12.5, 20), x = POND.x + Math.cos(a) * r, z = POND.z + Math.sin(a) * r;
    if (x < 8 || x > 56 || z < 19 || z > 52 || !occFree(x, z, 1.5) || !treeSpot(x, z, 1.6)) continue;
    addTree(pick(['Tree_1_B', 'Tree_1_C', 'Tree_3_B', 'Tree_3_C']), x, z, rr(0.75, 1.0)); n++;
  }
  for (let i = 0, n = 0; i < 4000 && n < 60; i++) {
    const x = rr(B.minX + 2, B.maxX - 2), z = rr(B.minZ + 2, B.maxZ - 2);
    if (!occFree(x, z, 3) || !treeSpot(x, z, 2.4)) continue;
    addTree(pick(LEAFY), x, z, rr(0.7, 1.0)); n++;
  }
  for (let i = 0, n = 0; i < 14000 && n < 620; i++) {
    const x = rr(-WORLD / 2 + 4, WORLD / 2 - 4), z = rr(-WORLD / 2 + 4, WORLD / 2 - 4), o = outsideDist(x, z);
    if (o < 1.5) continue;
    const dens = smooth(1.5, 9, o) * (0.45 + 0.55 * (fbm(x * 0.05, z * 0.05) * 0.5 + 0.5)) * (o > 70 ? 0.5 : 1);
    if (rand() > dens) continue;
    const s = rr(0.8, 1.25);
    if (!treeSpot(x, z, 1.5 * s)) continue;
    const pine = rand() < (z < -40 ? 0.75 : 0.3) + smooth(10, 40, o) * 0.25;
    addTree(pick(o > 14 ? (pine ? HILL_PINES : HILL_LEAFY) : pine ? PINES : LEAFY), x, z, s, 0); n++;
  }
  for (const bd of [...BUILDINGS, { x: HX, z: HZ, w: HOME.halfW * 2, d: HOME.halfD * 2, facing: 'S' }]) {
    const ry = FACING_RY[bd.facing];
    for (const sx of [-1, 1]) {
      const [x, z] = toWorld(bd.x, bd.z, ry, sx * (bd.w / 2 - 0.6), bd.d / 2 + 0.85);
      if (Math.abs(sx * (bd.w / 2 - 0.6)) > 1.9) addInstance(pick(['Bush_1_B', 'Bush_1_C', 'Bush_2_B']), x, z, rr(0.8, 1.0), 0);
    }
  }
  for (let i = 0, n = 0; i < 5000 && n < 170; i++) {
    const x = rr(B.minX, B.maxX + 12), z = rr(B.minZ, B.maxZ + 12);
    if (!occFree(x, z, 1.2)) continue;
    addInstance(pick(['Bush_1_B', 'Bush_1_C', 'Bush_1_D', 'Bush_2_A', 'Bush_2_C', 'Bush_3_A', 'Bush_3_B', 'Bush_4_A', 'Bush_4_B']), x, z, rr(0.7, 1.1), 0); n++;
    occMark(x - 0.6, z - 0.6, x + 0.6, z + 0.6);
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + rr(-0.15, 0.15), r = POND.r + rr(0.1, 0.9), x = POND.x + Math.cos(a) * r, z = POND.z + Math.sin(a) * r;
    if (docks.some(([a0, b0, c0, d0]) => x > a0 - 1 && x < c0 + 1 && z > b0 - 1 && z < d0 + 1)) continue;
    addInstance(pick(['Rock_1_A', 'Rock_1_B', 'Rock_1_C', 'Rock_3_A', 'Rock_3_B']), x, z, rr(0.7, 1.1), 0);
  }
  for (let i = 0, n = 0; i < 3000 && n < 70; i++) {
    const x = rr(-WORLD / 2, WORLD / 2), z = rr(-WORLD / 2, WORLD / 2);
    if (outsideDist(x, z) < 3) continue;
    addInstance(pick(['Rock_1_D', 'Rock_1_E', 'Rock_2_A', 'Rock_2_B', 'Rock_2_C', 'Rock_3_C', 'Rock_3_D']), x, z, rr(0.8, 1.6), 0); n++;
  }
  for (let i = 0, n = 0; i < 16000 && n < (small ? 1200 : 2000); i++) {
    const x = rr(B.minX - 25, B.maxX + 25), z = rr(B.minZ - 25, B.maxZ + 25);
    if (!occFree(x, z, 0.4) && !(pondDist(x, z) > POND.r - 0.2 && pondDist(x, z) < POND.r + 0.9)) continue;
    if (inField(x, z) || pondDist(x, z) < POND.r - 0.2) continue;
    if (rand() > 0.35 + 0.4 * (fbm(x * 0.15, z * 0.15) > 0 ? 1 : 0)) continue;
    const reeds = pondDist(x, z) < POND.r + 1.4;
    addInstance(reeds ? pick(['Grass_2_A', 'Grass_2_B', 'Grass_2_C']) : pick(['Grass_1_A', 'Grass_1_B', 'Grass_1_C', 'Grass_1_D']), x, z, rr(0.75, 1.05), 0); n++;
  }
  const nature = new THREE.Group();
  scene.add(nature);
  for (const [key, list] of placements) {
    const [name, far] = key.split('|');
    const im = new THREE.InstancedMesh(GEO[name], matFor(name), list.length);
    list.forEach((o, i) => im.setMatrixAt(i, _mA.compose(_p.set(o.x, o.y, o.z), _q.setFromEuler(_e.set(0, o.ry, 0)), _s.setScalar(o.s))));
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = !far && !name.startsWith('Grass');
    im.receiveShadow = true;
    im.computeBoundingSphere();
    nature.add(im);
  }

  // ───────────────────────────────────────────────────────── camera shots
  // focus = the point the shot is about; az = which side the camera sits on (0 = south / +z, π/2 = east);
  // el = how high it looks down (radians); frameW/frameH = metres that must fit in the free part of the screen.
  const bld = (id) => BUILDINGS.find((b) => b.id === id);
  function front(id, { turn = 0.3, el = 0.46, pad = 1, out = 1.5 } = {}) {
    const b = bld(id), ry = FACING_RY[b.facing];
    const [fx, fz] = toWorld(b.x, b.z, ry, 0, b.d / 2 + out);
    return { focus: [fx, b.h * 0.45 + (b.tower ? 2.5 : 0), fz], az: ry + turn, el, frameW: b.w + pad, frameH: b.h * 1.5 + (b.tower ? 11 : 2) };
  }
  const SHOTS = {
    overview: { focus: [-2, 0, 4], az: -0.48, el: 0.68, frameW: 125, frameH: 70, orbit: 0.03 },
    sky: { focus: [-2, 4, 4], az: 2.3, el: 0.9, frameW: 140, frameH: 80, orbit: 0.045 },
    home_room: { focus: [HX + HOME.room.x + 0.4, 0.9, HZ + HOME.room.z + 0.4], az: 0.62, el: 0.85, frameW: 6.5, frameH: 5, interior: true },
    home_front: { focus: [HX, 2.0, HZ + HOME.halfD + 2], az: 0.3, el: 0.42, frameW: 15, frameH: 9 },
    square: { focus: [0, 1.8, -1], az: 0.4, el: 0.42, frameW: 24, frameH: 14 },
    office: front('BLD_GeneralStore'),
    post_office: front('BLD_PostOffice'),
    bakery: front('BLD_Bakery', { turn: -0.3 }),
    inn: front('BLD_Inn'),
    town_hall: front('BLD_TownHall', { pad: 6, el: 0.36, out: 6 }),
    moms_house: front('BLD_House02', { turn: -0.3 }),
    park: { focus: [32, 0.6, 35], az: 0.75, el: 0.42, frameW: 26, frameH: 14 },
  };

  // where on screen the town is actually visible (set by game.js); the shot is framed inside this rect
  const focusRect = { x: 0, y: 0, w: innerWidth, h: innerHeight };
  const viewOff = { x: 0, y: 0, tx: 0, ty: 0 };
  const focalPx = () => (innerHeight / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  function fitDist(s) {
    const f = focalPx(), w = Math.max(140, focusRect.w * 0.92), h = Math.max(120, focusRect.h * 0.9);
    return Math.max((s.frameW * f) / w, (s.frameH * f) / h, 3);
  }
  const rig = { name: null, focus: new V3(-2, 0, 4), az: -0.48, el: 0.68, dist: 150, interior: false, orbit: 0.03, swayT: 0 };
  let flight = null;
  const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

  // time of day: minutes since day 0, 00:00. Moving forward animates the sky; going back jumps.
  const clock = { abs: 18.5 * 60, anim: null };
  function setTime(day, hour, dur) {
    const target = day * 1440 + hour * 60;
    if (!(dur > 0) || target <= clock.abs) { clock.abs = target; clock.anim = null; return; }
    let from = clock.abs;
    if (target - from > 2 * 1440) from = target - ((target - from) % 1440 || 1440);
    clock.anim = { from, to: target, t: 0, dur };
  }

  function goTo(st, opts = {}) {
    if (!st) return;
    let dur = 0;
    if (st.shot) {
      const s = SHOTS[st.shot] || SHOTS.overview;
      const to = { focus: new V3(...s.focus), az: s.az, el: s.el, dist: fitDist(s), interior: !!s.interior, orbit: s.orbit || 0 };
      if (opts.instant || !rig.name) {
        Object.assign(rig, to, { focus: to.focus.clone() });
        flight = null;
      } else if (st.shot !== rig.name || flight) {
        const from = { focus: rig.focus.clone(), az: rig.az, el: rig.el, dist: rig.dist, interior: rig.interior };
        const travel = from.focus.distanceTo(to.focus);
        dur = clamp(1.2 + travel / 70, 1.2, 2.4);
        flight = { t: 0, dur, from, to, arc: clamp(travel / 45, 0, 1) };
      }
      rig.name = st.shot;
    }
    if (st.day != null && st.hour != null) setTime(st.day, st.hour, opts.instant ? 0 : Math.max(dur, 1.4));
  }

  function setFocus(r) {
    if (!r || !(r.w > 0) || !(r.h > 0)) return;
    Object.assign(focusRect, r);
    viewOff.tx = innerWidth / 2 - (r.x + r.w / 2);
    viewOff.ty = innerHeight / 2 - (r.y + r.h * 0.5);
    const s = SHOTS[rig.name];
    if (s && flight) flight.to.dist = fitDist(s);
  }

  const _dir = new V3();
  function updateCamera(dt, t) {
    if (flight) {
      flight.t = Math.min(1, flight.t + dt / flight.dur);
      const k = ease(flight.t), { from, to } = flight, bump = Math.sin(Math.PI * k) * flight.arc;
      rig.focus.lerpVectors(from.focus, to.focus, k);
      rig.az = from.az + angDiff(from.az, to.az) * k;
      rig.el = Math.min(1.35, lerp(from.el, to.el, k) + bump * 0.35);
      rig.dist = Math.exp(lerp(Math.log(from.dist), Math.log(to.dist), k)) * (1 + bump * 1.3);
      rig.interior = k > 0.55 ? to.interior : from.interior;
      rig.orbit = to.orbit;
      if (flight.t >= 1) flight = null;
    } else {
      rig.az += rig.orbit * dt;
      const s = SHOTS[rig.name];
      if (s) rig.dist = lerp(rig.dist, fitDist(s), 1 - Math.exp(-dt * 3));
    }
    const kv = FAST ? 1 : 1 - Math.exp(-dt * 5);
    viewOff.x = lerp(viewOff.x, viewOff.tx, kv);
    viewOff.y = lerp(viewOff.y, viewOff.ty, kv);
    camera.setViewOffset(innerWidth, innerHeight, viewOff.x, viewOff.y, innerWidth, innerHeight);

    const sway = rig.orbit ? 0 : 1;
    const az = rig.az + Math.sin(t * 0.21) * 0.035 * sway, el = rig.el + Math.sin(t * 0.17) * 0.012 * sway;
    _dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    camera.position.copy(rig.focus).addScaledVector(_dir, rig.dist);
    const minY = heightAt(camera.position.x, camera.position.z) + 1.2;
    if (camera.position.y < minY) camera.position.y = minY;
    camera.lookAt(rig.focus);

    const half = clamp(rig.dist * 0.9, 16, 90), c = rig.focus, sc = sun.shadow.camera;
    sun.target.position.set(Math.round(c.x), 0, Math.round(c.z));
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 160);
    if (sc.right !== half) { sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.updateProjectionMatrix(); }
    scene.fog.near = rig.dist + 40;
    scene.fog.far = rig.dist + 230;
    sky.position.copy(camera.position);
  }

  // ───────────────────────────────────────────────────────── day / night lighting (same keys as the town mockup)
  const LIGHT_PRESETS = {
    night: { top: '#0b1430', horizon: '#26305e', bottom: '#141a30', sun: '#9fb2ff', sunI: 0.45, hemiSky: '#4a5896', hemiGround: '#1d2033', hemiI: 0.55, night: 1, exposure: 1.15 },
    dawn: { top: '#4d6fae', horizon: '#ffb48a', bottom: '#cdb3a6', sun: '#ffb07a', sunI: 1.3, hemiSky: '#c4c9ee', hemiGround: '#59643f', hemiI: 0.8, night: 0.35, exposure: 1.05 },
    morning: { top: '#6fa9e6', horizon: '#ffe1c2', bottom: '#efe4d6', sun: '#ffe0b5', sunI: 2.4, hemiSky: '#e0ebff', hemiGround: '#788a56', hemiI: 1.1, night: 0, exposure: 1.0 },
    noon: { top: '#3d97e3', horizon: '#cde7f4', bottom: '#e6efe9', sun: '#fff3df', sunI: 2.7, hemiSky: '#d4e9ff', hemiGround: '#6b8a4a', hemiI: 1.15, night: 0, exposure: 1.0 },
    afternoon: { top: '#4a98e0', horizon: '#d9e9f0', bottom: '#e9eee6', sun: '#fff0d6', sunI: 2.6, hemiSky: '#d4e9ff', hemiGround: '#6b8a4a', hemiI: 1.12, night: 0, exposure: 1.0 },
    golden: { top: '#6487c4', horizon: '#ffc08a', bottom: '#f3d3ae', sun: '#ffa65a', sunI: 2.6, hemiSky: '#ffd2a6', hemiGround: '#5d6638', hemiI: 1.0, night: 0.25, exposure: 1.0 },
    dusk: { top: '#28305f', horizon: '#b8708a', bottom: '#3a3350', sun: '#c0a0ff', sunI: 0.7, hemiSky: '#6b6aa6', hemiGround: '#2a2638', hemiI: 0.7, night: 0.8, exposure: 1.1 },
  };
  const COLOR_KEYS = ['top', 'horizon', 'bottom', 'sun', 'hemiSky', 'hemiGround'], NUM_KEYS = ['sunI', 'hemiI', 'night', 'exposure'];
  const LIGHT_KEYS = [[0, 'night'], [4.5, 'night'], [6, 'dawn'], [8, 'morning'], [12, 'noon'], [16, 'afternoon'], [18.5, 'golden'], [20, 'dusk'], [21.5, 'night'], [24, 'night']]
    .map(([h, name]) => {
      const p = LIGHT_PRESETS[name], k = { h };
      COLOR_KEYS.forEach((c) => { k[c] = new THREE.Color(p[c]); });
      NUM_KEYS.forEach((n) => { k[n] = p[n]; });
      return k;
    });
  const L = { top: new THREE.Color(), horizon: new THREE.Color(), bottom: new THREE.Color(), sun: new THREE.Color(), hemiSky: new THREE.Color(), hemiGround: new THREE.Color() };
  const _sv = new V3(), _mv = new V3();
  function sunVec(h, out) {
    const p = clamp((h - 6) / 13.5, 0, 1), e = Math.max(0.14, Math.sin(Math.PI * p)), a = Math.PI * p;
    return out.set(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e) * 0.85 + 0.25).normalize();
  }
  function moonVec(h, out) {
    const p = clamp(((h - 19.5 + 24) % 24) / 10.5, 0, 1), e = Math.max(0.25, Math.sin(Math.PI * p) * 0.8), a = Math.PI * p;
    return out.set(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e) * 0.85 + 0.25).normalize();
  }
  function updateTime(dt) {
    const a = clock.anim;
    if (!a) return;
    a.t = Math.min(1, a.t + dt / a.dur);
    clock.abs = lerp(a.from, a.to, ease(a.t));
    if (a.t >= 1) clock.anim = null;
  }
  function updateLighting() {
    const h = (((clock.abs % 1440) + 1440) % 1440) / 60;
    let i = 0; while (i < LIGHT_KEYS.length - 2 && LIGHT_KEYS[i + 1].h <= h) i++;
    const a = LIGHT_KEYS[i], b = LIGHT_KEYS[i + 1], t = smooth(a.h, b.h, h);
    COLOR_KEYS.forEach((c) => L[c].copy(a[c]).lerp(b[c], t));
    NUM_KEYS.forEach((n) => { L[n] = lerp(a[n], b[n], t); });
    skyMat.uniforms.top.value.copy(L.top);
    skyMat.uniforms.horizon.value.copy(L.horizon);
    skyMat.uniforms.bottom.value.copy(L.bottom);
    scene.fog.color.copy(L.horizon);
    hemi.color.copy(L.hemiSky); hemi.groundColor.copy(L.hemiGround); hemi.intensity = L.hemiI;
    sun.color.copy(L.sun); sun.intensity = L.sunI;
    const moonW = Math.max(smooth(19.2, 20.6, h), 1 - smooth(4.8, 6.2, h));
    sunDir.copy(sunVec(h, _sv)).lerp(moonVec(h, _mv), moonW).normalize();
    renderer.toneMappingExposure = L.exposure;
    stars.material.opacity = smooth(0.4, 0.95, L.night);
    stars.visible = stars.material.opacity > 0.01;
    stars.position.copy(camera.position);
    glowMat.emissiveIntensity = L.night * 2.6;
    for (const m of windowMats) m.emissiveIntensity = L.night * 0.9;
    for (const l of lampLights) l.intensity = L.night * 22;
    for (const { l, max } of home.lights) l.intensity = smooth(0.2, 0.8, L.night) * max;
    if (home.screenMat) home.screenMat.emissiveIntensity = 0.45 + L.night * 0.6;
  }
  let lampTimer = 0;
  function updateLampLights(dt) {
    if ((lampTimer -= dt) > 0) return;
    lampTimer = 0.4;
    const c = rig.focus;
    const near = LAMPS.map(([x, z]) => [x, z, (x - c.x) ** 2 + (z - c.z) ** 2]).sort((p, q) => p[2] - q[2]);
    lampLights.forEach((l, i) => l.position.set(near[i][0], 3.3, near[i][1]));
  }

  // ───────────────────────────────────────────────────────── see-through for whatever blocks the shot
  function segHitsBox(a, b, box) {
    let t0 = 0, t1 = 1;
    for (const [o, d, lo, hi] of [[a.x, b.x - a.x, box.minX, box.maxX], [a.y, b.y - a.y, 0, box.maxY], [a.z, b.z - a.z, box.minZ, box.maxZ]]) {
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return false; continue; }
      let ta = (lo - o) / d, tb = (hi - o) / d;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      if (t0 > t1) return false;
    }
    return true;
  }
  function wallCut(w, p) {
    const along = w.axis === 'x';
    const sp = (along ? p.z : p.x) - w.c, sc = (along ? camera.position.z : camera.position.x) - w.c;
    if (sp * sc >= 0) return false;
    const t = sp / (sp - sc);
    const hit = along ? p.x + (camera.position.x - p.x) * t : p.z + (camera.position.z - p.z) * t;
    return hit > w.lo - 2 && hit < w.hi + 2;
  }
  function updateFades(dt) {
    const f = rig.focus, inside = rig.interior;
    for (const b of buildings) b.fader.target = segHitsBox(camera.position, f, b.aabb) ? 0.08 : 1;
    const ghost = !inside && segHitsBox(camera.position, f, home.aabb);
    for (const w of home.walls) w.target = inside ? (wallCut(w, f) ? 0.06 : 1) : ghost ? 0.08 : 1;
    home.roof.target = inside ? 0 : ghost ? 0.08 : 1;
    home.roomFader.target = ghost ? 0.08 : 1;
    updateFaders(dt);
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // ───────────────────────────────────────────────────────── go
  const FAST = /[?&]fast=1/.test(location.search);
  goTo({ shot: 'overview', day: 0, hour: 18.5 }, { instant: true });
  updateCamera(0, 0);
  updateLighting();
  updateLampLights(1);
  updateFades(10);
  await renderer.compileAsync(scene, camera);

  const timer = new THREE.Clock();
  let first = true;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(timer.getDelta(), 0.05), t = timer.elapsedTime;
    updateTime(FAST ? 99 : dt);
    updateCamera(FAST && flight ? 99 : dt, t);
    updateLighting();
    updateLampLights(dt);
    updateFades(FAST ? 10 : dt);
    uTime.value = t;
    animateWater(t);
    if (windmillBlades) windmillBlades.rotation.z -= dt * 0.5;
    renderer.render(scene, camera);
    if (first) { first = false; canvas.classList.add('is-ready'); }
  });

  Object.assign(API, {
    ready: true,
    goTo,
    setFocus,
    current: () => rig.name,
    shots: Object.keys(SHOTS),
    debug: { scene, camera, renderer, rig, clock, SHOTS, step: (s) => { for (let i = 0; i < s * 60; i++) { updateTime(1 / 60); updateCamera(1 / 60, i / 60); updateFades(1 / 60); } updateLighting(); renderer.render(scene, camera); } },
  });
  emit('progress', 1);
  emit('ready');
}
