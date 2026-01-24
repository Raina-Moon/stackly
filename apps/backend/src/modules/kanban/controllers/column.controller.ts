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
} from '@nestjs/common';
import { ColumnService } from '../services/column.service';
import { BoardService } from '../services/board.service';
import { CreateColumnDto } from '../dto/create-column.dto';
import { UpdateColumnDto } from '../dto/update-column.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser, AuthUser } from '../../auth/decorators/get-user.decorator';

@Controller('columns')
@UseGuards(JwtAuthGuard)
export class ColumnController {
  constructor(
    private readonly columnService: ColumnService,
    private readonly boardService: BoardService,
  ) {}

  @Post()
  async create(@Body() createColumnDto: CreateColumnDto, @GetUser() user: AuthUser) {
    const member = await this.boardService.getMember(createColumnDto.boardId, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('컬럼 생성 권한이 없습니다.');
    }
    return this.columnService.create(createColumnDto);
  }

  @Get('board/:boardId')
  async findByBoard(@Param('boardId') boardId: string, @GetUser() user: AuthUser) {
    const isMember = await this.boardService.isMember(boardId, user.id);
    if (!isMember) {
      throw new ForbiddenException('이 보드에 접근 권한이 없습니다.');
    }
    return this.columnService.findByBoard(boardId);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @GetUser() user: AuthUser) {
    const column = await this.columnService.findById(id);
    const isMember = await this.boardService.isMember(column.boardId, user.id);
    if (!isMember) {
      throw new ForbiddenException('이 보드에 접근 권한이 없습니다.');
    }
    return column;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateColumnDto: UpdateColumnDto,
    @GetUser() user: AuthUser,
  ) {
    const column = await this.columnService.findById(id);
    const member = await this.boardService.getMember(column.boardId, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('컬럼 수정 권한이 없습니다.');
    }
    return this.columnService.update(id, updateColumnDto);
  }

  @Put('board/:boardId/reorder')
  async reorder(
    @Param('boardId') boardId: string,
    @Body('columnIds') columnIds: string[],
    @GetUser() user: AuthUser,
  ) {
    const member = await this.boardService.getMember(boardId, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('컬럼 순서 변경 권한이 없습니다.');
    }
    return this.columnService.reorderColumns(boardId, columnIds);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: AuthUser) {
    const column = await this.columnService.findById(id);
    const member = await this.boardService.getMember(column.boardId, user.id);
    if (!member || !member.canEdit) {
      throw new ForbiddenException('컬럼 삭제 권한이 없습니다.');
    }
    await this.columnService.remove(id);
    return { message: '컬럼이 삭제되었습니다.' };
  }
}
