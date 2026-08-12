# ZBOM — Cấu trúc JSON Import/Export

Trích xuất trực tiếp từ source `index.html` (bản đang chạy tại https://zbom.zeebee.io.vn, branch `main`, repo `hoanglamtruong/zbom`). App KHÔNG có backend — toàn bộ state đọc/ghi qua một key `localStorage` duy nhất.

## 0. Tóm tắt nhanh

| | |
|---|---|
| **localStorage key** | `zbom_v2` |
| **Format** | 1 object JSON duy nhất = toàn bộ `state` của app (không phải mảng, không phải theo từng entity riêng) |
| **Version / schema field** | **KHÔNG CÓ.** Không có field `version`, `schemaVersion`, `_v`... ở bất kỳ đâu trong state hay trong object item. App không kiểm tra version khi import. |
| **Export = Import?** | **KHÔNG đối xứng.** Export xuất toàn bộ 5 key của `state`. Import chỉ đọc lại **3/5 key** (`users`, `inventory`, `bomHistory`) — xem mục 3. |
| **Validation khi import** | Không có. Chỉ `JSON.parse()` — nếu parse lỗi thì alert lỗi, nếu parse được thì gán thẳng (`if (d.users) state.users = d.users`), không kiểm tra field bắt buộc, không kiểm tra kiểu dữ liệu, không dedupe id. |

---

## 1. Code gốc (nguyên văn từ `index.html`)

### 1.1 Data layer — đọc/ghi localStorage

```js
// index.html:570-583
const DB = {
  load() {
    try {
      const raw = localStorage.getItem('zbom_v2');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return null;
  },
  save(state) {
    try {
      localStorage.setItem('zbom_v2', JSON.stringify(state));
    } catch(e) {}
  }
};
```

### 1.2 Shape mặc định của `state` (khi localStorage rỗng)

```js
// index.html:585-595
let state = DB.load() || {
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
```

### 1.3 Export

```js
// index.html:1155-1159
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `zbom_backup_${Date.now()}.json` });
  a.click();
}
```
→ Export = `JSON.stringify(state, null, 2)` nguyên con, không lọc, không transform. File tải về tên `zbom_backup_<timestamp>.json`.

### 1.4 Import

```js
// index.html:1161-1174
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
```

**Quan trọng cho bên xây tool:**
- Import **ghi đè hoàn toàn** (`=`, không merge/append) từng key nếu key đó tồn tại (truthy) trong file JSON đưa vào — KHÔNG cộng dồn với dữ liệu cũ trong máy.
- 3 field được đọc: `users`, `inventory`, `bomHistory`. Mỗi field độc lập — file chỉ cần có 1 trong 3 key này vẫn import được (không bắt buộc phải có đủ cả object gốc).
- `currentBomItems` và `currentRole` trong file JSON **bị bỏ qua khi import** (dù export ra có 2 key này). Muốn tool tạo file "nạp thẳng không lỗi" chỉ cần đảm bảo đúng 3 key trên; 2 key còn lại có đưa vào file cũng không ảnh hưởng gì (import không đọc, không lỗi).
- Sau import, app gọi `applyRole(state.currentRole)` dùng role **hiện tại của trình duyệt** (không phải role trong file import).
- Không có bước migrate/validate — nếu tool sinh sai field/kiểu dữ liệu, JSON.parse vẫn pass, lỗi chỉ lộ ra khi UI render (xem mục 4 "Gotcha").

---

## 2. Cấu trúc chi tiết từng entity

### 2.1 Root object (đúng những gì `exportData()` xuất ra)

| Field | Kiểu | Bắt buộc để **import không lỗi** | Ghi chú |
|---|---|---|---|
| `users` | `Array<User>` | Tùy chọn (nhưng cần ≥1 user role `admin` để không bị khoá UI) | Ghi đè toàn bộ |
| `inventory` | `Array<InventoryItem>` | Tùy chọn | Ghi đè toàn bộ |
| `bomHistory` | `Array<BomTicket>` | Tùy chọn | Ghi đè toàn bộ |
| `currentBomItems` | `Array<CartLine>` | Bị import bỏ qua — có/không đều được | Có trong export, không trong import |
| `currentRole` | `String` | Bị import bỏ qua — có/không đều được | Có trong export, không trong import |

### 2.2 `User` (phần tử của `users[]`)

Sinh ra tại `addUser()` (index.html:785-793):
```js
state.users.push({ id: genId(), name, email, role, createdAt: Date.now() });
```

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | `Number` | **Có** | Dùng làm key duy nhất; chèn thẳng (không escape) vào `onclick="window.__deleteUser(${u.id})"` trong HTML → **phải là Number**, không phải String, nếu không sẽ vỡ HTML/JS |
| `name` | `String` | **Có** | Render `u.name[0]` làm avatar → chuỗi rỗng sẽ lỗi (undefined charAt) |
| `email` | `String` | Có (không validate format) | |
| `role` | `String` enum | Nên có | Giá trị hợp lệ: `"admin" \| "owner" \| "staff"` (xem enum ROLES mục 3.2). Giá trị lạ vẫn hiển thị được (badge xám, label = giá trị gốc) — không crash |
| `createdAt` | `Number` (epoch ms) | Nên có | Dùng `fmt.short()` format ngày; thiếu → hiển thị "Invalid Date" nhưng không crash |

Lưu ý business logic: user `id === 1` không cho phép xoá qua UI (admin gốc, xem index.html:773). Không phải ràng buộc data — chỉ ảnh hưởng nút xoá hiển thị hay không.

### 2.3 `InventoryItem` (phần tử của `inventory[]`)

Sinh ra tại `saveItem()` (index.html:719-739):
```js
{
  id: editingId || genId(),
  name, category, unit,
  price: parseFloat(...) || 0,
  media: pendingMedia,           // hoặc null
  supplierName, supplierContact, supplierAddress, supplierNote,
  createdAt
}
```

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | `Number` | **Có** | Unique; dùng trong onclick inline (như User) |
| `name` | `String` | **Có** | `renderInventory()` gọi `item.name.toLowerCase()` khi search → **thiếu/undefined sẽ throw TypeError, sập trang Kho** |
| `category` | `String` enum | Nên có | `"vat_lieu" \| "vat_tu" \| "ccdc" \| "dich_vu"` (xem CATEGORIES mục 3.1). Giá trị lạ vẫn hiển thị (icon 📦 mặc định) |
| `unit` | `String` | Nên có | Đơn vị tính, vd "tấm", "bao", "ca (8h)", "gói" — free text |
| `price` | `Number` | Nên có | VND, không thập phân bắt buộc nhưng nên là số nguyên/thực dương |
| `media` | `Object \| null` | Tùy chọn | Nếu có: `{ type: String (MIME, vd "image/png"/"video/mp4"), data: String (data URL base64) }`. `null` hợp lệ (hiển thị icon rỗng) |
| `supplierName` | `String` | **Có** | Cùng lý do với `name` — `item.supplierName.toLowerCase()` trong search filter → **thiếu sẽ crash** |
| `supplierContact` | `String` | Nên có | SĐT/liên hệ, free text |
| `supplierAddress` | `String` | Tùy chọn | Có fallback hiển thị `—` nếu rỗng |
| `supplierNote` | `String` | Tùy chọn | Có fallback hiển thị `—` nếu rỗng |
| `createdAt` | `Number` (epoch ms) | Nên có | |

### 2.4 `BomTicket` (phần tử của `bomHistory[]`)

Sinh ra tại `submitBOM()` (index.html:915-933):
```js
const items = state.currentBomItems.map(b => {
  const inv = state.inventory.find(i => i.id === b.inventoryId);
  return { ...b, snapshot: inv ? { ...inv } : null };
}).filter(b => b.snapshot);
const total = items.reduce((s, b) => s + b.snapshot.price * b.qty, 0);
const bom = { id: genId(), project, staff, note, items, total, status: 'pending', createdAt: Date.now(), reviewedAt: null, reviewer: null, rejectReason: null };
```

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | `Number` | **Có** | Unique |
| `project` | `String` | Nên có | Tên dự án/phiếu |
| `staff` | `String` | Nên có | Người lập phiếu |
| `note` | `String` | Tùy chọn | Có thể `""` |
| `items` | `Array<BomLine>` | **Có** (có thể `[]` nhưng vô nghĩa) | Xem 2.4.1 |
| `total` | `Number` | Nên có | App **không tự tính lại** khi import/render — hiển thị đúng giá trị trong field này (dù có khớp tổng `items` hay không). Tool tạo file nên tự tính = Σ(`snapshot.price × qty`) để nhất quán |
| `status` | `String` enum | Nên có | `"draft" \| "pending" \| "approved" \| "rejected"` (xem BOM_STATUS mục 3.3). **`"draft"` tồn tại trong enum UI filter nhưng KHÔNG có code path nào tạo ra trạng thái này trong app thật** — `submitBOM()` luôn set `"pending"`. Vẫn là giá trị hợp lệ nếu tool muốn sinh sẵn |
| `createdAt` | `Number` (epoch ms) | Nên có | |
| `reviewedAt` | `Number \| null` | Tùy chọn | `null` khi chưa duyệt/từ chối |
| `reviewer` | `String \| null` | Tùy chọn | Giá trị = role người duyệt (`"admin"`/`"owner"`), không phải tên người |
| `rejectReason` | `String \| null` | Tùy chọn | Chỉ có ý nghĩa khi `status === "rejected"` |

#### 2.4.1 `BomLine` (phần tử của `bomHistory[].items[]`)

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `inventoryId` | `Number` | **Có** | **Quan hệ dữ liệu**: tham chiếu tới `inventory[].id` — NHƯNG chỉ mang tính lịch sử/tham chiếu, KHÔNG dùng để lookup khi hiển thị (xem `snapshot` bên dưới). Item vẫn hiển thị đúng dù `inventory` gốc đã bị xoá hoặc `inventoryId` không còn tồn tại trong `inventory[]` |
| `qty` | `Number` | **Có** | Số lượng tại thời điểm gửi phiếu |
| `snapshot` | `Object` | **Có** | Bản sao **đầy đủ** của `InventoryItem` tại thời điểm submit (`{ ...inv }` — tất cả field ở mục 2.3, bao gồm cả `id` gốc). `printBOM()` và `renderBOMHistory()` đọc giá/tên/NCC **từ đây**, không từ `state.inventory` |

→ **Quan hệ dữ liệu duy nhất trong toàn schema**: `bomHistory[].items[].inventoryId` ↔ `inventory[].id` (tham chiếu mềm, không bắt buộc còn tồn tại). Việc hiển thị/in phiếu hoàn toàn tự chứa trong `snapshot`, nên nếu tool tạo BOM ticket, **bắt buộc phải điền `snapshot` đầy đủ** — không thể chỉ điền `inventoryId` rồi để app tự join.

### 2.5 `CartLine` (phần tử của `currentBomItems[]`, root-level)

```js
// index.html:848
state.currentBomItems.push({ inventoryId: id, qty: 1 });
```

| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `inventoryId` | `Number` | **Có** | Tham chiếu `inventory[].id`. Nếu không tìm thấy item tương ứng, dòng bị **âm thầm bỏ qua khi render** (không crash) |
| `qty` | `Number` | **Có** | |

Đây là "giỏ hàng" phiếu BOM đang soạn dở (chưa submit) — **không có `id`, không có `snapshot`**, khác hẳn `BomLine` trong `bomHistory`. Field này **bị `importData()` bỏ qua** (mục 1.4), nên với mục tiêu "tạo file nạp qua Import", field này không cần quan tâm.

---

## 3. Enum tra cứu

### 3.1 `CATEGORIES` (index.html:600-605) — dùng cho `InventoryItem.category`
| value | label | icon |
|---|---|---|
| `vat_lieu` | Vật liệu chính | 🧱 |
| `vat_tu` | Vật tư phụ | 🔩 |
| `ccdc` | CCDC / Thuê mướn | 🚛 |
| `dich_vu` | Dịch vụ | ⚙️ |

### 3.2 `ROLES` (index.html:607-611) — dùng cho `User.role`, `BomTicket.reviewer`, root `currentRole`
| value | label | icon |
|---|---|---|
| `admin` | Admin | 👑 |
| `owner` | Owner | 🏢 |
| `staff` | Staff | 👤 |

### 3.3 `BOM_STATUS` (index.html:613-618) — dùng cho `BomTicket.status`
| value | label | icon | Code path tạo ra? |
|---|---|---|---|
| `draft` | Nháp | 📝 | Không (chỉ có trong filter UI) |
| `pending` | Chờ duyệt | ⏳ | Có — mặc định khi submit |
| `approved` | Đã duyệt | ✅ | Có — qua nút Phê Duyệt |
| `rejected` | Từ chối | ❌ | Có — qua nút Từ Chối |

---

## 4. Gotcha cho bên xây tool tạo file

1. **Không có field version** → tool không cần (và không nên) tự thêm field version vào JSON, app sẽ không đọc nó nhưng cũng không sao (import chỉ nhìn 3 key `users/inventory/bomHistory`, field lạ khác bị bỏ qua im lặng).
2. **`id` phải là `Number`, không phải `String`** ở mọi entity (`users[].id`, `inventory[].id`, `bomHistory[].id`) — vì các id này được nội suy trực tiếp (không có dấu ngoặc kép) vào thuộc tính `onclick="...(${id})"` trong HTML string. Nếu để dạng string số (`"123"`) thì `JSON.stringify`/parse vẫn ok về mặt data nhưng **`${id}` chèn ra `"123"` có dấu ngoặc kép sẽ làm vỡ cú pháp onclick** → nên sinh id là **số nguyên thuần**, khuyến nghị theo đúng convention gốc: `Date.now() + random(0-999)` (epoch ms 13 chữ số) để tránh trùng lặp.
3. **`InventoryItem.name` và `InventoryItem.supplierName` không được để `undefined`** (tối thiểu phải là `""`) — ô tìm kiếm gọi `.toLowerCase()` trực tiếp trên 2 field này với mọi item trong danh sách, thiếu 1 trong 2 sẽ làm **toàn bộ trang Kho & Nguồn Hàng crash** ngay khi người dùng gõ vào ô search (kể cả không gõ gì nếu component search chạy on-mount — cần kiểm tra thêm khi tool test thực tế).
4. **Nếu tool sinh sẵn `bomHistory`**, bắt buộc tự tính `snapshot` đầy đủ cho từng `items[]` (copy nguyên object `InventoryItem` tương ứng) và tự tính `total = Σ snapshot.price × qty` — app không tự bù các field này khi import.
5. **Import là "replace toàn bộ", không merge theo id** — nếu tool muốn "thêm" dữ liệu vào ZBOM đang có sẵn (không phải ghi đè sạch), tool phải tự đọc file export hiện tại của người dùng trước, gộp mảng ở phía tool, rồi mới xuất file JSON để import lại — ZBOM không có logic upsert.
6. Trùng `id` giữa các phần tử trong cùng 1 mảng **không bị chặn** (không có check unique khi import) nhưng sẽ gây lỗi hành vi khó lường (`.find()` luôn khớp phần tử đầu tiên, sửa/xoá có thể tác động nhầm bản ghi) — tool cần tự đảm bảo unique id trong phạm vi từng mảng.

---

## 5. File mẫu

Xem [`sample-export.json`](./sample-export.json) — export thật (đúng format `exportData()`) với dữ liệu test: 3 users (đủ 3 role), 4 inventory items (đủ 4 category), 3 bomHistory tickets (đủ trạng thái `pending`/`approved`/`rejected`, có `snapshot` đầy đủ), 1 dòng `currentBomItems` đang soạn dở.

## 6. Kết quả kiểm chứng thực tế (đã SEE, không đoán mù)

File `sample-export.json` đã được nạp qua đúng nút **📤 Import** thật trên app đang chạy (container `zbom-app`, cùng build với https://zbom.zeebee.io.vn) bằng trình duyệt headless thật (Playwright + Chrome), không phải seed tay `localStorage`. Kết quả:

| Kiểm tra | Kết quả |
|---|---|
| Dialog sau import | `✅ Phục hồi thành công!` |
| Trang Users | 3/3 user hiển thị đúng tên |
| Trang Kho & Nguồn Hàng | 4/4 vật tư hiển thị đúng tên + đúng icon/label category |
| Ô tìm kiếm Kho (gõ "thép") | Lọc đúng 1 kết quả, **không crash** (đúng như mục 4.3 dự đoán khi field bắt buộc được điền đủ) |
| Trang Lịch Sử BOM | 3/3 phiếu hiển thị, tổng tiền UI khớp 100% với field `total` trong JSON: `7.300.000 ₫`, `3.500.000 ₫`, `20.500.000 ₫` |
| Badge trạng thái | Đúng `✅ Đã duyệt` / `❌ Từ chối` / `⏳ Chờ duyệt` |
| Lý do từ chối | Hiển thị đúng `Vượt ngân sách hạng mục CCDC tháng này` |
| Console/page error liên quan import | **Không có** (1 lỗi 404 không liên quan — thiếu file `icons/icon-192.png` của manifest PWA, không liên quan Import/Export) |

→ File mẫu **nạp được vào ZBOM thật, không lỗi, hiển thị đúng** — bên xây tool có thể dùng làm chuẩn đối chiếu 1:1.
