import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrEngineUtil } from '../common/utils/qr-engine.util';
import { RegistrationStatus, Role } from '@prisma/client';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates official participant ID card payload and QR code.
   * Enforces: Status must be APPROVED, IDOR ownership check.
   */
  async getParticipantCard(registrationId: string, requesterUserId: string, requesterRole: Role) {
    const reg = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        branch: {
          include: {
            level: {
              include: {
                category: true,
              },
            },
          },
        },
        individualParticipant: true,
        team: {
          include: {
            members: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!reg) {
      throw new NotFoundException('Data pendaftaran tidak ditemukan.');
    }

    // IDOR Protection: Peserta can only access their own card
    if (requesterRole === Role.PESERTA && reg.userId !== requesterUserId) {
      throw new ForbiddenException('Akses ditolak: Anda tidak memiliki izin melihat kartu ini.');
    }

    // Must be approved
    if (reg.status !== RegistrationStatus.APPROVED) {
      throw new BadRequestException(
        `Kartu peserta hanya dapat diakses setelah pembayaran disetujui. Status saat ini: ${reg.status}`,
      );
    }

    // Generate Base64 QR Code image from secure qrCodeToken
    const qrDataUri = await QrEngineUtil.generateQrDataUri(reg.qrCodeToken);

    // Fetch branding settings
    const settings = await this.prisma.appSetting.findMany();
    const brandingMap: Record<string, string> = {};
    settings.forEach((s) => {
      if (s.value) brandingMap[s.key] = s.value;
    });

    const participantName =
      reg.individualParticipant?.fullName || reg.team?.teamName || 'Peserta Resmi';
    const schoolName =
      reg.individualParticipant?.schoolName || reg.team?.schoolName || '-';

    return {
      registration_number: reg.registrationNumber,
      participant_name: participantName,
      school_name: schoolName,
      category_name: reg.branch.level.category.name,
      level_name: reg.branch.level.name,
      branch_name: reg.branch.name,
      participant_type: reg.branch.participantType,
      mentor_name: reg.individualParticipant?.mentorName || reg.team?.mentorName || '-',
      leader_name: reg.team?.leaderName || null,
      members: reg.team?.members || [],
      qr_data_uri: qrDataUri,
      qr_code_token: reg.qrCodeToken,
      status: reg.status,
      app_title: brandingMap['application_name'] || 'SISTEM PENDAFTARAN LOMBA',
      app_short_name: brandingMap['application_short_name'] || 'MASKUMAMBANG FEST #4',
      logo_url: brandingMap['app_logo_path'] || '/static/img/logo_e7a8b6a95d.webp',
    };
  }
}
