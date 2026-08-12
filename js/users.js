import { state, saveState, genId, CATEGORIES, ROLES, fmt } from './data.js';
import { renderInventory } from './inventory.js';

export function initUsers() {
  document.getElementById('btn-add-user').addEventListener('click', addUser);
  renderUsers();
}

export function renderUsers() {
  const tbody = document.getElementById('table-user-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  state.users.forEach(u => {
    const r = ROLES[u.role];
    tbody.innerHTML += `
      <tr class="tr-hover">
        <td class="td"><div class="avatar">${u.name[0]}</div><span>${u.name}</span></td>
        <td class="td text-muted">${u.email}</td>
        <td class="td"><span class="badge" style="background:${r.color}20;color:${r.color}">${r.icon} ${r.label}</span></td>
        <td class="td text-muted">${fmt.short(u.createdAt)}</td>
        <td class="td text-center">
          ${state.currentRole === 'admin' && u.id !== 1 ? `<button onclick="window.__deleteUser(${u.id})" class="btn-icon danger">🗑</button>` : '—'}
        </td>
      </tr>`;
  });
  window.__deleteUser = (id) => {
    if (confirm('Thu hồi tài khoản?')) {
      state.users = state.users.filter(u => u.id !== id);
      saveState(); renderUsers();
    }
  };
}

function addUser() {
  const name = document.getElementById('inp-user-name').value.trim();
  const email = document.getElementById('inp-user-email').value.trim();
  const role = document.getElementById('inp-user-role').value;
  if (!name || !email) return alert('Vui lòng nhập đầy đủ tên & email!');
  state.users.push({ id: genId(), name, email, role, createdAt: Date.now() });
  saveState(); renderUsers();
  document.getElementById('inp-user-name').value = '';
  document.getElementById('inp-user-email').value = '';
}
