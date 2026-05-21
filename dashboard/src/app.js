const sampleQueue = `# Sample Session Queue

| ID | Role | Status | Scope | Goal | Owned Files |
| --- | --- | --- | --- | --- | --- |
| SAMPLE-PM-001 | main | in-progress | PM coordination | Define target behavior and review results | handoff.md, session-queue.md |
| SAMPLE-AN-001 | analysis | todo | UI flow | Identify current behavior and likely files | read-only |
| SAMPLE-WK-001 | worker | in-progress | Button behavior | Implement assigned UI change | PM-assigned files only |
| SAMPLE-VF-001 | verify | blocked | Browser check | Verify expected UI behavior | no code changes |
| SAMPLE-DC-001 | docs | done | Documentation | Update concise handoff notes | docs only |`;

const roleFallback = [
  { id: 'TASK-PM-001', role: 'main', status: 'todo', scope: 'PM coordination', goal: 'Manage queue and final judgment' },
  { id: 'TASK-AN-001', role: 'analysis', status: 'todo', scope: 'Investigation', goal: 'Review sources and summarize findings' },
  { id: 'TASK-WK-001', role: 'worker', status: 'todo', scope: 'Implementation', goal: 'Apply assigned changes' },
  { id: 'TASK-VF-001', role: 'verify', status: 'todo', scope: 'Verification', goal: 'Check behavior and classify result' },
  { id: 'TASK-DC-001', role: 'docs', status: 'todo', scope: 'Documentation', goal: 'Maintain handoff and records' }
];

const rolePalette = {
  main: ['#2d72d9', '#93c5fd'],
  analysis: ['#7c4dff', '#c4b5fd'],
  worker: ['#0f9f7a', '#99f6e4'],
  verify: ['#e08424', '#fed7aa'],
  docs: ['#c03d72', '#f9a8d4']
};

const statusText = {
  todo: 'off duty',
  'in-progress': 'working',
  done: 'complete',
  blocked: 'needs decision',
  skipped: 'away'
};

const actionCopy = {
  main: {
    'in-progress': 'directing work at the review board',
    todo: 'walking through the lounge',
    done: 'closing the board',
    blocked: 'waiting at the decision desk',
    skipped: 'away from the floor'
  },
  analysis: {
    'in-progress': 'reading at the document table',
    todo: 'taking a coffee break',
    done: 'pinning notes to the board',
    blocked: 'flagging a question',
    skipped: 'away from the floor'
  },
  worker: {
    'in-progress': 'typing at a workstation',
    todo: 'playing at the game corner',
    done: 'leaving the keyboard clean',
    blocked: 'waiting for file ownership',
    skipped: 'away from the floor'
  },
  verify: {
    'in-progress': 'checking the review board',
    todo: 'stretching in the gym',
    done: 'marking verification done',
    blocked: 'holding a failed check',
    skipped: 'away from the floor'
  },
  docs: {
    'in-progress': 'sorting handoff notes',
    todo: 'reading in the lounge',
    done: 'stacking completed records',
    blocked: 'waiting for evidence',
    skipped: 'away from the floor'
  }
};

const zones = {
  work: { label: 'STUDIO OFFICE', x: 0.05, y: 0.08, w: 0.38, h: 0.30, color: '#e8f1ff', trim: '#3b82f6' },
  docs: { label: 'KITCHEN NOTES', x: 0.48, y: 0.08, w: 0.22, h: 0.28, color: '#fff0d8', trim: '#f59e0b' },
  review: { label: 'REVIEW SUITE', x: 0.74, y: 0.08, w: 0.21, h: 0.29, color: '#e7fbef', trim: '#22c55e' },
  lounge: { label: 'LIVING ROOM', x: 0.06, y: 0.70, w: 0.26, h: 0.23, color: '#f6eaff', trim: '#a855f7' },
  game: { label: 'MEDIA ROOM', x: 0.36, y: 0.72, w: 0.25, h: 0.21, color: '#eef4ff', trim: '#2563eb' },
  gym: { label: 'PATIO GYM', x: 0.72, y: 0.70, w: 0.23, h: 0.23, color: '#fff1e8', trim: '#f97316' },
  blocked: { label: 'DECISION ROOM', x: 0.72, y: 0.46, w: 0.22, h: 0.18, color: '#fff0f0', trim: '#ef4444' },
  away: { label: 'AWAY', x: 0.02, y: 0.44, w: 0.10, h: 0.12, color: '#eef2f7' }
};

const zoneTargets = {
  work: [[0.17, 0.26], [0.32, 0.27], [0.25, 0.34]],
  docs: [[0.55, 0.27], [0.64, 0.28], [0.58, 0.34]],
  review: [[0.80, 0.28], [0.88, 0.30], [0.84, 0.36]],
  lounge: [[0.15, 0.78], [0.24, 0.82], [0.19, 0.72]],
  game: [[0.43, 0.80], [0.53, 0.82], [0.49, 0.75]],
  gym: [[0.77, 0.82], [0.88, 0.81], [0.82, 0.75]],
  blocked: [[0.78, 0.55], [0.87, 0.56], [0.83, 0.62]],
  away: [[0.07, 0.50], [0.93, 0.49], [0.50, 0.94]]
};

const roleTargetZone = {
  main: 'review',
  analysis: 'docs',
  worker: 'work',
  verify: 'review',
  docs: 'docs'
};

const idleZones = ['lounge', 'game', 'gym'];

