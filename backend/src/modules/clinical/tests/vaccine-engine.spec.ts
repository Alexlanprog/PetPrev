import { VaccineProtocolEngine, ProtocolRule } from '../domain/vaccine-engine';

describe('VaccineProtocolEngine', () => {
  const rtProtocolRules: ProtocolRule[] = [
    {
      species: 'CANINE',
      minAgeWeeks: 6,
      maxAgeWeeks: 8,
      doseLabel: 'PUPPY_DOSE_1',
      requiredVaccines: ['V10_CANINE'],
      nextDoseWindowDays: { min: 21, max: 28 },
    },
    {
      species: 'CANINE',
      minAgeWeeks: 9,
      maxAgeWeeks: 12,
      doseLabel: 'PUPPY_DOSE_2',
      requiredVaccines: ['V10_CANINE', 'CANINE_FLU'],
      nextDoseWindowDays: { min: 21, max: 28 },
    },
    {
      species: 'CANINE',
      minAgeWeeks: 13,
      maxAgeWeeks: 16,
      doseLabel: 'PUPPY_DOSE_3_AND_RABIES',
      requiredVaccines: ['V10_CANINE', 'RABIES'],
      nextDoseWindowDays: { min: 330, max: 365 },
    },
    {
      species: 'FELINE',
      minAgeWeeks: 8,
      maxAgeWeeks: 10,
      doseLabel: 'KITTEN_DOSE_1',
      requiredVaccines: ['V4_FELINE'],
      nextDoseWindowDays: { min: 21, max: 28 },
    },
  ];

  it('deve retornar PUPPY_DOSE_1 para cão de 7 semanas', () => {
    const result = VaccineProtocolEngine.evaluateWithRtProtocol('CANINE', 7, rtProtocolRules);
    expect(result.currentDose).toBe('PUPPY_DOSE_1');
    expect(result.eligibleVaccines).toEqual(['V10_CANINE']);
    expect(result.nextDoseWindowDays).toEqual({ min: 21, max: 28 });
  });

  it('deve retornar PUPPY_DOSE_2 e Gripe para cão de 10 semanas', () => {
    const result = VaccineProtocolEngine.evaluateWithRtProtocol('CANINE', 10, rtProtocolRules);
    expect(result.currentDose).toBe('PUPPY_DOSE_2');
    expect(result.eligibleVaccines).toEqual(['V10_CANINE', 'CANINE_FLU']);
  });

  it('deve retornar ANNUAL_BOOSTER (padrão) para cão adulto de 52 semanas', () => {
    const result = VaccineProtocolEngine.evaluateWithRtProtocol('CANINE', 52, rtProtocolRules);
    expect(result.currentDose).toBe('ANNUAL_BOOSTER');
    expect(result.eligibleVaccines).toEqual(['V10_CANINE', 'RABIES', 'CANINE_FLU']);
    expect(result.nextDoseWindowDays).toEqual({ min: 330, max: 365 });
  });

  it('deve retornar KITTEN_DOSE_1 para gato de 9 semanas', () => {
    const result = VaccineProtocolEngine.evaluateWithRtProtocol('FELINE', 9, rtProtocolRules);
    expect(result.currentDose).toBe('KITTEN_DOSE_1');
    expect(result.eligibleVaccines).toEqual(['V4_FELINE']);
  });

  it('deve retornar ANNUAL_BOOSTER (padrão) para gato adulto de 52 semanas', () => {
    const result = VaccineProtocolEngine.evaluateWithRtProtocol('FELINE', 52, rtProtocolRules);
    expect(result.currentDose).toBe('ANNUAL_BOOSTER');
    expect(result.eligibleVaccines).toEqual(['V4_FELINE', 'RABIES']);
  });
});
