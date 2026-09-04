#!/bin/bash

# ==============================================================================
# Script de Build do App Mobile PetPrev (PWA Web Responsivo / Capacitor)
# ==============================================================================

echo "📱 Iniciando preparação e build do App Mobile PetPrev"
echo "--------------------------------------------------------"

cd frontend-mobile || { echo "❌ Pasta frontend-mobile não encontrada"; exit 1; }

echo "[1/3] Verificando dependências locais..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências via npm..."
    npm install
fi

echo "[2/3] Compilando a distribuição Web SPA / PWA..."
npm run build

echo "========================================================"
echo "✅ Build PWA Web concluído com sucesso em .output!"
echo "========================================================"
echo "Para rodar em modo pré-visualização local:"
echo "   npm run preview"
echo ""
echo "📱 Para empacotar como aplicativo nativo Android (APK/AAB) ou iOS via Capacitor:"
echo "   1. npx cap init \"PetPrev Mobile\" \"br.com.petprev.app\" --web-dir .output/public"
echo "   2. npx cap add android && npx cap add ios"
echo "   3. npx cap sync"
echo "   4. npx cap open android (abre no Android Studio para gerar o APK)"
echo "========================================================"
exit 0
