@echo off
echo ====================================
echo   DEPLOY PARA GIT - Sistema Logistico
echo   Desenvolvido por Daniel Pires
echo ====================================
echo.

echo [1/6] Verificando Git...
git --version
if %errorlevel% neq 0 (
    echo ERRO: Git nao encontrado!
    pause
    exit /b 1
)
echo OK!
echo.

echo [2/6] Verificando status atual...
git status
echo.

echo [3/6] Adicionando arquivos...
git add .
echo OK!
echo.

echo [4/6] Verificando o que sera commitado...
git status
echo.

echo [5/6] Criando commit...
git commit -m "feat: Sistema Logistico Shopee Express completo - Deploy inicial by Daniel Pires"
if %errorlevel% neq 0 (
    echo.
    echo Verificando se ha mudancas para commitar...
    git status
)
echo OK!
echo.

echo [6/6] Verificando remote...
git remote -v
echo.

echo ====================================
echo   PROXIMOS PASSOS:
echo ====================================
echo.
echo 1. Crie um repositorio no GitHub:
echo    https://github.com/new
echo.
echo 2. Nome sugerido: sistema-logistico-shopee
echo.
echo 3. Depois execute:
echo    git remote add origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
echo    (ou se ja existe remote, use: git remote set-url origin URL)
echo.
echo 4. Finalmente:
echo    git push -u origin main
echo.
echo ====================================
echo.

pause
