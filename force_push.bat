@echo off
echo ==================================================
echo GitHub Force Synchronizer
echo ==================================================
echo.
echo Forcing removal of node_modules and venv...
git rm -r --cached frontend/node_modules/ 2>nul
git rm -r --cached node_modules/ 2>nul
git rm -r --cached venv/ 2>nul
git rm -r --cached env/ 2>nul
git rm --cached .env 2>nul
echo.
echo Creating a brand new clean commit...
git commit -m "Vercel Fix: Purged node_modules and venv"
echo.
echo Force pushing to GitHub to overwrite the broken commit...
git push --force origin main
echo.
echo ==================================================
echo Done! Please verify the push succeeded above.
echo ==================================================
pause
