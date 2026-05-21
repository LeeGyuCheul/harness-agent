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

const statusLabel = {
  todo: 'off duty',
  'in-progress': 'working',
  done: 'complete',
  blocked: 'needs decision',
  skipped: 'away'
};

const actionCopy = {
  main: {
    'in-progress': 'writing the plan at the board',
    todo: 'checking the lounge schedule',
    done: 'reviewing the finished board',
    blocked: 'waiting at the decision desk',
    skipped: 'away from the floor'
  },
  analysis: {
    'in-progress': 'reading evidence at the document table',
    todo: 'taking a coffee break',
    done: 'placing notes on the review board',
    blocked: 'flagging an open question',
    skipped: 'away from the floor'
  },
  worker: {
    'in-progress': 'typing at a workstation',
    todo: 'playing a quick game',
    done: 'leaving the keyboard clean',
    blocked: 'waiting for ownership details',
    skipped: 'away from the floor'
  },
  verify: {
    'in-progress': 'checking the review board',
    todo: 'stretching in the gym corner',
    done: 'marking verification complete',
    blocked: 'holding a failed check',
    skipped: 'away from the floor'
  },
  docs: {
    'in-progress': 'sorting handoff notes',
    todo: 'reading in the lounge',
    done: 'stacking completed notes',
    blocked: 'waiting for missing evidence',
    skipped: 'away from the floor'
  }
};

const zonePoints = {
  work: [{ x: 18, y: 24 }, { x: 34, y: 26 }, { x: 25, y: 35 }],
  docs: [{ x: 55, y: 24 }, { x: 64, y: 27 }, { x: 58, y: 34 }],
  review: [{ x: 80, y: 24 }, { x: 89, y: 26 }, { x: 83, y: 35 }],
  lounge: [{ x: 14, y: 76 }, { x: 25, y: 82 }, { x: 19, y: 68 }],
  game: [{ x: 43, y: 78 }, { x: 54, y: 80 }, { x: 49, y: 70 }],
  gym: [{ x: 75, y: 80 }, { x: 88, y: 79 }, { x: 81, y: 70 }],
  blocked: [{ x: 78, y: 51 }, { x: 88, y: 53 }, { x: 83, y: 59 }],
  away: [{ x: 7, y: 50 }, { x: 93, y: 48 }, { x: 50, y: 92 }]
};

const roleTargetZone = {
  main: 'review',
  analysis: 'docs',
  worker: 'work',
  verify: 'review',
  docs: 'docs'
};

const idleZones = ['lounge', 'game', 'gym'];

const world = document.querySelector('#world');
const layer = document.querySelector('#agent-layer');
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
const syncIntervalMs = 5000;

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

function pointForZone(zone) {
  const point = pick(zonePoints[zone] || zonePoints.lounge);
  return {
    x: point.x + (Math.random() * 5 - 2.5),
    y: point.y + (Math.random() * 5 - 2.5)
  };
}

function targetZoneFor(item) {
  if (item.status === 'blocked') return 'blocked';
  if (item.status === 'skipped') return 'away';
  if (item.status === 'done') return 'review';
  if (item.status === 'todo') return pick(idleZones);
  return roleTargetZone[item.role] || 'work';
}

function activityFor(item, zone) {
  if (item.status === 'todo') {
    if (zone === 'game') return 'playing a quick game';
    if (zone === 'gym') return 'stretching in the gym corner';
    return 'drinking coffee in the lounge';
  }
  return actionCopy[item.role]?.[item.status] || statusLabel[item.status] || 'moving';
}

function createAgentElement(item) {
  const node = document.createElement('div');
  node.className = 'agent walking';
  node.dataset.role = item.role;
  node.dataset.status = item.status;
  node.innerHTML = `
    <div class="agent-label"></div>
    <div class="agent-shadow"></div>
    <div class="agent-head"></div>
    <div class="agent-hair"></div>
    <div class="agent-face"></div>
    <div class="agent-body"></div>
    <div class="agent-arm left"></div>
    <div class="agent-arm right"></div>
    <div class="agent-leg left"></div>
    <div class="agent-leg right"></div>
    <div class="agent-prop"></div>
  `;
  node.querySelector('.agent-label').textContent = `${item.role} · ${statusLabel[item.status]}`;
  return node;
}

function classForActivity(item, zone, moving) {
  const classes = ['agent'];
  if (moving) classes.push('walking');
  if (item.status === 'in-progress') classes.push('working');
  if (item.status === 'todo') classes.push('resting');
  if (item.status === 'done') classes.push('done');
  if (item.status === 'blocked') classes.push('blocked');
  if (item.status === 'skipped') classes.push('skipped');
  if (zone === 'gym') classes.push('gym');
  if (zone === 'game') classes.push('game');
  if (item.role === 'docs' || zone === 'docs') classes.push('docs');
  return classes.join(' ');
}

function buildAgents(items) {
  layer.innerHTML = '';
  agents = items.map((item, index) => {
    const zone = targetZoneFor(item);
    const start = pointForZone(pick(['lounge', 'game', 'work', 'docs', 'review']));
    const target = pointForZone(zone);
    const node = createAgentElement(item);
    layer.appendChild(node);
    return {
      ...item,
      node,
      x: start.x,
      y: start.y,
      targetX: target.x,
      targetY: target.y,
      zone,
      speed: 10 + index * 1.5 + Math.random() * 6,
      pauseUntil: 0,
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

function updateAgent(agent, delta, bounds, now) {
  const dx = agent.targetX - agent.x;
  const dy = agent.targetY - agent.y;
  const distance = Math.hypot(dx, dy);
  const moving = distance > 0.7 && now > agent.pauseUntil;

  if (moving) {
    const step = Math.min(distance, agent.speed * delta);
    agent.x += (dx / distance) * step;
    agent.y += (dy / distance) * step;
  } else if (now > agent.pauseUntil) {
    agent.pauseUntil = now + 900 + Math.random() * 1800;
    if (agent.status === 'todo' || agent.status === 'in-progress') {
      setTimeout(() => {
        assignNewTarget(agent, agent.status === 'todo');
        updateActivityList();
      }, agent.pauseUntil - now);
    }
  }

  const pixelX = (agent.x / 100) * Math.max(1, bounds.width - 58);
  const pixelY = (agent.y / 100) * Math.max(1, bounds.height - 92);
  const bob = moving ? Math.sin(now / 120) * 1.7 : Math.sin(now / 900) * 0.7;
  agent.node.style.transform = `translate3d(${pixelX}px, ${pixelY + bob}px, 0)`;
  agent.node.style.zIndex = String(20 + Math.round(pixelY));
  agent.node.className = classForActivity(agent, agent.zone, moving);
  agent.node.dataset.role = agent.role;
  agent.node.dataset.status = agent.status;
  agent.node.querySelector('.agent-label').textContent = `${agent.role} · ${statusLabel[agent.status]}`;
}

function animate(now) {
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const bounds = world.getBoundingClientRect();
  agents.forEach(agent => updateAgent(agent, delta, bounds, now));
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

queueText.value = sampleQueue;
renderFromText();
requestAnimationFrame(animate);
