#!/bin/bash
# ============================================================
# ZBOM v2 — Git Push to GitHub + Docker Deploy
# Chạy: bash push_to_github.sh
# ============================================================
set -e

REPO_DIR="/home/zang/Downloads/Trạm/Zbom/zbom-v2"
GITHUB_REMOTE="https://github.com/hoanglamtruong/zbom.git"

echo ""
echo "⚡ =============================================="
echo "   ZBOM v2 — GitHub Push + Docker Deploy"
echo "================================================"
echo ""

cd "$REPO_DIR"

# ── 1. Git Init ──────────────────────────────────────
echo "📦 Step 1: Khởi tạo git repository..."
if [ ! -d ".git" ]; then
  git init
  echo "   ✅ Git initialized"
else
  echo "   ✅ Git already initialized"
fi

# ── 2. Git Config ────────────────────────────────────
echo ""
echo "⚙️  Step 2: Cấu hình git..."
git config user.name "hoanglamtruong"
git config user.email "truong@zeebee.io.vn"
echo "   ✅ Git config done"

# ── 3. Git Add & Commit ──────────────────────────────
echo ""
echo "💾 Step 3: Staging tất cả files..."
git add -A
echo ""
echo "📋 Files sẽ được commit:"
git status --short
echo ""

COMMIT_MSG="feat: ZBOM v2.0 PWA - BOM management system with localStorage"
echo "✏️  Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG" 2>/dev/null || echo "   ℹ️  Nothing new to commit"

# ── 4. Remote & Push ─────────────────────────────────
echo ""
echo "🌐 Step 4: Thiết lập remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_REMOTE"
git branch -M main

echo ""
echo "🚀 Pushing to GitHub..."
echo "   Remote: $GITHUB_REMOTE"
git push -u origin main --force

echo ""
echo "================================================"
echo "✅ GITHUB PUSH COMPLETE!"
echo "🔗 Repo: https://github.com/hoanglamtruong/zbom"
echo "================================================"
echo ""

# ── 5. Docker Build & Run ────────────────────────────
echo "🐳 Step 5: Build & start Docker container..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo "================================================"
echo "✅ DOCKER DEPLOY COMPLETE!"
echo "🌍 Local:  http://localhost:3080"
echo "🌍 Live:   https://zbom.zeebee.io.vn"
echo "================================================"
echo ""

# ── 6. Health Check ──────────────────────────────────
echo "🔍 Health check (3s)..."
sleep 3
if curl -sf http://localhost:3080 > /dev/null 2>&1; then
  echo "   ✅ Container healthy — http://localhost:3080"
else
  echo "   ⚠️  Container khởi động..."
  docker compose ps
fi

echo ""
echo "🎉 Xong! ZBOM đang live tại:"
echo "   🔗 Local:  http://localhost:3080"
echo "   🌐 Live:   https://zbom.zeebee.io.vn"
echo ""
