import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
// import { database } from '../database';

export default function MedicalRecordScreen({ route, navigation }: any) {
  const { appointmentId, petId } = route.params || { appointmentId: 'mock-1', petId: 'pet-1' };
  
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [vaccines, setVaccines] = useState('');
  
  const [signature, setSignature] = useState<string | null>(null);

  const handleSign = () => {
    // Integração mock com react-native-signature-canvas
    Alert.alert('Assinatura', 'Coletando assinatura via ECDSA...');
    setSignature('MOCK_ECDSA_SIGNATURE_BASE64');
  };

  const handleSave = async () => {
    if (!signature) {
      Alert.alert('Erro', 'A assinatura do tutor é obrigatória.');
      return;
    }

    try {
      /*
      await database.write(async () => {
        const recordsCollection = database.collections.get('medical_records');
        await recordsCollection.create(record => {
          record.appointment_id = appointmentId;
          record.pet_id = petId;
          record.weight_recorded = parseFloat(weight);
          record.temperature_body = parseFloat(temperature);
          record.clinical_notes = notes;
          record.applied_vaccines = JSON.stringify([vaccines]); // simplificado
          record.signature_ecdsa = signature;
          record.tutor_consent_timestamp = new Date().toISOString();
          record.is_synced = false;
        });
      });
      */
      Alert.alert('Sucesso', 'Prontuário salvo offline. Será sincronizado em breve.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao salvar prontuário.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Prontuário Clínico</Text>
      
      <Text style={styles.label}>Peso (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
      />

      <Text style={styles.label}>Temperatura Corporal (°C)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={temperature}
        onChangeText={setTemperature}
      />

      <Text style={styles.label}>Vacinas Aplicadas (ex: V10_CANINE)</Text>
      <TextInput
        style={styles.input}
        value={vaccines}
        onChangeText={setVaccines}
      />

      <Text style={styles.label}>Anotações Clínicas</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        numberOfLines={4}
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity style={styles.button} onPress={handleSign}>
        <Text style={styles.buttonText}>Coletar Assinatura (Tutor)</Text>
      </TouchableOpacity>

      {signature && (
        <Text style={styles.signatureSuccess}>✅ Assinatura capturada com sucesso</Text>
      )}

      <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
        <Text style={styles.buttonText}>Finalizar Consulta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0F172A' },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#0D9488', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  saveButton: { backgroundColor: '#0F172A', marginTop: 10, marginBottom: 40 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signatureSuccess: { color: '#0D9488', marginBottom: 15, fontWeight: 'bold', textAlign: 'center' },
});
