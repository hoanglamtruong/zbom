import { state, saveState, CATEGORIES, fmt } from './data.js';
import { renderMedia } from './inventory.js';

export function initCatalog() {
  document.getElementById('catalog-search').addEventListener('input', renderCatalog);
  document.getElementById('catalog-filter-cat').addEventListener('change', renderCatalog);
  document.getElementById('catalog-sort').addEventListener('change', renderCatalog);
  renderCatalog();
}

export function renderCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  const kw = document.getElementById('catalog-search').value.toLowerCase();
  const cat = document.getElementById('catalog-filter-cat').value;
  const sort = document.getElementById('catalog-sort').value;

  let items = [...state.inventory];
  if (kw) items = items.filter(i => i.name.toLowerCase().includes(kw) || i.supplierName.toLowerCase().includes(kw) || i.supplierAddress?.toLowerCase().includes(kw));
  if (cat) items = items.filter(i => i.category === cat);
  if (sort === 'price_asc') items.sort((a,b) => a.price - b.price);
  else if (sort === 'price_desc') items.sort((a,b) => b.price - a.price);
  else if (sort === 'name') items.sort((a,b) => a.name.localeCompare(b.name));
  else items.sort((a,b) => b.createdAt - a.createdAt);

  if (!items.length) {
    grid.innerHTML = `<p class="empty-state col-span-4">Không tìm thấy sản phẩm nào phù hợp 🔍</p>`;
    return;
  }

  // Gom các vật tư cùng productGroup (khác rỗng) vào 1 thẻ duy nhất; vị trí thẻ nhóm
  // trên lưới = vị trí của biến thể đầu tiên gặp trong danh sách đã lọc/sắp xếp ở trên,
  // nên thứ tự sort (giá/tên/mới nhất) vẫn phản ánh đúng lên thẻ nhóm. Item không có
  // productGroup (rỗng hoặc thiếu field — dữ liệu cũ) luôn hiển thị thẻ riêng lẻ.
  const cards = [];
  const groupIdx = new Map();
  items.forEach(item => {
    const pg = (item.productGroup || '').trim();
    if (!pg) { cards.push({ type: 'single', item }); return; }
    if (groupIdx.has(pg)) cards[groupIdx.get(pg)].items.push(item);
    else { groupIdx.set(pg, cards.length); cards.push({ type: 'group', name: pg, items: [item] }); }
  });

  grid.innerHTML = cards.map((card, idx) => card.type === 'single' ? renderSingleCard(card.item) : renderGroupCard(card, idx)).join('');

  window.__addToBOM = id => {
    const ex = state.currentBomItems.find(b => b.inventoryId === id);
    if (ex) ex.qty += 1; else state.currentBomItems.push({ inventoryId: id, qty: 1 });
    saveState(); renderCatalog(); updateBOMBadge();
  };

  // Đổi biến thể trong dropdown của thẻ nhóm -> cập nhật giá/ĐVT/NCC/trạng thái nút hiển thị.
  window.__onGroupVariantChange = idx => {
    const item = cards[idx].items.find(i => i.id === +document.getElementById(`grp-variant-${idx}`).value);
    if (item) updateGroupPanel(idx, item);
  };

  window.__addGroupToBOM = idx => {
    const id = +document.getElementById(`grp-variant-${idx}`).value;
    const qty = Math.max(0.1, parseFloat(document.getElementById(`grp-qty-${idx}`).value) || 1);
    const ex = state.currentBomItems.find(b => b.inventoryId === id);
    if (ex) ex.qty += qty; else state.currentBomItems.push({ inventoryId: id, qty });
    saveState(); renderCatalog(); updateBOMBadge();
  };
}

