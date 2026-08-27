@echo off
echo ==================================================
echo Vercel 405 Fixer & Final Deployment
echo ==================================================
echo.
echo Restructuring project for Vercel...
python restructure.py

echo.
echo Adding all updated files...
git add .
git add -u

echo.
echo Committing final fixes...
git commit -m "Fix Vercel 405 Error: Restructure API and update vercel.json routing"

echo.
echo Pushing to GitHub (Force push to ensure clean history)...
git push origin main --force

echo.
echo ==================================================
echo COMPLETE! Vercel is now building your fixed app.
echo ==================================================
pause
