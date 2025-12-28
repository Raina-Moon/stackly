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
import { ScheduleService } from '../services/schedule.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';

@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('skip') skip = 0,
    @Query('take') take = 10,
  ) {
    return this.scheduleService.findAll(userId, skip, take);
  }

  @Get('user/:userId/upcoming')
  async findUpcoming(
    @Param('userId') userId: string,
    @Query('days') days = 7,
  ) {
    return this.scheduleService.findUpcoming(userId, parseInt(String(days)));
  }

  @Get('user/:userId/range')
  async findByDateRange(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.scheduleService.findByDateRange(
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('card/:cardId')
  async findByCard(@Param('cardId') cardId: string) {
    return this.scheduleService.findByCard(cardId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.scheduleService.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.scheduleService.remove(id);
    return { message: '일정이 삭제되었습니다.' };
  }
}