function renderSingleCard(item) {
  const c = CATEGORIES[item.category] || { label: item.category, color: '#6366f1', icon: '📦' };
  const inBOM = state.currentBomItems.find(b => b.inventoryId === item.id);
  return `
    <div class="catalog-card">
      <div class="catalog-media">${renderMedia(item.media, false)}</div>
      <div class="catalog-body">
        <span class="cat-chip" style="background:${c.color}20;color:${c.color}">${c.icon} ${c.label}</span>
        <h3 class="catalog-title" title="${item.name}">${item.name}</h3>
        <p class="catalog-supplier">🏢 ${item.supplierName}</p>
        <p class="catalog-addr">📍 ${item.supplierAddress || 'Liên hệ trực tiếp'}</p>
        <div class="catalog-price-row">
          <span class="catalog-price">${fmt.money(item.price)}</span>
          <span class="catalog-unit">/ ${item.unit}</span>
        </div>
        <button onclick="window.__addToBOM(${item.id})" class="btn-add-bom ${inBOM ? 'added' : ''}">
          ${inBOM ? `✅ Trong BOM (${inBOM.qty})` : '+ Đưa vào Phiếu BOM'}
        </button>
      </div>
    </div>`;
}

// Thẻ gom nhóm: nhiều biến thể (size/độ dày) cùng 1 sản phẩm gốc, chọn qua dropdown rồi mới thêm vào BOM.
function renderGroupCard(card, idx) {
  const items = card.items;
  const first = items[0];
  const repMedia = (items.find(i => i.media) || first).media;
  const c = CATEGORIES[first.category] || { label: first.category, color: '#6366f1', icon: '📦' };
  const inBOM = state.currentBomItems.find(b => b.inventoryId === first.id);
  return `
    <div class="catalog-card">
      <div class="catalog-media">${renderMedia(repMedia, false)}</div>
      <div class="catalog-body">
        <span class="cat-chip" style="background:${c.color}20;color:${c.color}">${c.icon} ${c.label}</span>
        <h3 class="catalog-title" title="${card.name}">${card.name}</h3>
        <p class="catalog-supplier" id="grp-supplier-${idx}">🏢 ${first.supplierName}</p>
        <label>Chọn biến thể (${items.length})</label>
        <select id="grp-variant-${idx}" onchange="window.__onGroupVariantChange(${idx})">
          ${items.map(i => `<option value="${i.id}">${i.name} — ${fmt.money(i.price)}/${i.unit}</option>`).join('')}
        </select>
        <div class="catalog-price-row">
          <span class="catalog-price" id="grp-price-${idx}">${fmt.money(first.price)}</span>
          <span class="catalog-unit" id="grp-unit-${idx}">/ ${first.unit}</span>
        </div>
        <label>Số lượng</label>
        <input type="number" id="grp-qty-${idx}" value="1" min="0.1" step="0.1" style="margin-bottom:10px">
        <button onclick="window.__addGroupToBOM(${idx})" class="btn-add-bom ${inBOM ? 'added' : ''}" id="grp-btn-${idx}">
          ${inBOM ? `✅ Trong BOM (${inBOM.qty})` : '+ Đưa vào Phiếu BOM'}
        </button>
      </div>
    </div>`;
}

function updateGroupPanel(idx, item) {
  document.getElementById(`grp-price-${idx}`).textContent = fmt.money(item.price);
  document.getElementById(`grp-unit-${idx}`).textContent = `/ ${item.unit}`;
  document.getElementById(`grp-supplier-${idx}`).textContent = `🏢 ${item.supplierName}`;
  const inBOM = state.currentBomItems.find(b => b.inventoryId === item.id);
  const btn = document.getElementById(`grp-btn-${idx}`);
  btn.classList.toggle('added', !!inBOM);
  btn.textContent = inBOM ? `✅ Trong BOM (${inBOM.qty})` : '+ Đưa vào Phiếu BOM';
}

export function updateBOMBadge() {
  const n = state.currentBomItems.length;
  const b = document.getElementById('bom-count-badge');
  if (b) { b.textContent = n; b.style.display = n > 0 ? 'inline-flex' : 'none'; }
}
