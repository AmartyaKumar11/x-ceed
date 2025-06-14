#!/bin/bash
# EMERGENCY API KEY REVOCATION SCRIPT

echo "🚨 SECURITY INCIDENT RESPONSE - API KEY EXPOSURE"
echo "=================================================="
echo ""

echo "📋 EXPOSED KEYS DETECTED:"
echo "- GEMINI_API_KEY: AIzaSyAzYv5Kn-OORcNq3himP_SRMKDoJISwrJ4"
echo "- YOUTUBE_API_KEY: AIzaSyCFzksQHLGDJozLjZEKtbvqbKqUqu9r9wE"
echo "- NEWS_API_KEY: 862eef1f2005403886d9358965e88f5a"
echo ""

echo "⚠️  KEYS HAVE BEEN PUSHED TO GITHUB!"
echo "Last push: 9a3666a (HEAD -> main, origin/main) notifications fix"
echo ""

echo "🔴 IMMEDIATE ACTIONS REQUIRED:"
echo ""

echo "1. REVOKE GOOGLE API KEYS:"
echo "   → Go to: https://console.cloud.google.com/apis/credentials"
echo "   → Delete these keys immediately:"
echo "     - AIzaSyAzYv5Kn-OORcNq3himP_SRMKDoJISwrJ4"
echo "     - AIzaSyCFzksQHLGDJozLjZEKtbvqbKqUqu9r9wE"
echo "   → Create new keys and update .env.local"
echo ""

echo "2. REVOKE NEWS API KEY:"
echo "   → Go to: https://newsapi.org/account"
echo "   → Regenerate key: 862eef1f2005403886d9358965e88f5a"
echo "   → Update .env.local with new key"
echo ""

echo "3. CLEAN GIT HISTORY (if repository is public):"
echo "   git filter-branch --force --index-filter \\"
echo "   'git rm --cached --ignore-unmatch API_SECURITY_REPORT.md' \\"
echo "   --prune-empty --tag-name-filter cat -- --all"
echo ""
echo "   git push --force --all"
echo ""

echo "4. CHECK FOR OTHER EXPOSURES:"
echo "   → Scan all markdown files for API keys"
echo "   → Check commit history for sensitive data"
echo ""

echo "✅ COMPLETED ACTIONS:"
echo "   ✓ Removed keys from API_SECURITY_REPORT.md"
echo "   ✓ Replaced with placeholders"
echo "   ✓ Created this incident response"
echo ""

echo "📞 IF REPOSITORY IS PUBLIC ON GITHUB:"
echo "   → Consider making repository private temporarily"
echo "   → Contact GitHub support if needed"
echo "   → Monitor for unauthorized API usage"
echo ""

echo "🛡️  PREVENTION FOR FUTURE:"
echo "   → Never put real keys in markdown files"
echo "   → Use git hooks to scan for API keys"
echo "   → Always review diffs before pushing"
echo ""

echo "STATUS: 🔴 CRITICAL - Revoke keys immediately!"
