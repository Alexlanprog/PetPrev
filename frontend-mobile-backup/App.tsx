import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import PetsScreen from './screens/PetsScreen';
import ColdChainScreen from './screens/ColdChainScreen';
import MedicalRecordScreen from './screens/MedicalRecordScreen';

export default function App() {
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'pets' | 'coldChain' | 'medicalRecord'>('home');

  const mockNavigation = {
    goBack: () => setActiveTab('home')
  };

  const mockRoute = {
    params: {
      appointmentId: 'AT-2026-001',
      veterinarianId: 'VET-9821',
      petId: 'PET-PETPREV-01'
    }
  };

  // 1. If not authenticated, display Login OTP screen
  if (!userPhone) {
    return <LoginScreen onLoginSuccess={(phone) => setUserPhone(phone)} />;
  }

  // 2. If authenticated, render full application with TabBar
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🐾 PetPrev</Text>
          <Text style={styles.headerSubtitle}>Saúde Veterinária em Casa</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setUserPhone(null)}>
          <Text style={styles.logoutBtnText}>Sair 🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'home' && styles.activeTabButton]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>
            🏠 Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pets' && styles.activeTabButton]}
          onPress={() => setActiveTab('pets')}
        >
          <Text style={[styles.tabText, activeTab === 'pets' && styles.activeTabText]}>
            🐾 Pets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'coldChain' && styles.activeTabButton]}
          onPress={() => setActiveTab('coldChain')}
        >
          <Text style={[styles.tabText, activeTab === 'coldChain' && styles.activeTabText]}>
            🌡️ Térmica
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'medicalRecord' && styles.activeTabButton]}
          onPress={() => setActiveTab('medicalRecord')}
        >
          <Text style={[styles.tabText, activeTab === 'medicalRecord' && styles.activeTabText]}>
            📋 Prontuário
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen userPhone={userPhone} onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'pets' && <PetsScreen />}
        {activeTab === 'coldChain' && (
          <ColdChainScreen route={mockRoute} navigation={mockNavigation} />
        )}
        {activeTab === 'medicalRecord' && (
          <MedicalRecordScreen route={mockRoute} navigation={mockNavigation} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    padding: 4,
    marginHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#0D9488',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
});
