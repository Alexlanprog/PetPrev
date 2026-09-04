import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../../database/entities/user.entity';
import { TutorEntity } from '../../database/entities/tutor.entity';
import { VeterinarianEntity } from '../../database/entities/veterinarian.entity';
import { PetEntity } from '../../database/entities/pet.entity';
import { AppointmentEntity } from '../../database/entities/appointment.entity';
import { MedicalRecordEntity } from '../../database/entities/medical-record.entity';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { UserRole, PetSpecies, AppointmentStatus, SubscriptionStatus } from '../../database/enums';

@Injectable()
export class DevService {
  private readonly logger = new Logger(DevService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(TutorEntity)
    private readonly tutorRepository: Repository<TutorEntity>,
    @InjectRepository(VeterinarianEntity)
    private readonly veterinarianRepository: Repository<VeterinarianEntity>,
    @InjectRepository(PetEntity)
    private readonly petRepository: Repository<PetEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(MedicalRecordEntity)
    private readonly medicalRecordRepository: Repository<MedicalRecordEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Popula o banco com um cenário completo e realista de demonstração
   */
  async seedDemoScenario() {
    this.logger.log('Iniciando carga de dados de demonstração (Seed)...');

    // 1. Usuário e Perfil do Tutor (Ana Ribeiro)
    let tutorUser = await this.userRepository.findOne({ where: { phone_number: '+5571999990001' } });
    if (!tutorUser) {
      tutorUser = this.userRepository.create({
        phone_number: '+5571999990001',
        email: 'ana.ribeiro@petprev.com.br',
        cpf: '111.111.111-11',
        role: UserRole.TUTOR,
        is_active: true,
      });
      tutorUser = await this.userRepository.save(tutorUser);
    }

    let tutor = await this.tutorRepository.findOne({ where: { user_id: tutorUser.id } });
    if (!tutor) {
      tutor = this.tutorRepository.create({
        user_id: tutorUser.id,
        full_name: 'Ana Ribeiro',
        address_street: 'Rua das Hortênsias',
        address_number: '420',
        address_neighborhood: 'Pituba',
        address_city: 'Salvador',
        address_zipcode: '41810-010',
        h3_index_res8: '8a2a1072b59ffff',
      });
      tutor = await this.tutorRepository.save(tutor);
    }

    // 2. Usuário e Perfil da Veterinária de Campo (Dra. Camila Souza)
    let vetUser = await this.userRepository.findOne({ where: { phone_number: '+5571999990003' } });
    if (!vetUser) {
      vetUser = this.userRepository.create({
        phone_number: '+5571999990003',
        email: 'camila.souza@petprev.com.br',
        cpf: '333.333.333-33',
        role: UserRole.VET_FIELD,
        is_active: true,
      });
      vetUser = await this.userRepository.save(vetUser);
    }

    let vet = await this.veterinarianRepository.findOne({ where: { user_id: vetUser.id } });
    if (!vet) {
      vet = this.veterinarianRepository.create({
        user_id: vetUser.id,
        full_name: 'Dra. Camila Souza',
        crmv_number: '12345',
        crmv_uf: 'BA',
        approval_status: 'APPROVED',
        pix_key: 'camila.vet@petprev.com.br',
        rating_average: 4.95,
        base_h3_index: '8a2a1072b59ffff',
      });
      vet = await this.veterinarianRepository.save(vet);
    }

    // 3. Usuário RT / Admin (Dra. Helena Braga)
    let rtUser = await this.userRepository.findOne({ where: { phone_number: '+5511999990002' } });
    if (!rtUser) {
      rtUser = this.userRepository.create({
        phone_number: '+5511999990002',
        email: 'helena.braga.rt@petprev.com.br',
        cpf: '222.222.222-22',
        role: UserRole.VET_RESPONSAVEL_TECNICO,
        is_active: true,
      });
      rtUser = await this.userRepository.save(rtUser);
    }

    // 4. Pets (Thor e Mia)
    let petThor = await this.petRepository.findOne({ where: { tutor_id: tutor.id, name: 'Thor' } });
    if (!petThor) {
      petThor = this.petRepository.create({
        tutor_id: tutor.id,
        name: 'Thor',
        species: PetSpecies.CANINE,
        breed: 'Golden Retriever',
        gender: 'M',
        birth_date: '2022-04-10',
        weight_kg: 32.4,
        is_active: true,
      });
      petThor = await this.petRepository.save(petThor);
    }

    let petMia = await this.petRepository.findOne({ where: { tutor_id: tutor.id, name: 'Mia' } });
    if (!petMia) {
      petMia = this.petRepository.create({
        tutor_id: tutor.id,
        name: 'Mia',
        species: PetSpecies.FELINE,
        breed: 'SRD',
        gender: 'F',
        birth_date: '2024-02-15',
        weight_kg: 4.1,
        is_active: true,
      });
      petMia = await this.petRepository.save(petMia);
    }

    // 5. Assinatura do Tutor (PetPrev Família)
    let subscription = await this.subscriptionRepository.findOne({ where: { tutor_id: tutor.id } });
    if (!subscription) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setDate(nextMonth.getDate() + 30);
      const nextYear = new Date(today);
      nextYear.setDate(nextYear.getDate() + 365);

      subscription = this.subscriptionRepository.create({
        tutor_id: tutor.id,
        plan_type: 'Família',
        monthly_price: 149.9,
        status: SubscriptionStatus.ACTIVE,
        gateway_subscription_id: 'sub_demo_active_01',
        current_period_start: today.toISOString().split('T')[0],
        current_period_end: nextMonth.toISOString().split('T')[0],
        loyalty_end_date: nextYear.toISOString().split('T')[0],
      });
      subscription = await this.subscriptionRepository.save(subscription);
    }

    // 6. Agendamentos
    const todayStr = new Date().toISOString().split('T')[0];

    let appEnRoute = await this.appointmentRepository.findOne({
      where: { tutor_id: tutor.id, status: AppointmentStatus.EN_ROUTE },
    });
    if (!appEnRoute) {
      appEnRoute = this.appointmentRepository.create({
        tutor_id: tutor.id,
        pet_id: petThor.id,
        veterinarian_id: vet.id,
        scheduled_date: todayStr,
        time_window_start: '14:00:00',
        time_window_end: '18:00:00',
        status: AppointmentStatus.EN_ROUTE,
      });
      appEnRoute = await this.appointmentRepository.save(appEnRoute);
    }

    let appCompleted = await this.appointmentRepository.findOne({
      where: { tutor_id: tutor.id, status: AppointmentStatus.COMPLETED },
    });
    if (!appCompleted) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      appCompleted = this.appointmentRepository.create({
        tutor_id: tutor.id,
        pet_id: petThor.id,
        veterinarian_id: vet.id,
        scheduled_date: yesterday.toISOString().split('T')[0],
        time_window_start: '09:00:00',
        time_window_end: '11:00:00',
        status: AppointmentStatus.COMPLETED,
        payout_vet_amount: 85.0,
      });
      appCompleted = await this.appointmentRepository.save(appCompleted);
    }

