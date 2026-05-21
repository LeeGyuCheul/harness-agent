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

const roleAction = {
  main: 'planning at the board',
  analysis: 'reading evidence',
  worker: 'typing changes',
  verify: 'checking results',
  docs: 'organizing notes'
};

const statusLabel = {
  todo: 'coffee break',
  'in-progress': 'working',
  done: 'complete',
  blocked: 'blocked',
  skipped: 'away'
};

const grid = document.querySelector('#agent-grid');
const template = document.querySelector('#agent-card-template');
const queueText = document.querySelector('#queue-text');
const renderButton = document.querySelector('#render-queue');
const sampleButton = document.querySelector('#load-sample');
const fileInput = document.querySelector('#queue-file');
const summaryCount = document.querySelector('#summary-count');
const summaryActive = document.querySelector('#summary-active');

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

function renderAgents(items) {
  grid.innerHTML = '';
  items.forEach(item => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.role = item.role;
    node.dataset.status = item.status;
    node.querySelector('.agent-role').textContent = item.role;
    node.querySelector('.agent-status').textContent = statusLabel[item.status] || item.status;
    node.querySelector('.agent-id').textContent = item.id;
    node.querySelector('.agent-goal').textContent = item.goal;
    node.querySelector('.agent-scope').textContent = `${item.scope} · ${roleAction[item.role] || 'working'}`;
    grid.appendChild(node);
  });

  const active = items.filter(item => item.status === 'in-progress').length;
  const blocked = items.filter(item => item.status === 'blocked').length;
  summaryCount.textContent = `${items.length} agents`;
  summaryActive.textContent = blocked ? `${active} active · ${blocked} blocked` : `${active} active`;
}

function renderFromText() {
  renderAgents(parseQueue(queueText.value));
}

sampleButton.addEventListener('click', () => {
  queueText.value = sampleQueue;
  renderFromText();
});

renderButton.addEventListener('click', renderFromText);

fileInput.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  queueText.value = await file.text();
  renderFromText();
});

queueText.value = sampleQueue;
renderFromText();
