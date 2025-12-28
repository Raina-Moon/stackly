import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringSchedule } from '../../../entities/recurring-schedule.entity';
import { CreateRecurringScheduleDto } from '../dto/create-recurring-schedule.dto';
import { UpdateRecurringScheduleDto } from '../dto/update-recurring-schedule.dto';

@Injectable()
export class RecurringScheduleService {
  constructor(
    @InjectRepository(RecurringSchedule)
    private recurringScheduleRepository: Repository<RecurringSchedule>,
  ) {}

  async create(createRecurringScheduleDto: CreateRecurringScheduleDto): Promise<RecurringSchedule> {
    const recurring = this.recurringScheduleRepository.create(createRecurringScheduleDto);
    return this.recurringScheduleRepository.save(recurring);
  }

  async findAll(userId: string, skip = 0, take = 10): Promise<{ data: RecurringSchedule[]; total: number }> {
    const [data, total] = await this.recurringScheduleRepository.findAndCount({
      where: { userId, deletedAt: null },
      relations: ['user'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<RecurringSchedule> {
    const recurring = await this.recurringScheduleRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['user'],
    });

    if (!recurring) {
      throw new NotFoundException('반복 일정을 찾을 수 없습니다.');
    }

    return recurring;
  }

  async update(
    id: string,
    updateRecurringScheduleDto: UpdateRecurringScheduleDto,
  ): Promise<RecurringSchedule> {
    const recurring = await this.findById(id);
    Object.assign(recurring, updateRecurringScheduleDto);
    return this.recurringScheduleRepository.save(recurring);
  }

  async remove(id: string): Promise<void> {
    const recurring = await this.findById(id);
    recurring.deletedAt = new Date();
    await this.recurringScheduleRepository.save(recurring);
  }

  async findByUser(userId: string): Promise<RecurringSchedule[]> {
    return this.recurringScheduleRepository.find({
      where: { userId, deletedAt: null },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async calculateOccurrences(
    id: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Date[]> {
    const recurring = await this.findById(id);
    const occurrences: Date[] = [];

    // TODO: This is where WebAssembly optimization will be integrated
    // For now, we'll implement a basic algorithm

    let current = new Date(recurring.startDate);

    while (current <= endDate) {
      if (current >= startDate) {
        // Check if date is not excluded
        const dateStr = current.toISOString().split('T')[0];
        if (!recurring.excludedDates?.includes(dateStr)) {
          occurrences.push(new Date(current));
        }
      }

      // Move to next occurrence
      switch (recurring.frequency) {
        case 'daily':
          current.setDate(current.getDate() + (recurring.interval || 1));
          break;
        case 'weekly':
          current.setDate(current.getDate() + ((recurring.interval || 1) * 7));
          break;
        case 'monthly':
          current.setMonth(current.getMonth() + (recurring.interval || 1));
          break;
        case 'yearly':
          current.setFullYear(current.getFullYear() + (recurring.interval || 1));
          break;
      }

      // Check if we've exceeded end date or occurrences
      if (recurring.endDate && current > recurring.endDate) {
        break;
      }

      if (recurring.occurrences && occurrences.length >= recurring.occurrences) {
        break;
      }
    }

    return occurrences;
  }
}
