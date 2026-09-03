import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const petprevSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'appointments',
      columns: [
        { name: 'tutor_id', type: 'string' },
        { name: 'pet_id', type: 'string' },
        { name: 'veterinarian_id', type: 'string' },
        { name: 'scheduled_date', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'medical_records',
      columns: [
        { name: 'appointment_id', type: 'string' },
        { name: 'pet_id', type: 'string' },
        { name: 'weight_recorded', type: 'number', isOptional: true },
        { name: 'temperature_body', type: 'number', isOptional: true },
        { name: 'clinical_notes', type: 'string', isOptional: true },
        { name: 'applied_vaccines', type: 'string', isOptional: true },
        { name: 'signature_ecdsa', type: 'string', isOptional: true },
        { name: 'tutor_consent_timestamp', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cold_chain_audits',
      columns: [
        { name: 'appointment_id', type: 'string' },
        { name: 'veterinarian_id', type: 'string' },
        { name: 'temperature_recorded', type: 'number' },
        { name: 'photo_evidence_path', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
