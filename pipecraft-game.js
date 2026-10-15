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
    trim: 0xeef1f6,
    glass: 0x9fd4ff,
    kick: 0x24324f,
    kerb: 0xa7adb6,
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
    fillPlatform(-58, 92, -7, 7, 1, PALETTE.eventFloor);
    fillPlatform(-58, 92, -8, -8, 1, PALETTE.kerb);
    fillPlatform(-58, 92, 8, 8, 1, PALETTE.kerb);

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
      for (let h = 1; h <= 4; h++) {
        setSolid(x, h, -34, h === 4 ? PALETTE.successGreen : PALETTE.stone);
        setSolid(x, h, 34, h === 4 ? PALETTE.successGreen : PALETTE.stone);
      }
    }
    for (let z = -34; z <= 34; z++) {
      for (let h = 1; h <= 4; h++) {
        setSolid(-59, h, z, h === 4 ? PALETTE.successGreen : PALETTE.stone);
        setSolid(94, h, z, h === 4 ? PALETTE.successGreen : PALETTE.stone);
      }
    }

    // Locked gates (visual only for M1 — still walkable via path)
    buildGate(-27, 0, 'RESOURCE BRIDGE');
    buildGate(27, 0, 'DEAL GATE');
  }

  function buildSign(x, y, z, text, accent) {
    fillBox(x, y, z, x, y + 3, z, PALETTE.wood);
    fillBox(x + 1, y, z, x + 1, y + 3, z, PALETTE.wood);
    signRequests.push({ x, y, z, text, accent });
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
        const onX = Math.abs(x - cx) === 8;
        const onZ = Math.abs(z - cz) === 10;
        if (!onX && !onZ) continue;
        if (onX && !onZ && Math.abs(z - cz) <= 3) {
          setSolid(x, 8, z, PALETTE.trim);
          setSolid(x, 9, z, PALETTE.scannerCyan, { emissive: PALETTE.scannerCyan });
          continue;
        }
        const along = onX ? z - cz : x - cx;
        const column = (onX && onZ) || along % 4 === 0;
        if (column) {
          fillBox(x, 3, z, x, 9, z, PALETTE.trim);
        } else {
          setSolid(x, 3, z, PALETTE.kick);
          fillBox(x, 4, z, x, 7, z, PALETTE.glass);
          setSolid(x, 8, z, PALETTE.trim);
          setSolid(x, 9, z, PALETTE.scannerCyan, { emissive: PALETTE.scannerCyan });
        }
      }
    }
    fillBox(cx - 2, 10, cz - 2, cx + 2, 11, cz + 2, PALETTE.cloudWhite, { emissive: 0x168bff });
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
            setSolid(cx + x, y, cz + z, 0xe9e6dc);
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
    for (let y = 2; y <= 19; y++) {
      const ring = y % 4 === 2;
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        setSolid(x + dx, y, z + dz, ring ? PALETTE.trim : PALETTE.glass);
      }
    }
    fillBox(x - 1, 20, z - 1, x + 2, 22, z + 1, PALETTE.cloudWhite, { emissive: 0x168bff });
  }

  function buildGate(x, _z, label) {
    for (const z of [-5, 4]) {
      fillBox(x, 3, z, x, 8, z + 1, PALETTE.trim);
      setSolid(x, 9, z, PALETTE.dealGold, { emissive: 0xffc857 });
      setSolid(x, 9, z + 1, PALETTE.dealGold, { emissive: 0xffc857 });
    }
    fillBox(x, 8, -3, x, 8, 3, PALETTE.trim);
    gateRequests.push({ x, label });
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

  // --- World detail: textured blocks, sky, skyline, signage, screens, props, crowd ---
  const signRequests = [];
  const gateRequests = [];
  const detailAnimated = [];

  const BLOCK_STYLE = new Map([
    [PALETTE.grass, 'grass'],
    [PALETTE.stone, 'stone'],
    [PALETTE.eventFloor, 'tile'],
    [PALETTE.wood, 'planks'],
    [PALETTE.cloudWhite, 'cloud'],
    [PALETTE.scannerCyan, 'path'],
    [PALETTE.glass, 'glass'],
    [PALETTE.trim, 'trim'],
    [PALETTE.kick, 'panel'],
    [PALETTE.kerb, 'kerb'],
    [PALETTE.loungeMagenta, 'fabric'],
    [PALETTE.successGreen, 'leaves'],
    [PALETTE.dealGold, 'gold'],
    [PALETTE.portalPurple, 'panel'],
    [PALETTE.arenaNavy, 'panel'],
  ]);

  function paintBlock(style, color, rand) {
    return (g, W, H) => {
      switch (style) {
        case 'grassTop':
          noise(g, W, H, 0x5fae4e, 0.28, rand);
          for (let i = 0; i < 10; i++) px(g, Math.floor(rand() * W), Math.floor(rand() * H), 0x7cc95f);
          break;
        case 'grassSide':
          noise(g, W, H, 0x8a5a33, 0.25, rand);
          for (let i = 0; i < 6; i++) px(g, Math.floor(rand() * W), 6 + Math.floor(rand() * 9), 0x6e4526);
          noise(g, W, 3, 0x5fae4e, 0.25, rand);
          for (let x = 0; x < W; x++) if (rand() > 0.45) px(g, x, 3, 0x4f9a40, 1, 1 + Math.floor(rand() * 2));
          break;
        case 'dirt':
          noise(g, W, H, 0x8a5a33, 0.25, rand);
          break;
        case 'stone':
          noise(g, W, H, 0x8f949b, 0.18, rand);
          [[0, 0, 7, 5], [7, 0, 9, 6], [0, 5, 5, 6], [5, 6, 6, 5], [11, 6, 5, 5], [0, 11, 8, 5], [8, 11, 8, 5]].forEach(([x, y, w, h]) => {
            px(g, x, y + h - 1, 0x5c6168, w, 1);
            px(g, x + w - 1, y, 0x5c6168, 1, h);
            px(g, x, y, 0xb0b5bc, w - 1, 1);
          });
          break;
        case 'tile':
          noise(g, W, H, 0xdfe3ea, 0.06, rand);
          px(g, 0, 0, 0xc2c8d2, W, 1);
          px(g, 0, 8, 0xc2c8d2, W, 1);
          px(g, 0, 0, 0xc2c8d2, 1, H);
          px(g, 8, 0, 0xc2c8d2, 1, H);
          px(g, 2, 2, 0xf4f6fa, 3, 1);
          break;
        case 'trim':
          noise(g, W, H, color, 0.04, rand);
          px(g, 0, 0, 0xffffff, W, 1);
          px(g, 0, H - 1, 0xc9cfd8, W, 1);
          px(g, 7, 0, 0xdde2ea, 2, H);
          break;
        case 'kerb':
          noise(g, W, H, color, 0.12, rand);
          px(g, 0, 7, css(color, 0.75), W, 1);
          px(g, 5, 0, css(color, 0.75), 1, 7);
          px(g, 11, 8, css(color, 0.75), 1, 8);
          break;
        case 'planks':
          noise(g, W, H, 0x9a6b3a, 0.15, rand);
          for (let y = 3; y < H; y += 4) px(g, 0, y, 0x6b4423, W, 1);
          px(g, 5, 0, 0x6b4423, 1, 3);
          px(g, 11, 4, 0x6b4423, 1, 3);
          px(g, 3, 8, 0x6b4423, 1, 3);
          px(g, 9, 12, 0x6b4423, 1, 3);
          break;
        case 'cloud':
          noise(g, W, H, 0xeef8ff, 0.05, rand);
          px(g, 0, H - 2, 0xcfe6fb, W, 2);
          px(g, 3, 4, 0xffffff, 6, 3);
          break;
        case 'path':
          noise(g, W, H, 0x1fb8d6, 0.08, rand);
          for (let i = 0; i < 5; i++) {
            px(g, 4 + i, 3 + i, 0xbaf6ff, 2, 1);
            px(g, 4 + i, 12 - i, 0xbaf6ff, 2, 1);
          }
          px(g, 0, 0, 0x0f8aa6, W, 1);
          break;
        case 'glass':
          noise(g, W, H, color, 0.06, rand);
          px(g, 0, 0, css(color, 1.35), W, 1);
          px(g, 0, 0, css(color, 1.35), 1, H);
          px(g, 0, H - 1, css(color, 0.65), W, 1);
          px(g, W - 1, 0, css(color, 0.65), 1, H);
          for (let i = 0; i < 6; i++) px(g, 3 + i, 10 - i, css(color, 1.5));
          break;
        case 'fabric':
          noise(g, W, H, color, 0.1, rand);
          for (let y = 1; y < H; y += 4) for (let x = (y % 8 === 1 ? 1 : 3); x < W; x += 4) px(g, x, y, css(color, 0.75));
          break;
        case 'leaves':
          noise(g, W, H, 0x3f9a4a, 0.35, rand);
          for (let i = 0; i < 12; i++) px(g, Math.floor(rand() * W), Math.floor(rand() * H), 0x83d36b);
          break;
        case 'gold':
          noise(g, W, H, color, 0.12, rand);
          px(g, 2, 2, 0xfff3c4, 4, 1);
          px(g, 2, 2, 0xfff3c4, 1, 4);
          px(g, 0, H - 1, css(color, 0.7), W, 1);
          break;
        case 'panel':
          noise(g, W, H, color, 0.1, rand);
          px(g, 0, 0, css(color, 1.5), W, 1);
          px(g, 0, 7, css(color, 0.7), W, 1);
          px(g, 3, 3, css(color, 1.8));
          px(g, 11, 11, css(color, 1.8));
          break;
        default:
          noise(g, W, H, color, 0.14, rand);
          px(g, 0, 0, css(color, 1.2), W, 1);
          px(g, 0, 0, css(color, 1.2), 1, H);
          px(g, 0, H - 1, css(color, 0.72), W, 1);
          px(g, W - 1, 0, css(color, 0.72), 1, H);
      }
    };
  }

  function blockMaterial(color, emissive) {
    const style = BLOCK_STYLE.get(color) || 'default';
    const rand = makeRng(color + 17);
    const mk = (st) => {
      const map = canvasTex(16, 16, paintBlock(st, color, rand));
      return new THREE.MeshStandardMaterial({
        map,
        emissive: emissive ? 0xffffff : 0x000000,
        emissiveMap: emissive ? map : null,
        emissiveIntensity: emissive ? 0.35 : 0,
        roughness: style === 'glass' || style === 'gold' ? 0.25 : 0.88,
        transparent: style === 'glass',
        opacity: style === 'glass' ? 0.5 : 1,
        depthWrite: style !== 'glass',
        metalness: style === 'gold' ? 0.35 : 0.02,
      });
    };
    if (style === 'grass') {
      const side = mk('grassSide');
      return [side, side, mk('grassTop'), mk('dirt'), side, side];
    }
    return mk(style);
  }

  function textPanelTexture(lines, opts = {}) {
    const W = opts.width || 512;
    const H = opts.height || 160;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, opts.bgTop || '#1f8fff');
    bg.addColorStop(1, opts.bgBottom || '#0b4fb3');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = opts.border || '#ffffff';
    g.lineWidth = Math.max(4, H * 0.04);
    g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
    if (opts.cloud) {
      g.fillStyle = '#ffffff';
      const cx = H * 0.55;
      const cy = H * 0.5;
      const r = H * 0.18;
      [[-0.9, 0.2, 0.9], [0, -0.25, 1.15], [0.95, 0.15, 0.9], [0, 0.35, 0.9]].forEach(([dx, dy, s]) => {
        g.beginPath();
        g.arc(cx + dx * r, cy + dy * r, r * s, 0, Math.PI * 2);
        g.fill();
      });
    }
    g.fillStyle = opts.color || '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const left = opts.cloud ? H * 0.5 : 0;
    lines.forEach((line, i) => {
      const size = i === 0 ? (opts.size || H * 0.36) : (opts.subSize || H * 0.17);
      g.font = `${i === 0 ? 900 : 600} ${size}px "Segoe UI", system-ui, sans-serif`;
      const y = lines.length === 1 ? H / 2 : H * (0.36 + i * 0.36);
      g.fillText(line, W / 2 + left / 2, y, W - left - 30);
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  function panel(scene, w, h, tex, x, y, z, rotY = 0, glow = 0.55, depth = 0.2) {
    const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow, roughness: 0.5 });
    const edge = new THREE.MeshStandardMaterial({ color: 0x1a2236, roughness: 0.6 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), [edge, edge, edge, edge, face, face]);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    scene.add(m);
    return m;
  }

  function decorBox(scene, w, h, d, color, x, y, z, opts = {}) {
    const mat = opts.material || new THREE.MeshStandardMaterial({
      color, emissive: opts.emissive || 0, emissiveIntensity: opts.emissive ? 0.8 : 0, roughness: opts.rough ?? 0.8, metalness: opts.metal || 0,
    });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (opts.rotY) m.rotation.y = opts.rotY;
    m.castShadow = !opts.noShadow;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  function buildSky(scene) {
    const sky = canvasTex(4, 256, (g, W, H) => {
      const grad = g.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#3d8eea');
      grad.addColorStop(0.55, '#8cc8ff');
      grad.addColorStop(1, '#dff1ff');
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
    });
    sky.magFilter = THREE.LinearFilter;
    sky.minFilter = THREE.LinearFilter;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(320, 24, 16), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false, depthWrite: false }));
    dome.position.set(15, -40, 0);
    scene.add(dome);
    scene.fog = new THREE.Fog(0xcfe8ff, 70, 230);
    renderer.setClearColor(0xbfe0ff);

    // Voxel clouds
    const rand = makeRng(42);
    const cloudGeo = new THREE.BoxGeometry(1, 1, 1);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 1 });
    const cubes = [];
    for (let c = 0; c < 14; c++) {
      const cx = -90 + rand() * 210;
      const cz = -90 + rand() * 180;
      const cy = 42 + rand() * 18;
      const n = 5 + Math.floor(rand() * 5);
      for (let i = 0; i < n; i++) cubes.push([cx + (rand() - 0.5) * 14, cy + (rand() - 0.5) * 2, cz + (rand() - 0.5) * 7, 4 + rand() * 6, 2 + rand() * 2, 4 + rand() * 5]);
    }
    const clouds = new THREE.InstancedMesh(cloudGeo, cloudMat, cubes.length);
    const m4 = new THREE.Matrix4();
    cubes.forEach(([x, y, z, sx, sy, sz], i) => {
      m4.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz));
      clouds.setMatrixAt(i, m4);
    });
    scene.add(clouds);
    detailAnimated.push((t) => { clouds.position.x = Math.sin(t * 0.02) * 8; });
  }

  function buildSkyline(scene) {
    const rand = makeRng(7);
    const windows = (base) => canvasTex(16, 32, (g, W, H) => {
      noise(g, W, H, base, 0.06, rand);
      for (let y = 2; y < H - 1; y += 4) {
        for (let x = 2; x < W - 1; x += 4) px(g, x, y, rand() > 0.35 ? 0xbfe3ff : 0x5b7aa6, 2, 2);
      }
    });
    const tints = [0x55657f, 0x6b7f9e, 0x3f4f6b, 0x7d8da8, 0x4b5f86];
    const mats = tints.map((c) => new THREE.MeshStandardMaterial({ map: windows(c), roughness: 0.7 }));
    const place = (x, z, w, d, h) => {
      const mat = mats[Math.floor(rand() * mats.length)].clone();
      mat.map = mat.map.clone();
      mat.map.needsUpdate = true;
      mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
      mat.map.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 6)));
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(x, h / 2, z);
      scene.add(b);
      if (rand() > 0.6) decorBox(scene, w * 0.6, 2, d * 0.6, 0x9aa7bd, x, h + 1, z, { noShadow: true });
    };
    for (let x = -100; x <= 130; x += 7 + rand() * 5) {
      place(x, -62 - rand() * 25, 5 + rand() * 6, 5 + rand() * 6, 14 + rand() * 38);
      place(x + 3, 62 + rand() * 25, 5 + rand() * 6, 5 + rand() * 6, 12 + rand() * 30);
    }
    for (let z = -50; z <= 50; z += 9 + rand() * 6) {
      place(-90 - rand() * 15, z, 6 + rand() * 5, 6 + rand() * 5, 12 + rand() * 26);
      place(125 + rand() * 15, z, 6 + rand() * 5, 6 + rand() * 5, 12 + rand() * 26);
    }
  }

  function buildSigns(scene) {
    signRequests.forEach(({ x, y, z, text, accent }) => {
      const hex = `#${accent.toString(16).padStart(6, '0')}`;
      const tex = textPanelTexture([text], { bgTop: hex, bgBottom: '#102347', size: 62, cloud: true });
      panel(scene, 6, 1.9, tex, x + 1, y + 4.6, z + 0.5, 0, 0.45, 0.3);
    });

    // Wayfinding signpost near spawn (like the quest signpost in the key art)
    const post = { x: -47.5, z: -7.5 };
    decorBox(scene, 0.3, 5.5, 0.3, 0x6b4423, post.x, 4.75, post.z);
    [['EXPO HALL  ›', '#168bff'], ['PIPELINE LOUNGE  ›', '#f04bb8'], ['KEYNOTE ARENA  ›', '#7857ff'], ['CLOUD GARDENS  ›', '#2fa36b']].forEach(([label, col], i) => {
      const tex = textPanelTexture([label], { bgTop: col, bgBottom: col, size: 44, height: 96, width: 512 });
      wayfindingPanels.push(panel(scene, 3.2, 0.6, tex, post.x + 1.4, 6.8 - i * 0.75, post.z + 0.2, 0, 0.4, 0.12));
    });
  }

  function buildScreens(scene) {
    // Keynote main screens (both faces of the stage wall)
    const keynote = textPanelTexture(['PIPELINE 360', 'Every lead. Every deal. One world.'], { bgTop: '#3a1d8f', bgBottom: '#0d1a4a', cloud: true, width: 1024, height: 360 });
    panel(scene, 12.6, 4.6, keynote, 50.5, 6.4, 0.5, 0, 0.9, 3.2);
    const side = textPanelTexture(['WORLD TOUR', 'London · The O2'], { bgTop: '#168bff', bgBottom: '#102347', cloud: true, width: 768, height: 300 });
    panel(scene, 6, 2.6, side, 40, 7.5, 9, Math.PI / 6, 0.8);
    panel(scene, 6, 2.6, side, 61, 7.5, 9, -Math.PI / 6, 0.8);

    // Expo hall big screen + booth screens
    const expo = textPanelTexture(['TRAILBLAZER EXPO', 'Scan attendees · Collect resources · Craft deals'], { bgTop: '#168bff', bgBottom: '#0b2f6b', cloud: true, width: 1024, height: 320 });
    panel(scene, 9, 3, expo, -19.5, 6.2, -8.85, 0, 0.8);
    panel(scene, 9, 3, expo, -19.5, 6.2, 9.85, Math.PI, 0.8);

    const lounge = textPanelTexture(['PIPELINE LOUNGE', 'Craft the right deal'], { bgTop: '#f04bb8', bgBottom: '#5a1a5e', width: 768, height: 260 });
    panel(scene, 6, 2, lounge, 8, 6.5, -11, 0, 0.7);
  }

  function buildExpoInterior(scene) {
    const truss = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.6, metalness: 0.5 });
    const lamp = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d6, emissiveIntensity: 1.2 });
    for (let z = -8; z <= 8; z += 4) decorBox(scene, 16, 0.25, 0.25, 0, -20, 9.6, z + 0.5, { material: truss, noShadow: true });
    for (let x = -27; x <= -13; x += 7) decorBox(scene, 0.25, 0.25, 20, 0, x + 0.5, 9.85, 0.5, { material: truss, noShadow: true });
    for (let x = -26; x <= -14; x += 4) {
      for (let z = -8; z <= 8; z += 8) decorBox(scene, 0.3, 0.25, 0.3, 0, x + 0.5, 9.35, z + 0.5, { material: lamp, noShadow: true });
    }
    const spot = new THREE.PointLight(0xfff1d0, 0.9, 26);
    spot.position.set(-20, 9, 0);
    scene.add(spot);

    // Hanging round product signs
    [['AI AGENTS', '#7857ff', -24, -4], ['DATA', '#168bff', -16, -4], ['SERVICE', '#2fa36b', -24, 5], ['SLACK', '#f04bb8', -16, 5]].forEach(([label, col, x, z]) => {
      const tex = textPanelTexture([label], { bgTop: '#ffffff', bgBottom: '#e6f1ff', color: col, border: col, size: 70, width: 256, height: 256 });
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.2, 20), [
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
        new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 }),
        new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 }),
      ]);
      disc.rotation.x = Math.PI / 2;
      disc.position.set(x + 0.5, 7.6, z + 0.5);
      scene.add(disc);
      decorBox(scene, 0.04, 1.6, 0.04, 0x222222, x + 0.5, 9.2, z + 0.5, { noShadow: true });
      detailAnimated.push((t) => { disc.rotation.z = t * 0.4 + x; });
    });

    // Demo pods: round counters with screens
    [[-25, 6], [-15, 7], [-25, -8], [-15, -8]].forEach(([x, z], i) => {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xc8955a, roughness: 0.6 }));
      top.position.set(x + 0.5, 4.05, z + 0.5);
      scene.add(top);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 1, 16), new THREE.MeshStandardMaterial({ color: 0x1c3563 }));
      base.position.set(x + 0.5, 3.5, z + 0.5);
      scene.add(base);
      const tex = textPanelTexture([['DEMO', 'DATA', 'AI', 'SERVICE'][i], 'Demo pod'], { bgTop: '#28d9f2', bgBottom: '#0b5fb3', width: 256, height: 160 });
      panel(scene, 0.9, 0.6, tex, x + 0.5, 4.5, z + 0.5, i * 0.8, 0.8, 0.05);
    });
  }

  function buildBoothDetails(scene) {
    [[-22, -14, '#7857ff', 'AGENT ZONE'], [-12, 14, '#168bff', 'DATA BAR']].forEach(([cx, cz, col, label]) => {
      const facing = cz < 0 ? 0 : Math.PI;
      const front = cz < 0 ? cz + 2 : cz - 2;
      decorBox(scene, 3, 1.1, 0.8, 0xc8955a, cx + 0.5, 3.55, front + 0.5, { rough: 0.6 });
      decorBox(scene, 1, 0.65, 0.05, 0x222a36, cx + 0.5, 4.45, front + 0.5);
      const tex = textPanelTexture([label], { bgTop: col, bgBottom: '#102347', size: 60, width: 512, height: 140 });
      panel(scene, 5, 1.2, tex, cx + 0.5, 7.4, cz + 0.5, facing, 0.7);
      // Banner flags
      [-2.6, 2.6].forEach((dx) => {
        decorBox(scene, 0.08, 4, 0.08, 0x333333, cx + 0.5 + dx, 4.5, front + 0.5);
        decorBox(scene, 0.6, 2.2, 0.05, parseInt(col.slice(1), 16), cx + 0.8 + dx, 5.2, front + 0.5, { emissive: parseInt(col.slice(1), 16) });
      });
    });
  }

  function buildKeynoteSeating(scene) {
    const rand = makeRng(99);
    const seats = [];
    const people = [];
    for (let row = 0; row < 7; row++) {
      for (let s = 0; s < 18; s++) {
        const x = 42 + s * 0.95;
        const z = 10 + row * 1.6;
        seats.push([x, z]);
        if (rand() < 0.8) people.push([x, z, rand()]);
      }
    }
    const seatMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), new THREE.MeshStandardMaterial({ color: 0x1c2333, roughness: 0.7 }), seats.length);
    const m4 = new THREE.Matrix4();
    seats.forEach(([x, z], i) => { m4.makeTranslation(x, 1.45, z); seatMesh.setMatrixAt(i, m4); });
    scene.add(seatMesh);

    const shirts = [0x168bff, 0xf5f5f5, 0x2f3138, 0x8cc8ff, 0x1d2b4f, 0xf04bb8, 0x67dfa4, 0xb59a6a];
    const skins = [C.skinLight, C.skinMid, C.skinTan, C.skinBrown, C.skinDark, C.skinDeep];
    const hairs = [C.hairBlack, C.hairBrown, C.hairBlonde, C.hairGrey, C.hairAuburn];
    const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), new THREE.MeshStandardMaterial({ roughness: 0.85 }), people.length);
    const head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), new THREE.MeshStandardMaterial({ roughness: 0.85 }), people.length);
    const hair = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.14, 0.4), new THREE.MeshStandardMaterial({ roughness: 0.9 }), people.length);
    const col = new THREE.Color();
    people.forEach(([x, z, r], i) => {
      m4.makeTranslation(x, 2.2, z + 0.1);
      body.setMatrixAt(i, m4);
      body.setColorAt(i, col.setHex(shirts[Math.floor(r * shirts.length)]));
      m4.makeTranslation(x, 2.7, z + 0.1);
      head.setMatrixAt(i, m4);
      head.setColorAt(i, col.setHex(skins[Math.floor((r * 37) % 1 * skins.length)]));
      m4.makeTranslation(x, 2.92, z + 0.12);
      hair.setMatrixAt(i, m4);
      hair.setColorAt(i, col.setHex(hairs[Math.floor((r * 91) % 1 * hairs.length)]));
    });
    scene.add(body, head, hair);
    detailAnimated.push((t) => {
      head.position.y = Math.sin(t * 2) * 0.02;
      hair.position.y = head.position.y;
    });

    // Stage lights
    [[43, 0x7857ff], [50, 0x28d9f2], [57, 0xf04bb8]].forEach(([x, color]) => {
      const light = new THREE.PointLight(color, 1.2, 22);
      light.position.set(x, 10, 4);
      scene.add(light);
      decorBox(scene, 0.4, 0.4, 0.4, color, x, 10.2, 4, { emissive: color, noShadow: true });
    });
    decorBox(scene, 20, 0.3, 0.3, 0x3a3f4a, 50.5, 10.5, 4, { metal: 0.5 });
  }

  function buildO2Masts(scene) {
    const yellow = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.5, metalness: 0.2 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = 42.5 + Math.cos(a) * 11;
      const z = -21.5 + Math.sin(a) * 11;
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.5, 16, 0.5), yellow);
      mast.position.set(x, 13, z);
      mast.rotation.z = Math.cos(a) * 0.12;
      mast.rotation.x = -Math.sin(a) * 0.12;
      scene.add(mast);
    }
  }

  function buildProps(scene) {
    const potMat = new THREE.MeshStandardMaterial({ color: 0xd9d4c7, roughness: 0.8 });
    const leafMat = blockMaterial(PALETTE.successGreen, 0);
    const plant = (x, z, y = 2) => {
      plantSpots.push({
        x, y, z,
        meshes: [
          decorBox(scene, 0.6, 0.6, 0.6, 0, x, y + 0.3, z, { material: potMat }),
          decorBox(scene, 0.9, 0.9, 0.9, 0, x, y + 1.05, z, { material: leafMat }),
          decorBox(scene, 0.5, 0.5, 0.5, 0, x + 0.15, y + 1.65, z - 0.1, { material: leafMat }),
        ],
      });
    };
    [[-56, -7], [-56, 7], [-30, -7], [-30, 7], [-1, -7], [-1, 7], [26, -7], [26, 7], [59, -7], [59, 7]].forEach(([x, z]) => plant(x + 0.5, z + 0.5));

    // Boulevard banners
    const cols = [0x168bff, 0xf04bb8, 0x7857ff, 0x28d9f2];
    let k = 0;
    for (let x = -54; x <= 88; x += 9) {
      [-9.5, 9.5].forEach((z) => {
        decorBox(scene, 0.12, 6, 0.12, 0x2b2f38, x, 4, z, { metal: 0.4 });
        const c = cols[k++ % cols.length];
        const flag = decorBox(scene, 0.9, 2.4, 0.06, c, x + 0.5, 5.5, z, { emissive: c });
        bannerFlags.push({ flag, x, z });
        detailAnimated.push((t) => { flag.rotation.y = Math.sin(t * 1.5 + x) * 0.15; });
      });
    }

    // Lounge café: round tables + stools, coffee cart, food stall
    const tableTop = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
    [[0, 6], [4, -7], [16, 7], [12, -7]].forEach(([x, z]) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 14), tableTop);
      t.position.set(x + 0.5, 3.05, z + 0.5);
      scene.add(t);
      decorBox(scene, 0.12, 1, 0.12, 0x333333, x + 0.5, 2.5, z + 0.5);
      [[-1, 0], [1, 0]].forEach(([dx]) => decorBox(scene, 0.45, 0.6, 0.45, 0xf04bb8, x + 0.5 + dx, 2.3, z + 0.5));
    });
    decorBox(scene, 2.2, 1.2, 1, 0x6b4423, 21.5, 2.6, -2.5);
    decorBox(scene, 2.6, 0.12, 1.4, 0x2fa36b, 21.5, 4.6, -2.5);
    decorBox(scene, 0.1, 1.5, 0.1, 0x333333, 20.4, 3.8, -2.5);
    decorBox(scene, 0.1, 1.5, 0.1, 0x333333, 22.6, 3.8, -2.5);
    panel(scene, 2, 0.5, textPanelTexture(['COFFEE'], { bgTop: '#6b4423', bgBottom: '#3a2416', size: 80, width: 384, height: 112 }), 21.5, 5, -1.8, 0, 0.6, 0.06);
    decorBox(scene, 2.4, 1.2, 1.2, 0xd63c3c, 24.5, 2.6, 8.5);
    panel(scene, 2.2, 0.5, textPanelTexture(['STREET FOOD'], { bgTop: '#d63c3c', bgBottom: '#7a1c1c', size: 64, width: 384, height: 112 }), 24.5, 4.2, 7.85, Math.PI, 0.6, 0.06);

    // Hot-air balloon by the floating island
    const balloon = new THREE.Group();
    const blue = new THREE.MeshStandardMaterial({ color: 0x168bff, roughness: 0.5 });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    [[1.6, 0], [2.6, 1], [3.2, 2], [3.4, 3], [3.2, 4], [2.6, 5], [1.6, 6]].forEach(([r, y]) => {
      const layer = new THREE.Mesh(new THREE.BoxGeometry(r * 2, 1, r * 2), y === 3 ? white : blue);
      layer.position.y = y;
      balloon.add(layer);
    });
    const basket = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), new THREE.MeshStandardMaterial({ color: 0x8a5a33 }));
    basket.position.y = -2.4;
    balloon.add(basket);
    balloon.position.set(66, 30, 24);
    scene.add(balloon);
    detailAnimated.push((t) => { balloon.position.y = 30 + Math.sin(t * 0.4) * 1.2; balloon.rotation.y = t * 0.05; });
  }

  function buildGateSigns(scene) {
    gateRequests.forEach(({ x, label }) => {
      const tex = textPanelTexture([label], { bgTop: '#ffc857', bgBottom: '#c98a1a', color: '#102347', size: 58, width: 640, height: 128 });
      panel(scene, 6.4, 1.3, tex, x + 0.5, 9.6, 0.5, Math.PI / 2, 0.5, 0.25);
    });
  }

  function buildGroundCover(scene) {
    const rand = makeRng(321);
    const spots = [];
    for (let i = 0; i < 900; i++) {
      const x = -57 + rand() * 149;
      const z = (rand() > 0.5 ? 1 : -1) * (10 + rand() * 23);
      if (isSolidAt(x, 1, z) || !isSolidAt(x, 0, z)) continue;
      spots.push([x, z, rand()]);
    }
    const flowerCols = [0xf04bb8, 0xffc857, 0xffffff, 0x7857ff, 0xff6b6b, 0x8cc8ff];
    const tuft = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), new THREE.MeshStandardMaterial({ roughness: 1 }), spots.length);
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    spots.forEach(([x, z, r], i) => {
      const flower = r > 0.7;
      m4.makeTranslation(x, 1.17 + (flower ? 0.05 : 0), z);
      tuft.setMatrixAt(i, m4);
      tuft.setColorAt(i, col.setHex(flower ? flowerCols[Math.floor(r * 97) % flowerCols.length] : (r > 0.35 ? 0x4f9a40 : 0x6fbf55)));
    });
    scene.add(tuft);
  }

  const wayfindingPanels = [];
  const bannerFlags = [];
  const plantSpots = [];

  function buildWorldDetails(scene) {
    buildGateSigns(scene);
    buildGroundCover(scene);
    buildSky(scene);
    buildSkyline(scene);
    buildSigns(scene);
    buildScreens(scene);
    buildExpoInterior(scene);
    buildBoothDetails(scene);
    buildKeynoteSeating(scene);
    buildO2Masts(scene);
    buildProps(scene);
  }

  function updateWorldDetails(t) {
    for (const fn of detailAnimated) fn(t);
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
    try {
      localStorage.setItem('pipecraft-settings', JSON.stringify(settings));
    } catch (_) { /* storage blocked in sandboxed previews */ }
  }

  const SAVE_KEY = 'pipecraft-save';
  let sessionStarted = false;

  const SCORE = {
    qualify: 100,
    streakStep: 25,
    streakCap: 10,
    streakWindow: 45,
    leadsPerOpp: 3,
    oppBase: 500,
    oppStep: 250,
    scanRange: 4.5,
    scanCone: 0.5,
  };
  const OPPORTUNITY_NAMES = [
    'Slack Enterprise Grid',
    'Agentforce in Slack',
    'Slack AI Add-on',
    'Slack Connect Expansion',
    'Workflow Builder Automation',
    'Salesforce Channels Rollout',
    'Huddles & Clips Adoption',
    'Canvas + Lists Transformation',
  ];
  const RIVALS = [
    { name: 'Niamh May', score: 2400, color: '#e01e5a' },
    { name: 'Lachlan Birt', score: 1750, color: '#2eb67d' },
    { name: 'Daniela Saunders', score: 1200, color: '#ecb22e' },
    { name: 'Joe Connolly', score: 800, color: '#36c5f0' },
    { name: 'Nasreen Khan', score: 350, color: '#9b59b6' },
  ];
  const progress = { score: 0, leads: 0, pipeline: 0, streak: 0, opps: 0, steps: 0, culture: 0, feed: [] };
  const CULTURE = { colleague: 25, mascot: 50, cooldown: 20 };
  const CULTURE_MOMENTS = ['High five', 'Coffee catch-up', 'Celebrated a win', 'Swapped Trailhead badges', 'Shared a customer story', 'Quick huddle'];
  const SALESFORCE_ROLES = new Set(['Event Staff', 'Sales Executive', 'Solution Engineer', 'Product Manager', 'Marketing', 'Success Manager', 'Stage Host', 'Tech Support']);
  const isColleague = (def) => Boolean(def.team || def.kind || SALESFORCE_ROLES.has(def.role));
  const STRIDE = 0.75;
  const STEP_MILESTONE = 1000;
  let strideDistance = 0;
  let toastTimer = 0;
  let unlockTimer = 0;
  let lastQualifyAt = -Infinity;

  function resetProgress() {
    Object.assign(progress, { score: 0, leads: 0, pipeline: 0, streak: 0, opps: 0, steps: 0, culture: 0, feed: [] });
    npcs.forEach((n) => { n.cultureReadyAt = 0; });
    strideDistance = 0;
    npcs.forEach((n) => setQualified(n, false));
    lastQualifyAt = -Infinity;
    updateScoreHud();
    postToBoard('<b>Pipeline Bot</b><span class="sb-app">APP</span> Ash joined <b>#pipeline-scoreboard</b> 👋', false);
  }

  function boardStandings() {
    return [...RIVALS.map((r) => ({ ...r })), { name: 'Ash (you)', score: progress.score, color: '#1264a3', me: true }]
      .sort((a, b) => b.score - a.score || (a.me ? -1 : 1));
  }

  function renderBoard(bumpMe = false) {
    const standings = boardStandings();
    const myRank = standings.findIndex((s) => s.me);
    const shown = myRank < 5 ? standings.slice(0, 5) : [...standings.slice(0, 4), standings[myRank]];
    document.getElementById('sb-rows').innerHTML = shown.map((s) => {
      const rank = standings.indexOf(s) + 1;
      const initials = s.name.replace(' (you)', '').split(' ').map((w) => w[0]).join('').slice(0, 2);
      const medal = ['🥇', '🥈', '🥉'][rank - 1] || rank;
      return `<div class="sb-row${s.me ? ' me' : ''}${s.me && bumpMe ? ' bump' : ''}">` +
        `<span class="sb-rank">${medal}</span><span class="sb-ava" style="background:${s.color}">${initials}</span>` +
        `<span class="sb-name">${s.name}</span><span class="sb-pts">${s.score.toLocaleString('en-GB')}</span></div>`;
    }).join('');
    if (bumpMe) setTimeout(() => document.querySelector('.sb-row.me')?.classList.remove('bump'), 900);
    return myRank + 1;
  }

  function postToBoard(html, persist = true) {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const entry = `${html}<span class="sb-time">${time}</span>`;
    if (persist) progress.feed = [entry, ...progress.feed].slice(0, 3);
    const items = persist ? progress.feed : [entry, ...progress.feed].slice(0, 3);
    document.getElementById('sb-feed').innerHTML = items.map((m) => `<div class="sb-msg">${m}</div>`).join('');
  }

  function showOpportunityUnlock(opp) {
    document.getElementById('ou-title').textContent = opp.title;
    document.getElementById('ou-name').textContent = `${opp.account} · ${opp.role}`;
    document.getElementById('ou-meta').textContent = `Opportunity #${opp.number} · £${opp.value.toLocaleString('en-GB')} pipeline`;
    document.getElementById('ou-pts').textContent = `+${opp.bonus.toLocaleString('en-GB')} pts`;
    document.getElementById('opp-unlock').classList.add('show');
    unlockTimer = 3.2;
  }

  function setQualified(npc, qualified) {
    npc.qualified = qualified;
    npc.tag.material.color.set(qualified ? PALETTE.successGreen : npc.colleague ? PALETTE.glass : 0xffffff);
  }

  function updateScoreHud() {
    document.getElementById('score-value').textContent = progress.score.toLocaleString('en-GB');
    document.getElementById('pipeline-value').textContent = progress.pipeline.toLocaleString('en-GB');
    document.getElementById('leads-value').textContent = progress.leads;
    document.getElementById('streak-value').textContent = progress.streak;
    document.getElementById('deals-value').textContent = progress.opps;
    updateStepsHud();
    updateCultureHud();
    renderBoard();
  }

  function updateStepsHud() {
    document.getElementById('steps-value').textContent = progress.steps.toLocaleString('en-GB');
  }

  function countSteps(distance) {
    strideDistance += distance;
    if (strideDistance < STRIDE) return;
    const taken = Math.floor(strideDistance / STRIDE);
    strideDistance -= taken * STRIDE;
    const before = progress.steps;
    progress.steps += taken;
    updateStepsHud();
    if (Math.floor(progress.steps / STEP_MILESTONE) > Math.floor(before / STEP_MILESTONE)) {
      const milestone = Math.floor(progress.steps / STEP_MILESTONE) * STEP_MILESTONE;
      showToast(`${milestone.toLocaleString('en-GB')} STEPS! Keep networking`);
      postToBoard(`<b>Pipeline Bot</b><span class="sb-app">APP</span> 👟 Ash has walked <b>${milestone.toLocaleString('en-GB')} steps</b> around World Tour London`);
    }
  }

  function showToast(text, good = true) {
    const el = document.getElementById('score-toast');
    el.textContent = text;
    el.style.borderColor = good ? '' : '#8eb8dc';
    el.style.color = good ? '' : '#cde4ff';
    el.classList.remove('hidden');
    toastTimer = 1.6;
  }

  /** Colleagues aren't leads: interacting earns culture points (with a cooldown per person). */
  function interactWithColleague(npc) {
    const now = clock.elapsedTime;
    if (now < (npc.cultureReadyAt || 0)) {
      showToast(`You just caught up with ${npc.def.name} — say hi to someone else`, false);
      return;
    }
    npc.cultureReadyAt = now + CULTURE.cooldown;
    const points = npc.def.kind ? CULTURE.mascot : CULTURE.colleague;
    const moment = npc.def.kind ? 'Selfie' : CULTURE_MOMENTS[Math.floor(Math.random() * CULTURE_MOMENTS.length)];
    progress.culture += points;
    npc.heartTimer = 2.2;
    showToast(`❤️ +${points} CULTURE · ${moment} with ${npc.def.name}`);
    postToBoard(`<b>Ash</b> ❤️ ${moment.toLowerCase()} with <b>${npc.def.name}</b> · +${points} culture`);
    updateCultureHud();
    saveProgress();
  }

  function updateCultureHud() {
    document.getElementById('culture-value').textContent = progress.culture.toLocaleString('en-GB');
  }

  /** Scan the closest unqualified attendee in range and roughly in front of Ash. */
  function tryScan() {
    const fx = -Math.sin(player.yaw);
    const fz = -Math.cos(player.yaw);
    let best = null;
    let bestDist = Infinity;
    for (const npc of npcs) {
      const dx = npc.group.position.x - player.x;
      const dz = npc.group.position.z - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > SCORE.scanRange || dist < 0.01) continue;
      const angle = Math.acos(Math.max(-1, Math.min(1, (dx * fx + dz * fz) / dist)));
      if (angle < SCORE.scanCone && dist < bestDist) {
        best = npc;
        bestDist = dist;
      }
    }
    if (!best) {
      showToast('No attendee in scanner range', false);
      return;
    }
    if (best.colleague) {
      interactWithColleague(best);
      return;
    }
    if (best.qualified) {
      showToast(`${best.def.name} is already qualified`, false);
      return;
    }
    const now = clock.elapsedTime;
    const rankBefore = boardStandings().findIndex((s) => s.me);
    progress.streak = now - lastQualifyAt <= SCORE.streakWindow ? progress.streak + 1 : 1;
    lastQualifyAt = now;
    const points = SCORE.qualify
      + SCORE.streakStep * Math.min(progress.streak - 1, SCORE.streakCap)
      + Math.round(best.dealValue / 1000);
    setQualified(best, true);
    best.coinTimer = 2.5;
    progress.leads += 1;
    progress.score += points;
    progress.pipeline += best.dealValue;
    showToast(`LEAD QUALIFIED! ${best.def.name} · +${points}${progress.streak > 1 ? ` (streak ×${progress.streak})` : ''}`);
    postToBoard(`<b>Ash</b> qualified <b>${best.def.name}</b> (${best.def.role}) · +${points} 🎯`);

    if (progress.leads % SCORE.leadsPerOpp === 0) {
      progress.opps += 1;
      const bonus = SCORE.oppBase + SCORE.oppStep * (progress.opps - 1);
      const value = best.dealValue * 4;
      progress.score += bonus;
      progress.pipeline += value;
      const opp = {
        number: progress.opps,
        title: OPPORTUNITY_NAMES[(progress.opps - 1) % OPPORTUNITY_NAMES.length],
        account: best.def.name,
        role: best.def.role,
        value,
        bonus,
      };
      showOpportunityUnlock(opp);
      best.starTimer = 3.2;
      postToBoard(`<b>Pipeline Bot</b><span class="sb-app">APP</span> 🔓 New opportunity unlocked: <b>${opp.title}</b> · £${value.toLocaleString('en-GB')} · +${bonus} 🚀`);
    }

    updateScoreHud();
    const rankAfter = renderBoard(true) - 1;
    if (rankAfter < rankBefore) {
      const passed = boardStandings()[rankAfter + 1];
      postToBoard(`<b>Pipeline Bot</b><span class="sb-app">APP</span> 🏆 Ash overtook <b>${passed.name}</b> · now #${rankAfter + 1}`);
    }
    saveProgress();
  }

  function saveProgress() {
    if (!sessionStarted) return;
    try {
      const { x, y, z, yaw, pitch } = player;
      const qualified = npcs.filter((n) => n.qualified).map((n) => n.index);
      localStorage.setItem(SAVE_KEY, JSON.stringify({ x, y, z, yaw, pitch, zone: currentZoneId, progress, qualified }));
    } catch (_) { /* storage blocked in sandboxed previews */ }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function clearProgress() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (_) { /* ignore */ }
  }

  function updateTitleButtons() {
    const canResume = sessionStarted || loadProgress() !== null;
    document.getElementById('btn-continue').classList.toggle('hidden', !canResume);
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
    renderer.domElement.tabIndex = 0;
    renderer.domElement.style.outline = 'none';
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
    buildWorldDetails(scene);
    buildNpcs(scene);
    buildAshModel(scene);
    loadSheetArt();

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
      const mat = blockMaterial(color, emissive);
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
    const hemi = new THREE.HemisphereLight(0xd6ecff, 0x5b7a4a, 1.1);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.6);
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

    const blazerMat = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      map: canvasTex(8, 16, (g, W, H) => {
        noise(g, W, H, PALETTE.blazer, 0.35, makeRng(5));
        px(g, 0, 3, css(PALETTE.blazer, 1.6), W, 1);
        px(g, W - 2, 0, css(PALETTE.blazer, 0.6), 1, H);
      }),
    });
    const shirtMat = new THREE.MeshStandardMaterial({ color: PALETTE.white, roughness: 0.95 });
    const skinMat = new THREE.MeshStandardMaterial({ color: ASH_DEF.skin, roughness: 0.9 });
    const cyanMat = new THREE.MeshStandardMaterial({
      color: PALETTE.scannerCyan,
      emissive: PALETTE.scannerCyan,
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const blueMat = new THREE.MeshStandardMaterial({ color: PALETTE.worldTourBlue, roughness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf2f6fb, roughness: 0.5 });
    const screenMat = new THREE.MeshStandardMaterial({
      emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.3,
      emissiveMap: canvasTex(12, 8, (g, W, H) => {
        px(g, 0, 0, 0x0b5fb3, W, H);
        px(g, 3, 3, 0xffffff, 6, 3);
        px(g, 4, 2, 0xffffff, 2, 1);
        px(g, 6, 1, 0xffffff, 3, 2);
        px(g, 0, H - 1, PALETTE.scannerCyan, W, 1);
      }),
      map: null, color: 0x000000,
    });
    const add = (geo, mat, x, y, z, rx = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.x = rx;
      fpViewGroup.add(m);
      return m;
    };
    fpViewGroup.position.set(0.06, -0.14, 0);
    fpViewGroup.scale.setScalar(0.4);
    // Right forearm reaching forward, holding the Cloud Scanner
    add(new THREE.BoxGeometry(0.12, 0.12, 0.5), blazerMat, 0.3, -0.06, -0.3, 0.18);
    add(new THREE.BoxGeometry(0.13, 0.13, 0.05), shirtMat, 0.3, -0.01, -0.56, 0.18);
    add(new THREE.BoxGeometry(0.11, 0.11, 0.1), skinMat, 0.3, 0.01, -0.62, 0.18);
    add(new THREE.BoxGeometry(0.16, 0.13, 0.3), blueMat, 0.3, 0.07, -0.74, 0.18);
    add(new THREE.BoxGeometry(0.17, 0.05, 0.31), whiteMat, 0.3, 0.15, -0.73, 0.18);
    add(new THREE.BoxGeometry(0.13, 0.09, 0.02), screenMat, 0.3, 0.1, -0.9, 0.18);
    add(new THREE.BoxGeometry(0.05, 0.05, 0.05), cyanMat, 0.3, 0.12, -0.92, 0.18);
    // Left forearm low in view
    add(new THREE.BoxGeometry(0.12, 0.12, 0.42), blazerMat, -0.34, -0.14, -0.32, 0.3);
    add(new THREE.BoxGeometry(0.13, 0.13, 0.05), shirtMat, -0.34, -0.07, -0.54, 0.3);
    add(new THREE.BoxGeometry(0.11, 0.11, 0.1), skinMat, -0.34, -0.04, -0.6, 0.3);

    cam.add(fpViewGroup);
  }

  // --- Pixel-art texture helpers (painted at runtime: detailed look, tiny file size) ---
  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return (s % 100000) / 100000;
    };
  }

  function css(hex, f = 1) {
    const r = Math.max(0, Math.min(255, Math.round(((hex >> 16) & 255) * f)));
    const g = Math.max(0, Math.min(255, Math.round(((hex >> 8) & 255) * f)));
    const b = Math.max(0, Math.min(255, Math.round((hex & 255) * f)));
    return `rgb(${r},${g},${b})`;
  }

  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestMipmapLinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    return t;
  }

  function px(g, x, y, color, w = 1, h = 1) {
    g.fillStyle = typeof color === 'number' ? css(color) : color;
    g.fillRect(x, y, w, h);
  }

  function noise(g, w, h, base, amt, rand) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) px(g, x, y, css(base, 1 + (rand() - 0.5) * amt));
    }
  }

  // --- Characters (roles and looks follow the Pipecraft World Tour sprite sheet) ---
  const C = {
    skinLight: 0xf1c6a0, skinMid: 0xd09a6a, skinTan: 0xb97d50, skinBrown: 0xa86b45, skinDark: 0x7a4a2a, skinDeep: 0x5a3720,
    hairBlack: 0x17110d, hairDark: 0x2e1a12, hairBrown: 0x5a341c, hairAuburn: 0x9a3f1c, hairBlonde: 0xe9c46a, hairGrey: 0xb3b7bf, hairWhite: 0xf4f4f4,
    navy: 0x1d2b4f, charcoal: 0x2f3138, black: 0x17171c, grey: 0x6b7280, slate: 0x4a5568, white: 0xf5f5f5, denim: 0x3a5682, khaki: 0xb59a6a,
    sfBlue: 0x168bff, skyBlue: 0x8cc8ff, purple: 0x7d4fd8, hiVis: 0xd4f03c, hardHat: 0xf2c230, green: 0x2f8f4e, red: 0xd63c3c,
    pink: 0xf04bb8, bear: 0x8a5a32, bearLight: 0xe0bd90, gold: 0xffc857, teal: 0x1aa6a6,
  };

  const NPC_DEFS = [
    // Arrivals Boulevard
    { name: 'Rosa', role: 'Event Staff', at: [-52, 6], skin: C.skinTan, hair: C.hairBrown, hairStyle: 'bun', outfit: 'polo', top: C.navy, bottom: C.charcoal, extras: ['cap', 'mic'], idle: true },
    { name: 'Cloudy', role: 'Mascot', at: [-45, -5], kind: 'bear' },
    { name: 'Dev', role: 'Student', at: [-40, 5], skin: C.skinMid, hair: C.hairBlack, outfit: 'tee', top: C.white, bottom: C.denim, extras: ['backpack'] },
    { name: 'Kemi', role: 'Student', at: [-36, -5], skin: C.skinDeep, hair: C.hairBlack, hairStyle: 'curly', outfit: 'hoodie', top: C.sfBlue, bottom: C.denim, extras: ['backpack'] },
    { name: 'Marcus', role: 'Security', at: [-31, 6], skin: C.skinDark, hair: C.hairBlack, hairStyle: 'buzz', outfit: 'suit', top: C.black, shirt: C.white, bottom: C.black, extras: ['shades', 'earpiece'], idle: true },
    // Trailblazer Expo
    { name: 'Jake', role: 'Sales Executive', at: [-18, 4], skin: C.skinLight, hair: C.hairBrown, outfit: 'hoodie', top: C.sfBlue, bottom: C.charcoal, shoes: C.white },
    { name: 'Tunde', role: 'Solution Engineer', at: [-22, -5], skin: C.skinDeep, hair: C.hairBlack, hairStyle: 'buzz', outfit: 'blazer', top: C.charcoal, shirt: C.black, bottom: C.black, extras: ['glasses', 'beard', 'laptop'] },
    { name: 'Freya', role: 'Product Manager', at: [-14, -3], skin: C.skinLight, hair: C.hairBlonde, hairStyle: 'long', outfit: 'blazer', top: C.black, shirt: C.white, bottom: C.black, extras: ['tablet'] },
    { name: 'Dr. Ade', role: 'Healthcare', at: [-8, 5], skin: C.skinDark, hair: C.hairBlack, hairStyle: 'curly', outfit: 'labcoat', top: C.white, shirt: C.teal, bottom: C.navy, extras: ['tablet'] },
    { name: 'Helen', role: 'Public Sector', at: [-6, -6], skin: C.skinLight, hair: C.hairGrey, outfit: 'suit', top: C.slate, shirt: C.white, bottom: C.slate, extras: ['glasses', 'tablet'] },
    { name: 'Leo', role: 'Media', at: [-8, 10], skin: C.skinLight, hair: C.hairAuburn, hairStyle: 'long', outfit: 'tee', top: C.black, bottom: C.denim, extras: ['camera'] },
    { name: 'Sam', role: 'Tech Customer', at: [-25, -7], skin: C.skinBrown, hair: C.hairBlack, outfit: 'hoodie', top: C.sfBlue, bottom: C.denim, shoes: C.white },
    { name: 'Mia', role: 'Marketing', at: [-20, 7], skin: C.skinMid, hair: C.hairAuburn, hairStyle: 'bun', outfit: 'tee', top: C.purple, bottom: C.black, extras: ['tablet'] },
    // Pipeline Lounge
    { name: 'Priya', role: 'Retail Client', at: [5, 3], skin: C.skinTan, hair: C.hairAuburn, hairStyle: 'curly', outfit: 'tee', top: C.pink, bottom: C.navy, extras: ['bag'] },
    { name: 'Oliver', role: 'Financial Services', at: [10, -5], skin: C.skinLight, hair: C.hairBrown, outfit: 'suit', top: C.navy, shirt: C.white, bottom: C.navy, extras: ['glasses', 'tie'] },
    { name: 'Raj', role: 'Manufacturing', at: [14, 5], skin: C.skinTan, hair: C.hairBlack, outfit: 'vest', top: C.hiVis, shirt: C.navy, bottom: C.charcoal, extras: ['hardhat', 'beard'] },
    { name: 'Chen', role: 'Partner', at: [2, -6], skin: C.skinMid, hair: C.hairBlack, outfit: 'suit', top: C.charcoal, shirt: C.white, bottom: C.charcoal, extras: ['beard', 'tie'] },
    { name: 'Mo', role: 'Barista', at: [21, -4], skin: C.skinMid, hair: C.hairBlack, outfit: 'apron', top: C.white, bottom: C.charcoal, extras: ['coffee'], idle: true },
    { name: 'Gino', role: 'Food Vendor', at: [24, 7], skin: C.skinLight, hair: C.hairBrown, outfit: 'apron', top: C.white, bottom: C.navy, extras: ['cap'], idle: true },
    // Keynote Arena
    { name: 'Nia', role: 'Success Manager', at: [36, -6], skin: C.skinDark, hair: C.hairBlack, hairStyle: 'curly', outfit: 'hoodie', top: C.skyBlue, bottom: C.navy, extras: ['headset'] },
    { name: 'Victor', role: 'VIP', at: [37, 5], skin: C.skinDark, hair: C.hairBlack, hairStyle: 'buzz', outfit: 'suit', top: C.black, shirt: C.black, bottom: C.black, extras: ['shades'] },
    { name: 'Margaret', role: 'Analyst', at: [33, -2], skin: C.skinLight, hair: C.hairGrey, hairStyle: 'bun', outfit: 'blazer', top: C.grey, shirt: C.white, bottom: C.charcoal, extras: ['glasses', 'tablet'] },
    { name: 'Max', role: 'Stage Host', at: [46, 3], skin: C.skinLight, hair: C.hairBrown, outfit: 'blazer', top: C.purple, shirt: C.black, bottom: C.black, extras: ['mic'] },
    { name: 'Prof. Spark', role: 'AI Guide', at: [53, -3], kind: 'guide' },
    // Cloud Gardens
    { name: 'Ana', role: 'Tech Support', at: [64, 5], skin: C.skinMid, hair: C.hairBrown, hairStyle: 'long', outfit: 'polo', top: C.sfBlue, bottom: C.navy, extras: ['headset', 'laptop'] },
    { name: 'Theo', role: 'Attendee', at: [72, -3], skin: C.skinDeep, hair: C.hairBlack, outfit: 'tee', top: C.green, bottom: C.denim },
    { name: 'Zara', role: 'VIP', at: [76, 4], skin: C.skinTan, hair: C.hairBlack, hairStyle: 'curly', outfit: 'blazer', top: C.white, shirt: C.gold, bottom: C.khaki, extras: ['shades', 'earrings'] },
    { name: 'Cloudy', role: 'Mascot', at: [82, -3], kind: 'bear' },
    // World Tour team (from the cover lineup): colleagues, not leads — their badges are never scanned.
    { name: 'Miroshen', role: 'World Tour Team', team: true, sprite: 'solutionEng', at: [-50, 3], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Niall', role: 'World Tour Team', team: true, sprite: 'salesExec', at: [-42, -3], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Niamh', role: 'World Tour Team', team: true, sprite: 'retail', at: [-34, 4], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Samm', role: 'World Tour Team', team: true, sprite: 'manufacturing', at: [-26, -2], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Daniela', role: 'World Tour Team', team: true, sprite: 'marketing', at: [-15, 3], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Lachlan', role: 'World Tour Team', team: true, sprite: 'media', at: [-8, -4], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Joe', role: 'World Tour Team', team: true, sprite: 'successMgr', at: [2, 3], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Nasreen', role: 'World Tour Team', team: true, sprite: 'productMgr', at: [10, -3], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Alwyn', role: 'World Tour Team', team: true, sprite: 'eventStaff', at: [18, 4], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Aluyur', role: 'World Tour Team', team: true, sprite: 'student', at: [30, -4], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Mayur', role: 'World Tour Team', team: true, sprite: 'partner', at: [36, 3], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Ben', role: 'World Tour Team', team: true, sprite: 'techCustomer', at: [46, -5], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Elvige', role: 'World Tour Team', team: true, sprite: 'healthcare', at: [55, 4], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
    { name: 'Ollie', role: 'World Tour Team', team: true, sprite: 'finServ', at: [64, -3], skin: C.skinMid, hair: C.hairBrown, outfit: 'blazer', top: C.navy, bottom: C.charcoal, extras: [] },
  ];

  const ASH_DEF = {
    name: 'Ash', role: 'RVP', skin: C.skinBrown, hair: C.hairDark, hairStyle: 'curly', outfit: 'blazer',
    top: 0x1a1a22, shirt: C.white, bottom: 0x1a1a22, extras: ['earrings', 'scanner'], eyes: 0x3b2314,
  };

  const npcs = [];
  const npcGeoCache = new Map();
  const PXM = 34; // texture pixels per metre on character boxes

  function boxGeo(w, h, d) {
    const key = `${w}_${h}_${d}`;
    if (!npcGeoCache.has(key)) npcGeoCache.set(key, new THREE.BoxGeometry(w, h, d));
    return npcGeoCache.get(key);
  }

  /** Box with a painted texture per face: painters = {front, back, left, right, top, bottom}. */
  function paintedBox(w, h, d, painters, fallback) {
    const size = (a) => Math.max(2, Math.round(a * PXM));
    const face = (fn, fw, fh) => {
      const paint = fn || ((g, W, H) => px(g, 0, 0, fallback, W, H));
      return new THREE.MeshStandardMaterial({ map: canvasTex(size(fw), size(fh), paint), roughness: 0.9 });
    };
    const mats = [
      face(painters.right, d, h), face(painters.left, d, h),
      face(painters.top, w, d), face(painters.bottom, w, d),
      face(painters.front, w, h), face(painters.back, w, h),
    ];
    const m = new THREE.Mesh(boxGeo(w, h, d), mats);
    m.castShadow = true;
    return m;
  }

  function solidBox(w, h, d, color, x, y, z, emissive = 0) {
    const m = new THREE.Mesh(boxGeo(w, h, d), new THREE.MeshStandardMaterial({
      color, emissive, emissiveIntensity: emissive ? 0.6 : 0, roughness: 0.75,
    }));
    m.position.set(x, y, z);
    return m;
  }

  function hairNoise(g, x, y, w, h, hair, curly, rand) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const f = curly ? (((i + j) % 3 === 0) ? 0.72 : 1 + (rand() - 0.5) * 0.35) : 1 + (rand() - 0.5) * 0.18;
        px(g, x + i, y + j, css(hair, f));
      }
    }
  }

  function paintHead(def, seed) {
    const rand = makeRng(seed);
    const style = def.hairStyle || 'short';
    const curly = style === 'curly';
    const longHair = style === 'long' || curly;
    const skin = def.skin;
    const hair = def.hair;
    const extras = def.extras || [];
    const eyes = def.eyes || 0x2b1a10;

    const front = (g, W, H) => {
      noise(g, W, H, skin, 0.06, rand);
      if (style !== 'bald') {
        const fringe = style === 'buzz' ? 2 : style === 'bun' ? 3 : 4;
        hairNoise(g, 0, 0, W, fringe, hair, curly, rand);
        if (style !== 'buzz') {
          px(g, 0, fringe, css(hair, 0.9), 2, 2);
          px(g, W - 2, fringe, css(hair, 0.9), 2, 2);
        }
        if (longHair) {
          hairNoise(g, 0, fringe, 2, H - fringe, hair, curly, rand);
          hairNoise(g, W - 2, fringe, 2, H - fringe, hair, curly, rand);
        }
      }
      // brows, eyes, nose, mouth
      px(g, 3, 5, css(hair, 0.7), 3, 1);
      px(g, W - 6, 5, css(hair, 0.7), 3, 1);
      px(g, 3, 6, 0xffffff, 3, 2);
      px(g, W - 6, 6, 0xffffff, 3, 2);
      px(g, 4, 6, eyes, 2, 2);
      px(g, W - 5, 6, eyes, 2, 2);
      px(g, 4, 6, 0xffffff);
      px(g, W - 5, 6, 0xffffff);
      px(g, 7, 9, css(skin, 0.82), 2, 1);
      px(g, 6, 11, 0x8a3a30, 4, 1);
      px(g, 5, 10, 0x8a3a30);
      px(g, W - 6, 10, 0x8a3a30);
      px(g, 2, 9, css(skin, 1.06), 2, 1);
      px(g, W - 4, 9, css(skin, 1.06), 2, 1);
      if (extras.includes('beard')) {
        px(g, 2, 10, css(hair, 0.95), W - 4, 1);
        px(g, 3, 12, css(hair, 0.95), W - 6, 3);
        px(g, 6, 11, 0x8a3a30, 4, 1);
      }
      if (extras.includes('glasses')) {
        g.strokeStyle = '#151515';
        g.lineWidth = 1;
        g.strokeRect(2.5, 5.5, 4, 3);
        g.strokeRect(W - 6.5, 5.5, 4, 3);
        px(g, 7, 6, 0x151515, 2, 1);
      }
      if (extras.includes('shades')) {
        px(g, 2, 5, 0x0a0a0a, W - 4, 3);
        px(g, 3, 5, 0x6f7f9a, 2, 1);
        px(g, W - 5, 5, 0x6f7f9a, 2, 1);
      }
    };
    const side = (g, W, H) => {
      noise(g, W, H, skin, 0.06, rand);
      if (style === 'bald') return;
      const depth = longHair ? H : style === 'buzz' ? 4 : 6;
      hairNoise(g, 0, 0, W, Math.min(H, depth), hair, curly, rand);
      if (!longHair) hairNoise(g, W - 5, 0, 5, 10, hair, curly, rand);
      if (!longHair) px(g, 6, 7, css(skin, 0.85), 3, 3);
      if (extras.includes('earrings')) px(g, 7, 11, C.gold, 2, 2);
    };
    const back = (g, W, H) => {
      noise(g, W, H, skin, 0.06, rand);
      if (style === 'bald') return;
      hairNoise(g, 0, 0, W, longHair ? H : style === 'buzz' ? 9 : 12, hair, curly, rand);
    };
    const top = (g, W, H) => (style === 'bald' ? noise(g, W, H, skin, 0.06, rand) : hairNoise(g, 0, 0, W, H, hair, curly, rand));
    return { front, back, left: side, right: side, top, bottom: (g, W, H) => noise(g, W, H, skin, 0.05, rand) };
  }

  function paintBadge(g, cx, y) {
    px(g, cx - 2, y, 0xffffff, 5, 5);
    px(g, cx - 1, y + 1, C.sfBlue, 3, 2);
    px(g, cx, y + 3, C.sfBlue);
  }

  function paintTorso(def, seed) {
    const rand = makeRng(seed);
    const top = def.top;
    const shirt = def.shirt ?? C.white;
    const outfit = def.outfit || 'tee';
    const extras = def.extras || [];
    const front = (g, W, H) => {
      noise(g, W, H, top, 0.08, rand);
      const mid = Math.floor(W / 2);
      if (outfit === 'blazer' || outfit === 'suit' || outfit === 'labcoat') {
        for (let y = 0; y < 9; y++) px(g, mid - 3 + Math.floor(y / 3), y, shirt, 6 - 2 * Math.floor(y / 3), 1);
        for (let y = 0; y < 8; y++) {
          px(g, mid - 4 + Math.floor(y / 3), y, css(top, 0.7));
          px(g, mid + 3 - Math.floor(y / 3), y, css(top, 0.7));
        }
        px(g, mid, 10, css(top, 0.6));
        px(g, mid, 13, css(top, 0.6));
        if (outfit === 'labcoat') {
          px(g, 2, 11, css(top, 0.85), 4, 1);
          px(g, W - 6, 11, css(top, 0.85), 4, 1);
          px(g, 3, 2, 0x5a6b7a, 1, 6);
        }
      } else if (outfit === 'hoodie') {
        px(g, mid - 4, 0, css(top, 0.75), 8, 2);
        px(g, mid - 2, 2, 0xf0f0f0, 1, 5);
        px(g, mid + 1, 2, 0xf0f0f0, 1, 5);
        px(g, 3, H - 7, css(top, 0.82), W - 6, 4);
        px(g, mid - 1, 8, 0xffffff, 3, 3);
      } else if (outfit === 'vest') {
        noise(g, W, H, shirt, 0.06, rand);
        px(g, 1, 0, top, mid - 2, H);
        px(g, mid + 2, 0, top, W - mid - 3, H);
        px(g, 1, 9, 0xe8e8e8, mid - 2, 2);
        px(g, mid + 2, 9, 0xe8e8e8, W - mid - 3, 2);
        px(g, 1, 14, 0xe8e8e8, mid - 2, 2);
        px(g, mid + 2, 14, 0xe8e8e8, W - mid - 3, 2);
      } else if (outfit === 'polo') {
        px(g, mid - 3, 0, css(top, 0.75), 6, 2);
        px(g, mid, 2, css(top, 0.7), 1, 4);
        px(g, 3, 4, 0xffffff, 3, 2);
      } else if (outfit === 'apron') {
        px(g, mid - 4, 0, css(top, 0.8), 8, 1);
        px(g, 3, 5, C.green, W - 6, H - 5);
        px(g, 2, 5, css(C.green, 0.8), 1, 2);
        px(g, W - 3, 5, css(C.green, 0.8), 1, 2);
        px(g, mid - 2, 11, css(C.green, 0.75), 4, 3);
      } else {
        px(g, mid - 3, 0, css(top, 0.7), 6, 1);
        px(g, mid - 2, 1, css(top, 0.7), 4, 1);
      }
      if (extras.includes('tie')) {
        px(g, mid - 1, 2, C.red, 2, 2);
        px(g, mid - 1, 4, css(C.red, 0.85), 2, 7);
      }
      // lanyard + badge
      if (outfit !== 'apron') {
        for (let y = 0; y < 9; y++) {
          px(g, mid - 5 + Math.floor(y / 2), y, C.sfBlue);
          px(g, mid + 4 - Math.floor(y / 2), y, C.sfBlue);
        }
        paintBadge(g, mid, 9);
      }
      px(g, 0, H - 2, css(top, 0.7), W, 2);
    };
    const back = (g, W, H) => {
      noise(g, W, H, top, 0.08, rand);
      if (outfit === 'hoodie') px(g, Math.floor(W / 2) - 4, 0, css(top, 0.78), 8, 5);
      if (outfit === 'vest') px(g, 1, 9, 0xe8e8e8, W - 2, 2);
      px(g, Math.floor(W / 2), 4, css(top, 0.85), 1, H - 6);
      px(g, 0, H - 2, css(top, 0.7), W, 2);
    };
    const side = (g, W, H) => noise(g, W, H, top, 0.08, rand);
    return { front, back, left: side, right: side, top: side, bottom: side };
  }

  function paintArm(def, seed) {
    const rand = makeRng(seed);
    const sleeve = def.outfit === 'vest' || def.outfit === 'apron' ? (def.outfit === 'vest' ? def.shirt : def.top) : def.top;
    const short = def.outfit === 'tee' || def.outfit === 'polo';
    const cuff = def.outfit === 'blazer' || def.outfit === 'suit' ? (def.shirt ?? C.white) : css(sleeve, 0.8);
    const paint = (g, W, H) => {
      noise(g, W, H, def.skin, 0.05, rand);
      const sleeveLen = short ? Math.floor(H * 0.35) : H - 5;
      noise(g, W, sleeveLen, sleeve, 0.08, rand);
      px(g, 0, sleeveLen - 1, cuff, W, 1);
      px(g, 0, H - 1, css(def.skin, 0.85), W, 1);
    };
    return { front: paint, back: paint, left: paint, right: paint, top: (g, W, H) => noise(g, W, H, sleeve, 0.08, rand), bottom: (g, W, H) => noise(g, W, H, def.skin, 0.05, rand) };
  }

  function paintLeg(def, seed) {
    const rand = makeRng(seed);
    const shoes = def.shoes ?? 0x1c1c1c;
    const paint = (g, W, H) => {
      noise(g, W, H, def.bottom, 0.08, rand);
      px(g, 0, H - 4, shoes, W, 4);
      px(g, 0, H - 1, css(shoes, shoes === C.white ? 0.8 : 1.5), W, 1);
      px(g, W - 1, 0, css(def.bottom, 0.8), 1, H - 4);
    };
    return { front: paint, back: paint, left: paint, right: paint, top: (g, W, H) => noise(g, W, H, def.bottom, 0.08, rand), bottom: (g, W, H) => px(g, 0, 0, shoes, W, H) };
  }

  function limb(mesh, x, y, z, len) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    mesh.position.y = -len / 2;
    pivot.add(mesh);
    return pivot;
  }

  function buildHumanNpc(def, seed = 1) {
    const g = new THREE.Group();
    const parts = {};
    const extras = def.extras || [];
    const hipY = 0.78;
    const shoulderY = 1.36;
    const headY = 1.62;

    parts.legL = limb(paintedBox(0.22, hipY, 0.24, paintLeg(def, seed + 1), def.bottom), -0.13, hipY, 0, hipY);
    parts.legR = limb(paintedBox(0.22, hipY, 0.24, paintLeg(def, seed + 2), def.bottom), 0.13, hipY, 0, hipY);
    g.add(parts.legL, parts.legR);

    const torso = paintedBox(0.56, 0.6, 0.3, paintTorso(def, seed + 3), def.top);
    torso.position.y = hipY + 0.3;
    g.add(torso);

    parts.armL = limb(paintedBox(0.17, 0.6, 0.2, paintArm(def, seed + 4), def.top), -0.37, shoulderY, 0, 0.6);
    parts.armR = limb(paintedBox(0.17, 0.6, 0.2, paintArm(def, seed + 5), def.top), 0.37, shoulderY, 0, 0.6);
    const handL = parts.armL.children[0];
    const handR = parts.armR.children[0];
    if (extras.includes('tablet')) handL.add(solidBox(0.32, 0.24, 0.03, 0x2a2e36, 0.05, -0.24, 0.15));
    if (extras.includes('tablet')) handL.add(solidBox(0.27, 0.19, 0.01, 0x5fb8ff, 0.05, -0.24, 0.167, 0x3aa0ff));
    if (extras.includes('laptop')) {
      handL.add(solidBox(0.36, 0.03, 0.26, 0xb8bcc4, 0.1, -0.3, 0.2));
      handL.add(solidBox(0.36, 0.24, 0.02, 0x3a3f4a, 0.1, -0.18, 0.08));
    }
    if (extras.includes('camera')) {
      handR.add(solidBox(0.24, 0.17, 0.18, 0x111111, 0, -0.3, 0.17));
      handR.add(solidBox(0.1, 0.1, 0.14, 0x333333, 0, -0.3, 0.32));
    }
    if (extras.includes('mic')) handR.add(solidBox(0.05, 0.2, 0.05, 0x111111, 0, -0.38, 0.12));
    if (extras.includes('coffee')) handR.add(solidBox(0.1, 0.14, 0.1, 0xf5f5f5, 0, -0.34, 0.13));
    if (extras.includes('bag')) {
      handL.add(solidBox(0.26, 0.28, 0.12, C.pink, 0, -0.5, 0));
      handR.add(solidBox(0.22, 0.24, 0.1, C.gold, 0, -0.48, 0));
    }
    if (extras.includes('scanner')) {
      handR.add(solidBox(0.16, 0.14, 0.28, C.sfBlue, 0, -0.3, 0.16));
      handR.add(solidBox(0.12, 0.09, 0.02, C.white, 0, -0.27, 0.31));
      handR.add(solidBox(0.07, 0.05, 0.022, PALETTE.scannerCyan, 0, -0.27, 0.32, PALETTE.scannerCyan));
    }
    g.add(parts.armL, parts.armR);
    if (extras.includes('backpack')) g.add(solidBox(0.44, 0.5, 0.18, 0x3b3f4a, 0, hipY + 0.32, -0.24));

    parts.head = new THREE.Group();
    parts.head.add(paintedBox(0.46, 0.46, 0.46, paintHead(def, seed + 6), def.skin));
    const style = def.hairStyle || 'short';
    const curly = style === 'curly';
    if (style === 'long' || curly) {
      const len = curly ? 0.78 : 0.62;
      const hairBack = paintedBox(curly ? 0.6 : 0.52, len, 0.14, {}, def.hair);
      hairBack.material.forEach((m) => { m.map = canvasTex(8, 12, (gg, W, H) => hairNoise(gg, 0, 0, W, H, def.hair, curly, makeRng(seed + 7))); });
      hairBack.position.set(0, 0.21 - len / 2, -0.25);
      parts.head.add(hairBack);
      if (curly) {
        const puff = paintedBox(0.58, 0.14, 0.54, {}, def.hair);
        puff.material.forEach((m) => { m.map = canvasTex(8, 8, (gg, W, H) => hairNoise(gg, 0, 0, W, H, def.hair, true, makeRng(seed + 8))); });
        puff.position.set(0, 0.27, -0.02);
        parts.head.add(puff);
        const sideL = solidBox(0.08, 0.5, 0.36, def.hair, -0.27, -0.06, -0.05);
        const sideR = solidBox(0.08, 0.5, 0.36, def.hair, 0.27, -0.06, -0.05);
        parts.head.add(sideL, sideR);
      }
    }
    if (style === 'bun') parts.head.add(solidBox(0.2, 0.18, 0.2, def.hair, 0, 0.3, -0.16));
    if (extras.includes('hardhat')) {
      parts.head.add(solidBox(0.56, 0.16, 0.56, C.hardHat, 0, 0.3, 0.02));
      parts.head.add(solidBox(0.6, 0.04, 0.66, C.hardHat, 0, 0.23, 0.05));
    }
    if (extras.includes('cap')) {
      parts.head.add(solidBox(0.5, 0.12, 0.5, def.top === C.navy ? C.navy : C.red, 0, 0.29, 0));
      parts.head.add(solidBox(0.46, 0.04, 0.2, def.top === C.navy ? C.navy : C.red, 0, 0.24, 0.32));
    }
    if (extras.includes('headset')) {
      parts.head.add(solidBox(0.54, 0.05, 0.08, 0x111111, 0, 0.27, 0));
      parts.head.add(solidBox(0.07, 0.12, 0.12, 0x111111, 0.26, 0.0, 0));
      parts.head.add(solidBox(0.04, 0.04, 0.18, 0x111111, 0.24, -0.1, 0.14));
    }
    if (extras.includes('earpiece')) parts.head.add(solidBox(0.04, 0.12, 0.04, 0x111111, 0.25, -0.04, 0.04));
    parts.head.position.y = headY;
    g.add(parts.head);
    return { group: g, parts };
  }

  function buildBearNpc(seed) {
    const rand = makeRng(seed);
    const fur = (g, W, H) => noise(g, W, H, C.bear, 0.22, rand);
    const furBox = (w, h, d, painters = {}) => paintedBox(w, h, d, { front: fur, back: fur, left: fur, right: fur, top: fur, bottom: fur, ...painters }, C.bear);
    const g = new THREE.Group();
    const parts = {};
    parts.legL = limb(furBox(0.26, 0.6, 0.28), -0.15, 0.6, 0, 0.6);
    parts.legR = limb(furBox(0.26, 0.6, 0.28), 0.15, 0.6, 0, 0.6);
    g.add(parts.legL, parts.legR);
    const body = furBox(0.66, 0.66, 0.42, {
      front: (gg, W, H) => {
        fur(gg, W, H);
        px(gg, 4, 3, C.bearLight, W - 8, H - 5);
        px(gg, Math.floor(W / 2) - 4, 7, C.sfBlue, 8, 5);
        px(gg, Math.floor(W / 2) - 3, 6, C.sfBlue, 3, 1);
        px(gg, Math.floor(W / 2) + 1, 6, C.sfBlue, 3, 1);
      },
    });
    body.position.y = 0.93;
    g.add(body);
    parts.armL = limb(furBox(0.2, 0.5, 0.22), -0.43, 1.2, 0, 0.5);
    parts.armR = limb(furBox(0.2, 0.5, 0.22), 0.43, 1.2, 0, 0.5);
    g.add(parts.armL, parts.armR);
    parts.head = new THREE.Group();
    parts.head.add(furBox(0.68, 0.62, 0.62, {
      front: (gg, W, H) => {
        fur(gg, W, H);
        px(gg, 4, 5, C.bearLight, W - 8, H - 7);
        px(gg, 7, 8, 0x1b1410, 2, 3);
        px(gg, W - 9, 8, 0x1b1410, 2, 3);
        px(gg, 7, 8, 0xffffff);
        px(gg, W - 9, 8, 0xffffff);
        px(gg, Math.floor(W / 2) - 1, 12, 0x3a2416, 3, 2);
        px(gg, Math.floor(W / 2) - 2, 15, 0x8a3a30, 5, 1);
      },
    }));
    const ear = (x) => { const e = furBox(0.18, 0.18, 0.12); e.position.set(x, 0.36, 0); return e; };
    parts.head.add(ear(-0.26), ear(0.26));
    parts.head.position.y = 1.56;
    g.add(parts.head);
    return { group: g, parts };
  }

  function buildGuideNpc(seed) {
    const npc = buildHumanNpc({ skin: C.skinLight, hair: C.hairWhite, hairStyle: 'bald', outfit: 'hoodie', top: C.navy, bottom: C.khaki, extras: [], eyes: 0x3a6ea5 }, seed);
    const h = npc.parts.head;
    h.add(solidBox(0.72, 0.3, 0.62, C.hairWhite, 0, 0.3, -0.05));
    h.add(solidBox(0.18, 0.4, 0.52, C.hairWhite, -0.34, 0.04, -0.04));
    h.add(solidBox(0.18, 0.4, 0.52, C.hairWhite, 0.34, 0.04, -0.04));
    h.add(solidBox(0.3, 0.07, 0.03, C.hairWhite, 0, -0.08, 0.245));
    return npc;
  }

  function makeNameTag(name, role) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(16, 35, 71, 0.85)';
    ctx.fillRect(0, 0, 256, 72);
    ctx.fillStyle = '#28d9f2';
    ctx.fillRect(0, 66, 256, 6);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(name, 128, 32);
    ctx.fillStyle = '#9fd8ff';
    ctx.font = '20px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(role, 128, 58);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sprite.scale.set(1.3, 0.37, 1);
    return sprite;
  }

  /** Floor height a character can stand on at (x, z), or null if blocked. */
  function npcFloorAt(x, z) {
    for (let y = 4; y >= 0; y--) {
      if (isSolidAt(x, y, z) && !isSolidAt(x, y + 1, z) && !isSolidAt(x, y + 2, z)) return y + 1;
    }
    return null;
  }

  function buildNpcs(scene) {
    NPC_DEFS.forEach((def, i) => {
      const seed = 1000 + i * 97;
      const built = def.kind === 'bear' ? buildBearNpc(seed) : def.kind === 'guide' ? buildGuideNpc(seed) : buildHumanNpc(def, seed);
      const [hx, hz] = def.at;
      const floor = npcFloorAt(hx + 0.5, hz + 0.5);
      if (floor === null) return;
      const tag = makeNameTag(def.name, def.role);
      tag.position.y = def.kind === 'bear' ? 2.25 : 2.35;
      if (isColleague(def)) tag.material.color.set(PALETTE.glass);
      built.group.add(tag);
      built.group.position.set(hx + 0.5, floor, hz + 0.5);
      built.group.rotation.y = Math.random() * Math.PI * 2;
      scene.add(built.group);
      npcs.push({
        def, ...built, tag, index: i,
        colleague: isColleague(def),
        qualified: false,
        dealValue: [25000, 40000, 60000, 85000][i % 4],
        home: { x: hx + 0.5, z: hz + 0.5 },
        target: null,
        wait: 1 + Math.random() * 3,
        phase: i * 0.7,
        speed: def.kind === 'bear' ? 1.4 : 1 + Math.random() * 0.4,
        walking: false,
      });
    });
  }

  function pickNpcTarget(npc) {
    const radius = npc.def.idle ? 0 : 5;
    for (let tries = 0; tries < 6; tries++) {
      const tx = npc.home.x + (Math.random() * 2 - 1) * radius;
      const tz = Math.max(-26, Math.min(26, npc.home.z + (Math.random() * 2 - 1) * radius));
      if (npcFloorAt(tx, tz) !== null) return { x: tx, z: tz };
    }
    return null;
  }

  function turnToward(npc, angle, dt, rate) {
    let diff = angle - npc.group.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    npc.group.rotation.y += diff * Math.min(1, dt * rate);
  }

  function animateLimbs(parts, walking, t, phase, speed = 8) {
    const swing = walking ? Math.sin(t * speed + phase) * 0.6 : 0;
    parts.legL.rotation.x = swing;
    parts.legR.rotation.x = -swing;
    parts.armL.rotation.x = -swing * 0.8;
    parts.armR.rotation.x = swing * 0.8;
    parts.armR.rotation.z = 0;
    if (!walking) {
      parts.armL.rotation.x = Math.sin(t * 1.6 + phase) * 0.06;
      parts.armR.rotation.x = -Math.sin(t * 1.6 + phase) * 0.06;
    }
  }

  function updateNpcs(dt, t) {
    for (const npc of npcs) {
      const g = npc.group;
      const p = npc.parts;
      const toPlayerX = player.x - g.position.x;
      const toPlayerZ = player.z - g.position.z;
      const playerDist = Math.hypot(toPlayerX, toPlayerZ);
      const greeting = state === 'playing' && playerDist < 4.5;

      npc.walking = false;
      if (greeting) {
        turnToward(npc, Math.atan2(toPlayerX, toPlayerZ), dt, 5);
      } else if (npc.target) {
        const dx = npc.target.x - g.position.x;
        const dz = npc.target.z - g.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.15) {
          npc.target = null;
          npc.wait = 2 + Math.random() * 4;
        } else {
          const step = Math.min(dist, npc.speed * dt);
          const nx = g.position.x + (dx / dist) * step;
          const nz = g.position.z + (dz / dist) * step;
          const floor = npcFloorAt(nx, nz);
          if (floor === null || Math.abs(floor - g.position.y) > 1.01) {
            npc.target = null;
            npc.wait = 1;
          } else {
            g.position.x = nx;
            g.position.z = nz;
            g.position.y += (floor - g.position.y) * Math.min(1, dt * 10);
            turnToward(npc, Math.atan2(dx, dz), dt, 8);
            npc.walking = true;
          }
        }
      } else {
        npc.wait -= dt;
        if (npc.wait <= 0) npc.target = pickNpcTarget(npc);
      }

      animateLimbs(p, npc.walking, t, npc.phase);
      if (greeting) {
        p.armR.rotation.x = 0;
        p.armR.rotation.z = 2.6 + Math.sin(t * 9 + npc.phase) * 0.35;
      }
      npc.tag.visible = state !== 'playing' || playerDist > 2.6;
      p.head.position.y = (npc.def.kind === 'bear' ? 1.56 : 1.62) + Math.sin(t * 2 + npc.phase) * 0.012;
      p.head.rotation.y = greeting ? 0 : Math.sin(t * 0.5 + npc.phase) * 0.35;

      // Keep Ash from walking through characters.
      if (state === 'playing' && playerDist < 0.75 && playerDist > 0.0001) {
        const push = (0.75 - playerDist) / playerDist;
        player.x += toPlayerX * push;
        player.z += toPlayerZ * push;
      }
    }
  }

  // --- Ash: third-person model (V toggles the camera) ---
  let ashModel = null;
  let thirdPerson = false;

  function buildAshModel(scene) {
    ashModel = buildHumanNpc(ASH_DEF, 77);
    ashModel.group.visible = false;
    scene.add(ashModel.group);
  }

  const VIEW_LABELS = {
    first: 'First-person view',
    third: 'Third-person view — behind Ash',
    front: 'Front view — meet Ash · W/S orbit · scroll to zoom',
  };
  const VIEW_ZOOM = { third: 3.6, front: 6.5 };
  let viewMode = 'first';
  let camZoom = 3.6;
  let camZoomTarget = 3.6;

  function toggleView() {
    const order = ['first', 'third', 'front'];
    viewMode = order[(order.indexOf(viewMode) + 1) % order.length];
    thirdPerson = viewMode !== 'first';
    if (thirdPerson) camZoomTarget = VIEW_ZOOM[viewMode];
    document.getElementById('reticle').style.display = viewMode === 'front' ? 'none' : '';
    showToast(VIEW_LABELS[viewMode], false);
  }

  function updateAshModel(t) {
    if (!ashModel) return;
    ashModel.group.visible = thirdPerson && !ashSprite;
    if (fpViewGroup) fpViewGroup.visible = !thirdPerson;
    if (!thirdPerson) return;
    const moving = keys.ArrowUp || keys.ArrowLeft || keys.ArrowDown || keys.ArrowRight;
    ashModel.group.position.set(player.x, player.y, player.z);
    ashModel.group.rotation.y = player.yaw + Math.PI;
    animateLimbs(ashModel.parts, moving && player.onGround, t, 0, player.sprint ? 13 : 9);
    ashModel.parts.armR.rotation.x = moving ? ashModel.parts.armR.rotation.x : -0.9;
  }

  // --- Sprite sheet art: characters, collectibles, signage and scenes cut from the World Tour sheet ---
  const SHEET_URL = 'assets/sprite-sheet.webp';
  const SHEET_RECTS = {
    ashFront: [3, 172, 87, 116], ashSide: [90, 172, 65, 116], ashBack: [155, 172, 80, 116], ashQuarter: [235, 172, 73, 116],
    salesExec: [7, 328, 54, 90], solutionEng: [63, 328, 56, 90], productMgr: [120, 328, 58, 90],
    successMgr: [182, 328, 55, 90], marketing: [245, 328, 54, 90], eventStaff: [300, 328, 56, 90],
    retail: [372, 331, 48, 88], finServ: [422, 331, 46, 88], manufacturing: [469, 331, 44, 88],
    healthcare: [515, 331, 48, 88], publicSector: [563, 331, 50, 88], techCustomer: [615, 331, 45, 88],
    partner: [660, 331, 50, 88], camera: [710, 331, 52, 88], media: [765, 331, 45, 88], student: [810, 331, 45, 88],
    cloudy: [866, 327, 78, 90], einstein: [953, 328, 63, 89],
    crystal: [852, 457, 28, 34], coin: [893, 457, 38, 36], star: [931, 550, 36, 37], heart: [980, 554, 34, 32],
    flagPink: [363, 458, 40, 88], flagBlue: [402, 458, 36, 82], plant: [598, 505, 36, 50], mapKiosk: [766, 524, 68, 74],
    signExpo: [695, 459, 72, 26], signKeynote: [695, 484, 72, 24], signDemo: [695, 507, 72, 25],
    signLounge: [695, 531, 72, 25], signPeak: [695, 555, 72, 36],
  };
  const SHEET_SCENES = {
    o2: [328, 22, 128, 116], expo: [462, 22, 126, 116], keynote: [594, 22, 126, 116],
    peak: [726, 22, 137, 116], lounge: [870, 22, 146, 116],
  };
  const NPC_SPRITES = {
    Rosa: 'eventStaff', Dev: 'student', Kemi: 'retail', Marcus: 'media', Jake: 'salesExec', Tunde: 'solutionEng',
    Freya: 'productMgr', 'Dr. Ade': 'healthcare', Helen: 'publicSector', Leo: 'camera', Sam: 'techCustomer',
    Mia: 'marketing', Priya: 'retail', Oliver: 'finServ', Raj: 'manufacturing', Chen: 'partner', Mo: 'successMgr',
    Gino: 'manufacturing', Nia: 'successMgr', Victor: 'finServ', Margaret: 'publicSector', Max: 'salesExec',
    Ana: 'marketing', Theo: 'techCustomer', Zara: 'productMgr',
  };
  let sheetArt = null;
  let ashSprite = null;
  const sheetBillboards = [];

  /** Cut a cell out of the sheet, flood-filling the dark navy panel background to transparent and trimming to the figure. */
  function cutSprite(img, [sx, sy, sw, sh]) {
    const c = document.createElement('canvas');
    c.width = sw;
    c.height = sh;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const data = g.getImageData(0, 0, sw, sh);
    const p = data.data;
    const n = sw * sh;
    const isBg = (i) => {
      const r = p[i * 4], gr = p[i * 4 + 1], b = p[i * 4 + 2];
      return r < 34 && gr < 66 && b < 100 && b > r + 22 && b >= gr;
    };
    const bg = new Uint8Array(n);
    const stack = [];
    for (let x = 0; x < sw; x++) stack.push(x, (sh - 1) * sw + x);
    for (let y = 0; y < sh; y++) stack.push(y * sw, y * sw + sw - 1);
    while (stack.length) {
      const i = stack.pop();
      if (bg[i] || !isBg(i)) continue;
      bg[i] = 1;
      const x = i % sw;
      if (x > 0) stack.push(i - 1);
      if (x < sw - 1) stack.push(i + 1);
      if (i >= sw) stack.push(i - sw);
      if (i < n - sw) stack.push(i + sw);
    }
    // Drop small islands (JPEG speckle, slivers of neighbouring sprites) and keep the main figure.
    const comp = new Int32Array(n).fill(-1);
    const sizes = [];
    for (let s = 0; s < n; s++) {
      if (bg[s] || comp[s] >= 0) continue;
      const id = sizes.length;
      let size = 0;
      const st = [s];
      comp[s] = id;
      while (st.length) {
        const i = st.pop();
        size++;
        const x = i % sw;
        for (const j of [x > 0 ? i - 1 : -1, x < sw - 1 ? i + 1 : -1, i >= sw ? i - sw : -1, i < n - sw ? i + sw : -1]) {
          if (j >= 0 && !bg[j] && comp[j] < 0) {
            comp[j] = id;
            st.push(j);
          }
        }
      }
      sizes.push(size);
    }
    const biggest = Math.max(1, ...sizes);
    let minX = sw, minY = sh, maxX = 0, maxY = 0;
    for (let i = 0; i < n; i++) {
      if (bg[i] || sizes[comp[i]] < biggest * 0.12) {
        p[i * 4 + 3] = 0;
        continue;
      }
      const x = i % sw, y = (i / sw) | 0;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    g.putImageData(data, 0, 0);
    const out = document.createElement('canvas');
    out.width = Math.max(1, maxX - minX + 1);
    out.height = Math.max(1, maxY - minY + 1);
    out.getContext('2d').drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  }

  function cutScene(img, [sx, sy, sw, sh]) {
    const c = document.createElement('canvas');
    c.width = sw;
    c.height = sh;
    c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    return c;
  }

  function sheetTexture(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  }

  /** Feet-anchored cut-out; `face` = turn toward the camera around the vertical axis each frame. */
  function makeCutout(canvas, height, face = true) {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshBasicMaterial({ map: sheetTexture(canvas), alphaTest: 0.5, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.userData.aspect = canvas.width / canvas.height;
    m.scale.set(height * m.userData.aspect, height, 1);
    if (face) sheetBillboards.push(m);
    return m;
  }

  function facingAngle(obj) {
    obj.getWorldPosition(_tmpV);
    return Math.atan2(camera.position.x - _tmpV.x, camera.position.z - _tmpV.z);
  }
  const _tmpV = new THREE.Vector3();

  function loadSheetArt() {
    const img = new Image();
    img.onload = () => {
      sheetArt = {};
      for (const [k, r] of Object.entries(SHEET_RECTS)) sheetArt[k] = cutSprite(img, r);
      for (const [k, r] of Object.entries(SHEET_SCENES)) sheetArt[`scene_${k}`] = cutScene(img, r);
      applySheetArt();
    };
    img.onerror = () => console.warn('Pipecraft: sprite sheet failed to load — keeping voxel characters');
    img.src = SHEET_URL;
  }

  function applySheetArt() {
    for (const npc of npcs) {
      const key = npc.def.sprite || (npc.def.kind === 'bear' ? 'cloudy' : npc.def.kind === 'guide' ? 'einstein' : NPC_SPRITES[npc.def.name] || 'techCustomer');
      const h = npc.def.kind === 'bear' ? 1.6 : 1.9;
      npc.group.children.forEach((c) => { if (c !== npc.tag) c.visible = false; });
      npc.cutout = makeCutout(sheetArt[key], h);
      npc.group.add(npc.cutout);
      npc.tag.position.y = h + 0.4;
      npc.crystal = makeCutout(sheetArt.crystal, 0.42);
      npc.crystal.position.y = h + 0.85;
      npc.coin = makeCutout(sheetArt.coin, 0.55);
      npc.coin.position.y = h + 0.85;
      npc.star = makeCutout(sheetArt.star, 0.7);
      npc.star.position.y = h + 1.45;
      npc.heart = makeCutout(sheetArt.heart, 0.5);
      npc.coinTimer = 0;
      npc.starTimer = 0;
      npc.heartTimer = 0;
      npc.group.add(npc.crystal, npc.coin, npc.star, npc.heart);
    }

    ashSprite = {
      textures: Object.fromEntries(['ashFront', 'ashSide', 'ashBack', 'ashQuarter'].map((k) => [k, sheetTexture(sheetArt[k])])),
      mesh: makeCutout(sheetArt.ashBack, 1.9, false),
    };
    ashSprite.mesh.visible = false;
    scene.add(ashSprite.mesh);
    if (ashModel) ashModel.group.visible = false;

    // Framed World Tour posters along the boulevard, one per destination.
    [['o2', -49.5], ['expo', -22.5], ['lounge', 4.5], ['keynote', 40.5], ['peak', 67.5]].forEach(([k, x]) => {
      const z = -8.55;
      const base = (npcFloorAt(x, z + 1) ?? 1) + 0.6;
      const tex = sheetTexture(sheetArt[`scene_${k}`]);
      const w = 2.6, h = w / sheetArt[`scene_${k}`].width * sheetArt[`scene_${k}`].height;
      decorBox(scene, 0.12, base + h - 0.4, 0.12, 0x2b2f38, x - w / 2 - 0.1, (base + h - 0.4) / 2 + 0.6, z, { metal: 0.4 });
      decorBox(scene, 0.12, base + h - 0.4, 0.12, 0x2b2f38, x + w / 2 + 0.1, (base + h - 0.4) / 2 + 0.6, z, { metal: 0.4 });
      panel(scene, w + 0.16, h + 0.16, tex, x, base + h / 2 + 0.4, z, 0, 0.35, 0.12);
    });

    // Wayfinding arrows from the sheet replace the text boards on the spawn signpost.
    wayfindingPanels.forEach((m) => { m.visible = false; });
    ['signExpo', 'signLounge', 'signKeynote', 'signPeak'].forEach((k, i) => {
      const s = makeCutout(sheetArt[k], 0.78, false);
      s.position.set(-47.5 + 1.3, 6.35 - i * 0.82, -7.5 + 0.22);
      scene.add(s);
    });
    const kiosk = makeCutout(sheetArt.mapKiosk, 2.1);
    kiosk.position.set(-44.5, (npcFloorAt(-44.5, -6.5) ?? 1), -6.5);
    scene.add(kiosk);

    // Boulevard flags and potted plants become the sheet's banners and plants.
    bannerFlags.forEach(({ flag, x, z }, i) => {
      flag.visible = false;
      const f = makeCutout(sheetArt[i % 2 ? 'flagBlue' : 'flagPink'], 3.4, false);
      f.position.set(x + 0.45, 3.6, z);
      scene.add(f);
      detailAnimated.push((t) => { f.rotation.y = Math.sin(t * 1.5 + x) * 0.15; });
    });
    plantSpots.forEach(({ meshes, x, y, z }) => {
      meshes.forEach((m) => { m.visible = false; });
      const p = makeCutout(sheetArt.plant, 1.5);
      p.position.set(x, y, z);
      scene.add(p);
    });

    setHudIcons();
  }

  function setHudIcons() {
    [['ico-coin', 'coin'], ['ico-star', 'star'], ['ico-crystal', 'crystal'], ['ico-heart', 'heart']].forEach(([id, k]) => {
      document.querySelectorAll(`.${id}`).forEach((el) => { el.src = sheetArt[k].toDataURL(); el.hidden = false; });
    });
  }

  function updateSheetArt(t, dt) {
    if (!sheetArt) return;
    for (const m of sheetBillboards) {
      if (!m.visible || !m.parent) continue;
      const parentYaw = m.parent === scene ? 0 : m.parent.rotation.y;
      m.rotation.y = facingAngle(m) - parentYaw;
    }
    for (const npc of npcs) {
      if (!npc.cutout) continue;
      const bob = npc.walking ? Math.abs(Math.sin(t * 8 + npc.phase)) * 0.09 : Math.sin(t * 2 + npc.phase) * 0.012;
      npc.cutout.position.y = bob;
      npc.cutout.rotation.z = npc.walking ? Math.sin(t * 8 + npc.phase) * 0.06 : 0;
      npc.crystal.visible = !npc.qualified && !npc.colleague;
      npc.crystal.position.y = npc.cutout.scale.y + 0.85 + Math.sin(t * 2.4 + npc.phase) * 0.08;
      npc.coinTimer = Math.max(0, npc.coinTimer - dt);
      npc.coin.visible = npc.coinTimer > 0;
      npc.coin.position.y = npc.cutout.scale.y + 0.85 + (2.5 - npc.coinTimer) * 0.5;
      npc.starTimer = Math.max(0, npc.starTimer - dt);
      npc.star.visible = npc.starTimer > 0;
      npc.star.scale.setScalar(0.7 * (1 + Math.sin(t * 6) * 0.08));
      npc.star.scale.x *= npc.star.userData.aspect;
      npc.heartTimer = Math.max(0, (npc.heartTimer || 0) - dt);
      npc.heart.visible = npc.heartTimer > 0;
      npc.heart.position.y = npc.cutout.scale.y + 0.7 + (2.2 - npc.heartTimer) * 0.55;
      npc.heart.scale.set(0.5 * npc.heart.userData.aspect, 0.5, 1).multiplyScalar(1 + Math.sin(t * 10) * 0.1);
    }
  }

  /** Pick Ash's front / side / back / ¾ sheet view from her movement relative to the third-person camera. */
  function updateAshSprite() {
    if (!ashSprite) return;
    const m = ashSprite.mesh;
    m.visible = thirdPerson;
    if (!thirdPerson) return;
    const moving = player.movingNow;
    const hx = moving ? player.headX : -Math.sin(player.yaw);
    const hz = moving ? player.headZ : -Math.cos(player.yaw);
    const cx = camera.position.x - player.x;
    const cz = camera.position.z - player.z;
    // 0 = Ash faces the camera, ±π = facing away; sign says which way she turns on screen.
    const a = Math.atan2(hx * cz - hz * cx, hx * cx + hz * cz);
    const abs = Math.PI - Math.abs(a);
    const view = abs < 0.5 ? 'ashBack' : abs < 2.0 ? 'ashSide' : abs < 2.7 ? 'ashQuarter' : 'ashFront';
    const tex = ashSprite.textures[view];
    if (m.material.map !== tex) {
      m.material.map = tex;
      m.userData.aspect = tex.image.width / tex.image.height;
    }
    const flip = a < 0 ? -1 : 1;
    m.position.set(player.x, player.y + (moving && player.onGround ? Math.abs(Math.sin(clock.elapsedTime * (player.sprint ? 13 : 9))) * 0.08 : 0), player.z);
    m.scale.set(1.9 * m.userData.aspect * flip, 1.9, 1);
    m.rotation.y = Math.atan2(camera.position.x - player.x, camera.position.z - player.z);
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
      clearProgress();
      startGame();
    };
    document.getElementById('btn-continue').onclick = () => {
      hide('screen-title');
      continueGame();
    };
    updateTitleButtons();
    setInterval(() => { if (state === 'playing') saveProgress(); }, 3000);
    window.addEventListener('beforeunload', saveProgress);
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
      saveProgress();
      state = 'title';
      hide('screen-pause');
      updateTitleButtons();
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
    sessionStarted = true;
    document.getElementById('hud').classList.remove('hidden');
    tutorialTimer = 14;
    document.getElementById('tutorial-toast').classList.remove('hidden');
    respawnPlayer(true);
    resetProgress();
    requestPointerLock();
  }

  function continueGame() {
    if (!sessionStarted) {
      const saved = loadProgress();
      if (!saved) {
        startGame();
        return;
      }
      respawnPlayer(true);
      Object.assign(player, { x: saved.x, y: saved.y, z: saved.z, yaw: saved.yaw, pitch: saved.pitch });
      resetProgress();
      if (saved.progress) Object.assign(progress, saved.progress);
      (saved.qualified || []).forEach((i) => {
        const npc = npcs.find((n) => n.index === i);
        if (npc) setQualified(npc, true);
      });
      updateScoreHud();
      postToBoard('<b>Pipeline Bot</b><span class="sb-app">APP</span> Welcome back, Ash — your pipeline is saved 💾', false);
      sessionStarted = true;
    }
    state = 'playing';
    document.getElementById('hud').classList.remove('hidden');
    requestPointerLock();
  }

  function pauseGame() {
    if (state !== 'playing') return;
    saveProgress();
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

  function setKeyButtons(code, down) {
    const alias = code === 'ShiftRight' ? 'ShiftLeft' : code;
    document.querySelectorAll(`#controls-hud .key[data-code="${alias}"]`).forEach((b) => b.classList.toggle('down', down));
  }

  function handleKeyDown(code) {
    keys[code] = true;
    setKeyButtons(code, true);
    if (code === 'Escape') {
      if (state === 'playing') pauseGame();
      else if (state === 'paused') resumeGame();
    }
    if (code === 'Tab' && state === 'playing') pauseGame();
    if (code === 'KeyE' && state === 'playing') tryScan();
    if (code === 'KeyV' && state === 'playing') toggleView();
    if (code === 'KeyB' && state === 'playing') document.getElementById('slack-board').classList.toggle('hidden');
  }

  function handleKeyUp(code) {
    keys[code] = false;
    setKeyButtons(code, false);
  }

  function setupInput(canvas) {
    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (state === 'playing' && (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Tab')) e.preventDefault();
      if (e.code === 'Escape') e.preventDefault();
      handleKeyDown(e.code);
    });
    document.addEventListener('keyup', (e) => handleKeyUp(e.code));

    // On-screen keys: press-and-hold works like the keyboard (needed in embedded previews).
    document.querySelectorAll('#controls-hud .key').forEach((btn) => {
      const code = btn.dataset.code;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.setPointerCapture(e.pointerId);
        handleKeyDown(code);
      });
      const release = () => { if (keys[code]) handleKeyUp(code); };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('lostpointercapture', release);
    });

    // Pointer lock is often blocked inside embedded previews (e.g. Slack tabs),
    // so drag-to-look and WASD look always work as fallbacks.
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragDistance = 0;

    canvas.addEventListener('wheel', (e) => {
      if (state !== 'playing' || !thirdPerson) return;
      e.preventDefault();
      camZoomTarget = Math.max(2.5, Math.min(14, camZoomTarget * (e.deltaY > 0 ? 1.12 : 1 / 1.12)));
    }, { passive: false });

    canvas.addEventListener('pointerdown', (e) => {
      if (state !== 'playing') return;
      if (pointerLocked) {
        tryScan();
        return;
      }
      dragging = true;
      dragDistance = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      requestPointerLock();
    });
    window.addEventListener('pointerup', () => {
      if (dragging && dragDistance < 4 && state === 'playing') tryScan();
      dragging = false;
    });

    document.addEventListener('pointermove', (e) => {
      if (state !== 'playing') return;
      let dx;
      let dy;
      if (pointerLocked) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (dragging) {
        dx = e.clientX - lastX;
        dy = e.clientY - lastY;
        dragDistance += Math.abs(dx) + Math.abs(dy);
        lastX = e.clientX;
        lastY = e.clientY;
      } else {
        return;
      }
      lookBy(dx * 0.002 * settings.sensitivity, dy * 0.002 * settings.sensitivity);
    });

    document.addEventListener('pointerlockchange', () => {
      pointerLocked = document.pointerLockElement === canvas;
      updateLookHint();
    });
    document.addEventListener('pointerlockerror', updateLookHint);

    window.addEventListener('blur', () => {
      Object.keys(keys).forEach((k) => handleKeyUp(k));
      if (pauseOnBlur && state === 'playing') pauseGame();
    });
  }

  function lookBy(dYaw, dPitch) {
    player.yaw -= dYaw;
    player.pitch -= dPitch;
    player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, player.pitch));
  }

  function updateLookHint() {
    const hint = document.getElementById('click-to-play');
    hint.textContent = 'Click to capture mouse · or drag / WASD to look';
    hint.classList.toggle('hidden', pointerLocked || state !== 'playing');
  }

  function requestPointerLock() {
    renderer.domElement.focus({ preventScroll: true });
    try {
      const req = renderer.domElement.requestPointerLock();
      if (req && typeof req.catch === 'function') req.catch(updateLookHint);
    } catch (_) {
      /* blocked in sandboxed iframes */
    }
    updateLookHint();
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
    const forward = keys['ArrowUp'];
    const back = keys['ArrowDown'];
    const left = keys['ArrowLeft'];
    const right = keys['ArrowRight'];

    const turn = 2.2 * settings.sensitivity * dt;
    if (keys['KeyA']) lookBy(-turn, 0);
    if (keys['KeyD']) lookBy(turn, 0);
    if (keys['KeyW']) lookBy(0, -turn * 0.7);
    if (keys['KeyS']) lookBy(0, turn * 0.7);
    player.sprint = keys['ShiftLeft'] || keys['ShiftRight'];

    const speed = player.sprint ? 9 : 5.5;
    let mx = 0;
    let mz = 0;
    if (forward) mz -= 1;
    if (back) mz += 1;
    if (left) mx -= 1;
    if (right) mx += 1;
    // Front view looks back at Ash, so keys stay screen-relative: ↑ walks away from the camera.
    if (viewMode === 'front') {
      mx = -mx;
      mz = -mz;
    }
    const len = Math.hypot(mx, mz) || 1;
    mx /= len;
    mz /= len;

    const sin = Math.sin(player.yaw);
    const cos = Math.cos(player.yaw);
    const dx = (mx * cos + mz * sin) * speed * dt;
    const dz = (mz * cos - mx * sin) * speed * dt;

    player.vy -= 24 * dt;

    if (keys['Space'] && player.onGround) {
      player.vy = 8.5;
      player.onGround = false;
    }

    // Axis-separated collision; 1-block ledges are climbed automatically.
    const tryStep = (axis, delta) => {
      player[axis] += delta;
      if (!collidesAABB(playerAABB())) return;
      const canStep = player.onGround || player.vy <= 0;
      if (canStep) {
        const oldY = player.y;
        player.y = Math.floor(player.y + 1.01);
        if (!collidesAABB(playerAABB())) {
          player.vy = 0;
          return;
        }
        player.y = oldY;
      }
      player[axis] -= delta;
    };
    const startX = player.x;
    const startZ = player.z;
    tryStep('x', dx);
    tryStep('z', dz);
    const moved = Math.hypot(player.x - startX, player.z - startZ);
    if (moved > 0.001) {
      player.headX = (player.x - startX) / moved;
      player.headZ = (player.z - startZ) / moved;
    }
    player.movingNow = moved > 0.001;
    if (player.onGround && state === 'playing') countSteps(moved);
    let box;

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
      fpViewGroup.position.y = -0.14 + Math.sin(clock.elapsedTime * (player.sprint ? 14 : 10)) * 0.02;
    }
  }

  function updateCamera() {
    const eyeY = player.y + player.height - 0.15;
    camera.rotation.order = 'YXZ';
    camZoom += (camZoomTarget - camZoom) * 0.12;
    if (viewMode === 'front') {
      const elev = Math.max(-0.15, Math.min(1.2, 0.22 - player.pitch));
      const fx = -Math.sin(player.yaw);
      const fz = -Math.cos(player.yaw);
      const target = new THREE.Vector3(player.x, player.y + 1.15, player.z);
      camera.position.set(
        target.x + fx * Math.cos(elev) * camZoom,
        target.y + Math.sin(elev) * camZoom,
        target.z + fz * Math.cos(elev) * camZoom,
      );
      camera.lookAt(target);
      return;
    }
    if (thirdPerson) {
      const cp = Math.cos(player.pitch);
      const dir = new THREE.Vector3(-Math.sin(player.yaw) * cp, Math.sin(player.pitch), -Math.cos(player.yaw) * cp);
      const head = new THREE.Vector3(player.x, eyeY, player.z);
      camera.position.copy(head).addScaledVector(dir, -camZoom).add(new THREE.Vector3(0, 0.5, 0));
      camera.lookAt(head.x + dir.x, head.y + dir.y * 0.5, head.z + dir.z);
      return;
    }
    camera.position.set(player.x, eyeY, player.z);
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
    camera.rotation.z = 0;
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

    updateNpcs(dt, clock.elapsedTime);
    updateAshModel(clock.elapsedTime);
    updateSheetArt(clock.elapsedTime, dt);
    updateAshSprite();
    updateWorldDetails(clock.elapsedTime);

    if (state === 'playing') {
      movePlayer(dt);
      updateCamera();
      detectZone();
      updateScannerPulse(clock.elapsedTime);
      drawMinimap();

      if (toastTimer > 0) {
        toastTimer -= dt;
        if (toastTimer <= 0) document.getElementById('score-toast').classList.add('hidden');
      }
      if (unlockTimer > 0) {
        unlockTimer -= dt;
        if (unlockTimer <= 0) document.getElementById('opp-unlock').classList.remove('show');
      }
      if (tutorialTimer > 0) {
        tutorialTimer -= dt;
        if (tutorialTimer <= 0) {
          document.getElementById('tutorial-toast').classList.add('hidden');
        }
      }
    }

    renderer.render(scene, camera);
  }

  if (window.innerWidth < 700) document.getElementById('slack-board').classList.add('hidden');

  window.__pipecraft = { player, npcs, lookBy, toggleView, scan: tryScan, move: (dt) => movePlayer(dt), view: () => viewMode, art: () => sheetArt, getState: () => state };

  if (!initWebGL()) {
    console.error('WebGL init failed');
  }
})();
