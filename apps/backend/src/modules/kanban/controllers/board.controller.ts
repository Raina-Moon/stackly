import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { BoardService } from '../services/board.service';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';

@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post()
  async create(@Body() createBoardDto: CreateBoardDto) {
    // TODO: Extract userId from JWT token (authenticated user)
    const ownerId = 'default-user-id'; // Placeholder
    return this.boardService.create(createBoardDto, ownerId);
  }

  @Get()
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 10,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.boardService.findAll(skip, take, ownerId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.boardService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardService.update(id, updateBoardDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.boardService.remove(id);
    return { message: '보드가 삭제되었습니다.' };
  }

  @Get('owner/:ownerId')
  async findByOwner(@Param('ownerId') ownerId: string) {
    return this.boardService.findByOwner(ownerId);
  }
}
