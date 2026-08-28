import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { CreateIndividualRegistrationDto } from './dto/create-individual.dto';
import { CreateTeamRegistrationDto } from './dto/create-team.dto';
import { ParticipantType, RegistrationStatus, Role } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generates formatted registration number matching reference implementation:
   * Individual: REG-IND-YYYY-<HEX6>
   * Team: REG-TIM-YYYY-<HEX6>
   */
  private generateRegistrationNumber(type: 'IND' | 'TIM'): string {
    const year = new Date().getFullYear();
    const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `REG-${type}-${year}-${hex}`;
  }

  /**
   * Generates secure QR token with HMAC signature matching reference implementation.
   */
  private generateQrToken(regId: string, regNumber: string): string {
    const salt = this.configService.get<string>('qr.salt') || 'default_salt';
    const uuidShort = regId.replace(/-/g, '').slice(0, 8);
    const regHex = Buffer.from(regNumber).toString('hex');
    const hmac = crypto
      .createHmac('sha256', salt)
      .update(`${regId}:${regNumber}`)
      .digest('hex');

    return `REGQR_${uuidShort}_${regHex}_${hmac}`;
  }

  /**
   * Submits Individual Registration.
   */
  async createIndividual(userId: string, dto: CreateIndividualRegistrationDto) {
    const branch = await this.prisma.competitionBranch.findUnique({
      where: { id: dto.branchId },
      include: { level: { include: { category: true } } },
    });

    if (!branch) {
      throw new NotFoundException('Cabang lomba tidak ditemukan.');
    }

    if (!branch.isActive) {
      throw new BadRequestException('Cabang lomba yang dipilih sedang tidak aktif.');
    }

    // Strict participant type verification against database
    if (branch.participantType !== ParticipantType.INDIVIDUAL) {
      throw new BadRequestException(
        'Cabang lomba ini adalah kategori Beregu (TEAM), gunakan form pendaftaran tim.',
      );
    }

    const regId = crypto.randomUUID();
    const regNumber = this.generateRegistrationNumber('IND');
    const qrToken = this.generateQrToken(regId, regNumber);

    // Atomic transaction
    const registration = await this.prisma.$transaction(async (tx) => {
      const reg = await tx.registration.create({
        data: {
          id: regId,
          registrationNumber: regNumber,
          userId,
          branchId: dto.branchId,
          status: RegistrationStatus.WAITING_VERIFICATION,
          qrCodeToken: qrToken,
        },
      });

      await tx.individualParticipant.create({
        data: {
          registrationId: reg.id,
          fullName: dto.fullName.trim(),
          gender: dto.gender,
          gradeClass: dto.gradeClass.trim(),
          schoolName: dto.schoolName.trim(),
          schoolAddress: dto.schoolAddress.trim(),
          mentorName: dto.mentorName.trim(),
          whatsappNumber: dto.whatsappNumber.trim(),
        },
      });

      return reg;
    });

    await this.auditService.log({
      userId,
      action: 'CREATE_REGISTRATION',
      targetTable: 'registrations',
      targetId: registration.id,
      details: `Pendaftaran individu baru: ${regNumber} (${dto.fullName} - ${branch.name})`,
    });

    return this.getRegistrationById(registration.id, userId, Role.PESERTA);
  }

  /**
   * Submits Team Registration with dynamic members.
   */
  async createTeam(userId: string, dto: CreateTeamRegistrationDto) {
    const branch = await this.prisma.competitionBranch.findUnique({
      where: { id: dto.branchId },
      include: { level: { include: { category: true } } },
    });

    if (!branch) {
      throw new NotFoundException('Cabang lomba tidak ditemukan.');
    }

    if (!branch.isActive) {
      throw new BadRequestException('Cabang lomba yang dipilih sedang tidak aktif.');
    }

    // Strict participant type verification against database
    if (branch.participantType !== ParticipantType.TEAM) {
      throw new BadRequestException(
        'Cabang lomba ini adalah kategori Perorangan (INDIVIDUAL), gunakan form pendaftaran individu.',
      );
    }

    // Team quota validation: Total team members = 1 (leader) + members.length
    const totalMembers = 1 + (dto.members ? dto.members.length : 0);
    const minMembers = branch.minTeamMembers || 2;
    const maxMembers = branch.maxTeamMembers || 10;

    if (totalMembers < minMembers) {
      throw new BadRequestException(
        `Jumlah anggota tim kurang dari batas minimum (${minMembers} orang termasuk ketua tim). Saat ini: ${totalMembers} orang.`,
      );
    }

    if (totalMembers > maxMembers) {
      throw new BadRequestException(
        `Jumlah anggota tim melebihi batas maksimum (${maxMembers} orang termasuk ketua tim). Saat ini: ${totalMembers} orang.`,
      );
    }

    const regId = crypto.randomUUID();
    const teamId = crypto.randomUUID();
    const regNumber = this.generateRegistrationNumber('TIM');
    const qrToken = this.generateQrToken(regId, regNumber);

    // Atomic transaction across registrations + teams + team_members
    const registration = await this.prisma.$transaction(async (tx) => {
      const reg = await tx.registration.create({
        data: {
          id: regId,
          registrationNumber: regNumber,
          userId,
          branchId: dto.branchId,
          status: RegistrationStatus.WAITING_VERIFICATION,
          qrCodeToken: qrToken,
        },
      });

      const team = await tx.team.create({
        data: {
          id: teamId,
          registrationId: reg.id,
          teamName: dto.teamName.trim(),
          schoolName: dto.schoolName.trim(),
          schoolAddress: dto.schoolAddress.trim(),
          mentorName: dto.mentorName.trim(),
          whatsappNumber: dto.whatsappNumber.trim(),
          leaderName: dto.leaderName.trim(),
        },
      });

      if (dto.members && dto.members.length > 0) {
        await tx.teamMember.createMany({
          data: dto.members.map((mem) => ({
            teamId: team.id,
            memberName: mem.memberName.trim(),
            gender: mem.gender,
            gradeClass: mem.gradeClass.trim(),
            positionRole: mem.positionRole ? mem.positionRole.trim() : 'Anggota',
          })),
        });
      }

      return reg;
    });

    await this.auditService.log({
      userId,
      action: 'CREATE_REGISTRATION',
      targetTable: 'registrations',
      targetId: registration.id,
      details: `Pendaftaran tim baru: ${regNumber} (${dto.teamName} - ${branch.name})`,
    });

    return this.getRegistrationById(registration.id, userId, Role.PESERTA);
  }

  /**
   * Retrieves all registrations submitted by the specified user.
   */
  async getUserRegistrations(userId: string) {
    return this.prisma.registration.findMany({
      where: { userId },
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
            members: true,
          },
        },
        payments: {
          include: {
            paymentAccount: true,
            verificationLogs: {
              orderBy: { verifiedAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        checkIn: {
          include: {
            checkedInBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves registration detail with strict ownership / IDOR check.
   */
  async getRegistrationById(id: string, requesterUserId: string, requesterRole: Role) {
    const reg = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
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
            members: true,
          },
        },
        payments: {
          include: {
            paymentAccount: true,
            verificationLogs: {
              include: {
                verifiedBy: {
                  select: { id: true, name: true, role: true },
                },
              },
              orderBy: { verifiedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        checkIn: {
          include: {
            checkedInBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!reg) {
      throw new NotFoundException('Data pendaftaran tidak ditemukan.');
    }

    // IDOR Protection: Peserta can only access their own registration
    if (requesterRole === Role.PESERTA && reg.userId !== requesterUserId) {
      throw new ForbiddenException('Akses ditolak: Anda tidak memiliki izin melihat data ini.');
    }

    return reg;
  }

  /**
   * Retrieves all registrations across system for Staff/Super Admin with search, filter, and pagination.
   */
  async listAllRegistrations(
    search?: string,
    status?: RegistrationStatus,
    branchId?: string,
    page = 1,
    perPage = 25,
  ) {
    const skip = (page - 1) * perPage;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { registrationNumber: { contains: q, mode: 'insensitive' } },
        { individualParticipant: { fullName: { contains: q, mode: 'insensitive' } } },
        { individualParticipant: { schoolName: { contains: q, mode: 'insensitive' } } },
        { team: { teamName: { contains: q, mode: 'insensitive' } } },
        { team: { schoolName: { contains: q, mode: 'insensitive' } } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [registrations, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, phoneNumber: true },
          },
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
              members: true,
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          checkIn: true,
        },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return {
      registrations,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }
}
