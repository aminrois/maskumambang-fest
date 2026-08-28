import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateLevelDto,
  UpdateLevelDto,
  CreateBranchDto,
  UpdateBranchDto,
} from './dto/competition.dto';

@Injectable()
export class CompetitionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns active competition hierarchy (Category -> Level -> Branch).
   * Fully database-driven without hardcoded branch names.
   */
  async getTree() {
    return this.prisma.competitionCategory.findMany({
      where: { isActive: true },
      include: {
        levels: {
          include: {
            branches: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Retrieves specific branch details with its parent level and category.
   */
  async getBranchDetail(id: string) {
    const branch = await this.prisma.competitionBranch.findUnique({
      where: { id },
      include: {
        level: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Cabang lomba tidak ditemukan.');
    }

    return branch;
  }

  /**
   * Validates cross-check hierarchy:
   * Ensures branch belongs to level, and level belongs to category.
   */
  async validateHierarchy(
    categoryId?: string,
    levelId?: string,
    branchId?: string,
  ): Promise<boolean> {
    if (branchId) {
      const branch = await this.prisma.competitionBranch.findUnique({
        where: { id: branchId },
        include: { level: true },
      });

      if (!branch) {
        throw new NotFoundException('Cabang lomba tidak ditemukan.');
      }

      if (!branch.isActive) {
        throw new BadRequestException('Cabang lomba ini sedang tidak aktif.');
      }

      if (levelId && branch.levelId !== levelId) {
        throw new BadRequestException(
          'Inkonsistensi data: Cabang lomba tidak terdaftar pada jenjang yang dipilih.',
        );
      }

      if (categoryId && branch.level.categoryId !== categoryId) {
        throw new BadRequestException(
          'Inkonsistensi data: Jenjang tidak terdaftar pada kategori yang dipilih.',
        );
      }
    } else if (levelId && categoryId) {
      const level = await this.prisma.competitionLevel.findUnique({
        where: { id: levelId },
      });

      if (!level) {
        throw new NotFoundException('Jenjang lomba tidak ditemukan.');
      }

      if (level.categoryId !== categoryId) {
        throw new BadRequestException(
          'Inkonsistensi data: Jenjang tidak terdaftar pada kategori yang dipilih.',
        );
      }
    }

    return true;
  }

  // --- Category Management ---

  async getAllCategories() {
    return this.prisma.competitionCategory.findMany({
      include: {
        _count: {
          select: { levels: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.competitionCategory.findFirst({
      where: {
        OR: [{ name: dto.name.trim() }, { slug: dto.slug.trim() }],
      },
    });

    if (existing) {
      throw new ConflictException('Kategori dengan nama atau slug ini sudah ada.');
    }

    return this.prisma.competitionCategory.create({
      data: {
        name: dto.name.trim(),
        slug: dto.slug.trim(),
        description: dto.description?.trim(),
        isActive: true,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.competitionCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    return this.prisma.competitionCategory.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.slug?.trim(),
        description: dto.description?.trim(),
      },
    });
  }

  async toggleCategory(id: string) {
    const category = await this.prisma.competitionCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    return this.prisma.competitionCategory.update({
      where: { id },
      data: { isActive: !category.isActive },
    });
  }

  // --- Level Management ---

  async getLevelsByCategory(categoryId: string) {
    return this.prisma.competitionLevel.findMany({
      where: { categoryId },
      include: {
        _count: {
          select: { branches: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createLevel(dto: CreateLevelDto) {
    const category = await this.prisma.competitionCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Kategori induk tidak ditemukan.');
    }

    const existing = await this.prisma.competitionLevel.findFirst({
      where: {
        categoryId: dto.categoryId,
        name: dto.name.trim(),
      },
    });

    if (existing) {
      throw new ConflictException('Jenjang dengan nama ini sudah terdaftar pada kategori tersebut.');
    }

    return this.prisma.competitionLevel.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        slug: dto.slug.trim(),
      },
    });
  }

  async updateLevel(id: string, dto: UpdateLevelDto) {
    const level = await this.prisma.competitionLevel.findUnique({ where: { id } });
    if (!level) {
      throw new NotFoundException('Jenjang tidak ditemukan.');
    }

    return this.prisma.competitionLevel.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.slug?.trim(),
      },
    });
  }

  // --- Branch Management ---

  async getBranchesByLevel(levelId: string) {
    return this.prisma.competitionBranch.findMany({
      where: { levelId },
      orderBy: { name: 'asc' },
    });
  }

  async createBranch(dto: CreateBranchDto) {
    const level = await this.prisma.competitionLevel.findUnique({
      where: { id: dto.levelId },
    });

    if (!level) {
      throw new NotFoundException('Jenjang induk tidak ditemukan.');
    }

    if (dto.participantType === 'TEAM') {
      if (!dto.minTeamMembers || !dto.maxTeamMembers) {
        throw new BadRequestException(
          'Cabang beregu (TEAM) wajib menentukan batas minimum dan maksimum anggota.',
        );
      }
      if (dto.minTeamMembers > dto.maxTeamMembers) {
        throw new BadRequestException('Batas minimum anggota tidak boleh lebih besar dari maksimum.');
      }
    }

    const existing = await this.prisma.competitionBranch.findFirst({
      where: {
        levelId: dto.levelId,
        name: dto.name.trim(),
      },
    });

    if (existing) {
      throw new ConflictException('Cabang lomba ini sudah terdaftar pada jenjang tersebut.');
    }

    return this.prisma.competitionBranch.create({
      data: {
        levelId: dto.levelId,
        name: dto.name.trim(),
        participantType: dto.participantType,
        registrationFee: dto.registrationFee,
        minTeamMembers: dto.participantType === 'TEAM' ? dto.minTeamMembers : null,
        maxTeamMembers: dto.participantType === 'TEAM' ? dto.maxTeamMembers : null,
        description: dto.description?.trim(),
        isActive: true,
      },
    });
  }

  async updateBranch(id: string, dto: UpdateBranchDto) {
    const branch = await this.prisma.competitionBranch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Cabang lomba tidak ditemukan.');
    }

    return this.prisma.competitionBranch.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        participantType: dto.participantType,
        registrationFee: dto.registrationFee,
        minTeamMembers: dto.minTeamMembers,
        maxTeamMembers: dto.maxTeamMembers,
        description: dto.description?.trim(),
      },
    });
  }

  async getAllBranches() {
    return this.prisma.competitionBranch.findMany({
      include: {
        level: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { level: { category: { name: 'asc' } } },
        { level: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  async getAllLevels() {
    return this.prisma.competitionLevel.findMany({
      include: {
        category: true,
        _count: {
          select: { branches: true },
        },
      },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  async deleteBranch(id: string) {
    const branch = await this.prisma.competitionBranch.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!branch) {
      throw new NotFoundException('Cabang lomba tidak ditemukan.');
    }

    if (branch._count.registrations > 0) {
      // If registrations exist, toggle to inactive to preserve data integrity
      return this.prisma.competitionBranch.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.competitionBranch.delete({ where: { id } });
  }

  async deleteLevel(id: string) {
    const level = await this.prisma.competitionLevel.findUnique({
      where: { id },
      include: { _count: { select: { branches: true } } },
    });

    if (!level) {
      throw new NotFoundException('Jenjang tidak ditemukan.');
    }

    if (level._count.branches > 0) {
      throw new BadRequestException('Jenjang tidak dapat dihapus karena masih memiliki cabang lomba terdaftar.');
    }

    return this.prisma.competitionLevel.delete({ where: { id } });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.competitionCategory.findUnique({
      where: { id },
      include: { _count: { select: { levels: true } } },
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    if (category._count.levels > 0) {
      throw new BadRequestException('Kategori tidak dapat dihapus karena masih memiliki jenjang terdaftar.');
    }

    return this.prisma.competitionCategory.delete({ where: { id } });
  }

  async toggleBranch(id: string) {
    const branch = await this.prisma.competitionBranch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundException('Cabang lomba tidak ditemukan.');
    }

    return this.prisma.competitionBranch.update({
      where: { id },
      data: { isActive: !branch.isActive },
    });
  }
}
