import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Image } from 'react-native';

interface LoginScreenProps {
  onLoginSuccess: (userPhone: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState('');

  const handleSendCode = () => {
    if (phone.trim().length < 10) {
      Alert.alert('Atenção', 'Insira um número de celular válido com DDD (ex: 11999998888).');
      return;
    }
    setStep('otp');
    Alert.alert('Código Enviado! 📲', `Um código de verificação de 6 dígitos foi enviado via WhatsApp/SMS para o número ${phone}. (Use 123456 no teste)`);
  };

  const handleVerifyCode = () => {
    if (otpCode.trim() === '123456' || otpCode.trim().length === 6) {
      onLoginSuccess(phone);
    } else {
      Alert.alert('Erro', 'Código de verificação incorreto. Tente usar 123456.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.logoTitle}>PetPrev</Text>
          <Text style={styles.logoSubtitle}>Saúde Veterinária Preventiva em Casa</Text>
        </View>

        {step === 'phone' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar ou Criar Conta</Text>
            <Text style={styles.cardSubtitle}>Informe seu celular com DDD para receber a chave de acesso rápida por WhatsApp ou SMS.</Text>

            <Text style={styles.inputLabel}>Número de Celular</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 99999-8888"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={15}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleSendCode}>
              <Text style={styles.buttonText}>Continuar com Celular ➔</Text>
            </TouchableOpacity>

            <View style={styles.securityBadge}>
              <Text style={styles.securityText}>🔒 Sem senhas. Autenticação rápida e segura via OTP.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Digite o Código de 6 Dígitos</Text>
            <Text style={styles.cardSubtitle}>Enviamos um código para o número <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{phone}</Text>.</Text>

            <Text style={styles.inputLabel}>Código OTP (Teste: 123456)</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="123456"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={otpCode}
              onChangeText={setOtpCode}
              maxLength={6}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyCode}>
              <Text style={styles.buttonText}>Confirmar e Entrar 🎉</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('phone')}>
              <Text style={styles.secondaryButtonText}>← Alterar número de celular</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#0D9488',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 14,
  },
  securityBadge: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  securityText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
});
