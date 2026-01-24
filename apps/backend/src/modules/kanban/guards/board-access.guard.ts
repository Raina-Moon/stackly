import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BoardService } from '../services/board.service';
import { BoardRole } from '../../../entities/board-member.entity';

export const ROLES_KEY = 'roles';
export const BoardRoles = (...roles: BoardRole[]) => Reflect.metadata(ROLES_KEY, roles);

@Injectable()
export class BoardAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private boardService: BoardService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const boardId = request.params.id || request.params.boardId;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!boardId) {
      return true; // No board ID means no board-specific access check
    }

    const member = await this.boardService.getMember(boardId, user.id);

    if (!member) {
      throw new ForbiddenException('이 보드에 접근 권한이 없습니다.');
    }

    // Check required roles if specified
    const requiredRoles = this.reflector.getAllAndOverride<BoardRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(member.role)) {
        throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
      }
    }

    // Attach member info to request for use in controllers
    request.boardMember = member;

    return true;
  }
}
