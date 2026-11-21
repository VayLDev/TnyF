import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

type Cleanup = () => void;

export function mountGame(root: HTMLElement): Cleanup {
  root.innerHTML = '';

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch {
    root.innerHTML = '<div class="tf-error">Your browser could not start WebGL. Please enable hardware acceleration and reload.</div>';
    return () => { root.innerHTML = ''; };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(root.clientWidth || window.innerWidth, root.clientHeight || window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  root.appendChild(renderer.domElement);
  renderer.domElement.className = 'tf-canvas';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9bcbd4);
  scene.fog = new THREE.Fog(0x9bcbd4, 45, 145);

  const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 220);
  camera.position.set(0, 2.1, 12);

  const controls = new PointerLockControls(camera, renderer.domElement);
  controls.pointerSpeed = 0.7;

  scene.add(new THREE.HemisphereLight(0xd9f4ff, 0x68734c, 2.0));
  const sun = new THREE.DirectionalLight(0xffe6bd, 2.2);
  sun.position.set(-35, 55, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  // A gently uneven, circular island built from concentric terrain rings.
  const rings = 24;
  const segments = 72;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let ring = 0; ring <= rings; ring++) {
    const radius = (ring / rings) * 34;
    for (let segment = 0; segment <= segments; segment++) {
      const angle = (segment / segments) * Math.PI * 2;
      const wobble = 1 + 0.035 * Math.sin(angle * 5) + 0.022 * Math.cos(angle * 9);
      const x = Math.cos(angle) * radius * wobble;
      const z = Math.sin(angle) * radius * wobble;
      const hill = Math.max(0, 1 - radius / 35);
      const y = 0.35 + hill * (0.65 + 0.3 * Math.sin(x * 0.19) * Math.cos(z * 0.17)) + Math.sin(x * 0.32 + z * 0.21) * 0.12;
      positions.push(x, y, z);
    }
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const a = ring * (segments + 1) + segment;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const terrainGeometry = new THREE.BufferGeometry();
  terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  terrainGeometry.setIndex(indices);
  terrainGeometry.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ color: 0x78945b, roughness: 1, flatShading: true, side: THREE.DoubleSide }));
  terrain.receiveShadow = true;
  scene.add(terrain);

  const beach = new THREE.Mesh(
    new THREE.CylinderGeometry(34.4, 35.2, 1.5, 72, 1, false),
    new THREE.MeshStandardMaterial({ color: 0xcbb985, roughness: 1, flatShading: true })
  );
  beach.position.y = -0.35;
  beach.receiveShadow = true;
  scene.add(beach);

  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x328da3, roughness: 0.42, metalness: 0.08 })
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -1.15;
  scene.add(ocean);

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x765039, roughness: 1 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x315f45, roughness: 1, flatShading: true });
  let seed = 7123;
  const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < 48; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 8 + random() * 22;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.hypot(x, z) < 7) continue;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.2, 6), trunkMaterial);
    trunk.position.set(x, 1.5, z);
    trunk.castShadow = true;
    trunk.userData.resource = 'wood';
    scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.35 + random() * 0.5, 3.2, 7), leafMaterial);
    crown.position.set(x, 3.8, z);
    crown.castShadow = true;
    crown.userData.resource = 'wood';
    scene.add(crown);
  }

  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x7e8580, roughness: 1, flatShading: true });
  for (let i = 0; i < 18; i++) {
    const angle = random() * Math.PI * 2;
    const radius = 5 + random() * 25;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + random() * 0.8, 0), rockMaterial);
    rock.position.set(Math.cos(angle) * radius, 0.9, Math.sin(angle) * radius);
    rock.rotation.set(random(), random(), random());
    rock.castShadow = true;
    rock.userData.resource = 'stone';
    scene.add(rock);
  }

  const bushMat = new THREE.MeshStandardMaterial({ color: 0x426b3d, roughness: 1 });
  const berryMat = new THREE.MeshStandardMaterial({ color: 0xc94d55, roughness: 0.8 });
  for (let i = 0; i < 12; i++) {
    const a = random() * Math.PI * 2, r = 7 + random() * 20;
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 1), bushMat);
    bush.position.set(Math.cos(a) * r, 0.75, Math.sin(a) * r);
    bush.userData.resource = 'berries'; bush.castShadow = true; scene.add(bush);
    for (let j = 0; j < 4; j++) {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), berryMat);
      berry.position.set(bush.position.x + (random() - 0.5) * 0.7, 0.9 + random() * 0.35, bush.position.z + (random() - 0.5) * 0.7);
      berry.userData.resource = 'berries'; scene.add(berry);
    }
  }

  const hud = document.createElement('div');
  hud.className = 'tf-hud';
  hud.innerHTML = `
    <div class="tf-brand"><span class="tf-mark">✦</span><div><strong>TINY FRONTIER</strong><small>ISLAND SURVIVAL</small></div></div>
    <div class="tf-status"><div><span>HEALTH</span><b id="tf-health">100</b></div><div><span>HUNGER</span><b id="tf-hunger">100</b></div><div><span>THIRST</span><b id="tf-thirst">100</b></div></div>
    <div class="tf-center"><span class="tf-crosshair">+</span><div class="tf-prompt" id="tf-prompt">CLICK TO EXPLORE</div></div>
    <div class="tf-inventory" id="tf-inventory"><b>BACKPACK</b><span>🪵 Wood <strong id="tf-wood">0</strong></span><span>🪨 Stone <strong id="tf-stone">0</strong></span><span>🫐 Berries <strong id="tf-berries">0</strong></span></div><div class="tf-help"><b>W A S D</b> Move <i>·</i> <b>Ctrl + W</b> Sprint <i>·</i> <b>Shift</b> Sneak <i>·</i> <b>Space</b> Jump <i>·</i> <b>E</b> Gather <i>·</i> <b>Esc</b> Pause</div>
    <div class="tf-toast" id="tf-toast">You woke up on an unfamiliar island.</div>
  `;
  root.appendChild(hud);

  const keys = new Set<string>();
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  let health = 100;
  let hunger = 100;
  let thirst = 100;
  const inventory = { wood: 0, stone: 0, berries: 0 };
  let verticalVelocity = 0;
  let grounded = true;
  let toastTimer = 0;
  let lastTime = performance.now();
  let toastTimer = 0;
  let animation = 0;
  let disposed = false;

  const toast = (message: string) => { const node = hud.querySelector<HTMLElement>('#tf-toast'); if (node) node.textContent = message; toastTimer = 3; };
  const updateInventory = () => { (['wood', 'stone', 'berries'] as const).forEach((item) => { const node = hud.querySelector<HTMLElement>('#tf-' + item); if (node) node.textContent = String(inventory[item]); }); };
  const gather = () => {
    if (!controls.isLocked) return;
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(0, 0), camera);
    const targets: THREE.Object3D[] = []; scene.traverse((o) => { if (o.userData.resource) targets.push(o); });
    const hit = ray.intersectObjects(targets, false).find((h) => h.distance < 3.2);
    if (!hit) { toast('Look at a tree, rock or berry bush, then press E.'); return; }
    const kind = hit.object.userData.resource as keyof typeof inventory;
    inventory[kind] += kind === 'berries' ? 2 : 1; updateInventory(); hit.object.visible = false;
    if (kind === 'berries') { hunger = Math.min(100, hunger + 8); const h = hud.querySelector<HTMLElement>('#tf-hunger'); if (h) h.textContent = String(Math.round(hunger)); toast('Gathered 2 berries. Hunger restored.'); }
    else toast(kind === 'wood' ? 'Gathered 1 wood.' : 'Gathered 1 stone.');
  };
  const onKeyDown = (event: KeyboardEvent) => {
    keys.add(event.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    if (event.code === 'Space' && grounded && controls.isLocked) { verticalVelocity = 7.2; grounded = false; }
    if (event.code === 'KeyE' && !event.repeat) gather();
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
  const onClick = () => { if (!controls.isLocked) controls.lock(); };
  const onLock = () => { const prompt = hud.querySelector<HTMLElement>('#tf-prompt'); if (prompt) prompt.textContent = 'SURVIVE THE ISLAND'; };
  const onUnlock = () => { const prompt = hud.querySelector<HTMLElement>('#tf-prompt'); if (prompt) prompt.textContent = 'CLICK TO EXPLORE'; };
  const onResize = () => {
    const width = Math.max(1, root.clientWidth || window.innerWidth);
    const height = Math.max(1, root.clientHeight || window.innerHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('click', onClick);
  controls.addEventListener('lock', onLock);
  controls.addEventListener('unlock', onUnlock);

  const clock = new THREE.Clock();
  const animate = () => {
    if (disposed) return;
    animation = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = (performance.now() - lastTime) / 1000;
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) toast(''); }
    if (elapsed >= 1) {
      hunger = Math.max(0, hunger - 0.025 * elapsed);
      thirst = Math.max(0, thirst - 0.04 * elapsed);
      lastTime = performance.now();
      const h = hud.querySelector<HTMLElement>('#tf-hunger');
      const t = hud.querySelector<HTMLElement>('#tf-thirst');
      if (h) h.textContent = String(Math.round(hunger));
      if (t) t.textContent = String(Math.round(thirst));
      if (hunger <= 0 || thirst <= 0) health = Math.max(0, health - 0.1);
      const hp = hud.querySelector<HTMLElement>('#tf-health');
      if (hp) hp.textContent = String(Math.round(health));
    }

    if (controls.isLocked) {
      const sneaking = keys.has('ShiftLeft') || keys.has('ShiftRight');
      const sprinting = (keys.has('ControlLeft') || keys.has('ControlRight')) && keys.has('KeyW') && !sneaking;
      const speed = sprinting ? 11 : sneaking ? 2.6 : 6;
      const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
      direction.set(Number(keys.has('KeyD')) - Number(keys.has('KeyA')), 0, -forward);
      if (direction.lengthSq() > 0) {
        direction.normalize();
        velocity.copy(direction).multiplyScalar(speed * dt);
        controls.moveRight(velocity.x);
        controls.moveForward(velocity.z);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -29, 29);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -29, 29);
        const radius = Math.hypot(camera.position.x, camera.position.z);
        if (radius > 31) {
          camera.position.x *= 31 / radius;
          camera.position.z *= 31 / radius;
        }
      }
      verticalVelocity -= 18 * dt;
      camera.position.y += verticalVelocity * dt;
      const floorHeight = sneaking ? 1.35 : 2.05;
      if (camera.position.y <= floorHeight) { camera.position.y = floorHeight; verticalVelocity = 0; grounded = true; }
      if (grounded && direction.lengthSq() > 0) camera.position.y += Math.sin(performance.now() * 0.012) * (sneaking ? 0.008 : 0.025);
    }

    ocean.position.x = camera.position.x * 0.015;
    ocean.position.z = camera.position.z * 0.015;
    renderer.render(scene, camera);
  };
  onResize();
  animate();

  return () => {
    disposed = true;
    cancelAnimationFrame(animation);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
    renderer.domElement.removeEventListener('click', onClick);
    controls.removeEventListener('lock', onLock);
    controls.removeEventListener('unlock', onUnlock);
    controls.dispose();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    renderer.dispose();
    root.innerHTML = '';
  };
}
