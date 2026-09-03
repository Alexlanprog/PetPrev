// frontend-mobile/services/syncService.ts

import { database } from '../database/index'; // Assuming WatermelonDB instance is exported from here
import { synchronize } from '@nozbe/watermelondb/sync';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export async function syncData() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const response = await fetch(
        `${API_BASE_URL}/clinical/sync/pull?last_pulled_at=${lastPulledAt || 0}&schema_version=${schemaVersion}&migration=${encodeURIComponent(JSON.stringify(migration || null))}`
      );
      if (!response.ok) {
        throw new Error('Failed to pull changes');
      }

      const { changes, timestamp } = await response.json();
      return { changes, timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      // 1. Enviar Trava Térmica
      if (changes.cold_chain_audits && changes.cold_chain_audits.created.length > 0) {
        for (const audit of changes.cold_chain_audits.created as any[]) {
          const formData = new FormData();
          formData.append('temperature', audit.temperature_recorded.toString());
          if (audit.photo_evidence_path) {
            formData.append('photoEvidence', {
              uri: audit.photo_evidence_path,
              name: 'cold-chain.jpg',
              type: 'image/jpeg',
            } as any);
          }
          
          await fetch(`${API_BASE_URL}/appointments/${audit.appointment_id}/cold-chain`, {
            method: 'POST',
            body: formData,
            headers: {
              // Add authorization headers
            },
          });
        }
      }

      // 2. Enviar Prontuário Clínico Assinado (ECDSA)
      if (changes.medical_records && changes.medical_records.created.length > 0) {
        for (const record of changes.medical_records.created as any[]) {
          const formData = new FormData();
          formData.append('appointment_id', record.appointment_id);
          formData.append('pet_id', record.pet_id);
          formData.append('weight_recorded', record.weight_recorded?.toString() || '');
          formData.append('temperature_body', record.temperature_body?.toString() || '');
          formData.append('clinical_notes', record.clinical_notes || '');
          formData.append('applied_vaccines', record.applied_vaccines || '[]');
          
          if (record.signature_ecdsa) {
            formData.append('signature_ecdsa', record.signature_ecdsa);
            formData.append('payload_signed', JSON.stringify({ appointment_id: record.appointment_id }));
          }

          if (record.tutor_consent_timestamp) {
            formData.append('tutor_consent_timestamp', record.tutor_consent_timestamp);
            formData.append('tutor_consent_document_version', 'v1.0');
          }

          await fetch(`${API_BASE_URL}/medical-records/signed`, {
            method: 'POST',
            body: formData,
            headers: {
              // Add authorization headers
            },
          });
        }
      }
    },
    migrationsEnabledAtVersion: 1,
  });
}
