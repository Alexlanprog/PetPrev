import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';

export default function PetsScreen() {
  const [pets, setPets] = useState([
    { id: '1', name: 'Thor', species: 'Cão', breed: 'Golden Retriever', age: '3 anos', vaccineStatus: '✅ Vacinas em dia' },
    { id: '2', name: 'Mel', species: 'Gato', breed: 'Siamês', age: '1 ano', vaccineStatus: '⚠️ V4 Pendente (15 dias)' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Cão');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');

  const handleAddPet = () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor insira o nome do Pet.');
      return;
    }
    const newPet = {
      id: String(Date.now()),
      name,
      species,
      breed: breed || 'SRD (Vira-lata)',
      age: age ? `${age} anos` : 'Filhote',
      vaccineStatus: '🆕 Protocolo em análise pelo RT',
    };
    setPets([...pets, newPet]);
    setModalVisible(false);
    setName('');
    setBreed('');
    setAge('');
    Alert.alert('Pet Cadastrado! 🐾', `${name} foi adicionado ao seu plano PetPrev!`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Meus Pets</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Adicionar Pet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {pets.map((pet) => (
          <View key={pet.id} style={styles.petCard}>
            <View style={styles.petAvatar}>
              <Text style={styles.petEmoji}>{pet.species === 'Cão' ? '🐶' : '🐱'}</Text>
            </View>

            <View style={styles.petDetails}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petSub}>{pet.breed} • {pet.age}</Text>
              <Text style={styles.vaccineStatus}>{pet.vaccineStatus}</Text>
            </View>

            <TouchableOpacity style={styles.detailButton} onPress={() => Alert.alert(`Carteira de ${pet.name}`, 'Exibindo histórico de vacinas e vermífugos no MinIO.')}>
              <Text style={styles.detailButtonText}>Carteira ➔</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Modal Adicionar Pet */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cadastrar Novo Pet 🐾</Text>

            <Text style={styles.label}>Nome do Pet</Text>
            <TextInput style={styles.input} placeholder="Ex: Bob" value={name} onChangeText={setName} />

            <Text style={styles.label}>Espécie</Text>
            <View style={styles.speciesRow}>
              <TouchableOpacity
                style={[styles.speciesBtn, species === 'Cão' && styles.speciesBtnActive]}
                onPress={() => setSpecies('Cão')}
              >
                <Text style={species === 'Cão' ? styles.speciesTextActive : styles.speciesText}>🐶 Cão</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.speciesBtn, species === 'Gato' && styles.speciesBtnActive]}
                onPress={() => setSpecies('Gato')}
              >
                <Text style={species === 'Gato' ? styles.speciesTextActive : styles.speciesText}>🐱 Gato</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Raça</Text>
            <TextInput style={styles.input} placeholder="Ex: Poodle ou SRD" value={breed} onChangeText={setBreed} />

            <Text style={styles.label}>Idade (Anos)</Text>
            <TextInput style={styles.input} placeholder="Ex: 2" keyboardType="numeric" value={age} onChangeText={setAge} />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddPet}>
              <Text style={styles.saveButtonText}>Salvar e Cadastrar Pet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  addButton: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  petAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  petEmoji: {
    fontSize: 26,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  petSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  vaccineStatus: {
    fontSize: 12,
    color: '#0D9488',
    marginTop: 4,
    fontWeight: '600',
  },
  detailButton: {
    padding: 8,
  },
  detailButtonText: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  speciesRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  speciesBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  speciesBtnActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  speciesText: {
    color: '#334155',
    fontWeight: '600',
  },
  speciesTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 14,
  },
});
