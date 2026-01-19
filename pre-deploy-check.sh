#!/bin/bash

# Script de Verificação Pré-Deploy
# Sistema Logístico Shopee Express
# Desenvolvido por Daniel Pires

echo "🔍 Verificando ambiente para deploy..."
echo ""

# Verificar Node.js
echo "✓ Verificando Node.js..."
node --version
if [ $? -ne 0 ]; then
    echo "❌ Node.js não encontrado!"
    exit 1
fi

# Verificar npm
echo "✓ Verificando npm..."
npm --version
if [ $? -ne 0 ]; then
    echo "❌ npm não encontrado!"
    exit 1
fi

# Verificar se .env existe
echo "✓ Verificando arquivo .env..."
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "   Copie o .env.example e configure as variáveis"
    exit 1
fi

# Verificar se .gitignore inclui .env
echo "✓ Verificando .gitignore..."
if ! grep -q "^\.env$" .gitignore; then
    echo "❌ .env não está no .gitignore!"
    echo "   Adicione .env ao .gitignore antes de continuar"
    exit 1
fi

# Instalar dependências
echo "✓ Instalando dependências..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências!"
    exit 1
fi

# Executar build
echo "✓ Criando build de produção..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erro na build!"
    exit 1
fi

# Verificar se dist foi criado
echo "✓ Verificando output da build..."
if [ ! -d "dist" ]; then
    echo "❌ Diretório dist não foi criado!"
    exit 1
fi

# Verificar arquivos essenciais
echo "✓ Verificando arquivos essenciais..."
files=("package.json" "vite.config.ts" "vercel.json" "README.md" ".gitignore")
for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo $file não encontrado!"
        exit 1
    fi
done

echo ""
echo "✅ Todas as verificações passaram!"
echo ""
echo "📋 Checklist final:"
echo "   [x] Node.js instalado"
echo "   [x] Dependências instaladas"
echo "   [x] Build criada com sucesso"
echo "   [x] .env configurado e protegido"
echo "   [x] Arquivos essenciais presentes"
echo ""
echo "🚀 Você está pronto para fazer deploy!"
echo ""
echo "Próximos passos:"
echo "1. git add ."
echo "2. git commit -m 'Initial commit'"
echo "3. git remote add origin <URL_DO_REPOSITORIO>"
echo "4. git push -u origin main"
echo "5. Conectar ao Vercel"
echo ""
echo "Consulte DEPLOY_GUIDE.md para instruções detalhadas"
