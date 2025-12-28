import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ColumnService } from '../services/column.service';
import { CreateColumnDto } from '../dto/create-column.dto';
import { UpdateColumnDto } from '../dto/update-column.dto';

@Controller('columns')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  @Post()
  async create(@Body() createColumnDto: CreateColumnDto) {
    return this.columnService.create(createColumnDto);
  }

  @Get('board/:boardId')
  async findByBoard(@Param('boardId') boardId: string) {
    return this.columnService.findByBoard(boardId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.columnService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateColumnDto: UpdateColumnDto) {
    return this.columnService.update(id, updateColumnDto);
  }

  @Put('board/:boardId/reorder')
  async reorder(@Param('boardId') boardId: string, @Body('columnIds') columnIds: string[]) {
    return this.columnService.reorderColumns(boardId, columnIds);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.columnService.remove(id);
    return { message: '컬럼이 삭제되었습니다.' };
  }
}
