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

  grid.innerHTML = items.map(item => {
    const c = CATEGORIES[item.category];
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
  }).join('');

  window.__addToBOM = id => {
    const ex = state.currentBomItems.find(b => b.inventoryId === id);
    if (ex) ex.qty += 1; else state.currentBomItems.push({ inventoryId: id, qty: 1 });
    saveState(); renderCatalog(); updateBOMBadge();
  };
}

export function updateBOMBadge() {
  const n = state.currentBomItems.length;
  const b = document.getElementById('bom-count-badge');
  if (b) { b.textContent = n; b.style.display = n > 0 ? 'inline-flex' : 'none'; }
}
