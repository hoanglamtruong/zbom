#!/bin/bash
# ============================================================
# ZBOM — Git Init, Push & Docker Deploy Script
# Chạy: bash deploy.sh
# ============================================================
set -e

REPO_DIR="/home/zang/Downloads/Trạm/Zbom/zbom-v2"
GITHUB_REMOTE="https://github.com/hoanglamtruong/zbom.git"

echo ""
echo "⚡ =============================================="
echo "   ZBOM v2 — Deploy Script"
echo "================================================"
echo ""

cd "$REPO_DIR"

# ── 1. Git Init ──────────────────────────────────────
echo "📦 Step 1: Initializing git repository..."
if [ ! -d ".git" ]; then
  git init
  echo "   ✅ Git initialized"
else
  echo "   ✅ Git already initialized"
fi

# ── 2. Git Config ────────────────────────────────────
echo ""
echo "⚙️  Step 2: Git config..."
git config user.name "hoanglamtruong" 2>/dev/null || true
git config user.email "truong@zeebee.io.vn" 2>/dev/null || true

# ── 3. Git Add & Commit ──────────────────────────────
echo ""
echo "💾 Step 3: Staging all files..."
git add -A
git status --short

echo ""
echo "✏️  Committing..."
git commit -m "feat: ZBOM v2.0 standalone bundle PWA" --allow-empty 2>/dev/null || \
git commit -m "chore: update ZBOM v2.0" 2>/dev/null || \
echo "   ℹ️  Nothing new to commit"

# ── 4. Remote & Push ─────────────────────────────────
echo ""
echo "🌐 Step 4: Setting remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_REMOTE"
git branch -M main

echo ""
echo "🚀 Pushing to GitHub..."
echo "   Remote: $GITHUB_REMOTE"
git push -u origin main

echo ""
echo "================================================"
echo "✅ GITHUB PUSH COMPLETE!"
echo "🔗 Repo: https://github.com/hoanglamtruong/zbom"
echo "================================================"
echo ""

# ── 5. Docker Build & Run ────────────────────────────
echo "🐳 Step 5: Building & starting Docker container..."
docker compose down 2>/dev/null || true
docker compose up -d --build

echo ""
echo "================================================"
echo "✅ DOCKER DEPLOY COMPLETE!"
echo "🌍 Local: http://localhost:3080"
echo "🌍 Live:  https://zbom.zeebee.io.vn"
echo "================================================"
echo ""

# ── 6. Health Check ──────────────────────────────────
echo "🔍 Health check..."
sleep 3
if curl -sf http://localhost:3080 > /dev/null 2>&1; then
  echo "   ✅ Container is healthy — http://localhost:3080"
else
  echo "   ⚠️  Container may still be starting up..."
  docker compose ps
fi

echo ""
echo "🎉 All done! ZBOM is live."
