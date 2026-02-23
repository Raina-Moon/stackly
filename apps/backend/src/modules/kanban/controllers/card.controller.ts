import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CardService } from '../services/card.service';
import { BoardService } from '../services/board.service';
import { ColumnService } from '../services/column.service';
import { CreateCardDto } from '../dto/create-card.dto';
import { UpdateCardDto } from '../dto/update-card.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser, AuthUser } from '../../auth/decorators/get-user.decorator';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardController {
  constructor(
    private readonly cardService: CardService,
    private readonly boardService: BoardService,
    private readonly columnService: ColumnService,
  ) {}

  private normalizeAssignees(data: { assigneeId?: string; assigneeIds?: string[] }) {
    const assigneeIds = Array.from(
      new Set((data.assigneeIds || (data.assigneeId ? [data.assigneeId] : [])).filter(Boolean)),
    );
    return {
      assigneeIds,
      assigneeId: assigneeIds[0] || undefined,
    };
  }

  @Post()
  async create(@Body() createCardDto: CreateCardDto, @GetUser() user: AuthUser) {
    const column = await this.columnService.findById(createCardDto.columnId);
    const member = await this.boardService.getMember(column.boardId, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('카드 생성 권한이 없습니다.');
    }
    const assignees = this.normalizeAssignees(createCardDto);
    const validAssignees = await this.boardService.areAllMembers(column.boardId, assignees.assigneeIds);
    if (!validAssignees) {
      throw new BadRequestException('담당자는 해당 보드에 초대된 멤버여야 합니다.');
    }

    return this.cardService.create({
      ...createCardDto,
      ...assignees,
      boardId: column.boardId,
    });
  }

  @Get('column/:columnId')
  async findByColumn(@Param('columnId') columnId: string, @GetUser() user: AuthUser) {
    const column = await this.columnService.findById(columnId);
    const isMember = await this.boardService.isMember(column.boardId, user.id);
    if (!isMember) {
      throw new ForbiddenException('이 보드에 접근 권한이 없습니다.');
    }
    return this.cardService.findAll(columnId);
  }

  @Get('board/:boardId')
  async findByBoard(@Param('boardId') boardId: string, @GetUser() user: AuthUser) {
    const isMember = await this.boardService.isMember(boardId, user.id);
    if (!isMember) {
      throw new ForbiddenException('이 보드에 접근 권한이 없습니다.');
    }
    return this.cardService.findByBoard(boardId);
  }

  @Get('assignee/:assigneeId')
  async findByAssignee(@Param('assigneeId') assigneeId: string, @GetUser() user: AuthUser) {
    // Only allow users to view their own assigned cards
    if (assigneeId !== user.id) {
      throw new ForbiddenException('다른 사용자의 할당된 카드를 조회할 권한이 없습니다.');
    }
    return this.cardService.findByAssignee(assigneeId);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @GetUser() user: AuthUser) {
    const card = await this.cardService.findById(id);
    const isMember = await this.boardService.isMember(card.boardId, user.id);
    if (!isMember) {
      throw new ForbiddenException('이 보드에 접근 권한이 없습니다.');
    }
    return card;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCardDto: UpdateCardDto,
    @GetUser() user: AuthUser,
  ) {
    const card = await this.cardService.findById(id);
    const member = await this.boardService.getMember(card.boardId, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('카드 수정 권한이 없습니다.');
    }
    let normalizedAssignees = {};
    if (updateCardDto.assigneeIds || Object.prototype.hasOwnProperty.call(updateCardDto, 'assigneeId')) {
      const assignees = this.normalizeAssignees(updateCardDto);
      const validAssignees = await this.boardService.areAllMembers(card.boardId, assignees.assigneeIds);
      if (!validAssignees) {
        throw new BadRequestException('담당자는 해당 보드에 초대된 멤버여야 합니다.');
      }
      normalizedAssignees = assignees;
    }

    return this.cardService.update(id, { ...updateCardDto, ...normalizedAssignees });
  }

  @Put(':id/move')
  async moveCard(
    @Param('id') id: string,
    @Body() { columnId, position }: { columnId: string; position: number },
    @GetUser() user: AuthUser,
  ) {
    const card = await this.cardService.findById(id);
    const member = await this.boardService.getMember(card.boardId, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('카드 이동 권한이 없습니다.');
    }
    // Verify target column belongs to same board
    const targetColumn = await this.columnService.findById(columnId);
    if (targetColumn.boardId !== card.boardId) {
      throw new ForbiddenException('다른 보드로 카드를 이동할 수 없습니다.');
    }
    return this.cardService.moveCard(id, columnId, position);
  }

  @Put('column/:columnId/reorder')
  async reorder(
    @Param('columnId') columnId: string,
    @Body('cardIds') cardIds: string[],
    @GetUser() user: AuthUser,
  ) {
    const column = await this.columnService.findById(columnId);
    const member = await this.boardService.getMember(column.boardId, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('카드 순서 변경 권한이 없습니다.');
    }
    return this.cardService.reorderCards(columnId, cardIds);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: AuthUser) {
    const card = await this.cardService.findById(id);
    const member = await this.boardService.getMember(card.boardId, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('카드 삭제 권한이 없습니다.');
    }
    await this.cardService.remove(id);
    return { message: '카드가 삭제되었습니다.' };
  }
}
