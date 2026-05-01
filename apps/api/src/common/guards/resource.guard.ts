// Fix: C1 — resolve a URL-param resource ID to its workspace and verify
// the authenticated user is a member. Each named guard is a thin wrapper
// around a shared resolver+membership check so the auth logic lives once.
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type WorkspaceResolver = (
  prisma: PrismaService,
  resourceId: string,
) => Promise<string | null>;

interface ResourceGuardConfig {
  paramName: string;
  resolveWorkspaceId: WorkspaceResolver;
}

async function enforceMembership(
  prisma: PrismaService,
  context: ExecutionContext,
  config: ResourceGuardConfig,
): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const user = request.user;
  const resourceId = request.params?.[config.paramName];

  // JwtAuthGuard must run first; if it didn't, surface as 401 not 403.
  if (!user) {
    throw new UnauthorizedException('Authentication required');
  }
  // Missing param means the guard is mounted on a route that doesn't
  // expose the expected URL param — a developer error, not a permission denial.
  if (!resourceId) {
    throw new InternalServerErrorException(
      `Guard misconfigured: missing param "${config.paramName}"`,
    );
  }

  const workspaceId = await config.resolveWorkspaceId(prisma, resourceId);
  if (!workspaceId) {
    throw new NotFoundException('Resource not found');
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId },
    },
  });

  if (!membership) {
    throw new ForbiddenException('You are not a member of this workspace');
  }

  request.workspaceMember = membership;
  return true;
}

@Injectable()
export class BoardWorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return enforceMembership(this.prisma, context, {
      paramName: 'id',
      resolveWorkspaceId: async (prisma, id) => {
        const row = await prisma.board.findUnique({
          where: { id },
          select: { workspaceId: true },
        });
        return row?.workspaceId ?? null;
      },
    });
  }
}

@Injectable()
export class ColumnWorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return enforceMembership(this.prisma, context, {
      paramName: 'id',
      resolveWorkspaceId: async (prisma, id) => {
        const row = await prisma.column.findUnique({
          where: { id },
          select: { board: { select: { workspaceId: true } } },
        });
        return row?.board?.workspaceId ?? null;
      },
    });
  }
}

// Variant of ColumnWorkspaceGuard for routes that name the column param `columnId`
// (e.g. POST /columns/:columnId/tasks).
@Injectable()
export class ColumnIdWorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return enforceMembership(this.prisma, context, {
      paramName: 'columnId',
      resolveWorkspaceId: async (prisma, id) => {
        const row = await prisma.column.findUnique({
          where: { id },
          select: { board: { select: { workspaceId: true } } },
        });
        return row?.board?.workspaceId ?? null;
      },
    });
  }
}

@Injectable()
export class TaskWorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return enforceMembership(this.prisma, context, {
      paramName: 'id',
      resolveWorkspaceId: async (prisma, id) => {
        const row = await prisma.task.findUnique({
          where: { id },
          select: { column: { select: { board: { select: { workspaceId: true } } } } },
        });
        return row?.column?.board?.workspaceId ?? null;
      },
    });
  }
}

// Variant for nested routes like /tasks/:taskId/comments and /tasks/:taskId/attachments.
@Injectable()
export class TaskIdWorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return enforceMembership(this.prisma, context, {
      paramName: 'taskId',
      resolveWorkspaceId: async (prisma, id) => {
        const row = await prisma.task.findUnique({
          where: { id },
          select: { column: { select: { board: { select: { workspaceId: true } } } } },
        });
        return row?.column?.board?.workspaceId ?? null;
      },
    });
  }
}

@Injectable()
export class CommentWorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return enforceMembership(this.prisma, context, {
      paramName: 'id',
      resolveWorkspaceId: async (prisma, id) => {
        const row = await prisma.comment.findUnique({
          where: { id },
          select: {
            task: {
              select: {
                column: { select: { board: { select: { workspaceId: true } } } },
              },
            },
          },
        });
        return row?.task?.column?.board?.workspaceId ?? null;
      },
    });
  }
}

@Injectable()
export class AttachmentWorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return enforceMembership(this.prisma, context, {
      paramName: 'id',
      resolveWorkspaceId: async (prisma, id) => {
        const row = await prisma.attachment.findUnique({
          where: { id },
          select: {
            task: {
              select: {
                column: { select: { board: { select: { workspaceId: true } } } },
              },
            },
          },
        });
        return row?.task?.column?.board?.workspaceId ?? null;
      },
    });
  }
}

@Injectable()
export class LabelWorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return enforceMembership(this.prisma, context, {
      paramName: 'id',
      resolveWorkspaceId: async (prisma, id) => {
        const row = await prisma.label.findUnique({
          where: { id },
          select: { workspaceId: true },
        });
        return row?.workspaceId ?? null;
      },
    });
  }
}
