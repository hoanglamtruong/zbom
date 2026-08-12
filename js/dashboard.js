import { state, fmt, CATEGORIES, BOM_STATUS } from './data.js';

export function renderDashboard() {
  const el = id => document.getElementById(id);
  if (!el('dash-total-items')) return;

  const totalItems = state.inventory.length;
  const totalValue = state.inventory.reduce((s, i) => s + i.price, 0);
  const totalBOMs = state.bomHistory.length;
  const pendingBOMs = state.bomHistory.filter(b => b.status === 'pending').length;
  const approvedBOMs = state.bomHistory.filter(b => b.status === 'approved').length;
  const totalBOMValue = state.bomHistory.filter(b => b.status === 'approved').reduce((s,b) => s + b.total, 0);

  el('dash-total-items').textContent = totalItems;
  el('dash-total-value').textContent = fmt.money(totalValue);
  el('dash-total-boms').textContent = totalBOMs;
  el('dash-pending-boms').textContent = pendingBOMs;
  el('dash-approved-boms').textContent = approvedBOMs;
  el('dash-bom-value').textContent = fmt.money(totalBOMValue);

  // Category breakdown
  const catEl = el('dash-cat-breakdown');
  if (catEl) {
    const counts = {};
    state.inventory.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    catEl.innerHTML = Object.entries(CATEGORIES).map(([k, c]) => {
      const n = counts[k] || 0;
      const pct = totalItems ? Math.round(n / totalItems * 100) : 0;
      return `
        <div class="cat-bar-row">
          <span class="cat-bar-label">${c.icon} ${c.label}</span>
          <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%;background:${c.color}"></div></div>
          <span class="cat-bar-count">${n}</span>
        </div>`;
    }).join('');
  }

  // Recent BOMs
  const recentEl = el('dash-recent-boms');
  if (recentEl) {
    const recent = state.bomHistory.slice(0, 5);
    if (!recent.length) { recentEl.innerHTML = `<p class="empty-state">Chưa có phiếu nào.</p>`; return; }
    recentEl.innerHTML = recent.map(b => {
      const s = BOM_STATUS[b.status];
      return `
        <div class="recent-bom-row">
          <div><b>${b.project}</b> <span class="text-muted text-xs">— ${b.staff}</span></div>
          <div class="recent-bom-right">
            <span class="badge" style="background:${s.color}20;color:${s.color}">${s.icon} ${s.label}</span>
            <span class="price-text text-sm">${fmt.money(b.total)}</span>
          </div>
        </div>`;
    }).join('');
  }

  // BOM status pie (simple CSS)
  const statusEl = el('dash-status-breakdown');
  if (statusEl) {
    statusEl.innerHTML = Object.entries(BOM_STATUS).map(([k, s]) => {
      const n = state.bomHistory.filter(b => b.status === k).length;
      return `<div class="status-chip" style="background:${s.color}20;border:1px solid ${s.color}40">
        <span style="color:${s.color}">${s.icon} ${s.label}</span>
        <b style="color:${s.color}">${n}</b>
      </div>`;
    }).join('');
  }
}
