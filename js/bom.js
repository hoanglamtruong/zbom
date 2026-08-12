import { state, saveState, genId, fmt, BOM_STATUS } from './data.js';
import { renderMedia } from './inventory.js';
import { updateBOMBadge } from './catalog.js';

export function initBOM() {
  document.getElementById('btn-submit-bom').addEventListener('click', submitBOM);
  document.getElementById('btn-clear-bom').addEventListener('click', () => {
    if (confirm('Xóa toàn bộ phiếu?')) { state.currentBomItems = []; saveState(); renderBOM(); updateBOMBadge(); }
  });
  renderBOM(); renderBOMHistory();
}

export function renderBOM() {
  const tbody = document.getElementById('table-bom-body');
  if (!tbody) return;
  let total = 0;
  if (!state.currentBomItems.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="td-empty">Chưa chọn vật tư nào. Vào Catalog để chọn.</td></tr>`;
    document.getElementById('bom-total').textContent = fmt.money(0);
    return;
  }
  tbody.innerHTML = state.currentBomItems.map((b, idx) => {
    const item = state.inventory.find(i => i.id === b.inventoryId);
    if (!item) return '';
    const sub = item.price * b.qty;
    total += sub;
    return `
      <tr class="tr-hover">
        <td class="td">${renderMedia(item.media, true)}</td>
        <td class="td"><b>${item.name}</b><br><span class="text-muted text-xs">${item.unit}</span></td>
        <td class="td text-center">
          <div class="qty-control">
            <button onclick="window.__bomQty(${item.id},-1)" class="qty-btn">−</button>
            <input type="number" value="${b.qty}" min="0.1" step="0.1" onchange="window.__bomSet(${item.id},this.value)" class="qty-input">
            <button onclick="window.__bomQty(${item.id},1)" class="qty-btn">+</button>
          </div>
        </td>
        <td class="td text-right text-muted">${fmt.money(item.price)}</td>
        <td class="td text-right price-text">${fmt.money(sub)}</td>
        <td class="td text-xs text-muted"><b>${item.supplierName}</b><br>📞 ${item.supplierContact}<br>📍 ${item.supplierAddress || '—'}</td>
        <td class="td text-center"><button onclick="window.__bomRemove(${item.id})" class="btn-icon danger">✕</button></td>
      </tr>`;
  }).join('');
  document.getElementById('bom-total').textContent = fmt.money(total);

  window.__bomQty = (id, d) => {
    const b = state.currentBomItems.find(x => x.inventoryId === id);
    if (b) { b.qty = Math.max(0.1, +(b.qty + d).toFixed(2)); saveState(); renderBOM(); }
  };
  window.__bomSet = (id, v) => {
    const b = state.currentBomItems.find(x => x.inventoryId === id);
    if (b) { b.qty = Math.max(0.1, parseFloat(v) || 0.1); saveState(); renderBOM(); }
  };
  window.__bomRemove = id => {
    state.currentBomItems = state.currentBomItems.filter(b => b.inventoryId !== id);
    saveState(); renderBOM(); updateBOMBadge();
  };
}

function submitBOM() {
  if (!state.currentBomItems.length) return alert('Phiếu đang trống!');
  const project = document.getElementById('bom-project').value.trim() || '(Chưa đặt tên)';
  const staff = document.getElementById('bom-staff').value.trim() || 'Không rõ';
  const note = document.getElementById('bom-note').value.trim();
  const items = state.currentBomItems.map(b => {
    const inv = state.inventory.find(i => i.id === b.inventoryId);
    return { ...b, snapshot: inv ? { ...inv } : null };
  }).filter(b => b.snapshot);
  const total = items.reduce((s, b) => s + b.snapshot.price * b.qty, 0);
  const bom = { id: genId(), project, staff, note, items, total, status: 'pending', createdAt: Date.now(), reviewedAt: null, reviewer: null, rejectReason: null };
  state.bomHistory.unshift(bom);
  state.currentBomItems = [];
  saveState(); renderBOM(); renderBOMHistory(); updateBOMBadge();
  document.getElementById('bom-project').value = '';
  document.getElementById('bom-staff').value = '';
  document.getElementById('bom-note').value = '';
  alert(`✅ Đã gửi phiếu "${project}" - chờ phê duyệt!`);
}

export function renderBOMHistory() {
  const list = document.getElementById('bom-history-list');
  if (!list) return;
  if (!state.bomHistory.length) {
    list.innerHTML = `<p class="empty-state">Chưa có phiếu nào được gửi.</p>`; return;
  }
  const role = state.currentRole;
  const filterStatus = document.getElementById('hist-filter-status')?.value || '';
  let items = [...state.bomHistory];
  if (filterStatus) items = items.filter(b => b.status === filterStatus);

  list.innerHTML = items.map(bom => {
    const s = BOM_STATUS[bom.status];
    const canReview = (role === 'admin' || role === 'owner') && bom.status === 'pending';
    return `
      <div class="bom-card">
        <div class="bom-card-header">
          <div>
            <h3 class="bom-card-title">${bom.project}</h3>
            <p class="text-muted text-xs">👤 ${bom.staff} · 📅 ${fmt.date(bom.createdAt)}</p>
            ${bom.note ? `<p class="text-muted text-xs mt-1">📝 ${bom.note}</p>` : ''}
          </div>
          <div class="bom-card-meta">
            <span class="badge" style="background:${s.color}20;color:${s.color};font-size:13px">${s.icon} ${s.label}</span>
            <span class="bom-total-chip">${fmt.money(bom.total)}</span>
          </div>
        </div>
        ${bom.rejectReason ? `<p class="reject-reason">❌ Lý do từ chối: ${bom.rejectReason}</p>` : ''}
        <div class="bom-card-actions">
          <button onclick="window.__printBOM(${bom.id})" class="btn-sm outline">🖨 In Phiếu</button>
          ${canReview ? `
            <button onclick="window.__approveBOM(${bom.id})" class="btn-sm success">✅ Phê Duyệt</button>
            <button onclick="window.__rejectBOM(${bom.id})" class="btn-sm danger">❌ Từ Chối</button>` : ''}
          ${(role === 'admin') ? `<button onclick="window.__deleteBOM(${bom.id})" class="btn-sm danger outline">🗑 Xóa</button>` : ''}
        </div>
      </div>`;
  }).join('');

  window.__approveBOM = id => {
    const b = state.bomHistory.find(x => x.id === id);
    if (b) { b.status = 'approved'; b.reviewedAt = Date.now(); b.reviewer = state.currentRole; saveState(); renderBOMHistory(); }
  };
  window.__rejectBOM = id => {
    const reason = prompt('Lý do từ chối:');
    if (reason === null) return;
    const b = state.bomHistory.find(x => x.id === id);
    if (b) { b.status = 'rejected'; b.reviewedAt = Date.now(); b.reviewer = state.currentRole; b.rejectReason = reason || 'Không đạt yêu cầu'; saveState(); renderBOMHistory(); }
  };
  window.__deleteBOM = id => {
    if (confirm('Xóa phiếu này?')) { state.bomHistory = state.bomHistory.filter(b => b.id !== id); saveState(); renderBOMHistory(); }
  };
  window.__printBOM = id => { const b = state.bomHistory.find(x => x.id === id); if (b) printBOM(b); };
}

function printBOM(bom) {
  const s = BOM_STATUS[bom.status];
  const rows = bom.items.map((b, i) => `
    <tr>
      <td>${i+1}</td><td>${b.snapshot.name}</td><td>${b.snapshot.unit}</td>
      <td style="text-align:right">${b.qty}</td>
      <td style="text-align:right">${fmt.money(b.snapshot.price)}</td>
      <td style="text-align:right"><b>${fmt.money(b.snapshot.price * b.qty)}</b></td>
      <td>${b.snapshot.supplierName}<br><small>${b.snapshot.supplierContact}</small></td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Phiếu BOM - ${bom.project}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#111;font-size:13px}
    h1{font-size:20px;text-align:center;margin-bottom:4px}
    .sub{text-align:center;color:#555;margin-bottom:20px;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{border:1px solid #ccc;padding:6px 10px}
    th{background:#1e293b;color:#fff}
    tfoot td{font-weight:bold;background:#f1f5f9}
    .status{display:inline-block;padding:2px 12px;border-radius:99px;font-size:12px;background:#e0fdf4;color:#047857}
    @media print{body{padding:0}}
  </style></head><body>
  <h1>PHIẾU YÊU CẦU VẬT TƯ (BOM)</h1>
  <p class="sub">Hạng mục: <b>${bom.project}</b> · Người lập: <b>${bom.staff}</b> · Ngày: ${fmt.date(bom.createdAt)}</p>
  <p>Trạng thái: <span class="status">${s.icon} ${s.label}</span>${bom.rejectReason ? ' — Lý do: '+bom.rejectReason : ''}</p>
  <table><thead><tr><th>#</th><th>Vật tư</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th>Nhà cung cấp</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td colspan="5" style="text-align:right">Tổng cộng:</td><td colspan="2">${fmt.money(bom.total)}</td></tr></tfoot>
  </table>
  <div style="margin-top:30px;display:flex;justify-content:space-between;font-size:12px">
    <div style="text-align:center"><p>Người lập phiếu</p><br><br><p><b>${bom.staff}</b></p></div>
    <div style="text-align:center"><p>Quản lý phê duyệt</p><br><br><p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p></div>
  </div>
  <script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html); w.document.close();
}
