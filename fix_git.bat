@echo off
echo ==================================================
echo JalPramaan Git Fixer
echo ==================================================
echo.
echo Removing massive cached files (venv, node_modules)...
git rm -r --cached .
echo.
echo Re-adding files (respecting new .gitignore)...
git add .
echo.
echo Amending previous bloated commit...
git commit --amend -m "Configure Vercel and setup .gitignore to protect secrets"
echo.
echo ==================================================
echo Git Repository Cleaned!
echo ==================================================
pause
