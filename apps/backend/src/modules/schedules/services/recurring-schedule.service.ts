import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RecurringSchedule } from '../../../entities/recurring-schedule.entity';
import { CreateRecurringScheduleDto } from '../dto/create-recurring-schedule.dto';
import { UpdateRecurringScheduleDto } from '../dto/update-recurring-schedule.dto';

// Try to load WASM module, fall back to JS if unavailable
let wasmModule: { calculate_occurrences: (input: unknown, start: string, end: string) => { dates: string[] } } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  wasmModule = require('@stackly/wasm');
} catch {
  // WASM not available, will use JS fallback
}

@Injectable()
export class RecurringScheduleService {
  private readonly logger = new Logger(RecurringScheduleService.name);

  constructor(
    @InjectRepository(RecurringSchedule)
    private recurringScheduleRepository: Repository<RecurringSchedule>,
  ) {
    if (wasmModule) {
      this.logger.log('WASM module loaded for recurring schedule calculations');
    } else {
      this.logger.warn('WASM module not available, using JS fallback');
    }
  }

  async create(createRecurringScheduleDto: CreateRecurringScheduleDto): Promise<RecurringSchedule> {
    const recurring = this.recurringScheduleRepository.create(createRecurringScheduleDto);
    return this.recurringScheduleRepository.save(recurring);
  }

  async findAll(userId: string, skip = 0, take = 10): Promise<{ data: RecurringSchedule[]; total: number }> {
    const [data, total] = await this.recurringScheduleRepository.findAndCount({
      where: { userId, deletedAt: IsNull() },
      relations: ['user'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<RecurringSchedule> {
    const recurring = await this.recurringScheduleRepository.findOne({
      where: { id, deletedAt: IsNull() },
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
      where: { userId, deletedAt: IsNull() },
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

    const rangeStart = startDate.toISOString().split('T')[0];
    const rangeEnd = endDate.toISOString().split('T')[0];

    // Use WASM if available
    if (wasmModule) {
      const input = {
        frequency: recurring.frequency,
        interval: recurring.interval || 1,
        start_date: new Date(recurring.startDate).toISOString().split('T')[0],
        end_date: recurring.endDate
          ? new Date(recurring.endDate).toISOString().split('T')[0]
          : null,
        max_occurrences: recurring.occurrences ?? null,
        excluded_dates: recurring.excludedDates ?? [],
        days_of_week: recurring.daysOfWeek ?? [],
        day_of_month: recurring.dayOfMonth ?? null,
      };

      const result = wasmModule.calculate_occurrences(input, rangeStart, rangeEnd);
      return (result.dates as string[]).map((d: string) => new Date(d));
    }

    // JS fallback
    return this.calculateOccurrencesJS(recurring, startDate, endDate);
  }

  private calculateOccurrencesJS(
    recurring: RecurringSchedule,
    startDate: Date,
    endDate: Date,
  ): Date[] {
    const occurrences: Date[] = [];
    let current = new Date(recurring.startDate);

    while (current <= endDate) {
      if (current >= startDate) {
        const dateStr = current.toISOString().split('T')[0];
        if (!recurring.excludedDates?.includes(dateStr)) {
          occurrences.push(new Date(current));
        }
      }

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
