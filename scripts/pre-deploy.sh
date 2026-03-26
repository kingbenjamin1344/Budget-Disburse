#!/bin/bash
# Quick setup script for Railway deployment
# This script helps you prepare for Railway deployment

echo "🚀 Budget-Disburse Railway Deployment Setup"
echo "==========================================="
echo ""

# Step 1: Generate AUTH_SECRET
echo "📝 Step 1: Generate AUTH_SECRET"
echo "Run this command and copy the output:"
echo "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo ""
read -p "Press Enter after generating AUTH_SECRET..." 

# Step 2: Generate Admin Password Hash
echo ""
echo "📝 Step 2: Generate Admin Password Hash"
echo "Decide your admin password and run:"
echo "node -e \"console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))\""
echo ""
read -p "Press Enter after generating password hash..." 

# Step 3: Git setup
echo ""
echo "📝 Step 3: Committing changes"
git add .
git commit -m "Prepare for Railway deployment - Add configuration files"

# Step 4: Instructions
echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Go to https://railway.app/dashboard"
echo "3. Create new project and deploy from GitHub"
echo "4. Add MySQL database"
echo "5. Set environment variables (see DEPLOYMENT_CHECKLIST.md)"
echo ""
