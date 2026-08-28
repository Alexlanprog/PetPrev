#!/bin/bash

# ==============================================================================
# Script de Preparação / Instruções de Build Mobile - PetPrev (EAS)
# Utilizando o Expo Application Services (EAS) para compilar os binários.
# ==============================================================================

echo "📱 Iniciando preparação para o Build do App Mobile PetPrev"
echo "Certifique-se de estar logado na sua conta Expo antes de prosseguir."
echo "--------------------------------------------------------"

cd frontend-mobile || { echo "Pasta frontend-mobile não encontrada"; exit 1; }

echo "[1/4] Verificando dependências EAS CLI..."
if ! command -v eas &> /dev/null
then
    echo "⚠️ EAS CLI não encontrado. Instalando globalmente..."
    npm install -g eas-cli
else
    echo "✅ EAS CLI já instalado."
fi

echo "[2/4] Verificando login no Expo..."
eas whoami || {
    echo "❌ Você não está logado no Expo. Por favor, execute:"
    echo "eas login"
    exit 1
}

echo "[3/4] Instalando pacotes internos do React Native..."
npm install

# Aqui poderíamos injetar as variáveis de ambiente baseadas em build profiles (eas.json)
# Ex: EXPO_PUBLIC_API_URL=https://api.petprev.com.br/api/v1

echo "========================================================"
echo "🚀 TUDO PRONTO PARA COMPILAÇÃO NAS NUVENS!"
echo "========================================================"
echo "Para gerar o arquivo APK/AAB para Android (Play Store), execute:"
echo "   cd frontend-mobile && eas build --platform android --profile production"
echo ""
echo "Para gerar o IPA para iOS (App Store / TestFlight), execute:"
echo "   cd frontend-mobile && eas build --platform ios --profile production"
echo "========================================================"
echo "Dica: Os binários compilados serão disponibilizados em link na sua conta do Expo Dev."
exit 0
