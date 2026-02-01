import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { BoardService } from '../services/board.service';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser, AuthUser } from '../../auth/decorators/get-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  async create(@Body() createBoardDto: CreateBoardDto, @GetUser() user: AuthUser) {
    return this.boardService.create(createBoardDto, user.id);
  }

  @Get()
  async findAll(@GetUser() user: AuthUser) {
    // Return boards where user is a member
    return this.boardService.findUserBoards(user.id);
  }

  @Get('invite/:inviteCode')
  @Public()
  async findByInviteCode(@Param('inviteCode') inviteCode: string) {
    const board = await this.boardService.findByInviteCode(inviteCode);
    // Return limited info for unauthenticated users
    return {
      id: board.id,
      name: board.name,
      description: board.description,
      color: board.color,
      owner: {
        nickname: board.owner?.nickname,
      },
    };
  }

  @Post('join/:inviteCode')
  async joinBoard(@Param('inviteCode') inviteCode: string, @GetUser() user: AuthUser) {
    const member = await this.boardService.joinBoard(inviteCode, user.id);
    return {
      message: '보드에 참여했습니다.',
      boardId: member.boardId,
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string, @GetUser() user: AuthUser) {
    // Check if user is a member
    const isMember = await this.boardService.isMember(id, user.id);
    if (!isMember) {
      throw new ForbiddenException('이 보드에 접근 권한이 없습니다.');
    }
    return this.boardService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @GetUser() user: AuthUser,
  ) {
    // Check if user has edit permission
    const member = await this.boardService.getMember(id, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('이 보드를 수정할 권한이 없습니다.');
    }
    return this.boardService.update(id, updateBoardDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: AuthUser) {
    const board = await this.boardService.findById(id);
    if (board.ownerId !== user.id) {
      throw new ForbiddenException('보드 소유자만 삭제할 수 있습니다.');
    }
    await this.boardService.remove(id);
    return { message: '보드가 삭제되었습니다.' };
  }

  @Post(':id/regenerate-invite')
  async regenerateInviteCode(@Param('id') id: string, @GetUser() user: AuthUser) {
    const newInviteCode = await this.boardService.regenerateInviteCode(id, user.id);
    return { inviteCode: newInviteCode };
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') boardId: string,
    @Param('userId') targetUserId: string,
    @GetUser() user: AuthUser,
  ) {
    await this.boardService.removeMember(boardId, targetUserId, user.id);
    return { message: '멤버가 제거되었습니다.' };
  }

  @Get(':id/invite-code')
  async getInviteCode(@Param('id') id: string, @GetUser() user: AuthUser) {
    const member = await this.boardService.getMember(id, user.id);
    if (!member) {
      throw new ForbiddenException('이 보드에 접근 권한이 없습니다.');
    }
    const board = await this.boardService.findById(id);
    return { inviteCode: board.inviteCode };
  }

  @Post(':id/favorite')
  async toggleFavorite(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.boardService.toggleFavorite(id, user.id);
  }

  @Get('user/favorites')
  async getFavorites(@GetUser() user: AuthUser) {
    const favoriteIds = await this.boardService.getFavoriteIds(user.id);
    return { favoriteIds };
  }
}
