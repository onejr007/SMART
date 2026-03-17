Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "║       🚀 RAILWAY DEPLOYMENT - SMART METAVERSE         ║" -ForegroundColor Cyan
Write-Host "║                                                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$railwayExists = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayExists) {
    Write-Host "❌ Railway CLI tidak ditemukan!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install dulu dengan command:" -ForegroundColor Yellow
    Write-Host "npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Railway CLI ditemukan" -ForegroundColor Green
Write-Host ""

# Check if logged in
$loginCheck = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔐 Belum login ke Railway. Membuka browser untuk login..." -ForegroundColor Yellow
    railway login
    Write-Host ""
}

Write-Host "✅ Sudah login ke Railway" -ForegroundColor Green
Write-Host ""

# Check if project exists
$statusCheck = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "📦 Membuat project baru di Railway..." -ForegroundColor Yellow
    railway init
    Write-Host ""
}

Write-Host "✅ Project Railway siap" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "🚀 Memulai deployment..." -ForegroundColor Cyan
Write-Host ""
railway up

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║       ✅ DEPLOYMENT SELESAI!                          ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 LANGKAH SELANJUTNYA:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Buka Railway Dashboard:"
Write-Host "   railway open" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Klik tab 'Variables'"
Write-Host ""
Write-Host "3. Klik 'Raw Editor'"
Write-Host ""
Write-Host "4. Copy isi file .env.production.template"
Write-Host ""
Write-Host "5. Paste ke Raw Editor"
Write-Host ""
Write-Host "6. Klik 'Deploy' atau tunggu auto-redeploy"
Write-Host ""
Write-Host "7. Klik tab 'Settings' untuk lihat URL production"
Write-Host ""
