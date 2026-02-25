import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Column } from '../../../entities/column.entity';
import { CreateColumnDto } from '../dto/create-column.dto';
import { UpdateColumnDto } from '../dto/update-column.dto';
import { CacheInvalidationService } from '../../../cache';
import { BoardService } from './board.service';

@Injectable()
export class ColumnService {
  constructor(
    @InjectRepository(Column)
    private columnRepository: Repository<Column>,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly boardService: BoardService,
  ) {}

  private async invalidateBoardCache(boardId: string): Promise<void> {
    const memberIds = await this.boardService.getBoardMemberIds(boardId);
    await this.cacheInvalidation.onBoardContentChange(boardId, memberIds);
  }

  async create(createColumnDto: CreateColumnDto): Promise<Column> {
    const column = this.columnRepository.create(createColumnDto);
    const saved = await this.columnRepository.save(column);
    if (saved.boardId) {
      await this.invalidateBoardCache(saved.boardId);
    }
    return saved;
  }

  async findAll(boardId: string): Promise<Column[]> {
    return this.columnRepository.find({
      where: { boardId },
      relations: ['cards', 'board'],
      order: { position: 'ASC' },
    });
  }

  async findById(id: string): Promise<Column> {
    const column = await this.columnRepository.findOne({
      where: { id },
      relations: ['cards', 'board'],
    });

    if (!column) {
      throw new NotFoundException('컬럼을 찾을 수 없습니다.');
    }

    return column;
  }

  async update(id: string, updateColumnDto: UpdateColumnDto): Promise<Column> {
    const column = await this.findById(id);
    Object.assign(column, updateColumnDto);
    const saved = await this.columnRepository.save(column);
    if (saved.boardId) {
      await this.invalidateBoardCache(saved.boardId);
    }
    return saved;
  }

  async remove(id: string): Promise<void> {
    const column = await this.findById(id);
    const boardId = column.boardId;
    await this.columnRepository.remove(column);
    if (boardId) {
      await this.invalidateBoardCache(boardId);
    }
  }

  async findByBoard(boardId: string): Promise<Column[]> {
    return this.columnRepository.find({
      where: { boardId },
      relations: ['cards'],
      order: { position: 'ASC' },
    });
  }

  async reorderColumns(boardId: string, columnIds: string[]): Promise<Column[]> {
    const columns = await this.findByBoard(boardId);

    const updatedColumns = columns.map((col) => {
      const newPosition = columnIds.indexOf(col.id);
      col.position = newPosition;
      return col;
    });

    const saved = await this.columnRepository.save(updatedColumns);
    await this.invalidateBoardCache(boardId);
    return saved;
  }
}
