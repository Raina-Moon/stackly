import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Card } from '../../../entities/card.entity';
import { CreateCardDto } from '../dto/create-card.dto';
import { UpdateCardDto } from '../dto/update-card.dto';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
  ) {}

  async create(createCardDto: CreateCardDto): Promise<Card> {
    const card = this.cardRepository.create(createCardDto);
    return this.cardRepository.save(card);
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
    return this.cardRepository.save(card);
  }

  async remove(id: string): Promise<void> {
    const card = await this.findById(id);
    card.deletedAt = new Date();
    await this.cardRepository.save(card);
  }

  async findByBoard(boardId: string): Promise<Card[]> {
    return this.cardRepository.find({
      where: { boardId, deletedAt: IsNull() },
      relations: ['assignee', 'column'],
      order: { position: 'ASC' },
    });
  }

  async findByAssignee(assigneeId: string): Promise<Card[]> {
    return this.cardRepository.find({
      where: { assigneeId, deletedAt: IsNull() },
      relations: ['column', 'board'],
      order: { position: 'ASC' },
    });
  }

  async moveCard(cardId: string, columnId: string, position: number): Promise<Card> {
    const card = await this.findById(cardId);
    card.columnId = columnId;
    card.position = position;
    return this.cardRepository.save(card);
  }

  async reorderCards(columnId: string, cardIds: string[]): Promise<Card[]> {
    const cards = await this.findAll(columnId);

    const updatedCards = cards.map((card) => {
      const newPosition = cardIds.indexOf(card.id);
      card.position = newPosition;
      return card;
    });

    return this.cardRepository.save(updatedCards);
  }
}
