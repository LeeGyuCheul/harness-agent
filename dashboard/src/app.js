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
  work: { label: 'WORKSTATIONS', x: 0.05, y: 0.08, w: 0.38, h: 0.30, color: '#eaf4ff' },
  docs: { label: 'DOCUMENT TABLE', x: 0.48, y: 0.08, w: 0.22, h: 0.28, color: '#fff6e8' },
  review: { label: 'REVIEW BOARD', x: 0.74, y: 0.08, w: 0.21, h: 0.29, color: '#eafaf1' },
  lounge: { label: 'LOUNGE', x: 0.06, y: 0.70, w: 0.26, h: 0.23, color: '#f5efff' },
  game: { label: 'GAME CORNER', x: 0.36, y: 0.72, w: 0.25, h: 0.21, color: '#f0f4ff' },
  gym: { label: 'GYM CORNER', x: 0.72, y: 0.70, w: 0.23, h: 0.23, color: '#fff0f0' },
  blocked: { label: 'DECISION DESK', x: 0.72, y: 0.46, w: 0.22, h: 0.18, color: '#fff2ed' },
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

  ctx.save();
  ctx.globalAlpha = 0.24;
  for (let x = 0; x < width; x += 28) {
    ctx.strokeStyle = '#cbd7e6';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 28) {
    ctx.strokeStyle = '#cbd7e6';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
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

function drawZones() {
  Object.entries(zones).forEach(([key, zone]) => {
    if (key === 'away') return;
    const x = px(zone.x);
    const y = py(zone.y);
    const w = px(zone.w);
    const h = py(zone.h);
    ctx.save();
    ctx.shadowColor = 'rgba(31, 42, 68, 0.13)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 12;
    fillRoundRect(ctx, x, y, w, h, 16, zone.color, 'rgba(103,119,145,0.28)');
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.36;
    const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
    sheen.addColorStop(0, 'rgba(255,255,255,0.88)');
    sheen.addColorStop(0.38, 'rgba(255,255,255,0)');
    sheen.addColorStop(1, 'rgba(255,255,255,0.32)');
    fillRoundRect(ctx, x + 1, y + 1, w - 2, h - 2, 15, sheen);
    ctx.restore();

    drawText(zone.label, x + 13, y + 12, { font: '800 12px Inter, Segoe UI, sans-serif', color: '#435269' });
  });

  drawWalkways();
  drawFurniture();
  drawTaskParticles(performance.now());
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

  drawPlant(px(0.055), py(0.60), 1.0);
  drawPlant(px(0.955), py(0.42), 0.9);
  drawFloorBadge(px(0.50), py(0.56), time);
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
  ctx.globalAlpha = 0.6;
  fillRoundRect(ctx, px(0.08), py(0.48), px(0.84), 34, 18, 'rgba(64, 79, 105, 0.08)');
  fillRoundRect(ctx, px(0.50), py(0.12), 30, py(0.74), 18, 'rgba(64, 79, 105, 0.08)');
  ctx.restore();

  ctx.save();
  ctx.setLineDash([9, 13]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(45, 114, 217, 0.22)';
  [[0.20, 0.49, 0.55, 0.30], [0.55, 0.30, 0.84, 0.30], [0.84, 0.35, 0.84, 0.56], [0.50, 0.53, 0.50, 0.82]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(px(x1), py(y1));
    ctx.quadraticCurveTo(px((x1 + x2) / 2), py(Math.min(y1, y2) - 0.08), px(x2), py(y2));
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
    ctx.arc(px(x), py(y), particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFurniture() {
  drawDesk(px(0.14), py(0.27));
  drawDesk(px(0.31), py(0.28));
  drawDocuments(px(0.55), py(0.28));
  drawDocuments(px(0.64), py(0.29), -0.12);
  drawBoard(px(0.79), py(0.25));
  drawLounge(px(0.14), py(0.80));
  drawGame(px(0.45), py(0.82));
  drawGym(px(0.78), py(0.82));
  drawDecisionDesk(px(0.78), py(0.55));
}

function drawDesk(x, y) {
  fillRoundRect(ctx, x - 54, y + 14, 108, 40, 8, '#354e70');
  fillRoundRect(ctx, x - 20, y - 4, 40, 28, 6, '#111827');
  fillRoundRect(ctx, x - 16, y, 32, 20, 4, '#223453');
  ctx.fillStyle = 'rgba(45,114,217,0.22)';
  ctx.fillRect(x - 13, y + 4, 26, 3);
}

function drawDocuments(x, y, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  fillRoundRect(ctx, -32, -24, 64, 48, 6, '#ffffff', '#d9e2ee');
  ctx.strokeStyle = '#d6dee9';
  for (let i = -12; i <= 14; i += 8) {
    ctx.beginPath();
    ctx.moveTo(-22, i);
    ctx.lineTo(22, i);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoard(x, y) {
  ctx.strokeStyle = '#5bc28c';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 38, y);
  ctx.lineTo(x + 55, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 38, y + 25);
  ctx.lineTo(x + 30, y + 25);
  ctx.stroke();
  ctx.fillStyle = '#11a36a';
  ctx.beginPath();
  ctx.arc(x + 70, y + 50, 18, 0, Math.PI * 2);
  ctx.fill();
}

function drawLounge(x, y) {
  fillRoundRect(ctx, x - 70, y - 26, 142, 48, 18, '#7657ef');
  fillRoundRect(ctx, x + 78, y - 10, 64, 24, 14, '#a36a3c');
}

function drawGame(x, y) {
  fillRoundRect(ctx, x - 52, y - 42, 104, 58, 8, '#17213a');
  const glow = ctx.createLinearGradient(x - 42, y - 34, x + 42, y + 8);
  glow.addColorStop(0, '#263b78');
  glow.addColorStop(1, '#101827');
  fillRoundRect(ctx, x - 45, y - 35, 90, 44, 6, glow);
  fillRoundRect(ctx, x + 58, y - 10, 54, 24, 14, '#344054');
}

function drawGym(x, y) {
  fillRoundRect(ctx, x - 66, y - 24, 120, 42, 22, '#f76b6b');
  fillRoundRect(ctx, x + 34, y - 8, 72, 14, 8, '#344054');
}

function drawDecisionDesk(x, y) {
  fillRoundRect(ctx, x - 50, y - 22, 92, 52, 8, '#d92d20');
  drawText('?', x + 78, y - 26, { font: '900 46px Inter, Segoe UI, sans-serif', color: '#d92d20' });
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
    drawAgent(agent, px(agent.x), py(agent.y), time);
  });
}

function drawAgent(agent, x, y, time) {
  const [primary, accent] = rolePalette[agent.role] || rolePalette.analysis;
  const scale = Math.max(0.72, Math.min(1.06, renderSize.width / 1100));
  const walk = agent.moving ? Math.sin(time / 100 + agent.phase) : 0;
  const bob = agent.moving ? Math.sin(time / 120 + agent.phase) * 2.2 : Math.sin(time / 850 + agent.phase) * 0.8;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale * agent.facing, scale);

  ctx.fillStyle = 'rgba(24, 35, 52, 0.20)';
  ctx.beginPath();
  ctx.ellipse(0, 38, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  drawAgentProp(agent, primary, accent, time);

  ctx.strokeStyle = '#1d2738';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.fillStyle = '#ffd1a3';

  drawLimb(-12, 2, -23 + walk * 5, 23, '#ffd1a3');
  drawLimb(12, 2, 23 - walk * 5, 23, '#ffd1a3');

  drawLimb(-8, 27, -15 - walk * 7, 50, '#2a3954');
  drawLimb(8, 27, 15 + walk * 7, 50, '#2a3954');

  const body = ctx.createLinearGradient(0, -2, 0, 32);
  body.addColorStop(0, accent);
  body.addColorStop(1, primary);
  fillRoundRect(ctx, -18, -6, 36, 42, 12, body, '#1d2738');

  ctx.fillStyle = '#ffd1a3';
  ctx.beginPath();
  ctx.arc(0, -28, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#26344d';
  ctx.beginPath();
  ctx.ellipse(0, -39, 18, 10, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(29,39,56,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-7, -25);
  ctx.lineTo(7, -25);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -19, 6, 0.12, Math.PI - 0.12);
  ctx.stroke();

  ctx.restore();

  drawAgentLabel(agent, x, y - 52 * scale);
}

function drawLimb(x1, y1, x2, y2, fill) {
  ctx.strokeStyle = '#1d2738';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
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
