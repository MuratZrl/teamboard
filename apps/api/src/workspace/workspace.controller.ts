import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { RoleGuard, Roles } from '../common/guards/role.guard';
import { Request } from 'express';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  create(@Req() req: Request, @Body('name') name: string) {
    const user = req.user as { id: string };
    return this.workspaceService.create(user.id, name);
  }

  @Get()
  findAll(@Req() req: Request, @Query() query: PaginationDto) {
    const user = req.user as { id: string };
    return this.workspaceService.findAllForUser(user.id, query);
  }

  @Get(':id')
  @UseGuards(WorkspaceGuard)
  findOne(@Param('id') id: string) {
    return this.workspaceService.findById(id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceGuard, RoleGuard)
  @Roles('OWNER', 'ADMIN')
  update(@Param('id') id: string, @Body('name') name: string) {
    return this.workspaceService.update(id, name);
  }

  @Delete(':id')
  @UseGuards(WorkspaceGuard, RoleGuard)
  @Roles('OWNER')
  delete(@Param('id') id: string) {
    return this.workspaceService.delete(id);
  }
}
