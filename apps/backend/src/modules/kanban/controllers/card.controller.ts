import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CardService } from '../services/card.service';
import { CreateCardDto } from '../dto/create-card.dto';
import { UpdateCardDto } from '../dto/update-card.dto';

@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  async create(@Body() createCardDto: CreateCardDto) {
    return this.cardService.create(createCardDto);
  }

  @Get('column/:columnId')
  async findByColumn(@Param('columnId') columnId: string) {
    return this.cardService.findAll(columnId);
  }

  @Get('board/:boardId')
  async findByBoard(@Param('boardId') boardId: string) {
    return this.cardService.findByBoard(boardId);
  }

  @Get('assignee/:assigneeId')
  async findByAssignee(@Param('assigneeId') assigneeId: string) {
    return this.cardService.findByAssignee(assigneeId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.cardService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCardDto: UpdateCardDto) {
    return this.cardService.update(id, updateCardDto);
  }

  @Put(':id/move')
  async moveCard(
    @Param('id') id: string,
    @Body() { columnId, position }: { columnId: string; position: number },
  ) {
    return this.cardService.moveCard(id, columnId, position);
  }

  @Put('column/:columnId/reorder')
  async reorder(@Param('columnId') columnId: string, @Body('cardIds') cardIds: string[]) {
    return this.cardService.reorderCards(columnId, cardIds);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.cardService.remove(id);
    return { message: '카드가 삭제되었습니다.' };
  }
}
