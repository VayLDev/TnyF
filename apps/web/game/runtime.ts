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
    <div class="tf-toast" id="tf-toast">You woke up on an unfamiliar island.</div>
    <div class="tf-break" id="tf-break"><span id="tf-break-label">WOOD</span><div><i id="tf-break-fill"></i></div></div>
    <div class="tf-hotbar" id="tf-hotbar">
      <button class="tf-slot selected" data-slot="0"><small>1</small><span>✊</span><b id="tf-slot-0">—</b></button>
      <button class="tf-slot" data-slot="1"><small>2</small><span>🪓</span><b id="tf-slot-1">—</b></button>
      <button class="tf-slot" data-slot="2"><small>3</small><span>🪵</span><b id="tf-slot-2">0</b></button>
      <button class="tf-slot" data-slot="3"><small>4</small><span>🪨</span><b id="tf-slot-3">0</b></button>
      <button class="tf-slot" data-slot="4"><small>5</small><span>🫐</span><b id="tf-slot-4">0</b></button>
    </div>
    <div class="tf-vitals">
      <div><span>❤</span><div><b>HEALTH</b><i><em id="tf-health-bar"></em></i></div><strong id="tf-health">100</strong></div>
      <div><span>🍗</span><div><b>HUNGER</b><i><em id="tf-hunger-bar"></em></i></div><strong id="tf-hunger">100</strong></div>
      <div><span>🌡</span><div><b>TEMPERATURE</b><i><em id="tf-temp-bar"></em></i></div><strong id="tf-temp">36°</strong></div>
    </div>
    <button class="tf-menu-button" id="tf-bag-button">▦ INVENTORY</button>
    <section class="tf-panel" id="tf-panel" aria-hidden="true">
      <header><div><b>INVENTORY & CRAFTING</b><small>Survival equipment</small></div><button id="tf-close">✕</button></header>
      <div class="tf-panel-body">
        <div class="tf-bag-column"><h3>BACKPACK <small>25 SLOTS · 5×5</small></h3><div class="tf-grid" id="tf-grid"></div>
          <h3>CRAFTING</h3><div class="tf-recipes" id="tf-recipes"></div>
        </div>
        <aside class="tf-character"><h3>CHARACTER</h3><div class="tf-avatar"><div class="tf-avatar-shadow"></div><div class="tf-avatar-body"><i></i><b></b><em></em></div></div><strong>ISLANDER</strong><small>Survivor · Level 1</small><div class="tf-equipped">EQUIPPED<strong id="tf-equipped">Bare Hands</strong></div></aside>
      </div>
    </section>
    <div class="tf-touch" id="tf-touch">
      <div class="tf-pad"><button data-move="KeyW">▲</button><div><button data-move="KeyA">◀</button><button data-move="KeyS">▼</button><button data-move="KeyD">▶</button></div></div>
      <div class="tf-actions"><button id="tf-touch-jump">JUMP</button><button id="tf-touch-use">USE</button><button id="tf-touch-hit">HIT</button></div>
    </div>
    <div class="tf-toast" id="tf-toast">You woke up on an unfamiliar island.</div>
  `;
  root.appendChild(hud);

  const keys = new Set<string>();
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  let health = 100, hunger = 100, temperature = 36;
  const inventory = { wood: 0, stone: 0, berries: 0, axe: 0 };
  let selectedSlot = 0, verticalVelocity = 0, grounded = true;
  let toastTimer = 0, lastTime = performance.now(), animation = 0, disposed = false;
  let breakTarget: THREE.Object3D | null = null, breakProgress = 0, hitCooldown = 0, craftCooldown = 0;
  const touchMode = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const touchLayer = hud.querySelector<HTMLElement>('#tf-touch')!;
  touchLayer.classList.toggle('visible', touchMode);
  const toast = (message: string) => { const node = hud.querySelector<HTMLElement>('#tf-toast'); if (node) node.textContent = message; toastTimer = 2.6; };
  const setBar = (id: string, value: number) => { const el = hud.querySelector<HTMLElement>('#tf-' + id + '-bar'); if (el) el.style.width = Math.max(0, Math.min(100, value)) + '%'; const n = hud.querySelector<HTMLElement>('#tf-' + id); if (n) n.textContent = String(Math.round(value)); };
  const updateInventory = () => {
    const items = [{id:'axe',name:'Stone Axe',icon:'🪓'},{id:'wood',name:'Wood',icon:'🪵'},{id:'stone',name:'Stone',icon:'🪨'},{id:'berries',name:'Berries',icon:'🫐'}] as const;
    const grid = hud.querySelector<HTMLElement>('#tf-grid')!;
    grid.innerHTML = Array.from({length:25},(_,i) => {
      const item = items.find(x => inventory[x.id] > 0 && items.filter(y => inventory[y.id] > 0).indexOf(x) === i);
      return '<div class="tf-cell">'+(item ? '<span>'+item.icon+'</span><b>'+inventory[item.id]+'</b><small>'+item.name+'</small>' : '<small>'+(i+1)+'</small>')+'</div>';
    }).join('');
    (['wood','stone','berries'] as const).forEach((k,i)=>{ const el=hud.querySelector<HTMLElement>('#tf-slot-'+(i+2)); if(el) el.textContent=String(inventory[k]); });
    const axe = hud.querySelector<HTMLElement>('#tf-slot-1'); if(axe) axe.textContent=inventory.axe ? '1' : '—';
    hud.querySelector<HTMLElement>('#tf-recipes')!.innerHTML = '<button class="tf-recipe" id="tf-craft-axe"><span>🪓</span><div><b>Stone Axe</b><small>🪵 Wood ×3 &nbsp; 🪨 Stone ×2</small><em>Craft time: 4s</em></div><strong>'+(inventory.wood>=3&&inventory.stone>=2?'CRAFT':'LOCKED')+'</strong></button>';
    hud.querySelector<HTMLElement>('#tf-craft-axe')?.addEventListener('click', () => {
      if(craftCooldown>0 || inventory.wood<3 || inventory.stone<2) { toast(craftCooldown>0?'Crafting station cooling down.':'Materials not enough.'); return; }
      inventory.wood-=3; inventory.stone-=2; craftCooldown=4;
      const btn=hud.querySelector<HTMLElement>('#tf-craft-axe'); if(btn) btn.classList.add('crafting');
      toast('Crafting Stone Axe… 4 seconds'); updateInventory();
      window.setTimeout(()=>{ if(disposed)return; inventory.axe++; updateInventory(); toast('Stone Axe crafted! Select slot 2.'); },4000);
    });
  };
  const updateVitals = () => { setBar('health',health); setBar('hunger',hunger); const t=hud.querySelector<HTMLElement>('#tf-temp'); if(t)t.textContent=Math.round(temperature)+'°'; const tb=hud.querySelector<HTMLElement>('#tf-temp-bar'); if(tb)tb.style.width=Math.max(0,100-Math.abs(temperature-36)*12)+'%'; };
  const selectSlot = (slot:number) => { selectedSlot=Math.max(0,Math.min(4,slot)); hud.querySelectorAll('.tf-slot').forEach((el,i)=>el.classList.toggle('selected',i===selectedSlot)); const names=['Bare Hands','Stone Axe','Wood','Stone','Berries']; const e=hud.querySelector<HTMLElement>('#tf-equipped'); if(e)e.textContent=names[selectedSlot]; };
  const panel = hud.querySelector<HTMLElement>('#tf-panel')!;
  const togglePanel = () => { const open=!panel.classList.contains('open'); panel.classList.toggle('open',open); panel.setAttribute('aria-hidden',String(!open)); if(open)updateInventory(); };
  hud.querySelector('#tf-bag-button')?.addEventListener('click',togglePanel);
  hud.querySelector('#tf-close')?.addEventListener('click',togglePanel);
  hud.querySelectorAll<HTMLElement>('.tf-slot').forEach((el)=>el.addEventListener('click',()=>selectSlot(Number(el.dataset.slot))));
  const findTarget = () => { const ray=new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(0,0),camera); const targets:THREE.Object3D[]=[]; scene.traverse(o=>{if(o.userData.resource && o.visible)targets.push(o);}); return ray.intersectObjects(targets,false).find(h=>h.distance<3.5)?.object ?? null; };
  const gather = () => {
    if(hitCooldown>0)return;
    const target=findTarget(); if(!target){breakTarget=null;breakProgress=0;toast('Aim at a tree, rock or berry bush.');return;}
    if(breakTarget!==target){breakTarget=target;breakProgress=0;}
    const kind=target.userData.resource as keyof typeof inventory;
    const toolBonus=selectedSlot===1 && inventory.axe>0 && kind!=='berries';
    const needed=kind==='wood'?(toolBonus?2:5):(kind==='stone'?(toolBonus?2:4):1);
    breakProgress++;
    hitCooldown=toolBonus?0.34:0.58;
    target.userData.breakHits=breakProgress;
    const original=target.userData.baseScale ?? target.scale.clone(); target.userData.baseScale=original;
    target.scale.copy(original).multiplyScalar(1+Math.sin(breakProgress*2)*0.035);
    const bar=hud.querySelector<HTMLElement>('#tf-break'); bar?.classList.add('active');
    const fill=hud.querySelector<HTMLElement>('#tf-break-fill'); if(fill)fill.style.width=Math.min(100,breakProgress/needed*100)+'%';
    const label=hud.querySelector<HTMLElement>('#tf-break-label'); if(label)label.textContent=(kind==='wood'?'WOOD':kind==='stone'?'STONE':'BERRIES')+' · '+Math.min(breakProgress,needed)+'/'+needed;
    if(breakProgress>=needed){
      inventory[kind]+=kind==='berries'?2:1;
      if(kind==='berries'){hunger=Math.min(100,hunger+8);updateVitals();}
      target.visible=false; target.scale.copy(original); breakTarget=null;breakProgress=0;bar?.classList.remove('active');
      updateInventory(); toast(kind==='wood'?'Wood collected.':kind==='stone'?'Stone collected.':'2 berries collected · hunger restored.');
    }
  };
  const onKeyDown = (event:KeyboardEvent) => {
    keys.add(event.code);
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
    if(event.code==='Space'&&grounded){verticalVelocity=7.2;grounded=false;}
    if(event.code==='KeyE'&&!event.repeat)gather();
    if(event.code==='KeyI'&&!event.repeat)togglePanel();
    if(/^Digit[1-5]$/.test(event.code))selectSlot(Number(event.code.slice(-1))-1);
  };
  const onKeyUp=(event:KeyboardEvent)=>keys.delete(event.code);
  const onClick=()=>{if(!touchMode&&!controls.isLocked)controls.lock();};
  const onLock=()=>{hud.classList.add('locked');};
  const onUnlock=()=>{hud.classList.remove('locked');};
  if(touchMode){
    let lastX=0,lastY=0,looking=false;
    renderer.domElement.addEventListener('pointerdown',(e)=>{if(e.pointerType==='touch'){looking=true;lastX=e.clientX;lastY=e.clientY;}});
    renderer.domElement.addEventListener('pointermove',(e)=>{if(!looking||e.pointerType!=='touch')return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;camera.rotation.order='YXZ';camera.rotation.y-=dx*0.004;camera.rotation.x=Math.max(-1.35,Math.min(1.35,camera.rotation.x-dy*0.004));});
    renderer.domElement.addEventListener('pointerup',()=>{looking=false;});
    touchLayer.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(btn=>{const code=btn.dataset.move!;btn.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(code);});['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,()=>keys.delete(code)));});
    hud.querySelector('#tf-touch-jump')?.addEventListener('pointerdown',()=>{if(grounded){verticalVelocity=7.2;grounded=false;}});
    hud.querySelector('#tf-touch-use')?.addEventListener('click',()=>{if(selectedSlot===4&&inventory.berries>0){inventory.berries--;hunger=Math.min(100,hunger+18);updateVitals();updateInventory();toast('Ate berries.');}else togglePanel();});
    hud.querySelector('#tf-touch-hit')?.addEventListener('click',gather);
  }
  const onResize = () => {
    const width=Math.max(1,root.clientWidth||window.innerWidth),height=Math.max(1,root.clientHeight||window.innerHeight);
    camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);
  };
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('resize',onResize);
  renderer.domElement.addEventListener('click',onClick);controls.addEventListener('lock',onLock);controls.addEventListener('unlock',onUnlock);
  updateInventory();updateVitals();selectSlot(0);

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
  const playerShadow = new THREE.Mesh(new THREE.CircleGeometry(0.65,24),new THREE.MeshBasicMaterial({color:0x18251a,transparent:true,opacity:0.24,depthWrite:false}));
  playerShadow.rotation.x=-Math.PI/2;playerShadow.position.y=0.16;scene.add(playerShadow);
  const animate=()=>{
    if(disposed)return;animation=requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),0.05);
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toast('');}
    hitCooldown=Math.max(0,hitCooldown-dt);craftCooldown=Math.max(0,craftCooldown-dt);
    if(breakTarget){const current=findTarget();if(current!==breakTarget){breakTarget=null;breakProgress=0;hud.querySelector('#tf-break')?.classList.remove('active');}}
    const now=performance.now(),elapsed=(now-lastTime)/1000;
    if(elapsed>=1){hunger=Math.max(0,hunger-0.025*elapsed);temperature=36+Math.sin(now*0.00008)*2; if(hunger<=0)health=Math.max(0,health-0.1);lastTime=now;updateVitals();}
    const moving=keys.has('KeyW')||keys.has('KeyA')||keys.has('KeyS')||keys.has('KeyD');
    const sneaking=keys.has('ShiftLeft')||keys.has('ShiftRight');
    const sprinting=(keys.has('ControlLeft')||keys.has('ControlRight'))&&keys.has('KeyW')&&!sneaking;
    const speed=sprinting?11:sneaking?2.6:6;
    direction.set(Number(keys.has('KeyD'))-Number(keys.has('KeyA')),0,Number(keys.has('KeyW'))-Number(keys.has('KeyS')));
    if(direction.lengthSq()>0){direction.normalize();velocity.copy(direction).multiplyScalar(speed*dt);if(controls.isLocked){controls.moveRight(velocity.x);controls.moveForward(velocity.z);}else{camera.position.x+=velocity.x*Math.cos(camera.rotation.y)+velocity.z*Math.sin(camera.rotation.y);camera.position.z+=-velocity.x*Math.sin(camera.rotation.y)+velocity.z*Math.cos(camera.rotation.y);}camera.position.x=THREE.MathUtils.clamp(camera.position.x,-29,29);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-29,29);}
    verticalVelocity-=18*dt;camera.position.y+=verticalVelocity*dt;const floor=sneaking?1.35:2.05;if(camera.position.y<=floor){camera.position.y=floor;verticalVelocity=0;grounded=true;}
    playerShadow.position.x=camera.position.x;playerShadow.position.z=camera.position.z;playerShadow.material.opacity=moving?0.32:0.22;
    if(moving&&grounded)camera.position.y+=Math.sin(now*0.012)*(sneaking?0.008:0.022);
    ocean.position.x=camera.position.x*0.015;ocean.position.z=camera.position.z*0.015;
    renderer.render(scene,camera);
  };
  onResize();animate();

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
    playerShadow.geometry.dispose(); playerShadow.material.dispose();
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