    // 7. Prontuários (1 Conforme + 1 com Conflito para RT)
    const existingRecord = await this.medicalRecordRepository.findOne({
      where: { appointment_id: appCompleted.id },
    });
    if (!existingRecord) {
      const recordOk = this.medicalRecordRepository.create({
        appointment_id: appCompleted.id,
        pet_id: petThor.id,
        veterinarian_id: vet.id,
        weight_recorded: 32.4,
        temperature_body: 38.6,
        clinical_notes: 'Paciente alerta, hígido, escore corporal 5/9. Protocolo de imunização aplicado com sucesso.',
        vaccine_lot_applied: 'V10_CANINE (Lote LT-4471)',
        payload_hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        vet_digital_signature_base64: 'MOCK_SIG_DEMO_OK',
        vet_signed_at: new Date(),
        tutor_consent_timestamp: new Date(),
        tutor_consent_ip: '127.0.0.1',
        tutor_consent_document_version: 'v1.0',
        version: 1,
        has_conflict: false,
      });
      await this.medicalRecordRepository.save(recordOk);

      const recordConflict = this.medicalRecordRepository.create({
        appointment_id: appCompleted.id,
        pet_id: petMia.id,
        veterinarian_id: vet.id,
        weight_recorded: 4.1,
        temperature_body: 39.4,
        clinical_notes: 'Temperatura corporal discretamente elevada. Necessita validação do Responsável Técnico quanto à prescrição associada.',
        vaccine_lot_applied: 'V4_FELINE (Lote LT-1183)',
        payload_hash_sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        vet_digital_signature_base64: 'MOCK_SIG_DEMO_CONFLICT',
        vet_signed_at: new Date(),
        tutor_consent_timestamp: new Date(),
        tutor_consent_ip: '127.0.0.1',
        tutor_consent_document_version: 'v1.0',
        version: 1,
        has_conflict: true,
      });
      await this.medicalRecordRepository.save(recordConflict);
    }

    // 8. Gerar Tokens JWT válidos para teste imediato
    const jwtSecret = process.env.JWT_ACCESS_SECRET!;

    const tutorToken = this.jwtService.sign(
      { sub: tutorUser.id, phone_number: tutorUser.phone_number, role: tutorUser.role },
      { secret: jwtSecret, expiresIn: '7d' },
    );

    const vetToken = this.jwtService.sign(
      { sub: vetUser.id, phone_number: vetUser.phone_number, role: vetUser.role },
      { secret: jwtSecret, expiresIn: '7d' },
    );

    const rtToken = this.jwtService.sign(
      { sub: rtUser.id, phone_number: rtUser.phone_number, role: rtUser.role },
      { secret: jwtSecret, expiresIn: '7d' },
    );

    this.logger.log('✅ Carga de dados de demonstração (Seed) concluída com sucesso!');

    return {
      success: true,
      message: 'Cenário completo de demonstração criado com sucesso.',
      data: {
        tutor: { id: tutor.id, name: tutor.full_name, phone: tutorUser.phone_number, token: tutorToken },
        vet: { id: vet.id, name: vet.full_name, phone: vetUser.phone_number, token: vetToken },
        rt: { name: 'Dra. Helena Braga (RT)', phone: rtUser.phone_number, role: rtUser.role, token: rtToken },
        pets: [petThor.name, petMia.name],
        subscription: subscription.plan_type,
        appointments: [
          { status: appEnRoute.status, date: appEnRoute.scheduled_date },
          { status: appCompleted.status, date: appCompleted.scheduled_date },
        ],
      },
    };
  }
}
