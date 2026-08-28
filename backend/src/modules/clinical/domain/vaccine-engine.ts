export interface ProtocolRule {
  species: 'CANINE' | 'FELINE';
  minAgeWeeks: number;
  maxAgeWeeks: number;
  requiredVaccines: string[];
  doseLabel: string;
  nextDoseWindowDays: { min: number; max: number };
}

export interface VaccineEngineResult {
  eligibleVaccines: string[];
  currentDose: string;
  nextDoseWindowDays: { min: number; max: number };
}

export class VaccineProtocolEngine {
  /**
   * Motor determinístico: Avalia o protocolo baseado na VERSÃO DINÂMICA
   * aprovada pelo Responsável Técnico (RT) na tabela `clinical_protocol_versions`.
   * @param petSpecies Espécie do pet (CANINE ou FELINE)
   * @param ageInWeeks Idade exata do pet em semanas
   * @param protocolRules Array com as regras JSON extraídas da versão ativa do protocolo
   */
  public static evaluateWithRtProtocol(
    petSpecies: 'CANINE' | 'FELINE',
    ageInWeeks: number,
    protocolRules: ProtocolRule[],
  ): VaccineEngineResult {
    // Busca a regra específica que contempla a espécie e a faixa de idade (em semanas)
    const matchedRule = protocolRules.find(
      (rule) =>
        rule.species === petSpecies &&
        ageInWeeks >= rule.minAgeWeeks &&
        ageInWeeks <= rule.maxAgeWeeks,
    );

    // Se nenhuma regra específica foi encontrada na grade de filhotes ou jovens,
    // ou se o pet for adulto, retorna o reforço anual padrão (Booster) daquela espécie.
    if (!matchedRule) {
      return {
        eligibleVaccines:
          petSpecies === 'CANINE'
            ? ['V10_CANINE', 'RABIES', 'CANINE_FLU']
            : ['V4_FELINE', 'RABIES'],
        currentDose: 'ANNUAL_BOOSTER',
        nextDoseWindowDays: { min: 330, max: 365 },
      };
    }

    return {
      eligibleVaccines: matchedRule.requiredVaccines,
      currentDose: matchedRule.doseLabel,
      nextDoseWindowDays: matchedRule.nextDoseWindowDays,
    };
  }
}
