/**
 * Pipecraft: Ash Builds Pipeline — Milestone 1
 * Walkable voxel world, five zone shells, FPS controls, collisions, title/pause.
 */
(function () {
  'use strict';

  const PALETTE = {
    arenaNavy: 0x102347,
    worldTourBlue: 0x168bff,
    scannerCyan: 0x28d9f2,
    portalPurple: 0x7857ff,
    loungeMagenta: 0xf04bb8,
    dealGold: 0xffc857,
    successGreen: 0x67dfa4,
    grass: 0x4a9f5a,
    stone: 0x8a9098,
    eventFloor: 0xd8dce4,
    wood: 0x8b6914,
    skin: 0x8d5524,
    hair: 0x3d2314,
    blazer: 0x1a1a22,
    white: 0xf5f5f5,
    cloudWhite: 0xe8f8ff,
  };

  const ZONES = [
    { id: 'arrivals', name: '01 — Arrivals Boulevard', minX: -55, maxX: -28, spawn: { x: -48, y: 4, z: 0 } },
    { id: 'expo', name: '02 — Trailblazer Expo', minX: -28, maxX: -2 },
    { id: 'lounge', name: '03 — Pipeline Lounge', minX: -2, maxX: 28 },
    { id: 'keynote', name: '04 — Keynote Arena', minX: 28, maxX: 58 },
    { id: 'gardens', name: '05 — Cloud Gardens', minX: 58, maxX: 88 },
  ];

  /** @type {Map<string, number>} */
  const solidBlocks = new Map();
  /** @type {{x:number,y:number,z:number,color:number, emissive?:number}[]} */
  const visualBlocks = [];

  function blockKey(x, y, z) {
    return `${x|0},${y|0},${z|0}`;
  }

  function setSolid(x, y, z, color, opts = {}) {
    const ix = x | 0;
    const iy = y | 0;
    const iz = z | 0;
    solidBlocks.set(blockKey(ix, iy, iz), 1);
    visualBlocks.push({ x: ix, y: iy, z: iz, color, emissive: opts.emissive || 0 });
  }

  function fillBox(x0, y0, z0, x1, y1, z1, color, opts = {}) {
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          setSolid(x, y, z, color, opts);
        }
      }
    }
  }

  function fillPlatform(x0, x1, z0, z1, y, color) {
    fillBox(x0, y, z0, x1, y, z1, color);
  }

  /** Build connected World Tour map (five zones along +X). */
  function buildWorldLayout() {
    const pathZ0 = -2;
    const pathZ1 = 2;

    // Base terrain — grass with stone edges
    for (let x = -60; x <= 95; x++) {
      for (let z = -35; z <= 35; z++) {
        const edge = Math.abs(z) > 28 || x < -58 || x > 93;
        setSolid(x, 0, z, edge ? PALETTE.stone : PALETTE.grass);
      }
    }

    // Main boulevard event floor
    fillPlatform(-58, 92, -8, 8, 1, PALETTE.eventFloor);

    // Cyan wayfinding strip
    for (let x = -55; x <= 90; x++) {
      for (let z = pathZ0; z <= pathZ1; z++) {
        setSolid(x, 2, z, PALETTE.scannerCyan, { emissive: 0x28d9f2 });
      }
    }

    // Zone 01 — Arrivals welcome blocks + sign
    fillBox(-52, 2, -6, -50, 4, -4, PALETTE.worldTourBlue);
    fillBox(-49, 2, 5, -47, 4, 7, PALETTE.dealGold);
    fillBox(-46, 2, -3, -44, 4, -1, PALETTE.successGreen);
    buildSign(-54, 3, -12, 'ARRIVALS', PALETTE.worldTourBlue);
    buildQuestSign(-56, 3, 14);

    // Zone 02 — Expo booths
    buildExpoBooth(-22, -14, PALETTE.portalPurple);
    buildExpoBooth(-12, 14, PALETTE.worldTourBlue);
    buildExpoHall(-20, 0);
    buildSign(-18, 3, -18, 'TRAILBLAZER EXPO', PALETTE.scannerCyan);

    // Zone 03 — Pipeline Lounge
    buildLounge(8, 0);
    buildSign(10, 3, -16, 'PIPELINE LOUNGE', PALETTE.loungeMagenta);
    fillBox(18, 2, -10, 22, 3, -6, PALETTE.loungeMagenta); // crafting bench shell

    // Zone 04 — Keynote + O2-inspired dome silhouette
    buildO2Dome(42, -22);
    buildKeynoteStage(50, 0);
    buildSign(38, 3, -18, 'KEYNOTE ARENA', PALETTE.arenaNavy);

    // Zone 05 — Cloud Gardens + floating afterparty island
    buildCloudGarden(68, 0);
    buildFloatingIsland(75, 18, 22);
    buildSign(62, 3, -16, 'CLOUD GARDENS', PALETTE.successGreen);

    // Landmarks visible from distance
    buildCloudTower(-35, -22);
    buildCloudTower(30, 22);

    // Perimeter walls (collision boundaries)
    for (let x = -60; x <= 95; x++) {
      for (let h = 1; h <= 6; h++) {
        setSolid(x, h, -34, PALETTE.stone);
        setSolid(x, h, 34, PALETTE.stone);
      }
    }
    for (let z = -34; z <= 34; z++) {
      for (let h = 1; h <= 6; h++) {
        setSolid(-59, h, z, PALETTE.stone);
        setSolid(94, h, z, PALETTE.stone);
      }
    }

    // Locked gates (visual only for M1 — still walkable via path)
    buildGate(-27, 0, 'RESOURCE BRIDGE — M2');
    buildGate(27, 0, 'DEAL GATE — M3');
  }

  function buildSign(x, y, z, text, accent) {
    fillBox(x, y, z, x + 1, y + 3, z, PALETTE.wood);
    fillBox(x - 1, y + 3, z - 2, x + 2, y + 4, z + 2, accent, { emissive: accent });
  }

  function buildQuestSign(x, y, z) {
    for (let i = 0; i < 5; i++) {
      fillBox(x, y + i, z, x, y + i, z + 1, PALETTE.wood);
    }
    fillBox(x - 1, y + 4, z - 1, x + 1, y + 5, z + 2, PALETTE.dealGold);
  }

  function buildExpoBooth(cx, cz, roofColor) {
    fillBox(cx - 3, 2, cz - 3, cx + 3, 2, cz + 3, PALETTE.eventFloor);
    fillBox(cx - 3, 3, cz - 3, cx + 3, 5, cz - 3, PALETTE.stone);
    fillBox(cx - 3, 3, cz + 3, cx + 3, 5, cz + 3, PALETTE.stone);
    fillBox(cx - 3, 3, cz - 2, cx - 3, 5, cz + 2, PALETTE.stone);
    fillBox(cx + 3, 3, cz - 2, cx + 3, 5, cz + 2, PALETTE.stone);
    fillBox(cx - 2, 6, cz - 2, cx + 2, 6, cz + 2, roofColor, { emissive: roofColor });
  }

  function buildExpoHall(cx, cz) {
    fillBox(cx - 8, 2, cz - 10, cx + 8, 2, cz + 10, PALETTE.eventFloor);
    for (let x = cx - 8; x <= cx + 8; x++) {
      for (let z = cz - 10; z <= cz + 10; z++) {
        if (Math.abs(x - cx) === 8 || Math.abs(z - cz) === 10) {
          fillBox(x, 3, z, x, 8, z, PALETTE.worldTourBlue);
        }
      }
    }
    fillBox(cx - 2, 9, cz - 2, cx + 2, 11, cz + 2, PALETTE.cloudWhite, { emissive: 0x168bff });
  }

  function buildLounge(cx, cz) {
    fillBox(cx - 12, 2, cz - 10, cx + 12, 2, cz + 10, PALETTE.eventFloor);
    fillBox(cx - 5, 3, cz - 4, cx + 5, 3, cz + 4, PALETTE.loungeMagenta);
    fillBox(cx - 4, 4, cz - 3, cx - 2, 4, cz - 1, PALETTE.loungeMagenta);
    fillBox(cx + 2, 4, cz + 1, cx + 4, 4, cz + 3, PALETTE.loungeMagenta);
  }

  function buildO2Dome(cx, cz) {
    const radius = 14;
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        const d = Math.sqrt(x * x + z * z);
        if (d <= radius) {
          const h = Math.floor(Math.sqrt(Math.max(0, radius * radius - d * d)) * 0.55);
          for (let y = 3; y <= 3 + h; y++) {
            setSolid(cx + x, y, cz + z, PALETTE.arenaNavy, { emissive: 0x102347 });
          }
        }
      }
    }
    fillBox(cx - 4, 3, cz - radius - 1, cx + 4, 8, cz - radius, PALETTE.worldTourBlue);
  }

  function buildKeynoteStage(cx, cz) {
    fillBox(cx - 10, 2, cz - 6, cx + 10, 2, cz + 6, PALETTE.stone);
    fillBox(cx - 8, 3, cz - 4, cx + 8, 3, cz + 4, PALETTE.portalPurple);
    fillBox(cx - 6, 4, cz - 1, cx + 6, 8, cz + 1, PALETTE.scannerCyan, { emissive: 0x28d9f2 });
  }

  function buildCloudGarden(cx, cz) {
    for (let i = 0; i < 8; i++) {
      const tx = cx + (i % 4) * 5 - 8;
      const tz = cz + Math.floor(i / 4) * 8 - 6;
      fillBox(tx, 2, tz, tx + 1, 5, tz + 1, PALETTE.grass);
      fillBox(tx, 6, tz, tx, 8, tz, PALETTE.successGreen);
    }
    fillBox(cx + 10, 2, cz + 8, cx + 12, 3, cz + 10, PALETTE.dealGold, { emissive: 0xffc857 });
  }

  function buildFloatingIsland(cx, cy, cz) {
    fillBox(cx - 6, cy, cz - 4, cx + 6, cy, cz + 4, PALETTE.grass);
    fillBox(cx - 4, cy + 1, cz - 2, cx + 4, cy + 1, cz + 2, PALETTE.successGreen);
    fillBox(cx - 1, cy + 2, cz - 1, cx + 1, cy + 6, cz + 1, PALETTE.cloudWhite, { emissive: 0x67dfa4 });
    // Support pillar (visual)
    fillBox(cx, 2, cz, cx, cy - 1, cz, PALETTE.scannerCyan, { emissive: 0x28d9f2 });
  }

  function buildCloudTower(x, z) {
    for (let y = 2; y <= 22; y++) {
      setSolid(x, y, z, PALETTE.worldTourBlue, { emissive: y > 18 ? 0x28d9f2 : 0 });
      setSolid(x + 1, y, z, PALETTE.worldTourBlue);
    }
    fillBox(x - 1, 20, z - 1, x + 2, 22, z + 1, PALETTE.cloudWhite, { emissive: 0x168bff });
  }

  function buildGate(x, _z, _label) {
    fillBox(x, 3, -8, x, 8, -4, PALETTE.dealGold);
    fillBox(x, 3, 4, x, 8, 8, PALETTE.dealGold);
    fillBox(x - 1, 8, -9, x + 1, 9, 9, PALETTE.dealGold, { emissive: 0xffc857 });
  }

  function isSolidAt(x, y, z) {
    return solidBlocks.has(blockKey(Math.floor(x), Math.floor(y), Math.floor(z)));
  }

  function getGroundHeight(x, z) {
    for (let y = 32; y >= 0; y--) {
      if (isSolidAt(x, y, z)) return y + 1;
    }
    return 1;
  }

  // --- Three.js setup ---
  let renderer, scene, camera, clock;
  let instancedMeshes = [];
  let fpViewGroup;
  let state = 'title';
  let settings = loadSettings();

  const player = {
    x: ZONES[0].spawn.x,
    y: ZONES[0].spawn.y,
    z: ZONES[0].spawn.z,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    pitch: 0,
    onGround: false,
    height: 1.75,
    radius: 0.35,
    sprint: false,
  };

  const keys = {};
  let pointerLocked = false;
  let currentZoneId = 'arrivals';
  let tutorialTimer = 0;
  let pauseOnBlur = true;

  function loadSettings() {
    try {
      const raw = localStorage.getItem('pipecraft-settings');
      if (raw) return { sensitivity: 1, reducedFlash: false, relaxed: false, sound: true, ...JSON.parse(raw) };
    } catch (_) { /* ignore */ }
    return { sensitivity: 1, reducedFlash: false, relaxed: false, sound: true };
  }

  function saveSettings() {
    localStorage.setItem('pipecraft-settings', JSON.stringify(settings));
  }

  function initWebGL() {
    const root = document.getElementById('game-root');
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      document.getElementById('screen-webgl').classList.remove('hidden');
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(PALETTE.arenaNavy);
    renderer.shadowMap.enabled = true;
    root.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(PALETTE.arenaNavy, 40, 120);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.08, 200);
    scene.add(camera);

    clock = new THREE.Clock();

    buildWorldLayout();
    buildInstancedWorld(scene);
    addLighting(scene);
    buildFirstPersonAsh(camera);

    window.addEventListener('resize', onResize);
    setupInput(renderer.domElement);
    setupUI();

    animate();
    return true;
  }

  function buildInstancedWorld(scene) {
    const byColor = new Map();
    for (const b of visualBlocks) {
      const key = `${b.color}_${b.emissive || 0}`;
      if (!byColor.has(key)) byColor.set(key, []);
      byColor.get(key).push(b);
    }

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const matrix = new THREE.Matrix4();

    byColor.forEach((blocks, key) => {
      const [colorStr, emStr] = key.split('_');
      const color = parseInt(colorStr, 10);
      const emissive = parseInt(emStr, 10);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: emissive ? emissive : 0x000000,
        emissiveIntensity: emissive ? 0.35 : 0,
        roughness: 0.85,
        metalness: 0.05,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, blocks.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      blocks.forEach((b, i) => {
        matrix.makeTranslation(b.x + 0.5, b.y + 0.5, b.z + 0.5);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
      instancedMeshes.push(mesh);
    });
  }

  function addLighting(scene) {
    const hemi = new THREE.HemisphereLight(0x88bbff, 0x102347, 0.55);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(40, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    scene.add(sun);
    const fill = new THREE.PointLight(PALETTE.scannerCyan, 0.4, 50);
    fill.position.set(-40, 8, 0);
    scene.add(fill);
  }

  /** First-person Ash: sleeves, lanyard, Cloud Scanner (voxel-style boxes). */
  function buildFirstPersonAsh(cam) {
    fpViewGroup = new THREE.Group();
    fpViewGroup.position.set(0.35, -0.25, -0.55);

    const blazerMat = new THREE.MeshStandardMaterial({ color: PALETTE.blazer, roughness: 0.9 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: PALETTE.white, roughness: 0.95 });
    const skinMat = new THREE.MeshStandardMaterial({ color: PALETTE.skin, roughness: 0.9 });
    const cyanMat = new THREE.MeshStandardMaterial({
      color: PALETTE.scannerCyan,
      emissive: PALETTE.scannerCyan,
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const blueMat = new THREE.MeshStandardMaterial({ color: PALETTE.worldTourBlue, roughness: 0.5 });

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), blazerMat);
    leftArm.position.set(-0.22, -0.05, 0.05);
    fpViewGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), blazerMat);
    rightArm.position.set(0.08, -0.02, 0.02);
    fpViewGroup.add(rightArm);

    const scannerBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), blueMat);
    scannerBody.position.set(0.1, 0.02, -0.08);
    fpViewGroup.add(scannerBody);

    const scannerFace = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.04), cyanMat);
    scannerFace.position.set(0.1, 0.04, -0.24);
    fpViewGroup.add(scannerFace);

    const lanyard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.02), blueMat);
    lanyard.position.set(-0.05, 0.05, -0.15);
    lanyard.rotation.x = 0.25;
    fpViewGroup.add(lanyard);

    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.02), cyanMat);
    badge.position.set(-0.05, -0.08, -0.18);
    fpViewGroup.add(badge);

    const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.06, 0.13), shirtMat);
    cuff.position.set(0.08, -0.22, 0.02);
    fpViewGroup.add(cuff);

    cam.add(fpViewGroup);
  }

  function updateScannerPulse(t) {
    if (!fpViewGroup || settings.reducedFlash) return;
    const pulse = 0.35 + Math.sin(t * 4) * 0.15;
    fpViewGroup.children.forEach((c) => {
      if (c.material && c.material.emissive) {
        c.material.emissiveIntensity = pulse;
      }
    });
  }

  function setupUI() {
    const show = (id) => document.getElementById(id).classList.remove('hidden');
    const hide = (id) => document.getElementById(id).classList.add('hidden');

    document.getElementById('btn-start').onclick = () => {
      hide('screen-title');
      startGame();
    };
    document.getElementById('btn-how').onclick = () => {
      hide('screen-title');
      show('screen-how');
    };
    document.getElementById('btn-how-back').onclick = () => {
      hide('screen-how');
      show('screen-title');
    };
    document.getElementById('btn-settings').onclick = () => {
      hide('screen-title');
      applySettingsToForm();
      show('screen-settings');
    };
    document.getElementById('btn-settings-back').onclick = () => {
      readSettingsFromForm();
      saveSettings();
      hide('screen-settings');
      show('screen-title');
    };
    document.getElementById('btn-resume').onclick = () => resumeGame();
    document.getElementById('btn-restart').onclick = () => respawnPlayer(true);
    document.getElementById('btn-quit').onclick = () => {
      state = 'title';
      hide('screen-pause');
      show('screen-title');
      document.getElementById('hud').classList.add('hidden');
      exitPointerLock();
    };
  }

  function applySettingsToForm() {
    document.getElementById('setting-sensitivity').value = settings.sensitivity;
    document.getElementById('setting-reduced-flash').checked = settings.reducedFlash;
    document.getElementById('setting-relaxed').checked = settings.relaxed;
    document.getElementById('setting-sound').checked = settings.sound;
  }

  function readSettingsFromForm() {
    settings.sensitivity = parseFloat(document.getElementById('setting-sensitivity').value);
    settings.reducedFlash = document.getElementById('setting-reduced-flash').checked;
    settings.relaxed = document.getElementById('setting-relaxed').checked;
    settings.sound = document.getElementById('setting-sound').checked;
  }

  function startGame() {
    state = 'playing';
    document.getElementById('hud').classList.remove('hidden');
    tutorialTimer = 14;
    document.getElementById('tutorial-toast').classList.remove('hidden');
    respawnPlayer(true);
    requestPointerLock();
  }

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    document.getElementById('screen-pause').classList.remove('hidden');
    exitPointerLock();
  }

  function resumeGame() {
    state = 'playing';
    document.getElementById('screen-pause').classList.add('hidden');
    requestPointerLock();
  }

  function respawnPlayer(full) {
    const spawn = ZONES[0].spawn;
    player.x = spawn.x;
    player.y = spawn.y;
    player.z = spawn.z;
    player.vx = player.vy = player.vz = 0;
    if (full) {
      player.yaw = 0;
      player.pitch = 0;
    }
  }

  function setupInput(canvas) {
    document.addEventListener('keydown', (e) => {
      keys[e.code] = true;
      if (e.code === 'Escape') {
        if (state === 'playing') pauseGame();
        else if (state === 'paused') resumeGame();
        e.preventDefault();
      }
      if (e.code === 'Tab' && state === 'playing') {
        e.preventDefault();
        pauseGame();
      }
    });
    document.addEventListener('keyup', (e) => {
      keys[e.code] = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (state !== 'playing' || !pointerLocked) return;
      const sens = 0.002 * settings.sensitivity;
      player.yaw -= e.movementX * sens;
      player.pitch -= e.movementY * sens;
      player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, player.pitch));
    });

    canvas.addEventListener('click', () => {
      if (state === 'playing') requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      pointerLocked = document.pointerLockElement === canvas;
      document.getElementById('click-to-play').classList.toggle('hidden', pointerLocked || state !== 'playing');
    });

    window.addEventListener('blur', () => {
      if (pauseOnBlur && state === 'playing') pauseGame();
    });
  }

  function requestPointerLock() {
    renderer.domElement.requestPointerLock();
  }

  function exitPointerLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function playerAABB() {
    const h = player.height;
    const r = player.radius;
    return {
      minX: player.x - r,
      maxX: player.x + r,
      minY: player.y,
      maxY: player.y + h,
      minZ: player.z - r,
      maxZ: player.z + r,
    };
  }

  function collidesAABB(box) {
    const minBx = Math.floor(box.minX);
    const maxBx = Math.floor(box.maxX);
    const minBy = Math.floor(box.minY);
    const maxBy = Math.floor(box.maxY);
    const minBz = Math.floor(box.minZ);
    const maxBz = Math.floor(box.maxZ);

    for (let x = minBx; x <= maxBx; x++) {
      for (let y = minBy; y <= maxBy; y++) {
        for (let z = minBz; z <= maxBz; z++) {
          if (solidBlocks.has(blockKey(x, y, z))) return true;
        }
      }
    }
    return false;
  }

  function movePlayer(dt) {
    const forward = keys['KeyW'] || keys['ArrowUp'];
    const back = keys['KeyS'] || keys['ArrowDown'];
    const left = keys['KeyA'] || keys['ArrowLeft'];
    const right = keys['KeyD'] || keys['ArrowRight'];
    player.sprint = keys['ShiftLeft'] || keys['ShiftRight'];

    const speed = player.sprint ? 9 : 5.5;
    let mx = 0;
    let mz = 0;
    if (forward) mz -= 1;
    if (back) mz += 1;
    if (left) mx -= 1;
    if (right) mx += 1;
    const len = Math.hypot(mx, mz) || 1;
    mx /= len;
    mz /= len;

    const sin = Math.sin(player.yaw);
    const cos = Math.cos(player.yaw);
    const dx = (mx * cos - mz * sin) * speed * dt;
    const dz = (mx * sin + mz * cos) * speed * dt;

    player.vy -= 24 * dt;

    if (keys['Space'] && player.onGround) {
      player.vy = 8.5;
      player.onGround = false;
    }

    // Axis-separated collision
    player.x += dx;
    let box = playerAABB();
    if (collidesAABB(box)) player.x -= dx;

    player.z += dz;
    box = playerAABB();
    if (collidesAABB(box)) player.z -= dz;

    player.y += player.vy * dt;
    box = playerAABB();
    if (collidesAABB(box)) {
      if (player.vy < 0) player.onGround = true;
      player.y -= player.vy * dt;
      player.vy = 0;
      box = playerAABB();
      if (collidesAABB(box)) {
        player.y += 0.1;
      }
    } else {
      player.onGround = false;
    }

    // Safe reset if fallen
    if (player.y < -5) {
      respawnPlayer(false);
      player.y = getGroundHeight(player.x, player.z) + 0.01;
    }

    // Bobbing for FP view
    if (fpViewGroup && player.onGround && (forward || back || left || right)) {
      fpViewGroup.position.y = -0.25 + Math.sin(clock.elapsedTime * (player.sprint ? 14 : 10)) * 0.02;
    }
  }

  function updateCamera() {
    camera.position.set(player.x, player.y + player.height - 0.15, player.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
  }

  function detectZone() {
    for (const z of ZONES) {
      if (player.x >= z.minX && player.x < z.maxX) {
        if (z.id !== currentZoneId) {
          currentZoneId = z.id;
          const banner = document.getElementById('zone-banner');
          banner.textContent = z.name;
          banner.classList.add('show');
          setTimeout(() => banner.classList.remove('show'), 2800);
          document.getElementById('mission-text').textContent =
            z.id === 'arrivals'
              ? 'Explore the boulevard — Milestone 1'
              : `Reach: ${z.name}`;
        }
        break;
      }
    }
  }

  function drawMinimap() {
    const c = document.getElementById('minimap-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width;
    const h = c.height;
    ctx.fillStyle = '#102347';
    ctx.fillRect(0, 0, w, h);

    const scale = w / 150;
    const ox = 60;
    const oz = 0;

    ZONES.forEach((z, i) => {
      const colors = ['#168bff', '#28d9f2', '#f04bb8', '#7857ff', '#67dfa4'];
      ctx.fillStyle = colors[i];
      const x0 = (z.minX + ox) * scale;
      const x1 = (z.maxX + ox) * scale;
      ctx.fillRect(x0, h * 0.35, x1 - x0, h * 0.3);
    });

    ctx.fillStyle = '#ffc857';
    const px = (player.x + ox) * scale;
    const pz = (player.z + oz) * scale + h / 2;
    ctx.beginPath();
    ctx.arc(px, pz, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(0, 0, w, h);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!renderer) return;

    const dt = Math.min(clock.getDelta(), 0.05);

    if (state === 'playing') {
      movePlayer(dt);
      updateCamera();
      detectZone();
      updateScannerPulse(clock.elapsedTime);
      drawMinimap();

      if (tutorialTimer > 0) {
        tutorialTimer -= dt;
        if (tutorialTimer <= 0) {
          document.getElementById('tutorial-toast').classList.add('hidden');
        }
      }
    }

    renderer.render(scene, camera);
  }

  if (!initWebGL()) {
    console.error('WebGL init failed');
  }
})();
