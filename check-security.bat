@echo off
echo ====================================
echo   VERIFICACAO DE SEGURANCA
echo ====================================
echo.

echo Verificando se .env esta no .gitignore...
findstr /C:".env" .gitignore >nul
if %errorlevel% equ 0 (
    echo [OK] .env esta protegido no .gitignore
) else (
    echo [ERRO] .env NAO esta no .gitignore!
    echo Por favor, adicione .env ao .gitignore antes de continuar
    pause
    exit /b 1
)
echo.

echo Verificando se .env sera commitado...
git status | findstr /C:".env" >nul
if %errorlevel% equ 0 (
    echo [AVISO] .env aparece no git status!
    echo Isso pode ser perigoso. Verifique se esta sendo ignorado corretamente.
    git status
    pause
) else (
    echo [OK] .env nao sera commitado
)
echo.

echo Verificando arquivos que serao commitados...
git status --short
echo.

echo ====================================
echo   TUDO PRONTO PARA COMMIT!
echo ====================================
echo.
pause