const canvas = document.querySelector('#world-canvas');
const ctx = canvas.getContext('2d');
const queueText = document.querySelector('#queue-text');
const renderButton = document.querySelector('#render-queue');
const sampleButton = document.querySelector('#load-sample');
const fileInput = document.querySelector('#queue-file');
const shuffleButton = document.querySelector('#shuffle-agents');
const queueUrlInput = document.querySelector('#queue-url');
const startSyncButton = document.querySelector('#start-sync');
const stopSyncButton = document.querySelector('#stop-sync');
const syncStatus = document.querySelector('#sync-status');
const summaryCount = document.querySelector('#summary-count');
const summaryActive = document.querySelector('#summary-active');
const activityList = document.querySelector('#activity-list');

let agents = [];
let lastTime = performance.now();
let syncTimer = null;
let lastQueueHash = '';
let renderSize = { width: 1200, height: 760, ratio: 1 };
const syncIntervalMs = 5000;
const flowParticles = Array.from({ length: 22 }, (_, index) => ({
  lane: index % 4,
  offset: Math.random(),
  speed: 0.00004 + Math.random() * 0.000035,
  size: 2 + Math.random() * 2.5
}));

function normalizeStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  if (['todo', 'in-progress', 'done', 'blocked', 'skipped'].includes(status)) return status;
  if (status === '진행중') return 'in-progress';
  if (status === '대기') return 'todo';
  if (status === '완료') return 'done';
  if (status === '보류') return 'blocked';
  if (status === '해당없음') return 'skipped';
  return 'todo';
}

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase();
  if (['main', 'analysis', 'worker', 'verify', 'docs'].includes(role)) return role;
  return 'analysis';
}

