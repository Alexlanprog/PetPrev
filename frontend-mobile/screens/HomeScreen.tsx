import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

interface HomeScreenProps {
  userPhone: string;
  onNavigate: (tab: 'home' | 'pets' | 'coldChain' | 'medicalRecord') => void;
}

export default function HomeScreen({ userPhone, onNavigate }: HomeScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.greeting}>Olá, Tutor! 👋</Text>
        <Text style={styles.phoneBadge}>📱 {userPhone}</Text>
        <Text style={styles.bannerSub}>Seus pets estão protegidos com o Plano Essencial PetPrev.</Text>
      </View>

      {/* Next Appointment Card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📅 Próximo Atendimento em Casa</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>● Confirmado</Text>
          </View>
          <Text style={styles.dateText}>Amanhã, 14:30</Text>
        </View>

        <Text style={styles.cardTitle}>Visita Domiciliar - Vacinação Anual</Text>
        <Text style={styles.vetInfo}>👨‍⚕️ Vet: Dr. Ricardo Santos (CRMV-SP 18.942)</Text>
        <Text style={styles.petInfo}>🐶 Para: Thor (Golden Retriever) & 🐱 Mel (Siamês)</Text>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.footerLabel}>Vacinas Agendadas:</Text>
          <Text style={styles.footerValue}>V10 Canina + Antirrábica + Quádrupla Felina</Text>
        </View>
      </View>

      {/* Shortcuts */}
      <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
      
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('pets')}>
          <Text style={styles.gridEmoji}>🐾</Text>
          <Text style={styles.gridTitle}>Meus Pets</Text>
          <Text style={styles.gridSub}>2 cadastrados</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('medicalRecord')}>
          <Text style={styles.gridEmoji}>📋</Text>
          <Text style={styles.gridTitle}>Prontuário Digital</Text>
          <Text style={styles.gridSub}>Histórico e vacinas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => onNavigate('coldChain')}>
          <Text style={styles.gridEmoji}>🌡️</Text>
          <Text style={styles.gridTitle}>Trava Térmica</Text>
          <Text style={styles.gridSub}>Auditoria de frio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => alert('Suporte WhatsApp acionado! (11) 98888-7777')}>
          <Text style={styles.gridEmoji}>💬</Text>
          <Text style={styles.gridTitle}>Atendimento RT</Text>
          <Text style={styles.gridSub}>Suporte 24h</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  banner: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  phoneBadge: {
    fontSize: 13,
    color: '#38BDF8',
    marginTop: 4,
  },
  bannerSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  vetInfo: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  petInfo: {
    fontSize: 14,
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
    marginRight: 6,
  },
  footerValue: {
    fontSize: 13,
    color: '#64748B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  gridSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
