export interface Pet {
  id: string;
  name: string;
  species: "Cão" | "Gato";
  breed: string;
  age: string;
  weight: string;
  emoji: string;
  vaccinesUpToDate: boolean;
}

export interface Vaccine {
  id: string;
  petId: string;
  name: string;
  appliedAt: string;
  nextDose: string;
  lot: string;
  vet: string;
}

export interface Visit {
  id: string;
  petId: string;
  date: string;
  time: string;
  reason: string;
  vet: string;
  status: "agendada" | "a_caminho" | "concluida";
}

export interface Prescription {
  id: string;
  petId: string;
  date: string;
  vet: string;
  crmv: string;
  items: { drug: string; dosage: string; duration: string }[];
}

export interface ClinicalEntry {
  id: string;
  petId: string;
  date: string;
  title: string;
  summary: string;
}

export const pets: Pet[] = [
  {
    id: "p1",
    name: "Thor",
    species: "Cão",
    breed: "Golden Retriever",
    age: "4 anos",
    weight: "32,4 kg",
    emoji: "🐕",
    vaccinesUpToDate: true,
  },
  {
    id: "p2",
    name: "Mia",
    species: "Gato",
    breed: "SRD",
    age: "2 anos",
    weight: "4,1 kg",
    emoji: "🐈",
    vaccinesUpToDate: false,
  },
];

export const vaccines: Vaccine[] = [
  {
    id: "v1",
    petId: "p1",
    name: "V10 (Múltipla canina)",
    appliedAt: "12/03/2026",
    nextDose: "12/03/2027",
    lot: "LT-4471",
    vet: "Dra. Camila Souza",
  },
  {
    id: "v2",
    petId: "p1",
    name: "Antirrábica",
    appliedAt: "12/03/2026",
    nextDose: "12/03/2027",
    lot: "LT-9920",
    vet: "Dra. Camila Souza",
  },
  {
    id: "v3",
    petId: "p2",
    name: "V4 (Quádrupla felina)",
    appliedAt: "02/07/2025",
    nextDose: "02/07/2026",
    lot: "LT-1183",
    vet: "Dr. Rafael Lima",
  },
  {
    id: "v4",
    petId: "p2",
    name: "Antirrábica",
    appliedAt: "02/07/2025",
    nextDose: "02/07/2026",
    lot: "LT-2201",
    vet: "Dr. Rafael Lima",
  },
];

export const visits: Visit[] = [
  {
    id: "a1",
    petId: "p1",
    date: "Hoje",
    time: "15:20",
    reason: "Vacinação anual + checkup",
    vet: "Dra. Camila Souza",
    status: "a_caminho",
  },
  {
    id: "a2",
    petId: "p2",
    date: "02/09/2026",
    time: "10:00",
    reason: "Reforço V4",
    vet: "Dr. Rafael Lima",
    status: "agendada",
  },
  {
    id: "a3",
    petId: "p1",
    date: "14/05/2026",
    time: "09:30",
    reason: "Dermatite — retorno",
    vet: "Dra. Camila Souza",
    status: "concluida",
  },
  {
    id: "a4",
    petId: "p2",
    date: "02/07/2025",
    time: "16:00",
    reason: "Primeira consulta",
    vet: "Dr. Rafael Lima",
    status: "concluida",
  },
];

export const prescriptions: Prescription[] = [
  {
    id: "r1",
    petId: "p1",
    date: "14/05/2026",
    vet: "Dra. Camila Souza",
    crmv: "CRMV-BA 12345",
    items: [
      { drug: "Cefalexina 500 mg", dosage: "1 comp. a cada 12h", duration: "10 dias" },
      { drug: "Shampoo clorexidina 2%", dosage: "Banho 2x/semana", duration: "3 semanas" },
    ],
  },
  {
    id: "r2",
    petId: "p2",
    date: "02/07/2025",
    vet: "Dr. Rafael Lima",
    crmv: "CRMV-BA 20988",
    items: [{ drug: "Vermífugo oral", dosage: "1 comp. dose única", duration: "Dose única" }],
  },
];

export const clinicalHistory: ClinicalEntry[] = [
  {
    id: "c1",
    petId: "p1",
    date: "14/05/2026",
    title: "Dermatite alérgica",
    summary: "Lesões em região dorsal, resposta boa ao tratamento. Prurido reduzido.",
  },
  {
    id: "c2",
    petId: "p1",
    date: "12/03/2026",
    title: "Consulta de rotina",
    summary: "Escore corporal 5/9, parâmetros vitais normais. Vacinas em dia.",
  },
  {
    id: "c3",
    petId: "p2",
    date: "02/07/2025",
    title: "Primeira consulta",
    summary: "Filhote hígido, iniciado protocolo vacinal e vermifugação.",
  },
];

export const petById = (id: string) => pets.find((p) => p.id === id);
