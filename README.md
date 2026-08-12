# ⚡ ZBOM — Hệ thống Quản lý Nguồn Hàng & Phiếu BOM

[![Deploy](https://img.shields.io/badge/Live-zbom.zeebee.io.vn-6366f1?style=flat-square&logo=nginx)](https://zbom.zeebee.io.vn)

> ZBOM là PWA (Progressive Web App) quản lý vật tư, nhà cung cấp và phiếu đề xuất BOM (Bill of Materials) dành cho các đơn vị xây dựng và sản xuất.

## ✨ Tính năng

| Module | Mô tả |
|--------|-------|
| 📊 **Dashboard** | Thống kê tổng quan: kho hàng, phiếu BOM, giá trị |
| 👥 **Quản lý Users** | Phân quyền Admin / Owner / Staff |
| 🏭 **Kho & Nguồn Hàng** | Khai báo vật tư, thiết bị, NCC + upload ảnh/video |
| 🖼️ **Catalog Sản Phẩm** | Duyệt và tìm kiếm vật tư theo nhóm, giá |
| 📝 **Lập Phiếu BOM** | Chọn vật tư → tính kinh phí → gửi duyệt |
| 📋 **Lịch Sử & Phê Duyệt** | Approve / Reject / In phiếu BOM |

## 🚀 Chạy nhanh (Docker)

```bash
docker compose up -d --build
# Truy cập: http://localhost:3080
```

## 🛠 Cấu trúc dự án

```
zbom-v2/
├── index.html          ← Toàn bộ app (CSS + JS inline bundle)
├── sw.js               ← PWA Service Worker
├── manifest.json       ← PWA Manifest
├── Dockerfile          ← Nginx Alpine container
├── docker-compose.yml  ← Docker Compose config
└── nginx.conf          ← Nginx config (gzip, cache, SPA)
```

## 🌐 Deploy

Domain: [zbom.zeebee.io.vn](https://zbom.zeebee.io.vn)

Sử dụng Docker + Nginx + Cloudflare Tunnel.

## 💾 Lưu trữ dữ liệu

Toàn bộ dữ liệu được lưu vào **localStorage** của trình duyệt.  
Hỗ trợ **Export / Import JSON** để backup và phục hồi.

---
Built with ❤️ by [Zeebee](https://zeebee.io.vn)
