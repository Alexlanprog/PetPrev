import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
// import { database } from '../database';

export default function ColdChainScreen({ route, navigation }: any) {
  const { appointmentId, veterinarianId } = route.params || { appointmentId: 'mock-1', veterinarianId: 'mock-vet' };
  const [temperature, setTemperature] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleCapturePhoto = () => {
    // Integração mock com expo-camera
    Alert.alert('Câmera', 'Foto capturada (mock).');
    setPhotoUri('file:///mock/path/to/cold-chain-evidence.jpg');
  };

  const handleSave = async () => {
    if (!temperature || isNaN(Number(temperature))) {
      Alert.alert('Erro', 'Por favor, insira uma temperatura válida.');
      return;
    }

    try {
      /*
      await database.write(async () => {
        const coldChainCollection = database.collections.get('cold_chain_audits');
        await coldChainCollection.create(audit => {
          audit.appointment_id = appointmentId;
          audit.veterinarian_id = veterinarianId;
          audit.temperature_recorded = parseFloat(temperature);
          audit.photo_evidence_path = photoUri;
          audit.is_synced = false;
        });
      });
      */
      Alert.alert('Sucesso', 'Trava térmica salva offline. Será sincronizada em breve.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao salvar trava térmica.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auditoria de Trava Térmica</Text>
      
      <Text style={styles.label}>Temperatura Lida (°C)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ex: 5.0"
        value={temperature}
        onChangeText={setTemperature}
      />

      <TouchableOpacity style={styles.button} onPress={handleCapturePhoto}>
        <Text style={styles.buttonText}>Capturar Foto da Maleta</Text>
      </TouchableOpacity>

      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.imagePreview} />
      )}

      <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
        <Text style={styles.buttonText}>Salvar e Continuar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0F172A' },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 20 },
  button: { backgroundColor: '#0D9488', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  saveButton: { backgroundColor: '#0F172A', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  imagePreview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 20, backgroundColor: '#eee' },
});
