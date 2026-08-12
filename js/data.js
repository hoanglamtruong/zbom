// ===== DATA LAYER =====
const DB = {
  load() {
    try {
      const raw = localStorage.getItem('zbom_v2');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return null;
  },
  save(state) {
    localStorage.setItem('zbom_v2', JSON.stringify(state));
  }
};

export let state = DB.load() || {
  users: [
    { id: 1, name: 'CEO Zangx', email: 'admin@zangx.com', role: 'admin', createdAt: Date.now() },
    { id: 2, name: 'Quản Lý Kho', email: 'owner@zangx.com', role: 'owner', createdAt: Date.now() },
    { id: 3, name: 'NV Khảo Sát', email: 'staff@zangx.com', role: 'staff', createdAt: Date.now() }
  ],
  inventory: [],
  bomHistory: [],
  currentBomItems: [],
  currentRole: 'admin'
};

export function saveState() { DB.save(state); }

export function genId() { return Date.now() + Math.floor(Math.random() * 1000); }

export const CATEGORIES = {
  vat_lieu: { label: 'Vật liệu chính', color: '#6366f1', icon: '🧱' },
  vat_tu:   { label: 'Vật tư phụ',     color: '#f59e0b', icon: '🔩' },
  ccdc:     { label: 'CCDC / Thuê mướn', color: '#10b981', icon: '🚛' },
  dich_vu:  { label: 'Dịch vụ',         color: '#ec4899', icon: '⚙️' }
};

export const ROLES = {
  admin: { label: 'Admin', color: '#ef4444', icon: '👑' },
  owner: { label: 'Owner', color: '#3b82f6', icon: '🏢' },
  staff: { label: 'Staff',  color: '#64748b', icon: '👤' }
};

export const BOM_STATUS = {
  draft:    { label: 'Nháp',      color: '#64748b', icon: '📝' },
  pending:  { label: 'Chờ duyệt', color: '#f59e0b', icon: '⏳' },
  approved: { label: 'Đã duyệt',  color: '#10b981', icon: '✅' },
  rejected: { label: 'Từ chối',   color: '#ef4444', icon: '❌' }
};

export const fmt = {
  money: v => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0),
  date:  v => new Date(v).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
  short: v => new Date(v).toLocaleDateString('vi-VN')
};
