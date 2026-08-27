@echo off
echo ==================================================
echo Vercel Permission Denied Fixer
echo ==================================================
echo.
echo Forcing removal of node_modules and venv from Git history...
git rm -r --cached frontend/node_modules/ 2>nul
git rm -r --cached node_modules/ 2>nul
git rm -r --cached venv/ 2>nul
git rm -r --cached env/ 2>nul
git rm --cached .env 2>nul
echo.
echo Committing the cleanup...
git commit -m "Fix Vercel permission denied: Purge node_modules from repository"
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo ==================================================
echo Done! Vercel should automatically rebuild now.
echo ==================================================
pause
