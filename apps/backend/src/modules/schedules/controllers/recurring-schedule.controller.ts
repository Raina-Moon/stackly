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
import { RecurringScheduleService } from '../services/recurring-schedule.service';
import { CreateRecurringScheduleDto } from '../dto/create-recurring-schedule.dto';
import { UpdateRecurringScheduleDto } from '../dto/update-recurring-schedule.dto';

@Controller('recurring-schedules')
export class RecurringScheduleController {
  constructor(private readonly recurringScheduleService: RecurringScheduleService) {}

  @Post()
  async create(@Body() createRecurringScheduleDto: CreateRecurringScheduleDto) {
    return this.recurringScheduleService.create(createRecurringScheduleDto);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.recurringScheduleService.findAll(userId, skip, take);
  }

  @Get(':id/occurrences')
  async calculateOccurrences(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.recurringScheduleService.calculateOccurrences(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.recurringScheduleService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRecurringScheduleDto: UpdateRecurringScheduleDto,
  ) {
    return this.recurringScheduleService.update(id, updateRecurringScheduleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.recurringScheduleService.remove(id);
    return { message: '반복 일정이 삭제되었습니다.' };
  }
}
