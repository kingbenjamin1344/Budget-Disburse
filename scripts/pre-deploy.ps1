# PowerShell script for Railway deployment setup
# Run: .\scripts\pre-deploy.ps1

Write-Host "🚀 Budget-Disburse Railway Deployment Setup" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Step 1: Check Node.js
Write-Host "📝 Step 1: Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
Write-Host ""

# Step 2: Generate AUTH_SECRET
Write-Host "📝 Step 2: Generating AUTH_SECRET" -ForegroundColor Yellow
$authSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Write-Host "✓ AUTH_SECRET: $authSecret" -ForegroundColor Green
Write-Host "   💾 Save this in your Railway dashboard variables" -ForegroundColor Cyan
Write-Host ""

# Step 3: Example password hash
Write-Host "📝 Step 3: Password Hash Generation" -ForegroundColor Yellow
Write-Host "   Run this command to generate your admin password hash:" -ForegroundColor Cyan
Write-Host "   node -e `"console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))`"" -ForegroundColor Cyan
Write-Host ""

# Step 4: Verify package.json
Write-Host "📝 Step 4: Checking npm scripts..." -ForegroundColor Yellow
$hasScripts = Select-String -Path "package.json" -Pattern "prisma:migrate" | Select-Object -First 1
if ($hasScripts) {
    Write-Host "✓ Migration scripts are configured" -ForegroundColor Green
} else {
    Write-Host "⚠ Migration scripts may be missing" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Commit and push
Write-Host "📝 Step 5: Ready to deploy" -ForegroundColor Yellow
Write-Host "   1. Commit changes:"
Write-Host "      git add ." -ForegroundColor Cyan
Write-Host "      git commit -m 'Prepare for Railway deployment'" -ForegroundColor Cyan
Write-Host "   2. Push to GitHub:"
Write-Host "      git push origin main" -ForegroundColor Cyan
Write-Host "   3. Open https://railway.app/dashboard" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 For detailed instructions, see DEPLOYMENT_CHECKLIST.md" -ForegroundColor Cyan