function stripCodeTicks(value) {
  return String(value || '').replace(/`/g, '').trim();
}

function parseQueue(markdown) {
  const rows = String(markdown || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^\|\s*[A-Z][A-Z0-9]*-(PM|AN|WK|VF|DC)-\d{3}\s*\|/.test(line));

  if (!rows.length) return [...roleFallback];

  return rows.map(row => {
    const cells = row.split('|').map(cell => stripCodeTicks(cell)).filter(Boolean);
    return {
      id: cells[0] || 'TASK-AN-001',
      role: normalizeRole(cells[1]),
      status: normalizeStatus(cells[2]),
      scope: cells[3] || 'Unscoped work',
      goal: cells[4] || 'No goal recorded',
      ownedFiles: cells[5] || ''
    };
  });
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function targetZoneFor(item) {
  if (item.status === 'blocked') return 'blocked';
  if (item.status === 'skipped') return 'away';
  if (item.status === 'done') return 'review';
  if (item.status === 'todo') return pick(idleZones);
  return roleTargetZone[item.role] || 'work';
}

function pointForZone(zoneName) {
  const [x, y] = pick(zoneTargets[zoneName] || zoneTargets.lounge);
  return {
    x: x + (Math.random() * 0.035 - 0.0175),
    y: y + (Math.random() * 0.035 - 0.0175)
  };
}

function activityFor(item, zone) {
  if (item.status === 'todo') {
    if (zone === 'game') return 'playing at the game corner';
    if (zone === 'gym') return 'stretching in the gym';
    return 'drinking coffee in the lounge';
  }
  return actionCopy[item.role]?.[item.status] || statusText[item.status] || 'moving';
}

function buildAgents(items) {
  agents = items.map((item, index) => {
    const zone = targetZoneFor(item);
    const start = pointForZone(pick(['lounge', 'game', 'work', 'docs', 'review']));
    const target = pointForZone(zone);
    return {
      ...item,
      x: start.x,
      y: start.y,
      targetX: target.x,
      targetY: target.y,
      zone,
      speed: 0.105 + index * 0.012 + Math.random() * 0.025,
      pauseUntil: 0,
      phase: Math.random() * Math.PI * 2,
      facing: 1,
      activity: activityFor(item, zone)
    };
  });
  updateSummaries(items);
  updateActivityList();
}

function updateSummaries(items) {
  const active = items.filter(item => item.status === 'in-progress').length;
  const blocked = items.filter(item => item.status === 'blocked').length;
  summaryCount.textContent = `${items.length} agents`;
  summaryActive.textContent = blocked ? `${active} active · ${blocked} blocked` : `${active} active`;
}

function updateActivityList() {
  activityList.innerHTML = '';
  agents.forEach(agent => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `<strong>${agent.id}</strong><span>${agent.activity}</span><span>${agent.goal}</span>`;
    activityList.appendChild(item);
  });
}

function assignNewTarget(agent, forceIdleSwitch = false) {
  let zone = targetZoneFor(agent);
  if (agent.status === 'todo' && forceIdleSwitch) zone = pick(idleZones);
  agent.zone = zone;
  const target = pointForZone(zone);
  agent.targetX = target.x;
  agent.targetY = target.y;
  agent.activity = activityFor(agent, zone);
}

function shuffleAgents() {
  agents.forEach(agent => {
    assignNewTarget(agent, true);
    agent.pauseUntil = 0;
  });
  updateActivityList();
}

function hashText(value) {
  let hash = 0;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return String(hash);
}

function setSyncStatus(message, state = 'idle') {
  syncStatus.textContent = message;
  syncStatus.dataset.state = state;
}

function renderFromText() {
  lastQueueHash = hashText(queueText.value);
  buildAgents(parseQueue(queueText.value));
}

async function fetchQueueOnce() {
  const url = queueUrlInput.value.trim();
  if (!url) {
    setSyncStatus('Enter a remote queue URL first', 'blocked');
    return;
  }

  try {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}_=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'text/plain, text/markdown, */*' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const nextHash = hashText(text);
    if (nextHash !== lastQueueHash) {
      queueText.value = text;
      lastQueueHash = nextHash;
      buildAgents(parseQueue(text));
      setSyncStatus(`Synced ${new Date().toLocaleTimeString()}`, 'ok');
    } else {
      setSyncStatus(`No change ${new Date().toLocaleTimeString()}`, 'ok');
    }
  } catch (error) {
    setSyncStatus(`Sync failed: ${error.message}`, 'blocked');
  }
}

function startSync() {
  if (syncTimer) clearInterval(syncTimer);
  setSyncStatus('Sync starting...', 'active');
  fetchQueueOnce();
  syncTimer = setInterval(fetchQueueOnce, syncIntervalMs);
}

function stopSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
  setSyncStatus('Sync stopped', 'idle');
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  renderSize = { width: bounds.width, height: bounds.height, ratio };
  canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
  canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function px(value) { return value * renderSize.width; }
function py(value) { return value * renderSize.height; }

function scenePoint(x, y, z = 0) {
  const { width, height } = renderSize;
  const originX = width * 0.50;
  const originY = height * 0.43;
  const floorW = width * 0.68;
  const floorH = height * 0.40;
  const u = x - 0.5;
  const v = y - 0.5;
  return {
    x: originX + (u - v) * floorW,
    y: originY + (u + v) * floorH - z
  };
}

function isoPolygon(points, fill, stroke) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function isoRect(x, y, w, h, fill, stroke) {
  const p1 = scenePoint(x, y);
  const p2 = scenePoint(x + w, y);
  const p3 = scenePoint(x + w, y + h);
  const p4 = scenePoint(x, y + h);
  isoPolygon([p1, p2, p3, p4], fill, stroke);
  return [p1, p2, p3, p4];
}

function isoBox(x, y, w, h, z, top, left, right, stroke = 'rgba(44, 58, 82, 0.24)') {
  const p1 = scenePoint(x, y, 0);
  const p2 = scenePoint(x + w, y, 0);
  const p3 = scenePoint(x + w, y + h, 0);
  const p4 = scenePoint(x, y + h, 0);
  const q1 = scenePoint(x, y, z);
  const q2 = scenePoint(x + w, y, z);
  const q3 = scenePoint(x + w, y + h, z);
  const q4 = scenePoint(x, y + h, z);

  isoPolygon([q4, q3, p3, p4], left, stroke);
  isoPolygon([q2, q3, p3, p2], right, stroke);
  isoPolygon([q1, q2, q3, q4], top, stroke);
}

function roundRect(context, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + w, y, x + w, y + h, radius);
  context.arcTo(x + w, y + h, x, y + h, radius);
  context.arcTo(x, y + h, x, y, radius);
  context.arcTo(x, y, x + w, y, radius);
  context.closePath();
}

function fillRoundRect(context, x, y, w, h, r, fill, stroke) {
  roundRect(context, x, y, w, h, r);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = 1;
    context.stroke();
  }
}

function drawText(text, x, y, options = {}) {
  ctx.save();
  ctx.font = options.font || '700 12px Inter, Segoe UI, sans-serif';
  ctx.fillStyle = options.color || '#475467';
  ctx.textAlign = options.align || 'left';
  ctx.textBaseline = options.baseline || 'top';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawWorldBackground(time) {
  const { width, height } = renderSize;
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#f9fbff');
  bg.addColorStop(0.55, '#edf5ff');
  bg.addColorStop(1, '#eaf2f5');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  drawGlassWall(time);
  drawIsometricRoom(time);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#cbd7e6';
  for (let line = -0.1; line <= 1.1; line += 0.08) {
    const a = scenePoint(line, 0.02);
    const b = scenePoint(line, 0.98);
    const c = scenePoint(0.02, line);
    const d = scenePoint(0.98, line);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }
  ctx.restore();

  const glowA = ctx.createRadialGradient(width * 0.16, height * 0.08, 0, width * 0.16, height * 0.08, width * 0.42);
  glowA.addColorStop(0, 'rgba(45, 114, 217, 0.16)');
  glowA.addColorStop(1, 'rgba(45, 114, 217, 0)');
  ctx.fillStyle = glowA;
  ctx.fillRect(0, 0, width, height);

  const drift = Math.sin(time / 1800) * 16;
  const glowB = ctx.createRadialGradient(width * 0.82 + drift, height * 0.88, 0, width * 0.82 + drift, height * 0.88, width * 0.36);
  glowB.addColorStop(0, 'rgba(15, 159, 122, 0.13)');
  glowB.addColorStop(1, 'rgba(15, 159, 122, 0)');
  ctx.fillStyle = glowB;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.42;
  const light = ctx.createLinearGradient(0, 0, 0, height * 0.5);
  light.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
  light.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(width * 0.18, 0);
  ctx.lineTo(width * 0.31, 0);
  ctx.lineTo(width * 0.45, height * 0.72);
  ctx.lineTo(width * 0.05, height * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  drawAmbientDecor(time);
}

function drawIsometricRoom(time) {
  const floor = [
    scenePoint(0.02, 0.08),
    scenePoint(0.96, 0.08),
    scenePoint(0.98, 0.92),
    scenePoint(0.05, 0.96)
  ];

  ctx.save();
  ctx.shadowColor = 'rgba(31, 42, 68, 0.22)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 18;
  isoPolygon(floor, '#e8f0fb', 'rgba(87, 105, 132, 0.28)');
  ctx.restore();

  const backLeft = scenePoint(0.02, 0.08);
  const backRight = scenePoint(0.96, 0.08);
  const wallLift = renderSize.height * 0.18;
  const wall = ctx.createLinearGradient(0, backLeft.y - wallLift, 0, backLeft.y + 60);
  wall.addColorStop(0, 'rgba(255,255,255,0.80)');
  wall.addColorStop(1, 'rgba(213,228,248,0.42)');
  isoPolygon([
    { x: backLeft.x, y: backLeft.y },
    { x: backRight.x, y: backRight.y },
    { x: backRight.x, y: backRight.y - wallLift },
    { x: backLeft.x, y: backLeft.y - wallLift }
  ], wall, 'rgba(111,130,158,0.18)');

  ctx.save();
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < 7; i += 1) {
    const x = backLeft.x + 40 + i * ((backRight.x - backLeft.x - 80) / 6);
    fillRoundRect(ctx, x - 24, backLeft.y - wallLift + 28, 48, 58, 8, 'rgba(255,255,255,0.42)', 'rgba(121,142,172,0.20)');
  }
  ctx.restore();

  drawExteriorDetails(backLeft, backRight, wallLift, time);
  drawGarden(time);

  const pulse = 0.20 + Math.sin(time / 1200) * 0.03;
  const spot = ctx.createRadialGradient(renderSize.width * 0.5, renderSize.height * 0.38, 0, renderSize.width * 0.5, renderSize.height * 0.38, renderSize.width * 0.55);
  spot.addColorStop(0, `rgba(255, 255, 255, ${pulse})`);
  spot.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, renderSize.width, renderSize.height);
}

function drawGarden(time) {
  ctx.save();
  const grass = ctx.createLinearGradient(0, renderSize.height * 0.18, 0, renderSize.height);
  grass.addColorStop(0, 'rgba(84, 168, 97, 0.13)');
  grass.addColorStop(1, 'rgba(31, 120, 70, 0.30)');
  isoPolygon([
    scenePoint(-0.10, 0.20),
    scenePoint(1.08, 0.20),
    scenePoint(1.14, 1.10),
    scenePoint(-0.14, 1.10)
  ], grass);

  for (let i = 0; i < 18; i += 1) {
    const x = (i * 0.071 + 0.04) % 1.14 - 0.08;
    const y = i % 2 === 0 ? 0.03 + (i % 5) * 0.17 : 0.92 + (i % 4) * 0.04;
    const p = scenePoint(x, y, 1);
    drawPalmCluster(p.x, p.y, 0.72 + (i % 3) * 0.12, time + i * 120);
  }

  const car = scenePoint(1.03, 0.64, 2);
  drawSmallCar(car.x, car.y);
  ctx.restore();
}

function drawPalmCluster(x, y, scale, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(22, 78, 55, 0.16)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8b5a2b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.quadraticCurveTo(4, -8, 0, -34);
  ctx.stroke();
  ctx.fillStyle = '#1f8a4c';
  for (let i = 0; i < 8; i += 1) {
    const angle = i * Math.PI / 4 + Math.sin(time / 900) * 0.04;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * 16, -36 + Math.sin(angle) * 10, 8, 28, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSmallCar(x, y) {
  ctx.save();
  ctx.translate(x, y);
  fillRoundRect(ctx, -38, -16, 76, 30, 8, '#f6c344', 'rgba(81,48,16,0.26)');
  fillRoundRect(ctx, -8, -30, 34, 20, 7, '#ffe39a', 'rgba(81,48,16,0.20)');
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(-22, 15, 6, 0, Math.PI * 2);
  ctx.arc(24, 15, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawExteriorDetails(backLeft, backRight, wallLift, time) {
  const width = backRight.x - backLeft.x;
  ctx.save();
  ctx.globalAlpha = 0.72;
  for (let i = 0; i < 8; i += 1) {
    const x = backLeft.x + width * (0.08 + i * 0.11);
    const y = backLeft.y - wallLift - 14 + Math.sin(time / 1200 + i) * 2;
    fillRoundRect(ctx, x - 20, y, 40, 8, 5, 'rgba(255,255,255,0.88)', 'rgba(111,130,158,0.22)');
    ctx.fillStyle = 'rgba(56, 86, 133, 0.18)';
    ctx.fillRect(x - 18, y + 14, 7, 24 + (i % 3) * 6);
    ctx.fillRect(x - 6, y + 8, 9, 34 + (i % 2) * 8);
    ctx.fillRect(x + 8, y + 18, 7, 22 + (i % 4) * 5);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = 'rgba(45, 114, 217, 0.28)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const y = backLeft.y + 18 + i * 14;
    ctx.beginPath();
    ctx.moveTo(backLeft.x + 30, y);
    ctx.lineTo(backRight.x - 30, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawZones() {
  Object.entries(zones).forEach(([key, zone]) => {
    if (key === 'away') return;
    const points = [
      scenePoint(zone.x, zone.y),
      scenePoint(zone.x + zone.w, zone.y),
      scenePoint(zone.x + zone.w, zone.y + zone.h),
      scenePoint(zone.x, zone.y + zone.h)
    ];
    ctx.save();
    ctx.shadowColor = 'rgba(31, 42, 68, 0.13)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
    isoPolygon(points, zone.color, 'rgba(103,119,145,0.26)');
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.24;
    isoPolygon(points, 'rgba(255,255,255,0.65)');
    ctx.restore();

    const label = scenePoint(zone.x + zone.w * 0.07, zone.y + zone.h * 0.08, 5);
    drawText(zone.label, label.x, label.y, { font: '800 11px Inter, Segoe UI, sans-serif', color: '#435269' });
    drawRoomTrim(zone);
  });

  drawWalkways();
  drawFurniture();
  drawTaskParticles(performance.now());
}

function drawRoomTrim(zone) {
  const p1 = scenePoint(zone.x, zone.y, 4);
  const p2 = scenePoint(zone.x + zone.w, zone.y, 4);
  const p3 = scenePoint(zone.x + zone.w, zone.y + zone.h, 4);
  const p4 = scenePoint(zone.x, zone.y + zone.h, 4);
  ctx.save();
  ctx.strokeStyle = zone.trim || '#94a3b8';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.stroke();

  [p1, p2, p3, p4].forEach(point => {
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y - renderSize.height * 0.10);
    ctx.stroke();
  });
  ctx.restore();
}

function drawGlassWall(time) {
  const { width, height } = renderSize;
  const wallHeight = height * 0.16;
  const wall = ctx.createLinearGradient(0, 0, 0, wallHeight);
  wall.addColorStop(0, 'rgba(255,255,255,0.88)');
  wall.addColorStop(1, 'rgba(214,232,255,0.20)');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, wallHeight);

  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let x = width * 0.05; x < width * 0.96; x += width * 0.13) {
    fillRoundRect(ctx, x, height * 0.025, width * 0.09, height * 0.09, 10, 'rgba(255,255,255,0.45)', 'rgba(142,161,187,0.22)');
    ctx.fillStyle = 'rgba(77, 100, 133, 0.16)';
    const base = height * 0.105;
    for (let i = 0; i < 5; i += 1) {
      const buildingW = width * (0.006 + i * 0.001);
      const buildingH = height * (0.018 + ((i + Math.floor(x)) % 3) * 0.008);
      ctx.fillRect(x + 10 + i * width * 0.014, base - buildingH, buildingW, buildingH);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.18 + Math.sin(time / 1200) * 0.04;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.07, height * 0.025);
  ctx.lineTo(width * 0.31, height * 0.14);
  ctx.moveTo(width * 0.54, height * 0.02);
  ctx.lineTo(width * 0.91, height * 0.14);
  ctx.stroke();
  ctx.restore();
}

function drawAmbientDecor(time) {
  const { width, height } = renderSize;
  ctx.save();
  ctx.globalAlpha = 0.62;
  const lampPulse = 0.18 + Math.sin(time / 900) * 0.03;
  [[0.32, 0.18], [0.63, 0.18], [0.50, 0.50], [0.78, 0.66]].forEach(([xRatio, yRatio]) => {
    const x = width * xRatio;
    const y = height * yRatio;
    const lamp = ctx.createRadialGradient(x, y, 4, x, y, width * 0.11);
    lamp.addColorStop(0, `rgba(255, 248, 214, ${lampPulse})`);
    lamp.addColorStop(1, 'rgba(255, 248, 214, 0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(x - width * 0.13, y - width * 0.13, width * 0.26, width * 0.26);
    fillRoundRect(ctx, x - 26, y - 6, 52, 8, 4, 'rgba(255,255,255,0.88)', 'rgba(133,149,175,0.22)');
  });
  ctx.restore();

  const leftPlant = scenePoint(0.10, 0.66, 4);
  const rightPlant = scenePoint(0.92, 0.45, 4);
  drawPlant(leftPlant.x, leftPlant.y, 1.0);
  drawPlant(rightPlant.x, rightPlant.y, 0.9);
  const badge = scenePoint(0.53, 0.57, 6);
  drawFloorBadge(badge.x, badge.y, time);
}

function drawPlant(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  fillRoundRect(ctx, -13, 18, 26, 22, 5, '#9b6a42', '#704b2c');
  ctx.fillStyle = '#14915f';
  for (let i = 0; i < 7; i += 1) {
    const angle = -1.1 + i * 0.36;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * 10, Math.sin(angle) * 9 + 12, 8, 22, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFloorBadge(x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time / 1500) * 0.02);
  ctx.globalAlpha = 0.34;
  fillRoundRect(ctx, -86, -24, 172, 48, 20, 'rgba(255,255,255,0.56)', 'rgba(91,111,143,0.16)');
  drawText('HARNESS FLOW', 0, -6, { font: '900 13px Inter, Segoe UI, sans-serif', color: '#75839a', align: 'center', baseline: 'middle' });
  ctx.restore();
}

function drawWalkways() {
  ctx.save();
  ctx.globalAlpha = 0.48;
  isoRect(0.08, 0.45, 0.84, 0.07, 'rgba(64, 79, 105, 0.08)');
  isoRect(0.47, 0.13, 0.07, 0.74, 'rgba(64, 79, 105, 0.08)');
  ctx.restore();

  ctx.save();
  ctx.setLineDash([9, 13]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(45, 114, 217, 0.22)';
  [[0.20, 0.49, 0.55, 0.30], [0.55, 0.30, 0.84, 0.30], [0.84, 0.35, 0.84, 0.56], [0.50, 0.53, 0.50, 0.82]].forEach(([x1, y1, x2, y2]) => {
    const a = scenePoint(x1, y1, 6);
    const b = scenePoint(x2, y2, 6);
    const c = scenePoint((x1 + x2) / 2, Math.min(y1, y2) - 0.08, 6);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawTaskParticles(time) {
  const lanes = [
    [[0.20, 0.49], [0.55, 0.30]],
    [[0.55, 0.30], [0.84, 0.30]],
    [[0.84, 0.35], [0.84, 0.56]],
    [[0.50, 0.53], [0.50, 0.82]]
  ];

  ctx.save();
  flowParticles.forEach(particle => {
    const lane = lanes[particle.lane];
    const progress = (particle.offset + time * particle.speed) % 1;
    const [start, end] = lane;
    const curveLift = particle.lane === 2 ? 0 : -0.08;
    const control = [(start[0] + end[0]) / 2, Math.min(start[1], end[1]) + curveLift];
    const inv = 1 - progress;
    const x = inv * inv * start[0] + 2 * inv * progress * control[0] + progress * progress * end[0];
    const y = inv * inv * start[1] + 2 * inv * progress * control[1] + progress * progress * end[1];
    ctx.globalAlpha = 0.2 + progress * 0.55;
    ctx.fillStyle = particle.lane === 2 ? '#d92d20' : '#2d72d9';
    ctx.beginPath();
    const point = scenePoint(x, y, 8);
    ctx.arc(point.x, point.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFurniture() {
  drawDesk3d(0.13, 0.27);
  drawDesk3d(0.31, 0.27);
  drawDocumentTable3d(0.55, 0.28);
  drawBoard3d(0.82, 0.21);
  drawLounge3d(0.14, 0.80);
  drawGame3d(0.45, 0.82);
  drawGym3d(0.80, 0.82);
  drawDecisionDesk3d(0.80, 0.55);
}

function drawDesk3d(x, y) {
  isoBox(x - 0.045, y - 0.025, 0.13, 0.075, 24, '#506783', '#334764', '#263951');
  isoBox(x - 0.010, y - 0.060, 0.050, 0.028, 38, '#202a3d', '#121a29', '#111827');
}

function drawDocumentTable3d(x, y) {
  isoBox(x - 0.060, y - 0.045, 0.17, 0.10, 18, '#d6a56b', '#9d744d', '#806044');
  drawDocumentCard(scenePoint(x - 0.030, y - 0.010, 28), -0.08);
  drawDocumentCard(scenePoint(x + 0.045, y + 0.010, 28), 0.12);
}

function drawDocumentCard(point, rotation) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(rotation);
  fillRoundRect(ctx, -28, -18, 56, 36, 5, '#ffffff', '#d9e2ee');
  ctx.strokeStyle = '#d6dee9';
  for (let i = -8; i <= 10; i += 7) {
    ctx.beginPath();
    ctx.moveTo(-18, i);
    ctx.lineTo(18, i);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoard3d(x, y) {
  isoBox(x - 0.055, y - 0.025, 0.17, 0.04, 70, '#dff8ea', '#bfe7d1', '#afdcc5');
  const p = scenePoint(x + 0.02, y - 0.02, 62);
  ctx.save();
  ctx.strokeStyle = '#40b981';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x - 38, p.y);
  ctx.lineTo(p.x + 56, p.y);
  ctx.moveTo(p.x - 38, p.y + 20);
  ctx.lineTo(p.x + 28, p.y + 20);
  ctx.stroke();
  ctx.fillStyle = '#11a36a';
  ctx.beginPath();
  ctx.arc(p.x + 70, p.y + 36, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLounge3d(x, y) {
  isoBox(x - 0.060, y - 0.035, 0.17, 0.08, 22, '#7d5df5', '#5d43c9', '#4c38a9');
  isoBox(x + 0.090, y + 0.015, 0.075, 0.035, 16, '#b67845', '#8f5b35', '#774829');
}

function drawGame3d(x, y) {
  isoBox(x - 0.065, y - 0.040, 0.14, 0.075, 28, '#1f2b48', '#111827', '#0c1322');
  const p = scenePoint(x - 0.005, y - 0.020, 40);
  const glow = ctx.createLinearGradient(p.x - 38, p.y - 18, p.x + 38, p.y + 18);
  glow.addColorStop(0, '#2d4d9f');
  glow.addColorStop(1, '#101827');
  fillRoundRect(ctx, p.x - 38, p.y - 20, 76, 38, 8, glow, '#101827');
  isoBox(x + 0.095, y + 0.035, 0.070, 0.030, 14, '#43516b', '#303b50', '#283247');
}

function drawGym3d(x, y) {
  isoBox(x - 0.065, y - 0.020, 0.15, 0.045, 15, '#ff7474', '#d95f5f', '#ba4d4d');
  const p = scenePoint(x + 0.075, y + 0.015, 24);
  ctx.strokeStyle = '#344054';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x - 30, p.y);
  ctx.lineTo(p.x + 36, p.y);
  ctx.stroke();
}

function drawDecisionDesk3d(x, y) {
  isoBox(x - 0.055, y - 0.035, 0.12, 0.075, 28, '#e32f22', '#b9261d', '#991f18');
  const p = scenePoint(x + 0.13, y - 0.005, 42);
  drawText('?', p.x, p.y, { font: '900 44px Inter, Segoe UI, sans-serif', color: '#d92d20', align: 'center', baseline: 'middle' });
}

function updateAgents(delta, time) {
  agents.forEach(agent => {
    const dx = agent.targetX - agent.x;
    const dy = agent.targetY - agent.y;
    const distance = Math.hypot(dx, dy);
    const moving = distance > 0.006 && time > agent.pauseUntil;
    agent.moving = moving;
    if (moving) {
      const step = Math.min(distance, agent.speed * delta);
      agent.x += (dx / distance) * step;
      agent.y += (dy / distance) * step;
      agent.facing = dx < -0.001 ? -1 : 1;
    } else if (time > agent.pauseUntil) {
      agent.pauseUntil = time + 900 + Math.random() * 1800;
      if (agent.status === 'todo' || agent.status === 'in-progress') {
        setTimeout(() => {
          assignNewTarget(agent, agent.status === 'todo');
          updateActivityList();
        }, agent.pauseUntil - time);
      }
    }
  });
}

function drawAgents(time) {
  [...agents].sort((a, b) => a.y - b.y).forEach(agent => {
    const point = scenePoint(agent.x, agent.y, 22);
    drawAgent(agent, point.x, point.y, time);
  });
}

function drawAgent(agent, x, y, time) {
  const [primary, accent] = rolePalette[agent.role] || rolePalette.analysis;
  const scale = Math.max(0.74, Math.min(1.08, renderSize.width / 1180)) * (0.86 + agent.y * 0.26);
  const walk = agent.moving ? Math.sin(time / 96 + agent.phase) : 0;
  const bob = agent.moving ? Math.sin(time / 115 + agent.phase) * 2.5 : Math.sin(time / 850 + agent.phase) * 1.0;
  const blink = Math.sin(time / 1700 + agent.phase) > 0.96;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale * agent.facing, scale);

  ctx.fillStyle = 'rgba(24, 35, 52, 0.24)';
  ctx.beginPath();
  ctx.ellipse(0, 58, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  drawAgentProp(agent, primary, accent, time);

  const avatar = avatarForRole(agent.role);
  const body = ctx.createLinearGradient(0, -12, 0, 50);
  body.addColorStop(0, avatar.top);
  body.addColorStop(1, avatar.bottom);
  ctx.strokeStyle = 'rgba(25,35,52,0.58)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  drawSoftLimb(-17, -4, -30 + walk * 5, 28, avatar.skin);
  drawSoftLimb(17, -4, 30 - walk * 5, 28, avatar.skin);
  drawSoftLimb(-9, 38, -18 - walk * 7, 60, avatar.pants);
  drawSoftLimb(9, 38, 18 + walk * 7, 60, avatar.pants);

  fillRoundRect(ctx, -22, -8, 44, 58, 11, body, 'rgba(25,35,52,0.58)');
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(-8, 6, 7, 22, -0.22, 0, Math.PI * 2);
  ctx.fill();

  drawLifeSimHead(agent, avatar, primary, blink, time + agent.phase * 100);

  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(0, 20, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const labelOffset = labelOffsetForRole(agent.role);
  drawAgentLabel(agent, x + labelOffset.x * scale, y + (74 + labelOffset.y) * scale);
}

function labelOffsetForRole(role) {
  const offsets = {
    main: { x: -24, y: 0 },
    analysis: { x: 0, y: 12 },
    worker: { x: 14, y: 0 },
    verify: { x: 30, y: 14 },
    docs: { x: 18, y: 0 }
  };
  return offsets[role] || { x: 0, y: 0 };
}

function drawSoftLimb(x1, y1, x2, y2, fill) {
  ctx.strokeStyle = 'rgba(25,35,52,0.50)';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function avatarForRole(role) {
  const avatars = {
    main: { skin: '#f3ba83', hair: '#40241f', top: '#f04f64', bottom: '#fbbf24', pants: '#2f3a55', hairStyle: 'swept' },
    analysis: { skin: '#df9f73', hair: '#191f2e', top: '#7c4dff', bottom: '#c4b5fd', pants: '#312e81', hairStyle: 'short' },
    worker: { skin: '#f1c08f', hair: '#5b3728', top: '#0f9f7a', bottom: '#74d8c0', pants: '#1f2937', hairStyle: 'cap' },
    verify: { skin: '#f4b178', hair: '#2b1c1c', top: '#e08424', bottom: '#fed7aa', pants: '#3f2e20', hairStyle: 'bob' },
    docs: { skin: '#ffd0a3', hair: '#6b2f47', top: '#c03d72', bottom: '#f9a8d4', pants: '#4a2740', hairStyle: 'bun' }
  };
  return avatars[role] || avatars.analysis;
}

function drawLifeSimHead(agent, avatar, primary, blink, time) {
  ctx.save();
  ctx.translate(0, -40);

  drawHairBack(avatar);

  const head = ctx.createRadialGradient(-10, -14, 5, 2, -1, 40);
  head.addColorStop(0, '#ffe1bd');
  head.addColorStop(1, avatar.skin);
  ctx.fillStyle = head;
  ctx.strokeStyle = 'rgba(25,35,52,0.58)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -2, 27, 31, 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawLifeSimHair(avatar, time);
  drawLifeSimFace(agent, primary, blink, time);
  ctx.restore();
}

function drawHairBack(avatar) {
  if (avatar.hairStyle !== 'bun') return;
  ctx.fillStyle = avatar.hair;
  ctx.beginPath();
  ctx.arc(22, -22, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawLifeSimHair(avatar, time) {
  ctx.fillStyle = avatar.hair;
  ctx.beginPath();
  if (avatar.hairStyle === 'cap') {
    ctx.ellipse(0, -25, 27, 11, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    fillRoundRect(ctx, -21, -32, 42, 12, 6, avatar.hair);
    return;
  }
  if (avatar.hairStyle === 'bob') {
    ctx.ellipse(0, -8, 29, 34, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    fillRoundRect(ctx, -25, -22, 9, 35, 5, avatar.hair);
    fillRoundRect(ctx, 16, -22, 9, 35, 5, avatar.hair);
    return;
  }
  if (avatar.hairStyle === 'bun') {
    ctx.ellipse(0, -23, 26, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (avatar.hairStyle === 'swept') {
    ctx.moveTo(-24, -20);
    ctx.quadraticCurveTo(-8, -39, 25, -23);
    ctx.quadraticCurveTo(11, -15, -1, -20);
    ctx.quadraticCurveTo(-10, -11, -24, -20);
    ctx.fill();
    return;
  }
  ctx.ellipse(0, -24, 26, 12, Math.sin(time / 800) * 0.02, Math.PI, Math.PI * 2);
  ctx.fill();
}

function drawLifeSimFace(agent, primary, blink, time) {
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-10, -8, 9, Math.PI + 0.15, Math.PI * 2 - 0.1);
  ctx.arc(10, -8, 9, Math.PI + 0.1, Math.PI * 2 - 0.15);
  ctx.stroke();

  ctx.fillStyle = '#172033';
  if (blink) {
    ctx.strokeStyle = '#172033';
    ctx.beginPath();
    ctx.moveTo(-15, -6);
    ctx.lineTo(-6, -6);
    ctx.moveTo(6, -6);
    ctx.lineTo(15, -6);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(-10, -5, 5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(10, -5, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-11, -7, 1.2, 0, Math.PI * 2);
    ctx.arc(9, -7, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = `rgba(239, 93, 111, ${0.18 + Math.sin(time / 700) * 0.03})`;
  ctx.beginPath();
  ctx.arc(-18, 7, 5, 0, Math.PI * 2);
  ctx.arc(18, 7, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#7a3f2c';
  ctx.fillStyle = '#ffe4d6';
  ctx.lineWidth = 2.4;
  if (agent.status === 'blocked') {
    ctx.beginPath();
    ctx.arc(0, 18, 7, Math.PI + 0.15, Math.PI * 2 - 0.15);
    ctx.stroke();
    drawSweatDrop(22, -15, time);
  } else if (agent.status === 'in-progress') {
    ctx.beginPath();
    ctx.ellipse(0, 17, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawSweatDrop(22, -15, time);
  } else {
    ctx.beginPath();
    ctx.arc(0, 9, 9, 0.18, Math.PI - 0.18);
    ctx.stroke();
  }

  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(0, 27, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawSweatDrop(x, y, time) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time / 280) * 1.5);
  ctx.fillStyle = '#4da3ff';
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.bezierCurveTo(8, 1, 5, 11, 0, 12);
  ctx.bezierCurveTo(-6, 11, -8, 1, 0, -7);
  ctx.fill();
  ctx.restore();
}

function drawAgentProp(agent, primary, accent, time) {
  if (agent.status === 'todo') {
    if (agent.zone === 'game') {
      fillRoundRect(ctx, -26, 24, 52, 18, 8, '#344054', '#1d2738');
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(-12, 33, 3, 0, Math.PI * 2);
      ctx.arc(12, 33, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (agent.zone === 'gym') {
      ctx.strokeStyle = '#344054';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-28, 16);
      ctx.lineTo(28, 16);
      ctx.stroke();
      ctx.fillStyle = primary;
      ctx.fillRect(-36, 10, 10, 12);
      ctx.fillRect(26, 10, 10, 12);
    } else {
      fillRoundRect(ctx, -8, 18, 16, 18, 6, '#f6efe2', '#1d2738');
    }
    return;
  }

  if (agent.status === 'blocked') {
    fillRoundRect(ctx, -17, 18, 34, 24, 7, '#d92d20', '#1d2738');
    drawText('?', 0, 31, { font: '900 18px Inter, Segoe UI, sans-serif', color: '#fff', align: 'center', baseline: 'middle' });
    return;
  }

  if (agent.role === 'docs' || agent.zone === 'docs') {
    fillRoundRect(ctx, -22, 18, 44, 28, 5, '#ffffff', '#1d2738');
    ctx.strokeStyle = '#cbd5e1';
    for (let y = 26; y <= 38; y += 6) {
      ctx.beginPath();
      ctx.moveTo(-14, y);
      ctx.lineTo(14, y);
      ctx.stroke();
    }
    return;
  }

  if (agent.status === 'done') {
    ctx.fillStyle = '#11a36a';
    ctx.beginPath();
    ctx.arc(0, 28, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, 28);
    ctx.lineTo(-2, 34);
    ctx.lineTo(10, 22);
    ctx.stroke();
    return;
  }

  const glow = 0.4 + Math.sin(time / 220 + agent.phase) * 0.2;
  fillRoundRect(ctx, -26, 18, 52, 26, 6, '#1f293d', '#1d2738');
  ctx.fillStyle = `rgba(93, 173, 255, ${glow})`;
  ctx.fillRect(-18, 24, 36, 4);
}

function drawAgentLabel(agent, x, y) {
  const text = `${agent.role} · ${statusText[agent.status]}`;
  ctx.save();
  ctx.font = '800 12px Inter, Segoe UI, sans-serif';
  const width = ctx.measureText(text).width + 18;
  fillRoundRect(ctx, x - width / 2, y - 24, width, 24, 12, 'rgba(255,255,255,0.94)', 'rgba(23,32,51,0.12)');
  drawText(text, x, y - 12, { font: '800 12px Inter, Segoe UI, sans-serif', color: '#172033', align: 'center', baseline: 'middle' });
  ctx.restore();
}

function drawFrame(time) {
  drawWorldBackground(time);
  drawZones();
  drawAgents(time);
}

function animate(now) {
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  updateAgents(delta, now);
  drawFrame(now);
  requestAnimationFrame(animate);
}

sampleButton.addEventListener('click', () => {
  queueText.value = sampleQueue;
  renderFromText();
});

renderButton.addEventListener('click', renderFromText);
shuffleButton.addEventListener('click', shuffleAgents);
startSyncButton.addEventListener('click', startSync);
stopSyncButton.addEventListener('click', stopSync);

fileInput.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  queueText.value = await file.text();
  renderFromText();
});

window.addEventListener('resize', resizeCanvas);

queueText.value = sampleQueue;
resizeCanvas();
renderFromText();
requestAnimationFrame(animate);
