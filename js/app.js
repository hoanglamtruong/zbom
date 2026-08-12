import { state, saveState, ROLES } from './data.js';
import { initUsers, renderUsers } from './users.js';
import { initInventory, renderInventory } from './inventory.js';
import { initCatalog, renderCatalog, updateBOMBadge } from './catalog.js';
import { initBOM, renderBOM, renderBOMHistory } from './bom.js';
import { renderDashboard } from './dashboard.js';

// ── PWA Service Worker ──────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);
}

// ── Page routing ────────────────────────────────
const PAGES = ['dashboard', 'users', 'inventory', 'catalog', 'bom', 'history'];

export function showPage(id) {
  PAGES.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.toggle('hidden', p !== id);
  });
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === id));
  window.location.hash = id;

  if (id === 'dashboard')  renderDashboard();
  if (id === 'users')      renderUsers();
  if (id === 'inventory')  renderInventory();
  if (id === 'catalog')    renderCatalog();
  if (id === 'bom')        renderBOM();
  if (id === 'history')    renderBOMHistory();
}

// ── Role switch ─────────────────────────────────
function applyRole(role) {
  state.currentRole = role; saveState();
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner' || isAdmin;

  document.querySelectorAll('.nav-item').forEach(n => {
    const req = n.dataset.role;
    const show = !req || (req === 'admin' && isAdmin) || (req === 'owner' && isOwner) || req === 'all';
    n.style.display = show ? 'flex' : 'none';
  });

  document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? '' : 'none');
  document.querySelectorAll('.owner-only').forEach(el => el.style.display = isOwner ? '' : 'none');

  const badge = document.getElementById('role-badge');
  if (badge) {
    const r = ROLES[role];
    badge.textContent = `${r.icon} ${r.label}`;
    badge.style.background = r.color + '25';
    badge.style.color = r.color;
  }

  // Redirect if on restricted page
  const hash = location.hash.replace('#','') || 'dashboard';
  const page = PAGES.includes(hash) ? hash : 'dashboard';
  if (page === 'users' && !isAdmin) showPage('dashboard');
  else showPage(page);
}

// ── Dark mode ────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('zbom_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-toggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('zbom_theme', next);
  document.getElementById('theme-toggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

// ── Export / Import JSON ─────────────────────────
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `zbom_backup_${Date.now()}.json` });
  a.click();
}
function importData(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const d = JSON.parse(ev.target.result);
      if (d.users) state.users = d.users;
      if (d.inventory) state.inventory = d.inventory;
      if (d.bomHistory) state.bomHistory = d.bomHistory;
      saveState(); applyRole(state.currentRole); alert('✅ Phục hồi thành công!');
    } catch { alert('❌ File JSON không hợp lệ.'); }
  };
  reader.readAsText(file); e.target.value = '';
}

// ── Sidebar toggle (mobile) ──────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

// ── INIT ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUsers();
  initInventory();
  initCatalog();
  initBOM();

  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(n => {
    n.addEventListener('click', () => { showPage(n.dataset.page); if (window.innerWidth < 768) toggleSidebar(); });
  });

  // Role selector
  const roleSelect = document.getElementById('role-selector');
  roleSelect.value = state.currentRole;
  roleSelect.addEventListener('change', e => applyRole(e.target.value));

  // Theme
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Sidebar
  document.getElementById('menu-toggle').addEventListener('click', toggleSidebar);
  document.getElementById('overlay').addEventListener('click', toggleSidebar);

  // Export/Import
  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('btn-import').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', importData);

  // History filter
  document.getElementById('hist-filter-status')?.addEventListener('change', renderBOMHistory);

  updateBOMBadge();
  applyRole(state.currentRole);
});
