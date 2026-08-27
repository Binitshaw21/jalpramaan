@echo off
echo ==================================================
echo JalPramaan Sync Fix
echo ==================================================
echo.
git add main.py
git commit -m "Fix 422 Validation bug on Admin Portal status dropdown"
git push origin main
echo.
echo ==================================================
echo Done! Fixes are pushed to Vercel.
echo ==================================================
pause
