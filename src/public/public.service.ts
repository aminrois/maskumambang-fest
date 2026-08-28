import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicParticipantSearchResult {
  registration_number: string;
  participant_name: string;
  school_name: string;
  branch_name: string;
  level_name: string;
  category_name: string;
  status: string;
}

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

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
