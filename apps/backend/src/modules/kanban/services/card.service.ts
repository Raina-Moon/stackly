import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Card } from '../../../entities/card.entity';
import { CreateCardDto } from '../dto/create-card.dto';
import { UpdateCardDto } from '../dto/update-card.dto';
import { CacheInvalidationService } from '../../../cache';
import { BoardService } from './board.service';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly boardService: BoardService,
  ) {}

  private async invalidateBoardCache(boardId: string): Promise<void> {
    const memberIds = await this.boardService.getBoardMemberIds(boardId);
    await this.cacheInvalidation.onBoardContentChange(boardId, memberIds);
  }

  async create(createCardDto: CreateCardDto): Promise<Card> {
    const card = this.cardRepository.create(createCardDto);
    const saved = await this.cardRepository.save(card);
    if (saved.boardId) {
      await this.invalidateBoardCache(saved.boardId);
    }
    return saved;
  }

  async findAll(columnId: string): Promise<Card[]> {
    return this.cardRepository.find({
      where: { columnId },
      relations: ['assignee', 'column', 'board', 'schedules'],
      order: { position: 'ASC' },
    });
  }

  async findById(id: string): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['assignee', 'column', 'board', 'schedules'],
    });

    if (!card) {
      throw new NotFoundException('카드를 찾을 수 없습니다.');
    }

    return card;
  }

  async update(id: string, updateCardDto: UpdateCardDto): Promise<Card> {
    const card = await this.findById(id);
    Object.assign(card, updateCardDto);
    const saved = await this.cardRepository.save(card);
    if (saved.boardId) {
      await this.invalidateBoardCache(saved.boardId);
    }
    return saved;
  }

  async remove(id: string): Promise<void> {
    const card = await this.findById(id);
    const boardId = card.boardId;
    card.deletedAt = new Date();
    await this.cardRepository.save(card);
    if (boardId) {
      await this.invalidateBoardCache(boardId);
    }
  }

  async findByBoard(boardId: string): Promise<Card[]> {
    return this.cardRepository.find({
      where: { boardId, deletedAt: IsNull() },
      relations: ['assignee', 'column'],
      order: { position: 'ASC' },
    });
  }

  async findByAssignee(assigneeId: string): Promise<Card[]> {
    return this.cardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.column', 'column')
      .leftJoinAndSelect('card.board', 'board')
      .where('card.deletedAt IS NULL')
      .andWhere('(:assigneeId = card."assigneeId" OR :assigneeId = ANY(card."assigneeIds"))', {
        assigneeId,
      })
      .orderBy('card.position', 'ASC')
      .getMany();
  }

  async moveCard(cardId: string, columnId: string, position: number): Promise<Card> {
    const before = await this.findById(cardId); // verify exists
    console.log(`[moveCard] BEFORE: card=${cardId}, columnId=${before.columnId} → target columnId=${columnId}, position=${position}`);
    const result = await this.cardRepository.update(cardId, { columnId, position });
    console.log(`[moveCard] UPDATE result: affected=${result.affected}`);
    const after = await this.findById(cardId);
    console.log(`[moveCard] AFTER: card=${cardId}, columnId=${after.columnId}, position=${after.position}`);

    if (after.boardId) {
      await this.invalidateBoardCache(after.boardId);
    }
    return after;
  }

  async reorderCards(columnId: string, cardIds: string[]): Promise<Card[]> {
    const cards = await this.findAll(columnId);

    const updatedCards = cards.map((card) => {
      const newPosition = cardIds.indexOf(card.id);
      card.position = newPosition;
      return card;
    });

    const saved = await this.cardRepository.save(updatedCards);

    if (saved.length > 0 && saved[0].boardId) {
      await this.invalidateBoardCache(saved[0].boardId);
    }
    return saved;
  }
}
