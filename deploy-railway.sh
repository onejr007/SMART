#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║       🚀 RAILWAY DEPLOYMENT - SMART METAVERSE         ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI tidak ditemukan!"
    echo ""
    echo "Install dulu dengan command:"
    echo "npm install -g @railway/cli"
    echo ""
    exit 1
fi

echo "✅ Railway CLI ditemukan"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null
then
    echo "🔐 Belum login ke Railway. Membuka browser untuk login..."
    railway login
    echo ""
fi

echo "✅ Sudah login ke Railway"
echo ""

# Check if project exists
if ! railway status &> /dev/null
then
    echo "📦 Membuat project baru di Railway..."
    railway init
    echo ""
fi

echo "✅ Project Railway siap"
echo ""

# Deploy
echo "🚀 Memulai deployment..."
echo ""
railway up

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                                                        ║"
echo "║       ✅ DEPLOYMENT SELESAI!                          ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📝 LANGKAH SELANJUTNYA:"
echo ""
echo "1. Buka Railway Dashboard:"
echo "   railway open"
echo ""
echo "2. Klik tab 'Variables'"
echo ""
echo "3. Klik 'Raw Editor'"
echo ""
echo "4. Copy isi file .env.production.template"
echo ""
echo "5. Paste ke Raw Editor"
echo ""
echo "6. Klik 'Deploy' atau tunggu auto-redeploy"
echo ""
echo "7. Klik tab 'Settings' untuk lihat URL production"
echo ""
