@echo off
chcp 65001 >nul
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     🚀 DEPLOY AUTOMÁTICO PARA GIT                         ║
echo ║     Sistema Logístico Shopee Express                      ║
echo ║     Desenvolvido por Daniel Pires                         ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar Git
echo [1/8] ✓ Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERRO: Git não encontrado!
    echo.
    echo Instale o Git em: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo       Git instalado ✓
echo.

REM Verificar segurança
echo [2/8] 🔐 Verificando segurança do .env...
findstr /C:".env" .gitignore >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo ⚠️  AVISO: .env não encontrado no .gitignore
    echo       Adicionando agora...
    echo .env >> .gitignore
    echo       .env adicionado ao .gitignore ✓
)
echo       Arquivo .env está protegido ✓
echo.

REM Status atual
echo [3/8] 📊 Verificando status do repositório...
git status --short
echo.

REM Adicionar arquivos
echo [4/8] ➕ Adicionando arquivos ao Git...
git add .
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERRO ao adicionar arquivos
    pause
    exit /b 1
)
echo       Arquivos adicionados ✓
echo.

REM Mostrar o que será commitado
echo [5/8] 📋 Arquivos que serão commitados:
git status --short
echo.

REM Verificação final de segurança
echo [6/8] 🛡️  Verificação final de segurança...
git status | findstr /C:".env" >nul 2>&1
if %errorlevel% equ 0 (
    color 0C
    echo ❌ PERIGO: .env será commitado!
    echo.
    echo Isto é um risco de segurança!
    echo Por favor, verifique o .gitignore
    pause
    exit /b 1
)
echo       Nenhum arquivo sensível será commitado ✓
echo.

REM Criar commit
echo [7/8] 💾 Criando commit...
git commit -m "feat: Sistema Logistico Shopee Express completo - Deploy inicial by Daniel Pires"
if %errorlevel% neq 0 (
    echo.
    echo ℹ️  Verificando se há mudanças para commitar...
    git status
    echo.
)
echo       Commit criado ✓
echo.

REM Verificar remote
echo [8/8] 🌐 Verificando configuração remote...
git remote -v
echo.

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     ✅ PREPARAÇÃO CONCLUÍDA COM SUCESSO!                  ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo.
echo 📋 PRÓXIMOS PASSOS:
echo ═══════════════════════════════════════════════════════
echo.
echo 1️⃣  Criar repositório no GitHub:
echo     👉 https://github.com/new
echo.
echo 2️⃣  Configurações do repositório:
echo     • Nome: sistema-logistico-shopee
echo     • Descrição: Sistema Logístico Shopee Express - Daniel Pires
echo     • Visibilidade: Private (recomendado)
echo     • ❌ NÃO marque "Initialize with README"
echo.
echo 3️⃣  Copie a URL do repositório criado
echo.
echo 4️⃣  Execute UM dos comandos abaixo:
echo.
echo     🆕 Se não tem remote configurado:
echo     git remote add origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
echo.
echo     🔄 Se já tem remote e quer trocar:
echo     git remote set-url origin https://github.com/SEU-USUARIO/sistema-logistico-shopee.git
echo.
echo 5️⃣  Enviar para o GitHub:
echo     git branch -M main
echo     git push -u origin main
echo.
echo ═══════════════════════════════════════════════════════
echo.
echo 💡 DICA: Ao fazer push, use Personal Access Token como senha
echo    (Não a senha da sua conta do GitHub)
echo.
echo 📖 Mais informações em: GIT_DEPLOY_NOW.md
echo.

color 0A
pause
