import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Column } from '../../../entities/column.entity';
import { CreateColumnDto } from '../dto/create-column.dto';
import { UpdateColumnDto } from '../dto/update-column.dto';

@Injectable()
export class ColumnService {
  constructor(
    @InjectRepository(Column)
    private columnRepository: Repository<Column>,
  ) {}

  async create(createColumnDto: CreateColumnDto): Promise<Column> {
    const column = this.columnRepository.create(createColumnDto);
    return this.columnRepository.save(column);
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
    return this.columnRepository.save(column);
  }

  async remove(id: string): Promise<void> {
    const column = await this.findById(id);
    await this.columnRepository.remove(column);
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

    return this.columnRepository.save(updatedColumns);
  }
}
