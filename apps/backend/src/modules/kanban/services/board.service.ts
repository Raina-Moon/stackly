import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from '../../../entities/board.entity';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
  ) {}

  async create(createBoardDto: CreateBoardDto, ownerId: string): Promise<Board> {
    const board = this.boardRepository.create({
      ...createBoardDto,
      ownerId,
    });
    return this.boardRepository.save(board);
  }

  async findAll(skip = 0, take = 10, ownerId?: string): Promise<{ data: Board[]; total: number }> {
    const query = this.boardRepository.createQueryBuilder('board');

    if (ownerId) {
      query.where('board.ownerId = :ownerId', { ownerId });
    }

    query.where('board.deletedAt IS NULL');
    query.orderBy('board.createdAt', 'DESC');
    query.skip(skip).take(take);
    query.leftJoinAndSelect('board.columns', 'columns');
    query.leftJoinAndSelect('board.owner', 'owner', 'owner.deletedAt IS NULL');

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<Board> {
    const board = await this.boardRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['columns', 'cards', 'members', 'owner'],
    });

    if (!board) {
      throw new NotFoundException('보드를 찾을 수 없습니다.');
    }

    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto): Promise<Board> {
    const board = await this.findById(id);
    Object.assign(board, updateBoardDto);
    return this.boardRepository.save(board);
  }

  async remove(id: string): Promise<void> {
    const board = await this.findById(id);
    board.deletedAt = new Date();
    await this.boardRepository.save(board);
  }

  async findByOwner(ownerId: string): Promise<Board[]> {
    return this.boardRepository.find({
      where: { ownerId, deletedAt: null },
      relations: ['columns', 'owner'],
      order: { createdAt: 'DESC' },
    });
  }
}
