import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Schedule } from '../../../entities/schedule.entity';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const schedule = this.scheduleRepository.create(createScheduleDto);
    return this.scheduleRepository.save(schedule);
  }

  async findAll(userId: string, skip = 0, take = 10): Promise<{ data: Schedule[]; total: number }> {
    const [data, total] = await this.scheduleRepository.findAndCount({
      where: { userId, deletedAt: null },
      relations: ['user', 'card'],
      skip,
      take,
      order: { startTime: 'ASC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['user', 'card'],
    });

    if (!schedule) {
      throw new NotFoundException('일정을 찾을 수 없습니다.');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findById(id);
    Object.assign(schedule, updateScheduleDto);
    return this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findById(id);
    schedule.deletedAt = new Date();
    await this.scheduleRepository.save(schedule);
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: {
        userId,
        deletedAt: null,
        startTime: Between(startDate, endDate),
      },
      relations: ['user', 'card'],
      order: { startTime: 'ASC' },
    });
  }

  async findByCard(cardId: string): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: { cardId, deletedAt: null },
      relations: ['user', 'card'],
      order: { startTime: 'ASC' },
    });
  }

  async findUpcoming(userId: string, days = 7): Promise<Schedule[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.findByDateRange(userId, now, futureDate);
  }
}
