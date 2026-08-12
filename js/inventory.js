import { state, saveState, genId, CATEGORIES, fmt } from './data.js';

let editingId = null;
let pendingMedia = null;

export function initInventory() {
  document.getElementById('form-inventory').addEventListener('submit', saveItem);
  document.getElementById('inp-item-media').addEventListener('change', handleMedia);
  document.getElementById('btn-cancel-edit').addEventListener('click', cancelEdit);
  renderInventory();
}

function handleMedia(e) {
  const file = e.target.files[0];
  if (!file) { pendingMedia = null; return; }
  const reader = new FileReader();
  reader.onload = ev => {
    pendingMedia = { type: file.type, data: ev.target.result };
    const prev = document.getElementById('media-preview');
    prev.innerHTML = file.type.startsWith('video/')
      ? `<video src="${ev.target.result}" controls class="preview-media"></video>`
      : `<img src="${ev.target.result}" class="preview-media">`;
  };
  reader.readAsDataURL(file);
}

export function renderMedia(m, thumb = true) {
  if (!m?.data) return `<div class="no-media">${thumb ? '📷' : 'Không có ảnh'}</div>`;
  const cls = thumb ? 'media-thumb' : 'media-card';
  if (m.type.startsWith('video/'))
    return `<video src="${m.data}" class="${cls}" ${thumb ? 'title="▶ Play"' : 'controls'}></video>`;
  return `<img src="${m.data}" class="${cls}" onclick="window.open('${m.data}')">`;
}

export function renderInventory() {
  const tbody = document.getElementById('table-inv-body');
  if (!tbody) return;
  const kw = (document.getElementById('inv-search')?.value || '').toLowerCase();
  const cat = document.getElementById('inv-filter-cat')?.value || '';
  let items = state.inventory;
  if (kw) items = items.filter(i => i.name.toLowerCase().includes(kw) || i.supplierName.toLowerCase().includes(kw));
  if (cat) items = items.filter(i => i.category === cat);
  tbody.innerHTML = '';
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="td-empty">Chưa có vật tư nào.</td></tr>`;
    return;
  }
  items.forEach(item => {
    const c = CATEGORIES[item.category];
    tbody.innerHTML += `
      <tr class="tr-hover">
        <td class="td">${renderMedia(item.media, true)}</td>
        <td class="td"><b>${item.name}</b><br><span class="badge" style="background:${c.color}20;color:${c.color}">${c.icon} ${c.label}</span></td>
        <td class="td text-muted">${item.unit}</td>
        <td class="td text-right price-text">${fmt.money(item.price)}</td>
        <td class="td"><b>${item.supplierName}</b><br><span class="text-muted text-xs">📞 ${item.supplierContact}</span></td>
        <td class="td text-muted text-xs">📍 ${item.supplierAddress || '—'}</td>
        <td class="td text-muted text-xs italic">${item.supplierNote || '—'}</td>
        <td class="td text-center">
          <button onclick="window.__editItem(${item.id})" class="btn-icon">✏️</button>
          <button onclick="window.__deleteItem(${item.id})" class="btn-icon danger">🗑</button>
        </td>
      </tr>`;
  });
  window.__deleteItem = id => {
    if (confirm('Xóa vật tư này?')) {
      state.inventory = state.inventory.filter(i => i.id !== id);
      state.currentBomItems = state.currentBomItems.filter(b => b.inventoryId !== id);
      saveState(); renderInventory(); updateInvBadge();
    }
  };
  window.__editItem = id => {
    const item = state.inventory.find(i => i.id === id);
    if (!item) return;
    editingId = id; pendingMedia = item.media || null;
    document.getElementById('inp-item-name').value = item.name;
    document.getElementById('inp-item-productgroup').value = item.productGroup || '';
    document.getElementById('inp-item-category').value = item.category;
    document.getElementById('inp-item-unit').value = item.unit;
    document.getElementById('inp-item-price').value = item.price;
    document.getElementById('inp-supplier-name').value = item.supplierName;
    document.getElementById('inp-supplier-contact').value = item.supplierContact;
    document.getElementById('inp-supplier-address').value = item.supplierAddress || '';
    document.getElementById('inp-supplier-note').value = item.supplierNote || '';
    if (pendingMedia) {
      const prev = document.getElementById('media-preview');
      prev.innerHTML = pendingMedia.type.startsWith('video/')
        ? `<video src="${pendingMedia.data}" controls class="preview-media"></video>`
        : `<img src="${pendingMedia.data}" class="preview-media">`;
    }
    document.getElementById('btn-cancel-edit').classList.remove('hidden');
    document.getElementById('form-inventory').scrollIntoView({ behavior: 'smooth' });
  };
}

function saveItem(e) {
  e.preventDefault();
  const item = {
    id: editingId || genId(),
    name: document.getElementById('inp-item-name').value.trim(),
    productGroup: document.getElementById('inp-item-productgroup').value.trim(),
    category: document.getElementById('inp-item-category').value,
    unit: document.getElementById('inp-item-unit').value.trim(),
    price: parseFloat(document.getElementById('inp-item-price').value) || 0,
    media: pendingMedia,
    supplierName: document.getElementById('inp-supplier-name').value.trim(),
    supplierContact: document.getElementById('inp-supplier-contact').value.trim(),
    supplierAddress: document.getElementById('inp-supplier-address').value.trim(),
    supplierNote: document.getElementById('inp-supplier-note').value.trim(),
    createdAt: editingId ? (state.inventory.find(i => i.id === editingId)?.createdAt || Date.now()) : Date.now()
  };
  if (editingId) state.inventory = state.inventory.map(i => i.id === editingId ? item : i);
  else state.inventory.unshift(item);
  cancelEdit(); saveState(); renderInventory();
  document.getElementById('form-inventory').reset();
  document.getElementById('media-preview').innerHTML = '<span class="text-muted">Xem trước</span>';
}

function cancelEdit() {
  editingId = null; pendingMedia = null;
  document.getElementById('btn-cancel-edit').classList.add('hidden');
  document.getElementById('form-inventory').reset();
  document.getElementById('media-preview').innerHTML = '<span class="text-muted">Xem trước</span>';
}

function updateInvBadge() {
  const n = state.currentBomItems.length;
  const b = document.getElementById('bom-count-badge');
  if (b) { b.textContent = n; b.style.display = n > 0 ? 'inline' : 'none'; }
}
