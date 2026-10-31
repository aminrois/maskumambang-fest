import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus } from '@prisma/client';

export interface PublicParticipantSearchResult {
  registration_number: string;
  participant_name: string;
  school_name: string;
  branch_name: string;
  level_name: string;
  category_name: string;
  status: string;
}

export interface PublicHomepageStatsResult {
  totalParticipants: number;
  individualCount: number;
  teamParticipantCount: number;
  totalTeams: number;
  totalBranches: number;
}

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  private cachedStats: { data: PublicHomepageStatsResult; expiresAt: number } | null = null;

  /**
   * Mengambil statistik publik untuk live counter homepage:
   * Menghitung seluruh pendaftar yang sudah submit (WAITING_VERIFICATION + APPROVED).
   * Individu dihitung 1, Tim dihitung seluruh anggotanya (termasuk ketua tim).
   */
  async getHomepageStats(): Promise<PublicHomepageStatsResult> {
    const now = Date.now();
    if (this.cachedStats && this.cachedStats.expiresAt > now) {
      return this.cachedStats.data;
    }

    const submittedFilter = {
      status: {
        in: [RegistrationStatus.WAITING_VERIFICATION, RegistrationStatus.APPROVED],
      },
    };

    // 1. Total Individu
    const individualCount = await this.prisma.individualParticipant.count({
      where: {
        registration: submittedFilter,
      },
    });

    // 2. Total Tim & Anggota
    const teams = await this.prisma.team.findMany({
      where: {
        registration: submittedFilter,
      },
      select: {
        leaderName: true,
        members: {
          select: {
            memberName: true,
            positionRole: true,
          },
        },
      },
    });

    let teamParticipantCount = 0;
    for (const t of teams) {
      const hasLeaderInMembers = t.members.some(
        (m) =>
          m.positionRole === 'Ketua Tim' ||
          (m.memberName &&
            t.leaderName &&
            m.memberName.trim().toLowerCase() === t.leaderName.trim().toLowerCase()),
      );
      // Jika ketua tim sudah tercatat di tabel teamMember (misal hasil bulk import), hitung jumlah record members
      // Jika belum tercatat di tabel teamMember (pendaftaran manual wizard biasa), 1 (ketua) + members.length
      teamParticipantCount += hasLeaderInMembers
        ? t.members.length
        : 1 + t.members.length;
    }

    const totalParticipants = individualCount + teamParticipantCount;

    const totalBranches = await this.prisma.competitionBranch.count({
      where: { isActive: true },
    });

    const result: PublicHomepageStatsResult = {
      totalParticipants,
      individualCount,
      teamParticipantCount,
      totalTeams: teams.length,
      totalBranches,
    };

    this.cachedStats = {
      data: result,
      expiresAt: now + 30000, // Cache 30 detik agar sangat ringan di server
    };

    return result;
  }

  /**
   * Searches participants publicly by name, team name, registration number, or school name.
   * Strictly filtered to 7 public non-sensitive fields.
   */
  async searchParticipants(query?: string): Promise<PublicParticipantSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleaned = query.trim();

    const registrations = await this.prisma.registration.findMany({
      where: {
        OR: [
          { registrationNumber: { contains: cleaned, mode: 'insensitive' } },
          {
            individualParticipant: {
              OR: [
                { fullName: { contains: cleaned, mode: 'insensitive' } },
                { schoolName: { contains: cleaned, mode: 'insensitive' } },
              ],
            },
          },
          {
            team: {
              OR: [
                { teamName: { contains: cleaned, mode: 'insensitive' } },
                { schoolName: { contains: cleaned, mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
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
        team: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return registrations.map((r) => {
      const participantName =
        r.individualParticipant?.fullName || r.team?.teamName || 'Peserta';
      const schoolName =
        r.individualParticipant?.schoolName || r.team?.schoolName || '-';

      return {
        registration_number: r.registrationNumber,
        participant_name: participantName,
        school_name: schoolName,
        branch_name: r.branch.name,
        level_name: r.branch.level.name,
        category_name: r.branch.level.category.name,
        status: r.status,
      };
    });
  }
}
