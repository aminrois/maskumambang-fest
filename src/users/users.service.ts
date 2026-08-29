import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { HashUtil } from '../common/utils/hash.util';
import { ChangePasswordDto, ResetPasswordDto } from './dto/user.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async createUser(staffId: string, dto: import('./dto/user.dto').CreateUserDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar.');
    }
    const passwordHash = await HashUtil.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phoneNumber: dto.phoneNumber.trim(),
        passwordHash,
        role: dto.role || Role.PESERTA,
        isActive: true,
      },
    });
    await this.auditService.log({
      userId: staffId,
      action: 'ADMIN_CREATE_USER',
      targetTable: 'users',
      targetId: user.id,
      details: `Admin membuat user baru: ${user.name} (${user.email}) dengan role ${user.role}`,
    });
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async listUsers(search?: string, role?: Role, isActive?: boolean, page = 1, perPage = 25) {
    const skip = (page - 1) * perPage;
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          sessionVersion: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async toggleActiveStatus(userId: string, staffId?: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !user.isActive,
        sessionVersion: { increment: 1 },
      },
    });

    if (staffId) {
      await this.auditService.log({
        userId: staffId,
        action: 'TOGGLE_USER_STATUS',
        targetTable: 'users',
        targetId: user.id,
        details: `Status akun ${user.email} diubah menjadi: ${updated.isActive ? 'AKTIF' : 'NONAKTIF'}`,
      });
    }

    return updated;
  }

  async changeRole(userId: string, newRole: Role, staffId?: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: newRole,
        sessionVersion: { increment: 1 },
      },
    });

    if (staffId) {
      await this.auditService.log({
        userId: staffId,
        action: 'CHANGE_USER_ROLE',
        targetTable: 'users',
        targetId: user.id,
        details: `Role akun ${user.email} diubah dari ${user.role} menjadi ${newRole}`,
      });
    }

    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const isMatch = await HashUtil.verifyPassword(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Kata sandi saat ini tidak cocok.');
    }

    const newHash = await HashUtil.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        sessionVersion: { increment: 1 },
      },
    });

    await this.auditService.log({
      userId,
      action: 'CHANGE_PASSWORD',
      targetTable: 'users',
      targetId: userId,
      details: 'Pengguna berhasil mengubah kata sandinya sendiri.',
    });

    return { success: true, message: 'Kata sandi berhasil diperbarui.' };
  }

  async resetPassword(staffId: string, targetUserId: string, dto: ResetPasswordDto) {
    const user = await this.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('Pengguna target tidak ditemukan.');
    }

    const newHash = await HashUtil.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash: newHash,
        sessionVersion: { increment: 1 },
      },
    });

    await this.auditService.log({
      userId: staffId,
      action: 'RESET_USER_PASSWORD',
      targetTable: 'users',
      targetId: targetUserId,
      details: `Super Admin mereset password untuk pengguna: ${user.email}`,
    });

    return {
      success: true,
      message: `Kata sandi untuk ${user.email} berhasil direset.`,
    };
  }

  async deleteUser(staffId: string, targetUserId: string) {
    if (staffId === targetUserId) {
      throw new BadRequestException('Anda tidak dapat menghapus akun Anda sendiri.');
    }

    const user = await this.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Find all registrations submitted by this user
      const regs = await tx.registration.findMany({
        where: { userId: targetUserId },
        select: { id: true },
      });
      const regIds = regs.map((r) => r.id);

      if (regIds.length > 0) {
        // Delete checkIns for these registrations
        await tx.checkIn.deleteMany({ where: { registrationId: { in: regIds } } });

        // Delete verification logs for payments of these registrations
        const payments = await tx.payment.findMany({
          where: { registrationId: { in: regIds } },
          select: { id: true },
        });
        const payIds = payments.map((p) => p.id);
        if (payIds.length > 0) {
          await tx.paymentVerificationLog.deleteMany({ where: { paymentId: { in: payIds } } });
        }

        // Delete payments
        await tx.payment.deleteMany({ where: { registrationId: { in: regIds } } });

        // Delete participants & teams
        await tx.individualParticipant.deleteMany({ where: { registrationId: { in: regIds } } });
        const teams = await tx.team.findMany({
          where: { registrationId: { in: regIds } },
          select: { id: true },
        });
        const teamIds = teams.map((t) => t.id);
        if (teamIds.length > 0) {
          await tx.teamMember.deleteMany({ where: { teamId: { in: teamIds } } });
        }
        await tx.team.deleteMany({ where: { registrationId: { in: regIds } } });

        // Delete registrations
        await tx.registration.deleteMany({ where: { id: { in: regIds } } });
      }

      // Clear verification logs performed by this user
      await tx.paymentVerificationLog.deleteMany({
        where: { verifiedByUserId: targetUserId },
      });

      // Clear audit logs by this user
      await tx.auditLog.deleteMany({ where: { userId: targetUserId } });

      // Finally delete the user
      await tx.user.delete({ where: { id: targetUserId } });
    });

    await this.auditService.log({
      userId: staffId,
      action: 'ADMIN_DELETE_USER',
      targetTable: 'users',
      targetId: targetUserId,
      details: `Super Admin menghapus pengguna: ${user.name} (${user.email})`,
    });

    return {
      success: true,
      message: `Pengguna ${user.name} (${user.email}) berhasil dihapus.`,
    };
  }

  async bulkDeleteUsers(staffId: string, userIds: string[]) {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('Pilih setidaknya satu pengguna untuk dihapus.');
    }

    const validIds = userIds.filter((id) => id !== staffId);
    if (validIds.length === 0) {
      throw new BadRequestException('Tidak ada pengguna yang valid untuk dihapus (tidak dapat menghapus akun sendiri).');
    }

    let deletedCount = 0;
    for (const id of validIds) {
      try {
        await this.deleteUser(staffId, id);
        deletedCount++;
      } catch (err) {
        // Skip failed
      }
    }

    return {
      success: true,
      message: `${deletedCount} pengguna berhasil dihapus.`,
      deletedCount,
    };
  }
}
