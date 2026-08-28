import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateLevelDto,
  UpdateLevelDto,
  CreateBranchDto,
  UpdateBranchDto,
} from './dto/competition.dto';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  // --- Public Endpoints ---

  @Public()
  @Get('tree')
  async getCompetitionTree() {
    const tree = await this.competitionsService.getTree();
    return {
      success: true,
      data: tree,
    };
  }

  @Public()
  @Get('branch/:id')
  async getBranchDetail(@Param('id') id: string) {
    const branch = await this.competitionsService.getBranchDetail(id);
    return {
      success: true,
      data: branch,
    };
  }

  // --- Super Admin Management Endpoints ---

  @Roles(Role.SUPER_ADMIN)
  @Get('categories')
  async getAllCategories() {
    const categories = await this.competitionsService.getAllCategories();
    return { success: true, data: categories };
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    const created = await this.competitionsService.createCategory(dto);
    return { success: true, message: 'Kategori berhasil dibuat.', data: created };
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const updated = await this.competitionsService.updateCategory(id, dto);
    return { success: true, message: 'Kategori berhasil diperbarui.', data: updated };
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch('categories/:id/toggle')
  async toggleCategory(@Param('id') id: string) {
    const toggled = await this.competitionsService.toggleCategory(id);
    return {
      success: true,
      message: `Status kategori diubah menjadi: ${toggled.isActive ? 'AKTIF' : 'NONAKTIF'}`,
      data: toggled,
    };
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('categories/:categoryId/levels')
  async getLevelsByCategory(@Param('categoryId') categoryId: string) {
    const levels = await this.competitionsService.getLevelsByCategory(categoryId);
    return { success: true, data: levels };
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('levels')
  async createLevel(@Body() dto: CreateLevelDto) {
    const created = await this.competitionsService.createLevel(dto);
    return { success: true, message: 'Jenjang berhasil dibuat.', data: created };
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch('levels/:id')
  async updateLevel(@Param('id') id: string, @Body() dto: UpdateLevelDto) {
    const updated = await this.competitionsService.updateLevel(id, dto);
    return { success: true, message: 'Jenjang berhasil diperbarui.', data: updated };
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('levels/:levelId/branches')
  async getBranchesByLevel(@Param('levelId') levelId: string) {
    const branches = await this.competitionsService.getBranchesByLevel(levelId);
    return { success: true, data: branches };
  }

  @Roles(Role.SUPER_ADMIN)
  @Post('branches')
  async createBranch(@Body() dto: CreateBranchDto) {
    const created = await this.competitionsService.createBranch(dto);
    return { success: true, message: 'Cabang lomba berhasil dibuat.', data: created };
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('levels/all')
  async getAllLevels() {
    const levels = await this.competitionsService.getAllLevels();
    return { success: true, data: levels };
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('branches/all')
  async getAllBranches() {
    const branches = await this.competitionsService.getAllBranches();
    return { success: true, data: branches };
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    const deleted = await this.competitionsService.deleteCategory(id);
    return { success: true, message: 'Kategori berhasil dihapus.', data: deleted };
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete('levels/:id')
  async deleteLevel(@Param('id') id: string) {
    const deleted = await this.competitionsService.deleteLevel(id);
    return { success: true, message: 'Jenjang berhasil dihapus.', data: deleted };
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch('branches/:id')
  async updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    const updated = await this.competitionsService.updateBranch(id, dto);
    return { success: true, message: 'Cabang lomba berhasil diperbarui.', data: updated };
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete('branches/:id')
  async deleteBranch(@Param('id') id: string) {
    const deleted = await this.competitionsService.deleteBranch(id);
    return { success: true, message: 'Cabang lomba berhasil dihapus.', data: deleted };
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch('branches/:id/toggle')
  async toggleBranch(@Param('id') id: string) {
    const toggled = await this.competitionsService.toggleBranch(id);
    return {
      success: true,
      message: `Status cabang lomba diubah menjadi: ${toggled.isActive ? 'AKTIF' : 'NONAKTIF'}`,
      data: toggled,
    };
  }
}
