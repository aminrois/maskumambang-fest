"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CompetitionsService = class CompetitionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTree() {
        const categories = await this.prisma.competitionCategory.findMany({
            where: { isActive: true },
            include: {
                levels: {
                    include: {
                        branches: {
                            where: { isActive: true },
                            orderBy: { name: 'asc' },
                            include: {
                                _count: {
                                    select: { registrations: true },
                                },
                                registrations: {
                                    where: { status: 'APPROVED' },
                                    select: { id: true },
                                },
                            },
                        },
                    },
                    orderBy: { name: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
        return categories.map(cat => ({
            ...cat,
            levels: cat.levels.map(lvl => ({
                ...lvl,
                branches: lvl.branches.map(b => ({
                    ...b,
                    verifiedCount: b.registrations ? b.registrations.length : 0,
                    registrations: undefined,
                })),
            })),
        }));
    }
    async getBranchDetail(id) {
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
            throw new common_1.NotFoundException('Cabang lomba tidak ditemukan.');
        }
        return branch;
    }
    async validateHierarchy(categoryId, levelId, branchId) {
        if (branchId) {
            const branch = await this.prisma.competitionBranch.findUnique({
                where: { id: branchId },
                include: { level: true },
            });
            if (!branch) {
                throw new common_1.NotFoundException('Cabang lomba tidak ditemukan.');
            }
            if (!branch.isActive) {
                throw new common_1.BadRequestException('Cabang lomba ini sedang tidak aktif.');
            }
            if (levelId && branch.levelId !== levelId) {
                throw new common_1.BadRequestException('Inkonsistensi data: Cabang lomba tidak terdaftar pada jenjang yang dipilih.');
            }
            if (categoryId && branch.level.categoryId !== categoryId) {
                throw new common_1.BadRequestException('Inkonsistensi data: Jenjang tidak terdaftar pada kategori yang dipilih.');
            }
        }
        else if (levelId && categoryId) {
            const level = await this.prisma.competitionLevel.findUnique({
                where: { id: levelId },
            });
            if (!level) {
                throw new common_1.NotFoundException('Jenjang lomba tidak ditemukan.');
            }
            if (level.categoryId !== categoryId) {
                throw new common_1.BadRequestException('Inkonsistensi data: Jenjang tidak terdaftar pada kategori yang dipilih.');
            }
        }
        return true;
    }
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
    async createCategory(dto) {
        const existing = await this.prisma.competitionCategory.findFirst({
            where: {
                OR: [{ name: dto.name.trim() }, { slug: dto.slug.trim() }],
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Kategori dengan nama atau slug ini sudah ada.');
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
    async updateCategory(id, dto) {
        const category = await this.prisma.competitionCategory.findUnique({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException('Kategori tidak ditemukan.');
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
    async toggleCategory(id) {
        const category = await this.prisma.competitionCategory.findUnique({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException('Kategori tidak ditemukan.');
        }
        return this.prisma.competitionCategory.update({
            where: { id },
            data: { isActive: !category.isActive },
        });
    }
    async getLevelsByCategory(categoryId) {
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
    async createLevel(dto) {
        const category = await this.prisma.competitionCategory.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Kategori induk tidak ditemukan.');
        }
        const existing = await this.prisma.competitionLevel.findFirst({
            where: {
                categoryId: dto.categoryId,
                name: dto.name.trim(),
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Jenjang dengan nama ini sudah terdaftar pada kategori tersebut.');
        }
        return this.prisma.competitionLevel.create({
            data: {
                categoryId: dto.categoryId,
                name: dto.name.trim(),
                slug: dto.slug.trim(),
            },
        });
    }
    async updateLevel(id, dto) {
        const level = await this.prisma.competitionLevel.findUnique({ where: { id } });
        if (!level) {
            throw new common_1.NotFoundException('Jenjang tidak ditemukan.');
        }
        return this.prisma.competitionLevel.update({
            where: { id },
            data: {
                name: dto.name?.trim(),
                slug: dto.slug?.trim(),
            },
        });
    }
    async getBranchesByLevel(levelId) {
        return this.prisma.competitionBranch.findMany({
            where: { levelId },
            orderBy: { name: 'asc' },
        });
    }
    async createBranch(dto) {
        const level = await this.prisma.competitionLevel.findUnique({
            where: { id: dto.levelId },
        });
        if (!level) {
            throw new common_1.NotFoundException('Jenjang induk tidak ditemukan.');
        }
        if (dto.participantType === 'TEAM') {
            if (!dto.minTeamMembers || !dto.maxTeamMembers) {
                throw new common_1.BadRequestException('Cabang beregu (TEAM) wajib menentukan batas minimum dan maksimum anggota.');
            }
            if (dto.minTeamMembers > dto.maxTeamMembers) {
                throw new common_1.BadRequestException('Batas minimum anggota tidak boleh lebih besar dari maksimum.');
            }
        }
        const existing = await this.prisma.competitionBranch.findFirst({
            where: {
                levelId: dto.levelId,
                name: dto.name.trim(),
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Cabang lomba ini sudah terdaftar pada jenjang tersebut.');
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
                juknisUrl: dto.juknisUrl?.trim() || null,
                maxRegistrants: dto.maxRegistrants ?? null,
                isActive: true,
            },
        });
    }
    async updateBranch(id, dto) {
        const branch = await this.prisma.competitionBranch.findUnique({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException('Cabang lomba tidak ditemukan.');
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
                juknisUrl: dto.juknisUrl !== undefined ? (dto.juknisUrl?.trim() || null) : undefined,
                maxRegistrants: dto.maxRegistrants !== undefined ? (dto.maxRegistrants ?? null) : undefined,
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
    async deleteBranch(id) {
        const branch = await this.prisma.competitionBranch.findUnique({
            where: { id },
            include: { _count: { select: { registrations: true } } },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Cabang lomba tidak ditemukan.');
        }
        if (branch._count.registrations > 0) {
            return this.prisma.competitionBranch.update({
                where: { id },
                data: { isActive: false },
            });
        }
        return this.prisma.competitionBranch.delete({ where: { id } });
    }
    async deleteLevel(id) {
        const level = await this.prisma.competitionLevel.findUnique({
            where: { id },
            include: { _count: { select: { branches: true } } },
        });
        if (!level) {
            throw new common_1.NotFoundException('Jenjang tidak ditemukan.');
        }
        if (level._count.branches > 0) {
            throw new common_1.BadRequestException('Jenjang tidak dapat dihapus karena masih memiliki cabang lomba terdaftar.');
        }
        return this.prisma.competitionLevel.delete({ where: { id } });
    }
    async deleteCategory(id) {
        const category = await this.prisma.competitionCategory.findUnique({
            where: { id },
            include: { _count: { select: { levels: true } } },
        });
        if (!category) {
            throw new common_1.NotFoundException('Kategori tidak ditemukan.');
        }
        if (category._count.levels > 0) {
            throw new common_1.BadRequestException('Kategori tidak dapat dihapus karena masih memiliki jenjang terdaftar.');
        }
        return this.prisma.competitionCategory.delete({ where: { id } });
    }
    async toggleBranch(id) {
        const branch = await this.prisma.competitionBranch.findUnique({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException('Cabang lomba tidak ditemukan.');
        }
        return this.prisma.competitionBranch.update({
            where: { id },
            data: { isActive: !branch.isActive },
        });
    }
};
exports.CompetitionsService = CompetitionsService;
exports.CompetitionsService = CompetitionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompetitionsService);
//# sourceMappingURL=competitions.service.js.map